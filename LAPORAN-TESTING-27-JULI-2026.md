# Laporan Testing — 27 Juli 2026

**Penguji:** Hezki
**Domain:** https://www.springhub.id
**Total Test:** ~203 — 28 kategori

---

## Ringkasan

| Status | Jumlah |
|---|---|
| ✅ PASS | ~170 |
| ⚠️ PASS dengan catatan | ~13 |
| ❌ FAIL | ~20 |

---

## ⚠️ PASS — Tapi Ada Catatan

| Test | Catatan |
|---|---|
| **2.7** | Password tanpa huruf besar ditolak, tapi pas sign-in tulisannya "password salah" (redirect/login flow) |
| **4.8** | Ada tulisan "Minimal 3 foto" di bawah field foto — meskipun validasi sudah 1 per field |
| **4.9** | Upload foto >5 — cuma 5 yang muncul di review queue, sisanya hilang |
| **7.5** | Sub filter "Sehat" muncul **dua kali** — satu untuk Semua, satu untuk spring sehat aja |
| **7.7** | Marker spring pakai PNG buram, pin gak jelas daerah mana |
| **7.8** | Klik marker tree-planting → "tidak ditemukan" (karena gak ada halaman detail) |
| **9.2** | Saran: nominal donasi dikasih angka, bukan cuma label |
| **12.6** | Logout — ada unauthorized, username masih muncul di kanan atas |
| **15.7** | Laptop: "gagal sinkron" padahal berhasil |
| **16.4** | Upload foto project — cuma nama file, bukan preview gambar |
| **18.2** | Card bibit kurang banyak untuk test pagination (>9) |
| **27.1** | Bilingual jalan, beberapa terjemahan kurang akurat |

---

## ❌ FAIL — Perlu Diperbaiki

### Auto-fill & Default (4.3, 12.4, 26.2-26.5)
- A2_nama_surveyor tidak terisi dari session
- A3_wa tidak terisi dari profil
- Default C1_warna, C8 tidak jalan
- **Penyebab:** Static fallback di lib/forms.ts vs DB form — field ID mismatch

### Turbo Mode (6.2, 6.3)
- Field tidak tersalin dari entri sebelumnya
- GPS tidak refresh otomatis
- **Penyebab:** prevFieldData state tidak terisi saat offline/turbo

### Map (7.2)
- Tree-planting marker warna hijau (harusnya abu-abu)
- **Penyebab:** healthStatus null → fallback ke "sehat"

### Dark Mode (11.5)
- Logo bibitku & permintaanku di profil tetap light
- **Penyebab:** CSS class dark mode tidak cover section tersebut

### CRUD Admin CSRF (13.1, 13.2)
- Create course: Invalid CSRF token
- Create form field: Invalid CSRF token
- **Penyebab:** CSRF token tidak dikirim/di-fetch pas create

### Offline Mode (15.2-15.5)
- Form offline masih versi lama (8 field, bukan 32)
- **Penyebab:** IndexedDB cache form definition dari sebelum update

### Pengajuan Proyek (16.6)
- Submit gagal — "harus isi foto lokasi" padahal sudah upload
- **Penyebab:** HEIC file tidak terdeteksi, validasi foto gagal

### Pasar Bibit (18.5)
- Card seedling tidak muncul setelah approve
- **Penyebab:** Field ID mismatch (species → B2_nama_lokal) — sudah difix, data lama perlu seed ulang

### Kolaborasi Kemitraan (19.1)
- Form tidak ditemukan (404)
- **Penyebab:** Form kolaborasi tidak ada di DB

### Health Score (20.2-20.4)
- Score berubah setelah refresh (dari tercemar jadi sehat)
- **Penyebab:** Health score dihitung ulang tanpa persistensi — perlu dicek logika approve

---

## Ringkasan per Kategori

| Kategori | PASS | FAIL | Catatan |
|---|---|---|---|
| Test 1 — Buka Website (7) | 7 | 0 | ✅ |
| Test 2 — Login & Daftar (8) | 7 | 0 | ⚠️ 2.7 catatan redirect |
| Test 3 — Halaman Admin (15) | 15 | 0 | ✅ |
| Test 4 — Form Survei 32 field (13) | 11 | 2 | ⚠️ 4.8-4.9 foto |
| Test 5 — Form Tanam Pohon (6) | 5 | 1 | ❌ 5.2 deskripsi |
| Test 6 — Turbo Mode (4) | 2 | 2 | ❌ field + GPS |
| Test 7 — Peta & Marker (8) | 5 | 1 | ⚠️ 3 catatan |
| Test 8 — Poin (6) | 6 | 0 | ✅ |
| Test 9 — Donasi (5) | 4 | 0 | ⚠️ 9.2 saran |
| Test 10 — Keamanan (8) | 8 | 0 | ✅ |
| Test 11 — Dark Mode (5) | 4 | 1 | ❌ logo profil |
| Test 12 — Akun & Profile (6) | 3 | 1 | ⚠️ 12.6 logout |
| Test 13 — CRUD Admin (8) | 5 | 2 | ❌ CSRF create |
| Test 14 — API Endpoints (10) | 10 | 0 | ✅ |
| Test 15 — Offline Mode (10) | 6 | 4 | ❌ form lama |
| Test 16 — Pengajuan Proyek (10) | 7 | 2 | ⚠️ 16.4 preview |
| Test 17 — Spring Detail (6) | 6 | 0 | ✅ |
| Test 18 — Pasar Bibit (6) | 3 | 1 | ❌ card approve |
| Test 19 — Kolaborasi (3) | 0 | 1 | ❌ 404 |
| Test 20 — Health Score (5) | 2 | 3 | ❌ refresh berubah |
| Test 21 — Auto-link (3) | 3 | 0 | ✅ |
| Test 22 — Snap Grid (3) | 3 | 0 | ✅ |
| Test 23 — Map Grouping (3) | 3 | 0 | ✅ |
| Test 24 — Route Map (3) | 3 | 0 | ✅ |
| Test 25 — Backup (3) | 1 | 0 | ⚠️ akses root |
| Test 26 — Auto-fill (5) | 0 | 5 | ❌ semua gagal |
| Test 27 — Bilingual (4) | 4 | 0 | ⚠️ akurasi |
| Test 28 — CSRF (3) | 3 | 0 | ✅ |
| **TOTAL** | **~170** | **~20** | |

---

## Prioritas Fix

| Prioritas | Item |
|---|---|
| 🔴 **High** | Kolaborasi 404, Auto-fill WA/nama, Health score refresh, Pasar bibit approve, Seedling stock approve, CSRF create admin |
| 🟡 **Medium** | Turbo mode field, Offline form lama, Dark mode profil, Foto >5 hilang, HEIC detect |
| 🟢 **Low** | Terjemahan bilingual, Preview foto, Map PNG buram, Duplikat filter |

---
