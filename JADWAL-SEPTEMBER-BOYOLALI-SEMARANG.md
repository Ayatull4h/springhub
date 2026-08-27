# Jadwal & Data Collection September — SpringHub

**Fokus:** Boyolali – Semarang (30 mata air baru) + Fix Pasar Bibit Flow  
**Periode:** 1 – 30 September 2026  
**Tim:** Koordinator (kamu) + 2 Surveyor + Driver  
**Dokumen ini:** jadwal harian + checklist lapangan + perbaikan web Pasar Bibit

---

## Ringkasan — Kenapa Boyolali–Semarang & Kenapa Pasar Bibit Sekarang

Peta sekarang: **81 titik aktif** di produksi (269 di staging). Klaster Boyolali–Semarang masih bolong — padahal lereng Merapi-Merbabu dan hutan Ungaran adalah resapan utama. Kalau September kita isi **30 titik baru**, peta akan rapat dan donatur bisa lihat progres “Baru bulan ini”.

Pasar Bibit: alur **Lapor → Minta → Setujui → Selesai** sudah jalan, tapi 3 titik masih seret: (1) request kadang dummy, (2) stok tidak berkurang kalau salah satu pihak lupa klik Selesai, (3) nomor WA kadang bocor di API publik. September kita sentuh biar flow-nya mulus sebelum data Boyolali–Semarang masuk.

---

## Jadwal 4 Minggu (1–30 September 2026)

### Minggu 1 — Persiapan (1–7 Sep) — Basecamp Solo
| Hari | Jam | Kegiatan | Output |
|---|---|---|---|
| 1 Sep (Senin) | 09:00 | Briefing tim + cek `MANUAL-TEST-FINAL.md` Test 4 & 24 flow | Tim paham form 3 foto min, `clientCorrelationId` anti-dobel |
| 2 Sep | 10:00 | Cetak checklist 30 titik + siapkan HP offline (`/offline` → pilih `spring-monitoring` saja) | 30 lembar checklist siap |
| 3 Sep | 09:00 | Kalibrasi alat: pH meter, TDS, termometer, ember 10L + stopwatch debit | Alat akurat ±0.1 pH |
| 4 Sep | 13:00 | Tes upload 3 foto di **staging** (`76.13.198.18:8080`) — cek `391` foto staging vs `81` prod | `200 {success:true}` |
| 5 Sep | 09:00 | Rapat Pasar Bibit: demo flow **Lapor (16 field) → Marketplace 9 card → Minta → Approve → WA via notifikasi → Selesai 2 langkah** | List bug Pasar Bibit final |
| 6 Sep | — | Istirahat / backup `backups/` | — |
| 7 Sep | 15:00 | Packing: powerbank 20.000mAh ×2, botol sample, plastik zip, meteran | Berangkat siap |

### Minggu 2 — Boyolali (8–14 Sep) — Basecamp Cepogo
| Hari | Lokasi | Target | Catatan Lapangan |
|---|---|---|---|
| 8 Sep | **Cepogo–Selo** (lereng Merapi) | 4 titik: Selo, Cepogo, Musuk Atas, Musuk Bawah | Foto sudut 1/2/3 sesuai `15_Ambil_foto_sudut_` Epicollect, `10_Lokasi_mata_air_l` lat/lng akurat <10m |
| 9 Sep | **Cepogo** | 4 titik: Dusun 1–4 | `11_Beri_catatan_peng` cerita warga (“dulu debit besar, sekarang kecil”) |
| 10 Sep | **Musuk** | 4 titik: Musuk Tengah, Sambi, Ampel batas | `C6_ancaman` + `C7_jenis_ancaman` (sampah, sumur dalam) |
| 11 Sep | **Musuk–Sambi** | 3 titik | `D1_pH`, `D2_suhu`, `D3_TDS` ukur di lokasi, catat `E1_cerita` |
| 12 Sep | Cadangan / hujan | Verifikasi 3 titik yang foto blur | — |
| 13 Sep | Boyolali kota | Sinkronisasi: ada WiFi → buka `/offline` → **Sinkronkan** → cek `staging/admin/reports?status=pending` | Harus ada 15 laporan baru pending |
| 14 Sep | — | Istirahat, backup foto ke laptop | — |

### Minggu 3 — Semarang (15–21 Sep) — Basecamp Ungaran
| Hari | Lokasi | Target | Catatan |
|---|---|---|---|
| 15 Sep | **Ungaran** (Candi Gedong Songo) | 5 titik: Ungaran Barat, Timur, Sidomukti, Kalongan, Lerep | Hutan, `C3_tutupan` = Pepohonan |
| 16 Sep | **Sumowono** | 5 titik: Sumowono, Trayu, Kemitir, Duren, Jubelan | Sumber hutan, `B5_jenis` = Genangan/Lereng |
| 17 Sep | **Getasan–Kopeng** | 5 titik: Kopeng, Getasan, Tajuk, Batur, Ngrawan | Jalur resapan, `C2_lahan` = Pertanian/Hutan |
| 18 Sep | Cadangan | Verifikasi 10 mata air lama foto `0` (Sumber Maron, Brantas dll) | Tambah foto jika kurang |
| 19 Sep | Semarang kota | Sinkronisasi 15 titik → cek staging 15 pending | — |
| 20–21 Sep | — | Istirahat / tulis cerita 2 halaman untuk donatur | — |

