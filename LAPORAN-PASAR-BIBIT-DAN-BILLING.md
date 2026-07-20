# Laporan Pasar Bibit & Billing

**Tanggal:** 19 Juli 2026
**Proyek:** SpringHub — Jaga Semesta
**Oleh:** Ayatull4h

---

## Bagian 1 — Laporan Fitur Pasar Bibit

### Latar Belakang

SpringHub adalah platform komunitas untuk monitoring dan restorasi mata air di Indonesia. Dalam kegiatan restorasi, bibit tanaman adalah komponen penting — baik untuk penghijauan di sekitar mata air, maupun untuk program tanam pohon yang dilakukan oleh relawan. Sebelum ada fitur Pasar Bibit, tidak ada wadah bagi relawan untuk saling berbagi atau meminta bibit. Setiap relawan harus mencari bibit sendiri, dan kelebihan bibit seringkali tidak termanfaatkan.

Pasar Bibit hadir untuk menjembatani antara relawan yang memiliki bibit dengan relawan yang membutuhkan bibit. Semua transaksi tercatat, terverifikasi admin, dan terukur.

---

### Cara Kerja Pasar Bibit

Pasar Bibit adalah fitur di SpringHub yang memungkinkan pengguna saling berbagi dan meminta bibit tanaman. Semua data bibit berasal dari form laporan yang diisi oleh pengguna (volunteer). Tidak ada celah untuk memasukkan data secara manual ke database — semuanya harus melalui form yang sudah ditentukan oleh admin.

---

### 1. Input Data Bibit

Pasar bibit mendapatkan data dari form. Ketika seorang pengguna mengisi form laporan bibit, data yang dikirimkan akan diproses oleh sistem. Sistem akan mengecek tiga hal: ID pengguna, lokasi (provinsi dan kota), dan jenis bibit. 

Jika ID pengguna, lokasi, dan jenis bibit sama, maka sistem akan menambah stok dari bibit yang sudah ada. Ini penting agar tidak terjadi duplikasi card untuk bibit yang sama dari pengguna yang sama di lokasi yang sama. 

Jika ada satu saja dari tiga aspek itu yang berbeda, maka sistem akan membuat card baru. Ini karena bisa saja pengguna yang sama memiliki bibit berbeda di lokasi berbeda, atau pengguna berbeda memiliki bibit yang sama di lokasi yang sama.

**Contoh skenario:**

User A tinggal di Bandung dan memiliki kebun Jati. Suatu hari ia melapor "Jati, 50 batang, Bandung". Sistem membuat card baru dengan stok 50. Seminggu kemudian, ia mendapat kiriman bibit Jati lagi sebanyak 20 batang. Ia melapor lagi "Jati, 20 batang, Bandung". Karena ID pengguna sama, jenis sama, dan lokasi sama, sistem tidak membuat card baru — cukup menambah stok dari 50 menjadi 70.

Sementara itu, User A juga memiliki kebun di Bogor dengan bibit Mahoni. Ia melapor "Mahoni, 30 batang, Bogor". Karena lokasi berbeda, sistem membuat card baru. Begitu juga jika User B melapor "Jati, 10 batang, Bandung" — karena ID pengguna berbeda, sistem membuat card baru meskipun jenis dan lokasinya sama.

| Skenario | User | Jenis | Lokasi | Hasil |
|---|---|---|---|---|
| Pertama kali lapor | A | Jati | Bandung | Card baru (stok 50) |
| Lapor lagi, sama semua | A | Jati | Bandung | Stok 50 + 20 = 70 |
| Lapor, lokasi beda | A | Mahoni | Bogor | Card baru |
| Lapor, user beda | B | Jati | Bandung | Card baru |

---

### 2. Verifikasi oleh Admin

