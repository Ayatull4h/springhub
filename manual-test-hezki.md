# Manual Test — SpringHub

**Tanggal**: 9 Juli 2026 (Update: Course-PointRule, PointRule award, route map)
**Domain**: https://www.springhub.id
**Total Test**: \~155 test case — 14 kategori

> Cara pakai: Baca langkah-langkahnya, coba satu per satu, tulis \\\*\\\*PASS\\\*\\\* atau \\\*\\\*FAIL\\\*\\\* di kolom Hasil.
> Kalo bingung ada petunjuk, baca lagi langkahnya pelan-pelan.

\---

## Akun Demo

|Akun|Email|Password|Bisa apa?|
|-|-|-|-|
|**Admin**|`admin@springhub.id`|`demo12345`|Lihat semua data, approve laporan, atur map, kelola user|
|**Ucup**|`ucup@springhub.id`|`ucup12345`|Volunteer dengan **20.168 poin** — bisa buat proyek baru|
|**Sari**|`vol@springhub.id`|`vol12345`|Volunteer dengan **8.750 poin** — belum bisa buat proyek|

\---

## Persiapan (Cukup Sekali)

Buka Terminal (Command Prompt / PowerShell / Terminal):

```bash
# Simpan cookie biar gak login terus
COOKIE="/tmp/springhub.txt"
API="https://www.springhub.id"

# Login sebagai admin
curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \\\\
  -H "Content-Type: application/json" \\\\
  -d '{"email":"admin@springhub.id","password":"demo12345"}'

# Ambil token CSRF (dibutuhkan untuk kirim form)
CSRF=$(curl -sk -c $COOKIE -b $COOKIE $API/api/csrf | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))")
echo $CSRF
```

\---

## Test 1 — Buka Website (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|1.1|Landing page kebuka|Buka `www.springhub.id` di browser — harusnya muncul halaman utama dengan peta, statistik, dan tombol donasi|iya|
|1.2|Pakai HTTPS aman|Lihat di address bar — harus ada gembok 🔒|iya|
|1.3|Halaman 404 keren|Buka `www.springhub.id/halaman-yang-tidak-ada` — harusnya muncul halaman "Halaman Tidak Ditemukan" yang bagus, bukan putih polos|iya, keren|
|1.4|Icon tab (favicon) muncul|Lihat di tab browser — harusnya logo SpringHub. Buka `www.springhub.id/favicon.png?v=3` — harusnya gambar logo 196x196|iya|
|1.5|Dark mode bisa diganti|Klik tombol bulan/matahari di pojok kanan atas — tampilan harus berubah jadi gelap/terang|iya, tapi logo untuk pasar bibit tidak keubah jadi dark mode|
|1.6|Favicon cache bust|Di incognito, buka `www.springhub.id/favicon.ico` — harusnya download file 31KB (bukan icon "S" kecil)|Tidak download, tapi berhasil dibuka logo|

\---

## Test 2 — Login \& Daftar (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|2.1|Halaman login terbuka|Buka `www.springhub.id/sign-in` — harusnya ada form email + password|iya|
|2.2|Login admin berhasil|Isi email `admin@springhub.id`, password `demo12345`, klik Login — harusnya masuk ke halaman utama|iya|
|2.3|Password salah ditolak|Isi email `admin@springhub.id`, password `salah` — harusnya muncul "Email atau password salah"|iya|
|2.4|Lockout (5x salah)|Coba login 5 kali dengan password salah — setelah percobaan ke-5 harusnya muncul "Akun terkunci karena terlalu banyak percobaan"|iya|
|2.5|Register halaman terbuka|Buka `www.springhub.id/join` — harusnya ada form email + password + username|iya|
|2.6|Password lemah ditolak|Coba daftar dengan password `123` — harusnya ditolak, minimal 8 karakter|iya|
|2.7|Password tanpa huruf besar ditolak|Coba daftar dengan password `abcdefgh1` — harusnya ditolak, harus ada huruf BESAR|iya|
|2.8|Email duplikat ditolak|Coba daftar dengan email `admin@springhub.id` — harusnya muncul "Email sudah terdaftar"|iya|

