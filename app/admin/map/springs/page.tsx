"use client";

import { useEffect, useState } from "react";
import { Droplets, CheckCircle, Clock } from "lucide-react";

export default function AdminSpringsPage() {
  const [springs, setSprings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const csrf = await fetch("/api/csrf").then(r => r.json());
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/springs?${params}`, {
        headers: { "x-csrf-token": csrf.token },
      });
      const d = await res.json();
      setSprings(d.springs || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [status]);

  const handleApprove = async (id: string) => {
    const csrf = await fetch("/api/csrf").then(r => r.json());
    await fetch(`/api/admin/springs/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrf.token },
    });
    fetchData();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-ink flex items-center gap-2 mb-4">
        <Droplets className="h-5 w-5 text-blue-600" /> Manajemen Spring
      </h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setStatus("")} className={`px-3 py-1 rounded-lg text-xs font-medium ${!status ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-muted"}`}>Semua</button>
        <button onClick={() => setStatus("pending")} className={`px-3 py-1 rounded-lg text-xs font-medium ${status === "pending" ? "bg-amber-500 text-white" : "bg-slate-100 text-ink-muted"}`}>Pending</button>
        <button onClick={() => setStatus("active")} className={`px-3 py-1 rounded-lg text-xs font-medium ${status === "active" ? "bg-green-600 text-white" : "bg-slate-100 text-ink-muted"}`}>Aktif</button>
        <button onClick={() => setStatus("merged")} className={`px-3 py-1 rounded-lg text-xs font-medium ${status === "merged" ? "bg-purple-600 text-white" : "bg-slate-100 text-ink-muted"}`}>Digabung</button>
      </div>

      {loading ? <p className="text-ink-muted">Memuat...</p> : springs.length === 0 ? (
        <p className="text-ink-muted">Tidak ada data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink-line text-left text-ink-muted text-xs">
                <th className="py-2 px-2">Nama</th>
                <th className="py-2 px-2">Lokasi</th>
                <th className="py-2 px-2">Laporan</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Tanggal</th>
                <th className="py-2 px-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {springs.map((s: any) => (
                <tr key={s.id} className="border-b border-ink-line/50 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-2 px-2 font-medium">{s.name}</td>
                  <td className="py-2 px-2 text-ink-muted">{s.regency}, {s.province}</td>
                  <td className="py-2 px-2">{s.reportCount}</td>
                  <td className="py-2 px-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      s.status === "active" ? "bg-green-50 text-green-700" :
                      s.status === "pending" ? "bg-amber-50 text-amber-700" :
                      "bg-purple-50 text-purple-700"
                    }`}>
                      {s.status === "active" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {s.status === "active" ? "Aktif" : s.status === "pending" ? "Pending" : "Digabung"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-ink-muted text-xs">{new Date(s.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="py-2 px-2">
                    {s.status === "pending" && (
                      <button onClick={() => handleApprove(s.id)}
                        className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600">
                        Setujui
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
