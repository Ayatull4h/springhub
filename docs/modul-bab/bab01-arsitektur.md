# BAB 1 — Arsitektur Sistem SpringHub

> "SpringHub adalah aplikasi pemantauan & restorasi mata air berbasis komunitas.
> Relawan melaporkan kondisi mata air lewat formulir, mendapat poin, dan
> datanya tampil di peta publik. Semua itu dijelaskan di buku ini — mulai dari
> satu baris `if` sampai ke firewall server."

---

## 1.1 Peta Besar: Siapa Menghubungi Siapa

Bayangkan alur ini sebagai **jalan cerita sebuah permintaan** dari layar
pengguna sampai ke database:

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   Browser    │ ───► │  Cloudflare   │ ───► │   Nginx      │ ───► │  Next.js      │
│ (HP/laptop)  │ ◄─── │ (WAF + TLS)   │ ◄─── │ (reverse    │ ◄─── │  (web:31759)  │
└─────────────┘      └──────────────┘      │  proxy)     │      └──────┬───────┘
                                           └─────────────┘             │
                                                    │             ┌────▼────────┐
                                                    │             │ PostgreSQL  │
                                                    │             │ (Prisma ORM)│
                                                    │             └────┬────────┘
                                              ┌─────▼──────┐           │
                                              │   Redis     │◄──────────┘
                                              │ (cache+q)   │
                                              └─────┬──────┘
                                                    │
                                              ┌─────▼──────┐
                                              │  Worker     │  (email, antrean)
                                              │ BullMQ      │
                                              └────────────┘
```

**Cerita alurnya:**

1. Relawan membuka `https://www.springhub.id` dari HP.
2. **Cloudflare** (WAF) memeriksa lalu lintas: IP mencurigakan diblokir, HTTPS dijamin,
   lalu diteruskan ke server di port 80/443 — **hanya** IP Cloudflare yang boleh masuk
   (aturan firewall di `scripts/firewall-rules.sh`).
3. **Nginx** menerima, memilih `server_name`, menerapkan rate limit per endpoint
   (login 5r/s, donasi 3r/s), lalu meneruskan ke aplikasi **Next.js** di port internal 31759.
4. **Next.js** (App Router) mengeksekusi route handler `/api/...` atau merender halaman.
   Data diambil dari **PostgreSQL** lewat **Prisma ORM** (selalu query terparameterisasi),
   cache disimpan di **Redis**.
5. Kalau ada pekerjaan tertunda — misalnya **kirim email** lupa password —
   handler hanya **menitipkan job ke antrean Redis (BullMQ)**, lalu **Worker**
   terpisah mengambil dan mengerjakannya di belakang layar.
6. Respons kembali: HTML/JSON → Nginx → Cloudflare → browser relawan.

---

## 1.2 Tiga Lingkungan yang Berjalan Paralel

| Lingkungan | Domain | DB | Redis | Port | Akses |
|---|---|---|---|---|---|
| **Produksi** | springhub.id / www.springhub.id | `springhub` (5432) | DB 0 (6379) | web 31759, nginx 80/443 | Publik + Cloudflare WAF |
| **Staging** | (tunnel `dev.springhub.id` / localhost) | `springhub_staging` (5433) | DB 1 (6380) | web 31760, nginx 8080 | Basic auth + SSH tunnel |
| **Preview per-branch** | `<branch>.staging.springhub.id` | pakai DB staging | pakai Redis staging | web-<branch>:31760+ | Basic auth |

Semua berjalan **paralel di satu VPS** tanpa saling menyentuh — port DB/Redis/web
dibedakan, volume docker terpisah (`postgres_data` vs `postgres_staging_data`).

---

## 1.3 Cerita Data Utama: Satu Laporan Melalui 5 Tahap

**Alur paling penting di aplikasi ini — laporan formulir:**

```
Isi Formulir → Validasi Zod → Cek Anti-Spam → Simpan Report → (Admin) Setujui → +Poin → Peta
```

1. Relawan membuka `/report/spring-monitoring` dan mengisi 25 field.
2. **Zod schema** (`lib/forms.ts`) memvalidasi: wajib? panjang maksimal? format?
   Kalau ada field salah, form menampilkan pesan di field itu — tidak ada yang
   sampai ke server.
