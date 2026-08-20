import { type RefObject } from "react";

interface StoreFilterButtonProps {
  filterCount: number;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
}

function StoreFilterButton({
  filterCount,
  triggerRef,
  onToggle,
}: StoreFilterButtonProps) {
  return (
    <button
      ref={triggerRef}
      onClick={onToggle}
      aria-label="open filters"
      className="btn btn-sm md:btn-md btn-primary btn-soft drawer-button lg:hidden"
    >
      Filter
      <span className="badge badge-sm badge-primary">{filterCount}</span>
    </button>
  );
}

export default StoreFilterButton;
