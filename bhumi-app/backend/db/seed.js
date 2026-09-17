// db/seed.js
// Creates one demo account per role (used by the login page's role
// quick-access buttons) plus a full set of demo projects/parcels/
// compensation/possession/rehabilitation records so every feature page
// has real data to show immediately after setup.

const db = require('./init');
const { logEvent } = require('./history');

const demoUsers = [
  { name: 'Central Ministry',       phone: '9000000001', role: 'central',  state: null,        district: null,     land_id: null,          aadhaar_verified: 0 },
  { name: 'Rajasthan State Office', phone: '9000000002', role: 'state',    state: 'Rajasthan', district: null,     land_id: null,          aadhaar_verified: 0 },
  { name: 'Jaipur District Office', phone: '9000000003', role: 'district', state: 'Rajasthan', district: 'Jaipur', land_id: null,          aadhaar_verified: 0 },
  { name: 'NHAI Project Agency',    phone: '9000000004', role: 'agency',   state: 'Rajasthan', district: 'Jaipur', land_id: null,          aadhaar_verified: 0 },
  { name: 'Ramesh Kumar',           phone: '9000000005', role: 'farmer',   state: 'Rajasthan', district: 'Jaipur', land_id: 'RJ-JPR-0001', aadhaar_verified: 1 },
  { name: 'Sunita Devi',            phone: '9000000006', role: 'farmer',   state: 'Rajasthan', district: 'Jaipur', land_id: 'RJ-JPR-0002', aadhaar_verified: 1 },
  { name: 'Jaipur Police (Land Verification)', phone: '9000000007', role: 'police', state: 'Rajasthan', district: 'Jaipur', land_id: null, aadhaar_verified: 0 },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, phone, role, state, district, land_id, aadhaar_verified)
  VALUES (@name, @phone, @role, @state, @district, @land_id, @aadhaar_verified)
