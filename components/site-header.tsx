"use client";

import Link from "next/link";
import { Globe, User, LayoutDashboard, LogOut, Sun, Moon, Bell } from "lucide-react";
import { Logo } from "./logo";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useDarkMode } from "@/lib/darkmode";

type UserInfo = {
  id: string;
  username: string;
  role: string;
  points: number;
} | null;

export function SiteHeader() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch("/api/user/notifications")
        .then((r) => r.json())
        .then((data) => setNotifCount(data.unread || 0))
        .catch(() => {});
    } else {
      setNotifCount(0);
    }
  }, [user]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  const nav = [
    { label: t("nav.map"), href: "/#map" },
    { label: t("nav.dashboard"), href: "/#dashboard" },
    { label: t("nav.community"), href: "/#community" },
    { label: t("nav.learn"), href: "/#learn" },
    { label: t("nav.media"), href: "/#media" },
    { label: t("nav.donate"), href: "/#donate" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-line bg-white/85 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label="SpringHub home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
            className="rounded-md p-2 text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user && (
            <Link
              href="/profile"
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
                className="rounded-md p-2 text-ink-muted hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden text-sm font-medium text-ink-muted hover:text-ink dark:text-slate-400 dark:hover:text-white sm:inline"
              >
                {t("nav.signIn")}
              </Link>
              <Link href="/join" className="btn-primary">
                {t("nav.join")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
