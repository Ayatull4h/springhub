
---

## Kelompok Map & Posisi

Delapan komponen di kelompok ini menangani satu domain: **peta**. Ada yang memakai `react-leaflet` 4 secara langsung, ada yang membungkus peta untuk keperluan khusus (pilih posisi, peta offline, peta mini), dan ada yang menambah lapisan interaksi (filter, tile offline).

### components/map/leaflet-map.tsx — peta utama interaktif mata air & laporan (deep-dive)

**Alur Cerita**

`LeafletMap` adalah peta "kelas berat" SpringHub: dipakai di beranda (section `spring-map`) dan di halaman profil. Ia menerima daftar `springs` dan `reports` bertipe `SpringCluster` (klaster hasil perhitungan `lib/geo.ts` di lapisan pemanggil), lalu menggambar titik demi titik memakai `CircleMarker` React-Leaflet. Ceritanya berjalan seperti ini:

1. Komponen di-render — jika `window` belum ada (SSR/prerender), langsung `return null` agar Leaflet tidak diimpor di server.
2. `useTheme()` memberi tahu mode gelap/terang; URL `TileLayer` diganti antara `dark_all` dan `voyager` CARTO.
3. `MapContainer` dibuat dengan pusat default Indonesia (`-2.5489, 118.0149`) dan zoom 5.
4. Komponen anak `SpringMarkers` memanggil hook `useMap()` untuk menangkap *instance* Leaflet — inilah satu-satunya cara sah mengakses map di react-leaflet v4.
5. `SpringMarkers` mendengarkan event `zoomend` dan `moveend` untuk menyinkronkan state zoom/bounds, lalu menggambar `CircleMarker` oranye untuk setiap mata air.
6. Klik marker membuka `Popup` berisi nama mata air dan tombol "Lihat Detail" yang meneruskan klik ke `onSelectSpring` (dimiliki halaman pemanggil, misalnya untuk scroll ke kartu detail).

**Potongan Kode Asli — kontrak props & SSR guard** (baris ±1-32):

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/darkmode";
import { SpringCluster } from "@/lib/types";

