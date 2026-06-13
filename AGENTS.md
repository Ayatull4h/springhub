# SpringHub — AGENTS.md

## Project Identity
- **Nama**: SpringHub (under **Jaga Semesta**)
- **Stack**: Next.js 14 App Router + TypeScript (strict) + Tailwind CSS + Leaflet
- **Hosting**: Vercel (frontend) + Supabase (backend/db/auth/storage)
- **Domain**: Community-driven monitoring & restoration of Indonesia's artesian springs
- **Status**: Uji coba (proof of concept) — akan ada perbaikan lanjutan

---

## Role & Access Control

| Role | Akses |
|---|---|
| **Publik** (no login) | Lihat map, dashboard, learning hub, media, activity feed, project listing |
| **Volunteer** (login, verified) | Isi form + dapet poin + submit project (jika >= 20K pts) + lihat history sendiri |
| **Admin** | Semua data: email, phone, precise coords, donasi, user management, review queue, export |

---

## Data Privacy — RLS First

**Prinsip**: Data sensitif TIDAK pernah dikirim ke frontend publik. Perlindungan di level database (Supabase RLS), bukan UI hiding.

| Data | Publik | Volunteer | Admin |
|---|---|---|---|---|
| Username, region | ✅ | ✅ | ✅ | ✅ |
| Snapped location (5km) | ✅ | ✅ | ✅ | ✅ |
| Precise location | ❌ | ❌ | ✅ |
| Email, phone | ❌ | ❌ | ❌ | ✅ |
| Donation detail | ❌ (aggregate only) | ❌ | ❌ | ✅ |
| Trust score | ❌ | ❌ | ❌ | ✅ |

---

## Points System

### Dasar (per form submission)
| Form | Poin |
|---|---|
| Spring Monitoring | +25 pts |
| Spring Restoration | +100 pts |
| Trench Development | +50 pts |
| Tree Planting | +50 pts |
| Seedling Stock | +15 pts |

### Bonus Points
| Kategori | Syarat | Bonus |
|---|---|---|
| **Streak Harian** | Lapor 3 hari berturut-turut | +5 pts (hari ke-3) |
| **Streak Mingguan** | Lapor tiap hari seminggu | +50 pts |
| **Laporan Lengkap** | Semua field + foto + notes | +10 pts |
| **Foto Before/After** | Minimal 2 foto | +15 pts |
| **Penemu (Discovery)** | Mata air baru belum ada di map | +50 pts + badge |
| **Verifikator** | Verifikasi laporan volunteer lain | +10 pts |
| **Milestone 10 laporan** | | +50 pts |
| **Milestone 50 laporan** | | +250 pts |
| **Milestone 100 laporan** | | +500 pts |
| **Course selesai** | Learning Hub | +25 pts per course |
| **Event Multiplier** | Hari Air Sedunia, Hari Bumi, dll | Poin x1.5 - x2 |
| **Threshold 20K pts** | | +1.000 pts (sekali) |

Semua perhitungan poin dilakukan **server-side**, tidak bisa dimanipulasi dari frontend.

---

## Anti-Spam Strategy

| Layer | Metode |
|---|---|
| **Validasi** | Zod schema cocokkan lib/forms.ts — tolak data invalid |
| **Rate Limit** | 5 form/hari/user, 10 req/menit/IP |
| **Honey Pot** | Hidden field — bot akan isi, manusia tidak |
| **Time Gate** | Form submitted < 3 detik = bot |
| **Foto** | Validasi MIME type + hapus EXIF + kompresi 720p |
| **Geolocation Match** | Input location ± IP region ± foto EXIF harus konsisten |
| **Trust Score** | +10 per accepted, -50 per rejected, < 0 = auto-block |
| **Admin Review Queue** | First 5 submission + suspicious flags masuk review |

---

## Arsitektur Teknis

