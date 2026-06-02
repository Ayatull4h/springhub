"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  WifiOff,
  Shield,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileCheck,
  Expand,
  Minimize,
  Download,
  Layers,
  Grid3X3,
} from "lucide-react";
import dynamic from "next/dynamic";
import { offlineDB, type FormDefinition } from "@/lib/offline-db";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type SetupStep = "tutorial" | "form-select" | "area-select" | "downloading" | "ready";

type FormItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pointsOnSubmit: number;
  isActive: boolean;
  fields: Array<{
    fieldId: string;
    label: string;
    type: string;
    required: boolean;
  }>;
};

// ─── Lazy load map (SSR=false) ─────────────────────────────────────────────
const SetupMap = dynamic(
  () => import("./setup-map").then((m) => m.SetupMap),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-ink-muted">Loading map...</div> }
);

// ─── Props ──────────────────────────────────────────────────────────────────

type OfflineSetupProps = {
  onComplete: () => void;
  mode: "full" | "save-only";
};

// ─── Component ─────────────────────────────────────────────────────────────

export function OfflineSetup({ onComplete, mode }: OfflineSetupProps) {
  const [step, setStep] = useState<SetupStep>("tutorial");
  const [agreed, setAgreed] = useState(false);

  // Form selection
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());

  // Area selection (for full mode)
  const [selectedArea, setSelectedArea] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  // Download progress
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [downloadError, setDownloadError] = useState("");
  const [hasSetupBefore, setHasSetupBefore] = useState(false);

  // ── Check if setup was done before ─────────────────────────────────────────
  useEffect(() => {
    offlineDB.getAllForms().then((cached) => {
      if (cached.length > 0) setHasSetupBefore(true);
    });
  }, []);

  // ── Fetch forms from admin API ────────────────────────────────────────────
  useEffect(() => {
    if (step !== "form-select") return;

    fetch("/api/admin/forms")
      .then((r) => r.json())
      .then((data) => {
        const activeForms = (data.forms ?? []).filter((f: FormItem) => f.isActive);
        setForms(activeForms);
        // Auto-select all if first time
        if (activeForms.length > 0 && !hasSetupBefore) {
          setSelectedForms(new Set(activeForms.map((f: FormItem) => f.slug)));
        }
      })
      .catch(() => {
        // Fallback to cached forms if offline
        offlineDB.getAllForms().then((cached) => {
          if (cached.length > 0) {
            setForms(
              cached.map((f) => ({
                id: f.slug,
                slug: f.slug,
                title: f.title,
                description: f.description,
                pointsOnSubmit: f.pointsOnSubmit,
                isActive: true,
                fields: f.fields.map((ff) => ({
                  fieldId: ff.id,
                  label: ff.label,
                  type: ff.type,
                  required: ff.required,
                })),
              }))
            );
          }
        });
      })
      .finally(() => setLoadingForms(false));
  }, [step, hasSetupBefore]);

  // ── Toggle form selection ─────────────────────────────────────────────────
  const toggleForm = (slug: string) => {
    setSelectedForms((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  // ── Handle step transitions ───────────────────────────────────────────────
  const handleNextFromTutorial = () => {
    if (!agreed) return;
    setStep("form-select");
  };

  const handleNextFromFormSelect = () => {
    if (selectedForms.size === 0) return;
    if (mode === "save-only") {
      // Save-only mode: skip area selection, cache forms, go to ready
      cacheFormsAndFinish();
      return;
    }
    setStep("area-select");
  };

  // ── Handle area selection done ────────────────────────────────────────────
  const handleAreaSelected = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setSelectedArea(bounds);
  }, []);

  // ── Cache forms + start download ──────────────────────────────────────────
  const cacheFormsAndFinish = useCallback(async () => {
    setStep("downloading");
    setDownloadProgress({ current: 0, total: 1 });

    try {
      // Cache selected form definitions to IndexedDB
      const formDefs: FormDefinition[] = forms
        .filter((f) => selectedForms.has(f.slug))
        .map((f) => ({
          slug: f.slug,
          title: f.title,
          description: f.description,
          pointsOnSubmit: f.pointsOnSubmit,
          contributionType: f.slug,
          fields: f.fields.map((ff) => ({
            id: ff.fieldId,
            label: ff.label,
            type: ff.type,
            required: ff.required,
            placeholder: "",
            help: "",
            options: [],
          })),
          cachedAt: Date.now(),
        }));

      await offlineDB.saveForms(formDefs);

      // In full mode, also pre-cache map tiles
      if (mode === "full" && selectedArea) {
        await downloadTilesForArea(selectedArea);
      }

      setDownloadProgress({ current: 1, total: 1 });
      setTimeout(() => setStep("ready"), 500);
    } catch (err) {
      setDownloadError("Gagal menyimpan data. Coba lagi.");
    }
  }, [forms, selectedForms, mode, selectedArea]);

  // ── Download tiles ────────────────────────────────────────────────────────
  const downloadTilesForArea = async (bounds: { north: number; south: number; east: number; west: number }) => {
    const zoomLevels = [12, 13, 14, 15];

    // Calculate all tile URLs
    const tileUrls: string[] = [];

    for (const z of zoomLevels) {
      const xMin = Math.floor(((bounds.west + 180) / 360) * Math.pow(2, z));
      const xMax = Math.floor(((bounds.east + 180) / 360) * Math.pow(2, z));
      const yMin = Math.floor(
        ((1 - Math.log(Math.tan((bounds.north * Math.PI) / 180) + 1 / Math.cos((bounds.north * Math.PI) / 180)) / Math.PI) /
          2) *
          Math.pow(2, z)
      );
      const yMax = Math.floor(
        ((1 - Math.log(Math.tan((bounds.south * Math.PI) / 180) + 1 / Math.cos((bounds.south * Math.PI) / 180)) / Math.PI) /
          2) *
          Math.pow(2, z)
      );

      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
          tileUrls.push(
            `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`
          );
        }
      }
    }

    if (tileUrls.length === 0) return;

    setDownloadProgress({ current: 0, total: tileUrls.length });

    // Send tiles to SW for caching in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < tileUrls.length; i += BATCH_SIZE) {
      const batch = tileUrls.slice(i, i + BATCH_SIZE);

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "precache-tiles",
          tiles: batch,
        });
      }

      // Also save to tile manifest
      await offlineDB.saveTileRecords(
        batch.map((url) => {
          const parts = url.replace("https://a.tile.openstreetmap.org/", "").replace(".png", "").split("/");
          return {
            url,
            z: parseInt(parts[0], 10),
            x: parseInt(parts[1], 10),
            y: parseInt(parts[2], 10),
            cachedAt: Date.now(),
          };
        })
      );

      setDownloadProgress({ current: Math.min(i + BATCH_SIZE, tileUrls.length), total: tileUrls.length });
    }
  };

  // ── Start survey ─────────────────────────────────────────────────────────
  const handleStartSurvey = () => {
    // Create offline session on server
    fetch("/api/offline/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedForms: Array.from(selectedForms),
        mode,
      }),
    }).catch(() => {
      // Silently fail — session is optional, survey works offline
    });

    onComplete();
  };

  // ── Render steps ─────────────────────────────────────────────────────────

  if (step === "downloading") {
    const pct = downloadProgress.total > 0
      ? Math.round((downloadProgress.current / downloadProgress.total) * 100)
      : 0;

    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600 dark:text-brand-400" />
        <p className="mt-4 text-lg font-semibold text-ink">Menyiapkan mode offline...</p>
        {downloadProgress.total > 1 && (
          <div className="mt-4 w-full max-w-xs">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Mengunduh tile peta...</span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        {downloadError && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {downloadError}
          </div>
        )}
      </div>
    );
  }

  if (step === "ready") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">Siap! Mode Offline Aktif</h2>
        <p className="mt-2 text-sm text-ink-muted text-center max-w-sm">
          {mode === "full"
            ? "Map, GPS tracking, dan form sudah siap. Kamu bisa survey tanpa sinyal."
            : "Form sudah siap. Laporan akan tersimpan lokal dan dikirim saat online."}
        </p>

        <div className="mt-6 flex items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {selectedForms.size} form
          </span>
          {mode === "full" && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Area dipilih
            </span>
          )}
        </div>

        <button
          onClick={handleStartSurvey}
          className="btn-primary mt-8 inline-flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          Mulai Survey
        </button>
      </div>
    );
  }

  // ── TUTORIAL STEP ──────────────────────────────────────────────────────────
  if (step === "tutorial") {
    return (
      <div className="mx-auto max-w-lg py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
            <WifiOff className="h-5 w-5 text-brand-700 dark:text-brand-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Mode Offline Survey</h2>
            <p className="text-xs text-ink-muted">Survei mata air tanpa sinyal</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Cache explanation */}
          <div className="rounded-xl border border-ink-line bg-white p-4 dark:bg-slate-800">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                <Download className="h-4 w-4 text-brand-600 dark:text-brand-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Cache Data</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Form, definisi field, dan tile peta akan disimpan ke penyimpanan lokal
                  perangkat kamu. Ukuran cache bisa mencapai ~20 MB tergantung area survei.
                </p>
              </div>
            </div>
          </div>

          {/* Location explanation */}
          <div className="rounded-xl border border-ink-line bg-white p-4 dark:bg-slate-800">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
                <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Lokasi & GPS</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  GPS akan merekam jejak pergerakan setiap 10 meter. Lokasi mata air
                  akan di-snap ke grid 5 km sebelum dipublikasikan. Jejak tracking
                  akan dihapus setelah sync.
                </p>
              </div>
            </div>
          </div>

          {/* Photo explanation */}
          <div className="rounded-xl border border-ink-line bg-white p-4 dark:bg-slate-800">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <Camera className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Foto</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Foto yang diambil disimpan sebagai blob. Saat keluar mode offline,
                  <strong className="text-ink"> foto wajib diupload</strong> —
                  jika gagal, kamu tidak bisa keluar dari mode offline.
                </p>
              </div>
            </div>
          </div>

          {/* Sync explanation */}
          <div className="rounded-xl border border-ink-line bg-white p-4 dark:bg-slate-800">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Sinkronisasi</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Semua data akan dikirim ke server saat kamu keluar mode offline.
                  Pastikan koneksi stabil saat sync. Data lokal akan dihapus setelah
                  berhasil terkirim.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement checkbox */}
        <label className="mt-6 flex items-start gap-3 rounded-xl border border-ink-line bg-white p-4 cursor-pointer dark:bg-slate-800">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-line text-brand-600 focus:ring-brand-500"
          />
          <div>
            <span className="text-sm font-medium text-ink">
              Saya setuju dengan ketentuan penggunaan cache & penyimpanan lokal
            </span>
            <p className="mt-0.5 text-xs text-ink-muted">
              Data akan disimpan di perangkat ini dan dihapus setelah sync.
              Foto wajib diupload saat keluar mode offline.
            </p>
          </div>
        </label>

        <button
          onClick={handleNextFromTutorial}
          disabled={!agreed}
          className="btn-primary mt-6 w-full"
        >
          Lanjutkan
        </button>
      </div>
    );
  }

  // ── FORM SELECTION STEP ────────────────────────────────────────────────────
  if (step === "form-select") {
    return (
      <div className="mx-auto max-w-lg py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
            <FileCheck className="h-5 w-5 text-brand-700 dark:text-brand-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Pilih Form</h2>
            <p className="text-xs text-ink-muted">
              Pilih form yang mau diisi selama survey (sinkron dengan admin panel)
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {loadingForms ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400" />
              <span className="ml-2 text-sm text-ink-muted">Memuat form...</span>
            </div>
          ) : forms.length === 0 ? (
            <div className="rounded-xl border border-ink-line bg-white p-6 text-center dark:bg-slate-800">
              <AlertCircle className="mx-auto h-6 w-6 text-ink-muted" />
              <p className="mt-2 text-sm text-ink-muted">Tidak ada form aktif.</p>
            </div>
          ) : (
            forms.map((form) => (
              <label
                key={form.slug}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition",
                  selectedForms.has(form.slug)
                    ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
                    : "border-ink-line bg-white dark:bg-slate-800 hover:border-brand-200 dark:hover:border-brand-700"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedForms.has(form.slug)}
                  onChange={() => toggleForm(form.slug)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-line text-brand-600 focus:ring-brand-500"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-ink">{form.title}</span>
                  <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">{form.description}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-ink-subtle">
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      +{form.pointsOnSubmit} pts
                    </span>
                    <span>{form.fields.length} field</span>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={() => setStep("tutorial")} className="btn-secondary flex-1">
            Kembali
          </button>
          <button
            onClick={handleNextFromFormSelect}
            disabled={selectedForms.size === 0}
            className="btn-primary flex-1"
          >
            {mode === "full" ? "Pilih Area" : "Siapkan Offline"}
          </button>
        </div>
      </div>
    );
  }

  // ── AREA SELECTION STEP (full mode only) ─────────────────────────────────
  if (step === "area-select") {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <Grid3X3 className="h-5 w-5 text-brand-700 dark:text-brand-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Pilih Area Survei</h2>
              <p className="text-xs text-ink-muted">
                Tentukan area survei untuk pre-cache tile peta (gunakan scroll untuk zoom)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 h-[400px] overflow-hidden rounded-xl border border-ink-line">
          <SetupMap
            onAreaSelected={handleAreaSelected}
            selectedArea={selectedArea}
          />
        </div>

        <div className="mx-auto mt-4 max-w-lg">
          {selectedArea ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Area dipilih — zoom 12-15 akan di-cache
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
              <p className="text-xs text-ink-muted">
                Zoom dan geser peta ke area survei kamu. Area yang terlihat di layar akan dipilih.
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => setStep("form-select")} className="btn-secondary flex-1">
              Kembali
            </button>
            <button onClick={cacheFormsAndFinish} className="btn-primary flex-1">
              Download Tile & Siapkan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
