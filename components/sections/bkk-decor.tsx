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
  "M1.0544,0.5200C1.0607,0.5385 1.0639,0.5588 1.0611,0.5774C1.0583,0.5959 1.0492,0.6149 1.0376,0.6313C1.0259,0.6477 1.0076,0.6625 0.9912,0.6759C0.9748,0.6894 0.9549,0.7002 0.9393,0.7119C0.9236,0.7237 0.9090,0.7340 0.8971,0.7464C0.8853,0.7588 0.8772,0.7722 0.8684,0.7865C0.8595,0.8008 0.8536,0.8175 0.8441,0.8322C0.8347,0.8469 0.8249,0.8629 0.8117,0.8746C0.7985,0.8864 0.7823,0.8965 0.7650,0.9026C0.7477,0.9087 0.7271,0.9107 0.7078,0.9114C0.6885,0.9122 0.6679,0.9087 0.6493,0.9071C0.6307,0.9054 0.6129,0.9021 0.5960,0.9015C0.5790,0.9009 0.5636,0.9015 0.5476,0.9034C0.5316,0.9053 0.5163,0.9096 0.5000,0.9126C0.4837,0.9157 0.4671,0.9199 0.4501,0.9219C0.4331,0.9239 0.4156,0.9248 0.3982,0.9246C0.3808,0.9244 0.3634,0.9223 0.3454,0.9208C0.3274,0.9193 0.3095,0.9170 0.2900,0.9156C0.2705,0.9142 0.2499,0.9138 0.2282,0.9124C0.2065,0.9110 0.1823,0.9110 0.1596,0.9073C0.1369,0.9035 0.1120,0.8992 0.0922,0.8900C0.0724,0.8808 0.0532,0.8681 0.0410,0.8521C0.0288,0.8361 0.0212,0.8152 0.0189,0.7942C0.0166,0.7733 0.0215,0.7486 0.0271,0.7266C0.0327,0.7046 0.0443,0.6819 0.0523,0.6621C0.0603,0.6424 0.0700,0.6246 0.0749,0.6080C0.0797,0.5915 0.0818,0.5775 0.0815,0.5628C0.0811,0.5481 0.0763,0.5346 0.0729,0.5200C0.0696,0.5054 0.0636,0.4904 0.0613,0.4752C0.0590,0.4599 0.0577,0.4440 0.0591,0.4287C0.0606,0.4134 0.0652,0.3983 0.0702,0.3836C0.0752,0.3689 0.0827,0.3549 0.0891,0.3405C0.0955,0.3260 0.1023,0.3119 0.1086,0.2969C0.1149,0.2818 0.1201,0.2659 0.1271,0.2502C0.1340,0.2345 0.1406,0.2175 0.1501,0.2026C0.1597,0.1877 0.1709,0.1728 0.1844,0.1610C0.1979,0.1492 0.2144,0.1395 0.2310,0.1317C0.2477,0.1238 0.2667,0.1193 0.2844,0.1139C0.3022,0.1084 0.3203,0.1051 0.3376,0.0991C0.3550,0.0931 0.3714,0.0862 0.3887,0.0777C0.4060,0.0693 0.4229,0.0579 0.4415,0.0486C0.4600,0.0394 0.4798,0.0279 0.5000,0.0222C0.5202,0.0166 0.5425,0.0124 0.5627,0.0149C0.5830,0.0173 0.6040,0.0252 0.6215,0.0370C0.6390,0.0487 0.6547,0.0674 0.6677,0.0853C0.6807,0.1032 0.6901,0.1257 0.6994,0.1443C0.7087,0.1630 0.7151,0.1820 0.7237,0.1970C0.7322,0.2121 0.7403,0.2242 0.7508,0.2347C0.7612,0.2453 0.7734,0.2523 0.7862,0.2604C0.7990,0.2684 0.8138,0.2747 0.8276,0.2830C0.8413,0.2912 0.8556,0.2999 0.8687,0.3098C0.8818,0.3198 0.8938,0.3309 0.9062,0.3425C0.9186,0.3541 0.9302,0.3665 0.9429,0.3794C0.9557,0.3923 0.9694,0.4055 0.9828,0.4200C0.9963,0.4345 1.0117,0.4498 1.0237,0.4665C1.0356,0.4831 1.0482,0.5015 1.0544,0.5200Z";

