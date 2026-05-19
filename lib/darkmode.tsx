"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type DarkModeContextType = {
  dark: boolean;
  toggle: () => void;
};

const DarkModeContext = createContext<DarkModeContextType>({
  dark: false,
  toggle: () => {},
});

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "true" || (stored === null && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
