/**
 * Ornamen kartun tepi sungai — SVG inline ringan, gaya flat + outline tebal
 * selaras eco-icons. Semua dekoratif (aria-hidden).
 */

type P = { className?: string };

function Base({
  className = "",
  children,
  viewBox = "0 0 64 64",
}: P & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Daun teratai + bunga lotus. */
export function LilyPad({ className = "" }: P) {
  return (
    <Base className={className}>
      <path d="M32 50 C14 50 6 40 6 32 C6 22 16 14 32 14 L32 32 L46 22 C52 26 58 30 58 32 C58 42 48 50 32 50 Z" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
      <path d="M32 20 L32 44 M14 34 L50 34" stroke="#14532D" strokeWidth="1.5" opacity="0.5" />
      <path d="M32 14 C28 8 24 6 20 6 C21 10 24 13 27 15 C27 10 29 7 32 6 C35 7 37 10 37 15 C40 13 43 10 44 6 C40 6 36 8 32 14 Z" fill="#F9A8D4" stroke="#9D174D" strokeWidth="2" />
      <circle cx="32" cy="11" r="2.5" fill="#FDE68A" stroke="#9D174D" strokeWidth="1.5" />
    </Base>
  );
}

/** Rumput gelagah / cattail: 3 batang + bulir cokelat. */
export function Reeds({ className = "" }: P) {
  return (
    <Base className={className} viewBox="0 0 64 80">
      <path d="M20 78 C20 60 18 48 14 36" stroke="#166534" strokeWidth="3" />
      <path d="M32 78 C32 56 32 40 32 26" stroke="#166534" strokeWidth="3" />
      <path d="M44 78 C44 62 46 52 50 42" stroke="#166534" strokeWidth="3" />
      <rect x="9" y="18" width="10" height="20" rx="5" fill="#92400E" stroke="#451A03" strokeWidth="2.5" />
      <rect x="27" y="8" width="10" height="20" rx="5" fill="#B45309" stroke="#451A03" strokeWidth="2.5" />
      <rect x="45" y="24" width="10" height="20" rx="5" fill="#92400E" stroke="#451A03" strokeWidth="2.5" />
      <path d="M20 50 Q8 54 4 64 Q14 62 20 56 Z" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
      <path d="M44 56 Q56 58 60 68 Q50 68 44 62 Z" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
    </Base>
  );
}

/** Kerikil: 3 batu. */
export function Pebbles({ className = "" }: P) {
  return (
    <Base className={className}>
      <ellipse cx="22" cy="44" rx="14" ry="10" fill="#CBD5E1" stroke="#475569" strokeWidth="2.5" />
      <ellipse cx="42" cy="46" rx="12" ry="9" fill="#94A3B8" stroke="#475569" strokeWidth="2.5" />
      <ellipse cx="33" cy="34" rx="10" ry="8" fill="#E2E8F0" stroke="#475569" strokeWidth="2.5" />
    </Base>
  );
}

/** Akar gantung beringin. */
export function HangingRoots({ className = "" }: P) {
  return (
    <Base className={className} viewBox="0 0 64 48">
      <path d="M10 2 C12 14 8 24 10 36 C11 41 9 44 10 46" stroke="#B45309" strokeWidth="3" />
      <path d="M24 2 C24 12 26 22 24 32 C23 38 25 42 24 46" stroke="#92400E" strokeWidth="3" />
      <path d="M38 2 C38 14 36 26 38 38" stroke="#B45309" strokeWidth="3" />
      <path d="M52 2 C50 12 54 22 52 34 C51 39 53 43 52 46" stroke="#92400E" strokeWidth="3" />
      <circle cx="10" cy="46" r="2" fill="#451A03" />
      <circle cx="24" cy="46" r="2" fill="#451A03" />
    </Base>
  );
}

/** Rumpun rumput. */
export function GrassTuft({ className = "" }: P) {
  return (
    <Base className={className} viewBox="0 0 64 40">
      <path d="M8 38 C10 26 8 18 4 10 C12 14 16 22 16 38 Z" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
      <path d="M22 38 C22 24 22 14 22 4 C26 12 28 24 28 38 Z" fill="#22C55E" stroke="#166534" strokeWidth="2" />
      <path d="M36 38 C36 26 38 18 42 10 C46 18 46 28 44 38 Z" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
      <path d="M48 38 C50 30 54 24 60 22 C58 28 54 34 52 38 Z" fill="#22C55E" stroke="#166534" strokeWidth="2" />
    </Base>
  );
}

/** Kerang. */
export function Shell({ className = "" }: P) {
  return (
    <Base className={className}>
      <path d="M8 40 L32 8 L56 40 C44 52 20 52 8 40 Z" fill="#FED7AA" stroke="#9A3412" strokeWidth="2.5" />
      <path d="M32 8 L28 42 M32 8 L38 43 M32 8 L20 40 M32 8 L44 40" stroke="#9A3412" strokeWidth="1.5" opacity="0.6" />
      <circle cx="32" cy="42" r="3" fill="#FDBA74" stroke="#9A3412" strokeWidth="1.5" />
    </Base>
  );
}

/** Bintang laut. */
export function Starfish({ className = "" }: P) {
  return (
    <Base className={className}>
      <path d="M32 8 L37 25 L55 26 L41 37 L46 54 L32 44 L18 54 L23 37 L9 26 L27 25 Z" fill="#FB923C" stroke="#9A3412" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="2.5" fill="#FED7AA" stroke="#9A3412" strokeWidth="1.5" />
      <circle cx="27" cy="27" r="1.2" fill="#FED7AA" />
      <circle cx="37" cy="27" r="1.2" fill="#FED7AA" />
      <circle cx="32" cy="39" r="1.2" fill="#FED7AA" />
    </Base>
  );
}

/** Bebek kartun: badan kuning + paruh oranye. */
export function DuckIcon({ className = "" }: P) {
  return (
    <Base className={className}>
      <ellipse cx="30" cy="40" rx="18" ry="12" fill="#FDE047" stroke="#854D0E" strokeWidth="2.5" />
      <circle cx="44" cy="24" r="10" fill="#FDE047" stroke="#854D0E" strokeWidth="2.5" />
      <path d="M52 22 L60 25 L52 28 Z" fill="#FB923C" stroke="#9A3412" strokeWidth="2" />
      <circle cx="46" cy="22" r="2" fill="#1C1917" />
      <path d="M20 40 Q26 34 32 40 Q26 44 20 40 Z" fill="#FACC15" stroke="#854D0E" strokeWidth="1.5" />
      <path d="M12 44 Q30 52 48 44 L48 48 Q30 56 12 48 Z" fill="#7DD3FC" stroke="#0369A1" strokeWidth="2" />
    </Base>
  );
}

/** Tanaman air: pita hijau bergelombang. */
export function WaterPlant({ className = "" }: P) {
  return (
    <Base className={className} viewBox="0 0 64 80">
      <path d="M20 78 C14 60 26 48 20 30 C17 20 22 12 20 4" stroke="#15803D" strokeWidth="4" />
      <path d="M34 78 C34 62 30 52 34 38 C37 28 33 18 35 8" stroke="#16A34A" strokeWidth="4" />
      <path d="M48 78 C54 64 44 54 48 40 C50 32 47 24 49 16" stroke="#15803D" strokeWidth="4" />
      <ellipse cx="20" cy="30" rx="4" ry="7" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
      <ellipse cx="35" cy="52" rx="4" ry="7" fill="#86EFAC" stroke="#15803D" strokeWidth="1.5" />
      <ellipse cx="48" cy="24" rx="4" ry="7" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
    </Base>
  );
}

/** Kilau cahaya di air (bintang 4 titik). */
export function Sparkle({ className = "" }: P) {
  return (
    <Base className={className} viewBox="0 0 32 32">
      <path d="M16 2 L19 13 L30 16 L19 19 L16 30 L13 19 L2 16 L13 13 Z" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1.5" />
    </Base>
  );
}

/** Mini sungai berliku: pita air + tepi pasir. */
export function MiniRiver({ className = "" }: P) {
  return (
    <Base className={className} viewBox="0 0 64 64">
      <path d="M38 4 C30 14 46 20 38 30 C30 40 46 46 38 60" stroke="#E9D9B0" strokeWidth="14" strokeLinecap="round" />
      <path d="M38 4 C30 14 46 20 38 30 C30 40 46 46 38 60" stroke="#38BDF8" strokeWidth="9" strokeLinecap="round" />
      <path d="M36 12 q6,-4 12,0 M34 30 q6,-4 12,0 M36 48 q6,-4 12,0" stroke="#FFFFFF" strokeWidth="2" />
      <ellipse cx="18" cy="50" rx="7" ry="5" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
      <ellipse cx="50" cy="16" rx="6" ry="4.5" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
    </Base>
  );
}
