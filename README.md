# Jogger Photo Hub

A mobile-first footwear product photo PWA: sales executives **search → view → share**
product photos in under 10 seconds; admins manage the photo library and daily
Stock / Scheme / New Model Excel imports from a matching admin panel — all in
one app, as specified in the developer brief.

```
Open PWA → search article → pick colour → share on WhatsApp
```

## Quick start

```bash
npm install
npm run seed   # optional — populates a small demo catalogue (skips if data/db.json exists)
npm run dev
```

Open http://localhost:3000 and sign in:

| Role | URL | Credentials (defaults — change via `.env.local`) |
|---|---|---|
| Executive | `/login` | any name + employee ID, access code `jogger2026` |
| Admin | `/admin/login` | password `admin123` |

Copy `.env.example` to `.env.local` to change these, and to switch on Supabase
cloud photo storage. Everything works with **zero configuration** on local
disk storage first.

## What's implemented (mapped to the brief)

**Executive app** — Single Article search, Category ("Bulk Photos"), Today's
Stock, Scheme Article, New Model. Photo viewer with large image + Share/Download.
Bulk galleries support select‑one/select‑multiple/select‑all, native
Share (WhatsApp/Instagram/Telegram/…) via the Web Share API, and ZIP download
for large selections. Bottom nav limited to 4 tabs (Home, Search, Bulk Photos,
Today's Stock) per the "keep it simple" rule; Scheme/New Model are reachable
from Home. No stock quantity, pricing or other confidential data is ever sent
to the executive-facing API.

**Admin panel** (`/admin`) — Photo upload (bulk, filename‑driven), Stock Excel
upload, Scheme Excel upload, New Model Excel upload, Category management
(add/rename/hide/delete), Search/Check (full Article+Colour status lookup),
Import History with per-row error detail and CSV export, and a simple
dashboard (photo/stock/scheme/new-model counts, last update, import errors —
intentionally no complicated analytics).

**Backend rules honoured**

- **Article + Colour = unique product key**, everywhere (`lib/product-key.ts`).
- **Filename → data**: photos must be named `ARTICLE COLOUR.jpg` (e.g.
  `1001 BRWN.jpg`); the admin never types Article/Colour per photo
  (`lib/parse-photo-filename.ts`).
- **Never silently import invalid rows**: Excel rows missing Article or
  Colour are rejected and listed as errors, not imported
  (`lib/excel/parse.ts`).
- **Photo Missing warnings**: any Stock/Scheme/New Model row with no matching
  photo is surfaced to the admin (dashboard banner, upload result, Import
  History) — and is simply absent from what executives see.
- **One photo per Article+Colour, reused everywhere**: uploading again for
  the same key replaces the old photo; it's shown identically in Single
  Article, Category, Stock, Scheme and New Model.

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4
· shadcn/base-ui components · `xlsx` for Excel parsing · Supabase (optional,
for Postgres/Storage) · PWA (manifest + service worker).

This mirrors the stack already used in the sibling `order-article` project in
this workspace, so both apps share the same UI kit and conventions.

## Architecture

```
app/
  (exec)/            executive routes — /, /search, /category[/slug], /stock,
                      /scheme, /new-model, /product/[article]/[colour]
                      (guarded by lib/auth/executive.ts)
  login/              executive sign-in (outside the guarded group)
  admin/
    (auth)/login/     admin sign-in
    (dashboard)/      /admin, /admin/photos, /admin/upload/{stock,scheme,new-model},
                      /admin/categories, /admin/search, /admin/import-history
                      (guarded by lib/auth/admin.ts)
  api/                route handlers backing both apps (see below)

lib/
  db/                 store.ts (JSON-file "database" with a write lock) +
                      repository.ts (all reads/writes go through here)
  storage/            photo storage — local disk by default, Supabase
                      Storage automatically once its env vars are set
  excel/              parse.ts (validate + extract rows) and
                      import-runner.ts (validate → import → cross-check
                      against photos → record for Import History)
  auth/               admin.ts / executive.ts — cookie-based sessions
  parse-photo-filename.ts, product-key.ts — the two core parsing rules

components/
  executive/          mobile-first UI (bottom nav, gallery, photo viewer, …)
  admin/               admin shell/sidebar + feature panels
  ui/                  shared shadcn/base-ui primitives
```

**Data storage.** Products/categories/stock/scheme/new-models/import-history
live in one JSON file (`data/db.json`), read and written exclusively through
`lib/db/repository.ts` behind an in-process write lock — plenty for a
catalogue of this size, and it means the app runs with **zero external
services**. Every repository function is a small, focused async function, so
swapping the JSON file for a real Postgres table (e.g. Supabase, whose client
is already wired up for storage) later is a matter of rewriting `store.ts`,
not touching any page, component or API route.

**Photo storage.** `lib/storage` picks Supabase Storage automatically once
`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set; otherwise it
writes to `public/uploads/products/` so photos work immediately with no
setup. Either way, the admin/executive code never touches storage directly —
only `uploadProductPhoto()`.

## Auth — what's real vs. a placeholder

Both admin and executive sign-in are deliberately simple, cookie-based gates
(`lib/auth/admin.ts`, `lib/auth/executive.ts`) — a shared password/access
code, matching the brief's "keep it simple" instruction and its "Employee ID
+ password" option. There's no real user database or OTP delivery. To
upgrade to per-employee accounts or real OTP/SSO, only those two files (and
the two login API routes) need to change — every page already reads the
session through `getExecutiveSession()` / `isAdminAuthenticated()`, so the
rest of the app is unaffected.

## Known limitations / follow-ups

- **PWA icons & demo photos are placeholder art** (`scripts/generate-icons.mjs`,
  `scripts/seed.mjs` draw simple shapes with a small hand-rolled PNG encoder —
  no image libraries needed to try the app). Swap `public/icons/*.png` and
  the seeded photos for real branding/product photography before shipping.
- **`xlsx` (SheetJS) has a known, unpatched-on-npm advisory** (prototype
  pollution / ReDoS). Risk is limited here — it only parses admin-uploaded
  files, behind admin auth — but if that's a hard blocker, SheetJS publish
  patched builds directly from https://cdn.sheetjs.com.
- Scheme/New Model uploads **merge** into the existing list (add/update, never
  remove); only the Stock upload **fully replaces** the list, matching "Today's
  Stock" semantics from the brief. If you'd rather have Scheme/New Model also
  reset on every upload, that's a one-line change in
  `lib/excel/import-runner.ts`.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run seed     # write a small demo catalogue to data/db.json (no-op if it exists)
npm run icons    # regenerate public/icons/*.png
```
