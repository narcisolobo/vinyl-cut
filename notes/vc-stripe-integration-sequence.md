The Vinyl Cut: Stripe Integration Sequence

# The Vinyl Cut: Stripe Integration Sequence

A stepped plan for wiring Stripe into checkout as Medusa's payment
provider (`apps/backend` + `apps/storefront`), embedded Payment Element,
cards only, test mode throughout — this is a portfolio project, no real
payments ever. Follow one step at a time — each step should be verifiably
working before moving to the next, same approach as
`vc-sentry-integration-sequence.md`.

---

## 1. Decide the payment UX

- **Embedded Stripe Payment Element**, not a hosted Checkout Session —
  fits the existing in-page, multi-step checkout UI (address → delivery →
  payment → review, `views/checkout/CheckoutForm.tsx`) rather than
  redirecting off-site.
- **Cards only** for this project — leave `automatic_payment_methods` off;
  simplest to build and to demo with Stripe's published test card numbers.
- **`capture: true`** on the provider config — auto-captures so a
  confirmed payment completes straight to a paid order instead of sitting
  in an "awaiting capture" state that needs a manual Admin action.

## 2. Get Stripe test-mode keys

- Sign up / log in at stripe.com, stay in **test mode** throughout.
- From the Dashboard, grab the test-mode **secret key** (`sk_test_...`)
  and **publishable key** (`pk_test_...`).
- Secret key → backend (`apps/backend/.env`, `STRIPE_API_KEY`).
  Publishable key → storefront (`apps/storefront/.env.local`,
  `NEXT_PUBLIC_STRIPE_KEY`).

## 3. Register Stripe as a Medusa payment provider

In `apps/backend/medusa-config.ts`, under the `payment` module's
providers:

```ts
{
  resolve: "@medusajs/medusa/payment-stripe",
  id: "stripe",
  options: {
    apiKey: process.env.STRIPE_API_KEY,
    capture: true,
  },
}
```

- The package is `@medusajs/medusa/payment-stripe`, bundled inside the
  already-installed `@medusajs/medusa` — no separate install on the
  backend.
- No `webhookSecret` yet — that's step 8, deferred to deploy.
- Restart the backend, confirm `GET /store/payment-providers?region_id=...`
  now lists `pp_stripe_stripe` alongside `pp_system_default`.

## 4. Load Stripe.js in the storefront

- `pnpm add @stripe/stripe-js @stripe/react-stripe-js` in
  `apps/storefront`.
- `src/lib/stripe/config.ts` — `loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)`,
  exported as `stripePromise`. Throw at import time if the env var is
  unset, so a missing key fails loudly at boot instead of silently
  breaking the payment step later.

## 5. Wire the Payment step into checkout

This is the bulk of the work, in `apps/storefront/src/views/checkout/`:

- `PaymentMethodForm.tsx` initiates the payment session on mount
  (`initiatePaymentSession(cart, { provider_id: "stripe", data: { payment_method_types: ["card"] } })`),
  then mounts `<Elements stripe={stripePromise} options={{ clientSecret }}><PaymentElement /></Elements>`
  once the session's `client_secret` comes back (a loading spinner covers
  the gap before that).
  - **Implementation surprise:** the payment-session initiation has to
    live in a `useEffect` inside this client component, not in the
    server-rendered checkout page. Next 16's `updateTag` (used deep in the
    cart-mutation chain) can't be called from a server action invoked as a
    plain function during a Server Component's render — it throws.
    Calling it from a client-triggered effect instead is what actually
    works; confirmed via a real browser reproduction, not just the docs.
- On submit, call `stripe.confirmPayment({ elements, redirect: "if_required" })`
  directly in the browser — no server round-trip needed to confirm a card
  payment.
- On success, set a cart metadata flag (`stripe_payment_confirmed: true`
  via `updateCart`) and advance to the Review step.

## 6. Track payment completion without a webhook

- Stripe's `session.status` stays `"pending"` from initiation straight
  through client-side confirmation locally — there's no webhook wired up
  yet to flip it, so `session.status` alone can't distinguish "just
  initiated" from "card actually confirmed."
- `isPaymentComplete()` (`views/checkout/types.ts`) checks the
  `stripe_payment_confirmed` cart-metadata flag from step 5 instead.
  `resolveActiveStep()` uses this to gate whether Review is reachable at
  all.
- `PlaceOrderButton.tsx` stays provider-agnostic on purpose — by the time
  Review is reachable, Stripe confirmation already happened in the
  Payment step, so `placeOrder()` just completes the cart. No
  Stripe-specific branch needed there.

## 7. Test locally with Stripe's test cards

- Success: `4242 4242 4242 4242`, any future expiry, any CVC.
- Decline: `4000 0000 0000 0002` — confirm the error surfaces in the
  Payment step's UI and the flow does **not** advance to Review.
- The Payment Element also renders a ZIP/postal code field by default for
  US card payments, even with no `fields` config passed — don't skip it,
  or `confirmPayment` rejects client-side with "Your ZIP code is invalid"
  before the request ever reaches the network.
- Exercise both cards end to end at least once — the decline path
  matters just as much as success for a checkout this central to the app.

## 8. Webhook — deferred to the Render deploy

- Not needed locally: `capture: true` plus the client-side
  `confirmPayment` → cart-metadata flow above completes an order without
  any webhook ever firing. Medusa's own docs call `webhookSecret` "only
  useful for deployed Medusa applications."
- Once deployed: add `STRIPE_WEBHOOK_SECRET` to the provider's `options`
  in step 3 and to the Render environment; the webhook route is
  `/hooks/payment/stripe_stripe` (derived from the provider `id: "stripe"`
  set in step 3).
- Point Stripe's Dashboard webhook config at that URL once Render's URL is
  known; confirm events show up as delivered in the Stripe Dashboard after
  a real (test-mode) checkout against the deployed site.
