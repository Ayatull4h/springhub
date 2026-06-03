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
  Smartphone,
  Monitor,
  Apple,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { offlineDB, type FormDefinition, type OfflineConfig } from "@/lib/offline-db";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type SetupStep = "tutorial" | "form-select" | "radius-quality" | "area-select" | "downloading" | "ready";

type RadiusKm = 3 | 5 | 7 | 10;
type QualityLevel = "ringan" | "sedang" | "lengkap";

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
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        Loading map...
      </div>
    ),
  }
);

// ─── Props ──────────────────────────────────────────────────────────────────

type OfflineSetupProps = {
  onComplete: () => void;
  mode: "full" | "save-only";
};

// ─── PWA Install accordion data ─────────────────────────────────────────────

type PlatformGuide = {
  id: string;
  label: string;
  icon: React.ReactNode;
  steps: string[];
};

const platformGuides: PlatformGuide[] = [
  {
    id: "android",
    label: "Android (Chrome)",
    icon: <Smartphone className="h-4 w-4" />,
    steps: [
      'Buka website SpringHub di Chrome.',
      'Tap ikon ⋮ (tiga titik) di pojok kanan atas.',
      'Pilih "Add to Home screen" atau "Install app".',
      'Tap "Install" — ikon SpringHub akan muncul di layar utama HP.',
      "Buka dari ikon tersebut untuk mode layar penuh & offline.",
    ],
  },
  {
    id: "ios",
    label: "iOS (Safari)",
    icon: <Apple className="h-4 w-4" />,
    steps: [
      'Buka website SpringHub di Safari.',
      'Tap ikon 📤 (Share) di bagian bawah layar.',
      'Scroll ke bawah, pilih "Add to Home Screen".',
      'Tap "Add" di pojok kanan atas.',
      "Ikon SpringHub muncul di home screen, buka dari sana.",
    ],
  },
  {
    id: "windows",
    label: "Windows (Edge/Chrome)",
    icon: <Monitor className="h-4 w-4" />,
    steps: [
      'Buka website SpringHub di Edge atau Chrome.',
      "Cari ikon install (🧩 atau monitor dengan panah) di address bar.",
      'Klik "Install" atau pilih "Apps" > "Install this site as an app".',
      'Klik "Install" — aplikasi terbuka di jendela terpisah.',
      "Bisa diakses dari Start Menu atau taskbar.",
    ],
  },
  {
    id: "macos",
    label: "macOS (Safari/Chrome)",
    icon: <Apple className="h-4 w-4" />,
    steps: [
      'Buka website SpringHub di Safari atau Chrome.',
      'Safari: klik "File" > "Add to Dock". Chrome: klik ikon install di address bar.',
      'Beri nama "SpringHub" lalu klik "Add".',
      'Ikon muncul di Dock — klik untuk buka sebagai app mandiri.',
      "Mode offline otomatis aktif saat tidak ada koneksi.",
    ],
  },
];

// ─── Estimated tile sizes ────────────────────────────────────────────────────

const qualityEstimates: Record<QualityLevel, { tileCount: number; sizeMB: number }> = {
  ringan: { tileCount: 500, sizeMB: 5 },
  sedang: { tileCount: 1500, sizeMB: 20 },
  lengkap: { tileCount: 5000, sizeMB: 60 },
};

const radiusMultiplier: Record<RadiusKm, number> = {
  3: 0.5,
  5: 1,
  7: 2,
  10: 4,
};

// ─── Component ─────────────────────────────────────────────────────────────

