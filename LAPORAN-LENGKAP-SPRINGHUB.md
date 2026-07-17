# 📋 LAPORAN LENGKAP SPRINGHUB
**Per 17 Juli 2026 — Branch `master`**

---

## 1. IDENTITAS PROYEK

| Item | Detail |
|---|---|
| Nama | SpringHub — Jaga Semesta |
| Domain | www.springhub.id |
| Stack | Next.js 14 App Router · TypeScript strict · Tailwind CSS · Leaflet · PostgreSQL + Redis · Prisma ORM · Docker |
| Hosting | Hostinger VPS (Docker: nginx + Next.js + PostgreSQL + Redis + Queue Worker) + Cloudflare proxy |
| Tujuan | Community-driven monitoring & restoration of Indonesia's artesian springs |
| Status | **~94%** (produksi siap, tunggu Xendit key dari client) |

---

## 2. RIWAYAT PENGERJAAN

### 2.1 Timeline Sesi

| Tanggal | Sesi | Fokus Utama |
|---|---|---|
| **15 Mei** | 1-3 | Arsitektur, persistensi chat, audit lengkap (91 temuan) |
| **1 Juni** | 1-2 | RAB, bug fixes, dark mode 15+ file |
| **6 Juni** | 4 | Database audit — migrasi, seed data, offline photo fix Chrome Android |
| **15 Juni** | 5 | MCP fix, code audit 92% |
| **22 Juni** | 8-9 | Consistency pass, bugfix batch, skeleton loading, data saver mode |
| **1 Juli** | 10 | Bugfix batch, E2E testing, connection pooling, automated test runner |
| **2 Juli** | 11-12 | Full system audit, CSRF debug, YT thumbnail fix, favicon |
| **14 Juli** | 13 | Seedling Marketplace UI (standalone HTML) |
| **17 Juli** | 14 | Redesign seedling UI (4 iterasi), AGENTS.md cleanup, CSRF admin fix |

### 2.2 Statistik Git (branch master)

| Metrik | Angka |
|---|---|
| Total komit | **383** |
| Kontributor | 3 (Ayatull4h: 261, root: 130, LuthfiZXC: 2) |
| Branch aktif | **master** (sekarang), main (prototype lama) |
| Remote | origin → github.com/Ayatull4h/springhub.git |
| Branch lain | `origin/main`, `origin/backup-copy-code` |
| Tags | `copy-code`, `pre-perf-backup` |

### 2.3 File Paling Sering Diubah

| File | Jumlah Komit |
|---|---|
| AGENTS.md | 19 |
| `components/offline/offline-survey-map.tsx` | 50 |
| `components/sections/spring-map.tsx` | 38 |
| `app/report/[slug]/page.tsx` | 28 |
| `app/layout.tsx` | 28 |
| `messages/id.json` + `en.json` | 52 (gabung) |
| `components/map/leaflet-map.tsx` | 22 |
| `components/sections/donate.tsx` | 21 |
| `components/offline/*` (3 file) | 60+ |
| `prisma/schema.prisma` | 20 |
| `lib/prisma.ts` | 19 |
| `MANUAL-TEST-FINAL.md` | 18 |
| `components/sections/volunteer.tsx` | 18 |

### 2.4 Kategori Pekerjaan

Berdasarkan analisis pesan komit:

| Kategori | Jumlah Komit | % |
|---|---|---|
| 🐛 **Bug Fixes** | ~160 | 42% |
| ✨ **Fitur Baru** | ~80 | 21% |
| 📝 **Dokumentasi** | ~60 | 16% |
| 🔒 **Security** | ~30 | 8% |
| 🎨 **UI/UX** | ~25 | 6% |
| ⚡ **Performa** | ~15 | 4% |
| 🔧 **Infrastructure** | ~13 | 3% |

---

## 3. FITUR YANG SUDAH SELESAI (100%)

| Fitur | Detail |
|---|---|
| **Landing Page UI** | Hero, ImpactDashboard, SpringMap, Volunteer, Partner, LearningHub, Media, FeaturedProjects + Donasi |
| **Form** | 5 form (spring-monitoring, restoration, trench, planting, seedling) + dynamic form builder |
| **Map** | Leaflet + react-leaflet, location picker, filter by status/type, marker clustering |
| **Backend API** | 103 endpoint — auth, reports, donations, projects (+like/+comments), courses, admin, dll |
| **Database** | 19 model + seed (users, forms, courses, point rules, content) |
| **Auth** | JWT (jose), login, register, logout, forgot/reset password, session, guest |
| **Donasi** | Xendit invoice + webhook + HMAC verification (**placeholder key**) |
| **Admin Panel** | 10 tabs — Users, Reports, Donations, Projects, Forms, Points, Courses, Content, Feedback, Review |
| **Points Engine** | Base + bonus + milestone + streak + trust score |
| **PWA / SEO** | Manifest, sitemap, OG image, service worker, offline cache |
| **Anti-Spam** | CSRF, rate limit, honey pot, time gate, daily limit, trust score |
| **Dark Mode** | Semua halaman + komponen + static pages |
| **Skeleton Loading** | 14 layout-specific skeleton, semua loading.tsx |
| **Data Saver Mode** | Hook + context + toggle header |
| **Offline Survey (95%)** | IndexedDB, QueueWorker, GPS tracking, map tile caching |

