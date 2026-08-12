import { HttpTypes } from "@medusajs/types";
import CheckoutForm from "./CheckoutForm";
import CheckoutSummary from "./CheckoutSummary";
import { type CheckoutStep } from "./types";

type CheckoutProps = {
  cart: HttpTypes.StoreCart;
  shippingOptions: HttpTypes.StoreCartShippingOption[];
  paymentProviders: HttpTypes.StorePaymentProvider[];
  step: CheckoutStep;
};

function Checkout({ cart, shippingOptions, paymentProviders, step }: CheckoutProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[1fr_320px]">
      <CheckoutForm
        cart={cart}
        shippingOptions={shippingOptions}
        paymentProviders={paymentProviders}
        step={step}
      />
      <CheckoutSummary cart={cart} />
    </div>
  );
}

export default Checkout;
