# Manual Test — SpringHub
**Domain**: https://www.springhub.id
**Total Test**: 155 test — 19 kategori

> Cara pakai: Baca langkah, coba satu per satu, tulis **PASS** atau **FAIL** di kolom Hasil.
> Kalo FAIL, tulis juga pesan error yang muncul biar gampang diperbaiki.

---

## Akun Demo

| Akun | Email | Password | Bisa apa? |
|---|---|---|---|
| **Admin** | `admin@springhub.id` | `demo12345` | Lihat semua data, approve laporan, atur map, kelola user |
| **Ucup** | `ucup@springhub.id` | `ucup12345` | Volunteer — **20.168 poin** — bisa buat proyek |
| **Sari** | `vol@springhub.id` | `vol12345` | Volunteer — **8.750 poin** — belum bisa buat proyek |

---

## Persiapan Terminal (Sekali Aja)

```bash
COOKIE="/tmp/springhub.txt"
API="https://www.springhub.id"

# Login admin
curl -sk -c $COOKIE -b $COOKIE -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@springhub.id","password":"demo12345"}'

# Ambil CSRF token
CSRF=$(curl -sk -c $COOKIE -b $COOKIE $API/api/csrf | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))")
echo "CSRF: $CSRF"
```

---

## Test 1 — Buka Website (5 test)

| # | Langkah | Hasil |
|---|---|---|
| 1.1 | Buka `www.springhub.id` — harus muncul halaman utama dengan peta, statistik, tombol donasi | |
| 1.2 | Lihat address bar — harus ada gembok 🔒 (HTTPS) | |
| 1.3 | Buka `www.springhub.id/halaman-acak` — harus muncul halaman "Tidak Ditemukan" yang bagus | |
| 1.4 | Lihat tab browser — harus ada icon SpringHub | |
| 1.5 | Klik tombol 🌙/☀️ di kanan atas — tampilan harus berubah gelap/terang | |
| 1.6 | Buka `www.springhub.id/favicon.ico` di incognito — harus download file 31KB (bukan icon "S") | |

---

## Test 2 — Login & Daftar (8 test)

| # | Langkah | Hasil |
|---|---|---|
| 2.1 | Buka `www.springhub.id/sign-in` — harus ada form email + password | |
| 2.2 | Login `admin@springhub.id` / `demo12345` — harus berhasil masuk | |
| 2.3 | Login `admin@springhub.id` / `salah` — harus muncul "Email atau password salah" | |
| 2.4 | Login salah 5x berturut-turut — harus muncul "Akun terkunci 15 menit" | |
| 2.5 | Buka `www.springhub.id/join` — harus ada form registrasi | |
| 2.6 | Daftar dengan password `123` — harus ditolak (min 8 karakter) | |
| 2.7 | Daftar dengan `abcdefgh1` — harus ditolak (harus ada huruf BESAR) | |
| 2.8 | Daftar dengan email `admin@springhub.id` — harus muncul "Email sudah terdaftar" | |

---

## Test 3 — Halaman Admin (18 test)

Login sebagai admin dulu, buka `www.springhub.id/admin`

