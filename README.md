# The Vinyl Cut

[![CI](https://github.com/narcisolobo/vinyl-cut/actions/workflows/ci.yml/badge.svg)](https://github.com/narcisolobo/vinyl-cut/actions/workflows/ci.yml)

A fictional record shop, built as a full-stack portfolio piece: a headless
commerce architecture on [Medusa.js](https://medusajs.com/), with a custom
restock-notification system as the centerpiece — a real framework
extension (new module, data model, and workflow), not just default
configuration wearing a new theme.

> This is a non-commercial portfolio project — no real payments, customer
> data, or inventory are involved.

## Highlights

- **Custom Medusa module, not just configuration.** The restock-notify
  system — the project's flagship feature — adds a new data model,
  service, and workflow on top of Medusa rather than only wiring up what
  ships by default. See [Flagship Differentiator](./notes/vc-prd.md#7-flagship-differentiator)
  in the PRD.
- **Real domain modeling for used-goods retail.** Condition-graded
  inventory (Mint through Good), one-off stock per condition, and restock
  semantics that account for a used record actually being irreplaceable —
  problems a generic product catalog never has to solve.
- **A genuine ETL pipeline, not synthetic seed data.** A standalone Python
  pipeline pulls real release metadata and cover art from two live APIs
  (MusicBrainz, the Cover Art Archive), with retry logic, idempotency, and
  per-record error tracking — see [`notes/vc-etl-pipeline.md`](./notes/vc-etl-pipeline.md).
- **Tested, not just demoed.** Unit, module-level, and HTTP-level
  integration suites on the backend, all running in CI on every push and
  PR — see Testing below.
- **Errors surfaced, not swallowed.** Sentry error tracking on the
  storefront, plus an app-wide error boundary and custom 404 pages,
  rather than letting an unhandled exception show a blank screen or a
  framework default. See [`notes/vc-sentry-integration-sequence.md`](./notes/vc-sentry-integration-sequence.md).
- **Infrastructure trade-offs reasoned through, not glossed over.** Three
  free-tier services (Render, Supabase, Upstash) each pause or spin down
  on a different timer; the plan is one health-check endpoint that resets
  all three rather than three bespoke workarounds — designed and written
  up, ahead of the deployment itself. See Infrastructure & Deployment in
  [`notes/vc-prd.md`](./notes/vc-prd.md).
- **Written process artifacts, not just code.** A full product
  requirements document, a phased roadmap, and suite-by-suite testing
  specs — see Documentation below.

## Tech Stack

| Layer           | Choice                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------- |
| Storefront      | Next.js 16 (Turbopack in dev), React 19, Tailwind CSS v4 + daisyUI                            |
| Commerce engine | Medusa.js 2.18 (native cart, checkout, payment modules)                                       |
| Payments        | Stripe (test mode), via Medusa's payment provider — Payment Element, cards only                |
| Database        | PostgreSQL (Supabase, hosted; Supabase CLI, local — see `supabase/`)                          |
| Cache / events  | Redis (Upstash, hosted; plain Redis container, local)                                         |
| File storage    | Supabase Storage (S3-compatible), via Medusa's File Module                                    |
| Catalog ETL     | Python (MusicBrainz + Cover Art Archive → Medusa Admin API)                                   |
| Error tracking  | Sentry (storefront)                                                                            |
| Hosting         | Render (backend, via the root `Dockerfile`); storefront hosting TBD                           |
| CI              | GitHub Actions — lint, unit, and integration suites on every push/PR                          |

## Project Status

The core shopping experience is complete and working end to end: catalog
browsing and filtering, cart, guest checkout with Stripe (test mode) as
the payment provider, per-state sales tax for the shop's Western-U.S.
service region, flat-rate shipping, and the restock-notify system
described above. What's still ahead of a live deployment: standing up
the hosted Render/Supabase/Upstash stack itself, and wiring the Stripe
webhook, deferred until that hosted backend exists to receive it. See
the Phased Roadmap in [`notes/vc-prd.md`](./notes/vc-prd.md) for what's
next.

## Documentation

Written up in full rather than left implicit in the code:

- [`notes/vc-prd.md`](./notes/vc-prd.md) — product requirements: features,
  architecture, infrastructure, and phased roadmap.
- [`notes/vc-etl-pipeline.md`](./notes/vc-etl-pipeline.md) — the catalog
  ETL pipeline's design (MusicBrainz + Cover Art Archive → Medusa).
- [`notes/vc-storefront-rebuild-sequence.md`](./notes/vc-storefront-rebuild-sequence.md) —
  the storefront's build sequence.
- [`notes/vc-stripe-integration-sequence.md`](./notes/vc-stripe-integration-sequence.md) —
  wiring Stripe in as the checkout payment provider.
- [`notes/vc-sentry-integration-sequence.md`](./notes/vc-sentry-integration-sequence.md) —
  wiring Sentry error tracking into the storefront.
- [`notes/todo.md`](./notes/todo.md) — open backend follow-ups.
- Testing specs: [`notes/medusa-unit-tests.md`](./notes/medusa-unit-tests.md),
  [`notes/medusa-integration-tests.md`](./notes/medusa-integration-tests.md),
  [`notes/e2e-tests.md`](./notes/e2e-tests.md).

## Monorepo Structure

```
.
├── apps/
│   ├── backend/          # @vc/backend — Medusa.js commerce engine
│   │   └── medusa-config.ts
│   └── storefront/        # @vc/storefront — Next.js storefront
│       └── next.config.ts
├── etl/                   # Python catalog ETL pipeline (not a pnpm workspace)
│   ├── requirements.txt
│   ├── seed/              # generated seed data + run artifacts (gitignore candidate)
│   └── tools/
│       ├── build_seed.py  # Extract + Transform: MusicBrainz/CAA → seed.json
│       ├── genres.py      # curated genre lookup table
│       └── load_catalog.py # Load: seed.json → Medusa Admin API
├── notes/                 # product spec, roadmap, testing specs
├── supabase/               # local Supabase CLI config (Postgres parity)
├── docker-compose.yml      # local Postgres (Supabase CLI) + Redis + Medusa
├── Dockerfile              # builds the Medusa backend for deployment (Render)
├── pnpm-workspace.yaml
├── turbo.json
├── LICENSE
└── package.json
```

`apps/storefront` is a from-scratch Next.js storefront, built with the
official `medusa-next` starter open as a reference rather than
reimplemented from documentation alone — see
[`notes/vc-storefront-rebuild-sequence.md`](./notes/vc-storefront-rebuild-sequence.md).
The starter itself has since been moved out of this repo.

## Running This Locally

The sections below are for anyone who wants to actually run the project —
a reviewer digging into the code, or a future collaborator. Each app also
has its own README with app-specific detail:
[`apps/backend/README.md`](./apps/backend/README.md),
[`apps/storefront/README.md`](./apps/storefront/README.md).

### Prerequisites

- Node.js ≥ 20
- [pnpm](https://pnpm.io/) 11.17.0 (via Corepack: `corepack enable`)
- Docker (for local Postgres and Redis)
- [Supabase CLI](https://supabase.com/docs/guides/local-development) (local Postgres parity with the hosted project — config already in `supabase/`)
- Python 3.x + `pip install -r etl/requirements.txt` (for the catalog ETL pipeline)

### Quick Start

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start local infrastructure** (Postgres via Supabase CLI, Redis, Medusa — see `docker-compose.yml`)

   ```bash
   pnpm env:up
   ```

3. **Bootstrap Medusa** (one-time per environment: admin user, region, sales channel, stock location, shipping profile — see Bootstrap in `notes/vc-etl-pipeline.md`)

   ```bash
   cd apps/backend
   npx medusa user -e admin@example.com -p <password>
   ```

4. **Seed the catalog** via the ETL pipeline (two stages — see `etl/tools/`)

   ```bash
   cd etl
   python tools/build_seed.py   # Extract + Transform → seed/seed.json
   python tools/load_catalog.py # Load → Medusa Admin API
   ```

   Run artifacts land in `etl/seed/` — `needs_review.csv` and `discarded.csv`
   for curation-time issues, `load_errors.json` and `*_run.log` for pipeline
   run history, and `back_cover_available.json` / `back_cover_missing.json`
   tracking which releases got a second gallery image.

5. **Run the storefront**

   ```bash
   pnpm storefront:dev
   ```

   Or combine steps 2 and 5 into one command for a fresh session:
   `pnpm dev:full`.

### Session Management

| Script              | Description                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm env:up`       | `supabase start` + `docker compose up -d` — brings up Postgres, Storage, Redis, and the Medusa container                           |
| `pnpm env:down`     | `docker compose down` + `supabase stop` — full teardown; named volumes (Postgres/Storage data, `node_modules`, pnpm store) persist |
| `pnpm env:status`   | `supabase status` + `docker compose ps`                                                                                             |
| `pnpm env:restart`  | `env:down` then `env:up`                                                                                                            |
| `pnpm backend:logs` | Tail the Medusa container's logs (`docker compose logs -f medusa`)                                                                 |

`pnpm env:up` to start a session; `Ctrl+C` the storefront dev server, then
`pnpm env:down` to end one. Nothing here shuts down on its own.

### Available Scripts

**Root**

| Script                                                    | Description                                                                                                                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm storefront:dev`                                     | Run the storefront in dev mode (`pnpm --filter=@vc/storefront dev`) — the backend runs via Docker Compose, not this script, to avoid a port collision on 9000     |
| `pnpm dev:full`                                           | `env:up`, then `pnpm storefront:dev` — one command for a fresh session                                                                                            |
| `pnpm env:up` / `env:down` / `env:status` / `env:restart` | Local infrastructure lifecycle — see Session Management above                                                                                                     |
| `pnpm backend:logs`                                       | Tail the Medusa container's logs                                                                                                                                  |

No root `build`/`start`/`lint`/`test` script yet (`turbo.json` defines
those tasks; nothing wires them up). `pnpm -r build` and `pnpm -r lint`
work today — for `start` and tests, use the app-specific scripts below.

**`apps/backend`** (`@vc/backend`)

| Script                     | Description                                                    |
| -------------------------- | ---------------------------------------------------------------|
| `dev`                      | `medusa develop`                                               |
| `build`                    | `medusa build`                                                 |
| `start`                    | `medusa start`                                                 |
| `lint`                     | `medusa lint`                                                  |
| `email:dev`                | Live-preview Resend email templates (`email dev`)              |
| `test:unit`                | Unit tests (pure functions — pricing/tax/shipping helpers)     |
| `test:integration:http`    | HTTP-level integration tests (e.g. checkout)                   |
| `test:integration:modules` | Module-level integration tests (e.g. restock-notify workflow)  |

See Testing in [`apps/backend/README.md`](./apps/backend/README.md) for how
to actually run the two integration scripts locally — they need env vars
the plain script name doesn't show.

**`apps/storefront`** (`@vc/storefront`)

| Script            | Description                                            |
| ----------------- | -------------------------------------------------------|
| `dev`              | `next dev -p 8000`                                     |
| `build`            | `next build`                                            |
| `start`            | `next start`                                            |
| `lint`             | `eslint`                                                |
| `analyze`          | `ANALYZE=true next build` — bundle analysis             |
| `test`             | `vitest run` — unit tests                               |
| `test:watch`       | `vitest` — unit tests in watch mode                     |
| `test:coverage`    | `vitest run --coverage`                                 |
| `test:e2e`         | `playwright test`                                       |
| `test:e2e:ui`      | `playwright test --ui`                                  |
| `revalidate`       | POST the dev server's `/api/revalidate?tag=products`    |

### Environment Variables

Each app manages its own `.env`. At minimum, expect:

- **Backend**: Postgres connection string (Supabase, direct or session-mode pooler — not the transaction-mode pooler), Redis URL (Upstash), JWT/cookie secrets, Resend API key, Supabase Storage (S3) credentials, Stripe secret key (`STRIPE_API_KEY`, test mode). See `apps/backend/.env.template` for the full list.
- **Storefront**: Medusa backend URL (`NEXT_PUBLIC_MEDUSA_BACKEND_URL`), Medusa publishable API key (`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`), default region (`NEXT_PUBLIC_DEFAULT_REGION`), site base URL (`NEXT_PUBLIC_BASE_URL`), revalidate secret (`REVALIDATE_SECRET`, must match the backend's), Stripe publishable key (`NEXT_PUBLIC_STRIPE_KEY`, test mode). There's no tracked `.env.example` for this app yet — start a `.env.local` from this list.

Stripe's webhook isn't wired up yet — deferred until the hosted Render
backend exists to receive it. See
[`notes/vc-stripe-integration-sequence.md`](./notes/vc-stripe-integration-sequence.md).

## Testing

Scoped deliberately rather than exhaustively for a demo project — see
Non-Functional Requirements in `notes/vc-prd.md`. Backend unit, module, and
HTTP-level integration suites are implemented and passing (see Testing in
[`apps/backend/README.md`](./apps/backend/README.md) to run them).
Storefront unit tests cover the data layer; end-to-end coverage
(Playwright) is one smoke test today, with the full per-journey plan
written up in [`notes/e2e-tests.md`](./notes/e2e-tests.md).

All of the above (lint, storefront unit tests, backend unit tests, and
backend integration tests) run in GitHub Actions on every push and pull
request — see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).
Playwright e2e isn't wired into CI yet; it needs the full local stack
(Supabase, Redis, Stripe) that isn't worth replicating there for now.

## License

MIT — see [`LICENSE`](./LICENSE).