```
Frontend (Vercel)
├── Next.js 14 App Router
├── Tailwind CSS + custom brand palette
├── Leaflet / react-leaflet (dynamic import, SSR false)
├── lucide-react icons
├── next-intl (EN/ID — planned)
└── PWA (manifest + service worker — planned)

Backend (Supabase)
├── Postgres DB + RLS policies
├── Auth (magic link + Google OAuth + phone OTP)
├── Storage (foto kompresi 720p + hapus EXIF)
└── Realtime (leaderboard live update — planned)

Third Party
├── Xendit (payment gateway — invoices + webhook)
├── OpenStreetMap (map tiles)
└── WhatsApp API (phone OTP verification)
```

---

## Prioritas Eksekusi

### Fase 1 — Foundation (Estimasi: 3-5 hari)
| # | Task | Priority |
|---|---|---|
| 1.1 | ✅ AGENTS.md + opencode config + MCP setup | P0 |
| 1.2 | Supabase project + DB schema (profiles, reports, donations, projects, points_log) | P0 |
| 1.3 | Supabase Auth (magic link + Google OAuth) + halaman Sign In / Join | P0 |
| 1.4 | POST /api/reports + Zod validasi (cocok ke lib/forms.ts) | P0 |
| 1.5 | Middleware Next.js: proteksi route form, admin, projects | P0 |
| 1.6 | Anti-spam dasar: honey pot + time gate + rate limit IP | P0 |
| 1.7 | Geolocation one-tap button (ganti input lat/lng manual) | P1 |
| 1.8 | PWA: manifest.json + service worker | P1 |
| 1.9 | Toast + spinner + success page setelah submit form | P1 |

### Fase 2 — Backend + Donasi (Estimasi: 5-7 hari)
| # | Task | Priority |
|---|---|---|
| 2.1 | Supabase RLS policies per role | P0 |
| 2.2 | Foto upload: kompresi 720p + MIME validasi + hapus EXIF | P0 |
| 2.3 | Xendit createInvoice implementation + webhook handler | P0 |
| 2.4 | Donate form: submit beneran ke Xendit | P0 |
| 2.5 | Admin panel: /admin/users (daftar user + email + phone + role) | P1 |
| 2.6 | Admin panel: /admin/reports (laporan + koordinat presisi) | P1 |
| 2.7 | Admin panel: /admin/donations (transaksi donasi) | P1 |
| 2.8 | Admin panel: /admin/review (approve/reject queue) | P1 |
| 2.9 | Verifikasi phone (OTP via WhatsApp) | P1 |
| 2.10 | Halaman /projects/new (multi-step project proposal) | P2 |

### Fase 3 — Gamification (Estimasi: 4-6 hari)
| # | Task | Priority |
|---|---|---|
| 3.1 | Points engine: award otomatis saat report accepted | P0 |
| 3.2 | Trust score system (+10/-50) + auto-block | P1 |
| 3.3 | Leaderboard real-time dari DB (ganti mock data) | P1 |
| 3.4 | Eligibility gate: 20K pts check real dari DB | P1 |
| 3.5 | Bonus points: streak, kualitas, discovery, milestone | P1 |
| 3.6 | User profile page: /profile (points, history, badges) | P2 |

### Fase 4 — Polish (Estimasi: 4-6 hari)
| # | Task | Priority |
|---|---|---|
| 4.1 | i18n EN/ID — seluruh konten + label form | P1 |
| 4.2 | Offline support: IndexedDB + queue submission | P2 |
| 4.3 | Dark mode toggle | P2 |
| 4.4 | Data saver mode (navigator.connection.saveData) | P2 |
| 4.5 | Skeleton loading states untuk semua section | P2 |
| 4.6 | Newsletter backend (simpan ke Supabase) | P2 |
| 4.7 | Halaman statis: Help Center, FAQ, Privacy, Terms | P3 |

---

## Catatan Penting

### Code Conventions
- **Strict TypeScript**: `strict: true` di tsconfig.json
- **Component pattern**: `components/sections/` untuk page sections, `components/map/` untuk map
- **Lib pattern**: `lib/` untuk domain logic — forms, geo, xendit, data, utils
- **CSS**: Tailwind utility-first + custom components layer di globals.css
- **Form schemas**: single source of truth di `lib/forms.ts` — jangan duplikasi