| # | Langkah | Hasil |
|---|---|---|
| 3.1 | Dashboard — harus ada angka total user, laporan, donasi, proyek | |
| 3.2 | Sidebar kiri — harus ada menu Dashboard, Users, Reports, Forms, Map, dll | |
| 3.3 | Klik "Users" — harus ada tabel dengan email, username, role, poin | |
| 3.4 | Kalo user banyak — harus ada tombol ← Prev dan Next → | |
| 3.5 | Klik "Reports" — harus ada daftar laporan dari relawan | |
| 3.6 | Klik toggle 👁 di laporan — status aktif/nonaktif berubah | |
| 3.7 | Klik "Review Queue" — harus ada laporan menunggu review | |
| 3.8 | Klik ✅ hijau — laporan berubah jadi "approved" | |
| 3.9 | Approve laporan dengan foto < 3 — harus ditolak "Minimal 3 foto" | |
| 3.10 | Klik "Trust Score" — harus ada daftar user dengan skor | |
| 3.11 | Klik reset 🔄 — skor kembali ke 50 | |
| 3.12 | Klik "Forms" — harus ada 5 form yang bisa diedit | |
| 3.13 | Klik "Tambah Form" → isi → simpan — form baru muncul di halaman depan | |
| 3.14 | Klik "Map" — harus ada daftar tipe titik peta + warna | |
| 3.15 | Ubah warna kategori — marker di peta harus berubah warna | |
| 3.16 | Tab "Settings" di admin map — harus tampil tipe + kategori + warna | |
| 3.17 | Klik "Map View" — harus tampil peta dengan marker sesuai warna kategori | |
| 3.18 | Klik marker di admin map — popup harus nampilin form-form terhubung | |

---

## Test 4 — Form & Laporan (11 test)

| # | Langkah | Hasil |
|---|---|---|
| 4.1 | Buka `www.springhub.id/report/spring-monitoring` — harus ada form isian | |
| 4.2 | Klik "Dapatkan Lokasi" atau geser pin — koordinat terisi otomatis | |
| 4.3 | Upload 3-5 foto — thumbnail harus muncul | |
| 4.4 | Upload foto ke-6 — harus ditolak "Maksimal 5 foto" | |
| 4.5 | Isi semua field → klik Kirim — harus muncul "Laporan berhasil dikirim" | |
| 4.6 | Isi latitude `999` — harus ditolak (range -90 s/d 90) | |
| 4.7 | Isi field tersembunyi (honey pot) — harus ditolak | |
| 4.8 | Kirim tanpa CSRF — harus 403 | |
| 4.9 | Klik marker di peta (biru/merah/kuning) — harus muncul popup info | |
| 4.10 | Klik area lingkaran putus-putus di sekitar marker — popup harus tetap muncul | |
| 4.11 | Buka form Spring Monitoring — field Desa & Kecamatan harus muncul | |

---

## Test 5 — Peta (6 test)

| # | Langkah | Hasil |
|---|---|---|
| 5.1 | Scroll ke section peta — harus ada peta Indonesia dengan marker | |
| 5.2 | Klik dropdown "Semua Titik" — harus ada pilihan: Mata Air, Tanam Pohon, dll | |
| 5.3 | Pilih "Mata Air" — peta cuma nunjukkin marker mata air | |
| 5.4 | Klik salah satu marker — harus muncul popup dengan info | |
| 5.5 | Scroll di peta — peta harus bisa zoom in/out | |
| 5.6 | Admin buat form baru → dropdown filter harus muncul form barunya | |

---

## Test 6 — Poin & Leaderboard (6 test)

| # | Langkah | Hasil |
|---|---|---|
| 6.1 | Approve laporan ucup → cek di `/admin/users` — poin ucup harus naik | |
| 6.2 | Admin edit poin form → submit → approve — poin sesuai yang diedit | |
| 6.3 | Scroll ke leaderboard di halaman depan — harus ada papan peringkat | |
| 6.4 | Lapor 3 hari berturut-turut — harus dapet bonus +5 poin (hari ke-3) | |
| 6.5 | Kalo udah 10 laporan disetujui — harus dapet bonus +50 poin | |
| 6.6 | Ucup (20.168 pts) bisa klik "Buat Proyek" — Sari (8.750 pts) tombol terkunci | |

---

## Test 7 — Donasi (5 test)

| # | Langkah | Hasil |
|---|---|---|
| 7.1 | Scroll ke "Support Conservation Efforts" — harus ada pilih nominal | |
| 7.2 | Klik nominal Rp 20K — field terisi otomatis | |
| 7.3 | Pilih "Custom" — bisa isi jumlah sendiri (min Rp 1.000) | |
| 7.4 | Pilih tier "Rp 20K" tapi isi jumlah Rp 1.000.000 — harus ditolak | |
| 7.5 | Kalo bayar berhasil — harus diarahkan ke halaman sukses | |

