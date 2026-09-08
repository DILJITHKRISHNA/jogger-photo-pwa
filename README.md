# Jogger Photo Hub

A mobile-first footwear product photo PWA: sales executives **search → view
→ share** product photos in under 10 seconds; admins manage the photo
library and daily Stock / Scheme / New Model Excel imports from a matching
admin panel.

Built as a **separate frontend + backend**, on the same stack as this
workspace's `car-wash-erp` reference project — NestJS + Prisma/PostgreSQL +
Redis + JWT auth + Docker on the backend, Next.js + Tailwind + shadcn on the
frontend — sized to what this app actually needs. Unlike the reference
project's dashboard (which is largely UI wired to mock data while its
backend is still mid-build), **every screen here is wired to the real API**:
there is no mock/demo data path in the frontend.

```
frontend/    Next.js app — executive PWA + admin panel, calls the API directly
backend/     NestJS API — auth, photo catalogue, Excel imports, storage
docker-compose.yml   postgres + redis + api, for local/prod parity
```

## Quick start

**1. Backend** (see [`backend/README.md`](backend/README.md) for detail):

```bash
docker compose up -d postgres redis    # or run your own local Postgres/Redis
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed                    # admin + executive logins + demo catalogue
npm run start:dev                      # http://localhost:4010/api/v1
```

**2. Frontend** (see [`frontend/README.md`](frontend/README.md)):

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev                            # http://localhost:3010
```

Sign in:

| Role | URL | Phone | Password |
|---|---|---|---|
| Executive | `/login` | `9000000001` | `ChangeMe123!` |
| Admin | `/admin/login` | `9999999999` | `ChangeMe123!` |

(Change these via `SEED_ADMIN_*` / `SEED_EXEC_*` before seeding, or create
more users the same way.)

## What's implemented (mapped to the brief)

**Executive app** — Single Article search, Category ("Bulk Photos"), Today's
Stock, Scheme Article, New Model. Photo viewer with large image +
Share/Download. Bulk galleries support select-one/select-multiple/select-all,
native Share (WhatsApp/Instagram/Telegram/…) via the Web Share API, and a
server-built ZIP for large selections. Bottom nav limited to 4 tabs (Home,
Search, Bulk Photos, Today's Stock); Scheme/New Model are reachable from
Home. No stock quantity, pricing or other confidential data is ever sent to
the executive-facing API.

**Admin panel** (`/admin`) — Photo upload (bulk, filename-driven), Stock /
Scheme / New Model Excel upload with downloadable templates, Category
management (add/rename/hide/delete), Search/Check (full Article+Colour
status lookup), Import History with per-row error detail and CSV export,
and a dashboard (photo/stock/scheme/new-model counts, last update, import
errors, a "missing photo" warning banner — intentionally no complicated
analytics).

**Backend rules honoured** — Article + Colour is the unique product key
everywhere; photos must be named `ARTICLE COLOUR.jpg` and are matched to
Excel data automatically, never typed per photo; Excel rows missing
Article or Colour are rejected and listed as errors, never silently
imported; any Stock/Scheme/New Model row with no matching photo is
surfaced to the admin and simply absent from what executives see; one
photo per Article+Colour is reused identically across Single Article,
Category, Stock, Scheme and New Model.

## Auth — what's real vs. a placeholder

Real JWT access + refresh tokens, bcrypt password hashes, per-user RBAC
(`ADMIN` / `EXECUTIVE`), and an audit log of every login and mutation — the
same mechanism as the reference project. What's *not* here is the
reference's public self-signup / OTP flow: accounts are provisioned via the
seed script (or, in future, an admin "create user" endpoint), matching the
photo-hub brief's "keep it simple" instruction while still using real
per-user credentials rather than one shared password.

## Known limitations / follow-ups

- **Demo photos are placeholder art** (`backend/prisma/seed.ts` draws
  simple coloured squares with a small hand-rolled PNG encoder — no image
  libraries needed to try the app). Swap the seeded photos for real product
  photography before shipping. The PWA icons in `frontend/public/icons/`
  are the real brand mark, not placeholders.
- **`xlsx` (SheetJS) has a known, unpatched-on-npm advisory.** Risk is
  limited — it only parses admin-uploaded files, behind admin auth. See
  `backend/README.md` for detail and the SheetJS-direct patched-build option.
- Scheme/New Model uploads **merge** into the existing list (add/update,
  never remove); only the Stock upload **fully replaces** the list, matching
  "Today's Stock" semantics from the brief.
- Redis is wired up (dashboard-stats cache today) but, like the reference
  project's Redis, most of its intended use (queues, pub/sub) isn't needed
  by this app yet — the connection is there for later without a rework.
- Seeding a freshly-`docker compose up`'d stack runs the seed script from
  the host (the production API image trims dev tooling), so its placeholder
  demo photos land outside the container's upload volume — one `docker cp`
  fixes it. Full detail in `backend/README.md`; not relevant to real
  admin-uploaded photos, which always go through the API into the volume
  directly.