### Security Rules
1. **Amount donasi dari server**, jangan trusted dari client — Xendit invoice amount ditentukan server
2. **Foto real-time**: `capture="environment"` + hapus EXIF sebelum simpan ke storage
3. **Location snap**: 5km grid snapping di `lib/geo.ts` — wajib untuk semua publikasi
4. **Email/phone**: hanya admin yang bisa lihat di panel terpisah, tidak pernah di frontend publik
5. **Points server-side**: semua perhitungan poin di server, jangan pernah kirim poin dari client
6. **RLS**: setiap tabel Supabase harus punya policies untuk read/write per role
7. **CSRF**: form submission pakai token untuk cegah cross-site request

### Database Requirements
- `profiles.role` ENUM: 'user', 'volunteer', 'admin'
- `profiles.email` dan `profiles.phone` hanya bisa diSELECT oleh admin
- `reports.precise_location` hanya bisa diSELECT oleh admin
- `donations` — donor_name publik, donor_email + phone admin-only
- Index: user_id, form_slug, status, created_at, region

### MCP Servers (opencode.json)
- **filesystem**: `@modelcontextprotocol/server-filesystem` — path-scoped ke project root
- **supabase**: `@supabase/mcp-server-supabase` — DB management, queries, migrations
- Konfigurasi lengkap di `.opencode/opencode.json`

### Agents (opencode.json)
| Agent | Mode | Fungsi |
|---|---|---|
| springhub-plan | primary | Plan mode, read-only, arsitektur & backlog |
| springhub-build | primary | Build mode, implementasi kode |
| springhub-db | subagent | Database schema + RLS + migration |
| springhub-form | subagent | Form API + validasi + anti-spam |
| springhub-donate | subagent | Xendit integration + payment flow |
| springhub-admin | subagent | Admin panel + user management |

---

## Catatan Pengerjaan

## Semua perubahan sudah di-push ke GitHub dan auto-deploy ke Vercel.
## Manual test plan tersedia di MANUAL-TEST.md (99 test case).

---

## Diskusi Tersimpan

### 15 Mei 2026 — Sesi 1
- **Keputusan**: Vercel (frontend) + Supabase (backend) — Hostinger tidak cocok untuk Next.js App Router
- **Keputusan**: Prioritas Form -> Donasi -> Point
- **Keputusan**: Anti-spam berlapis (Zod + rate limit + honey pot + time gate + trust score)
- **Keputusan**: RLS-first untuk data privacy — data sensitif tidak pernah dikirim ke frontend
- **Keputusan**: Publik bisa lihat, login wajib untuk isi form
- **Keputusan**: Points system — dasar (15-100) + bonus (streak, kualitas, discovery, milestone, event)
- **Status project**: Uji coba (POC) — akan ada perbaikan lanjutan

### 15 Mei 2026 — Sesi 2
- **Fokus**: Setup persistensi chat — user ingin setiap sesi tercatat agar konteks terbawa
- **Keputusan**: Setiap sesi dicatat di AGENTS.md (sudah di `instructions` opencode.json)
- **Keputusan**: Buka opencode dari folder `Y:\PC\Downloads\jaga semesta` agar konteks proyek langsung terbaca
- **Catatan**: User ingin fokus penuh ke project SpringHub ke depannya

### 15 Mei 2026 — Sesi 3 (Audit Lengkap)
- **Fokus**: Audit menyeluruh semua aspek web + store findings permanent di AGENTS.md
- **Temuam**: Lihat bagian Audit Lengkap di bawah

---

## Audit Lengkap 15 Mei 2026

### 🔴 CRITICAL — Fungsi Rusak / 404

