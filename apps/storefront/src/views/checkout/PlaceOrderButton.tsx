"use client";

import { placeOrder } from "@/lib/data/checkout";
import { unstable_rethrow } from "next/navigation";
import { useState } from "react";

type PlaceOrderButtonProps = {
  cartId: string;
};

/**
 * Provider-agnostic on purpose: Stripe's card confirmation already
 * happened in `PaymentMethodForm` before Review is ever reachable
 * (see `isPaymentComplete`), so this just completes the cart — no
 * per-provider branch needed here.
 */
function PlaceOrderButton({ cartId }: PlaceOrderButtonProps) {
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlaceOrder() {
    setIsPlacing(true);
    setError(null);

    try {
      // On success `placeOrder` redirects server-side and this call
      // never resolves in the browser — only a completion failure
      // (e.g. rejected payment) returns a value here.
      const cart = await placeOrder(cartId);
      if (cart) {
        setError(
          "We couldn't complete your order. Please check your payment details and try again.",
        );
        setIsPlacing(false);
      }
    } catch (err) {
      // `placeOrder`'s redirect() throws a NEXT_REDIRECT signal that
      // must propagate to Next's router, not be swallowed as an
      // application error — see Next's `unstable_rethrow` docs.
      unstable_rethrow(err);
      console.error("PlaceOrderButton.tsx: Failed to place order.", err);
      setError(err instanceof Error ? err.message : String(err));
      setIsPlacing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="btn btn-accent w-fit uppercase"
        disabled={isPlacing}
        onClick={handlePlaceOrder}
      >
        {isPlacing ? "Placing order…" : "Place order"}
      </button>

      {error && (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default PlaceOrderButton;
