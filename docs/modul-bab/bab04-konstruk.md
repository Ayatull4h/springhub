# BAB 4 — Kamar Mesin: Setiap Konstruk Kode Dijelaskan dengan Cerita

> Ini bab paling penting untuk memahami SEMUA kode di buku ini.
> Setiap "mesin kecil" bahasa pemrograman (if, loop, async, ...) dijelaskan
> satu per satu dengan **potongan kode asli dari SpringHub** dan cerita
> langkah-demi-langkahnya: jika A benar maka B berjalan dan muncul C;
> jika tidak, D berjalan.

---

## 4.1 `if` / `else if` / `else` — Pengambil Keputusan

**Apa itu:** kode berjalan baris demi baris, tapi kadang kita ingin "jika
kondisi ini, lakukan X; jika bukan, lakukan Y". Inilah percabangan.

**Potongan kode asli** (webhook donasi — `app/api/donations/webhook/route.ts`):

```ts
const statusMap: Record<string, string> = {
  PAID: "paid",
  SETTLED: "paid",
  EXPIRED: "expired",
  FAILED: "failed",
};

const localStatus = statusMap[status];
if (!localStatus) {
  console.log("Unhandled Xendit status:", status, "for invoice:", id);
  return NextResponse.json({ success: true, status: "ignored" });
}
```

**Cerita:** Xendit mengirim webhook berisi `status` pembayaran. Kode melihat
peta `statusMap`: jika `status` adalah `PAID` atau `SETTLED` maka nilai
`localStatus` menjadi `"paid"`; jika `EXPIRED` menjadi `"expired"`; jika
`FAILED` menjadi `"failed"`. **Jika** ternyata statusnya bukan salah satu dari
empat itu (misalnya `"PENDING"` yang tidak pernah dikirim webhook), maka
`localStatus` menjadi **tidak ada** (`undefined`), dan `if (!localStatus)`
bernilai benar → kode mencetak log "Unhandled Xendit status" dan **langsung
mengembalikan** respons `{"success": true, "status": "ignored"}` — selesai,
tidak lanjut ke bawah. Ini pola **early return**: hentikan secepat mungkin
ketika tidak ada yang perlu dikerjakan.

**Konstruk:** `if`, truthy/falsy, early return, object map sebagai pengganti `switch`.

**🛡️ Kerentanan:** Tidak ada — `status` tidak pernah dipakai untuk query
langsung; hanya pembanding string yang sudah di-map.

---

## 4.2 `if` + `!` (negasi) + `||` — "Jika TIDAK punya atau TIDAK valid"

**Potongan kode asli** (CSRF — `app/api/reports/route.ts`):

```ts
const csrfToken = request.headers.get("x-csrf-token");
if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
  return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
}
```

**Cerita:** Setiap permintaan yang mengubah data wajib membawa token CSRF di
header `x-csrf-token`. Kode membaca header itu. Lalu kondisi `!csrfToken`
(artinya: "token TIDAK ada") **atau** `!(await verifyCsrfToken(csrfToken))`
(artinya: "token ada TAPI tidak lulus verifikasi"). Jika salah satu benar —
token tidak ada, atau token salah — maka respons yang muncul adalah
`{"error":"Invalid CSRF"}` dengan kode HTTP **403 Forbidden**, dan fungsi
berhenti di situ. Hanya jika token ada DAN valid, kode di bawahnya jalan.

**Konstruk:** negasi `!`, operator `||` (atau), `&&` (dan), await di dalam kondisi.

**🛡️ Kerentanan:** Justru ini pengamanan. Tanpa blok ini, penyerang bisa
memalsukan permintaan dari situs lain (CSRF). Detail di Bab 10.3.

---

## 4.3 `if / else` — Dua Jalan

**Potongan kode asli** (pengaman seed — `prisma/seed.ts`):

```ts
if (existing === 0) return;
const force = process.env.SEED_FORCE === "1" || process.env.SEED_ALLOW_WIPE === "true";
if (force) {
  console.warn(`⚠️  SEED_FORCE aktif — ${existing} profil akan DIHAPUS...`);
  return;
}
console.error(
  `🛑 DIHENTIKAN: database tidak kosong (${existing} profil ditemukan).`
);
process.exit(1);
```

