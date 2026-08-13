# BAB 2 — Peta Kode: Inventaris Lengkap Setiap File

> Bab ini adalah "peta harta karun" buku ini. Setiap file kode di proyek
> tercatat di sini: di mana dia, peran satu kalimat, dan konstruk kunci yang
> ada di dalamnya. Bab-bab berikutnya (3–10) menjelaskan SEMUANYA satu per satu
> dengan potongan kode asli.

**Statistik proyek:** 363 file kode · **48.469 baris** · TypeScript + React (Next.js 14 App Router) · Prisma/PostgreSQL · Redis/BullMQ · Tailwind CSS · Leaflet.

---

## 2.1 Peta per Area

| Area | Jumlah file | Peran |
|---|---|---|
| `app/api/` | 94 | Route handler REST (Bab 6) |
| `app/` (halaman) | 85 | Halaman App Router: landing, admin, learn, profile... |
| `lib/` | 42 | Logika domain: auth, poin, geo, form, sanitasi... (Bab 5) |
| `components/` | 39 | Komponen UI: peta Leaflet, PWA, sections (Bab 7) |
| `prisma/` | 23 | Skema 30 model, 10 migrasi, seed (Bab 8) |
| `e2e/` | 21 | Playwright E2E |
| `scripts/` | 9 | Backup, firewall, perbaikan data, PDF (Bab 9) |
| `workers/` | 2 | Worker antrean email |

---

## 2.2 `app/api/` — 94 Route Handler

> Setiap baris adalah route yang dijelaskan lengkap di Bab 6.

| Domain | Route (method) | File |
|---|---|---|
| **Auth** | POST `/api/auth/login` · `/register` · `/logout` · `/forgot-password` · `/reset-password` · `/claim-guest` · GET `/api/auth/me` | `app/api/auth/*/route.ts` |
| **CSRF** | GET `/api/csrf` | `app/api/csrf/route.ts` |
| **Formulir** | GET `/api/forms` · `/api/forms/[slug]` · POST `/api/reports` | `app/api/forms/*` |
| **Reports** | GET/POST `/api/reports` · GET/PATCH `/api/reports/[id]` · foto · komentar · like | `app/api/reports/*` |
| **Admin** | `/api/admin/*` — users, reports (approve/reject/toggle/orphans), springs, forms+fields, courses, content, point-rules, donations, projects, seedlings+requests, errors, feedback, export, download, trust-scores | `app/api/admin/**` |
| **Donasi** | POST `/api/donations/invoice` · POST `/api/donations/webhook` | `app/api/donations/*` |
| **Offline** | POST `/api/offline/sync` · POST `/api/offline/session` | `app/api/offline/*` |
| **Kursus** | GET `/api/courses` · `/api/courses/[slug]` · POST `/api/courses/progress` | `app/api/courses/*` |
| **Peta** | `/api/springs*` · `/api/map-points*` · `/api/map-types` | `app/api/{springs,map-*}/*` |
| **Marketplace bibit** | `/api/seedlings*` · `/api/seedling-requests` | `app/api/seedlings/*` |
| **Proyek** | `/api/projects*` | `app/api/projects/*` |
| **Lain-lain** | `/api/health` · `/api/leaderboard` · `/api/dashboard` · `/api/newsletter` · `/api/feedback` · `/api/gallery` · `/api/content` · `/api/notifications*` · `/api/user/*` · `/api/log/error` · `/api/upload/presign` · `/api/ytthumb` · `/api/point-rules` | `app/api/*/route.ts` |

---

## 2.3 `lib/` — 42 File Logika Domain (Bab 5)

| File | Peran satu kalimat |
|---|---|
| `auth.ts` | Sesi, cookie, bcrypt, `isAdmin()`, lockout login |
| `auth-context.tsx` | Konteks React untuk status login di klien |
| `jwt.ts` | JWT sign/verify dengan rotasi kunci (current + previous) |
| `csrf.ts` | Token CSRF — verifikasi constant-time, one-time |
| `rate-limit.ts` | Rate limiter Redis per endpoint + lockout |
| `points.ts` | Perhitungan poin per jenis laporan + bonus |
| `forms.ts` | 5 skema form + Zod validation + POINTS_MAP (83 field `.max`) |
| `dynamic-validation.ts` | Validasi form dinamis (DB-driven FormField) |
| `geo.ts` | Snap koordinat 5km untuk publik (`snapToProtectionGrid`) |
| `sanitize.ts` | DOMPurify 2 lapis (server-only) — anti-XSS |
| `prisma.ts` | Singleton Prisma + `getErrorMessage` |
| `prisma-rls.ts` | `prismaWithRls(ctx)` — Row Level Security per user |
| `upload-photo.ts` | Magic-byte MIME, EXIF strip, resize 720p |
| `offline-db.ts` | IndexedDB wrapper — 10 object store + migrasi versi |
| `session-cache.ts` | Cache sesi + `fetchAndCacheSession()` |
| `xendit.ts` | Integrasi invoice Xendit + DONATION_TIERS |
| `queue.ts` | BullMQ antrean (email, notifikasi) |
| `redis.ts` / `redis-connection.ts` | Koneksi Redis singleton |
| `email.ts` | Pengiriman email (Resend/SMTP) |
| `env.ts` | Validasi environment variable saat boot |
| `audit.ts` | Audit log (riwayat aksi admin) |
| `error-logger.ts` / `logger.ts` | Logging terstruktur + penampungan error |
| `health-score.ts` | Skor kesehatan mata air |
| `epicollect.ts` | Integrasi Epicollect (data eksternal) |
| `provinces.ts` | Data 38 provinsi untuk dropdown |
| `contacts.ts` / `watermark.ts` / `photo-url.ts` | Utilitas kecil |
| `cache.ts` / `cleanup.ts` / `guest.ts` / `data.ts` / `utils.ts` | Utilitas umum |
| `darkmode.tsx` / `error-boundary.tsx` / `use-auto-save.ts` | Hook/komponen klien |
| `i18n.tsx` | Terjemahan id/en via Context |

