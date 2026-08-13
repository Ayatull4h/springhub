# BAB 9 — Infrastruktur: Pipa Deploy, Nginx, Docker, dan Antrean

> Modul Belajar — Kode SpringHub
>
> Bab ini membedah seluruh lapisan infrastruktur yang membuat SpringHub berjalan di
> atas satu VPS: dari file konfigurasi Node/Next.js, reverse proxy Nginx, orkestrasi
> Docker Compose (produksi + staging + preview paralel), Dockerfile multi-stage,
> pipeline CI/CD GitHub Actions, skrip operasional server, sampai antrean pekerja
> BullMQ. Setiap file dikutip langsung dari repositori asli dengan analisis baris
> per baris, sehingga pembaca bisa memakai modul ini sebagai "tur berpemandu" ke
> kode produksi.

---

## 9.1 Peta Infrastruktur

SpringHub tidak berjalan di serverless (Vercel/Supabase) seperti desain awal —
setelah sesi diskusi 1 Juni 2026, proyek dimigrasikan ke satu VPS (Hostinger KVM)
dengan pola *single-host Docker Compose*. Satu mesin menjalankan lima kontainer:

```text
                        Internet
                           │
                      (DNS A/AAAA)
                           │
                     ┌─────▼─────┐
                     │ Cloudflare│   proxy ON, WAF, TLS 1.3
                     └─────┬─────┘
                           │ 80/443 (hanya IP Cloudflare diizinkan UFW)
                     ┌─────▼──────────────────────────────┐
                     │  nginx:alpine (port 80/443)        │
                     │  rate limit zones, SSL, cache,     │
                     │  real-IP Cloudflare                │
                     └─────┬──────────────────────────────┘
              ┌────────────┼──────────────┐
      ┌───────▼───────┐ ┌──▼─────────┐ ┌──▼──────────────┐
      │ web:31759     │ │ worker     │ │ redis:6379      │
      │ Next.js       │ │ BullMQ     │ │ queue + cache   │
      │ standalone    │ │ email-worker│ │ (password)      │
      └───────┬───────┘ └────────────┘ └─────────────────┘
              │
      ┌───────▼──────────────────────────────────────────┐
      │ postgres:5432 (postgis) — hanya 127.0.0.1        │
      │ max_connections=50, statement_timeout=30s        │
      └──────────────────────────────────────────────────┘
```

**Fakta kunci arsitektur:**

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Host | Hostinger KVM 4 (VPS, DC Indonesia) | Latensi rendah, biaya tetap, kontrol penuh |
| CDN/Proxy | Cloudflare (proxy ON) | WAF gratis, rate limiting, sembunyikan IP asli |
| Runtime | Node 20 Alpine, Next.js `output: "standalone"` | Image kecil (~200MB), start cepat |
| Orkestrasi | Docker Compose (bukan K8s) | 1 host, 5 service — K8s overkill |
| Database | PostgreSQL 16 + PostGIS, `postgis/postgis:16-3.4-alpine` | Data spasial mata air butuh PostGIS |
| Cache & Antrean | Redis 7 (password, `allkeys-lru`, maxmem 256MB) | BullMQ + rate limit + cache |
| Reverse proxy | nginx:alpine, konfigurasi statis | Kontrol penuh rate limit per endpoint |
| CI/CD | GitHub Actions → SSH ke VPS | Deploy 3 jalur: prod/staging/preview |
| Backup | `pg_dump` + gzip + GPG AES256 (cron 03:00 WIB) | Enkripsi, retensi 7 hari |

**Tiga lingkungan yang hidup paralel di VPS yang sama:**

1. **Produksi** (`docker-compose.yml`) — `www.springhub.id`, port `80/443`, DB `springhub`
   di port host `5432`, Redis `6379`, web `31759`.
2. **Staging** (`docker-compose.staging.yml`, project `staging`) — `staging.springhub.id`
   lewat SSH tunnel/Cloudflare, Basic Auth, port host `5433/6380/31760`, nginx di `8080`,
   DB terpisah `springhub_staging`.
3. **Preview per-branch** (`docker-compose.preview.yml`) — `<branch>.staging.springhub.id`,
   container `web-<branch>` di port dinamis `32000..32399`, memakai postgres/redis staging.

Isolasi antar lingkungan dicapai dengan: **port host berbeda**, **volume berbeda**
(`postgres_data` vs `postgres_staging_data`), **database berbeda**, dan **project
Compose berbeda** (`-p staging`, `-p preview-<branch>`).

---

## 9.2 `middleware.ts` — Gerbang Awal Setiap Request

`middleware.ts` adalah kode pertama yang menyentuh request di sisi Next.js (berjalan
di Edge runtime, sebelum page/route handler). File ini melakukan tiga pekerjaan:

1. Mencegah CDN meng-cache response API.
2. Memverifikasi JWT session + mengalihkan rute admin.
3. Whitelist IP admin (opsional, fail-closed).

### 9.2.1 Kode lengkap