**Cerita:** Seed menghapus semua data — berbahaya! `existing` adalah jumlah
profil di database. **Jika** tidak ada profil (`existing === 0`), aman, lanjut
(return tanpa pesan). **Jika** ada profil, cek variabel `force`: **jika** user
menyetel `SEED_FORCE=1` atau `SEED_ALLOW_WIPE=true` maka muncul peringatan
`⚠️ SEED_FORCE aktif — N profil akan DIHAPUS...` di terminal dan proses lanjut
(memang disengaja). **Jika tidak** (else, berupa jalan jatuh ke bawah), muncul
pesan `🛑 DIHENTIKAN: database tidak kosong...` dan `process.exit(1)`
menghentikan program dengan kode gagal — database SELAMAT.

**Konstruk:** `if / else`, template literal `` `...${var}...` ``, `process.exit`.

**🛡️ Kerentanan:** Ini adalah mitigasi dari bug nyata: seed pernah menghapus
semua data tanpa pengaman. Cerita lengkap di Bab 10.10.

---

## 4.4 Ternary `? :` — if/else dalam satu baris

**Potongan kode asli** (webhook — compare-and-set):

```ts
const cas = await tx.donation.updateMany({
  where: {
    id: existing.id,
    status: localStatus === "paid" ? { not: "paid" } : "pending",
  },
  data: { status: localStatus as DonationStatus, ... },
});
```

**Cerita:** Kode ingin mengupdate donasi **hanya jika statusnya tepat**. Kondisi
ternary: `localStatus === "paid" ? { not: "paid" } : "pending"`. Artinya:
**jika** webhook bilang pembayaran sukses (`paid`), maka kecocokan baris yang
dicari adalah `status != "paid"` (jangan timpa yang sudah paid!); **jika
tidak** (webhook bilang expired/failed), maka yang dicari adalah status
`"pending"` saja. Hasil `cas.count` berisi jumlah baris yang ter-update:
1 = berhasil diklaim, 0 = sudah diproses orang lain (duplikat).

**Konstruk:** ternary, object shorthand, `updateMany`.

**🛡️ Kerentanan:** Ini atomik CAS — dua webhook kembar yang datang bersamaan
tidak mungkin double-claim. Bukti: uji live di staging memberi poin tepat
sekali walau webhook dikirim 3×.

---

## 4.5 `async / await` — Menunggu Tanpa Membekukan

**Potongan kode asli** (upload — `lib/upload-photo.ts` pola):

```ts
export async function processPhoto(buffer: Buffer) {
  const sharped = await sharp(buffer)
    .rotate()
    .resize(1280, 720)
    .jpeg({ quality: 80 })
    .toBuffer();
  return sharped;
}
```

**Cerita:** `async` menandai fungsi ini "bekerja di latar belakang".
`await sharp(...)` berkata: "tunggu proses kompresi selesai, lalu lanjut".
Selama menunggu, server bisa melayani permintaan lain — halaman tidak
membeku. Tanpa `await`, fungsi akan lanjut dengan hasil yang belum jadi.

**Konstruk:** `async/await`, promise, chain method sharp.

**🛡️ Kerentanan:** Tidak signifikan. Tapi ingat: semua `await` harus berada di
dalam fungsi `async` — kesalahan ini pernah terjadi di `components/queue-worker.tsx`
dan menyebabkan error compile (sudah diperbaiki).

---

## 4.6 `try / catch / finally` — Jaring Pengaman

**Potongan kode asli** (webhook — seluruh handler):

```ts
try {
  // ... semua logika ...
  return NextResponse.json({ success: true, updated: true });
} catch (error) {
  console.error("Webhook error:", error instanceof Error ? error.message : error);
  return NextResponse.json(
    { error: getErrorMessage(error, "Terjadi kesalahan.") },
    { status: isDatabaseError(error) ? 503 : 500 }
  );
}
```

**Cerita:** `try` = "coba jalankan semua ini". **Jika** ada apa pun yang
melempar error di dalamnya, eksekusi langsung lompat ke `catch` (blok tengah
yang dijalankan hanya saat gagal): error dicetak ke log, dan respons yang
muncul adalah `{"error":"<pesan>"}` dengan status **503** jika error berasal
dari database (sedang gangguan — coba lagi nanti) atau **500** jika error lain.
Dengan `finally` (lihat Bab 3.2), blok yang dijamin selalu jalan baik sukses
maupun gagal.

**Konstruk:** `try/catch`, `instanceof`, ternary di dalam, status HTTP dinamis.

**🛡️ Kerentanan:** Kode ini MEMASTIKAN pesan error tidak membocorkan detail
internal — `getErrorMessage` memfilter pesan mentah (Bab 10.15).

---

## 4.7 Loop `for ... of` — Ulangi Setiap Item

**Potongan kode asli** (fix orphan — `scripts/fix-orphan-reports.ts` pola):

