# Medusa Backend — Unit Tests

Companion to `vc-prd.md` §9's testing strategy, scoped to `apps/backend`'s
`unit` Jest project (`jest.config.js`: `TEST_TYPE=unit` →
`**/src/**/__tests__/**/*.unit.spec.[jt]s`).

## Status: implemented

`setupFiles` is now conditional per `TEST_TYPE` in `jest.config.js`, so the
`unit` project no longer loads `integration-tests/setup.js` (that file now
exists too — see `medusa-integration-tests.md` — but only the two
integration projects reference it). All three suggested tests below are
written and passing via `pnpm test:unit`.

Testing the Resend templates (#3) surfaced two more real gaps, now fixed
alongside: `jest.config.js`'s `transform`/`moduleFileExtensions` didn't
cover `.tsx` at all, so nothing could import the email components; and
`@react-email/components`' `Tailwind` wrapper renders inside a Suspense
boundary, which only React's async streaming APIs support — `@react-email/render`
(now a devDependency) handles that correctly where `react-dom/server`'s
synchronous `renderToStaticMarkup` can't.

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

## Implemented tests

### 1. Restock subscription request validation — done

`api/store/restock-subscriptions/__tests__/validators.unit.spec.ts` covers
`PostStoreCreateRestockSubscription`: a full payload, a payload with only
`variant_id` (confirming `email`/`sales_channel_id` are genuinely
optional), a missing `variant_id`, and a wrong-typed `variant_id`.

### 2. Extracted and tested: variant-availability check — done

The duplicated `(availability || 0) > 0` check now lives in one place,
`lib/is-variant-available.ts`'s `isVariantAvailable(availability: number | null | undefined): boolean`
(the real `getVariantAvailability` return type includes `null`, not just
`undefined`). Both
`workflows/create-restock-subscription/steps/validate-variant-out-of-stock.ts`
and `workflows/send-restock-notifications/steps/get-restocked.ts` call it
instead of repeating the inline check. Tested directly in
`lib/__tests__/is-variant-available.unit.spec.ts`: `0` → `false`,
`null`/`undefined` → `false`, positive → `true`.

### 3. Resend email content — done

`modules/resend/emails/__tests__/order-placed.unit.spec.ts` and
`variant-restock.unit.spec.ts` render each template with
`@react-email/render`'s `render()` against a minimal typed fixture (cast
through the template's own exported prop type, e.g.
`OrderPlacedEmailProps['order']`, rather than hand-typing a parallel
shape) and assert on the rendered HTML: the order-confirmation email
includes the order ID and each line item's title/grade, the
restock-notify email includes the restocked release's title and grade.

## As the codebase grows

Prefer extracting the actual decision or calculation out of a
container-coupled step into a small named function the step then calls —
the same pattern as #2. It keeps steps thin, and each extracted function
becomes unit-testable without booting the app.
