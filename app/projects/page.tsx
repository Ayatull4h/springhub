"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Users, TreePine, Droplets, Loader2, ArrowRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";

type ProjectItem = {
  id: string;
  title: string;
  summary: string;
  region: string;
  status: string;
  goalAmount: number;
  raisedAmount: number;
  typeId: string;
  createdAt: string;
};

const DUMMY_PROJECTS: ProjectItem[] = [
  {
    id: "proyek-dummy-1",
    title: "Restorasi Mata Air Cikole",
    summary: "Merestorasi mata air Cikole yang mengalami sedimentasi berat akibat erosi. Target pengerukan 50 m³ sedimen dan penanaman 200 pohon di area tangkapan air.",
    region: "Bandung, Jawa Barat",
    status: "approved",
    goalAmount: 50_000_000,
    raisedAmount: 32_500_000,
    typeId: "restorasi",
    createdAt: "2026-05-01",
  },
  {
    id: "proyek-dummy-2",
    title: "Program Penghijauan DAS Code",
    summary: "Menanam 5.000 bibit pohon endemic di sepanjang Daerah Aliran Sungai Code untuk memperkuat resapan air dan mencegah longsor.",
    region: "Sleman, DI Yogyakarta",
    status: "approved",
    goalAmount: 25_000_000,
    raisedAmount: 18_200_000,
    typeId: "tanam-pohon",
    createdAt: "2026-04-15",
  },
  {
    id: "proyek-dummy-3",
    title: "Pembangunan 100 Rorak di Lereng Merbabu",
    summary: "Membangun 100 rorak (trench) di area resapan lereng Gunung Merbabu untuk meningkatkan infiltrasi air tanah dan mencegah erosi.",
    region: "Magelang, Jawa Tengah",
    status: "approved",
    goalAmount: 75_000_000,
    raisedAmount: 45_000_000,
    typeId: "rorak",
    createdAt: "2026-03-20",
  },
  {
    id: "proyek-dummy-4",
    title: "Monitoring Mata Air di Gunung Kidul",
    summary: "Program monitoring partisipatif terhadap 25 mata air di kawasan karst Gunung Kidul yang rawan kering saat kemarau.",
    region: "Gunung Kidul, DI Yogyakarta",
    status: "draft",
    goalAmount: 15_000_000,
    raisedAmount: 0,
    typeId: "monitoring",
    createdAt: "2026-06-01",
  },
  {
    id: "proyek-dummy-5",
    title: "Pembibitan Tanaman Konservasi",
    summary: "Membangun nursery untuk memproduksi 10.000 bibit pohon konservasi per tahun untuk mendukung program restorasi mata air.",
    region: "Bogor, Jawa Barat",
    status: "approved",
    goalAmount: 30_000_000,
    raisedAmount: 12_750_000,
    typeId: "bibit",
    createdAt: "2026-02-10",
  },
];

const TYPE_ICONS: Record<string, typeof TreePine> = {
  restorasi: Droplets,
  "tanam-pohon": TreePine,
  rorak: Users,
  monitoring: MapPin,
  bibit: TreePine,
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  approved: "Aktif",
  completed: "Selesai",
  rejected: "Ditolak",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects?.length) {
          setProjects(data.projects);
        } else {
          setProjects(DUMMY_PROJECTS);
        }
      })
      .catch(() => setProjects(DUMMY_PROJECTS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-b from-emerald-50 to-white py-20 dark:from-emerald-950 dark:to-slate-900">
        <div className="container-page text-center">
          <TreePine className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Proyek Konservasi
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-muted">
            Jelajahi proyek-proyek konservasi mata air yang sedang berjalan dan dukung dampak positifnya
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center">
            <TreePine className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-ink-muted">Belum ada proyek konservasi.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const Icon = TYPE_ICONS[p.typeId] || TreePine;
              const progress = p.goalAmount > 0 ? Math.round((p.raisedAmount / p.goalAmount) * 100) : 0;
              return (
                <article key={p.id} className="card flex flex-col">
                  <div className="-mx-4 -mt-4 mb-3 flex h-32 items-center justify-center rounded-t-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/50">
                    <Icon className="h-12 w-12 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`chip text-xs ${p.status === "approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-ink">{p.title}</h2>
                  <p className="mt-1 text-sm text-ink-muted line-clamp-2">{p.summary}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
                    <MapPin className="h-3 w-3" />
                    {p.region}
                  </div>
                  {p.goalAmount > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-ink-muted">
                        <span>Rp {formatNumber(p.raisedAmount)}</span>
                        <span>Rp {formatNumber(p.goalAmount)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-ink-subtle">{progress}% terkumpul</p>
                    </div>
                  )}
                  <Link
                    href={`/projects/${p.id}`}
                    className="btn-secondary mt-5 inline-flex items-center justify-center gap-1.5"
                  >
                    Lihat Detail <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
