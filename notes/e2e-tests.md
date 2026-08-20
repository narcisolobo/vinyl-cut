# End-to-End Tests

Playwright specs for `apps/storefront/e2e/`, building on the
`homepage.spec.ts` smoke test. All seven specs below are implemented and
passing across chromium/firefox/webkit. Organized by user journey, in
rough priority order (read-only/low-stakes first, checkout last — same
sequencing logic as `vc-storefront-rebuild-sequence.md`) — that was also
roughly the implementation order, so later specs' notes sometimes point
back at conventions/gotchas established by earlier ones.

Companion to `vc-prd.md` §9's testing strategy, which scopes in
end-to-end coverage of these journeys via Playwright, alongside unit tests
(pricing/tax/shipping helpers) and integration tests (checkout,
restock-notify workflow). The boundary is golden-path-per-journey, not
exhaustive UI coverage — see the specs below for what that means in
practice.

---

## Existing coverage

- `e2e/homepage.spec.ts` — smoke test only (confirms `body` renders).
- Items 1–7 below — all implemented. Each section notes anything that
  turned out different from the original plan once actually built.

---

## 1. Catalog browsing & filtering — `store.spec.ts` — done

- Visit `/us/store`, confirm the grid renders products.
- Apply a genre filter, confirm the URL param updates and results narrow.
- Apply a condition filter, confirm results narrow.
- Combine genre + condition + sort, confirm all three compose correctly.
- Zero-match filter combo (`genre=World` + `condition=Mint (M)`,
  live-verified zero-match against the seed data) — confirms the empty
  state. The "currently a gap" note this bullet used to carry was stale by
  the time this spec was written — the empty-state UI already existed.
- Pagination — page 2 shows different products; `page=0` or past-the-end
  doesn't break.

## 2. Inline condition selector & PDP — `album-detail.spec.ts` — done

- On a PLP card, switch condition and confirm the price updates in place
  with no navigation.
- Click into a PDP, confirm gallery, metadata, and variant selector render.
- Switch variant on the PDP, confirm price/stock update.
- Add to cart from the PDP.

## 3. Cart — `cart.spec.ts` — done

- Add an item, open the drawer, confirm subtotal and quantity.
- Update quantity, confirm subtotal recalculates.
- Remove an item, confirm the empty-cart state.

## 4. Guest checkout, happy path — `checkout.spec.ts` — done

Highest-stakes flow in the app — most careful spec of the set.

- Add to cart → checkout → address within the 8-state shipping region →
  shipping method → payment → order confirmation page shows order ID,
  items, shipping address, shipping cost, and payment status.
- Exercises real Stripe test-mode charges end to end (success
  `4242 4242 4242 4242` and decline `4000 0000 0000 0002`) through to
  order confirmation. Stripe's Payment Element renders in a cross-origin
  iframe — the trickiest interaction in this suite; see the spec file's
  comments for the frame-selector/field-id specifics, none of which were
  obvious on the first attempt.
- A successful run permanently decrements real inventory and creates a
  persisted order in the local dev database — this spec deliberately uses
  a high-stock fixture, not the low-stock ones the rest of the suite
  shares (see Setup notes below).

## 5. Shipping region restriction — `checkout-shipping-restriction.spec.ts` — done

- The "no shipping option is offered" framing this bullet originally had
  turned out to describe an unreachable state: the address form's
  province `<select>` only ever offers the 8 in-region states, and the
  server-side validation also rejects anything else before the cart's
  shipping address is ever persisted — so an out-of-region shopper can
  never even reach the delivery step, empty or otherwise. The spec tests
  the restriction at its real, always-reachable enforcement point instead:
  confirming the province select's options are exactly
  `{ca, or, wa, nv, az, co, ut, nm}`, nothing else selectable.
- Address inside the region — confirm the flat-rate option appears.

## 6. Restock notify — `notify-me.spec.ts` — done

- On an out-of-stock variant's PDP, submit the "Notify Me" email form.
- Confirm success feedback.
- No verification-link step to test — the shipped design is single-step
  subscribe, not the double opt-in the PRD originally specified (see
  `vc-prd.md` §7's Design note).

## 7. Responsive & accessibility smoke — `responsive.spec.ts` — done

- Mobile/tablet/desktop viewports on `/us/store` and a PDP — nav, filter
  drawer, and grid layout hold up at each size.
- Keyboard-only pass through the PLP filters, both the desktop dropdown
  and mobile drawer paths — visible focus states, tab order, Enter/Space
  toggle the controls.
- Writing this spec surfaced two real accessibility bugs, both fixed ahead
  of the spec landing (not by the spec itself): a ~768–1023px nav dead
  zone where neither the hamburger nor the desktop links were visible
  (a `DrawerTrigger.tsx` breakpoint mismatch), and the mobile filter
  drawer being entirely unreachable via keyboard (its trigger/overlay/close
  controls were `<label>`s, not `<button>`s — not in the native tab
  order). See the storefront's git history for both fixes.
- WebKit's keyboard-only tests are skipped by design, not a gap: Safari
  excludes buttons/checkboxes/radios from the default Tab order without
  macOS's Full Keyboard Access (off by default for virtually all users) —
  genuine platform behavior, confirmed empirically, not something this app
  or test can change.

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
- `checkout.spec.ts`'s happy-path test completes a real order on every
  green run, permanently decrementing its fixture variant's stock (chosen
  with headroom — 14 units at the time it was picked). If it ever depletes,
  the fix is picking a fresh high-stock fixture the same way (query
  `/store/products` for a variant with a large `inventory_quantity`), not
  reseeding the database to paper over it.
