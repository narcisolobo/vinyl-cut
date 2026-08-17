# TODO

- [ ] Add an `inventory-level-updated` subscriber (apps/backend/src/subscribers/)
      that calls the storefront's `/api/revalidate?tag=products` (see
      apps/backend/src/workflows/steps/revalidate-products.ts), the same way
      `send-order-confirmation`'s workflow does on `order.placed`.

      Right now the storefront's `products` cache only gets invalidated when
      an order is placed. An admin manually adjusting inventory (zeroing out
      stock, restocking, corrections) doesn't trigger any revalidation, so
      the PDP can keep showing stale Add to Cart / Notify Me state until the
      next order touches that product.
