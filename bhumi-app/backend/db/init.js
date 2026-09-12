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
  role TEXT NOT NULL CHECK(role IN ('central','state','district','agency','farmer')),
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
`);

module.exports = db;
