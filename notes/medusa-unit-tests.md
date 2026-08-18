# Medusa Backend — Unit Tests

Companion to `vc-prd.md` §9's testing strategy, scoped to `apps/backend`'s
`unit` Jest project (`jest.config.js`: `TEST_TYPE=unit` →
`**/src/**/__tests__/**/*.unit.spec.[jt]s`).

## Blocking prerequisite

`jest.config.js`'s `setupFiles: ["./integration-tests/setup.js"]` is set
once at the top level, before the `TEST_TYPE` branches that pick
`testMatch` — so it applies to the `unit` project too, even though unit
tests shouldn't need an integration-test bootstrap at all. That file
doesn't exist yet (confirmed — `test:unit` currently fails immediately with
a Jest validation error, before running anything). Worth fixing two ways:
create `integration-tests/setup.js` (see `medusa-integration-tests.md`),
and/or make `setupFiles` conditional on `TEST_TYPE` so unit tests aren't
coupled to integration bootstrap at all.

## Reality check on what's actually unit-testable today

Almost everything in `apps/backend/src` resolves the DI container or an
ORM manager to touch the database — workflow steps call
`container.resolve(...)`, the restock module service uses
`@MedusaContext()`. That's appropriate for what they do, but it means
there's very little isolated, dependency-free logic in this codebase right
now. Two consequences:

1. Only one thing is unit-testable *as-is* today (see below).
2. Two more become testable with a small, worthwhile extraction first —
   listed as their own items.

`vc-prd.md` §9 names "condition-grade pricing logic" and "tax/shipping
calculation helpers" as unit-test targets — worth flagging that neither
exists in `apps/backend` today. Condition-grade pricing is fabricated once
at import time by the Python ETL (`etl/tools/`), not computed at runtime by
this app, and tax/shipping are Medusa's native modules configured via
Admin data, not custom calculation code in this repo. Nothing to unit test
here yet; revisit if a custom pricing-display or tax-formatting helper
gets written later.

## Suggested tests

### 1. Restock subscription request validation

`api/store/restock-subscriptions/validators.ts` — `PostStoreCreateRestockSubscription`
is a plain Zod schema, zero DB/container dependency, ready to test now.

- Valid payload (`variant_id` + `email`) parses successfully.
- Missing `variant_id` fails.
- `email` and `sales_channel_id` are genuinely optional — omitting either
  still parses.
- Wrong types (e.g. `variant_id` as a number) are rejected.

### 2. Extract and test: variant-availability check

The same `(availability || 0) > 0` check is duplicated in two places —
`workflows/create-restock-subscription/steps/validate-variant-out-of-stock.ts`
and `workflows/send-restock-notifications/steps/get-restocked.ts` — each
inline inside a container-coupled step. Pull it out into one named,
exported helper (e.g. `isVariantAvailable(availability: number): boolean`
in a small `lib/` module), have both steps call it, and unit test the
helper directly:

- `0` → `false`.
- `undefined`/missing → `false` (matches the existing `|| 0` fallback).
- Positive number → `true`.

This also removes the duplication, not just adds test coverage.

### 3. Resend email content

`modules/resend/emails/` — if the restock-notify and order-confirmation
templates are plain functions/components mapping props to subject + body
content, unit test the mapping directly (no live Resend call needed):

- Restock-notify email includes the restocked variant/release title.
- Order-confirmation email includes the order ID and line items.

## As the codebase grows

Prefer extracting the actual decision or calculation out of a
container-coupled step into a small named function the step then calls —
the same pattern as #2. It keeps steps thin, and each extracted function
becomes unit-testable without booting the app.
