"use client";

import { useRouter } from "next/navigation";

interface CartEmptyProps {
  close?: () => void;
  countryCode?: string;
}

function CartEmpty({ close, countryCode }: CartEmptyProps) {
  const router = useRouter();

  const handleClick = () => {
    close?.();
    router.push(`/${countryCode}/store`);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-y-4 py-16">
      <div className="bg-base-300 text-base-content flex h-8 w-8 items-center justify-center rounded-full">
        <span className="text-lg font-bold">0</span>
      </div>
      <p>Your cart is empty.</p>
      <div>
        <>
          <span className="sr-only">Go to store page</span>
          <button
            className="btn btn-accent whitespace-nowrap uppercase"
            onClick={handleClick}
          >
            Browse the crates
          </button>
        </>
      </div>
    </div>
  );
}

export default CartEmpty;
