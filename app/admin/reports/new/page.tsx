"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, GripVertical } from "lucide-react";

type CustomField = {
  id: string;
  label: string;
  type: "text" | "longtext" | "number" | "date" | "phone" | "select" | "multiselect" | "photo" | "location" | "link";
  required: boolean;
  value: any;
  file?: File | null;
};

const FIELD_TYPES = [
  { value: "text", label: "Teks Pendek", icon: "Aa" },
  { value: "longtext", label: "Teks Panjang", icon: "¶" },
  { value: "number", label: "Angka", icon: "#" },
  { value: "date", label: "Tanggal", icon: "📅" },
  { value: "phone", label: "Nomor Telepon", icon: "📞" },
  { value: "select", label: "Pilih Satu", icon: "▼" },
  { value: "multiselect", label: "Pilih Banyak", icon: "☑" },
  { value: "photo", label: "Foto", icon: "📷" },
  { value: "location", label: "Lokasi (Lat/Lng)", icon: "📍" },
  { value: "link", label: "Link / URL", icon: "🔗" },
];

export default function AdminNewReportPage() {
  const router = useRouter();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [selectedForm, setSelectedForm] = useState("");
  const [forms, setForms] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formSlug, setFormSlug] = useState("custom");

  useEffect(() => {
    fetch("/api/admin/forms")
      .then(r => r.json())
      .then(data => setForms(data.forms || []))
      .catch(() => {});
  }, []);

  function addField(type: CustomField["type"]) {
    const newField: CustomField = {
      id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      label: "",
      type,
      required: false,
      value: type === "multiselect" ? [] : type === "number" ? "" : "",
    };
    setFields(prev => [...prev, newField]);
  }

  function removeField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id));
  }

  function updateField(id: string, updates: Partial<CustomField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }

  function loadFormTemplate(slug: string) {
    setFormSlug(slug || "custom");
    setSelectedForm(slug);
    if (!slug) { setFields([]); return; }
    
    const form = forms.find(f => f.slug === slug);
    if (!form?.fields) return;
    
    const loaded: CustomField[] = form.fields.map((ff: any) => ({
      id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      label: ff.label,
      type: ff.type,
      required: ff.required,
      value: ff.type === "multiselect" ? [] : "",
    }));
    setFields(loaded);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate required fields
    for (const f of fields) {
      if (f.required && !f.label.trim()) {
        setError("Semua field wajib harus diberi label");
        return;
      }
      if (f.required && f.type !== "photo" && f.type !== "location" && (f.value === "" || f.value === null || f.value === undefined)) {
        setError(`Field "${f.label || '(tanpa label)'}" wajib diisi`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("form_slug", formSlug || "admin-custom");
      fd.append("_submit_time", Date.now().toString());
      fd.append("_website", "");

      let locationLat = "";
      let locationLng = "";

      for (const field of fields) {
        if (field.type === "location") {
          const parts = String(field.value || "").split(",");
          if (parts.length >= 2) {
            locationLat = parts[0].trim();
            locationLng = parts[1].trim();
            fd.append("location_lat", locationLat);
            fd.append("location_lng", locationLng);
          }
          fd.append(field.id, String(field.value || ""));
        } else if (field.type === "photo" && field.file) {
          fd.append(field.id, field.file);
        } else if (field.type === "multiselect" && Array.isArray(field.value)) {
          field.value.forEach((v: string) => fd.append(field.id + "[]", v));
        } else {
          fd.append(field.id, String(field.value || ""));
        }
      }

      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json();

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: csrfData.token ? { "x-csrf-token": csrfData.token } : {},
        body: fd,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || data.details || "Gagal submit");
      }
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="container-page max-w-lg py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-ink">Laporan Berhasil Dibuat!</h1>
        <p className="mt-2 text-ink-muted">Laporan admin telah dikirim.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/admin/reports" className="btn-primary">Lihat Laporan</Link>
          <button onClick={() => { setSuccess(false); setFields([]); setSelectedForm(""); }} className="btn-secondary">Buat Lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/reports" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h2 className="text-xl font-bold text-ink">Tambah Laporan Baru</h2>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pilih template form */}
        <div className="card space-y-3">
          <label className="text-sm font-semibold text-ink">Template Form (opsional)</label>
          <select value={selectedForm} onChange={e => loadFormTemplate(e.target.value)} className="w-full rounded-md border border-ink-line px-3 py-2 text-sm">
            <option value="">-- Custom (isi sendiri) --</option>
            {forms.map(f => <option key={f.slug} value={f.slug}>{f.title}</option>)}
          </select>
          <p className="text-xs text-ink-subtle">Pilih template untuk otomatis mengisi field, atau buat dari kosong.</p>
        </div>

        {/* Dynamic fields */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Fields ({fields.length})</h3>
            <div className="flex flex-wrap gap-1">
              {FIELD_TYPES.map(ft => (
                <button key={ft.value} type="button" onClick={() => addField(ft.value as CustomField["type"])}
                  className="rounded-md border border-ink-line px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition"
                  title={`Tambah ${ft.label}`}
                >
                  {ft.icon} {ft.label}
                </button>
              ))}
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-muted">
              Belum ada field. Klik tombol di atas untuk menambahkan.
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="rounded-lg border border-ink-line bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink-subtle">Field {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-ink-muted">
                        <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="h-3 w-3" />
                        Wajib
                      </label>
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{field.type}</span>
                      <button type="button" onClick={() => removeField(field.id)} className="rounded-md p-1 text-ink-muted hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2">
                    <input type="text" value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} placeholder="Label field" className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm" />

                    {field.type === "text" && (
                      <input type="text" value={field.value || ""} onChange={e => updateField(field.id, { value: e.target.value })} placeholder="Isi teks..." className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm" />
                    )}
                    {field.type === "longtext" && (
                      <textarea value={field.value || ""} onChange={e => updateField(field.id, { value: e.target.value })} rows={2} placeholder="Isi teks panjang..." className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm" />
                    )}
                    {field.type === "number" && (
                      <input type="number" value={field.value || ""} onChange={e => updateField(field.id, { value: e.target.value })} placeholder="0" className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm" />
                    )}
                    {field.type === "date" && (
                      <input type="date" value={field.value || ""} onChange={e => updateField(field.id, { value: e.target.value })} className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm" />
                    )}
                    {field.type === "phone" && (
                      <input type="tel" value={field.value || ""} onChange={e => updateField(field.id, { value: e.target.value })} placeholder="08xxx" className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm" />
                    )}
                    {field.type === "link" && (
                      <input type="url" value={field.value || ""} onChange={e => updateField(field.id, { value: e.target.value })} placeholder="https://..." className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm" />
                    )}
                    {field.type === "location" && (
                      <input type="text" value={field.value || ""} onChange={e => updateField(field.id, { value: e.target.value })} placeholder="-7.5, 110.0 (lintang, bujur)" className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm font-mono" />
                    )}
                    {field.type === "photo" && (
                      <input type="file" accept="image/*" onChange={e => updateField(field.id, { file: e.target.files?.[0] || null })} className="text-sm" />
                    )}
                    {field.type === "select" && (
                      <input type="text" value={field.value || ""} onChange={e => updateField(field.id, { value: e.target.value })} placeholder="Pilihan..." className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm" />
                    )}
                    {field.type === "multiselect" && (
                      <div className="text-sm text-ink-muted">Gunakan field Teks Pendek untuk setiap pilihan</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {fields.length > 0 && (
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {submitting ? "Menyimpan..." : "Simpan Laporan"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
