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

- [x] Update `LICENSE` — it still carries `Copyright (c) 2022 Medusa`,
      inherited from the `medusa-next` starter this project bootstrapped
      from (apps/backend and the storefront's original scaffold).

      Now that the root README is written for a portfolio audience
          (clients/employers), a license file crediting Medusa rather than the
          actual author reads as an oversight if anyone checks. Decide on
          copyright holder/year and license terms, then update the file
          accordingly.

- [x] Set `metadataBase` in the storefront's root metadata config — it's
      not set anywhere in the app, and `next start` logs a warning about it
      on every boot.

      Without it, relative OG/Twitter image URLs resolve against
          `http://localhost:3000` by default (Next's fallback), so once the
          site is deployed off `localhost` the `og:image` tags will still
          point at a local URL instead of the real deployed domain. Set it to
          the production URL (`https://vinylcut.narcisolobo.com`, per the
          `openGraph.url` values already hardcoded across the page metadata)
          in `apps/storefront/src/app/layout.tsx`.

- [ ] Update the copy in `UsedAndRareMockup`
      (apps/storefront/src/views/landing-page/sections/used-and-rare/UsedAndRareMockup.tsx).

      Step 2 ("Confirm it's you" / "One click on the link we send over")
          describes an email-verification-token flow that doesn't exist --
          the actual restock-notify implementation is a cron-poll design with
          no verification step, by design (an accepted simplification, not a
          gap). The mockup's copy needs to match what the feature actually
          does instead of implying a confirmation link.

- [ ] Clean up the orphaned "Default Sales Channel" on the hosted
      backend (`sc_01M0HDKMBCVNSX584FDT84C0V0`) and its original
      publishable key ("Default Publishable API Key" was actually the
      one on the *real* channel, `sc_01M0HDKJ1E5WDMB7TAZKZ84YF0` --
      the orphan is a second, empty one).

      Leftover from the hosted bootstrap creating two identically-named
          sales channels (root-caused while fixing the empty-storefront
          and every-album-out-of-stock bugs -- the storefront's
          publishable key and the warehouse stock location were both
          initially linked to the empty orphan instead of the real
          channel). Harmless as-is since nothing points at it anymore,
          but worth deleting so the Admin UI's Sales Channels list isn't
          confusing to a future reader.

- [ ] Add an empty-state to `ShippingMethodForm`
      (apps/storefront/src/views/checkout/ShippingMethodForm.tsx) for
      when `shippingOptions` comes back empty -- currently just an
      infinite spinner with no error shown.

      Not reachable through the real checkout form today -- the state
          `<select>` in `AddressForm.tsx` only ever offers the 8
          `WESTERN_US_STATES` options, so a customer can't submit an
          out-of-region address that would produce zero shipping
          options. Still a latent gap for anything that bypasses the
          dropdown (devtools, a scripted request, stale browser
          autofill), and the failure mode (silent hang) is worse than
          a bug that's merely inconvenient -- worth a defensive fix
          when touching this component next, not urgent otherwise.
