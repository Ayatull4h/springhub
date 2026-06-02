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
} from "lucide-react";
import { offlineDB, type OfflineTrackingPoint, type PendingReport, type FormDefinition } from "@/lib/offline-db";
import { distanceKm, snapToProtectionGrid } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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

  // Spring markers
  const [springMarkers, setSpringMarkers] = useState<OfflineTrackingPoint[]>([]);

  // UI state
  const [view, setView] = useState<SurveyView>("map");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form state
  const [activeForm, setActiveForm] = useState<FormDefinition | null>(null);
  const [cachedForms, setCachedForms] = useState<FormDefinition[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>({});
  const [formPhotos, setFormPhotos] = useState<Record<string, File | null>>({});
  const [showSpringNameInput, setShowSpringNameInput] = useState(false);
  const [springNameInput, setSpringNameInput] = useState("");

  // ── Load cached forms on mount ─────────────────────────────────────────
  useEffect(() => {
    offlineDB.getAllForms().then((forms) => {
      setCachedForms(forms);
      if (forms.length > 0 && !activeForm) {
        setActiveForm(forms[0]);
      }
    });
    offlineDB.getAllReports().then((reports) => setPendingReports(reports));
  }, []);

  // ── GPS Tracking ────────────────────────────────────────────────────────
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert("GPS tidak didukung browser ini.");
      return;
    }

    setIsTracking(true);

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

          // Record every 10 meters (0.01 km)
          if (dist >= 0.01) {
            const point: OfflineTrackingPoint = {
              id: crypto.randomUUID(),
              lat: latitude,
              lng: longitude,
              accuracy: accuracy ?? null,
              isSpringMarker: false,
              springName: null,
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
            isSpringMarker: false,
            springName: null,
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

  // ── Mark spring ─────────────────────────────────────────────────────────
  const handleMarkSpring = useCallback(() => {
    if (!currentPos) return;
    setShowSpringNameInput(true);
    setSpringNameInput("");
  }, [currentPos]);

  const confirmSpringMarker = useCallback(() => {
    if (!currentPos) return;

    const snapped = snapToProtectionGrid(currentPos);
    const marker: OfflineTrackingPoint = {
      id: crypto.randomUUID(),
      lat: snapped.lat,
      lng: snapped.lng,
      accuracy: gpsAccuracy,
      isSpringMarker: true,
      springName: springNameInput.trim() || `Mata Air ${springMarkers.length + 1}`,
      recordedAt: Date.now(),
    };

    setSpringMarkers((prev) => [...prev, marker]);
    setTrackingPoints((prev) => [...prev, marker]);
    offlineDB.saveTrackingPoint(marker).catch(() => {});
    setShowSpringNameInput(false);
    setSpringNameInput("");
  }, [currentPos, gpsAccuracy, springNameInput, springMarkers.length]);

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

  const handlePhotoCapture = (fieldId: string, file: File | null) => {
    setFormPhotos((prev) => ({ ...prev, [fieldId]: file }));
  };

  const handleSubmitForm = async () => {
    if (!activeForm) return;

    const report: PendingReport = {
      id: crypto.randomUUID(),
      formSlug: activeForm.slug,
      fieldData: formData as Record<string, unknown>,
      photoFieldIds: Object.entries(formPhotos)
        .filter(([, f]) => f !== null)
        .map(([fieldId]) => fieldId),
      csrfToken: "",
      guestId: null,
      createdAt: Date.now(),
    };

    // Save photos as blobs
    for (const [fieldId, file] of Object.entries(formPhotos)) {
      if (file) {
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        await offlineDB.savePhoto({
          id: crypto.randomUUID(),
          reportId: report.id,
          fieldId: fieldId,
          blob,
          fileName: file.name,
          mimeType: file.type,
        });
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

  // ── Render ──────────────────────────────────────────────────────────────

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
          <span className="text-sm font-semibold text-ink">Mode Survei</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Footprints className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            {(totalDistance / 1000).toFixed(2)} km
          </span>
          <span className="inline-flex items-center gap-1">
            <Flag className="h-3.5 w-3.5 text-amber-500" />
            {springMarkers.length}
          </span>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            <X className="h-3.5 w-3.5" />
            Exit
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="absolute left-0 top-0 z-30 flex h-full w-72 flex-col border-r border-ink-line bg-white shadow-lg dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">Survey Menu</h3>
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
                {isTracking ? "Tracking Aktif" : "Mulai Tracking GPS"}
              </button>

              {/* GPS info */}
              {gpsAccuracy && (
                <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-[10px] text-ink-muted dark:bg-slate-800">
                  Akurasi GPS: ±{gpsAccuracy.toFixed(0)}m
                </div>
              )}

              {/* Forms list */}
              <div className="mb-3">
                <h4 className="mb-2 text-[10px] font-semibold uppercase text-ink-subtle">
                  Form Tersedia
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

              {/* Spring markers list */}
              {springMarkers.length > 0 && (
                <div>
                  <h4 className="mb-2 text-[10px] font-semibold uppercase text-ink-subtle">
                    Mata Air Tercatat ({springMarkers.length})
                  </h4>
                  <div className="space-y-1">
                    {springMarkers.map((m, i) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs dark:bg-amber-900/20"
                      >
                        <Flag className="h-3 w-3 flex-none text-amber-500" />
                        <span className="truncate text-ink">{m.springName || `#${i + 1}`}</span>
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
                  <span>{pendingReports.length} laporan tersimpan</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div className="relative flex-1">
          <SurveyLeafletMap
            trackingPoints={trackingPoints}
            springMarkers={springMarkers}
            currentPosition={currentPos}
            isTracking={isTracking}
          />

          {/* Bottom action bar */}
          <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-ink-line bg-white/95 px-4 py-3 backdrop-blur dark:bg-slate-900/95">
            <div className="mx-auto flex max-w-lg items-center justify-center gap-3">
              {/* Mark spring button */}
              <button
                onClick={handleMarkSpring}
                disabled={!currentPos}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-600 disabled:opacity-50"
              >
                <Flag className="h-5 w-5" />
                Catat Mata Air
              </button>

              {/* Fill form button */}
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  setView("form-list");
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-700"
              >
                <Menu className="h-5 w-5" />
                Isi Form
              </button>
            </div>
          </div>

          {/* Distance overlay */}
          <div className="absolute left-3 top-3 z-20 rounded-lg bg-white/90 px-3 py-2 text-xs text-ink shadow backdrop-blur dark:bg-slate-900/90">
            <div className="flex items-center gap-2">
              <Ruler className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              <span className="font-semibold">{(totalDistance / 1000).toFixed(2)} km</span>
            </div>
          </div>

          {/* Spring name input modal */}
          {showSpringNameInput && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
              <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-slate-800">
                <h3 className="text-sm font-bold text-ink">Catat Mata Air</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Lokasi akan di-snap ke grid 5 km.
                </p>
                <input
                  type="text"
                  value={springNameInput}
                  onChange={(e) => setSpringNameInput(e.target.value)}
                  placeholder="Nama mata air (opsional)"
                  className="mt-3 w-full rounded-lg border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                  autoFocus
                />
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setShowSpringNameInput(false)}
                    className="btn-secondary flex-1"
                  >
                    Batal
                  </button>
                  <button onClick={confirmSpringMarker} className="btn-primary flex-1">
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form overlay */}
        {view === "form" && activeForm && (
          <div className="absolute inset-0 z-20 overflow-y-auto bg-white p-4 dark:bg-slate-900">
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
                          <option value="">Pilih...</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === "photo" ? (
                        <div className="mt-1">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handlePhotoCapture(field.id, file);
                            }}
                            className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/30 dark:file:text-brand-300"
                          />
                          {formPhotos[field.id] && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {formPhotos[field.id]?.name}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setView("map")}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitForm}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Simpan ke Offline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
