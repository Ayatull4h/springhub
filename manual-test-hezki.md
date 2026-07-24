# Manual Test — SpringHub v2.1

**Tanggal**: 24 Juli 2026
**Domain**: https://www.springhub.id
**Total Test**: ~195 test case — 26 kategori

> Cara pakai: Baca langkah-langkahnya, coba satu per satu, tulis **PASS** atau **FAIL** di kolom Hasil.
> Kalo bingung ada petunjuk, baca lagi langkahnya pelan-pelan.

---

## Akun Demo

|Akun|Email|Password|Bisa apa?|
|-|-|-|-|
|**Admin**|`admin@springhub.id`|`demo12345`|Lihat semua data, approve laporan, atur map, kelola user|
|**Ucup**|`ucup@springhub.id`|`ucup12345`|Volunteer dengan **20.168 poin** — bisa buat proyek baru|
|**Sari**|`volunteer@springhub.id`|`vol12345`|Volunteer dengan **8.750 poin** — belum bisa buat proyek|

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

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|1.1|Landing page kebuka|Buka `www.springhub.id` di browser — harusnya muncul halaman utama dengan peta, statistik, dan tombol donasi||
|1.2|Pakai HTTPS aman|Lihat di address bar — harus ada gembok 🔒||
|1.3|Halaman 404 keren|Buka `www.springhub.id/halaman-yang-tidak-ada` — harusnya muncul halaman "Halaman Tidak Ditemukan" yang bagus, bukan putih polos||
|1.4|Icon tab (favicon) muncul|Lihat di tab browser — harusnya logo SpringHub. Buka `www.springhub.id/favicon.png?v=3` — harusnya gambar logo 196x196||
|1.5|Dark mode bisa diganti|Klik tombol bulan/matahari di pojok kanan atas — tampilan harus berubah jadi gelap/terang||

---

## Test 2 — Login & Daftar (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|2.1|Halaman login terbuka|Buka `www.springhub.id/sign-in` — harusnya ada form email + password||
|2.2|Login admin berhasil|Isi email `admin@springhub.id`, password `demo12345`, klik Login — harusnya masuk ke halaman utama||
|2.3|Password salah ditolak|Isi email `admin@springhub.id`, password `salah` — harusnya muncul "Email atau password salah"||
|2.4|Lockout (5x salah)|Coba login 5 kali dengan password salah — setelah percobaan ke-5 harusnya muncul "Akun terkunci karena terlalu banyak percobaan"||
|2.5|Register halaman terbuka|Buka `www.springhub.id/join` — harusnya ada form email + password + username||
|2.6|Password lemah ditolak|Coba daftar dengan password `123` — harusnya ditolak, minimal 8 karakter||
|2.7|Password tanpa huruf besar ditolak|Coba daftar dengan password `abcdefgh1` — harusnya ditolak, harus ada huruf BESAR||
|2.8|Email duplikat ditolak|Coba daftar dengan email `admin@springhub.id` — harusnya muncul "Email sudah terdaftar"||

---

## Test 3 — Halaman Admin (15 test)

### Login ke Admin dulu:

* Buka `www.springhub.id/sign-in`, login dengan `admin@springhub.id` / `demo12345`
* Buka `www.springhub.id/admin`

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|3.1|Dashboard admin|Harusnya muncul angka: total user, laporan, donasi, proyek||
|3.2|Sidebar menu|Di sebelah kiri harus ada menu: Dashboard, Users, Reports, Forms, Map, dll||
|3.3|Daftar user|Klik menu "Users" — harusnya ada tabel dengan email, username, role, poin||
|3.4|Pagination user|Kalo usernya banyak, harusnya ada tombol ← Prev dan Next →||
|3.5|Daftar laporan|Klik "Reports" — harusnya ada daftar laporan dari relawan||
|3.6|Toggle aktif/nonaktif|Klik tombol mata 👁 di laporan — laporan harusnya berubah status||
|3.7|Review queue|Klik "Review Queue" — harusnya ada laporan yang menunggu review||
|3.8|Approve laporan|Klik tombol centang hijau ✅ — laporan harus berubah jadi "approved"||
|3.9|Minimal 3 foto|Coba approve laporan dengan foto < 3 — harusnya ditolak dengan pesan "Minimal 3 foto"||
|3.10|Trust score|Klik "Trust Score" — harusnya ada daftar user dengan skor kepercayaan||
|3.11|Reset trust score|Klik tombol reset 🔄 — skor harus kembali ke 50||
|3.12|Manajemen form|Klik "Forms" — harusnya daftar 5 form yang bisa diedit||
|3.13|Lihat form Survei Mata Air (32 field)|Klik form "Survei Mata Air" — harusnya ada 32 field dari A1_tanggal sampai E3_aksi||
|3.14|Setting map|Klik "Map" — harusnya ada daftar tipe titik peta + warna kategori||
|3.15|Ubah warna marker|Klik color picker di kategori — warna marker di peta harus berubah||

