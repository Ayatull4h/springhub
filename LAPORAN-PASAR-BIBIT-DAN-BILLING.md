# 📋 Laporan Pasar Bibit & Billing

**Tanggal:** 19 Juli 2026
**Proyek:** SpringHub — Jaga Semesta
**Oleh:** Ayatull4h

---

## Bagian 1 — Laporan Fitur Pasar Bibit

### Cara Kerja Pasar Bibit

Pasar Bibit adalah fitur di SpringHub yang memungkinkan pengguna saling berbagi dan meminta bibit tanaman. Semua data bibit berasal dari **form laporan** yang diisi oleh pengguna (volunteer). Berikut alur lengkapnya:

### 1. Input Data Bibit

Pasar bibit mendapatkan data dari form. Jika ID pengguna, lokasi, dan jenis bibit sama, maka sistem akan menambah stok dari bibit yang sudah ada. Jika ada satu saja dari tiga aspek itu yang berbeda, maka sistem akan membuat card baru.

**Contoh:**
- User A melapor "Jati, 50 batang, Bandung" → card baru (stok 50)
- User A melapor "Jati, 20 batang, Bandung" lagi → stok jadi 70 (card sama)
- User A melapor "Jati, 30 batang, Bogor" → card baru (lokasi beda)
- User B melapor "Jati, 10 batang, Bandung" → card baru (user beda)

### 2. Verifikasi oleh Admin

Form yang diupload oleh pengguna akan diverifikasi oleh admin. Jika admin menyetujui, maka card baru akan muncul di Marketplace yang berisikan:

- Jenis tanaman (misal: Jati, Bambu, Mahoni)
- Ketinggian tanaman
- Lokasi bibit
- Nama user (pemilik bibit)
- Stok tersedia
- Tombol "Minta"

### 3. Proses Meminta Bibit

Jika pengguna ingin meminta bibit, langkahnya:

1. Pilih jenis bibit atau cari berdasarkan lokasi
2. Tulis jumlah bibit yang diinginkan
3. Klik tombol "Minta"
4. Permintaan akan ditinjau oleh admin

### 4. Konfirmasi dan Notifikasi

Jika admin menyetujui permintaan, maka pengguna akan menerima **notifikasi** yang berisikan nomor WhatsApp dari penyedia bibit. Pengguna bisa langsung menghubungi penyedia untuk mengambil bibit.

### 5. Sistem Dua Langkah (Selesai & Terima)

Agar transaksi berjalan adil, diterapkan sistem dua langkah:

- Jika bibit sudah diterima, **penyedia klik "Selesai"**
- **Penerima juga klik "Selesai"**
- Jika salah satu tidak klik selesai, maka **stok bibit tidak akan berkurang**

Ini memastikan tidak ada pihak yang dirugikan. Stok hanya berkurang jika kedua belah pihak sudah mengkonfirmasi.

### Diagram Alur

```
USER LAPOR BIBIT (via Form)
  ↓
ADMIN VERIFIKASI
  ↓ (jika disetujui)
CARD MUNCUL DI MARKETPLACE
  ↓
USER LAIN PILIH + TULIS JUMLAH + KLIK MINTA
  ↓
ADMIN TINJAU PERMINTAAN
  ↓ (jika disetujui)
NOTIFIKASI + NOMOR WA KE PEMINTA
  ↓
PEMINTA HUBUNGI PENYEDIA → AMBIL BIBIT
  ↓
PENYEDIA KLIK "SELESAI" + PENERIMA KLIK "SELESAI"
  ↓
STOK BERKURANG ✅
```

### Status Permintaan

| Status | Artinya |
|---|---|
| pending | Menunggu review admin |
| admin_approved | Disetujui admin, nunggu pemilik setuju |
| owner_approved | Pemilik setuju, peminta bisa hubungi |
| given | Pemilik sudah kasih bibit (step 1) |
| completed | Peminta sudah terima (step 2), stok berkurang |
| rejected | Ditolak admin atau pemilik |
| cancelled | Dibatalkan peminta |

---

## Bagian 2 — Billing / Tagihan

| Item | Detail |
|---|---|
| **Nama** | Ayatull4h |
| **Peran** | Full-stack Developer SpringHub |
| **Periode** | 15 Mei 2026 — 19 Juli 2026 |
| **Jasa** | Pengembangan fitur Pasar Bibit (seedling) — backend API, database, frontend, admin panel, integrasi form, sistem stok, request flow, notifikasi WA, keamanan kontak |
| **Total** | **Rp 2.500.000** (Dua Juta Lima Ratus Ribu Rupiah) |

### Rincian Pekerjaan

| Fitur | Keterangan |
|---|---|
| Database | 3 tabel (Seedling, SeedlingPhoto, SeedlingRequest) |
| Backend API | 10 endpoint seedling + 4 endpoint admin |
| Frontend | Marketplace 9 card/page, detail, WA link |
| Admin Panel | Halaman manajemen bibit + permintaan |
| Keamanan | WA number tidak tampil di API publik, kontak via notifikasi |
| Dokumen | API-SPRINGHUB-LENGKAP.md, CARA-KERJA-SEEDLING.md |

**Total: Rp 2.500.000**

---

> **Terima kasih atas kerjasamanya.**
> SpringHub — Jaga Semesta
