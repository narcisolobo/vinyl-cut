import { HttpTypes } from "@medusajs/types";
import { type SortOptions } from "@/types/sort-options";

type PriceSortOptions = Extract<SortOptions, "price-asc" | "price-desc">;

/**
 * Cheapest variant's calculated price, in the currency's smallest
 * unit. Products with no variants sort to the end of `price-asc`.
 */
function getMinPrice(product: HttpTypes.StoreProduct): number {
  if (!product.variants?.length) {
    return Infinity;
  }

  return Math.min(
    ...product.variants.map(
      (variant) => variant.calculated_price?.calculated_amount ?? 0,
    ),
  );
}

/**
 * Sorts client-side. Only for price — `artist-asc`/`latest` sort on
 * plain columns (`subtitle`/`created_at`), so those go through the
 * Store API's `order` param instead of over-fetching and sorting here.
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: PriceSortOptions,
): HttpTypes.StoreProduct[] {
  const sorted = [...products];

  switch (sortBy) {
    case "price-asc":
    case "price-desc": {
      const minPrices = new Map(
        sorted.map((product) => [product.id, getMinPrice(product)]),
      );

      return sorted.sort((a, b) => {
        const diff = minPrices.get(a.id)! - minPrices.get(b.id)!;
        return sortBy === "price-asc" ? diff : -diff;
      });
    }
    default:
      return sortBy satisfies never;
  }
}