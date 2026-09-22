"use client";

import Link from "next/link";
import { Globe, User, LayoutDashboard, LogOut, Sun, Moon, Bell, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useDarkMode } from "@/lib/darkmode";

import { fetchAndCacheSession, clearAllOfflineUserData } from "@/lib/session-cache";

type UserInfo = {
  id: string;
  username: string;
  role: string;
  points?: number;
} | null;

export function SiteHeader() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications/unread")
        .then((r) => r.json())
        .then((data) => setNotifCount(data.unread || 0))
        .catch(() => {});
    } else {
      setNotifCount(0);
    }
  }, [user]);

  useEffect(() => {
    fetchAndCacheSession()
      .then((result) => {
        if (result.user) {
          setUser(result.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    try {
      await clearAllOfflineUserData();
    } catch {}
    await fetch("/api/csrf").then(r => r.json()).then(d => fetch("/api/auth/logout", { method: "POST", headers: { "x-csrf-token": d.token } })).catch(() => {});
    setUser(null);
    router.refresh();
  }

  const nav = [
    { label: t("nav.about", "About"), href: "/#about" },
    { label: t("nav.impact", "Impact"), href: "/#dashboard" },
  ];

  return (
    <header className="sticky top-3 z-40 px-3 md:px-6">
      <div className="container-page flex min-h-16 items-center justify-between gap-2 rounded-[46%_54%_52%_48%/28%_32%_30%_34%] bg-cream/95 py-2 shadow-[0_10px_36px_rgba(8,47,73,0.22)] ring-2 ring-white backdrop-blur md:rounded-[48%_52%_50%_50%/38%_42%_40%_44%] dark:bg-slate-900/95 dark:ring-slate-700">
        <Link href="/" aria-label="SpringHub home">
          <Logo />
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-[55%_45%_60%_40%/60%_55%_45%_60%] p-2 text-ink-muted hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-[60%_40%_55%_45%/55%_45%_60%_40%] px-4 py-2 font-display text-sm font-semibold text-sky-900 transition hover:bg-white/70 dark:text-sky-100 dark:hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "id" : "en")}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
            {locale === "en" ? "ID" : "EN"}
          </button>

          <button
            type="button"
            onClick={toggleDark}
            className="rounded-[55%_45%_60%_40%/60%_55%_45%_60%] p-2 text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user && (
            <Link
              href="/notifications"
              className="relative rounded-md p-2 text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </Link>
          )}

          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-1 rounded-md px-2.5 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white sm:inline-flex"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("nav.admin")}
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-1 rounded-md px-2.5 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-[55%_45%_60%_40%/60%_55%_45%_60%] p-2 text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                prefetch={false}
                className="hidden text-sm font-semibold text-sky-900 hover:text-sky-700 sm:inline dark:text-sky-100"
              >
                {t("nav.login", "Login")}
              </Link>
              <Link
                href="/join"
                prefetch={false}
                className="rounded-[60%_40%_55%_45%/55%_45%_60%_40%] bg-bkk-700 px-5 py-2.5 font-display text-sm font-bold text-white shadow-[3px_3px_0_rgba(61,22,96,0.9)] transition hover:rotate-0 hover:bg-bkk-800 -rotate-1"
              >
                {t("nav.register", "Register")}
              </Link>
            </>
          )}
        </div>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mx-3 mt-2 rounded-[2rem] bg-cream shadow-elevated ring-2 ring-white md:hidden dark:bg-slate-900 dark:ring-slate-700">
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[40%_60%_45%_55%/45%_55%_40%_60%] px-3 py-2.5 font-display text-sm font-semibold text-sky-900 transition hover:bg-white/70 dark:text-sky-100 dark:hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30"
              >
                <LayoutDashboard className="mr-2 inline-block h-4 w-4" />
                {t("nav.admin")}
              </Link>
            )}
            {user && (
              <>
                <Link
                  href="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <Bell className="mr-2 inline-block h-4 w-4" />
                  Notifikasi
                  {notifCount > 0 && (
                    <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {notifCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <User className="mr-2 inline-block h-4 w-4" />
                  {user.username}
                </Link>
              </>
            )}
            {!user && (
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {t("nav.login", "Login")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
