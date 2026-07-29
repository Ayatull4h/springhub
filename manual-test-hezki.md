# Manual Test — SpringHub v2.1

**Tanggal**: 29 Juli 2026 (Update final: project detail 20 field, featured photo admin, offline i18n, pasar bibit real data, project API fix, SW v5)
**Domain**: https://www.springhub.id
**Total Test**: ~200 test case — 27 kategori

> Cara pakai: Baca langkah-langkahnya, coba satu per satu, tulis **PASS** atau **FAIL** di kolom Hasil.
> Kalo bingung ada petunjuk, baca lagi langkahnya pelan-pelan.

---

## Akun Demo

|Akun|Email|Password|Bisa apa?|
|-|-|-|-|
|**Admin**|`admin@springhub.id`|`demo12345`|Lihat semua data, approve laporan, atur map, kelola user|
|**Ucup**|`ucup@springhub.id`|`ucup12345`|Volunteer dengan 100 poin|
|**Dirgapala**|`dirgapala@sttkd.ac.id`|?|Volunteer dengan **10.500 poin** — bisa buat proyek baru|
|**Riris**|`ririsaldicky@gmail.com`|?|Volunteer dengan 300 poin|

---

## Persiapan (Cukup Sekali)

```bash
COOKIE="/tmp/springhub.txt"
API="https://www.springhub.id"
curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@springhub.id","password":"demo12345"}'
CSRF=$(curl -sk -c $COOKIE -b $COOKIE $API/api/csrf | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))")
echo $CSRF
```

---

## Test 1 — Buka Website (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|1.1|Landing page kebuka|Buka `www.springhub.id` — halaman utama dengan peta, statistik, donasi||
|1.2|HTTPS aman|Gembok 🔒 di address bar||
|1.3|Halaman 404|Buka `/halaman-tidak-ada` — tampilan 404 bagus||
|1.4|Favicon|Logo SpringHub di tab browser||
|1.5|Dark mode|Klik tombol bulan/matahari — tampilan berubah||
|1.6|Map muncul|Scroll ke peta — marker spring (warna) + aktivitas (abu) muncul||
|1.7|Filter dropdown|Ada pilihan: Semua, Survei Mata Air (dengan sub Sehat/Ringan/Berat/Kritis), Tanam Pohon, dll||

---

## Test 2 — Login & Daftar (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|2.1|Halaman login|`/sign-in` — form email + password||
|2.2|Login admin|`admin@springhub.id` / `demo12345` — masuk||
|2.3|Password salah|Tampil "Email atau password salah"||
|2.4|Lockout 5x|5x salah — "Akun terkunci"||
|2.5|Register|`/join` — form daftar||
|2.6|Password lemah|`123` ditolak (min 8)||
|2.7|Tanpa huruf besar|`abcdefgh1` ditolak||
|2.8|Email duplikat|Email sudah terdaftar ditolak||

---

## Test 3 — Halaman Admin (15 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|3.1|Dashboard|Angka total user, laporan, donasi, proyek||
|3.2|Sidebar menu|Dashboard, Users, Reports, Forms, Map, dll||
|3.3|Daftar user|Tabel email, username, role, poin||
|3.4|Daftar laporan|Semua laporan + foto thumbnail||
|3.5|Pagination|Dropdown 25/50/100/200 + page numbers||
|3.6|Approve all|Klik ✅ Approve All — semua pending ter-approve||
|3.7|Review queue|Filter pending — daftar laporan menunggu||
|3.8|Approve|Klik centang hijau — approved||
|3.9|Minimal foto|Coba approve foto < 1 per field — ditolak||
|3.10|Manajemen form|Daftar 5 form — klik lihat field||
|3.11|Edit form|Edit field → simpan — berubah||
|3.12|Soft delete form|Hapus → form nonaktif, data aman||
|3.13|Lihat form Survei|32 field dari A1_tanggal s/d E3_aksi||
|3.14|Export spring|Buka `/api/admin/export?entity=spring` — CSV semua spring + health score||
|3.15|Ubah warna marker|Color picker — warna marker berubah||

---

## Test 4 — Form Survei Mata Air (32 field) — 13 test

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|4.1|Halaman form|`/report/spring-monitoring` — 32 field muncul||
|4.2|Auto GPS|Klik izinkan → A4_geotag terisi||
|4.3|Auto WA|A3_wa terisi dari profil||
|4.4|32 field|A1 sampai E3 — text, select, location, number||
|4.5|Select B5_jenis|5 opsi: Memancar, Genangan, Lereng, Celah Batu, Tidak Yakin||
|4.6|Multiselect C4|Bisa centang >1 opsi pemanfaatan||
|4.7|Field teks D1-D5|pH, suhu, TDS, EC, debit — input teks (bisa desimal)||
|4.8|3 foto|B2_foto_1, B3_foto_2, B4_foto_3 — min **1 foto per field** (total 3)||
|4.9|Kirim|Isi required + 3 foto → sukses||
|4.10|Validasi required|Kosong → error||
|4.11|Cek duplikat 20m|A5_cek_duplikat — Baru / Kunjungan Ulang||
|4.12|Slug tetap|`/report/spring-monitoring` — tidak 404||
|4.13|Reverse geocode|Setelah submit, provinsi otomatis||

