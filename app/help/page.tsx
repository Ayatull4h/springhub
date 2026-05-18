import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center — SpringHub",
  description: "Panduan menggunakan SpringHub",
};

export default function HelpPage() {
  return (
    <div className="container-page py-16">
      <h1 className="text-3xl font-bold">Help Center</h1>
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold">Cara Melaporkan</h2>
          <p className="mt-2 text-ink-muted">
            Pilih form yang sesuai dengan kegiatan Anda, isi semua field yang diperlukan, dan
            kirim. Tim kami akan mereview laporan Anda.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Cara Mendapatkan Poin</h2>
          <p className="mt-2 text-ink-muted">
            Setiap laporan yang di-approve akan mendapatkan poin. Kumpulkan poin untuk membuka
            akses proyek dan badge.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Cara Bergabung</h2>
          <p className="mt-2 text-ink-muted">
            Daftar akun gratis, verifikasi, dan mulai berkontribusi. Setelah 20.000 poin, Anda
            bisa mengajukan proyek sendiri.
          </p>
        </section>
      </div>
    </div>
  );
}
