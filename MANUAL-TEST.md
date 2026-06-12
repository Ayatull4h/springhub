# Manual Test Plan — SpringHub

> **URL:** https://springhub.vercel.app/
> 
> **Akun Test:**
> - Volunteer: `volunteer@springhub.id` / `vol123`
> - Admin: `admin@springhub.id` / `admin123`
> 
> **Cara pakai:**
> - Isi kolom **✅/❌** setelah test (✅ = berhasil, ❌ = gagal)
> - Isi kolom **Catatan** jika ada yang tidak sesuai harapan
> - **HP** = test pakai handphone (Chrome/Safari)
> - **PC** = test pakai komputer/laptop
> - **Both** = test di kedua perangkat

---

## 🟡 PRIORITAS 1 — Core Flow (Wajib)

### 1.1 Submit Form + Upload Foto

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/report/spring-monitoring` | Form render lengkap, semua field muncul |ya| |
| 2 | Both | Isi Nama mata air, Desa, Kecamatan, Provinsi, Kota/Kab, Tanggal | Semua input terisi |ya | |
| 3 | Both | Pilih dropdown: Kondisi debit, Kualitas air, Kebersihan | Masing-masing punya ≥3 options, bisa dipilih |ya | |
| 4 | HP | Klik field Foto → pilih "Kamera" | Kamera HP terbuka |ya | |aku minta untuk menambahkan akses ke galeri. biar bisa pilih foto lewat galeri
| 5 | PC | Klik field Foto → pilih file gambar | File dialog terbuka, thumbnail muncul setelah pilih | ya| |
| 6 | HP | Klik "📍 Get Current Location" | GPS mendeteksi, lat/lng terisi otomatis |ya | |
| 7 | PC | Klik "🖱️ Pick from Map" | Map picker terbuka, klik map → koordinat terisi |ya| |tapi map tidak muncul. tidak ada map disana untuk pc. untuk hp aman
| 8 | Both | Isi Catatan pengamatan (opsional) | Text terisi | ya| |
| 9 | Both | Klik **Submit Report** | Loading muncul, lalu halaman success ✅ | |tidak |alasan ditolak atau gagal upload karena masalah gambar
| 10 | Both | **Verifikasi akhir** | Halaman hijau "Laporan terkirim!" + icon CheckCircle | | |karena tidak bisa upload jadi ini tidak bisa aku pastikan

disini aku mengetes 2 akun yaitu guest dan volunteer. hasilnya tidak berbeda antara guest dana volunteer, seperti yang tertera diatas
untuk hp mengetes dengan android di chrome

### 1.2 Admin Approve Report

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Login admin: `admin@springhub.id` / `admin123` | Redirect ke `/admin` dashboard |ya | |
| 2 | Both | Klik sidebar **Review Queue** | Daftar pending report muncul | ya| |
| 3 | Both | Cek foto yang diupload sebelumnya (jika ada) | Foto thumbnail muncul, bisa diklik jadi featured (border biru) | | |tidak bisa cek karena foto selalu gagal uplaod
| 4 | Both | Klik tombol **Approve** (centang hijau) | Loading, report hilang dari queue | ya| |
| 5 | Both | Buka tab **Reports** | Status report berubah jadi "approved" | ya| |

untuk kasus ini ada beberapa yang harus kamu perbaiki wajib. form yang gagal upload karena gambar itu ternyata masuk ke halaman admin tapi tanpa gambar. harusnya tidak seperti itu. jika gagal, maka diadmin juga tidak masuk. dan jika berhasil harusnya komplit ada gambarnya juga. 

### 1.3 Verifikasi Poin + Notifikasi (sebagai Volunteer)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Logout admin, login volunteer: `volunteer@springhub.id` / `vol123` | Masuk landing |ya | |
| 2 | Both | Klik bell icon 🔔 di header (atas kanan) | Notif baru muncul: ✅ "Laporan spring-monitoring disetujui!" | ya| |
| 3 | Both | Klik **Profile** di menu user (pojok kanan) | Halaman profile terbuka | ya| |
| 4 | Both | Cek angka **Points** di header profile | Poin bertambah **+25** dari sebelumnya |ya | |
| 5 | Both | Scroll ke **Points History** | Ada baris "Approved spring-monitoring" +25 pts |ya| |

### 1.4 Admin Reject + Catatan

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Submit form baru sebagai volunteer (ulangi langkah 1.1 nomor 1-9) | Report pending baru siap |ya| |
| 2 | Both | Login admin, buka **Review Queue** | Report baru muncul di queue | ya| |
| 3 | Both | Isi **note** di field catatan, contoh: "Foto tidak jelas, mohon upload ulang" | Text muncul di field | ya| |
| 4 | Both | Klik tombol **Reject** (X merah) | Report hilang dari queue | ya| |
| 5 | Both | Login volunteer, cek notifikasi 🔔 | Notif baru: ❌ "Laporan ... ditolak" + catatan admin terbaca |ya| |

---

## 🟡 PRIORITAS 2 — UI & Fitur

### 2.1 Mobile Responsive Admin

aku akan coba ini di ios dengan chrome

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | HP | Buka `/admin` (login admin dulu) | Sidebar collapse/hilang, hamburger menu (☰) muncul |ya| |
| 2 | HP | Tap hamburger menu (☰) | Sidebar overlay terbuka dari kiri |ya| |
| 3 | HP | Tap **Users** | Tabel desktop berubah jadi **card view** (bukan kolom-kolom) |ya| |
| 4 | HP | Tap **Reports** | Card view: form, status badge, active toggle | | |tidak bisa uji karena data 0 total laporan
| 5 | HP | Tap **Donations** | Card view: donor name, amount Rp, status badge |ya| |
| 6 | HP | Tap **Projects** | Card view: title, region, progress |ya | |
| 7 | HP | Tap **Feedback** | Card view: type badge, preview text, status | ya| |
| 8 | PC | Resize browser ke <768px | Semua admin halaman jadi card view | | |belum coba
| 9 | Both | Klik overlay gelap di samping sidebar | Sidebar tertutup | | |aku gak paham maksudnya

form bagus. tidak ada masalah
### 2.2 Donasi Flow

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Scroll ke section **Donate** di landing | Card donasi muncul dengan dropdown tier | ya| |
| 2 | Both | Pilih tier (contoh: Rp50.000) | Summary muncul: icon + impact + amount |ya | |
| 3 | Both | Pilih **Custom** dari dropdown | Input nominal muncul | ya| |
| 4 | Both | Isi nominal 75000 | Angka terisi |ya | |
| 5 | Both | Isi Nama Lengkap (required) | Terisi |ya | |
| 6 | Both | Isi Email | Terisi | ya| |
| 7 | Both | Klik **Checkout / Donate Now** | Redirect ke halaman Xendit invoice | ya| | cuma ya masih gagal karena saya belum memasukan xendit key

untuk donasi nanti kita teruskan setelah migrasi ke vps

### 2.3 Offline Mode (Browser biasa — tanpa PWA) — HP Only

aku cek lewat ios chrome dan android chrome tapi tidak bisa karena gak bisa dan ada "something went worng"
jadi ini tidak saya uji coba sama sekali

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | HP | Buka `/offline` di Chrome/Safari (bukan PWA) | Halaman setup muncul (6 step wizard) | | |
| 2 | HP | Step 1: Tutorial → centang agreement → Next | Lanjut step 2 | | |
| 3 | HP | Step 2: Pilih forms (centang spring-monitoring) → Next | Form terpilih | | |
| 4 | HP | Step 3: Pilih radius 3km + kualitas "Ringan" → Next | Konfigurasi tersimpan | | |
| 5 | HP | Step 4: Atur area di map (drag marker) → Next | Area tersimpan | | |
| 6 | HP | Step 5: Klik **Download Tile** | Progress bar berjalan, tile disimpan ke IndexedDB | | |
| 7 | HP | Step 6: Klik **Mulai Survey** | Map offline terbuka, GPS overlay muncul | | |
| 8 | HP | **Matikan koneksi internet** (Airplane mode) | Map masih muncul (dari tile IndexedDB) | | |
| 9 | HP | Klik **Aktifkan GPS & Mulai Survey** | GPS tetap jalan meski offline | | |
| 10 | HP | Tap marker 💧 (mata air) | Marker tersimpan — offline tetap jalan | | |
| 11 | HP | Tap marker 🌱 (pohon) | Marker tersimpan | | |
| 12 | HP | Tap marker 🕳️ (rorak) | Marker tersimpan | | |
| 13 | HP | Tap marker 🌰 (seedling) | Marker tersimpan | | |
| 14 | HP | Tap tombol form (kanan bawah) → pilih form → isi → submit | "Tersimpan!" (IndexedDB) | | |
| 15 | HP | Ambil foto dari **kamera** | Kamera HP terbuka, foto tersimpan | | |
| 16 | HP | Ambil foto dari **galeri** | Galeri terbuka, foto tersimpan | | |
| 17 | HP | Tap **Exit** | Masuk exit sync flow | | |
| 18 | HP | Review summary (jarak, marker, laporan, foto) → cek **2 tombol download** | Ada **"📄 Track Saja"** (TXT) dan **"🗺️ Track + Map"** (PNG) | | |
| 19 | HP | Klik **📄 Track Saja** | Download file .txt: GPS points, markers, forms, jarak | | |
| 20 | HP | Klik **🗺️ Track + Map** | Download file .png: screenshot map + overlay info | | |
| 21 | HP | Klik **Upload & Selesai** | 4 phase: upload report → foto → cleanup → done | | |
| 22 | HP | **Hidupkan koneksi** → buka kembali halaman | Data sudah terkirim, tidak ada duplikasi | | |

### 2.4 Dark Mode

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Klik toggle dark mode (🌙) di header | Semua background jadi gelap |ya| |
| 2 | Both | Cek halaman **Landing** | Hero, stats, map, volunteer, donasi, footer semua gelap |ya | |
| 3 | Both | Cek halaman **About** | Value cards, CTA, header gelap | ya| |
| 4 | Both | Cek halaman **Report Issue** | Form, textarea, button gelap | ya| |
| 5 | Both | Cek halaman **Profile** | Avatar, edit form, points history gelap | ya| |
| 6 | Both | Cek halaman **Admin** | Sidebar, tabel, card semua gelap |ya | |
| 7 | Both | Cek **Map container** | Background map TETAP putih (Leaflet) — jangan ikut gelap | ya| |
| 8 | Both | Klik toggle lagi (☀️) | Kembali ke mode terang semua halaman | ya| |

### 2.5 i18n EN/ID

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Klik toggle bahasa (ID → EN) | Semua label berubah Inggris |ya | |
| 2 | Both | Cek Landing: "Map", "Dashboard", "Community", "Learn", "Media", "Donate" | Nav berubah Inggris |ya | |
| 3 | Both | Cek About: "About SpringHub", "Vision & Mission" | Konten berubah |yaa | |
| 4 | Both | Cek Form: field labels English | Berubah |ya | |
| 5 | Both | Cek Footer: "Stay Updated", "Subscribe", "Platform" | Berubah |ya | |
| 6 | Both | Klik toggle balik (EN → ID) | Semua kembali Indonesia |ya | |

untuk notifikasi belum bisa berubah ke bahasa indo dan inggris
tonton di youtube masih indo only
### 2.6 Notifikasi

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Login volunteer, cek bell icon 🔔 | Angka merah (unread count) muncul |ya | |
| 2 | Both | Klik bell icon | Buka halaman `/notifications` |ya | |
| 3 | Both | Cek daftar notifikasi | Ada ✅ "Laporan ... disetujui" dan/atau ❌ "ditolak" |ya | |
| 4 | Both | Klik **Tandai Dibaca** pada satu notif | Blue dot di kiri hilang |ya | |
| 5 | Both | Klik **Tandai Semua Dibaca** | Semua notif jadi read (tanpa blue dot) |ya | |

---

## 🟢 PRIORITAS 3 — Polish

### 3.1 Map Filter

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka landing, scroll ke map | Report list muncul di bawah map |ya | |
| 2 | Both | Uncentang "Monitoring" | Marker + list item monitoring hilang |ya | |
| 3 | Both | Uncentang "Tree Planting" | Marker + list item tree hilang |ya | |
| 4 | Both | Centang kembali | Marker + list item muncul lagi |ya | |

ada beberapa catatan warna pin dalam map atau marker. untuk spring atau mata air kan ada beberapa kondisi, jika baik maka biru, sedang atau restorasi kamu beri warna kuning, dan merah untuk terdegrasi

### 3.2 Pagination

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Cek volunteer feed (Community section) | Pagination nomor halaman muncul |ya | |
| 2 | Both | Klik nomor halaman 2 | Konten activity feed berganti |ya | |
| 3 | Both | Cek map report list (jika >6 item) | Tombol ← Previous / Next → berfungsi |ya | |

### 3.3 Report Issue

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/report-issue` | 2 section: Laporkan Bug + Kritik & Saran |ya| |
| 2 | Both | Isi Bug Description + pilih screenshot | File terpilih, nama file muncul |ya | |
| 3 | Both | Isi Kritik + Saran | Text terisi |ya | |
| 4 | Both | Klik **Kirim** | Success "Terima kasih!" |ya| |
| 5 | Both | Login admin, buka tab **Feedback** | Feedback baru muncul dengan type "bug" + deskripsi |ya| |