---

## Test 5 — Form Tanam Pohon (16 field) — 6 test

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|5.1|Form terbuka|`/report/tree-planting` — 16 field||
|5.2|Deskripsi|"SATU FORM = SATU POHON"||
|5.3|T_tinggi|Select <30, 30-100, 100-200, >200 cm||
|5.4|T_lokasi_tanam|Select 7 opsi (Mata Air, Lahan Kritis, Pekarangan, Fasum, Pertanian, Bantaran, Lainnya)||
|5.5|T_sumber|Select 5 opsi (Sendiri, Dinas, Tidak Tahu, Beli, Donasi)||
|5.6|Kirim + validasi|Required + foto → sukses||

---

## Test 6 — Turbo Mode (Tanam Pohon & Rorak) — 4 test

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|6.1|Tombol lanjut|Submit tree-planting → muncul "➡️ Lanjut catat berikutnya"||
|6.2|Field tersalin|Nama, sumber, lokasi tanam dari entri sebelumnya||
|6.3|GPS refresh|Posisi GPS baru setelah lanjut||
|6.4|Foto direset|Field foto kosong — wajib upload 3 baru||

---

## Test 7 — Peta & Marker (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|7.1|Spring marker (73)|Lingkaran warna hijau/kuning/oranye/merah — 8px||
|7.2|Activity marker (7)|Lingkaran abu 8px untuk tree-planting, rorak, dll — **tanpa** lingkaran 5km||
|7.3|Filter "Survei Mata Air"|Cuma spring marker — activity hilang||
|7.4|Filter "Tanam Pohon"|Cuma tree-planting — spring hilang||
|7.5|Sub filter Sehat|Spring sehat aja||
|7.6|Sub filter Kritis|Spring kritis aja||
|7.7|Klik marker spring|Popup: nama, status, skor, link ke `/springs/[id]`||
|7.8|Klik marker tree-planting|Popup: jumlah + user (tanpa link detail jika gak punya springId)||

---

## Test 8 — Poin (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|8.1|Poin approve|Approve → poin user naik||
|8.2|Poin DB form|Edit poin form → submit → approve → sesuai||
|8.3|Leaderboard|Papan peringkat di landing page||
|8.4|Streak 3 hari|Berturut-turut 3 hari → bonus||
|8.5|Threshold 20K|User ≥20.000 pts bisa buat proyek||
|8.6|Milestone|10/50/100/500 laporan → bonus||

---

## Test 9 — Donasi (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|9.1|Form donasi|Section donasi di landing — pilih nominal||
|9.2|Pilih nominal|Rp 20K, 50K, dll — field terisi||
|9.3|Custom nominal|Min Rp 1.000, max Rp 100.000.000||
|9.4|Validasi tier|Pilih 20K tapi isi 1jt → ditolak||
|9.5|Invoice|**TERTUNDA** — butuh XENDIT_SECRET_KEY||

---

## Test 10 — Keamanan (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|10.1|Admin page|User biasa buka `/admin` → redirect||
|10.2|API admin|`curl $API/api/admin/users` tanpa cookie → 401||
|10.3|CSRF wajib|POST tanpa CSRF → 403||
|10.4|Rate limit|10x login 1 menit → ditolak||
|10.5|Data sensitif|Email, HP, lokasi presisi tidak bocor||
|10.6|SQL injection|`' OR 1=1 --` → ditolak||
|10.7|XSS|`<script>alert(1)</script>` → aman||
|10.8|Export CSV|Admin → Export → download CSV||

---

## Test 11 — Dark Mode (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|11.1|Landing page|Semua section berubah||
|11.2|Admin panel|Sidebar, tabel, tombol gelap||
|11.3|Halaman spring detail|Background gelap, teks terbaca||
|11.4|Form|Form 32 field terbaca||
|11.5|Logo|Putih di dark, hitam di light||

---

## Test 12 — Akun & Profile (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|12.1|Profile page|`/profile` — info akun||
|12.2|Nomor WA|Tampil + bisa diedit||
|12.3|Edit WA|Edit → simpan → berubah||
|12.4|Auto-fill WA|Buka form → A3_wa terisi dari profil||
|12.5|Riwayat poin|Daftar poin pernah didapat||
|12.6|Logout|Kembali ke halaman utama||

---

