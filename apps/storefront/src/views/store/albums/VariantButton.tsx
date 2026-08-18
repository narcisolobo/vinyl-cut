import type { AlbumVariant } from "@/types/album";
import { Dispatch, SetStateAction } from "react";

interface VariantButtonProps {
  variant: AlbumVariant;
  selectedVariantId: string | undefined;
  onSelect: Dispatch<SetStateAction<string | undefined>>;
}

function VariantButton({
  variant,
  selectedVariantId,
  onSelect,
}: VariantButtonProps) {
  return (
    <button
      key={variant.id}
      type="button"
      onClick={() => onSelect(variant.id)}
      aria-pressed={variant.id === selectedVariantId}
      className={`join-item btn btn-xs xl:btn-sm uppercase ${
        variant.id === selectedVariantId ? "btn-accent" : "btn-primary"
      }`}
    >
      {variant.condition}
    </button>
  );
}

export default VariantButton;
