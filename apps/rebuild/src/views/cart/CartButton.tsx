"use client";

import Divider from "@/components/Divider";
import { HttpTypes } from "@medusajs/types";
import { ShoppingCartIcon } from "@phosphor-icons/react/dist/ssr";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CartEmpty from "./CartEmpty";
import CartDropdownItems from "./CartDropdownItems";
import type { CartWithItems } from "./types";

interface CartButtonProps {
  cart?: HttpTypes.StoreCart | null;
}

const AUTO_CLOSE_MS = 5000;

function hasItems(cart?: HttpTypes.StoreCart | null): cart is CartWithItems {
  return Boolean(cart?.items?.length);
}

function totalQuantity(cart?: HttpTypes.StoreCart | null): number {
  return cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
}

function CartButton({ cart: cartState }: CartButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);
  const pathname = usePathname();

  const itemCount = totalQuantity(cartState);
  const previousItemCount = useRef(itemCount);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /** Pops the dropdown open briefly whenever the cart's item count changes, so adding an item gets a visible confirmation. */
  useEffect(() => {
    if (
      itemCount !== previousItemCount.current &&
      !pathname.includes("/cart")
    ) {
      setIsOpen(true);
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => setIsOpen(false), AUTO_CLOSE_MS);
    }
    previousItemCount.current = itemCount;
  }, [itemCount, pathname]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <details
      className="dropdown dropdown-end"
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
    >
      <summary className="btn btn-ghost m-1">
        <ShoppingCartIcon size={24} />
        <div className="badge badge-sm badge-neutral">{itemCount}</div>
      </summary>
      <div className="card card-sm dropdown-content bg-primary text-primary-content w-96 shadow-sm">
        <div className="card-body">
          <p className="card-title">Cart</p>
          <Divider />
          {hasItems(cartState) ? (
            <CartDropdownItems cartState={cartState} />
          ) : (
            <CartEmpty close={close} />
          )}
        </div>
      </div>
    </details>
  );
}

export default CartButton;
