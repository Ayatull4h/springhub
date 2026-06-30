"use client";

import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-900">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <SearchX className="h-8 w-8 text-ink-subtle dark:text-slate-400" />
      </div>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink dark:text-white">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-2 max-w-md text-ink-muted dark:text-slate-400">
        Halaman yang Anda cari tidak ditemukan. Mungkin telah dipindahkan atau
        dihapus.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Beranda
      </Link>
    </div>
  );
}