---

## Test 8 — Keamanan (9 test)

| # | Langkah | Hasil |
|---|---|---|
| 8.1 | Login sebagai ucup → buka `/admin` — harus redirect ke halaman utama | |
| 8.2 | Terminal: `curl $API/api/admin/users` tanpa cookie — harus 403/401 | |
| 8.3 | Terminal: `curl -X POST $API/api/admin/forms` tanpa CSRF — harus 403 | |
| 8.4 | Coba login 10x dalam 1 menit — harus ditolak "Terlalu banyak" | |
| 8.5 | `curl $API/api/reports` — harus TIDAK ada email/HP/lokasi presisi | |
| 8.6 | Isi form dengan `' OR 1=1 --` — harus ditolak validasi | |
| 8.7 | Isi form dengan `<script>alert(1)</script>` — harus tersimpan aman | |
| 8.8 | Buka `/admin` → Export → pilih Users — harus download CSV | |
| 8.9 | Buka Review Queue → Approve/Reject — harus berhasil (gak error CSRF) | |

---

## Test 9 — Dark Mode (5 test)

| # | Langkah | Hasil |
|---|---|---|
| 9.1 | Aktifkan dark mode — semua section berubah (header, peta, footer) | |
| 9.2 | Buka `/admin` di dark mode — sidebar, tabel, tombol ikut gelap | |
| 9.3 | Buka `/admin/map` di dark mode — background gelap, teks terbaca | |
| 9.4 | Buka `/report/spring-monitoring` di dark mode — form terbaca | |
| 9.5 | Logo SpringHub harus putih di dark mode, hitam di light mode | |

---

## Test 10 — Akun & Profile (4 test)

| # | Langkah | Hasil |
|---|---|---|
| 10.1 | Login ucup → buka `www.springhub.id/profile` — harus ada info akun | |
| 10.2 | Di profile — harus ada riwayat poin | |
| 10.3 | Ganti password — password baru harus kuat (huruf besar + kecil + angka) | |
| 10.4 | Klik logout — kembali ke halaman utama, menu login muncul lagi | |

---

## Test 11 — CRUD Admin (8 test)

| # | Langkah | Hasil |
|---|---|---|
| 11.1 | `/admin/courses` → Tambah → isi → simpan — course baru muncul | |
| 11.2 | `/admin/forms` → klik form → edit field → simpan — field berubah | |
| 11.3 | Hapus form yang punya laporan — form jadi nonaktif, data aman | |
| 11.4 | Ganti slug form yang punya laporan — harus ditolak | |
| 11.5 | `/admin/content` → tambah konten → simpan — muncul di landing page | |
| 11.6 | `/admin/feedback` — harus ada kritik/saran dari pengguna | |
| 11.7 | `/admin/errors` — harus ada daftar error teknis (kalo ada) | |
| 11.8 | Export → pilih data → download — file CSV terdownload | |

---

## Test 12 — API Endpoints (10 test)

Jalankan di terminal setelah login admin:

| # | Perintah | Hasil |
|---|---|---|
| 12.1 | `curl $API/api/health` → harus `{"status":"ok"}` | |
| 12.2 | `curl $API/api/forms` → array forms dengan field | |
| 12.3 | `curl $API/api/map-points/types` → 4 tipe titik | |
| 12.4 | `curl $API/api/leaderboard` → top 20 volunteer | |
| 12.5 | `curl -b $COOKIE $API/api/admin/users` → daftar user | |
| 12.6 | `curl $API/api/admin/users` → `{"error":"Unauthorized"}` | |
| 12.7 | `curl -b $COOKIE "$API/api/admin/export?entity=users"` → CSV | |
| 12.8 | `curl -b $COOKIE "$API/api/admin/export?entity=reports"` → CSV + foto | |
| 12.9 | Login ucup → `curl -b $COOKIE $API/api/notifications` → notif | |
| 12.10 | `curl $API/api/dashboard` → statistik | |

