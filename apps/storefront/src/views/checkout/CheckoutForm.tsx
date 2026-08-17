import Divider from "@/components/Divider";
import { HttpTypes } from "@medusajs/types";
import AddressStep from "./AddressStep";
import PaymentStep from "./PaymentStep";
import ReviewStep from "./ReviewStep";
import ShippingStep from "./ShippingStep";
import { type CheckoutStep } from "./types";

type CheckoutFormProps = {
  cart: HttpTypes.StoreCart;
  shippingOptions: HttpTypes.StoreCartShippingOption[];
  paymentProviders: HttpTypes.StorePaymentProvider[];
  step: CheckoutStep;
};

function CheckoutForm({
  cart,
  shippingOptions,
  paymentProviders,
  step,
}: CheckoutFormProps) {
  return (
    <div className="flex flex-col gap-8">
      <AddressStep cart={cart} isOpen={step === "address"} />
      <Divider />
      <ShippingStep
        cart={cart}
        shippingOptions={shippingOptions}
        isOpen={step === "delivery"}
      />
      <Divider />
      <PaymentStep
        cart={cart}
        paymentProviders={paymentProviders}
        isOpen={step === "payment"}
      />
      <Divider />
      <ReviewStep cart={cart} isOpen={step === "review"} />
    </div>
  );
}

export default CheckoutForm;