\---

## Test 3 — Halaman Admin (15 test)

### Login ke Admin dulu:

* Buka `www.springhub.id/sign-in`, login dengan `admin@springhub.id` / `demo12345`
* Buka `www.springhub.id/admin`

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|3.1|Dashboard admin|Harusnya muncul angka: total user, laporan, donasi, proyek|iya|
|3.2|Sidebar menu|Di sebelah kiri harus ada menu: Dashboard, Users, Reports, Forms, Map, dll|iya|
|3.3|Daftar user|Klik menu "Users" — harusnya ada tabel dengan email, username, role, poin|iya|
|3.4|Pagination user|Kalo usernya banyak, harusnya ada tombol ← Prev dan Next →|iya|
|3.5|Daftar laporan|Klik "Reports" — harusnya ada daftar laporan dari relawan|iya|
|3.6|Toggle aktif/nonaktif|Klik tombol mata 👁 di laporan — laporan harusnya berubah status|menunjukkan latitude dan langitude|
|3.7|Review queue|Klik "Review Queue" — harusnya ada laporan yang menunggu review|iya|
|3.8|Approve laporan|Klik tombol centang hijau ✅ — laporan harus berubah jadi "approved"|iya, laporan hilang|
|3.9|Minimal 3 foto|Coba approve laporan dengan foto < 3 — harusnya ditolak dengan pesan "Minimal 3 foto"|iya|
|3.10|Trust score|Klik "Trust Score" — harusnya ada daftar user dengan skor kepercayaan|iya|
|3.11|Reset trust score|Klik tombol reset 🔄 — skor harus kembali ke 50|iya<br />Tadi mencoba mengganti trust score jadi angka random tidak berhasil.<br /><br />Invalid CSRF Token|
|3.12|Manajemen form|Klik "Forms" — harusnya daftar 5 form yang bisa diedit|iya|
|3.13|Buat form baru|Klik "Tambah Form" — isi data, simpan — form baru harus muncul di halaman depan|Tidak, invalid CSRF token|
|3.14|Setting map|Klik "Map" — harusnya ada daftar tipe titik peta + warna kategori|iya|
|3.15|Ubah warna marker|Klik color picker di kategori — warna marker di peta harus berubah|iya|
|3.16|Admin map — tab settings|Di halaman admin map, tab "Settings" — harusnya tampil daftar tipe + kategori + warna|iya|
|3.17|Admin map — tab map|Klik tombol "Map View" — harusnya tampil peta dengan marker-marker yang warnanya sesuai kategori|iya, tapi walau dinonaktifkan masih ada titik di peta|
|3.18|Admin map — form terhubung|Klik marker di admin map — popup harus nampilin form-form apa aja yang terhubung ke tipe titik itu|iya|

\---

## Test 4 — Form \& Laporan (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|4.1|Halaman form terbuka|Buka `www.springhub.id/report/spring-monitoring` — harusnya ada form isian|iya|
|4.2|Field lokasi (geser pin)|Klik tombol "Dapatkan Lokasi" atau geser pin di peta mini — koordinat harus terisi|iya|
|4.3|Upload foto|Klik tombol upload, pilih 3-5 foto dari komputer — foto harus muncul thumbnailnya|iya|
|4.4|Maksimal 5 foto|Coba upload foto ke-6 — harusnya ditolak dengan pesan "Maksimal 5 foto"|iya|
|4.5|Kirim laporan|Isi semua field, klik Kirim — harusnya muncul pesan "Laporan berhasil dikirim"|iya|
|4.6|Validasi lat/lng|Coba isi latitude dengan angka 999 — harusnya ditolak (range -90 sampai 90)|iya|
|4.7|Honey pot (anti-bot)|Coba isi field yang tidak kelihatan di halaman — harusnya ditolak|iya|
|4.8|CSRF aman|Form tanpa token CSRF — harusnya ditolak 403|iya|
|4.9|Marker popup di peta|Scroll ke peta, klik salah satu marker (lingkaran warna biru/merah/kuning) — harusnya muncul popup dengan info laporan|Ada beberapa titik yang tidak ditemukan|
|4.10|Protection radius transparan|Klik di area lingkaran putus-putus di sekitar marker — harusnya popup marker tetap muncul (gak kehalang)|-|
|4.11|Desa \& Kecamatan muncul|Buka form Spring Monitoring — field Desa dan Kecamatan harus muncul (sinkron online \& offline)|iya|