| # | Temuan | File | Detail |
|---|---|---|---|
| C1 | `POST /api/reports` 404 | `app/report/[slug]/page.tsx:44` | Form submit ke endpoint yang tidak ada |
| C2 | Tombol "Xendit Checkout" tidak jalan | `donate.tsx:144` | Tidak ada onClick handler |
| C3 | Field donasi name/email tidak kebaca | `donate.tsx:130-143` | Tidak ada `name` attribute & state binding |
| C4 | `createInvoice()` throw error | `lib/xendit.ts:56-61` | Stub — implementasi real belum ada |
| C5 | `/sign-in` dan `/join` 404 | `site-header.tsx:43,46` | Route auth belum dibuat |
| C6 | `/projects/new` 404 | `volunteer.tsx:129` | Route belum ada |
| C7 | Tombol "Start Course" inert | `learning-hub.tsx:34` | Tidak ada onClick/href |
| C8 | Newsletter form tidak jalan | `site-footer.tsx:81` | Tidak ada action/onSubmit |
| C9 | Tidak ada `favicon.ico` | Root | Browser 404 tiap load |
| C10 | Tidak ada Open Graph image | `app/layout.tsx` | Share ke medsos tidak ada preview |
| C11 | `formatNumber()` pakai `en-US` | `lib/utils.ts:9` | Rp 18,250,000 → seharusnya Rp 18.250.000 (id-ID) |

### 🟠 HIGH — Logic & Data

| # | Temuan | File | Detail |
|---|---|---|---|
| H1 | `force-static` di form page | `app/report/[slug]/page.tsx:11` | Halaman di-bake saat build — perubahan forms.ts tidak ke-reflect |
| H2 | `currentUser` hardcoded 24,168 pts | `lib/data.ts:9-13` | Selalu eligible — tidak bisa test state "Locked" |
| H3 | Hanya 6 data spring | `lib/data.ts:87-94` | Kurang representatif |
| H4 | Like💙/Comment💬 angka static | `volunteer.tsx:63,66` | 24 dan 6 hardcoded |
| H5 | Phone field tanpa pattern validasi | `app/report/[slug]/page.tsx:86-98` | Format 08xx / +62 tidak divalidasi |
| H6 | `impactStats` display tidak konsisten | `lib/data.ts:45-50` | Campur aduk hardcode vs formatNumber |
| H7 | Map center hardcoded | `leaflet-map.tsx:23` | `[-7.5, 110]` — tidak auto-fit bounds |
| H8 | `visibleLocation()` tidak dipakai | `lib/geo.ts:41-47` | Semua komponen pakai pre-snapped dari data.ts |
| H9 | Instagram URL kotor | `lib/contacts.ts:21-22` | Ada tracking params igsh + utm_source |
| H10 | `setTierId("custom")` tidak match | `donate.tsx:124` | "custom" tidak ada di DONATION_TIERS |

### 🟡 MEDIUM — Frontend & UX

| # | Temuan | File | Detail |
|---|---|---|---|
| M1 | `scrollWheelZoom={false}` | `leaflet-map.tsx:25` | User tidak bisa scroll-zoom map |
| M2 | Tidak ada `app/not-found.tsx` | — | Default Next.js plain 404 |
| M3 | Tidak ada `app/error.tsx` | — | Error apapun bikin white screen |
| M4 | Tidak ada `app/loading.tsx` | — | Transisi halaman tanpa feedback |
| M5 | Tombol "EN" language toggle kaku | `site-header.tsx:35-42` | Tidak ada i18n backend |
| M6 | `next.config.mjs` terlalu minimal | `next.config.mjs` | Tidak ada images config, redirects, security headers |
| M7 | Tidak ada `app/opengraph-image.tsx` | — | og:image tidak ada |
| M8 | Tidak ada apple-touch-icon | public/ | Ikon home screen iOS tidak ada |
| M9 | Footer 8 link ke `#` | `site-footer.tsx` | Help Center, FAQ, Privacy, Terms, dll placeholder |
| M10 | 3 dari 4 media items href="#" | `lib/data.ts:176-213` | Event, Publication, Press belum punya link real |

### 🔵 LOW — Code Quality & Testing

| # | Temuan | File | Detail |
|---|---|---|---|
| L1 | Zero test files | — | Tidak ada *.test.ts / *.spec.ts |
| L2 | TypeScript cast tidak aman | `impact-dashboard.tsx:26` | `s.icon as keyof typeof iconMap` rawan runtime error |
| L3 | `lib/forms.ts` hanya tipe, bukan runtime | `lib/forms.ts` | Belum ada Zod schema untuk validasi |
| L4 | Tidak ada `.env.example` | Root | Developer tidak tahu env vars apa yang diperlukan |
| L5 | README typo "trench-and-trees" | `README.md:30` | Harusnya "tree-planting" |
| L6 | Data `preview.html` duplikasi | `preview.html:756-763` | Akan divergen dari lib/data.ts |
| L7 | `s.delta.split(" ")[0]` fragile | `impact-dashboard.tsx:35` | Gagal jika format string berubah |

