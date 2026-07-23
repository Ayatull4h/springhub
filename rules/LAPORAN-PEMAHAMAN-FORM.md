# Laporan Pemahaman — Rules Form SpringHub v2.1

**Tanggal:** 23 Juli 2026
**Sumber:** 7 file .docx di folder `rules/`

---

## Daftar Form

| No | Nama Form | Kode | Status |
|---|---|---|---|
| 1 | Survei Mata Air | spring-survey | ✅ Form baru, menggantikan spring-monitoring |
| 2 | Laporan Restorasi | spring-restoration | ✅ Revisi dari yang lama |
| 3 | Tanam Pohon | tree-planting | ✅ Revisi — 1 form per pohon |
| 4 | Pembuatan Rorak | trench-development | ✅ Revisi — 1 form per rorak |
| 5 | Stok Bibit | seedling-stock | ✅ Revisi, ada 2 arah (stok tersedia / bibit dibutuhkan) |
| 6 | Pengajuan Proyek | project-submission | ✅ Revisi |
| 7 | Kolaborasi Kemitraan | collaboration | **BARU** — untuk CSR, donatur, media |

---

## 1. Form Survei Mata Air (FORM BARU — pengganti spring-monitoring)

**Perubahan signifikan dari form monitoring lama:**

### Bagian A — Identitas Survei
- Tanggal, nama surveyor, nomor WA, geotag — otomatis dari akun
- **Cek duplikat**: Apakah ada titik lain dalam radius 250 m? (Baru / Kunjungan ulang)
- Desa, kecamatan, kabupaten, provinsi — reverse geocoding otomatis
- **Tutupan lahan** — otomatis dari Dynamic World (Google Earth Engine)

### Bagian B — Identitas Mata Air
- Nama lokal mata air
- **3 foto wajib**: titik keluar (dekat), lingkungan sekitar (5-10 langkah), arah aliran keluar
- Jenis/tipe mata air (memancar, genangan, lereng, celah batu)
- Aliran air saat ini dan sepanjang tahun (6 opsi: stabil, berkurang saat kemarau, naik turun, kering total, dll)
- **Perbandingan debit 5 tahun lalu** (bertambah/sama/berkurang)
- Khusus mata air kering: tahun mulai kering, manfaat dulu

### Bagian C — Kondisi dan Pemanfaatan
- **Warna air** (bening, agak keruh, keruh, kekuningan, kehijauan)
- **Pemanfaatan lahan** radius 50m (pemukiman, pertanian, semak, dll)
- **Tutupan lahan** radius 50m (cross-validasi dengan satelit Dynamic World)
- **Pemanfaatan air**: irigasi, air minum, mandi/cuci, wisata, adat, kolam ikan, dll
- **Jumlah KK pengguna** (perkiraan)
- **Ancaman**: pestisida, sumur dalam, mandi di sumber, kandang ternak, septic tank < 11m, sampah, tambang, dll
- **Sumber informasi** (observasi sendiri, warga, perangkat desa, dll)

### Bagian D — Pengukuran (jika bawa alat)
- **Kualitas air**: pH, suhu, TDS, EC/DHL (kosongkan jika alat tak tersedia)
- **Debit air**: metode ember + stopwatch atau estimasi visual (menetes/kecil/sedang/besar)

### Bagian E — Cerita dan Tindak Lanjut
- Cerita, sejarah, mitos (opsional)
- **Kesediaan aksi lanjutan**: pembersihan, penanaman, perlindungan regulasi, lapor desa

---

## 2. Form Laporan Restorasi (revisi)

### Bagian A — Identitas Kegiatan
- Tanggal, koordinator, WA, organisasi, geotag, kode event

### Bagian B — Mata Air yang Direstorasi
- Kode SpringHub atau nama mata air baru
- **Kondisi sebelum restorasi**: mati/kering, debit mengecil, tertimbun sedimen, tercemar, rusak fisik, terbengkalai
- **3 foto**: sebelum (wajib), sesudah (wajib), proses (opsional) — dari sudut yang sama

### Bagian C — Kegiatan Restorasi
- Jenis kegiatan (multi-select)
- Detail per pohon dan per rorak diisi lewat Form Tanam Pohon dan Form Rorak dengan kode event yang sama

