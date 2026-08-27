# Jadwal & Data Collection September — SpringHub

**Fokus:** Boyolali – Semarang (30 mata air baru) + Fix Pasar Bibit Flow  
**Periode:** 1 – 30 September 2026  
**Aturan baru:** **Data collection hanya Sabtu–Minggu–Senin**, **Selasa–Jumat untuk web**  
**Tim:** Koordinator (kamu) + 2 Surveyor + Driver  
**Dokumen ini:** jadwal harian + checklist lapangan + perbaikan web Pasar Bibit

---

## Ringkasan — Kenapa Boyolali–Semarang & Kenapa Pasar Bibit Sekarang

Peta sekarang: **81 titik aktif** di produksi (269 di staging). Klaster Boyolali–Semarang masih bolong — padahal lereng Merapi-Merbabu dan hutan Ungaran adalah resapan utama. Kalau September kita isi **30 titik baru** (hanya di **Sabtu–Minggu–Senin**), peta akan rapat dan donatur bisa lihat progres “Baru bulan ini”.

Pasar Bibit: alur **Lapor → Minta → Setujui → Selesai** sudah jalan, tapi 3 titik masih seret: (1) request kadang dummy, (2) stok tidak berkurang kalau salah satu pihak lupa klik Selesai, (3) nomor WA kadang bocor di API publik. September kita sentuh di **hari web (Selasa–Jumat)** biar flow-nya mulus sebelum data Boyolali–Semarang masuk.

---

## Jadwal 4 Minggu (1–30 September 2026) — Pola Baru

> **Sabtu–Minggu–Senin = LAPANGAN (data collection)**  
> **Selasa–Jumat = WEB (ngurus Pasar Bibit + peta + laporan)**

### Minggu 1 — 1–7 Sep
| Hari & Tanggal | Jenis | Kegiatan | Output |
|---|---|---|---|
| **Sel 1 Sep** | WEB | Briefing tim + cek `MANUAL-TEST-FINAL.md` Test 4 & 24 flow (di kantor, bukan lapangan) | Tim paham form 3 foto min, `clientCorrelationId` anti-dobel |
| **Rab 2 Sep** | WEB | Siapkan HP offline (`/offline` → pilih `spring-monitoring` saja) + cetak 30 checklist | 30 lembar siap |
| **Kam 3 Sep** | WEB | Kalibrasi alat: pH meter, TDS, termometer, ember 10L + stopwatch + tes upload 3 foto di **staging** (`76.13.198.18:8080`) | Alat akurat ±0.1 pH, `200 {success:true}` |
| **Jum 4 Sep** | WEB | Rapat Pasar Bibit: demo flow **Lapor (16 field) → Marketplace 9 card → Minta → Approve → WA via notifikasi → Selesai 2 langkah** | List bug Pasar Bibit final |
| **Sab 5 Sep** | **LAPANGAN** | **Boyolali Cepogo–Selo** — 3 titik: Selo, Cepogo, Musuk Atas | Foto sudut 1/2/3, `10_Lokasi` lat/lng <10m |
| **Min 6 Sep** | **LAPANGAN** | **Boyolali Cepogo** — 3 titik: Dusun 1–3 | `11_Beri_catatan_peng` cerita warga |
| **Sen 7 Sep** | **LAPANGAN** | **Boyolali Musuk** — 3 titik: Musuk Tengah, Sambi, Ampel batas | `C6_ancaman` + pH/TDS |

