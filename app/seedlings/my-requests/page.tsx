"use client";

import { FileText, XCircle } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type RequestItem = {
  id: string;
  species: string;
  qty: number;
  owner: string;
  location: string;
  status: "pending" | "approved" | "rejected" | "fulfilled" | "cancelled";
  date: string;
  phone?: string;
};

const DUMMY: RequestItem[] = [
  { id: "1", species: "Jati", qty: 10, owner: "Asep", location: "Bandung", status: "pending", date: "2 hari lalu" },
  { id: "2", species: "Bambu Petung", qty: 5, owner: "Sari", location: "Bogor", status: "approved", date: "1 hari lalu", phone: "0812-3456-7890" },
  { id: "3", species: "Mahoni", qty: 2, owner: "Budi", location: "Garut", status: "rejected", date: "3 hari lalu" },
  { id: "4", species: "Sengon", qty: 15, owner: "Dewi", location: "Malang", status: "fulfilled", date: "5 hari lalu" },
  { id: "5", species: "Kaliandra", qty: 20, owner: "Rina", location: "Banyuwangi", status: "cancelled", date: "7 hari lalu" },
];

const STATUS_STYLE: Record<string, string> = {
  pending:   "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300",
  approved:  "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected:  "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300",
  fulfilled: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300",
  cancelled: "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending:   "Menunggu",
  approved:  "Disetujui",
  rejected:  "Ditolak",
  fulfilled: "Selesai",
  cancelled: "Dibatalkan",
};

export default function MyRequestsPage() {
  const { t } = useI18n();

  return (
    <main className="container-page py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-ink">
        <FileText className="h-6 w-6 text-brand-600" />
        {t("seedlings.myRequests") || "Permintaanku"}
      </h1>

      <div className="space-y-3">
        {DUMMY.map(req => (
          <div key={req.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{req.species}</span>
                <span className="text-sm text-ink-muted">— {req.qty} bibit</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[req.status]}`}>
                  {STATUS_LABEL[req.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Dari {req.owner} · {req.location} · {req.date}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {req.status === "pending" && (
                <button className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50">
                  <XCircle className="h-3 w-3" />
                  Batalkan
                </button>
              )}
              {req.status === "approved" && (
                <>
                  <span className="text-xs text-ink-muted">📞 {req.phone}</span>
                  <a
                    href={`tel:${req.phone}`}
                    className="rounded-lg bg-brand-600 px-3 py-1 text-xs text-white hover:bg-brand-700"
                  >
                    Hubungi
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
