"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, MapPin, Phone, Mail, User } from "lucide-react";

type TreeDonation = {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  treeCount: number;
  treeSpecies: string;
  status: string;
  address: string;
  adminNote: string;
  createdAt: string;
};

export default function AdminTreeDonationsPage() {
  const [donations, setDonations] = useState<TreeDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TreeDonation | null>(null);
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/donations/tree")
      .then(r => r.json())
      .then(data => setDonations(data.donations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id: string, status: string) {
    await fetch(`/api/admin/tree-donations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, address, adminNote: note }),
    });
    setSelected(null);
    setAddress("");
    setNote("");
    const res = await fetch("/api/donations/tree").then(r => r.json());
    setDonations(res.donations || []);
  }

  const statusBadge: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
    completed: "bg-blue-50 text-blue-700",
  };

  if (loading) return <div className="py-20 text-center text-ink-muted">Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ink">Donasi Bibit Pohon</h2>
      <p className="text-sm text-ink-muted">{donations.length} permintaan</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
              <th className="pb-3 pr-3">Donatur</th>
              <th className="pb-3 pr-3">Bibit</th>
              <th className="pb-3 pr-3">Jenis</th>
              <th className="pb-3 pr-3">Status</th>
              <th className="pb-3 pr-3">Tanggal</th>
              <th className="pb-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {donations.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-ink-muted">Belum ada permintaan</td></tr>
            ) : donations.map(d => (
              <tr key={d.id} className="border-b border-ink-line hover:bg-slate-50">
                <td className="py-3 pr-3">
                  <span className="font-medium text-ink">{d.donorName}</span>
                  {d.donorEmail && <div className="text-xs text-ink-muted">{d.donorEmail}</div>}
                </td>
                <td className="py-3 pr-3 font-medium text-ink">{d.treeCount} bibit</td>
                <td className="py-3 pr-3 text-ink-muted">{d.treeSpecies || "—"}</td>
                <td className="py-3 pr-3">
                  <span className={`chip text-xs capitalize ${statusBadge[d.status]}`}>{d.status}</span>
                </td>
                <td className="py-3 pr-3 text-xs text-ink-muted">{new Date(d.createdAt).toLocaleDateString("id-ID")}</td>
                <td className="py-3">
                  <button onClick={() => { setSelected(d); setAddress(d.address); setNote(d.adminNote); }} className="text-xs text-brand-600 hover:underline">Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">Detail Permintaan</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-ink-muted" /> {selected.donorName}</div>
              {selected.donorEmail && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-ink-muted" /> {selected.donorEmail}</div>}
              {selected.donorPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-ink-muted" /> {selected.donorPhone}</div>}
              <div className="font-semibold text-ink">{selected.treeCount} bibit {selected.treeSpecies}</div>
            </div>

            {(selected.status === "pending") && (
              <div className="mt-4 space-y-3">
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat pengiriman" className="w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Catatan (opsional)" className="w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => handleAction(selected.id, "rejected")} className="flex-1 rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Tolak</button>
                  <button onClick={() => handleAction(selected.id, "approved")} className="flex-1 rounded-md bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">Setujui</button>
                </div>
              </div>
            )}

            {selected.status === "approved" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  ✅ Disetujui
                  {selected.address && <div className="mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {selected.address}</div>}
                </div>
                <button onClick={() => handleAction(selected.id, "completed")} className="btn-primary w-full">Tandai Selesai</button>
              </div>
            )}

            {selected.status === "rejected" && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">❌ Ditolak{selected.adminNote && `: ${selected.adminNote}`}</div>
            )}

            <button onClick={() => setSelected(null)} className="mt-4 w-full btn-secondary">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
