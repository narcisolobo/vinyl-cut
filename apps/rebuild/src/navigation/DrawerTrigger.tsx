"use client";

import { useDrawer } from "@/hooks/use-drawer";
import { ListIcon } from "@phosphor-icons/react/List";

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
      aria-label="open navigation menu"
      className="btn btn-square btn-ghost drawer-button md:hidden"
    >
      <ListIcon size={24} />
    </button>
  );
}

export default DrawerTrigger;
