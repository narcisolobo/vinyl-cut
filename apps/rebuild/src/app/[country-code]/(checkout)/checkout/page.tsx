import { retrieveCheckoutCart } from "@/lib/data/cart";
import { listShippingOptions } from "@/lib/data/checkout";
import { listPaymentProviders } from "@/lib/data/payment";
import AddressStep from "@/views/checkout/AddressStep";
import PaymentStep from "@/views/checkout/PaymentStep";
import ReviewStep from "@/views/checkout/ReviewStep";
import ShippingStep from "@/views/checkout/ShippingStep";
import { resolveActiveStep } from "@/views/checkout/types";
import { HttpTypes } from "@medusajs/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const metadata: Metadata = {
  title: "Checkout | The Vinyl Cut",
  robots: { index: false },
};

interface CheckoutPageProps {
  params: Promise<{ "country-code": string }>;
  searchParams: Promise<{ step?: string }>;
}

async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  await params;
  const { step: requestedStep } = await searchParams;

  let cart: HttpTypes.StoreCart | null = null;

  try {
    cart = await retrieveCheckoutCart();
  } catch (error) {
    console.error(error);
    return notFound();
  }

  if (!cart || !cart.items?.length) {
    return notFound();
  }

  if (!cart.region_id) {
    throw new Error("checkout/page.tsx: Cart is missing a region ID.");
  }

  const [{ shipping_options: shippingOptions }, paymentProviders] =
    await Promise.all([
      listShippingOptions(),
      listPaymentProviders(cart.region_id),
    ]);

  const step = resolveActiveStep(requestedStep, cart);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4">
      <AddressStep cart={cart} isOpen={step === "address"} />
      <ShippingStep
        cart={cart}
        shippingOptions={shippingOptions}
        isOpen={step === "delivery"}
      />
      <PaymentStep
        cart={cart}
        paymentProviders={paymentProviders}
        isOpen={step === "payment"}
      />
      <ReviewStep cart={cart} isOpen={step === "review"} />
      {/* Placeholder for CheckoutSummary — Phase 7 replaces this. */}
    </div>
  );
}

export { metadata };
export default CheckoutPage;
