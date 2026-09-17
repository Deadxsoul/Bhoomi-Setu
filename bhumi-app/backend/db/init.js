// db/init.js
// Creates and returns a SQLite database connection with the schema for Bhumi.

const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'bhumi.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
-- ===================== USERS / ROLES =====================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  google_id TEXT UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('central','state','district','agency','farmer','police')),
  state TEXT,
  district TEXT,
  land_id TEXT,                 -- used when role = 'farmer'
  aadhaar_number TEXT,          -- simulated, never a real UIDAI value in this demo
  aadhaar_verified INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',   -- 'en' | 'hi'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===================== OTP CODES (login + aadhaar-linked verification) ====
CREATE TABLE IF NOT EXISTS otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('login','aadhaar')),
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===================== PROJECTS =====================
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,                     -- highway, railway, irrigation, industrial, urban
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  implementing_agency TEXT,
  status TEXT DEFAULT 'proposed' CHECK(status IN ('proposed','notified','awarded','possession','completed','rejected')),
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ===================== PROPOSAL WORKFLOW =====================
CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  stage TEXT DEFAULT 'submitted' CHECK(stage IN ('submitted','district_review','state_review','central_review','approved','rejected')),
  remarks TEXT,
  submitted_by INTEGER,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (submitted_by) REFERENCES users(id)
);

-- ===================== LAND PARCELS (GIS) =====================
CREATE TABLE IF NOT EXISTS land_parcels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  parcel_code TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  owner_contact TEXT,
  area_acres REAL,
  latitude REAL,
  longitude REAL,
  geojson TEXT,                  -- polygon boundary (stringified GeoJSON)
  base_rate REAL DEFAULT 0,
  location_factor REAL DEFAULT 1.0,
  connectivity_bonus REAL DEFAULT 0,
  dispute_count INTEGER DEFAULT 0,     -- used for litigation risk badge
  status TEXT DEFAULT 'identified' CHECK(status IN ('identified','notified','compensated','possessed','unused')),
  before_image_url TEXT,         -- for satellite encroachment check
  after_image_url TEXT,
  encroachment_pct REAL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- ===================== COMPENSATION =====================
CREATE TABLE IF NOT EXISTS compensation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parcel_id INTEGER NOT NULL,
  amount_assessed REAL,
  amount_paid REAL DEFAULT 0,
  breakdown_json TEXT,           -- explainable calculator breakdown
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','partial','paid')),
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parcel_id) REFERENCES land_parcels(id)
);

