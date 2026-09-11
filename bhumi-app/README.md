# Real-Time National Land Acquisition & Management System (v2)

A full-stack, hackathon-scale platform that makes the land acquisition lifecycle —
proposal → survey → compensation → possession → rehabilitation — transparent and
trackable for farmers, district/state officers, central ministry, and project
agencies. v2 of an earlier build: same core feature set, rebuilt with a proper
landing experience, mobile+Aadhaar-style login, guest mode, Hindi/English support,
and a design pass so it doesn't look like a generic template.

See [`PRD.md`](./PRD.md) for the full product spec and [`TRD.md`](./TRD.md) for the
technical design — this file is the quick-start + orientation doc.

## What makes this v2 different from v1
- **Layered scroll landing page** instead of dropping straight into a login screen —
  info layer → "how it works" layer → account/settings layer → the real app.
- **Mobile number + OTP login**, with a simulated Aadhaar-style verification step
  required before a farmer can register land.
- **Guest mode** — browse and use the farmer chatbot without an account.
- **Hindi/English toggle** across the whole site.
- **3D-styled parcel visualization** alongside the existing Leaflet GIS map.
- Pastel-to-neutral visual design, intentionally not another purple-gradient AI
  template.
- A database driver decision that avoids v1's native-module install failure in a
  fresh Codespace (see TRD §2).

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS, Framer Motion, react-i18next |
| Backend | Node.js + Express |
| Database | SQLite (driver TBD between `better-sqlite3` + devcontainer build tools, or a zero-native-deps option — see TRD §2) |
| Maps | Leaflet + OpenStreetMap |
| Charts | Recharts |
| Auth | JWT, mobile + OTP (simulated), Aadhaar-style verification (simulated) |
| Reports | PDFKit + ExcelJS |

> Real Aadhaar/UIDAI, real SMS/OTP providers, and real satellite imagery (ISRO Bhuvan)
> require paid accounts and government approval — these are built as clearly-labeled
> simulations so the architecture is correct and swappable later.

## Project Structure
```
land-acquisition-system/
├── .devcontainer/            # Codespaces config (build tools for SQLite)
├── backend/
│   ├── server.js
│   ├── db/                   # schema + seed data
│   ├── middleware/            # auth (JWT, role-based access)
│   └── routes/                # one file per module
└── frontend/
    └── src/
        ├── pages/             # landing layers + app pages
        ├── components/         # ParcelBlock (3D), Navbar, VoiceInput, etc.
        ├── i18n/               # en.json / hi.json
        ├── context/            # Auth context
        └── api/client.js
```

## Setup & Run (GitHub Codespaces)
```bash
npm install       # installs root + workspaces, or run per-folder if not using workspaces
npm run dev        # starts backend (:5000) and frontend (:5173) together
```
If `npm install` fails on the SQLite driver, see `TRD.md` §2 — it documents exactly
why that happens and both fixes.

## Roles & Demo Access
| Role | How to access |
|---|---|
| Guest | No login — enter from the landing page |
| Farmer | Mobile number + OTP (seeded demo numbers, see seed script) |
| District / State / Central / Agency officers | Mobile number + OTP (seeded demo accounts) |

## Feature Checklist
- [ ] Mobile + OTP login, Aadhaar-style verification before land registration
- [ ] Guest mode
- [ ] Hindi/English toggle
- [ ] Role-based dashboards
- [ ] Proposal submission & approval workflow
- [ ] GIS map + 3D parcel visualization
- [ ] Explainable compensation calculator
- [ ] Possession status tracker
- [ ] Rehabilitation & resettlement + priority scoring
- [ ] Document management + duplicate checker
- [ ] Litigation risk indicator
- [ ] Satellite-based encroachment checker
- [ ] Farmer chatbot (guest-accessible)
- [ ] Gamified state ranking
- [ ] Unused acquired land finder
- [ ] Voice-based data entry
- [ ] MIS reports (PDF/Excel)
- [ ] Notifications & alerts

## Status
Planning stage — this README, `PRD.md`, and `TRD.md` are the spec to be reviewed
before implementation starts.
