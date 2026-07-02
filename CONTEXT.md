# 🌊 SpringHub — Project Context

> Panduan untuk setup di PC baru. Diperbarui: 2 Juli 2026.
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
| `admin@springhub.id` | `demo12345` | admin | 99.999 |
| `volunteer@springhub.id` | `vol12345` | volunteer | 24.168 |

---

## 2. Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend | Next.js 14 App Router + TypeScript strict + Tailwind | — |
| Map | Leaflet / react-leaflet (dynamic import, SSR false) | — |
| Database | PostgreSQL (via Prisma ORM) | Hostinger VPS, port 5432 |
| Auth | JWT (jose) + httpOnly cookie | `SameSite: lax` (PWA compatible) |
| Storage | Local filesystem (/data/uploads) | Foto dikompres 720p + watermark |
| Icons | lucide-react | — |
| Payment | Xendit (placeholder — belum active) | — |
| Queue | BullMQ + Redis | Email worker async |
| Proxy | Nginx + Cloudflare | SSL, rate limiting, caching |

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
# Database (VPS PostgreSQL — via Prisma)
DATABASE_URL="postgresql://springhub:SPRINGHUB_DB_PASS@postgres:5432/springhub"
DIRECT_URL="postgresql://springhub:SPRINGHUB_DB_PASS@postgres:5432/springhub"

# Auth
JWT_SECRET="<generate-ulang-jika-bocor>"

# Xendit (placeholder — menunggu client)
XENDIT_SECRET_KEY=""
XENDIT_WEBHOOK_TOKEN=""

# App
NEXT_PUBLIC_APP_URL="https://www.springhub.id"
NEXT_PUBLIC_APP_NAME="SpringHub"

# Email
EMAIL_API_KEY="<isi-dari-resend>"
```

---

## 5. Database State (per 2 Juli 2026)

**19 tabel — semua sudah dibuat:**
`Profile`, `Session`, `Spring`, `MapPointType`, `MapPointCategory`, `MapPoint`, `Report`, `ReportPhoto`, `Project`, `Donation`, `PointsLog`, `CoursesProgress`, `PointRule`, `Course`, `CourseModule`, `Form`, `FormField`, `OfflineSession`, `TrackingPoint`, `Feedback`, `Notification`, `Comment`, `ContentBlock`, `AppError`

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

## 7. API Routes (103 endpoints)

| Group | Routes |
|---|---|
| Auth (7) | `/api/auth/login|register|logout|me|forgot-password|reset-password|claim-guest` |
| Reports (4) | `/api/reports|/api/reports/[id]/photos|/api/reports/[id]/photos/[photoId]` |
| Donations (2) | `/api/donations/invoice|/api/donations/webhook` |
| Projects (3) | `/api/projects|/api/projects/[id]/comments|/api/projects/[id]/like` |
| Offline (4) | `/api/offline/session|/api/offline/sync` |
| Admin (25) | `/api/admin/users|reports|donations|projects|forms|courses|content|feedback|errors|export|download|point-rules|trust-scores|map-types|map-points` |
| Other (15) | `/api/leaderboard|health|csrf|newsletter|gallery|feedback|forms|courses|upload/presign|point-rules|content|notifications|user/profile|user/points|springs|dashboard|map-points|log/error` |

---

## 8. Bug History & Status

| # | Bug | Status | Fix |
|---|---|---|---|
| 1 | Offline photo upload gagal Chrome Android | ✅ Fixed 6 Juni | MIME magic bytes, blob re-create, SameSite lax |
| 2 | Admin form delete kembali setelah refresh | ✅ Fixed 6 Juni | `?status=` filter + soft-delete update state |
| 3 | Comments tidak persisten | ✅ Fixed 6 Juni | Migration diapply, API siap, UI belum |
| 4 | Database migration pending (5 file) | ✅ Fixed 6 Juni | `prisma migrate deploy` + `prisma db push` |
| 5 | Seed data kosong | ✅ Fixed 6 Juni | `prisma db seed` (fix adapter) |
| 6 | OG Image 404 | ✅ Fixed 1 Juli | Generated 60KB PNG via sharp |
| 7 | Offline sync end session bug | ✅ Fixed 1 Juli | Hapus auto-end session di sync |
| 8 | Tracking field mismatch | ✅ Fixed 1 Juli | Accept both old & new field names |
| 9 | CSRF/Session cookie Secure flag di HTTP | ✅ Fixed 2 Juli | Deteksi protocol dari x-forwarded-proto |
| 10 | E2E password mismatch | ✅ Fixed 2 Juli | admin123 → demo12345 di test helpers |
| 11 | CSP duplikasi nginx + next.config | ✅ Fixed 2 Juli | Hapus dari nginx, pertahankan di next.config |
| 12 | Docker certbot_data volume tidak terpakai | ✅ Fixed 2 Juli | Hapus volume |
| 13 | Worker missing depends_on postgres | ✅ Fixed 2 Juli | Tambah condition: service_healthy |
| 14 | MCP packages di runtime dependencies | ✅ Fixed 2 Juli | Pindah ke devDependencies |

---

## 9. Yang Belum (Backlog)

1. **Xendit real keys** — masih placeholder (menunggu client)
2. **Sentry DSN** — monitoring error (masih kosong)
3. **Comments UI** — frontend belum panggil API comments
4. **GPS tracking points sync** — data di IndexedDB belum dikirim ke server
5. **Secret management** — env vars masih hardcoded di file system, perlu secret manager
6. **E2E Firefox/WebKit** — masih ada fail di browser non-Chromium (rate limit/timeout)
7. **loading.tsx coverage** — 9/43 route sudah punya, sisanya inherit dari root

---

## 10. Ses Log

| Tanggal | Fokus | Keputusan |
|---|---|---|
| 15 Mei | Arsitektur, Stack, RAB | Vercel + Supabase, Hostinger opsi |
| 15 Mei Sesi 2 | Persistensi chat | Catat sesi di AGENTS.md |
| 15 Mei Sesi 3 | Audit lengkap | Temuan C1-C11, H1-H10, M1-M10, L1-L7 |
| 1 Juni | RAB, Bug Fixes, Dark Mode | Form visibility, dark mode 15+ file |
| 6 Juni | Database audit + offline sync | Migrasi + seed + fix upload Chrome Android |
| 1 Juli | Bugfix batch + E2E testing | 4 bugs fixed, Python test runner, Playwright 44/44 pass |
| 1 Juli (2) | Automated manual test | Python runner 71/72 pass, CSRF/Secure flag issue |
| 2 Juli | Infrastructure audit + fix | CSP duplikasi, Docker compose, MCP packages, loading.tsx, docs update |
