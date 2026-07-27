"use client";

import { type ReactNode } from "react";
import { useDrawer } from "@/hooks/use-drawer";
import DrawerSide from "./DrawerSide";
import NavBar from "./NavBar";

interface DrawerProps {
  children: ReactNode;
}

function Drawer({ children }: DrawerProps) {
  const { checkboxRef } = useDrawer();

  return (
    <div className="drawer">
      <input
        ref={checkboxRef}
        id="mobile-navigation"
        type="checkbox"
        className="drawer-toggle"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="drawer-content flex min-h-dvh flex-col">
        <NavBar />
        {children}
      </div>
      <DrawerSide />
    </div>
  );
}

export default Drawer;
