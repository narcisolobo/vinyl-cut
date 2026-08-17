"use client";

import { addToCart } from "@/lib/data/cart";
import { useParams } from "next/navigation";
import { useState } from "react";

type AddToCartButtonProps = {
  variantId: string | undefined;
  inStock: boolean;
};

function AddToCartButton({ variantId, inStock }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { "country-code": countryCode } = useParams() as {
    "country-code": string;
  };

  async function handleAddToCart() {
    if (!variantId || !inStock) {
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
      disabled={!variantId || !inStock || isAdding}
    >
      {isAdding ? "Adding…" : inStock ? "Add to Cart" : "Out of Stock"}
    </button>
  );
}

export default AddToCartButton;
