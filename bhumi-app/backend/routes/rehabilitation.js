// routes/rehabilitation.js
// Rehabilitation & Resettlement module + Socio-Economic Priority Score.
const express = require('express');
const db = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');
const { logEvent } = require('../db/history');

const router = express.Router();

function priorityScore(familySize, income, agriDependency) {
  const sizeScore = Math.min(familySize / 10, 1) * 40;      // larger families → higher need
  const incomeScore = Math.max(0, (20000 - income) / 20000) * 40; // lower income → higher need
  const agriScore = agriDependency * 20;                    // more agri-dependent → higher need
  return Math.round(sizeScore + incomeScore + agriScore);
}

// GET /api/rehabilitation - list, sorted by priority (most vulnerable first)
router.get('/', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, p.parcel_code, p.owner_name
    FROM rehabilitation r
    JOIN land_parcels p ON p.id = r.parcel_id
    ORDER BY r.priority_score DESC
  `).all();
  res.json(rows);
});

// POST /api/rehabilitation - register a displaced family
router.post('/', authenticate, authorize('district', 'agency', 'state'), (req, res) => {
  const { parcel_id, family_name, family_size, monthly_income, agriculture_dependency } = req.body;
  if (!parcel_id || !family_name) return res.status(400).json({ error: 'parcel_id and family_name are required' });

  const score = priorityScore(Number(family_size) || 0, Number(monthly_income) || 0, Number(agriculture_dependency) || 0);

  const info = db.prepare(`
    INSERT INTO rehabilitation (parcel_id, family_name, family_size, monthly_income, agriculture_dependency, resettled, priority_score)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(parcel_id, family_name, family_size || 0, monthly_income || 0, agriculture_dependency || 0, score);

  const parcel = db.prepare('SELECT parcel_code FROM land_parcels WHERE id = ?').get(parcel_id);
  if (parcel) {
    logEvent({
      land_id: parcel.parcel_code,
      category: 'government',
      event_type: 'rehabilitation_registered',
      title: 'Registered for rehabilitation & resettlement',
      description: `Family: ${family_name}`,
      related_parcel_id: parcel_id,
      created_by: req.user.id,
    });
  }

  res.status(201).json({ id: info.lastInsertRowid, priority_score: score });
});

// PATCH /api/rehabilitation/:id/resettle
router.patch('/:id/resettle', authenticate, authorize('district', 'agency', 'state'), (req, res) => {
  const rehab = db.prepare('SELECT * FROM rehabilitation WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE rehabilitation SET resettled = 1 WHERE id = ?').run(req.params.id);

  if (rehab) {
    const parcel = db.prepare('SELECT parcel_code FROM land_parcels WHERE id = ?').get(rehab.parcel_id);
    if (parcel) {
      logEvent({
        land_id: parcel.parcel_code,
        category: 'government',
        event_type: 'rehabilitation_resettled',
        title: 'Family resettled',
        description: rehab.family_name ? `Family: ${rehab.family_name}` : null,
        related_parcel_id: rehab.parcel_id,
        created_by: req.user.id,
      });
    }
  }

  res.json({ id: req.params.id, resettled: true });
});

module.exports = router;