### 📊 Database Schema Lengkap

```
profiles (id UUID PK, username, role ENUM, email, phone, phone_verified, 
          region, points INT4, trust_score INT4, created_at)

reports (id UUID PK, user_id FK, form_slug, status ENUM, field_data JSONB,
         precise_lat/lng FLOAT8, snapped_lat/lng FLOAT8, reviewed_by FK,
         review_note, created_at)

report_photos (id UUID PK, report_id FK CASCADE, field_id, storage_path, 
               mime_type, width, height, created_at)

projects (id UUID PK, user_id FK, type_id ENUM, title, summary, region,
          status ENUM, goal_amount INT8, raised_amount INT8, created_at)

donations (id UUID PK, user_id FK, project_id FK, invoice_id, external_id,
           amount_idr INT4, tier_id, donor_name, donor_email, status ENUM,
           paid_at, expires_at, created_at)

points_log (id UUID PK, user_id FK, report_id FK, amount INT4, reason,
            metadata JSONB, created_at)

courses_progress (id UUID PK, user_id FK, course_slug, completed_modules,
                  total_modules, completed BOOL, created_at, UNIQUE user_id+course_slug)
```

### 🔐 RLS Policies

| Table | Publik | Volunteer | Admin |
|---|---|---|---|
| profiles | username,region,points | dirinya sendiri | ALL |
| reports | snapped+status | CRUD sendiri | ALL |
| report_photos | thumbnail | upload sendiri | ALL |
| donations | donor_name+amount+status=paid | riwayat sendiri | ALL |
| projects | approved | create (>=20K pts) | ALL |
| points_log | — | riwayat sendiri | ALL |

### 📋 Route Map (Updated 1 Juni 2026)

| Route | Status | Fungsi |
|---|---|---|
| `/` | ✅ Siap | Landing page |
| `/report/[slug]` | ✅ Siap | 5 form — submit ke POST /api/reports ✅ |
| `/sign-in` | ✅ Siap | Login |
| `/join` | ✅ Siap | Register |
| `/projects/new` | ✅ Siap | Multi-step project proposal |
| `/profile` | ✅ Siap | Profile user |
| `/admin` | ✅ Siap | Dashboard admin |
| `/admin/users` | ✅ Siap | Manajemen user |
| `/admin/reports` | ✅ Siap | Laporan + toggle active/inactive |
| `/admin/donations` | ✅ Siap | Donasi |
| `/admin/review` | ✅ Siap | Review queue + approve/reject |
| `/admin/projects` | ✅ Siap | Verifikasi project |
| `/admin/points` | ✅ Siap | Point rules |
| `/admin/courses` | ✅ Siap | Course management |
| `/admin/forms` | ✅ Siap | Dynamic form builder |
| `/admin/content` | ✅ Siap | Content CMS |
| `/admin/feedback` | ✅ Siap | Bug reports inbox |
| `/api/reports` | ✅ Siap | POST submit + GET public list |
| `/api/reports/[id]/photos` | ✅ Siap | Upload foto |
| `/api/donations/invoice` | ✅ Siap | Xendit invoice |
| `/api/donations/webhook` | ✅ Siap | Xendit callback (HMAC) |
| `/api/projects` | ✅ Siap | GET list / POST create |
| `/api/leaderboard` | ✅ Siap | Top 20 |
| `/api/user/profile` | ✅ Siap | GET/PUT profile |
| `/api/user/points` | ✅ Siap | Riwayat poin |
| `/api/csrf` | ✅ Siap | CSRF token |
| `/api/health` | ✅ Siap | DB + Redis health check |
| `/api/newsletter` | ✅ Siap | Subscribe email |
| `/api/feedback` | ✅ Siap | Submit bug report |
| `/api/gallery` | ✅ Siap | Gallery items |
| `/api/upload/presign` | ✅ Siap | Presigned upload URL |
| `/api/auth/*` (7 routes) | ✅ Siap | Login, register, logout, me, forgot/reset, claim-guest |
| `/api/admin/*` (19 routes) | ✅ Siap | All admin CRUD + export |

