"use server";

import { medusa } from "@/lib/medusa/config";
import { medusaError } from "@/lib/utils/medusa-error";
import { HttpTypes } from "@medusajs/types";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCacheOptions, getCacheTag, getCartId, setCartId } from "./cookies";
import { getRegion } from "./regions";

const DEFAULT_CART_FIELDS =
  "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, +shipping_methods.name";

/**
 * Adds per-variant stock levels on top of `DEFAULT_CART_FIELDS`, for
 * the cart page's quantity stepper to cap increments at real
 * available inventory. Not part of the default fields since no other
 * cart-fetching site (nav dropdown, layout) needs this extra query
 * depth.
 */
const CART_FIELDS_WITH_INVENTORY = `${DEFAULT_CART_FIELDS}, +items.variant.inventory_items.inventory.location_levels.available_quantity`;

/**
 * Adds shipping-method pricing and payment-session data on top of
 * `DEFAULT_CART_FIELDS`, for checkout's step-completion checks and
 * price display. Not part of the default fields since no other
 * cart-fetching site needs this extra query depth.
 */
const CHECKOUT_CART_FIELDS = `${DEFAULT_CART_FIELDS}, +shipping_methods.amount, *payment_collection.payment_sessions`;

/**
 * Retrieves a cart by ID, falling back to the cart ID cookie when
 * none is given. Soft-fails to `null` on a missing ID or a failed
 * fetch — callers like `getOrSetCart` already treat "no cart" as
 * routine and create one, so there's no page-breaking case that
 * needs a hard throw here.
 */
async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || (await getCartId());
  fields ??= DEFAULT_CART_FIELDS;

  if (!id) {
    return null;
  }

  const next = {
    ...(await getCacheOptions("carts")),
  };

  try {
    const { cart } = await medusa.client.fetch<HttpTypes.StoreCartResponse>(
      `/store/carts/${id}`,
      {
        method: "GET",
        query: {
          fields,
        },
        next,
        cache: "force-cache",
      },
    );
    return cart;
  } catch (error) {
    console.error("cart.ts: Failed to retrieve cart.", error);
    return null;
  }
}

/**
 * Same as `retrieveCart()`, but also fetches per-variant stock levels
 * for the cart page's quantity stepper to cap increments at real
 * available inventory.
 */
async function retrieveCartWithInventory() {
  return retrieveCart(undefined, CART_FIELDS_WITH_INVENTORY);
}

/**
 * Retrieves the current cart from the cart ID cookie, creating one
 * for the resolved region if none exists. If a cart already exists
 * but was created under a different region than `countryCode`
 * resolves to (e.g. the shopper switched regions), its region is
 * updated in place rather than replaced with a new cart.
 */
async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode);

  if (!region) {
    throw new Error(
      `cart.ts: Region not found for country code "${countryCode}".`,
    );
  }

  let cart = await retrieveCart(undefined, "id,region_id");

  try {
    if (!cart) {
      const { cart: newCart } = await medusa.store.cart.create({
        region_id: region.id,
      });
      cart = newCart;

      await setCartId(cart.id);

      const cartCacheTag = await getCacheTag("carts");
      updateTag(cartCacheTag);
    }

    if (cart && cart.region_id !== region.id) {
      await medusa.store.cart.update(cart.id, { region_id: region.id });
      const cartCacheTag = await getCacheTag("carts");
      updateTag(cartCacheTag);
    }
  } catch (error) {
    medusaError(error);
  }

  return cart;
}

/**
 * Updates the cart and also invalidates the fulfillment cache tag,
 * since cart mutations (region, address, etc.) can change which
 * shipping options are available.
 */
async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId();

  if (!cartId) {
    throw new Error(
      "cart.ts: No existing cart found; create one before updating.",
    );
  }

  try {
    const { cart } = await medusa.store.cart.update(cartId, data);

    const cartCacheTag = await getCacheTag("carts");
    updateTag(cartCacheTag);

    const fulfillmentCacheTag = await getCacheTag("fulfillment");
    updateTag(fulfillmentCacheTag);

    return cart;
  } catch (error) {
    medusaError(error);
  }
}

type AddToCartParams = {
  variantId: string;
  quantity: number;
  countryCode: string;
};

/**
 * Adds a line item to the cart, creating a cart for the given region
 * first if one doesn't exist yet (see `getOrSetCart`). Also
 * invalidates the fulfillment cache tag, since adding an item can
 * change which shipping options are available.
 */
async function addToCart({
  variantId,
  quantity,
  countryCode,
}: AddToCartParams) {
  if (!variantId) {
    throw new Error("cart.ts: Missing variant ID when adding to cart.");
  }

  const cart = await getOrSetCart(countryCode);

  try {
    await medusa.store.cart.createLineItem(cart.id, {
      variant_id: variantId,
      quantity,
    });

    const cartCacheTag = await getCacheTag("carts");
    updateTag(cartCacheTag);

    const fulfillmentCacheTag = await getCacheTag("fulfillment");
    updateTag(fulfillmentCacheTag);
  } catch (error) {
    medusaError(error);
  }
}

type UpdateLineItemParams = {
  lineId: string;
  quantity: number;
};

/**
 * Updates a line item's quantity and also invalidates the
 * fulfillment cache tag, since a quantity change can affect
 * available shipping options.
 */
async function updateLineItem({ lineId, quantity }: UpdateLineItemParams) {
  if (!lineId) {
    throw new Error("cart.ts: Missing line item ID when updating line item.");
  }

  const cartId = await getCartId();

  if (!cartId) {
    throw new Error("cart.ts: Missing cart ID when updating line item.");
  }

  try {
    await medusa.store.cart.updateLineItem(cartId, lineId, { quantity });

    const cartCacheTag = await getCacheTag("carts");
    updateTag(cartCacheTag);

    const fulfillmentCacheTag = await getCacheTag("fulfillment");
    updateTag(fulfillmentCacheTag);
  } catch (error) {
    medusaError(error);
  }
}

/**
 * Deletes a line item and also invalidates the fulfillment cache
 * tag, since removing an item can affect available shipping options.
 */
async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("cart.ts: Missing line item ID when deleting line item.");
  }

  const cartId = await getCartId();

  if (!cartId) {
    throw new Error("cart.ts: Missing cart ID when deleting line item.");
  }

  try {
    await medusa.store.cart.deleteLineItem(cartId, lineId);

    const cartCacheTag = await getCacheTag("carts");
    updateTag(cartCacheTag);

    const fulfillmentCacheTag = await getCacheTag("fulfillment");
    updateTag(fulfillmentCacheTag);
  } catch (error) {
    medusaError(error);
  }
}

/**
 * Switches the active region for a country code, updating the
 * cart's region only if a cart already exists — no cart is created
 * as a side effect. Also invalidates the products cache tag, since
 * a region change can affect pricing and availability, then
 * redirects to the same path under the new country code.
 */
async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId();
  const region = await getRegion(countryCode);

  if (!region) {
    throw new Error(
      `cart.ts: Region not found for country code "${countryCode}".`,
    );
  }

  if (cartId) {
    await updateCart({ region_id: region.id });
  }

  const regionCacheTag = await getCacheTag("regions");
  updateTag(regionCacheTag);

  const productsCacheTag = await getCacheTag("products");
  updateTag(productsCacheTag);

  redirect(`/${countryCode}${currentPath}`);
}

export {
  retrieveCart,
  retrieveCartWithInventory,
  getOrSetCart,
  updateCart,
  addToCart,
  updateLineItem,
  deleteLineItem,
  updateRegion,
  CHECKOUT_CART_FIELDS,
};
