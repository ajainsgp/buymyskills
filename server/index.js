/* Minimal Express API for registration and login persisting to data/users.json */

const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 4000;

// Where we'll store users server-side (separate from src/ to allow writes)
const DATA_DIR = path.resolve(__dirname, "../data");
const USERS_FILE = path.resolve(DATA_DIR, "users.json");
const ADDRESSES_FILE = path.resolve(DATA_DIR, "addresses.json");
const PHOTOS_FILE = path.resolve(DATA_DIR, "photos.json");

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    // Echo back the Origin header to allow any origin (sufficient for local dev)
    origin: true,
    credentials: false,
    optionsSuccessStatus: 204,
  }),
);
// Preflight for API routes (Express 5+ requires a valid pattern)
app.options(/^\/api\/.*$/, cors());

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(USERS_FILE);
  } catch {
    // Seed with default structure
    const initial = { users: [] };
    await fs.writeFile(USERS_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readUsers() {
  await ensureDataFile();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.users)) {
      return { users: [] };
    }
    return parsed;
  } catch {
    // Reset file if corrupted
    const fallback = { users: [] };
    await fs.writeFile(USERS_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

async function writeUsers(data) {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
}

/** Addresses store (normalized into separate file) */
async function ensureAddressesFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(ADDRESSES_FILE);
  } catch {
    const initial = { addresses: [] };
    await fs.writeFile(ADDRESSES_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}
async function readAddresses() {
  await ensureAddressesFile();
  const raw = await fs.readFile(ADDRESSES_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.addresses)) {
      return { addresses: [] };
    }
    return parsed;
  } catch {
    const fallback = { addresses: [] };
    await fs.writeFile(ADDRESSES_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}
async function writeAddresses(data) {
  await fs.writeFile(ADDRESSES_FILE, JSON.stringify(data, null, 2), "utf8");
}
async function setAddressForUser(userId, newAddress) {
  const store = await readAddresses();
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
        store.addresses[idx].history.push({
          ...restOld,
          from: from || now,
          to: now,
        });
      }
      store.addresses[idx].current = {
        addressLine1: (newAddress.addressLine1 || ""),
        addressLine2: (newAddress.addressLine2 || ""),
        city: (newAddress.city || ""),
        state: (newAddress.state || ""),
        postcode: (newAddress.postcode || ""),
        country: (newAddress.country || ""),
        from: now,
      };
      store.addresses[idx].updatedAt = now;
    }
  }
  await writeAddresses(store);
}
async function getAddressForUser(userId) {
  const store = await readAddresses();
  const rec = store.addresses.find((a) => a.userId === userId);
  return rec ? rec.current : null;
}

