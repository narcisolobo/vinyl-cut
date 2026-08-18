"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { DrawerContext } from "./drawer-context";

interface DrawerProviderProps {
  children: ReactNode;
}

function DrawerProvider({ children }: DrawerProviderProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function closeDrawer() {
    if (!checkboxRef.current?.checked) return;

    checkboxRef.current.checked = false;
    triggerRef.current?.focus();
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <DrawerContext.Provider value={{ checkboxRef, triggerRef, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}

export default DrawerProvider;