```ts
// middleware.ts — 126 baris
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { verifyJwtWithRotation } from "@/lib/jwt";

const SESSION_COOKIE = "session";
const GUEST_COOKIE = "guest_session_id";

const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/sign-in", "/join"];
const PROJECT_CREATE = "/projects/new";

function ipv4ToInt(ip: string): number | null {
  let value = ip.trim();
  if (value.toLowerCase().startsWith("::ffff:")) value = value.slice(7);
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(value);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  if (octets.some((o) => o > 255)) return null;
  return ((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3];
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [rangeIp, prefixStr] = cidr.split("/");
  const prefix = prefixStr ? Number(prefixStr) : 32;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(rangeIp);
  if (ipInt === null || rangeInt === null) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

// x-real-ip diset oleh nginx dan tidak bisa dipalsukan dari luar.
// x-forwarded-for hanya dipakai sebagai fallback (misal request langsung ke VPS).
function getClientIp(request: NextRequest): string {
  const real = request.headers.get("x-real-ip");
  if (real && ipv4ToInt(real) !== null) return real;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first && ipv4ToInt(first) !== null) return first;
  }
  return "";
}

// Fail-closed: whitelist diset tapi IP tidak valid/tidak terdeteksi → DENY.
function isAllowedIp(ip: string, ranges: string[]): boolean {
  if (ip === "" || ipv4ToInt(ip) === null) return false;
  return ranges.some((range) => isIpInCidr(ip, range));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes: prevent CDN caching so data always fresh
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  let session: { userId: string; role: string } | null = null;

  if (sessionToken) {
    try {
      const result = await verifyJwtWithRotation<JWTPayload>(sessionToken, (secret) =>
        jwtVerify(sessionToken, secret).then((r) => r.payload)
      );
      if (result?.payload && typeof result.payload === "object") {
        const p = result.payload as Record<string, unknown>;
        session = {
          userId: typeof p.userId === "string" ? p.userId : "",
          role: typeof p.role === "string" ? p.role : "user",
        };
      }
    } catch {
      // Invalid token
    }
  }

  if (!request.cookies.get(GUEST_COOKIE)?.value) {
    // Guest cookie will be set by the guest utility when needed
  }

  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "admin") {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // IP whitelist untuk admin (optional)
    const allowedCidrs = process.env.ADMIN_ALLOWED_IPS;
    if (allowedCidrs) {
      const ranges = allowedCidrs.split(",").map(s => s.trim()).filter(Boolean);
      if (ranges.length > 0 && !isAllowedIp(getClientIp(request), ranges)) {
        return new NextResponse("Access denied: IP not allowed", { status: 403 });
      }
    }
  }

  if (AUTH_ROUTES.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/report/")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 9.2.2 Analisis baris penting

**Baris 56-66 — API anti-cache.** Semua `pathname.startsWith("/api/")` diberi header
`Cache-Control: no-cache, no-store, must-revalidate` + `Pragma` + `Expires: 0`.
Kenapa? Cloudflare di depan VPS punya cache default untuk aset statis. Tanpa header
ini, response JSON dari `GET /api/reports` bisa tersimpan di edge CDN dan pengguna
melihat data basi — atau lebih buruk, response error yang menyangkut data privat.
Header `Expires: 0` menutup celah HTTP/1.0 caches yang mengabaikan `Cache-Control`.

**Baris 68-86 — Verifikasi JWT di edge.** Cookie `session` dibaca lalu diverifikasi
dengan `verifyJwtWithRotation()` (lihat BAB 10 §10.4 untuk detail rotasi kunci).
Perhatikan middleware TIDAK mengecek *session ledger* ke database — itu hanya
dilakukan di `lib/auth.ts:getSession()` pada route handler. Alasan: middleware
berjalan di Edge runtime tanpa koneksi PostgreSQL; verifikasi kriptografis saja
cukup untuk pengalihan rute, sementara otorisasi yang butuh data terkini (misal
akun diblokir) dilakukan ulang di dalam API.

**Baris 92-107 — Gerbang admin dua lapis.** Lapis pertama: role JWT harus `admin`,
jika tidak → redirect ke `/sign-in?redirect=<path>`. Lapis kedua (opsional):
whitelist IP via env `ADMIN_ALLOWED_IPS` (format `"1.2.3.4,10.0.0.0/8"`). Ini
**fail-closed**: kalau env diset tapi IP tidak terdeteksi atau tidak valid, request
ditolak `403` — kebalikan dari pola *fail-open* yang sering menjadi temuan audit.

**Baris 13-32 — Utilitas IP.** `ipv4ToInt` menormalkan IPv4-mapped IPv6
(`::ffff:1.2.3.4`), memvalidasi setiap oktet, lalu mengubahnya jadi integer
32-bit. `isIpInCidr` menghitung netmask dari prefix dan membandingkan bit —
implementasi CIDR murni tanpa library tambahan (hemat bundle edge).

**Baris 36-45 — Sumber IP yang dipercaya.** Prioritas: `x-real-ip` (diset nginx,
lihat §9.4) → `x-forwarded-for` (fallback). Header `x-forwarded-for` bisa
dipalsukan oleh klien langsung, tapi nilai pertama dari daftar yang ditambahkan
nginx di belakangnya selalu benar; itulah mengapa hanya `split(",")[0]` yang
dipakai.

**Baris 122-126 — Matcher.** Rute yang TIDAK melewati middleware: `_next/static`
(aset Next.js), `_next/image` (optimizer gambar), `favicon.ico`, semua `/api/*`
(karena blok API ditangani di baris 57), dan ekstensi gambar statis. Artinya
middleware hanya menyentuh halaman — beban minimal.

---

## 9.3 `next.config.mjs` — Konfigurasi Runtime Next.js

File ini menentukan tiga hal besar: bentuk output (standalone), keamanan header,
dan daftar modul yang boleh dijalankan di luar bundle server.

```js
// next.config.mjs — 76 baris
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.greennetwork.id" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "www.springhub.id" },
      { protocol: "https", hostname: "springhub.id" },
    ],
  },
  experimental: {
    clientRouterFilter: true,
    clientRouterFilterRedirects: true,
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-pg",
      "sharp",
      "@aws-sdk/client-s3",
      "@aws-sdk/lib-storage",
      "ioredis",
      "bullmq",
      "nodemailer",
      "pino",
      "jsdom",
      "dompurify",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(self), microphone=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.openstreetmap.org https://*.basemaps.cartocdn.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.openstreetmap.org https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://*.r2.dev https://images.unsplash.com https://*.greennetwork.id https://upload.wikimedia.org https://img.youtube.com https://i.ytimg.com https://www.springhub.id https://static.cloudflareinsights.com https://placehold.co",
              "font-src 'self' data:",
              "connect-src 'self' https://api.xendit.co https://*.r2.dev https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://static.cloudflareinsights.com",
              "media-src 'self' https://*.r2.dev",
              "frame-src https://www.youtube.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/donations/webhook",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Analisis:**

- **`output: "standalone"` (baris 7)** — kunci Docker. Next.js menghasilkan folder
  `.next/standalone` yang berisi server minimal + `node_modules` yang benar-benar
  dibutuhkan. Tanpa ini, image Docker harus menyalin seluruh `node_modules`
  (ratusan MB); dengan ini image runner hanya berisi server + aset statis
  (lihat §9.8 Dockerfile).
- **`images.remotePatterns` (baris 8-19)** — daftar putih *hostname* untuk
  komponen `next/image`. Ini sekaligus pengaman SSRF tingkat-1 untuk optimizer
  gambar: hostname di luar daftar ditolak 400 oleh Next.js sendiri. Pola
  `*.r2.dev` mengizinkan subdomain R2 (bucket foto), `i.ytimg.com` untuk
  thumbnail YouTube (§10.14).
- **`serverComponentsExternalPackages` (baris 23-35)** — modul native/heavy yang
  TIDAK boleh dibundel ke server runtime: `sharp` (pengolah gambar C++),
  `@prisma/adapter-pg` + `pg`, `ioredis`/`bullmq` (antrean), `jsdom` +
  `dompurify` (sanitasi XSS server-side, BAB 10 §10.2). Memasukkan `jsdom` ke
  bundle client akan menggagalkan build dan membocorkan sanitizer.
- **CSP (baris 49-63)** — satu-satunya sumber kebenaran CSP ada di sini, BUKAN di
  nginx (keputusan sesi audit 2 Juli 2026 setelah ditemukan duplikasi CSP yang
  saling menimpa). Direktif yang menonjol: `frame-ancestors 'none'` (anti
  clickjacking, melengkapi `X-Frame-Options: DENY`), `form-action 'self'`
  (memblokir form yang menyerahkan data ke domain lain), `base-uri 'self'`
  (anti base-tag injection). `script-src` masih mengizinkan `'unsafe-inline'`
  dan `'unsafe-eval'` — kompromi untuk Next.js dev tooling dan Leaflet; dicatat
  sebagai area perbaikan bertingkat.

---

## 9.4 `nginx.conf` — Reverse Proxy Produksi (331 baris)

Nginx adalah pintu gerbang sesungguhnya dari internet. Semua request masuk ke
sini dulu; baru diteruskan ke `web:31759`. Berikut pembedahan lengkap.

### 9.4.1 Bagian global: hardening & buffer

```nginx
# nginx.conf — baris 1-45
events {
  worker_connections 2048;
  multi_accept on;
  use epoll;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;

  # ── Security: Sembunyikan versi nginx ──
  server_tokens off;

  # ── Security: Timeouts & buffer overflow protection ──
  client_body_timeout   10s;
  client_header_timeout 10s;
  send_timeout          10s;
  keepalive_timeout     65;
  keepalive_requests    100;
  client_max_body_size  20M;
  client_body_buffer_size       128k;
  client_header_buffer_size     1k;
  large_client_header_buffers   4 8k;

  # ── Security: Cegah IP spoof / open proxy ──
  underscores_in_headers off;
```

**Cerita konfigurasi:** `server_tokens off` menyembunyikan versi nginx dari
header `Server` — penyerang yang melakukan *version fingerprinting* tidak
mendapat amunisi untuk mencari CVE spesifik versi. `client_max_body_size 20M`
membatasi ukuran body (foto maks 10MB + overhead multipart; lihat BAB 10 §10.5
tentang payload raksasa). `large_client_header_buffers 4 8k` membatasi ukuran
header per request — serangan *slowloris* yang mengirim header raksasa akan
ditolak di lapisan ini, bukan membebani Node.js.

### 9.4.2 Rate limiting zones

```nginx
# nginx.conf — baris 47-59
  # ═══════════════════════════════════════════════════════════════
  # RATE LIMITING ZONES
  # ═══════════════════════════════════════════════════════════════
  limit_req_zone $binary_remote_addr zone=api:10m     rate=30r/s;
  limit_req_zone $binary_remote_addr zone=auth:10m    rate=5r/s;
  limit_req_zone $binary_remote_addr zone=donate:10m  rate=3r/s;
  limit_req_zone $binary_remote_addr zone=newsletter:10m rate=2r/m;
  limit_req_zone $binary_remote_addr zone=report:10m  rate=1r/s;
  limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

  # Cache zone for static files
  proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m
                   inactive=365d max_size=1g;
```

Enam zona rate limit dengan kebijakan berbeda per fungsi:

| Zone | Rate | Dipakai di | Efek |
|---|---|---|---|
| `api` | 30 r/s | `/api/` generik | Anti scraping API umum |
| `auth` | 5 r/s | login & register | Anti brute force lapis nginx |
| `donate` | 3 r/s | pembuatan invoice donasi | Anti spam donasi |
| `newsletter` | 2 r/m | newsletter | Anti bom email |
| `report` | 1 r/s | submit laporan | Anti flood form |
| `conn_limit` | 10 koneksi | semua | Anti koneksi numpuk |

Key-nya `$binary_remote_addr` — bentuk biner (4 byte) alamat IP, hemat memori
zona 10MB bisa menampung ratusan ribu key. Ini lapisan PERTAMA; di dalam
aplikasi masih ada rate limiter Redis kedua (BAB 10 §10.4).

### 9.4.3 Cloudflare real-IP

```nginx
# nginx.conf — baris 66-89
  # ── Cloudflare Real IP (biar rate limiter pake IP asli visitor, bukan IP Cloudflare) ──
  set_real_ip_from 173.245.48.0/20;
  set_real_ip_from 103.21.244.0/22;
  set_real_ip_from 103.22.200.0/22;
  set_real_ip_from 103.31.4.0/22;
  set_real_ip_from 141.101.64.0/18;
  set_real_ip_from 108.162.192.0/18;
  set_real_ip_from 190.93.240.0/20;
  set_real_ip_from 188.114.96.0/20;
  set_real_ip_from 197.234.240.0/22;
  set_real_ip_from 198.41.128.0/17;
  set_real_ip_from 162.158.0.0/15;
  set_real_ip_from 104.16.0.0/13;
  set_real_ip_from 104.24.0.0/14;
  set_real_ip_from 172.64.0.0/13;
  set_real_ip_from 131.0.72.0/22;
  set_real_ip_from 2400:cb00::/32;
  set_real_ip_from 2606:4700::/32;
  set_real_ip_from 2803:f800::/32;
  set_real_ip_from 2405:b500::/32;
  set_real_ip_from 2405:8100::/32;
  set_real_ip_from 2a06:98c0::/29;
  set_real_ip_from 2c0f:f248::/32;
  real_ip_header CF-Connecting-IP;
```

**Mengapa ini penting?** Dengan proxy Cloudflare ON, semua request tampak datang
dari IP Cloudflare (ratusan IP bersama). Jika nginx percaya `$remote_addr`
sebagai IP klien, maka: (1) rate limiter menghitung seluruh pengunjung situs
sebagai satu IP → semua orang kena batas barengan; (2) `$binary_remote_addr`
jadi tidak berguna. Solusinya: `set_real_ip_from` mendeklarasikan daftar prefix
Cloudflare (dari `https://www.cloudflare.com/ips-v4` dan `ips-v6`), lalu
`real_ip_header CF-Connecting-IP` — header khusus yang DISISIPKAN Cloudflare dan
tidak bisa dipalsukan klien karena koneksi TCP asli memang berasal dari
Cloudflare. Hasilnya: nginx melihat IP visitor asli, dan middleware Next.js
menerima `x-real-ip` yang benar (lihat §9.2 baris 36-45).

### 9.4.4 SSL & upstream

```nginx
# nginx.conf — baris 91-100
  # ── SSL settings ────────────────────────────────────────────
  ssl_certificate /etc/letsencrypt/live/www.springhub.id/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/www.springhub.id/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1h;
  ssl_session_tickets off;
  ssl_buffer_size 4k;

  # ═══════════════════════════════════════════════════════════════
  # CATCH-ALL: Akses via IP langsung (76.13.198.18)
  # ═══════════════════════════════════════════════════════════════
  server {
    listen 80;
    server_name _;
```

Sertifikat Let's Encrypt dimount read-only dari host (`/etc/letsencrypt:ro` di
compose, §9.7). TLS 1.2 + 1.3 saja; TLS 1.0/1.1 (yang punya kerentanan
BEAST/POODLE) ditolak. `ssl_session_tickets off` mencegah *session ticket*
yang bisa disalahgunakan untuk *ticket forgery*; session cache 10MB dipakai
sebagai gantinya. `ssl_buffer_size 4k` mempercepat TTFB untuk halaman kecil.

### 9.4.5 Blok lokasi produksi (HTTPS, baris 180-330)

```nginx
  # HTTPS → serve
  server {
    listen 443 ssl;
    http2 on;
    server_name springhub.id www.springhub.id;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), geolocation=(self), microphone=()" always;
    # CSP diatur di next.config.mjs — hanya satu sumber kebenaran

    # Uploaded files
    location /uploads/ {
      alias /data/uploads/;
      expires 365d;
      add_header Cache-Control "public, immutable, max-age=31536000";
      access_log off;
      autoindex off;
    }
```

Tiga pola blok lokasi yang perlu dipelajari:

1. **`/uploads/` (baris 194-201)** — file foto dilayani LANGSUNG dari disk volume
   (`/data/uploads`), tidak lewat Node.js. `autoindex off` mencegah listing
   direktori (orang bisa mem-browse semua foto orang lain), `expires 365d` +
   `immutable` karena nama file mengandung timestamp unik (`1700000000-ab12cd.jpg`).
2. **`/_next/static` (baris 203-211)** — aset build Next.js di-cache proxy 365
   hari dengan `proxy_cache_use_stale error timeout updating`: jika upstream
   (web) mati saat cache miss, nginx tetap menyajikan versi basi — halaman tidak
   mati total saat deploy.
3. **Endpoint sensitif (baris 213-270)** — `limit_req` khusus: `/api/auth/login`
   (5 r/s, burst 3), `/api/auth/register` (burst 2), `/api/donations/invoice`
   (3 r/s), `/api/reports` (1 r/s), `/api/newsletter` (2 r/m). Order lokasi
   nginx menentukan: blok spesifik didaftarkan LEBIH DULU daripada
   `/api/` generik (baris 273) dan `/` (baris 318), sehingga pola endpoint
   penting selalu menang.

```nginx
    # API routes — strict rate limiting per endpoint
    location /api/auth/login {
      limit_req zone=auth burst=3 nodelay;
      limit_conn conn_limit 5;
      proxy_pass http://nextjs;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_read_timeout 30s;
    }
```

Perhatikan `proxy_set_header X-Real-IP $remote_addr` — nilai `$remote_addr` di
sini sudah IP asli visitor berkat blok real-IP Cloudflare (§9.4.3). Header ini
yang dibaca `middleware.ts` dan `lib/auth.ts:getClientIp()`.

### 9.4.6 Catch-all & redirect HTTP

```nginx
  # HTTP → HTTPS redirect
  server {
    listen 80;
    server_name springhub.id www.springhub.id;
    return 301 https://www.springhub.id$request_uri;
  }
```

Semua traffic HTTP di-redirect 301 ke HTTPS — tidak ada konten yang dilayani
tanpa enkripsi. Server `server_name _` (catch-all) melayani akses langsung ke
IP VPS dengan security headers yang sama, sehingga IP mentah pun tidak menjadi
pintu masuk yang "lebih lemah".

---

## 9.5 `nginx-staging.conf` — Gerbang Staging dengan Basic Auth

Staging TIDAK boleh sama terbukanya dengan produksi — data di dalamnya adalah
*restore* dari backup produksi (termasuk PII pengguna). Karena itu staging
dilindungi **Basic Auth** dan hanya mendengar di `127.0.0.1:8080`.

```nginx
# nginx-staging.conf — 91 baris
worker_processes auto;
events { worker_connections 1024; }
http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  keepalive_timeout 65;

  # Staging hanya mendengar 127.0.0.1:8080 — bisa diakses via SSH tunnel
  # atau reverse-proxy Cloudflare. TLS ditangani lapisan depan.

  limit_req_zone $binary_remote_addr zone=stg_general:10m rate=20r/s;

  upstream staging_web {
    server web:31760;
    keepalive 16;
  }

  server {
    listen 80;
    server_name staging.springhub.id;

    auth_basic "SpringHub Staging";
    auth_basic_user_file /etc/nginx/htpasswd-staging;

    limit_req zone=stg_general burst=40 nodelay;

    client_max_body_size 20m;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
      proxy_pass http://staging_web;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header Connection "";
    }

    location /uploads/ {
      alias /data/uploads/;
      expires 30d;
      add_header Cache-Control "public, immutable";
    }

    location ~ ^/api/ {
      proxy_pass http://staging_web;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
      limit_req zone=stg_general burst=60 nodelay;
    }
  }

  # Preview per-branch: <branch>.staging.springhub.id → web-<branch>:31760
  server {
    listen 80;
    server_name ~^(?<sub>[a-z0-9-]+)\.staging\.springhub\.id$;

    auth_basic "SpringHub Preview";
    auth_basic_user_file /etc/nginx/htpasswd-preview;

    resolver 127.0.0.11 valid=10s;
    set $backend "web-${sub}:31760";

    limit_req zone=stg_general burst=40 nodelay;
    client_max_body_size 20m;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    location / {
      proxy_pass http://$backend;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header Connection "";
    }

    location /uploads/ {
      alias /data/uploads/;
      expires 30d;
      add_header Cache-Control "public, immutable";
    }
  }
}
```

**Pelajaran konfigurasi:**

- **Baris 23-24 — Basic Auth.** `auth_basic_user_file` menunjuk file htpasswd
  yang DIBUAT OTOMATIS oleh `scripts/setup-htpasswd-staging.sh` saat deploy
  (§9.13). File htpasswd ada di `.gitignore` — kredensial staging tidak pernah
  masuk git. Password disimpan sebagai hash `apr1` (bukan plaintext).
- **Baris 62-65 — Virtual host dinamis.** `server_name ~^(?<sub>[a-z0-9-]+)\.staging\.springhub\.id$`
  menggunakan *named regex capture*: subdomain apa pun (mis. `feat-map`,
  `fix-login`) diterima. Nama itu menjadi nama container: `set $backend
  "web-${sub}:31760"` lalu `proxy_pass http://$backend`. `resolver 127.0.0.11`
  adalah DNS bawaan Docker — wajib karena nama backend berupa variabel
  (nginx tidak bisa resolve nama dinamis tanpa resolver eksplisit).
- **Baris 67-69 — Berhati-hati dengan regex di nginx.** `server_name ~^...$`
  adalah regex **tanpa kurung kurawal** — pelajaran dari sesi 12 Agustus 2026:
  pola asli memakai `{1,30}` (quantifier) dan nginx meng-parse kurung kurawal
  sebagai blok, sehingga `nginx -t` gagal. Versi final membatasi panjang nama
  subdomain di sisi GitHub Actions (`head -c 30`, lihat §9.10) dan memakai
  kelas karakter sederhana di regex.
- **Tidak ada HTTPS di sini.** Staging hanya `listen 80` di loopback
  `127.0.0.1:8080`; TLS ditangani lapisan depan (Cloudflare Access / SSH
  tunnel). Ini keputusan sadar: mengurangi permukaan sertifikat dan memaksa
  akses staging lewat jalur yang sudah terautentikasi.

---

## 9.6 `docker-compose.yml` — Orkestrasi Produksi

```yaml
# docker-compose.yml — 153 baris
services:
  postgres:
    image: postgis/postgis:16-3.4-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: springhub
      POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD belum di-set di .env}
      POSTGRES_DB: springhub
    # Batasi koneksi + timeout — cegah koneksi numpuk kayak di Supabase
    command:
      - "postgres"
      - "-c"
      - "max_connections=50"
      - "-c"
      - "idle_in_transaction_session_timeout=30000"
      - "-c"
      - "statement_timeout=30000"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U springhub"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru --requirepass ${REDIS_PASSWORD:?REDIS_PASSWORD belum di-set}
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a '${REDIS_PASSWORD}' ping | grep -q PONG"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M

  web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - .env.production
    environment:
      DATABASE_URL: "postgresql://springhub:${DB_PASSWORD:?DB_PASSWORD belum di-set}@postgres:5432/springhub"
      REDIS_URL: "redis://default:${REDIS_PASSWORD:?REDIS_PASSWORD belum di-set}@redis:6379"
      REDIS_QUEUE_URL: "redis://default:${REDIS_PASSWORD:?REDIS_PASSWORD belum di-set}@redis:6379"
      UPLOAD_DIR: "/data/uploads"
      UPLOAD_URL_PREFIX: "/uploads"
      PORT: "31759"
    ports:
      - "127.0.0.1:31759:31759"
    volumes:
      - uploads_data:/data/uploads
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:31759/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - .env.production
    environment:
      REDIS_URL: "redis://default:${REDIS_PASSWORD:?REDIS_PASSWORD belum di-set}@redis:6379"
      REDIS_QUEUE_URL: "redis://default:${REDIS_PASSWORD:?REDIS_PASSWORD belum di-set}@redis:6379"
    command: npx tsx workers/email-worker.ts
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    deploy:
      resources:
        limits:
          memory: 256M

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - uploads_data:/data/uploads:ro
    depends_on:
      web:
        condition: service_healthy
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
      - CHOWN
      - DAC_OVERRIDE
      - SETGID
      - SETUID
    deploy:
      resources:
        limits:
          memory: 256M

volumes:
  postgres_data:
  redis_data:
  # certbot_data dihapus — tidak dipakai
  uploads_data:
```

**Pola yang wajib dipahami:**

1. **`${DB_PASSWORD:?DB_PASSWORD belum di-set di .env}` (baris 7)** — operator
   `:?` membuat Compose GAGAL dengan pesan jelas jika variabel tidak ada.
   Kesalahan konfigurasi terdeteksi saat deploy, bukan saat runtime meledak
   dengan koneksi ditolak.
2. **Batasan PostgreSQL (baris 10-17)** — `max_connections=50`,
   `idle_in_transaction_session_timeout=30000`, `statement_timeout=30000`.
   Ini pelajaran dari era Supabase: koneksi yang numpuk karena transaksi
   menggantung membuat DB tak responsif. Kini server sendiri yang memutus
   koneksi idle >30 detik dan query >30 detik.
3. **Binding `127.0.0.1:PORT:PORT` (baris 20-21, 40-41, 71-72)** — semua port
   internal (postgres 5432, redis 6379, web 31759) TIDAK diekspos ke internet,
   hanya loopback VPS. Satu-satunya yang mendengar dunia luar: nginx (80/443).
   Inilah yang membuat `scripts/firewall-rules.sh` bisa menutup semua port
   kecuali 22/80/443 tanpa memutus internal.
4. **`depends_on: condition: service_healthy` (baris 56-61)** — web menunggu
   postgres DAN redis sehat (bukan sekadar start). nginx menunggu web sehat.
   Rantai ini mencegah *crash-loop* klasik "web start sebelum DB siap". Untuk
   worker, `depends_on` postgres+redis juga diterapkan (temuan audit 2 Juli
   2026 — sebelumnya worker bisa start sebelum Redis dan gagal koneksi).
5. **`security_opt: no-new-privileges:true` + `cap_drop: ALL`** — kontainer
   berjalan dengan hak istimewa minimal; `cap_add` hanya menambah yang
   dibutuhkan (`NET_BIND_SERVICE` untuk bind port <1024). Jika ada eksploitasi
   di aplikasi, penyerang tidak otomatis mendapat root container.
6. **Healthcheck** — `wget -qO- http://127.0.0.1:31759/api/health` (web) dan
   `pg_isready` (postgres). Healthcheck bukan pajangan: dipakai `depends_on`,
   dipakai nginx `condition: service_healthy`, dan dipakai pipeline deploy
   untuk verifikasi pasca-deploy.
7. **Memori dibatasi eksplisit** (2G postgres, 1G web, 256M redis/worker/nginx).
   Satu VPS berbagi sumber daya; container yang bocor memori (misal worker
   dengan job raksasa) tidak bisa memakan RAM milik web.

---

## 9.7 `docker-compose.staging.yml` — Staging Paralel di VPS yang Sama

File ini adalah studi kasus "bagaimana menjalankan dua lingkungan di satu host
tanpa saling menyenggol". Prinsipnya: **bedakan project, port, volume, dan
database**.

```yaml
# docker-compose.staging.yml — baris 1-77 (porsi web)
# SpringHub STAGING — berjalan PARALEL dengan produksi di VPS yang sama.
# Produksi (docker-compose.yml) TIDAK disentuh. Semua port host dibedakan.
# Jalankan: docker compose --env-file .env.staging -p staging -f docker-compose.staging.yml up -d --build
# Data: DB springhub_staging (port 5433), Redis DB 1 (port 6380), uploads_staging_data.

services:
  postgres:
    image: postgis/postgis:16-3.4-alpine
    restart: unless-stopped
    container_name: staging-postgres
    environment:
      POSTGRES_USER: springhub
      POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD belum di-set di .env.staging}
      POSTGRES_DB: springhub_staging
    command:
      - "postgres"
      - "-c"
      - "max_connections=50"
      - "-c"
      - "idle_in_transaction_session_timeout=30000"
      - "-c"
      - "statement_timeout=30000"
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U springhub -d springhub_staging"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    container_name: staging-redis
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru --requirepass ${REDIS_PASSWORD:?REDIS_PASSWORD belum di-set}
    volumes:
      - redis_staging_data:/data
    ports:
      - "127.0.0.1:6380:6379"
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a '${REDIS_PASSWORD}' ping | grep -q PONG"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M

  web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    container_name: staging-web
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - .env.staging
    environment:
      DATABASE_URL: "postgresql://springhub:${DB_PASSWORD}@postgres:5432/springhub_staging?connection_limit=5&pool_timeout=10"
      REDIS_URL: "redis://default:${REDIS_PASSWORD}@redis:6379/1"
      REDIS_QUEUE_URL: "redis://default:${REDIS_PASSWORD}@redis:6379/1"
      UPLOAD_DIR: "/data/uploads"
      UPLOAD_URL_PREFIX: "/uploads"
      PORT: "31760"
    ports:
      - "127.0.0.1:31760:31760"
    volumes:
      - uploads_staging_data:/data/uploads
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:31760/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M
```

**Perbedaan kunci vs produksi:**

| Aspek | Produksi | Staging |
|---|---|---|
| Project Compose | `(default)` | `-p staging` |
| `container_name` | `springhub-postgres-1` dst. | `staging-postgres` dst. |
| DB | `springhub` | `springhub_staging` (DB beda!) |
| Port host postgres | `127.0.0.1:5432` | `127.0.0.1:5433` |
| Port host redis | `127.0.0.1:6379` | `127.0.0.1:6380` + **DB index 1** |
| Port web | `127.0.0.1:31759` | `127.0.0.1:31760` |
| Nginx | 80/443 publik | `127.0.0.1:8080` + Basic Auth |
| Volume | `postgres_data` | `postgres_staging_data` |
| Env file | `.env.production` | `.env.staging` |
| Migrasi | `migrate deploy` | `migrate deploy` + `db push` |

Catatan `REDIS_URL ... /1` (DB index 1): staging memakai Redis yang SAMA
instansinya dengan produksi di dalam docker network, tapi database index
berbeda (`/1` vs default `0`). Antrean BullMQ dan key rate limit staging tidak
akan bentrok dengan produksi. Ini kompromi hemat sumber daya yang aman karena
isolasi logis Redis antar index.

Staging juga memakai `container_name` eksplisit karena `docker-compose.preview.yml`
menyambung ke `staging-postgres`/`staging-redis` lewat network eksternal
`staging_default` (lihat §9.8).

---

## 9.8 `docker-compose.preview.yml` — Preview per-Branch

Setiap branch fitur (`feat/*`, `fix/*`, dst.) mendapat environment sendiri:
container `web-<branch>` yang menyambung ke postgres/redis STAGING (bukan
produksi), di port dinamis.

```yaml
# docker-compose.preview.yml — 56 baris
# Preview per-branch fitur: <branch>.staging.springhub.id
# Memakai postgres/redis/volume staging (bukan produksi!). Web saja.
# Deploy: docker compose -p preview-<branch> -f docker-compose.preview.yml up -d --build

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    image: springhub-preview-${PREVIEW_NAME}:latest
    container_name: web-${PREVIEW_NAME}
    restart: unless-stopped
    env_file:
      - .env.staging
    environment:
      DATABASE_URL: "postgresql://springhub:${DB_PASSWORD}@staging-postgres:5432/springhub_staging?connection_limit=5&pool_timeout=10"
      REDIS_URL: "redis://default:${REDIS_PASSWORD}@staging-redis:6379/1"
      REDIS_QUEUE_URL: "redis://default:${REDIS_PASSWORD}@staging-redis:6379/1"
      UPLOAD_DIR: "/data/uploads"
      UPLOAD_URL_PREFIX: "/uploads"
      PORT: "31760"
    ports:
      - "127.0.0.1:${PREVIEW_PORT}:31760"
    volumes:
      - uploads_staging_data:/data/uploads
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:31760/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 90s
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M
    networks:
      - default
      - staging_net

networks:
  staging_net:
    external: true
    name: staging_default

volumes:
  uploads_staging_data:
    external: true
    name: staging_uploads_staging_data
```

**Mekanisme:**
- `container_name: web-${PREVIEW_NAME}` — nama container inilah yang dipakai
  nginx-staging (`server_name ~^(?<sub>...)$` → `web-${sub}:31760`, §9.5).
- `ports: "127.0.0.1:${PREVIEW_PORT}:31760"` — port dinamis dihitung di
  GitHub Actions dari hash nama branch (`32000 + (cksum % 399)`), jadi dua
  branch tidak pernah rebutan port; `.env.staging` di-load via `env_file`.
- `networks: staging_net (external, name: staging_default)` — container preview
  bergabung ke network project staging sehingga bisa resolve `staging-postgres`
  dan `staging-redis` secara langsung. Volume uploads juga external
  (`staging_uploads_staging_data`) — file foto preview berbagi dengan staging.
- **Tidak ada worker sendiri**: preview memakai worker staging (yang mendengar
  antrean `email`/`image-processing` di Redis index 1). Cukup untuk verifikasi
  UI; pekerja eksperimen yang merusak produksi tidak mungkin terjadi karena
  index Redis terpisah.

---

## 9.9 `Dockerfile` — Multi-Stage Build (deps → builder → runner)

```dockerfile
# Dockerfile — 47 baris
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ sqlite-dev
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts

# Builder
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ sqlite-dev
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner (standalone)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install tsx for worker scripts
RUN npm install -g tsx

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/workers ./workers
COPY --from=builder /app/lib ./lib
COPY --from=deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 31759

ENV PORT=31759
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Tiga tahap, tiga tujuan:**

1. **`deps`** — meng-install dependency produksi (`--only=production`) sekali,
   di-cache layer Docker. Tidak ada `npm ci` ganda di runner.
2. **`builder`** — install semua dependency (termasuk dev), generate Prisma
   Client, lalu `npm run build` → menghasilkan `.next/standalone`. Build
   context kecil berkat `.dockerignore` (node_modules, .next, backup, dll —
   dari 1,8GB turun ke ~1 menit build, temuan sesi 12 Juli 2026).
3. **`runner`** — image final **tanpa toolchain build** (tidak ada
   python/g++), berjalan sebagai user non-root `nextjs` (uid 1001), hanya
   berisi: `public/`, `.next/standalone` (server), `.next/static`,
   `prisma/` (migrasi + seed), `workers/` dan `lib/` (agar `tsx` bisa
   menjalankan worker — docker-compose worker pakai
   `command: npx tsx workers/email-worker.ts`).

`COPY --from=deps /app/node_modules` menyalin dependency produksi hasil tahap
deps — dengan begitu runner TIDAK perlu menjalankan `npm ci` (yang butuh
network + toolchain). `CMD ["node", "server.js"]` menjalankan server standalone
pada `PORT=31759`, `HOSTNAME=0.0.0.0` (wajib agar bisa diproxy nginx dari
kontainer lain).

---

## 9.10 `.github/workflows/deploy.yml` — Pipeline CI/CD

```yaml
# .github/workflows/deploy.yml — 141 baris
name: Deploy SpringHub

on:
  push:
    branches:
      - main
      - develop
      - "feat/**"
      - "fix/**"
      - "refactor/**"
      - "chore/**"
  pull_request:
    types: [closed]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npx tsc --noEmit
      - run: npx vitest run

  # ── PRODUKSI: hanya dari branch main ─────────────────────────────────────
  deploy-production:
    needs: test
    if: github.ref_name == 'main'
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e
            cd /root/springhub
            git fetch origin main
            git checkout main
            git pull --ff-only origin main
            npm ci
            npx prisma generate
            # Migrasi hanya jalan kalau ada migration baru (aman diulang)
            docker compose --env-file .env run --rm web npx prisma migrate deploy || true
            docker compose build web worker
            docker compose up -d --force-recreate web worker nginx
            docker image prune -f
            curl -fsS http://127.0.0.1:31759/api/health || echo "WARN: health check gagal, cek log"
```

**Struktur pipeline:** lima job — `test` (wajib lulus untuk semua), lalu
`deploy-production` (hanya `main`), `deploy-staging` (hanya `develop`),
`deploy-preview` (branch `feat/*`/`fix/*`/`refactor/*`/`chore/*`), dan
`teardown-preview` (saat PR ditutup). Semua deploy memakai
`appleboy/ssh-action` — GitHub Actions hanya memicu; eksekusi terjadi di VPS
via SSH dengan kunci dari GitHub Secrets (`VPS_HOST`, `VPS_USER`,
`VPS_SSH_KEY` — tidak pernah ada di repo).

**Pola deploy produksi yang penting:**

- `git pull --ff-only` — mencegah merge divergen di server; kalau ada konflik,
  pipeline gagal sebelum menyentuh container.
- Migrasi dijalankan sebagai container sekali jalan: `docker compose run --rm
  web npx prisma migrate deploy || true` — `|| true` karena migrasi idempotent
  dan kegagalan migrasi yang sudah ter-apply tidak boleh menggagalkan seluruh
  deploy (temuan: baris migrasi pernah tidak sinkron; sekarang `migrate deploy`
  aman diulang).
- `docker compose up -d --force-recreate web worker nginx` — postgres/redis
  TIDAK di-recreate (data tetap), hanya aplikasi. Rollback = checkout commit
  lama + ulangi deploy.

```yaml
  # ── STAGING: dari branch develop ─────────────────────────────────────────
  deploy-staging:
    needs: test
    if: github.ref_name == 'develop'
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e
            cd /root/springhub
            git fetch origin develop
            git checkout develop
            git pull --ff-only origin develop
            npm ci
            npx prisma generate
            ./scripts/setup-htpasswd-staging.sh
            docker compose --env-file .env.staging -f docker-compose.staging.yml -p staging build web
            docker compose --env-file .env.staging -f docker-compose.staging.yml -p staging up -d postgres redis
            # Migrasi staging (migrate deploy + db push untuk tabel db-push-only)
            docker compose --env-file .env.staging -f docker-compose.staging.yml -p staging run --rm web npx prisma migrate deploy || true
            docker compose --env-file .env.staging -f docker-compose.staging.yml -p staging run --rm web npx prisma db push || true
            docker compose --env-file .env.staging -f docker-compose.staging.yml -p staging up -d --force-recreate web worker nginx
            docker image prune -f
            curl -fsS http://127.0.0.1:31760/api/health || echo "WARN: staging health check gagal"
```

Staging menjalankan **dua** alat sinkronisasi skema: `migrate deploy` untuk
migration resmi + `db push` untuk tabel yang selama ini dikelola lewat push
langsung (temuan sesi 6 Juni 2026 — DB tidak sinkron karena sebagian migration
tidak pernah di-apply). `setup-htpasswd-staging.sh` dijalankan sebelum nginx
agar file htpasswd selalu fresh dari `.env.staging`.

```yaml
  # ── PREVIEW per-branch fitur: <branch>.staging.springhub.id ──────────────
  deploy-preview:
    needs: test
    if: startsWith(github.ref_name, 'feat/') || startsWith(github.ref_name, 'fix/') || startsWith(github.ref_name, 'refactor/') || startsWith(github.ref_name, 'chore/')
    runs-on: ubuntu-latest
    steps:
      - name: Compute preview name + port
        id: meta
        env:
          BRANCH: ${{ github.ref_name }}
        run: |
          name=$(echo "$BRANCH" | sed -E 's#(feat|fix|refactor|chore)/##' | tr '[:upper:]_' '[:lower:]-' | tr -cd 'a-z0-9-' | head -c 30)
          hash=$(printf '%s' "$name" | cksum | awk '{print $1}')
          port=$(( 32000 + (hash % 399) ))
          echo "name=$name" >> "$GITHUB_OUTPUT"
          echo "port=$port" >> "$GITHUB_OUTPUT"
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          envs: PREVIEW_NAME,PREVIEW_PORT
          script: |
            set -e
            cd /root/springhub
            git fetch origin ${{ github.ref_name }}
            git checkout -B ${{ github.ref_name }} origin/${{ github.ref_name }} || git checkout ${{ github.ref_name }}
            git pull --ff-only origin ${{ github.ref_name }}
            npm ci
            npx prisma generate
            export PREVIEW_NAME=$PREVIEW_NAME PREVIEW_PORT=$PREVIEW_PORT
            docker compose -p preview-$PREVIEW_NAME -f docker-compose.preview.yml build web
            docker compose -p preview-$PREVIEW_NAME -f docker-compose.preview.yml up -d --force-recreate web
            docker image prune -f
            curl -fsS http://127.0.0.1:$PREVIEW_PORT/api/health || echo "WARN: preview health check gagal"

  # ── Teardown preview saat PR/branch ditutup ───────────────────────────────
  teardown-preview:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Compute preview name
        id: meta
        env:
          BRANCH: ${{ github.event.pull_request.head.ref }}
        run: |
          name=$(echo "$BRANCH" | sed -E 's#(feat|fix|refactor|chore)/##' | tr '[:upper:]_' '[:lower:]-' | tr -cd 'a-z0-9-' | head -c 30)
          echo "name=$name" >> "$GITHUB_OUTPUT"
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          envs: PREVIEW_NAME
          script: |
            cd /root/springhub
            docker compose -p preview-$PREVIEW_NAME -f docker-compose.preview.yml down --remove-orphans || true
```

**Penamaan + port deterministik** (baris 96-100): nama branch dibersihkan
(`feat/Peta-Map` → `peta-map`), dipotong 30 karakter (aman untuk hostname
container + regex nginx), lalu `cksum % 399` menghasilkan port unik di rentang
`32000-32399`. Karena berbasis hash nama, port STABIL antar deploy — restart
tidak pindah port. Teardown otomatis saat PR ditutup mencegah akumulasi
container preview.

---

## 9.11 `scripts/firewall-rules.sh` — UFW: Internet Hanya Lewat Cloudflare

Setelah Cloudflare proxy ON, tidak ada alasan bagi dunia luar untuk menghubungi
VPS selain SSH admin dan Cloudflare. Skrip ini menutup semua port lain.

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SpringHub — Server Firewall & Hardening Script
# ═══════════════════════════════════════════════════════════════
# Setelah Cloudflare Proxy ON, akses langsung ke VPS via HTTP/HTTPS
# hanya berasal dari IP Cloudflare. Script ini memperkuat UFW dengan:
#   1. Restrict port 80/443 hanya dari IP Cloudflare
#   2. Rate limit SSH (port 22)
#   3. Block port selain 22, 80, 443
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

echo "=== SpringHub Firewall Hardening ==="
echo ""

# ── 1. Reset UFW ke default ──
echo "[1/5] Reset UFW ke default..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# ── 2. SSH — rate limited ──
echo "[2/5] SSH rate limit (port 22)..."
ufw limit ssh comment "SSH rate limited"

# ── 3. Cloudflare-only untuk HTTP/HTTPS ──
echo "[3/5] Allow HTTP/HTTPS hanya dari Cloudflare..."
CLOUDFLARE_IPV4_URL="https://www.cloudflare.com/ips-v4"
CLOUDFLARE_IPV6_URL="https://www.cloudflare.com/ips-v6"

if command -v curl &>/dev/null; then
  # IPv4 ranges
  for ip in $(curl -s "$CLOUDFLARE_IPV4_URL"); do
    ufw allow proto tcp from "$ip" to any port 80,443 comment "Cloudflare IPv4"
  done
  # IPv6 ranges
  for ip in $(curl -s "$CLOUDFLARE_IPV6_URL"); do
    ufw allow proto tcp from "$ip" to any port 80,443 comment "Cloudflare IPv6"
  done
  echo "   ✅ Cloudflare IPs loaded ($(curl -s "$CLOUDFLARE_IPV4_URL" | wc -l) IPv4, $(curl -s "$CLOUDFLARE_IPV6_URL" | wc -l) IPv6)"
else
  echo "   ⚠️  curl not found — allow all to port 80/443 (fallback)"
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

# ── 4. Enable UFW ──
echo "[4/5] Enable UFW..."
ufw --force enable

# ── 5. Status ──
echo ""
echo "[5/5] UFW Status:"
ufw status numbered

echo ""
echo "=== Done ==="
echo "Catatan: Jalankan script ini SETELAH Cloudflare Proxy ON."
echo "Kalau web tiba-tiba gak bisa diakses, jalankan: ufw allow 80,443/tcp"
```

**Pembacaan kritis:**

- `ufw --force reset` + `default deny incoming` — *default-deny*: apa pun yang
  tidak diizinkan eksplisit otomatis ditolak. Ini jauh lebih aman daripada
  *default-allow* + daftar blokir.
- `ufw limit ssh` — rate limit koneksi SSH (maks 6 per 30 detik per IP).
  Serangan brute force SSH dari bot internet langsung tersendat di lapisan
  kernel, sebelum fail2ban ikut bekerja (§9.12).
- Loop `for ip in $(curl ...)` mengambil daftar prefix Cloudflare SAAT
  dijalankan dan membuat satu aturan per prefix. Catatan di akhir file
  menyebut fallback darurat `ufw allow 80,443/tcp` — karena memblokir semua
  non-Cloudflare berarti akses web mati total jika proxy Cloudflare dimatikan.
- **Mengapa aman untuk docker?** Semua port container sudah terikat
  `127.0.0.1` (§9.6), jadi menutup port publik 80/443 hanya dari Cloudflare
  tidak mengganggu komunikasi antar container (jaringan internal Docker tidak
  melewati UFW).

---

## 9.12 `scripts/backup-db.sh` & `scripts/capture-nginx-logs.sh` — Operasi Harian

### 9.12.1 Backup database: pg_dump → gzip → GPG AES256

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SpringHub — Database Backup Script
# Jadwal: Setiap hari jam 03:00 WIB (cron)
# Retensi: 7 hari
# Enkripsi: GPG symmetric (AES256) — file .gpg aman disimpan di cloud
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/root/backups"
DB_CONTAINER="springhub-postgres-1"
DB_USER="springhub"
DB_NAME="springhub"
ENV_FILE="/root/springhub/.env.production"

# Muat encryption key dari .env (BACKUP_ENCRYPT_KEY)
if [ -f "$ENV_FILE" ]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE" 2>/dev/null || true
fi

ENCRYPT_KEY="${BACKUP_ENCRYPT_KEY:-}"

# Buat direktori backup
mkdir -p "$BACKUP_DIR"

# Cek container running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "[$TIMESTAMP] ERROR: Container $DB_CONTAINER tidak running!" >&2
  exit 1
fi

# Execute backup — langsung pipe ke gzip + gpg kalo ada key
BACKUP_FILE="${BACKUP_DIR}/springhub-${TIMESTAMP}.sql.gz"

if [ -n "$ENCRYPT_KEY" ]; then
  # Backup encrypted (.gpg)
  ENCRYPTED_FILE="${BACKUP_DIR}/springhub-${TIMESTAMP}.sql.gz.gpg"
  docker exec "$DB_CONTAINER" pg_dump \
    -U "$DB_USER" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "$DB_NAME" 2>> "$BACKUP_DIR/backup.log" | gzip | gpg \
      --batch \
      --symmetric \
      --cipher-algo AES256 \
      --passphrase "$ENCRYPT_KEY" \
      --output "$ENCRYPTED_FILE"

  # Validasi
  if [ ! -s "$ENCRYPTED_FILE" ] || [ "$(stat -c%s "$ENCRYPTED_FILE")" -lt 1024 ]; then
    echo "[$TIMESTAMP] ERROR: Encrypted backup terlalu kecil atau kosong!" >&2
    rm -f "$ENCRYPTED_FILE"
    exit 1
  fi

  BACKUP_SIZE=$(du -h "$ENCRYPTED_FILE" | cut -f1)
  echo "[$TIMESTAMP] Encrypted backup OK: $ENCRYPTED_FILE ($BACKUP_SIZE)"

  # Hapus file .gz yang tidak dienkripsi (kalo ada)
  rm -f "$BACKUP_FILE"
else
  # Backup plaintext (tanpa enkripsi)
  docker exec "$DB_CONTAINER" pg_dump \
    -U "$DB_USER" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "$DB_NAME" 2>> "$BACKUP_DIR/backup.log" | gzip > "$BACKUP_FILE"

  # Validasi
  if [ ! -s "$BACKUP_FILE" ] || [ "$(stat -c%s "$BACKUP_FILE")" -lt 1024 ]; then
    echo "[$TIMESTAMP] ERROR: Backup file terlalu kecil atau kosong!" >&2
    rm -f "$BACKUP_FILE"
    exit 1
  fi

  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$TIMESTAMP] Backup OK: $BACKUP_FILE ($BACKUP_SIZE)"
  echo "[$TIMESTAMP] WARNING: Backup TIDAK dienkripsi. Set BACKUP_ENCRYPT_KEY di .env.production"
fi

# ── Kirim backup ke email admin ──
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  ADMIN_EMAIL="admin@springhub.id"
  BACKUP_B64=$(base64 "$BACKUP_FILE" | tr -d '\n')
  EMAIL_KEY="${EMAIL_API_KEY:-}"
  if [ -n "$EMAIL_KEY" ]; then
    curl -sf -X POST "https://api.resend.com/emails" \
      -H "Authorization: Bearer $EMAIL_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"from\": \"SpringHub Backup <noreply@springhub.id>\",
        \"to\": [\"$ADMIN_EMAIL\"],
        \"subject\": \"Backup Database SpringHub — $TIMESTAMP\",
        \"text\": \"Backup database SpringHub.\nUkuran: $BACKUP_SIZE\nFile: springhub-${TIMESTAMP}.sql.gz\n\nBackup otomatis tiap jam 3 pagi. Retensi 7 hari.\",
        \"attachments\": [{
          \"filename\": \"springhub-${TIMESTAMP}.sql.gz\",
          \"content\": \"$BACKUP_B64\"
        }]
      }" && echo "[$TIMESTAMP] Backup terkirim ke email: $ADMIN_EMAIL" \
      || echo "[$TIMESTAMP] Gagal kirim email (tidak kritis)"
  else
    echo "[$TIMESTAMP] EMAIL_API_KEY tidak ada, backup hanya lokal"
  fi
fi

# ── Retensi: hapus backup lebih dari 7 hari ──
find "$BACKUP_DIR" -name "springhub-*.sql.gz*" -type f -mtime +7 -delete
```

**Poin desain:**

1. **Enkripsi default-naik**: jika `BACKUP_ENCRYPT_KEY` diset → pipeline menjadi
   `pg_dump | gzip | gpg --symmetric --cipher-algo AES256`. Backup berisi PII
   (email, nomor WA, koordinat presisi mata air) — file `.gpg` aman disimpan
   di cloud/email. Tanpa key, skrip tetap jalan tapi mencetak WARNING keras.
2. **Validasi ukuran**: file < 1KB dianggap gagal dan dihapus — mencegah
   "backup sukses" palsu yang isinya pesan error `pg_dump`.
3. **`--no-owner --no-acl`**: restore di mesin mana pun tidak tergantung user
   PostgreSQL yang sama.
4. **Kirim via Resend API** sebagai lampiran base64 — backup off-site otomatis
   setiap 03:00 WIB. Gagal kirim email tidak menggagalkan backup lokal
   (`|| echo ... (tidak kritis)`).
5. **Retensi 7 hari** via `find -mtime +7 -delete`.

### 9.12.2 Capture log nginx untuk fail2ban

```bash
#!/bin/bash
# Capture Docker nginx logs untuk fail2ban
# Jalan tiap 60 detik via cron
LOG_FILE="/var/log/springhub-nginx.log"
CONTAINER="springhub-nginx-1"

# Cek apakah container running
docker ps --format '{{.Names}}' | grep -q "$CONTAINER" || exit 0

# Ambil log 60 detik terakhir
docker logs "$CONTAINER" --since 60s 2>&1 | grep -v "^$" >> "$LOG_FILE"

# Rotate — keep max 10000 lines
if [ $(wc -l < "$LOG_FILE") -gt 10000 ]; then
  tail -5000 "$LOG_FILE" > /tmp/nginx-log.tmp
  mv /tmp/nginx-log.tmp "$LOG_FILE"
fi
```

Log nginx ada di dalam container; fail2ban butuh file log di host. Skrip
kecil ini (dijadwalkan tiap 60 detik via cron) menyalin log 60 detik terakhir
dengan `docker logs --since 60s` ke `/var/log/springhub-nginx.log`, lalu
menjaga file tetap di bawah 10.000 baris dengan rotasi sederhana
(tail 5000 + mv). Dengan ini jail fail2ban dapat memindai pola `401`/`403`
dan memblokir IP yang mem-brute-force Basic Auth staging atau endpoint publik.

---

## 9.13 `scripts/setup-htpasswd-staging.sh` — Kredensial Staging Otomatis

```bash
#!/usr/bin/env bash
# Setup htpasswd untuk Basic Auth staging + preview.
# Wajib dijalankan sebelum nginx staging start (atau diidempoten saat deploy).
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.staging}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE tidak ditemukan" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${BASIC_AUTH_USER:?BASIC_AUTH_USER belum di-set}"
: "${BASIC_AUTH_PASS:?BASIC_AUTH_PASS belum di-set}"
: "${PREVIEW_BASIC_USER:?PREVIEW_BASIC_USER belum di-set}"
: "${PREVIEW_BASIC_PASS:?PREVIEW_BASIC_PASS belum di-set}"

mkdir -p scripts
umask 077
if command -v htpasswd >/dev/null 2>&1; then
  htpasswd -bc scripts/htpasswd-staging "$BASIC_AUTH_USER" "$BASIC_AUTH_PASS"
  htpasswd -bc scripts/htpasswd-preview "$PREVIEW_BASIC_USER" "$PREVIEW_BASIC_PASS"
else
  # Fallback: htpasswd generator pure-bash (crypt via openssl)
  openssl passwd -apr1 "$BASIC_AUTH_PASS" > /tmp/stg_pw.$$
  printf '%s:%s\n' "$BASIC_AUTH_USER" "$(cat /tmp/stg_pw.$$)" > scripts/htpasswd-staging
  openssl passwd -apr1 "$PREVIEW_BASIC_PASS" > /tmp/stg_pw2.$$
  printf '%s:%s\n' "$PREVIEW_BASIC_USER" "$(cat /tmp/stg_pw2.$$)" > scripts/htpasswd-preview
  rm -f /tmp/stg_pw.$$ /tmp/stg_pw2.$$
fi
chmod 600 scripts/htpasswd-staging scripts/htpasswd-preview
echo "htpasswd siap: scripts/htpasswd-staging + scripts/htpasswd-preview"
```

**Mengapa ada skrip ini?** Kredensial Basic Auth staging/preview TIDAK boleh
hardcode dan TIDAK boleh di-commit (`.gitignore` memuat `scripts/htpasswd-staging`
dan `scripts/htpasswd-preview`). Skrip ini membaca dari `.env.staging` —
yang juga di-ignore git — dan membangkitkan file htpasswd tepat sebelum
nginx staging di-deploy (dipanggil di `deploy-staging`, §9.10).

Detail keamanan: `umask 077` memastikan file dibuat dengan mode 600 (hanya
user root bisa baca); `chmod 600` menguatkan setelah pembuatan. Fallback
`openssl passwd -apr1` menghasilkan hash yang kompatibel dengan `htpasswd`
tanpa perlu menginstal `apache2-utils` di VPS. Parameter `:?` memastikan
skrip berhenti dengan pesan jelas jika env belum diset — tidak ada staging
yang terbuka tanpa password karena lupa konfigurasi.

---

## 9.14 `scripts/fix-orphan-reports.ts` — Data Repair Terkendali

Skrip operasional TypeScript yang dijalankan manual (bukan cron) untuk
memperbaiki data: laporan publik yang "yatim" (tidak punya `springId`) diubah
menjadi mata air + MapPoint baru secara klaster. Skrip ini layak dipelajari
karena menunjukkan **disiplin keselamatan data** yang jarang ada di proyek
sejenis.

```ts
// scripts/fix-orphan-reports.ts — baris 1-46 (header + konfigurasi)
/**
 * SpringHub — Fix Orphan Reports (Dirgapala data repair)
 * ======================================================
 * Tujuan: "Menghidupkan" laporan publik yang tidak terlihat karena tidak punya
 * springId. Laporan yang memenuhi kriteria:
 *   - springId IS NULL
 *   - status = 'approved' AND isActive = true
 *   - snappedLat / snappedLng NOT NULL
 * dikelompokkan per klaster koordinat (grid ~0.1 km, 3 desimal). Untuk setiap
 * klaster (min. 3 laporan) yang TIDAK memiliki spring aktif/pending maupun
 * MapPoint dalam radius 0.02 derajat (~2 km):
 *   1. buat Spring baru (status 'active', nama dari mode spring_name/B1_nama,
 *      fallback "Mata Air Klaster (lat, lng)"),
 *   2. tautkan SEMUA laporan klaster ke spring itu (springId + mapPointId),
 *   3. buat MapPoint (tipe diturunkan dari formSlug dominan klaster).
 * Idempotent: klaster yang sudah punya spring/MapPoint di radius di-skip.
 *
 * ⚠️⚠️⚠️ PENTING — JANGAN PERNAH DIJALANKAN TERHADAP DATABASE PRODUKSI ⚠️⚠️⚠️
 * Script ini menulis ke DATABASE_URL yang sedang aktif di environment.
 * WAJIB diuji di STAGING dulu. Cara menjalankan (pilih salah satu):
 *
 *   # Dry-run (default, TIDAK menulis apa pun):
 *   DOTENV_CONFIG_PATH=.env.staging npx tsx scripts/fix-orphan-reports.ts --dry-run
 *
 *   # Apply (menulis ke DB staging):
 *   DOTENV_CONFIG_PATH=.env.staging npx tsx scripts/fix-orphan-reports.ts --apply
 *
 *   # Alternatif tanpa file .env.staging:
 *   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" \
 *     npx tsx scripts/fix-orphan-reports.ts --dry-run
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// ─── Konfigurasi (bisa disesuaikan) ──────────────────────────────────────────
const MIN_CLUSTER_SIZE = 3; // klaster minimal 3 laporan
const CLUSTER_DECIMALS = 3; // grid klaster ≈ 0.1 km
const SKIP_RADIUS_DEG = 0.02; // spring/MapPoint dalam radius ini → skip klaster
const NAME_KEYS = ["spring_name", "B1_nama"];
const PROVINCE_KEYS = ["province", "B1_provinsi", "provinsi"];
const REGENCY_KEYS = ["regency", "B2_kabupaten_kota", "kabupaten_kota"];
```

**Disiplin keamanan yang patut ditiru:**

1. **Dry-run default** — tanpa `--apply`, skrip TIDAK menulis apa pun; ia hanya
   mencetak rencana ("akan buat spring + tautkan N laporan"). Baris 135-141:

```ts
// scripts/fix-orphan-reports.ts — baris 134-146
async function main() {
  const apply = process.argv.includes("--apply");
  const dryRun = process.argv.includes("--dry-run");
  console.log(
    apply
      ? "🔥 MODE APPLY — akan menulis ke database!"
      : `🔍 MODE DRY-RUN${dryRun ? "" : " (default)"} — tidak ada yang ditulis.`
  );
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL tidak ditemukan. Lihat header script ini.");
    process.exit(1);
  }
  console.log(`   Target: ${process.env.DATABASE_URL.replace(/\/\/[^@/]+@/, "//***@").split("?")[0]}\n`);
```

   Perhatikan baris 146: URL database di-*mask* (`//***@`) sebelum dicetak —
   password koneksi tidak pernah muncul di log.

2. **Idempotent** — klaster yang sudah punya spring/MapPoint dalam radius
   `SKIP_RADIUS_DEG` di-skip; slug MapPoint yang bentrok diberi suffix
   `-2`, `-3`, ... (baris 262-266). Menjalankan ulang skrip tidak akan
   menggandakan data.

3. **Transaksi per klaster** — spring + MapPoint + tautan laporan dibungkus
   `prisma.$transaction` (baris 245): jika salah satu gagal, seluruh klaster
   batal — tidak ada spring tanpa MapPoint (ingat: `Report.mapPointId` punya
   FK ke MapPoint, jadi MapPoint dibuat dulu dengan `id` reuse milik spring).

```ts
// scripts/fix-orphan-reports.ts — baris 244-296 (inti transaksi)
      // Satu transaksi per klaster: spring + tautkan laporan + mappoint
      await prisma.$transaction(async (tx) => {
        const spring = await tx.spring.create({
          data: {
            name,
            snappedLat: c.lat,
            snappedLng: c.lng,
            province,
            regency,
            village: "",
            subdistrict: "",
            status: "active",
          },
        });

        // MapPoint dibuat dulu (reuse id spring, sama seperti
        // migrations-20260701-map-system.sql) karena Report.mapPointId
        // punya FK ke MapPoint.
        let slug = clusterSlug(c.lat, c.lng);
        let i = 2;
        while (await tx.mapPoint.findUnique({ where: { slug } })) {
          slug = `${clusterSlug(c.lat, c.lng)}-${i++}`;
        }

        await tx.mapPoint.create({
          data: {
            id: spring.id,
            typeId: type!.id,
            name,
            slug,
            snappedLat: c.lat,
            snappedLng: c.lng,
            province,
            regency,
            village: "",
            subdistrict: "",
            description: "",
            isActive: true,
          },
        });

        await tx.report.updateMany({
          where: { id: { in: reportIds } },
          data: { springId: spring.id },
        });
        await tx.report.updateMany({
          where: { id: { in: reportIds }, mapPointId: null },
          data: { mapPointId: spring.id },
        });
      });
```

4. **Koneksi terbatas** — `new pg.Pool({ max: 3, connectionTimeoutMillis: 10000 })`
   (baris 62-66): skrip batch tidak pernah meledakkan `max_connections=50`
   postgres. Dan di sesi 12 Agustus 2026 skrip ini dijalankan di STAGING
   dengan hasil "0 klaster" — bukti data produksi sudah sehat, tanpa satu pun
   baris data produksi tersentuh.

---

## 9.15 Antrean Pekerja: `lib/queue.ts` + `workers/*` + Redis

SpringHub memakai **BullMQ** di atas Redis untuk pekerjaan asinkron: kirim
email, proses gambar, dan ekspor data admin. Tiga antrean terdaftar di
`lib/queue.ts`:

```ts
// lib/queue.ts — 29 baris
import { Queue, Worker } from "bullmq";
import { getRedisConnectionOptions } from "@/lib/redis-connection";

const connection = getRedisConnectionOptions();

export const emailQueue = new Queue("email", { connection });
export const imageQueue = new Queue("image-processing", { connection });
export const exportQueue = new Queue("export", { connection });

export type EmailJobData = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type ImageJobData = {
  reportPhotoId: string;
  storagePath: string;
  bucket: string;
};

export type ExportJobData = {
  type: "users" | "reports" | "donations" | "projects" | "feedback";
  startDate: string;
  endDate: string;
  adminEmail: string;
  format: "csv";
};
```

**Desain antrean:**

- Tiga queue terpisah (`email`, `image-processing`, `export`) — bukan satu
  queue serba-bisa. Keuntungan: worker bisa di-scaling per jenis (email butuh
  rate limit ketat, image processing butuh CPU, export butuh waktu lama),
  dan kegagalan satu jenis tidak memblokir jenis lain.
- **Typed job data**: setiap queue punya interface TypeScript sendiri
  (`EmailJobData`, `ImageJobData`, `ExportJobData`) — produser (API route)
  dan konsumen (worker) berbagi kontrak yang sama; typo field terdeteksi saat
  compile, bukan saat job gagal di runtime.
- Produser cukup `emailQueue.add("send", {...})` dari mana saja (server
  component atau route handler) — API route tidak perlu menunggu SMTP.

### 9.15.1 `workers/email-worker.ts` — Pekerja email

```ts
// workers/email-worker.ts — 32 baris
import { Worker } from "bullmq";
import { sendEmail } from "../lib/email";
import logger from "../lib/logger";
import { redisConnectionFromUrl } from "../lib/redis-connection";

const connection = redisConnectionFromUrl(process.env.REDIS_QUEUE_URL);

const worker = new Worker(
  "email",
  async (job) => {
    const { to, subject, html, text } = job.data;
    await sendEmail({ to, subject, html, text });
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 50,
      duration: 60_000, // max 50 emails per minute
    },
  }
);

worker.on("completed", (job) => {
  logger.info({ to: job.data.to }, "Email sent");
});

worker.on("failed", (job, err) => {
  logger.error({ to: job?.data?.to, error: err.message }, "Email failed");
});

logger.info("Email worker started");
```

**Analisis:**

- `concurrency: 5` — lima job email diproses paralel dalam satu worker process.
- `limiter: { max: 50, duration: 60_000 }` — BullMQ rate limiter SISI WORKER:
  maksimum 50 email per menit. Ini pelindung ganda terhadap provider email:
  baik API route maupun nginx sudah membatasi frekuensi *pembuatan* job
  (`newsletter` 2 r/m, dll), dan worker membatasi *pengiriman* aktual — kalau
  antrean menumpuk (misal reset password massal saat incident), email tetap
  terkirim dengan kecepatan aman, bukan dibanned provider.
- `worker.on("failed", ...)` mencatat ke logger terstruktur (pino) — job gagal
  otomatis di-retry BullMQ dengan backoff default sebelum masuk status failed.
- Worker ini juga dipakai produksi DAN staging; staging memakai Redis index 1
  sehingga antrean staging tidak pernah dikonsumsi worker produksi.

### 9.15.2 `workers/image-worker.ts` — Pekerja gambar

```ts
// workers/image-worker.ts — baris 1-26
import { Worker } from "bullmq";
import sharp from "sharp";
import logger from "../lib/logger";

const connection = {
  host: process.env.REDIS_QUEUE_URL
    ? new URL(process.env.REDIS_QUEUE_URL).hostname
    : "localhost",
  port: process.env.REDIS_QUEUE_URL
    ? parseInt(new URL(process.env.REDIS_QUEUE_URL).port || "6379", 10)
    : 6379,
};

const worker = new Worker(
  "image-processing",
  async (job) => {
    const { storagePath } = job.data;

    // For now, the actual S3 download/compress/upload loop
    // will be implemented when R2 integration is complete.
    // This worker receives the storage path, downloads from R2,
    // compresses with sharp, and re-uploads the compressed version.
    logger.info({ storagePath }, "Processing image");
  },
  { connection }
);

worker.on("completed", (job) => {
  logger.info({ storagePath: job.data.storagePath }, "Image processed");
});

worker.on("failed", (job, err) => {
  logger.error({ storagePath: job?.data?.storagePath, error: err.message }, "Image processing failed");
});

logger.info("Image worker started");
```

Worker ini adalah **placeholder yang jujur**: antrean dan kontrak data sudah
siap, tapi loop unduh-kompres-unggah R2 baru akan diimplementasikan saat
integrasi Cloudflare R2 selesai (terblokir karena butuh kartu kredit, catatan
sesi 1 Juli 2026). Pelajaran arsitektur: **infrastruktur antrean dibangun
sebelum fiturnya** — ketika R2 tiba, cukup mengisi body handler tanpa mengubah
satu pun file infrastruktur.

### 9.15.3 `lib/redis-connection.ts` — Parser koneksi yang menyelamatkan produksi

```ts
// lib/redis-connection.ts — 35 baris
import type { ConnectionOptions } from "bullmq";

type RedisConnection = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
};

/**
 * Parses REDIS_URL / REDIS_QUEUE_URL (redis://user:pass@host:port/db) into a
 * BullMQ-compatible connection object. Preserves credentials + db index —
 * sebelumnya password & db di-buang (bug NOAUTH Redis).
 */
