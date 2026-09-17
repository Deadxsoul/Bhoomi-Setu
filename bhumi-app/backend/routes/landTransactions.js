// routes/landTransactions.js
// Peer-to-peer land buy/sell marketplace — separate from the government
// acquisition workflow elsewhere in the app. A user submits a sale as either
// the seller or the buyer, uploads the documents required for that side,
// and it is reviewed offline by a police verification officer. It only
// becomes "sold" once that officer approves it.
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'land-transactions');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.fieldname}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// One multer field per document type — keeps each upload tagged with what
// it actually is, instead of a generic file list.
const DOC_FIELDS = [
  'title_deed',
  'encumbrance_certificate',
  'property_tax_receipt',
  'seller_id_proof',
  'buyer_id_proof',
  'sale_agreement',
];

// Documents required from each side of a peer land sale — based on standard
// Indian property-transfer practice (title verification + no pending dues
// on the seller's side, ID/PAN on the buyer's side). Verification itself is
// simulated/offline in this demo, same as the OTP and Aadhaar flows.
const REQUIRED_DOCS = {
  seller: ['title_deed', 'encumbrance_certificate', 'property_tax_receipt', 'seller_id_proof'],
  buyer: ['buyer_id_proof'],
};

const DOC_LABELS = {
  title_deed: 'Original Sale Deed / Title Deed',
  encumbrance_certificate: 'Encumbrance Certificate (EC)',
  property_tax_receipt: 'Latest Property Tax Receipt',
  seller_id_proof: "Seller's Aadhaar / ID Proof",
  buyer_id_proof: "Buyer's Aadhaar & PAN Card",
  sale_agreement: 'Agreement to Sell (if already drafted)',
};

function withDocs(row) {
  if (!row) return row;
  const docs = db
    .prepare('SELECT id, doc_type, filename, uploaded_at FROM transaction_documents WHERE transaction_id = ? ORDER BY uploaded_at')
    .all(row.id);
  return { ...row, documents: docs };
}

// GET /api/land-transactions/required-docs?role=seller|buyer
// So the frontend form always shows the same checklist the backend enforces.
router.get('/required-docs', authenticate, (req, res) => {
  const role = req.query.role === 'buyer' ? 'buyer' : 'seller';
  res.json({
    role,
    required: REQUIRED_DOCS[role].map((key) => ({ key, label: DOC_LABELS[key] })),
    optional: DOC_FIELDS.filter((k) => !REQUIRED_DOCS[role].includes(k)).map((key) => ({ key, label: DOC_LABELS[key] })),
  });
});

// GET /api/land-transactions/mine — everything this user submitted, or is
// named in as the seller/buyer (so both sides can track the same sale).
router.get('/mine', authenticate, (req, res) => {
  if (req.user.guest) return res.json([]);
  const rows = db
    .prepare(
      `SELECT * FROM land_transactions
       WHERE initiated_by = ? OR seller_user_id = ? OR buyer_user_id = ?
          OR (seller_contact = ? AND ? != '') OR (buyer_contact = ? AND ? != '')
       ORDER BY submitted_at DESC`
    )
    .all(req.user.id, req.user.id, req.user.id, req.user.phone || '', req.user.phone || '', req.user.phone || '', req.user.phone || '');
  res.json(rows);
});

