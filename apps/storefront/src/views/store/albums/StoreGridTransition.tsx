"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type ReactNode } from "react";

type StoreGridTransitionValue = {
  isPending: boolean;
  navigate: (href: string) => void;
};

const StoreGridTransitionContext =
  createContext<StoreGridTransitionValue | null>(null);

/**
 * Pagination navigates within the same `/store` route (only `?page=`
 * changes), so Next's client-side router never re-enters a Suspense/
 * `loading.tsx` boundary for it -- those only fire below the layout
 * shared by the source and destination route, and for a same-page
 * searchParams-only change that shared point is the page itself.
 * Confirmed live: `loading.tsx`'s fallback never mounted across a real
 * ~1s+ transition (checked with a `MutationObserver` armed before the
 * click). `useTransition`'s `isPending` isn't tied to Suspense
 * re-entry, so `Pagination` drives the grid's loading state through
 * this context instead.
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

  function navigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <StoreGridTransitionContext.Provider value={{ isPending, navigate }}>
      {children}
    </StoreGridTransitionContext.Provider>
  );
}

export { StoreGridTransition, useStoreGridTransition };
