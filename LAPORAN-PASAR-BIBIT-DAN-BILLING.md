# Laporan Bulan Juli — SpringHub

**Periode:** 24 Juni – 30 Juli 2026
**Proyek:** SpringHub — Jaga Semesta

---

## Bagian 1 — Refaktor Formulir & Sistem (24 Juni – 24 Juli)

### Ringkasan

Periode ini fokus pada refaktor total sistem formulir SpringHub dari format lama (8-11 field) ke format v2.1 berdasarkan data lapangan asli dari Epicellect (103 entry survei mata air). Total 5 form dirombak, 1 form baru (pengajuan proyek), sistem poin disesuaikan, peta interaktif ditingkatkan dengan health scoring, dan 103 data survei mata air asli berhasil diimpor.

### Form yang Dirombak

| Form | Field Lama | Field Baru | Perubahan Utama |
|---|---|---|---|
| **Survei Mata Air** | 8 | 32 | pH, suhu, TDS, EC, debit, ancaman, cerita, 3 foto terpisah |
| **Restorasi** | 11 | 13 | Multiselect kegiatan (9 opsi), jumlah relawan, durasi |
| **Rorak** | 9 | 18 | SATU FORM = SATU RORAK, posisi, bahan, dimensi silinder/kotak |
| **Tanam Pohon** | 9 | 16 | SATU FORM = SATU POHON, tinggi, sumber, lokasi tanam, tag |
| **Stok Bibit** | 10 | 16 | 2 arah (stok/bibut), tinggi, bentuk, kesiapan tanam |

### Form Baru

| Form | Jumlah Field | Fungsi |
|---|---|---|
| **Pengajuan Proyek** | 27 | Proposal proyek + 3 foto wajib + komitmen checkbox + target terukur |
| **Kolaborasi Kemitraan** | 10 | Publik, tanpa login, untuk CSR/perusahaan/komunitas |

### Health Scoring Engine

Setiap laporan survei mata air menghasilkan health score 0-100:

| Skor | Status | Warna |
|---|---|---|
| ≥80 | Sehat | Hijau 🟢 |
| 60-79 | Tercemar Ringan | Kuning 🟡 |
| 30-59 | Tercemar Berat | Oranye 🟠 |
| <30 | Kritis | Merah 🔴 |

Parameter: warna air (25%), aliran (25%), perubahan debit (20%), ancaman (30%), pH, suhu, TDS, debit (bobot distribusi otomatis).

### Import Data Epicellect

103 entry data survei mata air asli berhasil diimpor:
- **73 spring unik** dari 103 report
- 6 provinsi: Jawa Timur, Jawa Tengah, DIY, Jawa Barat, Madura, Banten
- 47 stabil, 31 menurun, 9 kering/mati
- 20+ surveyor

### Sistem Poin

| Form | Poin Lama | Poin Baru |
|---|---|---|
| Survei Mata Air | 25 | 100 |
| Restorasi | 100 | 1.000 |
| Rorak | 50 | 500 |
| Tanam Pohon | 100 | 100 |
| Stok Bibit | 15 | 100 |
| Milestone 100 | 500 | 5.000 |

### Bug Fixes Batch (25–30 Juli)

| Issue | Fix |
|---|---|
| **Proposal PDF tidak muncul** di admin review | GET `/api/projects/[id]` fallback ke `fieldData.proposalFile` |
| **Featured photo** tidak punya URL di list API | `buildPhotoUrls()` sebelum mapping featured photo, `take: 5` |
| **Laporan survei** tidak muncul di spring detail | Radius nearby 250m → **2km**, include semua form & status |
| **Filter provinsi** pasar bibit kosong | Field `A_provinsi` type province di form seedling-stock; backfill SQL 4 seedling existing |
| **Request flow** pasar bibit pakai dummy | `handleSubmit` panggil real API; `GET /api/seedling-requests` endpoint baru |
| **My-requests & my-listings** dummy | Ganti fetch real data dari API |
| **Detail seedling** tanpa foto dari form | Include `report.photos` di GET `/api/seedlings/[id]` |
| **Sprite seedling** light di dark mode | Tambah `dark:` variant |
| **Map tile error** (ServiceWorker) | SW bypass tile.openstreetmap.org |
| **Proyek selesai** — tidak ada mekanisme | Tombol "Tandai Selesai" di admin + filter completed |

### Perbaikan UI & Sistem — Pengajuan Proyek (/projects/new)

| Perbaikan | Detail |
|---|---|
| **20 field form** | Nama, WA, Email, Organisasi, Peran, Pengalaman, Judul, Jenis (multiselect), Geotag, Tempat, Latar Belakang, Waktu, Target, Relawan, Mitra, Biaya (5 range), Rincian, Dukungan (multiselect), Dana Ada, Catatan |
| **3 foto wajib** | Upload via `foto_1/2/3` key, camera `capture="environment"`, validasi client + server |
| **Proposal PDF** | Upload opsional, disimpan di `fieldData` JSON blob |
| **Komitmen checkbox** | 3 checkbox: lapor, review, publik — wajib centang |
| **GPS accuracy** | Auto-fill akurasi GPS, tampilkan peringatan jika >15m |
| **Controlled inputs** | Semua field pake `value` + `onChange` (bukan `defaultValue`) |
| **Photo validation** | `photoFilesRef` (ref) hindari stale closure |
| **Turbo mode** | Simpan field dari submit sebelumnya, GPS refresh |
| **Offline fallback** | Jika fetch gagal, simpan ke IndexedDB + QueueWorker |
| **Server validation** | `typeof value === "object"` bukan `instanceof File`, upload ke disk via `uploadPhoto()` |

### Perbaikan Proyek Unggulan (Featured Projects)