type MapProps = {
  springs?: SpringCluster[];
  reports?: SpringCluster[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onSelectSpring?: (spring: SpringCluster) => void;
};

const DEFAULT_CENTER: [number, number] = [-2.5489, 118.0149]; // Indonesia
const DEFAULT_ZOOM = 5;

export default function LeafletMap({ springs = [], reports = [], center, zoom, className, onSelectSpring }: MapProps) {
  const { theme } = useTheme();
  const [currentZoom, setCurrentZoom] = useState(zoom ?? DEFAULT_ZOOM);

  // react-leaflet v4: MapContainer adalah class component —
  // props center/zoom hanya dibaca pada inisialisasi; update berikutnya
  // harus lewat ref ke instance map (useMap inside child).
  const isDark = theme === "dark";

  if (typeof window === "undefined") return null; // SSR guard
```

**Potongan Kode Asli — MapContainer & TileLayer dua tema** (baris ±34-43):

```tsx
return (
  <MapContainer center={center ?? DEFAULT_CENTER} zoom={zoom ?? DEFAULT_ZOOM} className={cn("z-0 h-full w-full", className)}>
    <TileLayer
      attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      url={isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
    />
    <SpringMarkers springs={springs} reports={reports} onSelectSpring={onSelectSpring} />
  </MapContainer>
);
```

**Potongan Kode Asli — SpringMarkers & sinkronisasi instance map** (baris ±45-64):

```tsx
// ── Peta: klaster Spring — komponen dalam komponen (leaflet hook)
// React-Leaflet v4 tidak mengizinkan hook di luar context MapContainer.
// Karena itu komponen penanda dibuat sebagai anak dari MapContainer.
function SpringMarkers({ springs, reports, onSelectSpring }: { springs: SpringCluster[]; reports: SpringCluster[]; onSelectSpring?: (spring: SpringCluster) => void }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [bounds, setBounds] = useState(map.getBounds());

  useEffect(() => {
    // Sinkronkan zoom/bounds dari map instance
    const sync = () => {
      setZoom(map.getZoom());
      setBounds(map.getBounds());
    };
    map.on("zoomend moveend", sync);
    map.invalidateSize(); // Panggil setelah container terlihat
    return () => {
      map.off("zoomend moveend", sync);
    };
  }, [map]);
```

**Potongan Kode Asli — CircleMarker & Popup** (baris ±66-86):

```tsx
// Marker merah terang di posisi koordinat sebenarnya
// (snap grid hanya untuk publik; admin melihat titik presisi)
return (
  <>
    {springs.map((spring) => (
      <CircleMarker
        key={spring.id}
        center={[spring.lat, spring.lng]}
        radius={6}
        pathOptions={{ color: "#f97316", fillColor: "#f97316", fillOpacity: 0.9 }}
        eventHandlers={{ click: () => onSelectSpring?.(spring) }}
      >
        <Popup>
          <div className="font-medium">{spring.name}</div>
          <button onClick={() => onSelectSpring?.(spring)} className="mt-1 text-sm font-semibold text-amber-600 hover:underline">
            Lihat Detail
          </button>
        </Popup>
      </CircleMarker>
    ))}
  </>
);
```

**Potongan Kode Asli — bagaimana pemanggil menggunakannya** (`components/sections/spring-map.tsx`, baris ±57-75):

```tsx
<LeafletMap
  springs={visibleSprings}
  reports={visibleReports}
  center={focusPoint}
  zoom={focusZoom}
  onSelectSpring={(s) => {
    setSelected(s);
    // scroll ke kartu detail di bawah peta
    document.getElementById("spring-detail")?.scrollIntoView({ behavior: "smooth" });
  }}
/>
```

**Konstruk**

- **SSR guard manual** (`typeof window === "undefined"`) — Leaflet membaca `window` saat inisialisasi; komponen ini sengaja tidak memakai `next/dynamic` karena pemanggilnya sudah melakukannya.
- **Pola "komponen anak untuk hook"** — hook `useMap()` hanya legal di dalam `MapContainer`; karena itu penanda digambar oleh komponen anak.
- **Sinkronisasi event → state** — `zoomend`/`moveend` di-*listen* lewat `map.on` (bukan prop React) karena instance map hidup di luar React; cleanup `map.off` mencegah kebocoran listener.
- **`invalidateSize()`** — dipanggil agar Leaflet menghitung ulang ukuran peta saat container baru terlihat (mis. tab tersembunyi).

**🛡️ Kerentanan**

1. **Jika `reports` berisi koordinat presisi tanpa di-snap**, publik bisa melihat lokasi persis pelapor. Mitigasi: data yang masuk harus sudah lewat `snapToProtectionGrid()` di lapisan API; komponen ini hanya menggambar apa yang diterima.
2. **`onSelectSpring` eksekusi sembarang** — jika pemanggil meneruskan fungsi berbahaya, ini jadi vektor XSS via Popup. Pada praktiknya pemanggil hanya melakukan scroll + setState, aman.
3. **TileLayer dari domain pihak ketiga (CARTO)** — menjadi titik gagal tunggal jika CDN down; `offline-tile-layer.tsx` dibuat untuk menjawab masalah ini di mode offline.

### components/map/location-picker.tsx — pemilih koordinat dengan mode picking (217 baris)

**Alur Cerita**

`LocationPicker` adalah peta "satu fungsi": membiarkan pengguna **mengklik peta untuk memilih koordinat**. Ia dipakai di formulir laporan (saat admin/moderator memverifikasi lokasi), di halaman proyek, dan di `setup-map`. Ceritanya:

1. Modal atau panel terbuka dengan peta di posisi awal `value` (jika ada) atau pusat default.
2. Pengguna menekan tombol "Pilih Lokasi" → komponen masuk **mode picking** (kursor berubah jadi crosshair).
3. Klik di peta menangkap `lat/lng` via `useMapEvents` → state internal terisi, marker muncul.
4. Tombol "Konfirmasi" memanggil `onChange({ lat, lng })` lalu `onClose()`.

**Potongan Kode Asli — mode picking & event klik** (baris ±20-60):

```tsx
"use client";

// react-leaflet diimpor dinamis oleh pemanggil — komponen ini
// hanya jalan di client. Guard tambahan di bawah untuk SSR.
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";

type LocationPickerProps = {
  value?: { lat: number; lng: number } | null;
  onChange?: (pos: { lat: number; lng: number }) => void;
  onClose?: () => void;
};

// ── Peta: komponen penangkap klik ──
function ClickCatcher({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}
```

**Potongan Kode Asli — tombol mode & konfirmasi** (baris ±90-120):

```tsx
<div className="flex items-center justify-between gap-3">
  <button
    onClick={() => setPicking((p) => !p)}
    className={cn(
      "rounded-lg px-3 py-1.5 text-sm font-medium transition",
      picking ? "bg-amber-600 text-white" : "bg-ink/5 hover:bg-ink/10"
    )}
  >
    {picking ? "Sedang memilih… (klik peta)" : "Pilih Lokasi di Peta"}
  </button>
  <button
    onClick={() => position && onChange?.(position)}
    disabled={!position}
    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
  >
    Konfirmasi Lokasi
  </button>
</div>
```

**Konstruk**

- **Hook `useMapEvents` di komponen kosong** — trik react-leaflet untuk menangkap event tanpa merender apa pun (`return null`).
- **State `picking` sebagai mode interaksi** — pola umum "tool mode" di aplikasi peta.
- **Guard `typeof window`** — peta tidak pernah dirender di server.

**🛡️ Kerentanan**

1. **Koordinat mentah dari klik** — tidak ada batas radius atau validasi (mis. di luar Indonesia). Pemanggil wajib memvalidasi; bila nilai langsung masuk ke API tanpa validasi server, bisa menimbulkan titik di koordinat sembarang.
2. **`onChange` bisa dipanggil berulang** — konfirmasi ganda (klik dua kali cepat) mengirim dua callback; aman jika API idempoten.

### components/map/picker-map.tsx — varian ringkas pemilih lokasi (86 baris)

**Alur Cerita**

`PickerMap` adalah pembungkus tipis di atas `LocationPicker` untuk kasus pemakaian paling umum: **satu peta kecil, klik untuk memilih, langsung lapor balik**. Dipakai di formulir admin dan saat pembuatan laporan agar tidak membuka modal penuh.

1. Menerima `center` awal dan `onChange`.
2. Merender `MapContainer` dengan tile ringan (OSM standar) dan satu `Marker` di posisi terpilih.
3. Klik di peta memindahkan marker dan memanggil `onChange` seketika (tanpa tombol konfirmasi).

**Potongan Kode Asli — inti komponen** (baris ±10-40):

```tsx
"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { cn } from "@/lib/utils";

type PickerMapProps = {
  center: [number, number];
  onChange?: (pos: { lat: number; lng: number }) => void;
  className?: string;
};

function ClickToPick({ onChange }: { onChange?: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onChange?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}
```

**Konstruk**

- Pola "komponen hantu" penangkap event yang sama dengan `LocationPicker`, minus state mode.
- Tanpa guard SSR sendiri — pemanggil bertanggung jawab (`dynamic(..., { ssr: false })`).

**🛡️ Kerentanan**

- **Perubahan koordinat di setiap klik** — jika dipakai pada form yang auto-save, setiap klik menulis draft; perhatikan batas rate draft di `lib/use-auto-save.ts`.

### components/map/mini-map.tsx — peta mini statis (50 baris)

**Alur Cerita**

`MiniMap` adalah peta **read-only** berukuran kecil untuk menampilkan satu titik. Dipakai di kartu proyek, kartu detail mata air, dan ringkasan laporan. Tidak ada interaksi — hanya `Marker` di tengah.

1. Pemanggil mengimpor komponen secara dinamis (`dynamic(..., { ssr: false })`).
2. `MiniMap` merender `MapContainer` setinggi ~160px dengan `zoomControl={false}`, `dragging={false}`, `scrollWheelZoom={false}`.
3. Satu `Marker` di koordinat yang diberikan; atribusi tile OSM.

**Potongan Kode Asli** (baris ±1-35):

```tsx
"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      className="z-0 h-40 w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} />
    </MapContainer>
  );
}
```

**Konstruk**

- **Matikan semua interaksi** (`dragging`, `scrollWheelZoom`, `zoomControl`) — peta mini harus terasa seperti gambar statis, bukan peta.
- **Tinggi tetap `h-40`** — kontrak visual agar semua kartu seragam.

**🛡️ Kerentanan**

- **Koordinator presisi bocor** — karena read-only, pemanggil mudah lupa men-snap; pastikan data yang dikirim ke komponen ini sudah `snapToProtectionGrid()`.

### components/map/map-filter.tsx — filter provinsi, kata kunci, dan jumlah marker (132 baris)

**Alur Cerita**

`MapFilter` adalah panel kontrol peta beranda: **input pencarian + dropdown provinsi + penghitung marker tampil**. Ia *controlled component* — state hidup di induknya (`spring-map.tsx`).

1. Pengguna mengetik kata kunci atau memilih provinsi.
2. Setiap perubahan memanggil `setKeyword`/`setProvince` milik induk.
3. Induk menghitung ulang `visibleSprings`/`visibleReports`; angka "X dari Y marker" ditampilkan di sini.
4. Tombol "Reset" mengosongkan kedua filter.

**Potongan Kode Asli — header & penghitung** (baris ±1-45):

```tsx
"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MapFilterProps = {
  keyword: string;
  province: string;
  total: number;
  shown: number;
  provinces: string[];
  onKeywordChange: (v: string) => void;
  onProvinceChange: (v: string) => void;
  onReset: () => void;
};

export default function MapFilter({ keyword, province, total, shown, provinces, onKeywordChange, onProvinceChange, onReset }: MapFilterProps) {
  const isFiltered = keyword !== "" || province !== "";

  return (
    <div className="space-y-3 rounded-2xl border border-ink-line bg-white p-4 shadow-sm dark:bg-ink-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Peta Mata Air</h3>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", isFiltered ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
          {shown} dari {total} marker
        </span>
      </div>
      {/* input pencarian + select provinsi + tombol reset */}
    </div>
  );
}
```

**Konstruk**

- **Controlled component murni** — tidak ada state internal; seluruh data mengalir dari induk.
- **Penghitung "X dari Y"** memberi umpan balik instan — pola yang membuat peta terasa responsif walau datanya banyak.

**🛡️ Kerentanan**

- **`provinces` dari data publik** — dihasilkan dari daftar mata air aktif, bukan input bebas; aman dari injeksi karena dirender sebagai opsi `<select>` (bukan HTML mentah).

### components/map/offline-tile-layer.tsx — lapisan tile dari IndexedDB (115 baris)

**Alur Cerita**

`OfflineTileLayer` adalah kunci fitur PWA: menggambar peta **tanpa koneksi** memakai tile yang sudah diunduh. Ia adalah *drop-in replacement* `TileLayer` saat `navigator.onLine === false`.

1. Komponen memeriksa mode offline (dari `useDataSaver` atau event `online`/`offline`).
2. Jika offline, setiap permintaan tile dicegat: cari `tile` di IndexedDB (`offlineDB.getTile(z, x, y)`).
3. Tile yang ada dirender; tile yang tidak ada ditutup dengan warna polos (atau fallback tile OSM yang tersimpan).
4. Jika online, berperilaku persis seperti `TileLayer` biasa.

**Potongan Kode Asli — pemilihan sumber tile** (baris ±1-40):

```tsx
"use client";

import { useEffect, useState } from "react";
import { TileLayer } from "react-leaflet";
import { offlineDB } from "@/lib/offline-db";

export default function OfflineTileLayer({ minZoom = 5, maxZoom = 18 }: { minZoom?: number; maxZoom?: number }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const sync = () => setIsOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  // offline → URL palsu yang dicegat GridLayer kustom; online → OSM biasa
  return isOffline ? (
    <TileLayer url="offline://{z}/{x}/{y}" minZoom={minZoom} maxZoom={maxZoom} />
  ) : (
    <TileLayer
      attribution='&copy; OpenStreetMap contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}
```

**Konstruk**

- **Skema URL kustom `offline://`** — cara praktis menandai permintaan tile "lokal" tanpa menulis GridLayer dari nol; pemanggil memasang `errorTileUrl` atau handler yang membaca IndexedDB.
- **Dua sumber daya berbeda di satu `if`** — React tetap efisien karena `TileLayer` hanya berganti prop.

**🛡️ Kerentanan**

1. **Tile offline bisa basi** — peta offline tidak pernah mendapat pembaruan; tidak berbahaya tapi bisa menyesatkan (marker di tempat lama).
2. **Penyimpanan IndexedDB penuh** — kumpulan tile besar bisa memblokir penyimpanan draft laporan; penting untuk memakai kuota terbatas saat mengunduh tile di `offline-setup`.

### components/offline/setup-map.tsx — persiapan area survei offline (180 baris)

**Alur Cerita**

`SetupMap` adalah wizard langkah pertama survei offline: **pilih mata air → tentukan radius → mulai sesi**. Ia yang membuat `OfflineSession` di server.

1. Peta menampilkan daftar mata air (dari API) + lokasi pengguna saat ini.
2. Pengguna memilih mata air; `MiniMap`/`LocationPicker` membantu menetapkan titik pusat.
3. Slider radius (0,5-10 km) menentukan seberapa jauh titik tracking dihitung sebagai "masih di area".
4. Tombol "Simpan & Mulai Survei" → POST `/api/offline/session` dengan `{ springId, lat, lng, radiusKm }`.
5. Respons (id sesi + token offline) disimpan ke IndexedDB, lalu navigasi ke mode survei.

**Potongan Kode Asli — pembuatan sesi** (baris ±100-150):

```tsx
async function startSession() {
  setSaving(true);
  try {
    const res = await fetch("/api/offline/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": await getCsrfToken() },
      body: JSON.stringify({ springId: selected.id, lat: center.lat, lng: center.lng, radiusKm }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memulai sesi");

    await offlineDB.saveSession({ id: data.sessionId, token: data.token, springId: selected.id, startedAt: Date.now() });
    toast("Sesi offline siap — isi survei sekarang", "success");
    onStarted(data.sessionId);
  } catch (err) {
    toast(err instanceof Error ? err.message : "Gagal memulai sesi", "error");
  } finally {
    setSaving(false);
  }
}
```

**Konstruk**

- **CSRF just-in-time** — token diambil per aksi (`getCsrfToken()`), bukan disimpan saat mount (pola wajib di proyek ini).
- **Sesi + token disimpan lokal** — sesi bisa bertahan berhari-hari sampai sinkronisasi selesai.
- **Radius sebagai batas area** — nilai inilah yang dipakai `offline-survey-map` untuk menandai "di luar jangkauan".

**🛡️ Kerentanan**

1. **Radius di luar batas** — tanpa validasi server (mis. > 50 km), pengguna bisa membuat area raksasa; server wajib membatasi.
2. **Token sesi sensitif** — disimpan di IndexedDB yang bisa dibaca skrip XSS; pastikan token hanya berlaku untuk endpoint survei, bukan endpoint admin.

### components/offline/survey-leaflet-map.tsx — peta selama survei offline (173 baris)

**Alur Cerita**

`SurveyLeafletMap` adalah peta yang menemani relawan di lapangan: **titik pusat, jangkauan radius, dan jejak titik yang ditandai** — semuanya tanpa internet.

1. Peta dimuat dari tile offline (`OfflineTileLayer`).
2. Lingkaran radius digambar (`Circle`) di sekitar mata air terpilih.
3. Titik yang ditandai selama sesi (dari `TrackingPoint`) digambar sebagai `CircleMarker` biru.
4. Tombol "Tandai Posisi" menyimpan koordinat saat ini ke IndexedDB sebagai tracking point.
5. Tombol "Sesuaikan Peta" melakukan `fitBounds` ke area survei.

**Potongan Kode Asli — penandaan posisi** (baris ±60-110):

```tsx
async function markCurrentPosition() {
  if (!session || !position) return;
  await offlineDB.addTrackingPoint({
    sessionId: session.id,
    lat: position.lat,
    lng: position.lng,
    recordedAt: Date.now(),
  });
  setPoints((p) => [...p, { lat: position.lat, lng: position.lng }]);
  toast("Posisi ditandai", "success");
}

// di dalam MapContainer:
<Circle
  center={[session.lat, session.lng]}
  radius={session.radiusKm * 1000}
  pathOptions={{ color: "#3b82f6", dashArray: "6 6", fillOpacity: 0.05 }}
/>
{points.map((p, i) => (
  <CircleMarker key={i} center={[p.lat, p.lng]} radius={4} pathOptions={{ color: "#2563eb" }} />
))}
```

**Konstruk**

- **`Circle` radius = `radiusKm * 1000`** — konversi km → meter yang mudah dilupakan; salah unit = lingkaran 1000x lebih besar.
- **Data lokal dulu, server belakangan** — tracking point mengalir ke IndexedDB, baru ke server saat sesi diakhiri (lihat `offline-exit-sync`).

**🛡️ Kerentanan**

- **Posisi GPS palsu** — di perangkat yang di-rooting, koordinat bisa di-spoof; server tetap memvalidasi jarak ke mata air saat sinkronisasi.

---

## Kelompok Offline & Sinkronisasi

Tujuh komponen ini membentuk jantung fitur PWA: mengisi laporan **tanpa internet**, menyimpannya **lokal**, lalu **mengirim otomatis** saat koneksi kembali. Inilah area paling rumit di SpringHub, dan dua komponen di antaranya mendapat pembahasan deep-dive.

### components/offline/simple-offline-form.tsx — formulir survei offline (330 baris, deep-dive)

**Alur Cerita**

`SimpleOfflineForm` adalah formulir yang diisi relawan di lapangan saat tidak ada sinyal. Ia tidak mengirim apa pun ke server saat submit — semuanya ditimbun di IndexedDB sampai `QueueWorker` (atau `offline-exit-sync`) mengirimkannya. Alurnya panjang, jadi mari kita bedah bertahap:

1. **Pilih form** — daftar form diambil dari `/api/forms`, dinormalisasi (field DB yang punya `id` UUID/numeric diubah agar `name` HTML memakai `fieldId`), lalu disimpan ke state. Jika gagal, fallback ke definisi form di `lib/forms`.
2. **Bersihkan data lama** — saat load, komponen memindai antrean & laporan tersimpan; item dengan kunci field berupa UUID lama atau angka murni (sisa bug versi lama) dihapus.
3. **Auto-capture GPS** — begitu form dipilih, `navigator.geolocation.getCurrentPosition` dipanggil dengan *safety timeout* 15 detik (beberapa browser mobile tidak pernah memanggil error callback). Status GPS ditampilkan: `getting` → `got`/`error`.
4. **Isi + foto** — validasi foto dihitung dari state `photoFiles` digabung dengan file di FormData; minimal 3 foto (1 per field jika ada banyak field foto).
5. **Submit = simpan lokal** — `handleSubmit` membangun objek `collected` dari FormData (file dilewati), menambahkan anti-spam (`_website` honeypot kosong, `_submit_time`, `_captured_at`), memastikan `date` dan `location_lat/lng` selalu terisi, lalu menyimpan semuanya + foto (sebagai Blob) ke IndexedDB via `offlineDB.queueSubmission`.
6. **Idempotency key** — setiap submission diberi `clientCorrelationId` unik yang TETAP; server memakainya untuk menolak duplikat saat retry (lihat `queue-worker.tsx`).
7. **Layar sukses** — menawarkan "Isi Lagi" atau "Selesai"; di belakang layar, panel status sync menunjukkan jumlah antrean.

**Potongan Kode Asli — normalisasi form & pembersihan data lama** (baris ±90-135):

```tsx
fields: form.fields.map((f: any) => ({
  ...f,
  // DB punya id (UUID) + fieldId (string identifier) — HTML name harus pake fieldId
  id: f.fieldId || String(f.id),
})),
...
// Bersihin queue + pending-reports lama yang pake field ID numeric/UUID (sebelum fix)
for (const store of [
  { getAll: () => offlineDB.getAllQueued(), del: (id: string) => offlineDB.deleteQueued(id) },
  { getAll: () => offlineDB.getAllReports(), del: (id: string) => offlineDB.deleteReport(id) },
]) {
  const items = await store.getAll();
  for (const item of items) {
    const keys = Object.keys(item.fieldData);
    const isBad = keys.some(k => /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(k) || /^\d+$/.test(k));
    if (isBad) {
      console.warn("[Offline] Hapus item lama (non-fieldId key):", item.id);
      await store.del(item.id);
    }
  }
}
```

> **Konstruk**: migrasi data langsung dari komponen. Ketika format penyimpanan berubah, aplikasi "memperbaiki dirinya sendiri" saat pertama kali dibuka — tanpa migrasi IndexedDB formal. Regex `^[0-9a-f]{8}-[0-9a-f]{4}` mendeteksi UUID versi lama, `^\d+$` mendeteksi ID numeric.

**Potongan Kode Asli — auto-capture GPS dengan safety timeout** (baris ±137-180):

```tsx
if (selectedForm && typeof navigator !== "undefined" && "geolocation" in navigator) {
  setGpsStatus("getting");
  setGpsCoords(null);

  let gpsResolved = false;
  // Safety timeout — some mobile browsers never fire error callback
  const gpsTimeout = setTimeout(() => {
    if (!gpsResolved) {
      gpsResolved = true;
      setGpsStatus("error");
    }
  }, 15000);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (gpsResolved) return;
      gpsResolved = true;
      clearTimeout(gpsTimeout);
      setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setGpsStatus("got");
    },
    () => {
      if (gpsResolved) return;
      gpsResolved = true;
      clearTimeout(gpsTimeout);
      setGpsStatus("error");
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}
```

> **Konstruk**: pola `gpsResolved` (guard boolean) + `clearTimeout` mencegah state ditimpa dua kali (callback sukses & timeout). Ini bug klasik di Android Chrome: error callback tidak pernah dipanggil → aplikasi menggantung di "Mendapatkan lokasi…" selamanya. Solusinya: timeout 15 detik yang pasti memutus antrean.

**Potongan Kode Asli — validasi jumlah foto** (baris ±182-200):

```tsx
const formEl = e.currentTarget;
const fd = new FormData(formEl);
const photoFields = selectedForm.fields.filter((f: any) => f.type === "photo");
const minPerField = photoFields.length > 1 ? 1 : 3;
for (const field of photoFields) {
  const stateCount = (photoFiles[field.id] || []).length;
  const fdFiles = fd.getAll(field.id).filter(
    (f): f is File => f instanceof File && f.size > 0
  );
  const count = Math.max(stateCount, fdFiles.length);
  if (count < minPerField) {
    setSubmitError(`Minimal ${minPerField} foto untuk "${field.label || field.id}". Saat ini: ${count} foto.`);
    return;
  }
}
```

> **Konstruk**: `Math.max(stateCount, fdFiles.length)` menggabungkan dua sumber file — file yang dipilih via state React (`photoFiles`) dan file yang masih tertempel di FormData. Aturan "min 3 per field, tapi 1 per field bila ada banyak field foto" menjaga aturan keamanan foto proyek (min 3/max 5) tetap berlaku offline.

**Potongan Kode Asli — handleSubmit: bangun payload & simpan lokal** (baris ±204-260):

```tsx
const collected: Record<string, unknown> = {};

fd.forEach((value, key) => {
  if (value instanceof File) return;
  collected[key] = value;
});

// GPS coords dari hidden input (location_lat / location_lng) sudah otomatis
// dari FormData — tambah anti-spam fields + timestamp
collected._submit_time = String(Date.now());
collected._website = "";
collected._captured_at = capturedAt;

// Pastikan field date selalu ada (hidden input mungkin gak terkirim)
if (!collected.date) {
  collected.date = new Date().toISOString().split("T")[0];
}
// Pastikan location_lat/lng selalu terisi — jangan sampai "" atau undefined
if (!collected.location_lat || !collected.location_lng) {
  if (gpsCoords) {
    collected.location_lat = String(gpsCoords.lat);
    collected.location_lng = String(gpsCoords.lng);
  } else {
    collected.location_lat = "0";
    collected.location_lng = "0";
  }
}
// Fallback untuk required fields yang mungkin kosong
for (const key of ["spring_name", "province", "regency", "flow_condition", "water_quality", "cleanliness"]) {
  if (!collected[key] || collected[key] === "") {
    collected[key] = key === "spring_name" ? "Mata Air" : key === "province" ? "Jawa Barat" : "-";
  }
}
```

**Potongan Kode Asli — queueSubmission dengan idempotency key** (baris ±262-282):

```tsx
await offlineDB.queueSubmission({
  id: `offline-${selectedForm.slug}-${Date.now()}`,
  formSlug: selectedForm.slug,
  fieldData: collected,
  photoBlobs,
  csrfToken: "",
  createdAt: Date.now(),
  retryCount: 0,
  // Idempotency key — UUID TETAP, dipakai server untuk dedupe retry
  clientCorrelationId: offlineDB.generateCorrelationId(),
});

setSubmitted(true);
```

**Potongan Kode Asli — layar sukses** (baris ±300-330):

```tsx
if (submitted) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <WifiOff className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink">Tersimpan!</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Laporan tersimpan di perangkat. Akan terkirim otomatis saat online.
        </p>
        ...
```

**Konstruk**

- **FormData sebagai sumber kebenaran** — file dipisah (`value instanceof File` dilewati), sisanya dikumpulkan apa adanya; pendekatan ini membuat komponen bekerja untuk *form dinamis apa pun* dari DB, bukan 5 form bawaan saja.
- **Honeypot `_website` & timestamp dikirim dari client** — tapi keputusan akhir tetap di server (rate limit, time gate, trust score).
- **Blob foto disimpan apa adanya** — kompresi dan pembersihan EXIF terjadi di sisi server saat sinkronisasi.

**🛡️ Kerentanan**

1. **Koordinat "0,0" sebagai fallback** — jika GPS gagal dan pengguna tidak mengisi manual, laporan tetap tersimpan dengan koordinat 0,0 (laut lepas dekat Afrika). Server harus menolak atau menandai laporan tanpa koordinat valid — jangan sampai lolos sebagai laporan nyata.
2. **Fallback nilai field** — `province` diisi "Jawa Barat" dan lainnya "-" saat kosong: data "palsu" ini masuk DB. Server harus punya jalur deteksi (mis. `isDummy`/flag) agar tidak mencemari statistik.
3. **Validasi Zod dilewati offline** — komponen ini tidak menjalankan `dynamicSchema` penuh; hanya foto + field wajib dasar yang dicek. Validasi ketat baru terjadi saat server menerima kiriman (dan laporan ditolak di sana → muncul toast "Laporan ditolak" dari QueueWorker).

### components/offline/offline-setup.tsx — wizard persiapan mode offline (342 baris, deep-dive)

**Alur Cerita**

`OfflineSetup` adalah gerbang sebelum relawan berangkat ke lapangan: **tutorial → pilih form → pilih radius/kualitas → pilih area → unduh tile → siap**. Ia mesin state murni dengan 6 langkah:

```tsx
type SetupStep = "tutorial" | "form-select" | "radius-quality" | "area-select" | "downloading" | "ready";

type RadiusKm = 3 | 5 | 7 | 10;
type QualityLevel = "ringan" | "sedang" | "lengkap";
```

1. **Tutorial** — persetujuan aturan (checkbox `agreed`); dilewati otomatis untuk pengguna yang sudah pernah setup (`offlineDB.getAllForms()`).
2. **Form select** — form diambil dari `/api/forms`, form aktif otomatis terpilih semua untuk pengguna baru; jika API gagal, fallback ke definisi form yang tersimpan di IndexedDB. Ada mode "save-only" (tanpa peta) dan "full".
3. **Radius & kualitas** — pilihan radius (3/5/7/10 km) dikalikan dengan pengali per kualitas (`getRadiusMultiplier`) untuk memperkirakan jumlah tile & ukuran unduhan (`qualityEstimates`).
4. **Area select** — `SetupMap` (lazy-loaded, dengan error fallback) menampilkan peta; saat area dipilih, `handleAreaSelected` menghitung bounding box dari pusat + radius dengan rumus haversine-delta.
5. **Downloading** — definisi form di-cache ke IndexedDB (`FormDefinition[]`), lalu tile peta diunduh dengan progress.
6. **Ready** — mode siap pakai; pengguna masuk ke `SimpleOfflineForm`.

**Potongan Kode Asli — lazy load peta dengan fallback** (baris ±45-60):

```tsx
// ─── Lazy load map (SSR=false) with error fallback ──────────────────────────
const SetupMap = dynamic(
  () =>
    import("./setup-map")
      .then((m) => m.SetupMap)
      .catch(() => {
        // Jika Leaflet gagal load, tampilkan komponen fallback
        ...
      }),
  { ssr: false }
);
```

> **Konstruk**: `.then().catch()` di dalam `dynamic()` — jika bundle peta gagal dimuat (jaringan buruk, cache rusak), aplikasi tetap berjalan dengan UI fallback alih-alih blank screen. Kombinasi dengan `ErrorBoundary` di bawahnya membuat lapisan pertahanan ganda.

**Potongan Kode Asli — lewati tutorial untuk pengguna lama** (baris ±215-225):

```tsx
// ── Check if setup was done before ─────────────────────────────────────────
useEffect(() => {
  offlineDB.getAllForms().then((cached) => {
    if (cached.length > 0) setHasSetupBefore(true);
  });
}, []);

// ── Skip tutorial for returning users ─────────────────────────────────────
useEffect(() => {
  if (hasSetupBefore && step === "tutorial") {
    setStep("form-select");
  }
}, [hasSetupBefore]); // eslint-disable-line react-hooks/exhaustive-deps
```

> **Konstruk**: deteksi "pernah setup" cukup dengan mengecek apakah ada form ter-cache di IndexedDB — tanpa flag terpisah. `eslint-disable` di sini disengaja: effect hanya boleh jalan saat `hasSetupBefore` berubah, bukan saat `step` berubah.

**Potongan Kode Asli — ambil form dengan fallback cache** (baris ±230-270):

```tsx
useEffect(() => {
  if (step !== "form-select") return;

  fetch("/api/forms")
    .then((r) => r.json())
    .then((data) => {
      const activeForms = (data.forms ?? []).filter((f: FormItem) => f.isActive);
      setForms(activeForms);
      // Auto-select all if first time
      if (activeForms.length > 0 && !hasSetupBefore) {
        setSelectedForms(new Set(activeForms.map((f: FormItem) => f.slug)));
      }
    })
    .catch(() => {
      // Fallback: cached forms dari IndexedDB
      offlineDB.getAllForms().then((cached) => {
        if (cached.length > 0) {
          setForms(cached.map((f) => ({ ... })));
        }
      });
    })
    .finally(() => setLoadingForms(false));
}, [step, hasSetupBefore]);
```

**Potongan Kode Asli — hitung bounding box area** (baris ±296-315):

```tsx
const handleAreaSelected = useCallback(
  (center: { lat: number; lng: number }, radius: number) => {
    setSelectedCenter(center);
    // Calculate bounding box from circle center + radius
    const latDelta = (radius / 6371) * (180 / Math.PI);
    const lngDelta = (radius / 6371) * (180 / Math.PI) / Math.cos((center.lat * Math.PI) / 180);
    setSelectedArea({
      north: center.lat + latDelta,
      south: center.lat - latDelta,
      east: center.lng + Math.abs(lngDelta),
      west: center.lng - Math.abs(lngDelta),
    });
  },
  []
);
```

> **Konstruk**: konversi lingkaran → bounding box. `latDelta` lurus (1° lintang ≈ 111 km), `lngDelta` menyusut sebesar `cos(lat)` karena bujur menyempit di dekat kutub — ini matematika geodesi dasar yang sering diimplementasikan salah (tanpa faktor cos). Radius dibagi 6371 (jari-jari bumi km).

**Konstruk**

- **Mesin state `SetupStep`** — 6 langkah dengan transisi eksplisit (`handleNextFromTutorial`, `handleNextFromFormSelect`, dst.); mode "save-only" memotong langkah radius & area.
- **Perkiraan ukuran unduhan** — `qualityInfo.tileCount * radiusMult` memberi tahu pengguna berapa MB yang akan dihabiskan sebelum unduh; mencegah kejutan kuota.
- **Cache-first** — semua keputusan (form, setup-lama) bisa berjalan dari IndexedDB saat API mati.

**🛡️ Kerentanan**

1. **Unduhan tile bisa membengkak** — radius 10 km × kualitas "lengkap" bisa ratusan MB; tanpa batas server, ini bisa jadi alat DDoS penyimpanan (app crash karena IndexedDB penuh). Batasi kualitas/radius di sisi server atau beri konfirmasi ukuran.
2. **Fallback cache usang** — definisi form dari cache bisa basi (field berubah di admin); laporan yang diisi dengan form lama bisa gagal validasi server. Beri versi cache & invalidasi.
3. **`eslint-disable` disengaja tapi rentan refactor** — komentar ekshaustif-deps yang di-disable bisa menyembunyikan bug ketergantungan jika komponen diubah besar-besaran.

### components/offline/offline-exit-sync.tsx — sinkronisasi saat keluar mode offline (277 baris)

**Alur Cerita**

`OfflineExitSync` adalah "checkout counter" setelah survei lapangan selesai: **ringkasan → unduh laporan → unggah foto → kirim laporan → titik tracking → bersihkan → selesai**. Flow resmi versi terbaru tertulis di komentar kepala komponen:

```tsx
/**
 * OfflineExitSync — handles sync on exit from offline mode.
 *
 * Flow (revamped):
 * 1. Show full review summary (distance, markers, forms, photos, route)
 * 2. User can download a summary text file
 * 3. Upload FOTO (WAJIB) — if fails, STOP
 * 4. Send forms to /api/reports
 * 5. Send tracking points to /api/offline/sync
 * 6. Clear IndexedDB + cache tiles
 * 7. Show completion screen with cleanup prompt
 * 8. Call onComplete()
 */
```

1. **Phase `confirm`** — memuat semua data dari IndexedDB: tracking points, laporan, foto, konfigurasi sesi.
2. **Hitung ringkasan** — marker dihitung per jenis (`spring`/`tree`/`trench`/`seedling`), jarak diperkirakan dari jejak titik (`trailPoints`) dengan aproksimasi datar, lalu pusat peta dihitung dari rata-rata batas koordinat.
3. **Unduh teks ringkasan** — `downloadText` membuat file `.txt` berbahasa Indonesia dengan emoji per jenis marker (fallback bila html2canvas gagal membuat gambar).
4. **Sinkronisasi bertahap** — foto diunggah lebih dulu (wajib; jika gagal, berhenti), lalu laporan ke `/api/reports` satu per satu, lalu tracking points ke `/api/offline/sync`.
5. **Bersihkan** — IndexedDB dikosongkan, cache tile dihapus, `onComplete()` dipanggil.

**Potongan Kode Asli — penghitungan ringkasan lapangan** (baris ±150-190):

```tsx
// Count markers by type
const springCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "spring").length;
const treeCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "tree").length;
const trenchCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "trench").length;
const seedlingCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "seedling").length;
const trailCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === null).length;
const markerCount = springCount + treeCount + trenchCount + seedlingCount;

// Rough distance estimate from tracking points
let totalDistance = 0;
const trailPoints = tracks.filter((t: OfflineTrackingPoint) => t.markerType === null);
for (let i = 1; i < trailPoints.length; i++) {
  const a = trailPoints[i - 1];
  const b = trailPoints[i];
  // Simple distance using flat approximation
  const dlat = (b.lat - a.lat) * 111320;
  const dlng = (b.lng - a.lng) * 111320 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  totalDistance += Math.sqrt(dlat * dlat + dlng * dlng);
}
```

> **Konstruk**: "flat approximation" — tiap derajat lintang ≈ 111.320 m, bujur dikoreksi `cos` lintang tengah. Cukup akurat untuk jarak jalan kaki (< 20 km); jauh lebih ringan daripada haversine penuh dan tidak butuh library geodesi.

**Potongan Kode Asli — unduh ringkasan sebagai file teks** (baris ±215-235):

```tsx
const downloadText = useCallback(() => {
  const dateStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const lines = [
    "=== SpringHub — Ringkasan Survey ===",
    `Tanggal: ${dateStr}`,
    `Jarak: ${formatDistance(summary.totalDistance)}`,
    `Marker: 💧 ${summary.springCount}  🌱 ${summary.treeCount}  🕳️ ${summary.trenchCount}  🌰 ${summary.seedlingCount}`,
    `Laporan: ${summary.reportCount}`,
    `Foto: ${summary.photoCount}`,
    "",
    "SpringHub — Jaga Semesta",
  ];
  ...
}, [summary]);
```

**Konstruk**

- **`SyncPhase` sebagai mesin state** — `confirm` → `uploading` → `syncing` → `done`; setiap phase punya UI berbeda.
- **Daftar status per item** — `photoStatuses`/`reportStatuses` (pending/uploading/success/error) memberi UI daftar centang per file — pengguna tahu persis item mana yang gagal.
- **Foto sebelum laporan** — urutan ini disengaja: laporan mereferensikan URL foto yang harus sudah ada di server.

**🛡️ Kerentanan**

1. **Jarak & jumlah marker dihitung di client** — nilai ini hanya untuk ringkasan, tapi jika dikirim ke server untuk poin, server wajib menghitung ulang dari tracking point mentah.
2. **Gagal di tengah jalan** — jika unggah foto gagal di foto ke-5 dari 20, seluruh proses berhenti; pengguna harus bisa me-retry per item, bukan mengulang dari awal.
3. **Pembersihan IndexedDB destruktif** — jika pembersihan terjadi sebelum server mengonfirmasi semua item, data hilang; pastikan status sukses benar-benar sukses sebelum `clear()`.

### components/offline/offline-survey-map.tsx — peta interaktif untuk menandai titik (279 baris)

**Alur Cerita**

`OfflineSurveyMap` adalah peta kerja relawan di lapangan: **menandai titik mata air, pohon, rorak, dan bibit** sambil berjalan. Ini versi "penuh" dari `survey-leaflet-map`.

1. Peta dimuat dari tile offline (lihat `offline-tile-layer.tsx`).
2. Tombol aksi kontekstual: "Tandai Mata Air", "Tandai Pohon", "Tandai Rorak", "Tandai Bibit" — masing-masing menyimpan `TrackingPoint` dengan `markerType` berbeda ke IndexedDB.
3. Titik yang sudah ditandai digambar dengan ikon/lingkaran berwarna berbeda per jenis.
4. Pelacakan jejak (`markerType: null`) merekam rute jalan.
5. Indikator GPS menampilkan akurasi & status lock.

**Potongan Kode Asli — penandaan titik dengan tipe** (baris ±30-80):

```tsx
async function addMarker(type: "spring" | "tree" | "trench" | "seedling" | null) {
  if (!session || !position) return;
  const point: OfflineTrackingPoint = {
    id: `tp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sessionId: session.id,
    lat: position.lat,
    lng: position.lng,
    markerType: type, // null = jejak perjalanan
    recordedAt: Date.now(),
  };
  await offlineDB.addTrackingPoint(point);
  setTracks((t) => [...t, point]);
  toast(type ? "Titik ditandai" : "Jejak tercatat", "success");
}
```

**Konstruk**

- **Satu fungsi `addMarker` untuk semua jenis** — jenis disandikan sebagai parameter, bukan 4 fungsi terpisah.
- **ID lokal berbasis waktu + acak** — cukup unik untuk penggunaan offline tanpa server.

**🛡️ Kerentanan**

- **Titik palsu** — `markerType` bebas string; server harus memvalidasi ulang enumerasi, jangan percaya client.

### components/offline/offline-entry-button.tsx — tombol masuk mode offline (21 baris)

**Alur Cerita**

Komponen terkecil di kelompok ini: tombol yang membawa pengguna ke `/offline`. Menampilkan ikon `WifiOff` dan label yang bisa diterjemahkan (`t("offline.title")`).

**Potongan Kode Asli — seluruh komponen** (baris ±1-21):

```tsx
"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function OfflineEntryButton() {
  const { t } = useI18n();
  return (
    <Link
      href="/offline"
      className="inline-flex items-center gap-2 rounded-xl border border-ink-line bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-brand-500 hover:text-brand-600 dark:bg-ink-card"
    >
      <WifiOff className="h-4 w-4" />
      {t("offline.entry")}
    </Link>
  );
}
```

**Konstruk**

- Komponen presentasional murni — tidak ada state, tidak ada data; mudah diuji dan dipindahkan.
- Tombol ini dipasang di `spring-map.tsx` (beranda) dan halaman `/offline` sendiri.

**🛡️ Kerentanan**

- Tidak ada — hanya navigasi. Kandidat termudah untuk dipelajari sebagai pola komponen "tombol" di proyek ini.

### components/offline/error-boundary.tsx — penjaga error komponen offline (51 baris)

**Alur Cerita**

`ErrorBoundary` adalah jaring pengaman: jika komponen anak (mis. peta, formulir) melempar error saat render, halaman tidak blank — pengguna melihat layar ramah dengan tombol "Coba Lagi".

1. `componentDidCatch` menangkap error dari subtree.
2. State `hasError` diset → UI fallback dirender.
3. Tombol reload memanggil `reset()` (state error dibersihkan, anak di-render ulang) atau `location.reload()`.

**Potongan Kode Asli — logika class boundary** (baris ±1-51):

```tsx
"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary] caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-medium text-ink">Terjadi kesalahan saat memuat tampilan.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Coba Lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Konstruk**

- **Class component** — satu-satunya cara resmi error boundary di React (hooks tidak bisa menangkap error render).
- **`getDerivedStateFromError` statis** — pola wajib; tanpa ini, React tidak tahu komponen ini boundary.

**🛡️ Kerentanan**

- **Error di dalam fallback tidak tertangkap** — boundary tidak menangkap error dirinya sendiri; pastikan fallback sesederhana mungkin (hanya teks + tombol).

### components/queue-worker.tsx — mesin sinkronisasi antrean offline (67 baris, deep-dive)

**Alur Cerita**

`QueueWorker` adalah pekerja senyap yang memastikan laporan offline **pasti terkirim**. Ia tidak merender apa pun (`return null`) — ia hanya hidup sebagai `useEffect` yang berjalan setiap 10 detik. Ini komponen terpenting di fitur offline, jadi kita bedah seluruhnya:

1. **Setup** — pada mount, `cleanupStale()` menghapus item antrean yang sudah basi (retry habis atau terlalu tua).
2. **Polling** — `setInterval(processQueue, POLL_INTERVAL_MS)` menjalankan pemrosesan setiap 10 detik.
3. **processQueue** — mencegah tumpang tindih dengan `processingRef` (guard), membaca seluruh antrean dari IndexedDB, lalu mengirim satu per satu ke `/api/reports` dengan `x-csrf-token` yang diambil **just-in-time** (`getCsrfToken()` — token tidak pernah di-cache).
4. **Idempotency** — setiap kiriman membawa `clientCorrelationId` yang sama dengan id item antrean; server memakai ini untuk menolak duplikat (409) walau retry terjadi berkali-kali.
5. **Penanganan hasil**:
   - `res.ok` → hapus dari antrean.
   - `failedValidation` → hapus + toast "Laporan ditolak" (tidak guna di-retry).
   - `409` → hapus + toast "sudah pernah terkirim" (duplikat).
   - error lain & `retryCount < MAX_RETRIES` → `updateQueuedRetry` + toast "coba lagi otomatis".
   - retry habis → hapus + toast "tidak terkirim".
6. **Network error** → diam saja (`catch {}`), antrean tetap utuh; siklus berikutnya akan mencoba lagi.

**Potongan Kode Asli — setup & interval** (baris ±1-30):

```tsx
"use client";

import { useEffect, useRef } from "react";
import { offlineDB } from "@/lib/offline-db";
import { toast } from "@/components/toast";

const POLL_INTERVAL_MS = 10_000;
const MAX_RETRIES = 5;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 jam

export default function QueueWorker() {
  const processingRef = useRef(false);

  // Hapus item basi: retry habis atau sudah lewat 24 jam
  async function cleanupStale() {
    const queue = await offlineDB.getAllQueued();
    const now = Date.now();
    for (const item of queue) {
      const isStale = item.retryCount >= MAX_RETRIES || now - item.createdAt > STALE_AFTER_MS;
      if (isStale) {
        await offlineDB.deleteQueued(item.id);
      }
    }
  }
```

**Potongan Kode Asli — ambil token CSRF just-in-time** (baris ±32-44):

```tsx
async function getCsrfToken(): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("/api/csrf", { cache: "no-store" });
      const data = await res.json();
      if (data.token) return data.token;
    } catch {}
    if (attempt < 3) await new Promise((r) => setTimeout(r, 300 * attempt));
  }
  return "";
}
```

> **Konstruk**: tiga percobaan dengan backoff (`300 * attempt` ms). Token diambil per pengiriman, bukan per mount — ini keputusan dari sesi debug CSRF (token yang di-cache terlalu lama jadi basi dan memicu `403 Invalid CSRF`).

**Potongan Kode Asli — processQueue dengan guard & penanganan hasil** (baris ±46-100):

```tsx
async function processQueue() {
  if (processingRef.current) return;
  processingRef.current = true;

  const queue = await offlineDB.getAllQueued();
  for (const item of queue) {
    try {
      // Resubmit POST dengan clientCorrelationId yang sama
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": await getCsrfToken() },
        body: JSON.stringify({
          ...item.data,
          clientCorrelationId: item.id,
        }),
      });
      if (res.ok) {
        await offlineDB.deleteQueued(item.id);
      } else {
        const errBody = await res.json().catch(() => null);
        if (errBody?.failedValidation) {
          // Kesalahan validasi — jangan retry lagi
          await offlineDB.deleteQueued(item.id);
          toast("Laporan ditolak: " + (errBody?.error || "validasi gagal"), "error");
        } else if (res.status === 409) {
          // Duplicate — sudah pernah dikirim
          await offlineDB.deleteQueued(item.id);
          toast("Laporanmu sudah pernah terkirim", "info");
        } else if (item.retryCount < MAX_RETRIES) {
          await offlineDB.updateQueuedRetry(item.id, item.retryCount + 1);
          toast("Gagal mengirim, coba lagi otomatis", "error");
        } else {
          // Retry habis — hapus + beri tahu user
          await offlineDB.deleteQueued(item.id);
          toast("Laporan tidak terkirim: " + (errBody?.error || "jaringan bermasalah"), "error");
        }
      }
    } catch {
      // Network error — silent, biarkan sisa queue intact
    }
  }

  processingRef.current = false;
}

useEffect(() => {
  cleanupStale();
  const interval = setInterval(processQueue, POLL_INTERVAL_MS);
  return () => clearInterval(interval);
}, []);

return null;
```

**Konstruk**

- **`processingRef` sebagai mutex** — mencegah dua siklus interval tumpang tindih saat pengiriman masih berjalan (interval 10 detik < durasi pengiriman batch).
- **Tiga kategori kegagalan** — validasi (pasti gagal → buang), duplikat (sudah sukses → buang), transien (jaringan/5xx → retry). Kategorisasi ini menghindari retry sia-sia dan kehilangan data.
- **`return null`** — komponen tanpa UI; dipasang sekali di layout aplikasi (`app/layout.tsx`).
- **Cleanup interval** — `clearInterval` di fungsi cleanup `useEffect` mencegah pekerja ganda saat Strict Mode dev.

**🛡️ Kerentanan**

1. **Foto belum diunggah di sini** — QueueWorker hanya mengirim field data + `clientCorrelationId`; foto dikirim lewat jalur terpisah. Jika laporan lolos tanpa foto, validasi server harus menolak (aturan min 3 foto).
2. **Token CSRF `""` dikirim apa adanya** — jika tiga percobaan gagal, permintaan dikirim tanpa token → server balas 403 → masuk kategori retry. Aman tapi boros; lebih baik skip siklus bila token kosong.
3. **Tidak ada rate limiting sisi client** — batch besar (mis. 50 laporan) dikirim berurutan secepat mungkin; bisa memicu rate limit server (5/hari guest). Pertimbangkan jeda antar kiriman.
4. **IndexedDB dibaca berulang** — `getAllQueued()` tiap 10 detik; pada perangkat lemah dengan antrean besar, ini boros. Pertimbangkan pemicu event (mis. `online`) selain interval.

---

## Kelompok Section Beranda

Sepuluh komponen di kelompok ini membangun halaman beranda (`/`) — dari hero sampai donor. Semuanya diimpor oleh `app/page.tsx` dan sebagian besar memakai i18n (`useI18n`) untuk teks dua bahasa.

### components/sections/impact-dashboard.tsx — papan statistik dampak (118 baris, deep-dive)

**Alur Cerita**

`ImpactDashboard` menampilkan bukti dampak komunitas: **statistik utama, progres bulanan, wilayah teratas, dan relawan teratas**. Datanya nyata — diambil dari `/api/dashboard` — dengan fallback diam-diam ke null (bukan demo palsu).

1. **Mount** → `fetch("/api/dashboard")`; jika gagal, `data` tetap null dan UI menampilkan pesan "tidak ada data" (bukan angka bohong).
2. **Paginasi bulanan** — 5 baris per halaman dengan tombol kiri/kanan; `visibleMonthly` adalah irisan state.
3. **Pemetaan ikon → label** — `IconToStatKey` menerjemahkan nama ikon dari server (`droplet`, `sparkles`, `tree`, `layers`) ke kunci terjemahan.
4. **Render** — kartu statistik, grafik batang mini bulanan, tabel wilayah, dan daftar relawan top.

**Potongan Kode Asli — tipe data dari server** (baris ±1-30):

```tsx
type ImpactStat = {
  icon: "droplet" | "sparkles" | "tree" | "layers";
  value: number;
  suffix: "now" | "joined";
};

type TopRegion = { rank: number; name: string; detail: string };
type TopVolunteer = { rank: number; name: string; region: string; points: number };

type DashboardData = {
  impactStats: ImpactStat[];
  monthlyProgress: MonthlyProgress[];
  topRegions: TopRegion[];
  topVolunteers: TopVolunteer[];
};
```

**Potongan Kode Asli — fetch + paginasi** (baris ±32-60):

```tsx
export function ImpactDashboard() {
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyPage, setMonthlyPage] = useState(0);
  const monthlyPerPage = 5;

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalMonthlyPages = data ? Math.ceil(data.monthlyProgress.length / monthlyPerPage) : 0;
  const visibleMonthly = data
    ? data.monthlyProgress.slice(monthlyPage * monthlyPerPage, monthlyPage * monthlyPerPage + monthlyPerPage)
    : [];
```

> **Konstruk**: `monthlyPage * monthlyPerPage` dua kali — pola slice manual tanpa library. Selalu berpasangan dengan `totalMonthlyPages` untuk tombol navigasi; mudah diubah ke `slice(start, start + size)`.

**Potongan Kode Asli — pemetaan ikon ke kunci i18n** (baris ±62-85):

```tsx
const IconToStatKey: Record<string, string> = {
  droplet: "dashboard.stat.monitored",
  sparkles: "dashboard.stat.restored",
  tree: "dashboard.stat.trees",
  layers: "dashboard.stat.trenches",
};

const monthlyKeys = [
  "dashboard.monthly.treePlanting",
  "dashboard.monthly.springMonitoring",
  "dashboard.monthly.springRestoration",
  "dashboard.monthly.rorak",
  "dashboard.monthly.seedlingStock",
  "dashboard.monthly.activeUsers",
  "dashboard.monthly.projectsSubmitted",
  "dashboard.monthly.coursesCompleted",
  "dashboard.monthly.totalDonations",
  "dashboard.monthly.protectedArea",
];
```

**Potongan Kode Asli — render dengan tiga kondisi** (baris ±87-118):

```tsx
{loading ? (
  <div className="mt-10 flex flex-col items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    <p className="mt-3 text-sm text-ink-muted">{t("common.loading")}</p>
  </div>
) : !data ? (
  <div className="mt-10 text-center text-ink-muted">
    <p>{t("dashboard.noData")}</p>
  </div>
) : (
  // render grid statistik + bulanan + wilayah + relawan
)}
```

**Konstruk**

- **Tiga kondisi render** (`loading` / `no data` / `data`) — pola standar yang mencegah akses `data.x` sebelum data ada.
- **DraftBanner disematkan di sini** — banner draft global muncul di tengah dashboard, bukan di header; keputusan penempatan untuk visibilitas.
- **Ikon sebagai data (string)** — server mengirim nama ikon, client memetakan ke komponen; menjaga API tetap ramping.

**🛡️ Kerentanan**

1. **Nilai dari server dirender langsung** — jika `/api/dashboard` tidak memvalidasi (mis. `value` negatif, `name` berisi HTML), bisa muncul angka aneh atau XSS; pastikan API hanya mengirim angka + teks polos.
2. **Tidak ada polling/refetch** — data hanya dimuat saat mount; dashboard bisa basi di tab yang lama terbuka. Pertimbangkan interval atau `revalidateOnFocus`.

### components/sections/hero.tsx — pintu depan beranda (47 baris)

**Alur Cerita**

`Hero` adalah bagian paling atas beranda: **judul besar, subjudul, dan dua tombol aksi** (Lihat Peta / Mulai Berkontribusi). Murni presentasional.

**Potongan Kode Asli — struktur** (baris ±1-47):

```tsx
"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white py-20 dark:from-brand-950 dark:to-ink-card">
      <div className="container-page text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          {t("hero.title")} <span className="text-brand-600">{t("hero.titleAccent")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted md:text-lg">
          {t("hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="#map" className="btn-primary">
            {t("hero.ctaPrimary")}
          </Link>
          <Link href="#volunteer" className="btn-secondary">
            {t("hero.ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

**Konstruk**

- **Gradasi dua tema** (`from-brand-50 to-white` / `dark:from-brand-950 dark:to-ink-card`) — pola warna SpringHub di seluruh beranda.
- **Anchor navigation** — `#map` dan `#volunteer` menggulir ke section ber-ID.

**🛡️ Kerentanan**

- Tidak ada state/logika; aman. Pola terbaik untuk belajar struktur section beranda.

### components/sections/spring-map.tsx — peta + filter + detail mata air (147 baris)

**Alur Cerita**

`SpringMap` adalah section peta di beranda: **filter, peta interaktif, dan panel detail mata air** dalam satu wadah. Ini pemanggil utama `LeafletMap`.

1. **Load dinamis** — `LeafletMap` diimpor dengan `next/dynamic({ ssr: false })` + fallback loading ("Loading OpenStreetMap…").
2. **Data** — `useSpringCluster` (dari `lib/geo`) menghitung klaster dari springs & reports; `MapFilter` memfilter berdasarkan kata kunci/provinsi.
3. **Pemetaan status** — `getStatusFromForm` menerjemahkan `formSlug` ke status visual (sehat/restorasi) — dengan hardcode 5 form + fallback tebak dari judul.
4. **Detail** — klik marker → `setSelected` → panel detail di bawah peta (scroll otomatis `scrollIntoView`).
5. **Tombol offline** — `OfflineEntryButton` diletakkan di bawah tombol "Report Your Contribution".

**Potongan Kode Asli — dynamic import dengan fallback** (baris ±8-26):

```tsx
const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-slate-50 text-sm text-ink-subtle dark:bg-slate-800 dark:text-slate-400">
        Loading OpenStreetMap…
      </div>
    ),
  }
);
```

**Potongan Kode Asli — pemetaan status form** (baris ±34-60):

```tsx
function getStatusFromForm(formSlug: string, formTitle?: string): string {
  // Hardcoded untuk 5 form static
  const staticMap: Record<string, string> = {
    "spring-monitoring": "healthy",
    "spring-restoration": "restoration",
    "trench-development": "restoration",
    "tree-planting": "restoration",
    "seedling-stock": "healthy",
  };
  if (staticMap[formSlug]) return staticMap[formSlug];

  // Fallback: tebak dari title/description
  const lower = (formTitle || formSlug).toLowerCase();
  if (lower.includes("restorasi") || lower.includes("restoration") || lower.includes("tanam") || lower.includes("trench") || lower.includes("rorak")) {
    return "restoration";
  }
  ...
}
```

**Konstruk**

- **Peta sebagai `dynamic` import** — bundle Leaflet (~150 KB) tidak ikut muatan awal; hanya dimuat saat section peta dirender.
- **Hardcode + fallback heuristik** — strategi praktis untuk sistem yang berubah (form dinamis dari admin) tapi tetap stabil untuk 5 form inti.

**🛡️ Kerentanan**

1. **Heuristik status bisa salah tebak** — form dinamis baru dengan judul tidak standar bisa salah status (mis. "restorasi" tanpa kata kunci). Status visual bisa menyesatkan publik; pertimbangkan field status eksplisit di form.
2. **`scrollIntoView` tanpa guard** — jika elemen `#spring-detail` tidak ada (mis. SSR), browser melempar error; bungkus dengan pemeriksaan keberadaan elemen.

### components/sections/status-info.tsx — info status & kontribusi (101 baris)

**Alur Cerita**

`StatusInfo` menjelaskan **status mata air** (Sehat / Perlu Restorasi) dan cara berkontribusi, lengkap dengan legenda warna. Dipakai di dalam section peta.

1. Menampilkan legenda: warna hijau = sehat, oranye = restorasi, abu-abu = belum diverifikasi.
2. Menjelaskan sistem poin singkat (ikon + teks).
3. Tombol "Report Your Contribution" → `/report` + tombol offline.

**Potongan Kode Asli — legenda** (baris ±10-40):

```tsx
<div className="flex items-center gap-4 text-xs text-ink-muted">
  <span className="flex items-center gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Sehat
  </span>
  <span className="flex items-center gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Restorasi
  </span>
  <span className="flex items-center gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Belum diverifikasi
  </span>
</div>
```

**Konstruk**

- Komponen informasi statis; hanya memakai `useI18n` untuk label.
- Palet warna konsisten dengan marker peta (`emerald`/`amber`/`slate`).

**🛡️ Kerentanan**

- Tidak ada logika; aman.

### components/sections/volunteer.tsx — ajakan menjadi relawan (115 baris)

**Alur Cerita**

`Volunteer` adalah section CTA: **ilustrasi, manfaat menjadi relawan, dan tombol daftar**. Menampilkan tiga kartu manfaat (poin, komunitas, dampak) dan tautan ke `/join`.

**Potongan Kode Asli — kartu manfaat** (baris ±20-60):

```tsx
const benefits = [
  { icon: Coins, titleKey: "volunteer.benefit1.title", descKey: "volunteer.benefit1.desc" },
  { icon: Users, titleKey: "volunteer.benefit2.title", descKey: "volunteer.benefit2.desc" },
  { icon: Sprout, titleKey: "volunteer.benefit3.title", descKey: "volunteer.benefit3.desc" },
];

return (
  <section id="volunteer" className="container-page py-16">
    <div className="grid gap-6 md:grid-cols-3">
      {benefits.map((b) => {
        const Icon = b.icon;
        return (
          <div key={b.titleKey} className="rounded-2xl border border-ink-line bg-white p-6 shadow-sm dark:bg-ink-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950">
              <Icon className="h-5 w-5 text-brand-600" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">{t(b.titleKey)}</h3>
            <p className="mt-1.5 text-sm text-ink-muted">{t(b.descKey)}</p>
          </div>
        );
      })}
    </div>
  </section>
);
```

**Konstruk**

- **Data-driven rendering** — daftar manfaat dideklarasikan sebagai array objek, lalu di-map; menambah manfaat = menambah satu entri array.
- **Kunci i18n sebagai data** — komponen tidak pernah memegang teks literal.

**🛡️ Kerentanan**

- Statis; aman.

### components/sections/featured-projects.tsx — proyek unggulan di beranda (117 baris)

**Alur Cerita**

`FeaturedProjects` menampilkan **3 proyek terbaik** dengan foto, progres donasi, dan peta mini lokasi.

1. Menerima props `projects` dari halaman (server-rendered dari DB via prisma).
2. Setiap kartu: foto cover (`featuredPhoto`), judul, wilayah, progress bar donasi (`raised/goal`), tombol "Lihat Detail" → `/projects/[slug]`.
3. `MiniMap` (dynamic import) ditampilkan di kartu untuk lokasi — hanya jika koordinat ada.

**Potongan Kode Asli — tipe data proyek** (baris ±1-35):

```tsx
type ProjectItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  region: string;
  status: string;
  goalAmount: number;
  raisedAmount: number;
  featuredPhoto?: { url: string } | null;
  lat?: number;
  lng?: number;
};

type FeaturedProjectsProps = {
  projects: ProjectItem[];
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
};
```

**Potongan Kode Asli — progress bar donasi** (baris ±50-80):

```tsx
<div className="mt-4">
  <div className="flex items-center justify-between text-xs text-ink-muted">
    <span>{formatRupiah(project.raisedAmount)}</span>
    <span>dari {formatRupiah(project.goalAmount)}</span>
  </div>
  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500"
      style={{ width: `${Math.min(100, (project.raisedAmount / project.goalAmount) * 100)}%` }}
    />
  </div>
</div>
```

> **Konstruk**: `Math.min(100, ...)` — guard pembagi nol & progres > 100% (donasi bisa melebihi target). Tanpa guard ini, `goalAmount = 0` menghasilkan `Infinity%`.

**🛡️ Kerentanan**

1. **`featuredPhoto.url` bisa null** — pastikan ada placeholder saat foto kosong (jangan render `<img src={undefined}>`).
2. **Pembagian nol** — lihat konstruk di atas; selalu guard `goalAmount > 0`.

### components/sections/learning-hub.tsx — hub kursus di beranda (105 baris)

**Alur Cerita**

`LearningHub` menampilkan **3 kursus edukasi** (Konservasi Mata Air, Hidrologi Dasar, Aksi Restorasi) dengan ikon, level, durasi, dan tautan ke `/learn`.

**Potongan Kode Asli — struktur kartu kursus** (baris ±15-55):

```tsx
const courses = [
  { slug: "spring-conservation", titleKey: "learn.course1.title", descKey: "learn.course1.desc", icon: Droplets, level: "Dasar", duration: "2 jam" },
  { slug: "basic-hydrology", titleKey: "learn.course2.title", descKey: "learn.course2.desc", icon: Waves, level: "Menengah", duration: "3 jam" },
  { slug: "restoration-action", titleKey: "learn.course3.title", descKey: "learn.course3.desc", icon: Sprout, level: "Lanjut", duration: "4 jam" },
];

{courses.map((c) => {
  const Icon = c.icon;
  return (
    <Link key={c.slug} href={`/learn/${c.slug}`} className="group rounded-2xl border border-ink-line bg-white p-6 shadow-sm transition hover:border-brand-500 dark:bg-ink-card">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
        <Icon className="h-5 w-5 text-emerald-600" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{t(c.titleKey)}</h3>
      <p className="mt-1.5 text-sm text-ink-muted line-clamp-2">{t(c.descKey)}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
        <span className="rounded-full bg-ink/5 px-2 py-0.5">{c.level}</span>
        <span>{c.duration}</span>
      </div>
    </Link>
  );
})}
```

**Konstruk**

- **Kursus di-hardcode di client** — daftar kursus ada di DB (`Course` model) tapi beranda memakai versi statis; resiko duplikasi data (lihat Kerentanan).

**🛡️ Kerentanan**

- **Duplikasi sumber data** — jika admin menambah kursus di DB, beranda tidak menampilkannya. Pertimbangkan fetch `/api/courses` agar konsisten.

### components/sections/media.tsx — galeri media & cerita (150 baris)

**Alur Cerita**

`Media` adalah galeri: **video, cerita, proyek, dan foto** dalam tab filter. Data berasal dari `MediaItem` di DB dengan fallback `demoMedia` (ditandai `isDummy`).

1. State `activeSection` (video/story/project/photos) mengontrol tab.
2. Data difetch dari `/api/media?section=...`; jika kosong, `demoMedia` ditampilkan sebagai placeholder (kartu ditandai "Demo").
3. Video memakai `LiteYoutubeEmbed` (dynamic import) untuk performa.

**Potongan Kode Asli — tipe & filter** (baris ±1-40):

```tsx
type MediaType = "video" | "story" | "project" | "photos";
type Section = "video" | "story" | "project" | "photos";

const demoMedia: MediaItem[] = [ /* item dummy bertanda isDummy: true */ ];

const sections: { id: Section; labelKey: string }[] = [
  { id: "video", labelKey: "media.tab.video" },
  { id: "story", labelKey: "media.tab.story" },
  { id: "project", labelKey: "media.tab.project" },
  { id: "photos", labelKey: "media.tab.photos" },
];

{sections.map((s) => (
  <button
    key={s.id}
    onClick={() => setActiveSection(s.id)}
    className={cn(
      "rounded-full px-4 py-1.5 text-sm font-medium transition",
      activeSection === s.id ? "bg-brand-600 text-white" : "bg-ink/5 text-ink-muted hover:bg-ink/10"
    )}
  >
    {t(s.labelKey)}
  </button>
))}
```

**Konstruk**

- **`isDummy` flag** — item demo ditandai di DB agar tidak tercampur statistik; UI bisa memberi badge "Demo".
- **Tab sebagai state + map** — bukan 4 blok JSX terpisah.

**🛡️ Kerentanan**

1. **Konten media dari DB** — `imageUrl`/`linkUrl` harus divalidasi (protokol http/https saja) agar tidak jadi `javascript:` link di admin.
2. **Youtube embed** — pastikan hanya domain youtube.com yang diizinkan di `LiteYoutubeEmbed`.

### components/sections/donate.tsx — donasi cepat di beranda (177 baris)

**Alur Cerita**

`Donate` menawarkan donasi sekali klik dengan **jumlah pilihan + proyek tujuan** (data awal `INITIAL_PROJECTS`, nanti dari DB). UI-nya sudah lengkap; prosesor pembayaran (Xendit) masih menunggu kunci API asli — karena itu tombol konfirmasi menampilkan status "segara hadir" atau mengarahkan ke halaman donasi.

1. Pilih proyek → panel detail proyek (progres, jumlah donatur).
2. Pilih nominal (chip 15rb - 1jt) atau isi manual.
3. Tombol donasi → validasi → (saat ini) pesan info bahwa pembayaran menyusul.

**Potongan Kode Asli — nominal & proyek awal** (baris ±1-45):

```tsx
const DONATION_AMOUNTS = [15000, 50000, 100000, 250000, 500000, 1000000];

const INITIAL_PROJECTS = [
  { id: "proyek-jalatunda", title: "Restorasi Mata Air Jalatunda", region: "Banjarnegara", raised: 2400000, goal: 5000000, donorCount: 47 },
  { id: "proyek-tuk-bening", title: "Konservasi Tuk Bening", region: "Gunung Kidul", raised: 1750000, goal: 4000000, donorCount: 31 },
  { id: "proyek-sendang-biru", title: "Perlindungan Sendang Biru", region: "Malang", raised: 980000, goal: 3000000, donorCount: 19 },
];
```

**Potongan Kode Asli — chip nominal** (baris ±80-110):

```tsx
<div className="grid grid-cols-3 gap-2">
  {DONATION_AMOUNTS.map((amount) => (
    <button
      key={amount}
      onClick={() => setAmount(amount)}
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
        selectedAmount === amount
          ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950"
          : "border-ink-line text-ink-muted hover:border-brand-400"
      )}
    >
      {formatRupiah(amount)}
    </button>
  ))}
</div>
```

**Konstruk**

- **State nominal + state manual** — `selectedAmount` dibandingkan dengan setiap chip; input manual menimpa pilihan.
- **UI siap, backend menyusul** — pola "frontend-first" yang jujur: tombol tidak menipu pengguna, melainkan menampilkan status nyata.

**🛡️ Kerentanan**

1. **Data proyek hardcode** — bisa basi dan tidak sinkron dengan halaman `/projects`; jadikan fetch dari API begitu backend donasi hidup.
2. **Nominal tidak dibatasi** — tanpa batas atas di client, pengguna bisa mengetik nominal raksasa; validasi di server saat pembayaran diaktifkan.

### components/sections/points-guide-modal.tsx — modal panduan poin (112 baris)

**Alur Cerita**

`PointsGuideModal` menjelaskan **cara kerja poin**: tabel aturan (form → poin dasar), bonus (streak, kualitas, penemuan), dan badge level. Dipicu dari tombol ikon di header/beranda.

1. `FALLBACK_RULES` memuat 9 aturan: 5 form (25/100/50/50/15 poin) + bonus (streak, kualitas foto, penemuan mata air, milestone).
2. Modal terbuka/tertutup via state `open`; data poin bisa diperbarui dari `lib/points` di server (POINTS_MAP).
3. Render tabel aturan + badge level (Pemula → Relawan → Pelindung).

**Potongan Kode Asli — struktur aturan** (baris ±1-30):

```tsx
type PointsRule = {
  id: string;
  titleKey: string;
  descKey: string;
  basePoints: number;
  bonusKeys?: string[];
  icon: string; // nama ikon lucide
};

const FALLBACK_RULES: PointsRule[] = [
  { id: "monitoring", titleKey: "points.rule.monitoring", descKey: "points.rule.monitoring.desc", basePoints: 25, icon: "droplet" },
  { id: "restoration", titleKey: "points.rule.restoration", descKey: "points.rule.restoration.desc", basePoints: 100, icon: "sparkles" },
  { id: "trench", titleKey: "points.rule.trench", descKey: "points.rule.trench.desc", basePoints: 50, icon: "layers" },
  { id: "planting", titleKey: "points.rule.planting", descKey: "points.rule.planting.desc", basePoints: 50, icon: "tree" },
  { id: "seedling", titleKey: "points.rule.seedling", descKey: "points.rule.seedling.desc", basePoints: 15, icon: "sprout" },
  // + bonus: streak harian, kualitas foto, penemuan mata air baru, milestone
];
```

> **Konstruk**: nilai poin di sini adalah *fallback UI*. Nilai asli yang dipakai sistem ada di `lib/points.ts` (server-only) — aturan keamanan proyek: jangan pernah percaya angka dari client. UI boleh menampilkan, sistem yang memutuskan.

**🛡️ Kerentanan**

- **Dua sumber kebenaran poin** — jika `lib/points.ts` berubah tapi fallback ini tidak, UI menampilkan angka salah. Sebaiknya fetch aturan dari API admin, simpan `FALLBACK_RULES` hanya untuk offline.

---

## Kelompok Proyek

### components/projects/CommentsSection.tsx — komentar publik di halaman proyek (55 baris)

**Alur Cerita**

`CommentsSection` menampilkan dan mengirim komentar pada sebuah proyek: **daftar komentar (nama + waktu + isi) + form komentar baru** yang dikirim ke `/api/projects/[slug]/comments`.

**Potongan Kode Asli — inti komponen** (baris ±1-55):

```tsx
"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { MessageCircle, Send } from "lucide-react";

type CommentItem = {
  id: string;
  profileName: string;
  text: string;
  createdAt: string;
};

export function CommentsSection({ comments: initial, projectSlug }: { comments: CommentItem[]; projectSlug: string }) {
  const { t } = useI18n();
  const [comments, setComments] = useState<CommentItem[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": await fetch("/api/csrf").then((r) => r.json()).then((d) => d.token) },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((c) => [...c, created.comment]);
        setText("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-8">
      <h3 className="flex items-center gap-2 text-lg font-bold"><MessageCircle className="h-5 w-5" /> Komentar</h3>
      {/* daftar komentar + form input */}
    </section>
  );
}
```

**Konstruk**

- **Optimistic-ish update** — komentar baru ditambahkan setelah respons sukses (bukan sebelum); sederhana dan aman dari duplikat.
- **CSRF inline saat submit** — konsisten dengan pola just-in-time token.

**🛡️ Kerentanan**

1. **Teks komentar tanpa sanitasi client** — React meng-escape otomatis saat render (`{c.text}`), jadi XSS aman di sini; tetap validasi panjang teks di server (mis. max 500).
2. **Rate limit** — komentar spam tidak diatasi di komponen; server wajib membatasi per pengguna.

---

## Kelompok Layout & Global

Sepuluh komponen ini dipasang hampir di setiap halaman: header, footer, logo, toast, banner draft, tombol poin mengambang, video YouTube ringan, panduan install PWA, pencatat error, dan watermark.

### components/site-header.tsx — navigasi utama (255 baris)

**Alur Cerita**

`SiteHeader` adalah navigasi global: **logo, tautan menu, toggle tema, tombol poin, tombol masuk, dan menu mobile**. Komponen ini lebih panjang karena menangani banyak status.

1. `NAV_LINKS` mendefinisikan 5 tautan utama (Beranda, Peta, Proyek, Belajar, Tentang).
2. `usePathname()` menyorot tautan aktif.
3. Status login dari `lib/session-cache` (atau cookies); tombol berubah: "Masuk" vs avatar + poin.
4. Tombol poin membuka `PointsGuideModal`.
5. Di layar kecil, tombol hamburger membuka menu overlay.

**Potongan Kode Asli — tautan navigasi & path aktif** (baris ±20-60):

```tsx
const NAV_LINKS = [
  { href: "/", labelKey: "nav.home" },
  { href: "/#map", labelKey: "nav.map" },
  { href: "/projects", labelKey: "nav.projects" },
  { href: "/learn", labelKey: "nav.learn" },
  { href: "/help", labelKey: "nav.help" },
];

const pathname = usePathname();
const isActive = (href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]);
```

**Potongan Kode Asli — menu mobile** (baris ±180-230):

```tsx
{isMenuOpen && (
  <div className="border-t border-ink-line bg-white px-4 py-3 dark:bg-ink-card md:hidden">
    <nav className="flex flex-col gap-1">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setIsMenuOpen(false)}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium",
            isActive(link.href) ? "bg-brand-50 text-brand-700 dark:bg-brand-950" : "text-ink-muted hover:bg-ink/5"
          )}
        >
          {t(link.labelKey)}
        </Link>
      ))}
    </nav>
  </div>
)}
```

**Konstruk**

- **`isActive` dengan `startsWith`** — tautan `/#map` dianggap aktif di semua halaman `/`; pemisahan `href.split("#")[0]` menghindari salah hitung untuk hash.
- **Menu mobile dikendalikan state** — menutup menu saat tautan diklik mencegah overlay macet.

**🛡️ Kerentanan**

1. **Sesi di-cache di client** — tombol masuk/keluar bergantung pada cache sesi yang bisa basi; pastikan sinkronisasi dengan server saat halaman dimuat.
2. **Menu overlay tanpa trap fokus** — aksesibilitas: tambahkan `aria-expanded` dan kunci `Escape` untuk menutup menu.

### components/site-footer.tsx — kaki halaman (160 baris)

**Alur Cerita**

`SiteFooter` menutup halaman dengan **info proyek, tautan cepat, kolom kontak, dan kredit**. Murni presentasional + `useI18n`.

**Potongan Kode Asli — kolom tautan** (baris ±30-80):

```tsx
const footerColumns = [
  {
    titleKey: "footer.explore",
    links: [
      { href: "/", labelKey: "nav.home" },
      { href: "/projects", labelKey: "nav.projects" },
      { href: "/learn", labelKey: "nav.learn" },
      { href: "/offline", labelKey: "nav.offline" },
    ],
  },
  {
    titleKey: "footer.about",
    links: [
      { href: "/help", labelKey: "footer.help" },
      { href: "/faq", labelKey: "footer.faq" },
      { href: "/privacy", labelKey: "footer.privacy" },
      { href: "/terms", labelKey: "footer.terms" },
    ],
  },
];
```

**Konstruk**

- **Data-driven footer** — kolom & tautan sebagai array; render satu `map`.
- **Tahun dinamis** — `new Date().getFullYear()` di baris kredit.

**🛡️ Kerentanan**

- Statis; aman.

### components/logo.tsx — logo merek (25 baris)

**Alur Cerita**

`Logo` adalah identitas visual: **ikon mata air (SVG sederhana) + tulisan "SpringHub"**. Dipakai di header dan footer.

**Potongan Kode Asli — seluruh komponen** (baris ±1-25):

```tsx
import Link from "next/link";
import { Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} aria-label="SpringHub">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 text-white">
        <Droplets className="h-5 w-5" />
      </span>
      {withText && <span className="text-lg font-extrabold tracking-tight text-ink">SpringHub</span>}
    </Link>
  );
}
```

**Konstruk**

- `withText` memungkinkan mode "ikon saja" untuk ruang sempit (mobile footer).
- `aria-label` menjaga aksesibilitas saat teks disembunyikan.

### components/layout/watermark.tsx — watermark latar (21 baris)

**Alur Cerita**

`Watermark` menambahkan **teks "SpringHub" transparan** sebagai elemen dekoratif latar belakang — dipakai di halaman statis (help, privacy, dsb.) agar tidak terasa kosong.

**Potongan Kode Asli — seluruh komponen** (baris ±1-21):

```tsx
export function Watermark() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 select-none overflow-hidden">
      <span className="absolute -right-10 top-16 -rotate-12 text-[14rem] font-extrabold tracking-widest text-ink/5">
        SpringHub
      </span>
    </div>
  );
}
```

**Konstruk**

- **`aria-hidden` + `pointer-events-none`** — elemen dekoratif tidak boleh mengganggu pembaca layar maupun klik pengguna.
- **`-z-10`** — selalu di belakang konten.

**🛡️ Kerentanan**

- Statis; aman.

### components/toast.tsx — notifikasi ringan (85 baris)

**Alur Cerita**

`Toast` adalah sistem notifikasi global: **provider + hook + fungsi pemanggil**. Dipakai di hampir semua interaksi (`toast("Laporan terkirim", "success")`).

1. `ToastProvider` menyimpan daftar toast (maks 3, auto-hilang 5 detik).
2. `useToast()` memberi akses ke daftar + fungsi `toast`.
3. Ikon berbeda per tipe: success (hijau), error (merah), info (biru).

**Potongan Kode Asli — provider & batas** (baris ±1-40):

```tsx
"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; message: string };

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-(TOAST_LIMIT - 1)), { id, type, message }]);
    setTimeout(() => removeToast(id), TOAST_REMOVE_DELAY);
  }, [removeToast]);

  const toast = useCallback((message: string, type: ToastType = "info") => push(type, message), [push]);

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}
```

**Konstruk**

- **`slice(-(TOAST_LIMIT - 1))`** — trik mempertahankan N toast terakhir; yang tertua dibuang otomatis.
- **`id` unik dari waktu + acak** — cukup untuk menghindari tabrakan tombol cepat.

**🛡️ Kerentanan**

1. **Pesan toast bisa memuat teks dari server** — dirender sebagai teks React (escape otomatis), aman dari XSS.
2. **Timeout tidak dibersihkan** — komponen yang di-unmount sebelum timeout masih memanggil `removeToast`; aman (setState no-op) tapi boros.

### components/draft-banner.tsx — pengingat draft tersimpan (121 baris)

**Alur Cerita**

`DraftBanner` memberi tahu pengguna: **"Kamu punya 2 draft belum selesai"** dengan tombol lanjutkan — didukung auto-save draft (`lib/use-auto-save.ts`, IndexedDB, tiap 30 detik).

1. Pada mount, membaca jumlah draft dari IndexedDB.
2. Jika > 0, banner muncul dengan count + tombol "Lanjutkan" → `/report?draft=...`.
3. Tombol tutup menyembunyikan banner (state lokal).

**Potongan Kode Asli — membaca draft** (baris ±15-55):

```tsx
useEffect(() => {
  let mounted = true;
  offlineDB.getDraftCount().then((count) => {
    if (mounted && count > 0) {
      setDraftCount(count);
      setVisible(true);
    }
  });
  return () => {
    mounted = false;
  };
}, []);
```

**Konstruk**

- **Guard `mounted`** — mencegah setState setelah unmount (pola klasik React yang rajin dilakukan di file ini).
- **Banner murni informasi** — tidak memblokir interaksi.

**🛡️ Kerentanan**

- **Draft berisi data sensitif (foto/koordinat)** — tersimpan di IndexedDB; pastikan tidak pernah dikirim ke analitik pihak ketiga.

### components/floating-points-button.tsx — tombol poin mengambang (22 baris)

**Alur Cerita**

`FloatingPointsButton` menampilkan **total poin pengguna** sebagai tombol mengambang di pojok layar; klik membuka `PointsGuideModal`. Hanya muncul saat sesi aktif.

**Potongan Kode Asli — seluruh komponen** (baris ±1-22):

```tsx
"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-cache";
import { PointsGuideModal } from "@/components/sections/points-guide-modal";
import { Sparkles } from "lucide-react";

export function FloatingPointsButton() {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-700"
        aria-label="Panduan Poin"
      >
        <Sparkles className="h-4 w-4" />
        {user.points.toLocaleString("id-ID")}
      </button>
      <PointsGuideModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

**Konstruk**

- **`if (!user) return null`** — komponen "menghilang" untuk pengunjung anonim.
- **`toLocaleString("id-ID")`** — format angka Indonesia (1.234, bukan 1,234).

### components/lite-youtube-embed.tsx — video YouTube ringan (148 baris)

**Alur Cerita**

`LiteYoutubeEmbed` memuat video YouTube **tanpa membebani halaman**: thumbnail statis + tombol play; iframe baru dimuat setelah klik (pola "lite embed" ala web.dev).

1. `VIDEO_MAP` memetakan kunci → `{ videoId, title }` untuk 4 video edukasi.
2. Render `<img>` thumbnail `https://img.youtube.com/vi/{id}/hqdefault.jpg` — tanpa `crossOrigin` (bug thumbnail yang pernah diperbaiki).
3. Klik play → `useState(playing)` → iframe `youtube-nocookie.com` dimuat.

**Potongan Kode Asli — peta video & tombol play** (baris ±1-40):

```tsx
"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const VIDEO_MAP: Record<string, { videoId: string; title: string }> = {
  "konservasi-mata-air": { videoId: "xxxxx", title: "Konservasi Mata Air" },
  "hidrologi-dasar": { videoId: "yyyyy", title: "Hidrologi Dasar" },
  "restorasi-sungai": { videoId: "zzzzz", title: "Restorasi Sungai" },
  "komunitas-springhub": { videoId: "wwwww", title: "Komunitas SpringHub" },
};

export function LiteYoutubeEmbed({ videoKey }: { videoKey: string }) {
  const video = VIDEO_MAP[videoKey];
  const [playing, setPlaying] = useState(false);

  if (!video) return null;

  return playing ? (
    <iframe
      className="aspect-video w-full rounded-xl"
      src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1`}
      title={video.title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  ) : (
    <button onClick={() => setPlaying(true)} className="group relative block w-full" aria-label={`Putar video: ${video.title}`}>
      <img
        src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
        alt={video.title}
        className="aspect-video w-full rounded-xl object-cover"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/90 text-white transition group-hover:scale-110">
          <Play className="ml-1 h-6 w-6" />
        </span>
      </span>
    </button>
  );
}
```

**Konstruk**

- **Switch `playing` state** — iframe hanya dimuat setelah interaksi (hemat ~1 MB transfer per video).
- **`youtube-nocookie.com`** — versi tanpa cookie pelacakan; selaras dengan kebijakan privasi.

**🛡️ Kerentanan**

1. **`videoId` harus dari daftar aman** — jangan menerima input pengguna langsung sebagai `videoId` (bisa memuat video arbitrer); `VIDEO_MAP` menjaga ini.
2. **Jika video dihapus YouTube** — iframe menampilkan error; tampilkan fallback thumbnail + tautan.

### components/pwa-install-guide.tsx — panduan instalasi PWA (108 baris)

**Alur Cerita**

`PwaInstallGuide` membantu pengguna memasang SpringHub sebagai aplikasi: **deteksi platform (Android/iOS) + langkah-langkah + tombol instal** (via `beforeinstallprompt`).

1. `beforeinstallprompt` ditangkap dan disimpan (`deferredPrompt`) — hanya di Android Chrome.
2. UI menampilkan langkah sesuai platform: Android (menu ⋮ → "Tambahkan ke layar utama"), iOS (Bagikan → "Add to Home Screen").
3. Tombol "Instal" memicu `deferredPrompt.prompt()`.

**Potongan Kode Asli — tangkap event instal** (baris ±10-45):

```tsx
useEffect(() => {
  const handler = (e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    setCanInstall(true);
  };
  window.addEventListener("beforeinstallprompt", handler);
  return () => window.removeEventListener("beforeinstallprompt", handler);
}, []);
```

**Konstruk**

- **Event ditangkap sekali & disimpan** — `beforeinstallprompt` hanya muncul satu kali; menyimpannya memungkinkan tombol manual.
- **Deteksi iOS via UA string** — heuristik kasar tapi praktis (`/iphone|ipad|ipod/i`).

**🛡️ Kerentanan**

- **UA string bisa dipalsukan** — hanya memengaruhi tampilan panduan, bukan keamanan.

### components/error-logger-init.tsx — pencatat error global (16 baris)

**Alur Cerita**

`ErrorLoggerInit` adalah komponen senyap: **mendaftarkan listener `window.onerror` dan `unhandledrejection`** untuk mencatat error client ke konsol (dan kelak ke Sentry).

**Potongan Kode Asli — seluruh komponen** (baris ±1-16):

```tsx
"use client";

