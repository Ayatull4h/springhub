# Wacana dan Rencana SpringHub

> Terakhir diperbarui: November 2026. Dokumen hidup — diperbarui setiap ada keputusan baru.

## Sudah selesai & live di produksi

### Landing & konten
1. **Jejak Pulih inline** — section di bawah jadwal, model buku 1 cerita/halaman, carousel multi-foto, API pagination, narasi admin ID+EN.
2. **Jejak Pulih + Aksi Nyata bersebelahan** — kolom kiri proyek, kanan Jejak Pulih (ganti slot donasi yang di-hide; file donasi utuh).
3. **Tab Bacaan bilingual** (Learning Hub) — "Pembuatan Rorak" (8 slide) + "12 Jenis Mata Air" (9 slide), gambar asli + transkrip EN, viewer geser.
4. **6 halaman legal bilingual** + 2 halaman baru (cookie, pelindungan data).
5. **Modul Pulangin Air terpasang** — halaman, API, DB (PaOrder/PaClaim/PaUnit/PaPayoutAccount), test 22/22, section homepage + nav + menu admin.
6. **Aturan Pulangin baru** — Rp 20.000/rorak (16rb pembuat, 4rb platform), expiry 30 hari, qty 1–100, min payout 10 + progres builder.
7. **Pilihan mata air di form pesan** — dropdown + cari + pratinjau peta (perbaiki bug baca grup API).

### Formulir & data
8. Narasi otomatis 4 form (ID+EN, alias data lama) + prefill review + simpan EN.
9. Halaman mandiri `/kegiatan/[id]` + rombak halaman springs (slider, narasi, kesehatan, kondisi, riwayat, kutipan).
10. Auto-merge nama identik + lokasi ≤10 m (submit + approve); chip "Dalam Restorasi" dihapus.
11. Notifikasi tandai-dibaca; galeri khusus restorasi; rorak 1 foto; limit foto 3/field + total 3×field + counter jujur.
12. Normalisasi HP; simpan profil (CSRF); review paging + modal; download paging + preview; springs admin (sidebar, paging 20, ubah, gabung, cek duplikat).
13. Error log dicabut total (UI+API+lib).

### Keamanan & infra
14. Secret produksi dikunci (600); staging terbukti terisolasi; DB staging refresh + data test; rewrite jalan di staging.

### Bersih-bersih data
15. Laporan testing, Hzki2 (sisakan monitoring), Sigereng, 8 mata air test, Kepel, Jamise, foto before Rowo Santen diganti.

## Belum selesai

1. **Rewrite staging lanjutan** — pola service baru ke route tersisa + port fitur patch.
2. **Migrasi Midtrans ke jalur produksi** — kode ada di branch lain; butuh key asli.
3. **Mock payment + simulator webhook** (target Midtrans, staging-only).
4. **Alur tamu bibit** — minta wajib login, klaim pindahkan bibit, pisah Dibutuhkan vs Stok.
5. **Transfer manual sementara** —bayar via transfer bank + verifikasi admin (sambil tunggu ACC Midtrans).
6. **Editor template narasi + backfill laporan lama** (opsional).
7. **Bersih-bersih sisa** — tabel AppError, commit+push branch patch, parity staging.
8. **Slide penutup 9/9 komik rorak** — file tidak ada di zip.

## Didiskusikan, belum dikerjakan

1. **Aturan Jejak Pulih** — menunggu testing selesai.
2. **Key Midtrans/Iris + whitelist IP webhook** — butuh aksi di dashboard Midtrans.
3. **Jadwal rotasi secret + cek sinkron env.**
4. **Sweep 30 butir keamanan.**
5. **R2, upgrade Next 15.**

## Aturan main (disepakati)

- Produksi hanya dengan izin eksplisit per item. Staging bebas diacak-acak.
- Tidak push GitHub tanpa izin (kecuali file ini, atas perintah).
- Kode: sedikit, aman (tanpa kredensial/kerentanan), efektif, dependensi terpantau. Python boleh untuk fungsi non-web.
- Bahasa: ID + EN, substansi tidak diubah.