\---

## Test 5 — Peta (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|5.1|Peta muncul|Scroll ke section peta — harusnya peta Indonesia dengan marker-marker|iya|
|5.2|Dropdown filter|Klik dropdown "Semua Titik" — harusnya ada pilihan: Mata Air, Tanam Pohon, dll|iya|
|5.3|Filter berdasarkan tipe|Pilih "Mata Air" — peta harusnya cuma nunjukkin marker mata air|iya|
|5.4|Klik marker|Klik salah satu marker di peta — harusnya muncul popup dengan info|-, ada beberapa yang ada dan ada yang juga tidak ada informasi muncul|
|5.5|Scroll zoom|Coba scroll di peta — peta harusnya bisa zoom in/out (sekarang udah bisa)|iya|
|5.6|Form baru muncul di filter|Admin bikin form baru → buka halaman depan → dropdown filter harus muncul form barunya|invalid CSRF token, untuk vikin form baru|

\---

## Test 6 — Poin \& Leaderboard (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|6.1|Poin bertambah setelah approve|Approve laporan ucup — poin ucup harus naik (cek di /admin/users)|iya|
|6.2|Poin dari DB form (bukan hardcode)|Admin edit poin form → submit → approve → poin harus sesuai yang diedit|iya|
|6.3|Leaderboard muncul|Buka halaman depan — harusnya ada papan peringkat volunteer teratas|iya|
|6.4|Streak harian|Lapor 3 hari berturut-turut — harusnya dapet bonus +5 poin (hari ke-3)|-|
|6.5|Milestone 10 laporan|Kalo udah 10 laporan disetujui — harusnya dapet bonus +50 poin|-|
|6.6|Threshold 20.000 poin|Ucup (20.168 pts) bisa klik "Buat Proyek" — Sari (8.750 pts) tombolnya harus terkunci|iya|

\---

## Test 7 — Donasi (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|7.1|Form donasi muncul|Scroll ke bagian donasi di halaman depan — harusnya ada pilih nominal|iya|
|7.2|Pilih nominal|Klik salah satu nominal (Rp 20K, Rp 50K, dll) — field terisi otomatis|iya|
|7.3|Custom nominal|Klik "Custom" — bisa isi jumlah sendiri (min Rp 1.000, max Rp 100.000.000)|iya|
|7.4|Amount vs tier dicek|Pilih tier "Rp 20K" tapi ubah jumlah jadi Rp 1.000.000 — harusnya ditolak|iya|
|7.5|Halaman sukses|Kalo bayar berhasil — harusnya diarahkan ke halaman "Pembayaran Berhasil"|Tidak, XENDIT\_SECRET\_KEY is not set. Cannot create invoice.|

\---

## Test 8 — Keamanan (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|8.1|Halaman admin ditolak untuk user biasa|Login sebagai ucup, coba buka `/admin` — harusnya redirect ke halaman utama|iya|
|8.2|API admin ditolak|Pake terminal: `curl $API/api/admin/users` tanpa cookie — harusnya 403/401|unauthorized|
|8.3|CSRF admin wajib|Coba `curl -X POST $API/api/admin/forms` tanpa CSRF — harusnya 403|invalid CSRF token|
|8.4|Rate limit terasa|Coba login 10x dalam 1 menit — harusnya ditolak "Terlalu banyak percobaan"|iya|
|8.5|Data sensitif aman|`curl $API/api/reports` — harusnya TIDAK ada email, nomor HP, atau lokasi presisi|iya|
|8.6|SQL injection gagal|Coba isi form dengan `' OR 1=1 --` — harusnya ditolak validasi|-|
|8.7|XSS gagal|Coba isi form dengan `<script>alert(1)</script>` — harusnya tersimpan aman (tidak jalan)|-|
|8.8|Admin bisa export data|Buka `/admin` → klik Export → pilih Users — harusnya download file CSV|iya|
|8.9|Approve/reject pake CSRF|Buka Review Queue → klik Approve/Reject — harusnya berhasil (gak error "Invalid CSRF token")|iya|

