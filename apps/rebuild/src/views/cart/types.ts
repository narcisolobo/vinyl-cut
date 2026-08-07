import { HttpTypes } from "@medusajs/types";

type CartWithItems = HttpTypes.StoreCart & {
  items: NonNullable<HttpTypes.StoreCart["items"]>;
};

function hasItems(cart?: HttpTypes.StoreCart | null): cart is CartWithItems {
  return Boolean(cart?.items?.length);
}

/**
 * `@medusajs/types` doesn't type `inventory_items` on
 * `StoreProductVariant`, even though the store API returns it when
 * requested (see `retrieveCartWithInventory` in lib/data/cart.ts).
 */
type VariantWithInventory = HttpTypes.StoreProductVariant & {
  inventory_items?: Array<{
    inventory?: {
      location_levels?: Array<{ available_quantity?: number }>;
    };
  }>;
};

/**
 * Total available stock across locations, or `undefined` when
 * there's no cap to enforce — inventory isn't tracked for this
 * variant, or backorders are allowed. Mirrors the storefront
 * starter's `ProductActions.inStock` logic.
 */
function getAvailableQuantity(
  variant?: HttpTypes.StoreProductVariant | null,
): number | undefined {
  if (!variant || !variant.manage_inventory || variant.allow_backorder) {
    return undefined;
  }

  const inventoryItems = (variant as VariantWithInventory).inventory_items ?? [];

  return inventoryItems.reduce((total, item) => {
    const levels = item.inventory?.location_levels ?? [];
    return total + levels.reduce((sum, l) => sum + (l.available_quantity ?? 0), 0);
  }, 0);
}

export { hasItems, getAvailableQuantity };
export type { CartWithItems };
