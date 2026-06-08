import { Metadata } from "next";
import Link from "next/link";
import { Shield, Users, TreePine, Droplets, Heart, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang SpringHub — Jaga Semesta",
  description:
    "SpringHub adalah platform komunitas untuk pemantauan dan restorasi mata air di Indonesia.",
};

const values = [
  { icon: Droplets, label: "Mata Air Terlindungi", desc: "Memantau dan merestorasi mata air di seluruh Indonesia" },
  { icon: Users, label: "Komunitas", desc: "Relawan, Field Lead, dan mitra yang bekerja bersama" },
  { icon: TreePine, label: "Restorasi", desc: "Menanam pohon, membuat rorak, dan konservasi daerah tangkapan air" },
  { icon: Shield, label: "Transparansi", desc: "Data real-time, donasi terverifikasi, dan laporan terbuka" },
  { icon: Heart, label: "Gotong Royong", desc: "Semua kontribusi dihargai dengan sistem poin dan penghargaan" },
  { icon: MapPin, label: "Berbasis Lokasi", desc: "Peta interaktif dengan perlindungan privasi grid 5 km" },
];

export default function AboutPage() {
  return (
    <div className="container-page py-16">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">
          Tentang <span className="text-brand-600">SpringHub</span>
        </h1>
        <p className="mt-4 text-lg text-ink-muted leading-relaxed">
          SpringHub adalah platform berbasis komunitas untuk <strong>pemantauan dan restorasi mata air</strong> di Indonesia. 
          Kami menghubungkan relawan, field lead, dan mitra untuk melindungi sumber air bersih.
        </p>
      </div>

      {/* Visi */}
      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="text-2xl font-bold text-ink">Visi & Misi</h2>
        <p className="mt-4 text-ink-muted leading-relaxed">
          Indonesia memiliki ribuan mata air yang menjadi sumber kehidupan bagi masyarakat. 
          Sayangnya, banyak mata air yang terancam karena alih fungsi lahan, pencemaran, dan perubahan iklim. 
          SpringHub lahir untuk menjembatani masyarakat, relawan, dan donor dalam upaya konservasi.
        </p>
      </div>

      {/* Values */}
      <div className="mx-auto mt-12 max-w-5xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.label} className="card">
                <Icon className="h-8 w-8 text-brand-600" />
                <h3 className="mt-3 font-semibold text-ink">{v.label}</h3>
                <p className="mt-1 text-sm text-ink-muted">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto mt-16 max-w-2xl rounded-2xl bg-brand-50 dark:bg-brand-900/20 p-8 text-center">
        <h2 className="text-2xl font-bold text-ink">Ikut Berkontribusi</h2>
        <p className="mt-2 text-ink-muted">
          Setiap laporan, donasi, dan aksi kecil berarti untuk masa depan air bersih Indonesia.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/join" className="btn-primary inline-flex items-center gap-2">
            <Users className="h-4 w-4" /> Gabung Sekarang
          </Link>
          <Link href="/#map" className="btn-secondary inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Lihat Peta
          </Link>
        </div>
      </div>
    </div>
  );
}