`);

const seedUsers = db.transaction((rows) => {
  for (const row of rows) insertUser.run(row);
});
seedUsers(demoUsers);

console.log(`Seeded ${demoUsers.length} demo accounts (one per role, two farmers).`);
console.log('Demo phone numbers: ' + demoUsers.map(u => `${u.role} → ${u.phone}`).join(', '));

// Resolve canonical ids by phone (safe whether this is the first seed run
// or a re-run where INSERT OR IGNORE skipped existing rows).
const idByPhone = {};
for (const u of demoUsers) {
  idByPhone[u.phone] = db.prepare('SELECT id FROM users WHERE phone = ?').get(u.phone).id;
}

// ---------- Feature demo data (projects → parcels → compensation → ...) ----------
// Only seed this once — re-running `npm run seed` shouldn't duplicate
// projects/parcels (parcel_code is UNIQUE and would throw on a second run).
const alreadySeeded = db.prepare('SELECT COUNT(*) c FROM projects').get().c > 0;

if (alreadySeeded) {
  console.log('Feature demo data (projects/parcels/etc.) already present — skipping.');
} else {
  const insertProject = db.prepare(`
    INSERT INTO projects (name, type, state, district, implementing_agency, status, created_by)
    VALUES (@name, @type, @state, @district, @implementing_agency, @status, @created_by)
  `);
  const insertProposal = db.prepare(`
    INSERT INTO proposals (project_id, stage, remarks, submitted_by)
    VALUES (@project_id, @stage, @remarks, @submitted_by)
  `);
  const insertParcel = db.prepare(`
    INSERT INTO land_parcels
      (project_id, parcel_code, owner_name, owner_contact, area_acres, latitude, longitude,
       geojson, base_rate, location_factor, connectivity_bonus, dispute_count, status)
    VALUES
      (@project_id, @parcel_code, @owner_name, @owner_contact, @area_acres, @latitude, @longitude,
       @geojson, @base_rate, @location_factor, @connectivity_bonus, @dispute_count, @status)
  `);
  const insertCompensation = db.prepare(`
    INSERT INTO compensation (parcel_id, amount_assessed, amount_paid, breakdown_json, status)
    VALUES (@parcel_id, @amount_assessed, @amount_paid, @breakdown_json, @status)
  `);
  const insertPossession = db.prepare(`
    INSERT INTO possession (parcel_id, handed_over, handover_date, verified_by)
    VALUES (@parcel_id, @handed_over, @handover_date, @verified_by)
  `);
  const insertRehab = db.prepare(`
    INSERT INTO rehabilitation
      (parcel_id, family_name, family_size, monthly_income, agriculture_dependency, resettled, priority_score)
    VALUES
      (@parcel_id, @family_name, @family_size, @monthly_income, @agriculture_dependency, @resettled, @priority_score)
  `);
  const insertStateStats = db.prepare(`
    INSERT INTO state_stats (state, speed_score, transparency_score, satisfaction_score, total_score)
    VALUES (@state, @speed_score, @transparency_score, @satisfaction_score, @total_score)
  `);

  const seedFeatureData = db.transaction(() => {
    // ---- Projects ----
    const projects = [
      { name: 'NH-48 Widening Project', type: 'highway', state: 'Rajasthan', district: 'Jaipur', implementing_agency: 'NHAI', status: 'awarded', created_by: idByPhone['9000000004'] },
      { name: 'Delhi-Mumbai Rail Corridor', type: 'railway', state: 'Gujarat', district: 'Vadodara', implementing_agency: 'Indian Railways', status: 'possession', created_by: idByPhone['9000000001'] },
      { name: 'Indira Gandhi Canal Extension', type: 'irrigation', state: 'Rajasthan', district: 'Bikaner', implementing_agency: 'Water Resources Dept', status: 'notified', created_by: idByPhone['9000000002'] },
      { name: 'Pune Industrial Corridor', type: 'industrial', state: 'Maharashtra', district: 'Pune', implementing_agency: 'MIDC', status: 'proposed', created_by: idByPhone['9000000001'] },
    ];
    const projectIds = projects.map((p) => insertProject.run(p).lastInsertRowid);

    // ---- Proposal workflow entries ----
    insertProposal.run({ project_id: projectIds[0], stage: 'approved', remarks: 'Cleared after district + state review', submitted_by: idByPhone['9000000004'] });
    insertProposal.run({ project_id: projectIds[1], stage: 'approved', remarks: 'Central clearance granted', submitted_by: idByPhone['9000000001'] });
    insertProposal.run({ project_id: projectIds[2], stage: 'state_review', remarks: 'Awaiting state water board sign-off', submitted_by: idByPhone['9000000002'] });
    insertProposal.run({ project_id: projectIds[3], stage: 'submitted', remarks: 'Initial submission, pending district review', submitted_by: idByPhone['9000000001'] });

    // ---- Land parcels with GIS coords ----
    const parcels = [
      { project_id: projectIds[0], parcel_code: 'RJ-JPR-0001', owner_name: 'Ramesh Kumar', owner_contact: '9000000005', area_acres: 2.5, latitude: 26.9124, longitude: 75.7873, geojson: null, base_rate: 1500000, location_factor: 1.2, connectivity_bonus: 100000, dispute_count: 0, status: 'compensated' },
      { project_id: projectIds[0], parcel_code: 'RJ-JPR-0002', owner_name: 'Sunita Devi', owner_contact: '9000000006', area_acres: 1.8, latitude: 26.9200, longitude: 75.8000, geojson: null, base_rate: 1500000, location_factor: 1.1, connectivity_bonus: 50000, dispute_count: 2, status: 'notified' },
      { project_id: projectIds[1], parcel_code: 'GJ-VAD-0011', owner_name: 'Bharat Patel', owner_contact: '9800000003', area_acres: 3.2, latitude: 22.3072, longitude: 73.1812, geojson: null, base_rate: 2000000, location_factor: 1.3, connectivity_bonus: 150000, dispute_count: 0, status: 'possessed' },
      { project_id: projectIds[1], parcel_code: 'GJ-VAD-0012', owner_name: 'Kiran Shah', owner_contact: '9800000004', area_acres: 4.0, latitude: 22.3100, longitude: 73.2000, geojson: null, base_rate: 2000000, location_factor: 1.0, connectivity_bonus: 0, dispute_count: 5, status: 'possessed' },
      { project_id: projectIds[2], parcel_code: 'RJ-BKN-0021', owner_name: 'Mohan Singh', owner_contact: '9800000005', area_acres: 5.5, latitude: 28.0229, longitude: 73.3119, geojson: null, base_rate: 900000, location_factor: 0.9, connectivity_bonus: 20000, dispute_count: 1, status: 'identified' },
      { project_id: projectIds[3], parcel_code: 'MH-PUN-0031', owner_name: 'Anil Deshmukh', owner_contact: '9800000006', area_acres: 6.0, latitude: 18.5204, longitude: 73.8567, geojson: null, base_rate: 3000000, location_factor: 1.4, connectivity_bonus: 200000, dispute_count: 0, status: 'unused' },
    ];
    const parcelIds = parcels.map((p) => insertParcel.run(p).lastInsertRowid);

    // ---- Compensation records (explainable breakdown) ----
    function calcCompensation(p) {
      const base = p.base_rate * p.area_acres;
      const locationAdj = base * (p.location_factor - 1);
      const total = base + locationAdj + p.connectivity_bonus;
      return { total: Math.round(total) };
    }
    parcels.forEach((p, i) => {
      const b = calcCompensation(p);
      insertCompensation.run({
        parcel_id: parcelIds[i],
        amount_assessed: b.total,
        amount_paid: p.status === 'compensated' || p.status === 'possessed' ? b.total : (p.status === 'notified' ? Math.round(b.total * 0.3) : 0),
        breakdown_json: JSON.stringify(b),
        status: p.status === 'compensated' || p.status === 'possessed' ? 'paid' : (p.status === 'notified' ? 'partial' : 'pending'),
      });
    });

    // ---- Possession ----
    insertPossession.run({ parcel_id: parcelIds[0], handed_over: 1, handover_date: '2025-11-10', verified_by: idByPhone['9000000003'] });
    insertPossession.run({ parcel_id: parcelIds[1], handed_over: 0, handover_date: null, verified_by: null });
    insertPossession.run({ parcel_id: parcelIds[2], handed_over: 1, handover_date: '2025-08-01', verified_by: idByPhone['9000000001'] });
    insertPossession.run({ parcel_id: parcelIds[3], handed_over: 1, handover_date: '2025-09-15', verified_by: idByPhone['9000000001'] });
    insertPossession.run({ parcel_id: parcelIds[4], handed_over: 0, handover_date: null, verified_by: null });
    insertPossession.run({ parcel_id: parcelIds[5], handed_over: 0, handover_date: null, verified_by: null });

    // ---- Rehabilitation (priority score = f(family size, low income, agri dependency)) ----
    function priorityScore(familySize, income, agriDep) {
      const sizeScore = Math.min(familySize / 10, 1) * 40;
      const incomeScore = Math.max(0, (20000 - income) / 20000) * 40;
      const agriScore = agriDep * 20;
      return Math.round(sizeScore + incomeScore + agriScore);
    }
    const rehabRows = [
      { parcel_id: parcelIds[2], family_name: 'Patel Family', family_size: 6, monthly_income: 8000, agriculture_dependency: 0.9, resettled: 1 },
      { parcel_id: parcelIds[3], family_name: 'Shah Family', family_size: 9, monthly_income: 5000, agriculture_dependency: 0.7, resettled: 0 },
      { parcel_id: parcelIds[1], family_name: 'Devi Family', family_size: 4, monthly_income: 15000, agriculture_dependency: 0.5, resettled: 0 },
    ];
    for (const r of rehabRows) {
      insertRehab.run({ ...r, priority_score: priorityScore(r.family_size, r.monthly_income, r.agriculture_dependency) });
    }

    // ---- Land History Tracker: backfilled government timeline (dated events) ----
    // Real dates for each stage a parcel has been through, so the Land History
    // page has something to show the moment the app boots, not just after a
    // judge clicks through the workflow live.
    function seedGovHistory(parcelIndex, events) {
      const landId = parcels[parcelIndex].parcel_code;
      for (const [event_date, event_type, title, description, amount, status] of events) {
        logEvent({
          land_id: landId,
          category: 'government',
          event_type,
          title,
          description: description || null,
          amount: amount || null,
          status: status || 'done',
          event_date,
          related_parcel_id: parcelIds[parcelIndex],
        });
      }
    }

    seedGovHistory(0, [ // RJ-JPR-0001 — Ramesh Kumar — fully compensated & possessed
      ['2025-06-02', 'proposal_stage', 'Proposal approved', 'NH-48 Widening Project cleared after district + state review'],
      ['2025-06-10', 'parcel_status', 'Land identified for acquisition'],
      ['2025-06-25', 'parcel_status', 'Acquisition notice issued'],
      ['2025-07-05', 'compensation_assessed', 'Compensation assessed', null, 1980000],
      ['2025-07-20', 'compensation_paid', 'Compensation paid in full', '₹19,80,000 paid (total paid so far: ₹19,80,000)', 1980000],
      ['2025-11-10', 'possession_handover', 'Possession handed over to the government'],
    ]);

    seedGovHistory(1, [ // RJ-JPR-0002 — Sunita Devi — notified, partially paid, 2 disputes
      ['2025-06-02', 'proposal_stage', 'Proposal approved', 'NH-48 Widening Project cleared after district + state review'],
      ['2025-06-12', 'parcel_status', 'Land identified for acquisition'],
      ['2025-06-28', 'parcel_status', 'Acquisition notice issued'],
      ['2025-07-08', 'compensation_assessed', 'Compensation assessed', null, 1705000],
      ['2025-08-01', 'compensation_partial_payment', 'Partial compensation payment received', '₹5,11,500 paid (total paid so far: ₹5,11,500)', 511500],
    ]);

    seedGovHistory(2, [ // GJ-VAD-0011 — Bharat Patel — possessed, family resettled
      ['2025-01-15', 'proposal_stage', 'Proposal approved', 'Delhi-Mumbai Rail Corridor — central clearance granted'],
      ['2025-02-01', 'parcel_status', 'Land identified for acquisition'],
      ['2025-02-20', 'parcel_status', 'Acquisition notice issued'],
      ['2025-03-10', 'compensation_assessed', 'Compensation assessed', null, 8320000],
      ['2025-04-05', 'compensation_paid', 'Compensation paid in full', '₹83,20,000 paid (total paid so far: ₹83,20,000)', 8320000],
      ['2025-08-01', 'possession_handover', 'Possession handed over to the government'],
      ['2025-08-20', 'rehabilitation_registered', 'Registered for rehabilitation & resettlement', 'Family: Patel Family'],
      ['2025-09-05', 'rehabilitation_resettled', 'Family resettled', 'Family: Patel Family'],
    ]);

    seedGovHistory(3, [ // GJ-VAD-0012 — Kiran Shah — possessed, family not yet resettled
      ['2025-01-15', 'proposal_stage', 'Proposal approved', 'Delhi-Mumbai Rail Corridor — central clearance granted'],
      ['2025-02-03', 'parcel_status', 'Land identified for acquisition'],
      ['2025-02-22', 'parcel_status', 'Acquisition notice issued'],
      ['2025-03-12', 'compensation_assessed', 'Compensation assessed', null, 8000000],
      ['2025-04-18', 'compensation_paid', 'Compensation paid in full', '₹80,00,000 paid (total paid so far: ₹80,00,000)', 8000000],
      ['2025-09-15', 'possession_handover', 'Possession handed over to the government'],
      ['2025-09-28', 'rehabilitation_registered', 'Registered for rehabilitation & resettlement', 'Family: Shah Family'],
    ]);

    seedGovHistory(4, [ // RJ-BKN-0021 — Mohan Singh — still early, only identified
      ['2025-08-01', 'proposal_stage', 'Under state review', 'Indira Gandhi Canal Extension — awaiting state water board sign-off'],
      ['2025-08-20', 'parcel_status', 'Land identified for acquisition'],
    ]);

    seedGovHistory(5, [ // MH-PUN-0031 — Anil Deshmukh — acquired but left unused
      ['2025-03-01', 'proposal_stage', 'Proposal submitted', 'Pune Industrial Corridor — initial submission, pending district review'],
      ['2025-03-10', 'parcel_status', 'Land identified for acquisition'],
      ['2025-09-01', 'parcel_status', 'Marked as unused acquired land'],
    ]);

    // ---- Land History Tracker: backfilled private buy/sell deals ----
    // One completed sale and one rejected sale, against the same land IDs
    // farmers already hold in the government process above, so switching
    // between the two history sections for RJ-JPR-0001 / RJ-JPR-0002 shows
    // something real in both.
    const insertTransaction = db.prepare(`
      INSERT INTO land_transactions
        (land_id, survey_number, village, district, state, area_acres, agreed_price,
         initiated_by, initiated_as,
         seller_user_id, seller_name, seller_aadhaar, seller_contact,
         buyer_user_id, buyer_name, buyer_aadhaar, buyer_contact,
         status, approx_verification_days, verifying_officer_id, verification_notes,
         submitted_at, verified_at)
      VALUES
        (@land_id, @survey_number, @village, @district, @state, @area_acres, @agreed_price,
         @initiated_by, @initiated_as,
         @seller_user_id, @seller_name, @seller_aadhaar, @seller_contact,
         @buyer_user_id, @buyer_name, @buyer_aadhaar, @buyer_contact,
         @status, @approx_verification_days, @verifying_officer_id, @verification_notes,
         @submitted_at, @verified_at)
    `);

    insertTransaction.run({
      land_id: 'RJ-JPR-0001', survey_number: '112/4', village: 'Sitapura', district: 'Jaipur', state: 'Rajasthan',
      area_acres: 1.0, agreed_price: 950000,
      initiated_by: idByPhone['9000000005'], initiated_as: 'seller',
      seller_user_id: idByPhone['9000000005'], seller_name: 'Ramesh Kumar', seller_aadhaar: null, seller_contact: '9000000005',
      buyer_user_id: null, buyer_name: 'Suresh Yadav', buyer_aadhaar: null, buyer_contact: '9812345670',
      status: 'sold', approx_verification_days: 6, verifying_officer_id: idByPhone['9000000007'],
      verification_notes: 'All documents verified. Approved.',
      submitted_at: '2025-02-10 10:00:00', verified_at: '2025-02-18 15:30:00',
    });

    insertTransaction.run({
      land_id: 'RJ-JPR-0002', survey_number: '98/2', village: 'Sanganer', district: 'Jaipur', state: 'Rajasthan',
      area_acres: 0.5, agreed_price: 420000,
      initiated_by: idByPhone['9000000006'], initiated_as: 'seller',
      seller_user_id: idByPhone['9000000006'], seller_name: 'Sunita Devi', seller_aadhaar: null, seller_contact: '9000000006',
      buyer_user_id: null, buyer_name: 'Vikram Singh', buyer_aadhaar: null, buyer_contact: '9823456781',
      status: 'rejected', approx_verification_days: 5, verifying_officer_id: idByPhone['9000000007'],
      verification_notes: "Encumbrance certificate did not match the seller's name on record.",
      submitted_at: '2025-04-05 09:15:00', verified_at: '2025-04-12 11:00:00',
    });

    // ---- State ranking seed (recomputed live too, but useful initial cache) ----
    insertStateStats.run({ state: 'Rajasthan', speed_score: 72, transparency_score: 80, satisfaction_score: 65, total_score: 72.3 });
    insertStateStats.run({ state: 'Gujarat', speed_score: 88, transparency_score: 75, satisfaction_score: 82, total_score: 81.7 });
    insertStateStats.run({ state: 'Maharashtra', speed_score: 55, transparency_score: 60, satisfaction_score: 58, total_score: 57.7 });
  });

  seedFeatureData();
  console.log('Seeded 4 projects, 6 land parcels, and their compensation/possession/rehabilitation records.');
}
