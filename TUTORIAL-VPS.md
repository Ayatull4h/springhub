# TUTORIAL VPS — SpringHub
## Panduan Lengkap Setup, Akses & Pengelolaan

**Tanggal**: 30 Juni 2026
**VPS**: Hostinger KVM 4 (Ubuntu 24.04, 4 CPU, 15GB RAM, 193GB SSD)
**IP Publik**: `76.13.198.18`
**Domain**: `www.springhub.id`
**App Port**: `31759` (internal, tidak暴露 ke publik)

---

## 📑 Daftar Isi

1. [Akses Web](#-1-akses-web)
2. [Akses Server (SSH)](#-2-akses-server-ssh)
3. [Arsitektur Sistem](#-3-arsitektur-sistem)
4. [Manajemen Docker](#-4-manajemen-docker)
5. [Database (PostgreSQL)](#-5-database-postgresql)
6. [Logs & Monitoring](#-6-logs--monitoring)
7. [File Uploads](#-7-file-uploads)
8. [Firewall & Keamanan](#-8-firewall--keamanan)
9. [Cara Update / Redeploy](#-9-cara-update--redeploy)
10. [Cara Backup & Restore](#-10-cara-backup--restore)
11. [Yang Harus Dilakukan Selanjutnya](#-11-yang-harus-dilakukan-selanjutnya)
12. [Diagram Arsitektur Lengkap](#-12-diagram-arsitektur-lengkap)
13. [Referensi File Penting](#-13-referensi-file-penting)

---

## 🌐 1. Akses Web

### Link yang Bisa Diakses SEKARANG:

| Link | Keterangan | Status |
|---|---|---|
| **http://76.13.198.18** | Landing page (redirect ke HTTPS) | ✅ **AKTIF** |
| **http://76.13.198.18/api/health** | Health check API | ✅ `{"status":"healthy"}` |
| **http://76.13.198.18/api/springs** | Data mata air | ✅ (masih kosong) |
| **https://www.springhub.id** | Domain utama | ⏳ Tunggu DNS |

### Cara Akses:

**Via Browser** → buka `http://76.13.198.18`
- Akan redirect otomatis ke HTTPS
- Muncul peringatan SSL (karena self-signed cert) → klik **Advanced → Proceed**
- Kenapa? Karena SSL cert masih self-signed (belum ada domain resmi)

**Via API** → `curl http://76.13.198.18/api/health`
```json
{"status":"healthy","checks":{"database":"ok","redis":"ok"}}
```

---

## 🔑 2. Akses Server (SSH)

```bash
ssh root@76.13.198.18
# Password: [password VPS kamu]
```

Semua file project ada di: `/root/springhub/`

```bash
cd /root/springhub
ls -la
```

---

## 🏗️ 3. Arsitektur Sistem

### Container yang Berjalan:

```
┌─ User ──────────────────────────────────────┐
│  Browser / API Client                        │
└────────────────────┬────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │    UFW       │ Firewall: hanya 22,80,443
              │  Firewall    │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │    Nginx     │ Port 80 → redirect ke 443
              │  (Docker)    │ Port 443 → proxy ke web:31759
              └──────┬───────┘
                     │
              ┌──────┴───────┐
              │  Next.js App │ Port 31759 (internal)
              │  (Docker)    │
              └──────┬───────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │PostgreSQL│ │  Redis   │ │ Uploads  │
  │ Port 5432│ │ Port 6379│ │ /data/   │
  │(internal)│ │(internal)│ │  uploads/│
  └──────────┘ └──────────┘ └──────────┘
```

### 5 Container:

| Container | Image | Fungsi | Port |
|---|---|---|---|
| `postgres` | `postgis/postgis:16` | Database utama | `127.0.0.1:5432` |
| `redis` | `redis:7-alpine` | Cache + Queue | `127.0.0.1:6379` |
| `web` | `springhub-web` | Next.js App | `127.0.0.1:31759` |
| `worker` | `springhub-worker` | Background jobs (email) | — |
| `nginx` | `nginx:alpine` | Reverse proxy | `0.0.0.0:80,443` |

---

## 🐳 4. Manajemen Docker

Semua perintah dijalankan dari folder project:

```bash
cd /root/springhub
```

### Lihat status container:
```bash
docker compose ps
```

### Lihat logs:
```bash
# Semua container
docker compose logs --tail 50

# Container tertentu
docker compose logs web --tail 50
docker compose logs postgres --tail 20
docker compose logs nginx --tail 20
```

### Restart service:
```bash
# Restart semua
docker compose restart

# Restart satu service
docker compose restart web
```

### Stop semua:
```bash
docker compose down
```

### Start semua:
```bash
docker compose up -d
```

### Rebuild & start (setelah update kode):
```bash
docker compose build web
docker compose up -d
```

---

## 🗄️ 5. Database (PostgreSQL)

### Koneksi dari dalam VPS:
```bash
# Langsung ke container
docker compose exec postgres psql -U springhub -d springhub

# Via psql (harus install dulu: apt install postgresql-client)
psql -h localhost -U springhub -d springhub
# Password: SpringHub2026!
```

### Prisma Commands:
```bash
cd /root/springhub

# Generate Prisma client
npx prisma generate

# Lihat schema
npx prisma studio

# Push schema (tanpa migration)
npx prisma db push

# Seed data
npx prisma db seed
```

### Tabel Utama (dari Prisma schema):
```
Profile, Session, Spring, Report, ReportPhoto
Project, Donation, PointsLog, PointRule
Course, CourseModule, CoursesProgress
Form, FormField, OfflineSession, TrackingPoint
Feedback, Notification, Comment, ContentBlock
```

---

## 📋 6. Logs & Monitoring

### Health Check (public):
```bash
curl http://76.13.198.18/api/health
# {"status":"healthy","checks":{"database":"ok","redis":"ok"}}
```

### Nginx access log:
```bash
docker compose exec nginx cat /var/log/nginx/access.log | tail -20
```

### Nginx error log:
```bash
docker compose exec nginx cat /var/log/nginx/error.log | tail -20
```

### Next.js app log:
```bash
docker compose logs web --tail 50 -f
# -f = follow (live streaming)
```

### System resources:
```bash
htop              # CPU & RAM real-time
df -h             # Disk usage
docker stats      # Container resource usage
```

---

## 📁 7. File Uploads

Semua foto yang diupload user disimpan di:

```bash
# Lokasi di host VPS:
ls -la /data/uploads/

# Di dalam container web (sama):
/data/uploads/

# Diakses via URL:
https://springhub.id/uploads/reports/{reportId}/{filename}.jpg
```

### Cara cek jumlah upload:
```bash
find /data/uploads -type f | wc -l
du -sh /data/uploads/
```

---

## 🔥 8. Firewall & Keamanan

### Status Firewall (UFW):
```bash
ufw status verbose
# Output:
# Status: active
# 22/tcp  ALLOW IN  # SSH
# 80/tcp  ALLOW IN  # HTTP
# 443/tcp ALLOW IN  # HTTPS
# (semua port lain ditutup)
```

### Fail2ban Status:
```bash
fail2ban-client status
# 2 jails: sshd, nginx-http-auth

fail2ban-client status sshd
# Lihat IP yang diban
```

### Nginx Security Headers (otomatis):
- `Strict-Transport-Security` — HSTS (2 tahun)
- `X-Frame-Options: DENY` — Anti clickjacking
- `X-Content-Type-Options: nosniff` — Anti MIME sniffing
- `Permissions-Policy` — Batasi akses kamera/geolocation

### Jika ingin menambah aturan firewall:
```bash
# Contoh: allow IP tertentu
ufw allow from 192.168.1.100 to any port 22

# Contoh: block IP
ufw deny from 1.2.3.4

# Contoh: hapus aturan
ufw delete allow 80/tcp
```

---

## 🔄 9. Cara Update / Redeploy

### Update dari GitHub:
```bash
cd /root/springhub

# Backup dulu database
docker compose exec postgres pg_dump -U springhub springhub > backup-$(date +%Y%m%d).sql

# Pull kode terbaru
git pull origin master

# Install dependencies baru (jika ada)
npm install

# Update database schema (jika ada perubahan)
npx prisma generate
npx prisma migrate deploy  # atau npx prisma db push

# Rebuild & restart
docker compose build web
docker compose up -d
```

### Quick restart (tanpa build):
```bash
docker compose restart web worker
```

---

## 💾 10. Cara Backup & Restore

### Backup Database:
```bash
# Backup ke file
docker compose exec -T postgres pg_dump -U springhub springhub > /root/backup-springhub-$(date +%Y%m%d-%H%M).sql

# Compress
gzip /root/backup-springhub-*.sql
```

### Restore Database:
```bash
# Copy backup ke container
cat /root/backup-springhub-20260630.sql | docker compose exec -T postgres psql -U springhub -d springhub
```

### Backup Semua (termasuk file upload):
```bash
# Buat folder backup
mkdir -p /root/backup

# Backup DB
docker compose exec -T postgres pg_dump -U springhub springhub > /root/backup/db-$(date +%Y%m%d).sql

# Backup uploads
tar -czf /root/backup/uploads-$(date +%Y%m%d).tar.gz /data/uploads/

# Backup .env
cp /root/springhub/.env.production /root/backup/
```

### Cron job backup otomatis (setup manual):
```bash
# Edit crontab
crontab -e

# Tambahkan baris ini untuk backup setiap jam 3 pagi:
0 3 * * * docker compose -f /root/springhub/docker-compose.yml exec -T postgres pg_dump -U springhub springhub | gzip > /root/backup/db-$(date +\%Y\%m\%d).sql.gz
```

---

## 📝 11. Yang Harus Dilakukan Selanjutnya

### Prioritas Tinggi:

| # | Task | Cara |
|---|---|---|
| 1 | **DNS Setup** | Di Cloudflare/DNS provider: buat A record `springhub.id` dan `www.springhub.id` → IP `76.13.198.18` |
| 2 | **SSL Real** | Setelah DNS propagate: `certbot --nginx -d springhub.id -d www.springhub.id` |
| 3 | **SMTP Email** | Isi `SMTP_PASS` di `/root/springhub/.env.production`, lalu `docker compose restart web worker` |

### Prioritas Medium:

| # | Task | Cara |
|---|---|---|
| 4 | **Xendit API Key** | Isi `XENDIT_SECRET_KEY` + `XENDIT_WEBHOOK_TOKEN` untuk donasi |
| 5 | **Sentry DSN** | Isi `NEXT_PUBLIC_SENTRY_DSN` untuk error tracking |
| 6 | **Redis eviction** | Ubah `allkeys-lru` → `noeviction` di docker-compose.yml (BullMQ butuh ini) |

### Prioritas Rendah:

| # | Task | Cara |
|---|---|---|
| 7 | **Cloudflare R2** | Isi S3 config untuk photo storage yang lebih scalable |
| 8 | **Monitoring** | Setup uptime monitoring (uptimerobot.com gratis) |

---

## 🧭 12. Diagram Arsitektur Lengkap

```
┌──────────────────────────────────────────────────────────────┐
│                        INTERNET                               │
│   Browser / curl / mobile app                                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │ UFW FW  │  Firewall: allow 22,80,443 only
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  SSH    │  root@76.13.198.18
                    │  Port 22│
                    └────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────▼────┐          ┌────▼────┐
         │  HTTP   │          │  HTTPS  │
         │  Port 80│          │ Port 443│
         └────┬────┘          └────┬────┘
              │ 301 redirect       │
              └────────┬───────────┘
                       │
                  ┌────▼────┐
                  │  Nginx  │  Reverse proxy
                  │ alpine  │  + SSL termination
                  └────┬────┘
                       │ proxy_pass http://web:31759
                       │
                  ┌────▼────┐
                  │ Next.js │  Express server
                  │ 14.2.5  │  Port 31759
                  └────┬────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌─────▼─────┐
   │Postgres │   │  Redis  │   │   /data/   │
   │ 16+GIS  │   │    7    │   │  uploads/  │
   │ DB:5432 │   │  :6379  │   │   (foto)   │
   └─────────┘   └─────────┘   └───────────┘
        │              │
   ┌────▼────┐   ┌────▼────┐
   │ Worker  │   │  Queue  │
   │ (email) │   │ (BullMQ)│
   └─────────┘   └─────────┘
```

### Alur Request:

```
Browser → http://76.13.198.18
  → UFW allow (port 80)
  → Nginx port 80 → 301 redirect ke https://springhub.id/
  → Browser paksa ke https://springhub.id/ (self-signed cert warning)
  → Nginx port 443 → SSL terminate → proxy ke web:31759
  → Next.js proses request → render HTML
  → Balik ke browser
```

### Alur Upload Foto:

```
User upload foto
  → POST /api/reports/[id]/photos
  → Next.js proses: validasi → resize 720p → kompresi JPEG 80% → watermark
  → Simpan ke /data/uploads/reports/{id}/{filename}.jpg
  → Simpan path ke database (ReportPhoto table)
  → URL: /uploads/reports/{id}/{filename}.jpg
  → Nginx serve langsung (cache 365 hari)
```

---

## 📂 13. Referensi File Penting

| File | Lokasi | Fungsi |
|---|---|---|
| **Docker Compose** | `/root/springhub/docker-compose.yml` | Definisi semua service |
| **Nginx Config** | `/root/springhub/nginx.conf` | Reverse proxy + SSL + caching |
| **Dockerfile** | `/root/springhub/Dockerfile` | Build image Next.js |
| **Env Production** | `/root/springhub/.env.production` | Environment variables untuk Docker |
| **Env Dev** | `/root/springhub/.env` | Environment variables untuk development |
| **Prisma Schema** | `/root/springhub/prisma/schema.prisma` | Database schema (17 models) |
| **Migration Plan** | `/root/springhub/MIGRASI-VPS.md` | Dokumen migrasi VPS lengkap |
| **Systemd Service** | `/etc/systemd/system/springhub.service` | Auto-start on boot |
| **Upload Directory** | `/data/uploads/` | Foto yang diupload |
| **Fail2ban Config** | `/etc/fail2ban/jail.local` | Aturan ban untuk SSH + Nginx |

---

## 🆘 Troubleshooting

### Web tidak bisa diakses:
```bash
# Cek container hidup semua?
docker compose ps

# Cek health check?
curl http://localhost:31759/api/health

# Cek log error?
docker compose logs web --tail 30
docker compose logs nginx --tail 30
```

### Database error:
```bash
# Cek koneksi database?
docker compose exec postgres pg_isready -U springhub

# Cek log postgres?
docker compose logs postgres --tail 20
```

### Upload foto gagal:
```bash
# Cek direktori upload?
ls -la /data/uploads/

# Cek permission?
docker compose exec web ls -la /data/uploads/
```

### Nginx 502 Bad Gateway:
```bash
# Web container crash?
docker compose ps web

# Restart web?
docker compose restart web
```

---

> **Dibuat**: 30 Juni 2026
> **Oleh**: SpringHub Build Agent
> **Server**: Hostinger KVM 4 | IP: 76.13.198.18
