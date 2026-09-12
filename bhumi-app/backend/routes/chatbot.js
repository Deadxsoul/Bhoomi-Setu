// routes/chatbot.js
// WhatsApp/SMS Chatbot for Farmers (simulated here as a web endpoint —
// in production this same logic would sit behind the Twilio WhatsApp API
// webhook, keyed by the farmer's phone number instead of a web session).
// Farmers message their Land ID (in their own language, in a real deploy
// via a translation layer) and get compensation + possession status back.
const express = require('express');
const db = require('../db/init');

const router = express.Router();

const RESPONSES = {
  en: {
    notFound: (id) => `❌ No land record found for Land ID "${id}". Please check the ID and try again.`,
    status: (p, c, pos) => [
      `📍 Land ID: ${p.parcel_code}`,
      `Owner: ${p.owner_name}`,
      `Status: ${p.status}`,
      c ? `💰 Compensation assessed: ₹${c.amount_assessed.toLocaleString('en-IN')}` : `💰 Compensation: not yet assessed`,
      c ? `Paid so far: ₹${c.amount_paid.toLocaleString('en-IN')} (${c.status})` : '',
      pos ? `🏗️ Possession handed over: ${pos.handed_over ? 'Yes, on ' + pos.handover_date : 'Not yet'}` : `🏗️ Possession: pending`,
    ].filter(Boolean).join('\n'),
  },
  hi: {
    notFound: (id) => `❌ Land ID "${id}" ke liye koi record nahi mila. Kripya ID check karke dobara try karein.`,
    status: (p, c, pos) => [
      `📍 Land ID: ${p.parcel_code}`,
      `Malik: ${p.owner_name}`,
      `Sthiti: ${p.status}`,
      c ? `💰 Mulyankit muawza: ₹${c.amount_assessed.toLocaleString('en-IN')}` : `💰 Muawza: abhi tak nahi hua`,
      c ? `Ab tak bhugtaan: ₹${c.amount_paid.toLocaleString('en-IN')} (${c.status})` : '',
      pos ? `🏗️ Kabza: ${pos.handed_over ? 'Ho chuka, ' + pos.handover_date + ' ko' : 'Abhi nahi'}` : `🏗️ Kabza: lambit`,
    ].filter(Boolean).join('\n'),
  },
};

// POST /api/chatbot/query  { land_id, lang: 'en'|'hi' }
// No auth required — this mirrors an open WhatsApp/SMS number farmers text.
router.post('/query', (req, res) => {
  const { land_id, lang } = req.body;
  const language = RESPONSES[lang] ? lang : 'en';
  const R = RESPONSES[language];

  if (!land_id) return res.status(400).json({ reply: R.notFound('(empty)') });

  const parcel = db.prepare('SELECT * FROM land_parcels WHERE parcel_code = ?').get(land_id.trim().toUpperCase());
  if (!parcel) return res.json({ reply: R.notFound(land_id) });

  const comp = db.prepare('SELECT * FROM compensation WHERE parcel_id = ?').get(parcel.id);
  const pos = db.prepare('SELECT * FROM possession WHERE parcel_id = ?').get(parcel.id);

  res.json({ reply: R.status(parcel, comp, pos) });
});

module.exports = router;
