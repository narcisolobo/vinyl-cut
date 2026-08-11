"use server";

import { medusa } from "@/lib/medusa/config";
import { type HttpTypes } from "@medusajs/types";
import { getCacheOptions } from "./cookies";

/**
 * Fetches the payment providers enabled for a region, sorted by ID
 * for a stable render order. Throws — rather than failing soft —
 * since the payment step needs real provider data to render.
 */
async function listPaymentProviders(
  regionId: string,
): Promise<HttpTypes.StorePaymentProvider[]> {
  if (!regionId) {
    throw new Error(
      "payment.ts: Missing region ID when listing payment providers.",
    );
  }

  const next = {
    ...(await getCacheOptions("payment_providers")),
  };

  try {
    const { payment_providers } =
      await medusa.client.fetch<HttpTypes.StorePaymentProviderListResponse>(
        "/store/payment-providers",
        {
          method: "GET",
          query: { region_id: regionId },
          next,
          cache: "force-cache",
        },
      );

    return payment_providers.sort((a, b) => (a.id > b.id ? 1 : -1));
  } catch (error) {
    throw new Error("payment.ts: Failed to fetch payment providers.", {
      cause: error,
    });
  }
}

export { listPaymentProviders };
