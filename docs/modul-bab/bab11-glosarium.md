# BAB 11 — Glosarium

| Istilah | Arti |
|---|---|
| **API** | Antarmuka antar-program — "wasit" yang menerima permintaan dan memberi jawaban |
| **App Router** | Sistem routing Next.js 14: folder = route |
| **Atomik (transaksi)** | Rangkaian operasi DB yang berhasil semua atau batal semua |
| **Auth / Autentikasi** | Proses memastikan "kamu siapa" (login) |
| **Authorisasi** | Proses memastikan "kamu boleh apa" (admin vs user) |
| **Basic Auth** | Gerbang HTTP sederhana: username + password sebelum halaman terbuka |
| **bcrypt** | Algoritma hash kata sandi yang lambat & tahan serangan tebak |
| **BullMQ** | Pustaka antrean kerja berbasis Redis |
| **CAS** | Compare-And-Set — update hanya jika kondisi masih cocok (anti-race condition) |
| **Client Component** | Komponen React yang jalan di browser (`"use client"`) |
| **CSRF** | Serangan memakai sesi korban dari situs lain; dicegah token CSRF |
| **CSP** | Content-Security-Policy — daftar sumber yang boleh dimuat browser |
| **DOMPurify** | Pembersih HTML — membuang tag/atribut berbahaya (anti-XSS) |
| **Enum** | Daftar nilai tetap (mis. status: pending/approved/rejected) |
| **EXIF** | Metadata foto (GPS, kamera) — dibuang demi privasi |
| **Honeypot** | Jebakan bot: field tersembunyi yang tidak boleh diisi manusia |
| **Idempotensi** | Operasi yang dijalankan berkali-kali = efeknya sekali saja |
| **IndexedDB** | Database dalam browser untuk mode offline |
| **JWT** | Token JSON bertanda tangan untuk sesi |
| **Lockout** | Penguncian sementara setelah gagal login berulang |
| **Magic Byte** | Byte pertama file yang menunjukkan jenis aslinya (anti-file palsu) |
| **Middleware** | Kode yang berjalan sebelum halaman/API (gerbang) |
| **ORM** | Penerjemah query: TypeScript → SQL aman (Prisma) |
| **PWA** | Aplikasi web yang bisa dipasang & dipakai offline |
| **Rate Limit** | Pembatasan jumlah permintaan per waktu |
| **Regex** | Pola pencocokan teks |
| **RLS** | Row Level Security — baris DB hanya terlihat oleh pemilik/admin |
| **Route Handler** | File `route.ts` = endpoint API |
| **Sanitasi** | Pembersihan input/output berbahaya |
| **Server Component** | Komponen yang dirender di server |
| **SSRF** | Serangan menyuruh server mengakses URL internal |
| **Staging** | Lingkungan uji yang meniru produksi |
| **Timing-Safe Compare** | Perbandingan string yang tidak membocorkan waktu (anti side-channel) |
| **Webhook** | Panggilan otomatis dari satu sistem ke sistem lain saat ada event |
| **WAF** | Web Application Firewall (Cloudflare) |
| **XSS** | Serangan menyuntik skrip jahat ke halaman |
| **Zod** | Pustaka validasi data dengan tipe TypeScript |
