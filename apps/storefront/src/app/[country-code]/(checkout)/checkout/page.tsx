import { retrieveCheckoutCart } from "@/lib/data/cart";
import { listShippingOptions } from "@/lib/data/checkout";
import { listPaymentProviders } from "@/lib/data/payment";
import Checkout from "@/views/checkout/Checkout";
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
    <div className="mx-auto w-full max-w-5xl p-4">
      <Checkout
        cart={cart}
        shippingOptions={shippingOptions}
        paymentProviders={paymentProviders}
        step={step}
      />
    </div>
  );
}

export { metadata };
export default CheckoutPage;