// GET /api/land-transactions/queue — sales awaiting police verification
// (demo: log in as the Police demo account to act as the verifying officer)
router.get('/queue', authenticate, authorize('police'), (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM land_transactions WHERE status = 'police_verification' ORDER BY submitted_at ASC`)
    .all();
  res.json(rows);
});

// GET /api/land-transactions/:id
router.get('/:id(\\d+)', authenticate, (req, res) => {
  const row = db.prepare('SELECT * FROM land_transactions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(withDocs(row));
});

// POST /api/land-transactions — submit a new sale as seller or buyer
router.post('/', authenticate, upload.fields(DOC_FIELDS.map((name) => ({ name, maxCount: 1 }))), (req, res) => {
  if (req.user.guest) return res.status(403).json({ error: 'Guests cannot submit a land sale — please sign in first' });

  const {
    initiated_as, land_id, survey_number, village, district, state, area_acres, agreed_price,
    seller_name, seller_aadhaar, seller_contact,
    buyer_name, buyer_aadhaar, buyer_contact,
  } = req.body;

  if (!['seller', 'buyer'].includes(initiated_as)) {
    return res.status(400).json({ error: 'Choose whether you are submitting this as the seller or the buyer' });
  }
  if (!land_id || !land_id.trim()) return res.status(400).json({ error: 'Enter the land / parcel ID' });
  if (!seller_name || !seller_name.trim()) return res.status(400).json({ error: "Enter the seller's full name" });
  if (!buyer_name || !buyer_name.trim()) return res.status(400).json({ error: "Enter the buyer's full name" });
  if (!agreed_price || Number(agreed_price) <= 0) return res.status(400).json({ error: 'Enter the agreed sale price' });

  const missing = REQUIRED_DOCS[initiated_as].filter((key) => !(req.files && req.files[key] && req.files[key][0]));
  if (missing.length) {
    return res.status(400).json({ error: `Missing required document(s): ${missing.map((k) => DOC_LABELS[k]).join(', ')}` });
  }

  // Offline police verification — simulated turnaround, same convention as
  // the OTP flows elsewhere in the app.
  const approxDays = 5 + Math.floor(Math.random() * 4); // 5–8 working days

  const info = db
    .prepare(
      `INSERT INTO land_transactions
        (land_id, survey_number, village, district, state, area_acres, agreed_price,
         initiated_by, initiated_as,
         seller_user_id, seller_name, seller_aadhaar, seller_contact,
         buyer_user_id, buyer_name, buyer_aadhaar, buyer_contact,
         status, approx_verification_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'police_verification', ?)`
    )
    .run(
      land_id.trim(), survey_number || null, village || null, district || null, state || null,
      area_acres ? Number(area_acres) : null, Number(agreed_price),
      req.user.id, initiated_as,
      initiated_as === 'seller' ? req.user.id : null, seller_name.trim(), seller_aadhaar || null, seller_contact || null,
      initiated_as === 'buyer' ? req.user.id : null, buyer_name.trim(), buyer_aadhaar || null, buyer_contact || null,
      approxDays
    );

  const transactionId = info.lastInsertRowid;
  const insertDoc = db.prepare(
    `INSERT INTO transaction_documents (transaction_id, doc_type, filename, filepath, uploaded_by) VALUES (?, ?, ?, ?, ?)`
  );
  for (const key of DOC_FIELDS) {
    const f = req.files && req.files[key] && req.files[key][0];
    if (f) insertDoc.run(transactionId, key, f.originalname, f.path, req.user.id);
  }

  res.status(201).json(withDocs(db.prepare('SELECT * FROM land_transactions WHERE id = ?').get(transactionId)));
});

// PATCH /api/land-transactions/:id/verify — police officer approves or rejects
router.patch('/:id(\\d+)/verify', authenticate, authorize('police'), (req, res) => {
  const { decision, notes } = req.body; // decision: 'approve' | 'reject'
  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: "decision must be 'approve' or 'reject'" });
  }
  const row = db.prepare('SELECT * FROM land_transactions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.status !== 'police_verification') {
    return res.status(400).json({ error: 'This sale has already been decided' });
  }

  const newStatus = decision === 'approve' ? 'sold' : 'rejected';
  db.prepare(
    `UPDATE land_transactions
     SET status = ?, verifying_officer_id = ?, verification_notes = ?, verified_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(newStatus, req.user.id, notes || null, req.params.id);

  res.json(withDocs(db.prepare('SELECT * FROM land_transactions WHERE id = ?').get(req.params.id)));
});

// GET /api/land-transactions/documents/:docId/download
router.get('/documents/:docId(\\d+)/download', authenticate, (req, res) => {
  const doc = db.prepare('SELECT * FROM transaction_documents WHERE id = ?').get(req.params.docId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.download(doc.filepath, doc.filename);
});

module.exports = router;
