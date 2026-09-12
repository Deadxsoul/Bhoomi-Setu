// routes/satellite.js
// Satellite-Based Encroachment Checker.
// NOTE: In a real deployment this would pull actual satellite tiles from
// ISRO Bhuvan / Sentinel Hub for the parcel's coordinates and run a proper
// change-detection model. For this demo, officers upload "before" and
// "after" images for a parcel and we run a pixel-difference comparison
// (using Jimp, pure-JS, no native deps) to flag the % of the area that
// visibly changed — a lightweight, explainable proxy for encroachment.
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');
const db = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'satellite');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.fieldname}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

// POST /api/satellite/:parcelId/compare  (multipart: before, after)
router.post(
  '/:parcelId/compare',
  authenticate,
  authorize('district', 'agency', 'state', 'central'),
  upload.fields([{ name: 'before', maxCount: 1 }, { name: 'after', maxCount: 1 }]),
  async (req, res) => {
    try {
      const parcel = db.prepare('SELECT * FROM land_parcels WHERE id = ?').get(req.params.parcelId);
      if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
      if (!req.files?.before || !req.files?.after) {
        return res.status(400).json({ error: 'Both "before" and "after" images are required' });
      }

      const beforePath = req.files.before[0].path;
      const afterPath = req.files.after[0].path;

      const imgBefore = await Jimp.read(beforePath);
      const imgAfter = await Jimp.read(afterPath);

      // Resize both to same dimensions for a fair comparison
      const W = 300, H = 300;
      imgBefore.resize(W, H);
      imgAfter.resize(W, H);

      let changedPixels = 0;
      const totalPixels = W * H;
      const THRESHOLD = 40; // per-channel brightness diff threshold

      imgBefore.scan(0, 0, W, H, function (x, y, idx) {
        const r1 = this.bitmap.data[idx], g1 = this.bitmap.data[idx + 1], b1 = this.bitmap.data[idx + 2];
        const r2 = imgAfter.bitmap.data[idx], g2 = imgAfter.bitmap.data[idx + 1], b2 = imgAfter.bitmap.data[idx + 2];
        const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        if (diff > THRESHOLD) changedPixels++;
      });

      const encroachmentPct = Math.round((changedPixels / totalPixels) * 1000) / 10;

      db.prepare(`
        UPDATE land_parcels
        SET before_image_url = ?, after_image_url = ?, encroachment_pct = ?
        WHERE id = ?
      `).run(beforePath, afterPath, encroachmentPct, req.params.parcelId);

      let verdict = 'No significant change detected';
      if (encroachmentPct > 25) verdict = '🚨 High probability of encroachment / unauthorized construction';
      else if (encroachmentPct > 10) verdict = '⚠️ Moderate change detected — recommend field verification';

      res.json({
        parcel_id: req.params.parcelId,
        changed_area_pct: encroachmentPct,
        verdict,
        note: 'Demo comparison uses pixel-level brightness difference as a lightweight proxy for real satellite change-detection.',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to process images', details: err.message });
    }
  }
);

module.exports = router;
