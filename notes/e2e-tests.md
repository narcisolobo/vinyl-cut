# End-to-End Tests

Suggested Playwright specs for `apps/storefront/e2e/`, building on the
existing `homepage.spec.ts` smoke test. Organized by user journey, in
rough priority order (read-only/low-stakes first, checkout last — same
sequencing logic as `vc-storefront-rebuild-sequence.md`).

Companion to `vc-prd.md` §9's testing strategy, which now scopes in
end-to-end coverage of these journeys via Playwright, alongside unit tests
(pricing/tax/shipping helpers) and integration tests (checkout,
restock-notify workflow). The boundary is golden-path-per-journey, not
exhaustive UI coverage — see the specs below for what that means in
practice.

---

## Existing coverage

- `e2e/homepage.spec.ts` — smoke test only (confirms `body` renders).

---

## 1. Catalog browsing & filtering — `store.spec.ts`

- Visit `/us/store`, confirm the grid renders products.
- Apply a genre filter, confirm the URL param updates and results narrow.
- Apply a condition filter, confirm results narrow.
- Combine genre + condition + sort, confirm all three compose correctly.
- Zero-match filter combo — confirm a sane empty state (currently a gap;
  write this spec once the empty-state UI itself is built).
- Pagination — page 2 shows different products; `page=0` or past-the-end
  doesn't break.

## 2. Inline condition selector & PDP — `album-detail.spec.ts`

- On a PLP card, switch condition and confirm the price updates in place
  with no navigation.
- Click into a PDP, confirm gallery, metadata, and variant selector render.
- Switch variant on the PDP, confirm price/stock update.
- Add to cart from the PDP.

## 3. Cart — `cart.spec.ts`

- Add an item, open the drawer, confirm subtotal and quantity.
- Update quantity, confirm subtotal recalculates.
- Remove an item, confirm the empty-cart state.

## 4. Guest checkout, happy path — `checkout.spec.ts`

Highest-stakes flow in the app — most careful spec of the set.

- Add to cart → checkout → address within the 8-state shipping region →
  shipping method → payment → order confirmation page shows order ID,
  items, shipping address, shipping cost, and payment status.
- **Blocked today:** the audit found Stripe isn't actually registered as a
  payment provider (`medusa-config.ts` has no `@medusajs/payment` module;
  only `pp_system_default` is available). This spec can exercise the flow
  up through order placement, but can't assert a real Stripe test-card
  charge until that gap is closed.

## 5. Shipping region restriction — `checkout-shipping-restriction.spec.ts`

- Address outside CA/OR/WA/NV/AZ/CO/UT/NM — confirm no shipping option is
  offered and checkout can't complete.
- Address inside the region — confirm the flat-rate option appears.

## 6. Restock notify — `notify-me.spec.ts`

- On an out-of-stock variant's PDP, submit the "Notify Me" email form.
- Confirm success feedback.
- No verification-link step to test — the shipped design is single-step
  subscribe, not the double opt-in the PRD originally specified (see
  `vc-prd.md` §7's Design note).

## 7. Responsive & accessibility smoke — `responsive.spec.ts`

- Mobile/tablet/desktop viewports on `/us/store` and a PDP — nav, filter
  drawer, and grid layout hold up at each size.
- Keyboard-only pass through the PLP filters — visible focus states, tab
  order, Enter/Space toggle the controls.

---

## Deliberately not e2e

- Pricing/tax/shipping calculation correctness — backend unit tests
  per `vc-prd.md` §9, not Playwright.
- Restock-notify's cron trigger and email dispatch — backend integration
  test against the workflow directly; Playwright can't easily observe a
  Resend-sent email or a cron firing.
- Actual email content/delivery (order confirmation, restock notify) —
  same reasoning; verify at the workflow/template level instead.

---

## Setup notes

- Specs run against the local dev stack — `playwright.config.ts` already
  points `baseURL` at `http://localhost:8000` with a `pnpm dev` `webServer`
  block, so no additional wiring needed to get a spec running.
- Seed data dependency: several specs assume at least one out-of-stock and
  one in-stock variant per genre. The ETL pipeline already zeroes out
  quantity on a handful of used variants deliberately (`vc-etl-pipeline.md`,
  Transform stage) specifically so the restock-notify flow has something
  to demo against — that same seed data should already satisfy these specs.
