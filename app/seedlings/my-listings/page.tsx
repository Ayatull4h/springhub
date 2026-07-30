"use client";

import { useState, useEffect } from "react";
import { Sprout, Check, X, CheckCheck, Clock, MessageCircle, Package, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS: Record<string, { cls: string; icon: typeof Clock; label: string; border: string }> = {
  pending:   { cls: "bg-amber-50 text-amber-700", icon: Clock, label: "Menunggu", border: "var(--amber-500)" },
  approved:  { cls: "bg-green-50 text-green-700", icon: Check, label: "Disetujui", border: "var(--green-500)" },
  fulfilled: { cls: "bg-blue-50 text-blue-600", icon: CheckCheck, label: "Selesai", border: "var(--blue-500)" },
  rejected:  { cls: "bg-rose-50 text-rose-600", icon: X, label: "Ditolak", border: "var(--slate-300)" },
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

export default function MyListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seedlings?mine=1")
      .then(r => r.json())
      .then(data => setListings(data.seedlings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="container-page py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-3 text-sm text-ink-muted">Memuat daftar bibit...</p>
      </main>
    );
  }

  return (
    <main className="container-page py-8">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-extrabold text-ink">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-50 to-green-100">
          <Sprout className="h-5 w-5 text-green-600" />
        </span>
        Bibitku
      </h1>

      <div className="space-y-4">
        {listings.map((listing: any, gi: number) => (
          <div
            key={listing.id}
            className="overflow-hidden rounded-xl border border-ink-line bg-white shadow-card"
            style={{ animation: `fadeUp 0.4s ease-out ${gi * 80}ms both` }}
          >
            <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
              <div>
                <h3 className="font-semibold text-ink">{listing.species || "Bibit"}</h3>
                <p className="text-xs text-ink-muted">{listing.stock || 0} bibit stok</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {(listing.requests || []).length} permintaan
              </span>
            </div>

            {(!listing.requests || listing.requests.length === 0) ? (
              <div className="flex flex-col items-center py-6 text-center text-sm text-ink-muted">
                <MessageCircle className="mb-2 h-6 w-6 text-slate-300" />
                Belum ada permintaan untuk bibit ini
              </div>
            ) : (
              <div>
                {listing.requests.map((req: any, ri: number) => {
                  const st = STATUS[req.status] || STATUS.pending;
                  const Icon = st.icon;
                  const delay = (gi * 3 + ri) * 50;
                  return (
                    <div
                      key={req.id}
                      className="flex flex-wrap items-center gap-2.5 border-b border-ink-line px-4 py-3 transition hover:bg-slate-50 last:border-b-0"
                      style={{
                        borderLeft: `3px solid ${st.border}`,
                        animation: `fadeUp 0.3s ease-out ${delay}ms both`,
                      }}
                    >
                      <div className="min-w-[160px] flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-semibold text-ink">{req.requester?.username || "Peminta"}</strong>
                          <span className="text-sm text-ink-muted">minta {req.quantity}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                            <Icon className="h-3 w-3" />
                            {st.label}
                          </span>
                        </div>
                        {req.message && (
                          <p className="mt-0.5 text-xs italic text-ink-muted">&ldquo;{req.message}&rdquo;</p>
                        )}
                        <p className="mt-0.5 text-[0.625rem] text-ink-subtle">{timeAgo(req.createdAt)}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {req.status === "pending" && (
                          <>
                            <button className="btn-sm btn-soft inline-flex items-center gap-1" onClick={() => alert("Disetujui (demo)")}>
                              <Check className="h-3 w-3" />Setujui
                            </button>
                            <button className="btn-sm btn-danger inline-flex items-center gap-1" onClick={() => alert("Ditolak (demo)")}>
                              <X className="h-3 w-3" />Tolak
                            </button>
                          </>
                        )}
                        {req.status === "approved" && (
                          <button className="btn-sm btn-blue inline-flex items-center gap-1" onClick={() => alert("Selesai (demo)")}>
                            <CheckCheck className="h-3 w-3" />Selesai
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {listings.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Package className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-ink">Belum ada bibit</h3>
            <Link href="/report/seedling-stock" className="btn-soft mt-4 inline-flex items-center gap-2">
              Laporkan Stok Bibit
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
