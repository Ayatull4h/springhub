# Manual Test — SpringHub v1.0
**Tanggal**: 30 Juni 2026
**Domain**: https://www.springhub.id
**IP VPS**: 76.13.198.18

---

## ✅ Test 1 — Akses Web

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 1.1 | HTTPS www | Buka `https://www.springhub.id` | ✅ |
| 1.2 | HTTPS apex | Buka `https://springhub.id` → redirect ke www | ✅ |
| 1.3 | HTTP redirect | Buka `http://www.springhub.id` → redirect HTTPS | ✅ |
| 1.4 | Akses IP | Buka `http://76.13.198.18` | ✅ |
| 1.5 | SSL valid | Browser gak kasih peringatan "Not Secure" | ✅ |

## ✅ Test 2 — Halaman Publik

| # | Halaman | Status |
|---|---|---|
| 2.1 | `/` Landing Page | ✅ 200 |
| 2.2 | `/springs` Map mata air | ✅ 200 |
| 2.3 | `/projects` Daftar proyek | ✅ 200 |
| 2.4 | `/learn` Kursus edukasi | ✅ 200 |
| 2.5 | `/about` Tentang | ✅ 200 |
| 2.6 | `/help` Bantuan | ✅ 200 |
| 2.7 | `/faq` FAQ | ✅ 200 |
| 2.8 | `/privacy` Kebijakan privasi | ✅ 200 |
| 2.9 | `/terms` Syarat & ketentuan | ✅ 200 |
| 2.10 | `/sign-in` Login | ✅ 200 |
| 2.11 | `/join` Register | ✅ 200 |

## ✅ Test 3 — API Publik

| # | Endpoint | Status |
|---|---|---|
| 3.1 | `/api/health` | ✅ `{"status":"healthy"}` |
| 3.2 | `/api/csrf` | ✅ 200 (CSRF token) |
| 3.3 | `/api/leaderboard` | ✅ 200 |
| 3.4 | `/api/point-rules` | ✅ 200 |
| 3.5 | `/api/dashboard` | ✅ 200 |
| 3.6 | `/api/springs` | ✅ 200 |
| 3.7 | `/api/projects` | ✅ 200 |
| 3.8 | `/api/courses` | ✅ 200 |
| 3.9 | `/api/gallery` | ✅ 200 |
| 3.10 | `/sitemap.xml` | ✅ 200 (30 URL) |
| 3.11 | `/robots.txt` | ✅ 200 |
| 3.12 | `/manifest.json` | ✅ 200 |

## ✅ Test 4 — Auth Flow

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 4.1 | Login admin | Email: `admin@springhub.id`, Pass: `demo12345` | ✅ |
| 4.2 | Login volunteer | Email: `volunteer@springhub.id`, Pass: `vol12345` | ✅ |
| 4.3 | Register baru | Email baru + password 8+ char | ✅ |
| 4.4 | Session cookie | Setelah login, cookie `session` ter-set | ✅ |
| 4.5 | `/api/auth/me` | Return data user | ✅ |
| 4.6 | Logout | Hapus session | ✅ |

## ✅ Test 5 — Admin Panel

| # | Halaman | Status |
|---|---|---|
| 5.1 | `/admin` Dashboard | ✅ 200 |
| 5.2 | `/admin/users` Manajemen user | ✅ 200 |
| 5.3 | `/admin/reports` Laporan | ✅ 200 |
| 5.4 | `/admin/review` Review queue | ✅ 200 |
| 5.5 | `/admin/donations` Donasi | ✅ 200 |
| 5.6 | `/admin/projects` Proyek | ✅ 200 |
| 5.7 | `/admin/forms` Form builder | ✅ 200 |
| 5.8 | `/admin/courses` Kursus | ✅ 200 |
| 5.9 | `/admin/points` Point rules | ✅ 200 |
| 5.10 | `/admin/content` Content CMS | ✅ 200 |
| 5.11 | `/admin/feedback` Feedback inbox | ✅ 200 |
| 5.12 | `/admin/trust-score` Trust score | ✅ 200 |
| 5.13 | DEMO label | Ada badge "DEMO" di admin sidebar | ✅ |

## ✅ Test 6 — Admin API

| # | Endpoint | Status |
|---|---|---|
| 6.1 | `GET /api/admin/users` | ✅ 200 |
| 6.2 | `GET /api/admin/reports` | ✅ 200 |
| 6.3 | `GET /api/admin/donations` | ✅ 200 |
| 6.4 | `GET /api/admin/projects` | ✅ 200 |
| 6.5 | `GET /api/admin/forms` | ✅ 200 |
| 6.6 | `GET /api/admin/courses` | ✅ 200 |
| 6.7 | `GET /api/admin/point-rules` | ✅ 200 |
| 6.8 | `GET /api/admin/content` | ✅ 200 |
| 6.9 | `GET /api/admin/feedback` | ✅ 200 |

## ✅ Test 7 — Data Seed