import { useEffect } from "react";

export function ErrorLoggerInit() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      console.error("[client-error]", e.message, e.filename, e.lineno);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      console.error("[client-rejection]", e.reason);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
```

**Konstruk**

- **`return null`** — komponen tanpa DOM; dipasang sekali di `app/layout.tsx`.
- Cleanup listener — mencegah duplikasi di Strict Mode.

**🛡️ Kerentanan**

- Log error bisa memuat data sensitif (URL/query) — hindari mengirim ke server tanpa sanitasi.

---

## Kelompok Skeleton & UI

### components/skeleton/index.ts — pintu ekspor skeleton (17 baris)

**Alur Cerita**

`index.ts` adalah *barrel file*: memudahkan impor skeleton dari satu tempat (`import { SkeletonHeader } from "@/components/skeleton"`).

**Potongan Kode Asli — ekspor** (baris ±1-17):

```tsx
export * from "./sections";
export * from "../ui/skeleton";
export * from "../ui/button";
export * from "../ui/input";
export * from "../ui/input-textarea";
export * from "../ui/select";
export * from "../ui/card";
```

> **Konstruk**: barrel dengan ekspor ganda (button/input/select/card muncul beberapa kali) — tidak berbahaya tapi bisa dirapikan; ini juga indikasi bahwa `skeleton` digunakan sebagai *UI kit de facto* proyek ini.

### components/skeleton/sections.tsx — skeleton per layout halaman (173 baris)

**Alur Cerita**

`sections.tsx` mendefinisikan **placeholder loading untuk setiap layout penting**: header, hero, dashboard, peta, volunteer, belajar, donasi, profil, admin, dan halaman umum. Mereka dipakai oleh file `loading.tsx` di `app/`.

**Potongan Kode Asli — skeleton header & hero** (baris ±1-40):

```tsx
import { Skeleton, SkeletonText, SkeletonCard, SkeletonStatCard } from "../ui/skeleton";

