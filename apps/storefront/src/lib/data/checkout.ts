"use server";

import { medusa } from "@/lib/medusa/config";
import { medusaError } from "@/lib/utils/medusa-error";
import { HttpTypes } from "@medusajs/types";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
} from "./cookies";
import { updateCart } from "./cart";
import {
  SetSharedAddressSchema,
  SetAddressesSchema,
  toFieldErrors,
  type SetAddressesState,
} from "./checkout-address";

async function setAddresses(
  currentState: unknown,
  formData: FormData,
): Promise<SetAddressesState> {
  let countryCode: string;

  try {
    if (!formData) {
      throw new Error("checkout.ts: No form data found when setting addresses.");
    }

    const cartId = await getCartId();
    if (!cartId) {
      throw new Error(
        "checkout.ts: No existing cart found when setting addresses.",
      );
    }

    const field = (name: string) => String(formData.get(name) ?? "");
    const sameAsBilling = formData.get("same_as_billing") === "on";

    const rawShippingAddress = {
      first_name: field("shipping_address.first_name"),
      last_name: field("shipping_address.last_name"),
      address_1: field("shipping_address.address_1"),
      address_2: field("shipping_address.address_2"),
      company: field("shipping_address.company"),
      postal_code: field("shipping_address.postal_code"),
      city: field("shipping_address.city"),
      country_code: field("shipping_address.country_code"),
      province: field("shipping_address.province"),
      phone: field("shipping_address.phone"),
    };

    let data: HttpTypes.StoreUpdateCart;

    if (sameAsBilling) {
      const result = SetSharedAddressSchema.safeParse({
        email: field("email"),
        shipping_address: rawShippingAddress,
      });

      if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error), formError: null };
      }

      countryCode = result.data.shipping_address.country_code;
      data = {
        email: result.data.email,
        shipping_address: result.data.shipping_address,
        billing_address: result.data.shipping_address,
      };
    } else {
      const result = SetAddressesSchema.safeParse({
        email: field("email"),
        shipping_address: rawShippingAddress,
        billing_address: {
          first_name: field("billing_address.first_name"),
          last_name: field("billing_address.last_name"),
          address_1: field("billing_address.address_1"),
          address_2: field("billing_address.address_2"),
          company: field("billing_address.company"),
          postal_code: field("billing_address.postal_code"),
          city: field("billing_address.city"),
          country_code: field("billing_address.country_code"),
          province: field("billing_address.province"),
          phone: field("billing_address.phone"),
        },
      });

      if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error), formError: null };
      }

      countryCode = result.data.shipping_address.country_code;
      data = result.data;
    }

    await updateCart(data);
  } catch (e) {
    return {
      fieldErrors: {},
      formError: e instanceof Error ? e.message : String(e),
    };
  }

  redirect(`/${countryCode}/checkout?step=delivery`);
}

type ShippingOptionsResponse = {
  shipping_options: HttpTypes.StoreCartShippingOption[];
};

/**
 * Lists the shipping options available for the current cart. Tagged
 * under `"fulfillment"`, not a dedicated tag — that's the tag
 * `updateCart()`/`addToCart()`/etc. already invalidate on any
 * mutation that can change availability (address, items, region), so
 * reusing it means this cache is actually kept fresh instead of
 * going stale with no invalidation path of its own.
 */
async function listShippingOptions() {
  const cartId = await getCartId();
  const next = {
    ...(await getCacheOptions("fulfillment")),
  };

  try {
    return await medusa.client.fetch<ShippingOptionsResponse>(
      "/store/shipping-options",
      {
        query: { cart_id: cartId },
        next,
        cache: "force-cache",
      },
    );
  } catch (error) {
    throw new Error("checkout.ts: Failed to fetch shipping options.", {
      cause: error,
    });
  }
}

type SetShippingMethodParams = {
  cartId: string;
  shippingMethodId: string;
};

/**
 * Assigns a shipping method to the cart.
 */
async function setShippingMethod({
  cartId,
  shippingMethodId,
}: SetShippingMethodParams) {
  if (!cartId) {
    throw new Error(
      "checkout.ts: Missing cart ID when setting shipping method.",
    );
  }

  if (!shippingMethodId) {
    throw new Error(
      "checkout.ts: Missing shipping method ID when setting shipping method.",
    );
  }

  try {
    await medusa.store.cart.addShippingMethod(cartId, {
      option_id: shippingMethodId,
    });

    const cartCacheTag = await getCacheTag("carts");
    updateTag(cartCacheTag);
  } catch (error) {
    medusaError(error);
  }
}

/**
 * Initiates a payment session for the cart's payment collection.
 * Takes the full cart object, not just its ID, because Medusa's
 * payment SDK method requires it directly.
 */
async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession,
) {
  try {
    const resp = await medusa.store.payment.initiatePaymentSession(
      cart,
      data,
    );

    const cartCacheTag = await getCacheTag("carts");
    updateTag(cartCacheTag);

    return resp;
  } catch (error) {
    medusaError(error);
  }
}

/**
 * Completes a cart, redirecting to the order confirmation page on
 * success. Medusa's complete-cart endpoint doesn't throw when
 * completion fails (e.g. a payment or inventory issue) — it resolves
 * with `type: "cart"` instead of `"order"`, so failure is detected by
 * checking the response rather than by catching an error.
 */
async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId());

  if (!id) {
    throw new Error(
      "checkout.ts: No existing cart found when placing an order.",
    );
  }

  let cartRes: HttpTypes.StoreCompleteCartResponse;

  try {
    cartRes = await medusa.store.cart.complete(id);

    const cartCacheTag = await getCacheTag("carts");
    updateTag(cartCacheTag);
  } catch (error) {
    medusaError(error);
  }

  if (cartRes.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase();

    const orderCacheTag = await getCacheTag("orders");
    updateTag(orderCacheTag);

    removeCartId();
    redirect(`/${countryCode}/order/${cartRes.order.id}/confirmed`);
  }

  return cartRes.cart;
}

export {
  setAddresses,
  listShippingOptions,
  setShippingMethod,
  initiatePaymentSession,
  placeOrder,
};
