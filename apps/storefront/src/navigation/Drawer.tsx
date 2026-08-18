"use client";

import { type ReactNode } from "react";
import { useDrawer } from "@/hooks/use-drawer";
import DrawerSide from "./DrawerSide";
import NavBar from "./NavBar";
import Footer from "@/layout/Footer";
import Disclaimer from "@/layout/Disclaimer";
import { HttpTypes } from "@medusajs/types";

interface DrawerProps {
  children: ReactNode;
  cart: HttpTypes.StoreCart | null;
}

function Drawer({ children, cart }: DrawerProps) {
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
        <NavBar cart={cart} />
        <div className="flex-1">{children}</div>
        <Footer />
        <Disclaimer />
      </div>
      <DrawerSide />
    </div>
  );
}

export default Drawer;
