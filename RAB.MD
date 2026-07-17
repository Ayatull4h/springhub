# RAB — Rencana Anggaran Biaya

## SpringHub Migration — Vercel+Supabase → VPS + Cloudflare

**Target:** 7K user, 500 konkuren, 1000 laporan/hari
**Budget:** Rp 90K–350K/bulan (disesuaikan gaji Rp2,5JT)

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

## 📊 3 Skenario RAB (Disesuaikan Gaji Rp2,5JT)

> Persentase = **biaya hosting ÷ gaji Rp2,5JT**

---

### 🟢 Skenario A: Super Hemat (Rp 89–131K/bln)

*Rp2,5JT - 131K = masih sisa Rp2,37JT untuk kebutuhan lain ✅*

| Komponen | Provider | Biaya/bln | % Gaji |
|---|---|---|---|
| VPS (2 vCPU, 4GB, 80GB NVMe) | **Hostinger KVM 2** | **Rp179K*** | 7% |
| VPS (4 vCPU, 8GB, 256GB) Alternatif | **Netcup RS 1000** (Jerman) | Rp131K | 5% |
| Database | Self-hosted PostgreSQL di VPS | Rp0 | - |
| Storage | Cloudflare R2 (free 10GB) | Rp0 | - |
| Email | Resend / Zoho Mail (gratis) | Rp0 | - |
| CDN/DNS/SSL/Keamanan | Cloudflare Free | Rp0 | - |
| Redis | Self-hosted di VPS | Rp0 | - |
| Domain | **Free 1 tahun dari Hostinger** | Rp0 | - |
| Monitoring | Uptime Kuma (self-host) | Rp0 | - |
| **Total (Netcup)** | | **~Rp131K/bln** | **5%** |
| **Total (Hostinger KVM 2)** | | **~Rp179K/bln** | **7%** |

**\* Harga Hostinger KVM 2** = Rp179rb/bln (2 vCPU, 4GB RAM, 100GB NVMe). Cukup untuk 1K-3K user.
> ⚠️ **Netcup** latensi tinggi (server Jerman). Cocok untuk belajar/staging.
> ⚠️ **Hostinger KVM 2** RAM 4GB — perlu rajin monitor biar gak overload.

---

### 🔵 Skenario B: Best Value ✅ REKOMENDASI UTAMA

*Rp2,5JT - 199K = sisa Rp2,3JT. Paling aman buat produksi.*

| Komponen | Provider | Biaya/bln | % Gaji |
|---|---|---|---|
| VPS (4 vCPU, 8GB, 100GB NVMe) | **IdCloudHost VPS 4** (Jakarta) | **Rp199K** | **8%** |
| Database | Self-hosted PostgreSQL di VPS | Rp0 | - |
| Storage | Cloudflare R2 (free 10GB) | Rp0 | - |
| Email | Resend (gratis 3.000/bln) | Rp0 | - |
| CDN/DNS/SSL/Keamanan | Cloudflare Free | Rp0 | - |
| Redis + Queue | Self-hosted di VPS | Rp0 | - |
| Domain | Beli terpisah (Niagahoster) | ~Rp20K/thn | - |
| Monitoring | Uptime Kuma (self-host) | Rp0 | - |
| **Total** | | **~Rp199K/bln** | **8%** |

**Kenapa IdCloudHost?**
- ✅ **DC Jakarta** — latency rendah untuk user Indonesia
- ✅ **4 vCPU, 8GB RAM** — cukup untuk SpringHub produksi
- ✅ **Rp199K** — termurah untuk spek 4/8 di DC lokal
- ❌ Domain **tidak include** — beli sendiri ~Rp20K/tahun

---

### 🟡 Skenario C: Paling Nyaman (Rp 199–350K/bln)

*Rp2,5JT - 350K = sisa Rp2,15JT. Paling recommended kalau budget memungkinkan.*

