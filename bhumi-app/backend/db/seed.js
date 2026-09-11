// db/seed.js
// Creates one demo account per role, used by the login page's role
// quick-access buttons. Demo phone numbers only — not real numbers.

const db = require('./init');

const demoUsers = [
  { name: 'Central Ministry',      phone: '9000000001', role: 'central',  state: null,        district: null,    land_id: null,        aadhaar_verified: 0 },
  { name: 'Rajasthan State Office', phone: '9000000002', role: 'state',    state: 'Rajasthan', district: null,    land_id: null,        aadhaar_verified: 0 },
  { name: 'Jaipur District Office', phone: '9000000003', role: 'district', state: 'Rajasthan', district: 'Jaipur', land_id: null,        aadhaar_verified: 0 },
  { name: 'NHAI Project Agency',    phone: '9000000004', role: 'agency',   state: 'Rajasthan', district: 'Jaipur', land_id: null,        aadhaar_verified: 0 },
  { name: 'Ramesh Kumar',           phone: '9000000005', role: 'farmer',   state: 'Rajasthan', district: 'Jaipur', land_id: 'RJ-JPR-0001', aadhaar_verified: 1 },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO users (name, phone, role, state, district, land_id, aadhaar_verified)
  VALUES (@name, @phone, @role, @state, @district, @land_id, @aadhaar_verified)
`);

const tx = db.transaction((rows) => {
  for (const row of rows) insert.run(row);
});

tx(demoUsers);

console.log(`Seeded ${demoUsers.length} demo accounts (one per role).`);
console.log('Demo phone numbers: ' + demoUsers.map(u => `${u.role} → ${u.phone}`).join(', '));
