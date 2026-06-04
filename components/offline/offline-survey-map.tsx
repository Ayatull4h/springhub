"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Footprints,
  Flag,
  X,
  Menu,
  Save,
  Navigation,
  Ruler,
  Leaf,
  Mountain,
  Crosshair,
  MapIcon,
} from "lucide-react";
import {
  offlineDB,
  type OfflineTrackingPoint,
  type MarkerType,
  type PendingReport,
  type FormDefinition,
} from "@/lib/offline-db";
import { distanceKm } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "./error-boundary";
import { getForm } from "@/lib/forms";

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

const PickerMap = dynamic(
  () => import("../map/picker-map").then((m) => m.PickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-ink-muted dark:bg-slate-800">
        Loading peta...
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
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    // Safety timeout — iOS Safari kadang hang
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(file);
    }, 10000);

    img.onload = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else resolve(file);
          },
          "image/jpeg",
          0.7
        );
      } catch {
        resolve(file);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(file);
    };
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

  // Form state
  const [activeForm, setActiveForm] = useState<FormDefinition | null>(null);
  const [cachedForms, setCachedForms] = useState<FormDefinition[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>({});
  const [formPhotos, setFormPhotos] = useState<Record<string, File[]>>({});

  // Map picker state for location field in forms
  const [showMapPicker, setShowMapPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived marker counts
  const springCount = markers.filter((m) => m.markerType === "spring").length;
  const treeCount = markers.filter((m) => m.markerType === "tree").length;
  const trenchCount = markers.filter((m) => m.markerType === "trench").length;
  const seedlingCount = markers.filter((m) => m.markerType === "seedling").length;

  // Survey config center from setup map
  const [initialMapCenter, setInitialMapCenter] = useState<{lat: number; lng: number} | null>(null);
  // Last marker position — used to pan the map after saving a marker
  const [lastMarkerPos, setLastMarkerPos] = useState<{lat: number; lng: number} | null>(null);

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
    // Load saved tracking points and markers from IndexedDB
    offlineDB.getAllTrackingPoints().then((points) => {
      if (points.length > 0) {
        setTrackingPoints(points);
        const savedMarkers = points.filter((p) => p.markerType !== null);
        if (savedMarkers.length > 0) {
          setMarkers(savedMarkers);
        }
        // Calculate total distance from loaded tracking points
        let totalDist = 0;
        let prev = points[0];
        for (let i = 1; i < points.length; i++) {
          if (points[i].markerType === null && prev.markerType === null) {
            const dist = distanceKm(
              { lat: prev.lat, lng: prev.lng },
              { lat: points[i].lat, lng: points[i].lng }
            );
            totalDist += dist * 1000;
            prev = points[i];
          } else if (points[i].markerType === null) {
            prev = points[i];
          }
        }
        setTotalDistance(totalDist);
      }
    });
  }, []);

  // ── Cleanup blob URLs on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      // blob URLs cleaned up by component lifecycle
    };
  }, []);

  // ── GPS hanya via user gesture (Safari iOS tidak support auto-start) ──
  // Tidak ada auto-detect di mount. User harus klik "Mulai Tracking GPS".

  // ── GPS Tracking — user gesture required (Safari iOS) ─────────────────
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert(t("offline.gpsNotSupported") || "GPS tidak didukung browser ini.");
      return;
    }

    setIsTracking(true);

    // Step 1: getCurrentPosition — one-time fix
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
      () => {
        console.warn("[GPS] getCurrentPosition failed — will try watchPosition");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Step 2: watchPosition — continuous updates
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
          if (dist >= 0.005) {
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
            setTrackingPoints((prev) => [...prev, point]);
            setTotalDistance((prev) => prev + dist * 1000);
            offlineDB.saveTrackingPoint(point).catch(() => {});
          }
        } else {
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
        console.warn("[GPS] watchPosition error:", err.message);
        // Safari iOS sering gagal watchPosition — fallback ke polling
        if (!pollingRef.current) {
          startPollingFallback();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    // Fallback: jika watchPosition tidak memberi update dalam 15 detik → polling
    setTimeout(() => {
      if (pollingRef.current) return; // already started
      if (!lastPointRef.current) {
        // No position received yet — start polling
        startPollingFallback();
      }
    }, 15000);
  }, []);

  // ── Polling fallback untuk Safari iOS ──────────────────────────────────
  const startPollingFallback = useCallback(() => {
    if (pollingRef.current) return;
    console.log("[GPS] Starting polling fallback for Safari");
    pollingRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
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
            if (dist >= 0.005) {
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
              setTrackingPoints((prev) => [...prev, point]);
              setTotalDistance((prev) => prev + dist * 1000);
              offlineDB.saveTrackingPoint(point).catch(() => {});
            }
          } else {
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
        () => {},
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }, 10000); // polling setiap 10 detik
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (pollingRef.current !== null) {
        clearInterval(pollingRef.current);
      }
      if (autoFollowTimerRef.current) {
        clearTimeout(autoFollowTimerRef.current);
      }
    };
  }, []);

  // ── Pause autoFollow setelah marker agar map tetap di marker ───────────
  const [autoFollowPaused, setAutoFollowPaused] = useState(false);
  const autoFollowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Marker — instant save at GPS position (RAW, tanpa snap) ────────────
  const saveMarkerInstant = useCallback(async (type: MarkerType) => {
    if (!currentPos) {
      alert("Posisi GPS belum tersedia. Tunggu hingga GPS aktif.");
      return;
    }

    // PAUSE auto-follow agar map fokus ke marker, bukan lari ke GPS
    setAutoFollowPaused(true);
    if (autoFollowTimerRef.current) clearTimeout(autoFollowTimerRef.current);
    autoFollowTimerRef.current = setTimeout(() => setAutoFollowPaused(false), 5000);

    const marker: OfflineTrackingPoint = {
      id: crypto.randomUUID(),
      lat: currentPos.lat,     // RAW GPS — tanpa snap
      lng: currentPos.lng,     // RAW GPS — tanpa snap
      accuracy: gpsAccuracy,
      markerType: type,
      name: null,
      recordedAt: Date.now(),
    };

    setMarkers((prev) => [...prev, marker]);
    setTrackingPoints((prev) => [...prev, marker]);
    await offlineDB.saveTrackingPoint(marker);
    setLastMarkerPos({ lat: currentPos.lat, lng: currentPos.lng });

    console.log("[Marker] Instant saved:", type, currentPos);
  }, [currentPos, gpsAccuracy]);

  // ── Marker buttons — langsung simpan ──────────────────────────────────
  const handleMarkerButton = (type: MarkerType) => {
    saveMarkerInstant(type);
  };

  // ── Form handling ──────────────────────────────────────────────────────
  const handleSelectForm = (form: FormDefinition) => {
    setActiveForm(form);
    setFormData({});
    setFormPhotos({});
    setView("form");
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

    try {
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
    } catch (err) {
      console.error("[Form] Save error:", err);
      alert("Gagal menyimpan form. Coba lagi.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  // When viewing form, take over the ENTIRE screen (no map, no buttons)
  if (view === "form" && activeForm) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-white p-4 dark:bg-slate-900" style={{ zIndex: 9998, WebkitOverflowScrolling: "touch" }}>
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
            {activeForm.fields.map((field) => {
              // ── Location field — tampilkan dengan GPS + map picker ──
              if (field.type === "location") {
                return (
                  <div key={field.id}>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    <div className="mt-1 space-y-2">
                      {/* GPS auto-fill */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentPos) {
                              handleFormFieldChange("location_lat", String(currentPos.lat.toFixed(6)));
                              handleFormFieldChange("location_lng", String(currentPos.lng.toFixed(6)));
                            } else {
                              alert("Posisi GPS belum tersedia.");
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                        >
                          <Crosshair className="h-3.5 w-3.5" />
                          {t("form.location.getCurrent") || "Gunakan GPS"}
                        </button>
                        {currentPos && (
                          <span className="text-[10px] text-ink-muted">
                            📍 {currentPos.lat.toFixed(4)}, {currentPos.lng.toFixed(4)}
                          </span>
                        )}
                      </div>

                      {/* Manual input grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-ink-subtle">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            value={(formData["location_lat"] as string) || ""}
                            onChange={(e) => handleFormFieldChange("location_lat", e.target.value)}
                            placeholder={currentPos ? String(currentPos.lat.toFixed(6)) : "-6.644700"}
                            className="mt-0.5 w-full rounded-md border border-ink-line px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-ink-subtle">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            value={(formData["location_lng"] as string) || ""}
                            onChange={(e) => handleFormFieldChange("location_lng", e.target.value)}
                            placeholder={currentPos ? String(currentPos.lng.toFixed(6)) : "106.789200"}
                            className="mt-0.5 w-full rounded-md border border-ink-line px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-700"
                          />
                        </div>
                      </div>

                      {/* Map picker toggle */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowMapPicker((prev) => !prev)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          <MapIcon className="h-3.5 w-3.5" />
                          {showMapPicker ? "Sembunyikan peta" : "Pilih di peta"}
                        </button>
                      </div>

                      {/* Map picker */}
                      {showMapPicker && (
                        <div className="overflow-hidden rounded-lg border border-ink-line">
                          <div className="aspect-[16/9] w-full min-h-[200px]">
                            <PickerMap
                              key={`picker-${showMapPicker}`}
                              initialLat={currentPos?.lat ?? -7.5}
                              initialLng={currentPos?.lng ?? 110}
                              onPick={(lat, lng) => {
                                handleFormFieldChange("location_lat", String(lat.toFixed(6)));
                                handleFormFieldChange("location_lng", String(lng.toFixed(6)));
                              }}
                            />
                          </div>
                          <div className="border-t border-ink-line bg-slate-50 px-3 py-1.5 text-[11px] text-ink-muted dark:bg-slate-800">
                            Klik pada peta untuk memilih lokasi
                          </div>
                        </div>
                      )}
                    </div>
                    {field.help && (
                      <p className="mt-1 text-xs text-ink-subtle">
                        <MapPin className="mr-0.5 inline h-3 w-3" />
                        {field.help}
                      </p>
                    )}
                  </div>
                );
              }

              // ── Regular fields ──
              return (
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
                      {(() => {
                        const formDef = getForm(activeForm?.slug);
                        const staticField = formDef?.fields.find(f => f.id === field.id);
                        const opts = field.options.length > 0 ? field.options : (staticField?.options || []);
                        return opts.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ));
                      })()}
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
                          e.target.value = "";
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
              );
            })}
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

      {/* Main content — map only, no bottom bar inside */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Map wrapper — just the map, no flex-col (bottom bar moved outside) */}
        <div className="relative flex-1">
          {/* Map + overlays container */}
          <div className="relative flex-1">
            <ErrorBoundary>
              <SurveyLeafletMap
                trackingPoints={trackingPoints}
                markers={markers}
                currentPosition={currentPos}
                isTracking={isTracking}
                initialCenter={initialMapCenter}
                focusMarker={lastMarkerPos}
                autoFollowPaused={autoFollowPaused}
              />
            </ErrorBoundary>

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
          </div>
        </div>

      </div>

      {/* Bottom action bar — OUTSIDE map wrapper to avoid Leaflet click interception */}
      <div className="border-t border-ink-line bg-white/95 px-3 py-2 dark:bg-slate-900/95">
        {/* Mobile: 2 rows */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Row 1: 4 marker icons */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleMarkerButton("spring")}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-blue-500 py-2 text-white shadow-lg hover:bg-blue-600"
              title="Mata Air"
            >
              <Flag className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{t("offline.springs")}</span>
            </button>
            <button
              onClick={() => handleMarkerButton("tree")}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-green-500 py-2 text-white shadow-lg hover:bg-green-600"
              title="Tanam Pohon"
            >
              <Leaf className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{t("offline.trees")}</span>
            </button>
            <button
              onClick={() => handleMarkerButton("trench")}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-amber-700 py-2 text-white shadow-lg hover:bg-amber-800"
              title="Rorak"
            >
              <Mountain className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{t("offline.trenches")}</span>
            </button>
            <button
              onClick={() => handleMarkerButton("seedling")}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-emerald-800 py-2 text-white shadow-lg hover:bg-emerald-900"
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
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-blue-600"
          >
            <Flag className="h-4 w-4 flex-none" />
            <span className="truncate">{t("offline.springs")}</span>
          </button>
          <button
            onClick={() => handleMarkerButton("tree")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-green-600"
          >
            <Leaf className="h-4 w-4 flex-none" />
            <span className="truncate">{t("offline.trees")}</span>
          </button>
          <button
            onClick={() => handleMarkerButton("trench")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-700 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-amber-800"
          >
            <Mountain className="h-4 w-4 flex-none" />
            <span className="truncate">{t("offline.trenches")}</span>
          </button>
          <button
            onClick={() => handleMarkerButton("seedling")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-900"
          >
            <Leaf className="h-4 w-4 flex-none" />
            <span className="truncate">{t("offline.seedlings")}</span>
          </button>
          <button
            onClick={() => {
            if (cachedForms.length > 0) {
              handleSelectForm(cachedForms[0]);
            }
          }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-3 text-xs font-bold text-white shadow-lg hover:bg-brand-700"
          >
            <Menu className="h-4 w-4 flex-none" />
            <span className="truncate">{t("offline.survey.fillForm")}</span>
          </button>
        </div>
      </div>

      {/* ── No more marker popup — markers saved instantly on tap ── */}
    </div>
  );
}