const CLOUD_PATH_TALL =
  "M1.0310,0.5000C1.0303,0.5198 1.0257,0.5401 1.0197,0.5592C1.0138,0.5782 1.0047,0.5968 0.9952,0.6142C0.9858,0.6317 0.9745,0.6482 0.9630,0.6637C0.9515,0.6793 0.9391,0.6939 0.9262,0.7074C0.9133,0.7209 0.8996,0.7335 0.8854,0.7448C0.8712,0.7560 0.8560,0.7659 0.8409,0.7748C0.8257,0.7836 0.8097,0.7906 0.7945,0.7977C0.7794,0.8047 0.7640,0.8100 0.7501,0.8169C0.7361,0.8238 0.7230,0.8301 0.7108,0.8390C0.6985,0.8479 0.6878,0.8581 0.6766,0.8705C0.6653,0.8829 0.6552,0.8982 0.6432,0.9136C0.6312,0.9290 0.6190,0.9474 0.6045,0.9629C0.5901,0.9784 0.5739,0.9951 0.5565,1.0067C0.5391,1.0183 0.5193,1.0280 0.5000,1.0323C0.4807,1.0365 0.4598,1.0362 0.4407,1.0323C0.4215,1.0284 0.4024,1.0189 0.3851,1.0089C0.3677,0.9989 0.3519,0.9846 0.3366,0.9721C0.3213,0.9595 0.3077,0.9456 0.2933,0.9338C0.2789,0.9221 0.2651,0.9115 0.2502,0.9018C0.2353,0.8920 0.2196,0.8843 0.2038,0.8754C0.1880,0.8665 0.1708,0.8586 0.1555,0.8481C0.1403,0.8377 0.1244,0.8263 0.1122,0.8126C0.0999,0.7988 0.0891,0.7826 0.0820,0.7654C0.0749,0.7483 0.0710,0.7286 0.0694,0.7096C0.0677,0.6906 0.0699,0.6702 0.0720,0.6514C0.0741,0.6325 0.0789,0.6139 0.0819,0.5965C0.0849,0.5790 0.0884,0.5628 0.0899,0.5467C0.0914,0.5306 0.0917,0.5156 0.0910,0.5000C0.0903,0.4844 0.0877,0.4690 0.0856,0.4528C0.0836,0.4366 0.0804,0.4200 0.0788,0.4028C0.0771,0.3857 0.0757,0.3679 0.0757,0.3500C0.0758,0.3320 0.0770,0.3137 0.0793,0.2952C0.0816,0.2768 0.0851,0.2581 0.0895,0.2393C0.0940,0.2205 0.0993,0.2013 0.1060,0.1824C0.1127,0.1635 0.1202,0.1440 0.1299,0.1259C0.1395,0.1079 0.1505,0.0894 0.1640,0.0742C0.1775,0.0590 0.1932,0.0445 0.2107,0.0346C0.2281,0.0247 0.2484,0.0175 0.2687,0.0146C0.2890,0.0116 0.3116,0.0132 0.3327,0.0169C0.3538,0.0206 0.3756,0.0291 0.3954,0.0367C0.4151,0.0443 0.4338,0.0551 0.4512,0.0627C0.4687,0.0703 0.4842,0.0780 0.5000,0.0823C0.5158,0.0865 0.5302,0.0882 0.5459,0.0883C0.5616,0.0884 0.5774,0.0849 0.5942,0.0827C0.6111,0.0806 0.6292,0.0762 0.6470,0.0754C0.6648,0.0746 0.6839,0.0743 0.7011,0.0779C0.7183,0.0816 0.7355,0.0883 0.7503,0.0974C0.7651,0.1065 0.7782,0.1195 0.7899,0.1327C0.8015,0.1458 0.8107,0.1618 0.8202,0.1764C0.8297,0.1910 0.8375,0.2063 0.8471,0.2202C0.8567,0.2342 0.8664,0.2472 0.8779,0.2600C0.8894,0.2729 0.9027,0.2845 0.9163,0.2974C0.9298,0.3103 0.9456,0.3230 0.9592,0.3376C0.9729,0.3522 0.9875,0.3679 0.9983,0.3851C1.0091,0.4022 1.0186,0.4212 1.0240,0.4403C1.0295,0.4595 1.0317,0.4802 1.0310,0.5000Z";

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
