import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { HttpTypes } from "@medusajs/types";
import { cn } from "@/lib/utils/cn";
import ShippingMethodForm from "./ShippingMethodForm";
import ShippingSummary from "./ShippingSummary";
import { isAddressComplete, isDeliveryComplete } from "./types";

type ShippingStepProps = {
  cart: HttpTypes.StoreCart;
  shippingOptions: HttpTypes.StoreCartShippingOption[];
  isOpen: boolean;
};

function ShippingStep({ cart, shippingOptions, isOpen }: ShippingStepProps) {
  const isComplete = isDeliveryComplete(cart);
  const isLocked = !isAddressComplete(cart);

  return (
    <section className="flex flex-col gap-4">
      <h2
        className={cn(
          "flex items-center gap-2 text-2xl font-semibold",
          isLocked && "pointer-events-none opacity-50 select-none",
        )}
      >
        Delivery
        {isComplete && (
          <CheckCircleIcon className="text-success" weight="fill" />
        )}
      </h2>
      {!isLocked &&
        (isOpen ? (
          <ShippingMethodForm cart={cart} shippingOptions={shippingOptions} />
        ) : (
          <ShippingSummary cart={cart} />
        ))}
    </section>
  );
}

export default ShippingStep;