---

## 3. Form Tanam Pohon (revisi — 1 FORM PER POHON)

**Perubahan besar:** 1 form = 1 pohon. Kalau tanam 20 pohon = 20 entri.

### Data Pohon
- Nama lokal + nama ilmiah (opsional)
- **Foto pohon** dengan ajir/marker terlihat untuk monitoring
- **Tinggi bibit**: <30cm, 30-100cm, 100-200cm, >200cm
- **Sumber bibit**: pembibitan sendiri, beli, donasi, bantuan dinas
- **Jenis lokasi tanam**: (masih ada field lain yang mungkin terpotong)

---

## 4. Form Pembuatan Rorak (revisi — 1 FORM PER RORAK)

**Perubahan besar:** 1 form = 1 rorak. 5 rorak = 5 entri. Semua ukuran dalam CM.

### Data Rorak
- **Jenis struktur**: rorak/parit resapan, sumur resapan, biopori, lainnya
- **Bentuk penampang**: silinder/bulat (isi diameter + kedalaman) atau kotak/persegi (isi panjang + lebar + kedalaman)
- Rentang: diameter 10-300cm, panjang 30-1000cm, lebar 10-300cm, kedalaman 10-500cm
- **Foto rorak** (wajib)

---

## 5. Form Stok Bibit (revisi — 2 ARAH)

**Perubahan:** Ada dua arah — menawarkan stok ATAU mencari bibit.

### Identitas
- Tanggal, narahubung, WA, organisasi, geotap
- **Entri baru atau pembaruan stok** (kode stok jika pembaruan)

### Status dan Jenis
- **Jenis laporan**: STOK TERSEDIA atau BIBIT DIBUTUHKAN
- **Jenis tanaman**: nama lokal + nama ilmiah (opsional) — 1 jenis per form
- **Jumlah bibit**: angka pasti atau perkiraan

### Detail Stok (jika stok tersedia)
- **Foto bibit**
- (mungkin ada field lain yang terpotong)

---

## 6. Form Pengajuan Proyek (revisi)

### Identitas Pengusul
- Nama, WA, email, organisasi, peran, pernah terlibat Jaga Semesta?

### Tentang Proyek
- **Judul** (max 10 kata)
- **Jenis proyek**: restorasi, penanaman, rorak, ekspedisi, edukasi
- **Lokasi**: geotag, nama tempat, kode mata air terkait
- **Latar belakang dan tujuan**

### Rencana Pelaksanaan
- Timeline (belum sempat terbaca semua)

---

## 7. Form Kolaborasi Kemitraan (FORM BARU)

**Untuk perusahaan, LSM, kampus, media, pemerintah, individu**

### Identitas Pemohon
- Jenis organisasi (perusahaan, komunitas, LSM, media, pemerintah, kampus, individu)
- Data organisasi + kontak lengkap

### Bentuk Kolaborasi
- Pendanaan/sponsorship
- Adopsi mata air
- Employee volunteering
- Donasi bibit/alat/material
- Program edukasi
- Publikasi/media
- Dukungan teknologi/riset
- Cerita ide kolaborasi

---

## Yang Perlu Diubah di Backend

| Form | Perubahan |
|---|---|
| **Survei Mata Air** | Bikin form baru. Field: 3 foto wajib, jenis mata air, debit, warna air, pemanfaatan lahan, ancaman, pengukuran pH/TDS/EC, debit liter/detik |
| **Restorasi** | Tambah kondisi sebelum restorasi, 3 foto (sebelum/sesudah/proses) |
| **Tanam Pohon** | 1 form = 1 pohon. Field: tinggi bibit (kategori), sumber bibit, foto dengan ajir |
| **Rorak** | 1 form = 1 rorak. Field: jenis struktur, bentuk (silinder/kotak), ukuran dalam CM |
| **Stok Bibit** | 2 arah (stok tersedia / bibit dibutuhkan). Field: entri baru / update stok |
| **Proyek** | Field role, pernah terlibat Jaga Semesta, latar belakang + tujuan |
| **Kolaborasi** | Form BARU — 8 jenis kolaborasi, data organisasi lengkap |
