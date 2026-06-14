"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Droplets,
  Sprout,
  Sparkles,
  Layers,
  Package,
  MapPin,
  Calendar,
  User,
  ImageIcon,
  Loader2,
  Camera,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type Photo = {
  id: string;
  fieldId: string;
  storagePath: string;
  mimeType: string;
  width: number;
  height: number;
  createdAt: string;
  url: string;
};

type ReportItem = {
  id: string;
  formSlug: string;
  status: string;
  createdAt: string;
  snappedLat: number | null;
  snappedLng: number | null;
  username: string;
  region: string;
  springName: string;
  province: string;
  regency: string;
  notes: string;
  treeCount: string;
  photos: Photo[];
  featuredPhotoId: string | null;
};

type SpringStats = {
  totalReports: number;
  approvedReports: number;
  pendingReports: number;
  monitoring: number;
  restoration: number;
  treePlanting: number;
  trench: number;
  seedling: number;
  totalPhotos: number;
  firstReport: string | null;
  lastReport: string | null;
};

type SpringData = {
  id: string;
  name: string;
  snappedLat: number | null;
  snappedLng: number | null;
  province: string;
  regency: string;
  village: string;
  subdistrict: string;
  createdAt: string;
  updatedAt: string;
  reports: ReportItem[];
  stats: SpringStats;
};

// ─── Helpers ──────────────────────────────────────────────────────────────

