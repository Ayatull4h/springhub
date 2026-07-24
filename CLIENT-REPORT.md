# LAPORAN PERKEMBANGAN — SpringHub v2.1

**Untuk:** Mbak
**Perihal:** Progress pengembangan SpringHub — Periode 24 Juni – 24 Juli 2026
**Website:** www.springhub.id

---

## Ringkasan Eksekutif

Periode ini fokus pada **refaktor total sistem formulir** dari format lama ke format v2.1 berdasarkan data lapangan yang sudah dikumpulkan. Total **5 form utama dirombak total**, **1 form baru (pengajuan proyek)**, dan **1 form kolaborasi**. Sistem poin disesuaikan, peta interaktif ditingkatkan dengan health scoring, dan 103 data survei mata air asli dari Epicellect berhasil diimpor.

---

## Yang Sudah Dikerjakan

### 1. Form Form & Sistem Pelaporan

**Survei Mata Air** (sebelumnya "Spring Monitoring")
- Dari 8 field → **32 field** (5 bagian: A-E)
- Parameter baru: pH, suhu, TDS, EC/DHL, debit liter/detik, jenis ancaman, cerita/mitos lokal
- Health scoring engine: 8 parameter → skor 0-100 → status sehat/ringan/berat/kritis
- Cek duplikat radius 20m, auto-fill GPS, nomor WA dari profil

**Tanam Pohon**
- Dari 9 field → **16 field**, SATU FORM = SATU POHON
- Tinggi bibit, sumber bibit, jenis lokasi tanam, nomor tag pohon
- **Turbo mode**: setelah submit, otomatis siapkan entri berikutnya + lokasi GPS baru

**Restorasi Mata Air**
- Dari 11 field → **13 field**
- Multiselect jenis kegiatan (9 opsi), jumlah relawan, durasi kegiatan

**Pembuatan Rorak**
- Dari 9 field → **18 field**, SATU FORM = SATU RORAK
- Posisi rorak, isi bahan, dimensi (silinder/kotak)

**Stok Bibit**
- Dari 10 field → **16 field**, 2 arah (Stok Tersedia / Bibit Dibutuhkan)
- Tinggi bibit, bentuk bibit, kesiapan tanam

**Pengajuan Proyek (BARU)**
- Form baru: 27 field, 5 bagian (A-E)
- 3 foto lokasi wajib, komitmen checkbox, target terukur, rincian biaya
- Featured Projects: thumbnail foto dari proyek unggulan

**Kolaborasi Kemitraan**
- Form untuk CSR/perusahaan/komunitas yang ingin bermitra
- Tanpa login, publik bisa akses

### 2. Health Scoring Engine

Setiap laporan survei mata air yang di-approve otomatis menghitung health score:

| Skor | Status | Warna Marker |
|---|---|---|
| ≥80 | Sehat | Hijau 🟢 |
| 60-79 | Tercemar Ringan | Kuning 🟡 |
| 30-59 | Tercemar Berat | Oranye 🟠 |
| <30 | Kritis | Merah 🔴 |

Parameter: warna air (25%), aliran (25%), perubahan debit (20%), ancaman (30%), pH, suhu, TDS, debit (bobot distribusi otomatis jika kosong).

### 3. Peta Interaktif

- **2 layer**: Mata Air (warna health score) + Aktivitas (tanam pohon, rorak, dll)
- 73 spring dibuat dari 103 data Epic — semua ter-link ke report
- Popup: ringkasan per tipe form (tanpa emoji panjang)
- Filter dropdown: subkategori kesehatan (Sehat/Ringan/Berat/Kritis)

### 4. Sistem Poin (Penyesuaian)

| Form | Poin Lama | Poin Baru |
|---|---|---|
| Survei Mata Air | 25 | **100** |
| Restorasi | 100 | **1.000** |
| Rorak | 50 | **500** |
| Tanam Pohon | 100 | **100** |
| Stok Bibit | 15 | **100** |
| Milestone 10 laporan | 50 | **250** |
| Milestone 50 laporan | 250 | **1.000** |
| Milestone 100 laporan | 500 | **5.000** |

### 5. Impor Data Real (103 Entri Epicellect)

Data survei mata air asli dari aplikasi Epicellect berhasil diimpor:
- **103 laporan**, **73 spring unik**
- 6 provinsi: Jawa Timur, Jawa Tengah, DIY, Jawa Barat, Madura, Banten
- 20+ surveyor (Dimas Eko, Triyasinta, Sessa, Jagatamimi, dll)
- 47 mata air stabil, 31 menurun, 9 kering/mati

### 6. API & Admin

- **92 route API** — semuanya berfungsi
- Approve All — tombol approve semua pending + health scoring otomatis
- Pagination admin (25/50/100/200 per halaman)
- Foto thumbnail di tabel admin

---

## Status Infrastruktur

| Komponen | Status |
|---|---|
| Server | Hostinger VPS (4 CPU, 8GB RAM) ✅ |
| Domain | www.springhub.id (Cloudflare) ✅ |
| Database | PostgreSQL + connection pooling ✅ |
| Email | Resend (terkonfigurasi) ✅ |
| Backup | Otomatis jam 3 pagi ✅ |
| Docker | 5 container (web, worker, nginx, postgres, redis) ✅ |
| Donasi | **TERTUNDA** — butuh API key Xendit |

---

## Ringkasan Teknis

| Metrik | Nilai |
|---|---|
| Total file diubah | 30+ file |
| Baris kode ditambahkan | ~2.500 baris |
| Route API | 92 endpoint |
| Form aktif | 7 form (survei, restorasi, rorak, tanam pohon, stok bibit, pengajuan proyek, kolaborasi) |
| Total user | 8+ |
| Total report | 230+ (103 Epic + 106 tree-planting + sisanya) |
| Total foto | 349 file |
| Build status | ✅ Typecheck + build sukses |

---

## Yang Perlu Dari Mbak

| No | Yang Dibutuhkan | Penjelasan |
|---|---|---|
| 1 | **🔑 API Key Xendit** | Satu-satunya yang ngehalang fitur donasi |
| 2 | **Review form baru** | Form pengajuan proyek, survei mata air 32 field — cek kesesuaian dengan kebutuhan lapangan |
| 3 | **Data pengukuran** | pH, suhu, TDS, EC — kalau ada alat ukur, data ini bisa melengkapi 103 entry yang sudah ada |

---

*Dibuat: 24 Juli 2026*
*Oleh: Tim Teknis SpringHub*
