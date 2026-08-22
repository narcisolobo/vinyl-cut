# Deployment Checks

Pre- and post-deployment checklist for standing up the hosted stack
described in **Infrastructure & Deployment** in
[`vc-prd.md`](./vc-prd.md#5-infrastructure--deployment): Medusa on
Render, Postgres + Storage on Supabase, Redis on Upstash, storefront
host TBD. Cross-references below point at the relevant PRD section or
sequence note rather than repeating their detail here.

## Pre-Deployment

### Accounts & provisioning

- [ ] Create/confirm the Render workspace and connect this repo
- [x] Provision (or confirm) the hosted Supabase project — Postgres +
      Storage bucket, public-read (PRD §5); local dev only uses the
      Supabase CLI's local stack today, not a hosted project
- [x] Create the Upstash Redis database (free tier) — provisioned via the
      Stripe Projects CLI (`stripe projects add upstash/redis`), us-east-2;
      `REDIS_URL` composed and verified in
      `apps/backend/.env.production.local`
- [ ] Decide and provision storefront hosting — currently listed as
      TBD in the README's Tech Stack table

### Backend readiness (blockers)

- [x] Add a `/keep-alive` route that performs a real DB query, not just
      a 200 — required by the UptimeRobot keep-alive strategy (PRD §5).
      Named `/keep-alive` rather than `/health` to stay distinct from
      Medusa's own built-in static `/health` route.
- [ ] Add `webhookSecret` to the Stripe provider options in
      `medusa-config.ts` (currently only `apiKey` and `capture` are
      set) and wire it to a new `STRIPE_WEBHOOK_SECRET` env var
- [ ] Set backend env vars on Render — derived from `medusa-config.ts`
      and `apps/backend/.env.template` (which is currently missing
      several of these; worth updating alongside):
  - `DATABASE_URL` — Supabase, direct connection (port 5432) or
    session-mode pooler, **not** the transaction-mode pooler
    (incompatible with MikroORM migrations/prepared statements, PRD §5)
  - `REDIS_URL` — Upstash
  - `STORE_CORS` / `ADMIN_CORS` / `AUTH_CORS` — the real deployed
    storefront/admin URLs, not the localhost defaults
  - `JWT_SECRET` / `COOKIE_SECRET` — real secrets, not the
    `supersecret` dev placeholder
  - `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe test-mode keys
  - `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
  - `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_REGION` /
    `S3_BUCKET` / `S3_ENDPOINT` / `S3_FILE_URL` — Supabase Storage
  - `STOREFRONT_URL` / `STOREFRONT_INTERNAL_URL` /
    `STOREFRONT_DEFAULT_COUNTRY_CODE`
  - `REVALIDATE_SECRET` — must match the storefront's value
- [ ] Confirm Render builds the Dockerfile itself rather than pulling
      a locally-built image, so local Apple Silicon has no bearing on
      the deployed (amd64) image (PRD §5)

### Storefront readiness

- [ ] Set storefront env vars on the chosen host:
      `NEXT_PUBLIC_MEDUSA_BACKEND_URL`,
      `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`,
      `NEXT_PUBLIC_DEFAULT_REGION`, `NEXT_PUBLIC_BASE_URL`,
      `REVALIDATE_SECRET` (must match the backend), `NEXT_PUBLIC_STRIPE_KEY`
      (Stripe test-mode publishable key)
- [ ] Set `SENTRY_AUTH_TOKEN` on whatever host runs `next build` — the
      Sentry DSN itself is already hardcoded in `instrumentation-client.ts`
      / `sentry.server.config.ts` / `sentry.edge.config.ts` (DSNs
      aren't secret), only the build-time source-map upload needs
      this token. Missing it doesn't break the app, just leaves stack
      traces in Sentry unmapped.
- [ ] Confirm the hardcoded production domain
      (`https://vinylcut.narcisolobo.com`, used in `layout.tsx`'s
      `metadataBase` and OG metadata) matches wherever the storefront
      actually ends up deployed; update if not

### Data & seeding

- [ ] Bootstrap the hosted Medusa instance the same way as local:
      admin user, region, sales channel, stock location, shipping
      profile (PRD Phase 5)
- [ ] Re-run the catalog ETL pipeline (`etl/tools/build_seed.py` +
      `load_catalog.py`) against the hosted Admin API
- [ ] Sanity-check total catalog image size against Supabase's 1 GB
      free-tier storage cap before finalizing the seed list (PRD §5)
- [ ] Configure the 7-state tax regions carefully via bare province
      codes (`ca`, not `us-ca`) — see the `province_code` bug noted in
      `medusa-integration-tests.md`; re-run
      `fix-tax-region-province-codes.ts` via `medusa exec` against the
      hosted DB if the Admin UI reintroduces the prefixed form

### Stripe

- [ ] Create a test-mode webhook endpoint in the Stripe Dashboard
      pointed at the deployed backend's webhook URL, once that URL
      exists
- [ ] Copy the resulting signing secret into `STRIPE_WEBHOOK_SECRET`

## Post-Deployment

### Smoke test

- [ ] Full guest checkout with a Stripe test card against the live
      storefront + backend URLs
- [ ] Order confirmation email arrives via Resend with real (not
      `localhost`) image URLs — the local dev gap was expected and
      deferred to exactly this point
- [ ] Restock-notify signup works, and the daily `check-restock` cron
      job actually fires — Render's free-tier spin-down means an
      asleep service skips its scheduled jobs entirely, so this
      specifically tests whether the keep-alive is working, not just
      whether the endpoint responds
- [ ] Trigger a real error against the deployed storefront and confirm
      it lands in Sentry, with a readable (source-mapped) stack trace
- [ ] Medusa Admin dashboard is reachable at its public Render URL and
      login-gated
- [ ] Place a test order and confirm the corresponding Stripe webhook
      event shows as succeeded in the Stripe Dashboard's webhook logs

### Monitoring

- [ ] Add the UptimeRobot HTTP monitor (5-minute interval) against
      `/keep-alive`
- [ ] Confirm it's actually resetting both Render's 15-minute
      spin-down and Supabase's separate 7-day pause (PRD §5), not just
      returning 200 — check both dashboards after a quiet period
      rather than assuming

### Docs

- [ ] Update the README's Project Status and Tech Stack rows —
      "storefront hosting TBD" and the not-yet-deployed framing can
      come out once this is live
- [x] Fix the README's link to `notes/vc-stripe-integration-sequence.md`
      (referenced twice — Documentation section and Environment
      Variables) — recreated the doc, so both links now resolve.
