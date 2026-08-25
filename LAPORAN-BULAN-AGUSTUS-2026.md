# Laporan Bulan Agustus — SpringHub

**Periode:** 1 – 25 Agustus 2026
**Proyek:** SpringHub — Jaga Semesta (www.springhub.id)
**Penyusun:** Tim Teknis SpringHub — Ayatullah Reza
**Referensi laporan sebelumnya:** `LAPORAN-BULAN-JULI.pdf` (24 Juni–30 Juli), `CLIENT-REPORT.md`, `Laporan Pasar Bibit dan Billing`

---

## Ringkasan Eksekutif

Bulan Agustus fokus pada **hardening keamanan produksi, stabilitas data, dan komplitnya alur data** dari submit form sampai download foto. Tidak ada fitur baru besar — semua adalah perbaikan agar **produksi siap uji manual penuh tanpa bug baru**. Total **205 test manual (24 kategori)** sekarang lolos di produksi & staging.

Poin besar Agustus:
- **Staging & produksi di-patch CVE-2025-29927 (Next 14.2.35) → 15.5.23**, CSRF di 6 route auth, deps 7.9.1, Redis `noeviction`, worker 2 layanan.
- **Data Epicollect 199 report + 551 foto** sudah 100% di staging (23×1 + 176×3), diaktifkan **8 mata air asli** (staging 261→269, produksi 73→81) — 5 kosong + 24 dummy tetap pending.
- **Form `503 Column clientCorrelationId does not exist` di produksi — sudah fix** (kolom + index + PasswordResetToken + Donation UNIQUE + RLS 8 policy, ghost migrasi dihapus).
- **Next.js 15.5.23** (fix 2 advisory DoS), **P2 PWA** (auto-save ID, blob leak 5 file, logout, queue cap), **sanitasi & PII** (hapus `email` dari `springs/[id]` & `projects/[id]`).
- **Manual test 188→205** (+17 Test 24 Full Data Flow) dan **deploy produksi** `docker compose build web` Next 15 — health `healthy` staging+prod.

---

## Bagian 1 — Hardening & Staging (12–14 Agustus)

### Sesi 15 (12 Agu) — Input & Staging Deploy
| Area | Yang dikerjakan |
|---|---|
| Input hardening | 83 field string `lib/forms.ts` `.max(500)` (cerita 5000) |
| XSS course | DOMPurify 2 lapis server `app/api/courses/[slug]/route.ts` (jsdom tidak masuk bundle client, `serverComponentsExternalPackages`) — `<script>`, `onerror`, `javascript:` bersih |
| Bug | `lib/sanitize.ts` syntax, `await` di luar async (queue-worker), nginx-staging regex `{1,30}` |
| Test | 8 test gagal PRE-EXISTING → 37/37 hijau |
| Secrets | scan bersih, `playwright-report/` + `k6/` ke `.gitignore` |
| Seed guard | `prisma/seed.ts` destruktif → hanya jalan di DB kosong, wajib `SEED_FORCE=1` |
| Staging | stack paralel VPS `5433/6380/31760/8080`, restore `backups/springhub-20260812-0513.dump`, 10 migrasi baseline, `fix-orphan-reports` 0 klaster, health OK, nginx basic auth |
| Blocked | Xendit key, R2, wildcard DNS `*.staging.springhub.id` |

### Sesi 16 (12 Agu) — Modul Belajar
- `MODUL-BELAJAR.md` + `MODUL-BELAJAR.pdf` **461 halaman, 3.5MB**, 12 bab, 363 file ±48.500 baris, generator `scripts/generate-modul-belajar.mjs` (playwright + marked, `waitForTimeout 1500` biar tidak terpotong 11→461).

### Sesi 17 (14 Agu) — Audit Foto & Hardening via Staging
- **Foto:** QueueWorker `serverReportId` + retry per-siklus (`PHOTOS_PENDING` 30s), `clientCorrelationId` + `uploadPhotoWithCsrf`, hapus dedupe-check cacat, HEIC `ftyp` → pesan ramah, cap max 5, foto admin sekaligus + badge `⚠️ 0 foto`, hapus N+1.
- **Hardening:** CSRF 13 route, rate-limit projects/comments/like/courses, honeypot+time-gate, proposal 5MB whitelist, PII `map-points/[id]`, `projects/[id]`, `seedlings/[id]` admin-only, `approved` filter, middleware `api/admin/*` + CSP `unsafe-eval` hapus + `Cache-Control no-store`, `approve-all` transaction, `escapeHtml` email.
- **Seedling:** `POST /api/admin/seedlings/[id]/approve-request` dibuat (sebelumnya 404), `public/seedlings.html` dihapus.

---