-- ===================== POSSESSION =====================
CREATE TABLE IF NOT EXISTS possession (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parcel_id INTEGER NOT NULL,
  handed_over INTEGER DEFAULT 0, -- 0/1 boolean
  handover_date TEXT,
  verified_by INTEGER,
  FOREIGN KEY (parcel_id) REFERENCES land_parcels(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- ===================== REHABILITATION & RESETTLEMENT =====================
CREATE TABLE IF NOT EXISTS rehabilitation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parcel_id INTEGER NOT NULL,
  family_name TEXT,
  family_size INTEGER,
  monthly_income REAL,
  agriculture_dependency REAL,   -- 0-1 fraction of income from agriculture
  resettled INTEGER DEFAULT 0,
  priority_score REAL,
  FOREIGN KEY (parcel_id) REFERENCES land_parcels(id)
);

-- ===================== DOCUMENTS =====================
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parcel_id INTEGER,
  project_id INTEGER,
  filename TEXT,
  filepath TEXT,
  file_hash TEXT,
  version INTEGER DEFAULT 1,
  uploaded_by INTEGER,
  is_duplicate INTEGER DEFAULT 0,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ===================== NOTIFICATIONS =====================
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT,
  channel TEXT DEFAULT 'app' CHECK(channel IN ('app','email','sms')),
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===================== STATE RANKING (gamification cache) =====================
CREATE TABLE IF NOT EXISTS state_stats (
  state TEXT PRIMARY KEY,
  speed_score REAL DEFAULT 0,
  transparency_score REAL DEFAULT 0,
  satisfaction_score REAL DEFAULT 0,
  total_score REAL DEFAULT 0
);

-- ===================== LAND MARKETPLACE (peer sale/purchase) =====================
-- Separate from the acquisition workflow above: this is a farmer selling land
-- to another private buyer, verified by a police officer before it's final.
CREATE TABLE IF NOT EXISTS land_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  land_id TEXT NOT NULL,
  survey_number TEXT,
  village TEXT,
  district TEXT,
  state TEXT,
  area_acres REAL,
  agreed_price REAL,

  initiated_by INTEGER NOT NULL,      -- the logged-in user who filled the form
  initiated_as TEXT NOT NULL CHECK(initiated_as IN ('seller','buyer')),

  seller_user_id INTEGER,             -- set if the seller is a registered user
  seller_name TEXT NOT NULL,
  seller_aadhaar TEXT,
  seller_contact TEXT,

  buyer_user_id INTEGER,              -- set if the buyer is a registered user
  buyer_name TEXT NOT NULL,
  buyer_aadhaar TEXT,
  buyer_contact TEXT,

  status TEXT DEFAULT 'police_verification' CHECK(status IN ('police_verification','sold','rejected')),
  approx_verification_days INTEGER DEFAULT 7,
  verifying_officer_id INTEGER,
  verification_notes TEXT,
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  verified_at TEXT,

  FOREIGN KEY (initiated_by) REFERENCES users(id),
  FOREIGN KEY (seller_user_id) REFERENCES users(id),
  FOREIGN KEY (buyer_user_id) REFERENCES users(id),
  FOREIGN KEY (verifying_officer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transaction_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  doc_type TEXT NOT NULL,   -- title_deed, encumbrance_certificate, property_tax_receipt,
                            -- seller_id_proof, buyer_id_proof, sale_agreement
  filename TEXT,
  filepath TEXT,
  uploaded_by INTEGER,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES land_transactions(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ===================== LAND HISTORY TRACKER (append-only event log) =====================
-- Most other tables (compensation, possession, proposals, rehabilitation) only
-- store their CURRENT state — updates overwrite the previous value, so there's
-- no way to show "what happened, and when" for a piece of land. This table is
-- written to (never edited) every time one of those tables changes, so the
-- Land History page can render a real, dated, order-tracking-style timeline.
-- 'transaction' category is not used for writes (the land_transactions table
-- already holds full history of every private deal); it's reserved so this
-- table can stay the single source of truth if that ever changes.
CREATE TABLE IF NOT EXISTS land_history_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  land_id TEXT NOT NULL,             -- matches land_parcels.parcel_code / land_transactions.land_id
  category TEXT NOT NULL CHECK(category IN ('transaction','government')),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'done' CHECK(status IN ('done','active','rejected')),
  amount REAL,
  event_date TEXT DEFAULT CURRENT_TIMESTAMP,
  related_transaction_id INTEGER,
  related_parcel_id INTEGER,
  created_by INTEGER,
  FOREIGN KEY (related_transaction_id) REFERENCES land_transactions(id),
  FOREIGN KEY (related_parcel_id) REFERENCES land_parcels(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
`);

// ---- Migration: existing databases were created with an older CHECK
// constraint that doesn't allow role = 'police'. SQLite can't alter a CHECK
// constraint directly, so if the old constraint is still baked into the
// table, rebuild it. Important: we build the replacement under a temporary
// name and rename it INTO 'users' at the end (rather than renaming 'users'
// away first) — renaming 'users' away causes SQLite to silently rewrite
// every other table's foreign key to point at the new name, which then
// blocks dropping it. Building under a temp name avoids that entirely.
const usersTableSql = db.prepare(
  `SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`
).get()?.sql || '';

if (usersTableSql && !usersTableSql.includes("'police'")) {
  db.pragma('foreign_keys = OFF');
  db.transaction(() => {
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE,
        email TEXT UNIQUE,
        google_id TEXT UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('central','state','district','agency','farmer','police')),
        state TEXT,
        district TEXT,
        land_id TEXT,
        aadhaar_number TEXT,
        aadhaar_verified INTEGER DEFAULT 0,
        language TEXT DEFAULT 'en',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const oldCols = db.prepare(`PRAGMA table_info(users)`).all().map((c) => c.name);
    const commonCols = [
      'id', 'name', 'phone', 'email', 'google_id', 'role', 'state', 'district',
      'land_id', 'aadhaar_number', 'aadhaar_verified', 'language', 'created_at',
    ].filter((c) => oldCols.includes(c));
    db.exec(`INSERT INTO users_new (${commonCols.join(',')}) SELECT ${commonCols.join(',')} FROM users`);
    db.exec(`DROP TABLE users`);
    db.exec(`ALTER TABLE users_new RENAME TO users`);
  })();
  db.pragma('foreign_keys = ON');
}

// ---- Lightweight migration: add registration-form fields if this is an
// existing database created before they existed. Safe to run every boot.
const userColumns = db.prepare(`PRAGMA table_info(users)`).all().map((c) => c.name);
const migrations = {
  date_of_birth: `ALTER TABLE users ADD COLUMN date_of_birth TEXT`,
  father_name: `ALTER TABLE users ADD COLUMN father_name TEXT`,
  village: `ALTER TABLE users ADD COLUMN village TEXT`,
  survey_number: `ALTER TABLE users ADD COLUMN survey_number TEXT`,
  land_area_acres: `ALTER TABLE users ADD COLUMN land_area_acres REAL`,
};
for (const [col, sql] of Object.entries(migrations)) {
  if (!userColumns.includes(col)) db.exec(sql);
}

module.exports = db;
