# Jadwal & Data Collection September — SpringHub

**Fokus:** Boyolali – Semarang (30 mata air baru) + Fix Pasar Bibit Flow + Treatment Data  
**Periode:** 1 – 30 September 2026  
**Aturan baru:** **Data collection hanya Sabtu–Minggu**, **Senin–Jumat untuk web + treatment**  
**Tim:** Koordinator (kamu) + 2 Surveyor + Driver  
**Dokumen ini:** jadwal harian + checklist lapangan + treatment biar foto muncul di springs + admin download per springs

---

## Ringkasan — Kenapa Boyolali–Semarang & Kenapa Pasar Bibit Sekarang

Peta sekarang: **81 titik aktif** di produksi (269 di staging). Klaster Boyolali–Semarang masih bolong — padahal lereng Merapi-Merbabu dan hutan Ungaran adalah resapan utama. Kalau September kita isi **30 titik baru** (hanya **Sabtu–Minggu**), peta akan rapat dan donatur bisa lihat progres “Baru bulan ini”.

**Foto belum muncul di springs?** Bukan hilang. **Epicollect 199 laporan + 551 foto** ada di staging (23×1 + 176×3) tapi 8 mata air baru (`Sumber Telaga` dkk) baru aktif kemarin — foto Epicollect yang kamu lihat di staging belum di-push ke produksi, dan foto lapangan baru masih `pending` (belum treatment). Treatment tiap **Senin** (hari web pertama setelah lapangan) akan bikin foto muncul.

Pasar Bibit: alur **Lapor → Minta → Setujui → Selesai** sudah jalan, tapi 3 titik masih seret: (1) request kadang dummy, (2) stok tidak berkurang kalau salah satu pihak lupa klik Selesai, (3) nomor WA kadang bocor di API publik. September kita sentuh di **hari web (Senin–Jumat)**.

---

## Jadwal 4 Minggu (1–30 September 2026) — Pola Baru

> **Sabtu–Minggu = LAPANGAN (data collection)**  
> **Senin–Jumat = WEB + TREATMENT (biar foto muncul di springs) + Admin Download**

### Minggu 1 — 1–7 Sep
| Hari & Tanggal | Jenis | Kegiatan | Output |
|---|---|---|---|
| **Sen 1 Sep** | WEB | Briefing tim + cek `MANUAL-TEST-FINAL.md` Test 4 & 24 flow (di kantor) | Tim paham form 3 foto min, `clientCorrelationId` anti-dobel |
| **Sel 2 Sep** | WEB | Siapkan HP offline (`/offline` → pilih `spring-monitoring` saja) + cetak 30 checklist + buat halaman admin **Download per Springs** (dropdown 81 prod / 269 staging → ZIP) | 30 lembar siap, halaman download mockup |
| **Rab 3 Sep** | WEB | Kalibrasi alat: pH meter, TDS, termometer, ember 10L + stopwatch + tes upload 3 foto di **staging** (`76.13.198.18:8080`) | Alat akurat ±0.1 pH, `200 {success:true}` |
| **Kam 4 Sep** | WEB | Rapat Pasar Bibit: demo flow **Lapor → Marketplace 9 card → Minta → Approve → WA via notifikasi → Selesai 2 langkah** | List bug Pasar Bibit final |
| **Jum 5 Sep** | WEB | Final check web + backup `backups/` | Siap berangkat |
| **Sab 6 Sep** | **LAPANGAN** | **Boyolali Cepogo–Selo** — 4 titik: Selo, Cepogo, Musuk Atas, Musuk Bawah | Foto sudut 1/2/3, `10_Lokasi` lat/lng <10m |
| **Min 7 Sep** | **LAPANGAN** | **Boyolali Cepogo–Selo** — 4 titik: Dusun 1–3 + Musuk Tengah | `11_Beri_catatan_peng` cerita warga |