---

## Test 4 — Form Survei Mata Air (32 field) — 12 test

Form lama `spring-monitoring` (8 field) sudah diganti dengan 32 field baru.

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|4.1|Halaman form kebuka|Buka `www.springhub.id/report/spring-monitoring` — harusnya muncul form berjudul "Survei Mata Air"||
|4.2|Auto-fill GPS|Klik "Izinkan" saat browser minta izin lokasi — field `A4_geotag` harus terisi otomatis||
|4.3|Auto-fill nomor WA|Login dulu, buka form — field `A3_wa` harus terisi nomor WA dari profil||
|4.4|32 field muncul|Scroll form — harusnya ada 32 field dari A1 (Tanggal Survei) sampai E3 (Aksi)||
|4.5|Field Select muncul|Coba field `B5_jenis` (Jenis/Tipe Mata Air) — harusnya ada 5 opsi: Memancar, Genangan, Lereng/Tebing, Celah Batu, Tidak Yakin||
|4.6|Field Multiselect muncul|Coba field `C4_pemanfaatan` (Pemanfaatan Air) — harusnya bisa centang lebih dari 1 opsi||
|4.7|Field Angka untuk pH/Suhu/TDS|Coba field `D1_ph` sampai `D6_debit_visual` — harusnya input angka untuk D1-D5, select untuk D6||
|4.8|Upload 3 foto|Field foto: `B2_foto_1`, `B3_foto_2`, `B4_foto_3` — masing-masing 1 foto||
|4.9|Kirim laporan|Isi minimal required field (*), upload 3 foto, klik Kirim — harusnya "Laporan berhasil dikirim"||
|4.10|Validasi required|Coba klik Kirim tanpa isi field wajib — harusnya muncul pesan error||
|4.11|Cek duplikat (radius 20m)|Field `A5_cek_duplikat` — pilih "Kunjungan Ulang" jika titik dalam radius 20m, "Baru" jika belum||
|4.12|Old endpoint redirect|Buka `www.springhub.id/report/spring-monitoring` — tidak error 404 (slug tetap)||
|4.13|Reverse geocode|Setelah submit, provinsi/kabupaten harus terisi otomatis dari koordinat||

---

## Test 5 — Form Tanam Pohon (16 field) — 6 test

Form `tree-planting` sudah diupdate: SATU FORM = SATU POHON.

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|5.1|Halaman form kebuka|Buka `www.springhub.id/report/tree-planting` — harusnya form dengan 16 field||
|5.2|Deskripsi "SATU FORM = SATU POHON"|Lihat deskripsi di atas form — harusnya jelas bahwa 1 form = 1 pohon||
|5.3|Field T_tinggi|Ada select: <30 cm, 30-100 cm, 100-200 cm, >200 cm||
|5.4|Field T_lokasi_tanam|Ada select: Sekitar Mata Air, Lahan Kritis, Pekarangan, Fasilitas Umum, Lahan Pertanian, Bantaran Sungai, Lainnya||
|5.5|Field T_sumber|Ada select: Pembibitan Sendiri, Bantuan Dinas, Tidak Tahu, Membeli, Donasi/CSR/Komunitas||
|5.6|Kirim + validasi|Isi required, upload foto, kirim — harus sukses||

---

## Test 6 — Turbo Mode (Tanam Pohon & Rorak) — 4 test

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|6.1|Tombol "Lanjut catat berikutnya"|Submit tree-planting atau rorak — setelah sukses, harus ada tombol ➡️ Lanjut catat berikutnya||
|6.2|Field tersalin|Klik "Lanjut" — field non-foto dari entri sebelumnya harus terisi (nama, kegiatan, sumber bibit, dll)||
|6.3|GPS refresh otomatis|Klik "Lanjut" — GPS harus ambil posisi baru (muncul notif izin lokasi)||
|6.4|Foto di-reset|Klik "Lanjut" — field foto harus kosong (siap upload foto baru)||

