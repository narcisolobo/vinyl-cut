The Vinyl Cut: Storefront Rebuild Sequence

# The Vinyl Cut: Storefront Rebuild Sequence

A reference-assisted rebuild plan for the Next.js storefront — the official Medusa starter stays open in a second VS Code window as a working reference throughout, rather than being reimplemented from documentation alone. The goal is genuine understanding of how Medusa's SDK, data-fetching patterns, and module system work, not just a reskin.

Maps onto Phases 2-4 of `vinyl_cut_prd.html`, broken out in more granular, buildable order.

## Sequencing Logic

Build confidence on read-only, low-stakes pieces first. Save the highest-stakes stateful piece (checkout) for once you're deep in reference-assisted flow. Save the one genuinely original piece (restock-notify) for last, once enough Medusa fluency exists to trust your own judgment on how to structure it without a reference to lean on.

---

## 1\. Foundation

Nothing downstream works without this.

- **Medusa SDK client + environment config** — base client instantiation, publishable API key, base URL. Everything else calls through this.
- **Region & locale resolution** (`[countryCode]` segment, middleware) — read the starter's `middleware.ts` and region-fetching logic closely; this is where the Western-US-only shipping restriction gets enforced at the routing level, not just at checkout.
  - **Deliberate deviation:** the starter's locale-fetching hits a 404 in this project's logs (`/store/locales`). If Vinyl Cut doesn't need multi-locale/i18n support, consciously drop this piece rather than carrying along infrastructure that isn't needed.

## 2\. Layout Shell

Mostly presentational — good place to build early momentum.

- Nav
- Footer
- SideMenu

Exercises `LocalizedClientLink` and region-aware routing repeatedly before it matters more in checkout.

## 3\. Read-Only Catalog (Core MVP)

Moderate complexity, but no writes — mistakes here are cheap.

- **PLP** — listing, genre/era/condition filters, sort.
- **PDP** — variant selector, gallery, metadata. More complex data shape than PLP (variants, options, pricing per variant), but still read-only.

## 4\. Stateful Operations (Core MVP)

Higher stakes — first real writes and first real session-state handling.

- **Cart** — add-to-cart, cart drawer, cart-ID persistence (cookie-based).
- **Checkout (guest)** — address, shipping method, Stripe payment session, order confirmation.
  - Works end-to-end without requiring an account, per the PRD (Customer Account Auth is Nice-to-Have, not Core MVP).
  - Highest-stakes piece in the whole sequence — budget the most time and the most careful reading of the reference here.

## 5\. Flagship — Restock-Notify

No reference to lean on for this one; it's the project's own design.

- Notify-me form on out-of-stock PDP variants.
- Verification email flow.
- Restock-triggered notification, confirmation state.

Depends conceptually on PDP/variant/inventory state (not on cart or checkout), but sequenced last so it's tackled once warmed up from following a working reference through steps 1-4.

## 6\. Nice-to-Haves

Only after Core MVP and the Flagship feature both work end to end.

- Customer account auth
- Discount codes
- Wishlist
- Instant search
- Recommendations
- Spinning record animation
- Goldmine grading scale guide
