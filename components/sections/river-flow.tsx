"use client";

import { UcengIcon, WaderIcon } from "./eco-icons";

const MAIN_FLOW =
  "M 720,-100 C 500,350 940,650 720,1100 C 500,1550 940,1850 720,2300 C 500,2750 940,3050 720,3500 C 520,3950 920,4250 720,4700 C 560,5100 860,5600 720,6150";

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
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full dark:opacity-40"
        viewBox="0 0 1440 6000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="riverWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CDEFF5" />
            <stop offset="45%" stopColor="#A8E3EC" />
            <stop offset="75%" stopColor="#7ED3E0" />
            <stop offset="100%" stopColor="#3FA9BC" />
          </linearGradient>
        </defs>
        {/* tepi sungai */}
        <path d={MAIN_FLOW} fill="none" stroke="#E3F6F9" strokeWidth="300" strokeLinecap="round" className="dark:opacity-0" />
        {/* badan air */}
        <path d={MAIN_FLOW} fill="none" stroke="url(#riverWater)" strokeWidth="210" strokeLinecap="round" />
        {/* arus 1 */}
        <path
          d={MAIN_FLOW}
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="26 60"
          opacity="0.65"
          className="animate-river-current"
        />
        {/* arus 2 */}
        <path
          d={MAIN_FLOW}
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="10 46"
          strokeDashoffset="28"
          opacity="0.5"
          className="animate-river-current-slow"
        />
      </svg>

      {/* daun hanyut */}
      <Drifter left="44%" top="-4%" duration="26s" delay="0s">
        <div className="h-5 w-7 rounded-[50%_10%_50%_10%] bg-leaf-500/80 rotate-12" />
      </Drifter>
      <Drifter left="56%" top="-4%" duration="32s" delay="-11s">
        <div className="h-4 w-6 rounded-[10%_50%_10%_50%] bg-leaf-600/70 -rotate-12" />
      </Drifter>
      <Drifter left="50%" top="-4%" duration="38s" delay="-23s">
        <div className="h-6 w-8 rounded-[50%_10%_50%_10%] bg-leaf-400/70 rotate-45" />
      </Drifter>
      {/* ikan hanyut */}
      <Drifter left="53%" top="-6%" duration="30s" delay="-7s">
        <UcengIcon className="w-16 opacity-80" />
      </Drifter>
      <Drifter left="46%" top="-6%" duration="36s" delay="-19s">
        <WaderIcon className="w-14 opacity-75" />
      </Drifter>
    </div>
  );
}
