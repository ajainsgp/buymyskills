/* Express API with pluggable persistence: filesystem (default) or MySQL (set PERSISTENCE=mysql) */

if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '/etc/buymyskills/app.env' });
} else {
  require('dotenv').config();
}
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const USE_DB =
  String(process.env.PERSISTENCE || "").toLowerCase() === "mysql" ||
  String(process.env.USE_DB || "").toLowerCase() === "true";

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@buymyskills.local";

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;

// File-based storage locations (used when not using DB)
const DATA_DIR = path.resolve(__dirname, "../data");
const USERS_FILE = path.resolve(DATA_DIR, "users.json");
const ADDRESSES_FILE = path.resolve(DATA_DIR, "addresses.json");
const PHOTOS_FILE = path.resolve(DATA_DIR, "photos.json");
const CATEGORIES_FILE = path.resolve(DATA_DIR, "categories.json");
const COUNTRIES_FILE = path.resolve(DATA_DIR, "countries.json");
const LANDING_PAGE_CARDS_FILE = path.resolve(DATA_DIR, "landingPageCards.json");

// Import landing page data for filesystem fallback
const landingPageData = require("../src/data/landingPageData.json");


// Optional MySQL DAL
const db = USE_DB ? require("./db") : null;

app.use(express.json({ limit: "1mb" }));

// Trust proxy (for X-Forwarded-Proto from Nginx/LB)
app.set("trust proxy", 1);

// Optional HTTP->HTTPS redirect behind proxy (enable with FORCE_HTTPS=true)
if (String(process.env.FORCE_HTTPS || "").toLowerCase() === "true") {
  app.use((req, res, next) => {
    const xfProto = req.get("x-forwarded-proto");
    if (xfProto && xfProto !== "https") {
      return res.redirect(301, "https://" + req.get("host") + req.originalUrl);
    }
    next();
  });
}

// Security headers and hardening
app.use(helmet());
app.use(helmet.frameguard({ action: "deny" })); // X-Frame-Options: DENY
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));
if (String(process.env.ENABLE_HSTS || "").toLowerCase() === "true") {
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
}
// Strict CSP: allow images from self and data: (for avatars), scripts/styles default to self
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:"],
    },
  }),
);

// Response compression
app.use(compression());

// Access logging (avoid logging bodies/PII)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// CORS (lock to FRONTEND_ORIGIN if set; otherwise permissive for dev)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
const corsOptions = FRONTEND_ORIGIN
  ? { origin: [FRONTEND_ORIGIN], credentials: false, optionsSuccessStatus: 204 }
  : { origin: true, credentials: false, optionsSuccessStatus: 204 };
app.use(cors(corsOptions));
app.options(/^\/api\/.*$/, cors(corsOptions));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);
app.use(["/api/login", "/api/password/change", "/api/password/reset"], authLimiter);

// ========== Common Helpers ==========

function normalizeBase64DataUrl(input) {
  if (!input) return { base64: "", contentType: "" };
  const m = String(input).match(/^data:(.+);base64,(.*)$/);
  if (m) return { contentType: m[1], base64: m[2] };
  return { base64: input, contentType: "" };
}

function sanitizeUser(user) {
  const { password, passwordHash, password_hash, ...rest } = user || {};
  return rest;
}

