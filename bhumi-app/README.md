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
- [x] Mobile + OTP login (working end-to-end: send → verify → session persists on refresh)
- [x] Guest mode
- [x] Hindi/English language switch (react-i18next — nav bar + login; feature pages still English text)
- [x] Role-based dashboards (`/app/dashboard`, KPI cards + charts, real seeded data)
- [x] Proposal submission & approval workflow (`/app/projects`)
- [x] GIS map + litigation risk markers (`/app/map`) — 3D parcel block visualization not built
- [x] Explainable compensation calculator (`/app/compensation`)
- [x] Possession status tracker (`/app/possession`)
- [x] Rehabilitation & resettlement + priority scoring (`/app/rehabilitation`)
- [x] Document management + duplicate checker (`/app/documents`)
- [x] Litigation risk indicator (color-coded markers on the GIS map)
- [x] Satellite-based encroachment checker (`/app/satellite`, pixel-diff demo)
- [x] Farmer chatbot (`/app/chatbot`, public API — reachable in guest mode too)
- [x] Gamified state ranking (`/app/ranking`)
- [x] Unused acquired land finder (click a parcel marker on the map)
- [x] Voice-based data entry (mic button on the Rehabilitation form, Web Speech API)
- [x] MIS reports — PDF/Excel (`/app/reports`)
- [x] Notifications & alerts (backend route + table; no bell/UI icon wired in yet)
- [ ] Aadhaar-style verification UI (backend routes exist, no frontend screen yet)
- [ ] Scroll landing page (Layers 1–3) — `/` still goes straight to `/login`
- [ ] 3D parcel block visualization (`ParcelBlock` component)

## Status
Core app is feature-complete and tested end-to-end against the PRD's "Must" and
"Should" list, connected to the mobile+OTP login. Still open: the scroll landing
page, the 3D parcel view, and full page-level translation.