---

## Test 7 — Peta & Health Score (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|7.1|Peta muncul|Scroll ke section peta — harusnya peta Indonesia dengan marker-marker||
|7.2|Marker warna berdasarkan kesehatan|Marker spring-survey harus punya warna: hijau (sehat), kuning (ringan), oranye (berat), merah (kritis)||
|7.3|Tooltip health status|Hover marker — tooltip harus tampil label status kesehatan (Sehat / Tercemar Ringan / Tercemar Berat / Kritis)||
|7.4|Dropdown filter|Klik dropdown "Semua Titik" — harusnya ada pilihan: Mata Air, Tanam Pohon, dll||
|7.5|Filter berdasarkan tipe|Pilih "Mata Air" — peta harusnya cuma nunjukkin marker mata air||
|7.6|Scroll zoom|Coba scroll di peta — peta harusnya bisa zoom in/out||

---

## Test 8 — Poin & Leaderboard (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|8.1|Poin bertambah setelah approve|Approve laporan ucup — poin ucup harus naik (cek di /admin/users)||
|8.2|Poin dari DB form (bukan hardcode)|Admin edit poin form → submit → approve → poin harus sesuai yang diedit||
|8.3|Leaderboard muncul|Buka halaman depan — harusnya ada papan peringkat volunteer teratas||
|8.4|Streak harian|Lapor 3 hari berturut-turut — harusnya dapet bonus +5 poin (hari ke-3)||
|8.5|Milestone 10 laporan|Kalo udah 10 laporan disetujui — harusnya dapet bonus +50 poin||
|8.6|Threshold 20.000 poin|Ucup (20.168 pts) bisa klik "Buat Proyek" — Sari (8.750 pts) tombolnya harus terkunci||

---

## Test 9 — Donasi (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|9.1|Form donasi muncul|Scroll ke bagian donasi di halaman depan — harusnya ada pilih nominal||
|9.2|Pilih nominal|Klik salah satu nominal (Rp 20K, Rp 50K, dll) — field terisi otomatis||
|9.3|Custom nominal|Klik "Custom" — bisa isi jumlah sendiri (min Rp 1.000, max Rp 100.000.000)||
|9.4|Amount vs tier dicek|Pilih tier "Rp 20K" tapi ubah jumlah jadi Rp 1.000.000 — harusnya ditolak||
|9.5|Halaman sukses|Kalo bayar berhasil — harusnya diarahkan ke halaman "Pembayaran Berhasil"||

---

## Test 10 — Keamanan (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|10.1|Halaman admin ditolak untuk user biasa|Login sebagai ucup, coba buka `/admin` — harusnya redirect ke halaman utama||
|10.2|API admin ditolak|Pake terminal: `curl $API/api/admin/users` tanpa cookie — harusnya 403/401||
|10.3|CSRF admin wajib|Coba `curl -X POST $API/api/admin/forms` tanpa CSRF — harusnya 403||
|10.4|Rate limit terasa|Coba login 10x dalam 1 menit — harusnya ditolak "Terlalu banyak percobaan"||
|10.5|Data sensitif aman|`curl $API/api/reports` — harusnya TIDAK ada email, nomor HP, atau lokasi presisi||
|10.6|SQL injection gagal|Coba isi form dengan `' OR 1=1 --` — harusnya ditolak validasi||
|10.7|XSS gagal|Coba isi form dengan `<script>alert(1)</script>` — harusnya tersimpan aman (tidak jalan)||
|10.8|Admin bisa export data|Buka `/admin` → klik Export → pilih Users — harusnya download file CSV||

---

## Test 11 — Dark Mode (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|11.1|Landing page dark mode|Aktifkan dark mode — semua section harus berubah warna (header, peta, footer)||
|11.2|Admin panel dark mode|Buka `/admin` di dark mode — sidebar, tabel, tombol harus ikut gelap||
|11.3|Admin map dark mode|Buka `/admin/map` di dark mode — background harus gelap, teks terbaca||
|11.4|Form halaman dark mode|Buka `/report/spring-monitoring` di dark mode — form harus terbaca||
|11.5|Logo ikut berubah|Logo SpringHub harus putih di dark mode, hitam di light mode||

---

