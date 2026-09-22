"use client";

import { UcengIcon, WaderIcon } from "./eco-icons";
import { WaterPlant, DuckIcon } from "./river-ornaments";

const MAIN_FLOW =
  "M 720,-100 C 500,350 940,650 720,1100 C 500,1550 940,1850 720,2300 C 500,2750 940,3050 720,3500 C 520,3950 920,4250 720,4700 C 560,5100 860,5600 720,6150";

const RIPPLES = [
  "M 640,420 q 40,-24 80,0",
  "M 700,880 q 40,-24 80,0",
  "M 620,1400 q 40,-24 80,0",
  "M 700,1900 q 40,-24 80,0",
  "M 640,2500 q 40,-24 80,0",
  "M 700,3000 q 40,-24 80,0",
  "M 630,3600 q 40,-24 80,0",
  "M 700,4100 q 40,-24 80,0",
  "M 640,4600 q 40,-24 80,0",
  "M 700,5200 q 40,-24 80,0",
  "M 640,5700 q 40,-24 80,0",
];

const STONES: Array<[number, number, number, number]> = [
  [540, 700, 34, 22],
  [900, 1500, 38, 24],
  [545, 2050, 30, 20],
  [895, 2900, 36, 23],
  [550, 3450, 32, 21],
  [900, 4300, 38, 24],
  [545, 5050, 33, 22],
  [900, 5650, 36, 23],
  [720, 1750, 24, 15],
  [720, 4150, 24, 15],
];

const SPARKLES: Array<[number, number, number, string]> = [
  [660, 600, 14, "0s"],
  [770, 1300, 11, "-1s"],
  [650, 2100, 15, "-2s"],
  [780, 2700, 11, "-0.5s"],
  [660, 3300, 14, "-1.6s"],
  [770, 3900, 11, "-2.4s"],
  [650, 4500, 15, "-0.8s"],
  [770, 5300, 12, "-1.9s"],
];

function Drifter({
  left,
  top,
  duration,
  delay,
  children,
}: {
  left: string;
  top: string;
  duration: string;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute animate-river-drift"
      style={{ left, top, animationDuration: duration, animationDelay: delay }}
    >
      <div className="animate-river-sway">{children}</div>
    </div>
  );
}

export function RiverFlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden print:hidden">
      <svg
        className="absolute inset-0 h-full w-full dark:opacity-40"
        viewBox="0 0 1440 6000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="riverWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8E8F0" />
            <stop offset="45%" stopColor="#8FD8E4" />
            <stop offset="75%" stopColor="#5BBFD2" />
            <stop offset="100%" stopColor="#2A9DB5" />
          </linearGradient>
        </defs>
        {/* tepi pasir sungai */}
        <path d={MAIN_FLOW} fill="none" stroke="#E9D9B0" strokeWidth="290" strokeLinecap="round" className="dark:opacity-0" />
        {/* tepi dalam (kedalaman) */}
        <path d={MAIN_FLOW} fill="none" stroke="#2A9DB5" strokeWidth="248" strokeLinecap="round" opacity="0.55" />
        {/* badan air */}
        <path d={MAIN_FLOW} fill="none" stroke="url(#riverWater)" strokeWidth="210" strokeLinecap="round" />
        {/* highlight tengah */}
        <path d={MAIN_FLOW} fill="none" stroke="#E8FAFC" strokeWidth="88" strokeLinecap="round" opacity="0.45" />
        {/* batu sungai */}
        <g>
          {STONES.map(([x, y, rx, ry], i) => (
            <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={i % 2 ? "#94A3B8" : "#CBD5E1"} stroke="#64748B" strokeWidth="3" opacity="0.95" />
          ))}
        </g>
        {/* tanaman air berakar */}
        <g stroke="#15803D" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85">
          <path d="M600,1250 C592,1200 608,1160 600,1110" />
          <path d="M622,1250 C622,1205 616,1170 622,1130" />
          <path d="M820,3200 C812,3150 828,3110 820,3060" />
          <path d="M842,3200 C842,3155 836,3120 842,3080" />
          <path d="M600,4900 C592,4850 608,4810 600,4760" />
          <path d="M622,4900 C622,4855 616,4820 622,4780" />
        </g>
        {/* riak organik */}
        <g stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.45">
          {RIPPLES.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {/* gelembung arus 1 */}
        <path
          d={MAIN_FLOW}
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="0.5 30"
          opacity="0.7"
          className="animate-river-current"
        />
        {/* gelembung arus 2 */}
        <path
          d={MAIN_FLOW}
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="0.5 24"
          strokeDashoffset="15"
          opacity="0.5"
          className="animate-river-current-slow"
        />
        {/* kilau cahaya */}
        <g fill="#ffffff">
          {SPARKLES.map(([x, y, s, delay], i) => (
            <polygon
              key={i}
              points={`${x},${y - s} ${x + s * 0.28},${y - s * 0.28} ${x + s},${y} ${x + s * 0.28},${y + s * 0.28} ${x},${y + s} ${x - s * 0.28},${y + s * 0.28} ${x - s},${y} ${x - s * 0.28},${y - s * 0.28}`}
              className="animate-sparkle"
              style={{ animationDelay: delay }}
              opacity="0.8"
            />
          ))}
        </g>
      </svg>

      {/* tanaman air mengapung di tepi */}
      <WaterPlant className="absolute left-[36%] top-[24%] hidden w-12 opacity-80 lg:block" />
      <WaterPlant className="absolute right-[35%] top-[58%] hidden w-14 opacity-80 lg:block" />

      {/* daun hanyut */}
      <Drifter left="44%" top="-6%" duration="26s" delay="0s">
        <div className="h-5 w-7 rounded-[50%_10%_50%_10%] bg-leaf-500/80 rotate-12" />
      </Drifter>
      <Drifter left="56%" top="-6%" duration="32s" delay="-11s">
        <div className="h-4 w-6 rounded-[10%_50%_10%_50%] bg-leaf-600/70 -rotate-12" />
      </Drifter>
      <Drifter left="50%" top="-6%" duration="38s" delay="-23s">
        <div className="h-6 w-8 rounded-[50%_10%_50%_10%] bg-leaf-500/70 rotate-45" />
      </Drifter>
      {/* ikan + bebek hanyut */}
      <Drifter left="53%" top="-6%" duration="30s" delay="-7s">
        <UcengIcon className="w-16 opacity-80" />
      </Drifter>
      <Drifter left="46%" top="-6%" duration="36s" delay="-19s">
        <WaderIcon className="w-14 opacity-75" />
      </Drifter>
      <Drifter left="50%" top="-6%" duration="42s" delay="-30s">
        <DuckIcon className="w-20 opacity-90" />
      </Drifter>
    </div>
  );
}
