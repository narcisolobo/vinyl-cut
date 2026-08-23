"use server";

import { medusa } from "@/lib/medusa/config";
import { type HttpTypes } from "@medusajs/types";

/**
 * Fetches the payment providers enabled for a region, sorted by ID
 * for a stable render order. Throws — rather than failing soft —
 * since the payment step needs real provider data to render.
 *
 * Uncached (`no-store`), unlike most of this app's reads: this list
 * is only fetched on the low-traffic checkout page, and which
 * provider is live is exactly the kind of thing that must never be
 * stale — a cached, since-removed provider silently breaks Payment
 * for every visitor until someone thinks to bust the cache by hand.
 */
async function listPaymentProviders(
  regionId: string,
): Promise<HttpTypes.StorePaymentProvider[]> {
  if (!regionId) {
    throw new Error(
      "payment.ts: Missing region ID when listing payment providers.",
    );
  }

  try {
    const { payment_providers } =
      await medusa.client.fetch<HttpTypes.StorePaymentProviderListResponse>(
        "/store/payment-providers",
        {
          method: "GET",
          query: { region_id: regionId },
          cache: "no-store",
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
