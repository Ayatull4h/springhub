# SESUDAH — Ringkas, Manusiawi, Aman (6 lapis terpisah)

**Aturan:** 1 file tidak harus 200 baris, boleh lebih — yang penting 1 konsep = 1 file pendek.

```
config/
  env.ts              → baca 1x: DATABASE_URL, JWT, XENDIT, S3, RATE_LIMIT dari env (staging: 5433)
  database.ts         → getPool() pgbouncer + connection_limit=3
middlewares/
  guard.ts (50 baris) → CSRF + isAdmin + rateLimit + PII-select + auditLog (1 tempat)
routes/
  reports.route.ts (5 baris) → POST /api/reports → controller.create
controllers/
  reportController.ts (20 baris) → guard(req) → service.create
schemas/
  report.schema.ts (30 baris) → Zod 83 field .max(500) + phoneRegex
services/
  reportService.ts (50 baris) → prisma + clientCorrelationId + points
  photoService.ts (30 baris) → magic bytes + sharp 720p + EXIF strip
utils/
  geo.ts, photo-url.ts (20 baris)
```

**Efek staging (5433) vs produksi (5432) terisolasi:**
- `DATABASE_URL` staging `...@postgres:5432/springhub_staging` vs prod `...@postgres:5432/springhub` — beda DB, beda `REDIS_PASSWORD`, beda `JWT_SECRET` di `env_file` (`.env.staging` vs `.env.production`), tidak hardcode di `.ts`.
- Ganti `ADMIN_IPS` cukup `config/env.ts` + `docker restart staging-web` 8 detik, tidak buka 95 file.

**Total sesudah:** `app+lib` ~14.000 baris (-49%, hemat 13.500 baris), UI `components` tetap 9.531 baris.