---

## Test 13 — Storage & Backup (4 test)

| # | Perintah | Hasil |
|---|---|---|
| 13.1 | `df -h /` — terpakai ≤ 70 GB | |
| 13.2 | `docker system df` — Build Cache harus 0 B | |
| 13.3 | Buka admin panel → data muncul — database jalan | |
| 13.4 | `docker exec springhub-web-1 ls /data/uploads/reports/ 2>/dev/null \|\| echo "Belum ada foto"` | |

---

## Test 14 — Offline Mode & PWA (10 test)

| # | Langkah | Hasil |
|---|---|---|
| 14.1 | Buka `www.springhub.id/offline` — harus ada tombol "Mulai Survey Offline" | |
| 14.2 | Klik "Mulai Survey Offline" → pilih form → Next | |
| 14.3 | Form yang dipilih harus muncul di daftar form offline | |
| 14.4 | Pilih form, isi field (nama, lokasi, foto min 3) | |
| 14.5 | Ambil minimal 3 foto — counter harus bertambah | |
| 14.6 | Klik "Simpan" — data tersimpan, notifikasi sukses | |
| 14.7 | Kembali online → `/offline` → klik "Sinkronkan" — data terkirim | |
| 14.8 | Di HP, "Add to Home Screen" — icon harus logo SpringHub | |
| 14.9 | Buka PWA saat offline — harus langsung ke `/offline` | |
| 14.10 | Admin ubah form → online → buka offline setup — form harus update | |

---

## Test 15 — Course & Poin (4 test)

| # | Langkah | Hasil |
|---|---|---|
| 15.1 | **Course selesai dapet poin** <br>1. Buka Learning Hub (`/learn` atau scroll di landing page)<br>2. Pilih course "Pengenalan Mata Air"<br>3. Buka module pertama → klik "Tandai Selesai"<br>4. Lanjut ke module berikutnya sampai module terakhir<br>5. Setelah module terakhir selesai → harus muncul banner **"+25 points earned!"** | |
| 15.2 | **Cek poin di Profile** <br>1. Buka `/profile`<br>2. Cek riwayat poin — harus ada entry "Course pengenalan-mata-air completed: +25" | |
| 15.3 | **Gak bisa dobel** <br>1. Selesaikan course yang SAMA lagi<br>2. Harus TIDAK dapat poin lagi (banner 0 pts) | |
| 15.4 | **Admin edit poin course** <br>1. Buka `/admin/points`<br>2. Edit "Course Selesai" → ubah jadi 50<br>3. Selesaikan course LAIN → harus dapat 50 poin | |

---

## Test 16 — Route Map (3 test)

| # | Langkah | Hasil |
|---|---|---|
| 16.1 | Buka `www.springhub.id/api-routes.html` — harus ada graph (node + edge) | |
| 16.2 | Klik filter "Admin" — graph cuma nunjukkin node merah | |
| 16.3 | Klik salah satu node — panel detail harus muncul (method, auth, models) | |

---

## Test 17 — Project & Like (6 test)

| # | Langkah | Hasil |
|---|---|---|
| 17.1 | Buka `/` → scroll ke "Proyek Unggulan" — harus ada 2 card + pagination dots | |
| 17.2 | Klik next/prev dots — harus ganti 2 card lain | |
| 17.3 | Buka `/projects` — harus daftar proyek asli dari API (bukan dummy) + pagination 9/page | |
| 17.4 | Klik salah satu proyek → detail: progress bar biru, like button ❤️, komentar | |
| 17.5 | Klik ❤️ — harus filled 🔴, klik lagi — outline. Counter berubah | |
| 17.6 | Scroll ke komentar → isi teks → submit — harus muncul di list | |

