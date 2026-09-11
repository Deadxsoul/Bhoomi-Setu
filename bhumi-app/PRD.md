# PRD — National Land Acquisition & Management System (v2)

## 1. Problem Statement
Land acquisition in India is opaque and slow: farmers don't know the status of their
land, compensation math is a black box, disputes drag on for years, and there's no
single place where a citizen, a district officer, and a central ministry official see
the same truth. This project is a **hackathon-scale demo** of a platform that makes the
entire lifecycle of a land acquisition — proposal → survey → compensation → possession →
rehabilitation — transparent and trackable, for every role involved.

This is v2 of an earlier build. v1 proved the concept works end-to-end; v2 keeps that
feature set but rebuilds it clean, adds a real front door (marketing/info layer, guest
mode, Aadhaar-style verified signup, Hindi/English), and gets the visual design to a
level that doesn't look like a generic AI-generated admin template.

## 2. Goals
- A working, demoable full-stack app judges can log into live, in front of them, with zero setup friction.
- A landing experience that sells the *problem* before it sells the *product* — the
  human cost of land acquisition, then the platform that fixes the transparency gap.
- Every feature from the original problem statement present and functional, not just
  described in a slide.
- A visual identity that reads as intentionally designed — pastel-to-neutral palette,
  restrained, nothing that looks like a stock dashboard theme.

## 3. Users / Roles
| Role | Who they are | What they need |
|---|---|---|
| Guest | Anyone landing on the site, not logged in | Understand what the platform is, browse public info, try the farmer chatbot |
| Farmer | Landholder whose land is being acquired | See their land's status, compensation breakdown, possession stage, rehabilitation entitlements |
| District Officer | Local government | Review proposals, manage parcels & documents in their district |
| State Officer | State government | Approve proposals, see state-wide dashboard, state ranking |
| Central Ministry | National oversight | National dashboard, cross-state comparison, reports |
| Project Agency | e.g. NHAI, implementing body | Submit proposals, track possession/compensation for their projects |

## 4. Site Structure (from your notes)
The site is explicitly **layered**, not a single flat page. A visitor scrolls down
through layers before ever reaching the "real" application:

1. **Layer 1 — Landing / Info layer.** Hero (the land-being-taken visual metaphor),
   what the platform is, who it's for. Scroll-driven, not click-driven — sections
   reveal as you scroll, background has depth (see §6 Design).
2. **Layer 2 — Dashboard-about layer.** Not the real dashboard — a guided
   explanation of *how the platform works*, what each role can do, a preview of the
   3D land/map visualization.
3. **Layer 3 — Account / settings layer.** A ☰ menu that surfaces settings and leads
   into account/profile — this is the transition point from "marketing site" into
   "logged-in app."
4. **Layer 4 — The actual application** (role-based dashboards, map, compensation,
   documents, etc. — see §5).

Two ways to enter Layer 4: **Guest Mode** (limited, read-only / chatbot-only, no
account) or **Login/Signup** (mobile number + OTP, with an Aadhaar-style verification
step required before a farmer can register land — simulated for demo, see TRD for why).
A **Hindi/English** toggle applies across all layers.

## 5. Feature Set (carried forward from v1, kept intact)
| Feature | Priority | Notes |
|---|---|---|
| Mobile-number login/signup + OTP | Must | New in v2 — replaces plain email/password as primary flow |
| Aadhaar-style 2-step verification before land registration | Must | Simulated — see TRD |
| Guest mode | Must | New in v2 |
| Hindi/English toggle | Must | New in v2 |
| Role-based dashboards (5 roles) | Must | Carried from v1 |
| Proposal submission & approval workflow | Must | Carried from v1 |
| GIS-based mapping of parcels | Must | Carried from v1, visual style updated (see §6) |
| 3D land parcel visualization | Must | New — extruded/isometric parcel view per reference image |
| Explainable compensation calculator | Must | Carried from v1 |
| Possession status tracker | Must | Carried from v1 |
| Rehabilitation & resettlement + priority scoring | Must | Carried from v1 |
| Document management + duplicate checker | Must | Carried from v1 |
| Litigation risk indicator | Should | Carried from v1 |
| Satellite-based encroachment checker | Should | Carried from v1 |
| Farmer chatbot (works in guest mode) | Should | Carried from v1 |
| Gamified state ranking | Should | Carried from v1 |
| Unused acquired land finder | Could | Carried from v1 |
| Voice-based data entry | Could | Carried from v1, browser Web Speech API |
| MIS reports (PDF/Excel) | Could | Carried from v1 |
| Notifications & alerts | Could | Carried from v1 |

## 6. Design Requirements
- **Palette:** pastel-to-neutral. Muted greens/earth tones/off-whites over saturated
  "SaaS blue," in keeping with the land/agriculture subject matter. No default
  purple-gradient AI-template look.
- **Tone:** clean, uncluttered, generous whitespace — "nothing should look
  complicated." Every screen should feel like it has one job.
- **Landing page:** scrollable with a sense of depth/3D — layers move at different
  rates or reveal as parallax as the user scrolls (like the aerial-block-with-pin
  reference image), not a static single-viewport hero.
- **Map/parcel visuals:** parcels shown as a highlighted, almost-3D block or zoomed
  region (per the magnifying-glass-on-cadastral-map reference), not a plain Leaflet
  pin.
- **Explicitly avoid:** generic icon-grid feature sections, stock-photo hero images,
  default shadcn/Bootstrap look with no customization.

## 7. Success Criteria (hackathon demo)
- A judge can open the Codespace, run one setup command, and have the site live.
- A judge can experience the full layered scroll on the landing page, enter as guest
  *or* log in with a seeded demo account, and reach a working role dashboard.
- Every "Must" feature above is clickable and backed by real (seeded) data — no dead
  buttons.
- The 3D/parallax landing and the parcel visualization are the two things that should
  make this *not* look like every other hackathon CRUD app.

## 8. Out of Scope (for hackathon build)
- Real Aadhaar/UIDAI integration, real government SMS/OTP providers, real satellite
  imagery providers (ISRO Bhuvan) — all simulated, clearly labeled as swappable.
- Multi-state federated infrastructure (separate DB per state) — schema should allow
  for it later, not implement it now.
- Native mobile apps.