| Komponen | Provider | Biaya/bln | % Gaji |
|---|---|---|---|
| VPS (4 vCPU, 8GB, 200GB NVMe) | **Hostinger KVM 4** (Jakarta) | **Rp350K** | **14%** |
| Database | Self-hosted PostgreSQL di VPS | Rp0 | - |
| Storage | Cloudflare R2 (free 10GB) | Rp0 | - |
| Email | Resend (gratis 3.000/bln) | Rp0 | - |
| CDN/DNS/SSL/Keamanan | Cloudflare Free | Rp0 | - |
| Redis + Queue | Self-hosted di VPS | Rp0 | - |
| Domain | **Free 1 tahun dari Hostinger** ✅ | Rp0 | - |
| Monitoring | Uptime Kuma (self-host) | Rp0 | - |
| **Total** | | **~Rp350K/bln** | **14%** |

**Kenapa Hostinger KVM 4?**
- ✅ **Domain free 1 tahun** — hemat Rp20K
- ✅ **200GB NVMe** — lega buat DB + file
- ✅ **Managed panel** — gampang maintenance
- ✅ **hPanel** — tinggal klik restart/monitor, gak perlu SSH tiap saat
- ⚠️ Rp350K = 14% gaji — masih wajar untuk server produksi
  (Biasanya 10-20% dari gaji dev dialokasikan untuk hosting)

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

### Skenario Berdasarkan Gaji Rp2,5JT

| Skenario | Biaya/bln | % Gaji | Cocok Untuk |
|---|---|---|---|
| 🟢 **A: Super Hemat** (Netcup) | **Rp131K** | **5%** | Belajar, staging, <1K user |
| 🟢 **A: Super Hemat** (Hostinger KVM 2) | **Rp179K** | **7%** | Produksi kecil, 1K-2K user |
| 🔵 **B: Best Value** 🥇 | **Rp199K** | **8%** | Produksi 3K-5K user |
| 🟡 **C: Paling Nyaman** | **Rp350K** | **14%** | Produksi 5K-7K+ user, nyaman |

---

### Rekomendasi Akhir — Untuk Gaji Rp2,5JT

**PILIHAN 1 — Paling Recommended 🥇**
> **IdCloudHost VPS 4 + Cloudflare R2 — Rp199K/bln (8% gaji)**
> 
> Spek 4 vCPU, 8GB RAM, 100GB NVMe, DC Jakarta
> Harga Rp199K masih sisa banyak buat kebutuhan sehari-hari
> Domain beli sendiri ~Rp20K/tahun (Niagahoster)

**PILIHAN 2 — Kalau Ada Budget Lebih 🟡**
> **Hostinger KVM 4 + Domain Free — Rp350K/bln (14% gaji)**
> 
> Spek sama, storage 2x lipat (200GB), domain gratis 1 tahun
> Cocok kalau kamu hitung hosting = investasi, bukan biaya

**PILIHAN 3 — Paling Hemat 🟢**
> **Netcup RS 1000 — Rp131K/bln (5% gaji)**
> 
> Paling murah, spek paling gede, tapi latency tinggi (server Jerman)
> Hanya recommended untuk tahap belajar/pengembangan

---

### Catatan Manajemen Keuangan

| Pengeluaran | Per Bulan |
|---|---|
| Gaji | Rp2.500.000 |
| **Hosting (Skenario B)** | **-Rp199.000** |
| Makan + Transport | ~Rp1.200.000 |
| Token Listrik + Pulsa | ~Rp300.000 |
| Tabungan/darurat | ~Rp500.000 |
| **Sisa** | **~Rp301.000** |

> **Kesimpulan:** Skenario B (Rp199K) paling realistis.
> Gak memberatkan, spek cukup untuk produksi, DC lokal latency rendah.

---

*RAB diperbarui: 21 Juni 2026*
*Untuk: SpringHub — Migrasi Infrastruktur*
*Budget disesuaikan gaji developer Rp2,5JT*
