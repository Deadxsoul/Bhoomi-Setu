# Bhumi — National Land Acquisition & Management System

**Bhumi** is a full-stack platform that makes the journey of land transparent and trackable — from project proposals and parcel identification through compensation, possession, rehabilitation, documentation, land history, and even private land sales — for farmers, district/state officers, the central ministry, project agencies, and police verification officers, all on one system.

> **Hackathon / Demo Project** — Aadhaar/UIDAI, SMS OTP, Google auth, satellite imagery, and notification delivery are all simulated for demonstration. None are connected to live government or commercial services.

---

## Table of Contents
- [Problem & Approach](#problem--approach)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Two Core Workflows](#two-core-workflows)
- [Land History Tracker](#land-history-tracker)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database](#database)
- [API Reference](#api-reference)
- [Setup & Running](#setup--running)
- [Demo Accounts & OTP](#demo-accounts--otp)
- [Environment Variables](#environment-variables)
- [Demo Limitations](#demo-limitations)
- [Future Scope](#future-scope)

---

## Problem & Approach

Land acquisition spans many stakeholders and stages — **Proposal → Survey → Notification → Compensation → Possession → Rehabilitation** — usually across disconnected offices with no shared record. Bhumi puts every party on one system, looking at the same data, so nothing gets lost between departments and no one (especially the farmer) is left guessing what's happening to their land.

---

## Key Features

| Feature | What it does |
|---|---|
| **Mobile + OTP login** | 6-digit OTP, 5-minute expiry, simulated SMS (shown in dev mode) |
| **Guest mode** | Browse and use the chatbot without an account |
| **Google login (demo)** | Simulated — creates/retrieves a demo account, no real OAuth |
| **Aadhaar-style land registration** | Name, DOB, land ID, survey number, area, village/district/state + simulated 12-digit Aadhaar + OTP verification |
| **Role-based dashboards** | Live KPIs — projects, parcels, possession rate, compensation disbursed, resettled families — plus state-wise and project-wise breakdowns |
| **Proposal workflow** | Submitted → District → State → Central review → Approved/Rejected, with notifications and history logging at each stage |
| **GIS parcel map** | Leaflet + OpenStreetMap, parcels color-coded by litigation risk (0 disputes = low, 1–2 = medium, 3+ = high) |
| **Unused land finder** | Haversine-distance search for acquired-but-unused parcels near a point |
| **Compensation calculator** | Explainable: base rate × area + location factor + connectivity bonus, shown as separate components, not just a total |
| **Possession tracking** | Handover status, date, and verifying officer — auto-updates parcel status |
| **Rehabilitation & resettlement** | Family size, income, and agriculture-dependency feed a priority score; officers register and mark families resettled |
| **Document management** | SHA-256 hashing flags exact duplicates automatically; versioned by filename + parcel |
| **Satellite/encroachment checker** | Pixel-difference comparison of before/after images (≤10% none, >10% moderate, >25% high probability) — a demo workflow, not real remote sensing |
| **Farmer chatbot** | Query any Land ID for status, compensation, and possession — works without login, English + Hindi |
| **State ranking** | Speed (possession rate), transparency (compensation paid %), and satisfaction (dispute frequency) combine into a live leaderboard |
| **Voice data entry** | Browser Web Speech API on the rehabilitation form |
| **MIS reports** | PDF and multi-sheet Excel exports |
| **Government schemes reference** | RFCTLARR, DILRMP, ULPIN, SVAMITVA, stamp-duty concessions, PMAY-Gramin — informational, not administered by the app |
| **Private land buy/sell** | Peer-to-peer sale workflow with police verification (see below) |
| **Land history tracker** | One Land ID, full timeline across both acquisition and private-sale history |
| **Hindi/English toggle** | Full i18next translation across the interface |

---

## User Roles

| Role | Responsibility |
|---|---|
| Farmer | Track their land, compensation, possession, rehabilitation, transactions |
| District Officer | Review projects; manage parcels, compensation, possession, rehabilitation |
| State Officer | State-level approvals and analytics |
| Central Ministry | National oversight |
| Project Agency | Submit and manage acquisition projects |
| Police Officer | Verify private land sale transactions |

Enforced via JWT + role-based middleware.

---

## Two Core Workflows

**Government acquisition:**
`Proposal → Review/Approval → Land Identification → GIS Mapping → Compensation → Possession → Rehabilitation → Land History`

**Private land sale:**
`Seller/Buyer submits → Land + party details → Required documents → Police Verification → Approve/Reject → Sold/Rejected`

Required seller documents: sale deed, encumbrance certificate, property tax receipt, seller ID proof.
Required buyer documents: buyer ID proof (agreement to sell optional). Max 20MB/file. Only the `police` role can access the verification queue and approve/reject with notes.

---

## Land History Tracker

Enter a Land ID, see two switchable sections:
1. **Buy & Sell History** — every private transaction for that ID (parties, price, dates, status, documents, rejection reason if any).
2. **Government Acquisition History** — the full timeline (proposal → identification → compensation → possession → rehabilitation), append-only so past milestones are never overwritten.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Router |
| i18n | i18next + react-i18next |
| Maps/Charts | Leaflet + OpenStreetMap, Recharts |
| Backend | Node.js, Express.js |
| Database | SQLite via better-sqlite3 |
| Auth | JWT |
| Uploads/Images | Multer, Jimp |
| Reports | PDFKit, ExcelJS |
| Voice | Browser Web Speech API |

---

## Project Structure
```
bhumi-app/
├── frontend/src/
│   ├── api/, context/, components/, i18n/
│   └── pages/  (Home, Login, Dashboard, Projects, MapView, Compensation,
│                Possession, Rehabilitation, Documents, Satellite, StateRanking,
│                Chatbot, Reports, Profile, AadhaarRegister, Schemes,
│                LandTransactions*, LandHistory)
└── backend/
    ├── middleware/auth.js
    ├── db/ (init.js, seed.js, history.js)
    └── routes/ (auth, proposals, parcels, compensation, possession,
                 rehabilitation, documents, satellite, chatbot, dashboard,
                 reports, notifications, landTransactions, landHistory)
```

---

## Database
SQLite tables: `users, otp_codes, projects, proposals, land_parcels, compensation, possession, rehabilitation, documents, notifications, state_stats, land_transactions, transaction_documents, land_history_events`.

`Project → Proposals / Land Parcels → Compensation / Possession / Rehabilitation / Documents / History`, with private transactions tracked separately per Land ID.

---

## API Reference

```
Auth            POST /api/auth/otp/send·verify, /guest, /demo-login, /google, /aadhaar/send·verify · GET/PATCH /me
Projects        GET/POST /api/projects · GET /api/proposals/:projectId · PATCH /api/proposals/:id/advance
Parcels         GET/POST /api/parcels · GET /api/parcels/:id · PATCH /api/parcels/:id/status · GET /api/parcels/unused/nearby
Compensation    GET /api/compensation(/parcel/:id) · POST /calculate, /parcel/:id · PATCH /:id/pay
Possession      GET /api/possession · PATCH /api/possession/:parcelId
Rehabilitation  GET/POST /api/rehabilitation · PATCH /:id/resettle
Documents       GET /api/documents · POST /upload · GET /:id/download
Satellite       POST /api/satellite/:parcelId/compare
Chatbot         POST /api/chatbot/query
Dashboard       GET /api/dashboard/summary·state-wise·project-progress·state-ranking
Reports         GET /api/reports/pdf·excel
Notifications   GET /api/notifications · PATCH /:id/read
Transactions    GET /api/land-transactions/required-docs·mine·queue·:id · POST / · PATCH /:id/verify
Land History    GET /api/land-history/:landId
Health          GET /api/health
```

---

## Setup & Running

```bash
cd bhumi-app
npm install
cp backend/.env.example backend/.env   # Windows: copy backend\.env.example backend\.env
npm run seed
npm run dev
```
Frontend → `http://localhost:5173` · Backend → `http://localhost:5000`

To run separately: `cd backend && npm install && npm run dev` / `cd frontend && npm install && npm run dev`.
Production build: `cd frontend && npm run build` (preview with `npm run preview`).

---

## Demo Accounts & OTP

| Role | Name | Mobile |
|---|---|---|
| Central Ministry | Central Ministry | `9000000001` |
| State Officer | Rajasthan State Office | `9000000002` |
| District Officer | Jaipur District Office | `9000000003` |
| Project Agency | NHAI Project Agency | `9000000004` |
| Farmer | Ramesh Kumar | `9000000005` |
| Farmer | Sunita Devi | `9000000006` |
| Police | Jaipur Police (Land Verification) | `9000000007` |

One-click demo login buttons are on the login page. With `OTP_DEV_MODE=true`, the OTP is printed to the backend console and returned in the API response — no real SMS is sent.

---

## Environment Variables

```env
PORT=5000
JWT_SECRET=change_this_to_a_long_random_secret
DB_PATH=./db/bhumi.sqlite
OTP_DEV_MODE=true
GOOGLE_CLIENT_ID=
```
Never commit a real `.env` — only `.env.example` should be in version control.

Uploads are stored locally: `backend/uploads/`, `backend/uploads/land-transactions/`, `backend/uploads/satellite/` — fine for a demo, not for production.

---

## Demo Limitations

Everything below is simulated, clearly labeled in the UI, and not connected to a real external service:
- **Aadhaar** — mock verification, not UIDAI-connected. Don't enter real Aadhaar numbers.
- **OTP/SMS** — generated locally, no SMS gateway.
- **Google login** — demo account only, not real OAuth.
- **Satellite** — pixel-difference comparison of uploaded images, not real remote sensing.
- **Notifications** — logged server-side, no real email/SMS delivery.
- **Police verification** — simulated through the app's police account, not a real government system.

Before any production deployment: real SMS/UIDAI-approved verification, production OAuth, HTTPS, secure file storage + malware scanning, resource-level access control, audit logging, rate limiting, and proper secret management would all be required.

---

## Future Scope
Real government identity integrations · real SMS/WhatsApp · live satellite imagery + AI change detection · ULPIN integration · digital signatures · blockchain-backed audit trails · cloud file storage · mobile apps · real-time officer alerts · AI-assisted document verification · expanded multilingual support.

---

## License
Developed as a hackathon/academic demonstration. Government names, schemes, laws, and sample data are used for educational purposes only — real-world deployment would require appropriate legal, security, and governmental approvals.
