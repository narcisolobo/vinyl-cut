import { createContext, type RefObject } from "react";

interface DrawerContextValue {
  checkboxRef: RefObject<HTMLInputElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

export { DrawerContext, type DrawerContextValue };
