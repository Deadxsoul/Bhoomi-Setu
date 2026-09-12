// routes/documents.js
// Document Management System + Document Forgery/Duplicate Checker (file hash based).
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

function fileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// GET /api/documents?parcel_id=&project_id=
router.get('/', authenticate, (req, res) => {
  const { parcel_id, project_id } = req.query;
  let rows;
  if (parcel_id) {
    rows = db.prepare('SELECT * FROM documents WHERE parcel_id = ? ORDER BY uploaded_at DESC').all(parcel_id);
  } else if (project_id) {
    rows = db.prepare('SELECT * FROM documents WHERE project_id = ? ORDER BY uploaded_at DESC').all(project_id);
  } else {
    rows = db.prepare('SELECT * FROM documents ORDER BY uploaded_at DESC').all();
  }
  res.json(rows);
});

// POST /api/documents/upload - multipart form: file, parcel_id, project_id
router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { parcel_id, project_id } = req.body;
  const hash = fileHash(req.file.path);

  // Duplicate/forgery check: same hash already exists = exact duplicate/tampered-copy flag
  const dup = db.prepare('SELECT * FROM documents WHERE file_hash = ?').get(hash);

  const versionRow = db.prepare(
    'SELECT MAX(version) as maxVersion FROM documents WHERE parcel_id IS ? AND filename = ?'
  ).get(parcel_id || null, req.file.originalname);
  const version = (versionRow?.maxVersion || 0) + 1;

  const info = db.prepare(`
    INSERT INTO documents (parcel_id, project_id, filename, filepath, file_hash, version, uploaded_by, is_duplicate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(parcel_id || null, project_id || null, req.file.originalname, req.file.path, hash, version, req.user.id, dup ? 1 : 0);

  res.status(201).json({
    id: info.lastInsertRowid,
    filename: req.file.originalname,
    version,
    is_duplicate: !!dup,
    duplicate_of: dup ? dup.id : null,
    message: dup
      ? '⚠️ This file matches an already-uploaded document (identical hash) — flagged as duplicate/possible re-submission.'
      : '✅ Unique document uploaded and hashed successfully.',
  });
});

// GET /api/documents/:id/download
router.get('/:id/download', authenticate, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.download(doc.filepath, doc.filename);
});

module.exports = router;