### Minggu 2 — 8–14 Sep
| Hari & Tanggal | Jenis | Kegiatan | Output |
|---|---|---|---|
| **Sen 8 Sep** | **WEB + TREATMENT** | **Treatment 8 titik Boyolali** — Sinkronisasi → cek `staging/admin/reports?status=pending` (8 laporan) → verifikasi foto `3/4/5` (bukan `⚠️ 0 foto`) → `Approve` → `Activate spring` → verifikasi `curl /api/springs/:id` `200` + `curl -I /uploads/...` `200` | 8 laporan approved, 8 spring aktif, foto muncul di springs |
| **Sel 9 Sep** | WEB | **Fix Pasar Bibit P1:** Ganti `handleSubmit` dummy → real API `POST /api/seedlings/request` | Request tidak dummy lagi |
| **Rab 10 Sep** | WEB | Perbaiki peta filter “Baru bulan ini” + **Admin Download:** `GET /api/admin/springs/:id/download` → ZIP `ReportPhoto` per springs | Filter + download ZIP jalan |
| **Kam 11 Sep** | WEB | Tulis draf laporan donatur 1 halaman (template Agustus versi awam) | Draf 1 hal |
| **Jum 12 Sep** | WEB | Verifikasi Epicollect: `staging` 199/551 foto sudah lengkap, cek 8 mata air baru Boyolali di peta staging `269→277` | — |
| **Sab 13 Sep** | **LAPANGAN** | **Boyolali Musuk–Sambi** — 4 titik: Musuk Sambi 1–3 + Selo cadangan | Total Boyolali 12 titik |
| **Min 14 Sep** | **LAPANGAN** | **Boyolali Musuk** — 4 titik: Musuk, Sambi, Ampel batas, cadangan | Total Boyolali 16 titik |

### Minggu 3 — 15–21 Sep
| Hari & Tanggal | Jenis | Kegiatan | Output |
|---|---|---|---|
| **Sen 15 Sep** | **WEB + TREATMENT** | **Treatment 8 titik Boyolali** (Sab 13–Min 14) → approve/activate → cek `Foto Epicollect` 551 sudah muncul di staging detail `Sumber Telaga` dll | 8 approved, Epicollect foto cek 200 |
| **Sel 16 Sep** | WEB | **Fix Pasar Bibit P2:** stok 2 langkah (`confirm-give` + `confirm-receive`) test 2 akun | Stok akurat |
| **Rab 17 Sep** | WEB | Perbaiki `GET /api/seedlings` publik **tidak** ada `phone`, WA hanya via notifikasi + uji foto download `200` | `curl` tidak bocor |
| **Kam 18 Sep** | WEB | Verifikasi 10 mata air lama foto `0` (Sumber Maron, Brantas) — siapkan tambah foto | List siap |
| **Jum 19 Sep** | WEB | Admin Download: test download Epicollect per springs → pilih `Sumber Telaga` → `Download ZIP` → 8 foto | ZIP berisi 8 foto |
| **Sab 20 Sep** | **LAPANGAN** | **Semarang Sumowono** — 5 titik: Sumowono, Trayu, Kemitir, Duren, Jubelan | Sumber hutan |
| **Min 21 Sep** | **LAPANGAN** | **Semarang Getasan–Kopeng** — 5 titik: Kopeng, Getasan, Tajuk, Batur, Ngrawan | Jalur resapan |

