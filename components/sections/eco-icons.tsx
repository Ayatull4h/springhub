"use client";

/**
 * Ikon kartun ekosistem mata air — SVG inline ringan (<2KB per ikon),
 * tanpa file gambar, tanpa watermark, aman render di HP kentang.
 * Gaya: flat + outline tebal, selaras palet situs.
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

/** Rumpun bambu: 2 batang beruas + daun. */
export function BambooIcon({ className = "" }: P) {
  return (
    <Base className={className}>
      <rect x="18" y="8" width="9" height="48" rx="4.5" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
      <rect x="35" y="16" width="8" height="40" rx="4" fill="#4ADE80" stroke="#14532D" strokeWidth="2.5" />
      <line x1="18" y1="22" x2="27" y2="22" stroke="#14532D" strokeWidth="2" />
      <line x1="18" y1="36" x2="27" y2="36" stroke="#14532D" strokeWidth="2" />
      <line x1="35" y1="29" x2="43" y2="29" stroke="#14532D" strokeWidth="2" />
      <line x1="35" y1="42" x2="43" y2="42" stroke="#14532D" strokeWidth="2" />
      <path d="M27 14 Q38 6 48 10 Q40 14 30 18 Z" fill="#86EFAC" stroke="#14532D" strokeWidth="2" />
      <path d="M43 22 Q52 20 56 26 Q48 28 42 26 Z" fill="#86EFAC" stroke="#14532D" strokeWidth="2" />
      <path d="M14 30 Q6 28 4 22 Q12 22 16 27 Z" fill="#86EFAC" stroke="#14532D" strokeWidth="2" />
    </Base>
  );
}

/** Pohon beringin: batang kokoh + tajuk + akar gantung. */
export function BanyanIcon({ className = "" }: P) {
  return (
    <Base className={className}>
      <path d="M27 58 L29 40 L25 32 L39 32 L35 40 L37 58 Z" fill="#B45309" stroke="#451A03" strokeWidth="2.5" />
      <line x1="29" y1="34" x2="29" y2="46" stroke="#451A03" strokeWidth="1.5" />
      <line x1="35" y1="34" x2="35" y2="48" stroke="#451A03" strokeWidth="1.5" />
      <circle cx="18" cy="22" r="10" fill="#16A34A" stroke="#14532D" strokeWidth="2.5" />
      <circle cx="32" cy="13" r="12" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
      <circle cx="46" cy="22" r="10" fill="#16A34A" stroke="#14532D" strokeWidth="2.5" />
      <line x1="8" y1="58" x2="56" y2="58" stroke="#451A03" strokeWidth="2.5" />
    </Base>
  );
}

/** Tumpukan batu kali: 3 batu bulat abu-abu. */
export function StoneIcon({ className = "" }: P) {
  return (
    <Base className={className}>
      <ellipse cx="24" cy="42" rx="15" ry="9" fill="#CBD5E1" stroke="#475569" strokeWidth="2.5" />
      <ellipse cx="41" cy="39" rx="12" ry="8" fill="#E2E8F0" stroke="#475569" strokeWidth="2.5" />
      <ellipse cx="32" cy="31" rx="8" ry="6" fill="#94A3B8" stroke="#475569" strokeWidth="2.5" />
      <path d="M16 39 Q22 36 28 38" stroke="#F8FAFC" strokeWidth="2" />
      <path d="M35 37 Q40 35 44 36" stroke="#F8FAFC" strokeWidth="2" />
    </Base>
  );
}

/** Ikan wader: badan ramping perak + garis emas. Menghadap kiri. */
export function WaderIcon({ className = "" }: P) {
  return (
    <Base className={className}>
      <path d="M52 32 L61 25 L59 32 L61 39 Z" fill="#FDE68A" stroke="#92400E" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M6 32 C15 25 30 23 45 28 C50 30 50 34 45 36 C30 41 15 39 6 32 Z"
        fill="#E2E8F0"
        stroke="#334155"
        strokeWidth="2.5"
      />
      <line x1="9" y1="32" x2="48" y2="32" stroke="#F59E0B" strokeWidth="2.5" />
      <path d="M26 26 Q29 20 34 21 Q36 23 35 27 Z" fill="#FDE68A" stroke="#92400E" strokeWidth="2" />
      <circle cx="14" cy="30" r="2.6" fill="#fff" stroke="#334155" strokeWidth="1.5" />
      <circle cx="14" cy="30" r="1.1" fill="#0F172A" />
    </Base>
  );
}

