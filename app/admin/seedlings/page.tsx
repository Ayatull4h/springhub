"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sprout, Search, CheckCircle, XCircle, Clock } from "lucide-react";

type SeedlingItem = {
  id: string;
  species: string;
  quantity: number;
  stock: number;
  province: string;
  status: string;
  createdAt: string;
  user: { id: string; username: string; email: string };
};

type PageData = {
  seedlings: SeedlingItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export default function AdminSeedlingsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const csrf = await fetch("/api/csrf").then(r => r.json());
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/seedlings?${params}`, {
        headers: { "x-csrf-token": csrf.token },
      });
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, status]);

  const handleApprove = async (id: string) => {
    const csrf = await fetch("/api/csrf").then(r => r.json());
    await fetch(`/api/admin/seedlings/${id}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrf.token },
    });
    fetchData();
  };

  const handleReject = async (id: string) => {
    const csrf = await fetch("/api/csrf").then(r => r.json());
    await fetch(`/api/admin/seedlings/${id}/reject`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrf.token },
    });
    fetchData();
  };

  const STATUS = { pending: "Menunggu", active: "Aktif", rejected: "Ditolak", exhausted: "Habis" };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-ink flex items-center gap-2 mb-4">
        <Sprout className="h-5 w-5 text-green-600" /> Manajemen Bibit
      </h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setStatus("")} className={`px-3 py-1 rounded-lg text-xs font-medium ${!status ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-muted"}`}>Semua</button>
        <button onClick={() => setStatus("pending")} className={`px-3 py-1 rounded-lg text-xs font-medium ${status === "pending" ? "bg-amber-500 text-white" : "bg-slate-100 text-ink-muted"}`}>Menunggu</button>
        <button onClick={() => setStatus("active")} className={`px-3 py-1 rounded-lg text-xs font-medium ${status === "active" ? "bg-green-600 text-white" : "bg-slate-100 text-ink-muted"}`}>Aktif</button>
        <button onClick={() => setStatus("rejected")} className={`px-3 py-1 rounded-lg text-xs font-medium ${status === "rejected" ? "bg-red-600 text-white" : "bg-slate-100 text-ink-muted"}`}>Ditolak</button>
        <button onClick={() => setStatus("exhausted")} className={`px-3 py-1 rounded-lg text-xs font-medium ${status === "exhausted" ? "bg-slate-600 text-white" : "bg-slate-100 text-ink-muted"}`}>Habis</button>
      </div>

      {loading ? <p className="text-ink-muted">Memuat...</p> : !data?.seedlings?.length ? (
        <p className="text-ink-muted">Tidak ada bibit</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-ink-line text-left text-ink-muted text-xs">
                  <th className="py-2 px-2">Jenis</th>
                  <th className="py-2 px-2">Jumlah</th>
                  <th className="py-2 px-2">Stok</th>
                  <th className="py-2 px-2">Provinsi</th>
                  <th className="py-2 px-2">Pelapor</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Tanggal</th>
                  <th className="py-2 px-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.seedlings.map((s) => (
                  <tr key={s.id} className="border-b border-ink-line/50 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-2 px-2 font-medium">{s.species}</td>
                    <td className="py-2 px-2">{s.quantity}</td>
                    <td className="py-2 px-2">{s.stock}</td>
                    <td className="py-2 px-2 text-ink-muted">{s.province}</td>
                    <td className="py-2 px-2 text-ink-muted">{s.user?.username || "-"}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        s.status === "active" ? "bg-green-50 text-green-700" :
                        s.status === "pending" ? "bg-amber-50 text-amber-700" :
                        s.status === "rejected" ? "bg-red-50 text-red-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {s.status === "active" ? <CheckCircle className="h-3 w-3" /> :
                         s.status === "pending" ? <Clock className="h-3 w-3" /> :
                         <XCircle className="h-3 w-3" />}
                        {STATUS[s.status as keyof typeof STATUS] || s.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-ink-muted text-xs">{new Date(s.createdAt).toLocaleDateString("id-ID")}</td>
                    <td className="py-2 px-2">
                      {s.status === "pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => handleApprove(s.id)} className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600">Setuju</button>
                          <button onClick={() => handleReject(s.id)} className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600">Tolak</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pagination?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 text-xs rounded border border-ink-line disabled:opacity-30">←</button>
              <span className="text-xs text-ink-muted">Halaman {page} dari {data.pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= (data.pagination?.totalPages || 1)} className="px-3 py-1 text-xs rounded border border-ink-line disabled:opacity-30">→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
