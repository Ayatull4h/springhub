# BAB 5 — `lib/`: Pusat Logika SpringHub

BAB ini membedah seluruh 39 file di dalam direktori `lib/` — jantung logika aplikasi SpringHub. Di sinilah keputusan-keputusan penting hidup: autentikasi dan sesi, proteksi CSRF, sistem poin, perhitungan kesehatan mata air, penyembunyian lokasi mata air (5 km grid), mode offline PWA, upload foto, sanitasi XSS, integrasi Xendit, hingga manajemen koneksi Redis dan PostgreSQL.

Setiap file dibahas dengan pola yang sama:

1. **Potongan Kode Asli** — cuplikan nyata dari file, dipotong dengan `// ...` bila terlalu panjang. Bila ada nilai rahasia (password, API key, connection string), diganti `xxx`.
2. **Penjelasan Cerita** — narasi tahap demi tahap: apa yang terjadi di layar, di log, dan di database.
3. **Konstruk yang Dipakai** — daftar singkat konstruk bahasa yang dominan.
4. **🛡️ Kerentanan** — analisis keamanan jujur: apa yang bisa disusupi, dan bagaimana SpringHub mengamankannya.

Daftar isi bab ini:

| No | File | Peran |
|---|---|---|
| 1 | `lib/audit.ts` | Jejak audit semua aksi admin |
| 2 | `lib/auth-context.ts` | Ekstraksi konteks user untuk Prisma RLS |
| 3 | `lib/auth.ts` | Sesi, login, logout, IP whitelist admin |
| 4 | `lib/cache.ts` | Cache Redis get-or-set dengan TTL |
| 5 | `lib/cleanup.ts` | Pembersih data kedaluwarsa (cron) |
| 6 | `lib/contacts.ts` | Kanal kontak publik Jaga Semesta |
| 7 | `lib/csrf.ts` | Token CSRF berbasis JWT |
| 8 | `lib/darkmode.tsx` | Toggle mode gelap + penyimpanan preferensi |
| 9 | `lib/data.ts` | Data statis landing page (sementara) |
| 10 | `lib/dynamic-validation.ts` | Generator schema Zod dinamis |
| 11 | `lib/email.ts` | Kirim email (log/SMTP/Resend/SendGrid) |
| 12 | `lib/env.ts` | Validasi environment variables |
| 13 | `lib/epicollect.ts` | Nota depresiasi Epicollect5 |
| 14 | `lib/error-boundary.tsx` | Penangkap error React |
| 15 | `lib/error-logger.ts` | Logger error ke tabel AppError |
| 16 | `lib/forms.ts` | 5 form lapangan + schema Zod (sumber tunggal) |
| 17 | `lib/geo.ts` | Penyembunyian koordinat (grid 5 km) |
| 18 | `lib/guest.ts` | Identitas pengunjung anonim (guest) |
| 19 | `lib/health-score.ts` | Mesin skor kesehatan mata air 0-100 |
| 20 | `lib/i18n.tsx` | Internasionalisasi ID/EN |
| 21 | `lib/jwt.ts` | Rotasi kunci JWT |
| 22 | `lib/logger.ts` | Logger pino + redaksi data sensitif |
| 23 | `lib/offline-db.ts` | Wrapper IndexedDB offline survey |
| 24 | `lib/photo-url.ts` | Pembangun URL foto |
| 25 | `lib/points.ts` | Mesin poin relawan (server-only) |
| 26 | `lib/prisma-rls.ts` | Row-Level Security via Prisma $extends |
| 27 | `lib/prisma.ts` | Koneksi PostgreSQL + pesan error ramah |
| 28 | `lib/provinces.ts` | 38 provinsi Indonesia |
| 29 | `lib/queue.ts` | Antrean BullMQ (email, image, export) |
| 30 | `lib/rate-limit.ts` | Pembatas kecepatan request |
| 31 | `lib/redis-connection.ts` | Parser URL Redis untuk BullMQ |
| 32 | `lib/redis.ts` | Koneksi ioredis + noop fallback |
| 33 | `lib/sanitize.ts` | Sanitasi HTML dua lapis |
| 34 | `lib/session-cache.ts` | Cache sesi PWA di IndexedDB |
| 35 | `lib/upload-photo.ts` | Upload + kompresi + EXIF strip |
| 36 | `lib/use-auto-save.ts` | Auto-save draft form (30 detik) |
| 37 | `lib/utils.ts` | Utilitas cn/formatNumber/safeParseJson |
| 38 | `lib/watermark.ts` | Watermark SVG pada foto |
| 39 | `lib/xendit.ts` | Integrasi payment gateway Xendit |

---

## `lib/audit.ts` — Jejak audit semua aksi admin (satu baris log terstruktur)

### Potongan Kode Asli

```ts
// lib/audit.ts baris 1-9 (seluruh file)
import logger from "./logger";

export function auditLog(
  action: string,
  detail: string,
  meta?: Record<string, unknown>
): void {
  logger.info({ action, detail, ...(meta ? { meta } : {}) }, `AUDIT: ${action}`);
}
```

### Penjelasan Cerita

File ini kecil tapi perannya besar: ia adalah *tinta* yang mencatat setiap aksi penting di sistem — terutama aksi admin. Ceritanya begini: ketika admin menyetujui sebuah laporan, menghapus pengguna, atau mengubah pengaturan, route API memanggil `auditLog("report.approve", "Report ... disetujui", { reportId, userId })`.

Di dalam fungsi, parameter `action` dan `detail` diterima sebagai string, dan `meta` (objek bebas berisi data tambahan) bersifat opsional. Kemudian terjadi ekspresi penyebaran: jika `meta` dikirim (truthy), maka propertinya ikut ditambahkan ke objek log; jika tidak, yang masuk ke log hanya `{ action, detail }`. Pesan log kedua `AUDIT: ${action}` menjadi label cepat di konsol sehingga orang yang memantau bisa memfilter semua baris audit hanya dengan grep `AUDIT:`.

Akibatnya, setiap aksi menulis satu baris JSON ke output pino (di terminal saat dev, atau ke file log saat produksi). Tidak ada baris di database — jejak ini hidup di log aplikasi, bukan di tabel, sehingga ia menjadi sumber kebenaran forensik bila terjadi insiden.

### Konstruk yang Dipakai

- Parameter opsional dengan default `undefined` (`meta?`)
- Spread operator (`...(meta ? { meta } : {})`)
- Panggilan fungsi dari modul lain (`logger.info`)

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — ia hanya menulis log berisi string yang di-*interpolate*, dan pino secara otomatis meng-redaksi field sensitif (lihat `lib/logger.ts`) sehingga data seperti password atau token tidak akan tertulis mentah. Satu catatan: `detail` dan `meta` sebaiknya dipanggil oleh pemanggil dengan data yang sudah dibersihkan (tanpa PII), yang sudah menjadi konvensi di seluruh route API SpringHub.

---

## `lib/auth-context.ts` — Jembatan antara sesi dan Prisma RLS

### Potongan Kode Asli

```ts
// lib/auth-context.ts baris 17-33
export async function getRlsContext(): Promise<RlsContext> {
  const session = await getSession();

  if (!session) {
    return { role: "guest" };
  }

  if (session.role === "admin") {
    return { userId: session.userId, role: "admin" };
  }

  if (session.role === "volunteer") {
    return { userId: session.userId, role: "volunteer" };
  }

  return { userId: session.userId, role: "user" };
}
```

### Penjelasan Cerita

Fungsi ini dibuka di awal hampir semua route handler yang berurusan dengan data sensitif. Cerita alurnya: aplikasi memanggil `await getRlsContext()`; di dalamnya, `getSession()` dari `lib/auth.ts` membaca cookie sesi, memverifikasi JWT-nya, lalu mengecek baris *ledger* sesi di database. Hasilnya bisa berupa objek sesi lengkap atau `null`.

Jika sesi tidak ada (pengunjung belum login), fungsi langsung mengembalikan `{ role: "guest" }` — tamu. Jika sesi ada, peran diperiksa: `admin` → konteks admin dengan `userId`; `volunteer` → konteks volunteer; dan peran apa pun selain itu (termasuk `field_lead`, `user`) jatuh ke cabang terakhir yang menghasilkan `{ userId, role: "user" }`.

Hasil konteks ini lalu diumpankan ke `prismaWithRls(ctx)` dari `lib/prisma-rls.ts`. Akibat nyatanya di database: saat seorang tamu memanggil query laporan, hanya laporan berstatus `approved` dan aktif yang keluar; saat volunteer memanggil, hanya laporannya sendiri yang terlihat. Itulah mengapa urutan `if` di atas sangat penting — urutannya menentukan siapa melihat apa.

Fungsi kembarannya `rlsContextFromSession(session)` melakukan hal yang sama tapi untuk kode yang sudah memegang objek sesi, sehingga tidak perlu membaca cookie dua kali.

### Konstruk yang Dipakai

- `async/await`
- Rantai `if` untuk seleksi peran
- Type narrowing lewat union type `RlsContext`

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — peran ditentukan dari sesi server yang sudah diverifikasi di `lib/auth.ts` (JWT + ledger), bukan dari input client. Satu hal yang perlu diingat: *default fallback* ke `role: "user"` untuk peran tak dikenal adalah pilihan aman (fail-closed) dibanding menganggapnya admin.

---

## `lib/auth.ts` — Sesi, login, logout, dan IP whitelist admin

### Potongan Kode Asli

```ts
// lib/auth.ts baris 25-75
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function createSession(payload: SessionPayload, isSecure?: boolean): Promise<string> {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid session payload");
  }
  const jwtPayload: JWTPayload = {
    userId: payload.userId,
    role: payload.role,
    username: payload.username,
    phone: payload.phone || "",
  };
  const token = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION_SEC}s`)
    .sign(SECRET);

  // Session ledger: row must exist and be unexpired for the JWT to be accepted.
  // Store only the SHA-256 hash of the token in the database.
  await prisma.session.create({
    data: {
      profileId: payload.userId,
      token: sha256Hex(token),
      expiresAt: new Date(Date.now() + SESSION_DURATION_SEC * 1000),
    },
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecure ?? true,
    sameSite: "lax",
    maxAge: SESSION_DURATION_SEC,
    path: "/",
  });

  return token;
}
```

### Penjelasan Cerita

File ini adalah penjaga pintu utama aplikasi. Ada tiga babak cerita di sini.

**Babak 1 — Menghitung dan memverifikasi password.** Ketika user mendaftar, `hashPassword` dipanggil: password mentah dilempar ke `bcrypt.hash` dengan 12 *rounds*. Butuh sekitar ratusan milidetik dan menghasilkan string acak yang panjang — itulah yang tersimpan di kolom `passwordHash` database. Saat login, `verifyPassword` membandingkan input dengan hash; jika cocok hasilnya `true`, gerbang terbuka; jika tidak, `false` dan muncul pesan "password salah" di layar.

**Babak 2 — Membuat sesi.** `createSession` menerima payload (userId, role, username, phone) dan melakukan validasi kecil: jika payload tidak berupa objek, error dilempar (sistem menolak membuat sesi). Kemudian JWT ditandatangani dengan algoritma HS256 dan masa berlaku 7 hari, memakai kunci `SECRET` yang diambil dari `getJwtSecret()` (lihat `lib/jwt.ts`). Setelah token jadi, hal penting terjadi: token tidak disimpan mentah di database — hanya hash SHA-256-nya yang masuk ke tabel `Session` bersama `profileId` dan `expiresAt`. Baris inilah yang disebut *session ledger*: JWT tidak akan diterima nanti kalau barisnya tidak ada atau sudah kedaluwarsa (lihat `getSession` di bawah). Terakhir, token ditaruh di cookie bernama `session` dengan atribut `httpOnly` (JavaScript browser tidak bisa membacanya), `secure` (hanya lewat HTTPS), dan `sameSite: "lax"`.

**Babak 3 — Memvalidasi sesi.** `getSession` membaca cookie, lalu memverifikasi JWT lewat `verifyJwtWithRotation` — yaitu mencoba kunci sekarang dulu; kalau gagal, mencoba kunci sebelumnya (mendukung rotasi rahasia). Jika verifikasi gagal, atau struktur payload tidak sesuai (bukan string untuk userId/role/username), fungsi mengembalikan `null` dan aplikasi menganggap user tidak login. Setelah verifikasi sukses, query ledger dijalankan: `findUnique` mencari baris `Session` berdasarkan hash token. Jika baris tidak ditemukan, atau `expiresAt` sudah lewat `Date.now()` (dibandingkan dengan `getTime()`), maka `null` dikembalikan — sesi dianggap mati walau JWT-nya masih valid secara kriptografis. Ini fitur keamanan penting: logout atau pemblokiran akun langsung mematikan semua sesi karena barisnya di-*expire*.

```ts
// lib/auth.ts baris 77-104
export async function destroySession(isSecure?: boolean): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await prisma.session.updateMany({
        where: { token: sha256Hex(token) },
        data: { expiresAt: new Date(0) },
      });
    } catch (err) {
      console.warn("[auth] Failed to revoke session ledger row:", err);
    }
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isSecure ?? true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

export async function deactivateUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { profileId: userId },
    data: { expiresAt: new Date(0) },
  });
}
```

**Babak 4 — Logout.** `destroySession` mengambil token dari cookie; jika ada, baris ledger-nya langsung di-*expire* dengan `expiresAt` diset ke epoch 0 (1 Januari 1970). Jika update gagal (misal DB sedang down), hanya peringatan di konsol — cookie tetap dibersihkan. Cookie sesi lalu dihapus dengan `maxAge: 0` dan `sameSite: "strict"` (lebih ketat saat logout). Sementara itu, `deactivateUserSessions` adalah tombol darurat admin: sekali dipanggil dengan userId, **semua** sesi user itu mati seketika — efektif saat akun di-banned atau dicurigai dibajak.

```ts
// lib/auth.ts baris 112-155
export function getClientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real && ipv4ToInt(real) !== null) return real;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first && ipv4ToInt(first) !== null) return first;
  }
  return "unknown";
}