Setiap form laporan bibit yang diupload oleh pengguna tidak langsung muncul di Marketplace. Sebelum muncul, form harus diverifikasi terlebih dahulu oleh admin. Admin akan memeriksa apakah data yang dilaporkan masuk akal — apakah jumlah bibit wajar, apakah lokasi jelas, dan apakah foto yang diupload sesuai.

Jika admin menyetujui, maka card baru akan muncul di Marketplace. Card ini berisikan informasi lengkap yang dibutuhkan oleh pengguna lain untuk memutuskan apakah mereka ingin meminta bibit tersebut:

- **Jenis tanaman** — misalnya Jati, Bambu Petung, Mahoni, Sengon, dan sebagainya
- **Jumlah stok** — berapa batang bibit yang tersedia
- **Lokasi** — provinsi dan kota tempat bibit berada
- **Nama pengguna** — siapa pemilik bibit (dilengkapi rating kepercayaan)
- **Ketinggian tanaman** — informasi tambahan yang bisa diisi di form
- **Catatan** — deskripsi tambahan dari pemilik

Setiap card dilengkapi tombol "Minta" yang bisa diklik oleh pengguna lain yang tertarik.

Jika admin menolak, laporan tidak muncul dan pengguna mendapat notifikasi penolakan beserta alasan dari admin.

---

### 3. Proses Meminta Bibit

Pengguna yang tertarik dengan bibit yang tersedia di Marketplace bisa mengajukan permintaan. Prosesnya sederhana:

1. Buka halaman Pasar Bibit di `/seedlings`
2. Cari bibit yang diinginkan — bisa menggunakan kolom pencarian (search) atau filter berdasarkan provinsi
3. Klik card bibit untuk melihat detail lengkap
4. Klik tombol "Minta"
5. Tulis jumlah bibit yang diinginkan
6. Tambahkan pesan singkat (misalnya: "Mau tanam di kebun belakang")
7. Klik kirim

Setelah itu, permintaan masuk ke antrian review admin. Pengguna bisa melihat status permintaannya di tab "Permintaanku".

---

### 4. Konfirmasi dan Notifikasi

Setelah admin menyetujui permintaan, sistem akan mengirimkan notifikasi kepada peminta. Notifikasi ini berisi nomor WhatsApp dari penyedia bibit. Dengan begitu, peminta bisa langsung menghubungi penyedia untuk koordinasi pengambilan bibit.

Penting untuk diketahui: nomor WhatsApp penyedia tidak pernah ditampilkan di halaman publik. Nomor hanya dikirim melalui notifikasi kepada pengguna yang permintaannya sudah disetujui admin. Ini untuk menjaga privasi penyedia dan mencegah penyalahgunaan data kontak.

Selain notifikasi WA, sistem juga mengirimkan notifikasi di setiap tahap penting:

| Tahap | Notifikasi ke | Isi Notifikasi |
|---|---|---|
| Admin setujui permintaan | Peminta | "Permintaanmu disetujui admin, tunggu pemilik" |
| Pemilik setujui | Peminta | "Pemilik setuju! Hubungi lewat WhatsApp: 62xxx" |
| Pemilik klik Selesai | Peminta | "Bibit siap diambil! Klik Terima untuk menyelesaikan" |
| Peminta klik Terima | Pemilik | "Transaksi selesai! Stok berkurang sekian" |

---

### 5. Sistem Dua Langkah (Selesai & Terima)

Agar transaksi berjalan adil dan tidak merugikan salah satu pihak, diterapkan sistem dua langkah. Ini adalah fitur kunci dari Pasar Bibit.

Ketika penyedia sudah menyerahkan bibit kepada peminta, penyedia klik tombol "Selesai" sebagai tanda bahwa bibit sudah diberikan. Namun, pada tahap ini stok bibit di database belum berkurang. Stok hanya akan berkurang jika peminta juga mengkonfirmasi dengan klik tombol "Terima".

Dengan kata lain:

- **Penyedia klik "Selesai"** — artinya "saya sudah memberikan bibitnya"
- **Peminta klik "Terima"** — artinya "saya sudah menerima bibitnya"
- **Keduanya harus klik** — jika salah satu tidak klik selesai, maka stok bibit tidak akan berkurang

Ini adalah bentuk perlindungan bagi kedua belah pihak. Penyedia tidak bisa mengaku sudah kasih padahal belum, karena peminta harus konfirmasi. Peminta juga tidak bisa mengaku sudah terima padahal belum, karena penyedia harus konfirmasi dulu.

---

### Diagram Alur Lengkap

```
USER LAPOR BIBIT (via Form)
  │
  ▼
ADMIN VERIFIKASI
  │
  ├── ✅ DISETUJUI → Card muncul di Marketplace
  └── ❌ DITOLAK → Notifikasi penolakan ke user


USER LAIN MINTA BIBIT
  │
  ▼
ADMIN TINJAU PERMINTAAN
  │
  ├── ✅ DISETUJUI → Notifikasi + nomor WA ke peminta
  └── ❌ DITOLAK → Notifikasi penolakan ke peminta


PEMINTA HUBUNGI PENYEDIA (via WA)
  │
  ▼
PENYEDIA KONFIRMASI
  │
  ├── ✅ SETUJU → Peminta bisa ambil bibit
  └── ❌ TOLAK → Permintaan dibatalkan


PENGAMBILAN BIBIT
  │
  ▼
SISTEM DUA LANGKAH:
  │
  ├── ❶ Penyedia klik "SELESAI" (bibit sudah dikasih)
  │     └── Stok sementara terkunci, belum berkurang
  │
  └── ❷ Peminta klik "TERIMA" (bibit sudah diterima)
        └── ✅ STOK BERKURANG + Transaksi selesai
```

---

### Status Permintaan dan Artinya

| Status | Artinya | Siapa yang bertindak |
|---|---|---|
| **pending** | Permintaan baru, menunggu review admin | Admin |
| **admin_approved** | Disetujui admin, sekarang menunggu persetujuan pemilik | Pemilik bibit |
| **owner_approved** | Pemilik setuju, peminta bisa menghubungi via WA | Peminta |
| **given** | Pemilik sudah memberikan bibit (step 1) | Pemilik |
| **completed** | Peminta sudah menerima bibit (step 2), stok berkurang | Peminta |
| **rejected** | Ditolak oleh admin atau pemilik | Admin / Pemilik |
| **cancelled** | Dibatalkan oleh peminta | Peminta |

---

### Teknologi yang Digunakan

| Lapisan | Teknologi |
|---|---|
| Database | PostgreSQL + Prisma ORM |
| Backend API | Next.js 14 App Router (Route Handlers) |
| Frontend | Next.js + Tailwind CSS + Lucide Icons |
| Autentikasi | JWT (jose) + httpOnly cookie |
| Keamanan | CSRF token di setiap mutation |
| Notifikasi | Tabel Notification di database |
| Storage | Local filesystem via Nginx |

---

