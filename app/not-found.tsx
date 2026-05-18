import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <SearchX className="h-16 w-16 text-ink-subtle" />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
        Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-ink-muted">
        Halaman yang kamu cari tidak ditemukan. Mungkin telah dipindahkan atau
        dihapus.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}
