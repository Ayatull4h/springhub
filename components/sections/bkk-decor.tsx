"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Dekor gaya BKKCAW untuk landing (staging): pembatas ombak, foto blob
 * organik, dan reveal-on-scroll. Satu file, tanpa dependensi baru.
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

/** Foto bermasker blob organik + garis tepi miring + coretan kuning. */
export function BkkBlob({
  src,
  alt,
  className = "",
  strokeClass = "text-bkkblue-500",
  flip = false,
}: {
  src: string;
  alt: string;
  className?: string;
  strokeClass?: string;
  flip?: boolean;
}) {
  return (
    <div className={`relative ${flip ? "-scale-x-100" : ""} ${className}`}>
      {/* garis tepi blob di belakang, diputar sedikit */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className={`absolute -inset-3 h-[calc(100%+24px)] w-[calc(100%+24px)] rotate-6 ${strokeClass}`}
        preserveAspectRatio="none"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          d="M100,8 C150,8 192,50 192,100 C192,150 150,192 100,192 C50,192 8,150 8,100 C8,50 50,8 100,8 Z"
        />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="relative h-full w-full object-cover"
        style={{ borderRadius: "58% 42% 55% 45% / 45% 52% 48% 55%" }}
      />
      {/* coretan kuning khas BKK */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 24"
        className="absolute -bottom-4 -left-4 h-6 w-28 -rotate-12 text-bkksun"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          d="M4,16 L28,8 L52,18 L76,8 L100,16 L116,10"
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