| Perbaikan | Detail |
|---|---|
| **Featured photo picker** | Admin review modal pilih foto thumbnail sebelum approve |
| **ProjectDetailModal** | Menampilkan fieldData (20 field), 3 foto, proposal PDF, latar belakang, contact |
| **API featured photo** | GET `/api/projects` — `featuredPhoto` punya `url` (via `buildPhotoUrls`), `take: 5` |
| **FeaturedProjects section** | Tampilkan thumbnail foto di card proyek unggulan |
| **Tandai Selesai** | Tombol ungu di detail modal untuk proyek approved |
| **Filter completed** | Proyek `completed` tidak muncul di landing page |

### Penyempurnaan Form Report Your Contribution

| Perbaikan | Detail |
|---|---|
| **Form aktif dari DB** | Landing page hanya tampilkan form dengan `isActive: true` dari database, tidak fallback ke static |
| **Reports fetch limit** | Limit 50 → 200, API sudah filter `status: approved` |
| **Map marker** | Hanya approved reports, hanya spring dengan healthScore, ukuran 8px seragam |
| **Map grouping** | Spring 5km grid, Activity 250m grid |
| **Sub filter** | Filter Sehat/Ringan/Berat/Kritis untuk spring marker |
| **POINTS_MAP** | Volunteer section ambil poin dari `lib/forms` bukan hardcoded |
| **Health colors** | Marker warna hijau/kuning/oranye/merah sesuai health status |
| **Activity gray** | Marker aktivitas (non-spring) warna abu-abu, tanpa lingkaran 5km |

### Peta Interaktif

- 2 layer: Mata Air (warna health score) + Aktivitas
- Filter subkategori: Sehat/Ringan/Berat/Kritis
- Popup ringkas per tipe form
- 73 spring dengan health score tampil di peta

### API & Admin

- 92 route API berfungsi
- Approve All: approve semua pending + health scoring otomatis
- Pagination admin (25/50/100/200)
- Foto thumbnail di tabel

---

## Bagian 2 — Laporan Pasar Bibit (dari periode sebelumnya)

### Cara Kerja Pasar Bibit

Pasar Bibit adalah fitur di SpringHub yang memungkinkan pengguna saling berbagi dan meminta bibit tanaman. Semua data bibit berasal dari **form laporan** yang diisi oleh pengguna (volunteer). Tidak ada celah untuk memasukkan data secara manual — semuanya harus melalui form yang sudah ditentukan oleh admin.

Pasar Bibit mendapatkan data dari form. Jika ID pengguna, lokasi, dan jenis bibit sama, maka akan menambah stok dari bibit yang sudah ada. Jika ada satu saja dari tiga aspek itu yang berbeda, maka akan membuat card baru.

**Alur:**
1. User lapor bibit via form → Admin verifikasi → Card muncul di marketplace
2. User lain pilih + tulis jumlah + klik Minta → Admin tinjau
3. Jika disetujui → Notifikasi + nomor WA ke peminta
4. Peminta hubungi penyedia → ambil bibit
5. Penyedia klik "Selesai" + Penerima klik "Selesai" → Stok berkurang

### Rincian Pekerjaan Pasar Bibit

| No | Pekerjaan |
|---|---|
| 1 | Database Seedling — 3 tabel + enum status + relasi ke Profile |
| 2 | Backend API (14 endpoint) — Marketplace, request, approve/reject, confirm, kontak WA, foto |
| 3 | Frontend Marketplace — Grid 9 card, filter provinsi, search, pagination, dark mode |
| 4 | Admin Panel — Daftar seedling + requests + approve/reject |
| 5 | Sistem Stok Cerdas — Dedup berdasarkan user ID + jenis + lokasi |
| 6 | Sistem 2 Langkah — Confirm-give + confirm-receive, stok berkurang jika kedua pihak konfirmasi |
| 7 | Keamanan Kontak WA — Nomor WA tidak tampil di API publik, dikirim via notifikasi |
| 8 | Integrasi dengan Form — Auto-create Seedling, auto-activate pas approve, auto-reject pas tolak |
| 9 | Notifikasi Otomatis — 4 notifikasi di setiap tahap |
| 10 | Dokumentasi — API-SPRINGHUB-LENGKAP.md, CARA-KERJA-SEEDLING.md |

---

## Bagian 3 — Kendala: Xendit & Donasi

Fitur donasi menggunakan Xendit sebagai payment gateway. Backend untuk invoice dan webhook sudah selesai 100%. Namun terkendala:

1. **XENDIT_SECRET_KEY** masih kosong — perlu didapatkan dari dashboard akun Xendit
2. **XENDIT_WEBHOOK_TOKEN** masih kosong — perlu dibuat di dashboard Xendit
3. **Akun Xendit** belum dibuat oleh client

| Komponen | Status |
|---|---|
| POST /api/donations/invoice | ✅ Backend siap (butuh XENDIT_SECRET_KEY) |
| POST /api/donations/webhook | ✅ Backend siap (butuh XENDIT_WEBHOOK_TOKEN) |
| Validasi HMAC | ✅ Siap |
| Konfigurasi env | ❌ Kedua key kosong |

---

## Bagian 4 — Billing

| Item | Detail |
|---|---|
| **Nama** | Ayatullah Reza Chalid |
| **Peran** | Full-stack Developer SpringHub |
| **Periode** | 24 Juni 2026 — 30 Juli 2026 |
| **Total** | **Rp2.500.000** (Dua Juta Lima Ratus Ribu Rupiah) |

### Bank Tujuan Pembayaran

| | |
|---|---|
| **Penerima** | Ayatullah Reza Chalid |
| **Bank** | BANK BRI |
| **Nomor Rekening** | 359001035332531 |

---

> **Terima kasih atas kerjasamanya.**
> SpringHub — Jaga Semesta
