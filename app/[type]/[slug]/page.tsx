"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  ImageIcon,
  Loader2,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const MiniMap = dynamic(() => import("@/components/map/mini-map"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/1] w-full items-center justify-center rounded-lg bg-slate-100 text-xs text-ink-muted dark:bg-slate-800">
      <MapPin className="mx-auto h-5 w-5 text-ink-subtle" />
      <p className="ml-2">Memuat peta...</p>
    </div>
  ),
});

type Photo = {
  id: string;
  fieldId: string;
  url: string;
  width: number;
  height: number;
};

type ReportItem = {
  id: string;
  formSlug: string;
  formTitle: string;
  fieldData: string;
  status: string;
  user: { username: string } | null;
  createdAt: string;
  photos: Photo[];
};

type PointDetail = {
  id: string;
  name: string;
  slug: string;
  type: { slug: string; name: string; icon: string };
  category: { slug: string; name: string; color: string } | null;
  province: string;
  regency: string;
  village: string;
  subdistrict: string;
  description: string;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  reportCount: number;
  photoCount: number;
  reports: ReportItem[];
  allPhotos: Photo[];
};

export default function MapPointDetailPage() {
  const params = useParams();
  const type = params.type as string;
  const slug = params.slug as string;

  const [point, setPoint] = useState<PointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  useEffect(() => {
    fetchPoint();
  }, [type, slug]);

  async function fetchPoint() {
    setLoading(true);
    try {
      // Fetch via API - we need to find the point by slug and type
      const res = await fetch(`/api/map-points?type=${type}`);
      if (!res.ok) throw new Error("Gagal memuat data");

      const data = await res.json();
      const found = data.points?.find((p: { slug: string }) => p.slug === slug);

      if (!found) {
        setError("Titik tidak ditemukan");
        return;
      }

      // Fetch detail
      const detailRes = await fetch(`/api/map-points/${found.id}`);
      if (!detailRes.ok) throw new Error("Gagal memuat detail");

      const detailData = await detailRes.json();
      setPoint(detailData.point);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !point) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-ink-muted">{error || "Titik tidak ditemukan"}</p>
        <Link href="/" className="text-brand-600 hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} />
        Kembali ke peta
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="inline-block w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"
            style={{ backgroundColor: point.category?.color || "#2563eb" }}
          />
          <span className="text-sm font-medium text-ink-muted">
            {point.type.name}
            {point.category && ` · ${point.category.name}`}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-ink dark:text-white">{point.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-muted">
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {point.province && `${point.village ? point.village + ", " : ""}${point.regency ? point.regency + ", " : ""}${point.province}`}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {new Date(point.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <Camera size={14} />
            {point.photoCount} foto · {point.reportCount} laporan
          </span>
        </div>
      </div>

      {/* Map */}
      {point.snappedLat && point.snappedLng && (
        <div className="mb-8 overflow-hidden rounded-xl border border-ink-line dark:border-slate-700">
          <MiniMap lat={point.snappedLat} lng={point.snappedLng} />
        </div>
      )}

      {/* All Photos Gallery */}
      {point.allPhotos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-ink dark:text-white mb-4">
            Galeri Foto
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {point.allPhotos
              .slice(0, showAllPhotos ? undefined : 12)
              .map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxIndex(i)}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <Image
                    src={photo.url}
                    alt={`Foto ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 16vw"
                   
                  />
                </button>
              ))}
          </div>
          {point.allPhotos.length > 12 && !showAllPhotos && (
            <button
              onClick={() => setShowAllPhotos(true)}
              className="mt-4 text-sm text-brand-600 hover:text-brand-700"
            >
              Lihat semua ({point.allPhotos.length} foto)
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div>
        <h2 className="text-xl font-semibold text-ink dark:text-white mb-4">
          Timeline Laporan
        </h2>
        <div className="space-y-4">
          {point.reports.map((report) => {
            const fields = parseFieldData(report.fieldData);
            return (
              <div
                key={report.id}
                className="rounded-xl border border-ink-line bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {report.formTitle || report.formSlug}
                    </span>
                    <p className="mt-1 text-xs text-ink-muted flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(report.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {report.user && (
                        <>
                          <User size={12} className="ml-2" />
                          {report.user.username}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Field data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Object.entries(fields).map(([key, value]) => {
                    if (key.startsWith("photo") || key.startsWith("_")) return null;
                    return (
                      <div key={key}>
                        <span className="text-ink-muted text-xs capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>{" "}
                        <span className="text-ink dark:text-slate-200">
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Report photos */}
                {report.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    {report.photos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => {
                          const globalIdx = point.allPhotos.findIndex(
                            (p) => p.id === photo.id
                          );
                          if (globalIdx >= 0) setLightboxIndex(globalIdx);
                        }}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700"
                      >
                        <Image
                          src={photo.url}
                          alt="Foto"
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && point.allPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X size={24} />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={point.allPhotos[lightboxIndex].url}
              alt={`Foto ${lightboxIndex + 1}`}
              width={point.allPhotos[lightboxIndex].width || 1200}
              height={point.allPhotos[lightboxIndex].height || 800}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
            <p className="mt-2 text-center text-sm text-white/70">
              {lightboxIndex + 1} / {point.allPhotos.length}
            </p>
          </div>

          {lightboxIndex < point.allPhotos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function parseFieldData(data: string): Record<string, unknown> {
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}