function makeId() {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

// Password hashing (bcrypt primary; scrypt legacy fallback supported for verify)
async function hashPassword(password) {
  return await bcrypt.hash(String(password), 12);
}
async function verifyPassword(password, stored) {
  try {
    if (!stored) return false;
    // bcrypt hashed
    if (stored.startsWith && stored.startsWith("$2")) {
      return await bcrypt.compare(String(password), stored);
    }
    // legacy scrypt(SHA-256(plain))
    if (stored.startsWith && stored.startsWith("scrypt$")) {
      const parts = stored.split("$");
      const saltHex = parts[1];
      const hashHex = parts[2];
      if (!saltHex || !hashHex) return false;
      const salt = Buffer.from(saltHex, "hex");
      const derived = crypto.scryptSync(sha256Hex(String(password)), salt, 64);
      const storedHash = Buffer.from(hashHex, "hex");
      if (derived.length !== storedHash.length) return false;
      return crypto.timingSafeEqual(derived, storedHash);
    }
    // last resort (plaintext legacy)
    return String(stored) === String(password);
  } catch {
    return false;
  }
}

// Photos constraints
const MAX_IMAGE_BYTES = 150 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/gif"]);

// Email functions
async function sendConfirmationEmail(email, confirmationToken, firstName) {
  const confirmationUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/confirm-email?token=${confirmationToken}`;

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Confirm Your Email - Buy My Skills',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Buy My Skills, ${firstName}!</h2>
        <p>Thank you for registering. Please confirm your email address by clicking the link below:</p>
        <a href="${confirmationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Confirm Email</a>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p>${confirmationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't register for Buy My Skills, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

function generateConfirmationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ========== Filesystem Implementation (default) ==========

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2), "utf8");
  }
}
async function readUsersFS() {
  await ensureDataFile();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.users) ? parsed : { users: [] };
  } catch {
    const fallback = { users: [] };
    await fs.writeFile(USERS_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}
async function writeUsersFS(data) {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function ensureAddressesFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(ADDRESSES_FILE);
  } catch {
    await fs.writeFile(ADDRESSES_FILE, JSON.stringify({ addresses: [] }, null, 2), "utf8");
  }
}
async function readAddressesFS() {
  await ensureAddressesFile();
  const raw = await fs.readFile(ADDRESSES_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.addresses) ? parsed : { addresses: [] };
  } catch {
    const fallback = { addresses: [] };
    await fs.writeFile(ADDRESSES_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}
async function writeAddressesFS(data) {
  await fs.writeFile(ADDRESSES_FILE, JSON.stringify(data, null, 2), "utf8");
}
async function setAddressForUserFS(userId, newAddress) {
  const store = await readAddressesFS();
  const now = new Date().toISOString();
  const idx = store.addresses.findIndex((a) => a.userId === userId);
  if (idx === -1) {
    store.addresses.push({
      userId,
      current: {
        addressLine1: newAddress.addressLine1 || "",
        addressLine2: newAddress.addressLine2 || "",
        city: newAddress.city || "",
        state: newAddress.state || "",
        postcode: newAddress.postcode || "",
        country: newAddress.country || "",
        from: now,
      },
      history: [],
      updatedAt: now,
    });
  } else {
    const rec = store.addresses[idx];
    const fields = ["addressLine1", "addressLine2", "city", "state", "postcode", "country"];
    const old = rec.current || {};
    const changed =
      fields.some((k) => (old[k] || "") !== ((newAddress && newAddress[k]) || "")) || !old.from;
    if (changed) {
      if (old && Object.keys(old).length) {
        const { from, ...restOld } = old;
        store.addresses[idx].history.push({ ...restOld, from: from || now, to: now });
      }
      store.addresses[idx].current = {
        addressLine1: newAddress.addressLine1 || "",
        addressLine2: newAddress.addressLine2 || "",
        city: newAddress.city || "",
        state: newAddress.state || "",
        postcode: newAddress.postcode || "",
        country: newAddress.country || "",
        from: now,
      };
      store.addresses[idx].updatedAt = now;
    }
  }
  await writeAddressesFS(store);
}
async function getAddressForUserFS(userId) {
  const store = await readAddressesFS();
  const rec = store.addresses.find((a) => a.userId === userId);
  return rec ? rec.current : null;
}

async function ensurePhotosFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(PHOTOS_FILE);
  } catch {
    await fs.writeFile(PHOTOS_FILE, JSON.stringify({ photos: [] }, null, 2), "utf8");
  }
}
async function readPhotosFS() {
  await ensurePhotosFile();
  const raw = await fs.readFile(PHOTOS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.photos) ? parsed : { photos: [] };
  } catch {
    const fallback = { photos: [] };
    await fs.writeFile(PHOTOS_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}
async function writePhotosFS(data) {
  await fs.writeFile(PHOTOS_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function ensureCategoriesFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(CATEGORIES_FILE);
  } catch {
    const defaults = [
      "Software Engineer",
      "Frontend Engineer",
      "Backend Engineer",
      "Fullstack Engineer",
      "Data Analyst",
      "Data Scientist",
      "DevOps Engineer",
      "QA Engineer",
      "Product Manager",
      "UI/UX Designer",
      "Project Manager",
    ];
    const now = new Date().toISOString();
    const categories = defaults.map((name, idx) => ({
      id: `cat_${Date.now().toString(36)}_${idx}`,
      name,
      enabled: 1,
      createdAt: now,
    }));
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify({ categories }, null, 2), "utf8");
  }
}
async function readAllCategoriesFS() {
  await ensureCategoriesFile();
  const raw = await fs.readFile(CATEGORIES_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    let arr = Array.isArray(parsed.categories) ? parsed.categories : [];
    // migrate from simple string list to object list if needed
    if (arr.length && typeof arr[0] === "string") {
      const now = new Date().toISOString();
      arr = arr.map((name, idx) => ({
        id: `cat_${Date.now().toString(36)}_${idx}`,
        name,
        enabled: 1,
        sortOrder: idx,
        createdAt: now,
      }));
      await fs.writeFile(CATEGORIES_FILE, JSON.stringify({ categories: arr }, null, 2), "utf8");
    }
    return arr;
  } catch {
    return [];
  }
}
async function writeAllCategoriesFS(categories) {
  await fs.writeFile(CATEGORIES_FILE, JSON.stringify({ categories }, null, 2), "utf8");
}
async function readCategoriesFS() {
  const all = await readAllCategoriesFS();
  return all
    .filter((c) => c && (c.enabled === 1 || c.enabled === true))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .map((c) => c.name);
}

async function ensureLandingPageCardsFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(LANDING_PAGE_CARDS_FILE);
  } catch {
    // Use landing page data from the JSON file as defaults
    const now = new Date().toISOString();
    const landingPageCards = [];

    // Add categories cards
    const categoriesCards = landingPageData.landingPage.sections.categories.cards;
    categoriesCards.forEach((card, idx) => {
      landingPageCards.push({
        id: `card_${Date.now().toString(36)}_${idx}_categories`,
        sectionName: "categories",
        icon: card.icon,
        icon_color: card.icon_color || "#042C76",
        cardTitle: card.cardTitle,
        cardText: card.cardText || "",
        enabled: 1,
        createdAt: now,
      });
    });

    // Add skills cards
    const skillsCards = landingPageData.landingPage.sections.skills.cards;
    skillsCards.forEach((card, idx) => {
      landingPageCards.push({
        id: `card_${Date.now().toString(36)}_${idx + 10}_skills`,
        sectionName: "skills",
        icon: card.icon,
        icon_color: card.icon_color || "#042C76",
        cardTitle: card.cardTitle,
        cardText: card.cardText || "",
        enabled: 1,
        createdAt: now,
      });
    });

    // Add features cards
    const featuresCards = landingPageData.landingPage.sections.features.cards;
    featuresCards.forEach((card, idx) => {
      landingPageCards.push({
        id: `card_${Date.now().toString(36)}_${idx + 20}_features`,
        sectionName: "features",
        icon: card.icon,
        icon_color: card.icon_color || "#042C76",
        cardTitle: card.cardTitle,
        cardText: card.cardText || "",
        enabled: 1,
        createdAt: now,
      });
    });

    await fs.writeFile(LANDING_PAGE_CARDS_FILE, JSON.stringify({ cards: landingPageCards }, null, 2), "utf8");
  }
}

async function readAllLandingPageCardsFS(sectionName) {
  await ensureLandingPageCardsFile();
  const raw = await fs.readFile(LANDING_PAGE_CARDS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    let cards = Array.isArray(parsed.cards) ? parsed.cards : [];
    if (sectionName) {
      cards = cards.filter(card => card.sectionName === sectionName);
    }
    return cards;
  } catch {
    return [];
  }
}

async function writeAllLandingPageCardsFS(cards) {
  await fs.writeFile(LANDING_PAGE_CARDS_FILE, JSON.stringify({ cards }, null, 2), "utf8");
}

async function ensureCountriesFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(COUNTRIES_FILE);
  } catch {
    // Use countries from the JSON file as defaults
    try {
      const countriesJson = path.resolve(DATA_DIR, "countries.json");
      if (existsSync(countriesJson)) {
        const raw = await fs.readFile(countriesJson, "utf8");
        const data = JSON.parse(raw);
        if (data && Array.isArray(data)) {
          const now = new Date().toISOString();
          const countries = data.map((c, idx) => ({
            id: `country_${Date.now().toString(36)}_${idx}`,
            name: c.name || "",
            code: c.code || "",
            enabled: c.enabled === "Y" ? 1 : 0,
            createdAt: now,
          }));
          await fs.writeFile(COUNTRIES_FILE, JSON.stringify({ countries }, null, 2), "utf8");
        } else {
          // Fallback empty
          await fs.writeFile(COUNTRIES_FILE, JSON.stringify({ countries: [] }, null, 2), "utf8");
        }
      } else {
        await fs.writeFile(COUNTRIES_FILE, JSON.stringify({ countries: [] }, null, 2), "utf8");
      }
    } catch {
      await fs.writeFile(COUNTRIES_FILE, JSON.stringify({ countries: [] }, null, 2), "utf8");
    }
  }
}
async function readAllCountriesFS() {
  await ensureCountriesFile();
  const raw = await fs.readFile(COUNTRIES_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    let countries = [];
    if (Array.isArray(parsed)) {
      // Handle legacy array format
      countries = parsed;
    } else if (parsed && Array.isArray(parsed.countries)) {
      // Handle object format
      countries = parsed.countries;
    }
    // Normalize enabled field for compatibility
    return countries.map(c => ({
      ...c,
      enabled: c.enabled === 1 || c.enabled === true || c.enabled === "Y" ? 1 : 0,
      phoneCode: c.phoneCode || ""
    }));
  } catch {
    return [];
  }
}
async function writeAllCountriesFS(countries) {
  await fs.writeFile(COUNTRIES_FILE, JSON.stringify({ countries }, null, 2), "utf8");
}
async function readCountriesFS() {
  const all = await readAllCountriesFS();
  return all
    .filter((c) => c && (c.enabled === 1 || c.enabled === true))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .map((c) => ({ name: c.name, code: c.code }));
}



async function ensureHashedPasswordsOnStartFS() {
  const store = await readUsersFS();
  let changed = false;
  for (const u of store.users) {
    if (u && !u.passwordHash && typeof u.password === "string" && u.password) {
      u.passwordHash = await hashPassword(u.password);
      delete u.password;
      changed = true;
    }
    if (u && u.password && u.passwordHash) {
      delete u.password;
      changed = true;
    }
    if (u && u.address) {
      delete u.address;
      changed = true;
    }
  }
  if (changed) await writeUsersFS(store);
}

// ========== MySQL Helpers (when USE_DB) ==========

function mapDbUserRowToApiUser(row) {
  if (!row) return null;
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at || new Date().toISOString();
  const rt =
    row.role_type
      ? String(row.role_type).toLowerCase()
      : (String(row.email_id || "").toLowerCase() === String(ADMIN_EMAIL).toLowerCase()
          ? "administrator"
          : "user");
  return {
    id: row.id,
    name: row.name || "",
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    nickName: row.nick_name || "",
    gender: row.gender || "",
    mobile: row.mobile || "",
    emailId: row.email_id || "",
    secondaryEmail: row.secondary_email || row.email_id || "",
    summary: row.summary || "",
    workPreference: row.work_preference || "",
    traveling: row.traveling || "",
    availability: row.availability || "",
    roleType: rt,
    createdAt,
  };
}

 // ========== Routes ==========

/**
 * GET /api/categories
 * - DB mode: list active categories from DB
 * - FS mode: list from categories.json (created if missing) with sensible defaults
 */
app.get("/api/categories", async (_req, res) => {
  try {
    if (USE_DB) {
      const names = await db.listCategories();
      return res.json({ categories: names });
    }
    const names = await readCategoriesFS();
    return res.json({ categories: names });
  } catch (err) {
    console.error("Categories error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/countries
 * - DB mode: list active countries from DB
 * - FS mode: list from countries.json (created if missing) with sensible defaults
 */
app.get("/api/countries", async (_req, res) => {
  try {
    if (USE_DB) {
      const countries = await db.listCountries();
      return res.json({ countries });
    }
    const countries = await readCountriesFS();
    return res.json({ countries });
  } catch (err) {
    console.error("Countries error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/countries-with-codes
 * - DB mode: list active countries with phone codes from DB
 * - FS mode: list from countries.json with phone codes
 */
app.get("/api/countries-with-codes", async (_req, res) => {
  try {
    if (USE_DB) {
      const countries = await db.listCountries();
      return res.json({ countries });
    }
    const all = await readAllCountriesFS();
    const countries = all
      .filter((c) => c && (c.enabled === 1 || c.enabled === true || c.enabled === "Y"))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .map((c) => ({ name: c.name, code: c.code, phoneCode: c.phoneCode }));
    return res.json({ countries });
  } catch (err) {
    console.error("Countries with codes error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/geolocate
 * - Returns user's country based on IP address
 */
app.get("/api/geolocate", async (req, res) => {
  try {
    // Get client IP address
    const clientIP = req.ip ||
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     req.headers['x-forwarded-for']?.split(',')[0] ||
                     req.headers['x-real-ip'];

    if (!clientIP || clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
      // Local development, return empty result
      return res.json({ country: null, ip: clientIP });
    }

    // Use ipapi.co for geolocation (free tier, 1000 requests/day)
    const geoRes = await fetch(`https://ipapi.co/${clientIP}/json/`, {
      timeout: 5000, // 5 second timeout
    });

    if (!geoRes.ok) {
      return res.json({ country: null, ip: clientIP, error: 'Geolocation service unavailable' });
    }

    const geoData = await geoRes.json();

    if (geoData.country_name) {
      return res.json({
        country: geoData.country_name,
        countryCode: geoData.country_code,
        ip: clientIP
      });
    }

    return res.json({ country: null, ip: clientIP });
  } catch (err) {
    console.error("Geolocation error:", err);
    return res.json({ country: null, error: err.message });
  }
});



