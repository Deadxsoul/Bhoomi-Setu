// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

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

  const token = issueToken({ id: user.id, role: user.role, phone: user.phone, state: user.state, district: user.district, guest: false });
  res.json({ token, user });
});

// ---------- 1b. Rehydrate the current session (used on page refresh) ----------
router.get('/me', requireAuth, (req, res) => {
  if (req.user.guest) return res.json({ guest: true });
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ---------- 1c. Edit profile (name / contact details / language) ----------
router.patch('/me', requireAuth, (req, res) => {
  if (req.user.guest) return res.status(403).json({ error: 'Guests have nothing to edit — sign in to save a profile' });
  const { name, email, village, district, state, language } = req.body;

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name !== undefined && !String(name).trim()) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  if (language !== undefined && !['en', 'hi'].includes(language)) {
    return res.status(400).json({ error: "Language must be 'en' or 'hi'" });
  }

  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      village = COALESCE(?, village),
      district = COALESCE(?, district),
      state = COALESCE(?, state),
      language = COALESCE(?, language)
    WHERE id = ?
  `).run(
    name !== undefined ? String(name).trim() : null,
    email !== undefined ? (email || null) : null,
    village !== undefined ? (village || null) : null,
    district !== undefined ? (district || null) : null,
    state !== undefined ? (state || null) : null,
    language !== undefined ? language : null,
    req.user.id
  );

  const updated = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  res.json({ user: updated });
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
  const token = issueToken({ id: user.id, role: user.role, phone: user.phone, state: user.state, district: user.district, guest: false });
  res.json({ token, user });
});

// ---------- 4. Google login (simulated, same convention as OTP/Aadhaar) ----------
// Real Google OAuth needs a Client ID from Google Cloud Console + verifying
// the id_token server-side. That's out of scope for a hackathon demo (needs
// a real Google Cloud account), so this issues a session for a demo Google
// account instead — clearly labeled, same pattern as OTP_DEV_MODE.
router.post('/google', (req, res) => {
  const demoEmail = 'demo.google.user@bhumi.app';
  let user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(demoEmail);
  if (!user) {
    const info = db
      .prepare(`INSERT INTO users (name, email, phone, role, aadhaar_verified) VALUES (?, ?, ?, 'farmer', 0)`)
      .run('Demo Google User', demoEmail, '9999999999');
    user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(info.lastInsertRowid);
  }
  const token = issueToken({ id: user.id, role: user.role, state: user.state, district: user.district, guest: false });
  res.json({ token, user, simulated: true });
});

// ---------- 5. Land registration (used inside the app, not at login) ----------
// Step 1: user fills the full registration form; we save it and send an
// OTP to the phone on file to confirm it's really them before it counts.
router.post('/aadhaar/send', (req, res) => {
  const {
    userId, aadhaarNumber, fullName, dateOfBirth, landId,
    fatherName, village, district, state, surveyNumber, landAreaAcres,
  } = req.body;

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!/^\d{12}$/.test(aadhaarNumber || '')) {
    return res.status(400).json({ error: 'Enter a valid 12-digit Aadhaar number' });
  }
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Enter the name as it appears on the Aadhaar card' });
  }
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return res.status(400).json({ error: 'Enter a valid date of birth' });
  }
  if (!landId || !landId.trim()) {
    return res.status(400).json({ error: 'Enter the land / parcel ID' });
  }

  db.prepare(`
    UPDATE users SET
      aadhaar_number = ?, name = ?, date_of_birth = ?, land_id = ?,
      father_name = ?, village = ?, district = COALESCE(?, district),
      state = COALESCE(?, state), survey_number = ?, land_area_acres = ?
    WHERE id = ?
  `).run(
    aadhaarNumber, fullName.trim(), dateOfBirth, landId.trim(),
    fatherName || null, village || null, district || null,
    state || null, surveyNumber || null, landAreaAcres || null,
    userId
  );

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

  const updatedUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  res.json({ verified: true, user: updatedUser });
});

module.exports = router;
