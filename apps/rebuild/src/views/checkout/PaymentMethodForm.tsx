"use client";

import { initiatePaymentSession } from "@/lib/data/checkout";
import { cn } from "@/lib/utils/cn";
import { HttpTypes } from "@medusajs/types";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { getPaymentProviderLabel } from "./types";

type PaymentMethodFormProps = {
  cart: HttpTypes.StoreCart;
  paymentProviders: HttpTypes.StorePaymentProvider[];
};

function PaymentMethodForm({ cart, paymentProviders }: PaymentMethodFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedId, setSelectedId] = useState(
    () => cart.payment_collection?.payment_sessions?.at(-1)?.provider_id ?? "",
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(providerId: string) {
    setSelectedId(providerId);
    setIsUpdating(true);
    setError(null);

    try {
      await initiatePaymentSession(cart, { provider_id: providerId });
      router.push(`${pathname}?step=review`);
    } catch (err) {
      console.error(
        "PaymentMethodForm.tsx: Failed to initiate payment session.",
        err,
      );
      setError(err instanceof Error ? err.message : String(err));
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label="Payment method"
        className="flex flex-col gap-2"
      >
        {paymentProviders.map((provider) => (
          <label
            key={provider.id}
            className={cn(
              "border-base-300 rounded-box flex cursor-pointer items-center gap-3 border p-4",
              selectedId === provider.id && "border-accent",
            )}
          >
            <input
              type="radio"
              name="payment_provider"
              className="radio"
              checked={selectedId === provider.id}
              disabled={isUpdating}
              onChange={() => handleSelect(provider.id)}
            />
            {getPaymentProviderLabel(provider.id)}
          </label>
        ))}
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodForm;
