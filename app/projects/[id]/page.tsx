"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  TreePine,
  Droplets,
  Users,
  Calendar,
  Loader2,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

type ProjectDetail = {
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

const DUMMY_PROJECTS: Record<string, ProjectDetail> = {
  "proyek-dummy-1": {
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
  "proyek-dummy-2": {
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
  "proyek-dummy-3": {
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
  "proyek-dummy-4": {
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
  "proyek-dummy-5": {
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
};

const TYPE_INFO: Record<string, { icon: typeof TreePine; label: string }> = {
  restorasi: { icon: Droplets, label: "Restorasi Mata Air" },
  "tanam-pohon": { icon: TreePine, label: "Tanam Pohon" },
  rorak: { icon: Users, label: "Rorak / Trench" },
  monitoring: { icon: MapPin, label: "Monitoring" },
  bibit: { icon: TreePine, label: "Pembibitan" },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id as string;

    // First try the real API
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.project) {
          setProject(data.project);
        } else if (DUMMY_PROJECTS[id]) {
          setProject(DUMMY_PROJECTS[id]);
        } else {
          setProject(null);
        }
      })
      .catch(() => {
        setProject(DUMMY_PROJECTS[id] || null);
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <TreePine className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-ink-muted">Proyek tidak ditemukan</p>
          <Link href="/projects" className="btn-primary mt-6 inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = TYPE_INFO[project.typeId] || { icon: TreePine, label: project.typeId };
  const Icon = typeInfo.icon;
  const progress = project.goalAmount > 0 ? Math.round((project.raisedAmount / project.goalAmount) * 100) : 0;

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-b from-emerald-50 to-white py-12 dark:from-emerald-950 dark:to-slate-900">
        <div className="container-page">
          <Link
            href="/projects"
            className="mb-6 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
              <Icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {typeInfo.label}
                </span>
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
                {project.title}
              </h1>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-ink">Tentang Proyek</h2>
            <p className="mt-3 text-ink-muted leading-relaxed">{project.summary}</p>

            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-ink">Detail</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="mt-1 text-sm font-medium text-ink">Lokasi</p>
                  <p className="text-sm text-ink-muted">{project.region}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="mt-1 text-sm font-medium text-ink">Dibuat</p>
                  <p className="text-sm text-ink-muted">{project.createdAt}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-lg font-bold text-ink">Perkembangan Pendanaan</h3>
              {project.goalAmount > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Rp {formatNumber(project.raisedAmount)}
                    </span>
                    <span className="text-ink-muted">dari Rp {formatNumber(project.goalAmount)}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-sm font-medium text-ink">{progress}%</p>
                </div>
              )}
              <div className="mt-6 space-y-3 text-sm text-ink-muted">
                <div className="flex justify-between">
                  <span>Target</span>
                  <span className="font-medium text-ink">Rp {formatNumber(project.goalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Terkumpul</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Rp {formatNumber(project.raisedAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa</span>
                  <span className="font-medium text-ink">
                    Rp {formatNumber(Math.max(0, project.goalAmount - project.raisedAmount))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
