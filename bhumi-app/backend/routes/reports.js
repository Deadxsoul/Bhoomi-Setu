// routes/reports.js
// MIS Reports: downloadable PDF and Excel summaries for officers.
const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const db = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function getReportData() {
  const projects = db.prepare('SELECT * FROM projects').all();
  const parcels = db.prepare('SELECT * FROM land_parcels').all();
  const compensation = db.prepare(`
    SELECT c.*, p.parcel_code, p.owner_name FROM compensation c JOIN land_parcels p ON p.id = c.parcel_id
  `).all();
  return { projects, parcels, compensation };
}

// GET /api/reports/pdf - overall MIS summary as PDF
router.get('/pdf', authenticate, (req, res) => {
  const { projects, parcels, compensation } = getReportData();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="mis_report.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text('Land Acquisition & Management System — MIS Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(14).text('Projects Overview', { underline: true });
  doc.moveDown(0.5);
  projects.forEach(p => {
    doc.fontSize(10).text(`• ${p.name} — ${p.state}/${p.district} — Type: ${p.type || 'N/A'} — Status: ${p.status}`);
  });

  doc.moveDown(1);
  doc.fontSize(14).text('Land Parcels', { underline: true });
  doc.moveDown(0.5);
  parcels.forEach(p => {
    doc.fontSize(10).text(`• ${p.parcel_code} — Owner: ${p.owner_name} — Area: ${p.area_acres} acres — Status: ${p.status} — Disputes: ${p.dispute_count}`);
  });

  doc.moveDown(1);
  doc.fontSize(14).text('Compensation Summary', { underline: true });
  doc.moveDown(0.5);
  compensation.forEach(c => {
    doc.fontSize(10).text(`• ${c.parcel_code} (${c.owner_name}) — Assessed: ₹${c.amount_assessed.toLocaleString('en-IN')} — Paid: ₹${c.amount_paid.toLocaleString('en-IN')} — Status: ${c.status}`);
  });

  doc.end();
});

// GET /api/reports/excel - overall MIS summary as multi-sheet Excel workbook
router.get('/excel', authenticate, async (req, res) => {
  const { projects, parcels, compensation } = getReportData();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Land Acquisition & Management System';

  const projSheet = workbook.addWorksheet('Projects');
  projSheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'State', key: 'state', width: 15 },
    { header: 'District', key: 'district', width: 15 },
    { header: 'Agency', key: 'implementing_agency', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
  ];
  projSheet.addRows(projects);

  const parcelSheet = workbook.addWorksheet('Land Parcels');
  parcelSheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Parcel Code', key: 'parcel_code', width: 15 },
    { header: 'Owner', key: 'owner_name', width: 20 },
    { header: 'Area (acres)', key: 'area_acres', width: 12 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Dispute Count', key: 'dispute_count', width: 14 },
  ];
  parcelSheet.addRows(parcels);

  const compSheet = workbook.addWorksheet('Compensation');
  compSheet.columns = [
    { header: 'Parcel Code', key: 'parcel_code', width: 15 },
    { header: 'Owner', key: 'owner_name', width: 20 },
    { header: 'Amount Assessed', key: 'amount_assessed', width: 18 },
    { header: 'Amount Paid', key: 'amount_paid', width: 18 },
    { header: 'Status', key: 'status', width: 12 },
  ];
  compSheet.addRows(compensation);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="mis_report.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
