# Rekomendasi Infrastruktur SpringHub — Untuk Manajer

> Dokumen ini versi non-teknis. Versi teknis lengkap dengan perintah-perintah ada di bagian bawah.

---

## 1. Masalah Kita Saat Ini

| Masalah | Akibat |
|---|---|
| **Supabase gratis** — koneksi DB terbatas 15 | User login bisa error 500 |
| **Vercel serverless** — tidak cocok untuk Next.js ukuran SpringHub | Loading lama, kena limit |
| **Foto di Supabase Storage** — bandwidth terbatas | Upload foto lemot |

**Solusi: Pindahkan semua ke server sendiri (VPS) + Cloudflare.**

---

## 2. Rekomendasi: Yang Harus Dibeli

| No | Barang | Merk | Fungsi | Harga |
|---|---|---|---|---|---|
| **1** | **VPS + Domain GRATIS** | **Hostinger KVM 4** | Server + domain springhub.id **free 1 tahun** | **Rp350.000/bln** |
| 2 | **Akun Cloudflare** (gratis) | cloudflare.com | Keamanan + CDN + SSL + DNS — **WAJIB** | **Rp0** |
| 3 | **Cloudflare R2** (gratis) | via akun Cloudflare | Tempat nyimpen foto (ganti Supabase Storage) | **Rp0** (10GB pertama) |
| 4 | **Email transaksional** | Resend.com | Kirim email reset password, notifikasi | **Rp0** (3.000 email pertama) |
| | **TOTAL BULANAN** | | | **~Rp350.000/bln** |

> **Catatan:** Harga Hostinger bisa lebih murah kalau bayar tahunan (≈Rp280.000/bln).

---

## 3. Spesifikasi Server (Hostinger KVM 4)

| Komponen | Spesifikasi |
|---|---|
| CPU | **4 core** |
| RAM | **8 GB** |
| Penyimpanan | **200 GB NVMe** (cepat) |
| Bandwidth | **4 TB/bulan** |
| OS | **Ubuntu 24.04 LTS** (OS server standar) |
| Panel | hPanel (Hostinger punya) — buat restart/monitor gampang |
| Datacenter | **Jakarta, Indonesia** — latency rendah untuk user Indonesia |

> OS Ubuntu 24.04 dipilih karena:
> - Ringan, stabil, dukungan sampai 2029
> - Semua software yang kita butuhin (Node.js, PostgreSQL, Redis) support resmi
> - Komunitas besar — kalau error gampang cari solusi

---

## 4. Alur Kerja — Gambaran Besar

```
                   ┌──────────────────────────────┐
                   │       Cloudflare (GRATIS)      │
                   │  • DNS: springhub.id → VPS     │
                   │  • CDN: cache gambar/static    │
                   │  • SSL: https otomatis         │
                   │  • DDoS protection             │
                   └──────────┬───────────────────┘
                              │
                   ┌──────────▼───────────────────┐
                   │   Hostinger VPS (Rp350K/bln)  │
                   │                               │
                   │  ┌─────────────────────────┐  │
                   │  │   Nginx (web server)     │  │
                   │  │   ::3000 → port 80/443   │  │
                   │  └──────────┬──────────────┘  │
                   │             │                  │
                   │  ┌──────────▼──────────────┐  │
                   │  │   Next.js (aplikasi)     │  │
                   │  │   Jalan 24/7 via PM2     │  │
                   │  └──────────┬──────────────┘  │
                   │             │                  │
                   │  ┌──────────▼──────────────┐  │
                   │  │   PostgreSQL (database)  │  │
                   │  │   + Redis (cache/queue)  │  │
                   │  └─────────────────────────┘  │
                   │                               │
                   │  ┌─────────────────────────┐  │
                   │  │   Uptime Kuma           │  │
                   │  │   (monitor, WA notif)   │  │
                   │  └─────────────────────────┘  │
                   └───────────────────────────────┘
                              │
                   ┌──────────▼───────────────────┐
                   │   Cloudflare R2 (GRATIS)      │
                   │   Tempat foto user            │
                   └───────────────────────────────┘
```

---

## 5. Perbandingan: Sekarang vs Nanti