## Test 12 — Akun & Profile (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|12.1|Profile page|Login sebagai ucup, buka `www.springhub.id/profile` — harusnya ada info akun||
|12.2|Nomor WA di profile|Di profile page — harusnya tampil nomor WA (jika sudah diisi)||
|12.3|Edit nomor WA|Klik edit profile — ubah nomor WA — simpan — nomor harus berubah||
|12.4|Riwayat poin|Di profile page — harusnya ada daftar poin yang pernah didapat||
|12.5|Logout|Klik tombol logout — harusnya kembali ke halaman utama, menu login muncul lagi||

---

## Test 13 — CRUD Admin (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|13.1|Tambah course|Buka `/admin/courses` → klik Tambah → isi data → simpan — harusnya muncul||
|13.2|Edit form field|Buka `/admin/forms` → klik salah satu form → edit field → simpan — field berubah||
|13.3|Hapus form (soft delete)|Klik hapus pada form yang punya laporan — form jadi nonaktif, data aman||
|13.4|Ganti slug form ditolak|Coba ganti slug form yang punya laporan — harusnya ditolak dengan pesan jelas||
|13.5|Tambah content block|Buka `/admin/content` → tambah konten baru → simpan — muncul di landing page||
|13.6|Lihat feedback|Buka `/admin/feedback` — harusnya ada kritik/saran dari pengguna||
|13.7|Lihat error log|Buka `/admin/errors` — harusnya ada daftar error teknis (kalo ada)||
|13.8|Export CSV|Klik Export → pilih jenis data → download — file CSV harus terdownload||

---

## Test 14 — API Endpoints (10 test)

Gunakan terminal. Login dulu sebagai admin.

|#|Yang Dicek|Perintah|Hasil|
|-|-|-|-|
|14.1|Health check|`curl $API/api/health` → harusnya `{"status":"ok"}`||
|14.2|Daftar form|`curl $API/api/forms` → harusnya array forms dengan field dan mapType||
|14.3|Tipe titik peta|`curl $API/api/map-points/types` → harusnya 4 tipe (spring, tree-planting, trench, seedling)||
|14.4|Leaderboard|`curl $API/api/leaderboard` → harusnya top 20 volunteer||
|14.5|Daftar user (admin only)|`curl -b $COOKIE $API/api/admin/users` → harusnya daftar user||
|14.6|User tanpa cookie ditolak|`curl $API/api/admin/users` → harusnya `{"error":"Unauthorized"}`||
|14.7|Export users CSV|`curl -b $COOKIE "$API/api/admin/export?entity=users"` → download CSV||
|14.8|Export reports + foto|`curl -b $COOKIE "$API/api/admin/export?entity=reports"` → CSV dengan kolom PhotoURLs||
|14.9|Notifikasi|Login sebagai ucup → `curl -b $COOKIE $API/api/notifications` → daftar notif||
|14.10|Dashboard stats|`curl $API/api/dashboard` → statistik: total reports, approved, dll||

---

## Test 15 — Offline Mode & PWA (10 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|15.1|Halaman offline terbuka|Buka `www.springhub.id/offline` — harusnya ada tombol "Mulai Survey Offline"||
|15.2|Setup offline — pilih form|Klik "Mulai Survey Offline" → pilih form (Survei Mata Air, Tanam Pohon, dll) → Next||
|15.3|Cache form definition|Setelah setup, form yang dipilih harus muncul di daftar form offline||
|15.4|Isi form offline (32 field)|Pilih Survei Mata Air — isi field-field (termasuk GPS auto-fill)||
|15.5|Upload foto offline|Klik tombol foto, ambil minimal 3 foto — counter harus bertambah||
|15.6|Submit offline|Klik "Simpan" — data harus tersimpan dan muncul notifikasi sukses||
|15.7|Sinkronisasi offline→online|Kembali ke koneksi internet, buka `/offline` → klik "Sinkronkan" — data harus terkirim||
|15.8|PWA icon baru|Di HP Android/iOS, buka menu "Add to Home Screen" — icon harus logo baru||
|15.9|Offline langsung ke mode survey|Buka PWA saat offline — harus langsung ke halaman `/offline`, bukan landing page||
|15.10|Offline — auto-fill WA|Login dulu, lalu offline — buka form survei — field WA harus terisi dari session cache||

---

