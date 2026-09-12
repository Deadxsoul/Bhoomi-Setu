// routes/compensation.js
// Explainable Compensation Calculator: base rate + location factor + connectivity bonus.
const express = require('express');
const db = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function computeBreakdown({ base_rate, area_acres, location_factor, connectivity_bonus }) {
  const base_component = Math.round(base_rate * area_acres);
  const location_adjustment = Math.round(base_component * (location_factor - 1));
  const total = base_component + location_adjustment + connectivity_bonus;
  return {
    base_rate_per_acre: base_rate,
    area_acres,
    base_component,
    location_factor,
    location_adjustment,
    connectivity_bonus,
    total,
    explanation: [
      `Base value = ₹${base_rate}/acre × ${area_acres} acres = ₹${base_component.toLocaleString('en-IN')}`,
      `Location adjustment (factor ${location_factor}) = ₹${location_adjustment.toLocaleString('en-IN')}`,
      `Connectivity bonus = ₹${connectivity_bonus.toLocaleString('en-IN')}`,
      `Total compensation = ₹${total.toLocaleString('en-IN')}`,
    ],
  };
}

// GET /api/compensation - list all, with parcel info
router.get('/', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, p.parcel_code, p.owner_name, p.state, p.district
    FROM compensation c
    JOIN land_parcels p ON p.id = c.parcel_id
    LEFT JOIN projects pr ON pr.id = p.project_id
  `).all();
  res.json(rows.map(r => ({ ...r, breakdown: r.breakdown_json ? JSON.parse(r.breakdown_json) : null })));
});

// GET /api/compensation/parcel/:parcelId
router.get('/parcel/:parcelId', authenticate, (req, res) => {
  const row = db.prepare('SELECT * FROM compensation WHERE parcel_id = ?').get(req.params.parcelId);
  if (!row) return res.status(404).json({ error: 'No compensation record for this parcel' });
  res.json({ ...row, breakdown: row.breakdown_json ? JSON.parse(row.breakdown_json) : null });
});

// POST /api/compensation/calculate - live "what-if" calculator (no DB write)
router.post('/calculate', authenticate, (req, res) => {
  const { base_rate, area_acres, location_factor, connectivity_bonus } = req.body;
  if (base_rate == null || area_acres == null) {
    return res.status(400).json({ error: 'base_rate and area_acres are required' });
  }
  const breakdown = computeBreakdown({
    base_rate: Number(base_rate),
    area_acres: Number(area_acres),
    location_factor: Number(location_factor) || 1.0,
    connectivity_bonus: Number(connectivity_bonus) || 0,
  });
  res.json(breakdown);
});

// POST /api/compensation/parcel/:parcelId - assess & save compensation for a parcel
router.post('/parcel/:parcelId', authenticate, authorize('district', 'agency', 'state'), (req, res) => {
  const parcel = db.prepare('SELECT * FROM land_parcels WHERE id = ?').get(req.params.parcelId);
  if (!parcel) return res.status(404).json({ error: 'Parcel not found' });

  const breakdown = computeBreakdown({
    base_rate: parcel.base_rate,
    area_acres: parcel.area_acres,
    location_factor: parcel.location_factor,
    connectivity_bonus: parcel.connectivity_bonus,
  });

  const existing = db.prepare('SELECT id FROM compensation WHERE parcel_id = ?').get(req.params.parcelId);
  if (existing) {
    db.prepare(`UPDATE compensation SET amount_assessed = ?, breakdown_json = ?, updated_at = CURRENT_TIMESTAMP WHERE parcel_id = ?`)
      .run(breakdown.total, JSON.stringify(breakdown), req.params.parcelId);
  } else {
    db.prepare(`INSERT INTO compensation (parcel_id, amount_assessed, amount_paid, breakdown_json, status) VALUES (?, ?, 0, ?, 'pending')`)
      .run(req.params.parcelId, breakdown.total, JSON.stringify(breakdown));
  }
  res.json(breakdown);
});

// PATCH /api/compensation/:id/pay - record a payment against a compensation record
router.patch('/:id/pay', authenticate, authorize('district', 'agency', 'state'), (req, res) => {
  const { amount } = req.body;
  const comp = db.prepare('SELECT * FROM compensation WHERE id = ?').get(req.params.id);
  if (!comp) return res.status(404).json({ error: 'Compensation record not found' });

  const newPaid = comp.amount_paid + Number(amount || 0);
  const status = newPaid >= comp.amount_assessed ? 'paid' : (newPaid > 0 ? 'partial' : 'pending');

  db.prepare(`UPDATE compensation SET amount_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(newPaid, status, req.params.id);

  if (status === 'paid') {
    db.prepare(`UPDATE land_parcels SET status = 'compensated' WHERE id = ?`).run(comp.parcel_id);
  }

  res.json({ id: req.params.id, amount_paid: newPaid, status });
});

module.exports = router;
