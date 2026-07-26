"use client";

import { useDrawer } from "@/hooks/use-drawer";
import { DotsThreeOutlineVerticalIcon } from "@phosphor-icons/react/DotsThreeOutlineVertical";

function DrawerTrigger() {
  const { checkboxRef, triggerRef } = useDrawer();

  const toggleDrawer = () => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = !checkboxRef.current.checked;
    }
  };

  return (
    <button
      ref={triggerRef}
      onClick={toggleDrawer}
      aria-label="open navigation"
      className="btn btn-square btn-ghost drawer-button md:hidden"
    >
      <DotsThreeOutlineVerticalIcon size={42} />
    </button>
  );
}

export default DrawerTrigger;
