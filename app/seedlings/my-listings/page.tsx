"use client";

import { Sprout, Check, X, CheckCheck, Clock, MessageCircle, Package } from "lucide-react";
import Link from "next/link";

type RequestItem = {
  id: string; from: string; qty: number; message: string;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  date: string;
};

type ListingItem = {
  id: string; species: string; count: number;
  requests: RequestItem[];
};

const DUMMY: ListingItem[] = [
  {
    id: "1", species: "Jati", count: 50,
    requests: [
      { id: "r1", from: "Budi", qty: 10, message: "Mau tanam di kebun", status: "pending", date: "2 hari lalu" },
      { id: "r2", from: "Sari", qty: 5, message: "Buat penghijauan RT", status: "approved", date: "1 hari lalu" },
      { id: "r3", from: "Doni", qty: 3, message: "Bibit buat kelompok tani", status: "fulfilled", date: "5 hari lalu" },
    ],
  },
  {
    id: "2", species: "Bambu Petung", count: 30,
    requests: [
      { id: "r4", from: "Rudi", qty: 8, message: "Mau nanam di pinggir sungai", status: "pending", date: "3 hari lalu" },
    ],
  },
  {
    id: "3", species: "Mahoni", count: 100,
    requests: [],
  },
];

const STATUS: Record<string, { cls: string; icon: typeof Clock; label: string; border: string }> = {
  pending:   { cls: "bg-amber-50 text-amber-700", icon: Clock, label: "Menunggu", border: "var(--amber-500)" },
  approved:  { cls: "bg-green-50 text-green-700", icon: Check, label: "Disetujui", border: "var(--green-500)" },
  fulfilled: { cls: "bg-blue-50 text-blue-600", icon: CheckCheck, label: "Selesai", border: "var(--blue-500)" },
  rejected:  { cls: "bg-rose-50 text-rose-600", icon: X, label: "Ditolak", border: "var(--slate-300)" },
};

export default function MyListingsPage() {
  return (
    <main className="container-page py-8">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-extrabold text-ink">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-50 to-green-100">
          <Sprout className="h-5 w-5 text-green-600" />
        </span>
        Bibitku
      </h1>

      <div className="space-y-4">
        {DUMMY.map((listing, gi) => (
          <div
            key={listing.id}
            className="overflow-hidden rounded-xl border border-ink-line bg-white shadow-card"
            style={{ animation: `fadeUp 0.4s ease-out ${gi * 80}ms both` }}
          >
            <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
              <div>
                <h3 className="font-semibold text-ink">{listing.species}</h3>
                <p className="text-xs text-ink-muted">{listing.count} bibit dilaporkan</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {listing.requests.length} permintaan
              </span>
            </div>

            {listing.requests.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center text-sm text-ink-muted">
                <MessageCircle className="mb-2 h-6 w-6 text-slate-300" />
                Belum ada permintaan untuk bibit ini
              </div>
            ) : (
              <div>
                {listing.requests.map((req, ri) => {
                  const st = STATUS[req.status];
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
                          <strong className="font-semibold text-ink">{req.from}</strong>
                          <span className="text-sm text-ink-muted">minta {req.qty}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                            <Icon className="h-3 w-3" />
                            {st.label}
                          </span>
                        </div>
                        {req.message && (
                          <p className="mt-0.5 text-xs italic text-ink-muted">&ldquo;{req.message}&rdquo;</p>
                        )}
                        <p className="mt-0.5 text-[0.625rem] text-ink-subtle">{req.date}</p>
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
      </div>
    </main>
  );
}