export function redisConnectionFromUrl(url: string | undefined): RedisConnection {
  const fallback: RedisConnection = { host: "localhost", port: 6379 };
  if (!url) return fallback;
  try {
    const u = new URL(url);
    return {
      host: u.hostname || fallback.host,
      port: u.port ? parseInt(u.port, 10) : 6379,
      username: u.username || undefined,
      password: u.password || undefined,
      db: u.pathname && u.pathname.length > 1 ? parseInt(u.pathname.slice(1), 10) : undefined,
    };
  } catch {
    return fallback;
  }
}

export function getRedisConnectionOptions(envKey = "REDIS_QUEUE_URL"): ConnectionOptions {
  return redisConnectionFromUrl(process.env[envKey]);
}
```

Komentar di header file menceritakan bug nyata: parser sebelumnya membuang
`password` dan `db` dari URL — worker gagal dengan `NOAUTH` karena Redis
dilindungi `--requirepass`. Versi final mempertahankan `u.password` dan
mengambil index DB dari `pathname` (`/1` pada URL staging). Pelajaran:
**utility parsing koneksi adalah titik kegagalan diam-diam** — selalu uji
dengan URL yang memuat kredensial + index DB.

### 9.15.4 `lib/cache.ts` — Cache Redis dengan degradasi anggun

```ts
// lib/cache.ts — 52 baris
import { redis } from "./redis";

