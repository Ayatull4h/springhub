import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — SpringHub",
  description: "Ketentuan penggunaan SpringHub — Jaga Semesta",
};

export default function TermsPage() {
  return (
    <div className="container-page py-16">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <div className="mt-8 space-y-6 text-ink-muted">
        <section>
          <h2 className="text-xl font-semibold text-ink">Ketentuan Penggunaan</h2>
          <p className="mt-2">
            Dengan menggunakan SpringHub, Anda menyetujui ketentuan ini. Platform ini
            disediakan oleh Jaga Semesta untuk tujuan monitoring dan restorasi mata air.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Hak dan Kewajiban Volunteer</h2>
          <p className="mt-2">
            Volunteer berhak mengakses fitur sesuai role-nya, mendapatkan poin atas laporan
            yang di-approve, dan mengajukan proyek setelah memenuhi threshold. Volunteer wajib
            mengisi laporan dengan data yang akurat dan jujur.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Sistem Poin</h2>
          <p className="mt-2">
            Poin diberikan secara otomatis oleh sistem untuk laporan yang di-approve. Poin
            tidak memiliki nilai moneter dan tidak dapat ditukar dengan uang. Poin yang
            diperoleh secara curang dapat dibatalkan.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Donasi</h2>
          <p className="mt-2">
            Donasi bersifat sukarela dan tidak dapat dikembalikan kecuali ada kesalahan
            teknis. Dana donasi digunakan untuk mendukung proyek restorasi mata air yang
            terverifikasi.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Pembatasan Tanggung Jawab</h2>
          <p className="mt-2">
            Jaga Semesta tidak bertanggung jawab atas kerugian yang timbul dari penggunaan
            platform ini. Data lokasi presisi disediakan untuk keperluan konservasi dan tidak
            boleh disalahgunakan.
          </p>
        </section>
      </div>
    </div>
  );
}
