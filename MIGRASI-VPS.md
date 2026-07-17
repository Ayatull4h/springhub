# MIGRASI VPS — SpringHub
## Supabase + Vercel → Self-Hosted VPS

**Tanggal**: 30 Juni 2026
**VPS**: Hostinger KVM 4 (Ubuntu 24.04, 4 CPU, 15GB RAM, 193GB SSD)
**IP**: 76.13.198.18
**Domain**: www.springhub.id

---

## 📋 Arsitektur Baru (VPS Self-Hosted)

```
Internet ──► Cloudflare (DNS + CDN + WAF)
                  │
          ┌───────┴───────┐
          │               │
      Port 80/443    Port 80/443
          │               │
      ┌───┴───────────────┴───┐
      │       Nginx           │ Reverse proxy + SSL + static files
      └───┬───────────────┬───┘
          │               │
  ┌───────┴───────┐ ┌─────┴──────┐
  │  Next.js App  │ │  uploads/  │
  │  (port 31759) │ │  (foto)    │
  └───────┬───────┘ └────────────┘
          │
  ┌───────┴───────┐
  │  PostgreSQL   │ PostGIS 16
  │  (port 5432)  │
  └───────────────┘
          │
  ┌───────┴───────┐
  │    Redis      │ Queue + cache
  │  (port 6379)  │
  └───────────────┘
```

---

## 🔄 Yang Berubah

### ✅ Database: Supabase PostgreSQL → Self-Hosted PostGIS
- **Sebelum**: `postgresql://postgres:xxx@xxx.pooler.supabase.com:5432/postgres`
- **Sesudah**: `postgresql://springhub:xxx@localhost:5432/springhub`
- Docker container: `postgis/postgis:16-3.4-alpine`
- Volume persistensi: `postgres_data`

### ✅ Storage: Supabase Storage → Local Filesystem + Nginx
- **Sebelum**: `https://xxx.supabase.co/storage/v1/object/public/photos/xxx`
- **Sesudah**: `https://springhub.id/uploads/xxx`
- File disimpan di Docker volume `uploads_data`
- Nginx serve static files langsung dari `/data/uploads/`
- EXIF stripping + watermark tetap dipertahankan

### ✅ Hosting: Vercel → Docker + Nginx
- **Sebelum**: Vercel serverless (cold start, 30s max duration)
- **Sesudah**: Node.js 20 langsung di Docker (no cold start)
- Port internal: **31759** (randomized)
- Nginx reverse proxy + SSL termination

### ✅ Auth: Custom JWT (Tidak berubah)
- Sudah pakai bcryptjs + jose (JWT) — tidak dependen ke Supabase Auth
- Session di httpOnly cookies
- Tidak perlu perubahan

### ✅ Environment: .env baru untuk VPS
- Supabase env vars dihapus/dikosongkan
- Database指向 localhost
- App URL指向 springhub.id

### ❌ Yang Di-disable / Dihapus
| Komponen | Alasan |
|---|---|
| Supabase Auth | Sudah pakai custom JWT |
| Supabase Storage | Ganti local filesystem |
| Supabase MCP | Tidak perlu lagi |
| RLS Policies | Sudah tidak relevan (single DB, app-level auth) |
| vercel.json | File konfigurasi Vercel |
| Edge runtime (OG image) | Ganti ke Node.js native |

---

## 📦 Stack VPS Final

| Layer | Teknologi | Port |
|---|---|---|
| Reverse Proxy | Nginx (Docker) | 80/443 → 31759 |
| App Server | Next.js 14 (Node 20, Docker) | 31759 |
| Database | PostgreSQL 16 + PostGIS (Docker) | 5432 |
| Cache/Queue | Redis 7 (Docker) | 6379 |
| File Storage | Local filesystem (Docker volume) | via Nginx |
| Monitoring | Sentry (optional) | — |
| SSL | Let's Encrypt (Certbot) | 443 |
| DNS | Cloudflare | — |

---

## 🔐 Keamanan

### Firewall (UFW)
```
Status: active
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere (SSH)
80/tcp                     ALLOW       Anywhere (HTTP)
443/tcp                    ALLOW       Anywhere (HTTPS)
22/tcp (v6)                ALLOW       Anywhere (v6)
80/tcp (v6)                ALLOW       Anywhere (v6)
443/tcp (v6)               ALLOW       Anywhere (v6)
```

### Fail2ban
- SSH protection: 5 failed attempts → ban 10 menit
- Nginx protection: rate limit + bad bot blocking

### Docker Security
- Non-root user (nextjs) di container
- Volume terisolasi untuk DB + uploads
- Network internal (tidak expose port ke publik kecuali Nginx)

### Nginx Security Headers
- HSTS (max-age=2 years, includeSubDomains, preload)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: restricted

---

## 🚀 Langkah Eksekusi

### Phase 1: File Configuration ✅ (SELESAI)
- [x] Buat `.env` baru
- [x] Update `lib/env.ts` — Supabase jadi optional
- [x] Update `opencode.json` — fix paths
- [x] Update URL references
- [x] Rewrite storage layer (Supabase → local)
- [x] Update nginx.conf + docker-compose
- [x] Update next.config.mjs

### Phase 2: Infrastructure Setup
- [ ] `npm install` — install semua dependencies
- [ ] `ufw enable` — firewall
- [ ] `docker compose up -d postgres redis` — start DB
- [ ] `npx prisma migrate deploy` — schema
- [ ] `npx prisma db seed` — seed data
- [ ] `docker compose up -d` — start semua service

### Phase 3: SSL + Domain
- [ ] Setup Cloudflare DNS (A record → 76.13.198.18)
- [ ] `certbot --nginx -d springhub.id -d www.springhub.id`
- [ ] Auto-renew certbot cron job

### Phase 4: Production Go-Live
- [ ] Build Next.js (`npm run build`)
- [ ] Start full stack
- [ ] Test all features
- [ ] Monitor logs

---

## 📊 Perbandingan Biaya

| Service | Sebelum (Vercel + Supabase) | Sesudah (VPS) |
|---|---|---|
| Hosting | Vercel Hobby (gratis) | Hostinger KVM 4 (Rp373K/bln) |
| Database | Supabase Free (0-2GB) | Included in VPS |
| Storage | Supabase Storage (1GB free) | Included in VPS (189GB) |
| SSL | Vercel auto | Let's Encrypt (gratis) |
| CDN | Vercel Edge | Cloudflare (gratis) |
| Auth | Custom JWT | Custom JWT (sama) |
| **Total** | **±Rp0/bln** | **Rp373K/bln** |

---

## ⚠️ Catatan Penting

1. **Backup DB**: Setup cron job untuk pg_dump harian
2. **Monitoring**: Aktifkan Sentry atau alternatif
3. **Updates**: Schedule rutin untuk `apt update && apt upgrade`
4. **Scaling**: Jika traffic naik, upgrade VPS atau tambah load balancer
5. **Rollback**: Selalu backup sebelum perubahan besar
