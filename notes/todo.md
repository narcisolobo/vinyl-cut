# TODO

- [x] Add an `inventory-level-updated` subscriber (apps/backend/src/subscribers/)
      that calls the storefront's `/api/revalidate?tag=products` (see
      apps/backend/src/workflows/steps/revalidate-products.ts), the same way
      `send-order-confirmation`'s workflow does on `order.placed`.

      Right now the storefront's `products` cache only gets invalidated when
      an order is placed. An admin manually adjusting inventory (zeroing out
      stock, restocking, corrections) doesn't trigger any revalidation, so
      the PDP can keep showing stale Add to Cart / Notify Me state until the
      next order touches that product.

- [x] Fix cents-to-dollars conversion in the order confirmation email
      (apps/backend/src/modules/resend/emails/order-placed.tsx, `formatPrice`,
      lines 46-56).

      It calls `Intl.NumberFormat` directly on the raw amount with no
      `/100`, unlike apps/storefront/src/lib/utils/format-price.ts, which
      divides by 100 — this project stores prices in cents throughout (see
      that file's docstring, confirmed against `calculated_price.calculated_amount`
      and the ETL's `price_cents`). Result: a real order showed shipping as
      $695.00 instead of $6.95 and a $11.75 item as $1,175.00. The mock
      order fixture further down the same file (`mockOrder`, used only for
      react-email's preview server) also uses dollar-scale example values
      instead of cents — worth fixing alongside so the preview doesn't
      mislead the same way.

- [ ] Update `LICENSE` — it still carries `Copyright (c) 2022 Medusa`,
      inherited from the `medusa-next` starter this project bootstrapped
      from (apps/backend and the storefront's original scaffold).

      Now that the root README is written for a portfolio audience
      (clients/employers), a license file crediting Medusa rather than the
      actual author reads as an oversight if anyone checks. Decide on
      copyright holder/year and license terms, then update the file
      accordingly.

- [ ] Set `metadataBase` in the storefront's root metadata config — it's
      not set anywhere in the app, and `next start` logs a warning about it
      on every boot.

      Without it, relative OG/Twitter image URLs resolve against
      `http://localhost:3000` by default (Next's fallback), so once the
      site is deployed off `localhost` the `og:image` tags will still
      point at a local URL instead of the real deployed domain. Set it to
      the production URL (`https://vinylcut.narcisolobo.com`, per the
      `openGraph.url` values already hardcoded across the page metadata)
      in `apps/storefront/src/app/layout.tsx`.
