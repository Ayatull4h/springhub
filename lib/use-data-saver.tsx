"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────

type DataSaverContextValue = {
  /** Apakah data saver aktif (dari sistem atau manual). */
  isEnabled: boolean;
  /** Set manual override — null = ikuti sistem, true/false = paksa. */
  setOverride: (v: boolean | null) => void;
  /** Utility: skip animasi/gambar berat kalau true. */
  shouldReduceQuality: boolean;
  /** Utility: skip autoplay video/gif kalau true. */
  shouldReduceMotion: boolean;
};

const DataSaverContext = createContext<DataSaverContextValue>({
  isEnabled: false,
  setOverride: () => {},
  shouldReduceQuality: false,
  shouldReduceMotion: false,
});

// ─── Hook ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "springhub:dataSaverOverride";

export function useDataSaver(): DataSaverContextValue {
  return useContext(DataSaverContext);
}

// ─── Provider ─────────────────────────────────────────────────────────

export function DataSaverProvider({ children }: { children: ReactNode }) {
  const [systemEnabled, setSystemEnabled] = useState(false);
  const [override, setOverrideState] = useState<boolean | null>(null);

  // Baca override dari localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setOverrideState(true);
      else if (stored === "false") setOverrideState(false);
    } catch {
      // localStorage tidak tersedia (SSR / private mode)
    }
  }, []);

  // Deteksi saveData dari Network Information API
  useEffect(() => {
    const conn = (navigator as any).connection as NetworkInformation | undefined;
    if (!conn) return;

    const update = () => setSystemEnabled(!!conn.saveData);
    update();

    conn.addEventListener("change", update);
    return () => conn.removeEventListener("change", update);
  }, []);

  const setOverride = useCallback((v: boolean | null) => {
    setOverrideState(v);
    try {
      if (v === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      // aman diabaikan
    }
  }, []);

  const isEnabled = override ?? systemEnabled;

  const value: DataSaverContextValue = {
    isEnabled,
    setOverride,
    shouldReduceQuality: isEnabled,
    shouldReduceMotion: isEnabled,
  };

  return (
    <DataSaverContext.Provider value={value}>
      {children}
    </DataSaverContext.Provider>
  );
}

// ─── Network Information API types ────────────────────────────────────

interface NetworkInformation extends EventTarget {
  readonly saveData: boolean;
  readonly effectiveType: "slow-2g" | "2g" | "3g" | "4g";
  readonly rtt: number;
  readonly downlink: number;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}