### Minggu 4 — 22–30 Sep
| Hari & Tanggal | Jenis | Kegiatan | Output |
|---|---|---|---|
| **Sen 22 Sep** | **WEB + TREATMENT** | **Treatment 10 titik Semarang** (Sab 20–Min 21) → approve/activate → cek Epicollect + verifikasi foto `0` Maron/Brantas | 10 approved |
| **Sel 23 Sep** | WEB | Sinkron final 10 titik → cek `staging: 269→299` springs | 30 laporan approved |
| **Rab 24 Sep** | WEB | **Fix Pasar Bibit P3:** Uji full flow **Lapor → Minta → Approve → WA → Selesai 2 langkah → stok -1** | Flow mulus |
| **Kam 25 Sep** | WEB | Tulis laporan 2 halaman + peta before/after Boyolali–Semarang untuk donatur | PDF 2 hal |
| **Jum 26 Sep** | WEB | Bersihkan data test: `24 dummy` (`Monggo`/`Tester`) `DELETE` preview `--dry-run` dulu + test **Admin Download** semua 30 titik baru | Preview siap |
| **Sab 27 Sep** | **LAPANGAN** | **Cadangan** — 4 titik: Selo cadangan, Musuk cadangan, Ungaran cadangan, Sumowono cadangan | Total 30+4 titik |
| **Min 28 Sep** | **LAPANGAN** | **Cadangan** — 2 titik: Ungaran, Sumowono cadangan + foto Epicollect cek ulang | Selesai lapangan |
| **Sen 29 Sep** | **WEB + TREATMENT** | **Treatment final 6 cadangan** → approve/activate → verifikasi `Foto Epicollect` 551 + foto baru 120 | Semua foto muncul |
| **Sel 30 Sep** | WEB | Uji manual **205 test** `MANUAL-TEST-FINAL.md` di staging, kalau PASS push ke produksi | Siap rilis Oktober |

**Total lapangan:** **8 hari** (Sabtu–Minggu ×4 minggu) = **30 titik baru** + 6 cadangan = **36 laporan** (±120 foto, <120MB <50MB limit `next.config.mjs:33`)

**Total web+treatment:** **22 hari** (Senin–Jumat ×4 minggu + Sel 29–Rab 30) = Treatment tiap Senin + Pasar Bibit fix + Admin Download + peta + laporan

---

## Checklist Lapangan (Cetak 30 lembar, 1 lembar = 1 mata air) — dibawa Sabtu–Minggu saja

```
Nama lokal mata air: __________  Desa/Kec: __________  Kab: Boyolali / Semarang
Koordinat (lat/lng): __________  Akurasi GPS: ___ m (wajib <10m)
Foto (wajib 3, maks 5): [ ] sudut 1 dekat sumber  [ ] sudut 2 lebar  [ ] sudut 3 aktivitas  [ ] cadangan
Warna air: [ ] Bening [ ] Agak Keruh [ ] Kekuningan
Aliran: [ ] Stabil [ ] Berkurang Kemarau [ ] Kering
Ancaman terlihat: [ ] Sampah [ ] Sumur dalam [ ] Pestisida [ ] Tidak ada
Pemanfaatan: [ ] Air minum [ ] Irigasi [ ] Mandi [ ] Tidak dimanfaatkan
Jumlah KK pengguna: ______
pH: ___  Suhu: ___°C  TDS: ___ ppm  EC: ___  Debit: ___ L/detik
Cerita warga (1 kalimat): ________________________________________
Surveyor: __________  Jam: ______  Sinyal: [ ] Ada [ ] Offline (nanti sinkron Senin)
```

Bawa Sabtu–Minggu: HP Android 2 (1 offline mode, 1 cadangan), powerbank, pH/TDS meter, termometer, ember 10L, stopwatch, plastik zip, pulpen.

**Aturan foto:** total 3 foto <30MB biar lolos `50mb` limit. Kalau offline, foto ke-`photo-blobs` IndexedDB, nanti `QueueWorker` kirim `30 detik` sekali + retry `20x` (`components/queue-worker.tsx:7`).

**Sinkron:** **Senin pagi** (hari web pertama setelah lapangan Sabtu–Minggu) — ada WiFi → buka `/offline` → **Sinkronkan** → cek `staging/admin/reports?status=pending` harus nambah sesuai jumlah weekend. **Senin ini juga hari Treatment** (lihat bawah).

---

## Treatment Data — Kenapa Foto Belum Muncul di Springs (Dikerjakan Tiap Senin, Hari Web)

**Masalah sekarang yang kamu lihat:** Foto sudah di-upload dari lapangan **dan** foto Epicollect 551 sudah di staging, tapi di `www.springhub.id/#map` (81 titik) dan `staging` 269 titik foto belum semua muncul. **Bukan hilang — tapi belum di-treatment.**