/** Photos store (separate file) */
async function ensurePhotosFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(PHOTOS_FILE);
  } catch {
    const initial = { photos: [] };
    await fs.writeFile(PHOTOS_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}
async function readPhotos() {
  await ensurePhotosFile();
  const raw = await fs.readFile(PHOTOS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.photos)) {
      return { photos: [] };
    }
    return parsed;
  } catch {
    const fallback = { photos: [] };
    await fs.writeFile(PHOTOS_FILE, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}
async function writePhotos(data) {
  await fs.writeFile(PHOTOS_FILE, JSON.stringify(data, null, 2), "utf8");
}
function normalizeBase64DataUrl(input) {
  if (!input) return { base64: "", contentType: "" };
  // data:[mime];base64,<data>
  const m = String(input).match(/^data:(.+);base64,(.*)$/);
  if (m) {
    return { contentType: m[1], base64: m[2] };
  }
  return { base64: input, contentType: "" };
}

function sanitizeUser(user) {
  const { password, passwordHash, ...rest } = user;
  return rest;
}

function makeId() {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Password hashing utilities using Node's crypto.scrypt for demo (no external deps)
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  // store as: scrypt$<saltHex>$<hashHex>
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function verifyPassword(password, stored) {
  try {
    if (!stored) return false;
    if (stored.startsWith("scrypt$")) {
      const parts = stored.split("$");
      // parts: ["scrypt", "<saltHex>", "<hashHex>"]
      const saltHex = parts[1];
      const hashHex = parts[2];
      if (!saltHex || !hashHex) return false;
      const salt = Buffer.from(saltHex, "hex");
      const derived = crypto.scryptSync(String(password), salt, 64);
      const storedHash = Buffer.from(hashHex, "hex");
      if (derived.length !== storedHash.length) return false;
      return crypto.timingSafeEqual(derived, storedHash);
    }
    // Backward compatibility: if stored isn't marked scrypt, treat as plaintext
    return String(stored) === String(password);
  } catch {
    return false;
  }
}

async function ensureHashedPasswordsOnStart() {
  const store = await readUsers();
  let changed = false;
  for (const u of store.users) {
    if (u && !u.passwordHash && typeof u.password === "string" && u.password) {
      u.passwordHash = hashPassword(u.password);
      delete u.password;
      changed = true;
    }
    if (u && u.password && u.passwordHash) {
      delete u.password;
      changed = true;
    }
    // Normalize: ensure no address stored in users.json
    if (u && u.address) {
      delete u.address;
      changed = true;
    }
  }
  if (changed) {
    await writeUsers(store);
  }
}

/**
 * POST /api/register
 * Body: {
 *   firstName, lastName, nickName, gender,
 *   mobileNo, emailId, password,
 *   keywords, workPreference, traveling, available,
 *   addressLine1, addressLine2, city, state, postcode, country
 * }
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
    } = req.body || {};

    if (!emailId || !password || !firstName) {
      return res
        .status(400)
        .json({ error: "firstName, emailId and password are required" });
    }

    const store = await readUsers();
    const exists = store.users.find(
      (u) => (u.emailId || "").toLowerCase() === String(emailId).toLowerCase(),
    );
    if (exists) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

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
      passwordHash: hashPassword(String(password)),
      summary: keywords || "",
      workPreference: workPreference || "",
      traveling: traveling || "",
      availability: available || "",
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    await writeUsers(store);
    await setAddressForUser(newUser.id, {
      addressLine1,
      addressLine2,
      city,
      state,
      postcode,
      country,
    });

    return res.status(201).json({
      user: sanitizeUser(newUser),
      message: "Registered successfully",
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/login
 * Body: { emailId, password }
 */
app.post("/api/login", async (req, res) => {
  try {
    const { emailId, password } = req.body || {};
    if (!emailId || !password) {
      return res
        .status(400)
        .json({ error: "emailId and password are required" });
    }
    const store = await readUsers();
    const user = store.users.find(
      (u) =>
        (u.emailId || "").toLowerCase() === String(emailId).toLowerCase(),
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Verify password against hash if present, else fallback to legacy plaintext
    let ok = false;
    if (user.passwordHash) {
      ok = verifyPassword(password, user.passwordHash);
    } else if (user.password) {
      ok = String(user.password) === String(password);
    }
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    return res.json({ user: sanitizeUser(user), message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const store = await readUsers();
    const addrStore = await readAddresses();
    const users = store.users.map((u) => {
      const au = sanitizeUser(u);
      const addrRec = addrStore.addresses.find((a) => a.userId === u.id);
      au.address = addrRec ? { ...addrRec.current } : {};
      if (au.address && au.address.from) {
        // hide internal timestamp in API response
        const { from, ...rest } = au.address;
        au.address = rest;
      }
      return au;
    });
    res.json({ users });
  } catch (err) {
    console.error("Users list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single user by id
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    const store = await readUsers();
    const user = store.users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const addr = await getAddressForUser(id);
    const u = sanitizeUser(user);
    u.address = addr ? { ...addr } : {};
    if (u.address && u.address.from) {
      const { from, ...rest } = u.address;
      u.address = rest;
    }
    return res.json({ user: u });
  } catch (err) {
    console.error("User get error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a user by id
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params || {};
    const updates = req.body || {};
    // Enforce immutability of primary login email on the backend
    if (Object.prototype.hasOwnProperty.call(updates, "emailId")) {
      delete updates.emailId;
    }
    const store = await readUsers();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "User not found" });
    }
    const current = store.users[idx];

    // Prevent email collision with other users
    if (updates.emailId && updates.emailId !== current.emailId) {
      const exists = store.users.find(
        (u) =>
          u.id !== id &&
          (u.emailId || "").toLowerCase() ===
            String(updates.emailId).toLowerCase(),
      );
      if (exists) {
        return res
          .status(409)
          .json({ error: "Another user with this email already exists" });
      }
    }

    // Split address updates (normalized to separate file)
    const incomingAddress = updates.address || null;
    const updatesWithoutAddress = { ...updates };
    delete updatesWithoutAddress.address;

    if (incomingAddress && typeof incomingAddress === "object") {
      await setAddressForUser(id, incomingAddress);
    }

    // Merge allowed fields
    const merged = {
      ...current,
      ...updatesWithoutAddress,
      id, // ensure id unchanged
    };
    // Ensure address is never stored inside users.json
    if (merged.address) {
      delete merged.address;
    }
    store.users[idx] = merged;
    await writeUsers(store);

    // Attach address from normalized store in response
    const addr = await getAddressForUser(id);
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
 * Body: { id, currentPassword, newPassword }
 * Changes password for a logged-in user after verifying current password.
 */
app.post("/api/password/change", async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body || {};
    if (!id || !currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "id, currentPassword and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }
    const store = await readUsers();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = store.users[idx];
    // Verify current password (supports hashed or legacy plaintext)
    let ok = false;
    if (user.passwordHash) {
      ok = verifyPassword(currentPassword, user.passwordHash);
    } else if (user.password) {
      ok = String(user.password) === String(currentPassword);
    }
    if (!ok) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    const updated = { ...user, passwordHash: hashPassword(String(newPassword)) };
    delete updated.password;
    store.users[idx] = updated;
    await writeUsers(store);
    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/password/reset
 * Body: { emailId, newPassword }
 * Resets password using email (for forgot password flow).
 */
app.post("/api/password/reset", async (req, res) => {
  try {
    const { emailId, newPassword } = req.body || {};
    if (!emailId || !newPassword) {
      return res
        .status(400)
        .json({ error: "emailId and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }
    const store = await readUsers();
    const idx = store.users.findIndex(
      (u) => (u.emailId || "").toLowerCase() === String(emailId).toLowerCase(),
    );
    if (idx === -1) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = store.users[idx];
    const updated = { ...user, passwordHash: hashPassword(String(newPassword)) };
    delete updated.password;
    store.users[idx] = updated;
    await writeUsers(store);
    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Password reset error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Photos endpoints
 * - POST /api/users/:id/photo  { base64, contentType }
 * - GET  /api/users/:id/photo  -> { contentType, base64 } or 404
 */
const MAX_IMAGE_BYTES = 150 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/gif"]);

app.post("/api/users/:id/photo", async (req, res) => {
  try {
    const { id } = req.params || {};
    const { base64: rawBase64, contentType: rawContentType } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing user id" });
    if (!rawBase64) return res.status(400).json({ error: "Missing base64" });

    // Normalize possible data URL
    let { base64, contentType } = normalizeBase64DataUrl(rawBase64);
    if (!contentType && rawContentType) contentType = String(rawContentType);
    if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      return res
        .status(400)
        .json({ error: "Invalid content type. Allowed: image/jpeg, image/png, image/gif" });
    }

    // Size check
    const sizeBytes = Math.floor((base64.length * 3) / 4);
    if (sizeBytes > MAX_IMAGE_BYTES) {
      return res.status(400).json({ error: "Image too large. Max 150KB" });
    }

    // Ensure user exists
    const store = await readUsers();
    const user = store.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const photos = await readPhotos();
    const idx = photos.photos.findIndex((p) => p.userId === id);
    const now = new Date().toISOString();
    const record = { userId: id, contentType, base64, uploadedAt: now };
    if (idx === -1) photos.photos.push(record);
    else photos.photos[idx] = record;
    await writePhotos(photos);

    return res.json({ ok: true, uploadedAt: now });
  } catch (err) {
    console.error("Upload photo error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/:id/photo", async (req, res) => {
  try {
    const { id } = req.params || {};
    const photos = await readPhotos();
    const rec = photos.photos.find((p) => p.userId === id);
    if (!rec) return res.status(404).json({ error: "Not found" });
    return res.json({ contentType: rec.contentType, base64: rec.base64, uploadedAt: rec.uploadedAt });
  } catch (err) {
    console.error("Get photo error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

async function start() {
  await ensureDataFile();
  await ensureHashedPasswordsOnStart();
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

start();
