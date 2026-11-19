# TyreMate ERP — Web edition

TyreMate (tyre sales, purchasing, DAG retreading, inventory, invoicing and
reporting) converted from an Electron desktop app to a **Next.js** web
application that is **statically exported and hosted on GitHub Pages**.
Static assets and payment receipts are hosted on **Cloudinary**, and the
database is chosen and managed from the in-app **admin panel**.

## How it works

The desktop app had three layers: a React renderer, an Electron main process
(IPC handlers → services → repositories) and SQLite via `better-sqlite3`.
GitHub Pages has no server, so the web edition runs the **original backend code
unchanged inside a Web Worker** in the browser:

```
 Next.js pages (app/)  ──►  src/ (original React renderer, unchanged features)
        │ window.api  (original preload surface, web/bridge/preload.js)
        ▼
 Web Worker (web/worker/backend.worker.ts)
   backend/apps/electron/ipc/*      ← original IPC handlers + auth/permission middleware
   backend/packages/services/*      ← original business logic
   backend/packages/repositories/*  ← original SQL
        │ better-sqlite3 compatible facade (web/db/compat.ts)
        ▼
   ┌─────────────────────────────┬────────────────────────────────────────┐
   │ Local: sql.js (SQLite WASM) │ Remote: Turso / libSQL (Hrana over HTTP │
   │ persisted in IndexedDB      │ via synchronous XHR inside the worker)  │
   └─────────────────────────────┴────────────────────────────────────────┘
```

* **Routing** – a react-router compatibility layer (`src/lib/router.tsx`) maps the
  desktop URLs onto statically exported pages. Dynamic routes become query
  parameters, e.g. `/sales-orders/42` → `/sales-orders/view/?soId=42`
  (`src/lib/routeTable.ts`).
* **Electron-only features** – printing uses the browser print dialog (pick a
  printer or *Save as PDF*); CSV exports download through the browser; file
  pickers and drag-and-drop use browser `File`s.
* **Receipts** – encrypted in the browser with AES-256-GCM (same envelope scheme as
  the desktop app) and uploaded to Cloudinary as raw files via an unsigned upload
  preset. The master key is stored in the database, so CDN files are unreadable
  on their own. Without Cloudinary configured, encrypted receipts are kept in the
  database.
* **Static assets** – the logo, favicon and user-manual screenshots are served from
  Cloudinary (`res.cloudinary.com/<cloud>/…/tyremate/static/…`) with bundled
  copies as an automatic fallback.

## Admin panel (`/admin`, `/setup`)

| Area | What it does |
| --- | --- |
| **Database connection** (`/setup` before sign-in, Admin → Database after) | Choose *This browser (local)* or a *Shared remote database* (Turso/libSQL URL + token), **test** the connection (latency, SQLite version, whether the schema exists), **save & connect**. Generate/paste a *connection code* to configure other devices. |
| **Schema** | Migrations run automatically on connect; shows applied/pending migrations and row counts per table. |
| **Maintenance** | Download `.sqlite` backup, export `.sql`, restore from a backup (desktop app databases work too), copy the local database to a remote server and switch to it, copy a remote database into the browser, re-run lookup seeding, load sample master data (+ opening stock), erase the local database. |
| **File storage** | Cloudinary cloud name, unsigned upload preset and folder (stored in the database, shared by all devices) and a test upload. |
| **Users** | Create users, assign roles, reset passwords, enable/disable accounts. Every user can change their own password under *My account*. |

Default accounts (from the desktop seed): `admin` / `1234` and `superadmin` /
`1234`. A banner asks users on the default password to change it.

## Getting started

```bash
npm ci
npm run dev          # http://localhost:3000
npm run build        # static export in ./out
npm run build:pages  # export with the GitHub Pages base path (/tyremate-web)
```

Requires Node 22+.

### Shared database with Turso (recommended for multi-user use)

```bash
turso db create tyremate
turso db show tyremate --url        # libsql://tyremate-<org>.turso.io
turso db tokens create tyremate     # auth token
```