### 📈 Progres Per Layer (Updated 1 Juni 2026)

| Layer | % | Catatan |
|---|---|---|
| Landing page UI | 100% | Semua section, i18n, dark mode ✅ |
| Form UI | 100% | 5 form + dynamic forms + Zod validation ✅ |
| Map UI | 100% | Leaflet + filter + location picker ✅ |
| Backend API | 100% | 52 route.ts — auth, reports, donations, projects, courses, admin, dll ✅ |
| Database | 100% | Prisma 14 models + Supabase PostgreSQL ✅ |
| Auth | 100% | Login, Register, Logout, Forgot/Reset password, Session ✅ |
| Donasi | 100% | Xendit invoice + webhook + HMAC verification ✅ |
| Admin Panel | 100% | 10 tabs — Users, Reports, Donations, Projects, Forms, Points, Courses, Content, Feedback, Review ✅ |
| Points Engine | 100% | Base + bonus + milestone + streak + trust score ✅ |
| PWA / SEO | 100% | Manifest, sitemap, OG image, service worker ✅ |
| Anti-Spam | 100% | CSRF, rate limit, honey pot, time gate, daily limit ✅ |
| Testing | 80% | 3 unit tests + 17 E2E specs + 5 k6 scenarios ✅ |
| Dark Mode | 95% | Semua halaman + komponen, minor touch-up mungkin ada |
| Report Toggle | 100% | Admin bisa active/inactive report, form inactive auto hide ✅ |
| **Total** | **~90%** | **10% tersisa untuk production hardening** |

---

## Sesi Diskusi Terbaru

### 8-9 Juni 2026 — Sesi 5: Audit Sprint + Final Push
- **Fokus**: Audit menyeluruh 91 isu, eksekusi 3 sprint, verifikasi Vercel
- **Sprint 1** (🔴 17 critical): Foto error banner, newsletter CSRF, like auth, notif IDOR, global-error.tsx, ErrorBoundary, skip-link, aria-label
- **Sprint 2** (🟠 6 high): Dark mode globals, spring-map loading states, `focus-visible`, `prefers-reduced-motion`, profile input class
- **Sprint 3** (🟠🟡 7 medium): Modal a11y, dark mode profile, print styles, multiselect fix, trust score auto-block, password minLength 6→8
- **Final fix**: Lint 0 error 0 warning, YouTube domain `i.ytimg.com`, MANUAL-TEST.md dengan 99 test case
- **Vercel verification**: Form submit 200 ✅, Admin approve 200 ✅, Points +25 ✅, Notification terkirim ✅
- **Status**: 30/91 isu diperbaiki, sisanya polish + manual test
- **Output**: AGENTS.md diperbarui, MANUAL-TEST.md baru
- **Commit**: `d624d53` — terpush ke `origin/master` ✅

### 1 Juni 2026 — Sesi 1: RAB & Infrastruktur
- **Diskusi**: Perencanaan migrasi Vercel+Supabase → Hostinger VPS + Cloudflare
- **Keputusan**: Migrasi NANTI, fokus bikin web 100% dulu di stack existing
- **Output**: `RAB.MD` — 3 skenario (Murah Rp131K, Best Value Rp373K, Powerful Rp838K)
- **Rekomendasi**: Hostinger KVM 4 (~Rp373K/bln) — DC Indonesia, latency rendah

### 1 Juni 2026 — Sesi 2: Bug Fixes & Dark Mode
- **Issue 1 — Form/Report Visibility**:
  - Tambah field `isActive` di Report model ✅
  - Public GET /api/reports: filter `isActive: true` + `form.isActive: true` ✅
  - Admin POST /api/admin/reports/[id]/toggle ✅
  - Admin UI: kolom Active dengan toggle button ✅
  - Migration SQL: `prisma/migrations/20260601_add_report_isActive/` ✅
