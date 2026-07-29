"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, TreePine, Droplets, Users, Calendar, Loader2, MessageSquare, Heart, Phone, Mail, FileText, Download } from "lucide-react";
import { CommentsSection } from "@/components/projects/CommentsSection";
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
  likes: number;
  comments: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  proposalFile: string | null;
  featuredPhoto: { id: string; url: string } | null;
  photos: { id: string; url: string }[];
  fieldData: Record<string, unknown>;
  user: { username: string } | null;
  _count: { donations: number; comments: number };
};

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    const id = params?.id as string;
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) { setNotFound(true); return; }
      const data = await res.json();
      if (data.project) setProject(data.project);
      else setNotFound(true);
    } catch { setNotFound(true); }
    finally { setLoading(false); }
  }, [params?.id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) return <div className="container-page flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>;
  if (notFound || !project) return <div className="container-page py-20 text-center"><h1 className="text-2xl font-bold text-ink">Proyek tidak ditemukan</h1><Link href="/projects" className="btn-primary mt-4 inline-flex">Lihat semua proyek</Link></div>;

  const fd = project.fieldData || {};
  const progress = project.goalAmount > 0 ? Math.round((project.raisedAmount / project.goalAmount) * 100) : 0;

  return (
    <div className="container-page py-12">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Kembali</Link>

      {/* Header */}
      <div className="mt-6 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {/* Foto */}
          <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {project.featuredPhoto?.url ? (
              <img src={project.featuredPhoto.url} alt={project.title} className="h-full w-full object-cover cursor-pointer" onClick={() => setExpandedPhoto(project.featuredPhoto!.url)} />
            ) : project.photos?.[0]?.url ? (
              <img src={project.photos[0].url} alt={project.title} className="h-full w-full object-cover cursor-pointer" onClick={() => setExpandedPhoto(project.photos[0].url)} />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-subtle">Belum ada foto</div>
            )}
          </div>
          {/* Gallery */}
          {project.photos && project.photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {project.photos.map((p, i) => (
                <button key={p.id} onClick={() => setExpandedPhoto(p.url)} className={`flex-shrink-0 h-16 w-24 overflow-hidden rounded-lg border-2 ${project.featuredPhoto?.id === p.id ? 'border-brand-500' : 'border-ink-line/30'}`}>
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Deskripsi */}
          <div className="mt-6 space-y-4">
            <h1 className="text-2xl font-bold text-ink">{project.title}</h1>
            <p className="text-sm text-ink-muted leading-relaxed">{project.summary}</p>

            {/* Semua field dari form */}
            <div className="mt-6 rounded-xl border border-ink-line p-4 space-y-3">
              <h2 className="text-sm font-semibold text-ink">Detail Pengajuan</h2>
              {!!fd.A_nama && <InfoRow icon={<Users className="h-4 w-4" />} label="Pengusul" value={String(fd.A_nama)} />}
              {!!fd.A_wa && <InfoRow icon={<Phone className="h-4 w-4" />} label="WA" value={String(fd.A_wa)} />}
              {!!fd.A_email && <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={String(fd.A_email)} />}
              {!!fd.A_organisasi && <InfoRow icon={<Users className="h-4 w-4" />} label="Organisasi" value={String(fd.A_organisasi)} />}
              {!!fd.A_peran && <InfoRow icon={<Users className="h-4 w-4" />} label="Peran" value={String(fd.A_peran)} />}
              {!!fd.A_pengalaman && <InfoRow icon={<FileText className="h-4 w-4" />} label="Pengalaman" value={String(fd.A_pengalaman)} />}
              {!!fd.B3_tempat && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Lokasi" value={String(fd.B3_tempat)} />}
              {!!fd.B2_jenis && <InfoRow icon={<TreePine className="h-4 w-4" />} label="Jenis Kegiatan" value={Array.isArray(fd.B2_jenis) ? (fd.B2_jenis as string[]).join(", ") : String(fd.B2_jenis)} />}
              {!!fd.C1_waktu && <InfoRow icon={<Calendar className="h-4 w-4" />} label="Waktu" value={String(fd.C1_waktu)} />}
              {!!fd.C2_target && <InfoRow icon={<FileText className="h-4 w-4" />} label="Target" value={String(fd.C2_target)} />}
              {!!fd.C3_relawan && <InfoRow icon={<Users className="h-4 w-4" />} label="Relawan" value={`${fd.C3_relawan} orang`} />}
              {!!fd.C3_mitra && <InfoRow icon={<Users className="h-4 w-4" />} label="Mitra" value={Array.isArray(fd.C3_mitra) ? (fd.C3_mitra as string[]).join(", ") : String(fd.C3_mitra)} />}
              {!!fd.D1_biaya && <InfoRow icon={<FileText className="h-4 w-4" />} label="Biaya" value={String(fd.D1_biaya)} />}
              {!!fd.D1_rincian && <InfoRow icon={<FileText className="h-4 w-4" />} label="Rincian Dana" value={String(fd.D1_rincian)} />}
              {!!fd.D2_dukungan && <InfoRow icon={<FileText className="h-4 w-4" />} label="Dukungan" value={Array.isArray(fd.D2_dukungan) ? (fd.D2_dukungan as string[]).join(", ") : String(fd.D2_dukungan)} />}
              {!!fd.D2_dana_ada && <InfoRow icon={<FileText className="h-4 w-4" />} label="Dana Ada" value={String(fd.D2_dana_ada)} />}
              {!!fd.E2_catatan && <InfoRow icon={<FileText className="h-4 w-4" />} label="Catatan" value={String(fd.E2_catatan)} />}
              {!!fd.B4_latar && <div className="pt-2"><h3 className="text-xs font-semibold text-ink-muted uppercase">Latar Belakang</h3><p className="mt-1 text-sm text-ink leading-relaxed">{String(fd.B4_latar)}</p></div>}
            </div>
          </div>

          <CommentsSection projectId={project.id} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-ink-line p-4 space-y-4">
            <h2 className="text-lg font-bold text-ink">{project.title}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-muted">Dana Terkumpul</span><span className="font-semibold text-green-600">Rp {formatNumber(project.raisedAmount)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Target</span><span className="font-semibold">Rp {formatNumber(project.goalAmount)}</span></div>
              {project.goalAmount > 0 && (
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-2 rounded-full bg-green-500" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                  <p className="mt-1 text-xs text-ink-muted">{progress}% terkumpul</p>
                </div>
              )}
              <hr className="border-ink-line" />
              <div className="flex justify-between"><span className="text-ink-muted">Status</span><span className="font-semibold capitalize">{project.status}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Pengusul</span><span className="font-semibold">{project.contactName || project.user?.username || "-"}</span></div>
              {project.contactPhone && <div className="flex justify-between"><span className="text-ink-muted">Kontak</span><span className="font-semibold">{project.contactPhone}</span></div>}
              {project.contactEmail && <div className="flex justify-between"><span className="text-ink-muted">Email</span><span className="font-semibold">{project.contactEmail}</span></div>}
              <div className="flex justify-between"><span className="text-ink-muted">Donasi</span><span className="font-semibold">{project._count.donations} donatur</span></div>
              {project.region && <div className="flex items-center gap-1 text-ink-muted"><MapPin className="h-3.5 w-3.5" />{project.region}</div>}
            </div>

            {/* Proposal PDF */}
            {project.proposalFile && project.proposalFile.startsWith("data:application/pdf") && (
              <a href={project.proposalFile} target="_blank" className="btn-primary w-full inline-flex items-center justify-center gap-2 mt-4" download>
                <Download className="h-4 w-4" /> Download Proposal
              </a>
            )}

            {/* Donasi — TERTUNDA */}
            <button disabled className="btn-primary w-full mt-2 opacity-50 cursor-not-allowed">
              Donasi (Tertunda — butuh Xendit)
            </button>
          </div>
        </div>
      </div>

      {/* Modal foto besar */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setExpandedPhoto(null)}>
          <img src={expandedPhoto} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-ink-muted">{icon}</span>
      <div><span className="font-medium text-ink">{label}: </span><span className="text-ink-muted">{value}</span></div>
    </div>
  );
}
