"use client";

import { setShippingMethod } from "@/lib/data/checkout";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format-price";
import { HttpTypes } from "@medusajs/types";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type ShippingMethodFormProps = {
  cart: HttpTypes.StoreCart;
  shippingOptions: HttpTypes.StoreCartShippingOption[];
};

function ShippingMethodForm({ cart, shippingOptions }: ShippingMethodFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedId, setSelectedId] = useState(
    () => cart.shipping_methods?.at(-1)?.shipping_option_id ?? "",
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(optionId: string) {
    setSelectedId(optionId);
    setIsUpdating(true);
    setError(null);

    try {
      await setShippingMethod({ cartId: cart.id, shippingMethodId: optionId });
      router.push(`${pathname}?step=payment`);
    } catch (err) {
      console.error(
        "ShippingMethodForm.tsx: Failed to set shipping method.",
        err,
      );
      setError(err instanceof Error ? err.message : String(err));
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Delivery method" className="flex flex-col gap-2">
        {shippingOptions.map((option) => (
          <label
            key={option.id}
            className={cn(
              "border-base-300 rounded-box flex cursor-pointer items-center justify-between gap-4 border p-4",
              selectedId === option.id && "border-accent",
            )}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping_option"
                className="radio"
                checked={selectedId === option.id}
                disabled={isUpdating}
                onChange={() => handleSelect(option.id)}
              />
              {option.name}
            </span>
            <span className="font-semibold">
              {formatPrice({
                amount: option.amount,
                currencyCode: cart.currency_code,
              })}
            </span>
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

export default ShippingMethodForm;