\---

## Test 9 — Dark Mode (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|9.1|Landing page dark mode|Aktifkan dark mode — semua section harus berubah warna (header, peta, footer)|Tidak, logo pasar bibit tidak dark mode|
|9.2|Admin panel dark mode|Buka `/admin` di dark mode — sidebar, tabel, tombol harus ikut gelap|iya|
|9.3|Admin map dark mode|Buka `/admin/map` di dark mode — background harus gelap, teks terbaca|iya|
|9.4|Form halaman dark mode|Buka `/report/spring-monitoring` di dark mode — form harus terbaca|iya|
|9.5|Logo ikut berubah|Logo SpringHub harus putih di dark mode, hitam di light mode|iya|

\---

## Test 10 — Akun \& Profile (4 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|10.1|Profile page|Login sebagai ucup, buka `www.springhub.id/profile` — harusnya ada info akun|iya|
|10.2|Riwayat poin|Di profile page — harusnya ada daftar poin yang pernah didapat|iya|
|10.3|Ganti password|Coba ganti password — password baru harus kuat (huruf besar + kecil + angka)||
|10.4|Logout|Klik tombol logout — harusnya kembali ke halaman utama, menu login muncul lagi|iya|

\---

## Test 11 — CRUD Admin (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|11.1|Tambah course|Buka `/admin/courses` → klik Tambah → isi data → simpan — harusnya muncul|Invalid CSRF token<br />Dark mode tidak berfungsi di buat kursus|
|11.2|Edit form field|Buka `/admin/forms` → klik salah satu form → edit field → simpan — field berubah|Invalid CSRF token<br />Dark mode tidak berfungsi di buat kursus|
|11.3|Hapus form (soft delete)|Klik hapus pada form yang punya laporan — form jadi nonaktif, data aman|iya|
|11.4|Ganti slug form ditolak|Coba ganti slug form yang punya laporan — harusnya ditolak dengan pesan jelas|iya|
|11.5|Tambah content block|Buka `/admin/content` → tambah konten baru → simpan — muncul di landing page|iya|
|11.6|Lihat feedback|Buka `/admin/feedback` — harusnya ada kritik/saran dari pengguna|iya|
|11.7|Lihat error log|Buka `/admin/errors` — harusnya ada daftar error teknis (kalo ada)|iya|
|11.8|Export CSV|Klik Export → pilih jenis data → download — file CSV harus terdownload|iya|

\---

## Test 12 — API Endpoints (10 test)

Gunakan terminal. Login dulu sebagai admin.

|#|Yang Dicek|Perintah|Hasil|
|-|-|-|-|
|12.1|Health check|`curl $API/api/health` → harusnya `{"status":"ok"}`|iya|
|12.2|Daftar form|`curl $API/api/forms` → harusnya array forms dengan field dan mapType|iya|
|12.3|Tipe titik peta|`curl $API/api/map-points/types` → harusnya 4 tipe (spring, tree-planting, trench, seedling)|iya|
|12.4|Leaderboard|`curl $API/api/leaderboard` → harusnya top 20 volunteer|iya|
|12.5|Daftar user (admin only)|`curl -b $COOKIE $API/api/admin/users` → harusnya daftar user|iya|
|12.6|User tanpa cookie ditolak|`curl $API/api/admin/users` → harusnya `{"error":"Unauthorized"}`|iya|
|12.7|Export users CSV|`curl -b $COOKIE "$API/api/admin/export?entity=users"` → download CSV|iya, kasih CSV tapi tidak downlaod|
|12.8|Export reports + foto|`curl -b $COOKIE "$API/api/admin/export?entity=reports"` → CSV dengan kolom PhotoURLs|iya, kasih CSV tapi tidak download|
|12.9|Notifikasi|Login sebagai ucup → `curl -b $COOKIE $API/api/notifications` → daftar notif|iya|
|12.10|Dashboard stats|`curl $API/api/dashboard` → statistik: total reports, approved, dll|iya|

