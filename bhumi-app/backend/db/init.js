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
`);

module.exports = db;
