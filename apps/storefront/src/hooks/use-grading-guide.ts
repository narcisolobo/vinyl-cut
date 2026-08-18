"use client";

import { useContext } from "react";
import { GradingGuideContext } from "@/context/grading-guide-context";

function useGradingGuide() {
  const open = useContext(GradingGuideContext);
  if (!open)
    throw new Error("useGradingGuide must be used within GradingGuideProvider");
  return open;
}

export { useGradingGuide };
