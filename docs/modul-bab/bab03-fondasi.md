# BAB 3 — Fondasi: Bahasa & Teknologi yang Dipakai

> Sebelum masuk ke cerita kode, kenalan dulu dengan bahan bakunya.
> Bab ini menjelaskan teknologi yang dipakai SpringHub, singkat dan dengan
> contoh dari proyek ini sendiri.

---

## 3.1 TypeScript — JavaScript dengan Pengaman

TypeScript = JavaScript + **tipe data**. Artinya, sebelum aplikasi dijalankan,
komputer sudah memeriksa: "apakah kode ini memakai variabel dengan benar?".

```ts
// app/api/forms/[slug]/route.ts (pola asli)
const slug = params.slug;          // TypeScript tahu ini string
const form = await prisma.form.findUnique({ where: { slug, isActive: true } });
if (!form) {
  return NextResponse.json({ error: "Form not found" }, { status: 404 });
}
```

**Ceritanya:** `params.slug` dijamin `string` (bukan angka, bukan objek). `form`
bisa `null` kalau tidak ketemu — dan TypeScript memaksa kita **memeriksa `null`
dulu** sebelum memakai `form`. Kalau lupa, aplikasi tidak mau di-build. Ini
mencegah ribuan bug "tidak terduga" (null pointer).

**Konstruk kunci:** type annotation, union type (`string | null`), generics,
`Record<string, unknown>`, enum.

---

## 3.2 React — Membangun Antarmuka dari "Komponen"

React membangun UI dari **komponen** (fungsi yang mengembalikan tampilan) dan
**state** (data yang bisa berubah).

```tsx
// components/offline/offline-exit-sync.tsx (pola asli)
const [syncing, setSyncing] = useState(false);

async function handleExit() {
  setSyncing(true);          // tampilkan "sedang sinkron..."
  try {
    await syncNow();         // tunggu proses selesai
    router.push("/");
  } finally {
    setSyncing(false);       // pasti dijalankan: matikan indikator
  }
}
```

**Ceritanya:** user menekan tombol "keluar" → React menjalankan `handleExit`.
Baris `setSyncing(true)` membuat layar menampilkan indikator "sedang
menyinkronkan…". `await syncNow()` menunggu pekerjaan selesai (tanpa membekukan
layar). `finally` menjamin indikator mati **baik sukses maupun gagal**.

**Konstruk kunci:** `useState`, `useEffect`, `useMemo`, `useRef`, props,
event handler, conditional rendering.

---

## 3.3 Next.js 14 App Router — Halaman + API dalam Satu Framework

Next.js membagi dua dunia:

- **Server Component** — dijalankan di server sebelum dikirim (aman, cepat).
- **Client Component** — dijalankan di browser (interaktif), ditandai `"use client"`.
- **Route Handler** — file `route.ts` di `app/api/...` = API endpoint.

```ts
// app/api/health/route.ts
export async function GET() {
  return NextResponse.json({ status: "healthy" });
}
```

**Ceritanya:** siapa pun membuka `/api/health` → fungsi `GET` berjalan di server
→ mengembalikan JSON `{"status":"healthy"}`. Docker memakai ini untuk
mengecek apakah aplikasi hidup (healthcheck).

**Konstruk kunci:** `export const dynamic = "force-dynamic"`, `params`,
`NextResponse.json()`, middleware, `loading.tsx`, layout.

---

## 3.4 Prisma — Jembatan ke PostgreSQL

Prisma adalah ORM: kita menulis query dalam TypeScript, Prisma mengubahnya
menjadi SQL yang aman (terparameterisasi — tidak bisa di-injeksi).

```ts
// app/api/reports/route.ts (pola asli)
const reports = await prisma.report.findMany({
  where: { isActive: true, status: "approved" },
  orderBy: { createdAt: "desc" },
  include: { spring: { select: { name: true } } },
});
```

**Ceritanya:** "ambil semua laporan yang aktif DAN disetujui, urutkan dari
terbaru, ikutkan nama mata air terkait". Prisma menyusun `SELECT ... JOIN ...`
di belakang layar — kita tidak pernah menulis SQL manual.

**Konstruk kunci:** `findUnique/findMany/create/update/updateMany/count`,
`include`/`select` (relasi), `$transaction` (atomik), `upsert`, `groupBy`.

---

## 3.5 Tailwind CSS — Gaya lewat Class

```tsx
<button className="rounded-lg bg-emerald-600 px-4 py-2 text-white">
  Laporkan
</button>
```

**Ceritanya:** class `bg-emerald-600` = warna latar hijau, `rounded-lg` = sudut
membulat, `px-4 py-2` = jarak dalam. Tanpa file CSS terpisah — semuanya
tertulis langsung di komponen. Tema gelap ditangani `dark:` (`dark:bg-slate-900`).

---

## 3.6 Leaflet — Peta Interaktif

```tsx
// components/map/leaflet-map.tsx (pola asli, dynamic import)
const MapContainer = dynamic(() => import("react-leaflet"), { ssr: false });
```

**Ceritanya:** Leaflet butuh akses ke browser (window/document). Server tidak
punya itu — jadi peta dimuat **hanya di klien** (`ssr: false`). Inilah kenapa
kamu melihat "kotak loading" dulu, lalu peta muncul.

---

## 3.7 Redis + BullMQ — Antrean Pekerjaan

```ts
// lib/queue.ts (pola asli)
await emailQueue.add("send-email", { to, subject, html });
```

**Ceritanya:** saat user minta reset password, aplikasi **tidak** mengirim email
saat itu juga (lambat). Ia hanya menulis "pekerjaan" ke antrean Redis, lalu
`workers/email-worker.ts` yang berjalan terus-menerus mengambil dan mengirim.
Request selesai cepat; email terkirim di belakang layar.

---

## 3.8 PWA + IndexedDB — Bekerja Tanpa Sinyal

```ts
// lib/offline-db.ts (pola asli)
const db = await openDB("springhub-offline", VERSION, {
  upgrade(db) { db.createObjectStore("reports", { keyPath: "id" }); },
});
```

**Ceritanya:** IndexedDB = "database kecil di dalam browser". Form offline
menyimpan laporan di 10 object store. Saat sinyal pulih, QueueWorker
mengirimkannya ke server.

---

## 3.9 Ringkasan Konstruk yang Akan Kamu Temui

| Teknologi | Konstruk |
|---|---|
| TypeScript | tipe, generics, union, `as`, interface |
| React | hooks, state, effect, memo, context |
| Next.js | App Router, route handler, server/client component, middleware |
| Prisma | model, query, relasi, transaksi, RLS |
| Zod | schema, `.safeParse()`, `.max()`, `.optional()` |
| Tailwind | class utility, dark mode |
| Leaflet | peta, marker, popup, tile layer |
| Redis/BullMQ | antrean, cache, rate limit |
| IndexedDB | object store, transaksi, versi |
