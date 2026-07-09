# Manual Test — SpringHub
**Tanggal**: 9 Juli 2026 (Update: Course-PointRule, PointRule award, route map)
**Domain**: https://www.springhub.id
**Total Test**: ~155 test case — 14 kategori

> Cara pakai: Baca langkah-langkahnya, coba satu per satu, tulis **PASS** atau **FAIL** di kolom Hasil.
> Kalo bingung ada petunjuk, baca lagi langkahnya pelan-pelan.

---

## Akun Demo

| Akun | Email | Password | Bisa apa? |
|---|---|---|---|
| **Admin** | `admin@springhub.id` | `demo12345` | Lihat semua data, approve laporan, atur map, kelola user |
| **Ucup** | `ucup@springhub.id` | `ucup12345` | Volunteer dengan **20.168 poin** — bisa buat proyek baru |
| **Sari** | `vol@springhub.id` | `vol12345` | Volunteer dengan **8.750 poin** — belum bisa buat proyek |

---

## Persiapan (Cukup Sekali)

Buka Terminal (Command Prompt / PowerShell / Terminal):
```bash
# Simpan cookie biar gak login terus
COOKIE="/tmp/springhub.txt"
API="https://www.springhub.id"

# Login sebagai admin
curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@springhub.id","password":"demo12345"}'

# Ambil token CSRF (dibutuhkan untuk kirim form)
CSRF=$(curl -sk -c $COOKIE -b $COOKIE $API/api/csrf | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))")
echo $CSRF
```

---

## Test 1 — Buka Website (5 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 1.1 | Landing page kebuka | Buka `www.springhub.id` di browser — harusnya muncul halaman utama dengan peta, statistik, dan tombol donasi | |
| 1.2 | Pakai HTTPS aman | Lihat di address bar — harus ada gembok 🔒 | |
| 1.3 | Halaman 404 keren | Buka `www.springhub.id/halaman-yang-tidak-ada` — harusnya muncul halaman "Halaman Tidak Ditemukan" yang bagus, bukan putih polos | |
| 1.4 | Icon tab (favicon) muncul | Lihat di tab browser — harusnya logo SpringHub. Buka `www.springhub.id/favicon.png?v=3` — harusnya gambar logo 196x196 | |
| 1.5 | Dark mode bisa diganti | Klik tombol bulan/matahari di pojok kanan atas — tampilan harus berubah jadi gelap/terang | |
| 1.6 | Favicon cache bust | Di incognito, buka `www.springhub.id/favicon.ico` — harusnya download file 31KB (bukan icon "S" kecil) | |

---

## Test 2 — Login & Daftar (8 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 2.1 | Halaman login terbuka | Buka `www.springhub.id/sign-in` — harusnya ada form email + password | |
| 2.2 | Login admin berhasil | Isi email `admin@springhub.id`, password `demo12345`, klik Login — harusnya masuk ke halaman utama | |
| 2.3 | Password salah ditolak | Isi email `admin@springhub.id`, password `salah` — harusnya muncul "Email atau password salah" | |
| 2.4 | Lockout (5x salah) | Coba login 5 kali dengan password salah — setelah percobaan ke-5 harusnya muncul "Akun terkunci karena terlalu banyak percobaan" | |
| 2.5 | Register halaman terbuka | Buka `www.springhub.id/join` — harusnya ada form email + password + username | |
| 2.6 | Password lemah ditolak | Coba daftar dengan password `123` — harusnya ditolak, minimal 8 karakter | |
| 2.7 | Password tanpa huruf besar ditolak | Coba daftar dengan password `abcdefgh1` — harusnya ditolak, harus ada huruf BESAR | |
| 2.8 | Email duplikat ditolak | Coba daftar dengan email `admin@springhub.id` — harusnya muncul "Email sudah terdaftar" | |

---

## Test 3 — Halaman Admin (15 test)

