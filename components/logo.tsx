"use client";

import Image from "next/image";
import { useDarkMode } from "@/lib/darkmode";

export function Logo({ tone }: { tone?: "dark" | "light" }) {
  const { dark } = useDarkMode();
  // tone="dark" (footer) → selalu putih di background gelap
  // tanpa tone (header) → ikut dark mode
  // tone="light" → selalu hitam di background terang
  const isDarkBg = tone ? tone === "dark" : dark;
  return (
    <div className="flex items-center">
      <Image
        src={isDarkBg ? "/putih.png" : "/hitam.png"}
        alt="SpringHub"
        width={160}
        height={66}
        className="h-8 w-auto object-contain transition-all duration-300 hover:opacity-80"
        priority
        unoptimized
      />
    </div>
  );
}
