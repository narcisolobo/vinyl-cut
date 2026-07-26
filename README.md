# The Vinyl Cut

A fictional record shop e-commerce demo, built to showcase a production-grade
headless commerce architecture on [Medusa.js](https://medusajs.com/), with a
custom restock-notification module as the centerpiece.

> This is a non-commercial demo project. Stripe runs in test mode throughout;
> no real payments, customer data, or inventory are involved.

## Documentation

- [`notes/vinyl_cut_prd.html`](./notes/vinyl_cut_prd.html) — full product
  requirements document: features, architecture, infrastructure, and phased
  roadmap.
- [`notes/vinyl_cut_etl_pipeline.html`](./notes/vinyl_cut_etl_pipeline.html) —
  companion spec for the catalog ETL pipeline (MusicBrainz + Cover Art
  Archive → Medusa).

## Tech Stack

| Layer           | Choice                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------- |
| Storefront      | Next.js 15 (Turbopack in dev), React 19                                                       |
| Commerce engine | Medusa.js 2.18 (native cart, checkout, payment modules)                                       |
| Payments        | Stripe (via Medusa payment provider + `@stripe/react-stripe-js` on the storefront), test mode |
| Database        | PostgreSQL (Supabase, hosted; Supabase CLI, local — see `supabase/`)                          |
| Cache / events  | Redis (Upstash, hosted; plain Redis container, local)                                         |
| File storage    | Supabase Storage (S3-compatible), via Medusa's File Module                                    |
| Catalog ETL     | Python (MusicBrainz + Cover Art Archive → Medusa Admin API)                                   |
| Hosting         | Render (backend, via the root `Dockerfile`); storefront hosting TBD                           |

## Monorepo Structure

```
.
├── apps/
│   ├── backend/          # @dtc/backend — Medusa.js commerce engine
│   │   └── medusa-config.ts
│   └── storefront/        # @dtc/storefront — Next.js storefront
│       └── check-env-variables.js
├── etl/                   # Python catalog ETL pipeline (not a pnpm workspace)
│   ├── requirements.txt
│   ├── seed/              # generated seed data + run artifacts (gitignore candidate)
│   └── tools/
│       ├── build_seed.py  # Extract + Transform: MusicBrainz/CAA → seed.json
│       ├── genres.py      # curated genre lookup table
│       └── load_catalog.py # Load: seed.json → Medusa Admin API
├── notes/                 # project documentation
│   ├── vinyl_cut_prd.html
│   ├── vinyl_cut_etl_pipeline.html
│   └── pico.amber.min.css
├── supabase/               # local Supabase CLI config (Postgres parity)
│   ├── config.toml
│   └── snippets/
├── docker-compose.yml      # local Postgres (Supabase CLI) + Redis + Medusa
├── Dockerfile              # builds the Medusa backend for deployment (Render)
├── pnpm-workspace.yaml
├── turbo.json
├── LICENSE
└── package.json
```

## Prerequisites

- Node.js ≥ 20
- [pnpm](https://pnpm.io/) 11.13.0 (via Corepack: `corepack enable`)
- Docker (for local Postgres and Redis)
- [Supabase CLI](https://supabase.com/docs/guides/local-development) (local Postgres parity with the hosted project — config already in `supabase/`)
- Python 3.x + `pip install -r etl/requirements.txt` (for the catalog ETL pipeline)

## Getting Started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start local infrastructure** (Postgres via Supabase CLI, Redis, Medusa — see `docker-compose.yml`)

   ```bash
   pnpm env:up
   ```

3. **Bootstrap Medusa** (one-time per environment: admin user, region, sales channel, stock location, shipping profile — see Bootstrap Prerequisites in `notes/vinyl_cut_etl_pipeline.html`)

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

## Session Management

Local infra (Supabase CLI + Docker Compose) doesn't share a lifecycle with
the Next.js dev server, and none of these processes stop each other
automatically — worth being deliberate about start/stop rather than leaving
things running indefinitely across sessions.

| Script              | Description                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm env:up`       | `supabase start` + `docker compose up -d` — brings up Postgres, Storage, Redis, and the Medusa container                           |
| `pnpm env:down`     | `docker compose down` + `supabase stop` — full teardown; named volumes (Postgres/Storage data, `node_modules`, pnpm store) persist |
| `pnpm env:status`   | `supabase status` + `docker compose ps` — quick check before starting a session                                                    |
| `pnpm env:restart`  | `env:down` then `env:up` — useful if the backend is behaving oddly after a long-running session                                    |
| `pnpm backend:logs` | Tail the Medusa container's logs (`docker compose logs -f medusa`)                                                                 |

**End of session**: `Ctrl+C` the storefront dev server, then `pnpm env:down`.
Prefer a full teardown over leaving containers paused indefinitely — a
long-lived Medusa dev process that's been through many hot-reloads is more
prone to drifting into an odd state (e.g. a route not re-registering
cleanly) than one restarted fresh each session, and Docker Desktop plus
Supabase's local stack is meaningful sustained load to leave idling.

**Start of a new session**: `pnpm env:up`, confirm with `pnpm env:status`,
then `pnpm storefront:dev` (or skip straight to `pnpm dev:full`).

## Available Scripts

### Root

| Script                                                    | Description                                                                                                                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm storefront:dev`                                     | Run the storefront in dev mode (`pnpm --filter=@dtc/storefront dev`) — the backend runs via Docker Compose, not this script, to avoid a port collision on 9000    |
| `pnpm dev:full`                                           | `env:up`, then `pnpm storefront:dev` — one command for a fresh session                                                                                            |
| `pnpm build`                                              | Build all apps (`pnpm -r build`)                                                                                                                                  |
| `pnpm start`                                              | Start all apps in production mode (`turbo start`)                                                                                                                 |
| `pnpm lint`                                               | Lint all apps (`turbo lint`)                                                                                                                                      |
| `pnpm test`                                               | Run tests across all apps (`turbo test`)                                                                                                                          |
| `pnpm env:up` / `env:down` / `env:status` / `env:restart` | Local infrastructure lifecycle — see Session Management above                                                                                                     |
| `pnpm backend:logs`                                       | Tail the Medusa container's logs                                                                                                                                  |

### `apps/backend` (`@dtc/backend`)

| Script                     | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| `dev`                      | `medusa develop`                                              |
| `build`                    | `medusa build`                                                |
| `start`                    | `medusa start`                                                |
| `lint`                     | `medusa lint`                                                 |
| `test:unit`                | Unit tests (pure functions — pricing/tax/shipping helpers)    |
| `test:integration:http`    | HTTP-level integration tests (e.g. checkout)                  |
| `test:integration:modules` | Module-level integration tests (e.g. restock-notify workflow) |

### `apps/storefront` (`@dtc/storefront`)

| Script    | Description                                 |
| --------- | ------------------------------------------- |
| `dev`     | `next dev --turbopack -p 8000`              |
| `build`   | `next build`                                |
| `start`   | `next start -p 8000`                        |
| `lint`    | `next lint`                                 |
| `analyze` | `ANALYZE=true next build` — bundle analysis |

## Environment Variables

Each app manages its own `.env`. The storefront includes
`check-env-variables.js`, which validates required variables are present
before starting — run `node check-env-variables.js` (or let `next dev`/`next
build` invoke it) to confirm your `.env` is complete rather than guessing at
the required keys here. At minimum, expect:

- **Backend**: Postgres connection string (Supabase, direct or session-mode pooler — not the transaction-mode pooler), Redis URL (Upstash), Stripe secret key, Resend API key, Supabase Storage (S3) credentials.
- **Storefront**: Medusa backend URL, Medusa publishable API key, Stripe publishable key.

## Deployment

- **Backend**: the root `Dockerfile` builds the Medusa backend for deployment
  to Render (free tier). See Infrastructure & Deployment in
  `notes/vinyl_cut_prd.html` for the full rationale, including the
  Render/Supabase/Upstash free-tier interactions and the UptimeRobot
  keep-alive setup.
- **Storefront**: hosting not yet finalized.

## Testing

Testing scope is intentionally limited for a demo project — see
Non-Functional Requirements in `notes/vinyl_cut_prd.html`. In scope: unit
tests for pure functions (`test:unit`) and integration tests for checkout
(`test:integration:http`) and the restock-notify workflow
(`test:integration:modules`).

## License

See [`LICENSE`](./LICENSE).
