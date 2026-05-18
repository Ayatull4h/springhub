"use client";

import { useState, useCallback, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Crosshair,
  Loader2,
  AlertTriangle,
  MapIcon,
  Keyboard,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PROTECTION_RADIUS_KM } from "@/lib/geo";
import { cn } from "@/lib/utils";

// ─── Dynamic import untuk map picker (SSR=false) ────────────────────────────
const PickerMap = dynamic(
  () => import("./picker-map").then((m) => m.PickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[240px] w-full place-items-center bg-slate-50 text-xs text-ink-subtle">
        Loading map picker…
      </div>
    ),
  }
);

type LocationStatus = "idle" | "detecting" | "denied" | "success" | "error";

type InputMode = "manual" | "map";

export type LocationPickerProps = {
  /** Name prefix untuk input hidden — akan menghasilkan name_lat dan name_lng */
  name: string;
  required?: boolean;
};

export function LocationPicker({ name, required }: LocationPickerProps) {
  const { t } = useI18n();

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [geoError, setGeoError] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [mapKey, setMapKey] = useState(0); // force remount when switching modes

  // ── Geolocation ───────────────────────────────────────────────────────────
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("denied");
      setGeoError(t("form.location.geoNotSupported"));
      return;
    }

    setStatus("detecting");
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setStatus("success");
      },
      (err) => {
        setStatus("denied");
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError(t("form.location.permissionDenied"));
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError(t("form.location.positionUnavailable"));
            break;
          case err.TIMEOUT:
            setGeoError(t("form.location.timeout"));
            break;
          default:
            setGeoError(t("form.location.unknownError"));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [t]);

  // ── Manual input handlers ─────────────────────────────────────────────────
  const handleLatChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLat(e.target.value);
    if (e.target.value && lng) setStatus("success");
  }, [lng]);

  const handleLngChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLng(e.target.value);
    if (lat && e.target.value) setStatus("success");
  }, [lat]);

  // ── Map picker callback ───────────────────────────────────────────────────
  const handleMapPicked = useCallback((pickedLat: number, pickedLng: number) => {
    setLat(pickedLat.toFixed(6));
    setLng(pickedLng.toFixed(6));
    setStatus("success");
  }, []);

  // ── Toggle input mode ─────────────────────────────────────────────────────
  const toggleMode = useCallback(() => {
    setInputMode((prev) => (prev === "manual" ? "map" : "manual"));
    setMapKey((k) => k + 1);
  }, []);

  const hasCoords = lat !== "" && lng !== "";

  return (
    <div className="space-y-3">
      {/* Tombol deteksi lokasi */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={detectLocation}
          disabled={status === "detecting"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition",
            status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : status === "detecting"
                ? "border-slate-200 bg-slate-50 text-slate-500"
                : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
          )}
        >
          {status === "detecting" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("form.location.detecting")}
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("form.location.located")}
            </>
          ) : (
            <>
              <Crosshair className="h-3.5 w-3.5" />
              {t("form.location.getCurrent")}
            </>
          )}
        </button>

        {/* Status */}
        {status === "denied" && geoError && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {geoError}
          </span>
        )}
      </div>

      {/* Input koordinat + toggle mode */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-ink-subtle">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            name={`${name}_lat`}
            value={lat}
            onChange={handleLatChange}
            required={required}
            placeholder={status === "success" ? lat : "-6.644700"}
            className="mt-0.5 w-full rounded-md border border-ink-line px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-subtle">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            name={`${name}_lng`}
            value={lng}
            onChange={handleLngChange}
            required={required}
            placeholder={status === "success" ? lng : "106.789200"}
            className="mt-0.5 w-full rounded-md border border-ink-line px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {/* Toggle manual ↔ map */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggleMode}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {inputMode === "manual" ? (
            <>
              <MapIcon className="h-3.5 w-3.5" />
              {t("form.location.pickFromMap")}
            </>
          ) : (
            <>
            <Keyboard className="h-3.5 w-3.5" />
            {t("form.location.manualInput")}
            </>
          )}
        </button>

        {hasCoords && (
          <span className="text-[10px] text-ink-subtle">
            <MapPin className="mr-0.5 inline h-3 w-3" />
            {lat}, {lng}
          </span>
        )}
      </div>

      {/* Map picker */}
      {inputMode === "map" && (
        <div className="overflow-hidden rounded-lg border border-ink-line">
          <div className="aspect-[16/9] w-full min-h-[200px]">
            <PickerMap
              key={mapKey}
              initialLat={lat ? parseFloat(lat) : -7.5}
              initialLng={lng ? parseFloat(lng) : 110}
              onPick={handleMapPicked}
            />
          </div>
          <div className="border-t border-ink-line bg-slate-50 px-3 py-1.5 text-[11px] text-ink-muted">
            {t("form.location.mapPickHint")}
          </div>
        </div>
      )}

      <p className="text-xs text-ink-subtle">
        <MapPin className="mr-0.5 inline h-3 w-3" />
        {t("form.location.tip", { radius: String(PROTECTION_RADIUS_KM) })}
      </p>
    </div>
  );
}
