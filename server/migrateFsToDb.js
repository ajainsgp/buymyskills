/**
 * One-time migration: move existing filesystem data (data/*.json) into MySQL.
 * Usage:
 *   1) Set DB_* env vars and PERSISTENCE=mysql in .env or shell
 *   2) Run: PERSISTENCE=mysql node server/migrateFsToDb.js
 *
 * This script is idempotent in the sense it INSERTs users by id and will
 * upsert photos. Running multiple times may hit duplicate-key errors on users;
 * that's expected if you've already migrated users.
 */
require("dotenv").config();

const path = require("path");
const fs = require("fs").promises;
const { existsSync } = require("fs");
const db = require("./db");

const DATA_DIR = path.resolve(__dirname, "../data");
const USERS_FILE = path.resolve(DATA_DIR, "users.json");
const ADDRESSES_FILE = path.resolve(DATA_DIR, "addresses.json");
const PHOTOS_FILE = path.resolve(DATA_DIR, "photos.json");

function toDate(v) {
  if (!v) return new Date();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

async function readJsonSafe(file, fallback) {
  try {
    if (!existsSync(file)) return fallback;
    const raw = await fs.readFile(file, "utf8");
    const json = JSON.parse(raw);
    return json ?? fallback;
  } catch (e) {
    console.warn(`Warn: failed to read ${file}:`, e.message);
    return fallback;
  }
}

async function migrateUsers() {
  const store = await readJsonSafe(USERS_FILE, { users: [] });
  const users = Array.isArray(store.users) ? store.users : [];
  let created = 0;
  for (const u of users) {
    if (!u || !u.id || !u.emailId) continue;
    const newUser = {
      id: u.id,
      name: u.name || [u.firstName, u.lastName].filter(Boolean).join(" ").trim(),
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      nickName: u.nickName || "",
      gender: u.gender || "",
      mobile: u.mobile || u.mobileNo || "",
      emailId: u.emailId,
      secondaryEmail: u.secondaryEmail || u.emailId,
      passwordHash: u.passwordHash || null, // if missing, user will need reset/change
      summary: u.summary || u.keywords || "",
      workPreference: u.workPreference || "",
      traveling: u.traveling || "",
      availability: u.availability || u.available || "",
      createdAt: toDate(u.createdAt),
    };
    try {
      const exists = await db.getUserById(newUser.id);
      if (exists) {
        // Already there; optionally update basic fields
        await db.updateUserFields(newUser.id, {
          name: newUser.name,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          nickName: newUser.nickName,
          gender: newUser.gender,
          mobile: newUser.mobile,
          secondaryEmail: newUser.secondaryEmail,
          category: newUser.category,
          summary: newUser.summary,
          workPreference: newUser.workPreference,
          traveling: newUser.traveling,
          availability: newUser.availability,
        });
        if (newUser.passwordHash) {
          await db.updatePasswordHash(newUser.id, newUser.passwordHash);
        }
      } else {
        await db.createUser(newUser);
        created += 1;
      }
    } catch (e) {
      console.error(`Error migrating user ${newUser.id} (${newUser.emailId}):`, e.message);
    }
  }
  return { total: users.length, created };
}

async function migrateAddresses() {
  const store = await readJsonSafe(ADDRESSES_FILE, { addresses: [] });
  const addresses = Array.isArray(store.addresses) ? store.addresses : [];
  let updated = 0;
  for (const rec of addresses) {
    if (!rec || !rec.userId) continue;
    const cur = rec.current || {};
    const addr = {
      addressLine1: cur.addressLine1 || "",
      addressLine2: cur.addressLine2 || "",
      city: cur.city || "",
      state: cur.state || "",
      postcode: cur.postcode || "",
      country: cur.country || "",
    };
    try {
      await db.setAddressForUser(rec.userId, addr);
      updated += 1;
    } catch (e) {
      console.error(`Error setting address for user ${rec.userId}:`, e.message);
    }
  }
  return { total: addresses.length, updated };
}

async function migratePhotos() {
  const store = await readJsonSafe(PHOTOS_FILE, { photos: [] });
  const photos = Array.isArray(store.photos) ? store.photos : [];
  let upserted = 0;
  for (const p of photos) {
    if (!p || !p.userId || !p.base64 || !p.contentType) continue;
    try {
      const buf = Buffer.from(String(p.base64), "base64");
      await db.upsertPhoto(p.userId, p.contentType, buf);
      upserted += 1;
    } catch (e) {
      console.error(`Error upserting photo for user ${p.userId}:`, e.message);
    }
  }
  return { total: photos.length, upserted };
}

(async function main() {
  if (
    String(process.env.PERSISTENCE || "").toLowerCase() !== "mysql" &&
    String(process.env.USE_DB || "").toLowerCase() !== "true"
  ) {
    console.warn("Warning: PERSISTENCE is not 'mysql'. Set PERSISTENCE=mysql to run migration.");
  }

  console.log("Connecting to MySQL and ensuring schema...");
  await db.initSchema();

  console.log("Migrating users...");
  const usersRes = await migrateUsers();
  console.log(`Users: total=${usersRes.total}, created_or_updated=${usersRes.created}`);

  console.log("Migrating addresses...");
  const addrRes = await migrateAddresses();
  console.log(`Addresses: total=${addrRes.total}, updated=${addrRes.updated}`);

  console.log("Migrating photos...");
  const photosRes = await migratePhotos();
  console.log(`Photos: total=${photosRes.total}, upserted=${photosRes.upserted}`);

  console.log("Migration complete.");
  process.exit(0);
})().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