**Kenapa foto Epicollect 551 belum muncul di produksi?** Karena Epicollect ada di **staging** `staging-postgres:5433` (199 report, 551 foto), belum di-push ke produksi `springhub-postgres-1:5432` (0 Epicollect). Kita tahan di staging sesuai “staging dulu, produksi setelah ACC”. Kalau mau muncul di produksi, Senin treatment harus `pg_dump` staging → restore ke prod (butuh `SEED_FORCE` guard).

**Alur sampai foto muncul di springs (3 kunci — berlaku untuk foto lapangan baru DAN foto Epicollect):**
1. **Report harus `approved`** — laporan masuk sebagai `pending` dulu (biar admin cek). Kalau masih pending, foto tidak tampil di peta publik (`app/api/springs/route.ts:15` cuma `status:"active"` + `reports: approved`).
2. **Spring harus `active`** — laporan baru bikin spring `pending` dulu. Admin harus `POST /api/admin/springs/:id/approve` biar jadi `active` baru muncul di `GET /api/springs`.
3. **Foto harus 3–5, lolos saringan** — `lib/upload-photo.ts` cek magic bytes (bukan cuma ekstensi), EXIF dibuang, kompres 720p `sharp` — kalau foto <3 atau `HEIC` tanpa konversi, akan `PHOTOS_PENDING` dan nunggu retry 30 detik (`components/queue-worker.tsx:7`). Foto Epicollect 551 sudah lolos ini di staging, tapi di produksi belum ada.

**Treatment tiap Senin (hari web, 09:00–11:00, setelah sinkron Sabtu–Minggu):**

| Jam | Langkah Treatment | Cara Cek | Output |
|---|---|---|---|
| 09:00 | **Verifikasi foto di staging** — buka `http://76.13.198.18:8080/admin/reports?status=pending` | Harus ada N laporan baru Boyolali/Semarang (+ Epicollect 199), tiap laporan badge `3/4/5 foto` (bukan `⚠️ 0 foto`) | List pending |
| 09:30 | **Cek foto rusak** — klik laporan → lihat thumbnail. Kalau `HEIC`/`ftyp` akan ada pesan “Foto HEIC, konversi dulu”. Kalau foto `placehold.co` (27 placeholder) → hapus, minta surveyor kirim ulang. **Untuk Epicollect:** cek `Sumber Telaga`/`Belik Soka` detail → foto `3` harus `200` | Thumbnail `200` | Foto valid |
| 10:00 | **Approve report** — klik `Approve` (min 3 foto) → `POST /api/admin/reports/:id/approve` → `healthScore` terhitung, `points +100` | `status:"approved"` | Report approved |
| 10:30 | **Aktifkan spring** — `GET /api/admin/springs?status=pending` → cari `Sumber ...` Boyolali/Semarang → `POST /api/admin/springs/:id/approve` → `active` | `GET /api/springs` nambah 1 (staging 269→270, prod 81→82) | Spring aktif |
| 11:00 | **Verifikasi publik + Admin Download** — `curl -s http://127.0.0.1:31760/api/springs/:id | grep photos` → harus `3`, `curl -I /uploads/reports/.../xxx.jpg` → `200`, **Buka `/admin` → tab baru “Download” → pilih spring → `Download ZIP` → harus berisi N foto (Epicollect 3 foto, lapangan 3 foto)** | Foto muncul di springs + ZIP bisa di-download |

**Kalau masih 0 foto di springs detail (contoh `Sumber Maron`/`Sumber Brantas` kemarin + Epicollect yang belum di-push):** cek `report.photos.length` di **staging** — kalau `0` berarti foto gagal ke-upload (batas `50mb` `next.config.mjs:33` atau `magic bytes` tidak lolos) → suruh surveyor kirim ulang via `POST /api/reports/:id/photos` dengan `x-csrf-token` + `x-queue-worker` retry. Kalau di **produksi** `0` tapi di staging `3`, berarti belum di-push — tunggu ACC Senin.

**Khusus September:** 30 titik baru + 10 verifikasi foto `0` + **551 foto Epicollect** — semua treatment dilakukan **Senin** (hari web), jadi **Sabtu–Minggu lapangan tidak perlu tunggu foto muncul** — cukup kumpulkan, **Senin kita treatment bareng** dan foto akan muncul di springs sore harinya. **Download per springs** (ZIP) bisa di-test tiap Senin 11:00.