export function OfflineSetup({ onComplete, mode }: OfflineSetupProps) {
  const [step, setStep] = useState<SetupStep>("tutorial");
  const [agreed, setAgreed] = useState(false);

  // Form selection
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());

  // Radius + Quality selection
  const [selectedRadius, setSelectedRadius] = useState<RadiusKm>(5);
  const [selectedQuality, setSelectedQuality] = useState<QualityLevel>("ringan");

  // Area selection (for full mode)
  const [selectedCenter, setSelectedCenter] = useState<{ lat: number; lng: number } | null>(null);
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

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // ── Derived estimates ─────────────────────────────────────────────────────
  const qualityInfo = qualityEstimates[selectedQuality];
  const radiusMult = radiusMultiplier[selectedRadius];
  const estimatedTiles = qualityInfo.tileCount * radiusMult;
  const estimatedSizeMB = qualityInfo.sizeMB * radiusMult;

  // ── Check if setup was done before ─────────────────────────────────────────
  useEffect(() => {
    offlineDB.getAllForms().then((cached) => {
      if (cached.length > 0) setHasSetupBefore(true);
    });
  }, []);

  // ── Skip tutorial for returning users ─────────────────────────────────────
  useEffect(() => {
    if (hasSetupBefore && step === "tutorial") {
      setStep("form-select");
    }
  }, [hasSetupBefore]);

  // ── Fetch forms from admin API ────────────────────────────────────────────
  useEffect(() => {
    if (step !== "form-select") return;

    fetch("/api/forms")
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
      // Save-only mode: skip radius + area selection, go to download
      cacheFormsAndFinish();
      return;
    }
    setStep("radius-quality");
  };

  const handleNextFromRadiusQuality = () => {
    if (mode === "full") {
      setStep("area-select");
    } else {
      cacheFormsAndFinish();
    }
  };

  // ── Handle area selection done ────────────────────────────────────────────
  const handleAreaSelected = useCallback(
    (center: { lat: number; lng: number }, radius: number) => {
      setSelectedCenter(center);
      // Calculate bounding box from circle center + radius
      const latDelta = (radius / 6371) * (180 / Math.PI);
      const lngDelta = (radius / 6371) * (180 / Math.PI) / Math.cos((center.lat * Math.PI) / 180);
      setSelectedArea({
        north: center.lat + latDelta,
        south: center.lat - latDelta,
        east: center.lng + Math.abs(lngDelta),
        west: center.lng - Math.abs(lngDelta),
      });
    },
    []
  );

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
  const downloadTilesForArea = async (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    const zoomLevels = [12, 13, 14, 15];

    // Calculate all tile URLs
    const tileUrls: string[] = [];

    for (const z of zoomLevels) {
      const xMin = Math.floor(((bounds.west + 180) / 360) * Math.pow(2, z));
      const xMax = Math.floor(((bounds.east + 180) / 360) * Math.pow(2, z));
      const yMin = Math.floor(
        ((1 -
          Math.log(
            Math.tan((bounds.north * Math.PI) / 180) + 1 / Math.cos((bounds.north * Math.PI) / 180)
          ) /
            Math.PI) /
          2) *
          Math.pow(2, z)
      );
      const yMax = Math.floor(
        ((1 -
          Math.log(
            Math.tan((bounds.south * Math.PI) / 180) + 1 / Math.cos((bounds.south * Math.PI) / 180)
          ) /
            Math.PI) /
          2) *
          Math.pow(2, z)
      );

      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
          tileUrls.push(`https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`);
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
          const parts = url
            .replace("https://a.tile.openstreetmap.org/", "")
            .replace(".png", "")
            .split("/");
          return {
            url,
            z: parseInt(parts[0], 10),
            x: parseInt(parts[1], 10),
            y: parseInt(parts[2], 10),
            cachedAt: Date.now(),
          };
        })
      );

      setDownloadProgress({
        current: Math.min(i + BATCH_SIZE, tileUrls.length),
        total: tileUrls.length,
      });
    }
  };

  // ── Start survey ─────────────────────────────────────────────────────────
  const handleStartSurvey = async () => {
    // Save offline config
    await offlineDB.saveConfig({
      id: "session-config",
      selectedForms: Array.from(selectedForms),
      radiusKm: selectedRadius,
      qualityLevel: selectedQuality,
      totalDistance: 0,
      startedAt: Date.now(),
    });

    // Create offline session on server
    fetch("/api/offline/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedForms: Array.from(selectedForms),
        mode,
        radiusKm: selectedRadius,
        qualityLevel: selectedQuality,
      }),
    }).catch(() => {
      // Silently fail — session is optional, survey works offline
    });

    onComplete();
  };

  // ── Render steps ─────────────────────────────────────────────────────────

  if (step === "downloading") {
    const pct =
      downloadProgress.total > 0
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
        <p className="mt-2 max-w-sm text-center text-sm text-ink-muted">
          {mode === "full"
            ? "Map, GPS tracking, dan form sudah siap. Kamu bisa survey tanpa sinyal."
            : "Form sudah siap. Laporan akan tersimpan lokal dan dikirim saat online."}
        </p>

        <div className="mt-6 flex items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {selectedForms.size} form
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {selectedRadius} km
          </span>
          {mode === "full" && (
            <span className="inline-flex items-center gap-1">
              <Grid3X3 className="h-3.5 w-3.5" />
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
            <p className="text-xs text-ink-muted">Survei lingkungan tanpa sinyal</p>
          </div>
        </div>

        {/* Simple explanation bullets */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-start gap-2.5 rounded-lg bg-brand-50 px-3.5 py-2.5 dark:bg-brand-900/15">
            <Download className="mt-0.5 h-4 w-4 flex-none text-brand-600 dark:text-brand-300" />
            <p className="text-xs text-ink-muted">
              <strong className="text-ink">Cache data:</strong> Form, definisi field, dan tile peta
              akan disimpan ke penyimpanan lokal perangkat.
            </p>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 px-3.5 py-2.5 dark:bg-amber-900/15">
            <MapPin className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-300" />
            <p className="text-xs text-ink-muted">
              <strong className="text-ink">GPS tracking:</strong> Rekam jejak pergerakan setiap 5
              meter. Lokasi marker di-snap ke grid 5 km.
            </p>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-purple-50 px-3.5 py-2.5 dark:bg-purple-900/15">
            <Camera className="mt-0.5 h-4 w-4 flex-none text-purple-600 dark:text-purple-300" />
            <p className="text-xs text-ink-muted">
              <strong className="text-ink">Foto:</strong> Kompresi otomatis 720p. Foto wajib
              diupload saat keluar mode offline.
            </p>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-emerald-50 px-3.5 py-2.5 dark:bg-emerald-900/15">
            <Upload className="mt-0.5 h-4 w-4 flex-none text-emerald-600 dark:text-emerald-300" />
            <p className="text-xs text-ink-muted">
              <strong className="text-ink">Sinkronisasi:</strong> Data dikirim ke server saat kamu
              keluar mode offline. Data lokal dihapus setelah berhasil.
            </p>
          </div>
        </div>

        {/* Accordion: PWA install guides */}
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase text-ink-subtle">
            Cara Install Aplikasi
          </h3>
          <div className="space-y-1.5">
            {platformGuides.map((guide) => (
              <div key={guide.id} className="overflow-hidden rounded-lg border border-ink-line">
                <button
                  onClick={() =>
                    setOpenAccordion(openAccordion === guide.id ? null : guide.id)
                  }
                  className="flex w-full items-center gap-2.5 bg-white px-3.5 py-2.5 text-left text-sm font-medium text-ink hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <span className="text-ink-muted">{guide.icon}</span>
                  <span className="flex-1">{guide.label}</span>
                  {openAccordion === guide.id ? (
                    <ChevronDown className="h-4 w-4 text-ink-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-ink-muted" />
                  )}
                </button>
                {openAccordion === guide.id && (
                  <div className="border-t border-ink-line bg-slate-50 px-3.5 py-3 dark:bg-slate-800/50">
                    <ol className="list-inside list-decimal space-y-1.5 text-xs text-ink-muted">
                      {guide.steps.map((stepText, i) => (
                        <li key={i}>{stepText}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Agreement checkbox */}
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-ink-line bg-white p-4 dark:bg-slate-800">
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
              Data akan disimpan di perangkat ini dan dihapus setelah sync. Foto wajib diupload
              saat keluar mode offline.
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
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                  selectedForms.has(form.slug)
                    ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
                    : "border-ink-line bg-white hover:border-brand-200 dark:bg-slate-800 dark:hover:border-brand-700"
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
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{form.description}</p>
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
            {mode === "full" ? "Atur Radius & Kualitas" : "Siapkan Offline"}
          </button>
        </div>
      </div>
    );
  }

  // ── RADIUS & QUALITY STEP ─────────────────────────────────────────────────
  if (step === "radius-quality") {
    return (
      <div className="mx-auto max-w-lg py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
            <Grid3X3 className="h-5 w-5 text-brand-700 dark:text-brand-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Radius & Kualitas</h2>
            <p className="text-xs text-ink-muted">
              Atur area survei dan kualitas cache tile peta
            </p>
          </div>
        </div>

        {/* Radius selection */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-ink">Radius Survei</h3>
          <p className="mb-3 text-xs text-ink-muted">
            Semakin besar radius, semakin banyak tile yang di-cache
          </p>
          <div className="space-y-2">
            {([3, 5, 7, 10] as RadiusKm[]).map((r) => (
              <label
                key={r}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition",
                  selectedRadius === r
                    ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
                    : "border-ink-line bg-white hover:border-brand-200 dark:bg-slate-800 dark:hover:border-brand-700"
                )}
              >
                <input
                  type="radio"
                  name="radius"
                  checked={selectedRadius === r}
                  onChange={() => setSelectedRadius(r)}
                  className="h-4 w-4 border-ink-line text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-ink">
                    {r === 3 && "🟢 "}
                    {r === 5 && "🟢 "}
                    {r === 7 && "🟡 "}
                    {r === 10 && "🔴 "}
                    {r} km
                  </span>
                  <p className="text-xs text-ink-subtle">
                    {r === 3 && "Mini — sangat kecil, cepat di-cache"}
                    {r === 5 && "Kecil — cocok untuk area fokus"}
                    {r === 7 && "Sedang — area survei standar"}
                    {r === 10 && "Besar — area luas, cache lebih banyak"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quality selection */}
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-ink">Kualitas Cache</h3>
          <p className="mb-3 text-xs text-ink-muted">
            Mempengaruhi detail peta saat offline dan ukuran cache
          </p>
          <div className="space-y-2">
            {(
              [
                { value: "ringan" as QualityLevel, label: "Ringan", icon: "🟢", desc: "~5 MB" },
                { value: "sedang" as QualityLevel, label: "Sedang", icon: "🟡", desc: "~20 MB" },
                { value: "lengkap" as QualityLevel, label: "Lengkap", icon: "🔴", desc: "~60 MB" },
              ] as const
            ).map((q) => (
              <label
                key={q.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition",
                  selectedQuality === q.value
                    ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
                    : "border-ink-line bg-white hover:border-brand-200 dark:bg-slate-800 dark:hover:border-brand-700"
                )}
              >
                <input
                  type="radio"
                  name="quality"
                  checked={selectedQuality === q.value}
                  onChange={() => setSelectedQuality(q.value)}
                  className="h-4 w-4 border-ink-line text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-ink">
                    {q.icon} {q.label}
                  </span>
                  <p className="text-xs text-ink-subtle">{q.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Estimated size */}
        <div className="mt-5 rounded-xl border border-ink-line bg-slate-50 p-3.5 dark:bg-slate-800">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Estimasi Cache</span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              ~{estimatedSizeMB} MB
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-subtle">
            ~{estimatedTiles.toLocaleString("id-ID")} tile peta (zoom 12-15)
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{
                width: `${Math.min((estimatedSizeMB / 60) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={() => setStep("form-select")} className="btn-secondary flex-1">
            Kembali
          </button>
          <button onClick={handleNextFromRadiusQuality} className="btn-primary flex-1">
            {mode === "full" ? "Pilih Area Survei" : "Siapkan Offline"}
          </button>
        </div>
      </div>
    );
  }

  // ── AREA SELECTION STEP (full mode only) ─────────────────────────────────
  if (step === "area-select") {
    const areaKm2 = selectedRadius ? (Math.PI * selectedRadius * selectedRadius).toFixed(0) : "—";
    const estimatedTotalSize = estimatedSizeMB;
    const estimatedTotalTiles = estimatedTiles;

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
                Klik peta untuk pindahkan pusat lingkaran. Gunakan tombol radius di bawah.
              </p>
            </div>
          </div>

          {/* Radius selector */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium text-ink-muted">Radius:</span>
            {([3, 5, 7, 10] as RadiusKm[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setSelectedRadius(r);
                  if (selectedCenter) {
                    handleAreaSelected(selectedCenter, r);
                  }
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  selectedRadius === r
                    ? "bg-brand-600 text-white"
                    : "border border-ink-line bg-white text-ink-muted hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 h-[400px] overflow-hidden rounded-xl border border-ink-line">
          <SetupMap
            onAreaSelected={handleAreaSelected}
            selectedCenter={selectedCenter}
            selectedRadius={selectedRadius}
          />
        </div>

        <div className="mx-auto mt-4 max-w-lg">
          {selectedArea ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Area dipilih — ~{areaKm2} km²
              </div>
              <div className="mt-1 flex gap-3 text-xs text-emerald-600 dark:text-emerald-400">
                <span>~{estimatedTotalTiles.toLocaleString("id-ID")} tile</span>
                <span>~{estimatedTotalSize} MB</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
              <p className="text-xs text-ink-muted">
                Klik peta untuk memilih pusat area survei. Lingkaran menunjukkan area yang akan di-cache.
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => setStep("radius-quality")} className="btn-secondary flex-1">
              Kembali
            </button>
            <button
              onClick={cacheFormsAndFinish}
              disabled={!selectedArea}
              className="btn-primary flex-1"
            >
              Download Tile & Siapkan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
