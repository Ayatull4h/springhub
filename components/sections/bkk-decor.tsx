"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Dekor gaya BKKCAW untuk landing (staging): pembatas ombak dan
 * reveal-on-scroll. Satu file, tanpa dependensi baru.
 */

/** Pembatas ombak antar section — fill="currentColor", warna via text-*. */
export function BkkWave({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none leading-[0] ${className}`}>
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className={`h-[46px] w-full md:h-[90px] ${flip ? "rotate-180" : ""}`}
      >
        <path
          fill="currentColor"
          d="M0,48 C240,90 420,0 720,32 C1020,64 1200,88 1440,40 L1440,90 L0,90 Z"
        />
      </svg>
    </div>
  );
}

/** Fade-up saat masuk viewport (sekali saja). */
export function BkkReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
