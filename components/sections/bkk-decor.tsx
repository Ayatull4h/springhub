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
  "M1.0640,0.5200C1.0713,0.5421 1.0749,0.5670 1.0703,0.5891C1.0657,0.6111 1.0519,0.6334 1.0366,0.6523C1.0212,0.6711 0.9973,0.6869 0.9784,0.7023C0.9595,0.7177 0.9388,0.7299 0.9233,0.7448C0.9077,0.7598 0.8967,0.7750 0.8853,0.7920C0.8740,0.8091 0.8672,0.8295 0.8554,0.8469C0.8435,0.8644 0.8311,0.8837 0.8141,0.8966C0.7972,0.9095 0.7755,0.9192 0.7537,0.9243C0.7319,0.9294 0.7063,0.9280 0.6835,0.9275C0.6607,0.9270 0.6379,0.9221 0.6169,0.9215C0.5960,0.9208 0.5772,0.9211 0.5578,0.9236C0.5383,0.9261 0.5198,0.9323 0.5000,0.9363C0.4802,0.9403 0.4595,0.9458 0.4388,0.9475C0.4181,0.9493 0.3968,0.9486 0.3757,0.9469C0.3545,0.9452 0.3341,0.9405 0.3121,0.9374C0.2901,0.9344 0.2680,0.9314 0.2436,0.9286C0.2192,0.9259 0.1918,0.9256 0.1657,0.9209C0.1395,0.9161 0.1094,0.9117 0.0865,0.9004C0.0636,0.8891 0.0410,0.8731 0.0281,0.8531C0.0152,0.8332 0.0096,0.8061 0.0092,0.7807C0.0089,0.7553 0.0189,0.7257 0.0260,0.7006C0.0332,0.6756 0.0463,0.6516 0.0524,0.6303C0.0584,0.6091 0.0623,0.5914 0.0623,0.5730C0.0622,0.5546 0.0559,0.5381 0.0522,0.5200C0.0485,0.5019 0.0415,0.4830 0.0402,0.4643C0.0389,0.4456 0.0402,0.4260 0.0444,0.4077C0.0486,0.3894 0.0577,0.3719 0.0655,0.3544C0.0732,0.3369 0.0830,0.3206 0.0910,0.3028C0.0990,0.2849 0.1054,0.2662 0.1136,0.2472C0.1217,0.2282 0.1286,0.2069 0.1399,0.1887C0.1513,0.1706 0.1649,0.1521 0.1816,0.1383C0.1983,0.1245 0.2195,0.1144 0.2401,0.1059C0.2607,0.0975 0.2840,0.0940 0.3053,0.0876C0.3267,0.0812 0.3473,0.0760 0.3682,0.0675C0.3891,0.0589 0.4088,0.0466 0.4308,0.0363C0.4527,0.0259 0.4761,0.0115 0.5000,0.0054C0.5239,-0.0006 0.5509,-0.0050 0.5744,-0.0002C0.5980,0.0046 0.6222,0.0178 0.6415,0.0341C0.6608,0.0504 0.6765,0.0760 0.6902,0.0975C0.7040,0.1190 0.7128,0.1441 0.7241,0.1630C0.7353,0.1819 0.7449,0.1976 0.7579,0.2108C0.7709,0.2240 0.7862,0.2321 0.8020,0.2422C0.8177,0.2522 0.8363,0.2602 0.8524,0.2712C0.8685,0.2822 0.8844,0.2946 0.8988,0.3082C0.9132,0.3218 0.9254,0.3371 0.9390,0.3527C0.9526,0.3683 0.9660,0.3843 0.9806,0.4015C0.9952,0.4188 1.0129,0.4365 1.0268,0.4562C1.0407,0.4759 1.0568,0.4979 1.0640,0.5200Z";

const CLOUD_PATH_TALL =
  "M1.0385,0.5000C1.0374,0.5233 1.0304,0.5473 1.0225,0.5695C1.0146,0.5917 1.0027,0.6130 0.9911,0.6330C0.9795,0.6530 0.9664,0.6718 0.9528,0.6895C0.9392,0.7072 0.9251,0.7240 0.9097,0.7390C0.8942,0.7539 0.8775,0.7676 0.8602,0.7792C0.8428,0.7908 0.8235,0.7999 0.8054,0.8086C0.7873,0.8172 0.7683,0.8229 0.7515,0.8312C0.7347,0.8394 0.7192,0.8467 0.7047,0.8582C0.6901,0.8696 0.6780,0.8837 0.6640,0.9001C0.6501,0.9165 0.6373,0.9379 0.6211,0.9565C0.6048,0.9752 0.5869,0.9973 0.5667,1.0119C0.5465,1.0266 0.5228,1.0395 0.5000,1.0442C0.4772,1.0488 0.4519,1.0465 0.4297,1.0398C0.4074,1.0331 0.3858,1.0179 0.3664,1.0039C0.3469,0.9900 0.3303,0.9708 0.3131,0.9559C0.2959,0.9409 0.2807,0.9263 0.2633,0.9143C0.2459,0.9023 0.2276,0.8938 0.2085,0.8839C0.1894,0.8739 0.1677,0.8665 0.1490,0.8547C0.1302,0.8429 0.1102,0.8299 0.0960,0.8132C0.0819,0.7965 0.0703,0.7757 0.0638,0.7544C0.0574,0.7331 0.0567,0.7082 0.0572,0.6853C0.0578,0.6624 0.0637,0.6387 0.0671,0.6172C0.0706,0.5957 0.0759,0.5757 0.0778,0.5562C0.0797,0.5366 0.0797,0.5189 0.0785,0.5000C0.0774,0.4811 0.0732,0.4626 0.0707,0.4429C0.0683,0.4232 0.0646,0.4027 0.0638,0.3819C0.0630,0.3611 0.0634,0.3396 0.0659,0.3183C0.0683,0.2970 0.0729,0.2756 0.0783,0.2540C0.0837,0.2324 0.0905,0.2106 0.0985,0.1887C0.1066,0.1669 0.1151,0.1439 0.1266,0.1227C0.1380,0.1015 0.1507,0.0791 0.1671,0.0616C0.1834,0.0442 0.2031,0.0277 0.2247,0.0181C0.2462,0.0085 0.2720,0.0037 0.2966,0.0039C0.3213,0.0042 0.3485,0.0119 0.3726,0.0196C0.3967,0.0273 0.4202,0.0411 0.4414,0.0502C0.4626,0.0593 0.4811,0.0695 0.5000,0.0742C0.5189,0.0788 0.5358,0.0793 0.5550,0.0781C0.5741,0.0769 0.5939,0.0701 0.6148,0.0670C0.6357,0.0639 0.6591,0.0585 0.6805,0.0597C0.7019,0.0609 0.7246,0.0651 0.7433,0.0742C0.7620,0.0833 0.7788,0.0985 0.7929,0.1143C0.8070,0.1301 0.8170,0.1507 0.8278,0.1688C0.8386,0.1869 0.8464,0.2059 0.8577,0.2227C0.8689,0.2395 0.8808,0.2542 0.8952,0.2694C0.9096,0.2847 0.9276,0.2980 0.9441,0.3141C0.9607,0.3302 0.9802,0.3469 0.9944,0.3661C1.0087,0.3854 1.0222,0.4072 1.0296,0.4296C1.0369,0.4519 1.0397,0.4767 1.0385,0.5000Z";

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
