"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Crosshair,
  Footprints,
  Flag,
  X,
  Menu,
  Save,
  Upload,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Ruler,
  Layers,
  Camera,
  Loader2,
  Leaf,
  Mountain,
  Trash2,
} from "lucide-react";
import {
  offlineDB,
  type OfflineTrackingPoint,
  type MarkerType,
  type PendingReport,
  type FormDefinition,
} from "@/lib/offline-db";
import { distanceKm, snapToProtectionGrid } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "./error-boundary";

// ─── Dynamic import for survey map (SSR=false) ──────────────────────────────
const SurveyLeafletMap = dynamic(
  () => import("./survey-leaflet-map").then((m) => m.SurveyLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-ink-muted dark:bg-slate-800">
        Loading map...
      </div>
    ),
  }
);

// ─── Types ──────────────────────────────────────────────────────────────────

type SurveyView = "map" | "form" | "form-list" | "stats";

type FormFieldValue = string | number | boolean | string[];

// ─── Props ──────────────────────────────────────────────────────────────────

type OfflineSurveyMapProps = {
  selectedForms: string[];
  onExit: () => void;
};

// ─── Compress image to 720p ─────────────────────────────────────────────────

async function compressImage(file: File, maxDimension = 720): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else resolve(file); // fallback
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => resolve(file); // fallback
    img.src = url;
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export function OfflineSurveyMap({ selectedForms, onExit }: OfflineSurveyMapProps) {
  const { t } = useI18n();

  // GPS tracking
  const [trackingPoints, setTrackingPoints] = useState<OfflineTrackingPoint[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<OfflineTrackingPoint | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // All markers (spring, tree, trench) — passed as `markers` to map
  const [markers, setMarkers] = useState<OfflineTrackingPoint[]>([]);

  // UI state
  const [view, setView] = useState<SurveyView>("map");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form state
  const [activeForm, setActiveForm] = useState<FormDefinition | null>(null);
  const [cachedForms, setCachedForms] = useState<FormDefinition[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>({});
  const [formPhotos, setFormPhotos] = useState<Record<string, File[]>>({});

  // Marker popup state
  const [activeMarkerType, setActiveMarkerType] = useState<MarkerType | null>(null);
  const [markerNameInput, setMarkerNameInput] = useState("");
  const [markerNoteInput, setMarkerNoteInput] = useState("");
  const [markerPhotos, setMarkerPhotos] = useState<{ blob: Blob; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived marker counts
  const springCount = markers.filter((m) => m.markerType === "spring").length;
  const treeCount = markers.filter((m) => m.markerType === "tree").length;
  const trenchCount = markers.filter((m) => m.markerType === "trench").length;
  const seedlingCount = markers.filter((m) => m.markerType === "seedling").length;

  // Survey config center from setup map
  const [initialMapCenter, setInitialMapCenter] = useState<{lat: number; lng: number} | null>(null);

  // ── Load cached forms on mount ─────────────────────────────────────────
  useEffect(() => {
    offlineDB
      .getAllForms()
      .then((forms) => {
        setCachedForms(forms);
        if (forms.length > 0 && !activeForm) {
          setActiveForm(forms[0]);
        }
      })
      .catch((err) => console.warn("[OfflineSurvey] Failed to load forms:", err));
    offlineDB
      .getAllReports()
      .then((reports) => setPendingReports(reports))
      .catch((err) => console.warn("[OfflineSurvey] Failed to load reports:", err));
    // Load config center from IndexedDB
    offlineDB
      .getConfig()
      .then((config) => {
        if (config?.centerLat && config?.centerLng) {
          setInitialMapCenter({ lat: config.centerLat, lng: config.centerLng });
        }
      })
      .catch((err) => console.warn("[OfflineSurvey] Failed to load config:", err));
  }, []);

  // ── Cleanup blob URLs on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      for (const p of markerPhotos) {
        URL.revokeObjectURL(p.preview);
      }
    };
  }, [markerPhotos]);

  // ── GPS Tracking ────────────────────────────────────────────────────────
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert(t("offline.gpsNotSupported") || "GPS tidak didukung browser ini.");
      return;
    }

    setIsTracking(true);

    // Get current position immediately for instant feedback
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCurrentPos({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy ?? null);
        const startPoint: OfflineTrackingPoint = {
          id: crypto.randomUUID(),
          lat: latitude,
          lng: longitude,
          accuracy: accuracy ?? null,
          markerType: null,
          name: null,
          recordedAt: Date.now(),
        };
        lastPointRef.current = startPoint;
        setTrackingPoints([startPoint]);
        offlineDB.saveTrackingPoint(startPoint).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        setCurrentPos({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy ?? null);

        const lastPoint = lastPointRef.current;
        if (lastPoint) {
          const dist = distanceKm(
            { lat: lastPoint.lat, lng: lastPoint.lng },
            { lat: latitude, lng: longitude }
          );

          // Record every 5 meters (0.005 km)
          if (dist >= 0.005) {
            const point: OfflineTrackingPoint = {
              id: crypto.randomUUID(),
              lat: latitude,
              lng: longitude,
              accuracy: accuracy ?? null,
              markerType: null, // GPS tracking point
              name: null,
              recordedAt: Date.now(),
            };

            lastPointRef.current = point;
            setTrackingPoints((prev) => [...prev, point]);
            setTotalDistance((prev) => prev + dist * 1000);

            // Save to IndexedDB
            offlineDB.saveTrackingPoint(point).catch(() => {});
          }
        } else {
          // First point
          const point: OfflineTrackingPoint = {
            id: crypto.randomUUID(),
            lat: latitude,
            lng: longitude,
            accuracy: accuracy ?? null,
            markerType: null,
            name: null,
            recordedAt: Date.now(),
          };
          lastPointRef.current = point;
          setTrackingPoints([point]);
          offlineDB.saveTrackingPoint(point).catch(() => {});
        }
      },
      (err) => {
        console.warn("[GPS] Error:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ── Marker photo capture ───────────────────────────────────────────────
  const handleMarkerPhotoCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      // Max 5 MB
      if (file.size > 5 * 1024 * 1024) {
        alert(t("offline.photoMaxSize") || "Foto maksimal 5 MB");
        e.target.value = "";
        return;
      }

      // Max 4 photos
      if (markerPhotos.length >= 4) {
        alert(t("offline.photoMaxCount") || "Maksimal 4 foto per marker");
        e.target.value = "";
        return;
      }

      try {
        const compressed = await compressImage(file);
        const preview = URL.createObjectURL(compressed);
        setMarkerPhotos((prev) => [...prev, { blob: compressed, preview }]);
      } catch {
        // Fallback: use original
        const preview = URL.createObjectURL(file);
        setMarkerPhotos((prev) => [...prev, { blob: file, preview }]);
      }

      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [markerPhotos.length]
  );

  const removeMarkerPhoto = useCallback((index: number) => {
    setMarkerPhotos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // ── Marker buttons (show popup) ────────────────────────────────────────
  const handleMarkerButton = useCallback(
    (type: MarkerType) => {
      if (!currentPos) {
        alert(t("offline.requireGps") || "Aktifkan GPS dulu untuk menandai lokasi.");
        return;
      }
      setActiveMarkerType(type);
      setMarkerNameInput("");
      setMarkerNoteInput("");
      setMarkerPhotos([]);
    },
    [currentPos]
  );

  // Close marker popup
  const closeMarkerPopup = useCallback(() => {
    // Revoke any blob URLs
    for (const p of markerPhotos) {
      URL.revokeObjectURL(p.preview);
    }
    setActiveMarkerType(null);
    setMarkerPhotos([]);
  }, [markerPhotos]);

  // Confirm marker
  const confirmMarker = useCallback(async () => {
    if (!currentPos || !activeMarkerType) return;

    const snapped = snapToProtectionGrid(currentPos);

    // Build name from inputs
    const nameParts: string[] = [];
    if (markerNameInput.trim()) nameParts.push(markerNameInput.trim());
    if (markerNoteInput.trim()) nameParts.push(`📝 ${markerNoteInput.trim()}`);
    const finalName = nameParts.length > 0 ? nameParts.join(" — ") : null;

    const marker: OfflineTrackingPoint = {
      id: crypto.randomUUID(),
      lat: snapped.lat,
      lng: snapped.lng,
      accuracy: gpsAccuracy,
      markerType: activeMarkerType,
      name: finalName,
      recordedAt: Date.now(),
    };

    // Save photos as blobs associated with this marker
    for (const photo of markerPhotos) {
      await offlineDB.savePhoto({
        id: crypto.randomUUID(),
        reportId: marker.id,
        fieldId: "marker_photo",
        blob: photo.blob,
        fileName: `marker_${Date.now()}.jpg`,
        mimeType: "image/jpeg",
      });
    }

    setMarkers((prev) => [...prev, marker]);
    setTrackingPoints((prev) => [...prev, marker]);
    await offlineDB.saveTrackingPoint(marker);

    // Cleanup
    for (const p of markerPhotos) {
      URL.revokeObjectURL(p.preview);
    }
    setActiveMarkerType(null);
    setMarkerPhotos([]);
    setMarkerNameInput("");
    setMarkerNoteInput("");
  }, [currentPos, activeMarkerType, gpsAccuracy, markerNameInput, markerNoteInput, markerPhotos]);

  // ── Form handling ──────────────────────────────────────────────────────
  const handleSelectForm = (form: FormDefinition) => {
    setActiveForm(form);
    setFormData({});
    setFormPhotos({});
    setView("form");
    setSidebarOpen(false);
  };

  const handleFormFieldChange = (fieldId: string, value: FormFieldValue) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePhotoCapture = (fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).slice(0, 5); // max 5 photos
    setFormPhotos((prev) => {
      const existing = prev[fieldId] || [];
      const combined = [...existing, ...newFiles].slice(0, 5); // max 5 total
      return { ...prev, [fieldId]: combined };
    });
  };

  const handleSubmitForm = async () => {
    if (!activeForm) return;

    const report: PendingReport = {
      id: crypto.randomUUID(),
      formSlug: activeForm.slug,
      fieldData: formData as Record<string, unknown>,
      photoFieldIds: Object.entries(formPhotos)
        .filter(([, files]) => files && files.length > 0)
        .map(([fieldId]) => fieldId),
      csrfToken: "",
      guestId: null,
      createdAt: Date.now(),
    };

    // Save photos as blobs
    for (const [fieldId, files] of Object.entries(formPhotos)) {
      if (files && files.length > 0) {
        for (const file of files) {
          // Compress to 720p
          const compressed = await compressImage(file);
          await offlineDB.savePhoto({
            id: crypto.randomUUID(),
            reportId: report.id,
            fieldId: fieldId,
            blob: compressed,
            fileName: file.name,
            mimeType: file.type,
          });
        }
      }
    }

    await offlineDB.saveReport(report);
    setPendingReports((prev) => [...prev, report]);
    setActiveForm(null);
    setFormData({});
    setFormPhotos({});
    setView("map");
    setSidebarOpen(true);
  };

  // ── Marker popup label ─────────────────────────────────────────────────
  const markerTypeLabel = (type: MarkerType | null): string => {
    switch (type) {
      case "spring":
        return "💧 Mata Air";
      case "tree":
        return "🌳 Tanam Pohon";
      case "trench":
        return "🕳️ Rorak";
      case "seedling":
        return "🌰 Seedling";
      default:
        return "";
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  // When viewing form, take over the ENTIRE screen (no map, no buttons)
  if (view === "form" && activeForm) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-4 dark:bg-slate-900">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">{activeForm.title}</h2>
              <p className="text-xs text-ink-muted">{activeForm.description}</p>
            </div>
            <button
              onClick={() => setView("map")}
              className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {activeForm.fields
              .filter((f) => f.id !== "location") // location auto-filled from GPS
              .map((field) => (
                <div key={field.id}>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </label>

                  {field.type === "text" || field.type === "phone" ? (
                    <input
                      type={field.type === "phone" ? "tel" : "text"}
                      value={(formData[field.id] as string) || ""}
                      onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="mt-1 w-full rounded-lg border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                    />
                  ) : field.type === "longtext" ? (
                    <textarea
                      value={(formData[field.id] as string) || ""}
                      onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                    />
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      value={(formData[field.id] as string) || ""}
                      onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                    />
                  ) : field.type === "date" ? (
                    <input
                      type="date"
                      value={(formData[field.id] as string) || ""}
                      onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                    />
                  ) : field.type === "select" || field.type === "province" ? (
                    <select
                      value={(formData[field.id] as string) || ""}
                      onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                    >
                      <option value="">{t("common.select") || "Pilih..."}</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "photo" ? (
                    <div className="mt-1">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={(e) => {
                          handlePhotoCapture(field.id, e.target.files);
                          e.target.value = ""; // allow re-selecting same file
                        }}
                        className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/30 dark:file:text-brand-300"
                      />
                      {formPhotos[field.id] && formPhotos[field.id].length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {formPhotos[field.id].map((file, idx) => (
                            <div key={idx} className="relative h-12 w-12 overflow-hidden rounded-lg border border-ink-line">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Photo ${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                          <span className="ml-1 self-center text-[10px] text-ink-muted">
                            {formPhotos[field.id].length}/5
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => setView("map")} className="btn-secondary flex-1">
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSubmitForm}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {t("offline.saveForm")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-ink-line bg-white px-4 py-2 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-ink">{t("offline.title")}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-muted flex-wrap justify-end">
          <span className="inline-flex items-center gap-1">
            <Footprints className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            {(totalDistance / 1000).toFixed(2)} km
          </span>
          <span className="inline-flex items-center gap-1" title="Mata Air">
            <Flag className="h-3.5 w-3.5 text-blue-500" />
            {springCount}
          </span>
          <span className="inline-flex items-center gap-1" title="Tanam Pohon">
            <Leaf className="h-3.5 w-3.5 text-green-500" />
            {treeCount}
          </span>
          <span className="inline-flex items-center gap-1" title="Rorak">
            <Mountain className="h-3.5 w-3.5 text-amber-700" />
            {trenchCount}
          </span>
          <span className="inline-flex items-center gap-1" title="Seedling">
            <Leaf className="h-3.5 w-3.5 text-emerald-800" />
            {seedlingCount}
          </span>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            <X className="h-3.5 w-3.5" />
            {t("offline.exitSurvey")}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="absolute left-0 top-0 z-30 flex h-full w-72 flex-col border-r border-ink-line bg-white shadow-lg dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">{t("offline.surveyMenu") || "Survey Menu"}</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {/* GPS tracking button */}
              <button
                onClick={isTracking ? stopTracking : startTracking}
                className={cn(
                  "mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition",
                  isTracking
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                )}
              >
                <Navigation className={cn("h-4 w-4", isTracking && "animate-pulse")} />
                {isTracking ? t("offline.survey.gpsActive") : t("offline.survey.gpsStart")}
              </button>

              {/* GPS info */}
              {gpsAccuracy !== null && (
                <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-[10px] text-ink-muted dark:bg-slate-800">
                  {t("offline.gpsAccuracy") || "Akurasi GPS"}: ±{gpsAccuracy.toFixed(0)}m
                </div>
              )}

              {/* Forms list */}
              <div className="mb-3">
                <h4 className="mb-2 text-[10px] font-semibold uppercase text-ink-subtle">
                  {t("offline.availableForms") || "Form Tersedia"}
                </h4>
                <div className="space-y-1.5">
                  {cachedForms.map((form) => (
                    <button
                      key={form.slug}
                      onClick={() => handleSelectForm(form)}
                      className="flex w-full items-center gap-2 rounded-lg border border-ink-line px-3 py-2 text-left text-xs text-ink hover:border-brand-200 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-brand-900/20"
                    >
                      <Layers className="h-3.5 w-3.5 flex-none text-brand-600 dark:text-brand-400" />
                      <span className="truncate">{form.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Markers list */}
              {markers.length > 0 && (
                <div>
                  <h4 className="mb-2 text-[10px] font-semibold uppercase text-ink-subtle">
                    {t("offline.markers") || "Marker Tercatat"} ({markers.length})
                  </h4>
                  <div className="space-y-1">
                    {markers.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs",
                          m.markerType === "spring" && "bg-blue-50 dark:bg-blue-900/20",
                          m.markerType === "tree" && "bg-green-50 dark:bg-green-900/20",
                          m.markerType === "trench" && "bg-amber-50 dark:bg-amber-900/20",
                          m.markerType === "seedling" && "bg-emerald-50 dark:bg-emerald-900/20"
                        )}
                      >
                        <span className="flex-none text-xs">
                          {m.markerType === "spring" ? "💧" : m.markerType === "tree" ? "🌱" : m.markerType === "trench" ? "🕳️" : "🌰"}
                        </span>
                        <span className="truncate text-ink">
                          {m.name || markerTypeLabel(m.markerType)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pending reports count */}
            {pendingReports.length > 0 && (
              <div className="border-t border-ink-line px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <Save className="h-3.5 w-3.5" />
                  <span>{pendingReports.length} {t("offline.reportsSaved") || "laporan tersimpan"}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div className="relative flex-1" style={{ paddingBottom: "120px" }}>
          <ErrorBoundary>
            <SurveyLeafletMap
              trackingPoints={trackingPoints}
              markers={markers}
              currentPosition={currentPos}
              isTracking={isTracking}
              initialCenter={initialMapCenter}
            />
          </ErrorBoundary>

          {/* Bottom action bar */}
          <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-ink-line bg-white/95 px-3 py-2 backdrop-blur dark:bg-slate-900/95">
            {/* Mobile: 2 rows */}
            <div className="flex flex-col gap-2 sm:hidden">
              {/* Row 1: 4 marker icons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleMarkerButton("spring")}
                  disabled={!currentPos}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-blue-500 py-2 text-white shadow-lg hover:bg-blue-600 disabled:opacity-50"
                  title="Mata Air"
                >
                  <Flag className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">{t("offline.springs")}</span>
                </button>
                <button
                  onClick={() => handleMarkerButton("tree")}
                  disabled={!currentPos}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-green-500 py-2 text-white shadow-lg hover:bg-green-600 disabled:opacity-50"
                  title="Tanam Pohon"
                >
                  <Leaf className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">{t("offline.trees")}</span>
                </button>
                <button
                  onClick={() => handleMarkerButton("trench")}
                  disabled={!currentPos}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-amber-700 py-2 text-white shadow-lg hover:bg-amber-800 disabled:opacity-50"
                  title="Rorak"
                >
                  <Mountain className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">{t("offline.trenches")}</span>
                </button>
                <button
                  onClick={() => handleMarkerButton("seedling")}
                  disabled={!currentPos}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-emerald-800 py-2 text-white shadow-lg hover:bg-emerald-900 disabled:opacity-50"
                  title="Seedling"
                >
                  <Leaf className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">{t("offline.seedlings")}</span>
                </button>
              </div>
              {/* Row 2: Fill Form full width */}
              <button
                onClick={() => {
                if (cachedForms.length > 0) {
                  handleSelectForm(cachedForms[0]);
                } else {
                  setSidebarOpen(true);
                }
              }}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-brand-700"
              >
                <Menu className="h-4 w-4" />
                <span>{t("offline.survey.fillForm")}</span>
              </button>
            </div>

            {/* Desktop: 5 buttons in 1 row */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => handleMarkerButton("spring")}
                disabled={!currentPos}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <Flag className="h-4 w-4 flex-none" />
                <span className="truncate">{t("offline.springs")}</span>
              </button>
              <button
                onClick={() => handleMarkerButton("tree")}
                disabled={!currentPos}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-green-600 disabled:opacity-50"
              >
                <Leaf className="h-4 w-4 flex-none" />
                <span className="truncate">{t("offline.trees")}</span>
              </button>
              <button
                onClick={() => handleMarkerButton("trench")}
                disabled={!currentPos}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-700 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-amber-800 disabled:opacity-50"
              >
                <Mountain className="h-4 w-4 flex-none" />
                <span className="truncate">{t("offline.trenches")}</span>
              </button>
              <button
                onClick={() => handleMarkerButton("seedling")}
                disabled={!currentPos}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-900 disabled:opacity-50"
              >
                <Leaf className="h-4 w-4 flex-none" />
                <span className="truncate">{t("offline.seedlings")}</span>
              </button>
              <button
                onClick={() => {
                if (cachedForms.length > 0) {
                  handleSelectForm(cachedForms[0]);
                } else {
                  setSidebarOpen(true);
                }
              }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-brand-700"
              >
                <Menu className="h-4 w-4 flex-none" />
                <span className="truncate">{t("offline.survey.fillForm")}</span>
              </button>
            </div>
          </div>

          {/* Distance overlay */}
          <div className="absolute right-3 top-3 z-20 rounded-lg bg-white/90 px-3 py-2 text-xs text-ink shadow backdrop-blur dark:bg-slate-900/90">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Ruler className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                <span className="font-semibold">{(totalDistance / 1000).toFixed(2)} km</span>
              </div>
              <span
                className={`inline-block h-2 w-2 rounded-full ${isTracking ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}
                title={isTracking ? "Tracking aktif" : "Tracking tidak aktif"}
              />
            </div>
            <div className="mt-1 flex gap-2 text-[10px] text-ink-subtle">
              <span>💧 {springCount}</span>
              <span>🌱 {treeCount}</span>
              <span>🕳️ {trenchCount}</span>
              <span>🌰 {seedlingCount}</span>
            </div>
          </div>

          {/* GPS Start button — visible only when not tracking */}
          {!isTracking && (
            <button
              onClick={startTracking}
              className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-brand-600 px-6 py-4 text-sm font-bold text-white shadow-lg hover:bg-brand-700 active:scale-95 transition"
            >
              <Navigation className="mr-2 inline-block h-5 w-5" />
              {t("offline.survey.gpsStart") || "Mulai Tracking GPS"}
            </button>
          )}

          {/* ── Marker popup ─────────────────────────────────────────────── */}
          {activeMarkerType && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
              <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-slate-800">
                {/* Title */}
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <span>
                    {activeMarkerType === "spring"
                      ? "💧"
                      : activeMarkerType === "tree"
                        ? "🌱"
                        : activeMarkerType === "trench"
                          ? "🕳️"
                          : "🌰"}
                  </span>
                  {t("offline.addMarker")}: {markerTypeLabel(activeMarkerType)}
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("offline.locationSnap") || "Lokasi akan di-snap ke grid 5 km."}
                </p>

                {/* Name input */}
                <input
                  type="text"
                  value={markerNameInput}
                  onChange={(e) => setMarkerNameInput(e.target.value)}
                  placeholder={t("offline.nameOptional") || "Nama (opsional)"}
                  className="mt-3 w-full rounded-lg border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                  autoFocus
                />

                {/* Note/description */}
                <textarea
                  value={markerNoteInput}
                  onChange={(e) => setMarkerNoteInput(e.target.value)}
                  placeholder={t("offline.noteOptional") || "Catatan (opsional)"}
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                />

                {/* Photo capture */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">{t("offline.photo") || "Foto"}</span>
                    <span className="text-[10px] text-ink-subtle">
                      {4 - markerPhotos.length} {t("offline.remaining") || "tersisa"}
                    </span>
                  </div>

                  {/* Photo preview grid */}
                  {markerPhotos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {markerPhotos.map((photo, idx) => (
                        <div key={idx} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-ink-line">
                          <img
                            src={photo.preview}
                            alt={`Foto ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => removeMarkerPhoto(idx)}
                            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {/* Add more button */}
                      {markerPhotos.length < 4 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-ink-line text-xl text-ink-subtle hover:border-brand-400 hover:text-brand-500"
                        >
                          +
                        </button>
                      )}
                    </div>
                  )}

                  {/* Capture button (shown when less than 4 photos) */}
                  {markerPhotos.length < 4 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {markerPhotos.length === 0 ? (t("offline.takePhoto") || "Ambil Foto") : (t("offline.addPhoto") || "Tambah Foto")}
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleMarkerPhotoCapture}
                    className="hidden"
                  />
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={closeMarkerPopup} className="btn-secondary flex-1">
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={confirmMarker}
                    className="btn-primary flex-1 inline-flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="h-4 w-4" />
                    {t("common.save")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

{/* Form overlay removed — now handled as early return above */}
      </div>
    </div>
  );
}