function ipv4ToInt(ip: string): number | null {
  let value = ip.trim();
  if (value.toLowerCase().startsWith("::ffff:")) value = value.slice(7);
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(value);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  if (octets.some((o) => o > 255)) return null;
  return ((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3];
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  const [rangeIp, prefixStr] = cidr.split("/");
  const prefix = prefixStr ? Number(prefixStr) : 32;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(rangeIp);
  if (ipInt === null || rangeInt === null) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

export function isAdminIpAllowed(request: Request): boolean {
  const allowedCidrs = process.env.ADMIN_ALLOWED_IPS;
  if (!allowedCidrs) return true; // Tidak ada whitelist → izinkan semua

  const ranges = allowedCidrs.split(",").map(s => s.trim()).filter(Boolean);
  if (ranges.length === 0) return true;

  const ip = getClientIp(request);
  if (ip === "unknown" || ipv4ToInt(ip) === null) return false; // fail-closed

  return ranges.some(range => isIpInCidr(ip, range));
}
```

**Babak 5 — IP whitelist admin.** Ketika admin membuka panel, middleware memanggil `isAdminIpAllowed`. Ceritanya: jika `ADMIN_ALLOWED_IPS` tidak diset di `.env`, semua orang boleh lewat (`true`). Jika diset (misal `"192.168.1.1,10.0.0.0/8"`), IP request diambil — prioritas ke header `x-real-ip` (dipasang oleh nginx), lalu `x-forwarded-for`. Keduanya harus berupa IPv4 yang valid (angka 0-255 di empat oktet); kalau tidak, hasilnya `"unknown"` dan fungsi langsung mengembalikan `false` — inilah prinsip *fail-closed*: ketika ragu, tolak. IP lalu dicocokkan ke daftar CIDR: `isIpInCidr` mengubah IPv4 menjadi integer 32-bit, menghitung *mask* dari prefix, dan membandingkan hasil `&` (bitwise AND). Bila IP admin tidak cocok dengan satu pun range, middleware meredirect ke halaman 403 — panel admin menolak dibuka.

### Konstruk yang Dipakai

- `async/await`, `try/catch`
- Regex (`/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/`) untuk validasi IP
- Operasi bitwise (`<<`, `&`, `>>> 0`) untuk perhitungan CIDR
- `cookies()` dari `next/headers`
- `updateMany`/`findUnique` Prisma untuk ledger sesi

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — kombinasi JWT yang hanya menyimpan hash SHA-256 di DB (token mentah tidak pernah bocor walau DB digondol), *revocation ledger* yang bisa mematikan sesi seketika, cookie `httpOnly`, dan whitelist IP *fail-closed* adalah praktik yang kuat. Catatan kecil: header `x-forwarded-for` bisa dipalsukan jika aplikasi berada tepat di belakang proxy yang *tidak* menimpa header tersebut; di deployment produksi, nginx SpringHub selalu menimpa `x-real-ip`, jadi nilai palsu tidak akan lewat.

---

## `lib/cache.ts` — Cache Redis get-or-set dengan TTL dan fallback aman

### Potongan Kode Asli

```ts
// lib/cache.ts baris 7-29
export async function getOrSet<T>(
  prefix: string,
  key: string,
  fetch: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    const redisKey = cacheKey(prefix, key);
    const cached = await redis.get(redisKey);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const data = await fetch();

    await redis.setex(redisKey, ttlSeconds, JSON.stringify(data));

    return data;
  } catch {
    // Redis unavailable — skip cache, fetch directly
    return fetch();
  }
}

export async function invalidateCache(prefix: string): Promise<void> {
  try {
    const pattern = `cache:${prefix}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable — nothing to invalidate
  }
}
```

### Penjelasan Cerita

File ini adalah lapisan penyimpanan sementara (cache) antara aplikasi dan database. Cerita pemakaiannya: misal route `/api/stats` ingin menampilkan statistik dampak. Ia memanggil `getOrSet("stats", "impact", hitungDariDb, 300)`.

Di dalamnya, kunci Redis dibentuk `cache:stats:impact` oleh fungsi kecil `cacheKey`. Pertama aplikasi bertanya ke Redis: `redis.get(...)`. Jika ada nilai (string JSON), langsung `JSON.parse` dan dikembalikan — layar menampilkan angka tanpa pernah menyentuh database, hemat milidetik. Jika tidak ada (belum pernah di-cache, atau sudah kedaluwarsa), fungsi `fetch` dijalankan — inilah query database asli — lalu hasilnya disimpan ke Redis dengan `setex` (SET dengan TTL dalam detik), dan baru dikembalikan. Kali berikutnya dalam 5 menit, hasil datang dari Redis.

Yang menarik adalah seluruh blok dibungkus `try/catch`: jika Redis mati atau lemot, kode tidak menangis — ia langsung `return fetch()` sehingga aplikasi tetap bekerja walau cache mati total. `invalidateCache` dan `invalidateAllCache` adalah penghapus: saat admin mengubah data (misal menambah form), route memanggil `invalidateCache("forms")` yang mencari semua kunci berawalan `cache:forms:*` lalu menghapusnya dengan `del(...keys)` — penyebaran argumen ke banyak kunci sekaligus. Jadi sesudahnya, permintaan berikutnya mengambil data segar dari DB dan mengisi cache baru.

### Konstruk yang Dipakai

- Generic function `<T>`
- `try/catch` dengan fallback
- Spread ke fungsi variadik (`redis.del(...keys)`)
- `JSON.stringify`/`JSON.parse`

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — data yang masuk cache selalu berasal dari server (hasil query), bukan input user, dan TTL membatasi umur data. Satu hal kecil: `JSON.parse(cached)` tanpa validasi skema; karena nilai hanya ditulis oleh aplikasi sendiri, risiko *poisoned cache* praktis nol.

---

## `lib/cleanup.ts` — Petugas kebersihan database (cron 24 jam)

### Potongan Kode Asli

```ts
// lib/cleanup.ts baris 9-38
export async function cleanupGuestReports(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const expiredReports = await prisma.report.findMany({
    where: {
      guestId: { not: null },
      userId: null,
      createdAt: { lt: thirtyDaysAgo },
    },
    include: {
      photos: { select: { storagePath: true } },
    },
  });

  if (expiredReports.length === 0) return 0;

  const photoPaths = expiredReports.flatMap((r) =>
    r.photos.map((p) => p.storagePath)
  );

  // Hapus cascade via Prisma (ReportPhoto punya onDelete: Cascade)
  await prisma.report.deleteMany({
    where: { id: { in: expiredReports.map((r) => r.id) } },
  });

  logger.info({ count: expiredReports.length, photos: photoPaths.length }, "Cleaned up unclaimed guest reports");

  return expiredReports.length;
}
```

### Penjelasan Cerita

File ini dijalankan oleh cron setiap 24 jam. Babak pertama `cleanupGuestReports`: tanggal 30 hari yang lalu dihitung dengan `setDate(getDate() - 30)`. Lalu database diinterogasi untuk mencari laporan yang memenuhi **tiga syarat sekaligus**: punya `guestId` (dibuat pengunjung anonim), belum punya `userId` (belum pernah di-claim akun), dan `createdAt` lebih lama dari 30 hari. Foto-foto laporan ikut diambil path-nya.

Jika tidak ada laporan seperti itu (`length === 0`), fungsi berhenti dan mengembalikan 0 — tidak ada yang terjadi. Jika ada, semua path foto digabung dengan `flatMap`, lalu laporan dihapus dengan `deleteMany`. Karena relasi `ReportPhoto` di Prisma punya `onDelete: Cascade`, semua foto di tabel ikut terhapus otomatis. Fungsi lalu menulis satu baris log berisi jumlah laporan dan jumlah foto yang dibersihkan, dan mengembalikan angka laporan yang dihapus.

Babak kedua `cleanupExpiredSessions` lebih sederhana: semua baris `Session` yang `expiresAt`-nya sudah lewat dihapus sekali jalan; log hanya ditulis bila ada yang terhapus. Babak ketiga `cleanupExpiredExports` mencari `PointsLog` dengan `reason: "export"` yang lebih tua dari 7 hari lalu menghapusnya — file CSV ekspor yang dikirim lewat email tidak boleh tercatat selamanya di buku besar poin.

### Konstruk yang Dipakai

- `async/await`
- Query dengan beberapa filter (`and` implisit dalam `where`)
- `flatMap` dan `map` untuk transformasi array
- `deleteMany` dan `include`

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — kriteria hapus sangat spesifik (guest + belum di-claim + >30 hari) sehingga tidak mungkin menghapus data milik user. Hapus foto dari *storage* hanya dicatat di log (path tidak di-`unlink`) — itu kekurangan fungsional, bukan keamanan; file fisik dibersihkan terpisah oleh job storage.

---

## `lib/contacts.ts` — Kanal kontak publik Jaga Semesta

### Potongan Kode Asli

```ts
// lib/contacts.ts baris 3-29
export const CONTACTS = {
  whatsapp: {
    /** International format used for tel:/wa.me URLs (no spaces, no +). */
    e164: "628112995190",
    /** Pretty format shown to humans. */
    display: "+62 811-2995-190",
    waUrl: "https://wa.me/628112995190",
    telUrl: "tel:+628112995190",
  },
  email: {
    address: "info@jagasemesta.id",
    mailto: "mailto:info@jagasemesta.id",
  },
  address: {
    city: "Jakarta",
    country: "Indonesia",
  },
  social: {
    instagram:
      "https://www.instagram.com/jagasemesta",
    youtube:
      "https://youtube.com/@jagasemesta",
    tiktok:
      "https://www.tiktok.com/@jagasemesta",
    facebook: "https://www.facebook.com/p/Jaga-Semesta-100092833113441",
  },
} as const;
```

### Penjelasan Cerita

File ini murni data statis — tidak ada logika. Ia diekspor sebagai `CONTACTS` dengan `as const` sehingga TypeScript membaca nilainya sebagai literal (bukan `string` bebas), menjamin pengejaan URL tidak bisa typo tanpa error kompilasi.

Kontennya: nomor WhatsApp dalam dua format — `e164` untuk membangun URL `https://wa.me/...` dan `tel:` (tanpa spasi, tanpa tanda `+`), dan `display` yang cantik untuk ditampilkan ke manusia. Email dalam bentuk alamat biasa dan link `mailto:`. Alamat kantor ringkas (Jakarta, Indonesia), dan empat kanal sosial media. Setiap bagian landing page yang butuh tombol "Hubungi Kami", "WhatsApp Kami", atau footer sosial media cukup mengimpor objek ini. Karena objeknya `as const`, tidak ada kode yang bisa mengubahnya secara tidak sengaja.

### Konstruk yang Dipakai

- Object literal dengan `as const` (narrowing tipe)
- Komentar JSDoc untuk dokumentasi

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — semua informasi bersifat publik dan tidak ada rahasia di dalamnya. (Tidak seperti yang mungkin dikira, nomor ini adalah kanal kontak resmi organisasi, bukan data pribadi rahasia.)

---

## `lib/csrf.ts` — Benteng anti-CSRF: token JWT di cookie + header

### Potongan Kode Asli

```ts
// lib/csrf.ts baris 10-51
export async function generateCsrfToken(isSecure?: boolean): Promise<string> {
  const token = await new SignJWT({} as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(SECRET);

  const cookieStore = cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: isSecure ?? true,
    sameSite: "lax",
    maxAge: 3600,
    path: "/",
  });

  return token;
}

export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get(CSRF_COOKIE)?.value ?? null;
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  if (!cookieToken || !token) {
    console.warn("[CSRF] missing token", { hasCookie: !!cookieToken, hasHeader: !!token });
    return false;
  }

  try {
    await jwtVerify(token, SECRET);
    await jwtVerify(cookieToken, SECRET);
    const match = token === cookieToken;
    if (!match) console.warn("[CSRF] token mismatch");
    return match;
  } catch (err) {
    console.warn("[CSRF] verification error:", err);
    return false;
  }
}
```

### Penjelasan Cerita

File ini melindungi setiap permintaan yang mengubah data. Cerita alurnya saat halaman form dimuat: komponen form memanggil `getCsrfToken()` dulu — fungsi ini hanya membaca cookie `csrf_token`. Seringkali token belum ada (pengguna baru datang), jadi aplikasi memanggil `generateCsrfToken()`: sebuah JWT kosong ditandatangani dengan HS256 yang berlaku 1 jam, lalu disimpan di cookie `csrf_token` dengan atribut `httpOnly`, `secure`, `sameSite: "lax"`, dan umur 3600 detik. Token yang sama dikembalikan ke JavaScript.

Saat pengguna menekan submit, JavaScript mengirim token itu di header `x-csrf-token` (nama header diekspor sebagai `CSRF_HEADER`). Di route API, `verifyCsrfToken(token)` dipanggil. Ceritanya: cookie dibaca kembali; jika cookie atau header kosong, fungsi menulis peringatan ke konsol dan mengembalikan `false` — permintaan ditolak dengan status 403. Jika keduanya ada, tiga pengecekan berjalan berurutan: apakah token header itu JWT yang sah (tidak diubah-tamper), apakah token cookie juga JWT yang sah, dan apakah keduanya identik string-nya. Serangan CSRF klasik gagal total di sini: situs jahat tidak bisa membaca cookie (httpOnly + sameSite), dan tokennya tidak akan pernah cocok. Bila ada ketidakcocokan, log peringatan menulis `[CSRF] token mismatch`.

Pola "just-in-time" penting diingat: token di-fetch tepat sebelum submit (bukan disimpan sejak halaman dimuat) untuk menghindari token kedaluwarsa di tengah isi form panjang.

### Konstruk yang Dipakai

- `SignJWT` / `jwtVerify` dari library `jose`
- `try/catch`
- Logging peringatan dengan detail diagnostik
- `??` (nullish coalescing) saat membaca cookie

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — pola *double-submit cookie* dengan JWT berumur pendek (1 jam) ditambah `httpOnly` dan `sameSite: "lax"` adalah pertahanan standar yang kuat terhadap CSRF. Satu hal yang patut dicatat: verifikasi mengandalkan cookie benar-benar dikirim browser (bukan dari body), sehingga skenario XSS-dengan-cookie-read pun tidak cukup untuk memalsukan token.

---

## `lib/darkmode.tsx` — Toggle mode gelap yang diingat browser

### Potongan Kode Asli

```ts
// lib/darkmode.tsx baris 15-44
export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "true" || (stored === null && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
```

### Penjelasan Cerita

File ini adalah provider React untuk mode gelap. Cerita saat aplikasi pertama kali dimuat: `dark` diinisialisasi `false` dan `mounted` `false`, sehingga render pertama hanya melewatkan children tanpa provider — tidak ada kedipan mode salah (flash) karena `mounted` masih false.

Begitu browser siap, `useEffect` berjalan: `mounted` jadi `true`, lalu localStorage dibaca untuk kunci `darkMode`. Ada tiga kemungkinan: nilai `"true"` → mode gelap aktif; `"false"` → terang; **tidak ada sama sekali** (`null`) → sistem yang memutuskan lewat `window.matchMedia("(prefers-color-scheme: dark)")`. Jika OS browser dalam mode gelap, pengguna baru langsung disambut tampilan gelap tanpa perlu klik apa pun. Hasilnya disimpan ke state dan class `dark` di-toggle di elemen `<html>` — itulah sumbu utama seluruh styling Tailwind (kelas `dark:`).

Saat pengguna menekan tombol toggle di header: `next = !dark` membalik state, nilai baru ditulis ke localStorage (jadi ingatan lintas sesi), dan class `dark` di `<html>` ikut berubah. Seluruh halaman berganti warna seketika karena Tailwind merespons class di elemen induk. `useDarkMode()` adalah kail yang dipakai komponen mana pun untuk membaca `dark` atau memanggil `toggle`.

### Konstruk yang Dipakai

- `useState`, `useEffect`, `useContext`, `createContext`
- `localStorage.getItem/setItem`
- Ternary + logika OR (`stored === "true" || (stored === null && prefersDark)`)

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — nilai localStorage hanya dipakai untuk memutuskan class CSS. Catatan kecil: pengecekan `mounted` mencegah *hydration mismatch*, dan tidak ada HTML yang dirender dari localStorage sehingga tidak ada celah XSS.

---

## `lib/data.ts` — Data statis landing page (mock, sementara)

### Potongan Kode Asli

```ts
// lib/data.ts baris 1-36
// Mock data for the SpringHub landing page. Replace with API/DB calls later.

import { snapToProtectionGrid, type LatLng } from "./geo";

/** Volunteers must reach this many points before they can propose a project. */
export const PROJECT_PROPOSAL_THRESHOLD = 20_000;

/**
 * The only four kinds of project SpringHub will fund / publicise. Project
 * proposals must pick one of these — keeps impact reporting consistent and
 * lets us tie donations directly to verified outputs.
 */
export const PROJECT_TYPES = [
  {
    id: "tree_planting",
    label: "Endemic Tree Planting",
    summary: "Plant native species around a spring or its recharge area.",
  },
  {
    id: "trench_development",
    label: "Trench (Rorak) Development",
    summary: "Build infiltration trenches that recharge groundwater.",
  },
  {
    id: "spring_restoration",
    label: "Spring Restoration",
    summary: "Remove sediment and rehabilitate a degraded spring.",
  },
  {
    id: "monitoring_expedition",
    label: "Monitoring Expedition",
    summary: "Field expedition to inventory and assess springs.",
  },
] as const;
```

### Penjelasan Cerita

File ini adalah gudang data *dummy* untuk halaman landing — penggantinya nanti adalah API dan database. Ada beberapa cerita kecil di sini.

`PROJECT_PROPOSAL_THRESHOLD` = 20.000 poin: ambang batas yang dipakai halaman `/projects` untuk memutuskan apakah seorang volunteer boleh mengajukan proyek — ditandai `const` sehingga tidak berubah saat runtime.

`PROJECT_TYPES` mendefinisikan empat jenis proyek yang diizinkan (tanam pohon, rorak, restorasi mata air, ekspedisi pemantauan) — dikunci dengan `as const`, dan `ProjectTypeId` diturunkan dari tipe tersebut sehingga form proposal memilih dari daftar yang sama persis dengan yang dirender.

```ts
// lib/data.ts baris 100-112
const rawSprings: Omit<SpringRecord, "publicLoc">[] = [
  { id: "1", name: "Mata Air Cibeureum", region: "Bogor, Jawa Barat", status: "healthy", reports: 24, lastReport: "2 days ago", precise: { lat: -6.6447, lng: 106.7892 } },
  { id: "2", name: "Sumber Beratan", region: "Bedugul, Bali", status: "degraded", reports: 11, lastReport: "5 days ago", precise: { lat: -8.2750, lng: 115.1670 } },
  { id: "3", name: "Mata Air Sebatu", region: "Gianyar, Bali", status: "restoration", reports: 8, lastReport: "1 week ago", precise: { lat: -8.4231, lng: 115.2779 } },
  { id: "4", name: "Mata Air Umbul Ponggok", region: "Klaten, Jawa Tengah", status: "healthy", reports: 19, lastReport: "3 days ago", precise: { lat: -7.6891, lng: 110.6472 } },
  { id: "5", name: "Mata Air Cikahuripan", region: "Sukabumi, Jawa Barat", status: "healthy", reports: 14, lastReport: "1 day ago", precise: { lat: -6.9210, lng: 106.9270 } },
  { id: "6", name: "Mata Air Senjoyo", region: "Semarang, Jawa Tengah", status: "degraded", reports: 9, lastReport: "4 days ago", precise: { lat: -7.2389, lng: 110.5063 } },
];

export const springs: SpringRecord[] = rawSprings.map((s) => ({
  ...s,
  publicLoc: snapToProtectionGrid(s.precise),
}));
```

Bagian yang paling menarik adalah `rawSprings` dan `springs`. Enam mata air disimpan dengan koordinat presisi (`precise`), tapi saat diekspor ke `springs`, setiap baris diproses `map` dan koordinat publiknya dihitung lewat `snapToProtectionGrid` dari `lib/geo.ts` — koordinat persisnya dibulatkan ke grid 5 km. Jadi peta publik hanya menampilkan `publicLoc` (misalnya `-6.3, 106.8`) sementara `precise` tetap di memori server untuk admin. Ini adalah contoh nyata prinsip "lokasi privat" dari AGENTS.md: walau masih data dummy, polanya sudah benar.

Sisa file berisi `impactStats` (statistik dampak seperti "Monitored Springs 500+"), `monthlyProgress` (bilah kemajuan), `topRegions`, `topVolunteers`, `recentActivities` (feed aktivitas), `featuredProjects` (proyek unggulan dengan dana terkumpul), `mediaItems` (video/publikasi/berita), dan `courses` (kursus pembelajaran). Semua dipakai komponen `components/sections/*` untuk merender landing page tanpa menunggu API.

### Konstruk yang Dipakai

- `as const` dan turunan tipe (`(typeof PROJECT_TYPES)[number]["id"]`)
- `Array.map` + spread untuk memperkaya data
- Array object besar sebagai data statis

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — koordinat presisi tidak pernah diekspor; hanya versi hasil snap yang keluar ke publik, sesuai desain `lib/geo.ts`.
---

## `lib/dynamic-validation.ts` — Pabrik schema Zod untuk form dinamis admin

### Potongan Kode Asli

```ts
// lib/dynamic-validation.ts baris 18-53
export function generateZodSchema(fields: DynamicFieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    switch (field.type) {
      case "text":
      case "longtext":
        shape[field.fieldId] = field.required
          ? z.string().min(1, `${field.label} wajib diisi`)
          : z.string().optional().default("");
        break;

      case "number":
        shape[field.fieldId] = field.required
          ? z.coerce.number({ message: `${field.label} harus berupa angka` })
          : z.coerce.number().optional();
        break;

      case "phone":
        shape[field.fieldId] = field.required
          ? z.string().regex(phoneRegex, "Format nomor HP tidak valid")
          : z.string().regex(phoneRegex, "Format nomor HP tidak valid").optional().or(z.literal(""));
        break;

      case "select":
      case "province":
        shape[field.fieldId] = field.required
          ? z.string().min(1, `${field.label} wajib dipilih`)
          : z.string().optional().default("");
        break;

      case "multiselect":
        shape[field.fieldId] = z.array(z.string()).optional().default([]);
        break;

      case "date":
        shape[field.fieldId] = field.required
          ? z.string().min(1, `${field.label} wajib diisi`)
          : z.string().optional().default("");
        break;

      case "location":
        shape[`${field.fieldId}_lat`] = z.string().optional();
        shape[`${field.fieldId}_lng`] = z.string().optional();
        break;

      case "link":
        shape[field.fieldId] = field.required
          ? z.string().url(`${field.label} harus berupa URL valid`)
          : z.string().url(`${field.label} harus berupa URL valid`).optional().or(z.literal(""));
        break;

      case "photo":
        shape[field.fieldId] = z.any().optional();
        break;

      default:
        shape[field.fieldId] = z.string().optional().default("");
    }
  }

  return z.object(shape);
}
```

### Penjelasan Cerita

Admin bisa membangun form kustom melalui panel admin (tabel `Form` dan `FormField` di database). Saat user membuka form itu, schema Zod harus dibuat — tidak bisa dipakai yang statis karena field-nya tidak pernah diketahui di waktu kompilasi. Di sinilah pabrik ini bekerja.

Ceritanya: `generateZodSchema` menerima daftar definisi field (id, label, tipe, required). Ia menyiapkan objek kosong `shape`, lalu berkeliling ke setiap field dengan `switch` berdasarkan tipe:

- `text`/`longtext` → jika wajib, `z.string().min(1, "Nama wajib diisi")` — string kosong ditolak dan pesan label muncul; jika opsional, string boleh kosong dengan default `""`.
- `number` → `z.coerce.number` — Zod akan mengubah string "42" menjadi angka 42; jika wajib dan bukan angka, pesan "harus berupa angka" muncul di bawah input.
- `phone` → regex ketat `^(0[1-9]\d{8,11}|\+62\d{8,13})$` — hanya nomor diawali `0` atau `+62` dengan panjang yang wajar yang diterima; field opsional memakai trik `.optional().or(z.literal(""))` agar string kosong tetap lolos.
- `select`/`province`/`date` → seperti text wajib (harus diisi, tidak boleh kosong).
- `multiselect` → array string, default array kosong — user boleh memilih banyak.
- `location` → khusus: satu field UI diterjemahkan menjadi **dua** kunci schema: `{fieldId}_lat` dan `{fieldId}_lng`, masing-masing string opsional. Inilah yang membuat geotag tersimpan sebagai dua koordinat terpisah di database.
- `link` → `z.string().url` — URL tidak valid langsung ditolak dengan pesan.
- `photo` → `z.any().optional()` — validasi foto dilakukan terpisah oleh `lib/upload-photo.ts`, bukan di Zod.
- Tipe tak dikenal → jatuh ke default string opsional.

Setelah semua field diproses, hasilnya `z.object(shape)` — schema siap dipakai `safeParse` di route API. Jika user mengirim data yang tidak sesuai, Zod mengembalikan daftar error yang langsung dirender di form.

### Konstruk yang Dipakai

- `switch` dengan banyak `case` dan `default`
- Ternary untuk memilih schema wajib/opsional
- `z.coerce`, `z.array`, `z.any`, `z.literal`
- `Record<string, z.ZodTypeAny>` sebagai akumulator

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — setiap tipe dibatasi oleh schema Zod (panjang, format, URL, angka), dan foto/`z.any` sengaja diserahkan ke lapisan validasi lain (MIME + ukuran di `lib/upload-photo.ts`). Pesan error memakai `field.label` yang berasal dari database admin, bukan dari input user langsung.

---

## `lib/email.ts` — Pengirim email multi-provider (log → SMTP → Resend → SendGrid)

### Potongan Kode Asli

```ts
// lib/email.ts baris 11-50
function getTransporter() {
  const provider = process.env.EMAIL_PROVIDER || "log";

  if (provider === "smtp") {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: parseInt(process.env.SMTP_PORT || "465", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }

  return null;
}

const transporter = getTransporter();

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER || "log";
  const from = process.env.EMAIL_FROM || "noreply@springhub.id";

  if (!provider || provider === "log") {
    logger.info({ to: params.to, subject: params.subject }, "Email logged (dev mode)");
    return;
  }

  if (provider === "smtp" && transporter) {
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    logger.info({ to: params.to, subject: params.subject }, "Email sent via SMTP");
    return;
  }
```

### Penjelasan Cerita

File ini mengirim email dari berbagai jalur tergantung konfigurasi environment. Cerita alur pemanggilannya: komponen atau route memanggil `sendEmail({ to, subject, html, text })`.

Langkah pertama: `getTransporter()` dijalankan sekali saat modul dimuat. Jika `EMAIL_PROVIDER` adalah `smtp`, transport nodemailer dibuat dengan host/port/user/pass dari environment (kredensial tidak pernah di-*hardcode*; bila kosong, fallback ke host default `smtp.hostinger.com`). Jika bukan SMTP, transporter `null`.

Saat `sendEmail` dipanggil: jika provider `log` (mode pengembangan), email tidak dikirim ke mana pun — hanya satu baris log "Email logged (dev mode)" berisi penerima dan subjek yang muncul di terminal. Jika `smtp`, `transporter.sendMail` dieksekusi dan log mencatat "Email sent via SMTP".

```ts
// lib/email.ts baris 52-96
  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) {
    logger.warn({ provider }, "No EMAIL_API_KEY configured");
    return;
  }

  switch (provider) {
    case "resend": {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html, text: params.text }),
      });
      if (!res.ok) throw new Error(`Resend error (${res.status}): ${await res.text()}`);
      break;
    }

    case "sendgrid": {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: from },
          subject: params.subject,
          content: [
            { type: "text/html", value: params.html },
            ...(params.text ? [{ type: "text/plain", value: params.text }] : []),
          ],
        }),
      });
      if (!res.ok) throw new Error(`SendGrid error (${res.status}): ${await res.text()}`);
      break;
    }

    default:
      console.warn(`[EMAIL] Unknown provider: ${provider}`);
  }
}
```

Jika provider `resend` atau `sendgrid`: kode masuk ke `switch`. Api key dibaca dari environment; bila tidak ada, peringatan "No EMAIL_API_KEY configured" ditulis ke log dan fungsi berhenti diam-diam. Untuk Resend, permintaan POST dikirim ke `https://api.resend.com/emails` dengan header `Authorization: Bearer xxx` (nilai asli dari env, diganti `xxx` di sini). Untuk SendGrid, format body berbeda: `personalizations` berisi penerima, dan konten berupa array `{ type: "text/html", value }` — blok text/plain hanya ditambahkan bila `params.text` ada (spread bersyarat). Kedua provider memeriksa `res.ok`; bila server mengembalikan status error, `throw new Error` dilempar berisi status dan teks respons — pemanggil melihat error di layar dan bisa menampilkan pesan gagal kirim.

Fungsi `sendNotificationEmail` adalah versi cepat untuk notifikasi (hanya log di dev), dan `buildResetPasswordEmail` membuat email reset password dengan tombol HTML cantik: subject "Reset Password — SpringHub", tombol tautan `resetUrl`, dan catatan "Link ini berlaku selama 1 jam".

### Konstruk yang Dipakai

- `switch` provider email
- `fetch` dengan header Authorization
- Spread bersyarat dalam array (`...(params.text ? [...] : [])`)
- `throw new Error` dengan pesan status

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — kredensial hanya dibaca dari `process.env` dan tidak pernah di-log; pino meredaksi field `body.*` sensitif. Catatan: `params.subject` dan `params.html` disisipkan ke template email `sendNotificationEmail` tanpa escaping HTML — pemanggil (route API) harus memastikan konten berasal dari data yang sudah dibersihkan; di SpringHub pemanggil adalah kode server internal, bukan input user mentah.

---

## `lib/env.ts` — Penjaga pintu environment variables

### Potongan Kode Asli

```ts
// lib/env.ts baris 10-40
const envSchema = z.object({
  // ── Critical — app will not function without these ─────────────────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),

  // ── High — features will break without these ──────────────────────────
  UPLOAD_DIR: z.string().optional().default("/data/uploads"),
  UPLOAD_URL_PREFIX: z.string().optional().default("/uploads"),
  XENDIT_SECRET_KEY: z.string().optional(),
  XENDIT_WEBHOOK_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_QUEUE_URL: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  // ── Medium — nice to have ────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("https://www.springhub.id"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["log", "smtp", "resend"]).optional().default("log"),
  SMTP_HOST: z.string().optional().default("smtp.hostinger.com"),
  SMTP_PORT: z.coerce.number().optional().default(465),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("noreply@springhub.id"),
  EMAIL_API_KEY: z.string().optional().default(""),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).optional().default("info"),
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});
```

### Penjelasan Cerita

File ini berjalan *saat modul diimpor* — validasi environment terjadi sebelum aplikasi melakukan apa pun. Schema Zod mendefinisikan semua variabel yang dikenal, dikelompokkan dalam komentar: Kritis (`DATABASE_URL`, `JWT_SECRET` minimal 16 karakter), Tinggi (upload, Xendit, Redis, S3), dan Sedang (email, log level, URL aplikasi). Variabel opsional mendapat `.default(...)` sehingga kode pemanggil selalu mendapat nilai konkret — misal `LOG_LEVEL` kosong berarti `"info"`, `SMTP_PORT` kosong berarti 465 (dengan `z.coerce.number` yang mengubah string env "465" menjadi angka).

```ts
// lib/env.ts baris 53-93
export function validateEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten();
    const fieldErrors = errors.fieldErrors;

    // Separate critical vs non-critical
    const criticalFields = ["DATABASE_URL", "JWT_SECRET"] as const;

    for (const field of criticalFields) {
      if (fieldErrors[field]) {
        _missingCritical.push(field);
      }
    }

    _validationError = Object.entries(fieldErrors)
      .filter(([, msgs]) => msgs && msgs.length > 0)
      .map(([key, msgs]) => `  • ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    // If critical vars missing, throw immediately
    if (_missingCritical.length > 0) {
      const msg = `❌ Critical environment variables missing or invalid:\n${
        _missingCritical.map((k) => `  • ${k}`).join("\n")
      }\n\nFull validation errors:\n${_validationError}`;
      console.error(msg);
      throw new Error(msg);
    }

    // Non-critical — log warning but don't crash
    console.warn(
      `⚠️  Non-critical environment variables missing or invalid:\n${_validationError}`
    );
  }

  _env = result.data as Env;
  return _env;
}
```

Cerita saat startup: `validateEnv()` dipanggil, dan hasilnya disimpan di variabel modul `_env` (singleton — panggilan kedua langsung mengembalikan yang lama, tidak memvalidasi ulang). `safeParse(process.env)` memeriksa seluruh variabel. Jika semua valid, `_env` diisi dan dikembalikan. Jika ada yang gagal: daftar error di-*flatten*, field kritis (`DATABASE_URL`, `JWT_SECRET`) diperiksa satu per satu. Bila salah satunya hilang, `console.error` menampilkan pesan dengan emoji ❌ dan **`throw`** — aplikasi menolak menyala. Ini keputusan desain yang keras tapi benar: tanpa database atau kunci JWT, lebih baik mati cepat daripada mati misterius di tengah jalan. Jika yang hilang hanya non-kritis (misal `REDIS_URL`), hanya peringatan ⚠️ yang muncul di konsol dan aplikasi tetap berjalan. `env()` adalah aksesor aman yang memanggil `validateEnv` bila belum dijalankan. Ekspor `missingCriticalEnvVars` dan `envValidationError` membiarkan modul lain (misal halaman status) melihat hasil validasi.

### Konstruk yang Dipakai

- Schema Zod (`z.object`, `z.enum`, `z.coerce.number`, `.optional().default()`)
- `safeParse` + `flatten()`
- Singleton pattern (modul `let`)
- `throw` untuk kegagalan kritis

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — pola ini justru menaikkan keamanan: kegagalan yang tidak jelas ditegakkan menjadi kegagalan yang eksplisit, dan nilai default dipakai hanya saat aman. Perlu dicatat: nilai variabel yang tervalidasi tersimpan di memori proses; tidak pernah di-log sebagai satu paket.

---

## `lib/epicollect.ts` — Nota depresiasi Epicollect5

### Potongan Kode Asli

```ts
// lib/epicollect.ts baris 1-9 (seluruh file)
// DEPRECATED — Epicollect5 is no longer used at runtime.
// SpringHub now hosts its own native field-reporting forms; see lib/forms.ts.
//
// Kept only as a short note for anyone running a one-off historical import
// from Epicollect5 CSV exports. Use a CLI script (e.g. tsx scripts/import-ec5.ts)
// rather than the application runtime.

export const EPICOLLECT5_DEPRECATED_NOTICE =
  "SpringHub uses native forms (lib/forms.ts). Epicollect5 is only referenced for one-off historical imports.";
```

### Penjelasan Cerita

File ini adalah monumen kecil: Epicollect5 pernah menjadi alat pengumpulan data lapangan di proyek pendahulu (Jaga Semesta). Setelah SpringHub punya form bawaan sendiri (`lib/forms.ts`), integrasi runtime Epicollect5 dihentikan. File ini tinggal sebagai catatan bagi siapa pun yang perlu mengimpor data historis dari ekspor CSV Epicollect5 — dan menunjuk ke skrip CLI sekali-jalan (`scripts/import-ec5.ts`) alih-alih jalur runtime. Satu konstanta diekspor agar kalau ada kode yang masih mereferensikan modul ini, ia mendapat pesan yang jelas, bukan error tak bermakna.

### Konstruk yang Dipakai

- Komentar dokumentasi multi-baris
- Ekspor konstanta string

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — file hanya berisi komentar dan string, tidak ada jalur eksekusi.

---

## `lib/error-boundary.tsx` — Penyelamat UI saat React menangis

### Potongan Kode Asli

```ts
// lib/error-boundary.tsx baris 10-29
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Auto-log ke database
    logError({
      message: error.message || "React Error Boundary catch",
      level: "critical",
      source: "frontend",
      stack: error.stack || "",
      url: typeof window !== "undefined" ? window.location.href : "",
      metadata: {
        componentStack: errorInfo.componentStack || "",
      },
    });
  }
