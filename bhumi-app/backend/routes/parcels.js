// routes/parcels.js
// GIS-based land parcel management, litigation risk badge, unused land finder.
const express = require('express');
const db = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');
const { logEvent } = require('../db/history');

const router = express.Router();

const STATUS_LABELS = {
  identified: 'Land identified for acquisition',
  notified: 'Acquisition notice issued',
  compensated: 'Compensation completed',
  possessed: 'Possession taken by government',
  unused: 'Marked as unused acquired land',
};

function riskBadge(disputeCount) {
  if (disputeCount === 0) return 'green';
  if (disputeCount <= 2) return 'yellow';
  return 'red';
}

// GET /api/parcels - all parcels with risk badge, for GIS map rendering
router.get('/', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, pr.name AS project_name, pr.state, pr.district
    FROM land_parcels p
    LEFT JOIN projects pr ON pr.id = p.project_id
  `).all();

  const withRisk = rows.map(r => ({ ...r, litigation_risk: riskBadge(r.dispute_count) }));
  res.json(withRisk);
});

// GET /api/parcels/:id
router.get('/:id', authenticate, (req, res) => {
  const row = db.prepare('SELECT * FROM land_parcels WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Parcel not found' });
  res.json({ ...row, litigation_risk: riskBadge(row.dispute_count) });
});

// POST /api/parcels - register a new parcel (district/agency field entry)
router.post('/', authenticate, authorize('district', 'agency', 'state'), (req, res) => {
  const {
    project_id, parcel_code, owner_name, owner_contact, area_acres,
    latitude, longitude, geojson, base_rate, location_factor, connectivity_bonus, dispute_count,
  } = req.body;

  if (!parcel_code || !owner_name) return res.status(400).json({ error: 'parcel_code and owner_name are required' });

  const info = db.prepare(`
    INSERT INTO land_parcels
      (project_id, parcel_code, owner_name, owner_contact, area_acres, latitude, longitude,
       geojson, base_rate, location_factor, connectivity_bonus, dispute_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'identified')
  `).run(
    project_id || null, parcel_code, owner_name, owner_contact || null, area_acres || 0,
    latitude || null, longitude || null, geojson || null,
    base_rate || 0, location_factor || 1.0, connectivity_bonus || 0, dispute_count || 0
  );

  res.status(201).json({ id: info.lastInsertRowid });
});

// PATCH /api/parcels/:id/status - update parcel status (e.g. mark unused/possessed)
router.patch('/:id/status', authenticate, authorize('district', 'agency', 'state', 'central'), (req, res) => {
  const { status } = req.body;
  const allowed = ['identified', 'notified', 'compensated', 'possessed', 'unused'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE land_parcels SET status = ? WHERE id = ?').run(status, req.params.id);

  const parcel = db.prepare('SELECT parcel_code FROM land_parcels WHERE id = ?').get(req.params.id);
  if (parcel) {
    logEvent({
      land_id: parcel.parcel_code,
      category: 'government',
      event_type: 'parcel_status',
      title: STATUS_LABELS[status] || `Status updated: ${status}`,
      related_parcel_id: req.params.id,
      created_by: req.user.id,
    });
  }

  res.json({ id: req.params.id, status });
});

// GET /api/parcels/unused/nearby?lat=..&lng=..&radiusKm=10
// "Unused Acquired Land Finder" - simple haversine distance filter
router.get('/unused/nearby', authenticate, (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radiusKm) || 25;

  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng query params required' });

  const unused = db.prepare(`SELECT * FROM land_parcels WHERE status = 'unused'`).all();

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const nearby = unused
    .filter(p => p.latitude && p.longitude)
    .map(p => ({ ...p, distance_km: Math.round(haversine(lat, lng, p.latitude, p.longitude) * 10) / 10 }))
    .filter(p => p.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json(nearby);
});

module.exports = router;
