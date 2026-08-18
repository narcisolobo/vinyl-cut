type FormatPriceParams = {
  amount: number;
  currencyCode: string;
};

/**
 * Formats a price stored in the currency's smallest unit (cents) as
 * a localized currency string, e.g. `1675` "usd" → "$16.75" — see
 * `etl/tools/load_catalog.py`'s `price_cents`, confirmed live against
 * `calculated_price.calculated_amount`. This store only ever prices
 * in USD, so no zero-decimal-currency handling is needed.
 */
function formatPrice({ amount, currencyCode }: FormatPriceParams): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount / 100);
}

export type { FormatPriceParams };
export { formatPrice };