## Test 13 — CRUD Admin (8 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|13.1|Tambah course|`/admin/courses` → tambah → simpan||
|13.2|Edit form field|`/admin/forms` → edit → simpan||
|13.3|Hapus form|Soft delete — jadi nonaktif||
|13.4|Ganti slug|Ditolak (punya laporan)||
|13.5|Tambah content|`/admin/content` → simpan → muncul di landing||
|13.6|Lihat feedback|Kritik/saran dari pengguna||
|13.7|Error log|Daftar error teknis||
|13.8|Export CSV|Download CSV||

---

## Test 14 — API Endpoints (10 test)

|#|Yang Dicek|Perintah|Hasil|
|-|-|-|-|
|14.1|Health|`curl $API/api/health` → `{"status":"ok"}`||
|14.2|Forms|`curl $API/api/forms` → array 5 form||
|14.3|Map types|`curl $API/api/map-points/types` → 4 tipe||
|14.4|Leaderboard|`curl $API/api/leaderboard` → top 20||
|14.5|Admin users|`curl -b $COOKIE $API/api/admin/users` → daftar||
|14.6|Admin tanpa cookie|`curl $API/api/admin/users` → 401||
|14.7|Export users|`curl -b $COOKIE "$API/api/admin/export?entity=users"` → CSV||
|14.8|Notifikasi|Login → `curl -b $COOKIE $API/api/notifications` → daftar||
|14.9|Dashboard|`curl $API/api/dashboard` → statistik||
|14.10|Springs|`curl $API/api/springs` → 87 spring, 73 health score||

---

## Test 15 — Offline Mode & PWA (10 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|15.1|Halaman offline|`/offline` — tombol "Mulai Survey Offline"||
|15.2|Pilih form|Pilih Survei Mata Air 32 field||
|15.3|Cache form|Form muncul di daftar offline||
|15.4|Isi offline (32 field)|Termasuk GPS auto-fill||
|15.5|Upload foto offline|3 foto (1 per field)||
|15.6|Submit offline|Simpan → sukses||
|15.7|Sinkronisasi|Online → `/offline` → Sinkronkan → terkirim||
|15.8|PWA icon|Add to Home Screen — logo baru||
|15.9|Offline langsung|Buka PWA offline → `/offline`||
|15.10|Auto-fill WA|Login → offline → WA terisi dari cache||

---

## Test 16 — Pengajuan Proyek (10 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|16.1|Akses|Login dengan Field Lead (≥20K pts) → `/projects/new`||
|16.2|Threshold|User < 20K pts — lihat pesan "Hanya Field Lead"||
|16.3|Form 20 field|Nama, WA, Email, Organisasi, Peran, Pengalaman, Judul, Jenis (multiselect), Geotag, Tempat, Latar Belakang, Waktu, Target, Relawan, Mitra, Biaya (5 range), Rincian, Dukungan (multiselect), Dana Ada, Catatan||
|16.4|3 foto wajib|Upload 3 foto lokasi||
|16.5|Komitmen|3 checkbox: lapor, review, publik — wajib centang||
|16.6|Kirim|Submit → sukses||
|16.7|Proposal PDF|Upload opsional||
|16.8|Admin review|`/admin/projects` — lihat proposal||
|16.9|Featured Projects|Landing page — card proyek unggulan muncul||
|16.10|Donasi|Tombol donasi di halaman detail proyek||

---

## Test 17 — Spring Detail (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|17.1|Halaman spring|`/springs/[id]` — detail spring||
|17.2|Tab Survei|Laporan survei mata air muncul||
|17.3|Tab Tanam Pohon|Laporan tree-planting dalam 250m muncul ✅||
|17.4|Tab Rorak|Laporan rorak dalam 250m muncul||
|17.5|Tab Stok Bibit|Laporan seedling dalam 250m muncul||
|17.6|Foto pagination|12 foto/klik — "Muat lebih banyak (12/68 foto)"||

---

## Test 18 — Pasar Bibit (6 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|18.1|Marketplace|`/seedlings` — grid card, filter provinsi, search||
|18.2|Pagination|9 card/halaman + prev/next||
|18.3|Minta bibit|Klik "Minta" → isi jumlah → kirim (login)||
|18.4|WA aman|API tidak bocorkan nomor HP||
|18.5|Admin approve|Laporan seedling → approve → card aktif||
|18.6|Selesai 2 langkah|Penyedia klik "Selesai" + penerima klik "Selesai" → stok berkurang||

---

## Test 19 — Kolaborasi Kemitraan (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|19.1|Form publik|Buka `/report/kolaborasi-kemitraan` — tanpa login||
|19.2|Field 10|Jenis organisasi, nama, kontak, bentuk kolaborasi, cerita||
|19.3|Kirim|Submit tanpa login → sukses||

---

