# 🌊 SpringHub — Project Context

> Panduan untuk setup di PC baru. Dibuat: 6 Juni 2026.
> Baca ini DULU sebelum ngoding.

---

## 1. Quick Start (PC Baru)

```bash
git clone <repo-url> springhub
cd springhub
npm install
cp .env.example .env   # isi manual (lihat section 4)
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

**Akun test:**
| Email | Password | Role | Poin |
|---|---|---|---|
| `admin@test.com` | `admin123` | admin | 99.999 |
| `volunteer@test.com` | `vol12345` | volunteer | 24.168 |

---

## 2. Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend | Next.js 14 App Router + TypeScript strict + Tailwind | — |
| Map | Leaflet / react-leaflet (dynamic import, SSR false) | — |
| Database | Supabase PostgreSQL (via Prisma ORM) | Pooler: `pooler.supabase.com` |
| Auth | JWT (jose) + httpOnly cookie | `SameSite: lax` (PWA compatible) |
| Storage | Supabase Storage (bucket: `photos`) | Foto dikompres 720p + watermark |
| Icons | lucide-react | — |
| Payment | Xendit (placeholder — belum active) | — |

---

## 3. Agent System (opencode.json)

| Agent | Mode | Fungsi |
|---|---|---|
| `springhub-plan` | primary | Plan mode, read-only, arsitektur |
| `springhub-build` | primary | Build mode, implementasi kode |
| `springhub-db` | subagent | Database schema + RLS + migration |
| `springhub-form` | subagent | Form API + validasi + anti-spam |
| `springhub-donate` | subagent | Xendit integration + payment |
| `springhub-admin` | subagent | Admin panel + user management |

---

## 4. Environment Variables (.env)

```env
# Database (Supabase Postgres — via Prisma)
DATABASE_URL="postgresql://postgres.bhelvywlvwlqmvyblwmn:jagasemesta001@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.bhelvywlvwlqmvyblwmn:jagasemesta001@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Auth
JWT_SECRET="58a9b0a476dc873fa8c1b1facf6d6fa0cdee9a0f04f9b6b9fce666c02b92"
NEXT_PUBLIC_SUPABASE_URL="https://bhelvywlvwlqmvyblwmn.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_pefFmwGmMQPCRsQsYf60pw_Dc4Htng8"

# Xendit (placeholder)
XENDIT_SECRET_KEY=""
XENDIT_WEBHOOK_TOKEN=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="SpringHub"
```

---

## 5. Database State (per 6 Juni 2026)

**19 tabel — semua sudah dibuat:**
`Profile`, `Session`, `Report`, `ReportPhoto`, `Project`, `Donation`, `PointsLog`, `CoursesProgress`, `PointRule`, `Course`, `CourseModule`, `Form`, `FormField`, `OfflineSession`, `TrackingPoint`, `Feedback`, `Notification`, `Comment`, `ContentBlock`

**Seed data sudah diisi:**
- 2 users (admin + volunteer)
- 5 form definitions
- 3 courses (10 modules total)
- 14 point rules
- 4 content blocks (media)

**Migration history:**
```
20260519_init_supabase      ✅ Applied
20260531_add_featured_photo ✅ Applied
20260601_add_report_isActive ✅ Applied
20260603_add_comments       ✅ Applied
20260603_add_likes_comments ✅ Applied
20260603_add_notifications  ✅ Applied
```

---

## 6. Arsitektur Data Flow

```
Browser (Client)
  │
  ├── IndexedDB "springhub-offline"
  │     └── pending-reports, photo-blobs, tracking-points, form-definitions, dll
  │
  ├── Service Worker (sw.js)
  │     └── 4 caches: STATIC, PAGES, TILES, ASSETS
  │     └── Network-only untuk /api/*
  │
  ├── React Pages → fetch("/api/...") → Next.js API Route
  │     └── Semua API panggil Prisma → Supabase PostgreSQL
  │
  └── Offline Sync
        └── form disimpan ke IndexedDB → saat online: POST /api/reports
        └── foto dikompres (canvas 720p) → IndexedDB → POST /api/reports/[id]/photos
        └── GPS tracking points → IndexedDB → (belum di-sync ke server)
```

---

## 7. API Routes (52 endpoints)

| Group | Routes |
|---|---|
| Auth | `/api/auth/login|register|logout|me|forgot-password|reset-password|claim-guest` |
| Reports | `/api/reports|/api/reports/[id]/photos` |
| Donations | `/api/donations/invoice|/api/donations/webhook` |
| Projects | `/api/projects|/api/projects/[id]/comments|/api/projects/[id]/like` |
| Offline | `/api/offline/session|/api/offline/sync` |
| Admin | `/api/admin/users|reports|donations|projects|forms|courses|content|feedback|export|download|point-rules` |
| Other | `/api/leaderboard|health|csrf|newsletter|gallery|feedback|forms|courses|upload/presign|point-rules|content|notifications|user/profile|user/points` |

---

## 8. Bug History & Status

| # | Bug | Status | Fix |
|---|---|---|---|
| 1 | Offline photo upload gagal Chrome Android | ✅ Fixed 6 Juni | MIME magic bytes, blob re-create, SameSite lax |
| 2 | Admin form delete kembali setelah refresh | ✅ Fixed 6 Juni | `?status=` filter + soft-delete update state |
| 3 | Comments tidak persisten | ✅ Fixed 6 Juni | Migration diapply, API siap, UI belum |
| 4 | Database migration pending (5 file) | ✅ Fixed 6 Juni | `prisma migrate deploy` + `prisma db push` |
| 5 | Seed data kosong | ✅ Fixed 6 Juni | `prisma db seed` (fix adapter) |

---

## 9. Yang Belum (Backlog)

1. **Xendit real keys** — masih placeholder
2. **Sentry DSN** — monitoring error
3. **Supabase RLS policies** — `supabase/rls-policies.sql` perlu di-run
4. **Comments UI** — frontend belum panggil API comments
5. **GPS tracking points sync** — data di IndexedDB belum dikirim ke server
6. **Testing** — 0 test file (perlu Playwright/E2E)
7. **Migrasi ke VPS** — masih di Vercel + Supabase free tier

---

## 10. Ses Log

| Tanggal | Fokus | Keputusan |
|---|---|---|
| 15 Mei | Arsitektur, Stack, RAB | Vercel + Supabase, Hostinger opsi |
| 15 Mei Sesi 2 | Persistensi chat | Catat sesi di AGENTS.md |
| 15 Mei Sesi 3 | Audit lengkap | Temuan C1-C11, H1-H10, M1-M10, L1-L7 |
| 1 Juni | RAB, Bug Fixes, Dark Mode | Form visibility, dark mode 15+ file |
| 6 Juni | Database audit + offline sync | Migrasi + seed + fix upload Chrome Android |
