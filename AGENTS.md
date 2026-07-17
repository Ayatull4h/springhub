# SpringHub

Community-driven monitoring & restoration of Indonesia's artesian springs.

**Stack:** Next.js 14 App Router · TypeScript strict · Tailwind CSS 3.4 · Leaflet · PostgreSQL + Prisma 7.8 · Redis · Docker VPS

---

## Commands

| Action | Command |
|---|---|
| Dev | `npm run dev` (localhost:3000) |
| Build | `npm run build` (Next.js standalone output) |
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` (ignored during build) |
| Test (unit) | `npm test` (vitest, jsdom, `lib/**/*.test.ts`) |
| Test (E2E) | `npm run test:e2e` (Playwright in `e2e/`) |
| Seed DB | `npx prisma db seed` — 5 forms, 3 courses, 14 point rules, 4 content blocks |
| DB push | `npx prisma db push` (dev) |
| Migrate | `npx prisma migrate dev --name <name>` |
| Prisma generate | runs automatically on `postinstall` |

## Architecture

- **Pages:** `app/` — App Router, layout in `app/layout.tsx`, middleware in `middleware.ts`
- **Components:** `components/sections/` for landing page sections, `components/map/` for Leaflet, `components/offline/` for PWA
- **Domain logic:** `lib/` — forms, auth, geo, points, csrf, upload-photo, offline-db, i18n
- **Forms:** Single source of truth is `lib/forms.ts` (5 forms + Zod schemas) + optional DB-driven overrides via `Form`/`FormField` models
- **Map:** `react-leaflet` 4 — dynamic import, SSR disabled, LeafletMap in `components/map/leaflet-map.tsx`
- **i18n:** Custom context in `lib/i18n.tsx`, messages in `messages/{en,id}.json`
- **Configs:** `opencode.jsonc` (agents + MCP), `next.config.mjs` (CSP, images, security headers), `middleware.ts` (admin redirect + IP whitelist)

## Security Non-negotiables

1. **CSRF:** All state-changing endpoints must `verifyCsrfToken()` from `x-csrf-token` header. Token is fetched **just-in-time** (not cached on mount) to avoid stale-token mismatch. Offline QueueWorker bypasses with `x-queue-worker: true`.
2. **Admin endpoints** must check `isAdmin()` from `@/lib/auth` and call `auditLog()` before returning success.
3. **Error responses** must use `getErrorMessage(error, fallback)` from `@/lib/prisma` — never hardcoded strings.
4. **Point calculation** is server-only (`lib/points.ts`). Never trust client-sent points.
5. **Location privacy:** Precise coords stored (admin only), public sees 5km-snapped via `lib/geo.ts:snapToProtectionGrid()`.
6. **Password:** Min 8 chars, must include uppercase + lowercase + digit. bcrypt 12 rounds. Lockout after 5 failures (15 min).
7. **JWT rotation:** Use `verifyJwtWithRotation()` from `@/lib/jwt` for all token verification (supports current + previous key).
8. **RLS extension** in `lib/prisma-rls.ts` with `prismaWithRls(ctx)` for user-specific queries.
9. **Photo rules:** Min 3 / max 5 per photo field (except report-issue: max 3). MIME validated server-side via magic bytes. EXIF stripped, compressed to 720p.

## Key Patterns

- **Admin panel:** `/admin/*` pages use client components. API routes in `app/api/admin/*` gate with CSRF + `isAdmin()`.
- **Form submission:** Anti-spam layers: honeypot (hidden `_website`), time gate (<3s = bot), rate limit (5/day guest).
- **Notifications:** Model `Notification` exists — create on events (report approved, seedling request, etc.) via Prisma.
- **Docker build:** `output: "standalone"` in next.config.mjs. See `Dockerfile` + `docker-compose.yml`. CI in `.github/workflows/deploy.yml`.
- **Demo accounts:** `admin@springhub.id`/`demo12345` (admin, 99,999 pts), `vol@springhub.id`/`vol12345` (volunteer, 8,750 pts), `ucup@springhub.id`/`ucup12345` (volunteer, 20,168 pts).
- **Offline PWA:** IndexedDB wrapper in `lib/offline-db.ts` (10 object stores). QueueWorker auto-syncs every 10s.

## Route Index

| Route | Purpose |
|---|---|
| `/` | Landing page (hero, map, dashboard, volunteer, learning, donate) |
| `/report/[slug]` | Form submission (5 types: monitoring, restoration, trench, planting, seedling) |
| `/seedlings` | Seedling marketplace (UI only, no API yet) |
| `/profile` | User profile + points history + seedling nav |
| `/admin` | Dashboard + 10 management tabs |
| `/offline` | PWA offline mode |
| `/learn` | Courses |
| `/projects` | Project listing + proposal |
| `/sign-in`, `/join` | Auth |

## API Route Pattern

```typescript
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // 1. CSRF
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken)))
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    // 2. Auth
    const session = await getSession();
    if (!session || session.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // 3. Validate, mutate, auditLog()
    auditLog("action", "description");
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Gagal") }, { status: 500 });
  }
}
```

---

## Demo Accounts

| Email | Password | Role | Points |
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
- **Keputusan**: Setiap sesi dicatat di AGENTS.md
- **Keputusan**: Buka opencode dari folder `Y:\PC\Downloads\jaga semesta` agar konteks proyek langsung terbaca
- **Catatan**: User ingin fokus penuh ke project SpringHub ke depannya

### 15 Mei 2026 — Sesi 3 (Audit Lengkap)
- **Fokus**: Audit menyeluruh semua aspek web + store findings permanent di AGENTS.md

### 1 Juni 2026 — Sesi 1: RAB & Infrastruktur
- **Diskusi**: Perencanaan migrasi Vercel+Supabase → Hostinger VPS + Cloudflare
- **Keputusan**: Migrasi NANTI, fokus bikin web 100% dulu di stack existing
- **Output**: `RAB.MD` — 3 skenario (Murah Rp131K, Best Value Rp373K, Powerful Rp838K)
- **Rekomendasi**: Hostinger KVM 4 (~Rp373K/bln) — DC Indonesia, latency rendah

### 1 Juni 2026 — Sesi 2: Bug Fixes & Dark Mode
- **Issue 1 — Form/Report Visibility**: Tambah field `isActive` di Report model; public GET filter `isActive: true` + `form.isActive: true` ✅
- **Issue 2 — Role Badge Dark Mode**: admin/users, admin/page, profile ✅
- **Issue 3 — Auto-Scan Dark Mode (15+ file)**: Status badges, chips, banners, inputs, global CSS ✅
- **Commit**: `a6a4dcf`

### 6 Juni 2026 — Sesi 4: Database Audit & Perbaikan Critical
- **Issue 1 — Database tidak sinkron**: 5/6 migration belum diapply; `prisma migrate deploy` + `prisma db push` ✅
- **Issue 2 — Seed data belum dijalankan**: `npx prisma db seed` PASS → 2 users, 5 forms, 3 courses, 14 point rules, 4 content blocks ✅
- **Issue 3 — Offline sync photo upload gagal di Chrome Android**: Blob type empty/ detached + SameSite strict. Fix: fallback blob type, magic byte MIME detection, re-create blob from ArrayBuffer, sameSite "lax" ✅
- **Issue 4 — Admin form delete kembali setelah refresh**: Soft-delete `isActive=false`, GET param `?status=` ✅
- **Issue 5 — Comments tidak persisten**: Migration belum diapply PASS sudah
- **Yang Belum Dikerjakan**: Xendit & Email keys real, Sentry DSN, VPS migration

### 15 Juni 2026 — Sesi 5: MCP Fix + Code Audit
- **Temuan MCP**: 2 server mati karena path masih `Y:\...` tapi proyek pindah ke `C:\jaga semesta`. Fix path ✅
- **Code audit**: 92% progress, 23 temuan (8 HIGH, 8 MEDIUM, 7 LOW)
- **Catatan**: Restart opencode diperlukan agar MCP生效

### 22 Juni 2026 — Sesi 8: Consistency Pass + Bugfix Batch
- **Fix 1 — Offline Photo Counter**: Stale closure — ganti key re-mount + inline functional updater ✅
- **Fix 2 — Mini Map**: `staticmap.openstreetmap.de` sering error → Leaflet dynamic import ✅
- **Fix 3 — PWA Session**: `lib/session-cache.ts` — fetchAndCacheSession() ✅
- **Fix 4 — Middleware**: Hapus redirect `/profile` dan `/projects/new` ✅
- **Fix 5 — ucup account**: Password `ucup123` (7 char) ditolak Zod → ganti `ucup12345` ✅
- **Fix 6 — Build**: Rename backup `.ts` → `.ts.skip`, tambah `backup` ke tsconfig.exclude ✅
- **Catatan**: User test pake Safari Apple iOS, bukan Chrome Android

### 22 Juni 2026 — Sesi 9: Polish + Security Discussion
- **Skeleton loading**: `components/ui/skeleton.tsx` + 14 layout-specific skeletons + loading.tsx ✅
- **Data Saver Mode**: `lib/use-data-saver.tsx` — deteksi `navigator.connection.saveData` ✅
- **Static pages dark mode**: Help, FAQ, Privacy, Terms ✅
- **Diskusi keamanan**: 7 threat model donasi, VPS migration hardening ✅

### 1 Juli 2026 — Sesi 10: Bugfix Batch + E2E Testing + Connection Pooling
- **Fix 1 — OG Image**: generated `public/opengraph-image.png` (60KB) via sharp ✅
- **Fix 2 — 404 Page Title**: `useEffect` set document.title ✅
- **Fix 3 — Offline Sync End Session**: Hapus auto-end session ✅
- **Fix 4 — Tracking Field Mismatch**: Accept both `markerType`/`name` and `isSpringMarker`/`springName` ✅
- **Connection Pooling**: `?connection_limit=10&pool_timeout=10`, PG `max_connections=50` ✅
- **E2E Testing**: 27 sub-test, 7 kategori — PASS ✅
- **Temuan Unik**: Password `!` harus URL-encoded di DATABASE_URL
- **Commit**: `1ac9a04`, `f61326e`, `ccb10c6`

### 1 Juli 2026 — Sesi 10 (lanjutan): Automated Manual Test Runner
- **Script**: `run-manual-tests.sh` — 141 test via curl/bash ✅
- **Hasil Run 1 (localhost HTTP)**: 102 PASS / 36 FAIL / 3 SKIP (FAIL penyebab: Cookie Secure flag via HTTP)
- **Hasil Run 2 (HTTPS)**: Status lebih baik tapi masih ada timeout
- **Real bugs**: 2 (form-not-found page 200 instead of 404, content API butuh param)

### 1 Juli 2026 — Sesi 10 (lanjutan 2): E2E Final + Fix Batch
- **Python test runner**: `run-manual-tests.py` (905 lines, 72 test cases) — 71 PASS / 0 FAIL / 1 SKIP ✅
- **Playwright E2E**: `e2e/playwright-tests.mjs` (826 lines, 44 browser tests) — 44 PASS ✅
- **Infrastructure hardening**: Docker healthcheck, nginx CSP dedup, fail2ban, backup DB cron, heartbeat ✅
- **Accessibility WCAG 2.1 AA**: form labels, skip link, alt text ✅
- **Security**: no PII in webhook logs, CSRF working, all security headers present ✅
- **Resend email**: configured and working with real API key ✅
- **CLIENT-REPORT.pdf**: laporan untuk client ✅
- **Blocked**: Xendit API key (client), Cloudflare R2 (butuh kartu kredit)

### 2 Juli 2026 — Sesi 11: Full System Audit + Infrastructure Fix + MCP Setup
- **Audit**: 6 CRITICAL + 5 HIGH (secret bocor, CSP duplikasi, Docker misconfig) ✅
- **CSP fix**: Hapus dari nginx.conf (hanya di next.config.mjs) ✅
- **Docker fix**: worker depends_on postgres, nginx condition: service_healthy ✅
- **MCP packages**: pindah ke devDependencies ✅
- **isAdmin() helper**: Ditambahkan ke `lib/auth.ts` ✅
- **loading.tsx**: Ditambahkan untuk 9 route kritis ✅
- **Build verification**: typecheck 0 error, lint 0 error, Docker build sukses ✅

### 2 Juli 2026 — Sesi 12: CSRF Debug, YT Thumbnail Fix, Validation Display
- **CSRF root cause**: Token di-fetch saat mount → state stale. Fix: **just-in-time** fetch ✅
- **YT thumbnail fix**: Hapus `crossOrigin="anonymous"` dari `<img>` ✅
- **`.dockerignore`**: Build context 1.8GB → ~1 menit ✅
- **Error display**: Prioritas `data.details` di atas `data.error` ✅
- **Province dropdown**: `spring-monitoring.province` tipe "text" → "province" ✅
- **Favicon**: 1024px → 196px + 32px ICO ✅
- **E2E**: Playwright 96/97 pass ✅
- **Git**: 4 commit — `6158c86`, `d607725`, `9ca4df6`, `a5648d1`

### 15 Juli 2026 — Sesi 13: Seedling Marketplace UI
- **Fokus**: UI untuk sistem bibit 2 arah (marketplace) — masih dummy data, belum ada API
- **Progress**:
  - ✅ Marketplace grid (`public/seedlings.html`) — filter provinsi + search, kartu bibit, detail overlay
  - ✅ Bibitku tab — laporan bibit + permintaan masuk + tombol setujui/tolak/selesai
  - ✅ Permintaanku tab — status request dengan aksi sesuai status
  - ✅ Tombol offline pindah dari impact-dashboard ke spring-map (bawah Report Your Contribution)
  - ✅ Link marketplace + navigasi bibit di profile page
- **Status**: UI siap review. Data masih dummy. Backend (API + DB SeedlingRequest) belum dibuat.
- **Commit**: `30b983a`

### 17 Juli 2026 — Sesi 14: CSRF fix admin forms + AGENTS.md cleanup
- **CSRF Bug**: Admin form create/edit/hapus kena invalid CSRF — header `x-csrf-token` tidak dikirim.
  - `app/admin/forms/new/page.tsx` — semua fetch missing CSRF header ✅
  - `app/admin/forms/[id]/page.tsx` — semua fetch (save meta, add/edit/delete/reorder field) missing CSRF header ✅
- **AGENTS.md**: Dikompres dari 742 → ~200 baris. Buang backlog/fase usang, audit temuan (sudah fix), progres layer. Pertahankan sesi diskusi terbaru.
- **Seedling UI**: 4 file digabung jadi 1 `public/seedlings.html` dengan tab navigation.
- **Git conflict resolved**: Merge branch `master` ke `main`. 3 file conflict resolved.
- **Commit**: `308a5b8`
