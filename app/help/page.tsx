import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center — SpringHub",
  description: "Panduan menggunakan SpringHub",
};

export default function HelpPage() {
  return (
    <div className="container-page py-16 dark:text-slate-300">
      <h1 className="text-3xl font-bold text-ink dark:text-white">Help Center</h1>
      <div className="mt-8 space-y-8">
        <section className="rounded-xl border border-line bg-white dark:border-slate-700 dark:bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-ink dark:text-white">Cara Melaporkan</h2>
          <p className="mt-2 text-ink-muted dark:text-slate-400">
            Pilih form yang sesuai dengan kegiatan Anda, isi semua field yang diperlukan, dan
            kirim. Tim kami akan mereview laporan Anda.
          </p>
        </section>
        <section className="rounded-xl border border-line bg-white dark:border-slate-700 dark:bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-ink dark:text-white">Cara Mendapatkan Poin</h2>
          <p className="mt-2 text-ink-muted dark:text-slate-400">
            Setiap laporan yang di-approve akan mendapatkan poin. Kumpulkan poin untuk membuka
            akses proyek dan badge.
          </p>
        </section>
        <section className="rounded-xl border border-line bg-white dark:border-slate-700 dark:bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-ink dark:text-white">Cara Bergabung</h2>
          <p className="mt-2 text-ink-muted dark:text-slate-400">
            Daftar akun gratis, verifikasi, dan mulai berkontribusi. Setelah 20.000 poin, Anda
            bisa mengajukan proyek sendiri.
          </p>
        </section>
      </div>
    </div>
  );
}
