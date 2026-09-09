# Jogger Photo Hub — API

NestJS backend for the Jogger Photo Hub — the same core pattern as this
workspace's `car-wash-erp` reference project (NestJS · Prisma + PostgreSQL
· JWT auth · Docker), trimmed to this app's actual scope: a photo
catalogue, three daily import feeds, and an audit trail. No branches, no
Redis, no S3, no BullMQ/WhatsApp integrations — this app doesn't need them,
so they're not here (fewer moving parts to deploy and pay for).

## Stack

NestJS · Prisma + PostgreSQL · JWT (access + refresh) · class-validator ·
Docker.

## Local setup

1. Start Postgres from the repo root:

   ```bash
   docker compose up -d postgres
   ```

   Exposed on host port **5434** (not 5432) — to avoid clashing with any
   locally-installed Postgres *and* with `car-wash-erp`'s own compose
   (5433). Adjust `docker-compose.yml` / `.env` if you'd rather use a
   different port.

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
script (or, in future, an admin "create user" endpoint), matching the
fixed phone+password login the brief called for.

**Why JWT at all, given the logins are fixed?** It's not adding
infrastructure to deploy or pay for — unlike Redis/S3, it's just app logic
(two secrets you set as env vars). Refresh tokens are hashed and stored in
the `users.hashedRefreshToken` Postgres column, not in any external store,
so it has zero dependency on Redis. In exchange it gets you short-lived
access tokens, server-side revocation (logout actually invalidates the
session), and role claims enforced by a guard rather than trusted from the
client — worth keeping even with a small, fixed set of logins. The cookie
`sameSite`/`secure` settings do switch based on `NODE_ENV` (see
[Deploying](#deploying) below) since the frontend and API live on different
domains in production.

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

`modules/storage` writes to `uploads/products/`, served at
`/uploads/products/*` — outside the `/api/v1` prefix and outside the auth
guards, since plain `<img>` tags can't carry a Bearer token. It's local
disk only (no S3) — on a host with an ephemeral filesystem (most PaaS
free/starter tiers), attach a persistent disk mounted at `/app/uploads` so
uploaded photos survive redeploys. See [Deploying](#deploying).

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

Builds and runs `postgres` and `api` together. Run migrations against the
containerized database before or after first boot:

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

## Deploying

Render (or any Docker-based host) + a managed Postgres:

1. **Database.** Render's free Postgres tier only allows one active free
   instance per account — if that's taken, use [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) instead (both have a generous free
   tier and need zero code changes, just a `DATABASE_URL`). Either way,
   append `?sslmode=require` if connecting over the public internet (Neon
   and Supabase both require it) and `&schema=public` to match this
   project's Prisma schema.
2. **Web service.** Root directory `backend`, environment "Docker" (it'll
   find the `Dockerfile` already here), health check path `/api/v1/health`.
   Don't set a `PORT` env var — Render injects its own and this app already
   reads `process.env.PORT` via `ConfigService`.
3. **Env vars** — everything in `.env.example` except `PORT`, plus:
   - `NODE_ENV=production` — this is what flips the refresh cookie to
     `sameSite: 'none'; secure: true`, required once the frontend (Vercel)
     and API (Render) are on different domains. See `auth.controller.ts`.
   - `CORS_ORIGIN` — your deployed frontend's exact origin, e.g.
     `https://your-app.vercel.app`. Only one origin is supported today; if
     you need Vercel preview-branch URLs to work too, `main.ts`'s
     `app.enableCors()` call would need to accept an array/regex instead.
4. **Migrate + seed** once, from your machine, against the database's
   *external* connection string (same commands as the Docker section
   above, just with that URL instead of `localhost:5434`).
5. **Photo persistence** — attach a Render persistent disk mounted at
   `/app/uploads` so admin-uploaded photos survive redeploys. Skippable if
   you're just trying the app out and don't mind photos resetting.
6. On the **frontend** (Vercel): set `NEXT_PUBLIC_API_URL` to
   `https://<your-render-service>.onrender.com/api/v1` and redeploy (it's
   baked in at build time).

## Known limitations

`xlsx` (SheetJS) has a known, unpatched-on-npm advisory (prototype
pollution / ReDoS). Risk is limited here — it only parses admin-uploaded
files, behind admin auth. `prisma`'s CLI tooling and `multer` (bundled
inside `@nestjs/platform-express`) currently pull in advisories too, both
dev-time/framework-inherited rather than something fixable here without a
breaking downgrade.
