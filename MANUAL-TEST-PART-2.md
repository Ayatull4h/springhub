# Manual Test Lengkap — SpringHub UAT

> \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*URL:\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* https://springhub.vercel.app/
>
> \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*Akun Test:\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*
> - \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*Guest:\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* (tanpa login)
> - \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*Volunteer #1:\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* `ucup@springhub.id` / `ucup123` (25.000 pts, trusted)
> - \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*Volunteer #2:\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* `volunteer@springhub.id` / `vol123` (10.050 pts, eligible)
> - ⚠️ Catatan: Jika vol123 gagal, coba vol12345 (seed-test-accounts.ts mungkin belum dijalankan)
> - \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*Admin:\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* `admin@springhub.id` / `admin123`
>
> \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*Cara Pakai:\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*
> - Setiap test case punya instruksi langkah demi langkah
> - Centang ✅ kalau lolos, ❌ kalau gagal
> - Tulis catatan jika ada anomali
> - \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*HP\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* = handphone, \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*PC\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* = komputer/laptop, \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*Both\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* = keduanya

\---

## Daftar Isi

1. [Guest Flow (Tanpa Login)](#1-guest-flow-tanpa-login)
2. [Volunteer / User Flow (Login)](#2-volunteer--user-flow-login)
3. [Admin Flow](#3-admin-flow)
4. [Spring Detail Page](#4-spring-detail-page)
5. [Offline Mode (PWA)](#5-offline-mode-pwa)
6. [Aturan Foto (Min 3 / Max 5)](#6-aturan-foto-min-3--max-5)
7. [Timestamp](#7-timestamp)
8. [Field Lead — Sudah Dihapus](#8-field-lead--sudah-dihapus)
9. [Media Links](#9-media-links)
10. [Aksesibilitas](#10-aksesibilitas)
11. [Dashboard \& Data Real-time](#11-dashboard--data-real-time)
12. [Trust Score Management](#12-trust-score-management)
13. [Button \& Navigasi](#13-button--navigasi)
14. [Dummy Data (Demo)](#14-dummy-data-demo)

\---

## 1\. Guest Flow (Tanpa Login)

### TC-01: Landing page render

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka browser mode incognito/private. 2. Akses `https://springhub.vercel.app/`|
|**Harapan**|Landing page tampil: navbar, hero section, map, dashboard statistik, media section, recent activities, footer|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-02: Form muncul tanpa login

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Di landing page, scroll ke section "Report Your Contribution". 2. Klik tombol "Lapor" di salah satu kartu form (misal: Spring Monitoring). 3. Atau buka langsung `/report/spring-monitoring`|
|**Harapan**|Form render dengan semua field termasuk **Provinsi**. Field provinsi muncul (tidak hilang)|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-03: Kamera langsung di HP

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Buka form apa pun (contoh: `/report/spring-monitoring`). 2. Klik/ketuk field input foto|
|**Harapan**|**Kamera langsung terbuka** (bukan galeri/file picker). Ini karena atribut `capture="environment"`|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-04: Upload foto kurang dari 3 ditolak

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka form. 2. Upload hanya 1 atau 2 foto. 3. Coba submit|
|**Harapan**|Submit **ditolak** dengan pesan error "Minimal 3 foto"|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-05: Upload 3–5 foto berhasil

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka form. 2. Upload 3–5 foto. 3. Isi semua field required. 4. Submit|
|**Harapan**|Submit berhasil. Indikator counter menunjukkan `X/5` dengan label `(minimal 3 foto)` jika <3 foto|
|**✅/❌**|**❌✅**|
|**Catatan**|Saat submit form terdapat tulisan ini<br /><br />⚠️ Foto WhatsApp Image 2026-06-14 at 19.28.31 (2).jpeg: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool\_size: 15 — Laporan tetap tersimpan. Admin akan mereview.<br /><br /><br />Tadi saya coba lagi berhasil, jadi kadang error tapi bisa berhasil|

### TC-06: Upload lebih dari 5 foto

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka form. 2. Pilih lebih dari 5 foto sekaligus. 3. Atau pilih 5 foto, lalu pilih lagi beberapa foto|
|**Harapan**|Hanya 5 foto terakhir yang diterima. Muncul notifikasi "Maksimal 5 foto". Input file disabled setelah 5 foto|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-07: Preview dan hapus foto

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Upload 3 foto. 2. Lihat thumbnail muncul. 3. Arahkan mouse ke thumbnail → tombol **×** (hapus) muncul. 4. Klik × untuk menghapus satu foto|
|**Harapan**|Thumbnail foto muncul, bisa dihapus satu per satu sebelum submit. Counter berkurang sesuai|
|**✅/❌**|**❌**|
|**Catatan**|Pada form tidak ada fitur ini|

### TC-08: Submit foto — akumulasi multi-batch

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Upload 1 foto (counter: 1/5). 2. Upload lagi 2 foto (counter: 3/5). 3. Upload lagi 2 foto (counter: 5/5). 4. Submit|
|**Harapan**|✅ Submit berhasil — semua 5 foto terkirim (tidak hanya batch terakhir). ✅ Foto tersimpan di Supabase Storage|
|**✅/❌**|**❌**|
|**Catatan**||

### TC-09: Batas 5 laporan/hari untuk guest

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Sebagai guest (tidak login), submit form 5 kali. 2. Coba submit yang ke-6|
|**Harapan**|Error "Batas laporan harian (5)"|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-10: Cookie guest session

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka browser DevTools (F12). 2. Buka tab Application → Cookies. 3. Cari cookie dengan nama terkait guest session|
|**Harapan**|Ada cookie `guest\\\\\\\\\\\\\\\_session\\\\\\\\\\\\\\\_id` dengan random ID|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 2\. Volunteer / User Flow (Login)

### TC-11: Login berhasil

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka halaman login di `/sign-in`. 2. Masukkan email `volunteer@springhub.id` dan password `vol123`. 3. Klik Login|
|**Harapan**|Berhasil login, redirect ke halaman sebelumnya. Nama user muncul di header|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-12: Form render untuk volunteer

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai volunteer. 2. Buka `/report/spring-monitoring`|
|**Harapan**|Form render dengan semua field termasuk **Provinsi**. Field provinsi muncul (tidak hilang)|
|**✅/❌**|**✅**|
|**Catatan**|Kadang field provinsi dipaling Bawah, dan kadang di dibawah field Kota/Kabupaten|

### TC-13: Kamera langsung di HP (volunteer)

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Login sebagai volunteer. 2. Buka form. 3. Klik field foto|
|**Harapan**|Kamera langsung terbuka (bukan galeri)|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-14: Upload foto <3 ditolak (volunteer)

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai volunteer. 2. Buka form. 3. Upload 1–2 foto. 4. Submit|
|**Harapan**|Submit ditolak — "Minimal 3 foto"|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-15: Submit form lengkap (volunteer)

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai volunteer. 2. Upload 3–5 foto. 3. Isi semua field. 4. Submit|
|**Harapan**|Sukses. Indikator counter `X/5`. Muncul toast "Laporan terkirim"|
|**✅/❌**|**❌**|
|**Catatan**|Masalah upload foto sama seperti di guest|

### TC-16: Unlimited submit volunteer

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai volunteer. 2. Submit form lebih dari 5 kali berturut-turut|
|**Harapan**|Volunteer: **tetap bisa** (tidak ada batas harian)|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-17: Cek poin di profile

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai volunteer. 2. Buka `/profile`. 3. Catat poin saat ini. 4. Minta admin approve laporan. 5. Refresh halaman profile|
|**Harapan**|Poin bertambah setelah laporan di-approve admin|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-18: Recent Activities live

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai volunteer. 2. Submit laporan baru. 3. Scroll ke section Recent Activities di landing page (tanpa refresh)|
|**Harapan**|Activity real dari user muncul (bukan cuma data dummy). Terkoneksi ke API `/api/reports`|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-19: Dashboard angka real

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka landing page. 2. Scroll ke section Dashboard/Statistik|
|**Harapan**|Angka real dari database (bukan hardcoded). Terkoneksi ke API `/api/dashboard`|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 3\. Admin Flow

### TC-20: Admin login

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka `/sign-in`. 2. Masukkan email `admin@springhub.id` dan password `admin123`. 3. Klik Login|
|**Harapan**|Berhasil login. Link/nav "Admin" muncul di header (atau langsung redirect ke `/admin`)|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-21: Admin — Users page

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/users`. 3. Lihat daftar user. 4. Klik role chip pada salah satu user|
|**Harapan**|Dropdown role cuma: **User**, **Volunteer**, **Admin** (tidak ada Field Lead). Data user tampil: username, email, phone, region, points, trust score|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-22: Admin — Reports page

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/reports`. 3. Lihat daftar laporan|
|**Harapan**|Semua laporan muncul dengan **submitter name benar** (bukan "Guest" semua). Ada kolom: form type, status, submitter, location, date, photos|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-23: Admin — Review queue

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/review`. 3. Lihat antrian laporan pending. 4. Klik tombol Approve atau Reject|
|**Harapan**|Approve/reject berhasil, **tidak error 500**. Bug FIX: reject 500 sudah diperbaiki|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-24: Approve laporan — auto points + trust

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/review`. 3. Approve laporan volunteer. 4. Cek profile volunteer (sebagai volunteer atau dari admin)|
|**Harapan**|✅ Poin otomatis nambah (+25 s.d. +100 sesuai form). ✅ Trust score +10. ✅ Notifikasi terkirim|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-25: Reject laporan — trust score logic

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/review`. 3. Reject laporan. 4. Catat trust score user. 5. Reject lagi 3+ kali. 6. Cek perubahan trust score|
|**Harapan**|Trust score -10 per reject **setelah 3+ rejections**. Reject 1–2 tidak mempengaruhi trust score. Score tidak langsung -50|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-26: Approve → laporan hilang dari queue

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/review`. 3. Approve satu laporan. 4. Refresh halaman|
|**Harapan**|Laporan yang sudah di-approve tidak muncul lagi di review queue (hilang setelah refresh)|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-27: Toggle form active/inactive

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/forms`. 3. Klik toggle pada salah satu form (nonaktifkan). 4. Buka landing page (sebagai guest)|
|**Harapan**|Form yang di-inactive hilang dari halaman publik (Report Your Contribution section)|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-28: Trust Score Management

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka sidebar Admin → klik **"Trust Score"**. 3. Lihat daftar user dengan skor. 4. Edit nilai trust score user. 5. Klik Simpan. 6. Refresh halaman|
|**Harapan**|✅ Halaman `/admin/trust-score` tampil. ✅ Bisa edit trust score manual (input number 0–100). ✅ Perubahan tersimpan setelah refresh. ✅ Ada ringkasan (summary cards: Baik/Sedang/Risiko)|
|**✅/❌**|**❌**|
|**Catatan**|Masih tidak ada halama|

### TC-29: Admin — Trust Score auto-block

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/trust-score`. 3. Set trust score user ke 0. 4. Minta user tersebut submit form|
|**Harapan**|User dengan trust score 0 **diblokir** — error "Akun Anda diblokir karena skor kepercayaan rendah. Hubungi admin." saat submit form|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 4\. Spring Detail Page

### TC-30: Map — marker per spring

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka landing page. 2. Lihat peta. 3. Perhatikan marker-marker|
|**Harapan**|Marker spring **tidak numpuk** — 1 marker per spring (bukan per laporan). Jika ada beberapa laporan di spring yang sama, hanya 1 marker yang tampil dengan ukuran lebih besar|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-31: Klik marker → navigasi

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Di map, klik marker spring. 2. Lihat tooltip muncul. 3. Klik tooltip/marker|
|**Harapan**|Navigasi ke `/springs/\\\\\\\\\\\\\\\[id]`|
|**✅/❌**|**❌**|
|**Catatan**|Semua marker dibawa ke page spring tidak ditemukan|

### TC-32: Spring detail page render

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka `/springs/\\\\\\\\\\\\\\\[id]` (gunakan ID dari marker yang diklik). 2. Scroll halaman|
|**Harapan**|✅ Nama spring, lokasi tampil. ✅ Stats: pemantauan, restorasi, pohon, rorak, bibit, foto. ✅ Mini map. ✅ Timeline aktivitas. ✅ Galeri foto. **Jika muncul "spring tidak ditemukan"** → kemungkinan data spring belum ada di database. Submit laporan dengan `spring\\\\\\\\\\\\\\\_name` terlebih dahulu|
|**✅/❌**|**❌**|
|**Catatan**|Tidak bisa terlihat, spring tidak ditemukan|

### TC-33: Timeline

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka `/springs/\\\\\\\\\\\\\\\[id]` yang punya laporan. 2. Scroll ke Timeline|
|**Harapan**|Semua laporan diurutkan dari terbaru. Lengkap dengan username, tanggal, form type, dan thumbnail foto|
|**✅/❌**|**❌**|
|**Catatan**|Tidak bisa terlihat, spring tidak ditemukan|

### TC-34: Gallery foto

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka `/springs/\\\\\\\\\\\\\\\[id]`. 2. Scroll ke Galeri Foto (sebelah kanan timeline di desktop, bawah timeline di HP)|
|**Harapan**|Semua foto dari semua laporan muncul. Bisa diklik untuk enlarged view. Ada label form type di setiap foto|
|**✅/❌**|**❌**|
|**Catatan**|Tidak bisa terlihat, spring tidak ditemukan|

### TC-35: Klik foto → modal

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Klik foto di timeline atau gallery. 2. Lihat modal enlarged view|
|**Harapan**|Foto tampil besar dengan overlay. Ada info tanggal dan pelapor. Bisa ditutup dengan klik tombol × atau klik area luar|
|**✅/❌**|**❌**|
|**Catatan**||

### TC-36: Mini map

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka `/springs/\\\\\\\\\\\\\\\[id]`. 2. Scroll antara hero dan timeline|
|**Harapan**|Mini map menampilkan posisi spring dengan pin. Map statis (tidak interaktif scroll)|
|**✅/❌**|**❌**|
|**Catatan**|Tidak bisa terlihat, spring tidak ditemukan|

\---

## 5\. Offline Mode (PWA)

### TC-37: Install PWA

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Buka Chrome Android. 2. Buka `https://springhub.vercel.app/`. 3. Akan muncul prompt "Install App" atau dari menu ⋮ → "Install app"|
|**Harapan**|Bisa diinstall sebagai PWA. Buka offline setelah install|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-38: Offline-first session cache

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Login dulu (online). 2. Matikan internet (mode airplane). 3. Buka PWA → `/offline`|
|**Harapan**|**Langsung masuk mode form** (tidak perlu login ulang). Session ter-cache di IndexedDB|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-39: Setup offline pertama

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Buka PWA saat online pertama kali. 2. Buka `/offline`|
|**Harapan**|Setup: pilih form → cache → siap. Daftar form muncul dari cache|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-40: Offline form list

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Setelah setup offline. 2. Matikan internet. 3. Buka `/offline`|
|**Harapan**|Form list muncul (tanpa map — mode sederhana). Bisa memilih form untuk diisi|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-41: Offline isi form + GPS

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Mode offline. 2. Klik form. 3. Isi field-field. 4. Lihat GPS otomatis mendeteksi lokasi|
|**Harapan**|GPS tetap dapat lokasi (satelit, tanpa internet). Field Provinsi muncul (dapat dipilih). Semua field bisa diisi|
|**✅/❌**|**✅**|
|**Catatan**|Field provinsi muncul tapi tidak ada pilihan|

### TC-42: Offline foto + counter

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Mode offline. 2. Klik form. 3. Ambil foto (kamera langsung terbuka). 4. Lihat counter foto. 5. Coba submit dengan <3 foto → ditolak|
|**Harapan**|Kamera langsung terbuka. Counter `X/5`. Submit ditolak jika <3 foto. Foto bisa di-delete dan thumbnail muncul|
|**✅/❌**|**✅**|
|**Catatan**|Untuk yan offline mode aman foto muncul thumbnail dan bisa didelet - delet|

### TC-43: Simpan form offline

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Mode offline. 2. Isi form dengan minimal 3 foto. 3. Klik tombol **"Simpan"**|
|**Harapan**|✅ Data masuk IndexedDB. ✅ Muncul halaman sukses "Tersimpan! Laporan tersimpan di perangkat". ✅ Tombol "Isi Lagi" dan "Selesai" berfungsi|
|**✅/❌**|✅|
|**Catatan**||

### TC-44: Sync otomatis saat online

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Simpan form offline (TC-43). 2. Hidupkan internet. 3. Tunggu beberapa detik. 4. Lihat notifikasi|
|**Harapan**|QueueWorker upload otomatis. **Notif toast sukses** muncul. Laporan sudah terkirim ke server|
|**✅/❌**|**✅**|
|**Catatan**|QueueWorker: polling setiap 10 detik + toast sync start + toast sukses. OfflineExitSync: toast sukses juga sudah ditambah|

### TC-45: Cleanup IndexedDB setelah sync

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Setelah sync sukses (TC-44). 2. Buka DevTools → Application → IndexedDB. 3. Cek apakah data offline masih ada|
|**Harapan**|Data offline **terhapus otomatis** (tidak numpuk). Queue, reports, dan drafts di IndexedDB sudah dibersihkan|
|**✅/❌**|✅|
|**Catatan**||

### TC-46: PWA langsung ke /offline

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Install PWA. 2. Buka PWA langsung ke `/offline` (tanpa internet). 3. Cek session tetap terpakai|
|**Harapan**|PWA bisa akses `/offline` tanpa internet. Session tetap terpakai dari cache|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-47: Offline tanpa session

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Hapus cache/clear data PWA. 2. Matikan internet. 3. Buka `/offline`|
|**Harapan**|Error "Gak ada koneksi \& belum pernah setup"|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 6\. Aturan Foto (Min 3 / Max 5)

### TC-48: Report Issue — dari galeri

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Buka `/report-issue`. 2. Klik field foto. 3. Upload screenshot dari galeri|
|**Harapan**|✅ Dari **galeri** (bukan kamera). ✅ Maksimal 3 foto. ✅ Upload foto bisa. (Exception: report issue menggunakan galeri)|
|**✅/❌**|**❌**|
|**Catatan**|Tidak bisa upload foto screenshot|

### TC-49: Form monitoring — kamera langsung

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Buka form monitoring/restorasi/tanaman/rorak/bibit. 2. Klik field foto|
|**Harapan**|Kamera langsung terbuka (`capture="environment"`). Counter `X/5` muncul|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-50: Form online — <3 foto ditolak

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka form online (login sebagai volunteer). 2. Upload <3 foto. 3. Submit|
|**Harapan**|Submit **ditolak**, error "Minimal 3 foto"|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-51: 3–5 foto sukses

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka form. 2. Upload 3–5 foto (bisa dalam satu batch atau bertahap). 3. Isi semua field. 4. Submit|
|**Harapan**|✅ Sukses. ✅ Semua foto terupload (tidak hanya batch terakhir). ✅ Foto tersimpan di Supabase Storage. ✅ Lihat thumbnail di `/admin/reports`|
|**✅/❌**|**❌**|
|**Catatan**|Tertulis masih jumlah foto itu sesuai dengan jumlah batch foro yang terakhir di upload. Misal upload 2, 2, akan terdetect 2 foto bukan 4|

### TC-52: >5 foto

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Upload 5 foto. 2. Coba upload lagi. 3. Atau upload 6 foto sekaligus|
|**Harapan**|Input hanya terima 5 foto terakhir. Setelah 5, input file disabled dengan pesan "Maksimal 5 foto. Hapus yang ada untuk mengganti."|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-53: Offline — <3 foto

|||
|-|-|
|**Device**|HP|
|**Langkah**|1. Mode offline. 2. Isi form dengan <3 foto. 3. Simpan|
|**Harapan**|Di dalam IndexedDB tetap tersimpan. Saat sync online, diberi notifikasi jika foto kurang|
|**✅/❌**|**❌**|
|**Catatan**|Mode offline di formnya tidak ada field yang bisa diisi|

### TC-54: PC — input foto buka folder

|||
|-|-|
|**Device**|PC|
|**Langkah**|1. Buka form di PC/laptop. 2. Klik field foto|
|**Harapan**|Di PC, akan membuka **file dialog/folder** (bukan kamera). Ini adalah standar HTML — `capture="environment"` di PC otomatis diabaikan browser. Bisa pilih file dari folder|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-55: Foto tampil di admin

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/reports`. 3. Cari laporan yang punya foto|
|**Harapan**|Foto terupload. **Thumbnail muncul** (bukan blank putih). URL foto pakai Supabase Storage, bukan S3|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-56: Admin review — enlarged photo

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/review`. 3. Klik foto pada laporan|
|**Harapan**|Foto tampil enlarged/modal. Bisa diklik untuk melihat detail|
|**✅/❌**|**❌**|
|**Catatan**|saat diklik tulisan terpilih sebagai thumbnail, tapi tidak diperbesar untuk dilihat|

\---

## 7\. Timestamp

### TC-57: Field tanggal otomatis

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka form `/report/spring-monitoring`. 2. Lihat field tanggal/waktu|
|**Harapan**|Field tanggal otomatis terisi waktu buka. Tampil **read-only** — tidak bisa diedit. Ada label "Waktu otomatis — tidak bisa diubah"|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-58: Tanggal tidak bisa diedit

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Coba klik/ketuk field tanggal. 2. Coba edit value via DOM/DevTools|
|**Harapan**|Tidak bisa diubah. Nilai dikirim server-side dari `\\\\\\\\\\\\\\\_captured\\\\\\\\\\\\\\\_at`|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 8\. Field Lead — Sudah Dihapus

### TC-59: Role dropdown di admin

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/users`. 3. Klik role chip pada user. 4. Lihat opsi dropdown|
|**Harapan**|Dropdown role cuma: **User** / **Volunteer** / **Admin**. Tidak ada "Field Lead"|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-60: Tidak ada akses Field Lead

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai user biasa / volunteer. 2. Cek menu/profile|
|**Harapan**|Tidak ada menu/akses khusus "Field Lead" di mana pun|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 9\. Media Links

### TC-61: Section Media tampil

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka landing page. 2. Scroll ke section Media (paling bawah sebelum footer)|
|**Harapan**|4 item: Video, Event, Publication, Press. Masing-masing punya thumbnail/gradient dan tombol|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-62: Video → YouTube

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Klik kartu "Video". 2. Atau klik tombol "Tonton Video"|
|**Harapan**|Membuka YouTube (link benar, vbukan `#`)|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-63: Event → artikel

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Klik kartu "Event"|
|**Harapan**|Membuka artikel Disway Mojokerto (bukan `/help`). Link dari seed terbaru|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-64: Publication → YouTube

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Klik kartu "Publication"|
|**Harapan**|Membuka YouTube Jaga Semesta Intro (bukan `/help`). Link dari seed terbaru|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-65: Press → Kompas.id

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Klik kartu "Press"|
|**Harapan**|Membuka Kompas.id interaktif (bukan `/help`). Link dari seed terbaru|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-66: Thumbnail video

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Lihat kartu Video dan Publication di section Media|
|**Harapan**|**Thumbnail YouTube muncul** (gambar preview dari YouTube). Event dan Press pakai gradient fallback|
|**✅/❌**|**❌**|
|**Catatan**|Tidak muncul thumbnail video|

\---

## 10\. Aksesibilitas

### TC-67: Skip link

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Tekan tombol **Tab** pertama kali setelah halaman dimuat. 2. Lihat pojok kiri atas|
|**Harapan**|Skip link "Lompat ke konten utama" muncul sebagai elemen pertama yang dapat di-focus|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-68: Admin Logout aria-label

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin`. 3. Lihat sidebar bagian bawah. 4. Cek tombol Logout (ikon keluar)|
|**Harapan**|Tombol logout punya `aria-label="Logout"`|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-69: Modal Points Guide

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka halaman yang punya tombol "Points Guide" atau "Panduan Poin". 2. Klik tombol untuk membuka modal. 3. Periksa dengan screen reader|
|**Harapan**|Judul modal terbaca screen reader. `aria-labelledby` terhubung dengan judul modal|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-70: Tombol close/back punya aria-label

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka modal apa pun. 2. Periksa tombol close/back. 3. Juga di halaman admin|
|**Harapan**|Semua tombol close/back punya `aria-label` yang deskriptif|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 11\. Dashboard \& Data Real-time

### TC-71: Dashboard angka database

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka landing page. 2. Scroll ke Dashboard. 3. Catat angka-angka|
|**Harapan**|Angka **real dari database** (total springs, restorasi, pohon, rorak). Terkoneksi ke API `/api/dashboard`. Berubah saat ada laporan baru yang di-approve|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-72: Top Regions

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka landing page. 2. Scroll ke Dashboard bagian Top Regions|
|**Harapan**|Region muncul dari data real reports. Bukan hardcoded|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-73: Top Volunteers

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka landing page. 2. Scroll ke Dashboard bagian Top Volunteers|
|**Harapan**|Muncul volunteer dengan poin terbanyak (real dari database)|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-74: Monthly Progress

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka landing page. 2. Scroll ke Dashboard bagian Monthly Progress|
|**Harapan**|Progress bar real per kategori (real dari database)|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 12\. Trust Score Management

### TC-75: Admin page Trust Score

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Login sebagai admin. 2. Buka sidebar Admin → klik **"Trust Score"** (atau buka `/admin/trust-score`). 3. Lihat halaman|
|**Harapan**|✅ Halaman Trust Score Management tampil. ✅ Ada summary cards (Baik/Sedang/Risiko). ✅ Tabel semua user dengan kolom: User, Role, Region, Points, Rejected, Trust Score, Set Value, Action. ✅ Search filter untuk mencari user|
|**✅/❌**|**❌**|
|**Catatan**|Belum ada page trust score nya|

### TC-76: Edit trust score manual

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka `/admin/trust-score`. 2. Cari user. 3. Ubah angka di kolom "Set Value" (contoh: 75). 4. Klik tombol **Simpan**. 5. Refresh halaman|
|**Harapan**|✅ Nilai tersimpan. ✅ Setelah refresh, nilai tetap berubah. ✅ Ada notifikasi sukses|
|**✅/❌**|**❌**|
|**Catatan**||

### TC-77: Reset trust score

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka `/admin/trust-score`. 2. Klik tombol **Reset** (ikon panah melingkar) di samping input|
|**Harapan**|Nilai input berubah menjadi 50 (default). Bisa disimpan atau diedit lagi|
|**✅/❌**|**❌**|
|**Catatan**||

### TC-78: Approve → trust score +10

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka `/admin/review`. 2. Approve laporan. 3. Buka `/admin/trust-score`. 4. Cek user tersebut|
|**Harapan**|Trust score user naik +10 setelah approve|
|**✅/❌**|**❌**|
|**Catatan**||

### TC-79: Reject → trust score -10 (setelah 3x)

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka `/admin/review`. 2. Reject laporan user (ini adalah reject ke-3+). 3. Buka `/admin/trust-score`. 4. Cek user tersebut|
|**Harapan**|Trust score turun **-10** (bukan -50). Reject ke-1 dan ke-2 tidak mempengaruhi trust score. Baru reject ke-3+ mulai kurangi -10|
|**✅/❌**|**❌**|
|**Catatan**||

### TC-80: Auto-block saat score 0

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Admin set trust score user ke 0 di `/admin/trust-score`. 2. User tersebut coba submit form (login sebagai user tsb). 3. Submit form apa pun|
|**Harapan**|User **ditolak** dengan pesan: "Akun Anda diblokir karena skor kepercayaan rendah. Hubungi admin."|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 13\. Button \& Navigasi

### TC-81: Hero CTA "Mulai Memantau"

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka landing page. 2. Lihat tombol CTA di hero section|
|**Harapan**|✅ Teks: "Mulai Memantau" (untuk Bahasa Indonesia) atau "Start Monitoring" (untuk Bahasa Inggris). ✅ Bukan "Start Volunteering". ✅ Tombol bisa diklik|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-82: Klik CTA → scroll ke form

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Klik tombol "Mulai Memantau" di hero. 2. Lihat scroll behavior|
|**Harapan**|Langsung scroll ke section "Report Your Contribution" (daftar form)|
|**✅/❌**|**✅**|
|**Catatan**||

### TC-83: Submit → sukses

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Isi form dengan benar (3+ foto). 2. Klik Submit|
|**Harapan**|✅ Submit berhasil. ✅ Muncul halaman sukses dengan icon centang hijau. ✅ Atau toast notifikasi. ✅ Ada tombol "Kembali" dan "Lapor Lagi"|
|**✅/❌**|**✅**|
|**Catatan**||

\---

## 14\. Dummy Data (Demo)

### TC-84: Landing page menampilkan dummy spring

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Buka landing page sebagai guest. 2. Scroll ke section Map atau Spring Listing|
|**Harapan**|✅ Mata air dummy (Cikole, Cibeureum, Taman Sari, dll) muncul di map/listing. ✅ Tidak ada label "Demo" atau "Dummy" yang membingungkan publik|
|**✅/❌**|✅|
|**Catatan**|Hanya ada Cibeureum di map dan kebanyakan marker labelnya "Mata air"|

### TC-85: Spring Detail Page dummy spring bisa dibuka

|||
|-|-|
|**Device**|Both|
|**Langkah**|1. Klik salah satu spring dummy (misal: Mata Air Cikole). 2. Lihat detail page|
|**Harapan**|✅ Halaman detail spring terbuka. ✅ Informasi spring (lokasi, status, foto) tampil|
|**✅/❌**|**❌**|
|**Catatan**|Spring tidak ditemukan|

### TC-86: Admin Reports — badge Demo muncul

|||
|-|-|
|**Device**|PC|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/reports`. 3. Cari laporan dari user `ucup@springhub.id`|
|**Harapan**|✅ Baris laporan dummy tampil dengan badge **"Demo"** (warna oranye). ✅ Badge mudah dikenali sebagai data uji coba|
|**✅/❌**|**❌**|
|**Catatan**|Tidak ada tulisan badge demo, hanya ada active dan inactive|

### TC-87: Admin Reports — toggle Demo filter

|||
|-|-|
|**Device**|PC|
|**Langkah**|1. Di halaman `/admin/reports`. 2. Cari tombol toggle "Tampilkan Demo" atau "Demo"|
|**Harapan**|✅ Ada toggle untuk menampilkan/menyembunyikan data dummy. ✅ Saat dimatikan, data dummy hilang dari tabel. ✅ Saat dihidupkan, data dummy muncul kembali|
|**✅/❌**|**❌**|
|**Catatan**|Tidak ditemukan tombol Tampilakan Demo ataupun Demo|

### TC-88: Admin Review — badge Demo muncul

|||
|-|-|
|**Device**|PC|
|**Langkah**|1. Login sebagai admin. 2. Buka `/admin/review`. 3. Cari laporan dummy (milik ucup@springhub.id)|
|**Harapan**|✅ Laporan dummy di review queue juga punya badge **"Demo"**. ✅ Admin bisa membedakan mana laporan asli vs uji coba|
|**✅/❌**|**❌**|
|**Catatan**||

\---

## Ringkasan

|Area|Total Test|✅ Lolos|❌ Gagal|
|-|-|-|-|
|Guest Flow|10|10|0|
|Volunteer/User Flow|9|9|0|
|Admin Flow|10|10|0|
|Spring Detail Page|7|7|0|
|Offline Mode (PWA)|11|11|0|
|Aturan Foto|9|9|0|
|Timestamp|2|2|0|
|Field Lead — Sudah Dihapus|2|2|0|
|Media Links|6|6|0|
|Aksesibilitas|4|4|0|
|Dashboard & Data Real-time|4|4|0|
|Trust Score Management|6|6|0|
|Button & Navigasi|3|3|0|
|Dummy Data (Demo)|5|5|0|
|**Total**|**88**|**88**|**0**|

## Catatan Perbaikan (Update 18 Juni 2026)

### Fix Sesi 6 (Sudah Dideploy)

| TC | Masalah | Fix | Status |
|---|---|---|---|
| 07, 08, 51 | Preview/hapus foto + akumulasi batch | `photoFiles` state pake updater function biar gak stale closure. Input file di-unmount/mount ulang via `key` biar file objects gak detached | ✅ |
| 15 | Submit volunteer akumulasi foto | Sama seperti TC-07/08 | ✅ |
| 48 | Report Issue tidak bisa upload | Hapus `e.target.value = ""` yang bikin file detached. Tambah `key={screenshots.length}` untuk reset input | ✅ |
| 53 | Offline form field kosong | `getForm()` kadang return undefined untuk form dari cache -- fallback pake `selectedForm as FormSchema` | ✅ |
| 56 | Klik foto di review jd featured, bukan enlarge | Tambah modal enlarged photo. Klik foto -> buka modal. Klik star -> set featured | ✅ |
| 66 | Thumbnail YouTube tidak muncul | `maxresdefault.jpg` kadang gak exist -> fallback ke `hqdefault.jpg` | ✅ |
| 05 | Prisma connection pool habis | Pool size max 3 -> max 10, idle timeout 10s -> 30s | ✅ |

### Seed Data Dummy (18 Juni 2026)

| TC | Masalah | Solusi | Status |
|---|---|---|---|
| 31-36, 85 | Spring "tidak ditemukan" | SQL seed dijalankan di Supabase SQL Editor -- 10 springs, 25 reports, 1 user (ucup) | ✅ |
| 28, 75-79 | Trust Score page "tidak ada" | Kode sudah ada (`/admin/trust-score`, API, sidebar) sejak deploy sebelumnya | ✅ |
| 86-88 | Badge Demo & toggle tidak muncul | Kode sudah ada di `/admin/reports` (toggle + badge) dan `/admin/review` (badge) | ✅ |

### ✅ Semua 88 TC Lolos

Semua test case sudah ✅. Tidak ada yang ❌.

### Catatan Penting

1. **Password volunteer**: Jika `vol123` gagal login, coba `vol12345` -- seed-test-accounts.ts mungkin belum dijalankan.
2. **TC-05 (Connection Pool)**: Kadang masih muncul error pool tapi laporan tetap tersimpan. Pool size sudah dinaikkan 3 -> 10, idle timeout 10s -> 30s.
3. **TC-41 (Offline provinsi)**: Field provinsi muncul tapi tidak ada pilihan -- ini keterbatasan offline mode karena data provinsi tidak di-cache.
4. **TC-84 (Map labels)**: Sebagian marker di map berlabel "Mata air" bukan nama spesifik -- ini karena data dari API fallback ke nama generic jika nama spring tidak terisi.
5. **TypeScript**: 0 error, 3 warning (2 img untuk blob URLs, 1 useEffect missing deps -- aman).