---

## 4. YANG BELUM / KURANG (BLOCKED)

| # | Item | Status | Dampak |
|---|---|---|---|
| 1 | **Xendit API key real** | 🔴 BLOCKED | Client belum buat akun Xendit |
| 2 | **Sentry DSN** | 🔴 BLOCKED | Error monitoring mati |
| 3 | **Firewall UFW** | 🟡 Script siap | Belum dijalankan (`scripts/firewall-rules.sh`) |
| 4 | **Cloudflare WAF rules** | 🟡 Di-doc | Belum di-deploy ke Dashboard |
| 5 | **S3/R2 storage** | 🟡 Disabled | Pake local filesystem — risiko data loss |
| 6 | **Backup encryption key** | 🟡 Kosong | Backup tidak terenkripsi |
| 7 | **Secret management** | 🟡 Hardcoded | `.env.production` berisi secrets mentah |
| 8 | **E2E Firefox/WebKit** | 🟡 Fail | Hanya Chrome yang pass |
| 9 | **Comments UI** | 🟡 Backend siap | Frontend belum integrasi |
| 10 | **GPS tracking sync** | 🟡 Data di IndexedDB | Belum dikirim ke server |
| 11 | **2FA/MFA** | ⚪ Rencana | Belum mulai |
| 12 | **i18n EN toggle** | ⚪ Rencana | Konten sudah, toggle belum aktif |

---

## 5. STRUKTUR BRANCH

```
master (HEAD, aktif — 383 komit)
├── Dokumentasi lengkap (21 file)
├── Semua kode app + api + komponen
├── 7 file agent config + MCP skills
├── Portfolio PPT/PDF (14 slides)
└── Manual test (155+ test case)

main (prototype — 393 komit, 10 lebih banyak karena divergen)
├── AGENTS.md versi compact (~200 baris)
├── public/seedlings.html versi redesain (4 iterasi)
├── app/seedlings/ halaman lengkap
└── 7 agent config + opencode.jsonc

perbedaan:
├── master: dokumentasi LENGKAP, main: TIDAK punya
├── master: AGENTS.md 742 baris, main: ~200 baris (compact)
├── main: agent configs + seedling pages + opencode.jsonc
└── Kedua branch terpisah sejak komit ac7cf47
```

---

## 6. KEAMANAN

### 6.1 Yang Aktif

| Lapisan | Detail |
|---|---|
| **CSP** | Ketat — script, style, img, connect, frame, form-action terbatas |
| **HSTS** | max-age=63072000; includeSubDomains; preload |
| **CSRF** | Token via /api/csrf, verifikasi di semua endpoint admin |
| **Rate Limit Nginx** | api (30r/s), auth (5r/s), donate (3r/s), newsletter (2r/m), report (1r/s) |
| **JWT Rotation** | verifyJwtWithRotation() — current + previous key |
| **Password** | Min 8 karakter, uppercase + lowercase + angka |
| **Login Lockout** | 5 gagal → lock 15 menit |
| **Audit Trail** | Semua admin mutation tercatat |

### 6.2 Yang Perlu

| # | Item | Severity |
|---|---|---|
| 1 | **Firewall UFW** → belum diaktifkan | 🔴 Critical |
| 2 | **Cloudflare WAF rules** → belum di-deploy | 🟠 High |
| 3 | **XENDIT_SECRET_KEY hardcoded** di env | 🟠 High |
| 4 | **JWT_SECRET hardcoded** di .env.production | 🟠 High |
| 5 | **EMAIL_API_KEY hardcoded** (terlihat di file) | 🟠 High |
| 6 | **Sentry DSN kosong** → error tidak terpantau | 🟡 Medium |
| 7 | **BACKUP_ENCRYPT_KEY kosong** | 🟡 Medium |

---

## 7. DATABASE (19 Model)

