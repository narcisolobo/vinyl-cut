# Medusa Backend — Integration Tests

Companion to `vc-prd.md` §9's testing strategy, scoped to `apps/backend`'s
two integration Jest projects (`jest.config.js`):

- `TEST_TYPE=integration:http` → `**/integration-tests/http/*.spec.[jt]s`
  — real HTTP requests against a booted Medusa app and test database.
  Typically written with `medusaIntegrationTestRunner` from
  `@medusajs/test-utils`.
- `TEST_TYPE=integration:modules` → `**/src/modules/*/__tests__/**/*.[jt]s`
  — a module's service exercised directly against a real database, no
  HTTP layer. Typically written with `moduleIntegrationTestRunner`.

(Confirm exact runner names/signatures against the installed
`@medusajs/test-utils` version before writing the first spec — Medusa's
testing APIs have shifted across versions.)

## Status: `integration:http` and `integration:modules` both implemented

All five suggested `integration:http` specs below are written and passing
(`pnpm test:integration:http`, run against a local Supabase Postgres —
see Running locally below). All three suggested `integration:modules`
specs are also written and passing (`pnpm test:integration:modules`).

`integration-tests/setup.js`:

```js
const { JestUtils } = require("@medusajs/test-utils")

JestUtils.afterAllHookDropDatabase()
```