```

### Penjelasan Cerita

React menyerahkan penanganan error render pada *error boundary* — komponen kelas yang membungkus aplikasi. Ceritanya: sebuah komponen di dalam (misal peta Leaflet) melempar error saat render. React memanggil `getDerivedStateFromError` yang menyalakan bendera `hasError` dan menyimpan error ke state — begitu state berubah, React mengganti subtree yang gagal dengan render fallback. Setelah itu `componentDidCatch` berjalan: error dikirim ke `logError` dari `lib/error-logger.ts` dengan level `critical` dan sumber `frontend`, termasuk `componentStack` (di mana letak komponen yang meledak). Artinya setiap error UI tercatat ke tabel `AppError` di database — tim bisa melihatnya dari panel admin.

```ts
// lib/error-boundary.tsx baris 31-62
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8 dark:bg-slate-900">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <span className="text-xl font-bold text-red-600 dark:text-red-300">!</span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-ink dark:text-white">Terjadi kesalahan</h2>
            <p className="mt-2 text-sm text-ink-muted dark:text-slate-400">
              {this.state.error?.message || "Something went wrong"}
            </p>
            <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
              Error sudah tercatat. Tim kami akan lihat.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="btn-primary"
              >
                Coba lagi
              </button>
              <Link href="/admin" className="btn-secondary">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Saat `hasError` benar, yang muncul di layar pengguna adalah halaman sederhana: lingkaran merah berisi tanda seru, judul "Terjadi kesalahan", pesan error (atau teks umum "Something went wrong"), dan catatan menenangkan "Error sudah tercatat. Tim kami akan lihat." Dua tombol tersedia: "Coba lagi" yang me-reset state `hasError` ke false (React merender ulang children — sering kali error hilang setelahnya), dan "Dashboard" yang membawa ke `/admin`. Selama tidak ada error, render normal mengembalikan `this.props.children` apa adanya.

### Konstruk yang Dipakai

- React class component (`Component<Props, State>`)
- Static method `getDerivedStateFromError`
- Lifecycle `componentDidCatch`
- Render bersyarat (`if (this.state.hasError)`)

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — pesan error ditampilkan sebagai teks React (ter-escape otomatis), bukan `dangerouslySetInnerHTML`, sehingga tidak ada jalur XSS. Catatan: menampilkan `error.message` mentah bisa membocorkan detail internal ke pengguna, tapi level aksesnya memang halaman user biasa dan pesannya hampir selalu generik.

---

## `lib/error-logger.ts` — Pencatat error ke database (pengganti Sentry)

### Potongan Kode Asli

```ts
// lib/error-logger.ts baris 30-53
export async function logError(input: ErrorLogInput): Promise<void> {
  const { message, level = "error", source = "frontend", stack = "", url = "", userId = "", metadata = {} } = input;

  // Always log to console regardless of environment
  const prefix = `[${level.toUpperCase()}][${source}]`;
  if (level === "critical") {
    console.error(prefix, message, metadata, stack);
  } else if (level === "error") {
    console.error(prefix, message, metadata);
  } else if (level === "warning") {
    console.warn(prefix, message, metadata);
  } else {
    console.log(prefix, message, metadata);
  }

  const payload = {
    level,
    message,
    source,
    stack: stack.slice(0, 2000), // limit stack trace length
    url: url.slice(0, 500),
    userId: userId.slice(0, 100),
    metadata: JSON.stringify(metadata).slice(0, 5000),
  };
```

### Penjelasan Cerita

File ini adalah sistem pelacakan error dalam aplikasi (pengganti Sentry untuk tahap dev/staging). Cerita saat error terjadi di frontend: `logError` dipanggil dengan objek yang berisi pesan, level (default `error`), sumber (default `frontend`), stack, URL, userId, dan metadata. Destructuring langsung memberi nilai default untuk yang kosong.

Semua error selalu masuk konsol browser dulu — dengan awalan `[LEVEL][SOURCE]` dan pemilihan metode: `console.error` untuk critical/error, `console.warn` untuk warning, `console.log` untuk sisanya. Jadi developer yang membuka DevTools langsung melihat jejaknya.

Kemudian `payload` dibentuk dengan batasan ketat: stack dipotong 2000 karakter, URL 500, userId 100, dan metadata di-`JSON.stringify` lalu dipotong 5000. Batasan ini mencegah database membengkak oleh stack trace raksasa.

```ts
// lib/error-logger.ts baris 55-78
  try {
    if (typeof window !== "undefined") {
      // Frontend — POST via fetch (fire-and-forget)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch("/api/log/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } else {
      // Server-side — import prisma directly
      const { prisma } = await import("@/lib/prisma");
      await prisma.appError.create({ data: payload }).catch((e: Error) => {
        console.error("[ErrorLogger] Failed to save to DB:", e.message);
      });
    }
  } catch (err) {
    // Silent fail — error logger tidak boleh bikin error baru
    console.debug("[ErrorLogger] Failed to send:", err);
  }
}
```

Pengiriman dibedakan lingkungan: di browser, `fetch` POST ke `/api/log/error` dengan `AbortController` yang membatalkan setelah 3 detik — *fire-and-forget*: halaman tidak menunggu; bila gagal, hanya log debug. Di server, prisma diimpor dinamis (`await import`) lalu `appError.create` menulis baris baru ke tabel `AppError`. Seluruhnya dibungkus `try/catch` dengan prinsip "error logger tidak boleh menciptakan error baru" — kegagalan pelaporan selalu ditelan diam-diam (debug log).

```ts
// lib/error-logger.ts baris 84-113
export function setupGlobalErrorLogger(): void {
  if (typeof window === "undefined") return;

  // Pastikan hanya di-setup sekali
  if ((window as unknown as Record<string, boolean>).__ERROR_LOGGER_SETUP) return;
  (window as unknown as Record<string, boolean>).__ERROR_LOGGER_SETUP = true;

  window.addEventListener("error", (event) => {
    logError({
      message: event.message || "Uncaught Error",
      level: "critical",
      source: "frontend",
      stack: event.error?.stack || "",
      url: window.location.href,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    logError({
      message: reason?.message || "Unhandled Promise Rejection",
      level: "error",
      source: "frontend",
      stack: reason?.stack || "",
      url: window.location.href,
    });
  });

  console.log("[ErrorLogger] Global error handlers registered");
}
```

`setupGlobalErrorLogger` dipasang sekali di saat app mount: penjaga `__ERROR_LOGGER_SETUP` di `window` memastikan listener tidak terpasang dua kali (double-registration = error tercatat dua kali). Listener `error` menangkap exception yang tidak tertangkap (level `critical`), listener `unhandledrejection` menangkap Promise yang gagal tanpa `catch` (level `error`). Setelahnya, setiap error tak terduga di browser otomatis masuk ke tabel `AppError`.

### Konstruk yang Dipakai

- Destructuring dengan default values
- `try/catch` + silent-fail pattern
- `AbortController` + `setTimeout` untuk timeout fetch
- Dynamic `import()` untuk prisma (server)
- Event listener global dengan guard sekali-pasang

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — payload dibatasi panjangnya, metadata di-JSON-stringify (bukan dikirim objek mentah), dan level/sumber dibatasi oleh union type. Satu catatan: endpoint `/api/log/error` harus dibatasi agar tidak bisa di-flood attacker; SpringHub melindunginya dengan `apiLimiter` dari `lib/rate-limit.ts` (60 request/menit).

---

## `lib/forms.ts` — Sumber tunggal 5 form lapangan + schema Zod

### Potongan Kode Asli

```ts
// lib/forms.ts baris 61-104 (struktur form pertama)
export const FORMS: FormSchema[] = [
  {
    slug: "spring-monitoring",
    title: "Survei Mata Air",
    legacyTitle: "Spring Survey",
    description:
      "Survei komprehensif kondisi mata air — identitas, lingkungan, pengukuran fisik.",
    pointsOnSubmit: 25,
    contributionType: "monitoring",
    fields: [
      { id: "A1_tanggal", label: "Tanggal Survei", type: "date", required: true },
      { id: "A2_nama_surveyor", label: "Nama Surveyor", type: "text", required: true },
      { id: "A3_wa", label: "Nomor WA", type: "phone", required: true },
      { id: "A4_geotag", label: "Geotag", type: "location", required: true },
      { id: "A5_cek_duplikat", label: "Cek Duplikat (radius 20m)", type: "select", required: true, options: ["Baru", "Kunjungan Ulang"] },
      { id: "A6_kode_spring", label: "Kode SpringHub (jika kunjungan ulang)", type: "text" },
      { id: "B1_nama", label: "Nama Lokal Mata Air", type: "text", required: true },
      { id: "B2_foto_1", label: "Foto 1: Titik Keluar Air (dekat)", type: "photo", required: true },
      { id: "B3_foto_2", label: "Foto 2: Lingkungan Sekitar (5-10 langkah)", type: "photo", required: true },
      { id: "B4_foto_3", label: "Foto 3: Arah Aliran Keluar", type: "photo", required: true },
      { id: "B5_jenis", label: "Jenis/Tipe Mata Air", type: "select", required: true, options: ["Memancar", "Genangan", "Lereng/Tebing", "Celah Batu", "Tidak Yakin"] },
      { id: "B6_aliran", label: "Aliran Air", type: "select", required: true, options: ["Stabil Sepanjang Tahun", "Berkurang saat Kemarau", "Naik Turun", "Kering Total", "Tidak Tahu"] },
      { id: "B7_debit_5th", label: "Perbandingan Debit 5 Tahun Lalu", type: "select", options: ["Bertambah", "Sama", "Berkurang", "Tidak Tahu"] },
      { id: "B8_tahun_kering", label: "Tahun Mulai Kering (jika kering total)", type: "number" },
      { id: "B9_dulu_untuk", label: "Dulu Air Dimanfaatkan Untuk", type: "text" },
      { id: "C1_warna", label: "Warna Air", type: "select", required: true, options: ["Bening", "Agak Keruh", "Keruh", "Kekuningan", "Kehijauan"] },
      { id: "C2_lahan", label: "Pemanfaatan Lahan (radius 50m)", type: "select", required: true, options: ["Pemukiman", "Pertanian", "Lahan Hijau", "Semak Belukar", "Air", "Industri", "Tambang", "Lahan Kosong"] },
      { id: "C3_tutupan", label: "Tutupan Lahan (radius 50m)", type: "select", required: true, options: ["Air", "Pepohonan", "Rerumputan", "Tanaman Pertanian", "Semak", "Area Terbangun", "Lahan Kosong", "Vegetasi Tergenang"] },
      { id: "C4_pemanfaatan", label: "Pemanfaatan Air Saat Ini", type: "multiselect", required: true, options: ["Irigasi", "Air Minum Warga", "Air Minum Desa Lain", "Mandi Cuci", "Kolam Ikan", "Wisata", "Cadangan Kemarau", "Adat", "Tidak Dimanfaatkan", "Tidak Tahu"] },
      { id: "C5_jumlah_kk", label: "Perkiraan Jumlah KK Pengguna", type: "select", options: ["<10 KK", "10-50 KK", "50-100 KK", "100-1000 KK", ">1000 KK", "Tidak Tahu"] },
      { id: "C6_ancaman", label: "Terlihat Ancaman?", type: "select", required: true, options: ["Tidak Ada", "Ya"] },
      { id: "C7_jenis_ancaman", label: "Jenis Ancaman", type: "multiselect", options: ["Pestisida", "Mandi di Sumber", "Toilet <11m", "Sampah Plastik", "Sumur Dalam", "Kandang Ternak", "Bangunan Beton", "Over-ekstraksi", "Tambang", "Lainnya"] },
      { id: "C8_sumber_info", label: "Sumber Informasi", type: "select", required: true, options: ["Observasi Sendiri", "Warga Sekitar", "Orang Tua/Desa", "Kelompok Masyarakat", "Aparat Desa"] },
      { id: "D1_ph", label: "pH Air", type: "text" },
      { id: "D2_suhu", label: "Suhu Air (°C)", type: "text" },
      { id: "D3_tds", label: "TDS (ppm)", type: "text" },
      { id: "D4_ec", label: "EC/DHL (µS/cm)", type: "text" },
      { id: "D5_debit_liter", label: "Debit Air (liter/detik)", type: "text" },
      { id: "D6_debit_visual", label: "Estimasi Debit Visual", type: "select", options: ["Menetes", "Kecil", "Sedang", "Besar", "Tidak Diukur"] },
      { id: "E1_cerita", label: "Cerita/Sejarah/Mitos (opsional)", type: "longtext" },
      { id: "E2_tindak_lanjut", label: "Bersedia Aksi Tindak Lanjut?", type: "select", required: true, options: ["Ya", "Belum Tahu", "Tidak"] },
      { id: "E3_aksi", label: "Aksi yang Dibutuhkan", type: "multiselect", options: ["Pembersihan Sedimen", "Penanaman Pohon", "Pembuatan Rorak", "Perlindungan Regulasi", "Lapor Desa/Dinas", "Lainnya"] },
    ],
  },
```

### Penjelasan Cerita

File ini adalah **sumber tunggal kebenaran** untuk semua form laporan lapangan. Komentar di bagian atasnya menegaskan konsumennya: renderer form di `/report/[slug]`, panel "Report Your Contribution" di peta, dan validasi Zod di `POST /api/reports`. Konvensi ID field mengikuti ekspor CSV Epicollect5 lama (A1, B6, C1, D5, ...) sehingga data historis tetap konsisten.

Cerita form pertama, "Survei Mata Air": 33 field tersusun dari A sampai E — identitas survei (tanggal, nama, WA, geotag, cek duplikat), deskripsi mata air (nama, 3 foto wajib, jenis, aliran, debit), lingkungan (warna air, pemanfaatan lahan, tutupan lahan, ancaman), pengukuran fisik (pH, suhu, TDS, EC, debit — semua tipe `text` agar surveyor bebas menulis "7,2" atau "tidak diukur"), hingga cerita lokal dan kesediaan aksi tindak lanjut. Field dengan `required: true` akan memaksa surveyor mengisinya; field opsional tanpa properti itu boleh dikosongkan.

Form lain di `FORMS` menyusul dengan pola yang sama: `spring-restoration` (12 field, poin 1000, "SATU FORM UNTUK SATU KEGIATAN"), `trench-development` (18 field, "SATU FORM = SATU RORAK", ukuran dalam cm), `tree-planting` (16 field, "SATU FORM = SATU POHON"), dan `seedling-stock` (17 field, 2 arah: stok tersedia / bibit dibutuhkan, dengan field bertipe `province`).

```ts
// lib/forms.ts baris 223-257 (schema Zod form survei)
const phoneRegex = /^(0[1-9]\d{8,11}|\+62\d{8,13})$/;

export const springMonitoringSchema = z.object({
  A1_tanggal: z.string().min(1, "Tanggal survei wajib diisi").max(500),
  A2_nama_surveyor: z.string().min(1, "Nama surveyor wajib diisi").max(500),
  A3_wa: z.string().min(1, "Nomor WA wajib diisi").max(500),
  A4_geotag_lat: z.string().max(500).optional(),
  A4_geotag_lng: z.string().max(500).optional(),
  A5_cek_duplikat: z.string().min(1, "Cek duplikat wajib diisi").max(500),
  A6_kode_spring: z.string().max(500).optional(),
  B1_nama: z.string().min(1, "Nama lokal mata air wajib diisi").max(500),
  B2_foto_1: z.any().optional(),
  B3_foto_2: z.any().optional(),
  B4_foto_3: z.any().optional(),
  B5_jenis: z.string().min(1, "Jenis mata air wajib diisi").max(500),
  B6_aliran: z.string().min(1, "Aliran air wajib diisi").max(500),
  B7_debit_5th: z.string().max(500).optional(),
  B8_tahun_kering: z.string().max(500).optional(),
  B9_dulu_untuk: z.string().max(500).optional(),
  C1_warna: z.string().min(1, "Warna air wajib diisi").max(500),
  C2_lahan: z.string().min(1, "Pemanfaatan lahan wajib diisi").max(500),
  C3_tutupan: z.string().min(1, "Tutupan lahan wajib diisi").max(500),
  C4_pemanfaatan: z.any().optional(),
  C5_jumlah_kk: z.string().max(500).optional(),
  C6_ancaman: z.string().min(1, "Ancaman wajib diisi").max(500),
  C7_jenis_ancaman: z.any().optional(),
  C8_sumber_info: z.string().min(1, "Sumber info wajib diisi").max(500),
  D1_ph: z.string().max(500).optional(),
  D2_suhu: z.string().max(500).optional(),
  D3_tds: z.string().max(500).optional(),
  D4_ec: z.string().max(500).optional(),
  D5_debit_liter: z.string().max(500).optional(),
  D6_debit_visual: z.string().max(500).optional(),
  E1_cerita: z.string().max(5000).optional(),
  E2_tindak_lanjut: z.string().min(1, "Tindak lanjut wajib diisi").max(500),
  E3_aksi: z.any().optional(),
});
```

