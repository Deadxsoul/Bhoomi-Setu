// routes/dashboard.js
// National Dashboard: state/project-wise progress + Gamified State Ranking.
const express = require('express');
const db = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/summary - top-level KPI cards
router.get('/summary', authenticate, (req, res) => {
  const totalProjects = db.prepare('SELECT COUNT(*) c FROM projects').get().c;
  const totalParcels = db.prepare('SELECT COUNT(*) c FROM land_parcels').get().c;
  const possessedParcels = db.prepare(`SELECT COUNT(*) c FROM land_parcels WHERE status = 'possessed'`).get().c;
  const totalCompensation = db.prepare('SELECT COALESCE(SUM(amount_assessed),0) s FROM compensation').get().s;
  const paidCompensation = db.prepare('SELECT COALESCE(SUM(amount_paid),0) s FROM compensation').get().s;
  const familiesResettled = db.prepare('SELECT COUNT(*) c FROM rehabilitation WHERE resettled = 1').get().c;
  const familiesTotal = db.prepare('SELECT COUNT(*) c FROM rehabilitation').get().c;

  res.json({
    totalProjects,
    totalParcels,
    possessedParcels,
    possessionRate: totalParcels ? Math.round((possessedParcels / totalParcels) * 100) : 0,
    totalCompensation,
    paidCompensation,
    compensationDisbursementRate: totalCompensation ? Math.round((paidCompensation / totalCompensation) * 100) : 0,
    familiesResettled,
    familiesTotal,
  });
});

// GET /api/dashboard/state-wise - projects/parcels/compensation grouped by state
router.get('/state-wise', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT
      pr.state,
      COUNT(DISTINCT pr.id) AS projects,
      COUNT(DISTINCT lp.id) AS parcels,
      COALESCE(SUM(c.amount_assessed), 0) AS total_compensation,
      COALESCE(SUM(c.amount_paid), 0) AS paid_compensation,
      SUM(CASE WHEN lp.status = 'possessed' THEN 1 ELSE 0 END) AS possessed_count
    FROM projects pr
    LEFT JOIN land_parcels lp ON lp.project_id = pr.id
    LEFT JOIN compensation c ON c.parcel_id = lp.id
    GROUP BY pr.state
  `).all();
  res.json(rows);
});

// GET /api/dashboard/project-progress - project-wise stage funnel
router.get('/project-progress', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT pr.id, pr.name, pr.state, pr.district, pr.status,
           COUNT(lp.id) AS total_parcels,
           SUM(CASE WHEN lp.status = 'possessed' THEN 1 ELSE 0 END) AS possessed,
           SUM(CASE WHEN lp.status = 'compensated' THEN 1 ELSE 0 END) AS compensated
    FROM projects pr
    LEFT JOIN land_parcels lp ON lp.project_id = pr.id
    GROUP BY pr.id
  `).all();
  res.json(rows);
});

// GET /api/dashboard/state-ranking - Gamified State Ranking Dashboard
// Score = speed (possession rate) + transparency (compensation disbursed %) + satisfaction (proxy: low dispute rate)
router.get('/state-ranking', authenticate, (req, res) => {
  const states = db.prepare(`
    SELECT DISTINCT state FROM projects
  `).all().map(r => r.state);

  const ranking = states.map(state => {
    const parcels = db.prepare(`
      SELECT lp.* FROM land_parcels lp JOIN projects pr ON pr.id = lp.project_id WHERE pr.state = ?
    `).all(state);

    const totalParcels = parcels.length || 1;
    const possessed = parcels.filter(p => p.status === 'possessed').length;
    const totalDisputes = parcels.reduce((s, p) => s + (p.dispute_count || 0), 0);

    const comp = db.prepare(`
      SELECT COALESCE(SUM(c.amount_assessed),0) assessed, COALESCE(SUM(c.amount_paid),0) paid
      FROM compensation c JOIN land_parcels lp ON lp.id = c.parcel_id JOIN projects pr ON pr.id = lp.project_id
      WHERE pr.state = ?
    `).get(state);

    const speed_score = Math.round((possessed / totalParcels) * 100);
    const transparency_score = comp.assessed ? Math.round((comp.paid / comp.assessed) * 100) : 0;
    const satisfaction_score = Math.max(0, 100 - Math.round((totalDisputes / totalParcels) * 40));
    const total_score = Math.round((speed_score + transparency_score + satisfaction_score) / 3 * 10) / 10;

    db.prepare(`
      INSERT INTO state_stats (state, speed_score, transparency_score, satisfaction_score, total_score)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(state) DO UPDATE SET speed_score=excluded.speed_score, transparency_score=excluded.transparency_score,
        satisfaction_score=excluded.satisfaction_score, total_score=excluded.total_score
    `).run(state, speed_score, transparency_score, satisfaction_score, total_score);

    return { state, speed_score, transparency_score, satisfaction_score, total_score };
  }).sort((a, b) => b.total_score - a.total_score)
    .map((r, i) => ({ rank: i + 1, ...r }));

  res.json(ranking);
});

module.exports = router;
