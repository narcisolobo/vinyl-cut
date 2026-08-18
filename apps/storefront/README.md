# @vc/storefront

The Vinyl Cut's customer-facing storefront — a Next.js 16 (App Router,
Turbopack in dev) app talking to the `@vc/backend` Medusa instance via
`@medusajs/js-sdk`. See the [root README](../../README.md) for the
monorepo-wide setup (local infra, ETL seeding, session management) and
[`notes/vc-prd.md`](../../notes/vc-prd.md) for the product spec this app
implements.

Not a fork of Medusa's `medusa-next` starter — built from scratch with the
starter open as a reference, on Tailwind CSS v4 + daisyUI rather than the
starter's Medusa UI preset. See
[`notes/vc-storefront-rebuild-sequence.md`](../../notes/vc-storefront-rebuild-sequence.md)
for the build sequence and the reasoning behind it.

## What's here

- **Catalog** (`src/app/[country-code]/(main)/store`, `src/app/.../albums`,
  `src/views/store/`) — product listing with genre/era/condition filters
  and sort, an inline condition selector that swaps price without leaving
  the grid, and product detail pages.
- **Cart & checkout** (`src/app/[country-code]/(checkout)`,
  `src/views/checkout/`, `src/lib/data/cart.ts`, `checkout.ts`,
  `checkout-address.ts`, `payment.ts`) — persistent cart, guest checkout,
  order confirmation.
- **Restock notify** — the storefront half of the project's flagship
  feature: an email-only "Notify Me" form on out-of-stock variants
  (`src/lib/data/restock-subscriptions.ts`, `restock-subscription-schema.ts`),
  posting to the backend's `/store/restock-subscriptions` route.
- **`/api/revalidate`** (`src/app/api/revalidate/route.ts`) — the backend
  calls this after checkout and after inventory updates to invalidate the
  `products` cache tag, keyed by `REVALIDATE_SECRET`.
- **Marketing/support pages** — home, sell-your-records, shipping &
  returns, contact (`src/views/landing-page`, `sell-your-records`,
  `shipping-and-returns`, `contact-us`).

## Getting Started

This app expects the Medusa backend already running (see the root
README's Getting Started) and its own `.env.local`:

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_DEFAULT_REGION=us
NEXT_PUBLIC_BASE_URL=http://localhost:8000
REVALIDATE_SECRET=
```

`REVALIDATE_SECRET` must match the backend's value of the same name —
that's what authorizes the backend's calls to `/api/revalidate`. There's
no tracked `.env.example` for this app yet; the list above is everything
currently read.

```bash
pnpm dev
```

Runs on port 8000 (`next dev -p 8000`) rather than Next's default 3000, to
stay clear of Medusa's port 9000 and leave 3000 free.

## Scripts

| Script          | Description                                          |
| ---------------- | ----------------------------------------------------- |
| `dev`            | `next dev -p 8000`                                    |
| `build`          | `next build`                                          |
| `start`          | `next start`                                          |
| `lint`           | `eslint`                                              |
| `analyze`        | `ANALYZE=true next build` — bundle analysis           |
| `test`           | `vitest run` — unit tests                             |
| `test:watch`     | `vitest` — unit tests in watch mode                   |
| `test:coverage`  | `vitest run --coverage`                               |
| `test:e2e`       | `playwright test`                                     |
| `test:e2e:ui`    | `playwright test --ui`                                |
| `revalidate`     | POST the dev server's `/api/revalidate?tag=products`  |

## Testing

Two layers, deliberately scoped rather than exhaustive — see Non-Functional
Requirements in `notes/vc-prd.md`:

- **Unit** (`vitest`, `src/lib/data/*.test.ts`) — pure data-layer logic:
  product filter/sort param handling, cart/checkout/payment helpers,
  restock-subscription validation, cookie handling. Run with `pnpm test`
  (or `pnpm test:watch` while iterating, `pnpm test:coverage` for a
  coverage report).
- **End-to-end** (`playwright`, `e2e/`) — currently one smoke test
  (`homepage.spec.ts`: the homepage loads and renders). The full
  per-journey plan (catalog browsing/filtering, PDP, cart, guest checkout,
  shipping-region restriction, restock-notify signup) is written up but not
  yet built — see [`notes/e2e-tests.md`](../../notes/e2e-tests.md) for the
  spec list. Run with `pnpm test:e2e` (`pnpm test:e2e:ui` for Playwright's
  UI mode); this starts its own dev server per `playwright.config.ts`, so
  the app doesn't need to already be running.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Medusa JS SDK](https://docs.medusajs.com/resources/js-sdk)
- [daisyUI](https://daisyui.com/)
