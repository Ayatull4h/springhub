import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Droplets, MapPin, CalendarDays, ChevronRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Timeline Mata Air — SpringHub",
  description: "Riwayat pemantauan dan restorasi mata air",
};

const formLabels: Record<string, string> = {
  "spring-monitoring": "Pemantauan",
  "spring-restoration": "Restorasi",
  "trench-development": "Rorak",
  "tree-planting": "Tanam Pohon",
  "seedling-stock": "Stok Bibit",
};

const typeColors: Record<string, string> = {
  "spring-monitoring": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "spring-restoration": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "trench-development": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "tree-planting": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "seedling-stock": "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

export default async function SpringTimelinePage({
  params,
}: {
  params: { id: string };
}) {
  const spring = await prisma.spring.findUnique({
    where: { id: params.id },
    include: {
      reports: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { username: true, region: true } },
          photos: { select: { id: true, storagePath: true, fieldId: true }, take: 2 },
        },
      },
    },
  });

  if (!spring) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Mata air tidak ditemukan</h1>
        <Link href="/springs" className="btn-primary mt-4 inline-flex">Lihat Semua Mata Air</Link>
      </div>
    );
  }

  const reportCount = spring.reports.length;
  const latestReport = spring.reports[0];
  const years = [...new Set(spring.reports.map(r => new Date(r.createdAt).getFullYear()))].sort((a, b) => b - a);

  return (
    <div className="container-page py-12">
      {/* Back link */}
      <Link
        href="/springs"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Semua Mata Air
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">{spring.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            {spring.province && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{spring.province}{spring.regency ? `, ${spring.regency}` : ""}</span>}
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Dipantau sejak {new Date(spring.createdAt).getFullYear()}</span>
            <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">{reportCount} laporan</span>
          </div>
        </div>
      </div>

      {/* Quick info */}
      {latestReport && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="card">
            <p className="text-xs text-ink-subtle">Terakhir diperbarui</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {new Date(latestReport.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-ink-subtle">Total laporan</p>
            <p className="mt-1 text-sm font-semibold text-ink">{reportCount} laporan</p>
          </div>
          <div className="card">
            <p className="text-xs text-ink-subtle">Tahun pemantauan</p>
            <p className="mt-1 text-sm font-semibold text-ink">{years.length} tahun</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-ink">Riwayat Laporan</h2>
        <div className="mt-4 space-y-4">
          {spring.reports.map((report, idx) => {
            let fieldData: Record<string, unknown> = {};
            try { fieldData = JSON.parse(report.fieldData); } catch { fieldData = {}; }

            return (
              <div key={report.id} className="card relative">
                {/* Timeline connector */}
                {idx < spring.reports.length - 1 && (
                  <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-ink-line" />
                )}

                <div className="flex items-start gap-4">
                  {/* Date dot */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {new Date(report.createdAt).getFullYear()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`chip ${typeColors[report.formSlug] || "bg-slate-100 text-slate-700"}`}>
                        {formLabels[report.formSlug] || report.formSlug}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {new Date(report.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      <span className="text-xs text-ink-subtle">oleh {report.user?.username || "anonim"}</span>
                    </div>

                    {/* Field data preview */}
                    <div className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                      {Object.entries(fieldData).slice(0, 6).map(([key, val]) => (
                        key !== "_website" && key !== "_submit_time" && key !== "form_slug" && (
                          <div key={key} className="text-xs">
                            <span className="text-ink-subtle">{key.replace(/_/g, " ")}: </span>
                            <span className="text-ink">{Array.isArray(val) ? val.join(", ") : String(val).slice(0, 60)}</span>
                          </div>
                        )
                      ))}
                    </div>

                    {/* Photos */}
                    {report.photos.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {report.photos.map((photo) => (
                          <div key={photo.id} className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                            <img
                              src={photo.storagePath || "/placeholder.svg"}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
