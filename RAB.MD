# RAB — Rencana Anggaran Biaya

## SpringHub Migration from Vercel+Supabase → VPS + Cloudflare

**Target:** 7K user, 500 konkuren, 1000 laporan/hari
**Budget:** Rp 500K–1JT/bulan

---

## 🔎 Riset Provider Per Komponen

### VPS (4 vCPU / 8GB RAM equivalent)

| Provider | Spesifikasi | Harga/Bln | Latensi RI | Notes |
|---|---|---|---|---|
| **Netcup RS 1000** (Jerman) | 4 vCPU, 8GB, 256GB NVMe | **€7.50 ≈ Rp131K** | Tinggi | Termurah di Eropa |
| **Contabo S** (Jerman) | 4 vCPU, 8GB, 200GB NVMe | **€7.99 ≈ Rp140K** | Tinggi | Penyimpanan besar, trusted |
| **IdCloudHost VPS 4** (Jakarta) | 4 vCPU, 8GB, 100GB NVMe | **Rp199K** | Rendah | DC Jakarta, latency rendah |
| **Hetzner CX32** (Jerman) | 4 vCPU, 8GB, 80GB NVMe | **€11.99 ≈ Rp209K** | Tinggi | Best value EU, reliable |
| **Hetzner AX102** (Jerman) | 4 vCPU, 16GB, 2x1TB HDD | **€15 ≈ Rp262K** | Tinggi | Dedicated server entry |
| **OVHcloud Eco** (Singapura) | 4 vCPU, 8GB, 160GB | **€13.50 ≈ Rp235K** | Sedang | DC SG, lebih dekat RI |
| **Hostinger KVM 4** (Jakarta) | 4 vCPU, 8GB, 200GB NVMe | **Rp350K** | Rendah | Managed panel, DC Indo |
| **Biznet Gio Medium** (RI) | 4 vCPU, 8GB, 100GB | **Rp400K** | Rendah | Enterprise grade, DC Indo |
| **DigitalOcean Basic** (SG) | 4 vCPU, 8GB, 160GB | **$48 ≈ Rp768K** | Sedang | Mahal, ekosistem luas |
| **AWS Lightsail** (SG) | 4 vCPU, 8GB, 160GB | **$40 ≈ Rp640K** | Sedang | Ekosistem AWS |
| **Vultr Cloud Compute** (SG) | 4 vCPU, 8GB, 160GB | **$40 ≈ Rp640K** | Sedang | Global, DC SG |

### Object Storage (Image Upload)

| Provider | Harga/GB/bln | Egress | Free Tier | Best For |
|---|---|---|---|---|
| **Cloudflare R2** | $0.015 | **🆓 Gratis** ✅ | 10GB | Integrasi dengan Cloudflare, zero egress |
| **Backblaze B2** | $0.006 | $0.01/GB | 10GB | Termurah storage, bayar egress |
| **Wasabi** | $0.007 | **🆓 Gratis** ✅ | - (min $7) | Storage murah, minimum tagihan $7 |
| **DO Spaces** | $5/250GB | 1TB gratis | - | Paket flat 250GB |
| **AWS S3** | $0.023 | $0.09/GB | 5GB | Mahal, ekosistem terluas |

### Email SMTP

| Provider | Harga | Kapasitas | Notes |
|---|---|---|---|
| **Zoho Mail** | **🆓 Gratis** ✅ | 5 user x 5GB | Free forever, simple |
| **Amazon SES** | ~$0.10/1000 | Unlimited | Perlu domain verified, high deliverability |
| **Resend** | Gratis 3K/bln | Pro $20/100K | Modern API, easy setup |
| **Mailgun** | Gratis 3K/bln | Flex $35/50K | Developer friendly |
| **SendGrid** | Gratis 100/hari | Essentials $20/50K | Twilio ecosystem |
| **Hostinger Email** | Rp20K/user/bln | Unlimited | Satu paket dengan hosting |
| **Namecheap Email** | $0.81/user ≈ Rp13K | 10GB/user | Termurah berbayar |

