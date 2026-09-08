This is the Next.js frontend for **Jogger Photo Hub**. It talks to the
NestJS API in `../backend` over HTTP — see the [root README](../README.md)
for the full picture and how to run both together.

## Getting Started

```bash
cp .env.example .env.local   # already present with dev defaults in this repo
npm install
npm run dev
```

Runs on [http://localhost:3010](http://localhost:3010) (the backend must
already be running on `:4010` — see `../backend/README.md`).

- Executive app: `/login` → `/`, `/search`, `/category`, `/stock`,
  `/scheme`, `/new-model`, `/product/[article]/[colour]`
- Admin panel: `/admin/login` → `/admin`, `/admin/photos`,
  `/admin/upload/{stock,scheme,new-model}`, `/admin/categories`,
  `/admin/search`, `/admin/import-history`

## How it talks to the API

- `lib/api-client.ts` — `apiFetch()` (attaches the access token, retries once
  through a silent refresh on 401), plus `login`/`logout`/`refreshSession`,
  `resolveMediaUrl()` (photo URLs come back relative to the API's origin,
  not this app's), and `downloadAuthenticated()` (for Bearer-token-protected
  file downloads, which a plain `<a href>` can't carry).
- `lib/auth-token.ts` — the access token itself, kept in memory only (never
  `localStorage`), so an XSS payload can't read it. It's lost on a hard
  refresh by design.
- `providers/auth-provider.tsx` + `hooks/use-auth.ts` — on mount, silently
  re-mints an access token from the httpOnly refresh cookie so sign-in
  survives a reload despite the token being memory-only.
- `features/*/use-*.ts` — one hook per screen's data (categories, gallery,
  search, dashboard stats, import history, …), each just a thin wrapper
  around `apiFetch` with loading state.

Every data page in `app/` is a Client Component using one of these hooks —
there's no server-side data fetching here, matching the reference project's
pattern (the browser talks to the API directly, not through Next.js API
routes).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4
· shadcn/base-ui components · PWA (manifest + service worker) — the same UI
kit and conventions as `car-wash-erp/frontend` and the sibling
`order-article` project in this workspace.