## Test 20 — Health Score (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|20.1|Sehat (≥80)|Approve laporan dengan Bening, Stabil, Tidak Ada ancaman||
|20.2|Ringan (60-79)|Agak Keruh, Berkurang, ancaman sedikit||
|20.3|Berat (30-59)|Keruh, Naik Turun, banyak ancaman||
|20.4|Kritis (<30)|Kering Total||
|20.5|Bobot distribusi|Field kosong → bobot ke parameter lain||

---

## Test 21 — Auto-link by Location (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|21.1|Tree-planting dekat spring|Submit tanam pohon dalam 250m dari spring → otomatis `springId` terisi||
|21.2|Tree-planting jauh|Submit tanam pohon >2.5km dari spring → `springId` null||
|21.3|Spring detail|Laporan non-spring dalam 250m muncul di tab||

---

## Test 22 — Snap Grid (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|22.1|Spring survey|5km snap ✅ (privasi)||
|22.2|Restorasi|5km snap ✅||
|22.3|Tanam pohon, rorak, bibit, proyek|**Tidak** di-snap — koordinat asli ✅||

---

## Test 23 — Map Grouping (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|23.1|Spring markers|Group per 5km grid||
|23.2|Activity markers|Group per **250m grid**||
|23.3|Semua marker|Ukuran **8px seragam** — tidak ada scaling||

---

## Test 24 — Route Map (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|24.1|Route map terbuka|`/api-routes.html` — graph route + model||
|24.2|Filter by type|Filter "Admin" — node merah + model||
|24.3|Klik node|Detail panel: method, auth, models||

---

## Test 25 — Backup (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|25.1|Backup jam 3 pagi|Cek `/root/backups/` — file .sql.gz||
|25.2|Ukuran wajar|20KB - 1MB||
|25.3|Email backup|Cek inbox admin — ada email backup||

---

## Test 26 — Auto-fill & Defaults (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|26.1|Tanggal otomatis|A1_tanggal terisi hari ini||
|26.2|Nama dari session|A2_nama_surveyor terisi username||
|26.3|WA dari profil|A3_wa terisi nomor WA||
|26.4|Default C1_warna|Default "Bening"||
|26.5|Default C8|Default "Observasi Sendiri"||

---

## Test 27 — Bilingual EN/ID (5 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|27.1|Label field berubah|Ganti bahasa ke English → buka form survei → label jadi "Spring Type", "Water Color", dll||
|27.2|Opsi select berubah|Buka form → opsi dropdown berubah Inggris (Clear, Murky, dll)||
|27.3|Kembali ke Indonesia|Ganti ke ID → label kembali ke Bahasa Indonesia||
|27.4|Admin edit field|Buka `/admin/forms` → edit field → ada input label Indonesia + Inggris||

## Test 28 — CRUCIAL CSRF (3 test)

|#|Yang Dicek|Cara Cek|Hasil|
|-|-|-|-|
|27.1|CSRF fetch SEBELUM login|Buka halaman login → network → `/api/csrf`||
|27.2|CSRF valid setelah login|Fetch token → login → pakai token sama → submit berhasil||
|27.3|Admin role change|Admin ganti role user → field_lead muncul di dropdown||

---

## Ringkasan Hasil

| Kategori | PASS | FAIL | Catatan |
|---|---|---|---|
| Test 1 — Buka Website (7) | | | |
| Test 2 — Login & Daftar (8) | | | |
| Test 3 — Halaman Admin (15) | | | |
| Test 4 — Form Survei 32 field (13) | | | |
| Test 5 — Form Tanam Pohon (6) | | | |
| Test 6 — Turbo Mode (4) | | | |
| Test 7 — Peta & Marker (8) | | | |
| Test 8 — Poin (6) | | | |
| Test 9 — Donasi (5) | | | |
| Test 10 — Keamanan (8) | | | |
| Test 11 — Dark Mode (5) | | | |
| Test 12 — Akun & Profile (6) | | | |
| Test 13 — CRUD Admin (8) | | | |
| Test 14 — API Endpoints (10) | | | |
| Test 15 — Offline Mode (10) | | | |
| Test 16 — Pengajuan Proyek (10) | | | |
| Test 17 — Spring Detail (6) | | | |
| Test 18 — Pasar Bibit (6) | | | |
| Test 19 — Kolaborasi (3) | | | |
| Test 20 — Health Score (5) | | | |
| Test 21 — Auto-link (3) | | | |
| Test 22 — Snap Grid (3) | | | |
| Test 23 — Map Grouping (3) | | | |
| Test 24 — Route Map (3) | | | |
| Test 25 — Backup (3) | | | |
| Test 26 — Auto-fill (5) | | | |
| Test 27 — CSRF Crucial (3) | | | |
| **TOTAL** | **/** | **/** | **~203 test** |