### Login ke Admin dulu:
- Buka `www.springhub.id/sign-in`, login dengan `admin@springhub.id` / `demo12345`
- Buka `www.springhub.id/admin`

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 3.1 | Dashboard admin | Harusnya muncul angka: total user, laporan, donasi, proyek | |
| 3.2 | Sidebar menu | Di sebelah kiri harus ada menu: Dashboard, Users, Reports, Forms, Map, dll | |
| 3.3 | Daftar user | Klik menu "Users" — harusnya ada tabel dengan email, username, role, poin | |
| 3.4 | Pagination user | Kalo usernya banyak, harusnya ada tombol ← Prev dan Next → | |
| 3.5 | Daftar laporan | Klik "Reports" — harusnya ada daftar laporan dari relawan | |
| 3.6 | Toggle aktif/nonaktif | Klik tombol mata 👁 di laporan — laporan harusnya berubah status | |
| 3.7 | Review queue | Klik "Review Queue" — harusnya ada laporan yang menunggu review | |
| 3.8 | Approve laporan | Klik tombol centang hijau ✅ — laporan harus berubah jadi "approved" | |
| 3.9 | Minimal 3 foto | Coba approve laporan dengan foto < 3 — harusnya ditolak dengan pesan "Minimal 3 foto" | |
| 3.10 | Trust score | Klik "Trust Score" — harusnya ada daftar user dengan skor kepercayaan | |
| 3.11 | Reset trust score | Klik tombol reset 🔄 — skor harus kembali ke 50 | |
| 3.12 | Manajemen form | Klik "Forms" — harusnya daftar 5 form yang bisa diedit | |
| 3.13 | Buat form baru | Klik "Tambah Form" — isi data, simpan — form baru harus muncul di halaman depan | |
| 3.14 | Setting map | Klik "Map" — harusnya ada daftar tipe titik peta + warna kategori | |
| 3.15 | Ubah warna marker | Klik color picker di kategori — warna marker di peta harus berubah | |
| 3.16 | Admin map — tab settings | Di halaman admin map, tab "Settings" — harusnya tampil daftar tipe + kategori + warna | |
| 3.17 | Admin map — tab map | Klik tombol "Map View" — harusnya tampil peta dengan marker-marker yang warnanya sesuai kategori | |
| 3.18 | Admin map — form terhubung | Klik marker di admin map — popup harus nampilin form-form apa aja yang terhubung ke tipe titik itu | |

---

## Test 4 — Form & Laporan (8 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 4.1 | Halaman form terbuka | Buka `www.springhub.id/report/spring-monitoring` — harusnya ada form isian | |
| 4.2 | Field lokasi (geser pin) | Klik tombol "Dapatkan Lokasi" atau geser pin di peta mini — koordinat harus terisi | |
| 4.3 | Upload foto | Klik tombol upload, pilih 3-5 foto dari komputer — foto harus muncul thumbnailnya | |
| 4.4 | Maksimal 5 foto | Coba upload foto ke-6 — harusnya ditolak dengan pesan "Maksimal 5 foto" | |
| 4.5 | Kirim laporan | Isi semua field, klik Kirim — harusnya muncul pesan "Laporan berhasil dikirim" | |
| 4.6 | Validasi lat/lng | Coba isi latitude dengan angka 999 — harusnya ditolak (range -90 sampai 90) | |
| 4.7 | Honey pot (anti-bot) | Coba isi field yang tidak kelihatan di halaman — harusnya ditolak | |
| 4.8 | CSRF aman | Form tanpa token CSRF — harusnya ditolak 403 | |
| 4.9 | Marker popup di peta | Scroll ke peta, klik salah satu marker (lingkaran warna biru/merah/kuning) — harusnya muncul popup dengan info laporan | |
| 4.10 | Protection radius transparan | Klik di area lingkaran putus-putus di sekitar marker — harusnya popup marker tetap muncul (gak kehalang) | |
| 4.11 | Desa & Kecamatan muncul | Buka form Spring Monitoring — field Desa dan Kecamatan harus muncul (sinkron online & offline) | |

