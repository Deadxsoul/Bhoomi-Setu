// routes/notifications.js
// Notifications & Alerts. In production, an 'email'/'sms' channel record
// here would trigger an actual SMTP send or Twilio SMS API call; for this
// demo they're stored and shown in-app (console-logged as a stand-in).
const express = require('express');
const db = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(rows);
});

router.patch('/:id/read', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ id: req.params.id, is_read: true });
});

// Internal helper other routes could import to raise a notification + simulate send
function notify(userId, message, channel = 'app') {
  db.prepare('INSERT INTO notifications (user_id, message, channel) VALUES (?, ?, ?)').run(userId, message, channel);
  if (channel !== 'app') {
    console.log(`[SIMULATED ${channel.toUpperCase()}] → user ${userId}: ${message}`);
  }
}

module.exports = router;
module.exports.notify = notify;