| Model | Status | Catatan |
|---|---|---|
| Profile | ✅ | id, email, username, role (user/volunteer/admin), points, trustScore |
| Session | ✅ | JWT session management |
| Spring | ✅ | snapped lat/lng, province, regency |
| MapPointType | ✅ | Slug-based, icon, sortOrder |
| MapPointCategory | ✅ | Color, nested under MapPointType |
| MapPoint | ✅ | snapped lat/lng, active/inactive |
| Report | ✅ | status (pending/approved/rejected), isActive, fieldData JSONB |
| ReportPhoto | ✅ | MIME validation, min 3 / max 5 |
| Project | ✅ | status (pending→under_review→approved→rejected→completed) |
| Donation | ✅ | Xendit invoice integration |
| PointsLog | ✅ | Base + bonus points tracking |
| PointRule | ✅ | 14 rules sudah di-seed |
| Course | ✅ | 3 courses, 10 modules |
| CourseModule | ✅ | HTML/MD content |
| Form | ✅ | 5 static + dynamic builder |
| FormField | ✅ | Support text, number, select, photo, location, date |
| OfflineSession | ✅ | GPS tracking sessions |
| TrackingPoint | ✅ | isSpringMarker, springName |
| Feedback | ✅ | Bug reports |
| Notification | ✅ | Per user |
| Comment | ✅ | Per project |
| Like | ✅ | Unique per user+project |
| ContentBlock | ✅ | CMS for landing page |
| AppError | ✅ | Error logging |

---

## 8. LINGKUNGAN PRODUKSI

### 8.1 Docker Services (5)

| Service | Image | Port | Resource Limit |
|---|---|---|---|
| postgres | postgis/postgis:16-3.4-alpine | 5432 | 2G max |
| redis | redis:7-alpine | 6379 | 256M max |
| web | Next.js (build lokal) | 31759 | 1G max |
| worker | Next.js (email worker) | — | 256M max |
| nginx | nginx:alpine | 80/443 | 256M max |

### 8.2 Environment (.env.production)

| Variable | Status |
|---|---|
| DATABASE_URL | ✅ Self-hosted PostgreSQL |
| JWT_SECRET | ⚠️ Hardcoded |
| REDIS_URL | ✅ redis://redis:6379 |
| XENDIT_SECRET_KEY | ❌ Kosong |
| XENDIT_WEBHOOK_TOKEN | ❌ Kosong |
| S3_* (R2) | ❌ Semua kosong |
| Supabase | ❌ Semua kosong (disabled) |
| EMAIL_API_KEY | ⚠️ Terisi (Resend) |
| SENTRY_DSN | ❌ Kosong |
| NEXT_PUBLIC_APP_URL | ✅ https://www.springhub.id |

### 8.3 SSL & Domain

- **Domain**: www.springhub.id
- **SSL**: Let's Encrypt (auto-renew via certbot)
- **Proxy**: Cloudflare (DNS + proxy)
- **SSL Protocols**: TLSv1.2 + TLSv1.3
- **HSTS**: max-age=2 tahun, preload

---

## 9. AKUN DEMO (SEED)

| Email | Password | Role | Poin |
|---|---|---|---|
| `admin@springhub.id` | `demo12345` | admin | 99.999 |
| `ucup@springhub.id` | `ucup12345` | volunteer | 20.168 (bisa project) |
| `vol@springhub.id` | `vol12345` | volunteer | 8.750 (belum project) |

---

## 10. REKOMENDASI

| Prioritas | Tindakan |
|---|---|
| 🔴 **P0** | Minta Xendit API key dari client |
| 🔴 **P0** | Aktifkan firewall: `bash scripts/firewall-rules.sh` |
| 🔴 **P0** | Setup Sentry DSN untuk error tracking |
| 🟠 **P1** | Deploy Cloudflare WAF rules (panduan di `scripts/CLOUDFLARE-WAF-RULES.md`) |
| 🟠 **P1** | Ganti semua hardcoded secrets (JWT, email, redis) ke env var proper |
| 🟠 **P1** | Isi BACKUP_ENCRYPT_KEY |
| 🟠 **P1** | Migrasi storage ke S3/R2 |
| 🟡 **P2** | Implementasi 2FA/MFA (sudah ada blueprint di AGENTS.md) |
| 🟡 **P2** | Integrasi Comments UI frontend |
| 🟡 **P2** | Sync GPS tracking points ke server |
| 🟡 **P2** | Fix E2E Firefox/WebKit |
| ⚪ **P3** | Merge branch main → master (atau cherry-pick seedling pages) |
| ⚪ **P3** | Hapus hardcoded credentials dari git history |

---

> **Laporan dibuat**: 17 Juli 2026
> **Sumber**: GitHub push/pull history (383 komit), AGENTS.md (742 baris), supermemory knowledge graph
> **Branch aktif**: `master` (tracking `origin/master`)
