import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MapPin, Sparkles, CalendarDays, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Daftar Mata Air — SpringHub",
  description: "Semua mata air yang terdaftar di SpringHub",
};

export default async function SpringsListPage() {
  const springs = await prisma.spring.findMany({
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
  });

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-extrabold text-ink">Mata Air</h1>
      <p className="mt-2 text-ink-muted">Semua mata air yang dipantau oleh komunitas SpringHub</p>

      {springs.length === 0 ? (
        <div className="card mt-8 py-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-ink-subtle" />
          <p className="mt-2 text-sm text-ink-muted">Belum ada mata air terdaftar</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
