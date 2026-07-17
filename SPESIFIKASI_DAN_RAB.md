# SPESIFIKASI & RAB — SpringHub (Jaga Semesta)

> Dokumen ini berisi spesifikasi operasional, arsitektur, RAB, dan fitur-fitur
> yang akan dibangun untuk SpringHub — platform monitoring & restorasi mata air Indonesia.

---

## DAFTAR ISI

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Skenario Operasional](#2-skenario-operasional)
3. [Syarat Keamanan & Performansi](#3-syarat-keamanan--performansi)
4. [Rencana Anggaran Biaya (RAB)](#4-rencana-anggaran-biaya-rab)
5. [Arsitektur Infrastruktur](#5-arsitektur-infrastruktur)
6. [Fitur Thumbnail & Galeri Publikasi](#6-fitur-thumbnail--galeri-publikasi)
7. [Fitur Export & Download Admin](#7-fitur-export--download-admin)
8. [Saran Paling Worth to Buy](#8-saran-paling-worth-to-buy)
9. [Master Todo List](#9-master-todo-list)

---

## 1. Ringkasan Eksekutif

**SpringHub** adalah platform komunitas berbasis web untuk monitoring dan restorasi
mata air di Indonesia. Warga dapat melaporkan kondisi mata air, mengirimkan proposal
proyek restorasi, berdonasi, mengikuti kursus edukasi, dan mendapatkan poin sebagai
bentuk apresiasi kontribusi.

| Item | Detail |
|------|--------|
| Tech Stack | Next.js 14 App Router + TypeScript strict + Prisma ORM + PostgreSQL + Tailwind CSS + Leaflet Maps + Redis + Cloudflare R2 |
| Target User | 5.000 pengguna aktif + guest (tanpa email) |
| Budget | Rp 500.000 – Rp 1.000.000 / bulan |
| Prioritas | Stabilitas maksimal + semua fitur tercover |

---

## 2. Skenario Operasional

### 2.1 Basis Pengguna

| Tipe | Jumlah | Keterangan |
|------|--------|------------|
| User terdaftar | 5.000 aktif | Punya email & password, session JWT, poin terkumpul |
| Guest (tanpa email) | Tidak terbatas | Lapor via cookie `guest_session_id`, tidak bisa login |
| Pengusul proposal / bulan | 30–50 user | User aktif yang ajukan proyek restorasi (min 20.000 poin) |

**Karakteristik Guest User:**
- Tidak memiliki email — tidak bisa login, tidak bisa reset password, tidak bisa
  menerima notifikasi email
- Tetap bisa melaporkan kondisi mata air dan mengisi form-form yang tersedia
- Report mereka ditandai dengan `guestId` di database, bukan `userId`
- Setiap report guest langsung masuk **review queue 100%** — tidak auto-approve
  (trust score guest mulai dari 0, bukan 50 seperti user terdaftar)
- Report guest memiliki **TTL 30 hari** — jika tidak di-claim (register + merge)
  dalam 30 hari, report beserta foto-fotonya akan dihapus
- Guest bisa merge report mereka ke akun permanen dengan fitur `claim-guest`
  saat registrasi

### 2.2 Trafik Harian

| Layanan | Volume | Detail |
|---------|--------|--------|
| Pelaporan | 50–70 user/hari | Masing-masing lampirkan 2–5 foto |
| Upload gambar | 100–350 file/hari | Total 1.500–10.500 file/bulan |
| Transaksi donasi | 100–200 transaksi/hari | Via Xendit payment gateway |
| Course selesai | ~100 user/hari | Dapat poin, butuh kalkulasi akurat |
| Email transaksional | ~150–250 email/hari | Notif poin, status laporan, status proyek |
| Email broadcast | 5.000 email/bulan | Undangan event, dikirim serentak ke semua user aktif |

### 2.3 Alur Data Penting

```
USER / GUEST
  ├── Lapor (isi form + upload 2–5 foto)
  ├── Donasi (via Xendit invoice)
  ├── Belajar course (dapat poin)
  └── Ajukan proyek (≥ 20.000 poin)

ADMIN
  ├── Review laporan (approve / reject + pilih thumbnail)
  ├── Review proposal proyek
  ├── Download data (filter tanggal, CSV & foto)
  └── Kelola konten, form, user
```

---

## 3. Syarat Keamanan & Performansi

### 3.1 Aman dari Sisi Sekuritas

| Lapisan | Proteksi |
|---------|----------|
| Transport | HTTPS via Cloudflare SSL + Let's Encrypt |
| API | CSRF token + Zod validasi + rate limit per user/IP |
| Auth | JWT httpOnly cookie + bcryptjs + session expires 7 hari |
| Database | User & password baru (bukan dev), port tidak publik, UFW firewall |
| File | Upload via presigned URL — server tidak pegang file mentah |
| XSS | CSP ketat di `next.config.mjs` + sanitasi HTML |
| Donasi | HMAC signature webhook + timing-safe comparison |
| Secrets | Tidak disimpan di repo. Pakai env variables di server |
| Guest | Trust score mulai 0, semua report masuk review queue 100% |
| Failed login | Rate limit 10x/menit per IP + user, auto-block sementara |

**Catatan tentang Password, Email, dan Nomor HP:**

| Data | Cara Simpan | Keterangan |
|------|------------|------------|
| Password | **Hash** (bcryptjs) | Tidak bisa direverse |
| Email | **Plaintext** | Admin butuh akses untuk konfirmasi donasi, koordinasi proyek |
| Nomor HP | **Plaintext** | Admin butuh akses untuk verifikasi lapangan |

Email dan nomor HP hanya bisa diakses oleh admin — tidak pernah dikirim ke
frontend publik.

### 3.2 Aman dari Sisi Penyimpanan

| Kategori | Solusi | Alasan |
|----------|--------|--------|
| Database | PostgreSQL di VPS (200GB NVMe) — auto backup tiap 6 jam ke R2 | Recovery kapan saja |
| Gambar | Cloudflare R2 (S3-compatible) — 0 egress fee + CDN | 100–350 file/hari, tidak bisa di VPS doang |
| File proposal | R2 storage (bukan base64 di DB) | PDF 1–2 MB, base64 bikin DB TOAST |
| Backup DB | `pg_dump` → R2 bucket terpisah, retensi 7 hari | Data aman walau VPS mati total |
| Backup file | R2 versioning atau sync ke bucket kedua | Foto tidak hilang |
| Guest TTL | Report guest > 30 hari tanpa claim = auto-hapus | Hemat storage |

### 3.3 Aman dari Lag / Traffic

| Komponen | Strategi |
|----------|----------|
| CDN | Cloudflare — cache static assets (CSS, JS, gambar, font) |
| Nginx | Brotli + Gzip compression, cache static `.next` files |
| Image serving | Foto dari R2 via CDN — nol beban ke server |
| Rate limit | Redis distributed — bukan in-memory Map |
| API throttle | Per user: 5 laporan/jam, 10 laporan/hari, 60 request/menit global |
| Webhook | Idempotent — tidak proses duplikat |

### 3.4 Aman dari Load

| Komponen | Spesifikasi | Alasan |
|----------|-------------|--------|
| VPS | 4 vCPU, 8 GB RAM, 200 GB NVMe | Cukup untuk 5K user + Redis + PostgreSQL |
| Pool DB | 25 koneksi (default 10) | 500 user concurrent ÷ 25 = 20 user per koneksi |
| Queue | Bull + Redis | Email broadcast 5.000, kompresi 350 foto/hari, tidak blocking |
| Cache | Redis TTL: forms 5 menit, content 10 menit, leaderboard 1 menit | Kurangi query DB 70% |
| Index DB | 15+ index performa | Query tidak full table scan |
| Session cleanup | Cron hapus session expired | Session table tidak menggunung |
| Worker | Pisah dari web server | Image processing jalan di worker, bukan di request |

---

## 4. Rencana Anggaran Biaya (RAB)

### 4.1 Infrastruktur Bulanan

| Item | Spesifikasi | Biaya/bulan | Vendor |
|------|-------------|-------------|--------|
| VPS | KVM 4: 4 vCPU, 8 GB RAM, 200 GB NVMe | Rp 350.000 | Hostinger |
| Storage gambar | Cloudflare R2 — bayar per GB (est. 10 GB/bln) | Rp 48.000 | Cloudflare |
| Email SMTP | Business Email 1 mailbox | Rp 20.000 | Hostinger |
| Domain | springhub.id (renewal) | Rp 0 (sudah beli) | Hostinger |
| CDN + DNS | Cloudflare Free | Rp 0 | Cloudflare |
| SSL | Let's Encrypt (auto-renew) | Rp 0 | Certbot |
| Monitoring | Sentry (free) + UptimeRobot (free) | Rp 0 | Sentry / UptimeRobot |
| **Subtotal** | | **Rp 418.000** | |

### 4.2 Biaya Sekali (Setup)

| Item | Biaya | Keterangan |
|------|-------|------------|
| Setup VPS + Docker + Nginx | Rp 0 (dikerjakan internal) | — |
| Konfigurasi R2 + CDN | Rp 0 | — |
| Setup email SMTP | Rp 0 | — |
| **Total Setup** | **Rp 0** | |

### 4.3 Total Estimasi

| Periode | Biaya |
|---------|-------|
| **Per Bulan** | **Rp 350.000 – Rp 418.000** |
| **Per Tahun** | **Rp 4.200.000 – Rp 5.016.000** |

**Catatan:** Masih di bawah budget Rp 500.000 – Rp 1.000.000/bulan. Sisa budget
bisa untuk:
- Cadangan jika traffic membengkak (butuh VPS lebih besar)
- Tool pendukung (VPN untuk admin, async tool, dll)
- Domain tambahan jika diperlukan

---

## 5. Arsitektur Infrastruktur

```
Pengguna / Guest
     │
     ▼
Cloudflare CDN + DNS (gratis)
 ├── Cache gambar & static files
 ├── DDoS protection
 └── SSL termination
     │
     ▼
Nginx (reverse proxy, Brotli, cache)
     │
     ▼
Docker Compose — VPS Hostinger
 ├── Next.js (standalone) — port 3000
 ├── PostgreSQL — data utama (25 pool)
 ├── Redis 7 — cache + rate limit + queue
 └── Bull Worker
       ├── image-processing (kompresi foto)
       ├── email-queue (transaksional + broadcast)
       └── export-queue (download data admin)
     │
     ├── Cloudflare R2 — foto + proposal + export CSV
     └── Hostinger SMTP — email transaksional
```

### Komponen VPS (Hostinger KVM 4)

| Komponen | Teknologi | Port |
|----------|-----------|------|
| Web Server | Next.js (standalone) | 3000 |
| Reverse Proxy | Nginx | 80 → 443 |
| Database | PostgreSQL 16 | 5432 (internal) |
| Cache + Queue | Redis 7 | 6379 (internal) |
| Worker | Bull Queue (Node.js) | — |

---

## 6. Fitur Thumbnail & Galeri Publikasi

### 6.1 Alur Lengkap

```
USER / GUEST → Submit report + upload 2–5 foto
                     │
ADMIN         → Review report
                ├── ❌ Reject → report status = "rejected"
                └── ✅ Approve → report status = "approved"
                         │
                      Admin pilih 1 foto dari 2–5 foto
                      sebagai "Featured / Thumbnail Image"
                         │
                         ▼
Thumbnail tampil di:
  ├── ✅ Card "Aktivitas Terbaru" (Recent Activity Feed)
  │       └── Tampilkan: foto thumbnail + form slug + username/guest + waktu
  │
  ├── ✅ Gallery Publikasi (Media & Progress)
  │       └── Tampilkan: before/after dari waktu ke waktu
  │       └── Admin bisa download gambar asli untuk publikasi
  │
  └── ✅ Map marker preview
          └── Foto thumbnail di popup marker
```

### 6.2 Perubahan Database

Tambahkan field `featuredPhotoId` di model `Report`:

```
Report
├── id
├── userId / guestId
├── formSlug
├── status
├── fieldData
├── preciseLat / preciseLng
├── snappedLat / snappedLng
├── featuredPhotoId  ← BARU: ID foto yang jadi thumbnail
├── createdAt
└── updatedAt
```

Alasan pakai `featuredPhotoId` di Report (bukan `isFeatured` di ReportPhoto):
- Query lebih efisien (1 join, bukan filter `WHERE isFeatured = true`)
- Admin bisa ganti featured photo kapan saja tanpa edit banyak row
- Lebih jelas secara relasi database

### 6.3 Galeri Publikasi — Visual Progression

Tampilkan foto-foto thumbnail dari form/lokasi yang sama dari waktu ke waktu.
Contoh tampilan:

```
LOKASI: Mata Air Sumber Tani

Jan 2026       Mar 2026       Mei 2026
┌──────┐      ┌──────┐      ┌──────┐
│      │      │      │      │      │
│      │  →   │      │  →   │      │
│      │      │      │      │      │
└──────┘      └──────┘      └──────┘
Kondisi awal   Ada perbaikan  Hijau lagi
```

**Manfaat:**
| Untuk | Manfaat |
|-------|---------|
| Publik / Volunteer | Melihat progress nyata di lapangan |
| Admin / Tim | Monitoring visual kondisi mata air tanpa turun lapangan |
| Publikasi / Media | Bahan dokumentasi untuk press release, proposal donatur |
| Donatur | Bukti transparansi: hasil dari donasi mereka |

---

## 7. Fitur Export & Download Admin

### 7.1 Data yang Bisa Di-download

| Data | Filter | Isi CSV |
|------|--------|---------|
| Users | Tanggal daftar, role | Email, username, poin, trust score, region |
| Reports | Tanggal submit, status, form slug | Semua field data, koordinat, featured photo URL |
| Donations | Tanggal, status, project | Jumlah, donor, project, status |
| Projects | Tanggal, status | Proposal, kontak, dana terkumpul |
| PointsLog | Tanggal, user | Jumlah, alasan, report terkait |
| Feedback | Tanggal, status, tipe | Isi kritik/saran, screenshot |

### 7.2 Cara Kerja

1. Admin pilih data + range tanggal di panel admin
2. Request masuk ke Bull queue `export-queue`
3. Worker generate CSV di background
4. File CSV diupload ke R2 (folder `exports/`)
5. Admin dapat notifikasi + link download via email
6. Link expired 24 jam
7. File auto-hapus setelah 7 hari

### 7.3 Download Foto

| Fitur | Spesifikasi |
|-------|-------------|
| Per foto | Tombol download langsung |
| Per report | Download ZIP semua foto dalam 1 report |
| Per periode | Admin pilih bulan/tahun → queue → notifikasi email |
| Featured photo | Khusus download foto thumbnail untuk publikasi |

---

## 8. Saran Paling Worth to Buy

Urutan prioritas investasi dari yang paling worth it untuk budget Rp 500K–1JT/bulan:

| # | Item | Biaya/bln | Alasan |
|---|------|-----------|--------|
| 🥇 | Cloudflare R2 | Rp 48.000 | Dibanding Supabase Storage (gratis tapi 1 GB), R2 bayar per pemakaian, zero egress fee. 10 GB foto + backup = Rp 48K. Kalau AWS S3, egress bisa boncos. |
| 🥇 | Hostinger VPS KVM 4 | Rp 350.000 | VPS lain (DigitalOcean $12 = Rp 195K tapi 1 GB RAM — tidak cukup. Azure/AWS/GCP untuk spek setara $30–50/bln = Rp 480–800K. Hostinger KVM 4 adalah sweet spot. |
| 🥇 | Hostinger Business Email | Rp 20.000 | Alternatif: Zoho Mail gratis (5 GB, fitur terbatas). Rp 20K/bulan untuk SMTP reliable itu murah. |
| 🥉 | Sentry Free | Rp 0 | Pantau error real-time, tau persis baris kode mana yang error. |
| 🥉 | Cloudflare CDN + DNS | Rp 0 | Standar industri — tidak ada pesaing gratis yang setara. |

**Kesimpulan:** Paling worth to buy = **Cloudflare R2** + **Hostinger VPS KVM 4**.
Dua item ini mencakup 95% kebutuhan: compute, storage, CDN, DNS, backup.

---

## 9. Master Todo List

### 🔴 Prioritas 1 — Infrastructure & Deployment

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 1.1 | Setup Hostinger VPS — Ubuntu + Docker + Nginx + UFW + Fail2ban | Infra | 2 jam |
| 1.2 | Setup PostgreSQL di Docker — pool (max 25), timeout, user baru | Infra | 1 jam |
| 1.3 | Setup Redis 7 di Docker — persistence, maxmemory policy | Infra | 30 menit |
| 1.4 | Setup Cloudflare R2 bucket + API keys + CDN cache rules | Infra | 1 jam |
| 1.5 | Setup Hostinger SMTP + verifikasi DNS | Infra | 30 menit |
| 1.6 | Dockerfile + docker-compose.yml untuk Next.js standalone | Infra | 2 jam |
| 1.7 | Nginx config — reverse proxy, SSL, Brotli, static cache | Infra | 1 jam |
| 1.8 | Cloudflare DNS — A record ke VPS, proxied, TTL rendah | Infra | 30 menit |
| 1.9 | Auto backup cron — pg_dump tiap 6 jam + kirim ke R2 | Infra | 1 jam |
| 1.10 | CI/CD — GitHub Actions build → deploy ke VPS | Infra | 2 jam |

### 🔴 Prioritas 2 — Database & Performa

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 2.1 | Tambah 9 index performa ke migration SQL | DB | 1 jam |
| 2.2 | Konfigurasi Prisma pool: max 25, timeout 5s, maxUses 7500 | DB | 30 menit |
| 2.3 | Migrasi data dari Supabase → PostgreSQL VPS | DB | 2 jam |
| 2.4 | Verifikasi foreign key + sequence setelah migrasi | DB | 1 jam |
| 2.5 | Session cleanup cron — hapus expired sessions | DB | 30 menit |

### 🔴 Prioritas 3 — Backend Core Rewrite

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 3.1 | Redis integration — buat `lib/redis.ts` singleton client | Backend | 1 jam |
| 3.2 | Rate limiter — ganti in-memory Map → Redis (`INCR` + `EXPIRE`) | Backend | 3 jam |
| 3.3 | Guest rate limit — ganti filter dari userId ke guestId | Backend | 1 jam |
| 3.4 | Daily limit guest — tambah cek `guestId` untuk limit 5/hari | Backend | 30 menit |
| 3.5 | Guest trust score — mulai dari 0, semua report masuk review queue | Backend | 1 jam |
| 3.6 | Guest TTL cleanup — cron hapus report >30 hari tanpa claim | Backend | 1 jam |
| 3.7 | Points atomic increment — audit semua route, ganti ke `{ increment: N }` | Backend | 2 jam |
| 3.8 | Bull queue setup — buat workers: image, email, export | Backend | 3 jam |
| 3.9 | Image processing worker — kompresi foto di background (sharp) | Backend | 2 jam |
| 3.10 | Email worker — transaksional + broadcast via queue | Backend | 2 jam |
| 3.11 | Email SMTP — implementasi Nodemailer untuk Hostinger | Backend | 1 jam |
| 3.12 | Redis caching — cache forms, content, leaderboard, point rules | Backend | 2 jam |
| 3.13 | Webhook idempotency — externalId unique + `ON CONFLICT DO NOTHING` | Backend | 1 jam |

### 🔴 Prioritas 4 — Security & Secrets

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 4.1 | Generate JWT_SECRET baru + simpan aman | Security | 15 menit |
| 4.2 | Buat user DB baru — ganti dari credentials lama | Security | 15 menit |
| 4.3 | Update CSP di next.config.mjs — ganti `*.supabase.co` → R2 domain | Security | 30 menit |
| 4.4 | Buat `.env.production` — template env untuk production | Security | 15 menit |

### 🟠 Prioritas 5 — Storage Migration (Supabase → R2)

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 5.1 | Rewrite `lib/upload-photo.ts` — ganti Supabase → S3 (R2) | Storage | 3 jam |
| 5.2 | Presigned URL flow — endpoint `POST /api/upload/presign` | Storage | 2 jam |
| 5.3 | Proposal file upload — ganti base64 → R2 storage | Storage | 2 jam |
| 5.4 | Featured photo picker — admin pilih 1 foto sebagai thumbnail | Storage | 2 jam |
| 5.5 | Gallery publikasi — tampilkan thumbnail per form/lokasi | Storage | 3 jam |
| 5.6 | Download foto admin — per foto / per report / per periode | Storage | 2 jam |
| 5.7 | Migrasi foto existing dari Supabase → R2 (rclone) | Storage | 1 jam |

### 🟠 Prioritas 6 — Admin Features

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 6.1 | Export CSV — download users, reports, donations, projects per range tanggal | Admin | 3 jam |
| 6.2 | Notifikasi export siap — email admin saat CSV siap + link expired 24 jam | Admin | 1 jam |
| 6.3 | Proposal review — approve/reject flow, auto email notif | Admin | 2 jam |
| 6.4 | Guest identifier di admin — tampilkan guest ID di list report | Admin | 30 menit |
| 6.5 | Featured photo UI — saat approve report, admin pilih thumbnail | Admin | 2 jam |
| 6.6 | Download foto di admin — tombol per foto + ZIP bulk | Admin | 2 jam |

### 🟡 Prioritas 7 — Proposal & Donation

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 7.1 | Eligibility check real — ganti hardcoded 20.000 pts → DB atomic | Proposal | 1 jam |
| 7.2 | Upload file proposal ke R2 — PDF via presigned URL | Proposal | 2 jam |
| 7.3 | Donasi ke proyek spesifik — update `raisedAmount` atomic via webhook | Donasi | 1 jam |

### 🟡 Prioritas 8 — Monitoring & Quality

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 8.1 | Health endpoint — `GET /api/health` cek DB + Redis + disk | Monitor | 30 menit |
| 8.2 | Sentry integration — error tracking (free tier 5K events/bulan) | Monitor | 1 jam |
| 8.3 | Structured logging — Pino / Winston, format JSON | Monitor | 1 jam |
| 8.4 | k6 load testing — simulasi: login → submit report → upload photo | Testing | 3 jam |

### 🔵 Prioritas 9 — Xendit Integration

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 9.1 | Set XENDIT_SECRET_KEY real (ganti placeholder) | Donasi | 5 menit |
| 9.2 | Set XENDIT_WEBHOOK_TOKEN real | Donasi | 5 menit |
| 9.3 | Test webhook end-to-end dengan Xendit dashboard | Donasi | 1 jam |
| 9.4 | Test invoice creation + callback flow | Donasi | 1 jam |

### 🔵 Prioritas 10 — Polish & Cleanup

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| 10.1 | Hapus `supabase/` directory — RLS policies tidak relevan | Cleanup | 10 menit |
| 10.2 | Hapus `vercel.json` — sudah tidak pakai Vercel | Cleanup | 5 menit |
| 10.3 | Update CSP di `next.config.mjs` — tambah domain R2 | Config | 15 menit |
| 10.4 | Rotate semua secrets pasca migrasi | Security | 30 menit |
| 10.5 | Dokumentasi runbook: cara deploy, cara restore backup | Docs | 2 jam |

### 🧪 Testing

| # | Task | Komponen | Estimasi |
|---|------|----------|----------|
| T.1 | Test infra — Docker test env (PostgreSQL + Redis + MinIO) | Infra | 2 jam |
| T.2 | Dummy data untuk semua skenario | Data | 2 jam |
| T.3 | Unit tests — guest, rate-limit, points, geo, webhook, email, export | Unit | 4,5 jam |
| T.4 | Integration tests — auth, reports, donations, projects, courses, admin | Integrasi | 10 jam |
| T.5 | E2E Playwright — guest report, claim, admin approve, export, gallery | E2E | 6 jam |
| T.6 | k6 Load tests — browse, submit, donate, course, attack simulation | Load | 3 jam |
| T.7 | Worker tests — image, email, export, cleanup | Worker | 3 jam |

### Summary Estimasi Total

| Kategori | Jumlah Task | Perkiraan Total Waktu |
|----------|-------------|----------------------|
| P1 — Infra & Deploy | 10 | ~11 jam |
| P2 — Database & Performa | 5 | ~5 jam |
| P3 — Backend Core | 13 | ~21 jam |
| P4 — Security & Secrets | 4 | ~1 jam |
| P5 — Storage Migration | 7 | ~15 jam |
| P6 — Admin Features | 6 | ~10,5 jam |
| P7 — Proposal & Donasi | 3 | ~4 jam |
| P8 — Monitoring | 4 | ~5,5 jam |
| P9 — Xendit | 4 | ~2 jam |
| P10 — Polish | 5 | ~3 jam |
| Testing | 7 | ~30,5 jam |
| **TOTAL** | **~68 task** | **~108,5 jam** |

---

> **Catatan:** Dokumen ini akan terus diperbarui seiring perkembangan proyek.
> Versi terakhir: 31 Mei 2026.
