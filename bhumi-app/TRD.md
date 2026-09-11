# TRD — National Land Acquisition & Management System (v2)

## 1. Architecture Overview
Same overall shape as v1 (it was sound): a React SPA talking to a Node/Express REST
API backed by SQLite, run as two dev servers inside one GitHub Codespace. v2 changes
the **auth model**, adds an **i18n layer**, and swaps/hardens the **DB driver** so it
doesn't fail on first `npm install` the way v1 did in a fresh container.

```
┌─────────────────────┐        ┌──────────────────────┐
│  Frontend (Vite)     │ /api → │  Backend (Express)    │
│  React + Tailwind     │◄──────┤  JWT auth, REST routes │
│  Framer Motion (scroll)│      │  SQLite (see §3)       │
│  react-i18next (hi/en)│       └──────────┬─────────────┘
│  Leaflet + 3D layer    │                  │
└─────────────────────┘                  SQLite file
```

## 2. Why v1 broke (root cause, carried into this design)
v1 used `better-sqlite3`, a **native** module compiled at `npm install` time via
`node-gyp`. In a fresh container this needs matching build tools, Python, and network
access to download Node headers — any one missing/blocked and `npm install` fails
silently or with a wall of `gyp ERR!` output, and nothing downstream works. This is the
single most likely reason the Codespace build died.

**Decision for v2:** don't re-fight this blind. Two acceptable paths, pick one at build
time depending on what the Codespace environment actually has:

- **Option A (preferred if devcontainer has build tools):** keep `better-sqlite3` for
  its speed and synchronous API, but ship a `.devcontainer/devcontainer.json` that
  installs `build-essential` + `python3` explicitly, so `npm install` never depends on
  what the base image happens to have.
- **Option B (zero native deps, safest fallback):** use `sql.js` (SQLite compiled to
  WASM) or Node's built-in `node:sqlite` (stable-enough in Node 22, which this
  environment already has) — no compilation step at all, install can never fail this
  way.

Either way, the schema and query layer should be written behind a thin `db.js` wrapper
so switching drivers later is a one-file change, not a rewrite.

## 3. Tech Stack
| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | unchanged from v1 |
| Animation/scroll | Framer Motion (+ optionally GSAP ScrollTrigger) | for the layered/parallax landing page |
| i18n | react-i18next | Hindi/English toggle across all layers |
| 3D/parcel visuals | CSS 3D transforms or react-three-fiber for the parcel block; Leaflet for the real GIS map | pick CSS 3D transforms first — far less build risk than adding Three.js for a hackathon deadline; upgrade to react-three-fiber only if time allows |
| Backend | Node.js + Express | unchanged from v1 |
| Database | SQLite — see §2 for driver decision | unchanged in shape, driver may change |
| Auth | JWT + mobile number + OTP (simulated) + Aadhaar-style verification step (simulated) | replaces v1's email/password as the primary flow; email/password can remain as a fallback for officer roles |
| Charts | Recharts | unchanged from v1 |
| Reports | PDFKit + ExcelJS | unchanged from v1 |
| Image diff | Jimp (pure JS, no native deps) | unchanged from v1 — already safe |

## 4. Data Model
Carried forward from v1's schema (`users`, `projects`, `proposals`, `land_parcels`,
`compensation`, plus possession/rehabilitation/documents/notifications tables), with
additions:

- `users.phone` (unique, required) — primary login identifier.
- `users.aadhaar_verified` (boolean) — set true after the simulated 2-step check;
  required `true` before a farmer can register a new `land_parcels` row.
- `users.language` — already existed in v1 (`en`/`hi` default), now actually driven by
  the frontend toggle instead of unused.
- `users.is_guest` — not a DB row at all; guest mode is a frontend-only state issuing
  a scoped read-only token, no account created.

## 5. Auth Flow
1. User enters mobile number → backend issues a 6-digit OTP (simulated: logged to
   server console / returned in dev-mode API response, never actually sent).
2. User submits OTP → backend issues a short-lived JWT, `aadhaar_verified: false`.
3. If the user tries to register land (farmer role) and `aadhaar_verified` is false,
   they're routed through a second simulated step (enter a fake Aadhaar number →
   mock validation) before the write is allowed.
4. Guest mode: a single backend endpoint issues a scoped "guest" JWT with read-only
   permissions and access to the chatbot + public info only — no phone/OTP needed.

## 6. Frontend Architecture
- Route structure mirrors the PRD's layered site: `/` renders the scroll-driven
  landing (info → about-dashboard → account/settings teaser) as one continuous page;
  crossing into the authenticated app moves the user to `/app/*` routes (dashboard,
  map, compensation, etc. — same page set as v1).
- Landing page sections are separate components composed on one scroll container;
  Framer Motion's `useScroll`/`useTransform` drives parallax offsets per section —
  avoids a heavy dependency for what's fundamentally a parallax effect.
- i18n: all user-facing strings go through `react-i18next` from the start (not
  retrofitted) — two JSON dictionaries, `en.json` / `hi.json`.
- 3D parcel view: a dedicated `ParcelBlock` component using CSS `transform-style:
  preserve-3d` to render a parcel as a raised block with the map texture on top,
  matching the aerial-block reference image; this sits inside the existing `MapView`
  page alongside the real Leaflet map, not replacing it.

## 7. Dev Environment / Codespaces
- Add `.devcontainer/devcontainer.json` at repo root pinning a Node 20/22 image and
  running `apt-get install -y build-essential python3` in `postCreateCommand` if
  Option A (§2) is chosen — this is the fix for what broke v1.
- Root-level `package.json` with a single `npm run dev` (via `concurrently`) that
  starts backend + frontend together, so the whole judge-facing setup is: open
  Codespace → `npm install` → `npm run dev`.
- `.env.example` at backend root, unchanged pattern from v1; document that `.env` must
  be created from it (v1's README said this but it's an easy step to miss — devcontainer
  `postCreateCommand` should auto-copy it if missing).

## 8. Known Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Native module install failure (what broke v1) | See §2 — devcontainer build tools or WASM/built-in driver fallback |
| Scope creep re-adding every v1 feature before demo-readiness | Build in the priority order from PRD §5 (Must → Should → Could), cut Could-list items first if time runs short |
| 3D/parallax landing eating build time meant for core features | Use CSS-only 3D transforms + Framer Motion first; only reach for react-three-fiber if core features are already done |
| Simulated Aadhaar/OTP being mistaken for real verification in a demo | Label clearly in UI ("Demo verification — not connected to UIDAI") per v1's existing pattern for simulated integrations |
