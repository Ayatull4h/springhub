"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Sistem abstrak gaya BKKCAW untuk landing (staging): pita kurva diagonal
 * berlapis, anyaman rotan, stiker miring, dan reveal-on-scroll.
 * Satu file, tanpa dependensi baru, tanpa aset gambar.
 */

/**
 * Pembatas pita kurva raksasa antar section — meniru pita diagonal BKK
 * (mis. lavender di atas ungu). `top` = bg section ATAS, `bottom` = warna
 * section BAWAH, `accent` = pita belakang.
 */
export function BkkCurve({
  top = "bg-white",
  bottom = "text-bkk-700",
  accent = "text-bkk-200",
}: {
  top?: string;
  bottom?: string;
  accent?: string;
}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none leading-[0] ${top}`}>
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="h-[64px] w-full md:h-[120px]"
      >
        <path
          className={accent}
          fill="currentColor"
          opacity="0.55"
          d="M0,58 C300,112 620,8 920,44 C1160,74 1320,96 1440,58 L1440,120 L0,120 Z"
        />
        <path
          className={bottom}
          fill="currentColor"
          d="M0,76 C260,122 560,30 880,60 C1150,86 1310,106 1440,74 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
}

/** Tepi awan bergerombol antar section (lebih puffy dari kurva). */
export function BkkCloudEdge({
  top = "bg-white",
  bottom = "text-bkk-700",
}: {
  top?: string;
  bottom?: string;
}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none leading-[0] ${top}`}>
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="h-[70px] w-full md:h-[130px]"
      >
        <path
          className={bottom}
          fill="currentColor"
          d="M0,120 L0,80 Q35,50 75,68 Q100,28 155,52 Q195,16 250,52 Q290,20 330,60 Q380,30 430,64 Q470,32 520,62 Q570,30 620,64 Q670,34 720,62 Q770,30 820,62 Q870,32 920,62 Q970,30 1020,64 Q1070,34 1120,62 Q1170,32 1220,64 Q1270,36 1320,62 Q1380,42 1440,68 L1440,120 Z"
        />
      </svg>
    </div>
  );
}