## Test 16 — PointRule & Course (4 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|16.1|Course selesai dapet poin|Buka Learning Hub → selesaikan 1 course → cek poin harus bertambah 25||
|16.2|Admin edit poin course|Buka `/admin/points` → edit "Course Selesai" → selesaikan course → poin sesuai yang diedit||
|16.3|Admin edit poin form|Buka `/admin/points` → edit "Spring Monitoring" → submit form → approve → poin sesuai yang diedit||
|16.4|Poin dari DB form|Edit `pointsOnSubmit` di `/admin/forms` → submit → approve → poin sesuai (PointRule override)||

---

## Test 17 — Project & Like (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|17.1|FeaturedProjects di landing|Buka `/` — scroll ke section "Proyek Unggulan" — harus ada 2 card proyek + pagination dots||
|17.2|FeaturedProjects paging|Klik next/prev pagination — harus ganti 2 card lain||
|17.3|Halaman /projects|Buka `/projects` — harus daftar proyek dari API (bukan dummy) + pagination 9/page||
|17.4|Detail proyek|Klik salah satu proyek → `/projects/[id]` — harus muncul detail + progress + like button + komentar||
|17.5|Like toggle|Klik tombol like (❤️) — harus toggle filled/outline + counter berubah||
|17.6|Komentar|Scroll ke bagian komentar — isi teks + submit — harus muncul di list||

---

## Test 18 — Seedlings / Pasar Bibit (14 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|18.1|Marketplace muncul|Buka `www.springhub.id/seedlings` — harusnya grid 9 card bibit per halaman + pagination||
|18.2|Filter provinsi|Pilih provinsi dari dropdown — card harus filter sesuai provinsi||
|18.3|Cari bibit|Ketik "Jati" di kolom search — harusnya cuma muncul card Jati||
|18.4|Pagination 9/page|Kalo bibit > 9, harusnya ada tombol ← Prev dan Next →||
|18.5|Detail bibit|Klik card bibit — harusnya halaman detail dengan nama, jumlah, stok, pemilik, WA link||
|18.6|Minta bibit|Klik "Minta", isi jumlah + pesan, kirim — harusnya sukses (butuh login)||
|18.7|WA kontak aman|`curl $API/api/seedlings/:id` — response TIDAK boleh ada `phone`||
|18.8|WA kontak via notifikasi|Setelah owner approve request — harusnya dapet notif berisi link WA||
|18.9|Lapor bibit lewat form|Buka form "Seedling Stock" — isi species, jumlah, provinsi — submit — seedling harus muncul di `/api/seedlings`||
|18.10|Seedling dari form → pending|Lapor bibit via form → seedling status harus "pending"||
|18.11|Seedling aktif setelah approve|Admin approve laporan seedling → seedling status jadi "active"||
|18.12|Stok bertambah (user sama)|User yang sama lapor species sama → stok seedling nambah, bukan card baru||
|18.13|Stok berkurang (selesai)|Request → admin approve → owner approve → give → receive — stok harus berkurang||
|18.14|Admin panel seedlings|Buka `/admin/seedlings` — daftar seedling, filter status, tombol approve/reject||

---

## Test 19 — Springs & Health Score (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|19.1|Spring baru pending|Lapor Survei Mata Air → spring baru dibuat dengan status "pending"||
|19.2|Spring tidak muncul di publik|Spring pending harusnya belum muncul di `/api/springs`||
|19.3|Admin setujui spring|`POST /api/admin/springs/:id/approve` — spring jadi active||
|19.4|Health score otomatis|Approve laporan Survei Mata Air → spring harus dapat `healthScore` dan `healthStatus`||
|19.5|Cek health score via API|`curl $API/api/springs/[id]` — response harus ada `healthScore` dan `healthStatus`||
|19.6|Search spring API|`curl "$API/api/springs/search?q=Bening"` — harusnya return spring yang cocok||

---

## Test 20 — Health Scoring Engine (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|20.1|Sehat|Approve laporan dengan Bening, Stabil, Tidak Ada ancaman — status harus "sehat" (≥80)||
|20.2|Tercemar Ringan|Approve laporan dengan Agak Keruh, Berkurang, ancaman sedikit — status "ringan" (60-79)||
|20.3|Tercemar Berat|Approve laporan dengan Keruh, Naik Turun, banyak ancaman — status "berat" (30-59)||
|20.4|Kritis|Approve laporan dengan Kering Total — status "kritis" (<30)||
|20.5|Tidak ada field terisi|Approve laporan dengan fieldData kosong — harusnya dapat status paling rendah||

---