| Aspek | Sekarang (Vercel+Supabase) | Nanti (Hostinger+Cloudflare) |
|---|---|---|
| **Biaya** | Rp0 (gratis) | **Rp352K/bln** |
| **Koneksi DB** | 15 max (sering penuh) | **Tak terbatas** (VPS sendiri) |
| **Storage foto** | Supabase (terbatas) | **Cloudflare R2** (global CDN) |
| **Kecepatan** | Serverless (cold start) | **24/7 nyala** (langsung respon) |
| **Kontrol** | Terbatas (platform orang) | **Full kontrol** (bisa atur apa saja) |
| **Skalabilitas** | Bayar per usage (mahal) | **Flat fee** Rp350K sampai 7K user |

---

## 6. Timeline Pengerjaan

| Hari | Yang Dikerjakan |
|---|---|
| **H-7** | Beli domain, daftar Cloudflare, daftar Resend |
| **H-3** | Beli Hostinger KVM 4 (pilih OS Ubuntu 24.04) |
| **H-1** | Backup database + foto dari Supabase |
| **H-0 (hari migrasi)** | Install software di VPS, restore data, jalanin aplikasi |
| **H+1** | Arahkan domain ke VPS (via Cloudflare) |
| **H+2** | Tes semua fitur, kalau OK matikan Vercel |

> **Total waktu pengerjaan:** 1-2 hari penuh oleh 1 orang teknisi.

---

## 7. Yang Perlu Disiapkan (Dari Sekarang)

| No | Tugas | Siapa | Deadline |
|---|---|---|---|
| 1 | Setuju budget Rp350K/bln | Manajer | - |
| 2 | Daftar akun Cloudflare (gratis) | Teknisi | H-7 |
| 3 | Daftar akun Resend (gratis) | Teknisi | H-7 |
| 4 | Beli Hostinger KVM 4 (include free domain) | Manajer | H-3 |
| 5 | Eksekusi migrasi | Teknisi | H-0 |

---

## 8. Perbandingan — Pilih Sesuai Budget

> Gaji Rp2,5JT → idealnya hosting **5-14% dari gaji** (Rp130K–Rp350K)

| Opsi | VPS | Harga | % Gaji | Domain | Spek | Cocok |
|---|---|---|---|---|---|---|
| 🟢 **Hemat** | **Netcup RS 1000** (Jerman) | **Rp131K** | 5% | Beli sendiri | 4CPU, 8GB, 256GB | Staging/belajar |
| 🟢 **Hemat** | **Hostinger KVM 2** (Jakarta) | **Rp179K** | 7% | Free 1 thn | 2CPU, 4GB, 100GB | Produksi kecil |
| 🔵 **Best Value 🥇** | **IdCloudHost VPS 4** (Jakarta) | **Rp199K** | 8% | Beli sendiri | 4CPU, 8GB, 100GB | Produksi 3K-5K user |
| 🟡 **Nyaman** | **Hostinger KVM 4** (Jakarta) | **Rp350K** | 14% | Free 1 thn | 4CPU, 8GB, 200GB | Produksi 5K+ user |

> **Rekomendasi untuk kamu:** **IdCloudHost VPS 4 (Rp199K/bln)** — 4 CPU, 8GB RAM, DC Jakarta, cuma 8% dari gaji. Pas untuk SpringHub produksi. Kalau ada rejeki lebih, naik ke Hostinger KVM 4 (Rp350K) dapet domain free + storage 2x lipat.

---

---

# (Opsional) Lampiran Teknis — Untuk Teknisi

_Bagian ini berisi panduan teknis step-by-step. Buka hanya saat eksekusi._

---

## A. Persiapan

### A.1 Akun yang Didaftarkan

1. **Cloudflare** → https://dash.cloudflare.com/sign-up
   - Setelah daftar, tambah domain `springhub.id`
   - Cloudflare akan kasih 2 nameserver (ns1.cloudflare.com, ns2.cloudflare.com)
   - Ganti nameserver di registrar domain dengan punya Cloudflare

2. **Cloudflare R2** → Dashboard Cloudflare → R2 → Enable
   - Buat bucket: **springhub-foto**
   - Settings → R2 API Tokens → Create token (Read+Write)

3. **Resend** → https://resend.com
   - Verifikasi domain springhub.id
   - Dapatkan API Key

### A.2 Backup Data dari Supabase

```bash
# 1. Dump database
pg_dump "postgresql://postgres.bhelvywlvwlqmvyblwmn:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" > springhub-db.sql

# 2. Download foto (via Supabase API)
# (bisa pakai script download dari dashboard atau via CLI)
```

