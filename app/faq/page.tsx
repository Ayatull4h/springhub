import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — SpringHub",
  description: "Pertanyaan yang sering diajukan tentang SpringHub",
};

const faqs = [
  {
    q: "Apa itu SpringHub?",
    a: "SpringHub adalah platform komunitas untuk memonitor, merestorasi, dan melindungi mata air di Indonesia. Kami menghubungkan relawan, field lead, dan donor dalam satu ekosistem.",
  },
  {
    q: "Bagaimana cara mendaftar?",
    a: "Kunjungi halaman Join, daftar dengan email atau Google, verifikasi akun Anda, dan mulai berkontribusi. Pendaftaran gratis dan terbuka untuk siapa saja.",
  },
  {
    q: "Apakah saya perlu membayar?",
    a: "Tidak. Mendaftar dan berkontribusi sebagai relawan sepenuhnya gratis. Donasi bersifat sukarela untuk mendukung proyek-proyek restorasi mata air.",
  },
  {
    q: "Bagaimana sistem poin bekerja?",
    a: "Setiap laporan yang di-approve memberikan poin: Monitoring +25, Restorasi +100, Trench +50, Tree Planting +50, Seedling +15. Ada juga bonus untuk streak harian, laporan lengkap, dan milestone.",
  },
  {
    q: "Bagaimana cara menjadi Field Lead?",
    a: "Field Lead adalah relawan terpercaya yang mendapatkan akses ke lokasi presisi di area kerjanya. Status ini diberikan oleh Admin berdasarkan track record dan kontribusi di lapangan.",
  },
  {
    q: "Apa itu snapped location?",
    a: "Untuk melindungi privasi mata air, lokasi yang ditampilkan ke publik adalah snapped location (grid 5 km). Lokasi presisi hanya bisa diakses oleh Field Lead dan Admin.",
  },
  {
    q: "Bagaimana cara mengajukan proyek?",
    a: "Setelah mencapai 20.000 poin, Anda bisa mengajukan proyek melalui halaman Projects. Isi proposal dengan detail kegiatan, lokasi, dan anggaran yang dibutuhkan.",
  },
];

export default function FAQPage() {
  return (
    <div className="container-page py-16">
      <h1 className="text-3xl font-bold text-ink">Frequently Asked Questions</h1>
      <div className="mt-8 space-y-6">
        {faqs.map((faq) => (
          <section key={faq.q}>
            <h2 className="text-xl font-semibold text-ink">{faq.q}</h2>
            <p className="mt-2 text-ink-muted">{faq.a}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
