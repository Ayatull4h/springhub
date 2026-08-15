"use client";

import { useEffect, useState } from "react";
import { Sprout, CheckCircle, XCircle, Clock } from "lucide-react";

type RequestItem = {
  id: string;
  seedlingId: string;
  quantity: number;
  message: string;
  status: string;
  createdAt: string;
  requester: { id: string; username: string };
  owner: { id: string; username: string };
  seedling: { species: string; stock: number };
};

const LBL: Record<string, string> = {
  pending: "Menunggu",
  completed: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

const CLS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function AdminSeedlingRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seedlings/requests");
      if (!res.ok) {
        setMsg("Gagal memuat permintaan");
        return;
      }
      const d = await res.json();
      setRequests(d.requests || []);
    } catch (e) { console.error(e); setMsg("Gagal memuat permintaan"); }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAdminApprove = async (seedlingId: string, requestId: string) => {
    setProcessing((p) => ({ ...p, [requestId]: true }));
    setMsg("");
    try {
      const { token } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch(`/api/admin/seedlings/${seedlingId}/approve-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ requestId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(d.error || "Gagal menyetujui permintaan");
      } else {
        setMsg("Permintaan disetujui!");
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
      setMsg("Gagal menyetujui permintaan");
    }
    setProcessing((p) => ({ ...p, [requestId]: false }));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-ink flex items-center gap-2 mb-4">
        <Sprout className="h-5 w-5 text-green-600" /> Permintaan Bibit
      </h1>

      {msg && (
        <p className="mb-3 rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          {msg}
        </p>
      )}

      {loading ? <p className="text-ink-muted">Memuat...</p> : requests.length === 0 ? (
        <p className="text-ink-muted">Belum ada permintaan</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink-line text-left text-ink-muted text-xs">
                <th className="py-2 px-2">Bibit</th>
                <th className="py-2 px-2">Jumlah</th>
                <th className="py-2 px-2">Peminta</th>
                <th className="py-2 px-2">Pemilik</th>
                <th className="py-2 px-2">Pesan</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Tanggal</th>
                <th className="py-2 px-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-ink-line/50 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-2 px-2 font-medium">{r.seedling?.species || "-"}</td>
                  <td className="py-2 px-2">{r.quantity}</td>
                  <td className="py-2 px-2">{r.requester?.username || "-"}</td>
                  <td className="py-2 px-2">{r.owner?.username || "-"}</td>
                  <td className="py-2 px-2 text-ink-muted max-w-[150px] truncate">{r.message || "-"}</td>
                  <td className="py-2 px-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${CLS[r.status] || "bg-slate-100"}`}>
                      {LBL[r.status] || r.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-ink-muted text-xs">{new Date(r.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="py-2 px-2">
                    {r.status === "pending" && (
                      <button onClick={() => handleAdminApprove(r.seedlingId, r.id)}
                        disabled={processing[r.id]}
                        className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                        {processing[r.id] ? "Memproses..." : "Setujui"}
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