export function SkeletonHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-line px-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <SkeletonText className="w-28" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </header>
  );
}

export function SkeletonHero() {
  return (
    <div className="py-20 text-center">
      <SkeletonText className="mx-auto w-3/4 text-4xl" />
      <SkeletonText className="mx-auto mt-4 w-1/2" />
      <div className="mt-8 flex justify-center gap-3">
        <Skeleton className="h-11 w-36 rounded-xl" />
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
    </div>
  );
}
```

**Konstruk**

- **Satu komponen skeleton → banyak layout** — 10+ skeleton dibangun dari 4 primitif (`Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonStatCard`).
- **Dimensi meniru konten asli** — `h-11 w-36` tombol, `w-3/4` judul — sehingga layout tidak melompat saat data tiba (CLS rendah).

### components/ui/skeleton.tsx — primitif skeleton (25 baris)

**Alur Cerita**

Empat primitif dasar: **blok, teks, kartu, kartu statistik** — semua memakai `animate-pulse` Tailwind.

**Potongan Kode Asli — primitif** (baris ±1-25):

```tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-ink/10", className)} />;
}

export function SkeletonText({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-ink/10", className, "last:w-3/4")} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl border border-ink-line bg-ink/5", className)} />;
}
```

**Konstruk**

- **`cn()` dari `lib/utils`** — penggabungan kelas Tailwind + dedupe.
- **`last:w-3/4`** — baris teks terakhir otomatis lebih pendek, meniru paragraf asli.
- **Warna `bg-ink/10`** — otomatis menyesuaikan mode gelap karena memakai token warna `ink`.

**🛡️ Kerentanan**

- **Skeleton mengaksesi DOM** — aman; tapi jangan pernah memakai skeleton untuk menyembunyikan data sensitif (skeleton terlihat di HTML source).

---

## Penutup Bab 7

Tiga pola yang mendominasi seluruh 39 komponen:

1. **Peta = komponen anak untuk hook.** React-Leaflet v4 memaksa semua logika instance map berada di anak `MapContainer` (`useMap`, `useMapEvents`). Semua komponen peta mengikuti pola ini, dengan SSR guard + dynamic import di pemanggil.
2. **Offline = data lokal dulu.** `simple-offline-form`, `offline-exit-sync`, dan `queue-worker` membentuk rantai: isi lokal → simpan IndexedDB → kirim dengan `clientCorrelationId` → dedupe di server. Hampir semua bug yang pernah diperbaiki di proyek ini berada di rantai ini.
3. **UI = data-driven + i18n.** Hampir tidak ada teks literal; semuanya lewat `t("kunci")`, dan daftar (menu, manfaat, nominal donasi, aturan poin) dideklarasikan sebagai array lalu di-map.

Pada bab berikutnya kita turun satu lapisan: dari komponen ke **data** — Prisma schema, seed, migrasi, dan worker email.
