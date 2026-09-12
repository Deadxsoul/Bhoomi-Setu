// routes/proposals.js
// Handles Projects + the Proposal → Notification → Award approval workflow.
const express = require('express');
const db = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects  - list projects (scoped by role)
router.get('/projects', authenticate, (req, res) => {
  const { role, state, district } = req.user;
  let rows;
  if (role === 'central') {
    rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  } else if (role === 'state') {
    rows = db.prepare('SELECT * FROM projects WHERE state = ? ORDER BY created_at DESC').all(state);
  } else if (role === 'district' || role === 'agency') {
    rows = db.prepare('SELECT * FROM projects WHERE state = ? AND district = ? ORDER BY created_at DESC').all(state, district);
  } else {
    rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  }
  res.json(rows);
});

// POST /api/projects - submit a new project proposal (agency/state/central)
router.post('/projects', authenticate, authorize('central', 'state', 'agency'), (req, res) => {
  const { name, type, state, district, implementing_agency } = req.body;
  if (!name || !state || !district) return res.status(400).json({ error: 'name, state, district are required' });

  const info = db.prepare(`
    INSERT INTO projects (name, type, state, district, implementing_agency, status, created_by)
    VALUES (?, ?, ?, ?, ?, 'proposed', ?)
  `).run(name, type || null, state, district, implementing_agency || null, req.user.id);

  db.prepare(`
    INSERT INTO proposals (project_id, stage, remarks, submitted_by)
    VALUES (?, 'submitted', 'Initial submission', ?)
  `).run(info.lastInsertRowid, req.user.id);

  res.status(201).json({ id: info.lastInsertRowid });
});

// GET /api/proposals/:projectId - full workflow history for a project
router.get('/proposals/:projectId', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM proposals WHERE project_id = ? ORDER BY updated_at ASC').all(req.params.projectId);
  res.json(rows);
});

// PATCH /api/proposals/:id/advance - move a proposal to the next workflow stage
const STAGE_FLOW = ['submitted', 'district_review', 'state_review', 'central_review', 'approved'];
router.patch('/proposals/:id/advance', authenticate, authorize('district', 'state', 'central'), (req, res) => {
  const { remarks, reject } = req.body;
  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  let nextStage;
  if (reject) {
    nextStage = 'rejected';
  } else {
    const idx = STAGE_FLOW.indexOf(proposal.stage);
    nextStage = idx >= 0 && idx < STAGE_FLOW.length - 1 ? STAGE_FLOW[idx + 1] : proposal.stage;
  }

  db.prepare('UPDATE proposals SET stage = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(nextStage, remarks || proposal.remarks, req.params.id);

  if (nextStage === 'approved') {
    db.prepare("UPDATE projects SET status = 'notified' WHERE id = ?").run(proposal.project_id);
  } else if (nextStage === 'rejected') {
    db.prepare("UPDATE projects SET status = 'rejected' WHERE id = ?").run(proposal.project_id);
  }

  // Notify the original submitter
  db.prepare(`INSERT INTO notifications (user_id, message, channel) VALUES (?, ?, 'app')`)
    .run(proposal.submitted_by, `Proposal #${proposal.id} moved to stage: ${nextStage}`);

  res.json({ id: req.params.id, stage: nextStage });
});

module.exports = router;
