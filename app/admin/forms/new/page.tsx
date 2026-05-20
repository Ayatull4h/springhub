"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, Trash2, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const FIELD_TYPES = [
  { value: "text", label: "Teks Pendek", icon: "Aa" },
  { value: "longtext", label: "Teks Panjang", icon: "¶" },
  { value: "number", label: "Angka", icon: "#" },
  { value: "date", label: "Tanggal", icon: "📅" },
  { value: "phone", label: "Telepon", icon: "📞" },
  { value: "select", label: "Pilih Satu", icon: "▼" },
  { value: "multiselect", label: "Pilih Banyak", icon: "☑" },
  { value: "photo", label: "Foto", icon: "📷" },
  { value: "location", label: "Lokasi", icon: "📍" },
  { value: "link", label: "Link/URL", icon: "🔗" },
  { value: "province", label: "Provinsi", icon: "🗺️" },
];

const CONTRIBUTION_TYPES = [
  { value: "monitoring", label: "Monitoring" },
  { value: "restoration", label: "Restorasi" },
  { value: "trench", label: "Pengembangan Parit" },
  { value: "tree_planting", label: "Penanaman Pohon" },
  { value: "seedling_stock", label: "Stok Bibit" },
];

type FieldDef = {
  id: string;
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  helpText: string;
  options: string;
};

export default function AdminNewFormPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  const [meta, setMeta] = useState({
    title: "",
    description: "",
    pointsOnSubmit: 25,
    contributionType: "monitoring",
  });

  const [fields, setFields] = useState<FieldDef[]>([]);

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function handleTitleChange(value: string) {
    setMeta(prev => ({ ...prev, title: value }));
    if (autoSlug) setSlug(generateSlug(value));
  }

  function addField(type: string) {
    const fieldId = `field_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    setFields(prev => [...prev, {
      id: fieldId,
      fieldId,
      label: "",
      type,
      required: false,
      placeholder: "",
      helpText: "",
      options: "[]",
    }]);
  }

  function removeField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id));
  }

  function updateField(id: string, updates: Partial<FieldDef>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!meta.title.trim()) { setError("Judul form wajib diisi"); return; }
    const finalSlug = slug || generateSlug(meta.title);
    if (!finalSlug) { setError("Slug wajib diisi"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: finalSlug,
          title: meta.title.trim(),
          description: meta.description.trim(),
          pointsOnSubmit: meta.pointsOnSubmit,
          contributionType: meta.contributionType,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal membuat form"); setSaving(false); return; }

      for (const field of fields) {
        if (!field.label.trim()) continue;
        const options = (field.type === "select" || field.type === "multiselect")
          ? field.options
          : "[]";
        await fetch(`/api/admin/forms/${data.form.id}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldId: field.fieldId,
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder,
            helpText: field.helpText,
            options,
          }),
        });
      }

      router.push(`/admin/forms/${data.form.id}`);
    } catch {
      setError("Kesalahan jaringan");
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/forms" className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-ink">Form Baru</h2>
          <p className="mt-0.5 text-sm text-ink-muted">Buat form laporan baru untuk relawan</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meta info */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-ink">Informasi Form</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">Judul <span className="text-red-500">*</span></label>
              <input type="text" value={meta.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Monitoring Mata Air" className="w-full rounded-md border border-ink-line px-3 py-2 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">Slug</label>
              <input type="text" value={slug} onChange={e => { setSlug(e.target.value); setAutoSlug(false); }} placeholder="monitoring-mata-air" className="w-full rounded-md border border-ink-line px-3 py-2 text-sm font-mono" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">Deskripsi</label>
            <textarea value={meta.description} onChange={e => setMeta(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">Poin per Submit</label>
              <input type="number" value={meta.pointsOnSubmit} onChange={e => setMeta(prev => ({ ...prev, pointsOnSubmit: parseInt(e.target.value) || 0 }))} min={0} className="w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">Tipe Kontribusi</label>
              <select value={meta.contributionType} onChange={e => setMeta(prev => ({ ...prev, contributionType: e.target.value }))} className="w-full rounded-md border border-ink-line px-3 py-2 text-sm">
                {CONTRIBUTION_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Fields builder - flexible like new report */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Fields ({fields.length})</h3>
            <div className="flex flex-wrap gap-1">
              {FIELD_TYPES.map(ft => (
                <button key={ft.value} type="button" onClick={() => addField(ft.value)}
                  className="rounded-md border border-ink-line px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-brand-50 hover:text-brand-700 transition">
                  {ft.icon} {ft.label}
                </button>
              ))}
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-muted">Belum ada field. Klik tombol di atas untuk menambahkan.</div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="rounded-lg border border-ink-line bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink-subtle">Field {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{field.type}</span>
                      <button type="button" onClick={() => removeField(field.id)} className="rounded-md p-1 text-ink-muted hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input type="text" value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} placeholder="Label field" className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm" />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-ink-muted">
                        <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="h-3 w-3" />
                        Wajib
                      </label>
                      <input type="text" value={field.placeholder} onChange={e => updateField(field.id, { placeholder: e.target.value })} placeholder="Placeholder" className="flex-1 rounded-md border border-ink-line px-2 py-1 text-xs" />
                    </div>
                  </div>

                  {(field.type === "select" || field.type === "multiselect") && (
                    <textarea value={field.options === "[]" ? "" : (() => { try { return JSON.parse(field.options).join("\n"); } catch { return field.options; } })()}
                      onChange={e => updateField(field.id, { options: JSON.stringify(e.target.value.split("\n").filter(o => o.trim())) })}
                      rows={3} placeholder="Opsi (satu per baris)" className="mt-2 w-full rounded-md border border-ink-line px-2 py-1 text-xs" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/forms" className="rounded-md border border-ink-line px-4 py-2 text-sm text-ink-muted hover:bg-slate-100">Batal</Link>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Buat Form"}
          </button>
        </div>
      </form>
    </div>
  );
}