\---

\---

## Test 13 — Storage \& Backup (4 test)

Gunakan terminal untuk test ini.

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|13.1|Cek penggunaan disk|`df -h /` — harusnya terpakai ≤ 70 GB (kalo lebih dari 100 GB, ada penumpukan build cache)|iya|
|13.2|Cek docker build cache|`docker system df` — `Build Cache` harusnya 0 B (kalo masih besar, jalankan `docker builder prune -a`)|command not found|
|13.3|Cek database berfungsi|Buka admin panel → data users/reports/donasi muncul — database jalan|Tidak ada +11000|
|13.4|Cek foto tersimpan|`docker exec springhub-web-1 ls /data/uploads/reports/ 2>/dev/null \|\| echo "Belum ada foto"` — harusnya ada folder report atau "Belum ada foto"|command not found|

\---

## Test 14 — Offline Mode \& PWA (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|14.1|Halaman offline terbuka|Buka `www.springhub.id/offline` — harusnya ada tombol "Mulai Survey Offline"|iya|
|14.2|Setup offline — pilih form|Klik "Mulai Survey Offline" → pilih form yang mau diisi (monitoring, tree planting, dll) → Next|iya|
|14.3|Cache form definition|Setelah setup, form yang dipilih harus muncul di daftar form offline|iya|
|14.4|Isi form offline|Pilih salah satu form, isi field-fieldnya (nama, lokasi, foto minimal 3)|iya|
|14.5|Upload foto offline|Klik tombol foto, ambil minimal 3 foto — counter harus bertambah|iya|
|14.6|Submit offline|Klik "Simpan" — data harus tersimpan dan muncul notifikasi sukses|iya|
|14.7|Sinkronisasi offline→online|Kembali ke koneksi internet, buka `/offline` → klik "Sinkronkan" — data harus terkirim|iya|
|14.8|PWA icon baru|Di HP Android/iOS, buka menu "Add to Home Screen" — icon harus logo baru (bukan "S")|iya|
|14.9|Offline langsung ke mode survey|Buka PWA saat offline — harus langsung ke halaman `/offline`, bukan landing page|iya|
|14.10|Form offline sinkron dengan DB|Setup offline, lalu admin ubah form → online → buka offline setup — form harus update|iya|

\---

## Test 15 — PointRule \& Course (4 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|15.1|Course selesai dapet poin|Buka Learning Hub → selesaikan 1 course → cek poin harus bertambah 25|Tidak, Silakan masuk untuk melacak progress, walaupun sudah login|
|15.2|Admin edit poin course|Buka `/admin/points` → edit "Course Selesai" → selesaikan course → poin sesuai yang diedit|Tidak, Silakan masuk untuk melacak progress, walaupun sudah login|
|15.3|Admin edit poin form|Buka `/admin/points` → edit "Spring Monitoring" → submit form → approve → poin sesuai yang diedit|Tidak, Silakan masuk untuk melacak progress, walaupun sudah login|
|15.4|Poin dari DB form|Edit `pointsOnSubmit` di `/admin/forms` → submit → approve → poin sesuai (PointRule override)|Tidak, Silakan masuk untuk melacak progress, walaupun sudah login|

\---

## Test 16 — Route Map (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|16.1|Route map terbuka|Buka `www.springhub.id/api-routes.html` — harusnya graph dengan 103 route node + 25 model + 126 koneksi|iya|
|16.2|Filter by type|Klik filter "Admin" — graph harus filter cuma node merah + model terkait|iya|
|16.3|Klik node|Klik salah satu node — detail panel harus muncul (method, auth, models)|iya|

\---