const formLabels: Record<string, { icon: typeof Droplets; label: string; color: string }> = {
  "spring-monitoring": { icon: Droplets, label: "Pemantauan Mata Air", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300" },
  "spring-restoration": { icon: Sparkles, label: "Restorasi Mata Air", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300" },
  "tree-planting": { icon: Sprout, label: "Tanam Pohon", color: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300" },
  "trench-development": { icon: Layers, label: "Rorak / Embung", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300" },
  "seedling-stock": { icon: Package, label: "Stok Bibit", color: "text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-300" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Droplets;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-ink-line/60 p-3 dark:border-slate-700">
      <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
      <span className="mt-1 text-xl font-bold text-ink">{value}</span>
      <span className="text-[10px] text-ink-muted">{label}</span>
    </div>
  );
}

// ─── Photo Modal ──────────────────────────────────────────────────────────

function PhotoModal({
  photo,
  onClose,
}: {
  photo: Photo & { reportDate?: string; reportAuthor?: string };
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Foto"
    >
      <div
        className="relative max-h-[90vh] max-w-[95vw] overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
          aria-label="Tutup"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <Image
          src={photo.url}
          alt="Foto lapangan"
          width={photo.width || 1280}
          height={photo.height || 720}
          className="max-h-[80vh] w-auto object-contain"
          unoptimized
        />
        {(photo.reportDate || photo.reportAuthor) && (
          <div className="flex items-center gap-3 border-t border-ink-line px-4 py-2 text-xs text-ink-muted dark:border-slate-700">
            {photo.reportDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {photo.reportDate}
              </span>
            )}
            {photo.reportAuthor && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" aria-hidden="true" />
                {photo.reportAuthor}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mini Map ─────────────────────────────────────────────────────────────

function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="aspect-[4/1] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
      <Image
        src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+2563eb(${lng},${lat})/${lng},${lat},13,0/800x200@2x?access_token=pk.eyJ1Ijoic3ByaW5naHViIiwiYSI6ImNsdmd4eHh4eDAiLCJfIjoiZGVmYXVsdCJ9.placeholder`}
        alt="Peta lokasi"
        width={800}
        height={200}
        className="h-full w-full object-cover"
        onError={(e) => {
          // Fallback: OSM static map
          const target = e.currentTarget;
          target.src = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=13&size=800x200&markers=${lat},${lng},red-pushpin`;
        }}
        unoptimized
      />
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────

export default function SpringDetailPage() {
  const params = useParams();
  const { t } = useI18n();
  const springId = params.id as string;

  const [spring, setSpring] = useState<SpringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enlargedPhoto, setEnlargedPhoto] = useState<(Photo & { reportDate?: string; reportAuthor?: string }) | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  useEffect(() => {
    if (!springId) return;
    fetch(`/api/springs/${springId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.spring) setSpring(data.spring);
        else setError("Spring tidak ditemukan");
      })
      .catch(() => setError("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [springId]);

  if (loading) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-3 text-sm text-ink-muted">Memuat data mata air...</p>
      </div>
    );
  }

  if (error || !spring) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">{error || "Tidak ditemukan"}</h1>
        <p className="mt-2 text-ink-muted">Mata air tidak ditemukan atau telah dihapus.</p>
        <Link href="/#map" className="btn-primary mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke peta
        </Link>
      </div>
    );
  }

  const allPhotos = spring.reports.flatMap((r) =>
    r.photos.map((p) => ({
      ...p,
      reportDate: formatDateShort(r.createdAt),
      reportAuthor: r.username,
      formSlug: r.formSlug,
      reportId: r.id,
    }))
  );

  const displayPhotos = showAllPhotos ? allPhotos : allPhotos.slice(0, 12);

  return (
    <main className="min-h-screen bg-page pb-16">
      {/* Back navigation */}
      <div className="container-page border-b border-ink-line bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between py-3">
          <Link
            href="/#map"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke peta
          </Link>
          <span className="text-xs text-ink-subtle">
            {t("spring.lastUpdated", formatDate(spring.updatedAt))}
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="container-page py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                <Droplets className="h-6 w-6" aria-hidden="true" />
              </span>
              <h1 className="text-2xl font-extrabold text-ink md:text-3xl">
                {spring.name}
              </h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {[spring.village, spring.subdistrict, spring.regency, spring.province]
                  .filter(Boolean)
                  .join(", ")}
              </span>
              {spring.snappedLat && spring.snappedLng && (
                <span className="text-xs text-ink-subtle">
                  {spring.snappedLat.toFixed(4)}, {spring.snappedLng.toFixed(4)}
                </span>
              )}
              {spring.stats.firstReport && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Dipantau sejak {formatDate(spring.stats.firstReport)}
                </span>
              )}
            </div>
          </div>

          {/* Overall status badge */}
          <div className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 dark:bg-brand-900/30">
            <span className="text-2xl font-bold text-brand-700">
              {spring.stats.totalReports}
            </span>
            <span className="text-xs text-brand-600 dark:text-brand-300">
              total<br />laporan
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container-page pb-6">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <StatCard
            icon={Droplets}
            label="Pemantauan"
            value={spring.stats.monitoring}
            color="text-blue-600"
          />
          <StatCard
            icon={Sparkles}
            label="Restorasi"
            value={spring.stats.restoration}
            color="text-emerald-600"
          />
          <StatCard
            icon={Sprout}
            label="Pohon"
            value={spring.stats.treePlanting}
            color="text-green-600"
          />
          <StatCard
            icon={Layers}
            label="Rorak"
            value={spring.stats.trench}
            color="text-amber-600"
          />
          <StatCard
            icon={Package}
            label="Bibit"
            value={spring.stats.seedling}
            color="text-teal-600"
          />
          <StatCard
            icon={ImageIcon}
            label="Foto"
            value={spring.stats.totalPhotos}
            color="text-purple-600"
          />
        </div>

        {/* Status summary */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
            {spring.stats.approvedReports} terverifikasi
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            {spring.stats.pendingReports} menunggu review
          </span>
        </div>
      </div>

      {/* Mini Map */}
      {spring.snappedLat && spring.snappedLng && (
        <div className="container-page pb-6">
          <MiniMap lat={spring.snappedLat} lng={spring.snappedLng} />
        </div>
      )}

      {/* Timeline & Gallery */}
      <div className="container-page grid gap-6 lg:grid-cols-5">
        {/* Timeline — 3/5 width */}
        <div className="lg:col-span-3">
          <h2 className="mb-4 text-lg font-bold text-ink">Timeline Aktivitas</h2>

          {spring.reports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-line p-8 text-center text-sm text-ink-muted">
              Belum ada aktivitas tercatat untuk mata air ini.
            </div>
          ) : (
            <div className="relative space-y-4">
              {/* Timeline vertical line */}
              <div className="absolute left-[13px] top-2 h-[calc(100%-16px)] w-0.5 bg-brand-100 dark:bg-brand-900/50" aria-hidden="true" />

              {spring.reports.map((report) => {
                const formInfo = formLabels[report.formSlug] || {
                  icon: Droplets,
                  label: report.formSlug,
                  color: "text-slate-600 bg-slate-50 dark:bg-slate-900/30 dark:text-slate-300",
                };
                const FormIcon = formInfo.icon;

                return (
                  <div key={report.id} className="relative flex gap-4 pl-8">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1 z-10 grid h-[26px] w-[26px] place-items-center rounded-full border-2 border-white bg-brand-50 dark:border-slate-900 dark:bg-brand-900/50">
                      <FormIcon className="h-3 w-3 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                    </div>

                    {/* Content card */}
                    <div className="min-w-0 flex-1 rounded-lg border border-ink-line/60 p-4 dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{formInfo.label}</span>
                          <span className={`chip text-[10px] ${report.status === "approved" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>
                            {report.status === "approved" ? "Terverifikasi" : "Pending"}
                          </span>
                        </div>
                        <span className="text-xs text-ink-muted">
                          {formatDateShort(report.createdAt)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" aria-hidden="true" />
                          {report.username}
                        </span>
                        {report.region && (
                          <span>{report.region}</span>
                        )}
                      </div>

                      {/* Notes */}
                      {report.notes && (
                        <p className="mt-2 text-sm text-ink-muted italic line-clamp-2">
                          &ldquo;{report.notes}&rdquo;
                        </p>
                      )}

                      {/* Photos */}
                      {report.photos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {report.photos.map((photo) => (
                            <button
                              key={photo.id}
                              onClick={() =>
                                setEnlargedPhoto({
                                  ...photo,
                                  reportDate: formatDateShort(report.createdAt),
                                  reportAuthor: report.username,
                                })
                              }
                              className="group relative h-20 w-20 flex-none overflow-hidden rounded-lg border border-ink-line/40 dark:border-slate-600"
                            >
                              <Image
                                src={photo.url}
                                alt=""
                                width={80}
                                height={80}
                                className="h-full w-full object-cover transition duration-200 group-hover:scale-110"
                                unoptimized
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                                <Camera className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gallery — 2/5 width */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-ink">Galeri Foto</h2>

          {allPhotos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-line p-8 text-center text-sm text-ink-muted">
              Belum ada foto untuk mata air ini.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {displayPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setEnlargedPhoto(photo)}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-ink-line/40 dark:border-slate-600"
                  >
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      className="object-cover transition duration-200 group-hover:scale-110"
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                      <Camera className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                    </div>
                    {/* Label form type */}
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                      {formLabels[photo.formSlug]?.label.slice(0, 12) || photo.formSlug}
                    </span>
                  </button>
                ))}
              </div>

              {allPhotos.length > 12 && !showAllPhotos && (
                <button
                  onClick={() => setShowAllPhotos(true)}
                  className="mt-3 w-full rounded-lg border border-ink-line py-2 text-sm font-medium text-ink-muted hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Lihat semua ({allPhotos.length} foto)
                </button>
              )}

              {showAllPhotos && allPhotos.length > 12 && (
                <button
                  onClick={() => setShowAllPhotos(false)}
                  className="mt-3 w-full rounded-lg border border-ink-line py-2 text-sm font-medium text-ink-muted hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Sembunyikan
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {enlargedPhoto && (
        <PhotoModal photo={enlargedPhoto} onClose={() => setEnlargedPhoto(null)} />
      )}
    </main>
  );
}
