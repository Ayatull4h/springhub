"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { useI18n } from "@/lib/i18n";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : t("auth.signIn.error")
        );
        return;
      }

      // Redirect to home or the page they came from
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/";
      router.push(redirect);
      router.refresh();
    } catch {
      setError(t("auth.signIn.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {t("auth.signIn.title")}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {t("auth.signIn.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              {t("auth.signIn.email")}
            </label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.signIn.emailPlaceholder")}
                className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              {t("auth.signIn.password")}
            </label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.signIn.passwordPlaceholder")}
                className="w-full rounded-md border border-ink-line pl-9 pr-9 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                aria-label={showPassword ? t("auth.signIn.hidePassword") : t("auth.signIn.showPassword")}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700">
              Lupa password?
            </Link>
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
                <LogIn className="h-4 w-4" />
                {t("auth.signIn.cta")}
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          {t("auth.signIn.noAccount")}{" "}
          <Link href="/join" className="font-medium text-brand-600 hover:text-brand-700">
            {t("auth.signIn.joinNow")}
          </Link>
        </p>

        <div className="mt-4 rounded-lg border border-ink-line/60 bg-slate-50 p-3 text-xs text-ink-muted">
          <p className="font-medium text-ink">{t("auth.signIn.testAccounts")}</p>
          <p>{t("auth.signIn.testVolunteer")}</p>
          <p>{t("auth.signIn.testAdmin")}</p>
        </div>
      </div>
    </div>
  );
}