```ts
for (const cluster of clusters) {
  const spring = await tx.spring.create({ data: { ...cluster.springData } });
  for (const reportId of cluster.reportIds) {
    await tx.report.update({ where: { id: reportId }, data: { springId: spring.id } });
  }
}
```

**Cerita:** `clusters` berisi kelompok laporan yang tidak punya mata air.
Loop pertama: ambil `cluster` satu per satu (jika 5 klaster → 5 kali putaran);
di setiap putaran buat `Spring` baru. Loop kedua (di dalam): untuk setiap id
laporan di klaster itu, tautkan ke `spring.id`. Urutan ini menjamin setiap
laporan tersambung ke spring-nya sebelum klaster berikutnya diproses.

**Konstruk:** nested loop, destructuring (`{ ...cluster }`), spread.

**🛡️ Kerentanan:** Script ini berjalan dalam `$transaction` — jika satu saja
gagal di tengah, SEMUA dibatalkan (tidak ada data setengah jadi).

---

## 4.8 `map` / `filter` / `find` — Mengolah Array dengan Cerita

**Potongan kode asli** (kursus — `app/api/courses/[slug]/route.ts`):

```ts
modules: await Promise.all(
  course.modules.map(async (m) => ({
    ...m,
    content: m.content ? await sanitizeHtml(m.content) : "",
  }))
)
```

**Cerita:** `course.modules` adalah daftar modul. `.map(...)` berarti "untuk
SETIAP modul, buat versi baru": salin semua properti modul (`...m`), lalu
ganti `content` dengan hasil sanitasi DOMPurify (jika ada isinya; jika kosong,
jadi `""`). `Promise.all` menunggu SEMUA sanitasi selesai sekaligus (paralel)
sebelum lanjut — hasilnya daftar modul baru yang bersih.

**Konstruk:** `map`, spread, arrow function, `Promise.all`, ternary.

**🛡️ Kerentanan:** Inilah lapisan XSS kedua — lihat Bab 10.2.

---

## 4.9 Destructuring — Membongkar Kotak

**Potongan kode asli** (webhook):

```ts
const { id, external_id, status, paid_at } = body;
```

**Cerita:** `body` adalah JSON webhook. Destructuring mengambil empat kunci
sekaligus: `id` (id invoice), `external_id`, `status`, `paid_at` menjadi empat
variabel terpisah — persis seperti membuka kotak dan mengeluarkan isinya
keempat-empatnya ke meja, siap dipakai.

**Konstruk:** object destructuring, variabel.

---

## 4.10 Optional Chaining `?.` — "Coba, kalau ada..."

**Potongan kode asli** (profile — pola dari `app/api/auth/me`):

```ts
const points = user.profile?.points ?? 0;
```

**Cerita:** `user.profile` mungkin ada, mungkin tidak (belum pernah membuat
profil). `?.` berkata: "kalau `profile` ADA, ambil `points`-nya; kalau tidak
ada, langsung `undefined` — jangan error". Lalu `?? 0` (nullish coalescing):
"kalau hasilnya `undefined`, pakai 0". Jadi variabel `points` dijamin angka —
tidak pernah `undefined`, tidak pernah crash.

**Konstruk:** optional chaining, nullish coalescing.

---

## 4.11 Regex — Pencocokan Pola

**Potongan kode asli** (sanitizer — `lib/sanitize.ts`):

```ts
const BLOCKED_HTML = /<(script|style|iframe|object|embed|svg|form|input)\b/i;
```

**Cerita:** Regex ini adalah "detektor tag jahat". Saat konten datang, kode
memeriksa: "apakah di dalamnya ada `<script`, `<iframe`, `<svg` (atau lainnya
dalam daftar)?" — `\b` membatasi kata, `i` membuat pencarian tidak
membedakan huruf besar/kecil (jadi `<SCRIPT>` pun ketangkap). **Jika** cocok,
konten diblokir/dibersihkan lebih dulu sebelum disimpan/ditampilkan.

**Potongan kedua** (ytthumb — `app/api/ytthumb/route.ts`):

```ts
const match = videoId.match(/^[a-zA-Z0-9_-]{11}$/);
```

**Cerita:** id video YouTube TEPAT 11 karakter alfanumerik. Jika `match`
menghasilkan sesuatu (cocok), id dianggap sah; **jika `null`** (tidak cocok —
misalnya user mengirim `https://evil.com`), request ditolak. Inilah yang
mencegah SSRF (server tidak akan pernah mengambil URL selain YouTube).

**Konstruk:** regex literal, `.match()`, anchor `^...$`, quantifier `{11}`.

