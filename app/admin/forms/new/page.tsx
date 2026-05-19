"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const CONTRIBUTION_TYPES = [
  { value: "monitoring", label: "Monitoring" },
  { value: "restoration", label: "Restorasi" },
  { value: "trench", label: "Pengembangan Parit" },
  { value: "tree_planting", label: "Penanaman Pohon" },
  { value: "seedling_stock", label: "Stok Bibit" },
];

export default function AdminNewFormPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsOnSubmit: 25,
    contributionType: "monitoring",
  });

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleChange(value: string) {
    setForm((prev) => ({ ...prev, title: value }));
    if (autoSlug) {
      setSlug(generateSlug(value));
    }
  }

  function handleGenerateSlug() {
    const newSlug = generateSlug(form.title);
    setSlug(newSlug);
    setAutoSlug(false);
  }

  function updateForm(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Judul form wajib diisi");
      return;
    }
    const finalSlug = slug || generateSlug(form.title);
    if (!finalSlug) {
      setError("Slug wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: finalSlug,
          title: form.title.trim(),
          description: form.description.trim(),
          pointsOnSubmit: form.pointsOnSubmit,
          contributionType: form.contributionType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/admin/forms/${data.form.id}`);
      } else {
        setError(data.error || "Gagal membuat form");
      }
    } catch {
      setError("Kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/forms"
          className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-ink">Form Baru</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Buat form laporan baru untuk relawan
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Dasar */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-ink">
              Informasi Dasar
            </h3>
          </div>

          {/* Title + Slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Judul <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Monitoring Mata Air"
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Slug
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setAutoSlug(false);
                  }}
                  placeholder="monitoring-mata-air"
                  className="flex-1 rounded-md border border-ink-line px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="inline-flex items-center gap-1 rounded-md border border-ink-line px-3 py-2 text-xs font-medium text-ink-muted hover:bg-slate-100"
                  title="Generate slug dari judul"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Buat
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">
              Deskripsi
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="Deskripsi singkat tentang form ini..."
              rows={3}
              className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          {/* Points + Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Poin per Submit
              </label>
              <input
                type="number"
                value={form.pointsOnSubmit}
                onChange={(e) =>
                  updateForm("pointsOnSubmit", parseInt(e.target.value) || 0)
                }
                min={0}
                max={1000}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <p className="text-[10px] text-ink-subtle">
                Jumlah poin yang didapat relawan saat submit laporan
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Tipe Kontribusi
              </label>
              <select
                value={form.contributionType}
                onChange={(e) => updateForm("contributionType", e.target.value)}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {CONTRIBUTION_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-ink-subtle">
                Jenis kontribusi untuk kategorisasi laporan
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="font-medium">Langkah selanjutnya</p>
          <p className="mt-1 text-brand-700">
            Setelah form dibuat, Anda akan diarahkan ke halaman pengelolaan
            field untuk menambahkan kolom input yang dibutuhkan.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/forms"
            className="rounded-md border border-ink-line px-4 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Buat Form
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