Open the site → *Database settings* → *Shared remote database*, paste the URL and
token, *Test connection*, *Save & connect*. The schema and lookup data are created
automatically. To migrate existing data, sign in on the local database and use
Admin → Database → *Copy data to remote database*. Any self-hosted
[`sqld`](https://github.com/tursodatabase/libsql) server works as well.

### Cloudinary

1. **Receipts**: Cloudinary console → Settings → Upload → *Add upload preset*,
   signing mode **Unsigned**, folder `tyremate/receipts`. Enter the cloud name and
   preset in Admin → File storage.
2. **Static assets**: add a repository secret `CLOUDINARY_URL`
   (`cloudinary://<api_key>:<api_secret>@<cloud_name>`). The deploy workflow
   uploads the logo and manual screenshots with a signed request
   (`scripts/upload-cloudinary-assets.mjs`); the API secret never reaches the site.
   The public cloud name is set in `.env.production` (or the `CLOUDINARY_CLOUD_NAME`
   repository variable).

### Updating the user manual screenshots

The manual (`docs/USER_MANUAL.md`, shown in-app at `/help`) uses screenshots of
the web app in `docs/images`. To retake them after UI changes:

```bash
npm run build:pages
node scripts/capture-manual-screenshots.mjs   # fills a fresh in-browser database with sample records
```

Then bump `MANUAL_IMAGES_VERSION` in `src/shell/web/assets.ts` and in
`scripts/upload-cloudinary-assets.mjs`, so the CDN serves the new set (the upload
step never overwrites existing images). Until the new set is on Cloudinary, the
Help page shows the bundled copies.

### Deploying to GitHub Pages

`.github/workflows/deploy.yml` runs type checking and all tests on every push and
pull request, and deploys `main` to GitHub Pages. In the repository settings set
**Pages → Source: GitHub Actions**. For a custom domain set the repository
variable `CUSTOM_DOMAIN=true` (serves from the domain root).

## Security model — please read

There is no server: all business logic, including permission checks, runs in the
user's browser. This matches the desktop app (a thick client with direct
database access) but has consequences on the web:

* With a **remote database**, every configured browser holds a database token. A
  user who can sign in on a configured device could extract that token and access
  the database directly, bypassing role permissions. Issue tokens only to trusted
  staff devices, rotate them when someone leaves (`turso db tokens invalidate`),
  and keep backups.
* The **local database** lives in that browser's storage; clearing site data
  deletes it. Download backups regularly.
* Change the default passwords immediately.

If you need per-user server-side authorization later, the clean seam is the IPC
layer: the same handlers can run in a server process instead of the worker.

## Tests

```bash
npm test          # unit + integration (Vitest)
npm run test:e2e  # builds with the Pages base path, then Playwright E2E
```

* **Differential tests** (`tests/integration/differential.test.ts`) run a full
  business scenario (master data, stock sale with payment, delivery and gate pass,
  invoice, auto-PO, reports, CSV, users/permissions) **plus every registered IPC
  channel** on native `better-sqlite3` (the desktop engine), sql.js and libSQL, and
  require identical results (~720 steps).
* Compat/parameter-binding/error-shape parity tests on all three engines; migration
  schema parity; backup/restore/copy between engines; encrypted receipts with a
  mocked Cloudinary; route-table coverage of every navigation target.
* Remote-mode tests run against a Hrana v2 test server (`tests/helpers/hranaServer.mjs`).
* E2E (Playwright, against the static export served like GitHub Pages): sign-in,
  every page as Admin and as Cashier, persistence, single-tab lock, master-data
  forms, sales → invoice deep links, CSV download, printing, Cloudinary receipts,
  help page assets, admin panel (backup/restore, users, passwords, sample data,
  erase), remote database setup, connection codes, push-to-remote and recovery from
  an unreachable server.

## Changes from the desktop app

* Fixed: `reminders:getTodaysPending` selected a non-existent column
  (`c.CustomerName`) and always failed.
* Fixed: a missing permission was reported as "Unauthorized", which the UI treats
  as an expired session — Cashiers were signed out right after signing in (the
  dashboard queries purchase orders). It is now a `FORBIDDEN` error and dashboard
  widgets fall back quietly.
* Added: user management, password changes, default-password warning, admin panel,
  in-app user manual (`/help`).
* Printing goes through the browser dialog instead of silent printing to a stored
  printer; receipts deleted in the app remain (encrypted, tagged `tyremate,receipt`)
  in Cloudinary because deletion requires the API secret.

## Repository layout

```
app/                 Next.js App Router pages (thin wrappers around src/ pages)
src/                 React renderer (from apps/renderer/src) + web shell, admin, help
src/lib/             react-router compatibility layer and route table
web/                 worker host, database drivers, UI-thread bridge
backend/             original main-process code (apps/electron) and packages/
backend/platform/    browser runtime shims (electron, runtime host, generated bundles)
scripts/             build preparation and Cloudinary asset upload
tests/               unit, integration and E2E tests
docs/                user manual and screenshots
```
