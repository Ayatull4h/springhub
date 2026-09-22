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

/**
 * Boks awan: kotaknya SENDIRI berbentuk awan via clip-path (bukan kotak
 * ber-radius). Isi wajib punya padding lega agar tak terpotong punuk.
 * Shadow via drop-shadow filter (box-shadow ikut terpotong clip!).
 * `tall` = siluet portrait untuk boks tinggi (trio, panel peta, kartu).
 */
const CLOUD_PATH =
  "M0.03,0.98 L0.03,0.72 Q-0.04,0.68 -0.03,0.60 Q-0.045,0.52 0.03,0.48 Q0.02,0.38 0.10,0.38 Q0.10,0.28 0.18,0.28 Q0.20,0.18 0.28,0.20 Q0.32,0.10 0.40,0.14 Q0.44,0.04 0.52,0.08 Q0.58,0.00 0.63,0.07 Q0.70,0.01 0.74,0.08 Q0.82,0.04 0.85,0.12 Q0.93,0.10 0.94,0.18 Q1.03,0.22 1.00,0.30 Q1.04,0.38 0.97,0.42 L0.97,0.55 Q1.04,0.60 1.02,0.68 Q1.03,0.76 0.97,0.80 L0.97,0.98 Z";

const CLOUD_PATH_TALL =
  "M0.03,0.98 L0.03,0.80 Q-0.04,0.76 -0.03,0.68 Q-0.045,0.60 0.03,0.56 L0.03,0.48 Q-0.04,0.44 -0.03,0.36 Q-0.045,0.28 0.03,0.24 Q0.02,0.16 0.10,0.16 Q0.10,0.08 0.18,0.08 Q0.20,0.00 0.28,0.02 Q0.32,-0.03 0.40,0.01 Q0.44,-0.04 0.52,0.00 Q0.58,-0.045 0.63,0.005 Q0.70,-0.03 0.74,0.03 Q0.82,0.00 0.85,0.07 Q0.93,0.06 0.94,0.13 Q1.03,0.17 1.00,0.25 Q1.04,0.33 0.97,0.37 L0.97,0.48 Q1.04,0.53 1.02,0.61 Q1.03,0.69 0.97,0.73 L0.97,0.80 Q1.035,0.85 1.02,0.90 Q1.01,0.95 0.97,0.98 Z";

export function BkkCloudBox({
  children,
  className = "",
  outerClassName = "",
  flip = false,
  tall = false,
}: {
  children: ReactNode;
  /** bg + padding + drop-shadow. TANPA rounded/shadow/ring/overflow. */
  className?: string;
  outerClassName?: string;
  flip?: boolean;
  /** Siluet portrait untuk boks tinggi. */
  tall?: boolean;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = `bkk-cloudbox-${rawId}`;
  const d = tall ? CLOUD_PATH_TALL : CLOUD_PATH;
  return (
    <div className={outerClassName}>
      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <clipPath id={id} clipPathUnits="objectBoundingBox">
            <path d={d} transform={flip ? "translate(1,0) scale(-1,1)" : undefined} />
          </clipPath>
        </defs>
      </svg>
      <div className={`relative ${className}`} style={{ clipPath: `url(#${id})` }}>
        {/* cahaya volume: sorot atas-kiri + bayangan bawah-kanan */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 45% at 30% 18%, rgba(255,255,255,0.65), transparent 60%), radial-gradient(ellipse 55% 40% at 78% 88%, rgba(8,47,73,0.16), transparent 55%)",
          }}
        />
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
