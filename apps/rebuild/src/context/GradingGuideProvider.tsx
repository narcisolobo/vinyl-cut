"use client";

import { useRef, ReactNode } from "react";
import GradingGuideModal from "@/components/GradingGuide/GradingGuideModal";
import { GradingGuideContext } from "./grading-guide-context";

interface GradingGuideProviderProps {
  children: ReactNode;
}

function GradingGuideProvider({ children }: GradingGuideProviderProps) {
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const open = () => modalRef.current?.showModal();

  return (
    <GradingGuideContext.Provider value={open}>
      {children}
      <GradingGuideModal ref={modalRef} />
    </GradingGuideContext.Provider>
  );
}

export default GradingGuideProvider;
