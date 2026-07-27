"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Upload, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()),
      fetch("/api/forms/project-submission").then(r => r.json()),
    ]).then(([userData, formData]) => {
      if (userData?.user) {
        setUserPoints(userData.user.points || 0);
        setUserRole(userData.user.role || "");
        const profile = userData.user;
        setFieldData({
          A_nama: profile.username || "",
          A_wa: profile.phone || "",
          A_email: profile.email || "",
        });
      }
      if (formData?.form?.fields) setFormFields(formData.form.fields);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function updateField(id: string, value: string) {
    setFieldData(prev => ({ ...prev, [id]: value }));
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>, fieldId: string) {
    updateField(fieldId, e.target.value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const canSubmit = userRole === "admin" || userRole === "field_lead";
    if (!canSubmit) {
      setError("Hanya Field Lead (20.000 poin) dan Admin yang bisa submit proyek.");
      setSubmitting(false);
      return;
    }

    if (photoFiles.length < 3) {
      setError("Wajib upload minimal 3 foto lokasi proyek.");
      setSubmitting(false);
      return;
    }

    try {
      const csrf = await fetch("/api/csrf").then(r => r.json());
      const formData = new FormData();
      for (const [key, val] of Object.entries(fieldData)) {
        formData.set(key, val as string);
      }
      for (const f of photoFiles) formData.append(f.name || "foto", f);
      if (proposalFile) formData.append("proposalFile", proposalFile);
      formData.set("form_slug", "project-submission");

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "x-csrf-token": csrf.token },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Gagal mengirim proposal");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    }
    setSubmitting(false);
  }

  function renderField(f: any) {
    const id = f.fieldId || f.id;
    const val = fieldData[id] || "";
    const label = f.label || id;
    const required = f.required;
    const opts = (() => { try { return JSON.parse(f.options || "[]"); } catch { return f.options || []; } })();

    if (id.startsWith("foto_")) return null; // handled separately
    if (id.startsWith("komitmen_")) return null; // handled separately

    if (f.type === "multiselect" && opts.length > 0) {
      const selected = fieldData[id] ? (fieldData[id] as string).split(",").filter(Boolean) : [];
      return (
        <div key={id}>
          <label className="mb-1 block text-sm font-medium text-ink">{label} {required && <span className="text-red-500">*</span>}</label>
          <div className="mt-1 space-y-1">
            {opts.map((o: string) => (
              <label key={o} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selected.includes(o)} onChange={e => {
                  const newSelected = e.target.checked ? [...selected, o] : selected.filter((s: string) => s !== o);
                  updateField(id, newSelected.join(","));
                }} className="rounded" />
                {o}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (f.type === "select" && opts.length > 0) {
      return (
        <div key={id}>
          <label className="mb-1 block text-sm font-medium text-ink">{label} {required && <span className="text-red-500">*</span>}</label>
          <select value={val} onChange={e => handleSelectChange(e, id)} required={required} className="input w-full">
            <option value="">Pilih...</option>
            {opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    if (f.type === "textarea" || f.type === "longtext") {
      return (
        <div key={id}>
          <label className="mb-1 block text-sm font-medium text-ink">{label} {required && <span className="text-red-500">*</span>}</label>
          <textarea value={val} onChange={e => updateField(id, e.target.value)} required={required} rows={4} className="input w-full" />
        </div>
      );
    }

    if (f.type === "location") {
      return (
        <div key={id}>
          <label className="mb-1 block text-sm font-medium text-ink">{label} {required && <span className="text-red-500">*</span>}</label>
          <input type="text" value={val} onChange={e => updateField(id, e.target.value)} required={required} placeholder="Klik untuk dapatkan koordinat" readOnly className="input w-full bg-slate-50 dark:bg-slate-800" />
          {navigator.geolocation && (
            <button type="button" onClick={() => navigator.geolocation.getCurrentPosition(
              pos => updateField(id, `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
              () => {},
              { enableHighAccuracy: true }
            )} className="mt-1 text-xs text-brand-600 hover:underline">
              📍 Dapatkan Lokasi Saat Ini
            </button>
          )}
        </div>
      );
    }

    if (f.type === "number") {
      return (
        <div key={id}>
          <label className="mb-1 block text-sm font-medium text-ink">{label} {required && <span className="text-red-500">*</span>}</label>
          <input type="number" value={val} onChange={e => updateField(id, e.target.value)} required={required} className="input w-full" />
        </div>
      );
    }

    return (
      <div key={id}>
        <label className="mb-1 block text-sm font-medium text-ink">{label} {required && <span className="text-red-500">*</span>}</label>
        <input type={f.type === "email" ? "email" : "text"} value={val} onChange={e => updateField(id, e.target.value)} required={required} className="input w-full" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-page flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="container-page max-w-2xl py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Proposal Terkirim!</h1>
        <p className="mt-2 text-ink-muted">Tim admin akan mereview proposal Anda dan menghubungi via WA dalam 7 hari.</p>
        <Link href="/" className="btn-primary mt-6 inline-block">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-12">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold text-ink">Pengajuan Proyek</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Ajukan proyek restorasi/konservasi. Dapatkan dukungan dari komunitas SpringHub.
      </p>

      {userRole !== "admin" && userRole !== "field_lead" && (
        <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          ⚠️ Hanya Field Lead (min 20.000 poin) yang bisa submit proyek. Poin kamu: {userPoints}.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {formFields.map(renderField)}

        {/* Foto upload */}
        <fieldset className="rounded-lg border border-ink-line p-4">
          <legend className="text-sm font-semibold text-ink">Foto Lokasi (wajib 3 foto)</legend>
          <p className="mt-1 text-xs text-ink-muted">Ambil 3 foto dari lokasi proyek yang diusulkan.</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <label key={i} className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-line p-4 text-center text-xs text-ink-muted hover:border-brand-300">
                {photoFiles[i] ? (
                  <span className="text-brand-600">{photoFiles[i].name.substring(0, 20)}</span>
                ) : (
                  <>
                    <Upload className="mx-auto h-6 w-6 text-brand-500" />
                    <span className="mt-1">Foto {i + 1}</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const newPhotos = [...photoFiles];
                    newPhotos[i] = file;
                    setPhotoFiles(newPhotos);
                  }
                }} />
              </label>
            ))}
          </div>
          {photoFiles.length < 3 && <p className="mt-2 text-xs text-amber-600">{3 - photoFiles.length} foto lagi diperlukan</p>}
        </fieldset>

        {/* Komitmen */}
        <fieldset className="rounded-lg border border-ink-line p-4">
          <legend className="text-sm font-semibold text-ink">Komitmen</legend>
          <div className="mt-3 space-y-2">
            {[
              { id: "komitmen_lapor", label: "Saya bersedia melaporkan pelaksanaan lewat form SpringHub" },
              { id: "komitmen_review", label: "Saya memahami proposal ditinjau admin dan bisa diminta revisi" },
              { id: "komitmen_publik", label: "Saya menyetujui data proyek tampil di dashboard publik" },
            ].map(c => (
              <label key={c.id} className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={!!fieldData[c.id]} onChange={e => updateField(c.id, e.target.checked ? "true" : "")} className="mt-0.5" required />
                <span className="text-ink">{c.label} <span className="text-red-500">*</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Proposal file */}
        <fieldset className="rounded-lg border border-ink-line p-4">
          <legend className="text-sm font-semibold text-ink">Proposal (opsional)</legend>
          <label className="mt-2 flex cursor-pointer items-center gap-3 text-sm text-ink-muted hover:text-brand-600">
            <Upload className="h-5 w-5" />
            <span>{proposalFile ? proposalFile.name : "Upload PDF proposal"}</span>
            <input type="file" accept=".pdf" className="hidden" onChange={e => setProposalFile(e.target.files?.[0] || null)} />
          </label>
        </fieldset>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle className="mr-1 inline h-4 w-4" /> {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full inline-flex items-center justify-center gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Mengirim..." : "Kirim Proposal"}
        </button>
      </form>
    </div>
  );
}
