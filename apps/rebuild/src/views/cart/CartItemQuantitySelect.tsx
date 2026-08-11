"use client";

import { updateLineItem } from "@/lib/data/cart";
import { HttpTypes } from "@medusajs/types";
import { useState } from "react";
import { getAvailableQuantity } from "./types";

interface CartItemQuantitySelectProps {
  lineId: string;
  quantity: number;
  item: HttpTypes.StoreCartLineItem;
}

function CartItemQuantitySelect({
  lineId,
  quantity,
  item,
}: CartItemQuantitySelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const maxQuantity = getAvailableQuantity(item.variant);

  async function handleChange(delta: number) {
    setIsUpdating(true);
    try {
      await updateLineItem({ lineId, quantity: quantity + delta });
    } catch (error) {
      console.error(
        "CartItemQuantitySelect.tsx: Failed to update quantity.",
        error,
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="join" role="group" aria-label="Quantity">
      <button
        className="btn btn-xs sm:btn-sm join-item"
        aria-label={`Decrease quantity of ${item.title}`}
        disabled={isUpdating || quantity <= 1}
        onClick={() => handleChange(-1)}
      >
        −
      </button>
      <span
        className="btn btn-xs sm:btn-sm join-item pointer-events-none flex w-6 items-center justify-center sm:w-10"
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        className="btn btn-xs sm:btn-sm join-item"
        aria-label={`Increase quantity of ${item.title}`}
        disabled={
          isUpdating || (maxQuantity !== undefined && quantity >= maxQuantity)
        }
        onClick={() => handleChange(1)}
      >
        +
      </button>
    </div>
  );
}

export default CartItemQuantitySelect;
