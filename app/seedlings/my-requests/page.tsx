"use client";

import { useState, useEffect } from "react";
import { FileText, User, MapPin, Clock, Phone, PhoneCall, X, Inbox, Loader2 } from "lucide-react";
import Link from "next/link";

type RequestItem = {
  id: string; species: string; qty: number;
  owner: string; location: string;
  status: "pending" | "approved" | "rejected" | "fulfilled" | "cancelled";
  date: string; phone?: string;
};

const STATUS: Record<string, { cls: string; icon: typeof Clock; label: string }> = {
  pending:   { cls: "bg-amber-50 text-amber-700", icon: Clock, label: "Menunggu" },
  approved:  { cls: "bg-green-50 text-green-700", icon: Phone, label: "Disetujui" },
  rejected:  { cls: "bg-rose-50 text-rose-600", icon: X, label: "Ditolak" },
  fulfilled: { cls: "bg-blue-50 text-blue-600", icon: Phone, label: "Selesai" },
  cancelled: { cls: "bg-slate-100 text-slate-500", icon: X, label: "Dibatalkan" },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)} bulan lalu`;
  if (days > 0) return `${days} hari lalu`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs > 0) return `${hrs} jam lalu`;
  return "Baru saja";
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seedling-requests?type=outgoing")
      .then(r => r.json())
      .then(data => setRequests(data.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="container-page py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-3 text-sm text-ink-muted">Memuat permintaan...</p>
      </main>
    );
  }

  return (
    <main className="container-page py-8">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-extrabold text-ink">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <FileText className="h-5 w-5 text-blue-600" />
        </span>
        Permintaanku
      </h1>

      {requests.length === 0 ? (
        <div className="flex animate-fade flex-col items-center py-16 text-center">
          <Inbox className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-ink">Belum ada permintaan</h3>
          <p className="mt-1 text-sm text-ink-muted">Jelajahi bibit yang tersedia di marketplace</p>
          <Link href="/seedlings" className="btn-soft mt-4 inline-flex items-center gap-2">
            Jelajahi Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((r, i) => {
            const st = STATUS[r.status] || STATUS.pending;
            const Icon = st.icon;
            return (
              <div
                key={r.id}
                className="flex animate-fade-up flex-wrap items-center gap-3 rounded-xl border border-ink-line bg-white p-4 shadow-card transition hover:shadow-elevated"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <div className="min-w-[180px] flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-[0.9375rem] font-semibold text-ink">{r.seedling?.species || "Bibit"}</strong>
                    <span className="text-sm text-ink-muted">{r.quantity} bibit</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                      <Icon className="h-3 w-3" />
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{r.owner?.username || "Petani"}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.seedling?.regency || ""}, {r.seedling?.province || ""}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(r.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "pending" && (
                    <button className="btn-sm btn-danger inline-flex items-center gap-1"
                      onClick={() => alert("Fitur batalkan belum tersedia")}>
                      <X className="h-3 w-3" />Batalkan
                    </button>
                  )}
                  {r.status === "approved" && r.owner?.phone && (
                    <>
                      <span className="flex items-center gap-1 text-sm text-ink-muted">
                        <Phone className="h-3.5 w-3.5 text-green-500" />
                        {r.owner.phone}
                      </span>
                      <a href={`tel:${r.owner.phone}`} className="btn-sm btn-soft inline-flex items-center gap-1">
                        <PhoneCall className="h-3 w-3" />Hubungi
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