## Test 21 — Pagination & API (4 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|21.1|Reports pagination|`curl "$API/api/reports?page=1&per_page=10"` — response harus ada `pagination.total`, `pagination.totalPages`||
|21.2|Projects pagination|`curl "$API/api/projects?page=1&per_page=5"` — response harus ada `pagination` object||
|21.3|Notifications pagination|Login → `curl -b $COOKIE "$API/api/notifications?page=1&per_page=5"` — response harus ada `pagination`||
|21.4|API v1 redirect|`curl "$API/api/v1/seedlings"` — harusnya sama kayak `curl "$API/api/seedlings"`||

---

## Test 22 — Backup (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|22.1|Backup tiap jam 3 pagi|Cek `/root/backups/` — harusnya ada file `springhub-YYYYMMDD-030001.sql.gz`||
|22.2|Backup ukuran wajar|File backup harusnya antara 20KB - 1MB (gak 0KB)||
|22.3|Backup terkirim ke email|Cek inbox admin@springhub.id — harusnya ada email backup dari jam 3 pagi||

---

## Test 23 — Route Map (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|23.1|Route map terbuka|Buka `www.springhub.id/api-routes.html` — harusnya graph dengan route node + model + koneksi||
|23.2|Filter by type|Klik filter "Admin" — graph harus filter cuma node admin + model terkait||
|23.3|Klik node|Klik salah satu node — detail panel harus muncul (method, auth, models)||

---

## Test 24 — Import Data Epicellect (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|24.1|103 data spring-survey terimport|`curl $API/api/reports?formSlug=spring-monitoring` — harusnya ada >100 entries||
|24.2|Data dari berbagai daerah|Cek beberapa report — harusnya dari Klaten, Madura, Kebumen, Banyumas, Jombang, dll||
|24.3|Field terisi|Buka salah satu report — field A1-E3 harus terisi (kecuali D1-D6 yang kosong)||

---

## Test 25 — Auto-fill & Defaults (4 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|25.1|Tanggal otomatis|Buka form — field A1_tanggal harus terisi tanggal hari ini||
|25.2|Nama dari session|Buka form setelah login — A2_nama_surveyor harus terisi username||
|25.3|Default C1_warna = Bening|Buka form — C1_warna harus default ke "Bening"||
|25.4|Default C8 = Observasi Sendiri|Buka form — C8_sumber_info harus default ke "Observasi Sendiri"||

---

## Test 26 — CRUCIAL: CSRF & Login Flow (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|26.1|CSRF token di-fetch SEBELUM login|Buka halaman login → inspect network → harus ada request ke `/api/csrf`||
|26.2|CSRF tetap valid setelah login|Fetch CSRF token → login → pakai token yang sama untuk submit form → harusnya berhasil||
|26.3|Admin role change|Admin ganti role user → field_lead harus muncul di dropdown||

---

## Ringkasan Hasil

| Kategori | PASS | FAIL | Catatan |
|---|---|---|---|
| Test 1 — Buka Website (5) | | | |
| Test 2 — Login & Daftar (8) | | | |
| Test 3 — Halaman Admin (15) | | | |
| Test 4 — Form Survei 32 field (13) | | | |
| Test 5 — Form Tanam Pohon (6) | | | |
| Test 6 — Turbo Mode (4) | | | |
| Test 7 — Peta & Health Score (6) | | | |
| Test 8 — Poin & Leaderboard (6) | | | |
| Test 9 — Donasi (5) | | | |
| Test 10 — Keamanan (8) | | | |
| Test 11 — Dark Mode (5) | | | |
| Test 12 — Akun & Profile (5) | | | |
| Test 13 — CRUD Admin (8) | | | |
| Test 14 — API Endpoints (10) | | | |
| Test 15 — Offline Mode & PWA (10) | | | |
| Test 16 — PointRule & Course (4) | | | |
| Test 17 — Project & Like (6) | | | |
| Test 18 — Seedlings (14) | | | |
| Test 19 — Springs & Health Score (6) | | | |
| Test 20 — Health Scoring Engine (5) | | | |
| Test 21 — Pagination & API (4) | | | |
| Test 22 — Backup (3) | | | |
| Test 23 — Route Map (3) | | | |
| Test 24 — Import Epic (3) | | | |
| Test 25 — Auto-fill & Defaults (4) | | | |
| Test 26 — CSRF Crucial (3) | | | |
| **TOTAL** | **/** | **/** | **~195 test** |
