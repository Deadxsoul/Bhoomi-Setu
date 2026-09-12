// routes/possession.js
const express = require('express');
const db = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/possession
router.get('/', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT ps.*, p.parcel_code, p.owner_name, p.status AS parcel_status
    FROM possession ps
    JOIN land_parcels p ON p.id = ps.parcel_id
  `).all();
  res.json(rows);
});

// PATCH /api/possession/:parcelId - mark handed over / verify
router.patch('/:parcelId', authenticate, authorize('district', 'agency', 'central'), (req, res) => {
  const { handed_over, handover_date } = req.body;
  const existing = db.prepare('SELECT id FROM possession WHERE parcel_id = ?').get(req.params.parcelId);

  if (existing) {
    db.prepare('UPDATE possession SET handed_over = ?, handover_date = ?, verified_by = ? WHERE parcel_id = ?')
      .run(handed_over ? 1 : 0, handover_date || null, req.user.id, req.params.parcelId);
  } else {
    db.prepare('INSERT INTO possession (parcel_id, handed_over, handover_date, verified_by) VALUES (?, ?, ?, ?)')
      .run(req.params.parcelId, handed_over ? 1 : 0, handover_date || null, req.user.id);
  }

  if (handed_over) {
    db.prepare(`UPDATE land_parcels SET status = 'possessed' WHERE id = ?`).run(req.params.parcelId);
  }

  res.json({ parcel_id: req.params.parcelId, handed_over: !!handed_over });
});

module.exports = router;
