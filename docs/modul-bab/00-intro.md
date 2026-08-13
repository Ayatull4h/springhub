# MODUL BELAJAR — Kode SpringHub

**Aplikasi pemantauan & restorasi mata air, dijelaskan baris demi baris**

- Versi: 1.0 — 12 Agustus 2026
- Cakupan: seluruh kode sumber (363 file, ±48.500 baris)
- Repo: `github.com/Ayatull4h/springhub`

---

## Cara Membaca Modul Ini

Modul ini menjelaskan seluruh kode SpringHub dengan gaya **cerita**, bukan
daftar kering. Setiap topik memiliki bentuk tetap:

1. **Potongan Kode Asli** — kode nyata dari proyek (baris potongan ditandai
   `// ...`; nilai sensitif seperti password diganti `xxx`).
2. **Penjelasan Cerita** — "jika A benar maka B berjalan dan muncul C;
   jika tidak, D berjalan" — langkah demi langkah apa yang terjadi.
3. **Konstruk** — istilah teknis yang dipakai di potongan itu.
4. **🛡️ Kerentanan** — "rentan untuk disusupi karena ... → diamankan dengan ..."
   atau penjelasan mengapa aman.

Jika ada istilah yang asing, buka **Bab 11 (Glosarium)**. Jika ada konstruk
bahasa yang belum dipahami, buka **Bab 4 (Kamar Mesin)** — bab itu menerjemahkan
semua pola kode ke bahasa manusia.

## Peta Perjalanan

| Bab | Isi |
|---|---|
| 1 | Arsitektur — bagaimana sistem tersusun |
| 2 | Peta Kode — inventaris semua file |
| 3 | Fondasi — bahasa & teknologi |
| 4 | Kamar Mesin — setiap konstruk kode dengan cerita |
| 5 | Kamar Mesin `lib/` — domain logic, 39 file |
| 6 | Pabrik API — 94 route handler |
| 7 | Panggung UI — 39 komponen |
| 8 | Ruang Penyimpanan — database & Prisma |
| 9 | Benteng — infrastruktur, Docker, nginx |
| 10 | Serangan & Mitigasi — kerentanan + pertahanan |
| 11 | Glosarium |

**Mulai dari Bab 1** jika kamu ingin paham gambaran besar, atau langsung ke
bab mana pun yang sedang kamu kerjakan.