## Bagian 2 — Security Deploy Staging & Produksi (19–25 Agustus)

### Sesi 18 (19 Agu) — CVE & CSRF & Data
- **Data:** Mass-approve staging 199/199 report, 551/551 foto, 189 spring active (total 261). 23 report 1-foto via `ALLOW_LOW_PHOTO_APPROVE` — di-revert total.
- **CVE-2025-29927:** Next 14.2.5→14.2.35 + blok `x-middleware-subrequest` `middleware.ts:56`.
- **CSRF auth:** `verifyCsrfToken()` di 6 route + 5 halaman (sign-in, join, forgot, reset, logout) just-in-time `fetch("/api/csrf")`.
- **Deps:** sharp 0.34.5→0.35.3, jose 6.2.9, prisma 7.9.1, `noeviction`, worker `image-worker` `redisConnectionFromUrl` (bug NOAUTH fix).
- **Tier donasi:** `tree seedling` Rp 20K dihapus `lib/xendit.ts` + `components/sections/donate.tsx`.
- **Deploy:** typecheck 0, lint 0, 37/37, build OK — staging `staging-web` + **produksi** `springhub-web` (restart nginx untuk DNS).

### Sesi 19–20 (24–25 Agu) — Aktivasi Data & P0–P2 Audit Fix **(fokus bulan ini, produksi)**

**Snapshot awal (24 Agu):**
- Staging: 473 report (450 approved, 5 pending, 18 rejected), 298 spring (261 active, 37 pending — termasuk `Fsdfesd23123` baru), 199 epicollect 551 foto lengkap (23×1 + 176×3), 128 approved 0-foto non-corr.
- Produksi: 269 report (249 approved, 1 pending `d1e6c9e8` UMBUL SAREN 3 foto, 19 rejected), 105 spring (73 active, 32 pending) — **migrasi 10 tertinggal**, `clientCorrelationId` hilang → form `503`.

**Yang dieksekusi (hanya staging dulu, produksi setelah ACC 25 Agu):**
1. **Backfill** `scripts/backfill-epicollect-photos.ts` — guard `DATABASE_URL includes staging`, allowlist `five.epicollect.net`, 15MB cap, throttle 120ms — dry-run **0 perlu** (551/551 sudah lengkap).
2. **Aktivasi** `scripts/activate-staging-data.ts` — backup 12M staging / 5.4M prod, approve 4 pending (staging, `--force` termasuk 2× hage 0-foto) + 1 pending prod (UMBUL SAREN), aktifkan **8 data asli**: Sumber Telaga, Belik Soka, Sumber Gempol, Sumber Taman, **Randu Alas (46 reports)**, Sumber Brantas, Sumber Maron, Mata Air Kalibayem — skip 5 kosong (Cipanas, Mata Air Ciburial, Sumber Umbul, Tirta Empul/Gangga) + 24 dummy (Monggo/Tester/The Logat/hage).
3. **Hasil:** Staging 261→**269** active (160 groups), Produksi 73→**81** active (81 groups), pending 0 (report) / 24-29 (spring).

**P0 batch (KRITIS) — commit `c7765a5`:**
- DB prod: hapus ghost `_prisma_migrations` `20260603_add_comments` NULL, buat `PasswordResetToken` + 3 index, fix `Donation.invoiceId '' → inv-*` + `UNIQUE Donation_invoiceId_key` + 5 index (`Report_status_createdAt` dll), enable RLS 8 policy `Report`/`Profile` (prod 0→8), tambah kolom `clientCorrelationId` manual → form `200 {success:true}`.
- Auth: `loginLockout` enforce sebelum `bcrypt` → `429 Akun terkunci ...` `app/api/auth/login/route.ts:56`.
- CSRF: `getJwtSecret()` per-request + `verifyJwtWithRotation` `lib/csrf.ts:33`, `app/api/csrf/route.ts:12` payload `{type:"csrf"}`.
- Middleware: `request.headers.has("x-middleware-subrequest")` `middleware.ts:56`.
- Secrets: `.env.example:54` `REDIS_PASSWORD` → `CHANGE_ME_STRONG_RANDOM`, `lib/auth.ts:8` hapus `const SECRET` cache.

**P1 batch (HIGH):** commit `71585ab`, `7f3d2fb`, `c7ccc2d`
- PII: hapus `email` dari `springs/[id]:72` & `projects/[id]:15`.
- Leak: `springs/bulk:33` tambah `status:"active"`.
- Rate-limit: `dashboard` 15 query + `springs/[id]` + `gallery` + `map-points` + `seedlings` (GET publicLimiter, POST apiLimiter) + `notifications` GET/POST (POST admin-only + email-bombing fix) + `user/profile PUT` + `offline/session` + `courses`.

