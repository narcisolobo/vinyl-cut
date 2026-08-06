"use client";

import { deleteLineItem } from "@/lib/data/cart";
import { useState } from "react";
import { TrashIcon } from "@phosphor-icons/react";

interface RemoveLineItemButtonProps {
  lineId: string;
}

function Spinner() {
  return <span className="loading loading-spinner loading-xs"></span>;
}

function RemoveLineItemButton({ lineId }: RemoveLineItemButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await deleteLineItem(lineId);
    } catch (error) {
      console.error("RemoveLineItemButton.tsx: Failed to remove item.", error);
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isRemoving}
      className="link link-hover hover:link-error flex items-center gap-2 self-start"
    >
      {isRemoving ? <Spinner /> : <TrashIcon size={16} weight="fill" />}
      <span>Remove</span>
    </button>
  );
}

export default RemoveLineItemButton;
