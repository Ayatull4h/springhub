"use client";
import { Info, Circle } from "lucide-react";
import { useState } from "react";

export function StatusInfo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
      >
        <Info className="h-3 w-3" />
        Apa arti warna ini?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink">Status Mata Air</h3>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <Circle className="mt-0.5 h-5 w-5 fill-emerald-500 text-emerald-500" />
                <div>
                  <p className="font-semibold text-ink">Sehat</p>
                  <p className="text-sm text-ink-muted">
                    Mata air dalam kondisi baik — debit air normal, kualitas air
                    jernih, lingkungan sekitar terjaga. Cukup dipantau secara
                    berkala.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Circle className="mt-0.5 h-5 w-5 fill-amber-500 text-amber-500" />
                <div>
                  <p className="font-semibold text-ink">Restorasi</p>
                  <p className="text-sm text-ink-muted">
                    Sedang dalam proses pemulihan — ada kegiatan restorasi
                    seperti penanaman pohon, pembuatan rorak, atau pembersihan
                    sedimen. Perlu dukungan berkelanjutan.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Circle className="mt-0.5 h-5 w-5 fill-red-500 text-red-500" />
                <div>
                  <p className="font-semibold text-ink">Terdegradasi</p>
                  <p className="text-sm text-ink-muted">
                    Mata air dalam kondisi kritis — debit menurun, air keruh,
                    banyak sampah, atau bahkan sudah tidak mengalir. Membutuhkan
                    intervensi segera.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