## Test 17 — Project \& Like (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|17.1|FeaturedProjects di landing|Buka `/` — scroll ke section "Proyek Unggulan" — harus ada 2 card proyek + pagination dots|iya|
|17.2|FeaturedProjects paging|Klik next/prev pagination — harus ganti 2 card lain|iya|
|17.3|Halaman /projects|Buka `/projects` — harus daftar proyek dari API (bukan dummy) + pagination 9/page|iya|
|17.4|Detail proyek|Klik salah satu proyek → `/projects/\\\[id]` — harus muncul detail + progress + like button + komentar|iya|
|17.5|Like toggle|Klik tombol like (❤️) — harus toggle filled/outline + counter berubah|iya|
|17.6|Komentar|Scroll ke bagian komentar — isi teks + submit — harus muncul di list|iya|

\---

## Test 18 — API Routing Verification (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|18.1|`GET /api/projects`|Buka di browser/postman — harus return 200 + array projects|iya<br />(7 projects)|
|18.2|`GET /api/projects/\\\[id]`|Buka di browser — harus return 200 + detail project|iya|
|18.3|`GET /api/projects/\\\[id]/like`|Buka di browser — harus return `{liked, likes}`|iya|
|18.4|`GET /api/courses`|Buka di browser — harus return 200 + array courses|<br />iya<br />(3 courses)|
|18.5|`PUT /api/courses/progress`|Complete course → harus return `pointsAwarded: 25`|iya|
|18.6|Duplicate course points|Complete course kedua kali → `pointsAwarded: 0`|iya|
|18.7|`GET /api/auth/me`|Tanpa session → return `{user: null}`|iya|
|18.8|`POST /api/donations/invoice`|Tanpa CSRF → return 403|Page isn't working|

\---

## Test 19 — Aksi Nyata Section (4 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|19.1|Shared header|Buka `/` — scroll ke section "Aksi Nyata" dengan brand accent|iya|
|19.2|Project cards blue theme|Card proyek harus dominan warna biru (sky) — header, badge, progress bar|iya|
|19.3|Donasi card premium|Card donasi harus punya `card` class + social proof stats (Terkumpul, Donatur, Proyek)|iya|
|19.4|Donasi card compact|Form field harus rapat tanpa ruang kosong berlebih|iya|

\---

## Test 20 — Seedlings / Pasar Bibit (14 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|20.1|Marketplace muncul|Buka `www.springhub.id/seedlings` — harusnya grid 9 card bibit per halaman + pagination|iya|
|20.2|Filter provinsi|Pilih provinsi dari dropdown — card harus filter sesuai provinsi|iya|
|20.3|Cari bibit|Ketik "Jati" di kolom search — harusnya cuma muncul card Jati|iya|
|20.4|Pagination 9/page|Kalo bibit > 9, harusnya ada tombol ← Prev dan Next →|iya|
|20.5|Detail bibit|Klik card bibit — harusnya halaman detail dengan nama, jumlah, stok, pemilik, WA link|iya|
|20.6|Minta bibit|Klik "Minta", isi jumlah + pesan, kirim — harusnya sukses (butuh login)|iya|
|20.7|WA kontak aman|`curl $API/api/seedlings/:id` — response TIDAK boleh ada `phone`|iya|
|20.8|WA kontak via notifikasi|Setelah owner approve request — harusnya dapet notif berisi link WA|-|
|20.9|Lapor bibit lewat form|Buka form "Seedling Stock" — isi species, jumlah, provinsi — submit — seedling harus muncul di `/api/seedlings`|Tidak muncul|
|20.10|Seedling dari form → pending|Lapor bibit via form → seedling status harus "pending"|iya|
|20.11|Seedling aktif setelah approve|Admin approve laporan seedling → seedling status jadi "active"|iya|
|20.12|Stok bertambah (user sama)|User yang sama lapor species sama → stok seedling nambah, bukan card baru|-|
|20.13|Stok berkurang (selesai)|Request → admin approve → owner approve → give → receive — stok harus berkurang|-|
|20.14|Admin panel seedlings|Buka `/admin/seedlings` — daftar seedling, filter status, tombol approve/reject|iya|
|20.15|Admin panel requests|Buka `/admin/seedlings/requests` — daftar permintaan, tombol setujui|iya|

