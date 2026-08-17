/**
 * Builds the storefront PDP link for a restock-related email.
 * `STOREFRONT_DEFAULT_COUNTRY_CODE` is hardcoded rather than derived
 * because `restock_subscription` doesn't track which region a shopper
 * browsed from, and this store only serves one region today.
 */
function buildRestockUrl(handle?: string | null): string | undefined {
  if (!handle) {
    return undefined;
  }

  return `${process.env.STOREFRONT_URL}/${process.env.STOREFRONT_DEFAULT_COUNTRY_CODE}/albums/${handle}`;
}

export { buildRestockUrl };
