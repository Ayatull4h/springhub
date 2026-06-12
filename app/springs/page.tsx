export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MapPin, Sparkles, CalendarDays, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Daftar Mata Air — SpringHub",
  description: "Semua mata air yang terdaftar di SpringHub",
};

const ITEMS_PER_PAGE = 10;

export default async function SpringsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const [springs, totalCount] = await Promise.all([
    prisma.spring.findMany({
      select: {
        id: true,
        name: true,
        province: true,
        regency: true,
        snappedLat: true,
        snappedLng: true,
        createdAt: true,
        _count: { select: { reports: { where: { status: "approved" } } } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.spring.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-extrabold text-ink">Mata Air</h1>
      <p className="mt-2 text-ink-muted">
        Semua mata air yang dipantau oleh komunitas SpringHub
        <span className="ml-1 text-ink-subtle">({totalCount} total)</span>
      </p>

      {springs.length === 0 ? (
        <div className="card mt-8 py-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-ink-subtle" />
          <p className="mt-2 text-sm text-ink-muted">Belum ada mata air terdaftar</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3">
            {springs.map((spring) => (
              <Link
                key={spring.id}
                href={`/springs/${spring.id}`}
                className="card flex items-start justify-between transition hover:border-brand-300"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                    <MapPin className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink">{spring.name}</h2>
                    <p className="text-xs text-ink-muted">
                      {spring.province && `${spring.province}${spring.regency ? `, ${spring.regency}` : ""}`}
                      {spring.snappedLat && ` · ${spring.snappedLat.toFixed(3)}, ${spring.snappedLng?.toFixed(3)}`}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-ink-subtle">
                      <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" />{spring._count.reports} laporan</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(spring.createdAt).getFullYear()}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-ink-subtle flex-none" />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/springs?page=${currentPage - 1}`}
                  className="btn-secondary inline-flex items-center gap-1 px-3 py-2 text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              )}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, current, and adjacent pages
                    return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                  })
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-ink-subtle">...</span>
                      )}
                      {p === currentPage ? (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
                          {p}
                        </span>
                      ) : (
                        <Link
                          href={`/springs?page=${p}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-ink-muted transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {p}
                        </Link>
                      )}
                    </span>
                  ))}
              </div>
              {currentPage < totalPages && (
                <Link
                  href={`/springs?page=${currentPage + 1}`}
                  className="btn-secondary inline-flex items-center gap-1 px-3 py-2 text-sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