Schema Zod untuk form survei menggambarkan pola seluruh file: setiap field wajib punya `.min(1, "pesan")` (menolak string kosong dengan pesan Bahasa Indonesia) dan **semua** field string dibatasi `.max(500)` (cerita 5000). Ini adalah pengaman Sesi 15 (hardening): payload raksasa tidak akan pernah sampai ke database. Field foto dan multiselect memakai `z.any().optional()` karena ditangani jalur lain. Empat schema lain mengikuti pola identik, dengan `z.coerce.number` untuk `S5_relawan`, `A_akurasi_gps`, dan `B3_jumlah`.

```ts
// lib/forms.ts baris 338-397
export const formSchemaMap: Record<string, z.ZodObject<z.ZodRawShape>> = {
  "spring-monitoring": springMonitoringSchema,
  "spring-restoration": springRestorationSchema,
  "trench-development": trenchDevelopmentSchema,
  "tree-planting": treePlantingSchema,
  "seedling-stock": seedlingStockSchema,
};

export function getFormSchema(slug: string): z.ZodObject<z.ZodRawShape> | undefined {
  return formSchemaMap[slug];
}

/** Points awarded per form slug (matches AGENTS.md). */
export const POINTS_MAP: Record<string, number> = {
  "spring-monitoring": 100,
  "spring-restoration": 1000,
  "trench-development": 500,
  "tree-planting": 100,
  "seedling-stock": 100,
};

export function getFormI18nKey(slug: string): string | undefined {
  const map: Record<string, string> = {
    "spring-monitoring": "form.title.monitoring",
    "spring-restoration": "form.title.restoration",
    "trench-development": "form.title.trench",
    "tree-planting": "form.title.planting",
    "seedling-stock": "form.title.seedling",
  };
  return map[slug];
}

export function getFormTitle(
  slug: string,
  fallbackTitle: string,
  t: (key: string, fallback?: string) => string
): string {
  const i18nKey = getFormI18nKey(slug);
  if (i18nKey) {
    const translated = t(i18nKey);
    // t() returns the key itself if no translation found — treat as miss
    if (translated && translated !== i18nKey) return translated;
  }
  return fallbackTitle;
}
```

Setelah schema, serangkaian peta kecil: `formSchemaMap` menghubungkan slug → schema (route `/api/reports` memakai `getFormSchema(slug)` untuk memvalidasi payload); `POINTS_MAP` menghubungkan slug → poin (dipakai `lib/points.ts` sebagai basis cadangan); `getFormI18nKey` menghubungkan slug → kunci terjemahan; `getFormTitle` mengambil judul terjemahan dengan trik cerdas — fungsi `t()` mengembalikan kunci itu sendiri saat terjemahan tidak ada, jadi jika `translated !== i18nKey`, terjemahan dianggap ditemukan; kalau tidak, `fallbackTitle` dipakai.

```ts
// lib/forms.ts baris 402-432
export async function fetchForm(slug: string): Promise<FormSchema | undefined> {
  try {
    const res = await fetch("/api/forms");
    const data = await res.json();
    const forms: { slug: string; title: string; description: string; pointsOnSubmit: number; contributionType: string; fields: { fieldId: string; label: string; labelEn?: string; type: string; required: boolean; placeholder: string; helpText: string; options: string; optionsEn?: string }[] }[] = data.forms ?? [];
    const found = forms.find((f: { slug: string }) => f.slug === slug);
    if (found) {
      return {
        slug: found.slug,
        title: found.title,
        description: found.description,
        pointsOnSubmit: found.pointsOnSubmit,
        contributionType: found.contributionType as FormSchema["contributionType"],
        fields: found.fields.map((ff) => ({
          id: ff.fieldId,
          label: ff.label,
          labelEn: ff.labelEn,
          type: ff.type as FormFieldType,
          required: ff.required,
          placeholder: ff.placeholder,
          help: ff.helpText,
          options: (() => { try { return JSON.parse(ff.options || "[]"); } catch { return []; } })(),
          optionsEn: (() => { try { return JSON.parse(ff.optionsEn || "[]"); } catch { return []; } })(),
        })),
      };
    }
  } catch {
    // API unreachable — fallback to static
  }
  return getForm(slug);
}
```

Bagian terakhir menutup cerita: `fetchForm` dan `fetchForms` mengambil definisi form dari API `/api/forms` (yang membaca database — admin bisa mengubah judul/poin/field di panel). Bila server database punya versi yang lebih baru, versi itu menang; field `options` dan `optionsEn` yang disimpan sebagai string JSON di database di-parse kembali menjadi array (dengan `try/catch` di dalam IIFE agar error parsing tidak merobohkan form). Bila API tidak bisa dihubungi (server down atau offline), `catch` yang senyap melempar kontrol ke `getForm(slug)` / `FORMS` — versi statis. Inilah strategi *database-first, static-fallback*: aplikasi tetap jalan walau DB mati.

### Konstruk yang Dipakai

- Array besar objek (`FORMS`)
- `z.object` dengan `.min/.max/.coerce/.any/.optional`
- `Record` sebagai lookup map
- IIFE `(() => { try { ... } catch { ... } })()` untuk JSON.parse yang aman
- `async/await` + `try/catch` dengan fallback

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — ini justru benteng input: semua 83 field string dibatasi `.max(500)` (cerita 5000), pesan error tidak membocorkan detail, field foto didelegasikan ke validasi MIME/ukuran di `lib/upload-photo.ts`, dan versi database tetap di-validasi lewat tipe yang sama. Yang perlu diingat: `fetchForm` memanggil `/api/forms` tanpa membawa CSRF — tapi itu GET publik, tidak mengubah state, jadi aman.

---

## `lib/geo.ts` — Rahasia koordinat: grid proteksi 5 km

### Potongan Kode Asli

```ts
// lib/geo.ts baris 1-34
// Location obfuscation: snap precise coordinates to a 5 km grid so any two
// springs within ~5 km of each other appear at the same public coordinate.
// This protects vulnerable spring sites from poachers / exploiters. Only
// authorised roles (admins, verified field volunteers) should ever see the
// precise lat/lng.

// 1° latitude ≈ 111 km. 5 km ≈ 0.045°. We use the same step for longitude;
// at Indonesia's latitudes (~-6° to -8°), the east-west distortion is < 1 %.
export const PROTECTION_GRID_DEG = 0.045; // ~5 km
export const PROTECTION_RADIUS_KM = 5;

export type LatLng = { lat: number; lng: number };

/** Snap a precise location to the centre of its 5 km protection cell. */
export function snapToProtectionGrid({ lat, lng }: LatLng): LatLng {
  return {
    lat: Math.round(lat / PROTECTION_GRID_DEG) * PROTECTION_GRID_DEG,
    lng: Math.round(lng / PROTECTION_GRID_DEG) * PROTECTION_GRID_DEG,
  };
}

/** Haversine distance in km between two points. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}
```

### Penjelasan Cerita

File ini adalah pengawal privasi lokasi mata air. Idenya sederhana tapi penting: mata air adalah sumber daya yang rentan dieksploitasi — koordinat persisnya tidak boleh bocor ke publik. Komentar di kepala file menjelaskan matematikanya: 1° lintang ≈ 111 km, jadi 5 km ≈ 0,045°; sel yang sama dipakai untuk bujur karena di lintang Indonesia (~-6° sampai -8°) distorsi timur-barat di bawah 1%.

`snapToProtectionGrid` adalah intinya: koordinat presisi dibagi 0,045, dibulatkan, lalu dikalikan lagi — hasilnya selalu titik tengah sel grid. Contoh: mata air di `-6.6447, 106.7892` → `-6.6447 / 0.045 = -147.66` → dibulatkan `-148` → `-148 × 0.045 = -6.66`. Semua mata air dalam radius ~5 km dari titik itu akan tampil di koordinat yang sama persis — pemeta dari luar tidak bisa membedakan satu mata air dari mata air lain. `distanceKm` melengkapi dengan rumus Haversine: menghitung jarak sebenarnya antara dua titik di permukaan bola bumi — dipakai untuk fitur "cek duplikat radius 20m" dan pengukuran jarak sesi offline.

```ts
// lib/geo.ts baris 41-47
export function visibleLocation(
  precise: LatLng,
  role: "public" | "volunteer" | "admin"
): LatLng {
  if (role === "admin") return precise;
  return snapToProtectionGrid(precise);
}
```

`visibleLocation` adalah pengambil keputusan akhir: jika pemirsa berperan `admin`, koordinat presisi diberikan apa adanya; semua peran lain (termasuk volunteer) menerima hasil snap. Di aplikasi, fungsi ini dipanggil server-side sebelum data dikirim ke API publik — sehingga koordinat persis tidak pernah meninggalkan server kecuali untuk admin.

### Konstruk yang Dipakai

- `Math.round` untuk snapping grid
- Rumus Haversine (sin, cos, asin, sqrt)
- Arrow function `toRad`
- Ternary/if untuk kontrol peran

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — justru sebaliknya, file ini adalah penutup kerentanan terbesar (bocornya lokasi mata air). Aturan mainnya jelas: `visibleLocation` dieksekusi server-side, sehingga client tidak bisa meminta koordinat presisi; satu-satunya jalur adalah admin yang terverifikasi. Catatan: grid 5 km masih bisa di-serang *differential attack* oleh orang yang memetakan banyak sel secara sistematis — tapi itu di luar kendali kode dan merupakan trade-off yang diterima oleh desain.

---

## `lib/guest.ts` — Identitas pengunjung anonim via cookie

### Potongan Kode Asli

```ts
// lib/guest.ts baris 5-24 (seluruh file)
export function getGuestId(): string {
  const cookieStore = cookies();
  let guestId = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestId) {
    guestId = crypto.randomUUID();
    cookieStore.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days (reduced from 30)
      path: "/",
    });
  }
  return guestId;
}

export function getExistingGuestId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}
```

### Penjelasan Cerita

SpringHub mengizinkan pengunjung anonim melaporkan kondisi mata air tanpa mendaftar — tetapi laporan itu harus bisa dikaitkan kembali ke pelapor yang sama untuk mencegah spam dan memungkinkan klaim akun. Ceritanya: saat user anonim pertama kali memuat halaman form, `getGuestId()` dipanggil. Cookie `guest_session_id` dibaca; jika kosong, UUID baru dibuat dengan `crypto.randomUUID()` dan disimpan di cookie dengan atribut `httpOnly`, `secure` (hanya di produksi), `sameSite: "strict"`, dan umur 7 hari. UUID itu dikembalikan dan dijalankan ke seluruh permintaan selanjutnya — termasuk disisipkan ke payload laporan sebagai `guestId`.

Laporan yang dibuat anonim tersimpan dengan `guestId` di database. Bila pengunjung itu kemudian mendaftar, laporan-laporannya bisa "di-claim" ke akun baru (pindah `guestId` → `userId`). Dan bila tidak pernah kembali dalam 30 hari, cron `cleanupGuestReports` di `lib/cleanup.ts` akan membersihkannya. `getExistingGuestId` adalah versi baca-saja — dipakai saat kode hanya ingin tahu identitas tanpa membuat cookie baru.

### Konstruk yang Dipakai

- `crypto.randomUUID()` (Web Crypto)
- `cookies()` dari `next/headers`
- Ternary untuk atribut secure berbasis environment

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — UUID acak sulit ditebak, cookie `httpOnly` + `sameSite: "strict"` menahan CSRF/cookie-jacking, dan guest id tidak pernah dipakai untuk otorisasi apa pun (laporan guest hanya bisa dilihat admin). Laporan guest dibatasi oleh rate limiter (5/hari) dan masa hidup 30 hari.

---

## `lib/health-score.ts` — Mesin skor kesehatan mata air (0-100)

### Potongan Kode Asli

```ts
// lib/health-score.ts baris 15-45
export function computeSpringHealth(fieldData: Record<string, unknown>): HealthResult {
  const params: Record<string, number> = {};

  // C1_warna: Bening=100, Agak Keruh=60, Keruh=30, Kekuningan/Kehijauan=20
  const warna = (fieldData.C1_warna as string) || "";
  if (warna === "Bening") params.warna = 100;
  else if (warna === "Agak Keruh") params.warna = 60;
  else if (warna === "Keruh") params.warna = 30;
  else if (warna === "Kekuningan" || warna === "Kehijauan") params.warna = 20;

  // B6_aliran
  const aliran = (fieldData.B6_aliran as string) || "";
  if (aliran === "Stabil Sepanjang Tahun") params.aliran = 100;
  else if (aliran === "Berkurang saat Kemarau") params.aliran = 60;
  else if (aliran === "Naik Turun") params.aliran = 40;
  else if (aliran === "Kering Total") params.aliran = 0;
  else if (aliran === "Tidak Tahu") params.aliran = 50;

  // B7_debit_5th
  const debit5 = (fieldData.B7_debit_5th as string) || "";
  if (debit5 === "Bertambah") params.debit5 = 100;
  else if (debit5 === "Sama") params.debit5 = 80;
  else if (debit5 === "Berkurang") params.debit5 = 30;

  // D1_ph
  const ph = parseFloat((fieldData.D1_ph as string) || "");
  if (!isNaN(ph)) {
    if (ph >= 6.5 && ph <= 8.5) params.ph = 100;
    else if (ph >= 6 || ph <= 9) params.ph = 60;
    else params.ph = 30;
  }
```

### Penjelasan Cerita

Saat laporan survei mata air masuk, `computeSpringHealth` menghitung skor 0-100 dari `fieldData`. Ceritanya: sebuah objek `params` kosong disiapkan, lalu setiap parameter fisik dicocokkan. Warna air Bening → 100, Agak Keruh → 60, Keruh → 30, Kekuningan/Kehijauan → 20 (kuning/hijau menandakan kontaminasi). Aliran "Stabil Sepanjang Tahun" → 100, turun bertahap ke "Kering Total" → 0; "Tidak Tahu" diberi nilai netral 50. Perbandingan debit 5 tahun lalu: Bertambah → 100, Sama → 80, Berkurang → 30. Parameter numerik (pH, suhu, TDS, debit) di-`parseFloat`; bila bukan angka (`isNaN`), parameter itu dilewati tanpa skor.

```ts
// lib/health-score.ts baris 71-119
  // C6_ancaman
  const ancaman = (fieldData.C6_ancaman as string) || "";
  if (ancaman === "Tidak Ada") params.ancaman = 100;
  else if (ancaman === "Ya") {
    const jenis = fieldData.C7_jenis_ancaman;
    const count = Array.isArray(jenis) ? jenis.length : 0;
    params.ancaman = Math.max(20, 80 - count * 10);
  }

  // Calculate weighted score
  const weights: Record<string, number> = {
    warna: 20,
    aliran: 20,
    debit5: 15,
    ph: 10,
    suhu: 5,
    tds: 5,
    debit: 10,
    ancaman: 15,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (params[key] !== undefined) {
      weightedSum += params[key] * weight;
      totalWeight += weight;
    }
  }

  // Jika aliran "Kering Total", langsung kritis
  if (aliran === "Kering Total") {
    return { score: 10, status: "kritis" };
  }

  if (totalWeight === 0) {
    return { score: 0, status: "kritis" };
  }

  const score = Math.round(weightedSum / totalWeight);

  let status: HealthResult["status"] = "berat";
  if (score >= 80) status = "sehat";
  else if (score >= 60) status = "ringan";
  else if (score >= 30) status = "berat";
  else status = "kritis";

  return { score, status };
}
```

Parameter ancaman memakai logika menarik: jika tidak ada ancaman → 100; jika ada, jumlah jenis ancaman (`C7_jenis_ancaman`, array) dihitung lalu skor dihitung `80 - count * 10`, dengan batas bawah `Math.max(20, ...)` — satu ancaman = 70, dua = 60, lima atau lebih = 20 (tidak pernah nol, karena "kritis mutlak" sudah ditangani kasus khusus lain).

Skor akhir dihitung sebagai **rata-rata tertimbang**: bobot per parameter (warna 20, aliran 20, ancaman 15, debit5 15, pH 10, debit 10, suhu 5, TDS 5), dan hanya parameter yang terisi yang masuk hitungan (jika `params[key] !== undefined`, bobotnya ditambahkan ke `totalWeight`). Ada dua jalan pintas: jika aliran "Kering Total", skor langsung 10 dengan status `kritis` (tidak peduli parameter lain); jika tidak ada satu pun parameter terisi (`totalWeight === 0`), hasilnya 0/kritis. Terakhir skor dirata-rata, dibulatkan, dan dipetakan: ≥80 `sehat`, ≥60 `ringan`, ≥30 `berat`, sisanya `kritis`. Hasil `{ score, status }` inilah yang tampil di kartu kesehatan mata air di peta dan dashboard — lencana hijau untuk sehat, merah untuk kritis.

### Konstruk yang Dipakai

- Rantai `if/else if` untuk pemetaan nilai kualitatif
- `parseFloat` + `isNaN` guard
- `Array.isArray` untuk deteksi tipe
- Loop `Object.entries` untuk agregasi bobot
- `Math.round`, `Math.max`

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — semua nilai berasal dari string yang sudah divalidasi schema Zod (`.max(500)`), `parseFloat` menolak masukan non-numerik, dan tidak ada nilai yang dieksekusi sebagai kode. Kekhawatiran kecil: bobot adalah angka tetap yang bisa diakali (surveyor bisa memilih jawaban "terbaik") — itu masalah akurasi data lapangan, bukan keamanan.
---

## `lib/i18n.tsx` — Penerjemah ID/EN dengan cookie preferensi

### Potongan Kode Asli

```ts
// lib/i18n.tsx baris 32-57
function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("locale="))
    ?.split("=")[1];
  if (cookie === "id" || cookie === "en") return cookie;
  const lang = navigator.language?.slice(0, 2);
  return lang === "id" ? "id" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initial = getInitialLocale();
    setLocaleState(initial);
    setLoading(false);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setLoading(false);
    document.cookie = `locale=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
  }, []);
```

### Penjelasan Cerita

Aplikasi dua bahasa (Indonesia dan Inggris). Saat halaman dimuat, `getInitialLocale` memutuskan bahasa awal dengan urutan prioritas: cookie `locale` (dibaca dari `document.cookie`, di-split per baris `; `) → jika nilainya `id` atau `en`, langsung dipakai; jika tidak ada, bahasa browser (`navigator.language` — dua huruf pertama) dipakai, dengan `"id"` → Indonesia dan lainnya → Inggris. Di server (SSR, `document` undefined), default `"en"` agar render awal konsisten.

`I18nProvider` menyimpan locale di state dengan `loading` awal `true` (mencegah flash bahasa yang salah). Setelah mount, locale awal ditentukan dan `loading` dimatikan. `setLocale` — dibungkus `useCallback` agar stabil — memperbarui state **dan** menulis cookie `locale=...` berumur 365 hari, sehingga pilihan pengguna diingat lintas sesi.

```ts
// lib/i18n.tsx baris 59-87
  const interpolate = useCallback(
    (str: string, params?: I18nParams) => {
      if (!params) return str;
      return str.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
    },
    []
  );

  const t = useCallback(
    (key: string, paramsOrFallback?: I18nParams | string) => {
      const msgs = allMessages[locale] ?? {};
      const raw = msgs[key];
      if (raw !== undefined) {
        if (typeof paramsOrFallback === "object" && paramsOrFallback !== null) {
          return interpolate(raw, paramsOrFallback);
        }
        return raw;
      }
      return typeof paramsOrFallback === "string" ? paramsOrFallback : key;
    },
    [locale, interpolate]
  );
```

Fungsi `interpolate` menggantikan placeholder `{nama}` dalam string terjemahan dengan nilai dari params — misal `"Halo, {nama}!"` + `{ nama: "Budi" }` → `"Halo, Budi!"`; placeholder yang tidak punya pasangan tetap tertulis apa adanya. Fungsi `t(key, paramsOrFallback)` adalah jembatan utama: cari pesan di `allMessages[locale]`; jika ditemukan dan argumen kedua adalah objek, lakukan interpolasi; jika ditemukan tanpa objek, kembalikan mentah; jika tidak ditemukan, kembalikan argumen kedua bila berupa string (fallback) atau kunci itu sendiri (agar developer segera tahu key yang hilang). Konteks diekspos lewat `useI18n()` sehingga komponen mana pun memanggil `t("form.title.monitoring")` dan otomatis berubah bahasa saat locale berganti.

### Konstruk yang Dipakai

- `useState`, `useEffect`, `useCallback`, `useContext`, `createContext`
- Regex `/\{(\w+)\}/g` + `String.replace` dengan callback
- `document.cookie` untuk persistensi

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — pesan terjemahan berasal dari file JSON statis yang dikompilasi bersama aplikasi (bukan input user), dan `interpolate` mengisi nilai sebagai teks polos di React (ter-escape otomatis). Cookienya hanya berisi `id`/`en` (di-validasi saat baca), jadi tidak ada injeksi lewat cookie.

---

## `lib/jwt.ts` — Rotasi kunci JWT tanpa mengusir pengguna lama

### Potongan Kode Asli

```ts
// lib/jwt.ts baris 16-29
export function getJwtSecrets(): { current: Uint8Array; previous: Uint8Array | null } {
  const current = process.env.JWT_SECRET;
  if (!current) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
      "Generate one with: openssl rand -base64 32"
    );
  }
  const previous = process.env.JWT_SECRET_PREVIOUS;
  return {
    current: toBytes(current),
    previous: previous ? toBytes(previous) : null,
  };
}

