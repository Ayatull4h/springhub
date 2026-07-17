"use client";

import { FileText, User, MapPin, Clock, Phone, PhoneCall, X, Inbox } from "lucide-react";
import Link from "next/link";

type RequestItem = {
  id: string; species: string; qty: number;
  owner: string; location: string;
  status: "pending" | "approved" | "rejected" | "fulfilled" | "cancelled";
  date: string; phone?: string;
};

const DUMMY: RequestItem[] = [
  { id: "1", species: "Jati", qty: 10, owner: "Asep", location: "Bandung", status: "pending", date: "2 hari lalu" },
  { id: "2", species: "Bambu Petung", qty: 5, owner: "Sari", location: "Bogor", status: "approved", date: "1 hari lalu", phone: "0812-3456-7890" },
  { id: "3", species: "Mahoni", qty: 2, owner: "Budi", location: "Garut", status: "rejected", date: "3 hari lalu" },
  { id: "4", species: "Sengon", qty: 15, owner: "Dewi", location: "Malang", status: "fulfilled", date: "5 hari lalu" },
  { id: "5", species: "Kaliandra", qty: 20, owner: "Rina", location: "Banyuwangi", status: "cancelled", date: "7 hari lalu" },
];

const STATUS: Record<string, { cls: string; icon: typeof Clock; label: string }> = {
  pending:   { cls: "bg-amber-50 text-amber-700", icon: Clock, label: "Menunggu" },
  approved:  { cls: "bg-green-50 text-green-700", icon: Phone, label: "Disetujui" },
  rejected:  { cls: "bg-rose-50 text-rose-600", icon: X, label: "Ditolak" },
  fulfilled: { cls: "bg-blue-50 text-blue-600", icon: Phone, label: "Selesai" },
  cancelled: { cls: "bg-slate-100 text-slate-500", icon: X, label: "Dibatalkan" },
};

export default function MyRequestsPage() {
  return (
    <main className="container-page py-8">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-extrabold text-ink">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <FileText className="h-5 w-5 text-blue-600" />
        </span>
        Permintaanku
      </h1>

      {DUMMY.length === 0 ? (
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
          {DUMMY.map((r, i) => {
            const st = STATUS[r.status];
            const Icon = st.icon;
            return (
              <div
                key={r.id}
                className="flex animate-fade-up flex-wrap items-center gap-3 rounded-xl border border-ink-line bg-white p-4 shadow-card transition hover:shadow-elevated"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <div className="min-w-[180px] flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-[0.9375rem] font-semibold text-ink">{r.species}</strong>
                    <span className="text-sm text-ink-muted">{r.qty} bibit</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                      <Icon className="h-3 w-3" />
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{r.owner}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "pending" && (
                    <button className="btn-sm btn-danger inline-flex items-center gap-1"
                      onClick={() => alert("Permintaan dibatalkan (demo)")}>
                      <X className="h-3 w-3" />Batalkan
                    </button>
                  )}
                  {r.status === "approved" && (
                    <>
                      <span className="flex items-center gap-1 text-sm text-ink-muted">
                        <Phone className="h-3.5 w-3.5 text-green-500" />
                        {r.phone}
                      </span>
                      <a href={`tel:${r.phone}`} className="btn-sm btn-soft inline-flex items-center gap-1">
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
