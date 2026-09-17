"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PointsGuideModal } from "@/components/sections/points-guide-modal";

export function FloatingPointsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700 motion-reduce:hover:scale-100 hover:scale-110 active:scale-95 md:bottom-6 md:right-6"
        aria-label="Cara Dapat Poin"
      >
        <Sparkles className="h-5 w-5" />
      </button>
      <PointsGuideModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
