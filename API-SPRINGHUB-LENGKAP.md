# 🌐 API SpringHub — Penjelasan Bahasa Sederhana

**Total: 85 endpoint** — semua pintu masuk yang menghubungkan frontend ke database.

---

## 1. AUTH (7 pintu) — Urusan masuk & daftar

| Pintu | Fungsinya |
|---|---|
| `POST /api/auth/register` | Daftar akun baru |
| `POST /api/auth/login` | Masuk (email + password) |
| `POST /api/auth/logout` | Keluar |
| `GET /api/auth/me` | Lihat data diri sendiri (siapa yang login) |
| `POST /api/auth/forgot-password` | Lupa password → kirim email reset |
| `POST /api/auth/reset-password` | Ganti password pake token dari email |
| `POST /api/auth/claim-guest` | Guest daftar jadi volunteer, report-nya ikut kepindah |

**Siapa yang bisa pake:** Semua orang (public)

---

## 2. CSRF (1 pintu) — Keamanan form

| Pintu | Fungsinya |
|---|---|
| `GET /api/csrf` | Minta token keamanan (wajib sebelum kirim form apa pun) |

**Siapa yang bisa pake:** Semua orang

---

## 3. FORM (2 pintu) — Data form yang bisa diubah admin

| Pintu | Fungsinya |
|---|---|
| `GET /api/forms` | Ambil semua form aktif (5 bawaan + buatan admin) |
| `GET /api/forms/:slug` | Ambil satu form lengkap dengan field-nya |

**Siapa yang bisa pake:** Semua orang. Data dari database, bukan dari kode.

**Catatan:** Form sekarang **dinamis** — admin bisa nambah/hapus/ubah field lewat panel. Data disimpan di tabel `Form` + `FormField`, bukan di kode.

---

## 4. REPORTS (5 pintu) — Laporan dari form

| Pintu | Fungsinya |
|---|---|
| `POST /api/reports` | Kirim laporan baru (isi form) |
| `GET /api/reports` | Lihat laporan yang sudah disetujui (publik) |
| `DELETE /api/reports/:id` | Hapus laporan (pemilik atau admin) |
| `POST /api/reports/:id/photos` | Upload foto ke laporan |
| `GET /api/reports/:id/photos` | Lihat foto-foto laporan |
| `DELETE /api/reports/:id/photos/:photoId` | Hapus satu foto |

**Siapa yang bisa pake:** Public (lihat), login (kirim).

**Pagination:** `?page=1&per_page=20` ✅

**Catatan:** Sekarang untuk form seedling-stock, pas laporan dikirim sistem **otomatis bikin Seedling** (bibit baru). Pas admin approve, seedling ikut aktif.

---

## 5. SEEDLINGS (10 pintu) — Bibit / Pasar Bibit

| Pintu | Fungsinya |
|---|---|
| `GET /api/seedlings` | Lihat daftar bibit di Marketplace |
| `GET /api/seedlings?mine=1` | Lihat bibit milikku sendiri |
| `POST /api/seedlings` | Lapor bibit baru (tapi SEBAIKNYA pake form) |
| `GET /api/seedlings/:id` | Detail satu bibit |
| `POST /api/seedlings/:id/request` | Minta bibit (isi jumlah + pesan) |
| `POST /api/seedlings/:id/approve-request` | Pemilik setujui permintaan |
| `POST /api/seedlings/:id/confirm-give` | Pemilik klik "Selesai" (step 1) |
| `POST /api/seedlings/:id/confirm-receive` | Peminta klik "Terima" (step 2, stok berkurang) |
| `POST /api/seedlings/:id/photos` | Upload foto bibit |
| `GET /api/seedlings/:id/contact` | Lihat nomor HP pemilik (cuma kalo request udah disetujui) |

**Siapa yang bisa pake:** Public (lihat), login (minta), pemilik (konfirmasi).

**Alur minta bibit:**
```
Minta → Admin setujui → Pemilik setujui → Selesai → Terima → Stok berkurang
Notif  → Notif + WA    → Notif           → Notif
```

---

## 6. ADMIN SEEDLINGS (4 pintu) — Admin ngelola bibit

| Pintu | Fungsinya |
|---|---|
| `GET /api/admin/seedlings` | Lihat semua laporan bibit (filter status) |
| `POST /api/admin/seedlings/:id/approve` | Setujui laporan bibit |
| `POST /api/admin/seedlings/:id/reject` | Tolak laporan bibit |
| `POST /api/admin/seedlings/:id/approve-request` | Setujui permintaan bibit |
| `GET /api/admin/seedlings/requests` | Lihat semua permintaan bibit |

---

## 7. SPRINGS (3 pintu) — Mata Air

| Pintu | Fungsinya |
|---|---|
| `GET /api/springs` | Daftar mata air (tergabung per snapped location) |
| `GET /api/springs/:id` | Detail satu mata air |
| `GET /api/springs/bulk` | Ambil semua spring (buat map) |

**Siapa yang bisa pake:** Semua orang.

**Catatan:** Spring terbuat **otomatis** dari laporan monitoring/restoration yang punya lokasi.

---

## 8. PROJECTS (4 pintu) — Proyek Restorasi