/**
 * Admin: Categories CRUD
 * - GET    /api/admin/categories
 * - POST   /api/admin/categories         { name, enabled?, sortOrder? }
 * - PUT    /api/admin/categories/:id     { name?, enabled?, sortOrder? }
 * - DELETE /api/admin/categories/:id
 * Secured via x-admin-key header matching ADMIN_API_KEY (dev hardening).
 */
app.get("/api/admin/categories", async (_req, res) => {
  try {
    if (USE_DB) {
      const rows = await db.listAllCategories();
      return res.json({ categories: rows });
    }
    const cats = await readAllCategoriesFS();
    return res.json({ categories: cats });
  } catch (err) {
    console.error("Admin list categories error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/categories", async (req, res) => {
  try {
    const { name, enabled = true } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (USE_DB) {
      await db.createCategory({ name: String(name).trim(), enabled: !!enabled });
      return res.status(201).json({ ok: true });
    }
    const cats = await readAllCategoriesFS();
    const now = new Date().toISOString();
    const newCat = {
      id: `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: String(name).trim(),
      enabled: enabled ? 1 : 0,
      createdAt: now,
    };
    cats.push(newCat);
    await writeAllCategoriesFS(cats);
    return res.status(201).json({ category: newCat });
  } catch (err) {
    console.error("Admin create category error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/admin/categories/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    const patch = req.body || {};
    if (USE_DB) {
      await db.updateCategory(id, {
        name: patch.name,
        enabled: patch.enabled,
      });
      return res.json({ ok: true });
    }
    const cats = await readAllCategoriesFS();
    const idx = cats.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const cur = cats[idx];
    const updated = { ...cur };
    if (Object.prototype.hasOwnProperty.call(patch, "name")) updated.name = String(patch.name || "");
    if (Object.prototype.hasOwnProperty.call(patch, "enabled"))
      updated.enabled = patch.enabled ? 1 : 0;
    cats[idx] = updated;
    await writeAllCategoriesFS(cats);
    return res.json({ category: updated });
  } catch (err) {
    console.error("Admin update category error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/admin/categories/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    if (USE_DB) {
      await db.deleteCategory(id);
      return res.json({ ok: true });
    }
    const cats = await readAllCategoriesFS();
    const idx = cats.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    cats.splice(idx, 1);
    await writeAllCategoriesFS(cats);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Admin delete category error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Admin: Countries CRUD
 * - GET    /api/admin/countries
 * - POST   /api/admin/countries         { name, code, enabled? }
 * - PUT    /api/admin/countries/:id     { name?, code?, enabled? }
 * - DELETE /api/admin/countries/:id
 */
app.get("/api/admin/countries", async (_req, res) => {
  try {
    if (USE_DB) {
      const rows = await db.listAllCountries();
      return res.json({ countries: rows });
    }
    const countries = await readAllCountriesFS();
    return res.json({ countries });
  } catch (err) {
    console.error("Admin list countries error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/countries", async (req, res) => {
  try {
    const { name, code, phoneCode = '', enabled = true } = req.body || {};
    if (!name || !String(name).trim() || !code || !String(code).trim()) {
      return res.status(400).json({ error: "name and code are required" });
    }
    if (USE_DB) {
      await db.createCountry({ name: String(name).trim(), code: String(code).trim().toUpperCase(), phoneCode: String(phoneCode).trim(), enabled: !!enabled });
      return res.status(201).json({ ok: true });
    }
    const countries = await readAllCountriesFS();
    const now = new Date().toISOString();
    const newCountry = {
      id: `country_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      phoneCode: String(phoneCode).trim(),
      enabled: enabled ? 1 : 0,
      createdAt: now,
    };
    countries.push(newCountry);
    await writeAllCountriesFS(countries);
    return res.status(201).json({ country: newCountry });
  } catch (err) {
    console.error("Admin create country error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/admin/countries/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    const patch = req.body || {};
    if (USE_DB) {
      await db.updateCountry(id, {
        name: patch.name,
        code: patch.code,
        phoneCode: patch.phoneCode,
        enabled: patch.enabled,
      });
      return res.json({ ok: true });
    }
    const countries = await readAllCountriesFS();
    const idx = countries.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const cur = countries[idx];
    const updated = { ...cur };
    if (Object.prototype.hasOwnProperty.call(patch, "name")) updated.name = String(patch.name || "");
    if (Object.prototype.hasOwnProperty.call(patch, "code")) updated.code = String(patch.code || "").toUpperCase();
    if (Object.prototype.hasOwnProperty.call(patch, "phoneCode")) updated.phoneCode = String(patch.phoneCode || "");
    if (Object.prototype.hasOwnProperty.call(patch, "enabled"))
      updated.enabled = patch.enabled ? 1 : 0;
    countries[idx] = updated;
    await writeAllCountriesFS(countries);
    return res.json({ country: updated });
  } catch (err) {
    console.error("Admin update country error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/admin/countries/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    if (USE_DB) {
      await db.deleteCountry(id);
      return res.json({ ok: true });
    }
    const countries = await readAllCountriesFS();
    const idx = countries.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    countries.splice(idx, 1);
    await writeAllCountriesFS(countries);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Admin delete country error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Admin: Landing Page Cards CRUD
 * - GET    /api/admin/landing-page-cards?section=categories
 * - POST   /api/admin/landing-page-cards         { sectionName?, icon, icon_color?, cardTitle, cardText?, enabled? }
 * - PUT    /api/admin/landing-page-cards/:id     { sectionName?, icon?, icon_color?, cardTitle?, cardText?, enabled? }
 * - DELETE /api/admin/landing-page-cards/:id
 */
app.get("/api/admin/landing-page-cards", async (req, res) => {
  try {
    const { section } = req.query || {};
    if (USE_DB) {
      const rows = await db.listAllLandingPageCards(section);
      return res.json({ cards: rows });
    }
    // For filesystem mode, load from landingPageCards.json
    const cards = await readAllLandingPageCardsFS(section);
    return res.json({ cards });
  } catch (err) {
    console.error("Admin list landing page cards error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/landing-page-cards", async (req, res) => {
  try {
    const { sectionName = 'categories', icon, icon_color = '#042C76', cardTitle, cardText = '', enabled = true } = req.body || {};
    if (!cardTitle || !String(cardTitle).trim() || !icon || !String(icon).trim()) {
      return res.status(400).json({ error: "cardTitle and icon are required" });
    }
    if (USE_DB) {
      await db.createLandingPageCard({
        sectionName: String(sectionName).trim(),
        icon: String(icon).trim(),
        icon_color: String(icon_color).trim(),
        cardTitle: String(cardTitle).trim(),
        cardText: String(cardText).trim(),
        enabled: !!enabled
      });
      return res.status(201).json({ ok: true });
    }
    // For filesystem mode, add to landingPageCards.json
    const cards = await readAllLandingPageCardsFS();
    const now = new Date().toISOString();
    const newCard = {
      id: `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      sectionName: String(sectionName).trim(),
      icon: String(icon).trim(),
      icon_color: String(icon_color).trim(),
      cardTitle: String(cardTitle).trim(),
      cardText: String(cardText).trim(),
      enabled: enabled ? 1 : 0,
      createdAt: now,
    };
    cards.push(newCard);
    await writeAllLandingPageCardsFS(cards);
    return res.status(201).json({ card: newCard });
  } catch (err) {
    console.error("Admin create landing page card error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/admin/landing-page-cards/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    const patch = req.body || {};
    if (USE_DB) {
      await db.updateLandingPageCard(id, patch);
      return res.json({ ok: true });
    }
    // For filesystem mode, update in landingPageCards.json
    const cards = await readAllLandingPageCardsFS();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const cur = cards[idx];
    const updated = { ...cur };
    if (Object.prototype.hasOwnProperty.call(patch, "sectionName")) updated.sectionName = String(patch.sectionName || "");
    if (Object.prototype.hasOwnProperty.call(patch, "icon")) updated.icon = String(patch.icon || "");
    if (Object.prototype.hasOwnProperty.call(patch, "icon_color")) updated.icon_color = String(patch.icon_color || "");
    if (Object.prototype.hasOwnProperty.call(patch, "cardTitle")) updated.cardTitle = String(patch.cardTitle || "");
    if (Object.prototype.hasOwnProperty.call(patch, "cardText")) updated.cardText = String(patch.cardText || "");
    if (Object.prototype.hasOwnProperty.call(patch, "enabled"))
      updated.enabled = patch.enabled ? 1 : 0;
    cards[idx] = updated;
    await writeAllLandingPageCardsFS(cards);
    return res.json({ card: updated });
  } catch (err) {
    console.error("Admin update landing page card error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/admin/landing-page-cards/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    if (USE_DB) {
      await db.deleteLandingPageCard(id);
      return res.json({ ok: true });
    }
    // For filesystem mode, remove from landingPageCards.json
    const cards = await readAllLandingPageCardsFS();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    cards.splice(idx, 1);
    await writeAllLandingPageCardsFS(cards);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Admin delete landing page card error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});



/**
 * POST /api/register
 */
app.post("/api/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      nickName,
      gender,
      mobileNo,
      emailId,
      secondaryEmail,
      password,
      keywords,
      workPreference,
      traveling,
      available,
      addressLine1,
      addressLine2,
      city,
      state,
      postcode,
      country,
      category,
      showInDashboard,
      showPhoto,
      passwordDigest,
    } = req.body || {};

    if (!emailId || !password || !firstName) {
      return res.status(400).json({ error: "firstName, emailId and password are required" });
    }

    if (USE_DB) {
      const exists = await db.getUserByEmail(emailId);
      if (exists) return res.status(409).json({ error: "User with this email already exists" });

      const passwordHash = await hashPassword(String(password || ""));
      const confirmationToken = generateConfirmationToken();
      const newUser = {
        id: makeId(),
        name: [firstName, lastName].filter(Boolean).join(" ").trim(),
        firstName: firstName || "",
        lastName: lastName || "",
        nickName: nickName || "",
        gender: gender || "",
        mobile: mobileNo || "",
        emailId,
        secondaryEmail: secondaryEmail || emailId,
        passwordHash: passwordHash,
        summary: keywords || "",
        workPreference: workPreference || "",
        traveling: traveling || "",
        availability: available || "",
        roleType: "user",
        createdAt: new Date(),
        category: category || "",
        showInDashboard: !!showInDashboard,
        showPhoto: !!showPhoto,
        isActive: false,
        confirmationToken,
      };
      await db.createUser(newUser);
      await db.setAddressForUser(newUser.id, {
        addressLine1,
        addressLine2,
        city,
        state,
        postcode,
        country,
      });

      // Send confirmation email
      try {
        await sendConfirmationEmail(emailId, confirmationToken, firstName);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail registration if email fails, but log it
      }

      const apiUser = sanitizeUser({
        ...newUser,
        createdAt: new Date(newUser.createdAt).toISOString(),
      });
      return res.status(201).json({ user: apiUser, message: "Registration successful. Please check your email to confirm your account." });
    }

    // FS flow
    const store = await readUsersFS();
    const exists = store.users.find(
      (u) => (u.emailId || "").toLowerCase() === String(emailId).toLowerCase(),
    );
    if (exists) return res.status(409).json({ error: "User with this email already exists" });

    const passwordHash = await hashPassword(String(password || ""));
    const confirmationToken = generateConfirmationToken();
    const newUser = {
      id: makeId(),
      name: [firstName, lastName].filter(Boolean).join(" ").trim(),
      firstName: firstName || "",
      lastName: lastName || "",
      nickName: nickName || "",
      gender: gender || "",
      mobile: mobileNo || "",
      emailId: emailId,
      secondaryEmail: secondaryEmail || emailId,
      passwordHash: passwordHash,
      summary: keywords || "",
      workPreference: workPreference || "",
      traveling: traveling || "",
      availability: available || "",
      roleType: "user",
      createdAt: new Date().toISOString(),
      category: category || "",
      showInDashboard: !!showInDashboard,
      showPhoto: !!showPhoto,
      isActive: false,
      confirmationToken,
    };
    store.users.push(newUser);
    await writeUsersFS(store);
    await setAddressForUserFS(newUser.id, { addressLine1, addressLine2, city, state, postcode, country });

    // Send confirmation email
    try {
      await sendConfirmationEmail(emailId, confirmationToken, firstName);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    return res.status(201).json({ user: sanitizeUser(newUser), message: "Registration successful. Please check your email to confirm your account." });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/login
 */
app.post("/api/login", async (req, res) => {
  try {
    const { emailId, password } = req.body || {};
    if (!emailId || !password) {
      return res.status(400).json({ error: "emailId and password are required" });
    }

    if (USE_DB) {
      const row = await db.getUserByEmail(emailId);
      if (!row) return res.status(401).json({ error: "Invalid credentials" });
      const ok = await verifyPassword(String(password || ""), row.password_hash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      // Check if account is active
      if (row.is_active !== 1 && row.is_active !== true) {
        return res.status(403).json({ error: "Account not activated. Please check your email for the confirmation link." });
      }

      // Ensure correct roleType on login (backfill if missing)
      const adminEmailLower = String(ADMIN_EMAIL).toLowerCase();
      const additionalAdmins = String(process.env.ADMIN_ADDITIONAL_EMAILS || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const emailLower = String(row.email_id || "").toLowerCase();
      let rt = String(row.role_type || "").toLowerCase();
      // Force admin role by email regardless of existing role_type
      if (emailLower === adminEmailLower || additionalAdmins.includes(emailLower)) {
        if (rt !== "administrator") {
          try {
            await db.updateUserFields(row.id, { roleType: "administrator" });
          } catch (e) {
            // non-fatal
          }
        }
        rt = "administrator";
      } else if (!rt) {
        rt = "user";
      }

      const mapped = mapDbUserRowToApiUser(row);
      const apiUser = { ...mapped, roleType: rt };
      return res.json({ user: sanitizeUser(apiUser), message: "Login successful" });
    }

    // FS flow
    const store = await readUsersFS();
    const user = store.users.find(
      (u) => (u.emailId || "").toLowerCase() === String(emailId).toLowerCase(),
    );
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    let ok = false;
    if (user.passwordHash) ok = await verifyPassword(String(password || ""), user.passwordHash);
    else if (user.password) ok = String(user.password) === String(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ error: "Account not activated. Please check your email for the confirmation link." });
    }

    // FS mode: ensure admin email is treated as administrator in response
    const adminEmailLower = String(ADMIN_EMAIL).toLowerCase();
    const additionalAdmins = String(process.env.ADMIN_ADDITIONAL_EMAILS || "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const emailLower = String(user.emailId || "").toLowerCase();
    const rt =
      emailLower === adminEmailLower || additionalAdmins.includes(emailLower)
        ? "administrator"
        : String(user.roleType || "user").toLowerCase();
    const apiUser = { ...sanitizeUser(user), roleType: rt };
    return res.json({ user: apiUser, message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/users
 */
app.get("/api/users", async (_req, res) => {
  try {
    if (USE_DB) {
      const roleParamRaw = String(((_req.query && _req.query.roleType) || "user")).toLowerCase();
      const roleParam = roleParamRaw === "administrative" ? "administrator" : roleParamRaw;
      const adminEmailLower = String(ADMIN_EMAIL).toLowerCase();

      const rows = (await db.listUsers()).filter((r) => {
        const rt = String(r.role_type || "user").toLowerCase();
        const emailLower = String(r.email_id || "").toLowerCase();
        if (roleParam === "administrator") {
          return rt === "administrator" || rt === "administrative" || emailLower === adminEmailLower;
        }
        // Non-admin view explicitly excludes the bootstrap admin email
        return rt === roleParam && emailLower !== adminEmailLower;
      });
      const users = rows.map((r) => {
        const u = mapDbUserRowToApiUser(r);
        const addr =
          r.address_line1 || r.address_line2 || r.city || r.state || r.postcode || r.country
            ? {
                addressLine1: r.address_line1 || "",
                addressLine2: r.address_line2 || "",
                city: r.city || "",
                state: r.state || "",
                postcode: r.postcode || "",
                country: r.country || "",
              }
            : {};
        return { ...sanitizeUser(u), address: addr, category: r.category || "" };
      });
      return res.json({ users });
    }

    // FS flow
    const store = await readUsersFS();
    const addrStore = await readAddressesFS();

    const roleParamRaw = String(((_req.query && _req.query.roleType) || "user")).toLowerCase();
    const roleParam = roleParamRaw === "administrative" ? "administrator" : roleParamRaw;
    const adminEmailLower = String(ADMIN_EMAIL).toLowerCase();

    const users = store.users
      .filter((u) => {
        const rt = String(u.roleType || "user").toLowerCase();
        const emailLower = String(u.emailId || "").toLowerCase();
        if (roleParam === "administrator") {
          return rt === "administrator" || rt === "administrative" || emailLower === adminEmailLower;
        }
        return rt === roleParam && emailLower !== adminEmailLower;
      })
      .map((u) => {
      const au = sanitizeUser(u);
      const addrRec = addrStore.addresses.find((a) => a.userId === u.id);
      au.address = addrRec ? { ...addrRec.current } : {};
      if (au.address && au.address.from) {
        const { from, ...rest } = au.address;
        au.address = rest;
      }
      return au;
    });
    return res.json({ users });
  } catch (err) {
    console.error("Users list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/users/:id
 */
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    if (USE_DB) {
      const row = await db.getUserById(id);
      if (!row) return res.status(404).json({ error: "User not found" });
      const u = mapDbUserRowToApiUser(row);
      const ac = await db.getAddressCurrent(id);
      let address = {};
      if (ac) {
        address = {
          addressLine1: ac.address_line1 || "",
          addressLine2: ac.address_line2 || "",
          city: ac.city || "",
          state: ac.state || "",
          postcode: ac.postcode || "",
          country: ac.country || "",
        };
      }
      return res.json({ user: { ...sanitizeUser(u), address } });
    }

    // FS flow
    const store = await readUsersFS();
    const user = store.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const addr = await getAddressForUserFS(id);
    const apiUser = sanitizeUser(user);
    apiUser.address = addr ? { ...addr } : {};
    if (apiUser.address && apiUser.address.from) {
      const { from, ...rest } = apiUser.address;
      apiUser.address = rest;
    }
    return res.json({ user: apiUser });
  } catch (err) {
    console.error("User get error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/users/:id
 */
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    const updates = req.body || {};

    // emailId immutable for login identity
    if (Object.prototype.hasOwnProperty.call(updates, "emailId")) {
      delete updates.emailId;
    }

    if (USE_DB) {
      // Split address
      const incomingAddress = updates.address || null;
      const updatesWithoutAddress = { ...updates };
      delete updatesWithoutAddress.address;

      // Allowed fields map handled in db.updateUserFields
      await db.updateUserFields(id, updatesWithoutAddress);

      if (incomingAddress && typeof incomingAddress === "object") {
        await db.setAddressForUser(id, incomingAddress);
      }

      // Return latest
      const row = await db.getUserById(id);
      if (!row) return res.status(404).json({ error: "User not found" });
      const u = mapDbUserRowToApiUser(row);
      const ac = await db.getAddressCurrent(id);
      let address = {};
      if (ac) {
        address = {
          addressLine1: ac.address_line1 || "",
          addressLine2: ac.address_line2 || "",
          city: ac.city || "",
          state: ac.state || "",
          postcode: ac.postcode || "",
          country: ac.country || "",
        };
      }
      return res.json({ user: { ...sanitizeUser(u), address }, message: "Profile updated" });
    }

    // FS flow
    const store = await readUsersFS();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: "User not found" });

    const incomingAddress = updates.address || null;
    const updatesWithoutAddress = { ...updates };
    delete updatesWithoutAddress.address;

    if (incomingAddress && typeof incomingAddress === "object") {
      await setAddressForUserFS(id, incomingAddress);
    }

    const current = store.users[idx];
    const merged = { ...current, ...updatesWithoutAddress, id };
    if (merged.address) delete merged.address;
    store.users[idx] = merged;
    await writeUsersFS(store);

    const addr = await getAddressForUserFS(id);
    const responseUser = sanitizeUser(merged);
    responseUser.address = addr ? { ...addr } : (responseUser.address || {});
    if (responseUser.address && responseUser.address.from) {
      const { from, ...rest } = responseUser.address;
      responseUser.address = rest;
    }
    return res.json({ user: responseUser, message: "Profile updated" });
  } catch (err) {
    console.error("User update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/password/change
 */
app.post("/api/password/change", async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body || {};
    if (!id || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "id, currentPassword and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    if (USE_DB) {
      const row = await db.getUserById(id);
      if (!row) return res.status(404).json({ error: "User not found" });
      const ok = await verifyPassword(String(currentPassword || ""), row.password_hash);
      if (!ok) return res.status(401).json({ error: "Current password is incorrect" });
      await db.updatePasswordHash(id, await hashPassword(String(newPassword || "")));
      return res.json({ message: "Password changed successfully" });
    }

    // FS flow
    const store = await readUsersFS();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: "User not found" });
    const user = store.users[idx];
    let ok = false;
    if (user.passwordHash) ok = await verifyPassword(String(currentPassword || ""), user.passwordHash);
    else if (user.password) ok = String(user.password) === String(currentPassword);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });
    const updated = { ...user, passwordHash: await hashPassword(String(newPassword || "")) };
    delete updated.password;
    store.users[idx] = updated;
    await writeUsersFS(store);
    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/password/reset
 */
app.post("/api/password/reset", async (req, res) => {
  try {
    const { emailId, newPassword } = req.body || {};
    if (!emailId || !newPassword) {
      return res.status(400).json({ error: "emailId and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    if (USE_DB) {
      const row = await db.getUserByEmail(emailId);
      if (!row) return res.status(404).json({ error: "User not found" });
      await db.updatePasswordHash(row.id, await hashPassword(String(newPassword || "")));
      return res.json({ message: "Password reset successfully" });
    }

    // FS flow
    const store = await readUsersFS();
    const idx = store.users.findIndex(
      (u) => (u.emailId || "").toLowerCase() === String(emailId).toLowerCase(),
    );
    if (idx === -1) return res.status(404).json({ error: "User not found" });
    const user = store.users[idx];
    const updated = { ...user, passwordHash: await hashPassword(String(newPassword || "")) };
    delete updated.password;
    store.users[idx] = updated;
    await writeUsersFS(store);
    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Password reset error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Photos
 * - POST /api/users/:id/photo  { base64, contentType }
 * - GET  /api/users/:id/photo  -> { contentType, base64 } or 404
 */
app.post("/api/users/:id/photo", async (req, res) => {
  try {
    const { id } = req.params || {};
    const { base64: rawBase64, contentType: rawContentType } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing user id" });
    if (!rawBase64) return res.status(400).json({ error: "Missing base64" });

    let { base64, contentType } = normalizeBase64DataUrl(rawBase64);
    if (!contentType && rawContentType) contentType = String(rawContentType);
    if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      return res.status(400).json({ error: "Invalid content type. Allowed: image/jpeg, image/png, image/gif" });
    }
    const sizeBytes = Math.floor((base64.length * 3) / 4);
    if (sizeBytes > MAX_IMAGE_BYTES) {
      return res.status(400).json({ error: "Image too large. Max 150KB" });
    }

    if (USE_DB) {
      const row = await db.getUserById(id);
      if (!row) return res.status(404).json({ error: "User not found" });
      const buf = Buffer.from(base64, "base64");
      await db.upsertPhoto(id, contentType, buf);
      return res.json({ ok: true, uploadedAt: new Date().toISOString() });
    }

    // FS flow
    const store = await readUsersFS();
    const user = store.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const photos = await readPhotosFS();
    const idx = photos.photos.findIndex((p) => p.userId === id);
    const now = new Date().toISOString();
    const record = { userId: id, contentType, base64, uploadedAt: now };
    if (idx === -1) photos.photos.push(record);
    else photos.photos[idx] = record;
    await writePhotosFS(photos);
    return res.json({ ok: true, uploadedAt: now });
  } catch (err) {
    console.error("Upload photo error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/users/public?category=Software%20Engineer
 * Returns only users who consented to be shown in the dashboard (and optional category filter)
 */
app.get("/api/users/public", async (req, res) => {
  try {
    const category = (req.query.category || "").toString().trim();
    if (USE_DB) {
      const rows = await db.listPublicUsers(category || null);
      const users = rows.map((r) => {
        const u = mapDbUserRowToApiUser(r);
        const addr =
          r.address_line1 || r.address_line2 || r.city || r.state || r.postcode || r.country
            ? {
                addressLine1: r.address_line1 || "",
                addressLine2: r.address_line2 || "",
                city: r.city || "",
                state: r.state || "",
                postcode: r.postcode || "",
                country: r.country || "",
              }
            : {};
        return {
          ...sanitizeUser(u),
          category: r.category || "",
          showInDashboard: r.show_in_dashboard === 1,
          showPhoto: r.show_photo === 1,
          address: addr,
          photoPresent: !!r.photo_present,
        };
      });
      return res.json({ users });
    }

    // FS flow
    const store = await readUsersFS();
    const addrStore = await readAddressesFS();
    const photos = await readPhotosFS();
    const users = store.users
      .filter((u) => !!u.showInDashboard)
      .filter((u) => (category ? String(u.category || "").toLowerCase() === category.toLowerCase() : true))
      .map((u) => {
        const addrRec = addrStore.addresses.find((a) => a.userId === u.id);
        const addr = addrRec
          ? {
              addressLine1: addrRec.current.addressLine1 || "",
              addressLine2: addrRec.current.addressLine2 || "",
              city: addrRec.current.city || "",
              state: addrRec.current.state || "",
              postcode: addrRec.current.postcode || "",
              country: addrRec.current.country || "",
            }
          : {};
        const hasPhoto = photos.photos.some((p) => p.userId === u.id);
        return {
          ...sanitizeUser(u),
          address: addr,
          category: u.category || "",
          showInDashboard: !!u.showInDashboard,
          showPhoto: !!u.showPhoto,
          photoPresent: hasPhoto,
        };
      });
    return res.json({ users });
  } catch (err) {
    console.error("Public users error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/users/:id/photo - clear/remove user's photo
 */
app.delete("/api/users/:id/photo", async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id) return res.status(400).json({ error: "Missing user id" });

    if (USE_DB) {
      await db.deletePhoto(id);
      return res.json({ ok: true });
    }

    const photos = await readPhotosFS();
    const idx = photos.photos.findIndex((p) => p.userId === id);
    if (idx !== -1) {
      photos.photos.splice(idx, 1);
      await writePhotosFS(photos);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete photo error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/:id/photo", async (req, res) => {
  try {
    const { id } = req.params || {};
    if (USE_DB) {
      const rec = await db.getPhoto(id);
      if (!rec) return res.status(404).json({ error: "Not found" });
      const base64 = Buffer.isBuffer(rec.data) ? rec.data.toString("base64") : "";
      return res.json({
        contentType: rec.content_type,
        base64,
        uploadedAt:
          rec.uploaded_at instanceof Date ? rec.uploaded_at.toISOString() : rec.uploaded_at,
      });
    }

    // FS flow
    const photos = await readPhotosFS();
    const r = photos.photos.find((p) => p.userId === id);
    if (!r) return res.status(404).json({ error: "Not found" });
    return res.json({ contentType: r.contentType, base64: r.base64, uploadedAt: r.uploadedAt });
  } catch (err) {
    console.error("Get photo error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/confirm-email
 * Confirms user email using confirmation token
 */
app.post("/api/confirm-email", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: "Confirmation token is required" });
    }

    if (USE_DB) {
      const row = await db.getUserByConfirmationToken(token);
      if (!row) {
        return res.status(400).json({ error: "Invalid or expired confirmation token" });
      }

      // Check if token is expired (24 hours)
      const createdAt = new Date(row.created_at);
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        return res.status(400).json({ error: "Confirmation token has expired. Please register again." });
      }

      // Update user as active and remove confirmation token
      await db.updateUserFields(row.id, { isActive: true, confirmationToken: null });

      return res.json({ message: "Email confirmed successfully. Your account is now active." });
    }

    // FS flow
    const store = await readUsersFS();
    const userIndex = store.users.findIndex((u) => u.confirmationToken === token);
    if (userIndex === -1) {
      return res.status(400).json({ error: "Invalid or expired confirmation token" });
    }

    const user = store.users[userIndex];
    // Check if token is expired (24 hours)
    const createdAt = new Date(user.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      return res.status(400).json({ error: "Confirmation token has expired. Please register again." });
    }

    // Update user as active and remove confirmation token
    user.isActive = true;
    delete user.confirmationToken;
    await writeUsersFS(store);

    return res.json({ message: "Email confirmed successfully. Your account is now active." });
  } catch (err) {
    console.error("Confirm email error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: USE_DB ? "mysql" : "fs" });
});

// ========== Startup ==========

async function start() {
  if (USE_DB) {
    await db.initSchema();
    console.log("MySQL schema ensured. Running in MySQL mode.");

    // Bootstrap admin user if missing (uses client-side digest convention)
    try {
      const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@buymyskills.local";
      const adminPass = process.env.ADMIN_BOOTSTRAP_PASSWORD || "Welcome1234!";
      const existing = await db.getUserByEmail(adminEmail);
      if (!existing) {
        const now = new Date();
        const adminUser = {
          id: makeId(),
          name: "Administrator",
          firstName: "Admin",
          lastName: "",
          nickName: "admin",
          gender: "",
          mobile: "",
          emailId: adminEmail,
          secondaryEmail: adminEmail,
          // Store scrypt(SHA-256(plain)) so that clients can send passwordDigest
          passwordHash: await hashPassword(String(adminPass)),
          summary: "",
          workPreference: "",
          traveling: "",
          availability: "",
          roleType: "administrator",
          createdAt: now,
          category: "",
          showInDashboard: 0,
          showPhoto: 0,
        };
        await db.createUser(adminUser);
      }
    } catch (e) {
      console.warn("Admin bootstrap warning:", e.message);
    }
  } else {
    await ensureDataFile();
    await ensureHashedPasswordsOnStartFS();
    // Bootstrap admin user for FS mode
    try {
      const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@buymyskills.local";
      const adminPass = process.env.ADMIN_BOOTSTRAP_PASSWORD || "Welcome1234!";
      const store = await readUsersFS();
      const exists = store.users.find(
        (u) => (u.emailId || "").toLowerCase() === adminEmail.toLowerCase(),
      );
      if (!exists) {
        const u = {
          id: makeId(),
          name: "Administrator",
          firstName: "Admin",
          lastName: "",
          nickName: "admin",
          gender: "",
          mobile: "",
          emailId: adminEmail,
          secondaryEmail: adminEmail,
          passwordHash: await hashPassword(String(adminPass)),
          summary: "",
          workPreference: "",
          traveling: "",
          availability: "",
          roleType: "administrator",
          createdAt: new Date().toISOString(),
          category: "",
          showInDashboard: 0,
          showPhoto: 0,
        };
        store.users.push(u);
        await writeUsersFS(store);
      }
    } catch (e) {
      console.warn("FS admin bootstrap warning:", e.message);
    }
    console.log("Filesystem stores ensured. Running in FS mode.");
  }
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

start();
