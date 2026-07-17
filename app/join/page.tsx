"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { useI18n } from "@/lib/i18n";
import { offlineDB } from "@/lib/offline-db";

export default function JoinPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username: username || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : typeof data.error === "object"
              ? Object.values(data.error).flat().join(", ")
              : t("auth.join.error");
        setError(errMsg);
        return;
      }

      // Cache session ke IndexedDB untuk PWA fallback
      if (data.user) {
        try {
          await offlineDB.saveSession({
            id: "user-session",
            userId: data.user.id,
            username: data.user.username,
            role: data.user.role,
            csrfToken: "",
            cachedAt: Date.now(),
          });
        } catch {
          // Non-critical — SiteHeader akan nge-cache ulang via API
        }
      }

      window.location.href = "/";
    } catch {
      setError(t("auth.join.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <Link
            href="/"
            className="relative -ml-1 mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {t("auth.join.title")}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {t("auth.join.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-ink">
              {t("auth.join.username")}
            </label>
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("auth.join.usernamePlaceholder")}
                minLength={2}
                className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              {t("auth.join.email")}
            </label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.join.emailPlaceholder")}
                className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              {t("auth.join.password")}
            </label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.join.passwordPlaceholder")}
                className="w-full rounded-md border border-ink-line pl-9 pr-9 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                aria-label={showPassword ? t("auth.join.hidePassword") : t("auth.join.showPassword")}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {t("auth.join.cta")}
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          {t("auth.join.hasAccount")}{" "}
          <Link href="/sign-in" className="font-medium text-brand-600 hover:text-brand-700">
            {t("auth.join.signInLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
