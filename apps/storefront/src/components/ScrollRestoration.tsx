"use client";

import { useLayoutEffect } from "react";
import { consumeScrollPosition } from "@/lib/utils/scroll-restore";

/**
 * Restores the PLP's scroll position when returning from a PDP via "Back to
 * Store". Uses `useLayoutEffect` (synchronous, pre-paint) rather than
 * `useEffect` so the correct offset is already in place before the browser
 * captures the View Transition's "after" state -- an effect-timed restore
 * would otherwise show a jump-cut right after the morph finishes.
 */
function ScrollRestoration() {
  useLayoutEffect(() => {
    const y = consumeScrollPosition();
    if (y !== null) {
      window.scrollTo(0, y);
    }
  }, []);

  return null;
}

export default ScrollRestoration;
