"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type FormField = {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  options: string;
};

type FormItem = {
  id: string;
  slug: string;
  title: string;
  fields: FormField[];
};

export default function AdminNewReportPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormItem[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  useEffect(() => {
    fetch("/api/admin/forms")
      .then(r => r.json())
      .then(data => setForms(data.forms || []))
      .catch(() => setError("Gagal memuat form"))
      .finally(() => setLoading(false));
  }, []);

  function handleFormSelect(slug: string) {
    setSelectedForm(slug);
    const form = forms.find(f => f.slug === slug);
    setFields(form?.fields || []);
    setFormData({});
    setFiles({});
    setLat("");
    setLng("");
  }

  function updateField(fieldId: string, value: any) {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }

  function handleFile(fieldId: string, file: File | null) {
    if (file) {
      setFiles(prev => ({ ...prev, [fieldId]: file }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedForm) return;
    setError("");
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("form_slug", selectedForm);
      fd.append("_submit_time", Date.now().toString());
      fd.append("_website", "");

      Object.entries(formData).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          fd.append(key, String(val));
        }
      });

      if (lat) fd.append("location_lat", lat);
      if (lng) fd.append("location_lng", lng);

      Object.entries(files).forEach(([fieldId, file]) => {
        fd.append(fieldId, file);
      });

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
    } catch (err) {
      setError("Kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>;
  }

  if (success) {
    return (
      <div className="container-page max-w-lg py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-ink">Laporan Berhasil Dibuat!</h1>
        <p className="mt-2 text-ink-muted">Laporan admin telah dikirim dan masuk ke review.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/admin/reports" className="btn-primary">Lihat Laporan</Link>
          <button onClick={() => { setSuccess(false); setSelectedForm(""); }} className="btn-secondary">Buat Lagi</button>
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
        {/* Pilih form */}
        <div className="card space-y-3">
          <label className="text-sm font-semibold text-ink">Pilih Jenis Laporan</label>
          <select
            value={selectedForm}
            onChange={(e) => handleFormSelect(e.target.value)}
            className="w-full rounded-md border border-ink-line px-3 py-2 text-sm"
            required
          >
            <option value="">-- Pilih Form --</option>
            {forms.map(f => (
              <option key={f.slug} value={f.slug}>{f.title}</option>
            ))}
          </select>
        </div>

        {/* Fields dinamis */}
        {fields.length > 0 && (
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-ink">Form {forms.find(f => f.slug === selectedForm)?.title}</h3>
            {fields.map(field => (
              <div key={field.fieldId}>
                <label className="text-xs font-medium text-ink-muted">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === "text" && (
                  <input type="text" value={formData[field.fieldId] || ""} onChange={e => updateField(field.fieldId, e.target.value)} placeholder={field.placeholder} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                )}

                {field.type === "longtext" && (
                  <textarea value={formData[field.fieldId] || ""} onChange={e => updateField(field.fieldId, e.target.value)} rows={3} placeholder={field.placeholder} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                )}

                {field.type === "number" && (
                  <input type="number" value={formData[field.fieldId] || ""} onChange={e => updateField(field.fieldId, e.target.value)} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                )}

                {field.type === "date" && (
                  <input type="date" value={formData[field.fieldId] || ""} onChange={e => updateField(field.fieldId, e.target.value)} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                )}

                {field.type === "phone" && (
                  <input type="tel" value={formData[field.fieldId] || ""} onChange={e => updateField(field.fieldId, e.target.value)} placeholder="08xxx" className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                )}

                {field.type === "select" && (
                  <select value={formData[field.fieldId] || ""} onChange={e => updateField(field.fieldId, e.target.value)} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm">
                    <option value="">-- Pilih --</option>
                    {(() => { try { return JSON.parse(field.options); } catch { return []; } })().map((opt: string, i: number) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {field.type === "multiselect" && (
                  <div className="mt-1 space-y-1">
                    {(() => { try { return JSON.parse(field.options); } catch { return []; } })().map((opt: string, i: number) => (
                      <label key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={(formData[field.fieldId] || []).includes(opt)} onChange={e => {
                          const current = formData[field.fieldId] || [];
                          const next = e.target.checked ? [...current, opt] : current.filter((v: string) => v !== opt);
                          updateField(field.fieldId, next);
                        }} className="h-4 w-4 rounded border-ink-line" />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {field.type === "link" && (
                  <input type="url" value={formData[field.fieldId] || ""} onChange={e => updateField(field.fieldId, e.target.value)} placeholder="https://..." className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                )}

                {field.type === "photo" && (
                  <input type="file" accept="image/*" onChange={e => handleFile(field.fieldId, e.target.files?.[0] || null)} className="mt-1 text-sm" />
                )}

                {field.type === "location" && (
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input type="text" value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude" className="rounded-md border border-ink-line px-3 py-2 text-sm" />
                    <input type="text" value={lng} onChange={e => setLng(e.target.value)} placeholder="Longitude" className="rounded-md border border-ink-line px-3 py-2 text-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedForm && (
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
