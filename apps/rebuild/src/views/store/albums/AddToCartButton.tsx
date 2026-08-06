"use client";

import { addToCart } from "@/lib/data/cart";
import { useParams } from "next/navigation";
import { useState } from "react";

type AddToCartButtonProps = {
  variantId: string | undefined;
};

function AddToCartButton({ variantId }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { "country-code": countryCode } = useParams() as {
    "country-code": string;
  };

  async function handleAddToCart() {
    if (!variantId) {
      return;
    }

    setIsAdding(true);
    try {
      await addToCart({ variantId, quantity: 1, countryCode });
    } catch (error) {
      console.error("AddToCartButton.tsx: Failed to add item to cart.", error);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="btn btn-accent btn-lg"
      disabled={!variantId || isAdding}
    >
      {isAdding ? "Adding…" : "Add to Cart"}
    </button>
  );
}

export default AddToCartButton;