ini report issue juga masih indo only harus dibenahi

### 3.4 Profile

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/profile` | Avatar (inisial), username, email, region, points, trust score |ya | |
| 2 | Both | Klik **Edit Profile** | Form edit muncul: username, region, password |ya | |
| 3 | Both | Ganti region → klik **Save** | Banner sukses hijau muncul |ya| |
| 4 | Both | Scroll ke Points History | Riwayat poin: Approved +25, Streak, dll |ya| |

tapi ada tulisan diatas profile.claimnone, tapi aku gak tau ittu apa

### 3.5 Learning Hub

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka landing, scroll ke Learning Hub | Course cards (dengan image + title + deskripsi) |ya | |
| 2 | Both | Klik salah satu course | Detail course: title, module list, progress |ya | |
| 3 | Both | Klik nama module | Halaman module: konten, video embed |ya | |
| 4 | Both | Klik **Tandai Selesai** | Progress bar terisi, poin +25 ||tidak | aku tidak bisa mengclaim karena harus login, padahal sudah login

### 3.6 About Page

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/about` | Hero: "Tentang SpringHub", paragraf deskripsi |ya| |
| 2 | Both | Scroll ke Visi & Misi | Paragraf visi terbaca |ya | |
| 3 | Both | Cek grid 6 value cards | Masing-masing icon (Droplets, Users, TreePine, Shield, Heart, MapPin) + judul + desc |ya| |
| 4 | Both | Scroll ke CTA | Tombol "Gabung Sekarang" → `/join` |ya| |
| 5 | Both | Klik "Lihat Peta" | Scroll ke section map di landing |ya | |

