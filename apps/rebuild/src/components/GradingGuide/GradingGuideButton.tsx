"use client";

import { Fragment, useRef } from "react";
import GradingGuideModal from "./GradingGuideModal";
import { cn } from "@/lib/utils/cn";

interface GradingGuideButtonProps {
  label: string;
  className?: string;
}

function GradingGuideButton({ label, className }: GradingGuideButtonProps) {
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const handleClickOpen = () => {
    if (!modalRef.current) return;
    modalRef.current.showModal();
  };

  return (
    <Fragment>
      <button
        className={cn("link link-hover", className && className)}
        onClick={handleClickOpen}
      >
        {label}
      </button>
      <GradingGuideModal ref={modalRef} />
    </Fragment>
  );
}

export default GradingGuideButton;
