"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

export default function DonateFailedPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
        Pembayaran Gagal
      </h1>
      <p className="mt-2 max-w-md text-ink-muted">
        Maaf, pembayaran Anda belum berhasil. Silakan coba lagi atau hubungi kami jika masalah berlanjut.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link href="/" className="btn-primary">
          Kembali ke Beranda
        </Link>
        <Link href="/?donate=true" className="btn-secondary">
          Coba Lagi
        </Link>
      </div>
    </div>
  );
}