### Minggu 4 — Sinkron & Pasar Bibit Fix (22–30 Sep) — Basecamp Solo + Remote Web
| Hari | Kegiatan | Output |
|---|---|---|
| 22 Sep | Sinkron final 30 titik di Solo (WiFi) → cek `staging: 269→299` springs | 30 laporan approved |
| 23 Sep | **Fix Pasar Bibit P1:** Ganti `handleSubmit` dummy → real API `POST /api/seedlings/request` (sudah ada `7f3d2fb`), cek `GET /api/seedling-requests` | Request tidak dummy lagi |
| 24 Sep | **Fix Pasar Bibit P2:** Pastikan stok berkurang hanya jika **kedua** pihak klik Selesai (`confirm-give` + `confirm-receive`) — test dengan 2 akun | Stok akurat |
| 25 Sep | **Fix Pasar Bibit P3:** Pastikan `GET /api/seedlings` publik **tidak** ada `phone` (hanya `username`), WA hanya via notifikasi `link` | `curl /api/seedlings/:id` tidak bocor |
| 26 Sep | Uji full flow Pasar Bibit: **Lapor (form 16 field) → Marketplace 9 card → Minta → Admin approve → WA via notif → Selesai 2 langkah → stok -1** | Flow mulus |
| 27 Sep | Tulis laporan 2 halaman + peta before/after (Boyolali–Semarang) untuk donatur — pakai template `LAPORAN-BULAN-AGUSTUS-DAN-BILLING.md` versi awam | PDF 2 hal |
| 28 Sep | Bersihkan data test: `24 dummy` (`Monggo`/`Tester`) `DELETE` preview `--dry-run` dulu, baru `--apply` setelah kamu ACC | Peta bersih |
| 29–30 Sep | Uji manual **205 test** `MANUAL-TEST-FINAL.md` di staging, kalau PASS push ke produksi | Siap rilis Oktober |

**Total lapangan:** 30 titik baru + 10 verifikasi = **40 laporan** (±120 foto, total <120MB <50MB limit `next.config.mjs:33`).

---

## Checklist Lapangan (Cetak 30 lembar, 1 lembar = 1 mata air)

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
Surveyor: __________  Jam: ______  Sinyal: [ ] Ada [ ] Offline (nanti sinkron)
```

Bawa: HP Android 2 (1 offline mode, 1 cadangan), powerbank, pH/TDS meter, termometer, ember 10L, stopwatch, plastik zip, pulpen.

**Aturan foto:** total 3 foto <30MB biar lolos `50mb` limit. Kalau offline, foto tetap ke-`photo-blobs` IndexedDB, nanti `QueueWorker` kirim `30 detik` sekali + retry `20x` (`components/queue-worker.tsx:7`).

---

## Fix Pasar Bibit — Detail Teknis Ringkas (untuk tim web, tanpa kode)

**Masalah sekarang (dari audit 14 Agu):**
1. `handleSubmit` di `my-requests` & `my-listings` masih pakai data dummy — bukan `GET /api/seedling-requests`.
2. Stok kadang tidak berkurang kalau penerima lupa klik Selesai.
3. `phone` sempat bocor di `GET /api/seedlings` publik.

**Yang sudah kita betulkan 25 Agu:**
- `POST /api/seedlings` & `GET` sudah `publicLimiter`/`apiLimiter` + CSRF, `GET` tidak ada `phone` (hanya `username`).

**Yang dikerjakan 23–25 Sep:**
- Ganti dummy → real API (cek `MANUAL-TEST-FINAL.md` Test 20.6–20.13).
- Test stok 2 langkah dengan 2 akun (pemberi + peminta) — stok `quantity`/`stock` hanya -1 setelah `confirm-receive` kedua.
- Verifikasi `curl /api/seedlings/:id | grep phone` harus 0 hit.

---

## Output Akhir September

- Peta: staging **269→299** springs, produksi **81→~110** springs — Boyolali–Semarang rapat, filter “Baru bulan ini” bisa dilihat donatur.
- Laporan: 2 halaman PDF peta before/after + cerita warga (pakai template laporan Agustus versi awam, **tanpa Modul Belajar**).
- Pasar Bibit: flow **Lapor → Minta → Approve → WA → Selesai 2 langkah** mulus, `205` test manual PASS.
- Data bersih: 24 dummy dihapus setelah kamu ACC.

> Siap cetak checklist di atas dan bawa ke Cepogo 8 Sep. Mau saya bikinin versi **Excel 30 baris** juga biar bisa diisi di HP?

