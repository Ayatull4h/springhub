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
  "M1.0454,0.5000C1.0445,0.5205 1.0388,0.5417 1.0316,0.5612C1.0244,0.5807 1.0133,0.5996 1.0022,0.6171C0.9910,0.6346 0.9779,0.6509 0.9647,0.6661C0.9516,0.6813 0.9377,0.6954 0.9232,0.7082C0.9088,0.7210 0.8938,0.7327 0.8782,0.7427C0.8626,0.7528 0.8459,0.7613 0.8294,0.7684C0.8130,0.7755 0.7954,0.7804 0.7794,0.7854C0.7633,0.7904 0.7471,0.7933 0.7331,0.7986C0.7190,0.8039 0.7064,0.8085 0.6951,0.8172C0.6838,0.8259 0.6749,0.8365 0.6653,0.8507C0.6558,0.8648 0.6480,0.8833 0.6378,0.9022C0.6275,0.9212 0.6172,0.9447 0.6038,0.9646C0.5904,0.9844 0.5748,1.0063 0.5575,1.0213C0.5402,1.0363 0.5198,1.0490 0.5000,1.0545C0.4802,1.0600 0.4584,1.0594 0.4389,1.0542C0.4194,1.0490 0.4001,1.0364 0.3830,1.0235C0.3660,1.0106 0.3511,0.9922 0.3367,0.9768C0.3223,0.9614 0.3102,0.9444 0.2967,0.9312C0.2832,0.9179 0.2705,0.9067 0.2557,0.8972C0.2409,0.8876 0.2247,0.8815 0.2081,0.8739C0.1914,0.8663 0.1724,0.8607 0.1558,0.8516C0.1392,0.8425 0.1214,0.8325 0.1083,0.8191C0.0952,0.8058 0.0837,0.7893 0.0770,0.7715C0.0704,0.7537 0.0680,0.7325 0.0684,0.7123C0.0687,0.6922 0.0741,0.6702 0.0791,0.6505C0.0840,0.6307 0.0925,0.6114 0.0980,0.5937C0.1036,0.5761 0.1097,0.5602 0.1126,0.5446C0.1155,0.5290 0.1162,0.5150 0.1154,0.5000C0.1145,0.4850 0.1108,0.4705 0.1074,0.4548C0.1041,0.4391 0.0989,0.4228 0.0955,0.4057C0.0921,0.3886 0.0886,0.3706 0.0869,0.3523C0.0852,0.3341 0.0847,0.3152 0.0853,0.2960C0.0860,0.2768 0.0879,0.2573 0.0907,0.2373C0.0936,0.2173 0.0972,0.1967 0.1023,0.1761C0.1075,0.1554 0.1133,0.1337 0.1218,0.1136C0.1303,0.0936 0.1402,0.0726 0.1532,0.0558C0.1663,0.0390 0.1822,0.0230 0.2003,0.0128C0.2184,0.0026 0.2401,-0.0041 0.2618,-0.0053C0.2835,-0.0065 0.3081,-0.0017 0.3306,0.0056C0.3531,0.0128 0.3764,0.0264 0.3969,0.0384C0.4173,0.0503 0.4362,0.0662 0.4534,0.0773C0.4706,0.0883 0.4851,0.0990 0.5000,0.1045C0.5149,0.1100 0.5280,0.1114 0.5430,0.1102C0.5580,0.1090 0.5732,0.1023 0.5900,0.0973C0.6068,0.0923 0.6255,0.0838 0.6438,0.0801C0.6622,0.0764 0.6825,0.0731 0.7002,0.0752C0.7180,0.0774 0.7359,0.0835 0.7505,0.0928C0.7651,0.1021 0.7774,0.1167 0.7879,0.1312C0.7984,0.1457 0.8055,0.1639 0.8134,0.1798C0.8213,0.1958 0.8269,0.2124 0.8354,0.2268C0.8439,0.2412 0.8527,0.2538 0.8645,0.2661C0.8763,0.2783 0.8909,0.2884 0.9063,0.3001C0.9217,0.3119 0.9405,0.3230 0.9569,0.3367C0.9733,0.3504 0.9914,0.3654 1.0047,0.3823C1.0180,0.3992 1.0299,0.4186 1.0367,0.4382C1.0435,0.4578 1.0462,0.4795 1.0454,0.5000Z";

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
