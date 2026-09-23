# Manual Test Produksi — Cari Bug & Error
**Domain:** https://www.springhub.id (produksi — JANGAN pakai staging)
**Tanggal mulai:** __________ **Penguji:** __________ **HP/Browser:** __________

> Cara pakai: kerjakan berurutan dari P0. Tiap baris tulis ✅ (lolos) atau ❌ (gagal + catat nomor bug di bawah).
> PENTING sebelum mulai: buka browser **mode incognito/private** (tutup semua tab biasa dulu). Ini memastikan kamu mengetes kode terbaru, bukan cache lama.

## Akun

| Akun | Email | Password |
|---|---|---|
| Admin | `admin@springhub.id` | `demo12345` |
| Volunteer | `volunteer@springhub.id` | `vol12345` |

---

## P0 — Wajib lolos (±15 menit)

| # | Tes | Langkah | Benar kalau... | Hasil |
|---|---|---|---|---|
| 1 | Buka web | Buka https://www.springhub.id di incognito | Landing terbuka < 5 detik, tanpa halaman putih | |
| 2 | Login | Sign In → volunteer@springhub.id / vol12345 | Masuk, nama muncul di kanan atas | |
| 3 | Salah password | Logout → login password salah 1x | Pesan error merah muncul, tetap di halaman login | |
| 4 | Form teks saja | Buka `/report/spring-monitoring`, isi SEMUA wajib kecuali foto, kirim | "Laporan terkirim", tanpa foto tetap lolos | |
| 5 | Foto JPG kecil | Form baru + 1 foto JPG (< 1 MB), kirim | Terkirim, foto tampil di detail laporan | |
| 6 | Foto 3 buah | Form baru + 3 foto sekaligus, kirim | Semua terkirim, counter 3/5 | |
| 7 | Foto kamera HP | Di HP: ambil foto langsung dari kamera, kirim | Terkirim (tidak loading selamanya) | |
| 8 | Cek peta | Buka `/#map`, cari mata airmu | Laporan barusan muncul (max ~1 menit) | |
| 9 | Cek poin | Buka `/profile` | Poin bertambah + riwayat ada | |
| 10 | Logout | Klik logout | Kembali jadi tamu, tombol Sign In muncul | |

**Kalau P0 ada yang ❌, STOP — laporkan dulu, jangan lanjut.**

---

## P1 — Matriks Foto (inti keluhan upload)

Ulangi tiap baris: 1 form baru + 1 foto → kirim → catat.

| # | Format | Ukuran | Mode | Benar kalau... | Hasil |
|---|---|---|---|---|---|
| 11 | JPG | < 1 MB | Online | Terkirim | |
| 12 | JPG | 3–8 MB | Online | Terkirim (dikompres otomatis) | |
| 13 | PNG | sembarang | Online | Terkirim | |
| 14 | WebP | sembarang | Online | Terkirim | |
| 15 | HEIC (iPhone) | sembarang | Online | Terkirim (mungkin agak lama) | |
| 16 | Foto > 10 MB | — | Online | **Ditolak** dengan pesan maksimal 10 MB | |
| 17 | File bukan foto (PDF) | — | Online | **Ditolak** dengan pesan format | |
| 18 | JPG | < 1 MB | **Offline** (matikan data/WiFi, pakai `/offline`) | Masuk antrean, terkirim sendiri saat online lagi | |
| 19 | HEIC | sembarang | **Offline** | Sama seperti #18 | |
| 20 | 5 foto + 1 lagi | — | Online | Foto ke-6 **ditolak** (maks 5) | |

---

## P2 — Fitur lain (±30 menit)

| # | Area | Langkah | Benar kalau... | Hasil |
|---|---|---|---|---|
| 21 | Seedlings | `/seedlings` → buka 1 bibit → ajukan permintaan | Status "pending" tercatat | |
| 22 | Kursus | `/learn` → buka kursus → 1 modul selesai | Progress tersimpan, poin masuk | |
| 23 | Donasi | Klik donasi Rp10.000 | Sampai halaman bayar / pesan "kunci belum dipasang" (keduanya = lolos, catat yang mana) | |
| 24 | Proyek | `/projects` → buka 1 proyek | Detail + donasi proyek tampil | |
| 25 | Notifikasi | Ikon lonceng (login) | Ada isi / kosong dengan wajar | |
| 26 | PWA | Di HP: "Add to Home Screen" → buka dari ikon | Aplikasi terbuka, bisa buka `/offline` tanpa internet | |
| 27 | Offline penuh | Matikan internet → isi 1 form lengkap + foto di `/offline` → nyalakan internet → tunggu 1 menit | Laporan + foto muncul di web | |
| 28 | Mode gelap | Toggle bulan/matahari | Semua halaman tetap terbaca | |
| 29 | Bahasa | Toggle ID/EN | Form ikut ganti bahasa | |

## P3 — Admin (login admin)

| # | Tes | Benar kalau... | Hasil |
|---|---|---|---|
| 30 | `/admin` terbuka + statistik angka wajar | Ya | |
| 31 | Approve 1 laporan pending | Status approved, poin user masuk | |
| 32 | Lihat foto laporan di review | Semua foto tampil (tidak ada ikon rusak) | |
| 33 | Download ZIP 1 mata air | File ZIP ter-download & bisa dibuka | |
| 34 | Buat/edit 1 kursus | Tersimpan & tampil di `/learn` | |

---

## Template Laporan Bug (copy per bug)

```
BUG-__: (judul singkat)
Waktu: __  HP/Browser: __  Online/Offline: __
Langkah: 1... 2... 3...
Yang terjadi: __
Seharusnya: __
Screenshot: (lampirkan)
```

## Catatan bug

| No | Tes # | Keterangan |
|---|---|---|
| BUG-1 | | |
| BUG-2 | | |
| BUG-3 | | |

---
*Skor: ___ / 34 lolos. Produksi dianggap sehat kalau P0 10/10 + P1 ≥ 8/10.*
