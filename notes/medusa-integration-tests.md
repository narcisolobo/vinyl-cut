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

## Blocking prerequisite

Neither project can run yet: `jest.config.js` points `setupFiles` at
`./integration-tests/setup.js`, which doesn't exist — `test:integration:http`
and `test:integration:modules` both fail immediately with a Jest
validation error. **First task, before any spec below:** create
`integration-tests/setup.js`. A typical Medusa v2 setup file just raises
Jest's default test timeout to accommodate booting a real app/DB per run
(`jest.setTimeout(60000)` or similar) — nothing else is usually required.

## On the tax test specifically

Per the earlier discussion on TDD for tax: write test #4 below (the tax
line assertion) *before* configuring tax regions in Admin, not after. It's
the only verification signal for that configuration step other than
manually checking the Admin UI or re-running the `curl`-based check this
audit used — it'll fail against the current empty `tax_regions` table,
then pass once the 8-state flat rates are configured.

## Suggested `integration:http` tests

### 1. Restock subscription creation — `restock-subscriptions.spec.ts`

- `POST /store/restock-subscriptions` on an out-of-stock variant succeeds.
- Same request on an in-stock variant is rejected — exercises
  `validate-variant-out-of-stock` end to end.
- Submitting the same `(email, variant_id)` pair twice is deduped/rejected
  by the unique index, not silently duplicated.

### 2. Product options — `product-options.spec.ts`

- `GET /store/product-options` returns only options with
  `is_exclusive: false`.
- The `Condition` option and its grade values (`New`, `M`, `NM`, `VG+`,
  `VG`, `G`) are present in the response shape the storefront's filter UI
  depends on.

### 3. Checkout — `checkout.spec.ts`

The integration-test equivalent of the e2e checkout spec in
`e2e-tests.md`, but asserting API responses rather than rendered UI:

- Create a cart, add a line item, set a shipping address within the
  8-state region — confirm the flat-rate shipping option is offered.
- Same cart, address outside the region — confirm no shipping option is
  returned (this is exactly what the live `/admin` check this session
  confirmed manually; codify it).
- Complete the order — confirm totals, shipping cost, and item lines on
  the resulting order match the cart.

### 4. Tax line on checkout — `checkout-tax.spec.ts`

- A cart with a CA shipping address includes the expected flat-rate tax
  line once configured. Write this first — see the TDD note above.

### 5. Order confirmation triggers — `order-confirmation.spec.ts`

- Placing an order fires `order.placed` → `send-order-confirmation`
  workflow. Assert via the `local`/`feed` notification provider already
  configured in `medusa-config.ts` alongside Resend (a notification
  record gets created) rather than intercepting a live Resend send.

## Suggested `integration:modules` tests

### 1. Restock module service — `restock/__tests__/service.spec.ts`

- `getUniqueSubscriptions()` — seed subscriptions across multiple emails
  for the same `(variant_id, sales_channel_id)`, confirm only distinct
  pairs are returned.

### 2. Create-restock-subscription workflow — `restock/__tests__/create-subscription-workflow.spec.ts`

- Full run against a real out-of-stock variant creates a
  `RestockSubscription` row.
- Full run against an in-stock variant throws at the validation step and
  leaves no row behind (confirms the workflow's compensation, not just the
  step in isolation).

### 3. Send-restock-notifications workflow — `restock/__tests__/send-notifications-workflow.spec.ts`

- Seed a restocked variant with subscriptions plus an unrelated,
  still-out-of-stock variant's subscriptions.
- Run the workflow: confirm a notification fires per subscriber on the
  restocked variant, those subscriptions are removed afterward (per
  `delete-restock-subscriptions.ts`), and the unrelated subscriptions are
  untouched.

### Not worth a separate test

`jobs/check-restock.ts` is a one-line wrapper that calls
`sendRestockNotificationsWorkflow(container).run()` — testing #3 above
already exercises everything it does. A dedicated job-level test would
just re-run the same workflow test under a different file name.