### Minggu 2 — 8–14 Sep
| Hari & Tanggal | Jenis | Kegiatan | Output |
|---|---|---|---|
| **Sel 8 Sep** | WEB | Sinkronisasi 9 titik Boyolali → cek `staging/admin/reports?status=pending` (9 laporan baru) + backup `backups/` | Harus ada 9 pending |
| **Rab 9 Sep** | WEB | **Fix Pasar Bibit P1:** Ganti `handleSubmit` dummy → real API `POST /api/seedlings/request` | Request tidak dummy lagi |
| **Kam 10 Sep** | WEB | Perbaiki peta filter “Baru bulan ini” (tandai laporan Sep) | Filter muncul |
| **Jum 11 Sep** | WEB | Tulis draf laporan donatur 1 halaman (template Agustus versi awam) | Draf 1 hal |
| **Sab 12 Sep** | **LAPANGAN** | **Boyolali Musuk–Sambi** — 3 titik: Musuk Sambi 1–3 + **Selo–Cepogo** 2 titik cadangan | Total Boyolali 14 titik |
| **Min 13 Sep** | **LAPANGAN** | **Boyolali kota** — Cadangan / verifikasi 3 titik foto blur | — |
| **Sen 14 Sep** | **LAPANGAN** | **Semarang Ungaran** — 3 titik: Ungaran Barat, Timur, Sidomukti | Hutan, `C3_tutupan` Pepohonan |

### Minggu 3 — 15–21 Sep
| Hari & Tanggal | Jenis | Kegiatan | Output |
|---|---|---|---|
| **Sel 15 Sep** | WEB | Sinkronisasi 3 titik Ungaran → cek staging + **Fix Pasar Bibit P2:** stok 2 langkah (`confirm-give` + `confirm-receive`) test 2 akun | Stok akurat |
| **Rab 16 Sep** | WEB | Perbaiki `GET /api/seedlings` publik **tidak** ada `phone` (hanya `username`), WA hanya via notifikasi | `curl` tidak bocor |
| **Kam 17 Sep** | WEB | Uji foto download `200` via `GET /uploads/...` + export CSV `PhotoURLs` | Foto bisa di-download |
| **Jum 18 Sep** | WEB | Verifikasi 10 mata air lama foto `0` (Sumber Maron, Brantas) — siapkan tambah foto | List siap |
| **Sab 19 Sep** | **LAPANGAN** | **Semarang Sumowono** — 5 titik: Sumowono, Trayu, Kemitir, Duren, Jubelan | Sumber hutan |
| **Min 20 Sep** | **LAPANGAN** | **Semarang Getasan–Kopeng** — 5 titik: Kopeng, Getasan, Tajuk, Batur, Ngrawan | Jalur resapan |
| **Sen 21 Sep** | **LAPANGAN** | **Semarang Getasan** — 3 titik cadangan + verifikasi Maron/Brantas | Total Semarang 16 titik |

### Minggu 4 — 22–30 Sep
| Hari & Tanggal | Jenis | Kegiatan | Output |
|---|---|---|---|
| **Sel 22 Sep** | WEB | Sinkron final 5 titik Semarang → cek `staging: 269→299` springs | 30 laporan approved |
| **Rab 23 Sep** | WEB | **Fix Pasar Bibit P3:** Uji full flow **Lapor → Minta → Approve → WA → Selesai 2 langkah → stok -1** | Flow mulus |
| **Kam 24 Sep** | WEB | Tulis laporan 2 halaman + peta before/after Boyolali–Semarang untuk donatur | PDF 2 hal |
| **Jum 25 Sep** | WEB | Bersihkan data test: `24 dummy` (`Monggo`/`Tester`) `DELETE` preview `--dry-run` dulu | Preview siap |
| **Sab 26 Sep** | **LAPANGAN** | **Cadangan Boyolali** — 2 titik: Selo cadangan, Musuk cadangan (jika ada yang gagal) | Total 30+2 titik |
| **Min 27 Sep** | **LAPANGAN** | **Cadangan Semarang** — 2 titik: Ungaran cadangan, Sumowono cadangan | — |
| **Sen 28 Sep** | **LAPANGAN** | **Final check** — 30 titik + backup foto ke laptop | Selesai lapangan |
| **Sel 29 Sep** | WEB | Uji manual **205 test** `MANUAL-TEST-FINAL.md` di staging | PASS |
| **Rab 30 Sep** | WEB | Kalau PASS → push ke produksi, kalau FAIL → fix 1 per 1 | Siap rilis Oktober |

