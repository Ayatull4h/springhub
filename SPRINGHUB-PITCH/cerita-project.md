# SpringHub — Cerita di Balik Projek

**Ditulis oleh**: Ayatullah Reza Chalid
**Dibaca ketika**: Mau interview, meeting client, atau ngejelasin projek ke orang awam

> Dokumen ini ditulis dengan bahasa santai dan mudah dipahami. Bukan untuk dibaca verbatim, tapi buat dipelajari biar kamu bisa ngejelasin dengan kata-katamu sendiri.

---

## Daftar Isi Cerita

1. [Awal Mula — Kenapa Projek Ini Dibuat](#1-awal-mula)
2. [Masalah yang Ingin Dipecahkan](#2-masalah)
3. [Gambaran Besar — Cara Kerja Platform](#3-cara-kerja)
4. [Cerita Teknis — Stack yang Dipakai](#4-stack-teknis)
5. [Fitur-Fitur Unggulan](#5-fitur)
6. [Keamanan — Karena Data & Uang](#6-keamanan)
7. [Infrastruktur — Server & Deployment](#7-infrastruktur)
8. [Kendala & Solusi — Cerita di Lapangan](#8-kendala)
9. [Cara Ngejelasin ke Pewawancara](#9-ke-interviewer)
10. [Cara Ngejelasin ke Client](#10-ke-client)
11. [Penutup — Value yang Bisa Kamu Tawarkan](#11-penutup)

---

## 1. Awal Mula

> "Gimana caranya bikin orang peduli sama mata air, dan yang lebih penting — gimana caranya bikin mereka berkontribusi?"

SpringHub lahir dari pertanyaan sederhana itu. Indonesia punya ribuan mata air, tapi data tentang kondisi mereka hampir tidak ada. Mana yang masih sehat? Mana yang mulai kritis? Mana yang butuh bantuan sekarang?

Jawabannya: tidak ada yang tahu.

Dan kalaupun ada yang mau bantu, mereka bingung caranya. Donasi ke organisasi? Uangnya dipakai apa? Hasilnya gimana?

Dari situ saya bangun SpringHub — sebuah platform yang menghubungkan orang yang peduli dengan aksi nyata. Bukan cuma website biasa, tapi ekosistem lengkap: laporan, verifikasi, poin, proyek, dan donasi yang transparan.

Saya kerjakan sendiri dari 0. Bukan tim. Bukan perusahaan. Saya seorang full-stack engineer yang pengen bikin sesuatu yang berarti.

---

## 2. Masalah

### Masalah #1: Mata Air Kita Terancam
70% mata air di Indonesia dalam kondisi kritis. Erosi, penebangan hutan, alih fungsi lahan — semuanya bikin sumber air kita mengering. Ini bukan masalah masa depan, ini terjadi sekarang.

### Masalah #2: Tidak Ada Data
Coba googling "berapa banyak mata air di Jawa Barat yang masih sehat?" — susah dapet jawabannya. Data kondisi mata air tersebar, tidak terpusat, dan jarang di-update.

### Masalah #3: Masyarakat Ingin Bantu Tapi Bingung
Banyak orang Indonesia yang peduli lingkungan. Tapi mereka bingung: "Saya mau bantu, caranya gimana? Sumbang uang takut ga jelas. Ikut aksi takut ga ada waktu."

### Masalah #4: Donasi Tidak Transparan
Ini yang paling sering dikeluhin orang. Donasi udah dikasih, tapi uangnya dipakai buat apa? Hasilnya apa? Proyeknya udah selesai atau belum?

SpringHub hadir buat jawab semua masalah itu dalam satu platform.

---

## 3. Cara Kerja

Bayangin begini: SpringHub itu kaya **Gojek versi konservasi mata air**.

### Step 1: Lapor
Kamu nemu mata air di desamu. Kondisinya mulai kotor, airnya berkurang. Kamu buka SpringHub, isi form laporan — nama, lokasi, kondisi, foto. Selesai dalam 5 menit.

Bahkan kalau di desamu tidak ada sinyal? Tenang, ada mode offline. Isi form di HP, simpan, nanti otomatis terkirim pas ada internet.

### Step 2: Diverifikasi & Dapat Poin
Laporan kamu masuk ke admin. Mereka cek: fotonya bener? Lokasinya cocok? Kalau valid, laporan disetujui.

Dan kamu dapat **poin**. Setiap laporan = 25-100 poin. Kalau lapor 3 hari berturut-turut dapat bonus. Kalau udah 10 laporan dapat bonus besar. Naik peringkat di leaderboard.

### Step 3: Danai Proyek
Data dari laporan warga dikumpulin. Kalau suatu daerah butuh restorasi — misal mata air Cikole butuh dikeruk lumpurnya — itu jadi proyek.

Kamu bisa donasi langsung ke proyek itu. Lewat Xendit (QRIS, GoPay, OVO, Dana). Progress-nya bisa dipantau real-time. Target Rp 50 juta, baru terkumpul Rp 30 juta — tinggal 40% lagi.

### Step 4: Pantau Dampak
Setelah proyek selesai, ada laporan dampak. Ada fotonya. Ada datanya. Kamu tahu persis uangmu dipakai buat apa.

---

## 4. Stack Teknis

### Bahasa Manusia
Saya pakai **Next.js** — ini framework web modern yang bisa handle frontend (tampilan) dan backend (API) sekaligus. Jadi ga perlu dua bahasa programming berbeda.

Database-nya **PostgreSQL** — ini standar industri, sudah terbukti stabil buat sistem yang handle data sensitif kayak donasi dan data pribadi.

Untuk cache dan antrian, saya pakai **Redis** — biar website tetap responsif walau banyak user.

Integrasi pembayaran pake **Xendit** — payment gateway lokal yang support QRIS, GoPay, OVO, Dana.

### Bahasa Teknis
**Frontend**: Next.js 14 App Router, TypeScript strict, Tailwind CSS, Leaflet (peta), PWA (offline)
**Backend**: Next.js API Routes (54+ endpoint), Prisma ORM, PostgreSQL 16, Redis 7
**Third Party**: Xendit (payment), Cloudflare (DNS + security), Resend (email)
**Infrastructure**: Docker Compose (5 containers), Nginx, fail2ban

Semua TypeScript — dari ujung ke ujung. Jadi kalau ada error tipe data, ketahuan sebelum aplikasi jalan.

---

## 5. Fitur

### Yang Paling Membanggakan

**1. Anti-Spam yang Ketat**
Bayangin kalau platform ini dibanjiri spam — ribuan laporan palsu, komentar sampah, akun robot. Saya bikin sistem anti-spam berlapis:
- Validasi data (Zod) — data aneh langsung ditolak
- Rate limit — 5 laporan per hari per user
- Honey pot — field tersembunyi yang cuma diisi bot
- Time gate — form yang dikirim kurang dari 3 detik pasti bot
- Trust score — skor reputasi user, kalo jelek di-block otomatis

**2. Gamification — Biar Orang Betah**
Poin, streak, milestone, leaderboard — ini bukan game, ini platform konservasi. Tapi dengan gamification, orang jadi termotivasi:
- "Wah, tinggal 2 laporan lagi dapet bonus 50 poin"
- "Peringkat 3 di leaderboard, salip dikit lagi"
- "Udah 20.168 poin, sekarang bisa buat proyek!"

**3. Offline PWA — Buat Daerah Tanpa Sinyal**
Ini fitur yang paling challenging secara teknis. User di desa terpencil — kadang sinyal hilang. Tapi mereka punya HP. Dengan PWA, mereka bisa:
- Buka website walau offline
- Isi form laporan
- Ambil foto (3-5 foto, otomatis dikompres)
- Simpan di HP
- Begitu ada sinyal, otomatis terkirim

**4. Donasi Transparan**
Ini yang bikin platform ini beda dari donasi biasanya:
- Kamu donasi ke proyek SPESIFIK, bukan ke organisasi umum
- Progress proyek bisa dipantau (% terkumpul, % selesai)
- Webhook dari Xendit diverifikasi pake HMAC — ga bisa dipalsukan
- Setiap donasi sukses, poin volunteer otomatis bertambah

**5. Admin Panel Lengkap**
Ada 10 tab di admin panel — dari kelola user, approve laporan, atur form, sampai export data CSV. Admin bisa kontrol semuanya dari satu tempat.

---

## 6. Keamanan

Ini bagian yang paling saya perhatiin, soalnya platform ini handle data pribadi dan uang.

### CSRF — Biar Gak Bisa Diserang dari Website Lain
Setiap kali admin mau approve laporan atau ubah data, sistem minta token khusus. Token ini cuma valid buat session itu. Jadi hacker dari website lain ga bisa ngirim perintah palsu.

### Password — Wajib Kuat
Ga boleh password kaya "12345678". Minimal 8 karakter, harus ada huruf besar, huruf kecil, dan angka. Kalau salah login 5 kali, akun dikunci 15 menit.

### Data Pribadi — Dilindungi
Email dan nomor HP cuma bisa dilihat admin. Lokasi presisi (rumah, sawah) cuma admin yang tahu. Publik cuma lihat lokasi yang sudah digeser 5km — cukup buat tahu daerahnya, tapi ga tahu persis di mana.

### Rate Limiting — Biar Server Ga Jebol
Bayangin 1000 orang login bersamaan — server bisa tumbang. Makanya saya batasi: maksimal 30 request per detik per IP. Khusus login lebih ketat: 5 request per detik. Donasi: 3 request per detik.

### Security Headers
Saya pasang berbagai proteksi di level HTTP: HSTS (biar browser paksa pake HTTPS), CSP (biar cuma script tertentu yang bisa jalan), X-Frame-Options (biar website ga bisa ditanam di iframe website lain).

---

## 7. Infrastruktur

### Server
Aplikasi ini jalan di **Hostinger VPS** — 4 CPU, 8GB RAM, 100GB NVMe. Total biaya sekitar **Rp 373.000 per bulan**.

### Container
Saya pake Docker — jadi tiap komponen jalan di "kotak" terpisah:
1. **Nginx** — pintu gerbang, handle SSL dan rate limiting
2. **Next.js** — aplikasi utamanya
3. **PostgreSQL** — database
4. **Redis** — cache dan antrian
5. **Worker** — buat kirim email dan proses poin di latar belakang

### Cloudflare
Domain springhub.id diproxy lewat Cloudflare — jadi dapat proteksi DDoS gratis, SSL, dan caching.

### Backup
Setiap jam 3 pagi, database otomatis di-backup. File backup disimpan 7 hari — jadi kalau ada apa-apa, data bisa dikembalikan.

### Monitoring
Tiap container punya healthcheck — kalau ada yang mati, Docker otomatis restart. Dan ada heartbeat monitoring tiap 5 menit.

---

## 8. Kendala

Cerita tentang masalah-masalah yang saya hadapi selama bikin projek ini.

### 1. Foto Gagal Upload di Chrome Android
**Masalah**: User pake PWA mode offline di HP Android, foto gagal diupload. Pas ditelusuri, ternyata Chrome Android kadang ngasih blob kosong — file fotonya ada tapi tipenya (MIME) tidak terdeteksi.

**Solusi**: Saya bikin deteksi manual — baca byte pertama file untuk menentukan apakah itu JPEG, PNG, atau WEBP. Baru setelah itu diproses. Konsepnya kaya "ndelok werna getih" — kita lihat byte-nya, bukan percaya sama labelnya.

### 2. Token CSRF Kadaluarsa Pas Pindah Tab
**Masalah**: User buka form di tab 1, ambil token CSRF. Terus buka tab 2, sistem rotate token. Balik ke tab 1, submit — error karena token udah beda.

**Solusi**: Saya ubah strategi — token diambil pas mau submit, bukan pas halaman dimuat. Jadi selalu fresh.

### 3. Server 502 Karena Bot
**Masalah**: Suatu hari server tiba-tiba error 502. Setelah dicek, ada bot yang scanning ribuan endpoint (nyari celah Drupal, WordPress, dll). Server kewalahan.

**Solusi**: Pasang fail2ban + Cloudflare WAF. Bot yang mencurigakan langsung di-block setelah beberapa request.

### 4. Database Migration Error
**Masalah**: Prisma migration error karena shadow database bermasalah — reference ke schema "auth" yang tidak ada.

**Solusi**: Skip migration, pake `prisma db push` — sinkronisasi schema langsung ke database tanpa perlu shadow database. Lebih simple, lebih reliable.

---

## 9. Ke Interviewer

Kalau interviewer nanya "Ceritain tentang projek ini", ini jawabannya:

### Versi 30 Detik
> "Saya bikin platform untuk monitoring dan restorasi mata air Indonesia — dari 0 sampai production. Teknologi yang dipakai Next.js 14, PostgreSQL, Redis, Docker. Fiturnya lengkap: dari laporan offline, poin & leaderboard, donasi via Xendit, sampe admin panel. Saya handle semuanya sendiri — backend, frontend, database, DevOps, security. Total 55 API endpoints, 16 tabel database, 155 test case. Build zero error."

### Versi 5 Menit — Cerita Berurutan

**"Kenapa bikin ini?"**
"Karena 70% mata air Indonesia terancam dan gak ada platform yang menghubungkan orang yang peduli dengan aksi nyata. Saya lihat ada gap antara 'peduli lingkungan' dan 'bisa ngapain'. SpringHub jembatin itu."

**"Ajaibnya dimana?"**
"Bukan cuma website biasa. Ini ada offline mode buat daerah tanpa sinyal, ada poin & gamefication biar orang betah, ada donasi transparan yang terverifikasi, dan ada admin panel lengkap. Semua dibangun dengan keamanan ketat — CSRF, rate limit, JWT rotation, RLS."

**"Bagian tersulit?"**
"Offline photo upload di Chrome Android — foto sering gagal karena bug browser. Saya harus debug sampe ke level byte detection. Juga integration testing — 155 test case manual untuk mastiin semuanya jalan."

**"Apa yang bisa kamu banggakan?"**
"Build zero error, lint zero warning. Production-grade dengan real domain, SSL, Cloudflare. Dan yang paling penting — projek ini beneran dipake, bukan cuma tutorial."

---

## 10. Ke Client

Kalau kamu ketemu client atau founder yang tertarik, ini cara ngejelasinnya:

### Jangan Bahas Teknis Dulu
Client ga peduli kamu pake Next.js atau React atau Vue. Mereka peduli: **"Apa yang bisa platform ini lakukan buat saya?"**

### Mulai dari Manfaat
> "SpringHub itu platform yang bikin orang bisa berkontribusi nyata buat lingkungan. Caranya gampang: buka website, laporkan kondisi mata air, dapat poin, dan donasi ke proyek spesifik. Semua transparan — data, peta, aliran uang."

### Poin-Poin Penting

**"Berapa biaya operasionalnya?"**
"Server Rp 373.000/bulan. Domain aja. Kalau traffic besar, tinggal upgrade server — karena pake Docker dan cloud-native."

**"Apa bedanya sama platform donasi biasa?"**
"Donasi di sini langsung ke proyek spesifik. Kamu bisa lihat progress-nya. Kalau proyek A butuh Rp 50 juta dan baru terkumpul Rp 30 juta, kamu tahu sisanya. Transparan."

**"Gimana mastiin data akurat?"**
"Setiap laporan diverifikasi admin. Ada trust score — user yang sering ngasih laporan valid dapat skor tinggi, yang ngawur kena penalty. Dan ada anti-spam berlapis."

**"Bisa dikembangin lagi?"**
"Sangat. Arsitekturnya modular. Tinggal nambah fitur — misal partnership dengan pemerintah, integrasi IoT sensor, atau mobile app native — semua udah siap."

---

## 11. Penutup

> Proyek SpringHub bukan tentang kode. Bukan tentang React atau PostgreSQL atau Docker.
>
> Ini tentang menjawab pertanyaan: "Gimana caranya teknologi bisa bikin orang Indonesia lebih peduli sama mata air mereka?"
>
> Jawabannya saya tuang dalam 55 API endpoints, 16 tabel database, ribuan baris kode — semuanya saya tulis sendiri.
>
> **Saya bukan cuma programmer yang nulis kode. Saya engineer yang membangun solusi — dari ide sampai production, dari masalah sampai dampak nyata.**

---

*Dokumen ini ditulis dengan bahasa sederhana agar mudah dipahami dan diceritakan kembali dengan kata-kata sendiri.*
