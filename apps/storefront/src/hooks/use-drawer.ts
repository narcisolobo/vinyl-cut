"use client";

import { DrawerContext } from "@/context/drawer-context";
import { useContext } from "react";

function useDrawer() {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error("useDrawer must be used within a DrawerProvider");
  }
  return context;
}

export { useDrawer };
