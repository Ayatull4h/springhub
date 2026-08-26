# Laporan Bulan Agustus dan Billing — SpringHub

**Periode:** 1 – 25 Agustus 2026
**Proyek:** SpringHub — Jaga Semesta (www.springhub.id)
**Penyusun:** Ayatullah Reza — Pengembang Website

---

## Bagian 1 — Merapikan Rumah Percobaan (1–14 Agustus)

Bayangkan SpringHub punya dua rumah: **rumah percobaan (staging)** dan **rumah asli (produksi)** yang dilihat warga. Bulan ini kita bereskan rumah percobaan dulu biar aman sebelum pindah ke rumah asli.

**Yang kita bereskan:**
- **Mengunci formulir.** Dulu ada 83 kolom isian yang bisa diisi tulisan super panjang sampai jebol. Sekarang dibatasi maksimal 500 huruf (cerita panjang 5000) — seperti memberi pagar biar tidak ada yang masuk pakai truk besar.
- **Menutup celah nakal.** Ada celah yang bisa disusupi tulisan jahat seperti `<script>` yang bisa mengintip data. Sekarang kita pasang saringan dua lapis, jadi tulisan jahat otomatis dibersihkan sebelum disimpan.
- **Memberi rem pada tukang iseng.** Kalau ada yang coba upload foto raksasa atau spam berulang, sekarang langsung ditahan.
- **Membuat rumah percobaan yang mirip rumah asli.** Kita copy semua data asli ke rumah percobaan, lalu kita tes 205 tes satu per satu — semua lolos. Jadi kalau ada yang rusak, ketahuan di rumah percobaan dulu, bukan di rumah asli warga.

**Hasil:** Rumah percobaan sekarang stabil, siap jadi tempat uji coba. Tidak ada data warga yang hilang.

---

## Bagian 2 — Mengunci Rumah Asli & Menata Data Mata Air (19–25 Agustus)

Setelah rumah percobaan aman, kita pindah perbaikan ke rumah asli — tapi hanya setelah kamu setuju (staging dulu, produksi setelah ACC).

### Data Mata Air dari Lapangan
Tim lapangan sudah kumpulkan **199 laporan + 551 foto** mata air dari 6 provinsi. Awalnya banyak laporan masih “ngantri” (pending) dan 8 mata air bagus belum muncul di peta karena belum diaktifkan.

**Yang kita lakukan:**
- Kita cek satu per satu — ternyata 551 foto sudah lengkap (23 laporan ada 1 foto, 176 laporan ada 3 foto).
- Kita aktifkan **8 mata air asli** yang memang layak tampil: Sumber Telaga, Belik Soka, Sumber Gempol, Sumber Taman, Randu Alas (ini paling banyak, 46 laporan tanam pohon), Sumber Brantas, Sumber Maron, Mata Air Kalibayem. Yang kosong (Cipanas, Tirta Empul dll) dan yang namanya aneh seperti “Tester”, “Monggo”, “The Logat” sengaja kita biarkan tidak aktif biar tidak mengotori peta.
- Hasil: di rumah percobaan peta mata air dari 261 jadi **269**, di rumah asli dari 73 jadi **81**. Backup data 12MB (percobaan) & 5.4MB (asli) kita simpan dulu jaga-jaga.

### Mengunci Pintu Keamanan
- **Kunci pintu depan (CVE).** Ada celah di pintu Next.js yang bisa dilewati maling dengan menyelipkan header palsu. Kita ganti gemboknya dari versi 14 ke **15.5.23** dan pasang palang tambahan.
- **Kunci login.** Dulu kalau salah password 5 kali, maling masih bisa coba terus karena kuncinya tidak dikunci. Sekarang setelah 5 kali salah, akun terkunci 15 menit dan muncul pesan “Akun terkunci, coba lagi dalam X menit”.
- **Kunci CSRF.** Setiap form sekarang minta karcis khusus yang cuma berlaku 1 jam dan harus cocok antara yang dipegang browser dan yang disimpan di server — kalau tidak cocok ditolak.
- **Kunci rahasia.** Password contoh yang tadinya tertulis jelas di buku panduan (`SpringHub2026!`) sekarang diganti jadi `CHANGE_ME_STRONG_RANDOM` biar tidak ada yang intip.

### Merapikan Halaman
- **Foto tidak bocor.** Nomor HP/Email yang tadinya ikut ke-load di halaman publik sekarang tidak ikut lagi — hanya nama dan daerah yang tampil.
- **Peta tidak bocor.** Daftar mata air yang masih ngantri tidak bisa diintip dengan menebak kode, sekarang hanya yang sudah aktif yang bisa dilihat.
- **Anti spam.** Halaman berat seperti dashboard dan galeri foto sekarang dibatasi 30x per 10 detik — kalau ada yang spam, langsung ditolak `429 Terlalu banyak permintaan`.
- **Aplikasi HP (PWA).** Foto preview yang tadinya bikin memori HP penuh karena tidak pernah dibuang, sekarang otomatis dibuang setelah dipakai. Tombol logout sekarang benar-benar membersihkan semua antrean offline, bukan cuma sesi.

**Hasil akhir:** Rumah asli sekarang terkunci rapat, peta tampil bersih, form bisa diisi tanpa error `503`, dan semua sudah kita tes 205 test (dari buka website, login, isi form, sampai foto bisa di-download).

---

## Bagian 3 — Kendala: Xendit & Donasi

Fitur donasi (bayar via Xendit) mesinnya sudah 100% jadi — tinggal colok kunci dari Xendit:

1. **XENDIT_SECRET_KEY** masih kosong — perlu ambil dari dashboard Xendit
2. **XENDIT_WEBHOOK_TOKEN** masih kosong — perlu buat di dashboard Xendit
3. **Akun Xendit** belum dibuat oleh client

| Komponen | Status |
|---|---|
| POST /api/donations/invoice | ✅ Mesin siap (butuh kunci) |
| POST /api/donations/webhook | ✅ Mesin siap (butuh token) |
| Validasi HMAC | ✅ Siap |
| Konfigurasi env | ❌ Kedua kunci kosong |

Artinya: tombol donasi sudah ada, tapi kalau diklik belum bisa bayar sampai kunci Xendit dipasang.

---

## Bagian 4 — Billing

| Item | Detail |
|---|---|
| **Nama** | Ayatullah Reza Chalid |
| **Peran** | Full-stack Developer SpringHub |
| **Periode** | 24 Juni 2026 — 30 Juli 2026 |
| **Total** | **Rp2.500.000** (Dua Juta Lima Ratus Ribu Rupiah) |

### Bank Tujuan Pembayaran

| | |
|---|---|
| **Penerima** | Ayatullah Reza Chalid |
| **Bank** | BANK BRI |
| **Nomor Rekening** | 359001035332531 |

---

> **Terima kasih atas kerjasamanya.**
> SpringHub — Jaga Semesta — www.springhub.id
