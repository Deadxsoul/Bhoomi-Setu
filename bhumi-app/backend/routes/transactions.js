// routes/transactions.js
// Peer-to-peer land sale/purchase, verified by a police officer before final.
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../db/init');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'transactions');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// The documents an Indian land sale actually needs, in plain terms for the form.
const REQUIRED_DOC_TYPES = [
  { key: 'title_deed', label: "Seller's title deed / RTC (existing ownership record)" },
  { key: 'encumbrance_certificate', label: 'Encumbrance certificate (proves the land is free of loans/disputes)' },
  { key: 'property_tax_receipt', label: 'Latest property tax receipt' },
  { key: 'seller_id_proof', label: "Seller's ID proof (Aadhaar/PAN)" },
  { key: 'buyer_id_proof', label: "Buyer's ID proof (Aadhaar/PAN)" },
  { key: 'sale_agreement', label: 'Signed sale agreement (terms & agreed price)' },
];

router.get('/doc-types', requireAuth, (req, res) => res.json(REQUIRED_DOC_TYPES));

// ---------- Create a transaction (the combined seller+buyer form) ----------
router.post('/', requireAuth, (req, res) => {
  if (req.user.guest) return res.status(403).json({ error: 'Create an account to start a land transaction' });

  const {
    landId, surveyNumber, village, district, state, areaAcres, agreedPrice,
    initiatedAs, sellerName, sellerAadhaar, sellerContact,
    buyerName, buyerAadhaar, buyerContact,
  } = req.body;

  if (!['seller', 'buyer'].includes(initiatedAs)) {
    return res.status(400).json({ error: 'Specify whether you are the seller or the buyer' });
  }
  if (!landId || !landId.trim()) return res.status(400).json({ error: 'Enter the land / parcel ID' });
  if (!sellerName || !sellerName.trim()) return res.status(400).json({ error: "Enter the seller's name" });
  if (!buyerName || !buyerName.trim()) return res.status(400).json({ error: "Enter the buyer's name" });

  const sellerUserId = initiatedAs === 'seller' ? req.user.id : null;
  const buyerUserId = initiatedAs === 'buyer' ? req.user.id : null;

  const result = db.prepare(`
    INSERT INTO land_transactions (
      land_id, survey_number, village, district, state, area_acres, agreed_price,
      initiated_by, initiated_as,
      seller_user_id, seller_name, seller_aadhaar, seller_contact,
      buyer_user_id, buyer_name, buyer_aadhaar, buyer_contact
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    landId.trim(), surveyNumber || null, village || null, district || null, state || null,
    areaAcres ? Number(areaAcres) : null, agreedPrice ? Number(agreedPrice) : null,
    req.user.id, initiatedAs,
    sellerUserId, sellerName.trim(), sellerAadhaar || null, sellerContact || null,
    buyerUserId, buyerName.trim(), buyerAadhaar || null, buyerContact || null,
  );

  res.json({ id: result.lastInsertRowid });
});

// ---------- Attach a document to a transaction ----------
router.post('/:id/documents', requireAuth, upload.single('file'), (req, res) => {
  const { docType } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!REQUIRED_DOC_TYPES.some((d) => d.key === docType)) {
    return res.status(400).json({ error: 'Unrecognized document type' });
  }
  db.prepare(`
    INSERT INTO transaction_documents (transaction_id, doc_type, filename, filepath, uploaded_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, docType, req.file.originalname, req.file.path, req.user.id);
  res.json({ uploaded: true });
});

// ---------- My transactions (as either seller or buyer) ----------
router.get('/mine', requireAuth, (req, res) => {
  if (req.user.guest) return res.json([]);
  const rows = db.prepare(`
    SELECT * FROM land_transactions
    WHERE seller_user_id = ? OR buyer_user_id = ?
    ORDER BY submitted_at DESC
  `).all(req.user.id, req.user.id);
  res.json(rows);
});

// ---------- Police verification queue ----------
router.get('/queue', requireAuth, requireRole('police'), (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM land_transactions WHERE status = 'police_verification' ORDER BY submitted_at ASC
  `).all();
  res.json(rows);
});

// ---------- Single transaction detail (with documents + viewer's role in it) ----------
router.get('/:id', requireAuth, (req, res) => {
  const txn = db.prepare(`SELECT * FROM land_transactions WHERE id = ?`).get(req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });

  const isSeller = txn.seller_user_id === req.user.id;
  const isBuyer = txn.buyer_user_id === req.user.id;
  if (!isSeller && !isBuyer && req.user.role !== 'police') {
    return res.status(403).json({ error: 'Not part of this transaction' });
  }

  const documents = db.prepare(`SELECT id, doc_type, filename, uploaded_at FROM transaction_documents WHERE transaction_id = ?`).all(req.params.id);
  const viewerRole = req.user.role === 'police' ? 'police' : (isSeller ? 'seller' : 'buyer');
  res.json({ transaction: txn, documents, viewerRole });
});

// ---------- Police decision: approve (→ sold) or reject ----------
router.patch('/:id/decision', requireAuth, requireRole('police'), (req, res) => {
  const { decision, notes } = req.body;
  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approve or reject' });
  }
  const status = decision === 'approve' ? 'sold' : 'rejected';
  db.prepare(`
    UPDATE land_transactions
    SET status = ?, verifying_officer_id = ?, verification_notes = ?, verified_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.user.id, notes || null, req.params.id);

  const txn = db.prepare(`SELECT * FROM land_transactions WHERE id = ?`).get(req.params.id);
  res.json({ transaction: txn });
});

module.exports = router;
