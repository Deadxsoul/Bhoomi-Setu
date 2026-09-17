// routes/landHistory.js
// Land History Tracker — look up everything that has happened to a piece of
// land by its land/parcel ID: every private buy/sell deal it's been part of,
// and the government acquisition process's dated timeline. Two separate,
// switchable histories for the same land ID, both read-only.
const express = require('express');
const db = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function withDocs(row) {
  const documents = db
    .prepare('SELECT id, doc_type, filename, uploaded_at FROM transaction_documents WHERE transaction_id = ? ORDER BY uploaded_at')
    .all(row.id);
  return { ...row, documents };
}

// GET /api/land-history/:landId
router.get('/:landId', authenticate, (req, res) => {
  const landId = (req.params.landId || '').trim();
  if (!landId) return res.status(400).json({ error: 'Land ID is required' });

  // ---- Government acquisition side: the parcel + its dated event log ----
  const parcel = db.prepare(`
    SELECT p.*, pr.name AS project_name, pr.type AS project_type, pr.implementing_agency
    FROM land_parcels p
    LEFT JOIN projects pr ON pr.id = p.project_id
    WHERE p.parcel_code = ?
  `).get(landId);

  const governmentHistory = db
    .prepare(`SELECT * FROM land_history_events WHERE land_id = ? AND category = 'government' ORDER BY event_date ASC, id ASC`)
    .all(landId);

  // ---- Private buy/sell side: every deal ever submitted against this land ID ----
  const transactionHistory = db
    .prepare(`SELECT * FROM land_transactions WHERE land_id = ? ORDER BY submitted_at DESC`)
    .all(landId)
    .map(withDocs);

  if (!parcel && governmentHistory.length === 0 && transactionHistory.length === 0) {
    return res.status(404).json({ error: `No records found for land ID "${landId}"` });
  }

  res.json({ landId, parcel: parcel || null, governmentHistory, transactionHistory });
});

module.exports = router;