---

## Test 5 — Peta (6 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 5.1 | Peta muncul | Scroll ke section peta — harusnya peta Indonesia dengan marker-marker | |
| 5.2 | Dropdown filter | Klik dropdown "Semua Titik" — harusnya ada pilihan: Mata Air, Tanam Pohon, dll | |
| 5.3 | Filter berdasarkan tipe | Pilih "Mata Air" — peta harusnya cuma nunjukkin marker mata air | |
| 5.4 | Klik marker | Klik salah satu marker di peta — harusnya muncul popup dengan info | |
| 5.5 | Scroll zoom | Coba scroll di peta — peta harusnya bisa zoom in/out (sekarang udah bisa) | |
| 5.6 | Form baru muncul di filter | Admin bikin form baru → buka halaman depan → dropdown filter harus muncul form barunya | |

---

## Test 6 — Poin & Leaderboard (6 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 6.1 | Poin bertambah setelah approve | Approve laporan ucup — poin ucup harus naik (cek di /admin/users) | |
| 6.2 | Poin dari DB form (bukan hardcode) | Admin edit poin form → submit → approve → poin harus sesuai yang diedit | |
| 6.3 | Leaderboard muncul | Buka halaman depan — harusnya ada papan peringkat volunteer teratas | |
| 6.4 | Streak harian | Lapor 3 hari berturut-turut — harusnya dapet bonus +5 poin (hari ke-3) | |
| 6.5 | Milestone 10 laporan | Kalo udah 10 laporan disetujui — harusnya dapet bonus +50 poin | |
| 6.6 | Threshold 20.000 poin | Ucup (20.168 pts) bisa klik "Buat Proyek" — Sari (8.750 pts) tombolnya harus terkunci | |

---

## Test 7 — Donasi (5 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 7.1 | Form donasi muncul | Scroll ke bagian donasi di halaman depan — harusnya ada pilih nominal | |
| 7.2 | Pilih nominal | Klik salah satu nominal (Rp 20K, Rp 50K, dll) — field terisi otomatis | |
| 7.3 | Custom nominal | Klik "Custom" — bisa isi jumlah sendiri (min Rp 1.000, max Rp 100.000.000) | |
| 7.4 | Amount vs tier dicek | Pilih tier "Rp 20K" tapi ubah jumlah jadi Rp 1.000.000 — harusnya ditolak | |
| 7.5 | Halaman sukses | Kalo bayar berhasil — harusnya diarahkan ke halaman "Pembayaran Berhasil" | |

---

## Test 8 — Keamanan (8 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 8.1 | Halaman admin ditolak untuk user biasa | Login sebagai ucup, coba buka `/admin` — harusnya redirect ke halaman utama | |
| 8.2 | API admin ditolak | Pake terminal: `curl $API/api/admin/users` tanpa cookie — harusnya 403/401 | |
| 8.3 | CSRF admin wajib | Coba `curl -X POST $API/api/admin/forms` tanpa CSRF — harusnya 403 | |
| 8.4 | Rate limit terasa | Coba login 10x dalam 1 menit — harusnya ditolak "Terlalu banyak percobaan" | |
| 8.5 | Data sensitif aman | `curl $API/api/reports` — harusnya TIDAK ada email, nomor HP, atau lokasi presisi | |
| 8.6 | SQL injection gagal | Coba isi form dengan `' OR 1=1 --` — harusnya ditolak validasi | |
| 8.7 | XSS gagal | Coba isi form dengan `<script>alert(1)</script>` — harusnya tersimpan aman (tidak jalan) | |
| 8.8 | Admin bisa export data | Buka `/admin` → klik Export → pilih Users — harusnya download file CSV | |
| 8.9 | Approve/reject pake CSRF | Buka Review Queue → klik Approve/Reject — harusnya berhasil (gak error "Invalid CSRF token") | |

---