// ——— Backward compat ——— //
export function getJwtSecret(): Uint8Array {
  return getJwtSecrets().current;
}
```

### Penjelasan Cerita

Keamanan kriptografi mengharuskan rahasia signing diganti berkala — tetapi jika kunci berubah, semua sesi lama langsung tidak valid dan ribuan pengguna harus login ulang. File ini menyelesaikan dilema itu dengan *grace period* dua kunci.

Cerita rotasinya: admin mengganti `JWT_SECRET` di `.env` dan memindahkan kunci lama ke `JWT_SECRET_PREVIOUS`. `getJwtSecrets()` membaca keduanya: `current` diwajibkan (bila hilang, error dilempar dengan instruksi `openssl rand -base64 32`), `previous` opsional. Keduanya diubah ke `Uint8Array` lewat `toBytes` (TextEncoder) karena library `jose` bekerja dengan byte, bukan string. `getJwtSecret` versi kompatibel mundur mengembalikan kunci saat ini saja — dipakai modul lama seperti `lib/auth.ts` dan `lib/csrf.ts` untuk menandatangani token baru.

```ts
// lib/jwt.ts baris 40-60
export async function verifyJwtWithRotation<T>(
  token: string,
  verifyFn: (secret: Uint8Array) => Promise<T>
): Promise<{ payload: T; keyUsed: "current" | "previous" } | null> {
  const { current, previous } = getJwtSecrets();

  try {
    const payload = await verifyFn(current);
    return { payload, keyUsed: "current" };
  } catch {
    if (previous) {
      try {
        const payload = await verifyFn(previous);
        return { payload, keyUsed: "previous" };
      } catch {
        return null;
      }
    }
    return null;
  }
}
```

`verifyJwtWithRotation` menerima token dan fungsi verifier. Urutannya: coba kunci `current` dulu; jika berhasil, kembalikan payload dengan keterangan `keyUsed: "current"` — pengguna lama yang tokennya ditandatangani dengan kunci sebelumnya akan masuk cabang `catch`, lalu dicoba dengan `previous`; jika itu berhasil, sesi tetap diterima (walau token itu tidak akan ditandatangani lagi dengan kunci lama). Bila kedua kunci gagal, `null` — sesi ditolak. Hasilnya: rotasi kunci berjalan mulus, sesi yang masih hidup tetap valid sampai kedaluwarsa, dan `getSession` di `lib/auth.ts` memakai fungsi ini sebagai gerbang pertama verifikasinya.

### Konstruk yang Dipakai

- `try/catch` bertingkat (current → previous)
- `TextEncoder` untuk konversi byte
- `throw new Error` untuk kegagalan konfigurasi
- Generic function `<T>`

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — nilai kunci tidak pernah di-log atau diekspor; hanya byte di memori. Pola *dual-key* ini justru mengurangi risiko operasional (rotasi tidak memutus semua sesi). Catatan: umur `JWT_SECRET_PREVIOUS` harus dibatasi secara operasional — setelah grace period, hapus dari env.

---

## `lib/logger.ts` — Logger pino dengan redaksi otomatis data sensitif

### Potongan Kode Asli

```ts
// lib/logger.ts baris 1-28 (seluruh file)
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "req.headers.x-api-key",
      "req.headers.x-callback-token",
      "body.password",
      "body.passwordHash",
      "body.token",
      "body.email",
      "body.phone",
      "body.donorEmail",
      "body.donorPhone",
      "body.apiKey",
    ],
    censor: "[REDACTED]",
  },
});

export default logger;
```

### Penjelasan Cerita

Logger tunggal ini dipakai di hampir semua modul (`audit.ts`, `email.ts`, `cleanup.ts`, dan lain-lain). Saat modul dimuat, pino dikonfigurasi: level dari `LOG_LEVEL` (default `info`), dan transport menulis ke stdout (`destination: 1`) dalam mode non-produksi agar formatnya cantik untuk terminal — di produksi, transport default pino dipakai (JSON lines, efisien untuk dikumpulkan sistem log).

Kekuatan file ini ada di blok `redact`: daftar jalur yang otomatis disensor menjadi `"[REDACTED]"`. Bila objek log mengandung cookie, authorization header, API key, callback token, password, passwordHash, token, email, nomor HP, atau donorEmail/donorPhone — nilainya diganti sebelum ditulis. Ini perlindungan terakhir: walau developer lupa menyaring data, logger menolak menulis rahasia ke file log. Audit log yang bocor pun tidak akan pernah mengandung kredensial.

### Konstruk yang Dipakai

- Konfigurasi library eksternal (`pino`)
- Ternary untuk konfigurasi transport per environment
- Daftar `redact.paths`

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — redaksi otomatis mencegah *credential leak* ke log; sensor berlaku untuk seluruh hierarki objek log (jalur bertitik), termasuk objek yang disarangkan. Satu catatan: `redact` bekerja pada objek pino — string log yang dibuat dengan template literal manual (misal `logger.info("token=" + token)`) tidak ter-sensor, tapi konvensi kode SpringHub selalu memakai objek.

---

## `lib/offline-db.ts` — Gudang IndexedDB mode offline (10 object stores)

### Potongan Kode Asli

```ts
// lib/offline-db.ts baris 26-39
const DB_NAME = "springhub-offline";
const DB_VERSION = 5;

export type MarkerType = "spring" | "tree" | "trench" | "seedling";

export type OfflineTrackingPoint = {
  id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  markerType: MarkerType | null; // null = regular GPS tracking point
  name: string | null; // optional name (for markers)
  recordedAt: number; // Date.now()
};

export type OfflineConfig = {
  id: "session-config";
  selectedForms: string[];
  radiusKm: number;
  qualityLevel: "ringan" | "sedang" | "lengkap";
  totalDistance: number; // meters
  startedAt: number;
  centerLat?: number; // center point from setup map
  centerLng?: number; // center point from setup map
};
```

### Penjelasan Cerita

File terbesar di `lib/` ini adalah jantung fitur *Offline Survey Mode* — relawan di gunung tanpa sinyal tetap bisa bekerja. Semua data disimpan di IndexedDB bernama `springhub-offline` versi 5, tersebar di 10 *object stores*: `pending-reports` (laporan offline), `tracking-points` (jejak GPS tiap ~5m), `photo-blobs` (foto sebagai Blob), `form-definitions` (cache definisi form), `tile-manifest` + `tile-blobs` (cache tile peta tanpa Service Worker), `offline-config` (konfigurasi sesi survey), `draft-reports` (draft auto-save 30 detik), `submission-queue` (antrean pengiriman dengan retry + backoff), dan `session-cache` (sesi pengguna untuk PWA). Tipe-tipe di atas mendefinisikan bentuk data masing-masing — perhatikan `OfflineTrackingPoint` yang menyimpan `markerType` (spring/tree/trench/seedling) sehingga penanda di peta bisa dibedakan dari titik GPS biasa, dan `OfflineConfig` dengan `centerLat/centerLng` dari peta setup.

```ts
// lib/offline-db.ts baris 211-234
/** Cap total attempts — setelah ini item berhenti dicoba otomatis, tampil di UI */
export const MAX_FAILED_ATTEMPTS = 20;
/** Minimal jarak antar retry (5 menit) — hemat baterai & tidak spam server */
export const RETRY_BACKOFF_MS = 5 * 60 * 1000;

/** Backoff eksponensial: 5m → 10m → 20m → 40m → 1h (cap) */
export function computeBackoffMs(failureCount: number): number {
  const step = Math.max(0, failureCount - 1);
  return Math.min(RETRY_BACKOFF_MS * Math.pow(2, Math.min(step, 4)), 60 * 60 * 1000);
}

/** UUID unik untuk idempotency — dibuat SEKALI per laporan, dipakai terus antar retry */
export function generateCorrelationId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fallback untuk browser lawas / non-secure context
  }
  return `corr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
```

Kebijakan *retry* dijelaskan oleh dua konstanta: maksimal 20 kali percobaan dan jarak minimum antar retry 5 menit. `computeBackoffMs` menghitung backoff eksponensial: percobaan gagal ke-1 → 5 menit, ke-2 → 10 menit, ke-3 → 20 menit, ke-4 → 40 menit, lalu di-*cap* 1 jam. Tujuannya: menghemat baterai HP dan tidak mengebom server. `generateCorrelationId` membuat UUID idempotency — dibuat **sekali** per laporan dan dibawa terus antar retry, sehingga server bisa mendeteksi duplikat (dedupe via `clientCorrelationId`). Bila `crypto.randomUUID` tidak tersedia (browser lawas), fallback berbasis waktu + angka acak dipakai.

```ts
// lib/offline-db.ts baris 238-269
let dbPromise: Promise<IDBDatabase> | null = null;

function invalidateDB() {
  dbPromise = null;
}

/**
 * Buka DB (singleton). Operasi berikutnya memakai koneksi yang sama —
 * tidak ada db.close() di tengah transaksi.
 */
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === "undefined") {
    dbPromise = Promise.reject(new Error("IndexedDB tidak tersedia"));
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // ── Initial schema (v1) ──
      if (oldVersion < 1) {
        // pending-reports
        if (!db.objectStoreNames.contains("pending-reports")) {
          const store = db.createObjectStore("pending-reports", { keyPath: "id" });
          store.createIndex("by-created", "createdAt", { unique: false });
        }

        // tracking-points (v1 indexes — isSpringMarker / by-marker)
        if (!db.objectStoreNames.contains("tracking-points")) {
          const store = db.createObjectStore("tracking-points", { keyPath: "id" });
          store.createIndex("by-recorded", "recordedAt", { unique: false });
          store.createIndex("by-marker", "isSpringMarker", { unique: false });
        }

        // photo-blobs
        if (!db.objectStoreNames.contains("photo-blobs")) {
          const store = db.createObjectStore("photo-blobs", { keyPath: "id" });
          store.createIndex("by-report", "reportId", { unique: false });
        }

        // form-definitions
        if (!db.objectStoreNames.contains("form-definitions")) {
          const store = db.createObjectStore("form-definitions", { keyPath: "slug" });
          store.createIndex("by-slug", "slug", { unique: true });
        }

        // tile-manifest
        if (!db.objectStoreNames.contains("tile-manifest")) {
          db.createObjectStore("tile-manifest", { keyPath: "url" });
        }
      }
```

Manajemen koneksi adalah cerita menarik. `openDB` menggunakan *singleton promise*: panggilan pertama membuka koneksi `indexedDB.open("springhub-offline", 5)`; jika `indexedDB` tidak tersedia (browser kuno), promise ditolak dengan pesan jelas. Event `onupgradeneeded` menjalankan migrasi bertahap versi 1 → 5: setiap blok `if (oldVersion < N)` membuat store yang belum ada, tanpa menghapus data store lain — ini *selective migration*. Perhatikan blok v2 yang mengganti indeks `by-marker` (isSpringMarker) dengan `by-marker-type` (markerType): `store.deleteIndex("by-marker")` lalu `createIndex("by-marker-type", ...)` — kompatibilitas ke depan saat nama field berubah (sesi 10 "Tracking Field Mismatch"). Begitu koneksi sukses, event `onversionchange` (tab lain membuka versi baru) menutup koneksi lama dan me-reset promise, sementara `onblocked` diam menunggu tab lain.

```ts
// lib/offline-db.ts baris 397-456
async function runInStore<Store extends StoreNames, R>(
  storeName: Store,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<R>,
  resolveOn: "request" | "complete"
): Promise<R> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const db = await openDB();
    try {
      return await new Promise<R>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = run(store);

        let settled = false;
        const fail = (err: unknown) => {
          if (settled) return;
          settled = true;
          reject(err instanceof Error ? err : new Error(String(err)));
        };

        req.onerror = () => fail(req.error);
        if (resolveOn === "request") {
          req.onsuccess = () => {
            if (settled) return;
            settled = true;
            resolve(req.result);
          };
        }
        tx.onerror = () => fail(tx.error);
        tx.onabort = () => fail(tx.error ?? new Error("Transaksi dibatalkan"));
        if (resolveOn === "complete") {
          tx.oncomplete = () => {
            if (settled) return;
            settled = true;
            resolve(req.result);
          };
        }
      });
    } catch (err) {
      // Koneksi tertutup di tengah jalan (teardown/versionchange di tab lain)
      // → buka koneksi baru dan coba sekali lagi.
      teardownDB();
      if (attempt === 1) throw err;
    }
  }
  throw new Error(`Operasi IndexedDB gagal untuk store ${storeName}`);
}

// Transaksi readwrite dengan scope sama TIDAK boleh overlap pada satu koneksi.
// Antrian per-store memastikan write dijalankan serial, tanpa interleaving.
const writeQueues = new Map<string, Promise<unknown>>();

function enqueueWrite(storeName: string, op: () => Promise<void>): Promise<void> {
  const prev = writeQueues.get(storeName) ?? Promise.resolve();
  const next = prev.then(op, op);
  // Jaga rantai tetap hidup walau op gagal (capai error di caller)
  writeQueues.set(storeName, next.then(() => undefined, () => undefined));
  return next;
}
```

`runInStore` adalah *transaction runner* yang menangani dua mode penyelesaian: `"request"` (resolve saat request sukses, untuk read) dan `"complete"` (resolve saat **transaksi** selesai, untuk write — menjamin commit benar-benar selesai sebelum menganggap sukses). Penjaga `settled` memastikan error/resolve hanya terjadi sekali; `tx.onabort` menolak bila transaksi dibatalkan. Bila koneksi mati di tengah jalan (tab lain meng-upgrade versi), `teardownDB()` dipanggil dan satu percobaan ulang dilakukan — dua percobaan total, lalu error dilempar.

Di atasnya, `enqueueWrite` membangun **antrian per store**: karena transaksi readwrite dengan scope sama tidak boleh tumpang-tindih pada satu koneksi, setiap operasi tulis dirantai ke promise sebelumnya (`prev.then(op, op)`), dan rantainya dijaga tetap hidup walau satu operasi gagal — kesalahan tetap diteruskan ke pemanggil.

```ts
// lib/offline-db.ts baris 807-827
  async markQueuedAttempted(
    id: string,
    opts: { error?: string; permanent?: boolean } = {}
  ): Promise<void> {
    const item = await getItem("submission-queue", id);
    if (!item) return;
    const now = Date.now();
    const failureCount = (item.failureCount ?? 0) + 1;
    const next: QueuedSubmission = {
      ...item,
      retryCount: (item.retryCount ?? 0) + 1,
      failureCount,
      attemptedAt: now,
      lastError: opts.error ?? item.lastError,
      nextRetryAt: now + computeBackoffMs(failureCount),
      state:
        opts.permanent || failureCount >= MAX_FAILED_ATTEMPTS ? "failed" : ("queued" as const),
    };
    if (opts.permanent || item.permanentError) next.permanentError = true;
    await addItem("submission-queue", next);
  }
```

QueueWorker memanggil `markQueuedAttempted` setiap pengiriman gagal. Ceritanya: item antrean dibaca; `failureCount` dinaikkan; objek baru dibuat dengan `retryCount+1`, `attemptedAt` sekarang, `lastError` (pesan error terakhir), dan `nextRetryAt = now + backoff` (berdasarkan jumlah kegagalan — ini yang membuat QueueWorker menunggu 5 menit, 10 menit, dst.). Jika error bersifat permanen (4xx validasi — tidak akan pernah berhasil) atau sudah 20 kali gagal, `state` diubah menjadi `"failed"` — item tidak dihapus, melainkan muncul di UI "perlu perbaikan". `permanentError` ditandai agar `getRetryableQueued` tidak pernah mengambilnya lagi.

```ts
// lib/offline-db.ts baris 873-905
  async clearAllForUser() {
    await clearStore("session-cache");
    await clearStore("pending-reports");
    await clearStore("photo-blobs");
    await clearStore("submission-queue");
    await clearStore("draft-reports");
    await clearStore("tracking-points");
    await deleteItem("offline-config", "session-config");
    try {
      localStorage.removeItem("springhub_sync_status");
    } catch {
      // ignore
    }
  },

  async clearSessionData() {
    await clearStore("tracking-points");
    await clearStore("tile-manifest");
    await clearStore("tile-blobs");
    await deleteItem("offline-config", "session-config");
    await deleteItem("session-cache", "user-session");
  },
```

Tiga fungsi pembersihan menunjukkan kebijakan data yang hati-hati. `clearAllForUser` (dipanggil saat LOGOUT): hapus semua data **user** — session cache, laporan, foto, antrean, draft, tracking, konfigurasi survey — tapi **menjaga** cache global (form-definitions, tile-manifest, tile-blobs) karena itu milik perangkat, bukan user. `clearSessionData` (dipanggil setelah exit-sync): hapus sesi survey (tracking, tile, konfigurasi, session cache) tapi **menjaga** pending-reports dan photo-blobs — kalau ada yang gagal terkirim, QueueWorker-lah yang mencoba lagi; data user tidak pernah dibuang. `clearAll` (halaman "reset penuh") membersihkan segalanya kecuali `offline-config`/`session-cache` yang dihapus lewat `deleteItem`. `migrateOnVersionBump` menjalankan migrasi selektif dari `localStorage` ("springhub_store_versions") — menggantikan `indexedDB.deleteDatabase()` yang merusak semua data.

### Konstruk yang Dipakai

- TypeScript types untuk seluruh struktur data
- Singleton promise (`dbPromise`)
- Event handlers IndexedDB (`onupgradeneeded`, `onsuccess`, `onerror`, `onblocked`, `onversionchange`)
- `new Promise` manual dengan guard `settled`
- Rantai promise untuk antrian tulis (`writeQueues`)
- `Math.pow`, `Math.min`, `Math.max` untuk backoff
- Objek publik besar `offlineDB` dengan method per store

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — data di IndexedDB hanya bisa dibaca oleh JavaScript aplikasi sendiri (bukan situs lain; origin policy), CSRF token yang disimpan di `PendingReport` tidak pernah di-log, dan sinkronisasi memakai idempotency key sehingga duplikasi server dihindari. Catatan: IndexedDB tidak dienkripsi — jika perangkat dicuri, data bisa dibaca lewat DevTools; karena itu token sesi di-cache hanya untuk fallback PWA dan tetap tunduk pada masa berlaku 7 hari di `lib/session-cache.ts`.

---

## `lib/photo-url.ts` — Pembangun URL foto yang hati-hati

### Potongan Kode Asli

```ts
// lib/photo-url.ts baris 15-44
const PATH_REGEX = /^[a-zA-Z0-9_\-/]+\.[a-zA-Z0-9]+$/;

function isValidPath(storagePath: string): boolean {
  // Label strings like "Tree Planting Maron 1" don't have a file extension
  // Valid paths have "reports/" prefix and a file extension like .jpg
  return storagePath.startsWith("http://") ||
         storagePath.startsWith("https://") ||
         (storagePath.includes("/") && PATH_REGEX.test(storagePath.split("/").pop() || ""));
}

export function buildPhotoUrl(storagePath: string): string {
  if (!storagePath || !isValidPath(storagePath)) return "";
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  const prefix = getPhotoUrlPrefix();
  return `${prefix}${storagePath}`;
}

/**
 * Build photo URLs for an array of photo objects.
 */
export function buildPhotoUrls<T extends { storagePath: string }>(
  photos: T[]
): (T & { url: string })[] {
  return photos.map((p) => ({
    ...p,
    url: buildPhotoUrl(p.storagePath),
  }));
}
```

### Penjelasan Cerita

Setiap kali daftar laporan dirender, `buildPhotoUrls` dipanggil untuk mengubah `storagePath` (misal `reports/1723456789-ab12cd.jpg`) menjadi URL lengkap. Cerita per path-nya: `isValidPath` memeriksa apakah string layak dianggap path foto — harus diawali `http://`/`https://` (foto dari sumber eksternal), atau berisi `/` dengan bagian terakhir (nama file) cocok regex `^[a-zA-Z0-9_\-/]+\.[a-zA-Z0-9]+$` (karakter aman + titik + ekstensi alfanumerik). String semacam "Tree Planting Maron 1" (label, bukan path) ditolak — `buildPhotoUrl` mengembalikan `""`, dan komponen `<img>` menampilkan placeholder alih-alih URL rusak.

Bila path valid: jika sudah URL lengkap, dikembalikan apa adanya (tidak digandeng prefix); jika path relatif, digabung dengan prefix dari `getPhotoUrlPrefix()` — yang memilih base S3 (`S3_PUBLIC_URL + "/"`) bila dikonfigurasi, atau `/uploads/` dari `UPLOAD_URL_PREFIX` bila tidak. `buildPhotoUrls` memetakan array foto dan menambahkan properti `url` ke setiap objek tanpa mengubah data aslinya (spread).

### Konstruk yang Dipakai

- Regex `PATH_REGEX` untuk validasi nama file
- `startsWith` checks + short-circuit OR
- Generic `<T extends { storagePath: string }>` dengan intersection type
- `Array.map` + spread

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — validasi regex mencegah string sampah menjadi URL, dan path tidak pernah menjadi `javascript:` (regex hanya mengizinkan karakter alfanumerik, `_`, `-`, `/`, titik). Nilai `S3_PUBLIC_URL`/`UPLOAD_URL_PREFIX` berasal dari env admin, bukan input user.

---

## `lib/points.ts` — Mesin poin relawan (server-only, tidak bisa dicurangi)

### Potongan Kode Asli

