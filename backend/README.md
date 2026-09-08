# Jogger Photo Hub — API

NestJS backend for the Jogger Photo Hub — the same architecture pattern as
this workspace's `car-wash-erp` reference project (NestJS · Prisma +
PostgreSQL · Redis · JWT auth · Docker), sized to this app's actual scope:
a photo catalogue, three daily import feeds, and an audit trail — no
branches, no BullMQ queues, no WhatsApp/S3 integrations wired up (those
pieces of the reference stack aren't needed here; see the root README).

## Stack

NestJS · Prisma + PostgreSQL · JWT (access + refresh) · Redis (dashboard
stats cache today; same connection is there for queues/pub-sub later) ·
class-validator · Docker.

## Local setup

1. Start Postgres (and Redis) from the repo root:

   ```bash
   docker compose up -d postgres redis
   ```

   Postgres is exposed on host port **5434** (not 5432) and Redis on
   **6381** (not 6379) — chosen to avoid clashing with any locally-installed
   instances *and* with `car-wash-erp`'s own compose (5433/6380). Adjust
   `docker-compose.yml` / `.env` if you'd rather use different ports.

2. Install dependencies and copy the env file:

   ```bash
   cd backend
   npm install
   cp .env.example .env   # already present with dev defaults in this repo
   ```

3. Run migrations and seed an admin login, an executive login, and a small
   demo catalogue:

   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

   Default logins (override via `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD`
   / `SEED_EXEC_PHONE` / `SEED_EXEC_PASSWORD` before seeding):

   | Role | Phone | Password |
   |---|---|---|
   | ADMIN | `9999999999` | `ChangeMe123!` |
   | EXECUTIVE | `9000000001` | `ChangeMe123!` |

4. Start the API:

   ```bash
   npm run start:dev
   ```

   Runs on `http://localhost:4010/api/v1`. Health check: `GET /health`.

## Auth

- `POST /auth/login` — `{ phone, password }` → `{ user, accessToken }`,
  sets an httpOnly `refresh_token` cookie scoped to `/api/v1/auth`.
- `POST /auth/refresh` — reads the refresh cookie, rotates it, returns a
  new access token.
- `POST /auth/logout` — revokes the stored refresh token, clears the
  cookie. Requires a valid access token.
- `GET /auth/me` — returns the current user from the access token.

Every route requires a valid access token by default; opt out with
`@Public()`. Restrict a route to admins with `@Roles(Role.ADMIN)` — the
`RolesGuard` also lets `ADMIN` through anything an `EXECUTIVE` can do, so
admins can preview the executive-facing catalogue endpoints too. Every
login, refresh, logout, and catalogue mutation writes an `AuditLog` row
(`modules/audit`).

There's no public self-signup — accounts are provisioned via the seed
script (or, in future, an admin "create user" endpoint). That keeps the
"same backend technology" as the reference project (real users, real JWTs,
real RBAC) without the OTP/WhatsApp delivery machinery this app doesn't need.

## API surface

| Area | Routes | Access |
|---|---|---|
| Auth | `POST /auth/{login,refresh,logout}`, `GET /auth/me` | see above |
| Categories | `GET /categories`, `POST/PATCH/DELETE /categories(/:id)` | read: any user · write: ADMIN |
| Products (photos) | `GET /products`, `DELETE /products/:id`, `POST /products/photos` (bulk upload) | ADMIN |
| Stock | `GET /stock`, `GET /stock/template`, `POST /stock/upload` | ADMIN |
| Scheme | `GET /scheme`, `GET /scheme/template`, `POST /scheme/upload` | ADMIN |
| New Model | `GET /new-models`, `GET /new-models/template`, `POST /new-models/upload` | ADMIN |
| Imports | `GET /imports`, `GET /imports/:id`, `GET /imports/:id/errors` (CSV) | ADMIN |
| Catalogue (read) | `GET /catalogue/{search,product,categories/:slug,stock,scheme,new-models}` | any user |
| Catalogue (write) | `GET /catalogue/check` (Search/Check), `POST /catalogue/zip` (bulk download) | check: ADMIN · zip: any user |
| Dashboard | `GET /dashboard` | ADMIN |

**Core rules enforced server-side** (not just in the UI): Article + Colour
is a unique product key (`@@unique([article, colour])` on `Product`,
`SchemeEntry`, `NewModelEntry`); photo filenames are parsed as
`ARTICLE COLOUR.ext` (`common/util/parse-photo-filename.ts`); Excel rows
missing Article or Colour are rejected as errors, never silently imported
(`modules/excel`); every Stock/Scheme/New Model upload is cross-checked
against the photo catalogue and reports `missingPhotos`
(`modules/import-runner`).

## Storage

`modules/storage` writes to `uploads/products/` by default (served at
`/uploads/products/*`, outside the `/api/v1` prefix and outside the auth
guards — plain `<img>` tags can't carry a Bearer token). Set the `S3_*` env
vars to switch to S3-compatible object storage with zero code changes
elsewhere.

## Scripts

| Script | What it does |
|---|---|
| `npm run start:dev` | Dev server with watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:seed` | Run `prisma/seed.ts` |
| `npm run prisma:studio` | Open Prisma Studio |

## Docker

```bash
docker compose up -d --build
```

Builds and runs `postgres`, `redis`, and `api` together. Run migrations
against the containerized database before or after first boot:

```bash
DATABASE_URL="postgresql://jogger:jogger_password@localhost:5434/jogger_photo_pwa?schema=public" \
  npx prisma migrate deploy
DATABASE_URL="postgresql://jogger:jogger_password@localhost:5434/jogger_photo_pwa?schema=public" \
  npx tsx prisma/seed.ts
```

Both commands run from the host (against the container's exposed Postgres
port) using your local `node_modules` — the production image trims dev
dependencies (`tsx`, `prisma`), so `docker compose exec api ...` can't run
the TypeScript seed script directly. That's fine for the database rows, but
the seed script also writes its placeholder demo photos to a local
`uploads/products/` on whichever filesystem it's running against — when
seeding from the host like this, that's the host, not the `api_uploads`
volume the container serves from. Copy them across once:

```bash
docker cp uploads/products/. jogger-api:/app/uploads/products/
```

(Not needed for real usage — real admin-uploaded photos go through the API
itself and land directly in the container's volume.)

## Known limitations

`xlsx` (SheetJS) has a known, unpatched-on-npm advisory (prototype
pollution / ReDoS). Risk is limited here — it only parses admin-uploaded
files, behind admin auth. `prisma`'s CLI tooling (dev-only, not part of the
running API) currently pulls in a `deepmerge-ts` advisory too; both are
inherited from the same versions the `car-wash-erp` reference project pins.