/** Lencana awan di belakang judul section. */
export function BkkTitleCloud({
  children,
  cloudClass = "text-white",
  className = "",
}: {
  children: ReactNode;
  cloudClass?: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-block px-10 py-3 md:px-14 md:py-4 ${className}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 200 64"
        preserveAspectRatio="none"
        className={`absolute inset-0 h-full w-full -rotate-1 ${cloudClass}`}
      >
        <path
          fill="currentColor"
          d="M38,58 Q12,58 14,38 Q0,34 10,20 Q4,6 24,10 Q32,-2 48,8 Q62,0 70,12 Q88,4 96,16 Q114,8 120,20 Q140,12 146,26 Q166,20 168,34 Q188,32 184,46 Q194,52 178,58 Z"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}
/** Ombak kecil untuk DI DALAM kontainer/kartu ( dekorasi isi, bukan pembatas). */
export function BkkInnerWave({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={`pointer-events-none block h-6 w-full md:h-8 ${className}`}
    >
      <path
        fill="currentColor"
        d="M0,34 C180,58 360,6 540,24 C720,42 860,56 1040,34 C1220,12 1340,44 1440,28 L1440,60 L0,60 Z"
      />
    </svg>
  );
}

/** Warna siluet awan per tone. */
const CLOUD_TONES: Record<string, string> = {
  candy: "text-lagoon-200/90 dark:text-slate-800",
  sunset: "text-tang-200/90 dark:text-slate-800",
  lagoon: "text-bkkblue-200/90 dark:text-slate-800",
  white: "text-white/90 dark:text-slate-700/60",
};

/**
 * Boks awan: kotaknya SENDIRI berbentuk awan via clip-path (bukan kotak
 * ber-radius). Isi wajib punya padding lega agar tak terpotong punuk.
 * Shadow via drop-shadow filter (box-shadow ikut terpotong clip!).
 */
const CLOUD_PATH =
  "M0.055,0.885 C0.02,0.885 0.015,0.83 0.03,0.79 C0.005,0.75 0.01,0.70 0.035,0.66 C0.01,0.615 0.02,0.565 0.05,0.55 C0.055,0.47 0.09,0.435 0.115,0.44 C0.13,0.35 0.175,0.315 0.205,0.34 C0.225,0.24 0.285,0.21 0.315,0.26 C0.345,0.16 0.415,0.15 0.445,0.22 C0.475,0.13 0.545,0.135 0.565,0.21 C0.60,0.14 0.665,0.16 0.675,0.23 C0.72,0.20 0.775,0.24 0.775,0.31 C0.83,0.30 0.875,0.34 0.865,0.42 C0.925,0.43 0.955,0.48 0.94,0.56 C0.99,0.585 1.0,0.64 0.975,0.69 C1.0,0.74 0.985,0.80 0.95,0.815 C0.945,0.875 0.90,0.895 0.86,0.885 C0.83,0.925 0.70,0.93 0.60,0.915 C0.45,0.945 0.25,0.94 0.15,0.915 C0.10,0.925 0.07,0.905 0.055,0.885 Z";

export function BkkCloudBox({
  children,
  className = "",
  outerClassName = "",
  flip = false,
}: {
  children: ReactNode;
  /** bg + padding + drop-shadow. TANPA rounded/shadow/ring/overflow. */
  className?: string;
  outerClassName?: string;
  flip?: boolean;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = `bkk-cloudbox-${rawId}`;
  return (
    <div className={outerClassName}>
      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <clipPath id={id} clipPathUnits="objectBoundingBox">
            <path d={CLOUD_PATH} transform={flip ? "translate(1,0) scale(-1,1)" : undefined} />
          </clipPath>
        </defs>
      </svg>
      <div className={`relative ${className}`} style={{ clipPath: `url(#${id})` }}>
        {children}
      </div>
    </div>
  );
}

/** Anyaman rotan kuning (motif khas BKK) untuk sudut section. */
export function BkkWeave({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pid = `bkk-weave-${uid}`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 220"
      className={`pointer-events-none absolute h-36 w-36 opacity-90 md:h-48 md:w-48 ${className}`}
    >
      <defs>
        <pattern id={pid} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M0,8 H24 M0,16 H24" stroke="#FFC53D" strokeWidth="5" />
          <path d="M8,0 V24 M16,0 V24" stroke="#FFE3A3" strokeWidth="5" />
        </pattern>
      </defs>
      <rect width="220" height="220" fill={`url(#${pid})`} />
    </svg>
  );
}
/** Stiker pil miring tepi putih ala stiker festival. */
export function BkkSticker({
  children,
  className = "",
  tilt = "-rotate-3",
  bg = "bg-bkksun",
}: {
  children: ReactNode;
  className?: string;
  tilt?: string;
  bg?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[55%_45%_60%_40%/50%_50%_50%_50%] border-4 border-white px-4 py-1.5 font-display text-sm font-bold text-bkk-900 shadow-[0_6px_16px_rgba(11,15,21,0.28)] ${bg} ${tilt} ${className}`}
    >
      {children}
    </span>
  );
}

/** Blob total — 8 varian, tidak ada yang kembar bersebelahan. */
export const BKK_CARD_RADII = [
  "rounded-[63%_37%_54%_46%/55%_48%_52%_45%]",
  "rounded-[37%_63%_46%_54%/45%_55%_48%_52%]",
  "rounded-[54%_46%_38%_62%/52%_58%_42%_48%]",
  "rounded-[42%_58%_62%_38%/48%_42%_58%_52%]",
  "rounded-[58%_42%_36%_64%/60%_44%_56%_40%]",
  "rounded-[36%_64%_58%_42%/40%_60%_44%_56%]",
  "rounded-[48%_52%_64%_36%/58%_46%_54%_42%]",
  "rounded-[64%_36%_42%_58%/42%_58%_46%_54%]",
];

export const BKK_CARD_TILTS = [
  "md:-rotate-2",
  "md:rotate-2",
  "md:-rotate-[1.5deg]",
  "md:rotate-[1.5deg]",
];

/** Baris pil-blob (bukan rounded biasa) — 8 varian. */
export const BKK_ROW_RADII = [
  "rounded-[58%_42%_55%_45%/60%_60%_40%_40%]",
  "rounded-[42%_58%_45%_55%/40%_40%_60%_60%]",
  "rounded-[55%_45%_60%_40%/55%_55%_45%_45%]",
  "rounded-[45%_55%_40%_60%/45%_45%_55%_55%]",
  "rounded-[62%_38%_52%_48%/58%_62%_38%_42%]",
  "rounded-[38%_62%_48%_52%/42%_38%_62%_58%]",
  "rounded-[52%_48%_62%_38%/60%_40%_60%_40%]",
  "rounded-[48%_52%_38%_62%/40%_60%_40%_60%]",
];

export const BKK_ROW_TILTS = [
  "md:-rotate-1",
  "md:rotate-1",
  "md:-rotate-[0.5deg]",
  "md:rotate-[0.5deg]",
];

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