## Test 21 — Springs \& Admin Springs (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|21.1|Spring baru pending|Lapor monitoring → spring baru dibuat dengan status "pending" (bukan langsung active)|iya|
|21.2|Spring tidak muncul di publik|Spring pending harusnya belum muncul di `/api/springs`|iya|
|21.3|Admin setujui spring|`POST /api/admin/springs/:id/approve` — spring jadi active|iya|
|21.4|Admin panel spring|Buka `/admin/map/springs` — daftar spring, filter status pending/active/merged|iya|
|21.5|Search spring API|`curl "$API/api/springs/search?q=Cibeureum"` — harusnya return spring yang namanya mengandung "Cibeureum"|Tidak ada Cibeureum|
|21.6|Search minimal 2 huruf|`curl "$API/api/springs/search?q=C"` — harusnya return `\\\[]` karena minimal 2 karakter|iya|

## Test 22 — Pagination \& API Versioning (4 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|22.1|Reports pagination|`curl "$API/api/reports?page=1\\\&per\\\_page=10"` — response harus ada `pagination.total`, `pagination.totalPages`|iya|
|22.2|Projects pagination|`curl "$API/api/projects?page=1\\\&per\\\_page=5"` — response harus ada `pagination` object|iya|
|22.3|Notifications pagination|Login → `curl -b $COOKIE "$API/api/notifications?page=1\\\&per\\\_page=5"` — response harus ada `pagination`|iya|
|22.4|API v1 redirect|`curl "$API/api/v1/seedlings"` — harusnya sama kayak `curl "$API/api/seedlings"`|iya|

## Test 23 — Backup (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|23.1|Backup tiap jam 3 pagi|Cek `/root/backups/` — harusnya ada file `springhub-YYYYMMDD-030001.sql.gz`|permission denied|
|23.2|Backup ukuran wajar|File backup harusnya antara 20KB - 1MB (gak 0KB)|-|
|23.3|Backup terkirim ke email|Cek inbox admin@springhub.id — harusnya ada email backup dari jam 3 pagi|Tidak ada di springhub|

\---

## Ringkasan Hasil

| Kategori | PASS | FAIL | Catatan |
|---|---|---|---|---|
| Test 1 — Buka Website (6) | 6 | 0 | |
| Test 2 — Login \& Daftar (8) | 8 | 0 | |
| Test 3 — Halaman Admin (18) | 18 | 0 | |
| Test 4 — Form \& Laporan (11) | 11 | 0 | |
| Test 5 — Peta (6) | 6 | 0 | |
| Test 6 — Poin \& Leaderboard (6) | 6 | 0 | |
| Test 7 — Donasi (5) | 5 | 0 | |
| Test 8 — Keamanan (9) | 9 | 0 | |
| Test 9 — Dark Mode (5) | 5 | 0 | |
| Test 10 — Akun \& Profile (4) | 4 | 0 | |
| Test 11 — CRUD Admin (8) | 8 | 0 | |
| Test 12 — API Endpoints (10) | 10 | 0 | |
| Test 13 — Storage \& Backup (4) | 4 | 0 | |
| Test 14 — Offline Mode \& PWA (10) | 10 | 0 | |
| Test 15 — PointRule \& Course (4) | 4 | 0 | |
| Test 16 — Route Map (3) | 3 | 0 | |
| Test 17 — Project \& Like (6) | 6 | 0 | |
| Test 18 — API Routing (8) | 8 | 0 | |
| Test 19 — Aksi Nyata Section (4) | 4 | 0 | |
| Test 20 — Seedlings (15) | 15 | 0 | |
| Test 21 — Springs (6) | 6 | 0 | |
| Test 22 — Pagination \& Versioning (4) | 4 | 0 | |
| Test 23 — Backup (3) | 3 | 0 | |
| **TOTAL** | **/** | **/** | **183 test** |

