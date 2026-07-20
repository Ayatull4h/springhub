# Laporan Pasar Bibit & Billing

**Tanggal:** 19 Juli 2026
**Proyek:** SpringHub — Jaga Semesta
**Oleh:** Ayatullah Reza Chalid

---

## Bagian 1 — Laporan Fitur Pasar Bibit

### Latar Belakang

SpringHub adalah platform komunitas untuk monitoring dan restorasi mata air di Indonesia. Dalam kegiatan restorasi, bibit tanaman adalah komponen penting. Sebelum ada fitur Pasar Bibit, tidak ada wadah bagi relawan untuk saling berbagi atau meminta bibit. Kelebihan bibit seringkali tidak termanfaatkan.

Pasar Bibit hadir untuk menjembatani antara relawan yang memiliki bibit dengan relawan yang membutuhkan bibit. Semua transaksi tercatat, terverifikasi admin, dan terukur.

---

### Cara Kerja Pasar Bibit

Pasar Bibit adalah fitur di SpringHub yang memungkinkan pengguna saling berbagi dan meminta bibit tanaman. Semua data bibit berasal dari **form laporan** yang diisi oleh pengguna (volunteer). Tidak ada celah untuk memasukkan data secara manual — semuanya harus melalui form yang sudah ditentukan oleh admin.

**Pasar Bibit mendapatkan data dari form.** Jika ID pengguna, lokasi, dan jenis bibit sama, maka akan menambah stok dari bibit yang sudah ada. Jika ada satu saja dari tiga aspek itu yang berbeda, maka akan membuat card baru.

**Untuk verifikasi:** Form diupload oleh user (pengguna) dan di-acc oleh admin, maka card baru akan muncul yang berisikan: jenis tanaman, ketinggian tanaman, lokasi bibit, dan nama user.

**Jika akan minta bibit:** tinggal pilih jenis bibit atau lokasi, kemudian tulis jumlah, dan klik "Minta". Permintaan akan ditinjau oleh admin. Jika di-acc, maka user akan menerima notifikasi yang berisikan nomor WhatsApp dari penyedia bibit.

**Jika bibit sudah diterima:** user penyedia klik "Selesai" dan penerima klik "Selesai". Jika salah satu tidak klik selesai, maka stok bibit tidak akan berkurang.

---

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

---

### Rincian Pekerjaan

| No | Pekerjaan |
|---|---|
| 1 | **Database Seedling** — 3 tabel (Seedling, SeedlingPhoto, SeedlingRequest) + enum status + relasi ke Profile |
| 2 | **Backend API (14 endpoint)** — Marketplace, request, approve/reject admin, confirm-give, confirm-receive, kontak WA, upload foto. Dilengkapi CSRF, validasi, pagination |
| 3 | **Frontend Marketplace** — Halaman `/seedlings` dengan grid 9 card per halaman, filter provinsi, search, pagination, skeleton loading, animasi. Halaman detail dengan foto dan tombol minta. Dark mode support |
| 4 | **Admin Panel Seedling** — Halaman `/admin/seedlings` (daftar laporan + filter status + approve/reject) dan `/admin/seedlings/requests` (daftar permintaan + setujui) |
| 5 | **Sistem Stok Cerdas** — Logika penambahan stok berdasarkan 3 aspek (user ID + jenis + lokasi). Sama → tambah stok. Beda → card baru. Tidak ada duplikasi |
| 6 | **Sistem 2 Langkah** — Flow confirm-give + confirm-receive. Stok hanya berkurang jika kedua belah pihak konfirmasi. Mencegah kecurangan dari kedua sisi |
| 7 | **Keamanan Kontak WA** — Nomor WhatsApp tidak tampil di API publik. WA hanya dikirim via notifikasi internal kepada peminta yang sudah disetujui. Endpoint kontak butuh autentikasi |
| 8 | **Integrasi dengan Form** — Seedlings mengambil data dari form submission (POST /api/reports). Auto-create Seedling saat form disubmit. Auto-activate saat admin approve laporan. Auto-reject saat admin tolak laporan |
| 9 | **Notifikasi Otomatis** — 4 notifikasi di setiap tahap: admin approve request, owner approve, confirm-give, confirm-receive |
| 10 | **Dokumentasi** — API-SPRINGHUB-LENGKAP.md (85 endpoint bahasa sederhana), CARA-KERJA-SEEDLING.md (alur lengkap + diagram), manual test update |

---

## Bagian 2 — Kendala: Xendit & Donasi

### Kenapa Donasi Belum Bisa Dipakai?

Fitur donasi menggunakan **Xendit** sebagai payment gateway. Backend untuk invoice dan webhook sudah selesai 100%. Namun ada 2 hal yang belum terpenuhi:

**1. XENDIT_SECRET_KEY masih kosong**
Ini adalah kunci rahasia yang digunakan untuk mengotentikasi setiap permintaan API dari server SpringHub ke server Xendit. Tanpa key ini, backend tidak bisa membuat invoice pembayaran. Key ini didapatkan dari dashboard akun Xendit setelah client mendaftar dan membuat akun.

**2. XENDIT_WEBHOOK_TOKEN masih kosong**
Webhook token digunakan untuk memverifikasi bahwa notifikasi pembayaran yang masuk ke server SpringHub benar-benar berasal dari Xendit, bukan dari pihak ketiga yang mencoba memalsukan status pembayaran. Token ini juga didapatkan dari dashboard Xendit.

**3. Akun Xendit belum dibuat**
Untuk mendapatkan kedua key di atas, client perlu:
- Mendaftar akun Xendit di https://dashboard.xendit.co
- Melengkapi verifikasi bisnis
- Membuat API key dan webhook token
- Memberikan key tersebut untuk dikonfigurasi di `.env.production`

### Dampak

Tanpa key Xendit:
- Tombol "Continue to Donate" di halaman depan tidak bisa memproses pembayaran
- Invoice tidak bisa dibuat
- Webhook callback tidak bisa diverifikasi
- Donasi tidak bisa masuk

### Status Backend Donasi

| Komponen | Status |
|---|---|
| POST /api/donations/invoice | ✅ Backend siap (tapi butuh XENDIT_SECRET_KEY) |
| POST /api/donations/webhook | ✅ Backend siap (tapi butuh XENDIT_WEBHOOK_TOKEN) |
| Validasi HMAC | ✅ Siap |
| Rate limiting | ✅ Siap |
| Tier management | ✅ Siap |
| Konfigurasi env | ❌ XENDIT_SECRET_KEY kosong |
| Konfigurasi env | ❌ XENDIT_WEBHOOK_TOKEN kosong |

**Kesimpulan:** Backend donasi sudah selesai. Tinggal menunggu client membuat akun Xendit dan memberikan API key.

---

## Bagian 3 — Billing

| Item | Detail |
|---|---|
| **Nama** | Ayatullah Reza Chalid |
| **Peran** | Full-stack Developer SpringHub |
| **Periode** | 20 Juni 2026 — 20 Juli 2026 |
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
