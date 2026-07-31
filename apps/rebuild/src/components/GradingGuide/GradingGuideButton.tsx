"use client";

import { useGradingGuide } from "@/hooks/use-grading-guide";
import { cn } from "@/lib/utils/cn";

interface GradingGuideButtonProps {
  label: string;
  className?: string;
}

function GradingGuideButton({ label, className }: GradingGuideButtonProps) {
  const openGradingGuide = useGradingGuide();

  return (
    <button
      className={cn("link link-hover", className && className)}
      onClick={openGradingGuide}
    >
      {label}
    </button>
  );
}

export default GradingGuideButton;