## Test 9 — Dark Mode (5 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 9.1 | Landing page dark mode | Aktifkan dark mode — semua section harus berubah warna (header, peta, footer) | |
| 9.2 | Admin panel dark mode | Buka `/admin` di dark mode — sidebar, tabel, tombol harus ikut gelap | |
| 9.3 | Admin map dark mode | Buka `/admin/map` di dark mode — background harus gelap, teks terbaca | |
| 9.4 | Form halaman dark mode | Buka `/report/spring-monitoring` di dark mode — form harus terbaca | |
| 9.5 | Logo ikut berubah | Logo SpringHub harus putih di dark mode, hitam di light mode | |

---

## Test 10 — Akun & Profile (4 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 10.1 | Profile page | Login sebagai ucup, buka `www.springhub.id/profile` — harusnya ada info akun | |
| 10.2 | Riwayat poin | Di profile page — harusnya ada daftar poin yang pernah didapat | |
| 10.3 | Ganti password | Coba ganti password — password baru harus kuat (huruf besar + kecil + angka) | |
| 10.4 | Logout | Klik tombol logout — harusnya kembali ke halaman utama, menu login muncul lagi | |

---

## Test 11 — CRUD Admin (8 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 11.1 | Tambah course | Buka `/admin/courses` → klik Tambah → isi data → simpan — harusnya muncul | |
| 11.2 | Edit form field | Buka `/admin/forms` → klik salah satu form → edit field → simpan — field berubah | |
| 11.3 | Hapus form (soft delete) | Klik hapus pada form yang punya laporan — form jadi nonaktif, data aman | |
| 11.4 | Ganti slug form ditolak | Coba ganti slug form yang punya laporan — harusnya ditolak dengan pesan jelas | |
| 11.5 | Tambah content block | Buka `/admin/content` → tambah konten baru → simpan — muncul di landing page | |
| 11.6 | Lihat feedback | Buka `/admin/feedback` — harusnya ada kritik/saran dari pengguna | |
| 11.7 | Lihat error log | Buka `/admin/errors` — harusnya ada daftar error teknis (kalo ada) | |
| 11.8 | Export CSV | Klik Export → pilih jenis data → download — file CSV harus terdownload | |

---

## Test 12 — API Endpoints (10 test)

Gunakan terminal. Login dulu sebagai admin.

| # | Yang Dicek | Perintah | Hasil |
|---|---|---|---|
| 12.1 | Health check | `curl $API/api/health` → harusnya `{"status":"ok"}` | |
| 12.2 | Daftar form | `curl $API/api/forms` → harusnya array forms dengan field dan mapType | |
| 12.3 | Tipe titik peta | `curl $API/api/map-points/types` → harusnya 4 tipe (spring, tree-planting, trench, seedling) | |
| 12.4 | Leaderboard | `curl $API/api/leaderboard` → harusnya top 20 volunteer | |
| 12.5 | Daftar user (admin only) | `curl -b $COOKIE $API/api/admin/users` → harusnya daftar user | |
| 12.6 | User tanpa cookie ditolak | `curl $API/api/admin/users` → harusnya `{"error":"Unauthorized"}` | |
| 12.7 | Export users CSV | `curl -b $COOKIE "$API/api/admin/export?entity=users"` → download CSV | |
| 12.8 | Export reports + foto | `curl -b $COOKIE "$API/api/admin/export?entity=reports"` → CSV dengan kolom PhotoURLs | |
| 12.9 | Notifikasi | Login sebagai ucup → `curl -b $COOKIE $API/api/notifications` → daftar notif | |
| 12.10 | Dashboard stats | `curl $API/api/dashboard` → statistik: total reports, approved, dll | |

---

---

## Test 13 — Storage & Backup (4 test)

