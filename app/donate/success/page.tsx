"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function DonateSuccessPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
        Pembayaran Berhasil!
      </h1>
      <p className="mt-2 max-w-md text-ink-muted">
        Terima kasih atas donasi Anda. Setiap rupiah membantu restorasi mata air Indonesia.
        Konfirmasi akan dikirim ke email Anda.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