| Pintu | Fungsinya |
|---|---|
| `GET /api/projects` | Daftar proyek (yang approved/under_review) |
| `GET /api/projects/:id` | Detail proyek |
| `POST /api/projects` | Buat proyek baru (butuh 20.000 poin) |
| `GET /api/projects/:id/comments` | Lihat komentar proyek |
| `POST /api/projects/:id/comments` | Tambah komentar |
| `GET /api/projects/:id/like` | Cek status like |
| `POST /api/projects/:id/like` | Like/unlike proyek |

**Siapa yang bisa pake:** Public (lihat), login (buat, like, komentar).

**Pagination:** `?page=1&per_page=50` ✅

---

## 9. DONATIONS (2 pintu) — Donasi

| Pintu | Fungsinya |
|---|---|
| `POST /api/donations/invoice` | Buat invoice donasi (via Xendit) |
| `POST /api/donations/webhook` | Xendit kasih tau status pembayaran |

**Catatan:** Xendit masih **placeholder** — nunggu API key dari client.

---

## 10. MAP (4 pintu) — Peta & Marker

| Pintu | Fungsinya |
|---|---|
| `GET /api/map-points` | Ambil semua titik di map |
| `GET /api/map-points/:id` | Detail satu titik |
| `GET /api/map-points/types` | Ambil tipe marker + kategori (warna, ikon) |
| `GET /api/map-types` | Ambil tipe marker aja |

---

## 11. USER (3 pintu) — Profil & Poin

| Pintu | Fungsinya |
|---|---|
| `GET /api/user/profile` | Lihat profil sendiri |
| `PUT /api/user/profile` | Ubah profil (username, region, password) |
| `GET /api/user/points` | Riwayat poin |
| `GET /api/user/notifications` | Riwayat notifikasi |

---

## 12. NOTIFICATIONS (3 pintu) — Notifikasi

| Pintu | Fungsinya |
|---|---|
| `GET /api/notifications` | Notifikasi saya |
| `POST /api/notifications` | Buat notifikasi (sistem) |
| `POST /api/notifications/:id/read` | Tandai sudah dibaca |
| `GET /api/notifications/unread` | Notifikasi yang belum dibaca |

**Pagination:** `?page=1&per_page=50` ✅

---

## 13. OFFLINE (2 pintu) — Survey Offline

| Pintu | Fungsinya |
|---|---|
| `POST /api/offline/session` | Mulai/selesai sesi survey offline |
| `GET /api/offline/session` | Lihat sesi offline saya |
| `DELETE /api/offline/session` | Hapus sesi offline |
| `POST /api/offline/sync` | Sinkronin data offline ke server |

---

## 14. LAINNYA (10 pintu)

| Pintu | Fungsinya |
|---|---|
| `GET /api/health` | Cek server hidup atau mati |
| `GET /api/dashboard` | Data statistik buat landing page |
| `GET /api/leaderboard` | Top 20 volunteer |
| `GET /api/gallery` | Feed aktivitas terbaru |
| `GET /api/courses` | Daftar kursus |
| `GET /api/courses/:slug` | Detail kursus |
| `GET /api/courses/progress` | Progress kursus saya |
| `POST /api/newsletter` | Subscribe email newsletter |
| `POST /api/feedback` | Kirim laporan bug/saran |
| `POST /api/log/error` | Kirim log error dari frontend |
| `GET /api/point-rules` | Aturan poin |
| `GET /api/content` | Konten landing page (dari CMS admin) |
| `GET /api/upload/presign` | Dapetin URL upload foto |
| `GET /api/ytthumb` | Ambil thumbnail YouTube |

---

## 15. ADMIN (33 pintu) — Panel Admin

Semua pintu admin cuma bisa diakses sama **admin**. Berisi CRUD untuk:

| Grup | Pintu |
|---|---|
| **Users** | GET list, PUT edit |
| **Trust Score** | GET list, PUT edit |
| **Reports** | GET list, POST approve/reject/toggle |
| **Donations** | GET list |
| **Projects** | GET list, PATCH edit |
| **Forms** | GET/POST list, GET/PUT/DELETE per form, POST field, PUT/DELETE field |
| **Courses** | GET/POST list, GET/PUT/DELETE per course |
| **Points** | GET/POST list, PUT/DELETE per rule |
| **Content** | GET/POST list, PUT/DELETE per item |
| **Feedback** | GET list, PATCH per item |
| **Errors** | GET/DELETE list, PATCH/DELETE per item |
| **Map Points** | GET/POST list, GET/PUT/DELETE per type |
| **Map Types** | GET/POST list, GET/PUT/DELETE per type |
| **Seedlings** | GET list, POST approve/reject laporan + request |
| **Download** | Download file |
| **Export** | Export CSV data |

---

## API Versioning

Semua API di atas juga bisa diakses lewat `api/v1/` — nginx otomatis rewrite:

```
/api/seedlings  →  /api/v1/seedlings (sama)
/api/reports    →  /api/v1/reports   (sama)
```

Berguna kalau nanti ada versi 2 dengan format data berbeda.

---

**Total: 85 endpoint — 1 database — 1 aplikasi**
