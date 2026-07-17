# DEPLOYMENT GUIDE — SpringHub

## Prasyarat

| Item | Keterangan |
|------|------------|
| VPS | Hostinger KVM 4 (4 vCPU, 8GB RAM, 200GB NVMe) — Ubuntu 22.04 |
| Domain | springhub.id (DNS di Cloudflare) |
| Storage | Cloudflare R2 bucket: `springhub-photos` + `springhub-backups` |
| Email | Hostinger Business Email (SMTP) |
| Monitoring | Sentry DSN (free tier) |

---

## 1. Setup Awal VPS

```bash
# SSH ke VPS
ssh root@[VPS_IP]

# Update system
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx

# Setup UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Setup Fail2ban
apt install -y fail2ban
```

## 2. Clone & Deploy

```bash
# Clone repo
mkdir -p /opt/springhub
cd /opt/springhub
git clone https://github.com/Ayatull4h/springhub.git .

# Copy environment
cp .env.production .env
# EDIT .env — isi semua secrets (DB password, JWT, R2 keys, SMTP, Sentry)

# Generate JWT secret (if not set)
openssl rand -base64 48

# Start all services
docker compose up -d

# Run database migration
docker compose exec web npx prisma migrate deploy

# Seed initial data
docker compose exec web npx tsx prisma/seed.ts

# Setup SSL
certbot --nginx -d springhub.id -d www.springhub.id
```

## 3. Setup Cron Jobs

```bash
# Backup database every 6 hours
crontab -e

0 */6 * * * cd /opt/springhub && docker compose exec -T postgres pg_dump -U springhub springhub | gzip > /tmp/backup-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz && aws s3 cp /tmp/backup-*.sql.gz s3://springhub-backups/database/ --endpoint-url https://[account].r2.cloudflarestorage.com

# Guest cleanup every 24 hours
0 3 * * * curl -X POST https://springhub.id/api/admin/cleanup
```

## 4. Update & Rollback

### Normal Update
```bash
cd /opt/springhub
git pull
docker compose up -d --build web worker
docker image prune -f
```

### Rollback
```bash
cd /opt/springhub
git checkout [previous-commit]
docker compose up -d --build web worker
```

## 5. Restore Backup

```bash
# Download backup dari R2
aws s3 cp s3://springhub-backups/database/springhub-20260531-120000.dump.gz . --endpoint-url https://[account].r2.cloudflarestorage.com

# Decompress
gunzip springhub-20260531-120000.dump.gz

# Restore
docker compose exec -T postgres pg_restore -U springhub -d springhub --clean < springhub-20260531-120000.dump
```

## 6. Monitoring

| Endpoint | Fungsi |
|----------|--------|
| `https://springhub.id/api/health` | Cek DB + Redis |
| Sentry Dashboard | Error tracking |
| UptimeRobot | Uptime monitoring (free 5 monitors) |

## 7. Environment Variables

Lihat `.env.production` untuk daftar lengkap. Yang wajib diisi:

| Variable | Sumber |
|----------|--------|
| `DATABASE_URL` | PostgreSQL di docker-compose |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `S3_*` | Cloudflare R2 dashboard |
| `XENDIT_*` | Xendit dashboard |
| `SMTP_*` | Hostinger email settings |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry dashboard |

## 8. Arsitektur Port

| Service | Port | Bind |
|---------|------|------|
| Nginx | 80/443 | 0.0.0.0 |
| Next.js | 3000 | 127.0.0.1 |
| PostgreSQL | 5432 | 127.0.0.1 |
| Redis | 6379 | 127.0.0.1 |
