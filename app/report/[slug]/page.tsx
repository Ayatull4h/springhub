"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, AlertCircle, Loader2, CheckCircle2, WifiOff, Camera } from "lucide-react";
import { FORMS, getForm, getFormTitle, type FormField } from "@/lib/forms";
import { PROTECTION_RADIUS_KM } from "@/lib/geo";
import { INDONESIAN_PROVINCES } from "@/lib/provinces";
import { useI18n } from "@/lib/i18n";
import { LocationPicker } from "@/components/map/location-picker";
import { useAutoSave } from "@/lib/use-auto-save";
import { offlineDB } from "@/lib/offline-db";

export default function ReportFormPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const slug = params.slug as string;
  const form = getForm(slug);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  // Catat waktu halaman dimuat — bukan waktu submit — untuk anti-spam time gate
  const [pageLoadTime] = useState(() => Date.now());

  // Real-time timestamp (captured saat form dibuka, read-only, gak bisa diubah)
  const [capturedAt] = useState(() => new Date().toISOString());
  const capturedAtDisplay = new Date(capturedAt).toLocaleDateString("id-ID", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // Accumulated photo files per field (max 5 per field)
  const [photoFiles, setPhotoFiles] = useState<Record<string, File[]>>({});

  // ── Auto-Draft State ──────────────────────────────────────────────
  const [fieldData, setFieldData] = useState<Record<string, unknown>>({});
  const [photoBlobs, setPhotoBlobs] = useState<Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }>>([]);
  const [queuedOffline, setQueuedOffline] = useState(false);

  useAutoSave(slug, fieldData, photoBlobs);

  // Sync photoFiles → photoBlobs for auto-save (accumulated, not just last batch)
  useEffect(() => {
    const blobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }> = [];
    for (const [fieldId, files] of Object.entries(photoFiles)) {
      for (const file of files) {
        blobs.push({ fieldId, blob: file, fileName: file.name, mimeType: file.type || "image/jpeg" });
      }
    }
    setPhotoBlobs(blobs);
  }, [photoFiles]);

  useEffect(() => {
    fetch("/api/csrf")
      .then((r) => r.json())
      .then((data) => { if (data.token) setCsrfToken(data.token); })
      .catch(() => {});
  }, []);

  // Dynamic form from DB
  type DbFormData = {
    slug: string;
    title: string;
    description: string;
    pointsOnSubmit: number;
    contributionType: string;
    fields: FormField[];
  };
  const [dbForm, setDbForm] = useState<DbFormData | null>(null);
  const [dbFormLoading, setDbFormLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/forms/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.form) {
          setDbForm({
            slug: data.form.slug,
            title: data.form.title,
            description: data.form.description,
            pointsOnSubmit: data.form.pointsOnSubmit,
            contributionType: data.form.contributionType,
            fields: data.form.fields.map((f: any) => {
              let options: string[];
              try { options = JSON.parse(f.options || "[]"); }
              catch { options = []; }
              const staticForm = getForm(slug);
              const staticField = staticForm?.fields.find(sf => sf.id === f.fieldId);
              if (options.length === 0 && staticField?.options && staticField.options.length > 0) {
                options = staticField.options;
              }
              return {
                id: f.fieldId,
                label: f.label,
                type: f.type,
                required: f.required,
                placeholder: f.placeholder || "",
                help: f.helpText || "",
                options,
              };
            }),
          });
        }
      })
      .catch(() => {})
      .finally(() => setDbFormLoading(false));
  }, [slug]);

  // Gabung field dari DB + statis, urutkan sesuai static schema
  const activeForm = (() => {
    if (!dbForm) return form;
    const staticForm = form;
    if (!staticForm) return dbForm;
    const dbFieldMap = new Map(dbForm.fields.map((f) => [f.id, f]));
    const mergedFields = staticForm.fields.map((sf) => dbFieldMap.get(sf.id) || sf);
    return { ...dbForm, fields: mergedFields };
  })();

  // Show loading while DB form is being fetched (only when static form not found)
  if (dbFormLoading && !form) {
    return (
      <div className="container-page py-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-4 text-ink-muted">Memuat formulir...</p>
      </div>
    );
  }

  if (!activeForm) {
    return (
      <div className="container-page py-12 text-center">
        <h1 className="text-2xl font-bold text-ink">{t("report.formNotFound")}</h1>
        <p className="mt-2 text-ink-muted">{t("report.formNotFoundDesc")}</p>
        <Link href="/" className="btn-primary mt-4 inline-flex">
          {t("report.backToHome")}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeForm) return;
    setError("");
    setLoading(true);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    // Override photo fields with accumulated files from photoFiles state
    for (const [fieldId, files] of Object.entries(photoFiles)) {
      if (files.length === 0) continue;
      formData.delete(fieldId);
      for (const file of files) {
        formData.append(fieldId, file);
      }
    }

    // ── Validasi: min 3 foto per field photo ─────────────────────────
    const photoFieldIds = activeForm.fields
      .filter((f: FormField) => f.type === "photo")
      .map((f: FormField) => f.id);
    for (const fieldId of photoFieldIds) {
      const files = formData.getAll(fieldId).filter(
        (f): f is File => f instanceof File && f.size > 0
      );
      if (files.length < 3) {
        setError(`Minimal 3 foto untuk "${fieldId}". Saat ini: ${files.length} foto.`);
        setLoading(false);
        return;
      }
    }

    formData.set("form_slug", activeForm.slug);
    formData.set("_submit_time", pageLoadTime.toString());
    formData.set("_website", honeypot);
    formData.set("_captured_at", capturedAt);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
        body: formData,
      });

      const data = await res.json();

      if (data.honeypot) {
        setSuccess(true);
        return;
      }

      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : data.details
              ? Object.values(data.details).flat().join(", ")
              : t("report.error");
        setError(errMsg);
        return;
      }

      // ── Upload photos after successful report creation ────────────
      let photoErrors: string[] = [];
      if (data.report?.id) {
        const reportId = data.report.id;
        const photoFieldIds = activeForm.fields
          .filter((f: FormField) => f.type === "photo")
          .map((f: FormField) => f.id);

        for (const fieldId of photoFieldIds) {
          const files = formData.getAll(fieldId);
          for (const file of files) {
            if (file && file instanceof File && file.size > 0) {
              try {
                const photoPayload = new FormData();
                photoPayload.append("photo", file);
                photoPayload.append("field_id", fieldId);

                const photoRes = await fetch(`/api/reports/${reportId}/photos`, {
                  method: "POST",
                  body: photoPayload,
                });
                const photoData = photoRes.ok ? null : await photoRes.json().catch(() => null);
                if (!photoRes.ok) {
                  const serverMsg = photoData?.error || "";
                  photoErrors.push(
                    serverMsg
                      ? `Foto ${(file as File).name}: ${serverMsg}`
                      : `Foto ${(file as File).name} gagal diupload`
                  );
                }
              } catch {
                photoErrors.push(`Foto ${(file as File).name} gagal — cek koneksi`);
              }
            }
          }
        }

      }

      // If photos failed, warn but still show success
      if (photoErrors.length > 0) {
        setError("⚠️ " + photoErrors.join(". ") + " — Laporan tetap tersimpan. Admin akan mereview.");
      }

      setSuccess(true);
      await offlineDB.deleteDraft(`draft-${activeForm.slug}-${pageLoadTime}`);
      formEl.reset();
    } catch {
      // ── Offline fallback: queue submission ────────────────────────
      setQueuedOffline(true);
      setSuccess(true);
      const formBlobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }> = [];
      const photoFieldIds = activeForm.fields.filter((f: FormField) => f.type === "photo").map((f: FormField) => f.id);
      for (const fieldId of photoFieldIds) {
        const files = formData.getAll(fieldId);
        for (const file of files) {
          if (file && file instanceof File && file.size > 0) {
            formBlobs.push({ fieldId, blob: file, fileName: file.name, mimeType: file.type || "image/jpeg" });
          }
        }
      }
      await offlineDB.queueSubmission({
        id: `queue-${activeForm.slug}-${Date.now()}`,
        formSlug: activeForm.slug,
        fieldData: { ...fieldData, _captured_at: capturedAt },
        photoBlobs: formBlobs.length > 0 ? formBlobs : photoBlobs,
        csrfToken,
        createdAt: Date.now(),
        retryCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container-page max-w-lg py-20 text-center">
        {queuedOffline ? (
          <>
            <WifiOff className="mx-auto h-16 w-16 text-amber-500" />
            <h1 className="mt-4 text-2xl font-extrabold text-ink">Tersimpan!</h1>
            <p className="mt-2 text-ink-muted">
              Laporan tersimpan di perangkat. Akan dikirim otomatis saat online.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-extrabold text-ink">{t("report.reportSubmitted")}</h1>
            <p className="mt-2 text-ink-muted">{t("report.thankYou")}</p>
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-left">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            {t("report.backToHome")}
          </Link>
          <button
            onClick={() => { setSuccess(false); setQueuedOffline(false); }}
            className="btn-secondary"
          >
            {t("report.submitAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-line bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-slate-50 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{getFormTitle(activeForm.slug, activeForm.title, t)}</h1>
      <p className="mt-2 text-ink-muted">{activeForm.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          <Sparkles className="h-3 w-3" />{t("report.pointsOnSubmit", { pts: String(activeForm.pointsOnSubmit) })}
        </span>
        <span className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700">
          <ShieldCheck className="h-3 w-3" />
          {t("report.locationSnapped", { radius: String(PROTECTION_RADIUS_KM) })}
        </span>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="card mt-6 space-y-5 w-full max-w-full"
        onChange={(e) => {
          const formEl = e.currentTarget;
          const fd = new FormData(formEl);
          const collected: Record<string, unknown> = {};
          fd.forEach((value, key) => {
            if (key === "_website" || key === "form_slug" || key === "_submit_time") return;
            if (value instanceof File) {
              if (value.size > 0) collected[key] = value.name;
              return;
            }
            collected[key] = value;
          });
          setFieldData(collected);
        }}
      >
        {/* Honeypot */}
        <div className="hidden" aria-hidden>
          <label htmlFor="_website">{t("form.honeypot")}</label>
          <input
            id="_website"
            name="_website"
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="w-full max-w-full overflow-hidden space-y-5">
          {/* Real-time timestamp — read-only, auto-captured */}
          <div className="rounded-md bg-brand-50 px-4 py-3 dark:bg-brand-900/20">
            <label className="block text-sm font-medium text-ink">
              {t("form.timestamp") || "Waktu Laporan"}
            </label>
            <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
              {capturedAtDisplay} WIB
            </p>
            <p className="mt-0.5 text-[11px] text-ink-subtle">
              Waktu dicatat otomatis saat form dibuka, tidak bisa diubah.
            </p>
          </div>

          {activeForm.fields.map((field: FormField) => (
            field.type === "date" ? (
              <div key={field.id} className="hidden" aria-hidden>
                <input type="hidden" name={field.id} value={capturedAt.split("T")[0]} />
              </div>
            ) : (
              <FieldWrapper key={field.id}>
                <FieldRenderer field={field} capturedAtDisplay={capturedAtDisplay} photoFiles={photoFiles} setPhotoFiles={setPhotoFiles} />
              </FieldWrapper>
            )
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-ink-line pt-4">
          <Link href="/#map" className="btn-secondary">
            {t("report.cancel")}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("report.submitting")}
              </>
            ) : (
              t("report.submitReport")
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldWrapper({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-full overflow-hidden">{children}</div>;
}

function FieldRenderer({
  field,
  capturedAtDisplay,
  photoFiles,
  setPhotoFiles,
}: {
  field: FormField;
  capturedAtDisplay?: string;
  photoFiles?: Record<string, File[]>;
  setPhotoFiles?: React.Dispatch<React.SetStateAction<Record<string, File[]>>>;
}) {
  const { t } = useI18n();
  const required = field.required ? (
    <span className="ml-1 text-red-500" aria-hidden>
      *
    </span>
  ) : null;

  const labelEl = (
    <label htmlFor={field.id} className="block text-sm font-medium text-ink">
      {field.label}
      {required}
      {field.help && (
        <span className="ml-2 text-xs font-normal text-ink-subtle">{field.help}</span>
      )}
    </label>
  );

  switch (field.type) {
    case "text":
    case "phone":
      return (
        <div>
          {labelEl}
          <input
            id={field.id}
            name={field.id}
            type={field.type === "phone" ? "tel" : "text"}
            required={field.required}
            placeholder={field.placeholder}
            pattern={field.type === "phone" ? "^(0[1-9]\\d{8,11}|\\+62\\d{8,13})$" : undefined}
            title={t("form.phone.tip")}
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
          />
        </div>
      );
    case "longtext":
      return (
        <div>
          {labelEl}
          <textarea
            id={field.id}
            name={field.id}
            rows={4}
            required={field.required}
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
          />
        </div>
      );
    case "number":
      return (
        <div>
          {labelEl}
          <input
            id={field.id}
            name={field.id}
            type="number"
            min={0}
            required={field.required}
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
          />
        </div>
      );
    case "date":
      // ⏱ Diganti dengan timestamp real-time — read-only
      return (
        <div>
          {labelEl}
          <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
            {capturedAtDisplay || "—"} WIB
          </p>
          <p className="mt-0.5 text-[11px] text-ink-subtle">
            Waktu otomatis — tidak bisa diubah
          </p>
        </div>
      );
    case "link":
      return (
        <div>
          {labelEl}
          <input
            id={field.id}
            name={field.id}
            type="url"
            required={field.required}
            placeholder={field.placeholder || "https://..."}
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
          />
        </div>
      );
    case "select":
      return (
        <div>
          {labelEl}
          <select
            id={field.id}
            name={field.id}
            required={field.required}
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
          >
            <option value="">{t("form.select.placeholder")}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    case "province":
      return (
        <div>
          {labelEl}
          <select
            id={field.id}
            name={field.id}
            required={field.required}
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
          >
            <option value="">{t("form.select.placeholder")}</option>
            {INDONESIAN_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      );
    case "multiselect":
      return (
        <fieldset>
          <legend className="text-sm font-medium text-ink">
            {field.label}
            {required}
          </legend>
          <div className="mt-2 space-y-1.5">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  name={`${field.id}[]`}
                  value={opt}
                  className="h-4 w-4 rounded border-ink-line text-brand-600 focus:ring-brand-500"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      );
    case "photo":
      const accumulated = photoFiles?.[field.id] ?? [];
      const currentCount = accumulated.length;
      const maxReached = currentCount >= 5;
      return (
        <div>
          {labelEl}
          {/* Photo count indicator */}
          <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
            <Camera className="h-3.5 w-3.5" />
            <span>{currentCount} / 5 foto</span>
            {currentCount < 3 && (
              <span className="font-semibold text-amber-600">(minimal 3 foto)</span>
            )}
            {maxReached && (
              <span className="font-semibold text-amber-600">(maksimal 5 foto)</span>
            )}
          </div>

          {/* Photo previews with delete button */}
          {currentCount > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {accumulated.map((file, idx) => (
                <div key={idx} className="group relative h-16 w-16 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Foto ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFiles?.(prev => {
                        const arr = [...(prev[field.id] || [])];
                        arr.splice(idx, 1);
                        return { ...prev, [field.id]: arr };
                      });
                    }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Hapus foto ${idx + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* File input — tambah foto, akumulasi dengan existing */}
          {!maxReached && (
            <input
              key={`${field.id}-${currentCount}`}
              id={field.id}
              name={field.id}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              required={field.required && currentCount === 0}
              onChange={(e) => {
                const selectedFiles = e.target.files;
                if (selectedFiles && selectedFiles.length > 0) {
                  setPhotoFiles?.(prev => {
                    const files = prev[field.id] || [];
                    const remaining = 5 - files.length;
                    const newFiles = Array.from(selectedFiles).slice(0, remaining);
                    return { ...prev, [field.id]: [...files, ...newFiles] };
                  });
                }
              }}
              className="mt-2 block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/30"
            />
          )}
          {maxReached && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Maksimal 5 foto. Hapus yang ada untuk mengganti.
            </p>
          )}
        </div>
      );
    case "location":
      return (
        <div>
          {labelEl}
          <div className="mt-1">
            <LocationPicker
              name={field.id === "location" ? "location" : field.id}
              required={field.required}
            />
          </div>
        </div>
      );
    default:
      return null;
  }
}