`jest.config.js` wires `setupFiles` to it for both integration projects
only (the `unit` project doesn't depend on it — see `medusa-unit-tests.md`).

Shared fixtures live in `integration-tests/helpers/`:

- `admin-auth.ts` — `createAdminUser`/`generateStoreHeaders`, trimmed
  from Medusa's own `integration-tests/helpers/create-admin-user.ts`
  (no RBAC, no real password hash — the JWT is minted directly).
- `create-checkout-seeder.ts` — region, sales channel, stock location,
  inventory, shipping profile/option, product+variant, and (optionally)
  tax regions. Modeled closely on Medusa's own
  `integration-tests/http/__tests__/fixtures/order.ts`.
- `poll-for-notification.ts` — see the async-timing note below.

### Running locally

`medusaIntegrationTestRunner` builds its own DB connection from
`DB_HOST`/`DB_USERNAME`/`DB_PASSWORD`/`DB_PORT` (defaults: `localhost`,
`postgres`, empty, `5432`) — it ignores `DATABASE_URL` entirely, and the
project's own `.env` uses `host.docker.internal`, which only resolves
from inside a container anyway, not from the host process Jest runs in.
Bring up just Postgres and Redis (not the `medusa` container — the app
boots in-process inside Jest) and point at their host-published ports:

```bash
supabase start
docker compose up -d redis
DB_HOST=localhost DB_USERNAME=postgres DB_PASSWORD=postgres DB_PORT=54322 \
REDIS_URL=redis://localhost:6379 \
pnpm test:integration:http
```

### Real Resend calls — a genuine hazard, not hypothetical

Both the restock-subscribe and order-placed workflows send a real
notification as a side effect of the actions these tests take —
confirmed the hard way: the first `restock-subscriptions.spec.ts` run
made a genuine outbound call to Resend's API, and only failed to send
because Resend itself rejects `example.com` as a test recipient domain.
Every spec that can reach either of those workflows starts with:

```ts
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ data: { id: 'test' }, error: null }) },
  })),
}));
```

This mock is the actual fix — it removes the network call entirely.
`apps/backend/.env.test` (`@medusajs/utils`'s `loadEnv` loads it
alongside `.env` whenever `NODE_ENV=test`, which Jest sets by default;
`.env.test`'s values win for any key both files define, everything else
still comes from `.env`) is a second-layer backstop with placeholder
`RESEND_API_KEY`/`RESEND_FROM_EMAIL` values, for the case a future spec
reaches one of these workflows without adding the mock — it fails loudly
with a real auth error against Resend instead of silently sending
through the real production key.

### `--runInBand` breaks multi-file runs under `--experimental-vm-modules`

`test:integration:http`/`test:integration:modules` originally ran with
`--runInBand`. Running all five specs together that way, four of five
failed with `Method Map.prototype.set called on incompatible receiver` —
a signature of Jest's `--experimental-vm-modules` giving each test file
its own VM context, which Medusa's module registry doesn't tolerate
sharing across files within one process. Each file passed individually;
only the combined run under `--runInBand` broke. Dropping `--runInBand`
(letting Jest use separate worker processes instead) fixed it — both
scripts no longer pass that flag. `--experimental-vm-modules` itself is
still required (confirmed: removing it breaks every file immediately,
including ones with no Resend involvement — Medusa's own boot path uses
a dynamic `import()` internally).

### `waitWorkflowExecutions()` doesn't reliably track subscriber-dispatched workflows

`order.placed` fires over the local, in-process event bus this harness
forces regardless of `REDIS_URL`. Timing to the subscriber's workflow
actually running varied from near-instant to ~60s across observed runs
(DB connection-pool contention, not a fixed delay), and
`utils.waitWorkflowExecutions()` didn't reliably track it either —
observed once returning before the subscriber's workflow had even
started. `poll-for-notification.ts` polls instead. `checkout.spec.ts`'s
order-completion test also drains it (without asserting on the result)
purely so it settles before that file's `afterAll` DB-drop hook runs —
Postgres refuses to drop a database with an active connection still
querying it, which otherwise timed out the hook.

### Tax region `provider_id` — only settable on the top-level region

Omitting `provider_id` when creating a tax region doesn't default to
Medusa's built-in system provider — it stores `null`, and resolving it
later throws (`AwilixResolutionError: Could not resolve 'null'`). The
real provider key is `tp_system`. Setting it on a *province-level child*
region, however, trips a DB check constraint
(`CK_tax_region_provider_top_level`) — a child inherits its parent's
provider automatically. Set `provider_id: 'tp_system'` only on the
country-level region.

## Implemented `integration:http` tests

### 1. Restock subscription creation — `restock-subscriptions.spec.ts` — done

- `POST /store/restock-subscriptions` on an out-of-stock variant succeeds.
- Same request on an in-stock variant is rejected — exercises
  `validate-variant-out-of-stock` end to end.
- Submitting the same `(email, variant_id)` pair twice leaves exactly one
  row (queried directly via `RestockModuleService`), not two.

### 2. Product options — `product-options.spec.ts` — done

- `GET /store/product-options` returns only options with
  `is_exclusive: false`. Confirmed live: inline product options
  (`options: [{ title, values }]` on `/admin/products`) default to
  `is_exclusive: true` — a genuinely shared option has to be created
  directly via `POST /admin/product-options` first and referenced by ID,
  exactly matching `etl/tools/load_catalog.py`'s `get_or_create_condition_option`.
- The option's values are present in the response shape the storefront's
  filter UI depends on.

### 3. Checkout — `checkout.spec.ts` — done

- Cart with a shipping address inside the seeded service zone's
  province — the flat-rate shipping option is offered.
- Same cart shape, address in an unlisted province — zero shipping
  options returned (verified live via the Admin API earlier this session;
  now codified).
- Full guest checkout (cart → shipping method → payment session →
  complete) — order totals match the cart exactly (item total, shipping
  total, tax total, grand total, item count, address).

### 4. Tax line on checkout — `checkout-tax.spec.ts` — done

- CA (province-level override, 10% in the test fixture for a
  round-number assertion) and OR (falls back to the country-level 0%
  default, mirroring the real Admin config) both assert on
  `cart.tax_total` after `POST /store/carts/:id/taxes` — not
  `items[0].tax_total`, which the live response doesn't populate the way
  the item-level field name suggests.

### 5. Order confirmation triggers — `order-confirmation.spec.ts` — done

- Completing an order eventually produces a `Notification` row for the
  `order-placed` template addressed to the cart's email, and the mocked
  Resend `send` is called with the right recipient. Polled per the
  async-timing note above, not asserted synchronously.

## Implemented `integration:modules` tests

### 1. Restock module service — `restock/__tests__/service.spec.ts` — done

- `getUniqueSubscriptions()` — seed subscriptions across multiple emails
  for the same `(variant_id, sales_channel_id)`, confirm only distinct
  pairs are returned.
- `moduleIntegrationTestRunner` requires a `resolve` option for any
  module that isn't one of Medusa's built-ins — without it,
  `registerMedusaModule` throws `Cannot resolve module ''` trying to
  `require.resolve` an empty path. Unlike `medusaIntegrationTestRunner`
  (which boots the whole app, so `RESTOCK_MODULE` alone is enough to
  resolve it from `medusa-config.ts`'s already-registered `modules`
  list), this runner boots only the target module in isolation and needs
  the same resolve string `medusa-config.ts` uses for it:
  `resolve: './src/modules/restock'`.
- The shared `integration-tests/setup.js` `afterAllHookDropDatabase()`
  hook logs a caught, non-fatal `password authentication failed for user
  "postgres"` error on every run — it targets `DB_TEMP_NAME`, which only
  `medusaIntegrationTestRunner` sets; harmless here since
  `moduleIntegrationTestRunner` manages its own per-suite database
  lifecycle (`beforeEach`/`afterEach` around `MikroOrmWrapper`).

### 2. Create-restock-subscription workflow — `restock/__tests__/create-subscription-workflow.spec.ts` — done

- Full run against a real out-of-stock variant creates a
  `RestockSubscription` row.
- Full run against an in-stock variant throws at the validation step and
  leaves no row behind. In practice `validateVariantOutOfStockStep` runs
  *before* the create step, so this is really confirming the workflow
  never reaches creation — not a create-then-roll-back — but it's still
  the right level to test at (a step-level test can't see whether a
  later, unrelated step run first would have left a row).
- This workflow needs the full app — Product/Inventory/Sales-Channel
  module links and the query graph, none of which
  `moduleIntegrationTestRunner` (used by test #1) boots. Uses
  `medusaIntegrationTestRunner` instead, same as the `integration:http`
  specs, even though the file still has to live under
  `src/modules/restock/__tests__/` to match this project's `testMatch`.
  Seeds sales channel/stock location/product/variants/inventory via the
  Admin API exactly like `restock-subscriptions.spec.ts`, then calls
  `createRestockSubscriptionWorkflow(getContainer()).run({ input })`
  directly instead of going through the store route. Needs the same
  `jest.mock('resend', ...)` as that file, since the workflow really
  does call `sendNotificationStep` on success.
- **`workflow.run()`'s promise rejection (the default `throwOnError:
  true` path) is not reliable for asserting a step failure** — confirmed
  by direct repro: `await expect(workflow(...).run({...})).rejects.toThrow(...)`
  failed non-deterministically (sometimes 3/3 runs, sometimes 0/3),
  even in complete isolation with no other spec file involved, despite
  a debug log confirming the validation step's `throw` line did execute
  every time. Root cause (read from
  `@medusajs/workflows-sdk`'s `dist/helper/workflow-export.js`): the
  thrown error only surfaces if `transaction.getState()` has already
  reached `FAILED`/`REVERTED` by the time `run()`'s promise resolves,
  and that transition is asynchronous relative to the step's own
  `throw`. `transaction.getErrors(TransactionHandlerType.INVOKE)`,
  by contrast, is populated unconditionally in the same code path and
  read every time regardless of transaction state. Fix: call
  `.run({ input, throwOnError: false })` and assert on the returned
  `errors` array (`errors[0].error.message`) instead of on promise
  rejection. Reran the exact failing case 3/3 times after switching to
  this pattern with no failures. Apply the same pattern in test #3 and
  any future workflow-failure-path test in this repo.

### 3. Send-restock-notifications workflow — `restock/__tests__/send-notifications-workflow.spec.ts` — done

- Seed a restocked variant (inventory already at a positive quantity —
  the workflow only reads current availability, so there's no need to
  actually transition 0→5 mid-test) with two subscriptions, plus an
  unrelated, still-out-of-stock variant's subscription. Subscriptions
  are seeded directly via `RestockModuleService.createRestockSubscriptions`,
  bypassing the create-subscription workflow's out-of-stock validation
  entirely (not needed here — this test is about the *send* workflow).
- `sendRestockNotificationsWorkflow(getContainer()).run()` takes no
  input (`getDistinctSubscriptionsStep` reads directly off the module).
  Confirms a Resend `send` call per subscriber on the restocked variant
  (2 calls, correct recipient emails), that variant's subscriptions
  removed afterward (per `delete-restock-subscriptions.ts`), and the
  unrelated subscription left untouched.
- Unlike test #2, this workflow's happy path needed no
  `throwOnError`/`errors`-array workaround — nothing here asserts on a
  step failure, so `run()`'s ordinary resolved `result` is fine.
- The Resend client (`new Resend(apiKey)`) is constructed lazily, on the
  *first* `send` call, not at module-boot time — capturing
  `(Resend as jest.Mock).mock.results[0]` in `beforeAll` throws
  (`results[0]` is `undefined`, nothing has called `new Resend()` yet
  since this file never exercises the create-subscription workflow).
  Capture it after `.run()` resolves, inside the `it()`, instead.

### Not worth a separate test

`jobs/check-restock.ts` is a one-line wrapper that calls
`sendRestockNotificationsWorkflow(container).run()` — testing #3 above
already exercises everything it does. A dedicated job-level test would
just re-run the same workflow test under a different file name.