### 3.7 Admin Forms Builder

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | PC | Login admin, buka `/admin/forms` | Daftar form (spring-monitoring, dll) dalam card grid |ya | |
| 2 | PC | Klik salah satu form | Field list: id, label, type, required, options |ya | |
| 3 | PC | Klik **+ Add Field** | Modal tambah field terbuka | ya| |
| 4 | PC | Pilih type "Select", isi label, options (1 per baris) | Field tersimpan |ya | |
| 5 | PC | Klik toggle Active/Inactive | Form disembunyikan/ditampilkan |ya | |

### 3.8 Admin Lainnya

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | PC | **Export CSV** — Klik Export di Users/Reports/Donations | File CSV terdownload |ya | |
| 2 | PC | **Points Rules** — Buka `/admin/points` | Tabel rules, bisa Create/Edit/Delete |ya | |
| 3 | PC | **Courses** — Buka `/admin/courses` | Card grid courses, bisa Create/Edit/Delete |ya | |
| 4 | PC | **Content CMS** — Buka `/admin/content` | Content blocks, bisa Add/Edit/Hapus |ya | |
| 5 | PC | **Users** — Klik role badge user → pilih role baru | Role berubah setelah reload |ya | |

### 3.9 Links & Footer

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Footer: klik **Privacy Policy** | Buka `/privacy` |ya| |
| 2 | Both | Footer: klik **Terms of Service** | Buka `/terms` |ya | |
| 3 | Both | Footer: klik **FAQ** | Buka `/faq` |ya | |
| 4 | Both | Footer: klik **Help Center** | Buka `/help` |ya | |
| 5 | Both | Footer: klik **Report Issue** | Buka `/report-issue` |ya | |
| 6 | Both | Footer: klik icon **Instagram** | Buka IG @jagasemesta (tab baru) |ya | |
| 7 | Both | Footer: klik icon **YouTube** | Buka YouTube @jagasemesta (tab baru) |ya | |
| 8 | Both | Footer: klik icon **TikTok** | Buka TikTok @jagasemesta (tab baru) |ya | |
| 9 | Both | Footer: klik icon **Facebook** | Buka FB @jagasemesta (tab baru) |ya | |
| 10 | Both | Footer: isi email + klik **Subscribe** | Alert "Terima kasih!" (jangan 403) | | |belum ku coba