3. **Anti-spam 3 lapis**: honeypot tersembunyi (`_website` — bot yang mengisi
   langsung ketahuan), time gate (form dikirim kurang dari 3 detik = bot), dan
   rate limit (maks 5 laporan/hari untuk pengunjung tanpa login).
4. Data disimpan ke tabel `Report` + foto (min 3, maks 5, divalidasi magic-byte,
   EXIF dibuang, dikompres ke 720p).
5. Admin menyetujui di panel `/admin` → sistem menghitung poin (`lib/points.ts`),
   mencatat di `PointsLog`, memberi notifikasi, dan **laporan muncul di peta publik**
   dengan koordinat yang sudah di-snap 5km (privasi!).

---

## 1.4 Peta Folder (Apa Isi Setiap Direktori)

```
springhub/
├── app/                 # Halaman + Route API (App Router Next.js)
│   ├── page.tsx         #   Landing page (hero, peta, dashboard, donasi)
│   ├── report/[slug]/   #   Formulir 5 jenis laporan
│   ├── learn/           #   Kursus & modul belajar
│   ├── seedlings/       #   Marketplace bibit
│   ├── projects/        #   Proyek komunitas
│   ├── admin/           #   Dashboard admin (10 tab manajemen)
│   ├── profile/         #   Profil + riwayat poin
│   ├── offline/         #   Mode PWA offline
│   └── api/             #   ~94 route handler (Bab 6)
├── components/          # Komponen UI: map/, offline/, sections/, ui/ (Bab 7)
├── lib/                 # Logika domain: auth, points, geo, forms, sanitize... (Bab 5)
├── prisma/              # schema.prisma (30 model) + migrasi + seed (Bab 8)
├── workers/             # Worker antrean (email)
├── scripts/             # Backup, firewall, fix data, generate PDF
├── e2e/                 # Playwright E2E
├── middleware.ts        # Gerbang JWT + admin IP whitelist (Bab 9)
├── next.config.mjs      # CSP, standalone output, external packages (Bab 9)
├── nginx.conf           # Reverse proxy produksi (Bab 9)
├── docker-compose*.yml  # 3 lingkungan (Bab 9)
└── Dockerfile           # Build 3 tahap (Bab 9)
```

---

## 1.5 Alur Donasi (Xendit)

```
Donasi → POST /api/donations/invoice → buat invoice Xendit → user bayar
   → Xendit kirim webhook POST /api/donations/webhook
   → verifikasi token (timing-safe) → cek idempotensi (sudah paid?)
   → update status (atomic CAS) → +1 poin per Rp1.000 → notifikasi admin
```

Webhook bisa datang **dua kali** (Xendit mengirim ulang). Sistem menjamin hanya
satu yang menang: pengecekan `already_processed` + transaksi compare-and-set.
Detail lengkap di Bab 6 dan Bab 10.

---

## 1.6 Alur PWA Offline

```
Relawan di gunung tanpa sinyal:
  1. Buka halaman yang sudah di-cache (service worker)
  2. Isi form offline → data + foto masuk IndexedDB (10 object store)
  3. QueueWorker (menit 10 detik) mendeteksi sinyal pulih
  4. Sync: kirim ke /api/offline/sync → 1 laporan + 3 foto → server balas
  5. Sukses → status hijau "Tersinkronkan"; gagal → retry (maks 5×)
```

Kunci penting: `clientCorrelationId` menjamin **laporan yang sama tidak pernah
masuk dua kali** walau retry dikirim berulang (idempotensi offline).

---

## 1.7 Prinsip Arsitektur (Ringkas)

1. **Server-first**: semua aturan penting (poin, validasi, sanitasi, geolokasi)
   ada di server. Klien tidak pernah dipercaya.
2. **Prisma parameterized**: tidak ada query SQL string yang disusun manual —
   injeksi SQL tidak mungkin lewat jalur aplikasi.
3. **Antrean untuk hal lambat**: email tidak dikirim di request; dititipkan ke
   BullMQ + Redis, dikerjakan worker.
4. **3 lapis pertahanan**: Cloudflare (jaringan) → nginx (transport & rate)
   → aplikasi (auth, CSRF, RLS).
5. **Data privat tidak pernah ke publik**: koordinat presisi hanya untuk admin;
   publik mendapat versi 5km.