function cacheKey(prefix: string, key: string): string {
  return `cache:${prefix}:${key}`;
}

export async function getOrSet<T>(
  prefix: string,
  key: string,
  fetch: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    const redisKey = cacheKey(prefix, key);
    const cached = await redis.get(redisKey);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const data = await fetch();

    await redis.setex(redisKey, ttlSeconds, JSON.stringify(data));

    return data;
  } catch {
    // Redis unavailable — skip cache, fetch directly
    return fetch();
  }
}

export async function invalidateCache(prefix: string): Promise<void> {
  try {
    const pattern = `cache:${prefix}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable — nothing to invalidate
  }
}

export async function invalidateAllCache(): Promise<void> {
  try {
    const keys = await redis.keys("cache:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable
  }
}
```

Pola `getOrSet(prefix, key, fetchFn, ttl)` — cache-aside klasik dengan dua
sifat penting: (1) **fallback**: jika Redis mati, blok `catch` memanggil
`fetch()` langsung — aplikasi tetap berfungsi, hanya lebih lambat; (2)
**invalidation by prefix**: `invalidateCache("leaderboard")` menghapus semua
key `cache:leaderboard:*` dengan satu panggilan `redis.keys` + `del` —
tidak perlu melacak key satu per satu. Ini pola yang sama dipakai rate
limiter `lib/rate-limit.ts` (window key `ratelimit:<name>:<key>:<window>`).

---

## 9.16 `prisma.config.ts` — Konfigurasi Prisma 7

```ts
// prisma.config.ts — 15 baris
// This file was generated by Prisma, and assumes you have installed the following:
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

Sejak Prisma 7, `prisma.config.ts` menggantikan blok `datasource` di
`schema.prisma` untuk konfigurasi runtime CLI. Hal-hal yang diatur di sini:

- **Lokasi schema** — `prisma/schema.prisma` (single source of truth model).
- **Seed command** — `npx tsx prisma/seed.ts`. Menarik: seed dijalankan via
  `tsx` (bukan `ts-node`) — konsisten dengan worker (`npx tsx workers/...`),
  satu runtime TypeScript di seluruh pipeline.
- **URL dinamis** — `process.env["DATABASE_URL"]` dibaca saat perintah CLI
  dijalankan; `import "dotenv/config"` memuat `.env` secara default, dan
  `DOTENV_CONFIG_PATH=.env.staging` bisa mengarahkannya ke env staging (pola
  yang dipakai `scripts/fix-orphan-reports.ts`). Ini yang memungkinkan satu
  baris perintah bermigrasi ke DB yang berbeda-beda:
  `dotenv -e .env.staging -- npx prisma migrate deploy`.

---

## 9.17 `playwright.config.ts` — E2E Tiga Browser

```ts
// playwright.config.ts — 33 baris
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2, // PC kentank mode
  reporter: [
    ["html", { outputFolder: "e2e-report" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:31759",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  // Dev server running externally on http://localhost:3000
});
```

**Keputusan yang tercermin di file ini:**

- `baseURL: "http://localhost:31759"` — E2E menargetkan **kontainer web
  produksi-lokal** (port 31759), bukan dev server 3000. Artinya E2E menguji
  build standalone yang sama dengan yang di-deploy — bukan hanya mode dev.
- **Tiga project browser** (chromium/firefox/webkit) — karena user riil
  SpringHub mayoritas mobile Safari/Chrome Android (catatan sesi 22 Juni
  2026), lintas-engine adalah kebutuhan, bukan kemewahan. Pada CI, kegagalan
  di-retry 2×; di lokal 0 retry (biar cepat).
- `trace: "on-first-retry"` — trace Playwright (video + network + DOM
  snapshot) otomatis diambil saat retry pertama — debugging flaky test jauh
  lebih cepat.
- Komentar di baris 32 jujur: dev server dijalankan eksternal, bukan
  `webServer` bawaan Playwright — keputusan sadar agar bisa menarget
  container Docker.

---

## 9.18 Alur Deploy End-to-End (Cerita Satu Rilis)

Mari ikuti perjalanan satu perubahan kode dari laptop pengembang sampai
muncul di produksi:

1. **Push `feat/spring-map-v2`** → GitHub Actions menjalankan job `test`:
   `npm ci` → `prisma generate` → `tsc --noEmit` → `vitest run`. Jika ada
   error type atau unit test gagal, pipeline berhenti di sini — tidak ada
   satu pun baris yang sampai ke VPS.
2. **Job `deploy-preview`** menyala (branch `feat/*`). Di runner GitHub:
   nama branch dibersihkan jadi `spring-map-v2`, port dihitung dari cksum
   (misal `32241`). Lalu SSH ke VPS: checkout branch, build image
   `springhub-preview-spring-map-v2`, jalankan container `web-spring-map-v2`
   yang menyambung ke DB staging (`springhub_staging`), Redis index 1, dan
   port host `32241`.
3. **Reviewer membuka `spring-map-v2.staging.springhub.id`** → nginx-staging
   mencocokkan `server_name ~^(?<sub>...)$` → `web-spring-map-v2:31760`.
   Sebelum halaman tampil, Basic Auth meminta kredensial preview (dari
   htpasswd-preview). Fitur diuji dengan data staging — produksi tidak
   tersentuh.
4. **PR di-merge ke `develop`** → job `deploy-staging`: checkout develop,
   regenerate htpasswd (password bisa diganti kapan pun), build image,
   up postgres+redis staging, `migrate deploy` + `db push`, force-recreate
   web+worker+nginx staging, health check `:31760/api/health`. Staging
   sekarang versi terbaru develop.
5. **QA staging lulus** → PR/merge ke `main` → job `deploy-production`:
   checkout main, `migrate deploy` (hanya migration baru), build ulang web +
   worker, `up -d --force-recreate web worker nginx`, `image prune -f`,
   health check `:31759/api/health`. Postgres dan Redis **tidak pernah
   di-recreate** — uptime data terjaga.
6. **PR ditutup** → job `teardown-preview`: `docker compose -p
   preview-spring-map-v2 down --remove-orphans` — container preview dibuang,
   image dibersihkan oleh `prune` berikutnya.
7. **Setiap 03:00 WIB** cron menjalankan `backup-db.sh`: dump postgres →
   gzip → GPG AES256 → terkirim ke email admin, retensi 7 hari. Dan tiap 60
   detik `capture-nginx-logs.sh` menyalin log nginx ke host untuk fail2ban.

**Satu host, tiga lingkungan, nol tabrakan** — semua karena pemisahan
disiplin: project Compose, port host, volume, database, index Redis, dan
nama container.

---

## 9.19 Ringkasan Bab 9

| File | Peran kunci |
|---|---|
| `middleware.ts` | Anti-cache API, guard admin, whitelist IP (fail-closed) |
| `next.config.mjs` | Standalone output, CSP, whitelist gambar, eksternal packages |
| `nginx.conf` | Rate limit 6 zona, Cloudflare real-IP, SSL, cache statis |
| `nginx-staging.conf` | Basic Auth, virtual host dinamis per branch |
| `docker-compose.yml` | 5 service, healthcheck berantai, `cap_drop`, port loopback |
| `docker-compose.staging.yml` | Lingkungan paralel: port 5433/6380/31760/8080 |
| `docker-compose.preview.yml` | Preview per-branch, network staging eksternal |
| `Dockerfile` | Multi-stage deps→builder→runner, user non-root |
| `deploy.yml` | 5 job: test, prod, staging, preview, teardown |
| `firewall-rules.sh` | UFW default-deny, 80/443 hanya Cloudflare |
| `backup-db.sh` | pg_dump → gzip → GPG AES256, email, retensi 7 hari |
| `capture-nginx-logs.sh` | Log container → host untuk fail2ban |
| `setup-htpasswd-staging.sh` | Kredensial staging dari env, mode 600 |
| `fix-orphan-reports.ts` | Dry-run default, idempotent, transaksi per klaster |
| `lib/queue.ts` + `workers/*` | BullMQ 3 queue, rate limit worker 50/menit |
| `prisma.config.ts` | Seed via tsx, URL dari env |
| `playwright.config.ts` | E2E 3 browser ke port produksi-lokal |

**Prinsip yang menonjol dari seluruh bab ini:**

1. *Default-deny dan fail-closed* — firewall, middleware, webhook, semuanya
   menolak kecuali diizinkan eksplisit.
2. *Lingkungan paralel tanpa tabrakan* — pemisahan port/volume/DB/index.
3. *Healthcheck bukan pajangan* — dipakai depends_on, deploy, dan verifikasi.
4. *Data tidak pernah di-recreate* — hanya aplikasi yang di-force-recreate.
5. *Skrip berbahaya berangkat dari mode aman* — dry-run, `SEED_FORCE`,
   masking kredensial di log.

BAB 10 melanjutkan dari fondasi ini: katalog kerentanan — bagaimana setiap
lapisan di atas melawan serangan nyata, lengkap dengan kode sumber dan
cerita serangannya.
