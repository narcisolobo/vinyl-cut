import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { HttpTypes } from "@medusajs/types";
import { cn } from "@/lib/utils/cn";
import PaymentMethodForm from "./PaymentMethodForm";
import PaymentSummary from "./PaymentSummary";
import { isAddressComplete, isDeliveryComplete, isPaymentComplete } from "./types";

type PaymentStepProps = {
  cart: HttpTypes.StoreCart;
  paymentProviders: HttpTypes.StorePaymentProvider[];
  isOpen: boolean;
};

function PaymentStep({ cart, paymentProviders, isOpen }: PaymentStepProps) {
  const isComplete = isPaymentComplete(cart);
  const isLocked = !isAddressComplete(cart) || !isDeliveryComplete(cart);

  return (
    <section className="flex flex-col gap-4">
      <h2
        className={cn(
          "flex items-center gap-2 text-2xl font-semibold",
          isLocked && "pointer-events-none opacity-50 select-none",
        )}
      >
        Payment
        {isComplete && (
          <CheckCircleIcon className="text-success" weight="fill" />
        )}
      </h2>
      {!isLocked &&
        (isOpen ? (
          <PaymentMethodForm cart={cart} paymentProviders={paymentProviders} />
        ) : (
          <PaymentSummary cart={cart} />
        ))}
    </section>
  );
}

export default PaymentStep;
