"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type ReactNode } from "react";

type StoreGridTransitionValue = {
  isPending: boolean;
  push: (href: string) => void;
  replace: (href: string) => void;
};

const StoreGridTransitionContext =
  createContext<StoreGridTransitionValue | null>(null);

/**
 * Both pagination and genre/era/condition/sort changes navigate
 * within the same `/store` route (only searchParams change), so
 * Next's client-side router never re-enters a Suspense/`loading.tsx`
 * boundary for them -- those only fire below the layout shared by the
 * source and destination route, and for a same-page searchParams-only
 * change that shared point is the page itself. Confirmed live:
 * `loading.tsx`'s fallback never mounted across a real ~1s+ transition
 * (checked with a `MutationObserver` armed before the click).
 * `useTransition`'s `isPending` isn't tied to Suspense re-entry, so
 * `Pagination` and `StoreFilterAndSort` drive the grid's loading state
 * through this shared context instead. `push` (pagination, so the
 * back button steps through pages) and `replace` (filters/sort, so
 * toggling a checkbox doesn't pollute history) mirror the two ways
 * this route already navigated before this existed.
 */
function useStoreGridTransition(): StoreGridTransitionValue {
  const context = useContext(StoreGridTransitionContext);
  if (!context) {
    throw new Error(
      "StoreGridTransition.tsx: useStoreGridTransition must be used within <StoreGridTransition>.",
    );
  }
  return context;
}

interface StoreGridTransitionProps {
  children: ReactNode;
}

function StoreGridTransition({ children }: StoreGridTransitionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function push(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  function replace(href: string) {
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  return (
    <StoreGridTransitionContext.Provider value={{ isPending, push, replace }}>
      {children}
    </StoreGridTransitionContext.Provider>
  );
}

export { StoreGridTransition, useStoreGridTransition };