---

## 2.4 `components/` — 39 Komponen (Bab 7)

| Kelompok | File |
|---|---|
| **Peta** (Leaflet) | `map/leaflet-map.tsx` · `location-picker.tsx` · `picker-map.tsx` · `mini-map.tsx` · `map-filter.tsx` · `offline-tile-layer.tsx` |
| **Offline PWA** | `offline/offline-setup.tsx` · `simple-offline-form.tsx` · `offline-survey-map.tsx` · `setup-map.tsx` · `offline-exit-sync.tsx` · `offline-entry-button.tsx` · `error-boundary.tsx` |
| **Sections** | `sections/hero.tsx` · `spring-map.tsx` · `impact-dashboard.tsx` · `volunteer.tsx` · `learning-hub.tsx` · `donate.tsx` · `featured-projects.tsx` · `media.tsx` · `points-guide-modal.tsx` · `status-info.tsx` |
| **Akar** | `queue-worker.tsx` · `site-header.tsx` · `site-footer.tsx` · `toast.tsx` · `logo.tsx` · `draft-banner.tsx` · `lite-youtube-embed.tsx` · `pwa-install-guide.tsx` · `floating-points-button.tsx` |
| **Skeleton** | `skeleton/index.ts` · `skeleton/sections.tsx` · `ui/skeleton.tsx` |

---

## 2.5 `prisma/` — Data Layer (Bab 8)

- `schema.prisma` — **30 model** + 7 enum: Profile, Session, Report, Spring, MapPoint(+Type/Category), Form(+Field), Course(+Module), Donation, PointsLog, PointRule, Project(+Photo), Seedling(+Photo/Request), Notification, Comment, Like, Feedback, ContentBlock, AppError, OfflineSession, TrackingPoint, PasswordResetToken, CoursesProgress
- `migrations/` — 10 migrasi dari 19 Mei sampai 12 Agustus 2026
- `seed.ts` — data demo (2 user, 5 form, 3 kursus, 14 point rules) + pengaman `SEED_FORCE`
- `seed-dummy.ts` / `seed-content.ts` / `seed-test-accounts.ts` — seed tambahan

---

## 2.6 Infrastruktur (Bab 9)

| File | Peran |
|---|---|
| `middleware.ts` | Gerbang: JWT di edge, redirect admin, IP whitelist |
| `next.config.mjs` | CSP, `output: standalone`, external packages |
| `nginx.conf` | Reverse proxy prod: rate limit, SSL, cache statis |
| `nginx-staging.conf` | Proxy staging + basic auth + preview per-branch |
| `docker-compose.yml` / `.staging.yml` / `.preview.yml` | 3 lingkungan paralel |
| `Dockerfile` | 3 tahap: deps → builder → runner (user non-root) |
| `.github/workflows/deploy.yml` | CI: test → deploy prod/staging/preview |
| `scripts/firewall-rules.sh` | UFW: hanya Cloudflare IP ke 80/443 |
| `scripts/backup-db.sh` | Backup harian 03:00 + enkripsi GPG |
| `workers/email-worker.ts` | Konsumen antrean email |

---

## 2.7 Halaman `app/` (Non-API) — 85 File

| Halaman | Peran |
|---|---|
| `/` | Landing: hero, peta interaktif, dashboard dampak, volunteer, belajar, donasi |
| `/report/[slug]` | 5 jenis formulir (monitoring, restorasi, rorak, tanam, bibit) |
| `/report-issue` | Lapor masalah situs |
| `/learn` + `/learn/[slug]/[moduleId]` | Kursus + modul |
| `/seedlings` + `/seedlings/[id]` | Marketplace bibit + detail |
| `/projects` + `/projects/[id]` + `/projects/new` | Proyek komunitas + proposal |
| `/profile` | Profil + poin + navigasi bibit |
| `/admin` + 24 sub-halaman | Dashboard + 10 tab manajemen |
| `/offline` | Mode PWA offline |
| `/sign-in`, `/join`, `/forgot-password`, `/reset-password` | Auth |
| `/help`, `/faq`, `/privacy`, `/terms` | Halaman statis |

---

## 2.8 Cara Membaca Buku Ini

```
1. Lihat file di peta ini → 2. Buka bab yang sesuai (5=lib, 6=API, 7=komponen,
   8=data, 9=infra) → 3. Baca potongan kode asli → 4. Baca cerita penjelasannya
   → 5. Cek bab 🛡️ Kerentanan (bab 10) untuk ancamannya.
```

Bab 4 berisi "kamar mesin": setiap konstruk bahasa (if/else, loop, async...)
dijelaskan gaya cerita dengan contoh asli — baca dulu kalau kamu belum terbiasa
dengan kode.