---

## Test 18 — API Routing via Terminal (8 test)

Jalankan perintah berikut di terminal (udah login):

```bash
# 18.1 — Daftar proyek
curl -s $API/api/projects | python3 -m json.tool | head -10
# Harus: 200, array projects

# 18.2 — Detail proyek (ganti ID_NYA dengan id dari 18.1)
ID=$(curl -s $API/api/projects | python3 -c "import json,sys;print(json.load(sys.stdin)['projects'][0]['id'])")
curl -s $API/api/projects/$ID | python3 -m json.tool | head -10
# Harus: 200, detail project

# 18.3 — Cek like status
curl -s $API/api/projects/$ID/like
# Harus: {"liked":false, "likes":...}

# 18.4 — Daftar courses
curl -s $API/api/courses | python3 -c "import json,sys;print(len(json.load(sys.stdin)['courses']), 'courses')"
# Harus: 3 courses

# 18.5 — Complete course (ganti SLUG & MODULES)
SLUG="pengenalan-mata-air"
MODS=4
curl -s -X PUT $API/api/courses/progress -b /tmp/springhub.txt \
  -H "Content-Type: application/json" \
  -d "{\"courseSlug\":\"$SLUG\",\"completedModules\":$MODS,\"totalModules\":$MODS}"
# Harus: pointsAwarded: 25

# 18.6 — Duplicate (jalanin lagi)
curl -s -X PUT $API/api/courses/progress -b /tmp/springhub.txt \
  -H "Content-Type: application/json" \
  -d "{\"courseSlug\":\"$SLUG\",\"completedModules\":$MODS,\"totalModules\":$MODS}"
# Harus: pointsAwarded: 0

# 18.7 — Auth me tanpa cookie
curl -s $API/api/auth/me | python3 -c "import json,sys;print(json.load(sys.stdin))"
# Harus: {'user': None}

# 18.8 — Invoice tanpa CSRF
curl -s -X POST $API/api/donations/invoice -H "Content-Type: application/json" -d '{}'
# Harus: 403
```

| # | Cara Cek | Hasil |
|---|---|---|
| 18.1 | `curl $API/api/projects` → 200 + array | |
| 18.2 | `curl $API/api/projects/[id]` → 200 + detail | |
| 18.3 | `curl $API/api/projects/[id]/like` → `{liked, likes}` | |
| 18.4 | `curl $API/api/courses` → 200 + 3 courses | |
| 18.5 | `curl -X PUT $API/api/courses/progress` → `pointsAwarded: 25` | |
| 18.6 | Jalanin lagi → `pointsAwarded: 0` (anti-duplicate) | |
| 18.7 | `curl $API/api/auth/me` tanpa cookie → `{user: null}` | |
| 18.8 | `curl -X POST $API/api/donations/invoice` tanpa CSRF → 403 | |

---

## Test 19 — Aksi Nyata Section (4 test)

| # | Langkah | Hasil |
|---|---|---|
| 19.1 | Buka `/` → scroll ke section "Aksi **Nyata**" (brand accent warna) — header nyambung ke dua kolom | |
| 19.2 | **Proyek Unggulan** — header gradient biru (`from-sky-50`), badge biru, progress bar biru (`bg-sky-500`), "Target" di atas bar, "Terkumpul" + % di bawah | |
| 19.3 | **Donasi card** — punya border + shadow (class `card`), ada stats "Terkumpul", "Donatur", "Proyek" di atas | |
| 19.4 | **Donasi form** — field rapat (gap kecil), input height proporsional, gak ada ruang kosong berlebih | |

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
| Test 15 — Course & Poin (4) | | | |
| Test 16 — Route Map (3) | | | |
| Test 17 — Project & Like (6) | | | |
| Test 18 — API Routing (8) | | | |
| Test 19 — Aksi Nyata Section (4) | | | |
| **TOTAL** | **/** | **/** | |