```ts
// lib/points.ts baris 21-61
export async function awardReportPoints(
  userId: string,
  reportId: string,
  formSlug: string,
  fieldData: Record<string, unknown>,
): Promise<AwardResult> {
  const bonus: string[] = [];
  let totalPoints = 0;

  // Admin tidak dapat poin — poin admin selalu 0
  const user = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "admin") {
    return { pointsAwarded: 0, reason: "Admin tidak mendapat poin", bonus: [] };
  }

  // Coba ambil base points: PointRule → DB form → POINTS_MAP
  let basePoints = 0;
  try {
    // 1. PointRule (admin atur di /admin/points)
    const rule = await prisma.pointRule.findFirst({
      where: { name: { contains: formSlug.replace(/-/g, " "), mode: "insensitive" } },
    });
    if (rule?.points && rule.points > 0) {
      basePoints = rule.points;
    } else {
      // 2. DB form pointsOnSubmit
      const dbForm = await prisma.form.findUnique({ where: { slug: formSlug }, select: { pointsOnSubmit: true } });
      if (dbForm?.pointsOnSubmit && dbForm.pointsOnSubmit > 0) {
        basePoints = dbForm.pointsOnSubmit;
      }
    }
  } catch {
    // ignore
  }
  if (basePoints === 0) {
    basePoints = POINTS_MAP[formSlug] ?? 0;
  }
  totalPoints += basePoints;
```

### Penjelasan Cerita

File ini adalah kasir sistem poin — dan ia *hanya* berjalan di server, sesuai aturan AGENTS.md "never trust client-sent points". Cerita saat admin menyetujui laporan: route memanggil `awardReportPoints(userId, reportId, formSlug, fieldData)`.

Langkah pertama adalah pengecekan peran: profil user dibaca dari DB; jika `admin`, fungsi langsung mengembalikan 0 poin dengan alasan "Admin tidak mendapat poin" — admin tidak bisa mencuri poin untuk dirinya sendiri.

Langkah kedua menentukan poin dasar dengan prioritas tiga tingkat: (1) `PointRule` dari tabel yang diatur admin di `/admin/points` (dicocokkan dengan `contains` case-insensitive terhadap nama form tanpa strip); (2) jika tidak ada rule, `pointsOnSubmit` dari tabel `Form` di database (admin bisa mengubah lewat panel); (3) jika keduanya nol/kosong (atau query error yang ditelan `catch`), jatuh ke `POINTS_MAP` statis dari `lib/forms.ts` (monitoring 100, restoration 1000, trench 500, planting 100, seedling 100). Seluruh blok dibungkus `try/catch` agar gangguan database tidak membatalkan pemberian poin.

```ts
// lib/points.ts baris 63-121
  const form = getForm(formSlug);
  if (form) {
    const requiredFields = form.fields.filter((f) => f.required);
    const allFilled = requiredFields.every((f) => {
      const val = fieldData[f.id];
      return val !== undefined && val !== null && val !== "";
    });
    if (allFilled && fieldData.notes) {
      totalPoints += 10;
      bonus.push("laporan_lengkap");
    }
  }

  if (fieldData.photo_before && fieldData.photo_after) {
    totalPoints += 15;
    bonus.push("foto_before_after");
  }

  if (totalPoints > 0) {
    await prisma.pointsLog.create({
      data: {
        userId,
        reportId,
        amount: totalPoints,
        reason: `Approved ${formSlug}`,
        metadata: JSON.stringify({ formSlug, bonus, basePoints }),
      },
    });

    await prisma.profile.update({
      where: { id: userId },
      data: { points: { increment: totalPoints } },
    });

    await checkMilestones(userId);

    // Auto-upgrade: volunteer → field_lead (≥20.000 poin)
    if (user?.role === "volunteer" || user?.role === "field_lead") {
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { points: true, role: true },
      });
      if (profile) {
        if (profile.points >= 999999 && profile.role !== "admin") {
          await prisma.profile.update({
            where: { id: userId },
            data: { role: "admin" },
          });
        } else if (profile.points >= 20000 && profile.role === "volunteer") {
          await prisma.profile.update({
            where: { id: userId },
            data: { role: "field_lead" },
          });
        }
      }
    }
  }

  return { pointsAwarded: totalPoints, reason: `Approved ${formSlug}`, bonus };
}
```

Bonus dihitung dari kelengkapan laporan: jika semua field wajib (menurut definisi form statis) terisi dan ada `fieldData.notes`, +10 poin (bonus `laporan_lengkap`); jika ada `photo_before` dan `photo_after`, +15 (bonus `foto_before_after`).

Bila total poin > 0, dua hal terjadi secara berurutan: baris `PointsLog` ditulis (amount, reason `Approved <slug>`, metadata JSON berisi formSlug + bonus + basePoints — inilah buku besar poin yang tampil di halaman profil) dan kolom `points` profil di-*increment*. Lalu `checkMilestones` dipanggil, dan blok *auto-upgrade* berjalan: relawan yang menembus 20.000 poin naik kelas jadi `field_lead` (bisa mengajukan proyek — gerbang `PROJECT_PROPOSAL_THRESHOLD`); relawan yang menembus 999.999 poin dinaikkan jadi `admin` (nilai mustahil yang berarti hadiah khusus). Akhirnya hasil `{ pointsAwarded, reason, bonus }` dikembalikan.

```ts
// lib/points.ts baris 128-160
async function checkMilestones(userId: string) {
  const totalApproved = await prisma.report.count({
    where: { userId, status: "approved" },
  });

  const milestones = [
    { count: 10, points: 50, key: "milestone_10" },
    { count: 50, points: 250, key: "milestone_50" },
    { count: 100, points: 500, key: "milestone_100" },
  ];

  for (const m of milestones) {
    if (totalApproved >= m.count) {
      const existing = await prisma.pointsLog.findFirst({
        where: { userId, reason: { contains: `Milestone ${m.count}` } },
      });
      if (!existing) {
        await prisma.pointsLog.create({
          data: {
            userId,
            amount: m.points,
            reason: `Milestone ${m.count} laporan`,
            metadata: JSON.stringify({ milestone: m.key, totalApproved }),
          },
        });
        await prisma.profile.update({
          where: { id: userId },
          data: { points: { increment: m.points } },
        });
      }
    }
  }
}
```

`checkMilestones` menghitung jumlah laporan yang disetujui; untuk setiap ambang (10 → +50, 50 → +250, 100 → +500), jika tercapai, cek dulu apakah hadiahnya sudah pernah diberikan (mencari `PointsLog` berisi "Milestone 10" — `findFirst`); hanya bila belum ada, bonus ditulis dan profil di-increment. Idempotent: memanggil berkali-kali tidak akan memberi ganda.

```ts
// lib/points.ts baris 167-257
export async function checkDailyStreak(userId: string) {
  // Admin tidak dapat streak points
  const user = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "admin") return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayReports = await prisma.report.count({
    where: {
      userId,
      status: "approved",
      createdAt: { gte: today },
    },
  });

  if (todayReports === 0) return;

  let streakDays = 1;
  for (let i = 1; i <= 6; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = await prisma.report.count({
      where: {
        userId,
        status: "approved",
        createdAt: { gte: day, lt: nextDay },
      },
    });

    if (count > 0) {
      streakDays++;
    } else {
      break;
    }
  }
  ...
}
```

`checkDailyStreak` menumbuhkan semangat konsistensi: jika hari ini ada laporan yang disetujui (batas bawah hari ini `setHours(0,0,0,0)`), fungsi mundur 1-6 hari — setiap hari yang punya laporan menaikkan `streakDays`; hari kosong menghentikan loop (`break`). Streak 3 hari → +5 poin (sekali sehari, dicek lewat `PointsLog` dengan `createdAt >= today`); streak 7 hari → +50. Admin dikecualikan sejak awal.

```ts
// lib/points.ts baris 265-290
export async function updateTrustScore(userId: string, accepted: boolean) {
  // Admin trust score tidak berubah
  const userRole = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (userRole?.role === "admin") return;

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { trustScore: true },
  });
  if (!profile) return;

  const delta = accepted ? 10 : -10;
  const newScore = Math.max(0, Math.min(100, (profile.trustScore ?? 50) + delta));

  await prisma.profile.update({
    where: { id: userId },
    data: { trustScore: newScore },
  });

  if (newScore <= 0) {
    console.warn(`User ${userId} has trust score 0 — consider blocking`);
  }
}
```

`updateTrustScore` menggeser skor kepercayaan: laporan disetujui → +10, ditolak → -10, dijepit di rentang 0-100 (`Math.max(0, Math.min(100, ...))`), nilai awal 50 bila kosong. Skor 0 memicu peringatan di konsol agar tim mempertimbangkan pemblokiran. Skor ini adalah salah satu bahan anti-spam berlapis yang diputuskan di Sesi 1 (15 Mei).

### Konstruk yang Dipakai

- `async/await` + banyak query Prisma
- `try/catch` dengan fallback bertingkat (rule → DB → map)
- `filter` + `every` untuk kelengkapan field
- Loop `for` untuk cek streak mundur
- `Math.max`/`Math.min` clamping

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — seluruh kalkulasi berjalan server-side dari data DB (client tidak bisa mengirim angka poin), pemberian bonus di-*gate* oleh kelengkapan nyata, milestone dan streak di-cek idempotent (tidak bisa diganda-gandakan), dan peningkatan poin memakai `increment` atomik. Catatan kecil: `updateTrustScore` hanya ±10 per keputusan; admin yang menolak laporan yang sama berulang kali bisa menekan skor — itu memang desainnya.

---

## `lib/prisma-rls.ts` — Row-Level Security: filter otomatis per peran

### Potongan Kode Asli

```ts
// lib/prisma-rls.ts baris 27-43
function addWhere<T extends Record<string, unknown>>(
  args: T,
  filter: Record<string, unknown>
): T {
  // Hanya tambah where jika args sudah punya where (findMany, findFirst, dll)
  // atau args itu sendiri adalah where (count, aggregate)
  if ("where" in args) {
    const currentWhere = (args.where as Record<string, unknown>) || {};
    if ("OR" in filter) {
      // Gabung OR dengan existing where
      Object.assign(args, { where: { ...currentWhere, ...filter } });
    } else {
      Object.assign(args, { where: { ...currentWhere, ...filter } });
    }
  }
  return args;
}
```

### Penjelasan Cerita

File ini menerapkan *Row-Level Security* di lapisan aplikasi: setiap query otomatis di-*filter* sesuai peran pemanggil, tanpa harus menulis filter manual di setiap route. Cerita mekanismenya: `addWhere` menerima `args` query dan filter; jika args punya properti `where` (findMany/findFirst/findUnique), filter digabung ke dalam `where` dengan spread — kode RLS dan filter kode pemanggil hidup berdampingan. (Blok `if ("OR" in filter)` ternyata mengeksekusi logika yang sama di kedua cabang — arsitekturnya mengakomodasi penanganan OR khusus, dan saat ini gabungan spread cukup.)

```ts
// lib/prisma-rls.ts baris 49-84
export function prismaWithRls(ctx: RlsContext) {
  const isAdmin = ctx.role === "admin";
  const userId = ctx.userId;

  return prisma.$extends({
    name: "springhub-rls",

    query: {
      report: {
        async findMany({ args, query }) {
          if (!isAdmin) {
            const filter: Record<string, unknown> = userId
              ? { userId }
              : { status: "approved", isActive: true };
            addWhere(args, filter);
          }
          return query(args);
        },
        async findFirst({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
        async findUnique({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
        async count({ args, query }) {
          if (!isAdmin) {
            const filter: Record<string, unknown> = userId
              ? { userId }
              : { status: "approved", isActive: true };
            addWhere(args, filter);
          }
          return query(args);
        },
      },
```

`prismaWithRls(ctx)` adalah pabrik yang memanggil `prisma.$extends` — Prisma Client Extension yang membungkus query asli. Untuk model `report`, empat operasi dicegat: `findMany` dan `count` menerapkan logika terpenting — jika bukan admin: user login hanya melihat laporannya sendiri (`{ userId }`), pengunjung hanya melihat laporan `approved` + `isActive` (ini yang menyembunyikan laporan tertunda/ditolak dan soft-deleted dari publik, hasil keputusan Sesi 2 "form/report visibility"); `findFirst`/`findUnique` hanya dibatasi untuk user login (detail laporan orang lain = `null`). Setelah filter disuntikkan, `query(args)` meneruskan eksekusi asli.

```ts
// lib/prisma-rls.ts baris 86-149
      pointsLog: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
        async count({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },

      donation: {
        async findMany({ args, query }) {
          if (!isAdmin) {
            addWhere(args, userId ? { userId } : { status: "paid" });
          }
          return query(args);
        },
      },

      project: {
        async findMany({ args, query }) {
          if (!isAdmin) {
            if (userId) {
              addWhere(args, {
                OR: [{ userId }, { status: "published" }],
              });
            } else {
              addWhere(args, { status: "published" });
            }
          }
          return query(args);
        },
      },

      notification: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },

      coursesProgress: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },

      offlineSession: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },

      feedback: {
        async findMany({ args, query }) {
          if (!isAdmin && userId) addWhere(args, { userId });
          return query(args);
        },
      },
    },
  });
}
```

Model lain mengikuti pola serupa: `pointsLog` (riwayat poin pribadi), `notification` (notifikasi sendiri), `coursesProgress`, `offlineSession`, `feedback` — semuanya hanya `findMany`/`count` milik user sendiri, admin bebas. `donation` membedakan: user melihat donasinya, tamu hanya donasi berstatus `paid`. `project` paling menarik: user login melihat proyek miliknya **atau** yang berstatus `published` (`OR`), tamu hanya yang published. Seluruhnya disatukan oleh aturan: **admin tanpa filter, sisanya terkunci ke data miliknya**. Karena pabrik ini dipanggil per-request dengan konteks fresh, filter tidak bocor antar request.

### Konstruk yang Dipakai

- Prisma Client Extensions (`$extends`, `query` interceptor)
- `Object.assign` + spread untuk penggabungan where
- `async` wrapper dengan pemanggilan `query(args)`
- Ternary bersarang untuk logika per-peran

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — justru benteng privasi utama: data sensitif tidak pernah dikirim ke frontend karena query sudah di-filter di server. Dua catatan kecil: (1) `findMany`/`count` di interceptor melindungi route yang memakai `prismaWithRls` — route yang memakai `prisma` polos di luar sistem ini tidak terlindungi, jadi konvensi tim adalah selalu `prismaWithRls` untuk data user; (2) `findUnique` user-only mengembalikan `null` untuk data orang lain — desain yang aman (tidak membocorkan keberadaan data).

---

## `lib/prisma.ts` — Koneksi PostgreSQL + pabrik pesan error

### Potongan Kode Asli

```ts
// lib/prisma.ts baris 5-37
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

function getPool(): pg.Pool {
  if (!globalForPrisma.pool) {
    // Ensure PgBouncer transaction mode params are always present
    let dbUrl = process.env.DATABASE_URL || "";
    if (!dbUrl.includes("pgbouncer=true")) {
      const sep = dbUrl.includes("?") ? "&" : "?";
      dbUrl += `${sep}pgbouncer=true&connection_limit=3`;
    }
    globalForPrisma.pool = new pg.Pool({
      connectionString: dbUrl,
      max: 3,
      idleTimeoutMillis: 30000,  // 30s — biar ga ganti-ganti terus pas traffic normal
      connectionTimeoutMillis: 10000, // 10s — kasih waktu lebih buat cold start
    });
  }
  return globalForPrisma.pool;
}

const adapter = new PrismaPg(getPool(), { schema: "public" });

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = getPrisma();
```

### Penjelasan Cerita

Semua query database lewat file ini. Cerita koneksinya: `getPool()` menciptakan satu `pg.Pool` (kumpulan koneksi PostgreSQL) — dijamin *singleton* lewat objek `globalForPrisma` pada `globalThis` (penting untuk hot-reload dev Next.js agar tidak menumpuk pool). Tiga hal penting terjadi:

1. **Auto-tambah parameter PgBouncer**: jika `DATABASE_URL` belum mengandung `pgbouncer=true`, ditambahkan bersama `connection_limit=3` — ini memastikan koneksi kompatibel dengan PgBouncer (connection pooling layer) yang dipasang di VPS (keputusan Sesi 10).
2. **Batas pool 3 koneksi** — kecil tapi cukup, karena `connection_limit=10` dan `pool_timeout=10` juga ada di URL; `idleTimeoutMillis: 30000` mencegah koneksi diganti-ganti terus saat traffic normal, `connectionTimeoutMillis: 10000` memberi waktu cold start.
3. `PrismaPg` adapter menghubungkan pool ke PrismaClient; `getPrisma()` lagi-lagi singleton, dan `prisma` diekspor siap pakai.

```ts
// lib/prisma.ts baris 44-83
export function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan. Silakan coba lagi."): string {
  // Log error ke AppError secara asynchronous
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    import("@/lib/error-logger").then(({ logError }) => {
      logError({
        message: msg.slice(0, 500),
        level: "error",
        source: "api",
        stack: stack?.slice(0, 2000) || "",
        metadata: { fallback },
      }).catch(() => {});
    }).catch(() => {});
  }

  if (typeof error === "string") return error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P1001") return "Database tidak tersedia. Silakan coba lagi.";
    if (error.code === "P1002") return "Koneksi database timed out. Silakan refresh.";
    if (error.code === "P1017") return "Koneksi database terputus.";
    if (error.code === "P2002") return "Data sudah ada.";
    if (error.code === "P2025") return "Data tidak ditemukan.";
    return "Gangguan database. Silakan coba lagi.";
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Gagal terhubung ke database.";
  }
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return "Database error fatal.";
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return "Data yang dikirim tidak valid.";
  }
  if (error instanceof SyntaxError) {
    return "Format request tidak valid.";
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
```

`getErrorMessage` adalah wajah ramah setiap kegagalan — dipakai di hampir semua route API sesuai aturan AGENTS.md ("never hardcoded strings"). Cerita alurnya: error apa pun yang ditangkap di `catch` di-`log` dulu secara async ke tabel `AppError` (lewat dynamic import `lib/error-logger` — fire-and-forget, gagal pun tidak mengganggu respons). Lalu pesan untuk user dipilih berdasarkan tipe error: error Prisma dikenal dipetakan ke Bahasa Indonesia yang manusiawi — P1001 "Database tidak tersedia", P2002 "Data sudah ada" (duplikat), P2025 "Data tidak ditemukan" (record hilang), dst.; error Prisma lain diberi pesan generik; `SyntaxError` → "Format request tidak valid". Error biasa mengembalikan `error.message` — dan `fallback` (default "Terjadi kesalahan. Silakan coba lagi.") menjadi penutup segalanya.

`isDatabaseError` adalah penguji cepat: error termasuk keluarga Prisma (known request / init / rust panic / validation) → `true`, dipakai untuk memutuskan retry atau pesan khusus.

### Konstruk yang Dipakai

- Singleton pattern via `globalThis`
- `pg.Pool` dengan konfigurasi ketat
- `instanceof` berantai untuk klasifikasi error
- Dynamic `import()` async untuk logging
- String manipulation URL (`includes`, concat `?`/`&`)

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — URL database tidak pernah di-log, pesan error tidak membocorkan detail internal (code error Prisma diterjemahkan ke pesan generik), dan `getErrorMessage` menyaring pesan sebelum sampai ke client. Satu catatan operasional: `DATABASE_URL` mengandung kredensial — harus dijaga di `.env` (sudah masuk `.gitignore`, dipindai rahasia tiap sesi).

---

## `lib/provinces.ts` — 38 provinsi Indonesia, sumber tunggal

### Potongan Kode Asli

```ts
// lib/provinces.ts baris 2-43
export const INDONESIAN_PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "Banten",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku Utara",
  "Maluku",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
] as const;

export type IndonesianProvince = (typeof INDONESIAN_PROVINCES)[number];
```

### Penjelasan Cerita

Daftar 38 provinsi Indonesia (termasuk pemekaran baru: Papua Barat Daya, Papua Tengah, Papua Pegunungan, Papua Selatan) disimpan di satu tempat — "sumber tunggal untuk semua form" menurut komentarnya. Komponen dropdown provinsi di form `seedling-stock`, filter marketplace bibit, dan peta mengimpor array ini sehingga tidak ada dua daftar yang bisa berbeda. Dengan `as const`, TypeScript tahu persis anggota array-nya, dan tipe `IndonesianProvince` diturunkan darinya: fungsi yang menerima `province: IndonesianProvince` akan menolak string di luar daftar saat kompilasi. Urutannya adalah urutan tampilan (Sumatera → Jawa → Bali/Nusa → Kalimantan → Sulawesi → Maluku → Papua).

### Konstruk yang Dipakai

- `as const` array
- `typeof` + index access untuk turunan tipe

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — data statis publik, tidak ada input user yang dieksekusi.

---

## `lib/queue.ts` — Tiga antrean BullMQ di atas Redis

### Potongan Kode Asli

```ts
// lib/queue.ts baris 1-29 (seluruh file)
import { Queue, Worker } from "bullmq";
import { getRedisConnectionOptions } from "@/lib/redis-connection";

const connection = getRedisConnectionOptions();

export const emailQueue = new Queue("email", { connection });
export const imageQueue = new Queue("image-processing", { connection });
export const exportQueue = new Queue("export", { connection });

export type EmailJobData = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type ImageJobData = {
  reportPhotoId: string;
  storagePath: string;
  bucket: string;
};

export type ExportJobData = {
  type: "users" | "reports" | "donations" | "projects" | "feedback";
  startDate: string;
  endDate: string;
  adminEmail: string;
  format: "csv";
};
```

### Penjelasan Cerita

Tugas berat (kirim email massal, proses foto, ekspor CSV) tidak boleh membekukan request HTTP — itulah gunanya antrean BullMQ di atas Redis. Saat modul dimuat, `getRedisConnectionOptions()` (dari `lib/redis-connection.ts`, membaca `REDIS_QUEUE_URL`) menghasilkan opsi koneksi, lalu tiga antrean dibuat: `emailQueue` (email), `imageQueue` (pemrosesan gambar — kompresi/watermark untuk foto laporan), dan `exportQueue` (ekspor CSV pengguna/laporan/donasi/proyek/feedback dengan rentang tanggal dan email admin penerima).