- **Issue 2 — Role Badge Dark Mode**:
  - admin/users/page.tsx — chip dark mode ✅
  - admin/page.tsx — badge dark mode ✅
  - profile/page.tsx — chip dark mode ✅
- **Issue 3 — Auto-Scan Dark Mode (15+ file)**:
  - Status badges: reports, donations, feedback, admin dashboard, points, profile ✅
  - Chips: spring-map, content, review, report page, media types ✅
  - Banners: error, success, warning di semua halaman ✅
  - Form inputs: donate form dark mode ✅
  - Global CSS: hover states, text-slate, shadows ✅
- **Commit**: `a6a4dcf` — push ke `origin/master` ✅

### 6 Juni 2026 — Sesi 4: Database Audit & Perbaikan Critical
- **Issue 1 — Database tidak sinkron**:
  - 5 dari 6 migration belum diapply: comments, notifications, likes/comments, isActive, featuredPhotoId ✅
  - Tabel OfflineSession, TrackingPoint, ContentBlock ada di Prisma schema tapi tidak ada migration ✅ (di-sync via `prisma db push`)
  - **Tindakan**: `prisma migrate deploy` + `prisma db push` ✅
- **Issue 2 — Seed data belum dijalankan**:
  - Database kosong: tidak ada forms, courses, point rules, users, content ✅
  - Seed file (`prisma/seed.ts`) pakai `PrismaClient()` tanpa adapter — error ✅ (perbaiki pakai PrismaPg)
  - **Tindakan**: `npx prisma db seed` ✅ → 2 users, 5 forms, 3 courses, 14 point rules, 4 content blocks
- **Issue 3 — Offline sync photo upload gagal di Chrome Android**:
  - **Penyebab utama**: `canvas.toBlob()` di Chrome Android kadang produce blob dengan `type: ""` (empty string). Server nolak karena validasi MIME type.
  - **Penyebab kedua**: Blob dari IndexedDB bisa "detached" saat dikirim via FormData di Chrome Android.
  - **Penyebab ketiga**: Session cookie pakai `SameSite: "strict"` — tidak kompatibel dengan PWA standalone mode.
  - **Fix 1**: `compressImage()` → fallback jika blob type kosong, re-create dengan `new Blob([data], { type: "image/jpeg" })` ✅
  - **Fix 2**: `upload-photo.ts` → deteksi MIME via magic bytes (`detectMimeFromBuffer`), bukan dari `file.type` ✅
  - **Fix 3**: `offline-exit-sync.tsx` → re-create blob dari ArrayBuffer sebelum append ke FormData ✅
  - **Fix 4**: `lib/auth.ts` → `sameSite: "lax"` (dari "strict") untuk PWA compatibility ✅
- **Issue 4 — Admin form delete kembali setelah refresh**:
  - **Penyebab**: Soft-delete (`isActive=false`) tapi GET return semua form termasuk inactive. Frontend hapus dari state → refresh → GET balikin lagi.
  - **Fix 1**: `GET /api/admin/forms` → tambah query param `?status=active|inactive|all` ✅
  - **Fix 2**: `handleDelete()` → soft-delete update `isActive: false` di state (jangan dihapus) ✅
- **Issue 5 — Comments tidak persisten**:
  - **Penyebab**: `Comment` table dan migration belum diapply. API `/api/projects/[id]/comments` sudah benar pakai Prisma.
  - **Status**: ✅ Migration sudah diapply, Comment table sudah ada. Namun frontend belum ada komponen yang panggil API ini (comments belum diintegrasikan ke UI).
- **Yang Belum Dikerjakan**:
  1. **Xendit & Email keys real** — masih placeholder di .env
  2. **Sentry DSN** — masih empty
  3. **Supabase RLS** — apply policies dari `supabase/rls-policies.sql`
  4. **Seed data** — ✅ SEKARANG SUDAH DIISI
  5. **Migrasi ke VPS** — ditunda sampai web 100% stabil
  6. **Deploy ke Vercel** — sudah push ke GitHub, Vercel auto-deploy dari master
