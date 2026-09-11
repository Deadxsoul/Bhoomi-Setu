// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/init');

const router = express.Router();
const OTP_DEV_MODE = process.env.OTP_DEV_MODE === 'true';

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function issueToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
}

// ---------- 1. Mobile + OTP login (primary flow) ----------

// Step 1: request a code for a phone number
router.post('/otp/send', (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });
  }
  const code = genOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO otp_codes (phone, code, purpose, expires_at) VALUES (?, ?, 'login', ?)`)
    .run(phone, code, expiresAt);

  // Simulated SMS — never wired to a real provider in this demo.
  console.log(`[OTP] login code for ${phone}: ${code}`);

  res.json({
    sent: true,
    ...(OTP_DEV_MODE ? { devOtp: code } : {}),
  });
});

// Step 2: verify the code, create the user on first login, issue a JWT
router.post('/otp/verify', (req, res) => {
  const { phone, code } = req.body;
  const row = db.prepare(`
    SELECT * FROM otp_codes
    WHERE phone = ? AND code = ? AND purpose = 'login' AND used = 0
    ORDER BY id DESC LIMIT 1
  `).get(phone, code);

  if (!row) return res.status(400).json({ error: 'Incorrect or expired code' });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Code expired, request a new one' });

  db.prepare(`UPDATE otp_codes SET used = 1 WHERE id = ?`).run(row.id);

  let user = db.prepare(`SELECT * FROM users WHERE phone = ?`).get(phone);
  if (!user) {
    // New number — create a bare farmer account; role can be changed by an
    // admin later, and profile details are filled in after Aadhaar verification.
    const result = db.prepare(`INSERT INTO users (name, phone, role) VALUES (?, ?, 'farmer')`)
      .run('New user', phone);
    user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(result.lastInsertRowid);
  }

  const token = issueToken({ id: user.id, role: user.role, phone: user.phone, guest: false });
  res.json({ token, user });
});

// ---------- 2. Guest mode ----------
router.post('/guest', (req, res) => {
  const token = issueToken({ guest: true, role: 'guest' });
  res.json({ token });
});

// ---------- 3. Role quick-access (demo convenience only) ----------
// NOTE: this endpoint exists so a judge can open each role in one click
// during the demo. It must be removed or gated behind a real admin check
// before any non-demo deployment.
router.post('/demo-login', (req, res) => {
  const { role } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE role = ?`).get(role);
  if (!user) return res.status(404).json({ error: 'No demo account for that role — run npm run seed' });
  const token = issueToken({ id: user.id, role: user.role, phone: user.phone, guest: false });
  res.json({ token, user });
});

// ---------- 4. Google login ----------
// Real Google OAuth needs a Client ID from Google Cloud Console (frontend)
// plus verifying the id_token here (backend). Wired as a clear stub until
// those credentials exist — see README "Enabling Google login".
router.post('/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({ error: 'Google login not configured yet — see README' });
  }
  res.status(501).json({ error: 'TODO: verify Google id_token and issue a session' });
});

// ---------- 5. Aadhaar-linked verification (used inside the app, not at login) ----------
// Step 1: user submits their Aadhaar number to start land registration
router.post('/aadhaar/send', (req, res) => {
  const { userId, aadhaarNumber } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!/^\d{12}$/.test(aadhaarNumber || '')) {
    return res.status(400).json({ error: 'Enter a valid 12-digit Aadhaar number' });
  }

  db.prepare(`UPDATE users SET aadhaar_number = ? WHERE id = ?`).run(aadhaarNumber, userId);

  const code = genOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO otp_codes (phone, code, purpose, expires_at) VALUES (?, ?, 'aadhaar', ?)`)
    .run(user.phone, code, expiresAt);

  console.log(`[OTP] Aadhaar-verification code for ${user.phone}: ${code}`);
  res.json({ sent: true, ...(OTP_DEV_MODE ? { devOtp: code } : {}) });
});

// Step 2: verify the code sent to the phone registered against that Aadhaar number
router.post('/aadhaar/verify', (req, res) => {
  const { userId, code } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const row = db.prepare(`
    SELECT * FROM otp_codes
    WHERE phone = ? AND code = ? AND purpose = 'aadhaar' AND used = 0
    ORDER BY id DESC LIMIT 1
  `).get(user.phone, code);

  if (!row) return res.status(400).json({ error: 'Incorrect or expired code' });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Code expired, request a new one' });

  db.prepare(`UPDATE otp_codes SET used = 1 WHERE id = ?`).run(row.id);
  db.prepare(`UPDATE users SET aadhaar_verified = 1 WHERE id = ?`).run(userId);

  res.json({ verified: true });
});

module.exports = router;
