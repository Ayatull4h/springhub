"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { FORMS, getForm, type FormField } from "@/lib/forms";
import { PROTECTION_RADIUS_KM } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { LocationPicker } from "@/components/map/location-picker";

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

  useEffect(() => {
    fetch("/api/csrf")
      .then((r) => r.json())
      .then((data) => { if (data.token) setCsrfToken(data.token); })
      .catch(() => {});
  }, []);

  // Dynamic form from DB
  const [dbForm, setDbForm] = useState<any>(null);
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
            fields: data.form.fields.map((f: any) => ({
              id: f.fieldId,
              label: f.label,
              type: f.type,
              required: f.required,
              placeholder: f.placeholder || "",
              help: f.helpText || "",
              options: (() => {
                try { return JSON.parse(f.options || "[]"); }
                catch { return []; }
              })(),
            })),
          });
        }
      })
      .catch(() => {})
      .finally(() => setDbFormLoading(false));
  }, [slug]);

  const activeForm = dbForm ?? form;

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

    formData.set("form_slug", activeForm.slug);
    formData.set("_submit_time", pageLoadTime.toString());
    formData.set("_website", honeypot);

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
      if (data.report?.id) {
        const photoFieldIds = activeForm.fields
          .filter((f: FormField) => f.type === "photo")
          .map((f: FormField) => f.id);

        for (const fieldId of photoFieldIds) {
          const file = formData.get(fieldId);
          if (file && file instanceof File && file.size > 0) {
            try {
              const photoPayload = new FormData();
              photoPayload.append("photo", file);
              photoPayload.append("field_id", fieldId);

              await fetch(`/api/reports/${data.report.id}/photos`, {
                method: "POST",
                body: photoPayload,
              });
            } catch {
              // Don't block on photo upload failure — report is already saved
              console.warn(`Photo upload failed for field "${fieldId}"`);
            }
          }
        }
      }

      setSuccess(true);
      formEl.reset();
    } catch {
      setError(t("report.errorNetwork"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container-page max-w-lg py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-ink">{t("report.reportSubmitted")}</h1>
        <p className="mt-2 text-ink-muted">{t("report.thankYou")}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            {t("report.backToHome")}
          </Link>
          <button
            onClick={() => setSuccess(false)}
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-line bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-slate-50 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{activeForm.title}</h1>
      <p className="mt-2 text-ink-muted">{activeForm.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="chip bg-brand-50 text-brand-700">
          <Sparkles className="h-3 w-3" />{t("report.pointsOnSubmit", { pts: String(activeForm.pointsOnSubmit) })}
        </span>
        <span className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-200">
          <ShieldCheck className="h-3 w-3" />
          {t("report.locationSnapped", { radius: String(PROTECTION_RADIUS_KM) })}
        </span>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="card mt-6 space-y-5"
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

        {activeForm.fields.map((field: FormField) => (
          <FieldRenderer key={field.id} field={field} />
        ))}

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

function FieldRenderer({ field }: { field: FormField }) {
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
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      );
    case "date":
      return (
        <div>
          {labelEl}
          <input
            id={field.id}
            name={field.id}
            type="date"
            required={field.required}
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
      const PROVINSI = [
        "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi",
        "Sumatera Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung",
        "Kepulauan Riau", "DKI Jakarta", "Jawa Barat", "Jawa Tengah",
        "DI Yogyakarta", "Jawa Timur", "Banten", "Bali",
        "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat",
        "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur",
        "Kalimantan Utara", "Sulawesi Utara", "Sulawesi Tengah",
        "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo",
        "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua",
        "Papua Barat", "Papua Selatan", "Papua Tengah", "Papua Pegunungan",
        "Papua Barat Daya",
      ];
      return (
        <div>
          {labelEl}
          <select
            id={field.id}
            name={field.id}
            required={field.required}
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">{t("form.select.placeholder")}</option>
            {PROVINSI.map((p) => (
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
      return (
        <div>
          {labelEl}
          <input
            id={field.id}
            name={field.id}
            type="file"
            accept="image/*"
            capture="environment"
            required={field.required}
            className="mt-1 block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
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
