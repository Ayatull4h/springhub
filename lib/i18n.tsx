"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import enMessages from "@/messages/en.json";
import idMessages from "@/messages/id.json";

export type Locale = "en" | "id";

type Messages = Record<string, string>;

const allMessages: Record<Locale, Messages> = {
  en: enMessages as Messages,
  id: idMessages as Messages,
};

type I18nParams = Record<string, string>;

type I18nContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, paramsOrFallback?: I18nParams | string) => string;
  loading: boolean;
};

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key, paramsOrFallback) => (typeof paramsOrFallback === "string" ? paramsOrFallback : key),
  loading: false,
});

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("locale="))
    ?.split("=")[1];
  if (cookie === "id" || cookie === "en") return cookie;
  const lang = navigator.language?.slice(0, 2);
  return lang === "id" ? "id" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initial = getInitialLocale();
    setLocaleState(initial);
    setLoading(false);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setLoading(false);
    document.cookie = `locale=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
  }, []);

  const interpolate = useCallback(
    (str: string, params?: I18nParams) => {
      if (!params) return str;
      return str.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
    },
    []
  );

  const t = useCallback(
    (key: string, paramsOrFallback?: I18nParams | string) => {
      const msgs = allMessages[locale] ?? {};
      const raw = msgs[key];
      if (raw !== undefined) {
        if (typeof paramsOrFallback === "object" && paramsOrFallback !== null) {
          return interpolate(raw, paramsOrFallback);
        }
        return raw;
      }
      return typeof paramsOrFallback === "string" ? paramsOrFallback : key;
    },
    [locale, interpolate]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