Gunakan terminal untuk test ini.

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 13.1 | Cek penggunaan disk | `df -h /` — harusnya terpakai ≤ 70 GB (kalo lebih dari 100 GB, ada penumpukan build cache) | |
| 13.2 | Cek docker build cache | `docker system df` — `Build Cache` harusnya 0 B (kalo masih besar, jalankan `docker builder prune -a`) | |
| 13.3 | Cek database berfungsi | Buka admin panel → data users/reports/donasi muncul — database jalan | |
| 13.4 | Cek foto tersimpan | `docker exec springhub-web-1 ls /data/uploads/reports/ 2>/dev/null \|\| echo "Belum ada foto"` — harusnya ada folder report atau "Belum ada foto" | |

---

## Test 14 — Offline Mode & PWA (8 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 14.1 | Halaman offline terbuka | Buka `www.springhub.id/offline` — harusnya ada tombol "Mulai Survey Offline" | |
| 14.2 | Setup offline — pilih form | Klik "Mulai Survey Offline" → pilih form yang mau diisi (monitoring, tree planting, dll) → Next | |
| 14.3 | Cache form definition | Setelah setup, form yang dipilih harus muncul di daftar form offline | |
| 14.4 | Isi form offline | Pilih salah satu form, isi field-fieldnya (nama, lokasi, foto minimal 3) | |
| 14.5 | Upload foto offline | Klik tombol foto, ambil minimal 3 foto — counter harus bertambah | |
| 14.6 | Submit offline | Klik "Simpan" — data harus tersimpan dan muncul notifikasi sukses | |
| 14.7 | Sinkronisasi offline→online | Kembali ke koneksi internet, buka `/offline` → klik "Sinkronkan" — data harus terkirim | |
| 14.8 | PWA icon baru | Di HP Android/iOS, buka menu "Add to Home Screen" — icon harus logo baru (bukan "S") | |
| 14.9 | Offline langsung ke mode survey | Buka PWA saat offline — harus langsung ke halaman `/offline`, bukan landing page | |
| 14.10 | Form offline sinkron dengan DB | Setup offline, lalu admin ubah form → online → buka offline setup — form harus update | |

---

## Test 15 — PointRule & Course (4 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 15.1 | Course selesai dapet poin | Buka Learning Hub → selesaikan 1 course → cek poin harus bertambah 25 | |
| 15.2 | Admin edit poin course | Buka `/admin/points` → edit "Course Selesai" → selesaikan course → poin sesuai yang diedit | |
| 15.3 | Admin edit poin form | Buka `/admin/points` → edit "Spring Monitoring" → submit form → approve → poin sesuai yang diedit | |
| 15.4 | Poin dari DB form | Edit `pointsOnSubmit` di `/admin/forms` → submit → approve → poin sesuai (PointRule override) | |

---

## Test 16 — Route Map (3 test)

| # | Yang Dicek | Cara Cek | Hasil |
|---|---|---|---|
| 16.1 | Route map terbuka | Buka `www.springhub.id/api-routes.html` — harusnya graph dengan 101 node + 123 edge | |
| 16.2 | Filter by type | Klik filter "Admin" — graph harus filter cuma node merah + model terkait | |
| 16.3 | Klik node | Klik salah satu node — detail panel harus muncul (method, auth, models) | |

---

## Ringkasan Hasil

| Kategori | PASS | FAIL | Catatan |
|---|---|---|---|
| Test 1 — Buka Website (6) | | | |
| Test 2 — Login & Daftar (8) | | | |
| Test 3 — Halaman Admin (18) | | | |
| Test 4 — Form & Laporan (11) | | | |
| Test 5 — Peta (6) | | | |
| Test 6 — Poin & Leaderboard (6) | | | |
| Test 7 — Donasi (5) | | | |
| Test 8 — Keamanan (9) | | | |
| Test 9 — Dark Mode (5) | | | |
| Test 10 — Akun & Profile (4) | | | |
| Test 11 — CRUD Admin (8) | | | |
| Test 12 — API Endpoints (10) | | | |
| Test 13 — Storage & Backup (4) | | | |
| Test 14 — Offline Mode & PWA (10) | | | |
| Test 15 — PointRule & Course (4) | | | |
| Test 16 — Route Map (3) | | | |
| **TOTAL** | **/** | **/** | |