Cerita pemakaiannya: route API (misal ekspor data) memanggil `exportQueue.add("csv-export", jobData)` — job masuk ke Redis dan langsung mengembalikan respons ke user ("sedang diproses, akan dikirim via email"). Di belakang layar, worker terpisah (proses `queue-worker`) mengambil job, mengeksekusinya, dan mengirim hasil. Karena antrean terpisah dari request, ekspor 100 ribu baris pun tidak membuat halaman lain lambat. Tipe-tipe job mendokumentasikan kontrak data antara enqueuer dan worker: `ExportJobData` menuntut `type` salah satu dari lima kategorinya, rentang tanggal, email admin, dan format (saat ini `csv`).

### Konstruk yang Dipakai

- Instantiation library eksternal (`Queue` BullMQ)
- Type exports untuk kontrak data job

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — antrean diisolasi dari input client langsung (data job dibuat server-side), dan kredensial Redis hanya lewat URL environment (kata sandi dalam URL Redis akan diganti `xxx` bila dirender — di sini nilai asli tidak pernah di-log).
---

## `lib/rate-limit.ts` — Pengatur lalu lintas: Redis dulu, memori sebagai cadangan

### Potongan Kode Asli

```ts
// lib/rate-limit.ts baris 14-52
// Fallback in-memory store (for Vercel serverless without Redis)
const memoryStores = new Map<string, Map<string, { count: number; resetAt: number }>>();

function getMemoryStore(name: string) {
  if (!memoryStores.has(name)) {
    memoryStores.set(name, new Map());
  }
  return memoryStores.get(name)!;
}

// Cleanup in-memory stores every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of memoryStores) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function memoryCheck(storeName: string, key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const store = getMemoryStore(storeName);
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}
```

### Penjelasan Cerita

File ini adalah satpam lalu lintas: ia membatasi berapa kali sebuah klien boleh memanggil endpoint dalam jendela waktu tertentu — bagian dari anti-spam berlapis. Cerita saat Redis mati (atau di environment serverless): penyimpanan *in-memory* berupa `Map` dua tingkat (`name` → `key` → `{ count, resetAt }`) mengambil alih. Pembersih interval berjalan setiap 5 menit menghapus entri yang sudah lewat `resetAt` agar memori tidak bocor. `memoryCheck` memutuskan: entri tidak ada / sudah kedaluwarsa → hitungan mulai dari 1 dengan `allowed: true` dan `remaining: maxRequests - 1`; sudah lewat batas → `allowed: false` (permintaan ditolak dengan 429); masih di bawah batas → hitungan dinaikkan dan sisa kuota dihitung.

```ts
// lib/rate-limit.ts baris 54-96
export function createRateLimiter(name: string, config: RateLimitConfig) {
  return {
    async check(key: string): Promise<RateLimitResult> {
      // Try Redis first, fallback to in-memory
      try {
        const now = Date.now();
        const windowKey = Math.floor(now / config.windowMs);
        const redisKey = `ratelimit:${name}:${key}:${windowKey}`;

        const count = await redis.incr(redisKey);
        if (count === 1) {
          await redis.pexpire(redisKey, config.windowMs);
        }

        const resetAt = (windowKey + 1) * config.windowMs;
        const remaining = Math.max(0, config.maxRequests - count);

        return {
          allowed: count <= config.maxRequests,
          remaining,
          resetAt,
        };
      } catch {
        // Redis unavailable — use in-memory fallback
        return memoryCheck(`fallback:${name}`, key, config);
      }
    },

    async reset(key: string): Promise<void> {
      try {
        const pattern = `ratelimit:${name}:${key}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch {
        // Reset in-memory
        const store = memoryStores.get(`fallback:${name}`);
        if (store) store.delete(key);
      }
    },
  };
}
```

`createRateLimiter` menghasilkan objek dengan dua method. `check` memakai teknik *sliding window* berbasis jendela waktu: `windowKey = Math.floor(now / windowMs)` membagi waktu menjadi ember-ember; kunci Redis menjadi `ratelimit:<name>:<key>:<windowKey>`; `redis.incr` menaikkan hitungan secara **atomik** (dua request bersamaan tidak bisa lolos keduanya — inilah keunggulan Redis). Hitungan pertama (`count === 1`) memasang `pexpire` sehingga kunci mati otomatis setelah jendela. Hasilnya: `allowed` (hitung ≤ batas), `remaining` (jepit 0), `resetAt` (awal jendela berikutnya — dipakai header HTTP `Retry-After`). Bila Redis error, `catch` melimpahkan ke memori. `reset` membuka kunci (misal setelah login berhasil, hitungan gagal di-nol-kan) dengan menghapus semua kunci pola terkait.

```ts
// lib/rate-limit.ts baris 98-149
export const authLimiter = createRateLimiter("auth", {
  windowMs: 60_000,
  maxRequests: 20,
});

export const apiLimiter = createRateLimiter("api", {
  windowMs: 60_000,
  maxRequests: 60,
});

export const reportLimiter = createRateLimiter("report", {
  windowMs: 60_000,
  maxRequests: 5,
});

export const feedbackLimiter = createRateLimiter("feedback", {
  windowMs: 60_000,
  maxRequests: 3,
});

export const newsletterLimiter = createRateLimiter("newsletter", {
  windowMs: 60_000,
  maxRequests: 3,
});

export const donationLimiter = createRateLimiter("donation", {
  windowMs: 60_000,
  maxRequests: 5,
});

export const uploadLimiter = createRateLimiter("upload", {
  windowMs: 60_000,
  maxRequests: 20,
});

// Login lockout: 5 failed attempts → lock 15 menit
export const loginLockout = createRateLimiter("login-lockout", {
  windowMs: 15 * 60_000,
  maxRequests: 5,
});

// Webhook: 10 requests per 60 detik — cegah flood dari Xendit callback
export const webhookLimiter = createRateLimiter("webhook", {
  windowMs: 60_000,
  maxRequests: 10,
});

// Public API: 30 requests per 10 detik — cegah scraping / spam
export const publicLimiter = createRateLimiter("public", {
  windowMs: 10_000,
  maxRequests: 30,
});
```

Delapan limiter siap pakai diekspor dengan profil berbeda: auth 20/menit, API umum 60/menit, report 5/menit (sesuai aturan 5 laporan/hari guest), feedback & newsletter 3/menit, donation 5/menit, upload 20/menit, `loginLockout` 5 percobaan per 15 menit (kebijakan kunci akun dari AGENTS.md), `webhookLimiter` 10/menit (menahan flood callback Xendit), dan `publicLimiter` 30 per 10 detik (anti-scraping).

### Konstruk yang Dipakai

- `Map` bersarang untuk store memori
- `setInterval` untuk pembersihan berkala
- `Math.floor` untuk jendela waktu, `Math.max` untuk clamping
- `try/catch` dengan fallback Redis → memori
- `redis.incr` + `pexpire` atomik

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — `incr` atomik mencegah *race condition* (dua request tidak bisa memakai kuota yang sama), backoff kunci otomatis, dan fallback memori membuat pertahanan tetap hidup walau Redis down. Catatan: fallback memori hanya efektif per-instance; di deployment multi-instance, itu cadangan yang lebih lemah tapi masih lebih baik daripada tanpa batas.

---

## `lib/redis-connection.ts` — Parser URL Redis untuk BullMQ

### Potongan Kode Asli

```ts
// lib/redis-connection.ts baris 16-35
export function redisConnectionFromUrl(url: string | undefined): RedisConnection {
  const fallback: RedisConnection = { host: "localhost", port: 6379 };
  if (!url) return fallback;
  try {
    const u = new URL(url);
    return {
      host: u.hostname || fallback.host,
      port: u.port ? parseInt(u.port, 10) : 6379,
      username: u.username || undefined,
      password: u.password || undefined,
      db: u.pathname && u.pathname.length > 1 ? parseInt(u.pathname.slice(1), 10) : undefined,
    };
  } catch {
    return fallback;
  }
}

export function getRedisConnectionOptions(envKey = "REDIS_QUEUE_URL"): ConnectionOptions {
  return redisConnectionFromUrl(process.env[envKey]);
}
```

### Penjelasan Cerita

BullMQ tidak bisa memakai URL Redis langsung — ia butuh objek `{ host, port, username, password, db }`. File kecil ini menjembatani keduanya. Ceritanya: `redisConnectionFromUrl` menerima URL seperti `redis://user:pass@host:6379/3` (nilai asli tidak pernah dirender di sini). Jika URL kosong, fallback `{ host: "localhost", port: 6379 }` dikembalikan — berguna di development lokal tanpa Redis. `new URL(url)` memecahnya: hostname → host, port → port (default 6379 bila kosong), `username`/`password` diambil dari bagian userinfo, dan `db` di-parse dari path (`/3` → 3). **Kredensial dan indeks DB sekarang dipertahankan** — komentar file mencatat bahwa sebelumnya password dan db dibuang, yang menyebabkan bug `NOAUTH Redis`. Bila URL tidak valid (`new URL` melempar), `catch` mengembalikan fallback. `getRedisConnectionOptions` membaca variabel environment (default `REDIS_QUEUE_URL`) dan meneruskannya — dipakai `lib/queue.ts` untuk BullMQ.

### Konstruk yang Dipakai

- `new URL()` parsing + optional chaining
- `parseInt` dengan default
- `try/catch` dengan nilai fallback

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — password hanya hidup di objek koneksi di memori, tidak pernah di-log; fallback lokal tanpa kredensial aman karena hanya untuk dev. Bila URL salah format, hasilnya gagal ke fallback — tidak ada exception yang membocorkan detail.

---

## `lib/redis.ts` — Koneksi ioredis dengan mode noop yang anggun

### Potongan Kode Asli

```ts
// lib/redis.ts baris 7-38
function getRedis(): Redis {
  if (!globalForRedis.redis) {
    if (!process.env.REDIS_URL) {
      const noop = new Proxy({} as Redis, {
        get: () => () => Promise.reject(new Error("Redis not configured")),
      });
      globalForRedis.redis = noop;
      return globalForRedis.redis;
    }
    globalForRedis.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    globalForRedis.redis.on("error", () => {});
  }
  return globalForRedis.redis;
}

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    const target = getRedis();
    const value = (target as any)[prop];
    if (typeof value === "function") {
      return value.bind(target);
    }
    return value;
  },
});
```

### Penjelasan Cerita

Semua modul yang butuh Redis (`cache.ts`, `rate-limit.ts`) mengimpor `redis` dari file ini. Dua cerita penting.

**Cerita 1 — Noop saat Redis tidak dikonfigurasi.** Jika `REDIS_URL` kosong (misal environment dev), `getRedis()` mengembalikan objek Proxy palsu yang *setiap propertinya* berupa fungsi yang mengembalikan Promise yang selalu ditolak dengan `"Redis not configured"`. Konsekuensinya elegan: pemanggil seperti `cache.ts` atau `rate-limit.ts` yang membungkus pemakaian Redis dalam `try/catch` akan jatuh ke cabang fallback-nya (fetch langsung / memori) — aplikasi tetap berfungsi penuh tanpa Redis, tidak ada crash.

**Cerita 2 — Koneksi sungguhan dengan strategi retry.** Bila URL ada, `new Redis(...)` dibuat dengan `maxRetriesPerRequest: 3`, `retryStrategy` yang berhenti mencoba setelah 3 kali (mengembalikan `null`) dengan jeda naik (`200ms, 400ms, 800ms...`, cap 2000ms), dan `lazyConnect` (koneksi dibuka saat pertama dipakai, bukan saat konstruksi). Event `"error"` dipasang dengan handler kosong — error koneksi tidak akan melempar exception tak tertangani yang merobohkan proses.

**Cerita 3 — Proxy di level ekspor.** `redis` yang diekspor adalah Proxy pembungkus: setiap akses properti memanggil `getRedis()` dulu (jadi keputusan noop/nyata terjadi **lazy**, pada penggunaan pertama), dan jika nilainya fungsi, ia di-*bind* ke objek asli — agar `this` internal ioredis tetap benar. Hasilnya: semua kode pemakai Redis memakai antarmuka yang sama, apakah Redis ada atau tidak.

### Konstruk yang Dipakai

- JavaScript `Proxy` (get trap) untuk delegasi lazy
- `retryStrategy` callback ioredis
- Singleton via `globalThis`

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — kredensial Redis hanya lewat URL environment (tidak di-log), error diredam, dan mode noop memastikan kegagalan tidak pernah menjadi *crash* global. Catatan: `bind` pada setiap akses membuat panggilan sedikit lebih lambat — pengorbanan kecil demi keseragaman API.

---

## `lib/sanitize.ts` — Penjernih HTML dua lapis anti-XSS

### Potongan Kode Asli

```ts
// lib/sanitize.ts baris 10-14
const BLOCKED_HTML = /<(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math|template|noscript|applet|audio|video|source|track|embed|object)\b/i;

const BLOCKED_ATTR = /\son(?:error|load|click|mouseover|mouseout|mousedown|mouseup|focus|blur|change|submit|keydown|keyup|keypress|dblclick|contextmenu|drag|drop|paste|input|wheel|animationstart|animationend|transitionend|begin|end)\s*=/i;

const BLOCKED_PROTO = /(?:href|src|action|formaction|data|xlink:href)\s*=\s*(?:["']\s*)?(?:javascript|vbscript|data|file|jar|blob):/i;
```

### Penjelasan Cerita

Konten kursus dan halaman admin bisa berisi HTML (ditulis editor). HTML itu harus diizinkan tampil — tapi tanpa membuka pintu XSS. File ini adalah penjernih dua lapis, dan komentarnya menegaskan: tidak boleh dipakai di Edge runtime karena memakai jsdom.

Tiga regex di atas adalah *jaring pengaman lapis pertama*: `BLOCKED_HTML` mencocokkan tag-tag berbahaya (script, style, iframe, object, embed, svg, math, form, input, button, audio, video, ...) — tag apa pun yang bisa mengeksekusi kode, mencuri input, atau memuat konten eksternal; `BLOCKED_ATTR` mencocokkan atribut handler event (`onerror`, `onload`, `onclick`, bahkan `onbegin`/`onend` dari animasi SVG — serangan khas yang lolos filter naif); `BLOCKED_PROTO` mencocokkan protokol URL berbahaya (`javascript:`, `vbscript:`, `data:`, `file:`, `jar:`, `blob:`) pada atribut yang membawa URL.

```ts
// lib/sanitize.ts baris 22-51
async function getPurify(): Promise<DomPurifyModule> {
  if (!purifyPromise) {
    purifyPromise = (async () => {
      const { JSDOM } = await import("jsdom");
      const createDOMPurify = (await import("dompurify")).default;
      const dom = new JSDOM("<!DOCTYPE html><html></html>");
      const { window } = dom;
      const dp = createDOMPurify(window as unknown as Parameters<typeof createDOMPurify>[0]);
      return {
        sanitize: (html: string, opts?: Record<string, unknown>) =>
          dp.sanitize(html, {
            USE_PROFILES: { html: true },
            ALLOWED_TAGS: [
              "p", "br", "strong", "b", "em", "i", "u", "s", "del", "mark",
              "ul", "ol", "li", "blockquote", "pre", "code", "hr",
              "h1", "h2", "h3", "h4", "h5", "h6",
              "a", "table", "thead", "tbody", "tr", "th", "td",
              "span",
            ],
            ALLOWED_ATTR: ["href", "title", "target", "rel", "colspan", "rowspan"],
            ALLOW_ARIA_ATTR: false,
            ALLOW_DATA_ATTR: false,
            ...opts,
            ADD_ATTR: ["target"],
          })
      };
    })();
  }
  return purifyPromise;
}
```

Lapis kedua adalah DOMPurify yang berjalan di dalam **jsdom** — karena DOMPurify butuh DOM sungguhan dan jsdom tidak boleh masuk bundle client, modul ini di-*lazy import* (`await import`) dan disimpan sebagai promise singleton (`purifyPromise`): hanya dibuat sekali, dipakai terus. DOMPurify dikonfigurasi ketat: daftar tag yang diizinkan hanya teks struktural (`p`, `strong`, `table`, `a`, `h1-h6`, ...) — tidak ada `img`, tidak ada `div`, tidak ada atribut class/style; atribut diizinkan hanya `href`, `title`, `target`, `rel`, `colspan`, `rowspan`; `ALLOW_ARIA_ATTR` dan `ALLOW_DATA_ATTR` dimatikan (atribut `data-*` sering jadi selundupan payload).

```ts
// lib/sanitize.ts baris 53-77
export async function sanitizeHtml(html: string): Promise<string> {
  if (!html) return "";
  if (typeof html !== "string") return "";

  let cleaned = String(html);

  // Lapis 1 — jaring pengaman cepat sebelum DOMPurify:
  if (BLOCKED_HTML.test(cleaned)) {
    cleaned = cleaned.replace(/(<\/?(?:script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math|template|noscript|applet|audio|video|source|track)\b[^>]*>)/gi, "");
  }
  cleaned = cleaned.replace(BLOCKED_ATTR, (m) => m.replace(/=.*$/, '=""'));
  cleaned = cleaned.replace(BLOCKED_PROTO, (m) => m.replace(/:\s*.+$/i, ":\"\""));

  // Lapis 2 — DOMPurify penuh (parsing ulang, buang card/on*:
  try {
    const { sanitize } = await getPurify();
    return sanitize(cleaned, {
      FORBID_TAGS: ["style", "svg", "math", "form", "input", "button", "iframe", "object", "embed", "script", "template", "noscript", "audio", "video", "source", "track"],
      FORBID_ATTR: ["style", "class", "id", "name", "tabindex", "contenteditable", "draggable", "download", "ping"],
      SAFE_FOR_TEMPLATES: true,
    });
  } catch {
    return cleaned.replace(/[<>]/g, "");
  }
}
```

`sanitizeHtml` merangkai dua lapis. **Lapis 1 (regex cepat)**: jika ada tag berbahaya, seluruh tag dihapus (`replace` dengan regex global); atribut handler dibungkam dengan mengganti nilai atributnya menjadi `=""` (sehingga `onerror=alert(1)` menjadi `onerror=""` — tidak berfungsi); protokol berbahaya dibungkam serupa (`href="javascript:alert(1)"` → `href=""`). Ini jaring cepat yang bekerja walau DOMPurify belum siap. **Lapis 2 (DOMPurify penuh)**: HTML yang sudah disaring di-*parse ulang* oleh DOMPurify dengan `FORBID_TAGS`/`FORBID_ATTR` tambahan (style, svg, class, id, contenteditable, dsb) dan `SAFE_FOR_TEMPLATES`. Hasil akhirnya adalah HTML bersih yang aman dirender. Bila semua gagal (DOMPurify tidak bisa dimuat), tindakan terakhir yang sangat konservatif: **hapus semua `<` dan `>`** — konten menjadi teks polos, kehilangan format tapi pasti aman.

`sanitizeHtmlSync` adalah API sinkron yang saat ini mengembalikan string apa adanya — dipakai saat pemanggil tahu inputnya sudah bersih atau ingin menunda pembersihan.

### Konstruk yang Dipakai

- Regex global dengan flag `i`/`g` untuk deteksi dan pembungkaman
- Lazy singleton promise (`purifyPromise`)
- Dynamic `import()` jsdom + dompurify
- `String.replace` dengan callback pengganti
- Fallback bertingkat (regex → DOMPurify → strip `<`/`>`)

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — justru file ini adalah penutup kerentanan XSS utama konten kursus (terverifikasi live di Sesi 15: `<script>`, `onerror`, `javascript:` URL, `<iframe>` semuanya dibersihkan). Desain dua lapis menutup celah DOMPurify-tunggal (entitas HTML, `svg onbegin`, tag aneh) karena regex lapis 1 sudah membuang kelas serangan itu sebelum parsing. Catatan: `sanitizeHtmlSync` yang mengembalikan input apa adanya harus dipakai dengan sadar — ia ada untuk kasus input yang sudah dijamin bersih oleh pemanggil.

---

## `lib/session-cache.ts` — Sesuai nama: cache sesi PWA di IndexedDB

### Potongan Kode Asli

```ts
// lib/session-cache.ts baris 22-68
export async function fetchAndCacheSession(): Promise<{
  user: {
    id: string;
    username: string;
    role: string;
    phone?: string;
    points?: number;
  } | null;
  fromCache: boolean;
}> {
  // 1. Coba dari API dulu
  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        // Ambil CSRF token untuk PWA offline fallback
        let csrfToken = "";
        try {
          const csrfRes = await fetch("/api/csrf");
          if (csrfRes.ok) {
            const csrfData = await csrfRes.json();
            csrfToken = csrfData.token || "";
          }
        } catch {
          // Non-critical
        }

        // Cache ke IndexedDB untuk PWA offline fallback
        const session: CachedSession = {
          id: "user-session",
          userId: data.user.id || data.user.email,
          username: data.user.username || "User",
          role: data.user.role || "volunteer",
          phone: data.user.phone || "",
          csrfToken,
          cachedAt: Date.now(),
        };
        try {
          await offlineDB.saveSession(session);
        } catch {
          // Non-critical — session tetap work walau gagal cache
        }
        return { user: data.user, fromCache: false };
      }
    }
  } catch {
    // API gagal (offline) — lanjut ke cache
  }

  // 2. Fallback: coba dari IndexedDB
  try {
    const cached = await offlineDB.getSession();
    if (cached && Date.now() - cached.cachedAt < SESSION_MAX_AGE_MS) {
      return {
        user: {
          id: cached.userId,
          username: cached.username,
          role: cached.role,
          phone: cached.phone,
        },
        fromCache: true,
      };
    }
  } catch {
    // IndexedDB tidak tersedia
  }

  return { user: null, fromCache: false };
}
```

### Penjelasan Cerita

Masalah yang dipecahkan file ini didokumentasikan di komentarnya: di *standalone mode* PWA, sebagian browser tidak mengirim cookie HTTP-only, sehingga `/api/auth/me` mengembalikan `null` walau user sudah login. Solusinya — sesi di-cache di IndexedDB sebagai cadangan.