| # | Tabel | Jumlah |
|---|---|---|
| 7.1 | Profile (user) | 6 |
| 7.2 | Spring (mata air) | 12 |
| 7.3 | Report (laporan) | 15 |
| 7.4 | ReportPhoto (foto) | 48 |
| 7.5 | Project (proyek) | 4 |
| 7.6 | Donation (donasi) | 6 |
| 7.7 | Course (kursus) | 3 |
| 7.8 | CourseModule (modul) | 10 |
| 7.9 | Form | 5 (dengan 41 field) |
| 7.10 | PointRule | 14 |
| 7.11 | PointsLog | 13 |
| 7.12 | Comment | 8 |
| 7.13 | Notification | 5 |
| 7.14 | ContentBlock | 4 |
| 7.15 | Feedback | 3 |

## ✅ Test 8 — Infrastructure

| # | Cek | Status |
|---|---|---|
| 8.1 | Docker containers (5) | ✅ Semua Up |
| 8.2 | Database (PostgreSQL) | ✅ Healthy |
| 8.3 | Redis | ✅ Healthy |
| 8.4 | UFW Firewall (22,80,443) | ✅ Active |
| 8.5 | Fail2ban (6 jails) | ✅ Active |
| 8.6 | SSL Let's Encrypt | ✅ Valid (exp: 28 Sep 2026) |
| 8.7 | Unattended-upgrades | ✅ Active |
| 8.8 | Docker security (no-new-privileges) | ✅ Active |

## ✅ Test 9 — Security Headers

| # | Header | Status |
|---|---|---|
| 9.1 | `Strict-Transport-Security` (HSTS) | ✅ |
| 9.2 | `X-Frame-Options: DENY` | ✅ |
| 9.3 | `X-Content-Type-Options: nosniff` | ✅ |
| 9.4 | `X-XSS-Protection: 1; mode=block` | ✅ |
| 9.5 | `Referrer-Policy: strict-origin-when-cross-origin` | ✅ |
| 9.6 | `Permissions-Policy` | ✅ |
| 9.7 | `Content-Security-Policy` | ✅ |

## ✅ Test 10 — SEO & PWA

| # | Item | Status |
|---|---|---|
| 10.1 | Google Search Console | ✅ Terverifikasi, sitemap submitted |
| 10.2 | Sitemap 30 URL | ✅ |
| 10.3 | robots.txt | ✅ |
| 10.4 | JSON-LD Structured Data | ✅ |
| 10.5 | OG Tags (title, desc, image) | ✅ |
| 10.6 | manifest.json (PWA) | ✅ |
| 10.7 | Service Worker | ✅ |
| 10.8 | Icons (192, 512, apple) | ✅ |
| 10.9 | favicon.ico | ✅ |

## ✅ Test 11 — Integration (Lulus)

| # | Test | Hasil |
|---|---|---|
| 11.1 | Resend email API | ✅ Email terkirim (ID: db8efa12...) |
| 11.2 | Landing page → semua section tampil | ✅ |
| 11.3 | Dark mode toggle | ✅ |
| 11.4 | 30 URL sitemap | ✅ |

---

## ✅ Test 12 — Fix 30 Juni 2026

| # | Test | Langkah | Hasil |
|---|---|---|---|
| 12.1 | Foto field muncul | Buka `/report/spring-monitoring` → scroll ke "Foto mata air" | ✅ ada input file + counter 0/5 |
| 12.2 | Province dropdown | Buka `/report/spring-monitoring` → field "Provinsi" | ✅ dropdown 38 provinsi |
| 12.3 | Flow condition select | Buka `/report/spring-monitoring` → "Kondisi debit" | ✅ dropdown (Deras/Sedang/Kecil/Mampus) |
| 12.4 | Submit form sukses | Isi form + 3 foto → submit → muncul "Laporan terkirim" | ✅ status `pending` |
| 12.5 | Submit form gagal (foto < 3) | Isi form + 0-2 foto → submit → error "Minimal 3 foto" | ✅ |
| 12.6 | CSRF token sync | Buka web → submit form → liat Network tab | ✅ x-csrf-token terkirim |
| 12.7 | Review queue | Login admin → `/admin/review` → liat laporan baru | ✅ muncul pending |
| 12.8 | API direct submit | `curl POST /api/reports` (HTTPS + cookies) | ✅ `{"success":true}` |

### Cara test via terminal:
```bash
# 1. Login
curl -k -c /tmp/springhub.txt -b /tmp/springhub.txt \
  -X POST https://www.springhub.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@springhub.id","password":"demo12345"}'

# 2. Ambil CSRF token
CSRF=$(curl -s -k -b /tmp/springhub.txt \
  https://www.springhub.id/api/csrf | python3 -c \
  "import json,sys; print(json.load(sys.stdin).get('token',''))")

# 3. Submit form (submit_time harus >3 detik dari sekarang)
curl -k -b /tmp/springhub.txt \
  -X POST https://www.springhub.id/api/reports \
  -H "x-csrf-token: $CSRF" \
  -F "form_slug=spring-monitoring" \
  -F "spring_name=Mata Air Test" \
  -F "province=Jawa Barat" -F "regency=Bandung" \
  -F "date=$(date +%Y-%m-%d)" \
  -F "flow_condition=Sedang" \
  -F "water_quality=Jernih" \
  -F "cleanliness=Bersih" \
  -F "_submit_time=$(echo $(date +%s)000 - 15000 | bc)" \
  -F "_website=" -F "notes=Test manual"
```

---

**Total Test: 12 kategori, ~78 test case**  
**Status: ✅✅✅ ALL PASSED**
