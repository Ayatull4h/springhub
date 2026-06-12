"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error boundary caught:", error.message, error.stack);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-16 w-16 text-red-400" />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-ink-muted">
        Terjadi kesalahan. Silakan coba refresh halaman.
      </p>
      <p className="mt-1 text-xs text-ink-subtle max-w-md">
        {error.message}
      </p>
      <button onClick={reset} className="btn-primary mt-6 inline-flex">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
