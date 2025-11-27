/* MySQL DAL for buymyskills: users, addresses (current+history), photos */
const mysql = require("mysql2/promise");

/**
 * Build a pooled connection to MySQL.
 * Environment variables (set on your server/OCI):
 *  - DB_HOST: hostname or IP
 *  - DB_PORT: default 3306
 *  - DB_USER
 *  - DB_PASSWORD
 *  - DB_NAME: e.g. "buymyskills"
 *  - DB_POOL_SIZE: optional, default 10
 *  - DB_SSL: "true" to enable TLS (typical for managed MySQL)
 */
const ssl =
  String(process.env.DB_SSL || "").toLowerCase() === "true"
    ? (() => {
        const o = {};
        const reject =
          String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "false").toLowerCase() === "true";
        o.rejectUnauthorized = reject;
        const p = process.env.DB_SSL_CA_PATH;
        if (p) {
          try {
            o.ca = require("fs").readFileSync(p, "utf8");
          } catch {}
        }
        return o;
      })()
    : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "buymyskills",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  ssl: ssl,
});

/**
 * Initialize schema (idempotent) - minimal normalized model:
 *  - users
 *  - address_current (1:1 with users)
 *  - address_history (N:1, tracks changes)
 *  - photos (1:1, stores binary)
 */