**Total lapangan:** **12 hari** (Sabtu–Minggu–Senin ×4 minggu) = **30 titik baru** + 6 cadangan = **36 laporan** (±120 foto, <120MB <50MB limit `next.config.mjs:33`)

**Total web:** **18 hari** (Selasa–Jumat ×4 minggu + Sel 29–Rab 30) = Pasar Bibit fix + peta + laporan

---

## Checklist Lapangan (Cetak 30 lembar, 1 lembar = 1 mata air) — dibawa Sabtu–Senin saja

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
Surveyor: __________  Jam: ______  Sinyal: [ ] Ada [ ] Offline (nanti sinkron Selasa)
```

Bawa Sabtu–Senin: HP Android 2 (1 offline mode, 1 cadangan), powerbank, pH/TDS meter, termometer, ember 10L, stopwatch, plastik zip, pulpen.

**Aturan foto:** total 3 foto <30MB biar lolos `50mb` limit. Kalau offline, foto ke-`photo-blobs` IndexedDB, nanti `QueueWorker` kirim `30 detik` sekali + retry `20x` (`components/queue-worker.tsx:7`).

**Sinkron:** Selasa pagi (hari web pertama setelah lapangan) — ada WiFi → buka `/offline` → **Sinkronkan** → cek `staging/admin/reports?status=pending` harus nambah sesuai jumlah Senin.

---

## Fix Pasar Bibit — Dikerjakan di Hari Web (Selasa–Jumat)

**Masalah sekarang (dari audit 14 Agu):**
1. `handleSubmit` di `my-requests` & `my-listings` masih pakai data dummy — bukan `GET /api/seedling-requests`.
2. Stok kadang tidak berkurang kalau penerima lupa klik Selesai.
3. `phone` sempat bocor di `GET /api/seedlings` publik.

**Yang sudah kita betulkan 25 Agu:**
- `POST /api/seedlings` & `GET` sudah `publicLimiter`/`apiLimiter` + CSRF, `GET` tidak ada `phone` (hanya `username`).

**Yang dikerjakan di hari web September (Sel–Jum):**
- **Sel 9 Sep & 15 Sep:** Ganti dummy → real API (cek `MANUAL-TEST-FINAL.md` Test 20.6–20.13).
- **15 Sep:** Test stok 2 langkah dengan 2 akun (pemberi + peminta) — stok `quantity`/`stock` hanya -1 setelah `confirm-receive` kedua.
- **16 Sep:** Verifikasi `curl /api/seedlings/:id | grep phone` harus 0 hit.
- **23 Sep:** Uji full flow **Lapor (form 16 field) → Marketplace 9 card → Minta → Admin approve → WA via notif → Selesai 2 langkah → stok -1** — flow mulus di hari web, tidak bentrok dengan lapangan.

## Output Akhir September

- **Peta:** staging **269→299** springs, produksi **81→~110** springs — Boyolali–Semarang rapat, filter “Baru bulan ini” bisa dilihat donatur (dikerjakan Jumat 11 Sep).
- **Laporan:** 2 halaman PDF peta before/after + cerita warga (pakai template laporan Agustus versi awam, **tanpa Modul Belajar**) — dikerjakan Kam 24 Sep (hari web).
- **Pasar Bibit:** flow **Lapor → Minta → Approve → WA → Selesai 2 langkah** mulus (dikerjakan Sel–Jum), `205` test manual PASS (Sel 29 Sep).
- **Data bersih:** 24 dummy dihapus setelah kamu ACC (Jum 25 Sep preview, hari web).

> Checklist di atas **hanya dibawa Sabtu–Minggu–Senin**. Selasa–Jumat kamu di basecamp ngurus web — sinkron Selasa pagi, fix Pasar Bibit, tulis laporan. Mau saya bikinin versi **Excel 30 baris** juga biar bisa diisi di HP offline?

