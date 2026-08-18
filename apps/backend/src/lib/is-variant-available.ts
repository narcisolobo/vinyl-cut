/**
 * A variant counts as available once its stock is a positive number.
 * `getVariantAvailability` can return `null` or omit a variant entirely
 * (no inventory records yet), which the `|| 0` fallback treats as zero
 * stock rather than `null > 0`/`undefined > 0` silently evaluating to
 * `false` by luck.
 */
function isVariantAvailable(availability: number | null | undefined): boolean {
  return (availability || 0) > 0;
}

export { isVariantAvailable };