### A.3 Catat Environment Variables

Ambil dari Vercel Dashboard → Project Settings → Environment Variables:
- JWT_SECRET
- XENDIT_SECRET_KEY, XENDIT_WEBHOOK_TOKEN
- Lainnya...

---

## B. Setup VPS

### B.1 Pesan Hostinger KVM 4

- Login ke hostinger.co.id
- Pilih **VPS → KVM 4**
- OS: **Ubuntu 24.04 LTS**
- Bayar → dapat email berisi IP, username, password root
- SSH masuk:
  ```bash
  ssh root@IP_VPS
  # ganti password: passwd
  ```

### B.2 Install Software

```bash
apt update && apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# PostgreSQL & Redis & Nginx
apt install -y postgresql postgresql-contrib redis-server nginx git ufw

# PM2
npm install -g pm2

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

### B.3 Setup Database

```bash
sudo -u postgres psql

CREATE DATABASE springhub;
CREATE USER springhub WITH ENCRYPTED PASSWORD 'password_kuat';
GRANT ALL PRIVILEGES ON DATABASE springhub TO springhub;
ALTER USER springhub CREATEDB;
\q

# Restore data
psql -U springhub -d springhub < springhub-db.sql
```

### B.4 Deploy Aplikasi

```bash
cd ~
git clone https://github.com/Ayatull4h/springhub.git
cd springhub

# Buat file .env (isi dengan env vars yang sudah dicatat)
nano .env

# Install & build
npm ci
npm run build

# Setup PM2
npm install -g pm2
pm2 start node_modules/next/dist/bin/next -- start -p 3000
pm2 save
pm2 startup
```

### B.5 Setup Nginx

```bash
nano /etc/nginx/sites-available/springhub
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name springhub.id www.springhub.id;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 20M;
}
```

```bash
ln -s /etc/nginx/sites-available/springhub /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
systemctl enable nginx
```

---

## C. Setup Cloudflare

### C.1 DNS

Di Cloudflare Dashboard → Domain → DNS → Add record:

| Type | Name | Content |
|---|---|---|
| A | `@` | IP_VPS |
| A | `www` | IP_VPS |

### C.2 SSL/TLS

Dashboard → SSL/TLS → pilih **Full (Strict)**

Generate **Origin Certificate**:
1. SSL/TLS → Origin Server → Create Certificate
2. Copy isi Certificate → simpan ke `/etc/ssl/springhub.pem`
3. Copy Private Key → simpan ke `/etc/ssl/springhub.key`
4. Update Nginx config → tambah:
   ```nginx
   ssl_certificate /etc/ssl/springhub.pem;
   ssl_certificate_key /etc/ssl/springhub.key;
   ```

```bash
nginx -t && systemctl restart nginx
```

---

## D. Verifikasi & Cutover

```bash
# Cek aplikasi local
curl http://localhost:3000

# Cek dari luar
curl https://springhub.id

# Cek API
curl https://springhub.id/api/health

# Cek database
sudo -u postgres psql -d springhub -c "SELECT count(*) FROM profiles;"
```

### Kalau semua OK:
1. Cloudflare Dashboard → DNS → set A record proxy ✅ (oranye)
2. Vercel Dashboard → Settings → Domains → hapus domain
3. Selesai.

---

## E. Backup Rutin

```bash
# Di VPS, setup cron untuk backup tiap jam 3 pagi
crontab -e
```

Tambahkan:
```cron
0 3 * * * pg_dump -U springhub springhub > ~/backups/db-$(date +\%Y\%m\%d).sql
0 5 * * * find ~/backups/ -name "db-*.sql" -mtime +7 -delete
```

---

## F. Monitoring

Install Uptime Kuma untuk pantau uptime + notifikasi WA:

```bash
apt install -y docker.io
docker run -d --restart=always -p 3001:3001 \
  -v ~/uptime-kuma:/app/data \
  --name uptime-kuma \
  louislam/uptimekuma:latest
```

Akses: `http://IP_VPS:3001`
Buat monitor untuk: `https://springhub.id`

---

*Dibuat: 21 Juni 2026*
*Untuk: SpringHub — Migrasi Vercel+Supabase → Hostinger KVM 4 + Cloudflare R2*
