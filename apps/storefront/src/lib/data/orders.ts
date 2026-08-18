"use server";

import { medusa } from "@/lib/medusa/config";
import { type HttpTypes } from "@medusajs/types";
import { getCacheOptions } from "./cookies";

const ORDER_FIELDS =
  "*items,*items.variant,*items.product,*payment_collections.payments,*shipping_address,*billing_address,*shipping_methods";

/**
 * Fetches a placed order by ID, for the order-confirmation page.
 * Throws — rather than failing soft — since its only caller already
 * wraps it in a try/catch that renders a 404 on failure.
 */
async function retrieveOrder(id: string): Promise<HttpTypes.StoreOrder> {
  if (!id) {
    throw new Error("orders.ts: Missing order ID when retrieving order.");
  }

  const next = {
    ...(await getCacheOptions("orders")),
  };

  try {
    const { order } = await medusa.client.fetch<HttpTypes.StoreOrderResponse>(
      `/store/orders/${id}`,
      {
        method: "GET",
        query: { fields: ORDER_FIELDS },
        next,
        cache: "force-cache",
      },
    );

    return order;
  } catch (error) {
    throw new Error(`orders.ts: Failed to retrieve order "${id}".`, {
      cause: error,
    });
  }
}

export { retrieveOrder };
