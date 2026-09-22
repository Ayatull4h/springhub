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
  "M1.0767,0.5200C1.0849,0.5392 1.0895,0.5607 1.0867,0.5800C1.0838,0.5993 1.0731,0.6191 1.0594,0.6358C1.0457,0.6525 1.0238,0.6672 1.0045,0.6802C0.9852,0.6932 0.9617,0.7029 0.9437,0.7138C0.9256,0.7248 0.9091,0.7340 0.8963,0.7459C0.8835,0.7578 0.8755,0.7710 0.8669,0.7855C0.8583,0.7999 0.8535,0.8174 0.8446,0.8326C0.8357,0.8478 0.8266,0.8647 0.8134,0.8765C0.8002,0.8883 0.7834,0.8981 0.7654,0.9032C0.7475,0.9084 0.7256,0.9084 0.7055,0.9072C0.6855,0.9060 0.6640,0.8997 0.6450,0.8960C0.6261,0.8923 0.6084,0.8867 0.5918,0.8848C0.5752,0.8830 0.5606,0.8830 0.5453,0.8849C0.5300,0.8867 0.5156,0.8920 0.5000,0.8960C0.4844,0.9001 0.4683,0.9059 0.4516,0.9093C0.4350,0.9127 0.4177,0.9151 0.4003,0.9164C0.3828,0.9177 0.3654,0.9169 0.3468,0.9171C0.3283,0.9172 0.3099,0.9167 0.2891,0.9173C0.2683,0.9180 0.2461,0.9201 0.2223,0.9210C0.1985,0.9218 0.1713,0.9245 0.1461,0.9226C0.1209,0.9206 0.0926,0.9180 0.0709,0.9093C0.0491,0.9006 0.0279,0.8876 0.0155,0.8705C0.0031,0.8535 -0.0035,0.8302 -0.0036,0.8071C-0.0038,0.7840 0.0051,0.7563 0.0147,0.7320C0.0242,0.7078 0.0413,0.6828 0.0536,0.6617C0.0658,0.6406 0.0801,0.6221 0.0879,0.6053C0.0958,0.5885 0.0999,0.5750 0.1007,0.5608C0.1014,0.5466 0.0962,0.5340 0.0924,0.5200C0.0886,0.5060 0.0811,0.4916 0.0779,0.4769C0.0746,0.4621 0.0721,0.4465 0.0728,0.4315C0.0735,0.4166 0.0777,0.4018 0.0822,0.3874C0.0866,0.3729 0.0939,0.3594 0.0995,0.3450C0.1051,0.3306 0.1108,0.3165 0.1159,0.3011C0.1210,0.2856 0.1244,0.2689 0.1299,0.2522C0.1353,0.2356 0.1401,0.2171 0.1486,0.2012C0.1570,0.1852 0.1673,0.1690 0.1804,0.1564C0.1935,0.1439 0.2102,0.1339 0.2270,0.1259C0.2439,0.1179 0.2635,0.1138 0.2816,0.1085C0.2996,0.1031 0.3180,0.1001 0.3356,0.0937C0.3531,0.0872 0.3693,0.0794 0.3867,0.0697C0.4041,0.0599 0.4209,0.0461 0.4398,0.0350C0.4586,0.0239 0.4791,0.0098 0.5000,0.0030C0.5209,-0.0038 0.5444,-0.0089 0.5653,-0.0059C0.5862,-0.0028 0.6081,0.0070 0.6255,0.0214C0.6428,0.0357 0.6579,0.0586 0.6696,0.0803C0.6813,0.1020 0.6885,0.1293 0.6956,0.1514C0.7028,0.1736 0.7063,0.1959 0.7126,0.2130C0.7190,0.2301 0.7248,0.2431 0.7339,0.2539C0.7429,0.2647 0.7543,0.2708 0.7669,0.2779C0.7795,0.2849 0.7948,0.2895 0.8092,0.2963C0.8236,0.3031 0.8389,0.3101 0.8532,0.3186C0.8675,0.3272 0.8810,0.3370 0.8951,0.3474C0.9092,0.3578 0.9227,0.3690 0.9380,0.3810C0.9532,0.3930 0.9699,0.4053 0.9865,0.4193C1.0030,0.4333 1.0224,0.4483 1.0374,0.4651C1.0525,0.4819 1.0685,0.5008 1.0767,0.5200Z";

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
