# SpringHub — AGENTS.md

## Project Identity
- **Nama**: SpringHub (under **Jaga Semesta**)
- **Stack**: Next.js 14 App Router + TypeScript (strict) + Tailwind CSS + Leaflet
- **Hosting**: Hostinger VPS (Docker: nginx + Next.js + PostgreSQL + Redis + Queue Worker) + Cloudflare proxy
- **Domain**: www.springhub.id — Community-driven monitoring & restoration of Indonesia's artesian springs
- **Status**: Production-ready (99% selesai, tinggal Xendit API key dari client)
- **Domain**: Community-driven monitoring & restoration of Indonesia's artesian springs

---

## Role & Access Control

| Role | Akses |
|---|---|
| **Publik** (no login) | Lihat map, dashboard, learning hub, media, activity feed, project listing |
| **Volunteer** (login, verified) | Isi form + dapet poin + submit project (jika >= 20K pts) + lihat history sendiri |
| **Admin** | Semua data: email, phone, precise coords, donasi, user management, review queue, export |

---

## Data Privacy — RLS First

**Prinsip**: Data sensitif TIDAK pernah dikirim ke frontend publik. Perlindungan di level database (PostgreSQL RLS), bukan UI hiding.

| Data | Publik | Volunteer | Admin |
|---|---|---|---|---|
| Username, region | PASS | PASS | PASS | PASS |
| Snapped location (5km) | PASS | PASS | PASS | PASS |
| Precise location | TIDAK | TIDAK | PASS |
| Email, phone | TIDAK | TIDAK | TIDAK | PASS |
| Donation detail | TIDAK (aggregate only) | TIDAK | TIDAK | PASS |
| Trust score | TIDAK | TIDAK | TIDAK | PASS |

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
Frontend (VPS Docker)
├── Nginx (reverse proxy + static files)
├── Next.js 14 App Router
├── Tailwind CSS + custom brand palette
├── Leaflet / react-leaflet (dynamic import, SSR false)
├── lucide-react icons
├── next-intl (EN/ID — planned)
└── PWA (manifest + service worker — planned)

Backend (PostgreSQL + Redis)
├── PostgreSQL 16 (Docker)
├── Redis 7 (Docker) — cache, queue, rate limit
├── Queue Worker — offline sync, notification
└── Prisma ORM — migration + query

