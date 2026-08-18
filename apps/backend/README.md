# @vc/backend

The Vinyl Cut's commerce engine — a Medusa.js 2.18 backend, mostly Medusa's
native modules (product, inventory, cart, order, payment, tax) configured
rather than replaced, plus one custom module built on top: **restock
notify**, the project's flagship feature. See the [root README](../../README.md)
for monorepo-wide setup (local infra, ETL seeding, session management) and
[`notes/vc-prd.md`](../../notes/vc-prd.md) for the product spec this app
implements.

## What's here

- **`src/modules/restock/`** — custom `RestockSubscription` module: a
  customer's "notify me" request against an out-of-stock variant (email,
  variant ID, sales channel ID). No login, no verification email — a
  unique index on `(email, variant_id)` is the only guard against
  duplicate signups. See §7 of `notes/vc-prd.md` for the full design,
  including why the original double-opt-in spec was simplified.
- **`src/modules/resend/`** — transactional email via Resend: order
  confirmation, "you're on the list" subscription confirmation, and
  restock-notification templates (`emails/order-placed.tsx`,
  `emails/variant-restock-subscribed.tsx`, `emails/variant-restock.tsx`),
  previewable with `pnpm email:dev`.
- **`src/workflows/`** — `create-restock-subscription` (validates the
  variant is actually out of stock, creates the subscription, sends the
  subscription-confirmation email), `send-restock-notifications` (the
  daily cron's workflow: finds subscriptions on now-in-stock variants,
  emails them, deletes the rows), `send-order-confirmation`,
  `revalidate-products-on-inventory-update`.
- **`src/jobs/check-restock.ts`** — the restock-notify system's trigger: a
  midnight cron (`0 0 * * *`) that runs `send-restock-notifications`.
  Polling rather than an inventory-event listener — a deliberate
  simplification, see the design note in `notes/vc-prd.md` §7.
- **`src/subscribers/`** — `order-placed.ts` (sends the confirmation email,
  revalidates the storefront's product cache) and
  `inventory-level-updated.ts` (revalidates the cache on manual Admin
  stock edits, so the storefront doesn't need an order to notice).
- **`src/api/store/`** — `restock-subscriptions` (the notify-me form's
  endpoint) and `product-options` (lists a catalog-wide option's values —
  e.g. every condition grade in use — since Medusa's default Store API
  only returns options nested under one product).
- **`src/links/restock-variant.ts`** — module link between a
  `RestockSubscription` and a product variant.

## Getting Started

Runs via Docker Compose as part of the root README's local infrastructure
(`pnpm env:up`), not standalone — see that doc for bootstrap (admin user,
region, sales channel, stock location, shipping profile) and catalog
seeding. Copy `.env.template` to `.env` and fill in Postgres/Redis/Resend/
Supabase Storage credentials (see the root README's Environment Variables
section for what each is for).

## Scripts

| Script                      | Description                                                    |
| ---------------------------- | --------------------------------------------------------------|
| `dev`                         | `medusa develop`                                              |
| `build`                       | `medusa build`                                                |
| `start`                       | `medusa start`                                                |
| `lint`                        | `medusa lint`                                                 |
| `email:dev`                   | Live-preview the Resend email templates in the browser        |
| `test:unit`                   | Unit tests — see Testing below                                |
| `test:integration:http`       | HTTP-level integration tests — see Testing below              |
| `test:integration:modules`    | Module-level integration tests — see Testing below             |

## Testing

Three Jest projects, selected by `TEST_TYPE` in `jest.config.js`:

| Suite                       | Pattern                                     | What it exercises                                                        |
| ----------------------------| -------------------------------------------- | -------------------------------------------------------------------------|
| `test:unit`                  | `**/src/**/__tests__/**/*.unit.spec.ts`      | Pure functions — no database, no booted app. Resend email templates, variant-availability logic, request validators. |
| `test:integration:modules`   | `**/src/modules/*/__tests__/**/*.spec.ts`    | A module's service, or a workflow, against a real database — restock module service, create-subscription workflow. |
| `test:integration:http`      | `**/integration-tests/http/*.spec.ts`        | Real HTTP requests against a booted Medusa app — restock subscriptions, product options, checkout, checkout tax, order confirmation. |

Run any of the three with `pnpm test:unit`, `pnpm test:integration:modules`,
`pnpm test:integration:http` (or `pnpm --filter=@vc/backend <script>` from
the repo root). All three currently pass in full — 12 suites, 24 tests.

### Running the integration suites — must run from the host

`medusaIntegrationTestRunner` (used by both integration projects) boots a
full Medusa app in-process inside Jest and builds its own database
connection from `DB_HOST`/`DB_USERNAME`/`DB_PASSWORD`/`DB_PORT` — it
**ignores `DATABASE_URL` entirely**. This app's `.env` points
`DATABASE_URL` at `host.docker.internal`, a hostname that only resolves
from inside the `medusa` Docker container, not from a Jest process running
on the host. So: bring up just Postgres (via `supabase start`) and Redis —
not the `medusa` container itself, since the app boots in-process — and
point the integration scripts at their host-published ports:

```bash
supabase start
docker compose up -d redis
DB_HOST=localhost DB_USERNAME=postgres DB_PASSWORD=postgres DB_PORT=54322 \
REDIS_URL=redis://localhost:6379 \
pnpm test:integration:http    # and/or test:integration:modules
```

Running them unmodified inside the `medusa` container instead doesn't just
fail faster — it fails *slower*: the DB connection resolves fine (the
container does see `host.docker.internal`), but Medusa's per-module
connection pools exhaust against Supabase's local Postgres, and each
integration test hangs until its 60-second hook timeout. From the host
with the override above, the same suite finishes in seconds.

### Other gotchas, in more detail

- **Real Resend calls are a genuine hazard, not hypothetical.** The
  order-placed and restock-subscribe workflows send a real notification as
  a side effect of the actions these tests take. Every spec that can reach
  either workflow mocks `resend` at the top of the file — see any spec
  under `src/modules/restock/__tests__/` for the pattern. `.env.test` is a
  second-layer backstop (placeholder `RESEND_API_KEY`) for a spec that
  forgets the mock: it fails loudly with a real auth error instead of
  silently sending through the production key.
- **`--runInBand` breaks the two multi-file integration suites** under
  `--experimental-vm-modules` — each test file gets its own VM context,
  which Medusa's module registry doesn't tolerate sharing within one
  process. `test:unit` still uses it safely (unit specs don't touch
  Medusa's module registry); the two integration scripts don't pass the
  flag.
- **A workflow's `run()` promise rejection isn't reliable for asserting a
  step failure.** Call `.run({ input, throwOnError: false })` and assert on
  the returned `errors` array instead — see
  `notes/medusa-integration-tests.md` for the full root-cause writeup.

Full suite-by-suite spec lists, including what's intentionally *not*
tested and why: [`notes/medusa-unit-tests.md`](../../notes/medusa-unit-tests.md),
[`notes/medusa-integration-tests.md`](../../notes/medusa-integration-tests.md).

---

<details>
<summary>Medusa.js — upstream starter info</summary>

<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

This app was bootstrapped from Medusa's default starter (compatible with
`@medusajs/medusa` >= 2). See the
[Quickstart Guide](https://docs.medusajs.com/learn/installation) and
[architecture docs](https://docs.medusajs.com/learn/introduction/architecture)
to learn Medusa itself, independent of anything specific to this project.

</details>