### 3.10 Spring Timeline (Fitur Baru 🆕)

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Buka `/springs` | Daftar semua mata air, masing-masing card: nama, provinsi, jumlah laporan, tahun | | |
| 2 | Both | Jika daftar kosong | Tampilkan "Belum ada mata air terdaftar" | | |
| 3 | Both | Klik salah satu spring | Buka halaman `/springs/[id]` | | |
| 4 | Both | Cek header halaman | Nama spring, provinsi, tahun pertama dipantau, jumlah laporan | | |
| 5 | Both | Cek 3 stat cards | "Terakhir diperbarui", "Total laporan", "Tahun pemantauan" | | |
| 6 | Both | Scroll ke timeline | Laporan per tahun, urut descending (terbaru di atas) | | |
| 7 | Both | Cek 1 item timeline | Bulatan tahun di kiri, badge tipe form, tanggal, username | | |
| 8 | Both | Cek field data preview | Field terisi dari report (flow_condition, water_quality, dll) | | |
| 9 | Both | Cek foto (jika ada) | Thumbnail foto di timeline | | |
| 10 | Both | Klik link "Semua Mata Air" | Kembali ke daftar `/springs` | | |
| 11 | **HP** | Submit form spring-monitoring dengan nama spring yang SUDAH ADA | Report otomatis ter-link ke spring yang sama | | |
| 12 | **HP** | Submit form spring-monitoring dengan nama spring BARU | Spring baru terbuat | | |
| 13 | **PC** | Buka `/springs` → cek spring yang diupdate | Laporan terbaru muncul di timeline spring | | |

