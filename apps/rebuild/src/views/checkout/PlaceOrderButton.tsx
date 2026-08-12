"use client";

import { placeOrder } from "@/lib/data/checkout";
import { useState } from "react";

type PlaceOrderButtonProps = {
  cartId: string;
};

/**
 * A single component for now, rather than split by payment provider —
 * a Stripe branch (confirm the card, then call `placeOrder`) can be
 * added later without restructuring, since Stripe integration is a
 * separate, deferred plan.
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
