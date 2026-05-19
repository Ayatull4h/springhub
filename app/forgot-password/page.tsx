"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ message: string; devUrl?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess({
          message: data.message,
          devUrl: data._devUrl,
        });
      } else {
        setError(data.error || "Gagal mengirim email reset");
      }
    } catch {
      setError("Kesalahan jaringan. Silakan coba lagi.");
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
            Lupa Password
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Masukkan email Anda untuk mendapatkan link reset password
          </p>
        </div>

        {success ? (
          <div className="card space-y-4">
            <div className="flex items-start gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
              <span>{success.message}</span>
            </div>
            {success.devUrl && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-medium mb-1">🔧 Mode Development:</p>
                <a href={success.devUrl} className="text-brand-600 hover:underline break-all">
                  {success.devUrl}
                </a>
              </div>
            )}
            <Link href="/sign-in" className="btn-primary w-full justify-center">
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Kirim Link Reset"
              )}
            </button>

            <Link href="/sign-in" className="flex items-center justify-center gap-1 text-sm text-ink-muted hover:text-ink">
              <ArrowLeft className="h-3 w-3" />
              Kembali ke login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