aku tidak menemukan ini dimana
 
### 3.11 Floating Points Guide

| # | Device | Aksi | Harapan | ✅/❌ | Catatan |
|---|--------|------|---------|------|---------|
| 1 | Both | Cari floating button ⭐ di kanan bawah halaman | Tombol muncul, selalu visible walau di-scroll | | |aku tidak tahu ini
| 2 | Both | Klik tombol ⭐ | Modal "Panduan Poin" terbuka |ya | |
| 3 | Both | Scroll isi modal | Semua aturan poin (base + bonus + milestone) terbaca |ya | |
| 4 | Both | Klik tombol X / klik luar modal | Modal tertutup | | |aku tidak tahu ini
| 5 | Both | Cek z-index — saat modal terbuka, tombol ⭐ tidak boleh di atasnya | Modal selalu di atas tombol | | |aku tidak tahu ini

---

## 📊 RINGKASAN HASIL TEST

| Prioritas | Total Test | ✅ Pass | ❌ Fail | Skip |
|-----------|:----------:|:-------:|:-------:|:----:|
| P1 — Core Flow | 25 | | | |
| P2 — UI & Fitur | 39 | | | |
| P3 — Polish | 35 | | | |
| **TOTAL** | **99** | | | |

### Catatan Bug Ditemukan

| No | Halaman | Issue | Screenshot |
|----|---------|-------|------------|
| | | | |
| | | | |

---

> **Estimasi:** 45-60 menit untuk PC + 30 menit untuk HP
> 
> **Tips:** Prioritaskan P1 dulu. Kalau P1 semua ✅, web siap production.

1. temuan ringan, thumbnail untuk yt dan media terbaru tidak muncul kalaupun muncul itu sangat lama, kemudian map munculnya lama
2. komentar masih belum bisa save
3. warna pin dalam map atau marker. untuk spring atau mata air kan ada beberapa kondisi, jika baik maka biru, sedang atau restorasi kamu beri warna kuning, dan merah untuk terdegrasi
4. untuk marker pada map, bibit stok bibit sepertinya mengalami bug, karena tidak bisa di hilngkan 
5. masih di map, untuk "apa arti warna ini?" icon atau logo tidak sejajar dengan huruf, kamu sejajarkan ya
6. plaform masih https://springhub.vercel.app/help#media. tolong perbaiki, itu berlaku untuk semua di platform
7. 
