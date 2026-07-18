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
  admin_approved: "Admin Setuju",
  owner_approved: "Pemilik Setuju",
  given: "Diberikan",
  completed: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

const CLS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  admin_approved: "bg-blue-50 text-blue-700",
  owner_approved: "bg-green-50 text-green-700",
  given: "bg-purple-50 text-purple-700",
  completed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function AdminSeedlingRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const csrf = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch("/api/admin/seedlings/requests", {
        headers: { "x-csrf-token": csrf.token },
      });
      const d = await res.json();
      setRequests(d.requests || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAdminApprove = async (seedlingId: string, requestId: string) => {
    const csrf = await fetch("/api/csrf").then(r => r.json());
    await fetch(`/api/admin/seedlings/${seedlingId}/approve-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrf.token },
      body: JSON.stringify({ requestId }),
    });
    fetchRequests();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-ink flex items-center gap-2 mb-4">
        <Sprout className="h-5 w-5 text-green-600" /> Permintaan Bibit
      </h1>

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
