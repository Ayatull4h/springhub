"use client";

import { useState, useEffect, useMemo } from "react";
import { Bug, MessageSquare, Image, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type FeedbackType = "bug" | "kritik" | "saran" | "both" | "";

function BlobPreview({ file, alt }: { file: File; alt: string }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img src={url} alt={alt} className="h-full w-full object-cover" />;
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ReportIssuePage() {
  const { t } = useI18n();

  const [bugDescription, setBugDescription] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);

  const [kritik, setKritik] = useState("");
  const [saran, setSaran] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function determineType(): FeedbackType {
    const hasBug = bugDescription.trim().length > 0;
    const hasKritik = kritik.trim().length > 0;
    const hasSaran = saran.trim().length > 0;

    if (hasBug) return "bug";
    if (hasKritik && hasSaran) return "both";
    if (hasKritik) return "kritik";
    if (hasSaran) return "saran";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const type = determineType();
    if (!type) {
      setError(t("reportIssue.fillAtLeastOne", "Isi setidaknya satu bagian — bug atau kritik/saran."));
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        type,
        bugDescription: bugDescription.trim() || undefined,
        kritik: kritik.trim() || undefined,
        saran: saran.trim() || undefined,
      };

      if (screenshots.length > 0) {
        payload.bugScreenshots = await Promise.all(screenshots.map(toBase64));
      }

      const { token: csrfToken } = await fetch("/api/csrf").then(r => r.json());

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? data.details ?? t("reportIssue.failedSend", "Gagal mengirim laporan."));
      }

      setSuccess(true);
      setBugDescription("");
      setScreenshots([]);
      setKritik("");
      setSaran("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reportIssue.genericError", "Terjadi kesalahan."));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container-page max-w-lg py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-ink">
          {t("reportIssue.thankYou", "Terima kasih!")}
        </h1>
        <p className="mt-2 text-ink-muted">
          {t("reportIssue.successDesc", "Laporan Anda telah kami terima. Tim kami akan menindaklanjuti.")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            {t("reportIssue.backToHome", "Kembali ke Beranda")}
          </Link>
          <button onClick={() => setSuccess(false)} className="btn-secondary">
            {t("reportIssue.submitAnother", "Kirim Lainnya")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">
        🎯 {t("reportIssue.title", "Laporkan Masalah / Kritik & Saran")}
      </h1>
      <p className="mt-2 text-ink-muted">
        {t("reportIssue.subtitle", "Pilih salah satu atau keduanya")}
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Bug Section */}
        <section className="card space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Bug className="h-5 w-5 text-red-500" />
            {t("reportIssue.bugSection", "Laporkan Bug")}
          </h2>

          <div>
            <label htmlFor="bugDescription" className="block text-sm font-medium text-ink">
              {t("reportIssue.bugDescription", "Deskripsi Bug")}
            </label>
            <textarea
              id="bugDescription"
              rows={4}
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder={t("reportIssue.bugPlaceholder", "Jelaskan apa yang terjadi...")}
              className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="screenshots"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-ink-line bg-white px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-slate-50 hover:text-ink dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-4 w-4" />
              {screenshots.length > 0
                ? `${screenshots.length} file`
                : t("reportIssue.uploadScreenshot", "Upload Screenshot")}
            </label>
            <input
              id="screenshots"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              key={screenshots.length}
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  setScreenshots((prev) => {
                    const combined = [...prev, ...Array.from(files)].slice(0, 3);
                    return combined;
                  });
                }
              }}
            />
            <p className="mt-1 text-xs text-ink-subtle">
              {t("reportIssue.screenshotHint", "Dari galeri, maks 3 foto. Format: JPG, PNG.")}
            </p>
            {screenshots.length > 0 && (
              <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                {screenshots.length}/3 foto
              </p>
            )}
            {screenshots.length >= 3 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Maksimal 3 foto sudah terpenuhi.
              </p>
            )}
            {screenshots.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {screenshots.map((file, idx) => (
                  <div key={idx} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-ink-line bg-slate-100 dark:bg-slate-700">
                    <BlobPreview file={file} alt={`Screenshot ${idx + 1}`} />
                    <button
                      type="button"
                      onClick={() => setScreenshots((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      aria-label="Hapus screenshot"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Kritik & Saran Section */}
        <section className="card space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <MessageSquare className="h-5 w-5 text-brand-600" />
            {t("reportIssue.kritikSaranSection", "Kritik & Saran")}
          </h2>

          <div>
            <label htmlFor="kritik" className="block text-sm font-medium text-ink">
              {t("reportIssue.kritik", "Kritik")}
              <span className="ml-2 text-xs font-normal text-ink-subtle">
                {t("reportIssue.optional", "(opsional)")}
              </span>
            </label>
            <textarea
              id="kritik"
              rows={3}
              value={kritik}
              onChange={(e) => setKritik(e.target.value)}
              placeholder={t("reportIssue.kritikPlaceholder", "Apa yang perlu diperbaiki?")}
              className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="saran" className="block text-sm font-medium text-ink">
              {t("reportIssue.saran", "Saran")}
              <span className="ml-2 text-xs font-normal text-ink-subtle">
                {t("reportIssue.optional", "(opsional)")}
              </span>
            </label>
            <textarea
              id="saran"
              rows={3}
              value={saran}
              onChange={(e) => setSaran(e.target.value)}
              placeholder={t("reportIssue.saranPlaceholder", "Apa saran Anda?")}
              className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <p className="flex items-center gap-1 text-xs text-ink-subtle">
            <MessageSquare className="h-3 w-3" />
            {t("reportIssue.minOne", "Minimal salah satu diisi")}
          </p>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2">
          <Link href="/" className="btn-secondary">
            {t("reportIssue.cancel", "Batal")}
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("reportIssue.sending", "Mengirim...")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("reportIssue.submit", "Kirim")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