**P2 batch (PWA & infra):** commit `f97c726`, `ae68878`, `497a40d`, `66eb817`
- Next **14.2.35 → 15.5.23** `package.json:39` + `next.config.mjs:20` `serverExternalPackages` + 35 route `params: Promise` + `await cookies()` `lib/auth.ts:64` — audit Next high 2→0.
- PWA: `use-auto-save` draftId mismatch + interval reset, `BlobPreview` helper 5 file (report, simple-offline-form, offline-survey-map, report-issue, projects/new) revoke leak, `site-header` logout `clearAllOfflineUserData`, `queue-worker` `MAX_RETRIES 3→20`.
- Compose: `docker-compose.yml:62` `DATABASE_URL` tambah `?connection_limit=10&pool_timeout=10`, `web/worker` `image:springhub-web` anti-drift.
- Frontend: `lib/sanitize.ts:10` g flag, `app/springs/[id]:494` alt foto, `lib/i18n.tsx:44` flash.

**Deploy produksi 25 Agu:** `docker compose build web` Next 15 (124s) → `up -d web worker nginx` → `Up 65s (healthy)` `Next 15.5.23`, `curl /api/health` healthy DB+Redis, `curl /api/springs` prod 81 / staging 269, `POST /api/reports` 200.

**Manual test:** `MANUAL-TEST-FINAL.md` **188→205** test (24 kategori, +17 **Test 24 Full Data Flow** submit→pending tidak muncul publik→approve→publik `snapped` tanpa PII→foto download 200→gallery→rate-limit 429→CSRF 403→export CSV).

---

## Bagian 3 — Kendala Tetap (belum berubah)

| Komponen | Status |
|---|---|
| **Xendit** | `XENDIT_SECRET_KEY=""`, `XENDIT_WEBHOOK_TOKEN=""` — backend invoice/webhook siap, butuh key dari dashboard Xendit client |
| **Cloudflare R2** | `S3_*=""` — fallback `/data/uploads` lokal via nginx `alias`, volume `uploads_data` 120M staging / 53M prod, backup harian DB 03:00 tapi uploads belum harian |
| **Sentry** | `NEXT_PUBLIC_SENTRY_DSN=""` — error hanya ke `AppError` DB via `lib/error-logger.ts` |
| **Data test** | 24 dummy pending (Monggo/Tester/The Logat/hage) + 5 spring kosong masih pending — menunggu instruksi hapus (kamu bilang nanti kasih tau) |

---

## Bagian 4 — Billing

### Billing Infrastruktur (bulanan, Hostinger)

| No | Layanan | Biaya |
|---|---|---|
| 1 | **Hostinger KVM 4** (4 vCPU, 8GB RAM, 200GB NVMe) + domain free 1 tahun | **Rp350.000 / bulan** |
| 2 | Cloudflare (CDN, SSL, DNS) | Rp0 |
| 3 | Cloudflare R2 (10GB pertama) | Rp0 |
| 4 | Resend (3.000 email/bln) | Rp0 |
| **TOTAL INFRA / BULAN** | | **Rp350.000** |

Dibayar langsung ke Hostinger (otomatis). Garansi 30 hari. Alternatif hemat IdCloudHost VPS 4 Rp199.000/bulan.

### Billing Pengembangan — Periode 1–25 Agustus 2026

| Item | Detail |
|---|---|
| **Nama** | Ayatullah Reza Chalid |
| **Peran** | Full-stack Developer SpringHub |
| **Periode** | 1 – 25 Agustus 2026 |
| **Rincian pekerjaan** | Lihat Bagian 1–2 di atas (staging deploy, Modul Belajar 461 hal, audit foto + hardening 14 route, CVE-2025-29927 & CSRF auth 6 route, deps upgrade, aktivasi data 8 springs staging+prod, P0–P2 hardening 26 temuan (DB ghost, lockout, CSRF rotation, RLS, PII, rate-limit 7 route, Next 15.5.23, PWA 5 file), manual test 205, deploy produksi Next 15) |
| **Total** | **Rp3.000.000** (Tiga Juta Rupiah) |
| **Bank** | BANK BRI — **359001035332531** a.n. **Ayatullah Reza Chalid** |

> Nilai mengikuti periode sebelumnya (24 Juni–30 Juli: Rp2.500.000 untuk refaktor 5 form v2.1 + 103 import) — Agustus lebih berat di security & infra, disesuaikan +Rp500.000.

**Cara bayar:** Transfer ke rekening di atas, konfirmasi via chat.

---

> **Terima kasih atas kerjasamanya.**
> SpringHub — Jaga Semesta — www.springhub.id

*Dibuat: 25 Agustus 2026*
*Oleh: Tim Teknis SpringHub*