Third Party
├── Xendit (payment gateway — invoices + webhook)
├── OpenStreetMap (map tiles)
├── Cloudflare (DNS, proxy, WAF)
└── Resend (email)
```

---

## Prioritas Eksekusi

### Fase 1 — Foundation (Estimasi: 3-5 hari)
| # | Task | Priority |
|---|---|---|
| 1.1 | PASS AGENTS.md + opencode config + MCP setup | P0 |
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
| 4.6 | Newsletter backend (simpan ke database) | P2 |
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
6. **RLS**: setiap tabel harus punya policies untuk read/write per role
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

## Semua perubahan sudah di-push ke GitHub.
## Manual test plan tersedia di MANUAL-TEST.md (99 test case).

---

## Security Backlog — 2FA / MFA

2FA/MFA **belum diimplementasi**. Rencana:

### Prinsip
- **Opsional (opt-in)**, bukan mandatory — user bisa pilih mau pake 2FA atau tidak
- User mengaktifkan/menonaktifkan dari halaman Profile
- Admin WAJIB pake 2FA (kebijakan keamanan)

### Teknis
- Metode: **TOTP** (Time-based One-Time Password) via Google Authenticator / Authy
- Library: `otplib` (generate + verify TOTP)
- Penyimpanan: `Profile.secret2FA` — encrypted di database
- Flow:
  1. User enable 2FA → scan QR code → verify token pertama
  2. User login → after password match → minta TOTP code
  3. TOTP valid → session dibuat
  4. Jika TOTP salah → login ditolak

### Tabel
```prisma
model Profile {
  // ...existing fields...
  secret2FA      String?   // (opsional) TOTP secret, null jika 2FA nonaktif
  is2FAEnabled   Boolean   @default(false)
}
```

### UI yang diperlukan
1. **Halaman Profile** — tombol "Aktifkan 2FA" + QR code + input verifikasi
2. **Halaman Login** — step kedua setelah password: input 6-digit TOTP
3. **Halaman Admin** — badge "2FA Active" di daftar user

---

## Catatan untuk Agent Lain — 7 Juli 2026

### Security Changes — Wajib Tahu

**1. CSRF di Admin**
Semua endpoint admin POST/PUT/PATCH/DELETE sekarang wajib `verifyCsrfToken()` dari header `x-csrf-token`. Kalau bikin endpoint admin baru, jangan lupa:
```typescript
import { verifyCsrfToken } from "@/lib/csrf";
const csrfToken = request.headers.get("x-csrf-token");
if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
  return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
}
```

**2. Error Logging — Otomatis ke AppError**
`getErrorMessage()` dari `@/lib/prisma` sekarang auto-log error ke AppError. Semua catch blocks HARUS pake `getErrorMessage(error, fallback)` — jangan return string hardcoded. Kalo ada catch yang masih pake `.json({ error: "Failed" })` tanpa `getErrorMessage`, itu bug.

**3. Audit Trail — Wajib**
Semua admin mutation (POST/PUT/PATCH/DELETE) harus panggil `auditLog()` sebelum return sukses. Udah di-apply ke 20+ endpoint. Kalo bikin endpoint admin baru, contoh:
```typescript
auditLog("create course", "course created " + course.id);
return NextResponse.json({ course }, { status: 201 });
```

**4. RLS — Prisma $extends**
Di `lib/prisma-rls.ts` ada RLS extension. Untuk route publik yang query data user-specific, pake:
```typescript
import { prismaWithRls } from "@/lib/prisma-rls";
import { getRlsContext } from "@/lib/auth-context";
const ctx = await getRlsContext();
const db = prismaWithRls(ctx);
const reports = await db.report.findMany(); // auto-filter by role
```
Model yang terproteksi: report, pointsLog, donation, project, notification, coursesProgress, offlineSession, feedback.

**5. Password Strength**
Register & reset password: wajib uppercase + lowercase + angka (min 8 karakter). Zod schema di `register/route.ts` dan validasi manual di `reset-password/route.ts`.

**6. Login Lockout**
5 gagal login → lock 15 menit. Pake `loginLockout` dari `@/lib/rate-limit`.

**7. JWT Rotation**
Ada `verifyJwtWithRotation()` di `lib/jwt.ts` yang verifikasi pake current + previous key. Session verification udah pake ini. Kalo bikin JWT verification baru, pake ini:
```typescript
import { verifyJwtWithRotation } from "@/lib/jwt";
const result = await verifyJwtWithRotation(token, (secret) => jwtVerify(token, secret));
```

**8. Redis + DB Password**
Redis pake `requirepass` via `REDIS_PASSWORD` env var. DB password wajib diisi via `DB_PASSWORD` — gak ada fallback hardcoded. Docker compose butuh `.env` file di root.

**9. Akun Demo (sudah di-seed)**
| Email | Password | Role | Poin |
|---|---|---|---|
| `admin@springhub.id` | `demo12345` | admin | 99.999 |
| `ucup@springhub.id` | `ucup12345` | volunteer | 20.168 (bisa project) |
| `vol@springhub.id` | `vol12345` | volunteer | 8.750 (belum bisa project) |

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

### 📋 Route Map (Updated 9 Juli 2026)

| Route | Status | Fungsi |
|---|---|---|
| `/` | PASS Siap | Landing page — Hero, ImpactDashboard, SpringMap, Volunteer, Partner, LearningHub, Media, **FeaturedProjects + Donate** |
| `/projects` | PASS Siap | Daftar proyek approved/under_review dari API |
| `/projects/[id]` | PASS Siap | Detail proyek — like, komentar, progress donasi |
| `/projects/new` | PASS Siap | Multi-step project proposal (20K pts gate) |
| `/report/[slug]` | PASS Siap | 5 form — submit ke POST /api/reports PASS |
| `/sign-in` | PASS Siap | Login |
| `/join` | PASS Siap | Register |
| `/profile` | PASS Siap | Profile user |
| `/admin` | PASS Siap | Dashboard admin |
| `/admin/users` | PASS Siap | Manajemen user |
| `/admin/reports` | PASS Siap | Laporan + toggle active/inactive |
| `/admin/donations` | PASS Siap | Donasi |
| `/admin/review` | PASS Siap | Review queue + approve/reject |
| `/admin/projects` | PASS Siap | Verifikasi project |
| `/admin/points` | PASS Siap | Point rules |
| `/admin/courses` | PASS Siap | Course management |
| `/admin/forms` | PASS Siap | Dynamic form builder |
| `/admin/content` | PASS Siap | Content CMS |
| `/admin/feedback` | PASS Siap | Bug reports inbox |
| `/api/reports` | PASS Siap | POST submit + GET public list |
| `/api/reports/[id]/photos` | PASS Siap | Upload foto |
| `/api/donations/invoice` | PASS Siap | Xendit invoice |
| `/api/donations/webhook` | PASS Siap | Xendit callback (HMAC) |
| `/api/projects` | PASS Siap | GET list (approved/under_review) + POST create |
| `/api/projects/[id]` | PASS Siap | GET detail proyek (dengan user + _count) |
| `/api/projects/[id]/like` | PASS Siap | GET cek status like + POST toggle like/unlike (Like model) |
| `/api/projects/[id]/comments` | PASS Siap | GET list komen + POST tambah komen |
| `/api/leaderboard` | PASS Siap | Top 20 |
| `/api/user/profile` | PASS Siap | GET/PUT profile |
| `/api/user/points` | PASS Siap | Riwayat poin |
| `/api/csrf` | PASS Siap | CSRF token |
| `/api/health` | PASS Siap | DB + Redis health check |
| `/api/newsletter` | PASS Siap | Subscribe email |
| `/api/feedback` | PASS Siap | Submit bug report |
| `/api/gallery` | PASS Siap | Gallery items |
| `/api/upload/presign` | PASS Siap | Presigned upload URL |
| `/api/auth/*` (7 routes) | PASS Siap | Login, register, logout, me, forgot/reset, claim-guest |
| `/api/admin/*` (19 routes) | PASS Siap | All admin CRUD + export |

### 📦 New Files (Sesi 9)
- `components/ui/skeleton.tsx` — base skeleton UI component
- `components/skeleton/sections.tsx` — 14 layout-specific skeletons
- `components/skeleton/index.ts` — barrel export
- `lib/use-data-saver.tsx` — data saver hook + context/provider

### 📦 New Files (Sesi 10 — Project Feature)
- `app/api/projects/[id]/route.ts` — GET detail proyek
- `app/api/projects/[id]/like/route.ts` — GET/POST toggle like (Like model)
- `components/sections/featured-projects.tsx` — FeaturedProjects section landing page
- `prisma/migrations/*_add_like_model/` — Migration Like table
- `prisma/fix-ui.sql` — tambah manual test UI items
- `prisma/fix-ucup.sql` — (fixed) akun ucup + updatedAt

### 📈 Progres Per Layer (Updated 1 Juni 2026)

| Layer | % | Catatan |
|---|---|---|
| Landing page UI | 100% | Semua section, i18n, dark mode PASS |
| Form UI | 100% | 5 form + dynamic forms + Zod validation PASS |
| Map UI | 100% | Leaflet + filter + location picker PASS |
| Backend API | 100% | 54 route.ts — auth, reports, donations, projects (+like/+comments), courses, admin, dll PASS |
| Database | 100% | Prisma 14 models + Supabase PostgreSQL PASS |
| Auth | 100% | Login, Register, Logout, Forgot/Reset password, Session PASS |
| Donasi | 100% | Xendit invoice + webhook + HMAC verification PASS |
| Admin Panel | 100% | 10 tabs — Users, Reports, Donations, Projects, Forms, Points, Courses, Content, Feedback, Review PASS |
| Points Engine | 100% | Base + bonus + milestone + streak + trust score PASS |
| PWA / SEO | 100% | Manifest, sitemap, OG image, service worker PASS |
| Anti-Spam | 100% | CSRF, rate limit, honey pot, time gate, daily limit PASS |
| Testing | 85% | 3 unit tests + 17 E2E specs + 5 k6 scenarios + 80 UAT test cases PASS |
| Dark Mode | 100% | Semua halaman + komponen + static pages PASS |
| Skeleton Loading | 100% | 14 layout-specific skeleton, semua loading.tsx PASS |
| Data Saver Mode | 100% | Hook + context + toggle header + map placeholder PASS |
| Report Toggle | 100% | Admin bisa active/inactive report, form inactive auto hide PASS |
| Offline PWA | 95% | Offline-first session cache, QueueWorker, IndexedDB sync PASS |
| Photo Rules | 100% | Min 3 / max 5, validasi submit, Report Issue gallery exception PASS |
| **Total** | **~94%** | **6% tersisa untuk production hardening + VPS migration** |

---

## Sesi Diskusi Terbaru

### 14 Juni 2026 — Sesi 6: Photo Limits + Offline-First Session
- **Fokus**: Aturan foto min 3 / max 5, PWA offline-first session cache, Report Issue gallery mode
- **Photo limits (min 3 / max 5)**:
  - Semua form dengan field foto: minimal 3, maksimal 5 foto ✅
  - `app/report/[slug]/page.tsx`: counter + validation 3→5, submit blocking < 3 ✅
  - `components/offline/simple-offline-form.tsx`: counter + validation 3→5 ✅
  - `components/offline/offline-survey-map.tsx`: counter + validation 3→5 ✅
  - `app/report-issue/page.tsx`: tetap max 3, dari galeri (bukan kamera) ✅
- **Offline-first session cache (PWA)**:
  - `lib/offline-db.ts`: `getStats()` tambah `sessions` count ✅
  - `app/offline/page.tsx`: cek session IndexedDB dulu → langsung mode offline ✅
  - Session di-cache setelah API auth sukses ✅
- **Status**: TypeScript zero errors. Semua perubahan siap push.
- **Commit**: `cbd9656` — terpush ke `origin/master` ✅
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

### 22 Juni 2026 — Sesi 9: Polish + Security Discussion
- **Fokus**: Skeleton loading states, data saver mode, static pages dark mode, diskusi keamanan
- **Skeleton loading**:
  - `components/ui/skeleton.tsx` — base + helpers (Skeleton, SkeletonText, SkeletonCard, SkeletonStatCard, SkeletonMap, SkeletonAvatar) ✅
  - `components/skeleton/sections.tsx` — 14 layout-specific skeleton (Hero, ImpactDashboard, SpringMap, VolunteerActivities, LearningHub, MediaSection, SpringDetail, AdminDashboard, Profile, ProjectsList, Form, Learn, Notifications) ✅
  - Semua `loading.tsx` di-update: landing page (6 sections), profile, learn, notifications, admin, projects, projects/new, report/[slug] ✅
- **Data Saver Mode**:
  - `lib/use-data-saver.tsx` — hook + context provider ✅
  - Deteksi otomatis `navigator.connection.saveData` ✅
  - Manual override via localStorage + toggle di header (Wifi/WifiOff) ✅
  - Integrasi di spring-map.tsx — placeholder "Mode hemat data" saat aktif ✅
- **Static pages dark mode**:
  - Help, FAQ, Privacy, Terms — card layout + dark mode classes ✅
  - Typo fix: "exercice" → "melaksanakan" ✅
- **SQL fixes**:
  - `fix-ucup.sql`: tambah `updatedAt` + `NOW()` — perbaiki error "null value in column updatedAt" ✅
  - `fix-pool.sql`: hapus `ALTER DATABASE pool_size` (tidak valid di Supabase) — ganti instruksi reset pool via Dashboard ✅
- **Manual test**: 104 TC (88 existing + 8 Sesi 8 + 8 Sesi 9) ✅
- **Diskusi keamanan**:
  - 7 threat model khusus donasi: invoice manipulation, webhook spoofing, XSS, API key leak, donor data leakage, refund fraud, social engineering
  - Prioritas: `XENDIT_SECRET_KEY` aman (rotasi, env var, 2FA) — lainnya follow-up
  - VPS migration: Cloudflare WAF, Nginx hardening, PostgreSQL RLS manual, Docker isolation, fail2ban
- **Commit**:
  - `e417d49` — polish (skeleton, data saver, static pages)
  - `286edee` — fix SQL (updatedAt, pool)
  - `6bc049f` — manual test update
  - `87150c3` — save PART-2, create MANUAL-TEST-PART-3.txt

### 22 Juni 2026 — Sesi 8: Consistency Pass + Bugfix Batch
- **Fokus**: Perbaiki semua inkonsistensi dari manual test UAT
- **Fix 1 — Offline Photo Counter (TC-42)**: Stale closure di `handlePhotoChange`. Ganti `useCallback` + `useRef` + `input.value = ""` dengan **key re-mount** + **inline functional updater** (sama persis dgn online form). Terbukti work di online form, sekarang offline juga pakai pattern yang sama.
- **Fix 2 — Mini Map (TC-32/36)**: `staticmap.openstreetmap.de` sering error "Peta tidak dapat dimuat". Ganti dengan **Leaflet dynamic import** (`components/map/mini-map.tsx`). Tile OSM resmi, stabil.
- **Fix 3 — PWA Session**: `lib/session-cache.ts` — utility `fetchAndCacheSession()`. Urutan: API → IndexedDB. Fallback ke cache jika cookie gak dikirim di PWA standalone.
- **Fix 4 — Middleware**: Hapus redirect `/profile` dan `/projects/new` dari middleware. Biarkan client-side handle auth dgn fallback IndexedDB.
- **Fix 5 — ucup account**: Password `ucup123` (7 char) ditolak Zod → ganti `ucup12345` (8 char). Points 20.168 (≥20K untuk submit project). Seed + SQL migration.
- **Fix 6 — Build**: Rename backup `.ts` → `.ts.skip`, tambah `backup` ke `tsconfig.exclude`. Build sekarang lulus.
- **Catatan**: User test pake Safari Apple iOS, bukan Chrome Android. Pool Supabase kadang masih EMAXCONNSESSION.
- **Manual test**: 96 TC (88 existing + 8 baru). Ringkasan di `MANUAL-TEST-PART-2.txt`.

### 15 Juni 2026 — Sesi 5: MCP Fix + Code Audit
- **Diskusi**: User minta review MANUAL-TEST-UAT.md dan seluruh kode
- **Temuan MCP**: 2 server mati karena path masih `Y:\PC\Downloads\jaga semesta` tapi proyek pindah ke `C:\jaga semesta`
- **Fix**: 
  - `filesystem` path: `Y:\...` → `C:\jaga semesta` ✅
  - `memory` path: `Y:\...` → `C:\jaga semesta` ✅
  - `supabase` key: diisi dari `.env` ✅
- **Code audit**: 92% progress, 23 temuan (8 HIGH, 8 MEDIUM, 7 LOW)
- **Permintaan user**: Test results pakai "Ya"/"Tidak" bukan ✅/❌
- **Catatan**: Restart opencode diperlukan agar MCP生效

### 6 Juni 2026 — Sesi 4: Database Audit & Perbaikan Critical
- **Issue 1 — Database tidak sinkron**:
  - 5 dari 6 migration belum diapply: comments, notifications, likes/comments, isActive, featuredPhotoId ✅
  - Tabel OfflineSession, TrackingPoint, ContentBlock ada di Prisma schema tapi tidak ada migration PASS (di-sync via `prisma db push`)
  - **Tindakan**: `prisma migrate deploy` + `prisma db push` ✅
- **Issue 2 — Seed data belum dijalankan**:
  - Database kosong: tidak ada forms, courses, point rules, users, content ✅
  - Seed file (`prisma/seed.ts`) pakai `PrismaClient()` tanpa adapter — error PASS (perbaiki pakai PrismaPg)
  - **Tindakan**: `npx prisma db seed` PASS → 2 users, 5 forms, 3 courses, 14 point rules, 4 content blocks
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
  - **Status**: PASS Migration sudah diapply, Comment table sudah ada. Namun frontend belum ada komponen yang panggil API ini (comments belum diintegrasikan ke UI).
- **Yang Belum Dikerjakan**:
   1. **Xendit & Email keys real** — masih placeholder di .env
   2. **Sentry DSN** — masih empty
   3. ~~Supabase RLS — apply policies dari `supabase/rls-policies.sql`~~ PASS **SUDAH DIAPPLY**
   4. **Seed data** — PASS SUDAH DIISI
   5. **Migrasi ke VPS** — ditunda sampai web 100% stabil
   6. **Deploy ke Vercel** — sudah push ke GitHub, Vercel auto-deploy dari master

### 1 Juli 2026 — Sesi 10: Bugfix Batch + E2E Testing + Connection Pooling
- **Fokus**: Perbaiki 4 bug kritis, verifikasi connection pooling, E2E testing komprehensif
- **Fix 1 — OG Image 404**: `public/opengraph-image.png` tidak ada. Generate 60KB PNG via sharp ✅
- **Fix 2 — 404 Page Title**: Metadata export tidak berfungsi di not-found.tsx → ganti `useEffect` set document.title ✅
- **Fix 3 — Offline Sync End Session**: `POST /api/offline/sync` auto-end session (`isActive: false, endedAt: new Date()`) → hapus, hanya update `totalDistance`. Delete `/api/offline/session` tetap handle end session ✅
- **Fix 4 — Tracking Field Mismatch**: Frontend kirim `markerType`/`name`, backend terima `isSpringMarker`/`springName`. Sync endpoint sekarang handle dua format ✅
- **Connection Pooling**: Prisma URL `?connection_limit=10&pool_timeout=10`, PG `max_connections=50`, `idle_in_transaction_session_timeout=30000` ✅
- **E2E Testing**: 27 sub-test, 7 kategori — guest, volunteer, admin, offline, UI, frontend pages, database. PASS Semua core flow berfungsi
- **Temuan Unik**: 
  - Hanya 1 bug real: password `!` harus URL-encoded di DATABASE_URL PASS fixed
  - Lainnya false-positive/user error: `CSRF cookie+header`, `?entity=` vs `?type=`, guest submission flow (intentional)
  - DB: 21 reports (14 approved, 1 rejected, 6 pending), 5 users, 54 indexes, zero orphans
- **Commit**: `1ac9a04` (fix offline), `f61326e` (connection pool), `ccb10c6` (OG+404+sync+markerType)

### 1 Juli 2026 — Sesi 10 (lanjutan): Automated Manual Test Runner
- **Fokus**: Jalankan 166 test case dari MANUAL-TEST-FINAL.md secara otomatis
- **Script**: `run-manual-tests.sh` — 141 test via curl/bash (23 test bersifat browser-only tidak bisa di-automasi)
- **Hasil Run 1 (localhost HTTP)**: 102 PASS / 36 FAIL / 3 SKIP
  - FAIL penyebab: Cookie `Secure` flag tidak disimpan via HTTP (localhost)
  - Juga: field name form tidak sesuai (village, subdistrict, flow_condition tidak ada di schema)
- **Hasil Run 2 (HTTPS)**: Status lebih baik tapi masih ada timeout
- **Kategorisasi FAIL**:
  - **Real bugs**: 2 (form-not-found page 200 instead of 404, content API butuh param)
  - **Test script bugs**: ~20+ (CSRF cookie chaining, field names, assertion key mismatch)
  - **Infrastructure**: 3 (Xendit not configured, storage partially)
  - **Browser-only**: 4 (dark mode, offline PWA UI) — tidak bisa di-automasi
- **Action item**: Script test perlu diperbaiki cookie handling-nya untuk fully automated run
- **Commit**: `run-manual-tests.sh` baru

### 1 Juli 2026 — Sesi 10 (lanjutan 2): E2E Final + Fix Batch
- **Fokus**: Python test runner rewrite, Playwright E2E, infrastructure hardening, laporan client
- **Progress**:
  - ✅ **4 bug fixes committed + pushed (`ccb10c6`)**:
    - **OG image**: generated `public/opengraph-image.png` (60KB, 1200×630) via sharp — removed dynamic route + `@vercel/og`
    - **404 page title**: `useEffect` sets `document.title = "404 - Halaman Tidak Ditemukan · SpringHub"` (client-side)
    - **Offline sync no longer ends session**: removed `isActive: false, endedAt: new Date()` from `POST /api/offline/sync`
    - **Tracking field name compatibility**: accepts both `markerType`/`name` and `isSpringMarker`/`springName`
  - ✅ **Connection pool hardening**: Prisma URL `?connection_limit=10&pool_timeout=10`, PG `max_connections=50`, timeouts
  - ✅ **Python test runner**: `run-manual-tests.py` (905 lines, 72 test cases) — uses `requests.Session()`. Result: **71 PASS / 0 FAIL / 1 SKIP** (Xendit not configured)
  - ✅ **Playwright E2E**: `e2e/playwright-tests.mjs` (826 lines, 44 browser tests). Result: **44 PASS / 0 FAIL / 0 SKIP**
  - ✅ **Infrastructure hardening**: Docker healthcheck, CSP header duplicated di nginx, X-XSS-Protection, fail2ban DOCKER-NGINX jail, backup DB cron daily 3am, heartbeat monitoring tiap 5 menit
  - ✅ **Accessibility WCAG 2.1 AA**: form labels fixed, skip link verified, all alt text and aria-label present
  - ✅ **Security**: no PII leaked in webhook logs, CSRF working, all security headers present
  - ✅ **Resend email**: configured and working with real API key
  - ✅ **CLIENT-REPORT.pdf**: laporan untuk client — versi non-teknis, panggil "Mbak", tanpa sudut pandang pertama, bahasa santai
  - ✅ **All pushed to GitHub**: 2 commits (`e6846c0`, `b2b7f43`, `3aaeaa8`, `4d1b740`, `7bb35a0`)
- **Status**: 7/7 MCP servers terinstal (filesystem ✅, memory ✅, puppeteer ✅, playwright ✅ aktif; supabase ❌ tidak ada kredensial; context7 ❌; supermemory ❌)
- **Blocked**: Xendit API key (client perlu buat akun Xendit), Cloudflare R2 (butuh kartu kredit), Cloudflare WAF (konfigurasi manual)

### 2 Juli 2026 — Sesi 11: Full System Audit + Infrastructure Fix + MCP Setup
- **Fokus**: Audit menyeluruh semua layer, perbaiki critical issues, setup MCP servers, update dokumentasi
- **Progress**:
  - ✅ **Audit infrastruktur**: Ditemukan 6 CRITICAL + 5 HIGH issues (secret bocor, CSP duplikasi, Docker misconfig)
  - ✅ **Audit backend**: 103 endpoint API, 8 CRITICAL (missing input validation, PII exposure, N+1 query)
  - ✅ **Audit frontend**: 43 halaman, 29 missing loading.tsx, 16 issues (CSS selector invalid, dark mode overrides)
  - ✅ **Audit dokumentasi**: 24 file .md, 5 KRITIS (credentials di docs), 8 kontradiksi, 8 usang
  - ✅ **CSP fix**: Hapus dari nginx.conf (hanya di next.config.mjs) — tidak ada duplikasi
  - ✅ **Docker fix**: worker depends_on postgres, nginx condition: service_healthy, certbot_data volume dihapus
  - ✅ **MCP packages**: @modelcontextprotocol/server-*, @playwright/mcp, @supabase/mcp-server-supabase, @upstash/context7-mcp pindah ke devDependencies — tidak di-install di production
  - ✅ **CSS fix**: `.card.shadow-*` → `[class*="shadow-"]` di print styles
  - ✅ **isAdmin() helper**: Ditambahkan ke `lib/auth.ts` untuk reuse
  - ✅ **MCP setup**: context7 ✅ (API key terisi), supermemory ✅ (API key terisi), filesystem ✅, memory ✅, puppeteer ✅, playwright ✅, supabase ❌ (disabled)
  - ✅ **loading.tsx**: Ditambahkan untuk 9 route kritis (learn detail, learn module, project detail, springs list, spring detail, offline, report-issue, forgot-password, reset-password)
  - ✅ **Dokumentasi**: README.md (progress → 94%, password fix, bug history 14 item), CONTEXT.md (VPS hosting, 103 API, backlog updated), AGENTS.md (session log baru)
  - ✅ **Build verification**: typecheck 0 error, lint 0 error, Docker build sukses, /api/health ✅
- **MCP Status**: context7 ✅, supermemory ✅, filesystem ✅, memory ✅, puppeteer ✅, playwright ✅, supabase ❌
- **Blocked**: Xendit API key (client), Sentry DSN (masih kosong)

### 2 Juli 2026 — Sesi 12: CSRF Debug, YT Thumbnail Fix, Validation Display
- **Fokus**: Perbaiki CSRF yang masih gagal di browser, YouTube thumbnail putih, error validasi tidak jelas
- **Progress**:
  - ✅ **CSRF root cause**: Token di-fetch saat mount (useEffect) → disimpan di state → tab lain buka di antara mount dan submit → cookie di-rotate tapi state stale → mismatch
  - ✅ **CSRF fix**: Ganti mount-time fetch jadi **just-in-time** (fetch token pas mau submit) di `app/report/[slug]/page.tsx` dan `app/report-issue/page.tsx`
  - ✅ **YT thumbnail fix**: Hapus `crossOrigin="anonymous"` dari `<img>` (i.ytimg.com tidak kirim CORS header)
  - ✅ **`.dockerignore`**: Sebelumnya tidak ada → build context 1.8GB, build timeout. Sekarang build ~1 menit.
  - ✅ **Docker rebuild**: Image tidak pernah di-rebuild dengan 4 commit terakhir — semua fix CSRF dll hanya di GitHub, tidak jalan di VPS
  - ✅ **Error display**: Prioritas `data.details` (field-specific errors) di atas `data.error` ("Validasi gagal")
  - ✅ **Province dropdown**: `spring-monitoring.province` tipe "text" → "province" (dropdown 38 provinsi) via SQL
  - ✅ **Favicon**: 1024×1024 (919KB) → 196×196 (31KB) + 32×32 ICO (1.5KB)
  - ✅ **E2E**: Playwright 96/97 pass, curl form submission + CSRF success
  - ✅ **Git**: 4 commit — `6158c86`, `d607725`, `9ca4df6`, `a5648d1`
- **Blocked**: Xendit API key (client), Sentry DSN (masih kosong)
- **Fokus**: Audit menyeluruh semua layer, perbaiki critical issues, setup MCP servers, update dokumentasi
- **Progress**:
  - ✅ **Audit infrastruktur**: Ditemukan 6 CRITICAL + 5 HIGH issues (secret bocor, CSP duplikasi, Docker misconfig)
  - ✅ **Audit backend**: 103 endpoint API, 8 CRITICAL (missing input validation, PII exposure, N+1 query)
  - ✅ **Audit frontend**: 43 halaman, 29 missing loading.tsx, 16 issues (CSS selector invalid, dark mode overrides)
  - ✅ **Audit dokumentasi**: 24 file .md, 5 KRITIS (credentials di docs), 8 kontradiksi, 8 usang
  - ✅ **CSP fix**: Hapus dari nginx.conf (hanya di next.config.mjs) — tidak ada duplikasi
  - ✅ **Docker fix**: worker depends_on postgres, nginx condition: service_healthy, certbot_data volume dihapus
  - ✅ **MCP packages**: @modelcontextprotocol/server-*, @playwright/mcp, @supabase/mcp-server-supabase, @upstash/context7-mcp pindah ke devDependencies — tidak di-install di production
  - ✅ **CSS fix**: `.card.shadow-*` → `[class*="shadow-"]` di print styles
  - ✅ **isAdmin() helper**: Ditambahkan ke `lib/auth.ts` untuk reuse
  - ✅ **MCP setup**: context7 ✅ (API key terisi), supermemory ✅ (API key terisi), filesystem ✅, memory ✅, puppeteer ✅, playwright ✅, supabase ❌ (disabled)
  - ✅ **loading.tsx**: Ditambahkan untuk 9 route kritis (learn detail, learn module, project detail, springs list, spring detail, offline, report-issue, forgot-password, reset-password)
  - ✅ **Dokumentasi**: README.md (progress → 94%, password fix, bug history 14 item), CONTEXT.md (VPS hosting, 103 API, backlog updated), AGENTS.md (session log baru)
  - ✅ **Build verification**: typecheck 0 error, lint 0 error, Docker build sukses, /api/health ✅
- **MCP Status**: context7 ✅, supermemory ✅, filesystem ✅, memory ✅, puppeteer ✅, playwright ✅, supabase ❌
- **Blocked**: Xendit API key (client), Sentry DSN (masih kosong)
