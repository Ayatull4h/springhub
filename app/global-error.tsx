"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Terjadi Kesalahan</h1>
          <p className="mt-2 text-sm text-slate-600">
            Maaf, terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {error.digest && `Error ID: ${error.digest}`}
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </body>
    </html>
  );
}
