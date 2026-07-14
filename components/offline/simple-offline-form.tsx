"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, CheckCircle2, WifiOff, Camera, MapPin, Send, RefreshCw, AlertCircle, XCircle } from "lucide-react";
import { offlineDB } from "@/lib/offline-db";
import { getForm, getFormTitle, type FormField, type FormSchema } from "@/lib/forms";
import { INDONESIAN_PROVINCES } from "@/lib/provinces";

/**
 * SimpleOfflineForm — Simplified PWA offline mode.
 * No map, no tiles, no wizard. Just form + GPS + camera.
 */
export function SimpleOfflineForm({ onExit }: { onExit?: () => void }) {
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fieldData, setFieldData] = useState<Record<string, unknown>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "getting" | "got" | "error">("idle");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ ok: boolean; message: string; time: number } | null>(null);
  const [queueCount, setQueueCount] = useState(0);

  const handleExit = onExit || (() => { if (typeof window !== "undefined") window.location.href = "/"; });

  // ── Sync status (refresh tiap 5 detik) ──────────────────────────
  const refreshSyncStatus = useCallback(async () => {
    const s = offlineDB.getSyncStatus();
    setSyncStatus(s);
    const q = await offlineDB.getAllQueued();
    setQueueCount(q.length);
    // Cek juga pending-reports
    const p = await offlineDB.getAllReports();
    if (p.length > 0) setQueueCount(prev => prev + p.length);
  }, []);

  useEffect(() => {
    refreshSyncStatus();
    const iv = setInterval(refreshSyncStatus, 5000);
    window.addEventListener("online", refreshSyncStatus);
    return () => { clearInterval(iv); window.removeEventListener("online", refreshSyncStatus); };
  }, [refreshSyncStatus]);

  // Real-time timestamp (captured saat komponen mount)
  const [capturedAt] = useState(() => new Date().toISOString());
  const capturedAtDisplay = new Date(capturedAt).toLocaleDateString("id-ID", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // Load cached forms from IndexedDB
  useEffect(() => {
    async function load() {
      try {
        const cached = await offlineDB.getAllForms();
        if (cached && cached.length > 0) {
          const normalized = cached.map((form: any) => ({
            ...form,
            fields: form.fields.map((f: any) => ({
              ...f,
              // DB punya id (UUID) + fieldId (string identifier) — HTML name harus pake fieldId
              id: f.fieldId || String(f.id),
            })),
          }));
          setForms(normalized);

          // Bersihin queue + pending-reports lama yang pake field ID numerik (sebelum fix)
          const oldQueue = await offlineDB.getAllQueued();
          for (const item of oldQueue) {
            if (Object.keys(item.fieldData).some(k => /^\d+$/.test(k))) {
              console.warn("[Offline] Hapus queue item lama (field ID numerik):", item.id);
              await offlineDB.deleteQueued(item.id);
            }
          }
          const oldPending = await offlineDB.getAllReports();
          for (const item of oldPending) {
            if (Object.keys(item.fieldData).some(k => /^\d+$/.test(k))) {
              console.warn("[Offline] Hapus pending-report lama (field ID numerik):", item.id);
              await offlineDB.deleteReport(item.id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load forms:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-capture GPS when form is selected
  useEffect(() => {
    if (selectedForm && typeof navigator !== "undefined" && "geolocation" in navigator) {
      setGpsStatus("getting");
      setGpsCoords(null);

      let gpsResolved = false;
      // Safety timeout — some mobile browsers never fire error callback
      const gpsTimeout = setTimeout(() => {
        if (!gpsResolved) {
          gpsResolved = true;
          setGpsStatus("error");
        }
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (gpsResolved) return;
          gpsResolved = true;
          clearTimeout(gpsTimeout);
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus("got");
        },
        () => {
          if (gpsResolved) return;
          gpsResolved = true;
          clearTimeout(gpsTimeout);
          setGpsStatus("error");
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    }
  }, [selectedForm]);

  function removePhoto(fieldId: string, index: number) {
    setPhotoFiles(prev => {
      const arr = [...(prev[fieldId] || [])];
      arr.splice(index, 1);
      return { ...prev, [fieldId]: arr };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedForm || submitting) return;
    setSubmitError("");

    // ── Validasi: min 3 foto per field photo ─────────────────────────
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    for (const field of selectedForm.fields) {
      if (field.type === "photo") {
        // Cek dari state photoFiles (file yg sudah dipilih)
        const stateCount = (photoFiles[field.id] || []).length;
        // Cek juga dari FormData (file yg mungkin masih ada di input)
        const fdFiles = fd.getAll(field.id).filter(
          (f): f is File => f instanceof File && f.size > 0
        );
        const count = Math.max(stateCount, fdFiles.length);
        if (count < 3) {
          setSubmitError(`Minimal 3 foto untuk "${field.label || field.id}". Saat ini: ${count} foto.`);
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const collected: Record<string, unknown> = {};

      fd.forEach((value, key) => {
        if (value instanceof File) return;
        collected[key] = value;
      });

      // GPS coords dari hidden input (location_lat / location_lng) sudah otomatis
      // dari FormData — tambah anti-spam fields + timestamp
      collected._submit_time = String(Date.now());
      collected._website = "";
      collected._captured_at = capturedAt;

      // Pastikan field date selalu ada (hidden input mungkin gak terkirim)
      if (!collected.date) {
        collected.date = new Date().toISOString().split("T")[0];
      }
      // Pastikan location_lat/lng selalu terisi — jangan sampai "" atau undefined
      if (!collected.location_lat || !collected.location_lng) {
        if (gpsCoords) {
          collected.location_lat = String(gpsCoords.lat);
          collected.location_lng = String(gpsCoords.lng);
        } else {
          collected.location_lat = "0";
          collected.location_lng = "0";
        }
      }
      // Fallback untuk required fields yang mungkin kosong
      for (const key of ["spring_name", "province", "regency", "flow_condition", "water_quality", "cleanliness"]) {
        if (!collected[key] || collected[key] === "") {
          collected[key] = key === "spring_name" ? "Mata Air" : key === "province" ? "Jawa Barat" : "-";
        }
      }

      // Build photo blobs
      const photoBlobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }> = [];
      for (const [fieldId, files] of Object.entries(photoFiles)) {
        for (const file of files) {
          photoBlobs.push({
            fieldId,
            blob: file,
            fileName: file.name,
            mimeType: file.type || "image/jpeg",
          });
        }
      }

      await offlineDB.queueSubmission({
        id: `offline-${selectedForm.slug}-${Date.now()}`,
        formSlug: selectedForm.slug,
        fieldData: collected,
        photoBlobs,
        csrfToken: "",
        createdAt: Date.now(),
        retryCount: 0,
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Offline save failed:", err);
      setSubmitError("Gagal menyimpan. Pastikan penyimpanan perangkat tidak penuh, lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-3 text-sm text-ink-muted">Memuat formulir...</p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <WifiOff className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">Tersimpan!</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Laporan tersimpan di perangkat. Akan terkirim otomatis saat online.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={() => { setSubmitted(false); setSelectedForm(null); setFieldData({}); setPhotoFiles({}); }} className="btn-primary">
              Isi Lagi
            </button>
            <button onClick={handleExit} className="btn-secondary">
              Selesai
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form list (no form selected yet) ─────────────────────────
  if (!selectedForm) {
    return (
      <div className="container-page max-w-2xl py-8">
        <button onClick={handleExit} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Beranda
        </button>

        <h1 className="text-2xl font-extrabold text-ink">Mode Offline</h1>
        <p className="mt-1 text-sm text-ink-muted">Pilih form yang ingin diisi:</p>

        {/* ── Sync Status — kelihatan langsung di HP ────────────── */}
        {queueCount > 0 && (
          <div className={`mt-4 rounded-xl border p-4 ${
            syncStatus?.ok === false
              ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {syncStatus?.ok === false ? (
                  <XCircle className="mt-0.5 h-5 w-5 flex-none text-red-500" />
                ) : (
                  <Loader2 className="mt-0.5 h-5 w-5 flex-none animate-spin text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {syncStatus?.ok === false ? "Sync Gagal" : "Menunggu Sync"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {queueCount} laporan antrean
                    {syncStatus?.ok === false && ` — ${syncStatus.message}`}
                  </p>
                  {syncStatus?.ok === false && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                      Buka console browser (F12) untuk detail error, atau laporkan ke admin.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => { offlineDB.clearSyncStatus(); setSyncStatus(null); window.dispatchEvent(new Event("online")); }}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-ink shadow-sm ring-1 ring-ink-line hover:bg-slate-50 dark:bg-slate-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Sync
              </button>
            </div>
          </div>
        )}

        {forms.length === 0 ? (
          <div className="card mt-6 py-8 text-center">
            <p className="text-sm text-ink-muted">Belum ada form tersimpan. Coba online dulu untuk memuat form.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {forms.map((f) => (
              <button
                key={f.slug}
                onClick={() => setSelectedForm(f)}
                className="card flex items-center gap-3 text-left transition hover:border-brand-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                  <Send className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-ink">{f.title || f.name}</h2>
                  <p className="text-xs text-ink-muted">{f.description || f.slug}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Versi code — biar tau user pake code terbaru ──────────── */}
        <p className="mt-6 text-center text-[10px] text-ink-subtle">
          v{typeof window !== "undefined" ? localStorage.getItem("sw_version") || "?" : "?"}
        </p>
      </div>
    );
  }

  // ── Form fill — prefer dynamic form (dari cache/IndexedDB), fallback static ──
  const formDef = (selectedForm as FormSchema)?.fields ? (selectedForm as FormSchema) : getForm(selectedForm.slug);

  return (
    <div className="container-page max-w-3xl py-8">
      <button
        onClick={() => setSelectedForm(null)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Ganti Form
      </button>

      <h1 className="text-2xl font-extrabold text-ink">{formDef?.title || selectedForm.title}</h1>

      {/* GPS status */}
      <div className={`mt-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
        gpsStatus === "got" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" :
        gpsStatus === "error" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" :
        "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}>
        <MapPin className="h-4 w-4" />
        {gpsStatus === "idle" && "Menunggu GPS..."}
        {gpsStatus === "getting" && "Mendapatkan lokasi..."}
        {gpsStatus === "got" && `Lokasi: ${gpsCoords!.lat.toFixed(5)}, ${gpsCoords!.lng.toFixed(5)}`}
        {gpsStatus === "error" && "Lokasi tidak tersedia. Isi manual jika perlu."}
      </div>

      {/* Timestamp */}
      <div className="mt-3 rounded-md bg-brand-50 px-4 py-3 dark:bg-brand-900/20">
        <p className="text-xs text-ink-subtle">Waktu laporan</p>
        <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
          {capturedAtDisplay} WIB
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card mt-4 space-y-5">
        <input type="hidden" name="form_slug" value={selectedForm.slug} />
        <input type="hidden" name="_captured_at" value={capturedAt} />

        {formDef?.fields.map((field: FormField) => (
          <div key={field.id} className="w-full">
            <label htmlFor={`offline-${field.id}`} className="block text-sm font-medium text-ink">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
              {field.help && <span className="ml-2 text-xs font-normal text-ink-subtle">{field.help}</span>}
            </label>

            {field.type === "text" || field.type === "phone" ? (
              <input
                id={`offline-${field.id}`} name={field.id}
                type={field.type === "phone" ? "tel" : "text"}
                required={field.required}
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
              />
            ) : field.type === "longtext" ? (
              <textarea
                id={`offline-${field.id}`} name={field.id}
                rows={3} required={field.required}
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
              />
            ) : field.type === "number" ? (
              <input
                id={`offline-${field.id}`} name={field.id}
                type="number" min={0} required={field.required}
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
              />
            ) : field.type === "date" ? (
              <>
                <input type="hidden" name={field.id} value={capturedAt?.split("T")[0] || ""} />
                <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  {capturedAtDisplay} WIB
                </p>
              </>
            ) : field.type === "select" ? (
              <select
                id={`offline-${field.id}`} name={field.id}
                required={field.required}
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
              >
                <option value="">Pilih...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === "location" ? (
              <div className="mt-1">
                <input type="hidden" name={`${field.id}_lat`} value={gpsCoords?.lat || ""} />
                <input type="hidden" name={`${field.id}_lng`} value={gpsCoords?.lng || ""} />
                {gpsStatus === "got" ? (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    📍 {gpsCoords!.lat.toFixed(5)}, {gpsCoords!.lng.toFixed(5)}
                  </p>
                ) : gpsStatus === "error" ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Lokasi tidak tersedia. Klik dapatkan lokasi di atas.
                  </p>
                ) : (
                  <p className="text-sm text-ink-muted">Mendapatkan lokasi GPS...</p>
                )}
              </div>
            ) : field.type === "province" ? (
              <select
                id={`offline-${field.id}`} name={field.id}
                required={field.required}
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
              >
                <option value="">Pilih</option>
                {INDONESIAN_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : field.type === "multiselect" ? (
              <fieldset>
                <div className="mt-2 space-y-1.5">
                  {field.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-ink-muted">
                      <input type="checkbox" name={`${field.id}[]`} value={opt}
                        className="h-4 w-4 rounded border-ink-line text-brand-600 focus:ring-brand-500"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : field.type === "photo" ? (
              <div className="mt-1">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <Camera className="h-3.5 w-3.5" />
                  <span>{(photoFiles[field.id] || []).length} / 5 foto</span>
                  {(photoFiles[field.id] || []).length < 3 && (
                    <span className="font-semibold text-amber-600">(minimal 3 foto)</span>
                  )}
                </div>
                {(photoFiles[field.id] || []).length < 5 && (
                  <input
                    key={`${field.id}-${(photoFiles[field.id] || []).length}`}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setPhotoFiles(prev => {
                          const current = prev[field.id] || [];
                          const remaining = 5 - current.length;
                          const toAdd = Array.from(files).slice(0, remaining);
                          return { ...prev, [field.id]: [...current, ...toAdd] };
                        });
                      }
                    }}
                    className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
                  />
                )}
                {/* Photo previews */}
                {(photoFiles[field.id] || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(photoFiles[field.id] || []).map((file, idx) => (
                      <div key={idx} className="relative h-16 w-16 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Foto ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(field.id, idx)}
                          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm text-white shadow-sm"
                          aria-label="Hapus foto"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {(photoFiles[field.id] || []).length >= 5 && (
                  <p className="mt-1 text-xs text-amber-600">Maksimal 5 foto. Hapus yang ada untuk mengganti.</p>
                )}
              </div>
            ) : null}
          </div>
        ))}

        {submitError && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-ink-line pt-4">
          <button type="button" onClick={() => setSelectedForm(null)} className="btn-secondary" disabled={submitting}>
            Batal
          </button>
          <button type="submit" disabled={submitting || gpsStatus === "getting"} className="btn-primary inline-flex items-center gap-2">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
            ) : gpsStatus === "getting" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Tunggu GPS...</>
            ) : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