Cerita alurnya: `fetchAndCacheSession` mencoba API dulu (`/api/auth/me`). Jika respons `ok` dan berisi `user`, ia juga mengambil CSRF token dari `/api/csrf` (ini penting: laporan offline di kemudian hari butuh token itu), lalu menyusun objek `CachedSession` — userId (fallback ke email bila id kosong), username (fallback "User"), role (fallback "volunteer"), phone, csrfToken, dan `cachedAt`. Objek disimpan ke IndexedDB via `offlineDB.saveSession` — kegagalan penyimpanan tidak fatal, hanya dilewati. Hasil: `{ user, fromCache: false }` — user asli dari server.

Jika API gagal (offline) atau tidak berisi user: langkah 2 — baca cache dari IndexedDB; jika ada **dan** umurnya di bawah 7 hari (`SESSION_MAX_AGE_MS`, sama dengan umur cookie sesi), kembalikan user dari cache dengan bendera `fromCache: true` — antarmuka menampilkan status "logged in (offline)". Bila cache kedaluwarsa atau tidak ada, `{ user: null, fromCache: false }`.

```ts
// lib/session-cache.ts baris 97-117
export async function clearCachedSession(): Promise<void> {
  try {
    await offlineDB.clearSession();
  } catch {
    // IndexedDB tidak tersedia — non-critical
  }
}

export async function clearAllOfflineUserData(): Promise<void> {
  try {
    await offlineDB.clearAllForUser();
  } catch {
    // IndexedDB tidak tersedia — non-critical
  }
}
```

Dua fungsi pembersihan melengkapi cerita: `clearCachedSession` (dipanggil saat logout — hapus sesi cache saja) dan `clearAllOfflineUserData` (logout lengkap — bersihkan semua data offline milik user, seperti dijelaskan `clearAllForUser` di `lib/offline-db.ts`). Keduanya idempotent dan aman dipanggil berkali-kali.

### Konstruk yang Dipakai

- `try/catch` berlapis dengan failover API → cache → null
- Objek literal dengan fallback nilai (`||`)
- Pengecekan umur cache (`Date.now() - cachedAt < MAX`)

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — sesi cache hanya berisi data tampilan (id, username, role, phone, csrfToken) dan masa berlakunya dibatasi 7 hari; aksi mutasi server tetap butuh cookie/CSRF yang sah, sehingga cache sesi tidak bisa dipakai untuk memalsukan identitas di luar offline fallback. Catatan: `csrfToken` di cache bisa kedaluwarsa (1 jam) — QueueWorker akan memintanya ulang saat online; token stale ditolak server dan item antrean menunggu token baru.

---

## `lib/upload-photo.ts` — Upload foto: magic bytes, kompresi 720p, EXIF dihapus

### Potongan Kode Asli

```ts
// lib/upload-photo.ts baris 20-53
function detectMimeFromBuffer(buffer: Buffer): string {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return "image/webp";
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return "image/gif";
  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return "image/bmp";
  // Default
  return "image/jpeg";
}

export async function uploadPhoto(
  file: File,
  folder: string = "reports"
): Promise<UploadResult> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Ukuran foto maksimal 10MB");
  }

  const arrayBuffer = await file.arrayBuffer();
  const initialBuffer = Buffer.from(arrayBuffer);

  // Detect MIME from file bytes (more reliable than file.type on Chrome Android)
  const detectedMime = detectMimeFromBuffer(initialBuffer);
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(detectedMime)) {
    throw new Error(
      `Format foto harus JPG, PNG, atau WebP (terdeteksi: ${detectedMime})`
    );
  }
```

### Penjelasan Cerita

File ini menangani semua foto laporan. Cerita saat user memilih foto dan menekan submit: `uploadPhoto(file, folder)` dipanggil dengan File dari input (folder default `reports`). Penjaga pertama: ukuran — lebih dari 10MB langsung ditolak dengan pesan "Ukuran foto maksimal 10MB" yang muncul di form. Kemudian file dibaca sebagai `ArrayBuffer` dan diubah menjadi `Buffer` untuk pemeriksaan byte.

Yang menarik adalah `detectMimeFromBuffer`: tipe file **ditentukan dari byte pertama** (magic bytes/signature), bukan dari `file.type` — karena di Chrome Android (temuan Sesi 4) `file.type` sering kosong atau salah. JPEG dikenali dari `FF D8 FF`, PNG dari `89 50 4E 47`, WebP dari `52 49 46 46` ("RIFF"), GIF `47 49 46 38`, BMP `42 4D`. Hanya JPG, PNG, dan WebP yang diizinkan; lainnya ditolak dengan pesan yang menyebutkan tipe terdeteksi — jadi file bernama `foto.jpg` berisi script pun tertolak karena byte-nya tidak cocok.

```ts
// lib/upload-photo.ts baris 55-84
  // Step 1: resize & compress
  const compressed = await sharp(initialBuffer)
    .resize(1280, 720, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .withMetadata({ exif: undefined })
    .toBuffer();

  // Step 2: add watermark
  const watermarked = await addWatermark(compressed);

  const metadata = await sharp(watermarked).metadata();

  const ext = "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${folder}/${filename}`;

  // Simpan ke local filesystem
  const fullDir = path.join(UPLOAD_DIR, folder);
  const fullPath = path.join(UPLOAD_DIR, storagePath);

  await fs.mkdir(fullDir, { recursive: true });
  await fs.writeFile(fullPath, watermarked);

  return {
    url: `${UPLOAD_PREFIX}/${storagePath}`,
    path: storagePath,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}
```

Gambar yang lolos lalu melewati jalur pemrosesan (sesuai aturan AGENTS.md: "EXIF stripped, compressed to 720p"):

1. **Kompresi** — `sharp.resize(1280, 720, { fit: "inside", withoutEnlargement: true })`: foto diperkecil agar muat dalam bingkai 1280×720 tanpa diperbesar kalau sudah kecil; lalu dikonversi ke JPEG kualitas 80 dengan encoder mozjpeg (hemat bandwidth). Kritis: `.withMetadata({ exif: undefined })` **menghapus seluruh metadata EXIF** — koordinat GPS yang disuntikkan kamera HP dibuang sebelum gambar disimpan. Ini perlindungan privasi yang serius: relawan yang memotret di lokasi terpencil tidak membocorkan koordinat persis lewat file foto.
2. **Watermark** — `addWatermark` dari `lib/watermark.ts` menempelkan tanda `@jaga_semesta` di sudut kiri bawah.
3. **Penamaan** — `Date.now()` + 6 karakter acak + `.jpg` (misal `1723456789-ab12cd.jpg`), disimpan di `UPLOAD_DIR/<folder>/`.
4. **Tulis disk** — `fs.mkdir` rekursif lalu `fs.writeFile`.

Hasilnya `{ url, path, width, height }` dikembalikan ke route API yang menyimpan `path` (storagePath) di tabel `ReportPhoto`. `deletePhoto` membersihkan file saat foto dihapus (menggunakan `fs.unlink`, mengabaikan error bila file sudah tidak ada).

### Konstruk yang Dipakai

- Pemeriksaan byte-level (magic bytes) dengan bitwise perbandingan hex
- `sharp` pipeline: `resize` → `jpeg` → `withMetadata` → `toBuffer`
- `await fs.mkdir` + `fs.writeFile` (fs/promises)
- Template filename acak
- `try/catch` kosong untuk hapus file

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — kombinasi magic-byte MIME check, batas ukuran 10MB, konversi wajib ke JPEG (file apapun bentuk aslinya menjadi JPEG yang di-encode sharp — *polymorphic content* mati di sini), EXIF dibuang, dan nama file acak membuat serangan *malicious upload* praktis mustahil. Satu catatan: ukuran 10MB bisa jadi besar untuk HP 2G; itu trade-off kualitas yang disengaja.

---

## `lib/use-auto-save.ts` — Draft form auto-simpan tiap 30 detik

### Potongan Kode Asli

```ts
// lib/use-auto-save.ts baris 5-31 (seluruh file)
"use client";
import { useEffect, useRef } from "react";
import { offlineDB, type DraftReport } from "./offline-db";

export function useAutoSave(
  formSlug: string,
  fieldData: Record<string, unknown>,
  photoBlobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }>
) {
  const draftIdRef = useRef<string>(`draft-${formSlug}-${Date.now()}`);
  const prevRef = useRef("");

  useEffect(() => {
    const interval = setInterval(async () => {
      const current = JSON.stringify({ fieldData, photoBlobs: photoBlobs.map(p => p.fileName) });
      if (current === prevRef.current) return; // no change
      prevRef.current = current;

      const draft: DraftReport = {
        id: draftIdRef.current,
        formSlug,
        fieldData,
        photoBlobs,
        savedAt: Date.now(),
      };
      await offlineDB.saveDraft(draft);
    }, 30_000); // every 30 seconds

    return () => clearInterval(interval);
  }, [formSlug, fieldData, photoBlobs]);
}
```

### Penjelasan Cerita

Tidak ada yang lebih menyebalkan daripada mengisi form survei 33 field lalu kehilangan semuanya karena jaringan putus. Hook ini mencegahnya. Ceritanya: form dipanggil dengan `useAutoSave(formSlug, fieldData, photoBlobs)`; `draftIdRef` dibuat sekali (`draft-<slug>-<timestamp>`) sehingga setiap sesi pengisian punya ID draft yang sama, dan `prevRef` menyimpan snapshot terakhir yang disimpan.

Setiap 30 detik, interval berjalan: state form dan nama-nama file foto di-`JSON.stringify` menjadi satu string; jika sama dengan snapshot sebelumnya, tidak ada perubahan → `return` (tidak ada penulisan sia-sia ke IndexedDB). Jika berubah, snapshot diperbarui, objek `DraftReport` dibangun, dan `offlineDB.saveDraft` menyimpan ke store `draft-reports`. Draft ini bertahan bahkan setelah tab ditutup — saat pengguna kembali, tombol "pulihkan draft" membaca store dan mengisi ulang form. Cleanup `clearInterval` saat komponen dilepas (atau `formSlug`/data berubah) menghentikan interval — dan ketika data form berubah, effect dijalankan ulang dengan interval baru.

### Konstruk yang Dipakai

- `useEffect` + `useRef` (stabil lintas render)
- `setInterval` dengan cleanup
- `JSON.stringify` untuk deteksi perubahan
- `async` callback interval

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — data hanya tersimpan di IndexedDB origin sendiri, tidak dikirim ke mana pun; foto tersimpan sebagai Blob dan nama filenya tidak dipakai untuk apa pun yang berbahaya. Catatan kecil: `fieldData` yang di-stringify bisa besar (form panjang); interval 30 detik dengan cek perubahan membatasi beban.

---

## `lib/utils.ts` — Perkakas kecil: cn, formatNumber, safeParseJson

### Potongan Kode Asli

```ts
// lib/utils.ts baris 1-19 (seluruh file)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function safeParseJson(str: string): string[] {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
```

### Penjelasan Cerita

Tiga utilitas kecil yang dipakai di banyak komponen. `cn` menggabungkan nama kelas Tailwind: `clsx` menangani kondisional (`cn("a", false && "b")` → `"a"`), lalu `twMerge` menyelesaikan konflik kelas (dua `px-*` → yang terakhir menang) — standar di ekosistem shadcn. `formatNumber` menampilkan angka dengan pemisah ribuan Indonesia (`Intl.NumberFormat("id-ID")` → "27.300.000") untuk statistik di dashboard. `safeParseJson` mencoba `JSON.parse`; bila hasilnya bukan array atau parsing gagal, mengembalikan array kosong — dipakai saat membaca field JSON dari database yang mungkin rusak atau kosong, tanpa pernah melempar exception.

### Konstruk yang Dipakai

- Rest parameter `...inputs`
- `Intl.NumberFormat`
- `try/catch` + `Array.isArray`

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — `safeParseJson` menelan semua kegagalan, `Intl.NumberFormat` murni presentasi, dan `cn` hanya menyambung string class.

---

## `lib/watermark.ts` — Cap tangan `@jaga_semesta` pada setiap foto

### Potongan Kode Asli

```ts
// lib/watermark.ts baris 5-32
function createWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(12, Math.round(width / 30));
  const padding = Math.max(8, Math.round(fontSize / 3));

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text { fill: white; font-size: ${fontSize}px; font-family: Arial, sans-serif;
                font-weight: bold; opacity: 0.6; }
      </style>
      <text x="${padding}" y="${height - padding - 4}" class="text">${WATERMARK_TEXT}</text>
    </svg>
  `;

  return Buffer.from(svg);
}

export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1280;
  const height = metadata.height || 720;

  const svgOverlay = createWatermarkSvg(width, height);

  return sharp(imageBuffer)
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .toBuffer();
}
```

### Penjelasan Cerita

Setiap foto yang diunggah lewat `lib/upload-photo.ts` melewati fungsi ini. Ceritanya: `addWatermark` membaca metadata gambar (lebar/tinggi; fallback 1280×720 bila kosong), lalu `createWatermarkSvg` membangun SVG transparan berukuran sama dengan gambar: teks `@jaga_semesta` putih, tebal, opasitas 60%, ukuran font proporsional lebar gambar (`width / 30`, minimal 12px), diposisikan di kiri bawah dengan jarak `padding`. SVG ini dikompositkan ke atas gambar asli dengan `sharp.composite` — hasilnya gambar dengan cap teks tembus pandang. Karena dipanggil setelah kompresi, ukuran file tidak membengkak. Efeknya dua sisi: merek dagang (foto di mana pun muncul selalu bersumber jelas) dan kewaspadaan (foto tidak bisa diklaim sebagai milik pihak lain tanpa cap).

### Konstruk yang Dipakai

- Template literal SVG
- `sharp.metadata()` + `composite`
- `Math.max`/`Math.round` untuk ukuran proporsional

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — teks watermark adalah konstanta statis, tidak ada input user; SVG dibuat internal (bukan dari konten user), sehingga tidak ada jalur injeksi.

---

## `lib/xendit.ts` — Gerbang donasi: invoice Xendit v2

### Potongan Kode Asli

```ts
// lib/xendit.ts baris 21-57
export const DONATION_TIERS: DonationTier[] = [
  { id: "seedling",   amountIdr:    20_000, label: "Rp 20K",   impact: "1 tree seedling" },
  { id: "trench",     amountIdr:    50_000, label: "Rp 50K",   impact: "1 trench (rorak)" },
  { id: "sediment",   amountIdr:   100_000, label: "Rp 100K",  impact: "1 m³ sediment removed from a spring" },
  { id: "monitoring", amountIdr: 1_000_000, label: "Rp 1 juta", impact: "50 springs monitored" },
];

/** Payment methods Xendit exposes to donors at checkout. */
export const PAYMENT_METHODS = [
  { id: "ovo",      label: "OVO",      group: "e-money" },
  { id: "gopay",    label: "GoPay",    group: "e-money" },
  { id: "dana",     label: "DANA",     group: "e-money" },
  { id: "shopeepay",label: "ShopeePay",group: "e-money" },
  { id: "qris",     label: "QRIS",     group: "qris" },
  { id: "card",     label: "Debit / Credit Card", group: "card" },
  { id: "va",       label: "Virtual Account",     group: "va" },
] as const;

export const DEFAULT_PAYMENT_METHODS = [
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "OVO",
  "GOPAY",
  "DANA",
  "SHOPEEPAY",
  "QRIS",
] as const;

/** Returns true when Xendit is configured (secret key + webhook token present). */
export function isXenditConfigured(): boolean {
  return Boolean(process.env.XENDIT_SECRET_KEY && process.env.XENDIT_WEBHOOK_TOKEN);
}
```

### Penjelasan Cerita

File ini adalah jembatan ke Xendit, payment gateway Indonesia (kartu, VA, e-wallet, QRIS). Komentar di kepala file menegaskan: ini wrapper tipis yang dipanggil route donasi **hanya bila `XENDIT_SECRET_KEY` diset** — sampai kunci asli dari klien tiba (status blocked di AGENTS.md), donasi berjalan dalam mode mock/sandbox.

Data statis di awal: `DONATION_TIERS` — empat tingkatan donasi yang tampil sebagai kartu preset di halaman donasi ("Rp 20K" untuk 1 bibit, "Rp 50K" untuk 1 rorak, "Rp 100K" untuk 1 m³ sedimen, "Rp 1 juta" untuk 50 mata air dipantau), masing-masing dengan `impact` yang menjelaskan dampak langsung donasi. `PAYMENT_METHODS` mendaftar kanal pembayaran untuk UI, dan `DEFAULT_PAYMENT_METHODS` adalah kode channel yang dikirim ke Xendit (BANK_TRANSFER = VA, kanal paling populer di Indonesia, plus kartu dan e-wallet). `isXenditConfigured` adalah saklar sederhana: kedua env (secret key **dan** webhook token) harus ada.

```ts
// lib/xendit.ts baris 82-139
export async function createInvoice(
  input: CreateInvoiceInput
): Promise<CreateInvoiceResult> {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    throw new Error("XENDIT_SECRET_KEY is not set. Cannot create invoice.");
  }

  const encoded = Buffer.from(secretKey + ":").toString("base64");

  const body: Record<string, unknown> = {
    external_id: input.externalId,
    amount: input.amount,
    payer_email: input.payerEmail,
    description: input.description || "Donasi SpringHub",
    currency: "IDR",
    invoice_duration: 86400, // 24 hours
    reminder: true,
    success_redirect_url: `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/donate/success?invoice={invoice_id}`,
    failure_redirect_url: `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/donate/failed`,
  };

  const paymentMethods = input.paymentMethods?.length
    ? input.paymentMethods
    : (DEFAULT_PAYMENT_METHODS as readonly string[]);
  body.payment_methods = paymentMethods;

  const res = await fetch(`${XENDIT_API_BASE}/v2/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
      "X-IDEMPOTENCY-KEY": input.externalId,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Xendit API error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  return {
    id: data.id,
    invoiceUrl: data.invoice_url,
    externalId: data.external_id,
    amount: data.amount,
    status: data.status,
    expiryDate: data.expiry_date ?? null,
  };
}
```

`createInvoice` adalah inti file. Cerita saat donor menekan "Bayar": route donasi memanggil dengan `{ externalId, amount, payerEmail, description, paymentMethods }`.

1. **Kunci wajib** — tanpa `XENDIT_SECRET_KEY`, error dilempar (donasi tidak bisa dibuat).
2. **Otentikasi** — kunci disandikan `Buffer.from(secretKey + ":").toString("base64")` menjadi Basic Auth (`xxx` menggantikan nilai asli di sini).
3. **Body invoice** — `external_id` (kunci idempotensi donor dari DB), jumlah, email pembayar, deskripsi, mata uang IDR, `invoice_duration` 24 jam, pengingat aktif, dan URL redirect sukses/gagal yang memakai `NEXT_PUBLIC_APP_URL`. Sukses membawa `{invoice_id}` sebagai placeholder yang diisi Xendit.
4. **Metode bayar** — pilihan donor bila ada; selain itu daftar default.
5. **Kirim** — POST ke `https://api.xendit.co/v2/invoices` dengan header `X-IDEMPOTENCY-KEY` (pengiriman ulang tidak membuat invoice ganda) dan timeout 15 detik (`AbortSignal.timeout`).
6. **Tanggapan** — respons non-OK → error dengan status dan teks dari Xendit; OK → data di-parse dan dikembalikan sebagai `{ id, invoiceUrl, externalId, amount, status, expiryDate }`.

Donor diarahkan ke `invoiceUrl` Xendit, membayar lewat kanal pilihannya; webhook pembayaran lalu masuk lewat endpoint yang dijaga `webhookLimiter` dan verifikasi token `XENDIT_WEBHOOK_TOKEN` — yang jika sah, memicu kredit donasi dan notifikasi. (File ini hanya invoice; verifikasi webhook ada di route API donasi.)

### Konstruk yang Dipakai

- Basic auth base64 (`Buffer.from`)
- `fetch` dengan `AbortSignal.timeout`
- `X-IDEMPOTENCY-KEY` header untuk dedupe
- Ternary untuk pilihan payment methods
- `throw new Error` untuk kunci hilang / API gagal

### 🛡️ Kerentanan

Tidak ada kerentanan signifikan pada potongan ini — kunci rahasia hanya di server (fungsi ini server-only, komentar file menegaskan "never call from the client"), otentikasi lewat header (bukan di body/URL), idempotency key mencegah duplikasi invoice, dan timeout mencegah gantung. Yang penting diingat: verifikasi **pembayaran sungguhan** tidak boleh mengandalkan return `createInvoice` saja — SpringHub memakai webhook yang memverifikasi token `XENDIT_WEBHOOK_TOKEN` dan mencatat `already_processed` (dedupe webhook) sebelum menambah poin donasi.

---

# Ringkasan Penutup BAB 5

Tiga puluh sembilan modul di `lib/` membentuk lapisan keamanan dan logika SpringHub yang berlapis. Jika diringkas dalam satu kalimat: **server memegang semua rahasia** (poin, koordinat presisi, token, kunci), dan **client hanya melihat hasil yang sudah dipotong** (poin yang dihitung server, lokasi yang di-snap, konten yang disanitasi, HTML yang diizinkan).

Tiga prinsip yang menghubungkan semua file ini:

1. **Fail-closed & failover** — `env.ts` menolak startup tanpa DATABASE_URL/JWT_SECRET; `redis.ts` noop + `cache.ts`/`rate-limit.ts` fallback memori; `prisma.ts` pesan error yang tidak membocorkan detail; `sanitize.ts` turun ke strip `<`/`>`; semuanya memilih "jangan crash, jangan bocor".
2. **Satu sumber kebenaran** — `forms.ts` (form + schema + poin), `provinces.ts` (provinsi), `geo.ts` (koordinat), `prisma-rls.ts` (siapa lihat apa).
3. **Kedaulatan data** — EXIF dihapus (`upload-photo.ts`), koordinat di-snap (`geo.ts`), sesi di-hash (`auth.ts`), log di-redaksi (`logger.ts`), queue offline tidak pernah membuang data user (`offline-db.ts`).

Sesuai prinsip AGENTS.md: semua penegakan keamanan (CSRF, RLS, poin, sanitasi) dilakukan server-side; kode client hanya renderer yang patuh.