### API Endpoint Pasar Bibit

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/seedlings` | Lihat marketplace (filter + pagination 9/page) |
| GET | `/api/seedlings/:id` | Detail bibit |
| POST | `/api/seedlings/:id/request` | Minta bibit |
| POST | `/api/seedlings/:id/approve-request` | Pemilik setujui permintaan |
| POST | `/api/seedlings/:id/confirm-give` | Pemilik klik Selesai (step 1) |
| POST | `/api/seedlings/:id/confirm-receive` | Peminta klik Terima (step 2) |
| GET | `/api/seedlings/:id/contact` | Lihat kontak WA (butuh auth + approved) |
| POST | `/api/seedlings/:id/photos` | Upload foto bibit |
| GET | `/api/admin/seedlings` | Admin: daftar bibit |
| POST | `/api/admin/seedlings/:id/approve` | Admin: setujui laporan |
| POST | `/api/admin/seedlings/:id/reject` | Admin: tolak laporan |
| POST | `/api/admin/seedlings/:id/approve-request` | Admin: setujui permintaan |
| GET | `/api/admin/seedlings/requests` | Admin: daftar permintaan |

---

## Bagian 2 — Billing / Tagihan

| Item | Detail |
|---|---|
| **Nama** | Ayatull4h |
| **Peran** | Full-stack Developer SpringHub |
| **Periode** | 15 Mei 2026 — 19 Juli 2026 |
| **Total** | **Rp 2.500.000** (Dua Juta Lima Ratus Ribu Rupiah) |

### Rincian Pekerjaan

| No | Fitur | Detail Pekerjaan |
|---|---|---|
| 1 | **Database Seedling** | Perancangan dan implementasi 3 tabel database: Seedling (data bibit, stok, status), SeedlingPhoto (foto bibit), SeedlingRequest (permintaan, status, 2 langkah konfirmasi). Dilengkapi dengan index dan relasi ke tabel Profile. |
| 2 | **Backend API (14 endpoint)** | Pembuatan seluruh REST API untuk sistem bibit: GET daftar marketplace dengan pagination 9 card/halaman, GET detail, POST lapor bibit via form, POST minta, POST approve/reject oleh admin, POST confirm-give (step 1), POST confirm-receive (step 2), GET kontak WA. Dilengkapi CSRF protection, validasi, dan audit trail. |
| 3 | **Frontend Marketplace** | Halaman `/seedlings` dengan grid 9 card per halaman, filter provinsi, pencarian, pagination, skeleton loading, animasi. Halaman detail `/seedlings/:id` dengan informasi lengkap, foto, dan tombol minta. Dark mode support. |
| 4 | **Admin Panel Seedling** | Halaman `/admin/seedlings` — daftar laporan bibit dengan filter status (pending/active/rejected/exhausted), tombol approve/reject. Halaman `/admin/seedlings/requests` — daftar permintaan dengan tombol setujui. Navigasi sidebar. |
| 5 | **Sistem Stok Cerdas** | Logika penambahan stok berdasarkan 3 aspek (user ID + jenis + lokasi). Jika sama → tambah stok. Jika beda → card baru. Tidak ada duplikasi card. |
| 6 | **Sistem 2 Langkah** | Implementasi flow confirm-give + confirm-receive. Stok hanya berkurang jika kedua belah pihak konfirmasi. Mencegah kecurangan dari kedua sisi. |
| 7 | **Keamanan Kontak WA** | Nomor WhatsApp penyedia tidak pernah ditampilkan di API publik. WA hanya dikirim via notifikasi internal kepada peminta yang permintaannya sudah disetujui. Endpoint `/api/seedlings/:id/contact` butuh autentikasi dan status approved. |
| 8 | **Integrasi dengan Form** | Seedlings mengambil data dari form submission (`POST /api/reports`). Otomatis membuat Seedling record saat form seedling-stock disubmit. Otomatis mengaktifkan Seedling saat admin approve laporan. Otomatis menolak Seedling saat admin tolak laporan. |
| 9 | **Notifikasi Otomatis** | 4 notifikasi di setiap tahap: admin approve request, owner approve, confirm-give, confirm-receive. Masing-masing dengan pesan yang informatif. |
| 10 | **Dokumentasi** | `API-SPRINGHUB-LENGKAP.md` (85 endpoint, bahasa sederhana), `CARA-KERJA-SEEDLING.md` (alur lengkap + diagram), `LAPORAN-PASAR-BIBIT-DAN-BILLING.md` (laporan ini). |

### Total Biaya

| Item | Jumlah |
|---|---|
| Pengembangan fitur Pasar Bibit (10 item di atas) | Rp 2.500.000 |
| **Total** | **Rp 2.500.000** |
| **Terbilang** | **Dua Juta Lima Ratus Ribu Rupiah** |

---

> **Terima kasih atas kerjasamanya.**
> SpringHub — Jaga Semesta