---

## Fix Pasar Bibit — Dikerjakan di Hari Web (Senin–Jumat)

**Masalah sekarang (dari audit 14 Agu):**
1. `handleSubmit` di `my-requests` & `my-listings` masih pakai data dummy — bukan `GET /api/seedling-requests`.
2. Stok kadang tidak berkurang kalau penerima lupa klik Selesai.
3. `phone` sempat bocor di `GET /api/seedlings` publik.

**Yang sudah kita betulkan 25 Agu:**
- `POST /api/seedlings` & `GET` sudah `publicLimiter`/`apiLimiter` + CSRF, `GET` tidak ada `phone` (hanya `username`).

**Yang dikerjakan di hari web September (Sen–Jum):**
- **Sel 9 Sep & 15 Sep:** Ganti dummy → real API (cek `MANUAL-TEST-FINAL.md` Test 20.6–20.13).
- **15 Sep:** Test stok 2 langkah dengan 2 akun (pemberi + peminta) — stok `quantity`/`stock` hanya -1 setelah `confirm-receive` kedua.
- **16 Sep:** Verifikasi `curl /api/seedlings/:id | grep phone` harus 0 hit.
- **23 Sep & Sel 30 Sep:** Uji full flow **Lapor (form 16 field) → Marketplace 9 card → Minta → Admin approve → WA via notif → Selesai 2 langkah → stok -1** — flow mulus di hari web, tidak bentrok dengan lapangan.

## Halaman Admin Baru — Download Foto per Springs (Dikerjakan Sel 2 Sep, Hari Web)

**Permintaan kamu:** “bikin 1 halaman lagi di panel admin untuk download foto berdasarkan springs”

**Design (tanpa kode dulu, dikerjakan Sel 2 Sep):**
- Lokasi: `/admin` → tab baru **“Download”** di sebelah **Map** (sidebar `components/admin/*`)
- Isi: Dropdown pilih springs (81 prod / 269 staging, `GET /api/admin/springs?status=active` `take:100`), tampilkan `reportCount` + `totalPhotos` per springs (contoh: `Sumber Telaga — 2 laporan, 8 foto`), tombol **“Download ZIP (8 foto)”**
- API: `GET /api/admin/springs/:id/download` → `archiver` ZIP semua `ReportPhoto` springs itu (`reports/xxx.jpg` 720p) + `csv` isi `fieldData` — sudah ada `archiver: 8.0.0` di `package.json:26`
- Flow: Admin pilih `Sumber Telaga` → klik Download → browser download `Sumber_Telaga_2026-09-02.zip` (8 foto + `data.csv`) — bisa dipakai untuk laporan donatur tanpa `pg_dump`.

## Output Akhir September

- **Peta:** staging **269→299** springs (8 hari lapangan × ~4 titik = 30 baru), produksi **81→~110** springs — Boyolali–Semarang rapat, filter “Baru bulan ini” bisa dilihat donatur (dikerjakan Jumat 11 Sep, hari web).
- **Laporan:** 2 halaman PDF peta before/after + cerita warga (pakai template laporan Agustus versi awam, **tanpa Modul Belajar**) — dikerjakan Kam 24 Sep (hari web).
- **Pasar Bibit:** flow **Lapor → Minta → Approve → WA → Selesai 2 langkah** mulus (dikerjakan Sel–Jum, 18 hari web), `205` test manual PASS (Sel 29 Sep, hari web).
- **Data bersih:** 24 dummy dihapus setelah kamu ACC (Jum 25 Sep preview, hari web).
- **Download per springs:** halaman admin Download jadi, foto Epicollect 551 + foto baru 120 bisa di-ZIP per springs tiap Senin.

> **Sabtu–Minggu** cuma kumpulkan data (bawa checklist). **Senin–Jumat** treatment + web + download — foto akan muncul di springs sore Senin setelah treatment. Mau saya bikinin versi **Excel 30 baris** juga biar bisa diisi di HP offline (hari lapangan)?