### Redis / Queue

| Provider | Harga | Notes |
|---|---|---|
| **Self-hosted di VPS** | **🆓 Gratis** ✅ | Instal langsung, performa maksimal |
| **Upstash** | Gratis 256MB | Pro mulai ~$0.45/bln, serverless |
| **Redis Enterprise (GCP)** | **🆓** 30MB | Free tier sangat kecil |

### CDN / DNS / Security

| Provider | Harga | Notes |
|---|---|---|
| **Cloudflare Free** | **🆓 Gratis** ✅ | CDN, SSL, DDOS, DNS, WAF basic |
| **Cloudflare Pro** | $20/bln | WAF rules, performance, prioritized |
| **Cloudflare Business** | $200/bln | Advanced security, PCI compliance |

### Monitoring

| Provider | Harga | Notes |
|---|---|---|
| **Uptime Kuma (self-host)** | **🆓 Gratis** ✅ | Full featured, open source |
| **BetterStack** | Gratis 3 monitors | Pro $29/bln |
| **Grafana + Prometheus** | **🆓 Gratis** ✅ | Self-hosted, full observability |
| **PM2 + Logs** | **🆓 Gratis** ✅ | Process manager built-in |

---

## 📊 3 Skenario RAB

---

### 🟢 Skenario A: Termurah (Rp 131–179K/bln)

*Untuk dev/staging / early stage <1K user — semua self-hosted*

| Komponen | Provider | Biaya/bln |
|---|---|---|
| VPS (4 vCPU, 8GB) | **Netcup RS 1000** | Rp131K |
| Database | Self-hosted PostgreSQL di VPS | Rp0 |
| Storage | Cloudflare R2 (free 10GB) | Rp0 |
| Email | Zoho Mail Free | Rp0 |
| CDN/DNS/Security | Cloudflare Free | Rp0 |
| Redis | Self-hosted di VPS | Rp0 |
| Queue (Bull) | Self-hosted Redis | Rp0 |
| Monitoring | PM2 + Uptime Kuma | Rp0 |
| **Total** | | **~Rp131K/bln** |

**Alternatif:** Contabo S (Rp140K/bln) — storage 200GB lebih besar

> **⚠️ Warning:** Latensi tinggi karena DC Eropa. Cocok hanya untuk staging/dev.

---

### 🔵 Skenario B: Best Value ✅ REKOMENDASI UTAMA

*Untuk 7K user, 500 konkuren, 1000 laporan/hari*

#### Opsi B1: Hostinger (DC Indonesia, Managed)

| Komponen | Provider | Biaya/bln |
|---|---|---|
| VPS (4 vCPU, 8GB, 200GB NVMe) | **Hostinger KVM 4** | Rp350K |
| Database | Self-hosted PostgreSQL di VPS | Rp0 |
| Storage | Cloudflare R2 (~5GB usage) | Rp1.2K |
| Email | Amazon SES (10K email/bln) | Rp1.6K |
| CDN/DNS/Security | Cloudflare Free | Rp0 |
| Redis + Queue | Self-hosted di VPS | Rp0 |
| Monitoring | PM2 + Uptime Kuma | Rp0 |
| Domain | springhub.id (renewal) | ~Rp20K |
| **Total** | | **~Rp373K/bln** |

#### Opsi B2: IdCloudHost (DC Jakarta, Value)

| Komponen | Provider | Biaya/bln |
|---|---|---|
| VPS (4 vCPU, 8GB, 100GB NVMe) | **IdCloudHost VPS 4** | Rp199K |
| Database | Self-hosted PostgreSQL di VPS | Rp0 |
| Storage | Cloudflare R2 (~5GB usage) | Rp1.2K |
| Email | Amazon SES (10K email/bln) | Rp1.6K |
| CDN/DNS/Security | Cloudflare Free | Rp0 |
| Redis + Queue | Self-hosted di VPS | Rp0 |
| Monitoring | PM2 + Uptime Kuma | Rp0 |
| Domain | springhub.id (renewal) | ~Rp20K |
| **Total** | | **~Rp222K/bln** |