**🛡️ Kerentanan:** Regex yang salah bisa jadi ReDoS — di sini polanya pendek
dan dibatasi panjang, aman.

---

## 4.12 Object Map — Pengganti Rantai if/else

**Potongan kode asli** (poin — `lib/points.ts` pola):

```ts
const POINTS_MAP: Record<string, number> = {
  "spring-monitoring": 100,
  "spring-restoration": 1000,
  "trench-development": 500,
  "tree-planting": 100,
  "seedling-stock": 100,
};
```

**Cerita:** Daripada menulis lima `if`, kode cukup melihat tabel: jika slug
form adalah `"spring-restoration"`, poinnya `1000`; jika `"trench-development"`,
`500`; dan seterusnya. Satu baris `POINTS_MAP[slug]` menggantikan seluruh
rantai percabangan — lebih pendek, lebih sulit salah ketik, mudah ditambah.

**Konstruk:** object literal, `Record<K,V>`.

---

## 4.13 Spread `...` — Menyalin dan Menggabungkan

```ts
const sanitized = { ...course, description: await sanitizeHtml(course.description) };
```

**Cerita:** `...course` menyalin SEMUA properti course ke objek baru, lalu
properti `description` ditimpa dengan versi bersih. Objek asli di database
tidak berubah — kita membuat salinan aman untuk dikirim ke browser.

---

## 4.14 Template Literal — Menyulam Teks

```ts
reason: `donasi Rp${existing.amountIdr.toLocaleString("id-ID")}`,
```

**Cerita:** backtick + `${...}` menyisipkan nilai ke tengah teks. Hasilnya:
`donasi Rp50.000` (format Indonesia dengan titik ribuan). Tanpa ini, kita
harus merangkai string dengan `+` yang rawan salah.

---

## 4.15 `Promise.all` — Menjalankan Banyak Sekaligus

```ts
const [reports, total] = await Promise.all([
  prisma.report.findMany({ ... }),
  prisma.report.count({ ... }),
]);
```

**Cerita:** Ambil data halaman DAN hitung totalnya **bersamaan** (dua query
paralel), tunggu keduanya, lalu hasilnya masuk ke dua variabel sekaligus
(destructuring array). Lebih cepat daripada menjalankan berurutan.

---

## 4.16 `setInterval` — Ulangi Terus-menerus

```ts
setInterval(() => { reg.update(); }, 60000);
```

**Cerita:** Service worker diperiksa setiap 60.000 ms (1 menit): "ada versi
baru? kalau ada, perbarui di latar belakang". Berlaku terus selama halaman
terbuka.

---

## 4.17 Truthy / Falsy — Nilai yang "Dianggap Benar"

```ts
if (donorName || donorEmail) { ... }
```

**Cerita:** Dalam JavaScript, string kosong `""`, `0`, `null`, `undefined`,
`NaN` dianggap **falsy** (dianggap "tidak ada"); string berisi dan angka bukan
nol dianggap **truthy**. Jadi kondisi di atas benar jika salah satu dari nama
atau email donatur terisi — cukup untuk memberitahu siapa donaturnya.

---

## 4.18 Ringkasan: Jika Kamu Lupa, Kembali ke Sini

| Konstruk | Terjemahan "bahasa manusia" |
|---|---|
| `if (x)` | Jika x benar, kerjakan blok ini |
| `else` | Jika tidak, kerjakan yang ini |
| `x ? A : B` | Jika x benar → A, jika tidak → B |
| `!x` | Bukan x / x tidak ada |
| `a || b` | a ATAU b (cukup satu benar) |
| `a && b` | a DAN b (harus keduanya benar) |
| `await f()` | Tunggu f selesai, ambil hasilnya |
| `try {} catch {}` | Coba; kalau gagal, tangani di sini |
| `for (const x of xs)` | Ulangi untuk setiap x di daftar xs |
| `xs.map(f)` | Buat daftar baru dengan mengubah setiap x |
| `xs.filter(f)` | Saring daftar: simpan yang memenuhi f |
| `a?.b` | Ambil a.b kalau a ada (kalau tidak → undefined) |
| `a ?? b` | Kalau a kosong/undefined → pakai b |
| `{...obj}` | Salin semua isi obj ke tempat baru |
| `const {x, y} = obj` | Keluarkan x dan y dari obj menjadi variabel |
| `/pola/i` | Cocokkan pola teks (i = abaikan besar kecil) |
| `x.map(async ...)` + `Promise.all` | Ubah semua item secara paralel, tunggu semua |
