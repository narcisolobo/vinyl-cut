"use client";

import { setShippingMethod } from "@/lib/data/checkout";
import { HttpTypes } from "@medusajs/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ShippingMethodFormProps = {
  cart: HttpTypes.StoreCart;
  shippingOptions: HttpTypes.StoreCartShippingOption[];
};

function ShippingMethodForm({
  cart,
  shippingOptions,
}: ShippingMethodFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasRequestedMethod = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [option] = shippingOptions;

  useEffect(() => {
    if (!option || hasRequestedMethod.current) {
      return;
    }

    hasRequestedMethod.current = true;

    setShippingMethod({ cartId: cart.id, shippingMethodId: option.id })
      .then(() => router.push(`${pathname}?step=payment`))
      .catch((err) => {
        console.error(
          "ShippingMethodForm.tsx: Failed to set shipping method.",
          err,
        );
        setError(err instanceof Error ? err.message : String(err));
        hasRequestedMethod.current = false;
      });
  }, [cart, option, pathname, router]);

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  return <span className="loading loading-spinner" />;
}

export default ShippingMethodForm;