#### Opsi B3: Hetzner + Cloudflare (Power-to-Price)

| Komponen | Provider | Biaya/bln |
|---|---|---|
| VPS (4 vCPU, 8GB, 80GB NVMe) | **Hetzner CX32** | Rp209K |
| Database | Self-hosted PostgreSQL di VPS | Rp0 |
| Storage | Cloudflare R2 (~5GB usage) | Rp1.2K |
| Email | Amazon SES (10K email/bln) | Rp1.6K |
| CDN/DNS/Security | Cloudflare Free | Rp0 |
| Redis + Queue | Self-hosted di VPS | Rp0 |
| Monitoring | PM2 + Uptime Kuma | Rp0 |
| Domain | springhub.id (renewal) | ~Rp20K |
| **Total** | | **~Rp232K/bln** |

---

### 🔴 Skenario C: Powerful + HA (Rp 650K–1JT/bln)

*High availability, production grade, scaling buffer*

| Komponen | Provider | Biaya/bln |
|---|---|---|
| VPS (8 vCPU, 16GB, 160GB NVMe) | **Hetzner CX42** | Rp383K |
| Database | Self-hosted PostgreSQL (tuned) | Rp0 |
| Redis Dedicated | Upstash Pro (auto-scale) | Rp7K |
| Storage | Cloudflare R2 (~10GB usage) | Rp2.5K |
| Email Primary | Amazon SES (10K/bln) | Rp1.6K |
| Email Failover | Resend (buffer) | Rp0 (free tier) |
| CDN/DNS Pro | Cloudflare Pro (WAF rules) | Rp319K |
| Monitoring | BetterStack (uptime) | Rp0 (free tier) |
| Backup VPS | Hetzner CX22 (2 vCPU, 4GB) — cold standby | Rp105K |
| Domain | springhub.id (renewal) | ~Rp20K |
| **Total (Hetzner)** | | **~Rp838K/bln** |

**Alternatif:** Hostinger KVM 8 (8 vCPU, 16GB, 400GB) → Rp659K + Cloudflare Pro → total **~Rp1JT/bln**

---

## 🏆 Kesimpulan & Rekomendasi Akhir

### Paling Murah
> **Netcup RS 1000 + Cloudflare R2 + Zoho Mail — Rp131K/bln**
> ⚠️ Hanya untuk staging / <1K user, latency tinggi

### Paling Worth It (Sweetspot) 🥇
> **B1: Hostinger KVM 4 + Cloudflare R2 + Amazon SES — Rp373K/bln**
> ✅ DC Indonesia, latency rendah, managed panel, fitur lengkap

> **B2: IdCloudHost VPS 4 + Cloudflare R2 + Amazon SES — Rp222K/bln**
> ✅ DC Jakarta, paling hemat untuk performa lokal

### Paling Powerful 🚀
> **Hetzner CX42 + Cloudflare Pro + Upstash — Rp838K/bln**
> ✅ HA ready, dedicated services, scaling untuk 20K+ user

---

### Rekomendasi Saya

Dengan **budget Rp 500K–1JT** dan prioritas **stabilitas + fitur lengkap**:

**Gunakan Skenario B1 — Hostinger KVM 4 (~Rp373K/bln)**

Alasan:
1. **DC Indonesia** — latency rendah untuk user Indonesia
2. **Managed Panel** — hPanel/control panel, lebih mudah maintenance
3. **200GB NVMe** — cukup untuk DB, file, image thumbnail
4. **Sisa budget** ~Rp127–627K bisa untuk:
   - Backup otomatis ke R2 (~Rp5K)
   - Monitoring profesional BetterStack ($0) atau Grafana (free)
   - Domain renewal
   - Scaling buffer untuk Next tier (naik ke KVM 8 kalau perlu)
5. **Lebih hemat dari budget** — tanpa mengorbankan kualitas

---

*RAB disusun: 2026-05-30*
*Untuk: SpringHub — Migrasi Infrastruktur*
