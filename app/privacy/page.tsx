import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SpringHub",
  description: "Kebijakan privasi SpringHub — Jaga Semesta",
};

export default function PrivacyPage() {
  return (
    <div className="container-page py-16">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <div className="mt-8 space-y-6 text-ink-muted">
        <section>
          <h2 className="text-xl font-semibold text-ink">Data yang Dikumpulkan</h2>
          <p className="mt-2">
            Kami mengumpulkan data yang Anda berikan saat mendaftar: username, email, nomor
            telepon, dan region. Saat mengirim laporan, kami juga mengumpulkan data lokasi,
            foto, dan catatan lapangan.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Bagaimana Data Digunakan</h2>
          <p className="mt-2">
            Data digunakan untuk memverifikasi laporan, menghitung poin, menampilkan leaderboard,
            dan mengelola donasi. Email dan nomor telepon hanya digunakan untuk komunikasi
            penting terkait akun dan proyek.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Privasi Lokasi</h2>
          <p className="mt-2">
            Lokasi presisi mata air adalah data sensitif. Publik hanya melihat snapped location
            (grid 5 km) untuk melindungi mata air dari eksploitasi. Admin memiliki akses penuh.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Hak Pengguna</h2>
          <p className="mt-2">
            Anda dapat meminta akses, koreksi, atau penghapusan data Anda kapan saja. Hubungi
            kami melalui email untuk exercice hak Anda.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Kontak</h2>
          <p className="mt-2">
            Jika ada pertanyaan tentang kebijakan privasi ini, hubungi kami di
            privacy@springhub.id.
          </p>
        </section>
      </div>
    </div>
  );
}
