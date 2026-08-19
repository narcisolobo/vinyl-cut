"use client";

import { updateCart } from "@/lib/data/cart";
import { initiatePaymentSession } from "@/lib/data/checkout";
import { stripePromise } from "@/lib/stripe/config";
import { HttpTypes } from "@medusajs/types";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { usePathname, useRouter } from "next/navigation";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { STRIPE_PAYMENT_CONFIRMED_METADATA_KEY } from "./types";

type PaymentMethodFormProps = {
  cart: HttpTypes.StoreCart;
  paymentProviders: HttpTypes.StorePaymentProvider[];
};

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const pathname = usePathname();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Your payment could not be confirmed.");
      setIsUpdating(false);
      return;
    }

    try {
      await updateCart({
        metadata: { [STRIPE_PAYMENT_CONFIRMED_METADATA_KEY]: true },
      });
      router.push(`${pathname}?step=review`);
    } catch (err) {
      console.error(
        "PaymentMethodForm.tsx: Failed to record payment confirmation.",
        err,
      );
      setError(err instanceof Error ? err.message : String(err));
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="text-right">
        <button
          type="submit"
          className="btn btn-accent w-fit uppercase"
          disabled={isUpdating || !stripe || !elements}
        >
          {isUpdating ? "Confirming…" : "Continue to Review"}
        </button>
      </div>
    </form>
  );
}

function PaymentMethodForm({ cart, paymentProviders }: PaymentMethodFormProps) {
  const router = useRouter();
  const hasRequestedSession = useRef(false);
  const clientSecret = cart.payment_collection?.payment_sessions?.at(-1)?.data
    .client_secret as string | undefined;

  useEffect(() => {
    if (clientSecret || hasRequestedSession.current) {
      return;
    }

    const [stripeProvider] = paymentProviders;

    if (!stripeProvider) {
      return;
    }

    hasRequestedSession.current = true;

    initiatePaymentSession(cart, {
      provider_id: stripeProvider.id,
      data: { payment_method_types: ["card"] },
    }).then(() => router.refresh());
  }, [cart, clientSecret, paymentProviders, router]);

  if (!clientSecret) {
    return <span className="loading loading-spinner" />;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm />
    </Elements>
  );
}

export default PaymentMethodForm;