/** Ikan wader pari: sirip dada lebar seperti sayap + ekor cambuk. */
export function PariIcon({ className = "" }: P) {
  return (
    <Base className={className}>
      <path d="M50 32 L62 30 L62 34 Z" stroke="#334155" strokeWidth="2" />
      <path
        d="M32 20 Q44 24 46 32 Q44 40 32 44 Q28 42 28 32 Q28 22 32 20 Z"
        fill="#CBD5E1"
        stroke="#334155"
        strokeWidth="2.5"
      />
      <path
        d="M28 30 Q14 18 4 22 Q12 30 12 34 Q12 40 4 44 Q16 48 28 36 Z"
        fill="#93C5FD"
        stroke="#1E40AF"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M30 22 Q33 16 38 17" fill="#93C5FD" stroke="#1E40AF" strokeWidth="2" />
      <circle cx="38" cy="30" r="2.4" fill="#fff" stroke="#334155" strokeWidth="1.5" />
      <circle cx="38" cy="30" r="1" fill="#0F172A" />
    </Base>
  );
}

/** Ikan uceng: loach lonjong berkumis (sesuai aslinya, bukan cumi). */
export function UcengIcon({ className = "" }: P) {
  return (
    <Base className={className}>
      <path
        d="M6 34 C18 28 36 28 50 32 C55 33 55 37 50 38 C36 42 18 41 6 34 Z"
        fill="#E7D8B7"
        stroke="#57534E"
        strokeWidth="2.5"
      />
      <line x1="9" y1="32" x2="2" y2="29" stroke="#57534E" strokeWidth="1.8" />
      <line x1="9" y1="35" x2="2" y2="38" stroke="#57534E" strokeWidth="1.8" />
      <path d="M28 29 Q31 23 36 24 Q38 26 37 30 Z" fill="#D6A85C" stroke="#57534E" strokeWidth="2" />
      <path d="M50 32 L58 28 L57 32 L58 36 Z" fill="#D6A85C" stroke="#57534E" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="14" cy="32" r="2.2" fill="#fff" stroke="#57534E" strokeWidth="1.5" />
      <circle cx="14" cy="32" r="1" fill="#0F172A" />
      <circle cx="26" cy="34" r="1" fill="#92400E" />
      <circle cx="33" cy="33" r="1" fill="#92400E" />
      <circle cx="40" cy="34" r="1" fill="#92400E" />
    </Base>
  );
}

/** Ikan kepek: barb perak badan tinggi, sisik besar, sirip kuning (lihat ref). */
export function KepekIcon({ className = "" }: P) {
  return (
    <Base className={className}>
      <path d="M52 32 L61 24 L59 32 L61 40 Z" fill="#FDE68A" stroke="#92400E" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M8 32 C13 21 25 15 37 18 C47 20 53 27 53 33 C53 39 45 45 35 46 C23 47 12 41 8 32 Z"
        fill="#E2E8F0"
        stroke="#334155"
        strokeWidth="2.5"
      />
      <path d="M28 19 Q31 9 38 10 Q43 12 41 20 Z" fill="#FDE68A" stroke="#334155" strokeWidth="2" />
      <path d="M28 19 Q31 12 36 12 Q33 16 30 19 Z" fill="#334155" />
      <path d="M22 26 q3 3 6 0 M28 26 q3 3 6 0 M34 26 q3 3 6 0" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M22 33 q3 3 6 0 M28 33 q3 3 6 0 M34 33 q3 3 6 0" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M24 40 q3 2 5 0 M30 40 q3 2 5 0" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M18 24 Q22 32 18 40" stroke="#94A3B8" strokeWidth="1.5" />
      <circle cx="15" cy="29" r="2.8" fill="#fff" stroke="#334155" strokeWidth="1.5" />
      <circle cx="15" cy="29" r="1.2" fill="#0F172A" />
    </Base>
  );
}
