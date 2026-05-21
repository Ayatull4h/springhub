"use client";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../hooks/useI18n";
import { useDarkMode } from "@/lib/darkmode";
import { Logo } from "@/components/logo";

export function Header() {
  const { user, loading, isAdmin } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { dark, toggle } = useDarkMode();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-line bg-white/85 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label="Home"><Logo /></Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: t("nav.map"), href: "/#map" },
            { label: t("nav.dashboard"), href: "/#dashboard" },
            { label: t("nav.community"), href: "/#community" },
            { label: t("nav.learn"), href: "/#learn" },
            { label: t("nav.media"), href: "/#media" },
            { label: t("nav.donate"), href: "/#donate" },
          ].map(item => (
            <Link key={item.label} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle locale={locale} onClick={() => setLocale(locale === "en" ? "id" : "en")} />
          <DarkModeToggle dark={dark} onClick={toggle} />
          <NotificationBell count={0} />
          {loading ? <Skeleton /> : user ? <UserMenu user={user} isAdmin={isAdmin} /> : <AuthButtons />}
        </div>
      </div>
    </header>
  );
}

function LanguageToggle({ locale, onClick }: { locale: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-md px-2.5 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800">
      {locale === "en" ? "ID" : "EN"}
    </button>
  );
}

function DarkModeToggle({ dark, onClick }: { dark: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-md p-2 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800">
      {dark ? <span>☀️</span> : <span>🌙</span>}
    </button>
  );
}

function NotificationBell({ count }: { count: number }) {
  return (
    <Link href="/profile" className="relative rounded-md p-2 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800">
      <span>🔔</span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function Skeleton() {
  return <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />;
}

function UserMenu({ user, isAdmin }: { user: NonNullable<ReturnType<typeof useAuth>["user"]>; isAdmin: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {isAdmin && <Link href="/admin" className="rounded-md px-2.5 py-2 text-sm text-ink-muted hover:bg-slate-100">Admin</Link>}
      <Link href="/profile" className="rounded-md px-2.5 py-2 text-sm text-ink-muted hover:bg-slate-100">{user.username}</Link>
    </div>
  );
}

function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/sign-in" className="text-sm text-ink-muted hover:text-ink">Masuk</Link>
      <Link href="/join" className="btn-primary">Daftar</Link>
    </div>
  );
}