async function initSchema() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id                      VARCHAR(64) PRIMARY KEY,
      name                    VARCHAR(255),
      first_name              VARCHAR(100),
      last_name               VARCHAR(100),
      nick_name               VARCHAR(100),
      gender                  VARCHAR(10),
      mobile                  VARCHAR(32),
      is_whatsapp_available   TINYINT(1) NOT NULL DEFAULT 0,
      whatsapp_number         VARCHAR(32),
      email_id                VARCHAR(255) NOT NULL UNIQUE,
      secondary_email         VARCHAR(255),
      password_hash           VARCHAR(255),
      summary                 TEXT,
      work_preference         VARCHAR(20),
      traveling               VARCHAR(20),
      availability            VARCHAR(20),
      facebook_url            VARCHAR(255),
      linkedin_url            VARCHAR(255),
      created_at              DATETIME NOT NULL,
      INDEX (email_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS address_current (
      user_id       VARCHAR(64) PRIMARY KEY,
      address_line1 VARCHAR(255),
      address_line2 VARCHAR(255),
      city          VARCHAR(255),
      state         VARCHAR(255),
      postcode      VARCHAR(64),
      country       VARCHAR(255),
      from_ts       DATETIME NOT NULL,
      CONSTRAINT fk_addr_current_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS address_history (
      id            BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id       VARCHAR(64) NOT NULL,
      address_line1 VARCHAR(255),
      address_line2 VARCHAR(255),
      city          VARCHAR(255),
      state         VARCHAR(255),
      postcode      VARCHAR(64),
      country       VARCHAR(255),
      from_ts       DATETIME NOT NULL,
      to_ts         DATETIME NOT NULL,
      INDEX idx_addr_hist_user_ts (user_id, from_ts),
      CONSTRAINT fk_addr_hist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS photos (
      user_id     VARCHAR(64) PRIMARY KEY,
      content_type VARCHAR(64) NOT NULL,
      data         MEDIUMBLOB NOT NULL,
      uploaded_at  DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS feedback (
      id            BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id       VARCHAR(64) NOT NULL,
      query         TEXT NOT NULL,
      response      TEXT,
      status        ENUM('pending', 'responded') NOT NULL DEFAULT 'pending',
      created_at    DATETIME NOT NULL,
      responded_at  DATETIME,
      INDEX idx_feedback_user_status (user_id, status),
      INDEX idx_feedback_status_created (status, created_at),
      CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS buyer_engaged_list (
      id                BIGINT AUTO_INCREMENT PRIMARY KEY,
      buyer_user_id     VARCHAR(64) NOT NULL,
      seller_user_id    VARCHAR(64) NOT NULL,
      date_skills_used  DATETIME NOT NULL,
      rating            TINYINT,
      rating_date       DATETIME,
      created_at        DATETIME NOT NULL,
      INDEX idx_buyer_engaged_buyer (buyer_user_id),
      INDEX idx_buyer_engaged_seller (seller_user_id),
      INDEX idx_buyer_engaged_rating (rating),
      CONSTRAINT fk_buyer_engaged_buyer FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_buyer_engaged_seller FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS countries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(3) NOT NULL UNIQUE,
      phone_code VARCHAR(10) NOT NULL DEFAULT '',
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS landing_page_cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      section_name VARCHAR(50) NOT NULL DEFAULT 'categories',
      icon VARCHAR(100) NOT NULL,
      icon_color VARCHAR(7) NOT NULL DEFAULT '#042C76',
      card_title VARCHAR(100) NOT NULL,
      card_text VARCHAR(100) NOT NULL DEFAULT '',
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL,
      INDEX idx_section_name (section_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS regions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description VARCHAR(255),
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL,
      INDEX idx_region_enabled (enabled)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS country_region_mapping (
      id INT AUTO_INCREMENT PRIMARY KEY,
      country_code VARCHAR(3) NOT NULL,
      country_name VARCHAR(100) NOT NULL,
      region_id INT NOT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL,
      UNIQUE KEY unique_country_region (country_code, region_id),
      INDEX idx_mapping_region (region_id),
      INDEX idx_mapping_country (country_code),
      CONSTRAINT fk_country_region_mapping_region FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id VARCHAR(64) NOT NULL,
      receiver_id VARCHAR(64) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      INDEX idx_messages_sender (sender_id),
      INDEX idx_messages_receiver (receiver_id),
      INDEX idx_messages_created (created_at),
      INDEX idx_messages_read (is_read),
      CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);



    await conn.query(`CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_type VARCHAR(64) NOT NULL UNIQUE,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      creation_date DATETIME NOT NULL,
      last_updated_date DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    // Seed default roles if empty
    try {
      const [rCntRows] = await conn.query("SELECT COUNT(*) AS c FROM roles");
      const rCount = rCntRows && rCntRows[0] ? Number(rCntRows[0].c || 0) : 0;
      if (rCount === 0) {
        const defs = ["administrative", "user", "guest"];
        for (let i = 0; i < defs.length; i++) {
          const now = new Date();
          await conn.query(
            "INSERT INTO roles (role_type, enabled, creation_date, last_updated_date) VALUES (?,?,?,?)",
            [defs[i], 1, now, now],
          );
        }
      }
    } catch (e) {
      console.warn("roles seed warning:", e.message);
    }

    // Seed default categories if empty
    try {
      const [cntRows] = await conn.query("SELECT COUNT(*) AS c FROM categories");
      const count = cntRows && cntRows[0] ? Number(cntRows[0].c || 0) : 0;
      if (count === 0) {
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
          "Project Manager"
        ];
        const now = new Date();
        for (let i = 0; i < defaults.length; i++) {
          await conn.query(
            "INSERT INTO categories (name, enabled, created_at) VALUES (?,?,?)",
            [defaults[i], 1, now],
          );
        }
      }
    } catch (e) {
      console.warn("category seed warning:", e.message);
    }

    // Ensure 'enabled' column exists (for older deployments)
    try {
      const [cols] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories'",
      );
      const names = new Set(cols.map((c) => String(c.COLUMN_NAME).toLowerCase()));
      if (!names.has("enabled")) {
        await conn.query(
          "ALTER TABLE categories ADD COLUMN enabled TINYINT(1) NOT NULL DEFAULT 1",
        );
        // Backfill enabled=active for existing rows
        await conn.query("UPDATE categories SET enabled = active");
      }
    } catch (e) {
      console.warn("categories column ensure warning:", e.message);
    }

    // Seed default landing page cards if empty
    try {
      const [cardCntRows] = await conn.query("SELECT COUNT(*) AS c FROM landing_page_cards");
      const cardCount = cardCntRows && cardCntRows[0] ? Number(cardCntRows[0].c || 0) : 0;
      if (cardCount === 0) {
        const now = new Date();
        // Seed categories cards
        const categoriesCards = [
          { icon: "fas fa-code fa-lg", icon_color: "#042C76", card_title: "Development", card_text: "245 skills" },
          { icon: "fas fa-paint-brush fa-lg", icon_color: "#042C76", card_title: "Design", card_text: "189 skills" },
          { icon: "fas fa-chart-line fa-lg", icon_color: "#042C76", card_title: "Marketing", card_text: "156 skills" },
          { icon: "fas fa-language fa-lg", icon_color: "#042C76", card_title: "Languages", card_text: "134 skills" },
          { icon: "fas fa-camera fa-lg", icon_color: "#042C76", card_title: "Photography", card_text: "98 skills" },
          { icon: "fas fa-music fa-lg", icon_color: "#042C76", card_title: "Music", card_text: "87 skills" },
          { icon: "fas fa-utensils fa-lg", icon_color: "#042C76", card_title: "Cooking", card_text: "76 skills" },
          { icon: "fas fa-pen fa-lg", icon_color: "#042C76", card_title: "Writing", card_text: "112 skills" }
        ];
        for (let i = 0; i < categoriesCards.length; i++) {
          await conn.query(
            "INSERT INTO landing_page_cards (section_name, icon, icon_color, card_title, card_text, enabled, created_at) VALUES (?,?,?,?,?,?,?)",
            ["categories", categoriesCards[i].icon, categoriesCards[i].icon_color, categoriesCards[i].card_title, categoriesCards[i].card_text, 1, now]
          );
        }

        // Seed skills cards
        const skillsCards = [
          { icon: "fab fa-react fa-2x", icon_color: "#042C76", card_title: "React Development", card_text: "" },
          { icon: "fab fa-python fa-2x", icon_color: "#042C76", card_title: "Python Programming", card_text: "" },
          { icon: "fas fa-camera fa-2x", icon_color: "#042C76", card_title: "Photography", card_text: "" }
        ];
        for (let i = 0; i < skillsCards.length; i++) {
          await conn.query(
            "INSERT INTO landing_page_cards (section_name, icon, icon_color, card_title, card_text, enabled, created_at) VALUES (?,?,?,?,?,?,?)",
            ["skills", skillsCards[i].icon, skillsCards[i].icon_color, skillsCards[i].card_title, skillsCards[i].card_text, 1, now]
          );
        }

        // Seed features cards
        const featuresCards = [
          { icon: "fas fa-users fa-2x", icon_color: "#042C76", card_title: "Connect with Experts", card_text: "Find skilled professionals from various fields to help with your projects." },
          { icon: "fas fa-search fa-2x", icon_color: "#042C76", card_title: "Easy Discovery", card_text: "Use our advanced filters to find the perfect match for your needs." },
          { icon: "fas fa-shield-alt fa-2x", icon_color: "#042C76", card_title: "Secure Platform", card_text: "Your data is protected with industry-standard security measures." }
        ];
        for (let i = 0; i < featuresCards.length; i++) {
          await conn.query(
            "INSERT INTO landing_page_cards (section_name, icon, icon_color, card_title, card_text, enabled, created_at) VALUES (?,?,?,?,?,?,?)",
            ["features", featuresCards[i].icon, featuresCards[i].icon_color, featuresCards[i].card_title, featuresCards[i].card_text, 1, now]
          );
        }
      }
    } catch (e) {
      console.warn("landing page cards seed warning:", e.message);
    }

    // Ensure new columns exist on 'users' table for category, role and consents
    try {
      const [cols] = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
      );
      const names = new Set(cols.map(c => String(c.COLUMN_NAME).toLowerCase()));
      if (!names.has("category")) {
        await conn.query("ALTER TABLE users ADD COLUMN category VARCHAR(100) NULL");
      }
      if (!names.has("role_type")) {
        await conn.query("ALTER TABLE users ADD COLUMN role_type VARCHAR(64) NULL");
      }
      if (!names.has("country_code")) {
        await conn.query("ALTER TABLE users ADD COLUMN country_code VARCHAR(10) NULL");
      }
      if (!names.has("show_in_dashboard")) {
        await conn.query("ALTER TABLE users ADD COLUMN show_in_dashboard TINYINT(1) NOT NULL DEFAULT 0");
      }
      if (!names.has("show_photo")) {
        await conn.query("ALTER TABLE users ADD COLUMN show_photo TINYINT(1) NOT NULL DEFAULT 0");
      }
    } catch (e) {
      // Non-fatal: some MySQL versions/users may lack ALTER privileges in certain environments
      console.warn("users column ensure warning:", e.message);
    }

    // Seed default regions and country mappings if empty
    try {
      // Seed regions
      const [regionCntRows] = await conn.query("SELECT COUNT(*) AS c FROM regions");
      const regionCount = regionCntRows && regionCntRows[0] ? Number(regionCntRows[0].c || 0) : 0;
      if (regionCount === 0) {
        const now = new Date();
        const regions = [
          { name: "India", description: "Indian subcontinent region" },
          { name: "UK & Ireland", description: "United Kingdom and Ireland region" },
          { name: "Singapore", description: "Singapore region" }
        ];
        for (let i = 0; i < regions.length; i++) {
          await conn.query(
            "INSERT INTO regions (name, description, enabled, created_at) VALUES (?,?,?,?)",
            [regions[i].name, regions[i].description, 1, now]
          );
        }
      }

      // Seed country-region mappings
      const [mappingCntRows] = await conn.query("SELECT COUNT(*) AS c FROM country_region_mapping");
      const mappingCount = mappingCntRows && mappingCntRows[0] ? Number(mappingCntRows[0].c || 0) : 0;
      if (mappingCount === 0) {
        const now = new Date();
        const mappings = [
          // India region
          { countryCode: "IN", countryName: "India", regionName: "India" },
          // UK & Ireland region
          { countryCode: "GB", countryName: "United Kingdom", regionName: "UK & Ireland" },
          { countryCode: "IE", countryName: "Ireland", regionName: "UK & Ireland" },
          // Singapore region
          { countryCode: "SG", countryName: "Singapore", regionName: "Singapore" }
        ];

        for (let i = 0; i < mappings.length; i++) {
          // Get region ID
          const [regionRows] = await conn.query("SELECT id FROM regions WHERE name = ? LIMIT 1", [mappings[i].regionName]);
          if (regionRows && regionRows[0]) {
            await conn.query(
              "INSERT INTO country_region_mapping (country_code, country_name, region_id, enabled, created_at) VALUES (?,?,?,?,?)",
              [mappings[i].countryCode, mappings[i].countryName, regionRows[0].id, 1, now]
            );
          }
        }
      }
    } catch (e) {
      console.warn("regions and country mappings seed warning:", e.message);
    }
  } finally {
    conn.release();
  }
}

/* ========== USERS ========== */

async function getUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT * FROM users WHERE LOWER(email_id)=LOWER(?) LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function getUserById(id) {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE id=? LIMIT 1`, [
    id,
  ]);
  return rows[0] || null;
}

/**
 * List users plus their current address (LEFT JOIN).
 * Returns flat rows; caller can map to the API shape.
 */
async function listUsers() {
  const [rows] = await pool.execute(
    `SELECT
       u.*,
       ac.address_line1, ac.address_line2, ac.city, ac.state, ac.postcode, ac.country
     FROM users u
     LEFT JOIN address_current ac ON ac.user_id = u.id
     ORDER BY u.created_at DESC`,
  );
  return rows;
}

async function createUser(u) {
  await pool.execute(
    `INSERT INTO users (
      id, name, first_name, last_name, nick_name, gender,
      country_code, mobile, is_whatsapp_available, whatsapp_number,
      email_id, secondary_email, password_hash,
      summary, work_preference, traveling, availability,
      facebook_url, linkedin_url, created_at,
      role_type, category, show_in_dashboard, show_photo
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      u.id,
      u.name || null,
      u.firstName || null,
      u.lastName || null,
      u.nickName || null,
      u.gender || null,
      u.countryCode || null,
      u.mobile || null,
      u.isWhatsappAvailable ? 1 : 0,
      u.whatsappNumber || null,
      u.emailId,
      u.secondaryEmail || null,
      u.passwordHash || null,
      u.summary || null,
      u.workPreference || null,
      u.traveling || null,
      u.availability || null,
      u.facebookUrl || null,
      u.linkedinUrl || null,
      u.createdAt,
      u.roleType || "user",
      u.category || null,
      u.showInDashboard ? 1 : 0,
      u.showPhoto ? 1 : 0,
    ],
  );
}

/**
 * Update allowed user fields. "patch" is a plain object of column->value.
 * Allowed keys: name, first_name, last_name, nick_name, gender, mobile, secondary_email,
 *               summary, work_preference, traveling, availability
 */
async function updateUserFields(id, patch) {
  const map = {
    name: "name",
    firstName: "first_name",
    lastName: "last_name",
    nickName: "nick_name",
    gender: "gender",
    countryCode: "country_code",
    mobile: "mobile",
    secondaryEmail: "secondary_email",
    summary: "summary",
    workPreference: "work_preference",
    traveling: "traveling",
    availability: "availability",
    roleType: "role_type",
    category: "category",
    showInDashboard: "show_in_dashboard",
    showPhoto: "show_photo",
    // passwordHash intentionally excluded here; use updatePasswordHash
  };
  const sets = [];
  const vals = [];
  Object.entries(map).forEach(([k, col]) => {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      sets.push(`${col} = ?`);
      vals.push(patch[k] ?? null);
    }
  });
  if (!sets.length) return;
  vals.push(id);
  await pool.execute(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, vals);
}

async function updatePasswordHash(id, passwordHash) {
  await pool.execute(`UPDATE users SET password_hash=? WHERE id=?`, [
    passwordHash,
    id,
  ]);
}

/* ========== ADDRESSES ========== */

async function getAddressCurrent(userId) {
  const [rows] = await pool.execute(
    `SELECT address_line1, address_line2, city, state, postcode, country, from_ts
     FROM address_current WHERE user_id=? LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

function addressesDiffer(a = {}, b = {}) {
  const f = ["addressLine1", "addressLine2", "city", "state", "postcode", "country"];
  return f.some((k) => (a[k] || "") !== (b[k] || ""));
}

async function setAddressForUser(userId, newAddr) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [curRows] = await conn.execute(
      `SELECT address_line1, address_line2, city, state, postcode, country, from_ts
       FROM address_current WHERE user_id=? FOR UPDATE`,
      [userId],
    );
    const now = new Date();
    const current = curRows[0]
      ? {
          addressLine1: curRows[0].address_line1 || "",
          addressLine2: curRows[0].address_line2 || "",
          city: curRows[0].city || "",
          state: curRows[0].state || "",
          postcode: curRows[0].postcode || "",
          country: curRows[0].country || "",
          from: curRows[0].from_ts,
        }
      : null;

    const newAddress = {
      addressLine1: newAddr.addressLine1 || "",
      addressLine2: newAddr.addressLine2 || "",
      city: newAddr.city || "",
      state: newAddr.state || "",
      postcode: newAddr.postcode || "",
      country: newAddr.country || "",
    };

    if (!current) {
      await conn.execute(
        `INSERT INTO address_current
          (user_id, address_line1, address_line2, city, state, postcode, country, from_ts)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          userId,
          newAddress.addressLine1,
          newAddress.addressLine2,
          newAddress.city,
          newAddress.state,
          newAddress.postcode,
          newAddress.country,
          now,
        ],
      );
    } else if (addressesDiffer(current, newAddress)) {
      // move current to history
      await conn.execute(
        `INSERT INTO address_history
          (user_id, address_line1, address_line2, city, state, postcode, country, from_ts, to_ts)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          userId,
          current.addressLine1,
          current.addressLine2,
          current.city,
          current.state,
          current.postcode,
          current.country,
          current.from,
          now,
        ],
      );
      // update current
      await conn.execute(
        `UPDATE address_current
           SET address_line1=?, address_line2=?, city=?, state=?, postcode=?, country=?, from_ts=?
         WHERE user_id=?`,
        [
          newAddress.addressLine1,
          newAddress.addressLine2,
          newAddress.city,
          newAddress.state,
          newAddress.postcode,
          newAddress.country,
          now,
          userId,
        ],
      );
    } // else no change
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/* ========== PHOTOS ========== */

async function upsertPhoto(userId, contentType, buffer) {
  const now = new Date();
  await pool.execute(
    `INSERT INTO photos (user_id, content_type, data, uploaded_at)
     VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE content_type=VALUES(content_type), data=VALUES(data), uploaded_at=VALUES(uploaded_at)`,
    [userId, contentType, buffer, now],
  );
}

async function getPhoto(userId) {
  const [rows] = await pool.execute(
    `SELECT content_type, data, uploaded_at FROM photos WHERE user_id=? LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

async function deletePhoto(userId) {
  await pool.execute(`DELETE FROM photos WHERE user_id=?`, [userId]);
}

/**
 * Public users list (only show_in_dashboard=1), optional category filter.
 * Includes a boolean photo_present and current address fields.
 */
async function listPublicUsers(category) {
  const params = [];
  let where = "u.show_in_dashboard = 1";
  if (category) {
    where += " AND u.category = ?";
    params.push(category);
  }
  const [rows] = await pool.execute(
    `SELECT
       u.*,
       ac.address_line1, ac.address_line2, ac.city, ac.state, ac.postcode, ac.country,
       (p.user_id IS NOT NULL) AS photo_present
     FROM users u
     LEFT JOIN address_current ac ON ac.user_id = u.id
     LEFT JOIN photos p ON p.user_id = u.id
     WHERE ${where}
     ORDER BY u.created_at DESC`,
    params,
  );
  return rows;
}

async function listCategories() {
  const [rows] = await pool.execute(
    `SELECT name FROM categories WHERE enabled = 1 ORDER BY name`,
  );
  return rows.map((r) => r.name);
}

async function listAllCategories() {
  const [rows] = await pool.execute(
    `SELECT id, name, enabled, created_at FROM categories ORDER BY name`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    enabled: r.enabled === 1,
    createdAt:
      r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}

async function createCategory({ name, enabled = true }) {
  const now = new Date();
  await pool.execute(
    `INSERT INTO categories (name, enabled, created_at) VALUES (?,?,?)`,
    [name, enabled ? 1 : 0, now],
  );
}

async function updateCategory(id, patch) {
  const sets = [];
  const vals = [];
  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    sets.push("name = ?");
    vals.push(patch.name);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "enabled")) {
    sets.push("enabled = ?");
    vals.push(patch.enabled ? 1 : 0);
  }
  if (!sets.length) return;
  vals.push(id);
  await pool.execute(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`, vals);
}

async function deleteCategory(id) {
  await pool.execute(`DELETE FROM categories WHERE id = ?`, [id]);
}

async function listCountries() {
  const [rows] = await pool.execute(
    `SELECT name, code, phone_code FROM countries WHERE enabled = 1 ORDER BY name`,
  );
  return rows.map((r) => ({ name: r.name, code: r.code, phoneCode: r.phone_code }));
}

async function listAllCountries() {
  const [rows] = await pool.execute(
    `SELECT id, name, code, phone_code, enabled, created_at FROM countries ORDER BY name`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    phoneCode: r.phone_code,
    enabled: r.enabled === 1,
    createdAt:
      r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}

async function createCountry({ name, code, phoneCode = '', enabled = true }) {
  const now = new Date();
  await pool.execute(
    `INSERT INTO countries (name, code, phone_code, enabled, created_at) VALUES (?,?,?,?,?)`,
    [name, code.toUpperCase(), phoneCode, enabled ? 1 : 0, now],
  );
}

async function updateCountry(id, patch) {
  const sets = [];
  const vals = [];
  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    sets.push("name = ?");
    vals.push(patch.name);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "code")) {
    sets.push("code = ?");
    vals.push(patch.code.toUpperCase());
  }
  if (Object.prototype.hasOwnProperty.call(patch, "phoneCode")) {
    sets.push("phone_code = ?");
    vals.push(patch.phoneCode);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "enabled")) {
    sets.push("enabled = ?");
    vals.push(patch.enabled ? 1 : 0);
  }
  if (!sets.length) return;
  vals.push(id);
  await pool.execute(`UPDATE countries SET ${sets.join(", ")} WHERE id = ?`, vals);
}

async function deleteCountry(id) {
  await pool.execute(`DELETE FROM countries WHERE id = ?`, [id]);
}

async function listLandingPageCards(sectionName) {
  const params = [];
  let where = "enabled = 1";
  if (sectionName) {
    where += " AND section_name = ?";
    params.push(sectionName);
  }
  const [rows] = await pool.execute(
    `SELECT id, section_name, icon, icon_color, card_title, card_text, enabled, created_at FROM landing_page_cards WHERE ${where} ORDER BY card_title`,
    params,
  );
  return rows.map((r) => ({
    id: r.id,
    sectionName: r.section_name,
    icon: r.icon,
    icon_color: r.icon_color,
    cardTitle: r.card_title,
    cardText: r.card_text,
    enabled: r.enabled === 1,
    createdAt:
      r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}

async function listAllLandingPageCards(sectionName) {
  const params = [];
  let where = "1=1";
  if (sectionName) {
    where += " AND section_name = ?";
    params.push(sectionName);
  }
  const [rows] = await pool.execute(
    `SELECT id, section_name, icon, icon_color, card_title, card_text, enabled, created_at FROM landing_page_cards WHERE ${where} ORDER BY section_name, card_title`,
    params,
  );
  return rows.map((r) => ({
    id: r.id,
    sectionName: r.section_name,
    icon: r.icon,
    icon_color: r.icon_color,
    cardTitle: r.card_title,
    cardText: r.card_text,
    enabled: r.enabled === 1,
    createdAt:
      r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}

async function createLandingPageCard({ sectionName = 'categories', icon, icon_color = '#042C76', cardTitle, cardText = '', enabled = true }) {
  const now = new Date();
  await pool.execute(
    `INSERT INTO landing_page_cards (section_name, icon, icon_color, card_title, card_text, enabled, created_at) VALUES (?,?,?,?,?,?,?)`,
    [sectionName, icon, icon_color, cardTitle, cardText, enabled ? 1 : 0, now],
  );
}

async function updateLandingPageCard(id, patch) {
  const sets = [];
  const vals = [];
  if (Object.prototype.hasOwnProperty.call(patch, "sectionName")) {
    sets.push("section_name = ?");
    vals.push(patch.sectionName);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "icon")) {
    sets.push("icon = ?");
    vals.push(patch.icon);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "icon_color")) {
    sets.push("icon_color = ?");
    vals.push(patch.icon_color);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "cardTitle")) {
    sets.push("card_title = ?");
    vals.push(patch.cardTitle);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "cardText")) {
    sets.push("card_text = ?");
    vals.push(patch.cardText);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "enabled")) {
    sets.push("enabled = ?");
    vals.push(patch.enabled ? 1 : 0);
  }
  if (!sets.length) return;
  vals.push(id);
  await pool.execute(`UPDATE landing_page_cards SET ${sets.join(", ")} WHERE id = ?`, vals);
}

async function deleteLandingPageCard(id) {
  await pool.execute(`DELETE FROM landing_page_cards WHERE id = ?`, [id]);
}

/* ========== FEEDBACK ========== */

async function createFeedback(userId, query) {
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO feedback (user_id, query, status, created_at) VALUES (?, ?, 'pending', ?)`,
    [userId, query, now],
  );
  return result.insertId;
}

async function getUserFeedback(userId) {
  const [rows] = await pool.execute(
    `SELECT id, query, response, status, created_at, responded_at FROM feedback WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    query: r.query,
    response: r.response,
    status: r.status,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    respondedAt: r.responded_at instanceof Date ? r.responded_at.toISOString() : r.responded_at,
  }));
}

async function getAllFeedback() {
  const [rows] = await pool.execute(
    `SELECT f.id, f.query, f.response, f.status, f.created_at, f.responded_at,
            u.first_name, u.last_name, u.email_id
     FROM feedback f
     JOIN users u ON f.user_id = u.id
     ORDER BY f.created_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    query: r.query,
    response: r.response,
    status: r.status,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    respondedAt: r.responded_at instanceof Date ? r.responded_at.toISOString() : r.responded_at,
    userName: [r.first_name, r.last_name].filter(Boolean).join(" ").trim(),
    userEmail: r.email_id,
  }));
}

async function respondToFeedback(feedbackId, response) {
  const now = new Date();
  await pool.execute(
    `UPDATE feedback SET response = ?, status = 'responded', responded_at = ? WHERE id = ?`,
    [response, now, feedbackId],
  );
}

/* ========== BUYER ENGAGED LIST ========== */

async function createBuyerEngaged(buyerUserId, sellerUserId) {
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO buyer_engaged_list (buyer_user_id, seller_user_id, date_skills_used, created_at) VALUES (?, ?, ?, ?)`,
    [buyerUserId, sellerUserId, now, now],
  );
  return result.insertId;
}

async function getBuyerEngagedList(buyerUserId) {
  const [rows] = await pool.execute(
    `SELECT bel.id, bel.date_skills_used, bel.rating, bel.rating_date,
            u.id as seller_id, u.first_name, u.last_name, u.nick_name, u.category
     FROM buyer_engaged_list bel
     JOIN users u ON bel.seller_user_id = u.id
     WHERE bel.buyer_user_id = ?
     ORDER BY bel.date_skills_used DESC`,
    [buyerUserId],
  );
  return rows.map((r) => ({
    id: r.id,
    sellerId: r.seller_id,
    sellerName: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || r.nick_name,
    sellerCategory: r.category,
    dateSkillsUsed: r.date_skills_used instanceof Date ? r.date_skills_used.toISOString() : r.date_skills_used,
    rating: r.rating,
    ratingDate: r.rating_date instanceof Date ? r.rating_date.toISOString() : r.rating_date,
  }));
}

async function updateEngagedRating(engagedId, rating) {
  const now = new Date();
  await pool.execute(
    `UPDATE buyer_engaged_list SET rating = ?, rating_date = ? WHERE id = ?`,
    [rating, now, engagedId],
  );
}

async function getUserAverageRating(userId) {
  const [rows] = await pool.execute(
    `SELECT AVG(rating) as average_rating, COUNT(*) as total_ratings
     FROM buyer_engaged_list
     WHERE seller_user_id = ? AND rating IS NOT NULL`,
    [userId],
  );
  const result = rows[0];
  return {
    averageRating: result.average_rating ? parseFloat(result.average_rating.toFixed(1)) : null,
    totalRatings: result.total_ratings || 0,
  };
}

/* ========== REGIONS ========== */

async function listRegions() {
  const [rows] = await pool.execute(
    `SELECT id, name, description, enabled, created_at FROM regions ORDER BY name`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    enabled: r.enabled === 1,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}

async function createRegion({ name, description = '', enabled = true }) {
  const now = new Date();
  await pool.execute(
    `INSERT INTO regions (name, description, enabled, created_at) VALUES (?,?,?,?)`,
    [name, description, enabled ? 1 : 0, now],
  );
}

async function updateRegion(id, patch) {
  const sets = [];
  const vals = [];
  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    sets.push("name = ?");
    vals.push(patch.name);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "description")) {
    sets.push("description = ?");
    vals.push(patch.description);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "enabled")) {
    sets.push("enabled = ?");
    vals.push(patch.enabled ? 1 : 0);
  }
  if (!sets.length) return;
  vals.push(id);
  await pool.execute(`UPDATE regions SET ${sets.join(", ")} WHERE id = ?`, vals);
}

async function deleteRegion(id) {
  await pool.execute(`DELETE FROM regions WHERE id = ?`, [id]);
}

async function listCountryRegionMappings() {
  const [rows] = await pool.execute(
    `SELECT crm.id, crm.country_code, crm.country_name, crm.enabled, crm.created_at,
            r.id as region_id, r.name as region_name, r.description as region_description
     FROM country_region_mapping crm
     JOIN regions r ON crm.region_id = r.id
     ORDER BY r.name, crm.country_name`,
  );
  return rows.map((r) => ({
    id: r.id,
    countryCode: r.country_code,
    countryName: r.country_name,
    regionId: r.region_id,
    regionName: r.region_name,
    regionDescription: r.region_description,
    enabled: r.enabled === 1,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}

async function createCountryRegionMapping({ countryCode, countryName, regionId, enabled = true }) {
  const now = new Date();
  await pool.execute(
    `INSERT INTO country_region_mapping (country_code, country_name, region_id, enabled, created_at) VALUES (?,?,?,?,?)`,
    [countryCode.toUpperCase(), countryName, regionId, enabled ? 1 : 0, now],
  );
}

async function updateCountryRegionMapping(id, patch) {
  const sets = [];
  const vals = [];
  if (Object.prototype.hasOwnProperty.call(patch, "countryCode")) {
    sets.push("country_code = ?");
    vals.push(patch.countryCode.toUpperCase());
  }
  if (Object.prototype.hasOwnProperty.call(patch, "countryName")) {
    sets.push("country_name = ?");
    vals.push(patch.countryName);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "regionId")) {
    sets.push("region_id = ?");
    vals.push(patch.regionId);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "enabled")) {
    sets.push("enabled = ?");
    vals.push(patch.enabled ? 1 : 0);
  }
  if (!sets.length) return;
  vals.push(id);
  await pool.execute(`UPDATE country_region_mapping SET ${sets.join(", ")} WHERE id = ?`, vals);
}

async function deleteCountryRegionMapping(id) {
  await pool.execute(`DELETE FROM country_region_mapping WHERE id = ?`, [id]);
}

async function getUserRegion(userId) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.name, r.description
     FROM users u
     JOIN address_current ac ON u.id = ac.user_id
     JOIN country_region_mapping crm ON ac.country = crm.country_name AND crm.enabled = 1
     JOIN regions r ON crm.region_id = r.id AND r.enabled = 1
     WHERE u.id = ? LIMIT 1`,
    [userId],
  );
  return rows[0] ? {
    id: rows[0].id,
    name: rows[0].name,
    description: rows[0].description,
  } : null;
}

async function listPublicUsersInRegion(regionId, category) {
  const params = [regionId];
  let where = `u.show_in_dashboard = 1 AND crm.region_id = ? AND crm.enabled = 1 AND r.enabled = 1`;
  if (category) {
    where += " AND u.category = ?";
    params.push(category);
  }
  const [rows] = await pool.execute(
    `SELECT
       u.*,
       ac.address_line1, ac.address_line2, ac.city, ac.state, ac.postcode, ac.country,
       (p.user_id IS NOT NULL) AS photo_present
     FROM users u
     LEFT JOIN address_current ac ON ac.user_id = u.id
     LEFT JOIN photos p ON p.user_id = u.id
     JOIN country_region_mapping crm ON ac.country = crm.country_name
     JOIN regions r ON crm.region_id = r.id
     WHERE ${where}
     ORDER BY u.created_at DESC`,
    params,
  );
  return rows;
}

/* ========== MESSAGES ========== */

async function sendMessage(senderId, receiverId, subject, content) {
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO messages (sender_id, receiver_id, subject, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [senderId, receiverId, subject, content, now, now],
  );
  return result.insertId;
}

async function getUserMessages(userId) {
  const [rows] = await pool.execute(
    `SELECT m.id, m.subject, m.content, m.is_read, m.created_at, m.updated_at,
            sender.id as sender_id, sender.first_name as sender_first_name, sender.last_name as sender_last_name, sender.nick_name as sender_nick_name,
            receiver.id as receiver_id, receiver.first_name as receiver_first_name, receiver.last_name as receiver_last_name, receiver.nick_name as receiver_nick_name
     FROM messages m
     JOIN users sender ON m.sender_id = sender.id
     JOIN users receiver ON m.receiver_id = receiver.id
     WHERE m.sender_id = ? OR m.receiver_id = ?
     ORDER BY m.created_at DESC`,
    [userId, userId],
  );
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    content: r.content,
    isRead: r.is_read === 1,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    sender: {
      id: r.sender_id,
      name: [r.sender_first_name, r.sender_last_name].filter(Boolean).join(" ").trim() || r.sender_nick_name,
    },
    receiver: {
      id: r.receiver_id,
      name: [r.receiver_first_name, r.receiver_last_name].filter(Boolean).join(" ").trim() || r.receiver_nick_name,
    },
    // Determine if current user is sender or receiver
    isSentByMe: r.sender_id === userId,
  }));
}

async function markMessageAsRead(messageId, userId) {
  // Only mark as read if the user is the receiver
  const now = new Date();
  await pool.execute(
    `UPDATE messages SET is_read = 1, updated_at = ? WHERE id = ? AND receiver_id = ?`,
    [now, messageId, userId],
  );
}

async function getUnreadMessageCount(userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = ? AND is_read = 0`,
    [userId],
  );
  return rows[0] ? rows[0].unread_count : 0;
}


module.exports = {
  pool,
  initSchema,
  // users
  getUserByEmail,
  getUserById,
  listUsers,
  listPublicUsers,
  createUser,
  updateUserFields,
  updatePasswordHash,
  // categories
  listCategories,
  listAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // countries
  listCountries,
  listAllCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  // landing page cards
  listLandingPageCards,
  listAllLandingPageCards,
  createLandingPageCard,
  updateLandingPageCard,
  deleteLandingPageCard,
  // addresses
  getAddressCurrent,
  setAddressForUser,
  // photos
  upsertPhoto,
  getPhoto,
  deletePhoto,
  // feedback
  createFeedback,
  getUserFeedback,
  getAllFeedback,
  respondToFeedback,
  // buyer engaged list
  createBuyerEngaged,
  getBuyerEngagedList,
  updateEngagedRating,
  getUserAverageRating,
  // regions
  listRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  listCountryRegionMappings,
  createCountryRegionMapping,
  updateCountryRegionMapping,
  deleteCountryRegionMapping,
  getUserRegion,
  listPublicUsersInRegion,
  // messages
  sendMessage,
  getUserMessages,
  markMessageAsRead,
  getUnreadMessageCount,
};
