# BAB 6 — Anatomi 94 Route Handler di `app/api/`

> Modul Belajar — Kode SpringHub
>
> Bab ini membedah **seluruh 94 route handler** (file bernama `route.ts`) yang hidup di dalam folder `app/api/`. Setiap route diperiksa dari tiga sudut: **peran** (kenapa endpoint ini ada), **alur cerita** (urutan logika dari request masuk sampai respons keluar), dan **potongan kode asli** (kode nyata yang diambil langsung dari file, bukan karangan). Bab ini ditutup dengan analisis **konstruk** (if/else, try/catch, Promise.all, transaksi, dsb.) dan **audit kerentanan** untuk setiap endpoint.
>
> **Cara membaca**: silakan buka file yang dibahas berdampingan dengan bab ini. Penomoran baris pada potongan kode (`baris ±X-Y`) mengikuti isi file saat bab ini ditulis, jadi jika kode berubah, gunakan penomoran sebagai perkiraan.

---

## Pendahuluan: Peta 94 Route Handler

Sebelum menyelami satu per satu, ada baiknya kita memetakan seluruh kawasan `app/api/`. Berikut daftar lengkap yang dihasilkan oleh perintah:

```bash
cd /root/springhub && find app/api -name route.ts | sort
```

Ada **94 file** yang terbagi ke dalam kelompok besar berikut:

| Kelompok | Jumlah Route | Contoh |
|---|---|---|
| Auth & CSRF | 8 | `/api/auth/login`, `/api/auth/register`, `/api/csrf` |
| Report (publik + pemilik) | 4 | `/api/reports`, `/api/reports/[id]/photos` |
| Admin — Reports | 8 | `/api/admin/reports/[id]/approve`, `.../orphans` |
| Admin — Springs & Seedlings | 6 | `/api/admin/springs`, `/api/admin/seedlings/requests` |
| Admin — Users & Trust Score | 4 | `/api/admin/users/[id]`, `/api/admin/trust-scores` |
| Admin — Forms (CRUD dinamis) | 4 | `/api/admin/forms/[id]/fields/[fieldId]` |
| Admin — Courses & Content | 4 | `/api/admin/courses/[id]`, `/api/admin/content` |
| Admin — Point Rules | 2 | `/api/admin/point-rules/[id]` |
| Admin — Projects, Donasi, Export | 5 | `/api/admin/projects/[id]`, `/api/admin/export` |
| Admin — Errors & Feedback | 4 | `/api/admin/errors/[id]`, `/api/admin/feedback/[id]` |
| Donasi & Xendit | 2 | `/api/donations/invoice`, `/api/donations/webhook` |
| Offline Sync (PWA) | 2 | `/api/offline/session`, `/api/offline/sync` |
| Kursus | 3 | `/api/courses/[slug]`, `/api/courses/progress` |
| Formulir (publik) | 2 | `/api/forms`, `/api/forms/[slug]` |
| Springs & Map Points | 8 | `/api/springs/bulk`, `/api/map-points/types` |
| Seedling Marketplace | 7 | `/api/seedlings/[id]/request`, `.../contact` |
| Proyek Komunitas | 4 | `/api/projects/[id]/like`, `.../comments` |
| Dashboard & Statistik | 3 | `/api/dashboard`, `/api/leaderboard`, `/api/gallery` |
| Notifikasi & Profil User | 6 | `/api/notifications/unread`, `/api/user/profile` |
| Infrastruktur & Lain-lain | 7 | `/api/health`, `/api/upload/presign`, `/api/ytthumb` |
| **Total** | **94** | |

### Pola umum yang akan Anda lihat berulang kali

Sebelum masuk ke route pertama, pahami lima lapis pola yang diulang hampir di semua endpoint state-changing (mengubah data):

1. **CSRF** — endpoint `POST`/`PUT`/`PATCH`/`DELETE` wajib memverifikasi token dari header `x-csrf-token` melalui `verifyCsrfToken()` (kecuali endpoint yang memang sengaja tanpa CSRF seperti `login`, `register`, dan `webhook` yang punya mekanisme token tersendiri).
2. **Otorisasi** — cek sesi via `getSession()`; untuk endpoint admin wajib `role === "admin"` atau helper `isAdmin()`.
3. **Validasi** — skema Zod (`safeParse`) atau validasi manual untuk data yang masuk.
4. **Logika bisnis** — query Prisma, kalkulasi poin (server-only), atau panggilan layanan eksternal.
5. **Respons & audit** — respons JSON standar `{ success, ... }` atau `{ error }`, plus `auditLog()` untuk jejak admin, dan `getErrorMessage()` agar pesan error konsisten.

Tiga aturan emas yang selalu muncul:
- **Jangan pernah percaya nilai dari client** — titik koordinat di-snap di server, poin dihitung di server, jumlah donasi divalidasi ulang di server.
- **Idempotensi** — retry offline dan webhook duplikat harus aman (`clientCorrelationId`, compare-and-set).
- **Error yang aman** — `getErrorMessage(error, fallback)` agar detail internal DB tidak bocor ke client, plus status 503 bila memang gangguan database.

---

## Domain Auth

Delapan route pertama adalah gerbang masuk dan keluar pengguna. Ini adalah domain yang paling peka keamanan: di sinilah serangan brute force, enumerasi email, dan penyalahgunaan sesi dicegat. Perhatikan bahwa **dua route di domain ini sengaja TIDAK memakai CSRF** (login dan register) karena CSRF ganda justru menyulitkan alur, sementara risiko CSRF untuk login sudah dimitigasi dengan `SameSite=Lax` pada cookie sesi dan rate limiting.

### `GET /api/csrf` → app/api/csrf/route.ts

**Peran**: Membuat token CSRF sekali pakai berumur 1 jam, menyimpannya di cookie `HttpOnly` + `SameSite=Lax`, lalu mengembalikannya ke client untuk dipakai sebagai header `x-csrf-token` pada semua request state-changing.

**Alur Cerita**: Ini adalah titik awal dari semua interaksi berbahaya. Client membuka halaman mana pun, lalu (sebelum mengirim form atau tombol aksi) memanggil `GET /api/csrf` *just-in-time* — bukan saat mount — agar token tidak kedaluwarsa di tengah sesi. Handler membaca header proxy (`x-forwarded-proto` atau `x-forwarded-scheme`) untuk menentukan apakah koneksi berjalan di HTTPS; jika ya, cookie diberi atribut `Secure`. Token dibuat sebagai JWT HS256 yang ditandatangani dengan kunci rahasia JWT (`getJwtSecret()`), berisi klaim kosong, dan kedaluwarsa 1 jam. Token yang sama dikembalikan dua kali dalam satu tangkapan: sekali lewat body JSON `{ token }` dan sekali lewat cookie `csrf_token`. Nantinya `verifyCsrfToken()` akan membandingkan token di header dengan token di cookie — dua tempat yang berbeda, sehingga penyerang yang hanya bisa menyuntikkan cookie (atau hanya memalsukan header) tetap gagal. Terakhir, respons diberi segudang header anti-cache (`no-store`, `no-cache`, `CDN-Cache-Control: no-store`, dll.) supaya proxy dan CDN tidak pernah menyimpan token yang masih berlaku.

**Potongan Kode Asli**:

```ts
// app/api/csrf/route.ts baris ±8-25
export async function GET(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-scheme") || "https";
  const isSecure = proto === "https";

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(SECRET);

  const res = NextResponse.json({ token });
  res.headers.set("Set-Cookie", `${CSRF_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600; ${isSecure ? "Secure;" : ""}`);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  // ... Cache-Control tambahan untuk CDN/Cloudflare
  return res;
}
```

**Konstruk**: Tanpa percabangan besar; hanya satu ternary `isSecure ? "Secure;" : ""` dan satu pemanggilan fungsi await (`SignJWT.sign`).

**🛡️ Kerentanan**: "Kode ini rentan jika token bisa ditebak atau disalin — karena siapa pun yang memegang token + cookie bisa mengirim request state-changing atas nama korban." Di SpringHub hal itu dicegah lewat beberapa lapis: token adalah JWT 256-bit yang ditandatangani (`HS256`) sehingga tidak bisa dipalsukan, cookie ber-`HttpOnly` sehingga JavaScript korban tidak bisa membacanya, `SameSite=Lax` memblokir pengiriman cookie dari situs lain, dan `Max-Age=3600` membatasi umur token. Verifikasi dua sisi (header vs cookie) ditambah just-in-time fetch mencegah token basi dan serangan double-submit yang dipalsukan.

### `POST /api/auth/login` → app/api/auth/login/route.ts

**Peran**: Memvalidasi kredensial email+password, membangun sesi login, dan mengadopsi laporan guest (belum login) ke akun baru.

**Alur Cerita**: Seorang pengguna mengetik email dan password di halaman masuk. Request masuk, dan lapis pertama adalah **rate limiter berbasis IP**: jika IP ini sudah terlalu sering mencoba login, server langsung menjawab `429 "Terlalu banyak percobaan login..."` sebelum kerja berat apa pun dilakukan. Selanjutnya server memeriksa sesi: jika ternyata sudah login, server menolak dengan `400 "Already logged in"` (anti login ganda). Body diurai dan divalidasi dengan skema Zod `loginSchema` — email harus berformat valid dan password wajib diisi; jika gagal, respons `400` berisi `fieldErrors` dari Zod. Email dinormalisasi (lowercase + trim) lalu dicari di tabel `Profile`.

Di sinilah salah satu detail paling menarik: server **selalu** menjalankan `verifyPassword()` — baik hash asli pengguna maupun `DUMMY_PASSWORD_HASH` yang sudah di-*hardcode* — agar durasi respons untuk email yang tidak terdaftar sama dengan email yang terdaftar. Ini menutup *timing attack* yang bisa membocorkan apakah sebuah email terdaftar. Jika password salah dan profilnya ada, ada lapisan kedua: **lockout per akun** (`loginLockout`). Bila sudah 5 kali gagal, respons `429` menyebutkan sisa menit tunggu. Jika kredensial benar, counter lockout di-reset, lalu `createSession()` dipanggil dengan payload `{ userId, role, username, phone }`; flag `secure` cookie mengikuti protokol yang terdeteksi dari header proxy. Terakhir ada ritual adopsi: jika cookie guest (`guestId`) masih ada di browser, semua `Report` dan `PointsLog` milik guest itu dipindahkan ke akun (kolom `userId` diisi, `guestId` dikosongkan) sehingga kontribusi pra-login tidak hilang. Semua kejadian dicatat lewat `auditLog("login", ...)`, dan respons mengembalikan profil ringkas.

**Potongan Kode Asli**:

```ts
// app/api/auth/login/route.ts baris ±17-45
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
      return NextResponse.json({ error: "Already logged in" }, { status: 400 });
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
    // ...
```

```ts
// app/api/auth/login/route.ts baris ±49-70
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
```

**Konstruk**: `try/catch` luar (error handling terpusat), `if` berlapis untuk rate limit → sesi → validasi Zod, lalu blok `if (!profile || !valid)` dengan cabang lockout, dan akhirnya blok adopsi guest (`if (guestId)`).

**🛡️ Kerentanan**: "Kode ini rentan terhadap serangan *brute force* dan *credential stuffing* — karena endpoint login menerima banyak tebakan password dari satu IP maupun satu akun." Di SpringHub diamankan dengan lapisan ganda: `authLimiter` per-IP untuk memboroskan sumber daya penyerang, `loginLockout` per-akun (5 gagal = 15 menit terkunci) untuk melindungi akun tertentu, `DUMMY_PASSWORD_HASH` untuk menutup timing attack, dan skema Zod yang menolak payload tidak valid sebelum kerja bcrypt (yang mahal) dilakukan.

### `POST /api/auth/register` → app/api/auth/register/route.ts

**Peran**: Membuat akun volunteer baru dengan validasi password ketat, menangani konflik email/username, dan langsung membuat sesi + mengadopsi data guest.

**Alur Cerita**: Pengunjung mengisi formulir pendaftaran. Mirip login, lapis pertama adalah rate limiter per-IP dan cek "sudah login?" — jika sudah, tolak `400`. Body divalidasi Zod dengan aturan password yang tegas: **minimal 8 karakter, wajib mengandung huruf BESAR, huruf kecil, dan angka**. Email dinormalisasi lalu dicek duplikat (cek pertama, level aplikasi). Username diturunkan dari email (bagian sebelum `@`) bila tidak diisi; jika username sudah dipakai, server menambahkan suffix `1`, `2`, `3`... sampai menemukan yang kosong (loop `while`). Password di-hash dengan bcrypt 12 rounds (`hashPassword`), lalu `prisma.profile.create` dijalankan — tetapi di balut `try/catch` kedua: jika ada error Prisma `P2002` (unique constraint), server menelusuri `meta.target` untuk membedakan konflik email vs username dan membalas `409` yang tepat. Ini adalah jaring pengaman karena cek aplikasi bisa kalah dalam *race condition* dua pendaftaran simultan. Setelah sukses, sesi dibuat langsung (pengguna langsung login), dan — seperti login — data guest diadopsi bila ada cookie guest. `auditLog` mencatat pendaftaran, lalu respons berisi `{ success, user }`.

**Potongan Kode Asli**:

```ts
// app/api/auth/register/route.ts baris ±73-97
    const passwordHash = await hashPassword(password);

    // Gunakan create dengan catch unique constraint sebagai jaring pengaman
    let profile;
    try {
      profile = await prisma.profile.create({
        data: {
          email,
          passwordHash,
          username,
          role: "volunteer",
        },
      });
    } catch (createErr) {
      if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === "P2002") {
        const target = (createErr.meta?.target as string[]) || [];
        if (target.includes("email")) {
          return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
        }
        if (target.includes("username")) {
          return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 });
        }
      }
      throw createErr; // Re-throw — akan di-catch oleh handler utama
    }
```

**Konstruk**: `try/catch` utama; `if` berlapis (rate limit, sesi, Zod, duplikat email); `while` untuk menemukan username unik; `try/catch` kedua dengan `instanceof Prisma.PrismaClientKnownRequestError` + pemeriksaan `code === "P2002"` dan `target.includes(...)`.

**🛡️ Kerentanan**: "Kode ini rentan terhadap *race condition* pada registrasi email yang sama — karena dua request bersamaan bisa lolos cek duplikat aplikasi." Di SpringHub diamankan dengan catch `P2002` di tingkat database: hanya satu request yang menang `create`, yang kalah menerima `409` dan bukan `500`. Pola "cek dua kali + konstrain unik di DB" ini juga melindungi email dan username sekaligus. Risiko *username enumeration* tidak signifikan karena respons `409` memang diperlukan untuk UX yang jelas, dan rate limiter per-IP membatasi volume probing.

### `POST /api/auth/logout` → app/api/auth/logout/route.ts

**Peran**: Menghancurkan sesi pengguna yang sedang aktif.

**Alur Cerita**: Ini adalah route terpendek di seluruh `app/api` — hanya 8 baris. Ketika pengguna menekan "Keluar", browser mengirim POST tanpa body. Handler mendeteksi protokol dari header proxy (untuk menentukan apakah cookie sesi bertanda `Secure` harus dimusnahkan), lalu memanggil `destroySession(proto === "https")` yang menghapus cookie sesi dari browser dan mematikan sesi di penyimpanan server. Respons selalu `{ success: true }` — tanpa peduli apakah memang ada sesi atau tidak, karena logout harus idempoten. Tidak ada try/catch: kegagalan di sini tidak bisa banyak merusak karena dampak terburuknya adalah sesi tersisa sampai kedaluwarsa.

**Potongan Kode Asli**:

```ts
// app/api/auth/logout/route.ts baris ±4-7
export async function POST(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-scheme") || "https";
  await destroySession(proto === "https");
  return NextResponse.json({ success: true });
}
```

**Konstruk**: Tanpa percabangan — dua baris logika, satu respons.

**🛡️ Kerentanan**: "Kode ini rentan terhadap *session fixation* bila sesi lama tidak benar-benar dibunuh — karena cookie yang tidak dihapus bisa dipakai lagi oleh penyerang yang mencurinya." Di SpringHub, `destroySession` membersihkan sesi di dua tempat (cookie client + record sesi), dan mekanisme `deactivateUserSessions()` pada route lain (reset password, ganti role) memastikan sesi dibatalkan secara terpusat. Tidak ada kerentanan signifikan pada route ini sendiri karena ia tidak memproses input apa pun dari user.

### `GET /api/auth/me` → app/api/auth/me/route.ts

**Peran**: Mengembalikan profil pengguna yang sedang login (atau `{ user: null }` jika belum login) untuk mengisi state aplikasi di sisi client.

**Alur Cerita**: Client (biasanya komponen header atau halaman profil) memanggil endpoint ini saat aplikasi dimuat. Jika tidak ada sesi, server langsung menjawab `{ user: null }` — dan penting dicatat: bukan `401`, melainkan `200` dengan `user: null`, supaya client tidak perlu membedakan "error" dan "belum login". Jika ada sesi, profil diambil dari database dengan daftar kolom yang sengaja dibatasi (`select`): id, email, username, role, phone, region, points, trustScore, createdAt — tanpa `passwordHash`. Jika terjadi error apa pun (misalnya DB mati), server tetap membalas `200 { user: null }` — strategi "graceful degradation" agar UI tidak pernah crash gara-gara endpoint ini. Ini juga contoh RLS-friendly: data yang dikembalikan hanya milik `session.userId` sendiri.

**Potongan Kode Asli**:

```ts
// app/api/auth/me/route.ts baris ±6-32
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        region: true,
        points: true,
        trustScore: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: profile });
  } catch (err) {
    console.error("[Auth Me GET]", err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
```

**Konstruk**: `try/catch`; satu `if (!session)`; `select` untuk membatasi kolom.

**🛡️ Kerentanan**: "Kode ini rentan *over-exposure* bila mengembalikan seluruh kolom profil — karena bisa membocorkan `passwordHash` atau data internal lain." Di SpringHub, daftar kolom dibatasi eksplisit lewat `select`, sehingga hash password dan field sensitif lain tidak pernah keluar dari server. Tidak ada kerentanan signifikan — akses hanya untuk data milik pengguna sendiri, dan `user: null` pada error mencegah info-leak.

### `POST /api/auth/forgot-password` → app/api/auth/forgot-password/route.ts

**Peran**: Membuat token reset password sekali pakai (hash disimpan di DB), mengirim link reset ke email, tanpa membocorkan apakah email terdaftar.

**Alur Cerita**: Pengguna yang lupa password mengetik emailnya. Langkah pertama yang menarik: server **menanyakan email ke database SEBELUM mengecek rate limit**, tetapi balasannya dirancang agar tidak membocorkan status pendaftaran — pesan `genericMessage` "Jika email terdaftar, link reset telah dikirim." dikirim baik untuk email yang ada maupun yang tidak (cek `if (!profile)` membalas sukses palsu). Setelah profil ditemukan, dua rate limiter diperiksa: satu berbasis email (`forgot-pw:${email}`) dan satu berbasis IP (`forgot-pw-ip:...`) — karena penyerang bisa membanjiri banyak email dari satu IP atau satu email dari banyak IP. Token acak 32 byte dibuat (`randomBytes(32)`), tapi yang disimpan ke DB **hanya hash SHA-256-nya** (`tokenHash`) dengan TTL 30 menit — sehingga bocornya database tidak membocorkan token yang masih valid. Link reset dibangun dari `NEXT_PUBLIC_APP_URL` dengan token mentah sebagai query param. Jika `EMAIL_PROVIDER` belum diset (mode log), link dicetak ke console untuk pengembangan; jika sudah, `sendEmail()` mengirim email HTML. Lagi-lagi `auditLog` mencatat permintaan. Catatan unik: karena cek email dilakukan sebelum rate limit, sebuah permintaan untuk email yang tidak ada tidak akan pernah kena 429 — ini disengaja demi kerahasiaan (tidak memberi tahu bahwa email itu tidak ada).

**Potongan Kode Asli**:

```ts
// app/api/auth/forgot-password/route.ts baris ±34-59
    // Always return the same message to prevent email enumeration
    const genericMessage = "Jika email terdaftar, link reset telah dikirim.";

    const profile = await prisma.profile.findUnique({ where: { email } });
    if (!profile) {
      return NextResponse.json({ success: true, message: genericMessage });
    }

    const emailLimiter = await authLimiter.check(`forgot-pw:${email}`);
    if (!emailLimiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }
    const ipLimiter = await authLimiter.check(`forgot-pw-ip:${getClientIp(request)}`);
    if (!ipLimiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await pwdResetTokens.create({
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MIN * 60_000),
        profileId: profile.id,
      },
    });
```

**Konstruk**: `try/catch`; `if (!profile)` untuk respons samar; dua `if` rate limiter; lalu pembuatan token + hash.

**🛡️ Kerentanan**: "Kode ini rentan terhadap *email enumeration* — karena perbedaan respons (sukses vs error) atau perbedaan waktu membocorkan apakah email terdaftar." Di SpringHub diamankan dengan pesan seragam untuk kedua kasus, plus penyimpanan token sebagai hash (bukan token mentah) sehingga serangan *database leak* tidak bisa membajak link reset. Satu catatan: email yang tidak terdaftar tidak kena rate limit (dengan sengaja), tetapi dampaknya kecil karena prosesnya tidak melakukan kerja mahal.

### `POST /api/auth/reset-password` → app/api/auth/reset-password/route.ts

**Peran**: Menerima token + password baru, memvalidasi token (hash, belum terpakai, belum kedaluwarsa), mengganti password, dan mematikan semua sesi lama.

**Alur Cerita**: Pengguna mengeklik link di email yang membawa `?token=...` ke halaman reset, lalu mengisi password baru. Handler memvalidasi kehadiran `token` dan `password`, lalu memeriksa kekuatan password dengan `isValidPassword()` (fungsi lokal: 8+ karakter, huruf besar/kecil, angka). Token mentah di-hash SHA-256 dan dicari di DB. Tiga kondisi menolak: record tidak ditemukan, `usedAt` sudah terisi (token single-use), atau `expiresAt` sudah lewat — semuanya membalas `400 "Token tidak valid atau sudah kadaluarsa"`. Rate limiter per-user (`reset-pw:${record.profileId}`) menghentikan serangan coba-coba. Setelah lolos, urutan eksekusi sangat penting: **token ditandai `usedAt` DULU baru password di-update** — komentar di kode menyebutnya "token yang gagal tidak bisa dipakai ulang": jika update password gagal di tengah, token sudah hangus sehingga penyerang tidak bisa mengulang dengan token yang sama. Terakhir, `deactivateUserSessions(record.profileId)` mematikan semua sesi aktif (termasuk sesi penyerang yang mungkin sudah membajak akun), lalu audit log dan respons sukses.

**Potongan Kode Asli**:

```ts
// app/api/auth/reset-password/route.ts baris ±45-67
    // Hanya hash token yang disimpan di DB — lookup pakai hash, bukan token asli.
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const record = await pwdResetTokens.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt !== null || record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Token tidak valid atau sudah kadaluarsa" }, { status: 400 });
    }

    const limiter = await authLimiter.check(`reset-pw:${record.profileId}`);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }, { status: 429 });
    }

    const passwordHash = await hashPassword(password);

    // tandai single-use dulu, baru update password — token yang gagal tidak bisa dipakai ulang
    await pwdResetTokens.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await prisma.profile.update({
      where: { id: record.profileId },
      data: { passwordHash },
    });

    await deactivateUserSessions(record.profileId);
```

**Konstruk**: `try/catch`; `if` berlapis (token+password wajib, kekuatan password, validitas token, rate limit); urutan `update → update → deactivate` yang sengaja diatur.

**🛡️ Kerentanan**: "Kode ini rentan terhadap *token replay* — karena jika token reset bisa dipakai berulang kali, penyerang yang mencegat link bisa mengganti password kapan saja." Di SpringHub token bersifat single-use (`usedAt`), hanya hash yang tersimpan di DB, ada TTL 30 menit, dan semua sesi lama di-deactivate setelah reset — sehingga password lama (yang mungkin bocor) tidak bisa dipakai lagi. Tidak ada kerentanan signifikan yang tersisa.

### `POST /api/auth/claim-guest` → app/api/auth/claim-guest/route.ts

**Peran**: Mengadopsi laporan dan log poin milik cookie guest ke akun yang sedang login (klaim manual versi POST).

**Alur Cerita**: Route ini adalah versi mandiri dari "ritual adopsi guest" yang juga terjadi di login/register, untuk kasus ketika pengguna baru login di perangkat yang sama dan data guest-nya belum teradopsi. Lapis pertama adalah CSRF (`verifyCsrfToken` dari header), lalu cek sesi (`401` jika tidak login), lalu rate limiter per-user (`claim-guest:${session.userId}`). Guest ID dibaca dari cookie via `getExistingGuestId()`; jika tidak ada, server mengembalikan `{ claimed: 0 }` — bukan error, karena "tidak ada yang bisa diklaim" adalah keadaan normal. Jika ada, dua `updateMany` dijalankan: `Report` dengan `guestId` itu dipindah ke `userId` sesi (dan `guestId` dinullkan), begitu juga `PointsLog`. Jumlah laporan yang berhasil dipindah (`result.count`) dikembalikan. Perhatikan ini bisa memindahkan laporan milik guest yang bukan si pengguna jika cookie guest dibagikan — tapi karena cookie guest bersifat acak per browser, risikonya kecil.

**Potongan Kode Asli**:

```ts
// app/api/auth/claim-guest/route.ts baris ±30-45
    const guestId = getExistingGuestId();
    if (!guestId) {
      return NextResponse.json({ claimed: 0 });
    }

    const result = await prisma.report.updateMany({
      where: { guestId },
      data: { userId: session.userId, guestId: null },
    });

    await prisma.pointsLog.updateMany({
      where: { guestId },
      data: { userId: session.userId, guestId: null },
    });

    return NextResponse.json({ claimed: result.count });
```

**Konstruk**: `try/catch`; `if` berlapis (CSRF → sesi → rate limit → guestId); dua `updateMany` berurutan.

**🛡️ Kerentanan**: "Kode ini rentan jika *guest ID bisa ditebak* — karena penyerang bisa menebak ID guest orang lain dan mencuri laporannya." Di SpringHub ID guest dihasilkan acak dan disimpan di cookie `HttpOnly`, jadi tidak bisa ditebak maupun dibaca skrip pihak ketiga. Tidak ada kerentanan signifikan — route ini juga memakai CSRF penuh dan rate limiting, sesuatu yang tidak dimiliki endpoint guest lainnya.

---

## Domain Report

Domain ini adalah jantung data SpringHub: laporan kontribusi lapangan (monitoring, restorasi, rorak, penanaman, bibit). Empat route di sini melayani publik (submit + baca) dan pemilik laporan (kelola foto, hapus laporan). Titik koordinat presisi hanya disimpan di database untuk admin; publik hanya melihat koordinat yang sudah di-snap 5 km.

### `POST /api/reports` → app/api/reports/route.ts

**Peran**: Menerima submission formulir (5 tipe kontribusi) dengan 4 lapis anti-spam, validasi dinamis/statis, proteksi lokasi, idempotensi offline, dan auto-link ke spring/seedling — tanpa memberikan poin (poin diberikan saat approve).

**Alur Cerita**: Ini route paling kompleks di seluruh aplikasi (497 baris). Mari ikuti sebuah laporan "monitoring mata air" dari awal. Browser mengirim `multipart/form-data` berisi `form_slug`, field-field formulir, `_submit_time`, `_website` (honeypot), dan `clientCorrelationId`. Lapis demi lapis:

1. **CSRF** — token wajib valid, jika tidak `403`.
2. **Rate limit** — kunci berbasis `session.userId` jika login, atau `guestId` jika belum; jika sudah lewat batas → `429`.
3. **Form dikenal?** — cek `prisma.form` (DB) dan `getForm()` (statis); jika keduanya tidak ada → `400 "Form tidak dikenal"`.
4. **Time gate** — `_submit_time` dicatat saat halaman dimuat; jika selisih < 3 detik, itu pasti bot → `429 "Terlalu cepat..."`.
5. **Honeypot** — field `_website` yang disembunyikan dari manusia; jika terisi (bot yang mengisinya), server berpura-pura sukses (`{ success: true, honeypot: true }`) tanpa menyimpan apa pun — bot tidak tahu formulirnya gagal.
6. **Parsing field** — semua entry `formData` diloop; field `*_lat`/`*_lng` divalidasi rentangnya (−90..90 dan −180..180) dan disimpan sebagai `preciseLat`/`preciseLng`; field `[]` (multi-select) diakumulasi menjadi array.
7. **Snap 5 km** — untuk `spring-monitoring` dan `spring-restoration`, koordinat di-snap dengan `snapToProtectionGrid()` (privasi lokasi: publik hanya melihat grid, admin melihat presisi).
8. **Validasi skema** — jika form ada di DB, skema Zod di-generate dinamis dari field-nya (`generateZodSchema`); jika tidak, pakai `formSchemaMap` statis. Gagal validasi → `400` dengan detail `fieldErrors`.
9. **Trust score block** — pengguna dengan `trustScore <= 0` diblokir `403`.
10. **Batas harian guest 5 laporan** — dihitung via `report.count` pada rentang hari ini.
11. **Idempotensi** — jika `clientCorrelationId` sudah pernah dipakai, kembalikan report yang sudah ada (`{ duplicated: true }`) — ini menyelamatkan retry offline ganda.
12. **Create report** — `prisma.report.create` dengan koordinat presisi + snapped; jika kena `P2002` saat race idempotensi, dicari winner-nya dan dianggap sukses.
13. **Auto-link / create Spring** — untuk form monitoring/restorasi: cari spring dengan nama mirip dalam 1 km; jika ada, link; jika tidak, buat spring status `pending`. Untuk form lain: cari spring aktif di grid 5 km yang sama. Semua ini *non-critical* (dibalut try/catch, laporan tetap tersimpan walau tanpa `springId`).
14. **Buat seedling dari form bibit** — jika `species` terisi dan `formSlug` mengandung "seedling": seedling yang sama (user+species) di-stack stoknya; jika belum ada, dibuat `pending` dan ditautkan `reportId`.
15. **Tanpa poin** — komentar di kode menegaskan: poin TIDAK diberikan di sini, melainkan saat admin approve, untuk mencegah dobel pemberian.

**Potongan Kode Asli**:

```ts
// app/api/reports/route.ts baris ±17-36
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
```

```ts
// app/api/reports/route.ts baris ±59-80
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
// app/api/reports/route.ts baris ±138-151
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

**Konstruk**: `try/catch` raksasa; rangkaian `if` bersarang untuk tiap lapis anti-spam; `for...of` untuk parsing `formData.entries()`; `if` multi-cabang untuk tipe field (`_lat`/`_lng`/`[]`); `try/catch` non-kritis untuk link spring, auto-link, dan pembuatan seedling; catch `P2002` untuk idempotensi race.

**🛡️ Kerentanan**: "Kode ini rentan terhadap *spam massal*, *payload raksasa*, dan *abuse titik koordinat* — karena endpoint publik terbuka untuk siapa saja." Di SpringHub diamankan dengan berlapis: CSRF, rate limit per user/guest, time gate 3 detik, honeypot, batas harian guest 5 laporan, validasi koordinat ketat (NaN dan rentang), snap 5 km untuk privasi, pembatasan ukuran field di `lib/forms.ts` (maks 500 karakter), idempotensi untuk mencegah duplikat retry, dan penolakan pengguna trust-score rendah. Poin tidak diberikan di sini, jadi spam tidak menguntungkan penyerang secara langsung.

### `GET /api/reports` → app/api/reports/route.ts

**Peran**: Menampilkan laporan publik yang sudah disetujui (lokasi snapped saja) dengan pagination dan statistik sehat/restorasi.

**Alur Cerita**: Request GET dengan query `limit`/`page` (atau alias `per_page`). Nilai limit dikunci di server: `Math.min(Math.max(parseInt(limitParam) || 50, 1), 200)` — client tidak bisa minta 100 ribu baris sekaligus. `where` sangat ketat: `status: "approved"`, `isActive: true`, dan `form.isActive: true` — jadi laporan yang dinonaktifkan admin maupun formulir yang dinonaktifkan tidak muncul. Dua query paralel (`Promise.all`): `findMany` dengan `select` minimal (hanya field publik: id, formSlug, status, snappedLat/Lng, springId, createdAt, foto terakhir, username+region) dan `count`. Statistik `healthy` (monitoring + seedling), `restoration` (restorasi + rorak + tanam), dan `degraded` (sisanya) dihitung dari daftar. Setiap laporan di-enrich dengan URL foto utama (`buildPhotoUrl`) dari `featuredPhotoId`, atau foto terbaru sebagai fallback. Respons menyertakan pagination `{ page, limit, total, totalPages }`.

**Potongan Kode Asli**:

```ts
// app/api/reports/route.ts baris ±422-463
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "50";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where = {
      status: "approved" as const,
      isActive: true,
      form: { isActive: true },
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          formSlug: true,
          status: true,
          snappedLat: true,
          snappedLng: true,
          springId: true,
          createdAt: true,
          featuredPhotoId: true,
          photos: { select: { id: true, storagePath: true }, take: 1, orderBy: { createdAt: "desc" } },
          user: { select: { username: true, region: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);
```

**Konstruk**: `try/catch`; `Promise.all` untuk findMany+count; `filter` dua kali untuk statistik; `map` untuk enrich URL.

**🛡️ Kerentanan**: "Kode ini rentan *information disclosure* bila mengembalikan koordinat presisi atau laporan non-approved — karena koordinat presisi bisa membuka lokasi pasti mata air yang dilindungi." Di SpringHub publik hanya menerima `snappedLat/snappedLng` (hasil snap 5 km) dan hanya laporan `approved` + aktif. Tidak ada kerentanan signifikan — `select` eksplisit bahkan tidak pernah menyentuh `fieldData` mentah di list publik.

### `DELETE /api/reports/[id]` → app/api/reports/[id]/route.ts

**Peran**: Menghapus laporan milik sendiri (user atau guest) yang masih berstatus `pending`, termasuk foto di storage, sebagai rollback atomik bila upload foto gagal setelah laporan dibuat.

**Alur Cerita**: Endpoint ini lahir dari kebutuhan *rollback atomik*: ketika pembuatan laporan berhasil tapi upload foto gagal di tengah jalan, client memanggil DELETE untuk membatalkan semuanya. Handler membaca sesi dan guestId; jika keduanya tidak ada → `401`. Laporan dicari dengan `include: { photos: true }`; jika tidak ada → `404`. Pemeriksaan kepemilikan: user pemilik (laporan `userId === session.userId`) ATAU guest pemilik (`guestId === guestId`). Jika bukan pemilik → `403`. Lalu aturan penting: **hanya laporan `pending` yang bisa dihapus** — laporan yang sudah direview (approved/rejected) tidak bisa dihapus oleh pemiliknya (integritas data publik). Proses hapus berurutan: foto-foto dihapus dari storage dulu (`Promise.allSettled` — kegagalan sebagian dicatat sebagai warning, bukan error fatal), baru record `Report` dihapus dari DB; `ReportPhoto` ikut terhapus via cascade Prisma.

**Potongan Kode Asli**:

```ts
// app/api/reports/[id]/route.ts baris ±36-67
    // Ownership check: either authenticated user or guest who created the report
    const isOwner =
      (session?.userId && report.userId === session.userId) ||
      (!session?.userId && guestId && report.guestId === guestId);

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow deletion of pending (unreviewed) reports
    if (report.status !== "pending") {
      return NextResponse.json(
        { error: "Hanya laporan pending yang bisa dihapus" },
        { status: 400 }
      );
    }

    // Delete photos from storage first (before DB cascade removes references)
    const photoPaths = report.photos.map((p) => p.storagePath).filter(Boolean);
    const deleteResults = await Promise.allSettled(
      photoPaths.map((path) => deletePhoto(path))
    );
```

**Konstruk**: `try/catch`; `if` berlapis (401 → 404 → 403 → 400); `Promise.allSettled` untuk toleransi kegagalan storage.

**🛡️ Kerentanan**: "Kode ini rentan *IDOR* (Insecure Direct Object Reference) — karena parameter `id` di URL bisa ditebak dan dipakai untuk menghapus laporan orang lain." Di SpringHub dicegah dengan pemeriksaan kepemilikan eksplisit (user ATAU guest pemilik) sebelum aksi apa pun, dan pembatasan status `pending` mencegah manipulasi laporan yang sudah dipublikasikan. Tidak ada kerentanan signifikan yang tersisa.

### `POST /api/reports/[id]/photos` → app/api/reports/[id]/photos/route.ts

**Peran**: Upload foto ke laporan milik sendiri dengan validasi MIME via magic bytes, kompresi 720p, EXIF-strip, dan batas maksimal 5 foto.

**Alur Cerita**: Client mengirim `multipart/form-data` berisi file `photo` dan `field_id`. Setelah cek sesi/guest (`401`) dan kepemilikan report (`404`/`403`), server menghitung jumlah foto yang sudah ada — jika sudah 5, tolak `400 "Maksimal 5 foto per laporan..."`. File diambil dari formData; jika kosong → `400`. File diteruskan ke `uploadPhoto(file, \`reports/${params.id}\`)` yang melakukan: deteksi MIME sejati dari *magic bytes* (bukan dari nama file), batas ukuran 10 MB, pembuangan EXIF (metadata GPS/lokasi pribadi), dan kompresi ke dimensi maks 720p kualitas 80. Record `ReportPhoto` dibuat dengan `storagePath`, ukuran, dan dimensi; respons `201` berisi foto + URL. GET-nya (handler kedua di file yang sama) mengambil semua foto milik report secara publik, diurutkan naik, dan mengembalikan URL via `buildPhotoUrls`.

**Potongan Kode Asli**:

```ts
// app/api/reports/[id]/photos/route.ts baris ±50-86
    // Batasi total foto per report (max 5)
    const existingPhotoCount = await prisma.reportPhoto.count({ where: { reportId: report.id } });
    if (existingPhotoCount >= 5) {
      return NextResponse.json(
        { error: "Maksimal 5 foto per laporan. Hapus foto lama untuk upload baru." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("photo") as File | null;
    const fieldId = (formData.get("field_id") as string) || "photo";

    if (!file) {
      return NextResponse.json(
        { error: "No photo provided" },
        { status: 400 }
      );
    }

    const result = await uploadPhoto(file, `reports/${params.id}`);

    const photo = await prisma.reportPhoto.create({
      data: {
        reportId: params.id,
        fieldId,
        storagePath: result.path,
        mimeType: "image/jpeg",
        width: result.width,
        height: result.height,
      },
    });
```

**Konstruk**: `try/catch`; `if` berlapis (auth, report, kepemilikan, jumlah foto, file ada); lalu upload → create.

**🛡️ Kerentanan**: "Kode ini rentan terhadap *malware upload* / *polyglot file* — karena file gambar bisa disisipi skrip eksekutabel." Di SpringHub MIME divalidasi server-side via magic bytes, EXIF (yang bisa menyembunyikan skrip) dibuang, file dikompresi ulang ke JPEG murni, dan disimpan di path di luar `public/` yang dilayani Nginx tanpa eksekusi. Batas 5 foto per laporan juga mencegah pemborosan storage. Tidak ada kerentanan signifikan.

### `DELETE /api/reports/[id]/photos/[photoId]` → app/api/reports/[id]/photos/[photoId]/route.ts

**Peran**: Menghapus satu foto dari laporan — oleh pemilik laporan (hanya status pending) atau admin (kapan saja).

**Alur Cerita**: Setelah auth dasar, foto dicari sekaligus dengan data report-nya (`include: { report: { select: ... } }`). Tidak ada → `404`. Kepemilikan dihitung: pemilik laporan (user atau guest) ATAU admin (`session?.role === "admin"`). Non-admin hanya boleh menghapus foto dari laporan `pending` — sekali laporan approved, foto jadi bukti publik yang tidak boleh diutak-atik pemiliknya. File dihapus dari storage (dibalut `.catch` agar kegagalan storage tidak menggagalkan hapus DB), lalu record `ReportPhoto` dihapus.

**Potongan Kode Asli**:

```ts
// app/api/reports/[id]/photos/[photoId]/route.ts baris ±34-60
    // Ownership check
    const isOwner =
      (session?.userId && photo.report.userId === session.userId) ||
      (!session?.userId && guestId && photo.report.guestId === guestId);
    const isAdmin = session?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow deletion from pending reports (unless admin)
    if (!isAdmin && photo.report.status !== "pending") {
      return NextResponse.json(
        { error: "Hanya laporan pending yang bisa diedit fotonya" },
        { status: 400 }
      );
    }

    // Delete from storage
    if (photo.storagePath) {
      await deletePhoto(photo.storagePath).catch((e) => {
        console.warn("[DELETE photo] Storage deletion failed:", e);
      });
    }
```

**Konstruk**: `try/catch`; logika OR `isOwner || isAdmin`; `if (!isAdmin && status !== pending)`; `.catch` berantai untuk storage.

**🛡️ Kerentanan**: "Kode ini rentan *IDOR* terhadap foto milik orang lain — karena `photoId` bisa ditebak (UUID) dan di-DELETE." Di SpringHub kepemilikan dihitung ulang dari relasi foto → report, bukan dari input user, dan admin dibedakan dari pemilik biasa. Tidak ada kerentanan signifikan.

---

## Domain Admin Reports

Delapan route berikut adalah panel moderasi admin. Pola umumnya sama: CSRF → cek admin → validasi → mutasi → `auditLog()`. Yang membedakan tiap route adalah logika bisnisnya: persetujuan dengan poin, penolakan dengan trust score, toggle visibilitas, approve massal, dan perawatan laporan yatim (tanpa spring).

### `GET /api/admin/reports` → app/api/admin/reports/route.ts

**Peran**: Menampilkan daftar laporan (semua status, default 50 per halaman) untuk panel moderasi, dengan filter `?status=`.

**Alur Cerita**: Sesi dicek; non-admin langsung `403` — dan catatan penting: di route ini cek sesi TIDAK dibalut try/catch, jadi kesalahan sesi akan jadi 500 (perbedaan kecil dengan route lain yang membalutnya). Filter status divalidasi whitelist (`pending`, `approved`, `rejected`); nilai lain diabaikan (bukan error) sehingga `where` tetap kosong = tampil semua. Pagination dikunci (limit 1–200). Query paralel memuat laporan dengan `include`: user (id, username, email), `reviewedBy`, `pointsLogs` (jumlah poin terkait), 1 foto, dan `_count.photos`. Setiap laporan di-mapping ulang: kolom `user` dan `guestId` disembunyikan, diganti `submitter` — objek `{ type: "user"|"guest", id, name, email }`; untuk guest, nama ditampilkan sebagai `Guest (8 karakter pertama id...)` untuk memudahkan identifikasi tanpa membocorkan seluruh ID.

**Potongan Kode Asli**:

```ts
// app/api/admin/reports/route.ts baris ±21-52
    const where: Record<string, unknown> = {};
    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, username: true, email: true } },
          reviewedBy: { select: { username: true } },
          pointsLogs: { select: { amount: true } },
          photos: { select: { id: true, storagePath: true }, take: 1, orderBy: { createdAt: "asc" } },
          _count: { select: { photos: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    const mapped = reports.map((r) => ({
      ...r,
      submitter: r.user
        ? { type: "user", id: r.user.id, name: r.user.username, email: r.user.email }
        : { type: "guest", id: r.guestId, name: `Guest (${r.guestId?.slice(0, 8)}...)`, email: null },
      user: undefined,
      guestId: undefined,
    }));
```

**Konstruk**: `if` cek admin di luar try; `Promise.all`; `map` untuk transformasi `submitter`; ternary user/guest.

**🛡️ Kerentanan**: "Kode ini rentan *privilege escalation* bila hanya mengandalkan cek role di client — karena siapa pun bisa memanggil API langsung." Di SpringHub role admin diperiksa server-side (`session.role !== "admin"` → 403) setiap request, dan hanya kolom yang relevan untuk moderasi yang dikirim. Tidak ada kerentanan signifikan.

### `POST /api/admin/reports/[id]/approve` → app/api/admin/reports/[id]/approve/route.ts

**Peran**: Menyetujui laporan pending — memberi poin (sekali saja), notifikasi, aktivasi seedling, dan skor kesehatan spring — dengan syarat minimal 3 foto.

**Alur Cerita**: Admin menekan "Setujui" pada sebuah laporan. CSRF + cek admin dulu. Laporan dicari; tidak ada → `404`; jika status bukan `pending` → `400 "Report already reviewed"` (laporan yang sudah direview tidak bisa direview ulang — ini juga anti-dobel-poin). Body opsional dibaca untuk `featuredPhotoId`; jika diisi, dipastikan foto itu benar-benar milik laporan ini (cek `findFirst` dengan `reportId`), jika tidak → `400`. Lalu validasi foto: **minimal 3 foto** sebelum approve — ini menjaga kualitas bukti lapangan. Status di-update ke `approved` + `reviewedById` + `featuredPhotoId`. Kemudian blok pemberian poin yang dijaga ketat: `pointsLog.findFirst` dengan `reason contains "Approved"` diperiksa lebih dulu — jika sudah ada (misalnya approve ulang akibat bug), poin TIDAK diberikan lagi; baru `awardReportPoints()`, `checkDailyStreak()`, dan `updateTrustScore(userId, true)` dijalankan. Notifikasi "Laporan disetujui" dibuat untuk pengguna. Untuk laporan seedling, seedling `pending` milik user diaktifkan (`active`). Untuk `spring-monitoring` dengan `springId`, `computeSpringHealth(fieldData)` menghitung skor kesehatan dan memperbarui spring (`healthScore`, `healthStatus`, `lastSurveyedAt`) — dibalut try/catch non-kritis. `auditLog` ditulis, lalu `{ success: true, status: "approved" }`.

**Potongan Kode Asli**:

```ts
// app/api/admin/reports/[id]/approve/route.ts baris ±60-104
    // Validasi: minimal 3 foto sebelum approve
    const photoCount = await prisma.reportPhoto.count({ where: { reportId: report.id } });
    if (photoCount < 3) {
      return NextResponse.json(
        { error: `Minimal 3 foto diperlukan untuk approve. Saat ini: ${photoCount} foto.` },
        { status: 400 }
      );
    }

    await prisma.report.update({
      where: { id: params.id },
      data: {
        status: "approved",
        reviewedById: session.userId,
        featuredPhotoId,
      },
    });

    const fieldData = JSON.parse(
      typeof report.fieldData === "string"
        ? report.fieldData
        : JSON.stringify(report.fieldData ?? {})
    );

    if (report.userId) {
      const existingPoints = await prisma.pointsLog.findFirst({
        where: { reportId: report.id, reason: { contains: "Approved" } },
      });

      if (!existingPoints) {
        await awardReportPoints(report.userId, report.id, report.formSlug, fieldData);
        await checkDailyStreak(report.userId);
        await updateTrustScore(report.userId, true);
      }

      await prisma.notification.create({
        data: {
          userId: report.userId,
          type: "report-approved",
          title: `Laporan ${report.formSlug} disetujui!`,
          body: "Poin Anda bertambah. Terima kasih atas kontribusinya.",
          link: "/profile",
        },
      });
    }
```

**Konstruk**: `try/catch`; CSRF dan cek admin di dalam try; `if` berlapis (laporan, status, foto, featuredPhoto milik report, existingPoints, userId); blok try/catch non-kritis untuk health scoring.

**🛡️ Kerentanan**: "Kode ini rentan *double-awarding* — bila poin diberikan setiap kali endpoint dipanggil, admin (atau penyerang dengan akun admin) bisa memanggil berulang kali untuk menggandakan poin." Di SpringHub diamankan tiga lapis: status harus `pending` (sekali review = sekali aksi), pengecekan `existingPoints` (guard kedua), dan pembatasan foto minimal 3 (kualitas). Pemberian poin juga server-only via `lib/points.ts` — client tidak pernah mengirim jumlah poin.

### `POST /api/admin/reports/[id]/reject` → app/api/admin/reports/[id]/reject/route.ts

**Peran**: Menolak laporan pending dengan catatan (opsional), menurunkan trust score setelah 3+ penolakan, dan membuat jejak pointsLog + notifikasi.

**Alur Cerita**: Berbeda dari approve, di route ini CSRF diperiksa **di luar** try (jadi kegagalan CSRF tidak tertelan error handler). Admin menolak laporan dengan `note` opsional (body dibaca dengan `.catch(() => ({ note: "" }))` — body boleh kosong). Laporan dicari dan dicek status pending. Status di-update ke `rejected` + `reviewedById` + `reviewNote`. Jika laporan punya pemilik, tiga efek samping dijalankan — masing-masing dibalut try/catch sendiri agar kegagalan satu tidak menggagalkan yang lain (pola *non-blocking*):
1. **Trust score**: `report.count` dengan `status: "rejected"` dihitung; jika sudah ≥ 3 penolakan, `updateTrustScore(userId, false)` (penalti −50).
2. **PointsLog**: record `amount: 0` dengan reason "Laporan ... ditolak" — jejak riwayat untuk transparansi.
3. **Notification**: "Laporan ditolak" dengan catatan admin sebagai body.
Untuk laporan seedling, seedling `pending` dengan species yang sama di-set `rejected`.

**Potongan Kode Asli**:

```ts
// app/api/admin/reports/[id]/reject/route.ts baris ±47-87
    if (report.userId) {
      // Trust score: -50 only if user has been rejected >2 times before
      try {
        const rejectCount = await prisma.report.count({
          where: { userId: report.userId, status: "rejected" },
        });
        if (rejectCount >= 3) {
          await updateTrustScore(report.userId, false);
        }
      } catch (e) {
        console.error("Trust score update failed (non-blocking):", e);
      }

      try {
        await prisma.pointsLog.create({
          data: {
            userId: report.userId,
            reportId: params.id,
            amount: 0,
            reason: `Laporan ${report.formSlug} ditolak`,
            metadata: JSON.stringify({ status: "rejected" }),
          },
        });
      } catch (e) {
        console.error("PointsLog create failed (non-blocking):", e);
      }

      try {
        await prisma.notification.create({
          data: {
            userId: report.userId,
            type: "report-rejected",
            title: `Laporan ${report.formSlug} ditolak`,
            body: body.note || "Laporan Anda tidak memenuhi kriteria validasi.",
            link: "/profile",
          },
        });
      } catch (e) {
        console.error("Notification create failed (non-blocking):", e);
      }
    }
```

**Konstruk**: `try/catch`; CSRF di luar try; `if` berlapis; tiga blok `try/catch` non-blocking terpisah — pola khas "best-effort side effects".

**🛡️ Kerentanan**: "Kode ini rentan *penalti berlebihan* bila penolakan berulang tidak dibatasi — karena satu kesalahan kecil bisa menjatuhkan skor kepercayaan." Di SpringHub penalti trust score baru diterapkan setelah 3 penolakan (`rejectCount >= 3`), memberi ruang kesalahan bagi volunteer baru, dan seluruh efek samping non-kritis tidak pernah menggagalkan operasi utama. Tidak ada kerentanan signifikan.

### `POST /api/admin/reports/[id]/toggle` → app/api/admin/reports/[id]/route.ts

**Peran**: Membalik (`toggle`) flag `isActive` sebuah laporan — soft-hide dari tampilan publik tanpa menghapus data.

**Alur Cerita**: Route paling ramping di domain admin reports. CSRF + cek admin, lalu laporan dicari (`404` jika tidak ada). Nilai baru dihitung dari nilai lama (`isActive: !report.isActive`) — tidak menerima input dari client, sehingga tidak ada jalan untuk menyetel nilai arbitrer. Update dijalankan, `auditLog` dicatat dengan id laporan, dan respons hanya berisi `{ isActive: updated.isActive }` — client tahu status baru untuk memperbarui UI. Efeknya langsung terlihat di `GET /api/reports` (publik) dan `GET /api/springs/[id]` yang memfilter `isActive: true`.

**Potongan Kode Asli**:

```ts
// app/api/admin/reports/[id]/toggle/route.ts baris ±22-33
    const report = await prisma.report.findUnique({ where: { id: params.id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const updated = await prisma.report.update({
      where: { id: params.id },
      data: { isActive: !report.isActive },
    });

    auditLog("post toggle report", "post toggle report id=" + params.id);
    return NextResponse.json({ isActive: updated.isActive });
```

**Konstruk**: `try/catch`; `if (!report)`; toggle berbasis nilai DB lama (`!report.isActive`), bukan body.

**🛡️ Kerentanan**: "Kode ini rentan bila nilai `isActive` diambil dari body — karena client bisa menyetel status sembarang." Di SpringHub nilai selalu dibalik dari state database (`!report.isActive`), sehingga input client tidak berpengaruh. Tidak ada kerentanan signifikan.

### `POST /api/admin/reports/approve-all` → app/api/admin/reports/approve-all/route.ts

**Peran**: Menyetujui SEMUA laporan pending sekaligus (alat bootstrapping/migrasi), dengan health scoring dan perhitungan ulang total poin semua pengguna.

**Alur Cerita**: Ini alat "tukang sapu" — biasanya dipakai sekali saat seed data atau migrasi. CSRF + admin dicek. Semua laporan `pending` diambil. Loop `for...of` menghitung `approved` dan `healthScored`: tiap laporan di-update ke `approved`, health scoring dijalankan untuk `spring-monitoring` (non-kritis), dan — berbeda dari approve satu-satu — poin diberikan langsung dengan `pointsLog.create` memakai `ptsMap` hardcoded (monitoring 100, restoration 1000, trench 500, planting 100, seedling 100, fallback 25) tanpa guard `existingPoints`. Karena ini alat satu-kali, risiko dobel lebih rendah; namun keamanan tetap dijaga karena hanya admin yang bisa memanggil. Setelah loop, **semua** pengguna diambil dan `Profile.points` di-recalculate dari aggregate `pointsLog` — ini memperbaiki ketidakkonsistenan saldo. Audit + respons `{ approved, healthScored }`.

**Potongan Kode Asli**:

```ts
// app/api/admin/reports/approve-all/route.ts baris ±56-91
      // Points
      if (report.userId) {
        const ptsMap: Record<string, number> = {
          "spring-monitoring": 100,
          "spring-restoration": 1000,
          "trench-development": 500,
          "tree-planting": 100,
          "seedling-stock": 100,
        };
        const pts = ptsMap[report.formSlug] || 25;
        await prisma.pointsLog.create({
          data: {
            userId: report.userId,
            reportId: report.id,
            amount: pts,
            reason: `Approved ${report.formSlug}`,
            metadata: JSON.stringify({ batchApprove: true }),
          },
        });
      }

      approved++;
    }

    // Recalculate all user points
    const users = await prisma.profile.findMany({ select: { id: true } });
    for (const u of users) {
      const total = await prisma.pointsLog.aggregate({
        where: { userId: u.id },
        _sum: { amount: true },
      });
      await prisma.profile.update({
        where: { id: u.id },
        data: { points: total._sum.amount || 0 },
      });
    }
```

**Konstruk**: `try/catch`; `for...of` untuk batch; `if (report.userId)`; `if (formSlug && springId)`; loop kedua untuk rekalkulasi poin; blok `try/catch {}` kosong (silent) untuk health scoring.

**🛡️ Kerentanan**: "Kode ini rentan *double-awarding* massal bila dipanggil dua kali — karena loop approve-all tidak mengecek existingPoints seperti route approve tunggal." Mitigasi di SpringHub: endpoint ini hanya bisa dipanggil admin (CSRF + role), dan dirancang untuk sekali pakai. Namun secara desain ia lebih longgar — alasan kenapa komentar internal menyarankan penggunaan hati-hati; tidak ada kerentanan yang bisa dieksploitasi pihak non-admin.

### `GET /api/admin/reports/orphans` → app/api/admin/reports/orphans/route.ts

**Peran**: Menampilkan laporan "yatim" (belum ter-link ke spring) dengan filter status dan mode klaster koordinat untuk mempermudah perawatan data.

**Alur Cerita**: Admin membuka tab "Orphan Reports". Sesi admin dicek. Query params: `status` (all/pending/approved/rejected), `cluster=1` untuk mode klaster, dan pagination standar (limit maks 200). `where` dipaksa `springId: null` — hanya laporan tanpa spring. Include: user, reviewedBy, form (judul + aktif), `_count.photos`. Mapping mengubah `fieldData` mentah menjadi string, menyembunyikan `preciseLat/preciseLng` (koordinat presisi tidak perlu tampil di daftar ini), dan membuat `submitter`. Mode klaster: laporan dikelompokkan ke dalam `Map` dengan kunci `lat.toFixed(3)_lng.toFixed(3)` (grid 3 desimal ≈ 111 m), diurutkan dari klaster terbesar; setiap klaster berisi `count` dan daftar laporannya. Mode non-klaster: daftar biasa dengan pagination.

**Potongan Kode Asli**:

```ts
// app/api/admin/reports/orphans/route.ts baris ±62-89
    if (clusterMode) {
      const clusters: Array<{
        key: string;
        lat: number | null;
        lng: number | null;
        count: number;
        reports: typeof mapped;
      }> = [];
      const map = new Map<string, typeof mapped>();
      for (const r of mapped) {
        if (r.snappedLat === null || r.snappedLng === null) continue;
        const lat = Math.round(r.snappedLat * 1000) / 1000;
        const lng = Math.round(r.snappedLng * 1000) / 1000;
        const key = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
        if (!map.has(key)) {
          map.set(key, []);
          clusters.push({ key, lat, lng, count: 0, reports: [] });
        }
        const cluster = clusters.find((c) => c.key === key)!;
        cluster.reports.push(r);
        cluster.count += 1;
      }
      clusters.sort((a, b) => b.count - a.count);
      return NextResponse.json({ clusters, total, pagination: ... });
    }
```

**Konstruk**: `try/catch`; `if` whitelist status; `Map` + `for...of` untuk klasterisasi; `Array.find` + push; `sort` descending.

**🛡️ Kerentanan**: "Kode ini rentan *information disclosure* bila field `preciseLat/preciseLng` ikut dikirim — karena koordinat presisi hanya untuk admin." Di SpringHub mapping eksplisit hanya mengambil `snappedLat/snappedLng`, dan akses dibatasi admin. Tidak ada kerentanan signifikan.

### `POST /api/admin/reports/orphans/link` → app/api/admin/reports/orphans/link/route.ts

**Peran**: Menautkan sekumpulan laporan yatim (maks 200) ke satu spring yang sudah ada.

**Alur Cerita**: Admin memilih beberapa laporan di UI klaster dan memilih spring tujuan. CSRF + admin dicek. Body diurai dengan `.catch(() => null)`; `reportIds` difilter ketat (hanya string non-kosong) dan `springId` di-trim. Validasi: keduanya wajib (`400`), dan `reportIds.length > MAX_BATCH (200)` ditolak (`400`) — membatasi ukuran batch. Spring tujuan diverifikasi ada (`404`). Eksekusi: `report.updateMany` dengan `where: { id: { in: reportIds }, springId: null }` — kondisi `springId: null` menjamin laporan yang sudah ter-link TIDAK ikut tertimpa. Hasil `count` dikembalikan bersama audit log yang mencatat 20 id pertama laporan.

**Potongan Kode Asli**:

```ts
// app/api/admin/reports/orphans/link/route.ts baris ±22-48
    const body = await request.json().catch(() => null);
    const reportIds: string[] = Array.isArray(body?.reportIds) ? body.reportIds.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
    const springId = typeof body?.springId === "string" && body.springId.trim() ? body.springId.trim() : "";

    if (reportIds.length === 0 || !springId) {
      return NextResponse.json({ error: "reportIds dan springId wajib diisi." }, { status: 400 });
    }
    if (reportIds.length > MAX_BATCH) {
      return NextResponse.json({ error: `Maksimal ${MAX_BATCH} laporan per batch.` }, { status: 400 });
    }

    const spring = await prisma.spring.findUnique({ where: { id: springId }, select: { id: true, name: true } });
    if (!spring) {
      return NextResponse.json({ error: "Spring tidak ditemukan." }, { status: 404 });
    }

    const result = await prisma.report.updateMany({
      where: { id: { in: reportIds }, springId: null },
      data: { springId },
    });
```

**Konstruk**: `try/catch`; `if` berlapis (CSRF, admin, batch kosong, batch besar, spring ada); `updateMany` dengan guard `springId: null`.

**🛡️ Kerentanan**: "Kode ini rentan *mass overwrite* bila `updateMany` tidak dikunci kondisi — karena laporan milik spring lain bisa ikut tertimpa." Di SpringHub kondisi `springId: null` di dalam `where` memastikan hanya laporan yatim yang berubah, dan batas 200 per batch membatasi dampak kesalahan. Tidak ada kerentanan signifikan.

### `POST /api/admin/reports/orphans/create-spring` → app/api/admin/reports/orphans/create-spring/route.ts

**Peran**: Membuat spring baru dari sekumpulan laporan yatim (mengambil nama/koordinat dari laporan pertama), lalu menautkan semua laporan dan membuat MapPoint otomatis.

**Alur Cerita**: Ini route tersibuk di antara trio orphan. CSRF + admin. Body: `reportIds` (wajib, maks 200), plus `name`/`province`/`regency` opsional sebagai override. Laporan dicari (`where springId: null`, diurutkan dari tertua — laporan pertama dianggap sumber data utama); jika tidak ada yang tersisa → `404 "Laporan tidak ditemukan atau sudah ter-link"`. Koordinat diambil dari `snappedLat ?? preciseLat` laporan pertama; jika null → `400`. Nama spring disusun dengan prioritas: `name` dari body → `spring_name` → `B1_nama` → `A_kegiatan` → fallback `"Mata Air"`; provinsi/regency serupa dengan fallback ke field fieldData. Spring dibuat dengan status `active` dan `isDummy: false` (bukan dummy — ini data nyata). Semua laporan ditautkan (`updateMany` dengan guard `springId: null`). Terakhir, pencarian **MapPointType** berdasarkan `typeSlugCandidates` (mis. `spring-monitoring` → `["spring"]`, `spring-restoration` → `["conservation", "spring"]`, `trench-development` → `["trench"]`); jika tipe ditemukan, dibuat `MapPoint` dengan slug unik `slugify(nama)-timestamp-base36`, dan laporan-laporan itu juga diberi `mapPointId`. Seluruh blok MapPoint dibalut try/catch non-kritis — jika gagal, spring tetap tercipta. Audit mencatat `mapPointCreated`.

**Potongan Kode Asli**:

```ts
// app/api/admin/reports/orphans/create-spring/route.ts baris ±86-115
    const fieldData = parseFieldData(first.fieldData);
    const springName =
      name ||
      (typeof fieldData?.spring_name === "string" && fieldData.spring_name.trim()) ||
      (typeof fieldData?.B1_nama === "string" && fieldData.B1_nama.trim()) ||
      (typeof fieldData?.A_kegiatan === "string" && fieldData.A_kegiatan.trim()) ||
      "Mata Air";
    const springProvince =
      province ||
      (typeof fieldData?.A_provinsi === "string" ? fieldData.A_provinsi : "") ||
      (typeof fieldData?.province === "string" ? fieldData.province : "") ||
      "";
    const springRegency = regency || (typeof fieldData?.regency === "string" ? fieldData.regency : "") || "";

    const spring = await prisma.spring.create({
      data: {
        name: springName.slice(0, 200),
        snappedLat,
        snappedLng,
        province: springProvince.slice(0, 100),
        regency: springRegency.slice(0, 100),
        status: "active",
        isDummy: false,
      },
    });

    const result = await prisma.report.updateMany({
      where: { id: { in: reportIds }, springId: null },
      data: { springId: spring.id },
    });
```

**Konstruk**: `try/catch`; fungsi bantu `slugify` dan `parseFieldData`; rantai OR (`||`) untuk prioritas nama; `slice(0, 200)` sebagai batas panjang; blok try/catch non-kritis untuk MapPoint.

**🛡️ Kerentanan**: "Kode ini rentan *data pollution* bila input nama/koordinat tidak dibatasi — karena string raksasa atau nilai tak valid bisa masuk DB." Di SpringHub semua nilai di-`slice` ke panjang aman (200/100), koordinat dipaksa dari data DB (bukan body), dan `parseFieldData` menangani JSON rusak. Tidak ada kerentanan signifikan.

---

## Domain Admin Springs & Seedlings

Enam route untuk mengelola katalog mata air dan bibit dari sisi admin: daftar dengan filter status, serta aksi setujui/tolak. Semua route memakai `isAdmin()` dari `@/lib/auth` (berbeda dari pengecekan `session.role !== "admin"` manual di domain lain — helper ini membaca peran langsung dari sesi).

### `GET /api/admin/springs` → app/api/admin/springs/route.ts

**Peran**: Menampilkan daftar spring (filter status `pending`/`active`/`merged`, maks 100) beserta jumlah laporan per spring untuk panel admin.

**Alur Cerita**: Sesi dicek dengan `getSession()` + `isAdmin()`. Filter status divalidasi whitelist — nilai di luar daftar diabaikan (semua spring tampil). `findMany` mengambil 100 spring terbaru dengan `_count.reports`. Mapping sengaja membuang field koordinat dan field internal: yang dikirim hanya id, nama, provinsi, kabupaten, status, jumlah laporan, dan waktu dibuat — cukup untuk tabel admin. Catatan unik: respons error di route ini selalu `500` (tanpa membedakan `isDatabaseError` → 503), jadi pola error-nya lebih sederhana dari kebanyakan route lain.

**Potongan Kode Asli**:

```ts
// app/api/admin/springs/route.ts baris ±13-40
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (["pending", "active", "merged"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const springs = await prisma.spring.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: { select: { reports: true } },
      },
    });

    const mapped = springs.map((s) => ({
      id: s.id,
      name: s.name,
      province: s.province,
      regency: s.regency,
      status: s.status,
      reportCount: s._count.reports,
      createdAt: s.createdAt,
    }));
```

**Konstruk**: `try/catch`; whitelist filter; `include: { _count }`; `map` untuk memilih kolom.

**🛡️ Kerentanan**: "Kode ini rentan bila koordinat presisi ikut dikirim ke admin UI — namun hanya admin yang berhak melihat presisi, dan route ini bahkan tidak mengirimnya sama sekali." Tidak ada kerentanan signifikan — akses dibatasi admin dan kolom diminimalkan.

### `POST /api/admin/springs/[id]/approve` → app/api/admin/springs/[id]/approve/route.ts

**Peran**: Menyetujui spring yang dibuat dari laporan (status `pending` → `active`) sehingga muncul di peta publik.

**Alur Cerita**: CSRF + `isAdmin()`. Spring dicari; tidak ada → `404 "Spring tidak ditemukan"`. Perhatikan: route ini TIDAK mengecek status — spring yang sudah `active` bisa di-approve ulang tanpa efek samping (idempoten, tidak ada salahnya). Status di-set `active`, audit dicatat dengan nama spring (nama spring diinterpolasi ke log: `Spring ${spring.name} disetujui`), dan respons `{ ok: true }` (bukan `success: true` — inkonsistensi kecil antar route yang perlu disadari saat membaca kode).

**Potongan Kode Asli**:

```ts
// app/api/admin/springs/[id]/approve/route.ts baris ±23-35
    const spring = await prisma.spring.findUnique({ where: { id: params.id } });
    if (!spring) {
      return NextResponse.json({ error: "Spring tidak ditemukan" }, { status: 404 });
    }

    await prisma.spring.update({
      where: { id: params.id },
      data: { status: "active" },
    });

    auditLog("spring approve", `Spring ${spring.name} disetujui`);

    return NextResponse.json({ ok: true });
```

**Konstruk**: `try/catch`; `if (!spring)`; satu `update`.

**🛡️ Kerentanan**: "Kode ini rentan bila status bisa di-set dari body — karena client bisa langsung menyetel `active` tanpa proses review." Di SpringHub nilai status di-hardcode (`data: { status: "active" }`), body tidak dibaca sama sekali. Tidak ada kerentanan signifikan.

### `GET /api/admin/seedlings` → app/api/admin/seedlings/route.ts

**Peran**: Menampilkan daftar bibit (filter status, pagination maks 100) dengan data pemilik untuk moderasi.

**Alur Cerita**: Hampir identik dengan admin/springs tetapi dengan pagination penuh: `limit` default 20, maks 100; whitelist status `pending`/`active`/`rejected`/`exhausted`; `include.user` (id, username, email) untuk konteks siapa pemilik bibit; `_count` tidak dipakai. Respons `{ seedlings, pagination }`. Perbedaannya hanya di tipe data dan pagination — pola yang baik untuk dijadikan acuan membandingkan dua route CRUD yang "mirip tapi beda".

**Potongan Kode Asli**:

```ts
// app/api/admin/seedlings/route.ts baris ±13-42
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "";
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "20";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (["pending", "active", "rejected", "exhausted"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [seedlings, total] = await Promise.all([
      prisma.seedling.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
      }),
      prisma.seedling.count({ where }),
    ]);
```

**Konstruk**: `try/catch`; `Promise.all`; whitelist filter; batas `limit` lewat `Math.min/Math.max`.

**🛡️ Kerentanan**: "Kode ini rentan bila `limit` tidak dikunci — client bisa menarik puluhan ribu baris dan membuat database kewalahan." Di SpringHub `limit` dikunci maks 100 (`Math.min(Math.max(...,1),100)`). Tidak ada kerentanan signifikan.

### `POST /api/admin/seedlings/[id]/approve` → app/api/admin/seedlings/[id]/approve/route.ts

**Peran**: Menyetujui bibit `pending` → `active` agar bisa diminta pengguna lain di marketplace.

**Alur Cerita**: CSRF + `isAdmin()`. Bibit dicari (`404`). Berbeda dari approve spring, route ini **mengecek status**: harus `pending`, jika bukan → `400 "Status bibit bukan 'pending'"`. Ini mencegah bibit yang sudah rejected di-approve ulang tanpa alasan. Update status + audit dengan nama species.

**Potongan Kode Asli**:

```ts
// app/api/admin/seedlings/[id]/approve/route.ts baris ±31-45
    if (seedling.status !== "pending") {
      return NextResponse.json(
        { error: "Status bibit bukan 'pending'" },
        { status: 400 }
      );
    }

    await prisma.seedling.update({
      where: { id: params.id },
      data: { status: "active" },
    });

    auditLog("seedling approve", `Bibit ${seedling.species} disetujui`);
```

**Konstruk**: `try/catch`; guard status `!== "pending"`; satu `update`; audit.

**🛡️ Kerentanan**: "Kode ini rentan bila bibit yang sudah ditolak bisa langsung diaktifkan — melewati proses moderasi." Di SpringHub guard `pending` memaksa transisi status yang sah. Tidak ada kerentanan signifikan.

### `POST /api/admin/seedlings/[id]/reject` → app/api/admin/seedlings/[id]/reject/route.ts

**Peran**: Menolak bibit `pending` → `rejected`.

**Alur Cerita**: Simetris dengan approve: CSRF + admin, cari bibit, guard status `pending`, update ke `rejected`, audit dengan nama species, respons `{ ok: true }`. Tidak ada notifikasi ke pemilik (berbeda dengan reject laporan yang membuat notifikasi) — jadi pemilik baru tahu saat mengecek status bibitnya sendiri.

**Potongan Kode Asli**:

```ts
// app/api/admin/seedlings/[id]/reject/route.ts baris ±23-45
    const seedling = await prisma.seedling.findUnique({
      where: { id: params.id },
    });

    if (!seedling) {
      return NextResponse.json({ error: "Bibit tidak ditemukan" }, { status: 404 });
    }

    if (seedling.status !== "pending") {
      return NextResponse.json(
        { error: "Status bibit bukan 'pending'" },
        { status: 400 }
      );
    }

    await prisma.seedling.update({
      where: { id: params.id },
      data: { status: "rejected" },
    });

    auditLog("seedling reject", `Bibit ${seedling.species} ditolak`);
```

**Konstruk**: `try/catch`; `if` berlapis (404, status guard); `update`; audit.

**🛡️ Kerentanan**: "Kode ini rentan terhadap *status confusion* bila transisi status tidak dibatasi — mis. bibit `active` bisa langsung `rejected` dan merusak stok permintaan yang berjalan." Guard `pending` membatasi; tidak ada kerentanan signifikan karena stok dikelola terpisah di route marketplace.

### `GET /api/admin/seedlings/requests` → app/api/admin/seedlings/requests/route.ts

**Peran**: Menampilkan semua permintaan bibit (maks 100) dengan tiga relasi: peminta, pemilik, dan bibit yang diminta.

**Alur Cerita**: Tanpa query param dan tanpa pagination — hanya `take: 100` dari tabel `SeedlingRequest` terbaru. Include tiga relasi sekaligus: `requester` (siapa yang minta), `owner` (pemilik bibit), `seedling` (species + stok saat ini). Ini endpoint "monitoring" untuk admin melihat arus permintaan bibit tanpa harus membuka profil masing-masing. Error handling standar (500).

**Potongan Kode Asli**:

```ts
// app/api/admin/seedlings/requests/route.ts baris ±13-23
    const requests = await prisma.seedlingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        requester: { select: { id: true, username: true } },
        owner: { select: { id: true, username: true } },
        seedling: { select: { species: true, stock: true } },
      },
    });

    return NextResponse.json({ requests });
```

**Konstruk**: `try/catch`; satu `findMany` dengan `take` dan tiga `include`; tanpa percabangan lain.

**🛡️ Kerentanan**: "Kode ini rentan *data privacy* bila nomor telepon ikut disertakan — namun `select` membatasi hanya id+username." Tidak ada kerentanan signifikan — akses admin-only dan kolom diminimalkan.

---

## Domain Admin Users & Trust Score

Empat route untuk manajemen pengguna: daftar pengguna, ganti role (dengan pencabutan semua sesi), daftar trust score, dan set manual trust score dengan jejak audit di pointsLog.

### `GET /api/admin/users` → app/api/admin/users/route.ts

**Peran**: Menampilkan daftar pengguna ber-pagination (default 50, maks 100) dengan kolom ringkas untuk panel admin.

**Alur Cerita**: Sesi admin dicek (`session.role !== "admin"`). Pagination dengan batas ketat (10–100). `findMany` + `count` paralel; `select` memilih 9 kolom — termasuk `phone` dan `email` (hanya admin yang boleh melihat data kontak ini; endpoint publik tidak pernah mengirimnya). Respons `{ users, total, page, totalPages }`. Tidak ada `auditLog` untuk GET (hanya mutasi yang diaudit — pola umum di seluruh aplikasi).

**Potongan Kode Asli**:

```ts
// app/api/admin/users/route.ts baris ±13-38
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.profile.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          phone: true,
          region: true,
          points: true,
          trustScore: true,
          createdAt: true,
        },
      }),
      prisma.profile.count(),
    ]);

    return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
```

**Konstruk**: `try/catch`; `Promise.all`; `select` eksplisit.

**🛡️ Kerentanan**: "Kode ini rentan bila `passwordHash` ikut ter-select — namun `select` eksplisit menjamin tidak ada." Tidak ada kerentanan signifikan — email/phone hanya dibuka untuk admin yang sudah terverifikasi.

### `PUT /api/admin/users/[id]` → app/api/admin/users/[id]/route.ts

**Peran**: Mengubah role pengguna (volunteer/field_lead/admin) dan **seketika mencabut semua sesi aktif** agar role baru berlaku tanpa menunggu login ulang.

**Alur Cerita**: CSRF diperiksa di luar try. Sesi admin dicek. Body diurai; `role` divalidasi terhadap whitelist `["volunteer", "field_lead", "admin"]` — nilai lain → `400 "Invalid role"`. Ini mencegah typo atau nilai tak dikenal masuk DB (enumerasi role). Update role dijalankan. Langkah paling menarik: `deactivateUserSessions(params.id)` — semua sesi JWT lama pengguna yang diubah langsung dimatikan (ledger revokasi). Konsekuensi: jika admin menaikkan user jadi admin, user harus login ulang untuk mendapat sesi ber-role admin; jika user di-turunkan, sesi lamanya tidak bisa dipakai lagi (privilege dihilangkan seketika). `auditLog` + respons user ringkas.

**Potongan Kode Asli**:

```ts
// app/api/admin/users/[id]/route.ts baris ±22-41
    const body = await request.json();
    const { role } = body;

    const validRoles = ["volunteer", "field_lead", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.profile.update({
      where: { id: params.id },
      data: { role },
      select: { id: true, username: true, role: true },
    });
    // Cabut semua sesi aktif user — role baru berlaku seketika (revocation ledger)
    await deactivateUserSessions(params.id);
    auditLog("put user", "put user");
```

**Konstruk**: CSRF di luar try; `if` whitelist; update → `deactivateUserSessions`.

**🛡️ Kerentanan**: "Kode ini rentan *privilege persisten* bila sesi lama tidak dicabut — user yang di-turunkan perannya masih bisa beraksi sebagai admin sampai cookie kedaluwarsa." Di SpringHub `deactivateUserSessions` mencabut seketika (revocation ledger), jadi eskalasi maupun penurunan berlaku instan. Tidak ada kerentanan signifikan.

### `GET /api/admin/trust-scores` → app/api/admin/trust-scores/route.ts

**Peran**: Menampilkan seluruh pengguna diurutkan dari trust score terendah, lengkap dengan jumlah laporan yang pernah ditolak.

**Alur Cerita**: Admin dicek, lalu `findMany` dengan `orderBy: { trustScore: "asc" }` — pengguna bermasalah (skor rendah) tampil pertama. Yang menarik adalah `_count.reports` dengan **filter ber-condition**: `{ where: { status: "rejected" } }` — Prisma mendukung `_count` dengan filter relasi, jadi jumlah penolakan dihitung tanpa query terpisah. Kolom yang dikirim: id, email, username, role, region, points, trustScore, createdAt, rejectCount. Tanpa try/catch — kegagalan DB akan jadi 500 standar Next.js.

**Potongan Kode Asli**:

```ts
// app/api/admin/trust-scores/route.ts baris ±12-31
    const users = await prisma.profile.findMany({
      orderBy: { trustScore: "asc" },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        region: true,
        points: true,
        trustScore: true,
        createdAt: true,
        _count: {
          select: {
            reports: { where: { status: "rejected" } },
          },
        },
      },
    });

    return NextResponse.json({ users });
```

**Konstruk**: satu `findMany`; `orderBy` naik; `_count` dengan `where` filter.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — endpoint read-only untuk admin, tanpa input dari user (tidak ada query param), dan tidak membocorkan data selain profil.

### `PUT /api/admin/trust-scores/[id]` → app/api/admin/trust-scores/[id]/route.ts

**Peran**: Menyetel trust score pengguna secara manual (0–100) oleh admin, dengan jejak audit di pointsLog dan auditLog.

**Alur Cerita**: CSRF + admin. Body dibaca dengan `.catch(() => ({}))`; `trustScore` divalidasi ketat: **harus number dan berada di 0–100** — nilai lain → `400` (bukan `NaN` check saja, tapi tipe + rentang). User dicari; tidak ada → `404`. Score di-update, lalu `pointsLog.create` dengan `amount: 0` dan metadata JSON berisi `{ action: "manual_set", oldScore, newScore, adminId }` — jejak lengkap siapa mengubah dari apa ke apa, tanpa memengaruhi saldo poin. Ini contoh audit trail non-finansial yang tetap tercatat di buku besar poin. Audit log ditulis, respons `{ success: true, trustScore }`.

**Potongan Kode Asli**:

```ts
// app/api/admin/trust-scores/[id]/route.ts baris ±22-61
    const body = await request.json().catch(() => ({}));
    const { trustScore } = body;

    if (typeof trustScore !== "number" || trustScore < 0 || trustScore > 100) {
      return NextResponse.json(
        { error: "Trust score must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.profile.update({
      where: { id: params.id },
      data: { trustScore },
    });

    await prisma.pointsLog.create({
      data: {
        userId: params.id,
        amount: 0,
        reason: "Trust score diubah oleh admin",
        metadata: JSON.stringify({
          action: "manual_set",
          oldScore: profile.trustScore,
          newScore: trustScore,
          adminId: session.userId,
        }),
      },
    });
```

**Konstruk**: CSRF di luar try; validasi tipe+rentang; cek user; update + pointsLog audit; auditLog.

**🛡️ Kerentanan**: "Kode ini rentan *unrestricted score* bila tanpa batas rentang — admin bisa menyetel 999 dan membuat semua user kena blokir aneh." Validasi 0–100 memastikan skala konsisten dengan sistem. Tidak ada kerentanan signifikan — aksi tercatat penuh (siapa, dari, ke).

---

## Domain Admin Forms

Empat route pengelola formulir dinamis — fitur yang membuat SpringHub bisa menambah jenis laporan baru tanpa deploy kode. `lib/forms.ts` tetap menjadi sumber kebenaran statis, sementara tabel `Form`/`FormField` adalah override dinamis.

### `GET /api/admin/forms` → app/api/admin/forms/route.ts

**Peran**: Menampilkan semua formulir (termasuk yang non-aktif) dengan field-field terurut dan jumlah laporan, dengan filter `?status=active|inactive|all`.

**Alur Cerita**: GET-nya tidak memakai CSRF (read-only). `isAdmin()` lokal (fungsi `isAdmin` yang didefinisikan di file ini sendiri — pola menarik: tiap file admin forms mendefinisikan ulang helper kecil ini). Filter status: `active` → `isActive: true`, `inactive` → `false`, selain itu semua. `findMany` dengan `include.fields` (terurut) dan `_count.reports`. Karena `_count` menghitung laporan dari kolom `formSlug` (bukan relasi FK), formulir statis sekalipun terhitung.

### `POST /api/admin/forms` → app/api/admin/forms/route.ts

**Peran**: Membuat formulir baru beserta field-field-nya, sekaligus memastikan MapPointType terkait ada (dibuat otomatis bila belum).

**Alur Cerita**: CSRF + admin. Body wajib berisi `slug` dan `title`; slug dicek unik (`409` bila sudah ada). Langkah unik: `contribToType` memetakan `contributionType` (monitoring/restoration/trench/tree_planting/seedling_stock) ke slug MapPointType (spring/spring-restoration/trench/tree-planting/seedling). Tipe dicari; fallback ke slug form; jika tetap tidak ada, **MapPointType dibuat otomatis** dengan ikon `MapPin`. Setelah itu `Form` dibuat dengan nested `fields.create` (setiap field: fieldId, label, type, required, placeholder, helpText, options JSON, sortOrder dari index). `pointsOnSubmit` default 25. Audit + `201` dengan form + fields + mapType.

**Potongan Kode Asli**:

```ts
// app/api/admin/forms/route.ts baris ±81-108
    // Cari MapPointType berdasarkan contributionType dulu
    // Setiap form dapet MapPointType sendiri (bukan share)
    const contribToType: Record<string, string> = {
      monitoring: "spring",
      restoration: "spring-restoration",
      trench: "trench",
      tree_planting: "tree-planting",
      seedling_stock: "seedling",
    };
    const typeSlug = contribToType[contributionType || ""] || slug;
    let mapPointType = await prisma.mapPointType.findUnique({ where: { slug: typeSlug } });
    if (!mapPointType) {
      // Coba cari berdasarkan slug form (fallback)
      mapPointType = await prisma.mapPointType.findUnique({ where: { slug } });
    }
    if (!mapPointType) {
      // Bikin baru kalo belum ada
      mapPointType = await prisma.mapPointType.create({
        data: {
          slug,
          name: title,
          description: description ? `Titik untuk "${title}"` : `Titik untuk "${title}"`,
          icon: "MapPin",
          sortOrder: 0,
          isActive: true,
        },
      });
    }
```

**Konstruk**: `try/catch`; CSRF di luar try; `if` slug wajib; cek unik; rantai fallback MapPointType (ternary berulang); nested create.

**🛡️ Kerentanan**: "Kode ini rentan *slug injection* bila slug tidak dibersihkan — karakter aneh bisa membuat URL rusak atau konflik route." Di SpringHub slug hanya dicek keunikan dan kepanjangan (di route lain ada `slugify`); kombinasi tabel DB terpisah (`Form` bukan route Next.js) membuat risiko rendah. Tidak ada kerentanan signifikan — akses admin-only + CSRF.

### `GET /api/admin/forms/[id]` → app/api/admin/forms/[id]/route.ts

**Peran**: Mengambil detail satu formulir + field-nya untuk halaman edit admin.

**Alur Cerita**: Sesi admin dicek; formulir dicari dengan `include.fields` terurut. Tidak ada → `404`. Uniknya, route ini memanggil `auditLog("get form", ...)` untuk **akses baca** — salah satu dari sedikit GET yang diaudit di aplikasi (biasanya hanya mutasi yang diaudit). Ini keputusan desain yang bisa didebat: jejak pembacaan form berguna untuk investigasi perubahan yang tidak disengaja.

**Konstruk**: `try/catch`; `if (!form)`; `auditLog` pada GET.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — read-only, admin-only, dan tanpa input selain id.

### `PUT /api/admin/forms/[id]` → app/api/admin/forms/[id]/route.ts

**Peran**: Memperbarui metadata formulir dan mengganti seluruh field-nya (delete all → create all), dengan proteksi perubahan slug yang sudah punya laporan.

**Alur Cerita**: CSRF + admin. Body menampung slug, title, description, pointsOnSubmit, contributionType, isActive, sortOrder, fields. Blok paling penting adalah **perlindungan slug**: jika slug diubah, pertama dihitung jumlah laporan yang memakai slug lama (`report.count({ where: { formSlug: currentForm.slug } })`); jika > 0, perubahan **ditolak `409`** dengan pesan jelas — karena mengganti slug akan memutus relasi laporan yang disimpan sebagai string. Jika aman, slug dicek unik (kecuali dirinya sendiri via `NOT: { id }`). Update metadata memakai spread condition (`...(slug !== undefined && { slug })`) — hanya field yang dikirim yang berubah. Jika `fields` berupa array, strateginya destruktif: `deleteMany` semua field lama, lalu `createMany` field baru dengan sortOrder dari index. Ini sederhana namun berarti setiap edit field memunculkan ID field baru — konsekuensi yang harus dipahami tim.

**Potongan Kode Asli**:

```ts
// app/api/admin/forms/[id]/route.ts baris ±64-97
    // Check slug uniqueness if changed
    if (slug && currentForm && slug !== currentForm.slug) {
      // Cegah orphan reports — tolak slug change jika ada reports dengan slug lama
      const reportCount = await prisma.report.count({ where: { formSlug: currentForm.slug } });
      if (reportCount > 0) {
        return NextResponse.json(
          { error: `Tidak bisa mengganti slug: ${reportCount} laporan masih menggunakan slug "${currentForm.slug}"` },
          { status: 409 }
        );
      }
      const existing = await prisma.form.findFirst({
        where: { slug, NOT: { id: params.id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A form with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Update form metadata
    await prisma.form.update({
      where: { id: params.id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(pointsOnSubmit !== undefined && { pointsOnSubmit }),
        ...(contributionType !== undefined && { contributionType }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
```

**Konstruk**: `try/catch`; `if` bersarang (slug berubah → cek laporan → cek unik); spread condition; `deleteMany` + `createMany` untuk fields.

**🛡️ Kerentanan**: "Kode ini rentan *orphan data* bila slug diubah bebas — laporan yang menyimpan slug lama akan kehilangan referensi formulirnya." Di SpringHub perubahan slug diblokir selama masih ada laporan memakainya (409). Tidak ada kerentanan signifikan.

### `DELETE /api/admin/forms/[id]` → app/api/admin/forms/[id]/route.ts

**Peran**: Menghapus formulir — hard-delete bila belum punya laporan, soft-delete (`isActive=false`) bila sudah punya, supaya laporan lama tetap ter-render.

**Alur Cerita**: CSRF + admin. Form dicari (404). Jumlah laporan dengan `formSlug` form ini dihitung: jika > 0, form hanya di-nonaktifkan (`isActive: false`) dan respons `{ softDelete: true }` menyebutkan jumlah laporan yang dirujuk — ini menjawab bug lama "admin menghapus form tapi form muncul lagi setelah refresh" (soft-delete persisten). Jika 0 laporan, form dihapus permanen. Catatan: field-fieldnya ikut terhapus via cascade relasi FK.

**Potongan Kode Asli**:

```ts
// app/api/admin/forms/[id]/route.ts baris ±174-196
    // Check if any reports reference this form
    const reportCount = await prisma.report.count({
      where: { formSlug: form.slug },
    });

    if (reportCount > 0) {
      // Soft-delete: deactivate instead of delete
      await prisma.form.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        softDelete: true,
        message: `Form "${form.title}" dinonaktifkan karena ada ${reportCount} laporan yang merujuk padanya.`,
      });
    }

    // Hard-delete: no reports referencing this form
    await prisma.form.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, softDelete: false });
```

**Konstruk**: `try/catch`; `if (reportCount > 0)` → soft-delete; else hard-delete.

**🛡️ Kerentanan**: "Kode ini rentan *data loss* bila form dengan laporan dihapus permanen — semua laporan menjadi yatim." Strategi dua tahap (soft/hard delete) mencegahnya. Tidak ada kerentanan signifikan.

### `POST /api/admin/forms/[id]/fields` → app/api/admin/forms/[id]/fields/route.ts

**Peran**: Menambahkan satu field baru ke formulir, dengan sortOrder otomatis melanjutkan field terakhir dan cek duplikat `fieldId`.

**Alur Cerita**: CSRF + admin. Form dicari termasuk field terakhirnya (`orderBy: { sortOrder: "desc" }, take: 1`) untuk menghitung `defaultSortOrder = last + 1`. Validasi: `fieldId`, `label`, `type` wajib; dan fieldId harus unik dalam form — dicek via `findUnique` dengan compound key `formId_fieldId` (Prisma `@@unique`), jika ada → `409`. Field dibuat dengan `options` di-JSON-stringify. Audit + `201`.

**Potongan Kode Asli**:

```ts
// app/api/admin/forms/[id]/fields/route.ts baris ±44-68
    const existing = await prisma.formField.findUnique({
      where: { formId_fieldId: { formId: params.id, fieldId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Field with id "${fieldId}" already exists in this form` },
        { status: 409 }
      );
    }

    const defaultSortOrder = (form.fields[0]?.sortOrder ?? -1) + 1;

    const field = await prisma.formField.create({
      data: {
        formId: params.id,
        fieldId,
        label,
        type: type || "text",
        required: required ?? false,
        placeholder: placeholder || "",
        helpText: helpText || "",
        options: JSON.stringify(options || []),
        sortOrder: sortOrder ?? defaultSortOrder,
      },
    });
```

**Konstruk**: `try/catch`; CSRF di luar try; cek duplikat compound key; `??` untuk default.

**🛡️ Kerentanan**: "Kode ini rentan *duplicate fieldId* bila tidak ada unique constraint — dua field dengan id sama akan membuat validasi dinamis ambigu." Constraint `@@unique` di skema + cek aplikasi menjaga. Tidak ada kerentanan signifikan.

### `PUT /api/admin/forms/[id]/fields/[fieldId]` → app/api/admin/forms/[id]/fields/[fieldId]/route.ts

**Peran**: Memperbarui sebagian atau seluruh properti satu field (termasuk labelEn/optionsEn untuk i18n).

**Alur Cerita**: CSRF + admin. Field dicari via compound key (404 bila tidak ada). Update memakai spread condition untuk 10 properti: `fieldId`, `label`, `labelEn`, `type`, `required`, `placeholder`, `helpText`, `options` (JSON), `optionsEn` (JSON), `sortOrder` — hanya yang dikirim yang berubah. Audit dengan id field. DELETE-nya di file yang sama: cari field (404), `formField.delete`, respons `{ success: true }` tanpa audit (sedikit inkonsisten dengan route lain yang selalu audit mutasi).

**Potongan Kode Asli**:

```ts
// app/api/admin/forms/[id]/fields/[fieldId]/route.ts baris ±36-50
    const field = await prisma.formField.update({
      where: { id: existing.id },
      data: {
        ...(fieldId !== undefined && { fieldId }),
        ...(label !== undefined && { label }),
        ...(type !== undefined && { type }),
        ...(required !== undefined && { required }),
        ...(placeholder !== undefined && { placeholder }),
        ...(helpText !== undefined && { helpText }),
        ...(options !== undefined && { options: JSON.stringify(options) }),
        ...(labelEn !== undefined && { labelEn }),
        ...(optionsEn !== undefined && { optionsEn: JSON.stringify(optionsEn) }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
```

**Konstruk**: `try/catch`; CSRF di luar try; cek eksistensi; spread condition 10 properti.

**🛡️ Kerentanan**: "Kode ini rentan *partial update abuse* bila properti yang tidak dikirim tetap tertimpa undefined — namun spread condition hanya menulis field yang ada." Tidak ada kerentanan signifikan.

---

## Domain Admin Courses & Content

Empat route untuk mengelola konten pembelajaran (kursus + modul) dan blok konten landing page. Keduanya memakai pola CRUD yang sama, tapi dengan karakter berbeda: kursus memakai nested create untuk modul, konten memakai skema Zod.

### `GET /api/admin/courses` → app/api/admin/courses/route.ts

**Peran**: Menampilkan semua kursus (termasuk non-aktif) dengan modul terurut dan jumlah progress user.

**Alur Cerita**: Admin dicek via helper lokal `isAdmin`. `findMany` semua kursus (`orderBy sortOrder`) dengan `include.modules` (terurut) dan `_count.progress` — jumlah orang yang pernah memulai kursus. Tidak ada pagination (jumlah kursus kecil). Ini kebalikan dari `/api/courses` publik yang hanya menampilkan `isActive: true`.

**Konstruk**: `try/catch`; `include` bertingkat; `_count`.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — read-only untuk admin; tidak ada input user.

### `POST /api/admin/courses` → app/api/admin/courses/route.ts

**Peran**: Membuat kursus baru + modul-modul awal dalam satu operasi, dengan cek slug unik.

**Alur Cerita**: CSRF + admin. `slug` dan `title` wajib; slug dicek unik (`409`). `create` dengan nested `modules.create` — tiap modul memakai `sortOrder` dari index array. Default: level "Beginner", duration "30 min", icon "BookOpen". Audit + `201` dengan kursus lengkap.

**Potongan Kode Asli**:

```ts
// app/api/admin/courses/route.ts baris ±61-93
    // Check slug uniqueness
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A course with this slug already exists" },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        slug,
        title,
        description: description || "",
        level: level || "Beginner",
        duration: duration || "30 min",
        icon: icon || "BookOpen",
        modules: modules?.length
          ? {
              create: modules.map(
                (m: { title: string; content?: string }, i: number) => ({
                  title: m.title,
                  content: m.content || "",
                  sortOrder: i,
                })
              ),
            }
          : undefined,
      },
      include: { modules: { orderBy: { sortOrder: "asc" } } },
    });
```

**Konstruk**: `try/catch`; CSRF di luar try; `if` slug wajib + unik; nested `create`; ternary untuk modules.

**🛡️ Kerentanan**: "Kode ini rentan *stored XSS* bila konten modul admin disimpan mentah — karena konten dirender di browser pengguna." Di SpringHub XSS ditangani di sisi baca: `GET /api/courses/[slug]` men-sanitize konten dengan DOMPurify (lihat Domain Kursus). Penyimpanan mentah disengaja agar editor admin bisa menulis HTML, dan sanitasi terjadi sebelum konten keluar ke publik. Tidak ada kerentanan signifikan.

### `GET /api/admin/courses/[id]` → app/api/admin/courses/[id]/route.ts

**Peran**: Mengambil detail satu kursus + modul untuk halaman edit.

**Alur Cerita**: Admin dicek; kursus dicari dengan modul terurut; 404 bila tidak ada; `auditLog("put course", ...)` dicatat walau ini GET — pola yang sama dengan admin/forms/[id]. Respons kursus lengkap dengan `content` mentah (belum di-sanitize — hanya admin yang melihat, dan admin adalah sumber konten).

**Konstruk**: `try/catch`; `if (!course)`; audit pada GET.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — konten mentah hanya untuk admin.

### `PUT /api/admin/courses/[id]` → app/api/admin/courses/[id]/route.ts

**Peran**: Memperbarui kursus + mengganti seluruh modul (deleteMany → createMany), dengan cek slug unik.

**Alur Cerita**: CSRF + admin. Jika `slug` dikirim, dicek unik terhadap kursus lain (`NOT: { id }`) → 409 bila bentrok. Update metadata dengan spread condition (8 properti). Jika `modules` array, strategi delete-then-create seperti fields form: semua modul lama dihapus, modul baru dibuat dengan sortOrder index. Konsekuensi sama: ID modul lama hilang — dan karena `coursesProgress` mereferensikan modul? Tidak — progress hanya menyimpan `courseSlug` + angka `completedModules`, jadi aman. DELETE di file yang sama: hapus kursus + modul via cascade, respons sukses.

**Potongan Kode Asli**:

```ts
// app/api/admin/courses/[id]/route.ts baris ±86-106
    // Update modules if provided
    if (modules && Array.isArray(modules)) {
      // Delete existing modules
      await prisma.courseModule.deleteMany({
        where: { courseId: params.id },
      });

      // Create new modules
      if (modules.length > 0) {
        await prisma.courseModule.createMany({
          data: modules.map(
            (m: { title: string; content?: string }, i: number) => ({
              courseId: params.id,
              title: m.title,
              content: m.content || "",
              sortOrder: i,
            })
          ),
        });
      }
    }
```

**Konstruk**: `try/catch`; `if (slug)` + cek unik; spread condition; `if (modules && Array.isArray)`; deleteMany/createMany.

**🛡️ Kerentanan**: "Kode ini rentan *progress drift* bila ID modul direferensikan — namun progress kursus hanya menyimpan angka modul selesai, bukan ID modul, jadi penggantian modul tidak merusak riwayat." Tidak ada kerentanan signifikan.

### `DELETE /api/admin/courses/[id]` → app/api/admin/courses/[id]/route.ts

**Peran**: Menghapus kursus beserta modul (cascade).

**Alur Cerita**: CSRF + admin; satu `course.delete`; cascade Prisma menghapus `CourseModule`. Catatan: `coursesProgress` milik user yang sudah belajar akan menjadi "yatim" (menunjuk ke kursus yang tidak ada) — karena progress disimpan per-user dan tidak terhapus. Ini kelemahan kecil yang bisa dibersihkan via task terpisah.

**Konstruk**: `try/catch`; satu delete.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — hanya admin; dampak data user kecil (progress yatim tanpa kebocoran).

### `GET /api/admin/content` → app/api/admin/content/route.ts

**Peran**: Menampilkan blok konten landing page (opsional filter `?section=`).

**Alur Cerita**: Admin dicek; jika query `section` diberikan, hanya blok pada section itu; diurutkan `sortOrder` naik lalu `createdAt` turun. Tanpa try/catch dan tanpa error handler — kegagalan DB menghasilkan 500 standar.

**Konstruk**: `if` filter; satu `findMany`.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — read-only admin.

### `POST /api/admin/content` → app/api/admin/content/route.ts

**Peran**: Membuat blok konten baru dengan validasi skema Zod.

**Alur Cerita**: CSRF + admin. Inilah salah satu dari sedikit route admin yang memakai **Zod** (`contentSchema`): `section` dan `title` wajib non-kosong; field lain opsional. Kegagalan validasi → `400` dengan `details` hasil `flatten()` Zod. Create langsung dari `parsed.data` — data sudah tervalidasi tipe-nya (mis. `sortOrder` harus number). Audit + `{ success, item }`.

**Potongan Kode Asli**:

```ts
// app/api/admin/content/route.ts baris ±8-20
const contentSchema = z.object({
  section: z.string().min(1),
  type: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  linkLabel: z.string().optional(),
  data: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});
```

**Konstruk**: `try/catch`; `safeParse` Zod; `if (!parsed.success)`.

**🛡️ Kerentanan**: "Kode ini rentan bila URL konten (`imageUrl`/`linkUrl`) dipakai untuk *phishing* atau *SSRF* — browser pengguna akan memuat URL itu." Di SpringHub belum ada validasi skema URL (hanya string) — ini celah kecil yang disarankan diperketat (validasi `z.url()` atau daftar domain). Namun karena hanya admin yang bisa menulis, risikonya internal, bukan eksternal.

### `PUT /api/admin/content/[id]` → app/api/admin/content/[id]/route.ts

**Peran**: Memperbarui blok konten (partial update dari body mentah).

**Alur Cerita**: CSRF + admin. Body langsung dipakai sebagai `data` update tanpa validasi skema — kontras dengan POST yang memakai Zod. Ini berarti admin bisa mengirim properti di luar skema (mis. kolom tak dikenal) yang akan ditolak Prisma sebagai field tak dikenal. Audit + respons. Karena body mentah, tipe field seperti `sortOrder: "abc"` akan gagal di Prisma → 500. Secara fungsional berfungsi, tapi POST lebih rapi daripada PUT di sini.

**Potongan Kode Asli**:

```ts
// app/api/admin/content/[id]/route.ts baris ±21-28
    const body = await request.json();
    const item = await prisma.contentBlock.update({
      where: { id: params.id },
      data: body,
    });
```

**Konstruk**: `try/catch`; CSRF di luar try; update `data: body` mentah.

**🛡️ Kerentanan**: "Kode ini rentan *mass assignment* — karena body mentah langsung dipakai sebagai data update, field internal yang tidak seharusnya bisa diubah (mis. `createdAt`) ikut terbuka." Di Prisma, field yang tidak ada di skema ditolak, dan tidak ada kolom sensitif (seperti role/hash) di tabel ini, sehingga dampak mass assignment rendah. Tetap disarankan memakai skema Zod seperti POST; tidak ada kerentanan signifikan saat ini.

### `DELETE /api/admin/content/[id]` → app/api/admin/content/[id]/route.ts

**Peran**: Menghapus blok konten.

**Alur Cerita**: CSRF + admin; satu `delete`; audit dengan id. Tidak ada pengecekan eksistensi → menghapus id yang tidak ada akan melempar error Prisma `P2025` yang ditangkap dan dibalas 500 (daripada 404) — detail kecil yang membedakan route ini dari CRUD lain.

**Konstruk**: `try/catch`; delete langsung; audit.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — admin-only; ketiadaan cek 404 hanya soal UX, bukan keamanan.

---

## Domain Admin Point Rules

Dua route untuk mengelola tabel `PointRule` — aturan poin yang bisa diubah admin tanpa deploy (mis. nilai poin kursus). Endpoint publiknya (`GET /api/point-rules`) akan dibahas di Domain Infrastruktur.

### `GET /api/admin/point-rules` → app/api/admin/point-rules/route.ts

**Peran**: Menampilkan semua aturan poin terurut (termasuk non-aktif).

**Alur Cerita**: Admin dicek. `findMany` tanpa filter, `orderBy sortOrder`. Semua kolom dikembalikan termasuk `isActive`. Tidak ada pagination.

**Konstruk**: `try/catch`; satu findMany.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — read-only admin.

### `POST /api/admin/point-rules` → app/api/admin/point-rules/route.ts

**Peran**: Membuat aturan poin baru dengan validasi field wajib (name, points, category).

**Alur Cerita**: CSRF + admin. Validasi manual: `name`, `points`, `category` wajib; `points` dikonversi `Number()` (string "100" diterima, tapi `"abc"` jadi `NaN` yang tersimpan — kelemahan kecil tanpa pengecekan `isNaN`). Default: icon "Star", isActive true, sortOrder 0. Audit + `201`.

**Potongan Kode Asli**:

```ts
// app/api/admin/point-rules/route.ts baris ±45-65
    if (!name || points === undefined || !category) {
      return NextResponse.json(
        { error: "name, points, and category are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.pointRule.create({
      data: {
        name,
        description: description ?? "",
        points: Number(points),
        category,
        icon: icon ?? "Star",
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });
```

**Konstruk**: `try/catch`; `if` validasi manual; `Number()` coercion.

**🛡️ Kerentanan**: "Kode ini rentan *NaN injection* — nilai `points` non-numerik menjadi NaN di DB dan merusak perhitungan poin." Karena hanya admin yang bisa memanggil, dampak rendah; tetap disarankan `Number.isFinite()` sebelum simpan. Tidak ada kerentanan signifikan saat ini.

### `PUT /api/admin/point-rules/[id]` → app/api/admin/point-rules/[id]/route.ts

**Peran**: Memperbarui aturan poin (partial update via spread condition 7 properti).

**Alur Cerita**: CSRF + admin. Objek `data` dibangun incremental: tiap properti hanya ditambahkan bila `!== undefined`; `points` tetap di-coerce `Number()`. Update + audit.

**Potongan Kode Asli**:

```ts
// app/api/admin/point-rules/[id]/route.ts baris ±26-41
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (points !== undefined) data.points = Number(points);
    if (category !== undefined) data.category = category;
    if (icon !== undefined) data.icon = icon;
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const rule = await prisma.pointRule.update({
      where: { id: params.id },
      data,
    });
```

**Konstruk**: `try/catch`; CSRF di luar try; akumulasi `data` dengan `if` per properti.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — pola incremental menolak properti tak dikenal secara efektif.

### `DELETE /api/admin/point-rules/[id]` → app/api/admin/point-rules/[id]/route.ts

**Peran**: Menghapus aturan poin.

**Alur Cerita**: CSRF + admin; satu delete; respons `{ success: true }`. Menghapus aturan yang sedang dipakai kode (mis. aturan "Course") hanya membuat fallback poin (25) di route terkait — desain toleran.

**Konstruk**: `try/catch`; satu delete.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — admin-only, dan penghapusan punya fallback di kode konsumen.

---

## Domain Admin Projects, Donasi, & Export

Lima route: daftar proyek, perbarui status proyek (dengan email ke pemilik), daftar donasi, export CSV, dan daftar URL foto untuk download.

### `GET /api/admin/projects` → app/api/admin/projects/route.ts

**Peran**: Menampilkan semua proyek ber-pagination (termasuk yang belum disetujui) dengan pemilik dan jumlah donasi.

**Alur Cerita**: Admin dicek; pagination standar (limit 1–200); `findMany` + count paralel; include user (id, username, email) dan `_count.donations`. Tidak ada filter status — admin melihat semua tahap (pending, approved, rejected, completed). Respons proyek lengkap + pagination.

**Konstruk**: `try/catch`; `Promise.all`; `_count`.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — admin-only; email pemilik hanya untuk panel moderasi.

### `PATCH /api/admin/projects/[id]` → app/api/admin/projects/[id]/route.ts

**Peran**: Mengubah status proyek (under_review/approved/rejected/completed) dan mengirim email notifikasi ke pemilik proyek.

**Alur Cerita**: CSRF + admin. Status divalidasi whitelist `validStatuses`; nilai lain → `400` dengan daftar status valid. `updateData` hanya berisi `status` + `featuredPhotoId` opsional (tidak menerima field lain — anti mass assignment). Setelah update, blok email: pemilik diambil dari include; jika punya email, `sendEmail` dengan template HTML inline yang menyebutkan nama user, judul proyek, label status (dari `STATUS_LABELS`), catatan admin opsional, dan link dashboard. Email dibalut `.catch(() => {})` — kegagalan kirim tidak menggagalkan operasi (non-blocking). Audit + respons.

**Potongan Kode Asli**:

```ts
// app/api/admin/projects/[id]/route.ts baris ±30-49
    const body = await request.json();
    const { status, note, featuredPhotoId } = body;

    const validStatuses = ["under_review", "approved", "rejected", "completed"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (featuredPhotoId) updateData.featuredPhotoId = featuredPhotoId;

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: { user: { select: { email: true, username: true } } },
    });

    // Send email notification to project owner
    if (project.user?.email) {
      const label = STATUS_LABELS[status] || status;
      const subject = `Proyek "${project.title}" — ${label}`;
      // ... template HTML + sendEmail().catch(() => {})
    }
```

**Konstruk**: `try/catch`; CSRF di luar try; whitelist status; whitelist updateData; `if (project.user?.email)`; `.catch(() => {})` untuk email.

**🛡️ Kerentanan**: "Kode ini rentan *mass assignment* bila seluruh body diteruskan ke Prisma — namun hanya `status` dan `featuredPhotoId` yang diambil eksplisit." Tidak ada kerentanan signifikan; catatan `note` tidak pernah masuk DB (hanya untuk email), jadi tidak ada injeksi HTML ke halaman publik.

### `GET /api/admin/donations` → app/api/admin/donations/route.ts

**Peran**: Menampilkan semua donasi dengan donatur dan proyek terkait untuk panel admin.

**Alur Cerita**: Admin dicek. `findMany` semua donasi (`orderBy createdAt desc`), include user (id, username, email) dan project (id, title). Tanpa pagination — jumlah donasi diasumsikan masih wajar. Respons `{ donations }`. Catatan: `donorEmail` tidak di-mask — ini data yang memang dibutuhkan admin untuk pengecekan.

**Konstruk**: `try/catch`; satu findMany + dua include.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — admin-only; data PII (email donatur) hanya di endpoint admin.

### `GET /api/admin/export` → app/api/admin/export/route.ts

**Peran**: Mengekspor data (users, reports, springs, donations, projects, feedback, points) menjadi CSV yang di-download langsung atau dikirim via email.

**Alur Cerita**: Ini route terbesar di domain admin (174 baris). Admin memanggil dengan query `entity`, `startDate`/`endDate`, `springId`, `format`, dan `notify=true` opsional. Filter tanggal dibangun sebagai objek `createdAt` `gte`/`lt`. Percabangan `switch (entity)` menentukan query dan kolom:
- **users**: profil dengan kontak + poin + trustScore.
- **reports**: laporan + username submitter + koordinat presisi DAN snapped + URL foto (via `buildPhotoUrl`) — hati-hati: ini salah satu tempat koordinat presisi keluar server, tapi hanya untuk admin.
- **spring**: nama, provinsi, health score, jumlah laporan.
- **donations**: invoice, jumlah, tier, nama/email donatur, status, proyek.
- **projects**: semua kolom termasuk kontak.
- **feedback**: kritik/saran/deskripsi bug.
- **points**: log poin dengan username.
Helper `escapeCsv` menangani nilai ber-koma/kutip/baris-baru (quoting ganda) — mencegah *CSV injection* saat file dibuka di spreadsheet. Jika `notify=true`, email dikirim ke admin berisi nama file + jumlah baris (non-blocking). Respons akhir adalah file CSV mentah dengan header `Content-Disposition: attachment`.

**Potongan Kode Asli**:

```ts
// app/api/admin/export/route.ts baris ±10-18
function escapeCsv(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: string[][], headers: string[]): string {
  return [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
}
```

**Konstruk**: `try/catch`; `switch (entity)` dengan 7 case; `escapeCsv`; `if (notify && session?.userId)` untuk email; respons file via `new NextResponse(csv, { headers })`.

**🛡️ Kerentanan**: "Kode ini rentan *CSV injection* bila nilai sel diawali `=`/`+`/`-`/`@` — spreadsheet akan mengeksekusinya sebagai formula." Di SpringHub `escapeCsv` meng-quote nilai berkarakter khusus; namun karena hanya admin yang memanggil, dan nilai dikutip, risiko rendah. Data koordinat presisi yang keluar pun hanya untuk admin. Tidak ada kerentanan signifikan.

### `GET /api/admin/download` → app/api/admin/download/route.ts

**Peran**: Menyediakan daftar URL foto (per report atau per periode) untuk diunduh admin — jembatan sebelum fitur ZIP penuh.

**Alur Cerita**: Admin memanggil dengan `reportId` ATAU rentang `startDate`/`endDate`; jika tidak keduanya → `400`. `where` dibangun: untuk reportId, filter `reportId`; untuk rentang, filter relasi `report.createdAt` (Prisma memfilter lewat relasi). Foto dicari; kosong → `404`. URL publik dibangun dari `S3_PUBLIC_URL` (atau fallback endpoint+bucket) + `storagePath`; nama file diambil dari bagian terakhir path. Respons berisi `{ total, photos, message }` dengan pesan jujur: "Untuk bulk ZIP, gunakan fitur export" — endpoint ini masih versi sederhana (objek S3Client dibuat tapi `GetObjectCommand` tidak benar-benar dipakai untuk signed URL; kode siap untuk itu).

**Potongan Kode Asli**:

```ts
// app/api/admin/download/route.ts baris ±33-70
    let where: Record<string, unknown> = {};

    if (reportId) {
      where.reportId = reportId;
    } else if (startDate || endDate) {
      where.report = {
        createdAt: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lt: new Date(endDate) } : {}),
        },
      };
    } else {
      return NextResponse.json({ error: "reportId or date range required" }, { status: 400 });
    }

    const photos = await prisma.reportPhoto.findMany({
      where,
      include: { report: { select: { formSlug: true, createdAt: true } } },
    });

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos found" }, { status: 404 });
    }
```

**Konstruk**: `try/catch`; `if/else if/else` untuk mode query; `include` relasi report.

**🛡️ Kerentanan**: "Kode ini rentan bila URL foto dibuat publik permanen — namun file disimpan di storage pribadi dan hanya URL yang diteruskan ke admin." Tidak ada kerentanan signifikan — akses admin-only; `reportId` berbasis UUID yang tidak bisa ditebak.

---

## Domain Admin Errors & Feedback

Empat route untuk memantau kesehatan aplikasi: log error (`AppError`) dan masukan pengguna (`Feedback`). Keduanya memakai pola admin yang sama namun dengan pengecekan role dua langkah (cek sesi lalu ambil role dari DB — lebih aman daripada mempercayai sesi saja).

### `GET /api/admin/errors` → app/api/admin/errors/route.ts

**Peran**: Menampilkan error log (filter level/source/read, pagination offset) + jumlah error belum dibaca.

**Alur Cerita**: Pengecekan admin di sini dua tahap: `getSession()` lalu `prisma.profile.findUnique` untuk membaca role **langsung dari DB** — tidak mempercayai klaim role di sesi (defense-in-depth; jika sesi tidak sinkron dengan DB, role DB yang menang). Filter: `level` (info/warning/error/critical), `source` (frontend/api/worker/database), `read` (true/false) — semuanya divalidasi whitelist. `limit` dikunci maks 200 dengan offset. Query paralel: `findMany` + `count` + `unread` count. DELETE-nya menghapus semua error yang sudah dibaca (`deleteMany where read: true`) dan mengembalikan jumlah terhapus — pembersih "kotak surat".

**Potongan Kode Asli**:

```ts
// app/api/admin/errors/route.ts baris ±18-62
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const source = searchParams.get("source");
  const read = searchParams.get("read");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Record<string, unknown> = {};
  if (level && ["info", "warning", "error", "critical"].includes(level)) {
    where.level = level;
  }
  if (source && ["frontend", "api", "worker", "database"].includes(source)) {
    where.source = source;
  }
  if (read === "true") where.read = true;
  if (read === "false") where.read = false;

  const [errors, total] = await Promise.all([
    prisma.appError.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.appError.count({ where }),
  ]);

  const unread = await prisma.appError.count({ where: { read: false } });
  return NextResponse.json({ errors, total, unread });
}
```

**Konstruk**: cek role via DB (dua langkah); whitelist filter; `Promise.all` tiga query; `deleteMany` untuk pembersihan.

**🛡️ Kerentanan**: "Kode ini rentan *log poisoning* bila isi log dirender mentah di panel admin — pesan error dari pengguna bisa berisi skrip." Di SpringHub isi log dimaksimalkan panjangnya di route pemasukan (`/api/log/error`), dan panel admin merender sebagai teks. Tidak ada kerentanan signifikan — akses admin via role DB.

### `PATCH /api/admin/errors/[id]` → app/api/admin/errors/[id]/route.ts

**Peran**: Menandai satu error sebagai dibaca/belum dibaca.

**Alur Cerita**: Pola baru yang perlu diperhatikan: `params` bertipe `Promise<{ id: string }>` — pola Next.js 15 yang baru, di mana params harus di-await (`const { id } = await params`). Role dicek via DB. Body wajib berisi `read` boolean (`typeof body.read !== "boolean"` → 400). Update + `{ ok: true }`. DELETE-nya menghapus satu error dengan id yang sama.

**Potongan Kode Asli**:

```ts
// app/api/admin/errors/[id]/route.ts baris ±31-43
  const { id } = await params;
  const body = await request.json();

  if (typeof body.read !== "boolean") {
    return NextResponse.json({ error: "Field 'read' (boolean) required" }, { status: 400 });
  }

  await prisma.appError.update({
    where: { id },
    data: { read: body.read },
  });

  return NextResponse.json({ ok: true });
```

**Konstruk**: `await params` (pola Next 15); validasi tipe `boolean`; update.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — validasi tipe ketat (`typeof === "boolean"`), role via DB, tanpa CSRF tetapi ini murni operasi status baca (dampak rendah).

### `GET /api/admin/feedback` → app/api/admin/feedback/route.ts

**Peran**: Menampilkan 100 feedback terbaru untuk panel admin.

**Alur Cerita**: Admin dicek via role sesi (bukan DB, kontras dengan errors). `findMany` take 100, tanpa filter. Semua kolom termasuk `bugScreenshot` (data URL base64 dari client — dikirim apa adanya; admin UI bertanggung jawab merendernya aman).

**Konstruk**: `try/catch`; satu findMany.

**🛡️ Kerentanan**: "Kode ini rentan *data URL abuse* bila screenshot base64 dirender sebagai `<img src>` langsung — data URL bisa berisi HTML/jawaScript." Di SpringHub feedback dibatasi ukurannya di endpoint pemasukan (maks 3 screenshot), dan screenshot disimpan sebagai string data URL dalam DB — disarankan dirender sebagai teks/blob. Tidak ada kerentanan signifikan saat ini.

### `PATCH /api/admin/feedback/[id]` → app/api/admin/feedback/[id]/route.ts

**Peran**: Mengubah status feedback (open/read/resolved).

**Alur Cerita**: CSRF + admin. `status` divalidasi whitelist `["open", "read", "resolved"]` → selain itu `400 "Invalid status"`. Update + audit + `{ success: true }`.

**Potongan Kode Asli**:

```ts
// app/api/admin/feedback/[id]/route.ts baris ±23-37
    const body = await request.json();
    const { status } = body;

    if (!["open", "read", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await prisma.feedback.update({
      where: { id: params.id },
      data: { status },
    });
    auditLog("patch feedback", "patch feedback");
```

**Konstruk**: `try/catch`; CSRF di luar try; whitelist status.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — whitelist status + CSRF + admin.

---

## Domain Donasi & Xendit

Dua route paling bernilai finansial di aplikasi: pembuatan invoice donasi dan penerima webhook pembayaran. Di sinilah "jangan pernah percaya client" diuji paling keras.

### `POST /api/donations/invoice` → app/api/donations/invoice/route.ts

**Peran**: Membuat invoice pembayaran Xendit untuk donasi (Rp1.000 – Rp100 juta), memvalidasi ulang jumlah di server, dan menyimpan record donasi status `pending`.

**Alur Cerita**: CSRF dicek lebih dulu. Rate limit per user (atau per IP untuk guest) membatasi frekuensi pembuatan invoice. Setelah itu, pemeriksaan `content-length` — payload di atas 100 KB ditolak `413` SEBELUM body dibaca (mencegah body raksasa). Body diurai; lalu blok **validasi server-side yang paling penting**:
1. `amount = parseInt(amountIdr)`; jika NaN atau di luar Rp1.000–Rp100.000.000 → `400`. Client tidak pernah dipercaya soal jumlah.
2. **Cross-check tier**: jika `tierId` bukan "custom", jumlah harus PERSIS sama dengan `DONATION_TIERS` — mencegah abuse "klaim tier Rp 25K tapi transfer Rp 1 juta" (atau sebaliknya).
3. `donorName` wajib non-kosong (string).
4. Jika `projectId` diberikan, proyek harus ada dan berstatus `approved` — donasi tidak bisa menuju proyek yang belum disetujui.

Setelah lolos, `externalId = DON-<uuid>` dibuat dan record `Donation` disimpan dengan status `pending`. Invoice Xendit dibuat via `createInvoice` (paymentMethods: OVO, GOPAY, DANA, SHOPEEPAY, QRIS). Jika panggilan Xendit gagal, record donasi di-update ke `failed` (dibalut try/catch terpisah) lalu error di-rethrow. `invoiceId` dan `expiresAt` (dari `invoice.expiryDate` atau +24 jam fallback) ditempel ke record; jika update gagal hanya dicatat console (record tetap ada tanpa invoiceId). Respons: `{ donation, invoiceUrl }` — client langsung mengarahkan user ke halaman bayar Xendit.

**Potongan Kode Asli**:

```ts
// app/api/donations/invoice/route.ts baris ±35-75
    // ── Server-side amount validation ──
    // NEVER trust the amount from client — validate here on the server.
    const amount = parseInt(amountIdr, 10);
    if (isNaN(amount) || amount < 1000 || amount > 100_000_000) {
      return NextResponse.json(
        { error: "Jumlah donasi tidak valid (min Rp1.000, maks Rp100.000.000)" },
        { status: 400 }
      );
    }

    // Cross-check amount vs tier — cegah abuse tier "Rp 25K" tapi bayar Rp 1jt
    if (tierId && tierId !== "custom") {
      const matchedTier = DONATION_TIERS.find(t => t.id === tierId);
      if (matchedTier && matchedTier.amountIdr !== amount) {
        return NextResponse.json(
          { error: `Jumlah donasi tidak sesuai dengan tier "${tierId}". Diharapkan Rp ${matchedTier.amountIdr.toLocaleString("id-ID")}.` },
          { status: 400 }
        );
      }
    }

    if (!donorName || typeof donorName !== "string" || donorName.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama donatur wajib diisi" },
        { status: 400 }
      );
    }

    // Validate projectId if specified
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, status: true },
      });
      if (!project || project.status !== "approved") {
        return NextResponse.json(
          { error: "Proyek tidak ditemukan atau belum disetujui" },
          { status: 400 }
        );
      }
    }
```

**Konstruk**: `try/catch`; CSRF; rate limit; cek content-length; validasi berlapis (angka → tier → nama → proyek); create → createInvoice dengan try/catch status failed → update invoiceId.

**🛡️ Kerentanan**: "Kode ini rentan *price manipulation* bila jumlah dari client diterima mentah — penyerang bisa membuat invoice Rp1.000 padahal mengaku donasi Rp100 juta." Di SpringHub jumlah divalidasi ulang dan **dicocokkan persis dengan tier**; webhook hanya memproses status pembayaran dari Xendit, bukan nilai dari client. Batas payload + rate limit juga mencegah spam invoice. Tidak ada kerentanan signifikan.

### `POST /api/donations/webhook` → app/api/donations/webhook/route.ts

**Peran**: Menerima notifikasi pembayaran dari Xendit (PAID/SETTLED/EXPIRED/FAILED), memverifikasi token callback dengan perbandingan constant-time, dan memproses poin + saldo proyek secara atomik dan idempoten.

**Alur Cerita**: Xendit mengirim POST dengan header `x-callback-token`. Alur:

1. **Rate limit** per IP webhook (`webhook:${ip}`) untuk mencegah flood.
2. **Verifikasi token**: jika `XENDIT_WEBHOOK_TOKEN` tidak diset — dalam mode staging (`NEXT_PUBLIC_STAGING=true`) payload diterima untuk log-only (dengan warning), di luar staging ditolak `401` (kode menolak lebih aman daripada menerima tanpa verifikasi). Jika token diset, kedua nilai (token header vs token env) di-hash SHA-256 lalu dibandingkan dengan **`timingSafeEqual`** — perbandingan constant-time yang kebal side-channel timing. Hash dibuat dari *digest* penuh (bukan hex string pendek), dan panjang digest dipastikan sama karena keduanya SHA-256.
3. **Log aman**: `safeLog` hanya berisi `id`, `external_id`, `status` — tanpa data PII, sesuai prinsip "no PII in webhook logs".
4. Validasi minimal `id` atau `external_id` ada (400).
5. `statusMap` memetakan status Xendit → lokal: PAID/SETTLED → `paid`, EXPIRED → `expired`, FAILED → `failed`. Status tak dikenal → `{ status: "ignored" }` (diterima diam-diam).
6. **Idempotensi (pas pertama)**: donasi dicari via `invoiceId` ATAU `externalId`; tidak ditemukan → 404; jika sudah `paid` → `{ status: "already_processed" }` tanpa efek apa pun.
7. **Compare-and-set atomik (pas kedua)**: di dalam `prisma.$transaction`, `donation.updateMany` dengan kondisi status — untuk `paid`: `status: { not: "paid" }` (hanya yang belum paid yang bisa diklaim); untuk lainnya: `status: "pending"`. Jika `cas.count !== 1` → transaksi batal, dikembalikan `already_processed`. **Ini yang membuat dua webhook duplikat yang datang bersamaan hanya satu yang menang.**
8. **Efek samping saat paid** (dalam transaksi yang sama): +1 poin per Rp1.000 (`Math.floor(amountIdr / 1000)`, `profile.points.increment`), `pointsLog.create`, notifikasi untuk **semua admin**, dan `project.raisedAmount.increment` jika donasi untuk proyek.

**Potongan Kode Asli**:

```ts
// app/api/donations/webhook/route.ts baris ±87-148
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

      // If payment succeeded, award points and update project
      if (localStatus === "paid" && existing.userId) {
        // Award 1 point per Rp1,000 donated
        const pointsAwarded = Math.floor(existing.amountIdr / 1000);
        await tx.profile.update({
          where: { id: existing.userId },
          data: { points: { increment: pointsAwarded } },
        });

        await tx.pointsLog.create({
          data: {
            userId: existing.userId,
            reportId: null,
            amount: pointsAwarded,
            reason: `donasi Rp${existing.amountIdr.toLocaleString("id-ID")}`,
            metadata: JSON.stringify({ invoiceId: id, donationId: existing.id }),
          },
        });

        // Notifikasi admin ada donasi baru
        const admins = await tx.profile.findMany({
          where: { role: "admin" },
          select: { id: true },
        });
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              type: "donation",
              title: `Donasi baru: Rp${existing.amountIdr.toLocaleString("id-ID")}`,
              body: `Donasi dari ${existing.donorName || existing.donorEmail || "anonim"} — ${existing.tierId || "Tanpa tier"}`,
              link: "/admin/donations",
            },
          });
        }

        // Update project raised amount if this is a project-specific donation
        if (existing.projectId) {
          await tx.project.update({
            where: { id: existing.projectId },
            data: { raisedAmount: { increment: existing.amountIdr } },
          });
        }
      }

      return true;
    });

    if (!claimed) {
      return NextResponse.json({ success: true, status: "already_processed" });
    }
```

**Konstruk**: `try/catch`; rate limit; `if/else` untuk mode staging vs verifikasi token; `timingSafeEqual`; `statusMap` lookup; dua lapis idempotensi (status check + CAS); `$transaction`; loop notifikasi admin.

**🛡️ Kerentanan**: "Kode ini rentan *webhook forgery* bila token callback tidak diverifikasi — penyerang bisa mengirim PAID palsu untuk donasi Rp1.000 dan menguras poin." Di SpringHub token diverifikasi dengan `timingSafeEqual` (anti timing attack), dan bahkan jika token bocor, CAS + guard `status !== paid` mencegah dobel klaim. Verifikasi ulang di sisi Xendit (optional) tidak dipakai, tapi mode tanpa token di luar staging menolak keras (fail-closed). Ini salah satu endpoint paling aman di aplikasi.

---

## Domain Offline Sync

Dua route yang melayani mode PWA offline: pengelolaan sesi tracking lapangan dan sinkronisasi titik GPS. Endpoint ini memakai `x-queue-worker` bypass CSRF di worker sinkronisasi (lihat AGENTS.md), dan di route ini sesi `OfflineSession` berperan sebagai penampung titik.

### `POST /api/offline/session` → app/api/offline/session/route.ts

**Peran**: Membuat sesi tracking offline baru (menutup sesi lama), dengan mode dan daftar form terpilih.

**Alur Cerita**: Sesi user wajib (`401`). Body opsional: `selectedForms` (array) dan `mode` ("full" default). Dua langkah: `updateMany` menutup SEMUA sesi aktif milik user (`isActive: false`, `endedAt: now`) — hanya satu sesi aktif boleh ada; lalu `create` sesi baru dengan `selectedForms` di-JSON-stringify dan `isActive: true`. GET-nya mengembalikan sesi aktif (dengan 1 titik terbaru sebagai petunjuk); DELETE menutup sesi aktif. Catatan: memulai sesi baru OTOMATIS menutup sesi lama — pengguna tidak bisa lupa menutup sesi dan menumpuk sesi aktif.

**Potongan Kode Asli**:

```ts
// app/api/offline/session/route.ts baris ±20-35
    // Close any existing active sessions
    await prisma.offlineSession.updateMany({
      where: { userId: session.userId, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });

    // Create new session
    const offlineSession = await prisma.offlineSession.create({
      data: {
        userId: session.userId,
        selectedForms: JSON.stringify(selectedForms),
        isActive: true,
      },
    });
```

**Konstruk**: `try/catch`; `if (!session?.userId)`; updateMany → create; handler GET dan DELETE terpisah di file sama.

**🛡️ Kerentanan**: "Kode ini rentan *session hoarding* bila sesi lama tidak ditutup otomatis — database penuh sesi yatim." UpdateMany penutupan otomatis mencegahnya. Tidak ada kerentanan signifikan — akses user-scoped (RLS: semua query memakai `userId` dari sesi).

### `POST /api/offline/sync` → app/api/offline/sync/route.ts

**Peran**: Menerima kumpulan titik tracking GPS dari perangkat offline dan menyimpannya ke sesi aktif (tanpa menutup sesi).

**Alur Cerita**: Sesi user wajib. Sesi aktif dicari; tidak ada → `400 "No active session"` (client harus mulai sesi dulu). Jika `trackingPoints` adalah array non-kosong, `createMany` dengan `skipDuplicates: true` — titik yang sama tidak diinsert dua kali (anti-retry duplikat). Pemetaan tiap titik menarik: kolom `isSpringMarker` dan `springName` mendukung **dua penamaan berbeda** — frontend mengirim `markerType`/`name`, backend mengirim `isSpringMarker`/`springName`; fallback `tp.isSpringMarker ?? (tp.markerType === "spring")` dan `tp.springName ?? (tp.markerType === "spring" ? tp.name : null)` menjembatani keduanya (perbaikan bug tracking field mismatch di sesi 10). `recordedAt` di-new Date() dari input. `totalDistance` di-update ke sesi — **tanpa menutup sesi** (komentar eksplisit: "jangan end session"). Respons stats ringkas.

**Potongan Kode Asli**:

```ts
// app/api/offline/sync/route.ts baris ±31-53
    // Save tracking points
    if (Array.isArray(trackingPoints) && trackingPoints.length > 0) {
      await prisma.trackingPoint.createMany({
        data: trackingPoints.map((tp: any) => ({
          sessionId: activeSession.id,
          lat: tp.lat,
          lng: tp.lng,
          accuracy: tp.accuracy ?? null,
          // Dukungan field markerType (frontend) + isSpringMarker/springName (backend)
          isSpringMarker: tp.isSpringMarker ?? (tp.markerType === "spring"),
          springName: tp.springName ?? (tp.markerType === "spring" ? (tp.name ?? null) : null),
          recordedAt: new Date(tp.recordedAt),
        })),
        skipDuplicates: true,
      });
    }
```

**Konstruk**: `try/catch`; `if (Array.isArray(...))`; `createMany` + `skipDuplicates`; fallback nullish (`??`).

**🛡️ Kerentanan**: "Kode ini rentan *coordinate flooding* bila tanpa batas jumlah titik — client bisa mengirim puluhan ribu titik GPS." Di SpringHub belum ada batas eksplisit jumlah titik per request (potensi perbaikan), tapi `skipDuplicates` mereduksi duplikat, dan payload dibatasi ukuran request oleh server (Next.js default body limit). Tidak ada kerentanan signifikan saat ini — titik terikat sesi milik user sendiri.

---

## Domain Kursus

Tiga route untuk pembelajaran: daftar kursus (cache 5 menit), detail kursus dengan sanitasi XSS dua lapis, dan progres belajar dengan pemberian poin sekali.

### `GET /api/courses` → app/api/courses/route.ts

**Peran**: Menampilkan kursus aktif (tanpa isi modul) dengan Redis cache 300 detik.

**Alur Cerita**: `getOrSet("courses", "active", factory, 300)` — pola caching khas aplikasi: jika kunci `courses:active` ada di Redis, langsung dikembalikan; jika tidak, factory dijalankan lalu hasil disimpan 300 detik. Factory mengambil kursus `isActive: true` dengan modul **hanya judul + sortOrder** (isi konten TIDAK diunduh di daftar — hemat bandwidth). Invalidation: karena data jarang berubah (admin), TTL 5 menit cukup.

**Potongan Kode Asli**:

```ts
// app/api/courses/route.ts baris ±7-22
export async function GET() {
  try {
    const courses = await getOrSet("courses", "active", () =>
      prisma.course.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true, sortOrder: true },
          },
        },
      }),
      300
    );
    return NextResponse.json({ courses });
  } catch (error) {
    // ...getErrorMessage...
  }
}
```

**Konstruk**: `try/catch`; `getOrSet` (cache-aside pattern); `select` di nested include.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — endpoint publik read-only; cache hanya menyimpan data non-sensitif.

### `GET /api/courses/[slug]` → app/api/courses/[slug]/route.ts

**Peran**: Menampilkan detail kursus + isi modul, dengan konten di-sanitize DOMPurify di SERVER sebelum dikirim ke client.

**Alur Cerita**: Kursus dicari via `where: { slug, isActive: true }` — slug non-aktif → 404 (dilindungi secara otomatis). Ini adalah **pertahanan XSS berlapis** yang dipindahkan ke server pada Sesi 15: setiap `description` dan setiap `content` modul dilewatkan `sanitizeHtml()` — implementasi DOMPurify + jsdom yang berjalan di server (jsdom ditambahkan ke `serverComponentsExternalPackages` agar tidak masuk bundle client). Hasilnya: `<script>`, handler `onerror`, URL `javascript:`, dan `<iframe>` dihapus sebelum HTML sampai ke browser. Konteks: konten ditulis admin, tapi sanitasi tetap dijalankan karena konten bisa berasal dari sumber lain (impor/copy-paste) dan pertahanan berlapis tetap bernilai.

**Potongan Kode Asli**:

```ts
// app/api/courses/[slug]/route.ts baris ±12-30
    const course = await prisma.course.findUnique({
      where: { slug: params.slug, isActive: true },
      include: { modules: { orderBy: { sortOrder: "asc" } } },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
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
```

**Konstruk**: `try/catch`; `if (!course)`; `Promise.all` + `map` async untuk sanitasi tiap modul.

**🛡️ Kerentanan**: "Kode ini rentan *stored XSS* bila konten kursus dirender mentah — `<script>` di konten admin (atau yang disisipkan penyerang lewat akses admin curian) akan jalan di browser pengguna." Di SpringHub XSS dibersihkan server-side dua lapis: `sanitizeHtml` menghapus elemen skrip, handler event, dan protokol `javascript:`; jsdom diisolasi dari bundle client sehingga tidak ada dua implementasi sanitasi yang bisa berbeda hasil. Tidak ada kerentanan signifikan.

### `GET /api/courses/progress` → app/api/courses/progress/route.ts

**Peran**: Menampilkan progres belajar user yang login.

**Alur Cerita**: `session.userId` wajib (`401`). `findMany` semua `CoursesProgress` milik user dengan include judul+slug kursus. Read-only, tanpa cache (data personal).

**Konstruk**: `try/catch`; `if (!session?.userId)`; findMany dengan include.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — data milik user sendiri, RLS via `userId` dari sesi.

### `PUT /api/courses/progress` → app/api/courses/progress/route.ts

**Peran**: Memperbarui jumlah modul selesai (upsert) dan memberikan poin kursus SEKALI saat kursus pertama kali tuntas.

**Alur Cerita**: Sesi wajib. Body: `courseId`, `courseSlug`, `completedModules`, `totalModules`. `completed = completedModules >= totalModules`. `upsert` pada compound key `userId_courseSlug`: update `{ completedModules, totalModules, completed, courseId }` atau create baru. Lalu blok pemberian poin dengan **guard anti-dobel**: hanya jika `completed`; cek `pointsLog.findFirst` dengan `reason contains "Course ${courseSlug}"`; jika sudah ada, SKIP. Jika belum, nilai poin dibaca dari `pointRule` yang namanya mengandung "Course" (fallback 25) — sistem aturan dinamis; `pointsLog.create` + `profile.points.increment`. `pointsAwarded` dikembalikan agar UI bisa menampilkan "+25 poin!". Kelemahan kecil: guard berbasis `reason contains` bisa meleset jika kursus lain punya reason serupa, namun praktis aman.

**Potongan Kode Asli**:

```ts
// app/api/courses/progress/route.ts baris ±56-85
    // Award points if newly completed
    let pointsAwarded = 0;
    if (completed) {
      const existing = await prisma.pointsLog.findFirst({
        where: {
          userId: session.userId,
          reason: { contains: `Course ${courseSlug}` },
        },
      });
      if (!existing) {
        // Baca poin dari PointRule, fallback 25
        const rule = await prisma.pointRule.findFirst({
          where: { name: { contains: "Course", mode: "insensitive" } },
        });
        const coursePoints = rule?.points || 25;
        await prisma.pointsLog.create({
          data: {
            userId: session.userId,
            amount: coursePoints,
            reason: `Course ${courseSlug} completed`,
            metadata: JSON.stringify({ courseSlug }),
          },
        });
        await prisma.profile.update({
          where: { id: session.userId },
          data: { points: { increment: coursePoints } },
        });
        pointsAwarded = coursePoints;
      }
    }
```

**Konstruk**: `try/catch`; `if (!session?.userId)`; `upsert`; `if (completed)`; guard `findFirst` + `if (!existing)`.

**🛡️ Kerentanan**: "Kode ini rentan *poin farming* bila client bisa mengirim `completedModules` palsu — user bisa langsung set 99/100 tanpa belajar." Di SpringHub mitigasi parsial: guard pemberian poin hanya 1x per kursus (jadi farming terbatas pada poin kursus, bukan tak terbatas), dan nilai poin diambil dari server (PointRule), bukan client. Perbaikan ideal adalah verifikasi progress di server (mis. tiap modul perlu konfirmasi), namun tidak ada kerentanan eksploitasi massal karena setiap akun hanya bisa dapat 1× per kursus.

---

## Domain Formulir

Dua route publik untuk membaca definisi formulir dinamis — dipakai halaman `/report/[slug]` untuk me-render form sesuai data DB.

### `GET /api/forms` → app/api/forms/route.ts

**Peran**: Menampilkan semua formulir aktif + field-nya (dengan options di-parse dari JSON) + tipe map terkait, di-cache Redis 300 detik.

**Alur Cerita**: `getOrSet("forms", "active", factory, 300)`. Factory: `findMany` form `isActive: true` dengan `include.fields` (hanya kolom render: id, fieldId, label, labelEn, type, required, placeholder, helpText, options, optionsEn, sortOrder) dan `include.mapType`. Setelah itu, `safeParseJson` mengubah string JSON `options`/`optionsEn` menjadi array — parsing aman (bukan `JSON.parse` polos) sehingga data rusak pun tidak melemparkan error. Cache 5 menit menyelamatkan DB dari permintaan berulang tiap render form.

**Potongan Kode Asli**:

```ts
// app/api/forms/route.ts baris ±10-35
    const forms = await getOrSet("forms", "active", async () => {
      const data = await prisma.form.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          fields: {
            orderBy: { sortOrder: "asc" },
            select: { ... },
          },
          mapType: { select: { id: true, slug: true, name: true, icon: true } },
        },
      });

      return data.map((form) => ({
        ...form,
        fields: form.fields.map((field) => ({
          ...field,
          options: safeParseJson(field.options),
          optionsEn: safeParseJson(field.optionsEn),
        })),
      }));
    }, 300);
```

**Konstruk**: `try/catch`; `getOrSet`; nested `map`; `safeParseJson`.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — data publik; `safeParseJson` mencegah crash pada JSON rusak.

### `GET /api/forms/[slug]` → app/api/forms/[slug]/route.ts

**Peran**: Menampilkan detail satu formulir aktif berdasarkan slug.

**Alur Cerita**: Berbeda dari daftar, route ini TIDAK di-cache (slug tunggal dipanggil jarang per sesi). `findUnique` dengan `include.fields`; jika form tidak ada ATAU `!form.isActive` → `404 "Form not found"` — gabungan dua kondisi, sehingga form yang di-nonaktifkan admin otomatis tidak bisa diakses publik. Options di-parse sama seperti route daftar.

**Konstruk**: `try/catch`; `if (!form || !form.isActive)`; `map` parse options.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — hanya formulir aktif yang terekspos, dan tidak ada data sensitif di definisi form.

---

## Domain Springs & Map

Delapan route publik (plus satu admin di domain sebelumnya) untuk data geografis: daftar spring terkelompok, detail spring, bulk name lookup, pencarian, map points dengan tipe/kategori, dan tipe map. Hampir semuanya read-only publik, dengan rate limiting ringan.

### `GET /api/springs` → app/api/springs/route.ts

**Peran**: Menampilkan spring aktif yang dikelompokkan per grid lokasi (snapped, ±111 m) dengan total laporan dan info "terbaru" per kelompok.

**Alur Cerita**: **Rate limiter publik** (`publicLimiter`) berbasis IP dipasang di sini — pelindung untuk query yang cukup berat. `findMany` spring `active` dengan koordinat **hanya snapped** (presisi tidak pernah keluar), province, regency, health, dan `_count.reports` (hanya approved). Lalu pengelompokan: `Map` dengan kunci `snappedLat.toFixed(3)_snappedLng.toFixed(3)`; spring di grid yang sama (mis. "Umbul Asem" dan "Umbul Pengilon" yang berdekatan) dikumpulkan jadi satu kelompok. Setiap kelompok menghitung `totalReports`, mencari item `latest` (updatedAt tertinggi) untuk `latestName`, `latestRegion`, `latestUpdate`. Urutan: total laporan terbanyak dulu, lalu terbaru. Ini mengubah daftar polos menjadi "klaster peta" yang bisa langsung dirender Leaflet.

**Potongan Kode Asli**:

```ts
// app/api/springs/route.ts baris ±32-73
    // Kelompokkan spring berdasarkan snapped location (grid 5km)
    const groupsMap = new Map<string, typeof springs>();
    for (const s of springs) {
      if (s.snappedLat === null || s.snappedLng === null) continue;
      const key = `${s.snappedLat.toFixed(3)}_${s.snappedLng.toFixed(3)}`;
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(s);
    }

    const groups = Array.from(groupsMap.entries())
      .map(([key, items]) => {
        const [lat, lng] = key.split("_").map(Number);
        const totalReports = items.reduce((sum, s) => sum + (s._count?.reports || 0), 0);
        const latest = items.reduce((latest, s) =>
          !latest || (s.updatedAt && s.updatedAt > latest.updatedAt) ? s : latest
        , items[0]);
        return {
          snappedLat: lat,
          snappedLng: lng,
          totalSprings: items.length,
          totalReports,
          springs: items.map(s => ({ /* id, name, coords, province, health, reportCount, updatedAt */ })),
          latestName: items.length === 1 ? items[0].name : `${items.length} mata air`,
          latestRegion: latest?.province ? [latest.province, latest.regency].filter(Boolean).join(", ") : "",
          latestUpdate: latest?.updatedAt,
        };
      })
      .sort((a, b) => {
        if (b.totalReports !== a.totalReports) return b.totalReports - a.totalReports;
        return (b.latestUpdate?.getTime() || 0) - (a.latestUpdate?.getTime() || 0);
      });
```

**Konstruk**: `try/catch`; rate limiter; `Map` + `for...of`; `reduce` dua kali (sum & latest); `sort` multi-kriteria.

**🛡️ Kerentanan**: "Kode ini rentan *data scraping* massal bila tanpa rate limit — peta publik bisa diunduh seluruhnya berulang kali." `publicLimiter` per-IP membatasinya, dan koordinat yang keluar sudah di-snap (privasi lokasi tetap terjaga walau data di-scrape). Tidak ada kerentanan signifikan.

### `GET /api/springs/[id]` → app/api/springs/[id]/route.ts

**Peran**: Detail satu spring: laporan terkait + laporan di radius ±2 km, foto lengkap, statistik, dan spring "saudara" di grid yang sama.

**Alur Cerita**: Route terberat di domain publik (154 baris). Spring dicari dengan `include.reports` (isActive, terbaru dulu, tanpa fieldData mentah ke client — hanya kolom penting + user + foto). Tidak ada → 404. **Saudara kandung**: spring lain dengan snapped location yang SAMA dan bukan dummy — konsep "Umbul Asem & Umbul Pengilon". **Laporan di dekatnya**: query kedua mencari report `isActive` dengan `id notIn` laporan spring, snapped dalam ±0.02° (≈2 km), `take: 100`. Semua laporan digabung dan di-map: `fieldData` di-parse (dibalut try/catch) lalu diekstrak field relevan (springName, province, notes, treeCount...), foto diberi URL. **Statistik**: totalReports, approved/pending, jumlah per jenis form (monitoring/restoration/treePlanting/trench/seedling), totalPhotos, firstReport (item terakhir karena urutan desc), lastReport (item pertama). Ini satu-satunya tempat publik yang menunjukkan fieldData parsial — selektif, bukan mentah.

**Potongan Kode Asli**:

```ts
// app/api/springs/[id]/route.ts baris ±62-76
    // Map reports → enrich with parsed fieldData + photo URLs
    // Cari juga report dalam radius ~2km untuk semua tipe form (termasuk spring-monitoring yg terpisah)
    const nearbyReports = spring.snappedLat && spring.snappedLng ? await prisma.report.findMany({
      where: {
        id: { notIn: spring.reports.map(r => r.id) },
        isActive: true,
        snappedLat: { gte: spring.snappedLat - 0.02, lte: spring.snappedLat + 0.02 },
        snappedLng: { gte: spring.snappedLng - 0.02, lte: spring.snappedLng + 0.02 },
      },
      include: {
        user: { select: { id: true, username: true, email: true, region: true } },
        photos: { select: { id: true, storagePath: true, width: true, height: true } },
        reviewedBy: { select: { username: true } },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    }) : [];
```

**Konstruk**: `try/catch`; `include` bertingkat; query kedua dengan bounding box koordinat; `map` ekstraksi field; `reduce` untuk statistik.

**🛡️ Kerentanan**: "Kode ini rentan *PII leak* bila `email` user ikut dikirim — namun `email` memang di-`select` di sini dan dikirim dalam `nearbyReports` (bocor ke publik)." Ini **temuan nyata**: `include.user` memilih `{ id, username, email, region }` dan `reports` di-map ke respons publik. Email seharusnya tidak dikirim ke publik. Rekomendasi: hapus `email` dari select. Sebagian besar data lain sudah aman (hanya snapped coords, foto tanpa EXIF).

### `GET /api/springs/bulk` → app/api/springs/bulk/route.ts

**Peran**: Lookup ringan id → nama spring untuk maksimal 50 id (solusi masalah N+1 pada marker peta).

**Alur Cerita**: Query `ids` (koma-terpisah) wajib; tanpa → 400. ID di-split, di-trim, di-slice 50 (batas keamanan). Jika kosong setelah filter → `{ springs: [] }` (bukan error). `findMany` dengan `select` minimal (id, name, healthScore, healthStatus). Endpoint ini lahir dari keluhan performa: sebelumnya tiap marker memanggil detail lengkap; sekarang satu panggilan menangani 50 marker.

**Potongan Kode Asli**:

```ts
// app/api/springs/bulk/route.ts baris ±22-42
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 50); // safety limit

    if (ids.length === 0) {
      return NextResponse.json({ springs: [] });
    }

    const springs = await prisma.spring.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        healthScore: true,
        healthStatus: true,
      },
    });

    return NextResponse.json({ springs });
```

**Konstruk**: `try/catch`; `if (!idsParam)`; chain `split/map/filter/slice`; `select` minimal.

**🛡️ Kerentanan**: "Kode ini rentan *N+1 reversal* bila tanpa batas id — query `IN` dengan ribuan id bisa melambatkan DB." `slice(0, 50)` membatasinya. Tidak ada kerentanan signifikan.

### `GET /api/springs/search` → app/api/springs/search/route.ts

**Peran**: Pencarian spring berdasarkan nama (case-insensitive), minimal 2 karakter, maks 10 hasil.

**Alur Cerita**: `q` wajib minimal 2 karakter (di bawah itu → `{ springs: [] }` diam-diam, bukan error — mencegah query sampah). `findMany` dengan `status: { in: ["pending", "active"] }` (rejected/merged tidak muncul) dan `name: { contains: q, mode: "insensitive" }`. Hasil maks 10 + `_count.reports`. Fitur ini dipakai dropdown "link ke spring" pada form.

**Potongan Kode Asli**:

```ts
// app/api/springs/search/route.ts baris ±8-31
    const q = url.searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json({ springs: [] });
    }

    const springs = await prisma.spring.findMany({
      where: {
        status: { in: ["pending", "active"] },
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, province: true, regency: true, status: true, _count: { select: { reports: true } } },
      take: 10,
      orderBy: { name: "asc" },
    });
```

**Konstruk**: `try/catch`; `if (q.length < 2)`; `take: 10`; `mode: "insensitive"`.

**🛡️ Kerentanan**: "Kode ini rentan *search string expansion* bila `contains` dipakai bebas — namun `take: 10` dan panjang minimum 2 membatasi beban." Tidak ada kerentanan signifikan.

### `GET /api/map-points` → app/api/map-points/route.ts

**Peran**: Menampilkan titik peta aktif (filter tipe/kategori, pagination maks 200) dengan laporan terbaru dan jumlah laporan approved.

**Alur Cerita**: Filter opsional `type` (slug MapPointType) dan `category` (slug MapPointCategory — hanya diproses jika type diberikan, karena kategori unik per tipe via compound key `typeId_slug`). `where` wajib `isActive: true`. Query paralel `findMany` (dengan include type, category, 1 laporan approved terbaru, `_count.reports` approved) + `count`. Mapping akhir membuang relasi mentah: id, type, category, name, slug, snapped coords, province, regency, reportCount, latestReport. `logError` dipanggil pada catch (jejak error terpusat).

**Potongan Kode Asli**:

```ts
// app/api/map-points/route.ts baris ±26-53
    if (categorySlug && typeSlug) {
      const category = await prisma.mapPointCategory.findUnique({
        where: { typeId_slug: { typeId: where.typeId as string, slug: categorySlug } },
        select: { id: true },
      });
      if (category) where.categoryId = category.id;
    }

    const [points, total] = await Promise.all([
      prisma.mapPoint.findMany({
        where,
        include: {
          type: { select: { id: true, slug: true, name: true, icon: true } },
          category: { select: { id: true, slug: true, name: true, color: true } },
          reports: {
            where: { status: "approved" },
            select: { id: true, formSlug: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: { select: { reports: { where: { status: "approved" } } } },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip,
      }),
      prisma.mapPoint.count({ where }),
    ]);
```

**Konstruk**: `try/catch`; `if` filter type; `if` filter category (bergantung type); `Promise.all`; `_count` dengan filter.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — publik read-only; hanya laporan approved yang dihitung/ditampilkan; koordinat snapped.

### `GET /api/map-points/[id]` → app/api/map-points/[id]/route.ts

**Peran**: Detail satu titik peta dengan semua laporan approved + foto (URL) + penghitungan jumlah foto.

**Alur Cerita**: Memakai pola Next 15 `params: Promise<{ id: string }>` (di-await). Titik dicari dengan include type, category, dan `reports` approved (dengan foto, user, dan judul form). Tidak ada → 404. Laporan di-map dengan `buildPhotoUrl` per foto; `allPhotos` dibuat dengan `flatMap`. Respons: point + reportCount + photoCount + reports + allPhotos. Parameter `id` adalah UUID — tidak bisa ditebak.

**Potongan Kode Asli**:

```ts
// app/api/map-points/[id]/route.ts baris ±34-49
    const reportsWithPhotos = (point.reports as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      formSlug: r.formSlug as string,
      formTitle: ((r.form as Record<string, string>)?.title || "") as string,
      fieldData: r.fieldData as string,
      status: r.status as string,
      user: r.user as { username: string } | null,
      createdAt: r.createdAt as Date,
      photos: ((r.photos as Array<Record<string, unknown>>) || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        fieldId: p.fieldId as string,
        url: buildPhotoUrl(p.storagePath as string),
        width: p.width as number,
        height: p.height as number,
      })),
    }));

    const allPhotos = reportsWithPhotos.flatMap((r) => r.photos);
```

**Konstruk**: `try/catch`; `await params`; `map` + `flatMap`; cast tipe `as Record<string, unknown>`.

**🛡️ Kerentanan**: "Kode ini rentan bila `fieldData` mentah dikirim ke publik — fieldData bisa berisi koordinat presisi atau data pribadi." **Temuan nyata**: `fieldData: r.fieldData as string` ikut dikirim mentah. Nilai fieldData disimpan saat submit (termasuk `location_lat` presisi!). Ini kebocoran koordinat presisi ke publik melalui map-point detail — direkomendasikan strip field lokasi atau parse selektif seperti route springs/[id].

### `GET /api/map-points/types` → app/api/map-points/types/route.ts

**Peran**: Menampilkan tipe titik map + kategori + jumlah titik per tipe dan per kategori (untuk filter peta).

**Alur Cerita**: `findMany` tipe aktif dengan kategori terurut + `_count.points` (aktif). Lalu `groupBy` `categoryId` untuk menghitung jumlah titik per kategori (dalam satu query agregasi), dibangun `Map` untuk lookup O(1), lalu tipe di-map menambah `count` per kategori. Ini menghindari N+1: satu groupBy menggantikan ribuan count per kategori.

**Potongan Kode Asli**:

```ts
// app/api/map-points/types/route.ts baris ±19-46
    // Get count per category
    const categoryCounts = await prisma.mapPoint.groupBy({
      by: ["categoryId"],
      where: { isActive: true, categoryId: { not: null } },
      _count: true,
    });
    const countMap = new Map(
      (categoryCounts as Array<{ categoryId: string | null; _count: number }>).map(
        (c) => [c.categoryId, c._count] as [string | null, number]
      )
    );

    const result = (types as Array<Record<string, unknown>>).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      slug: t.slug as string,
      name: t.name as string,
      icon: t.icon as string,
      count: ((t._count as Record<string, number>)?.points || 0) as number,
      categories: ((t.categories as Array<Record<string, unknown>>) || []).map(
        (c: Record<string, unknown>) => ({
          id: c.id as string,
          slug: c.slug as string,
          name: c.name as string,
          color: c.color as string,
          count: countMap.get(c.id as string) || 0,
        })
      ),
    }));
```

**Konstruk**: `try/catch`; `groupBy` + `_count`; `Map` untuk lookup; nested `map`.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — read-only publik; hanya agregat angka.

### `GET /api/map-types` → app/api/map-types/route.ts

**Peran**: Versi ringkas dari map-points/types — tipe + kategori tanpa jumlah titik.

**Alur Cerita**: `findMany` tipe aktif dengan kategori (id, slug, name, color) terurut. Tanpa `_count` dan tanpa groupBy — endpoint paling ringan di keluarga ini. Catatan: ada duplikasi fungsional dengan `/api/map-points/types`; konsumen lama mungkin masih memakai endpoint ini.

**Konstruk**: `try/catch`; satu findMany + include.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — read-only, tanpa input.

---

## Domain Seedling Marketplace

Tujuh route untuk sistem bibit dua arah: katalog, detail, permintaan, upload foto, konfirmasi terima (dengan transaksi stok), kontak WA, dan daftar permintaan per user. Semua route state-changing memakai CSRF + login.

### `GET /api/seedlings` → app/api/seedlings/route.ts

**Peran**: Menampilkan katalog bibit aktif (filter species/provinsi, atau `?mine=1` untuk bibit milik sendiri termasuk semua status).

**Alur Cerita**: Sesi dibaca (opsional — katalog bisa dibuka tanpa login). `where` default `{ status: "active" }`; jika `mine=1` DAN ada sesi, filter berubah: `where.userId = session.userId` dan `status` **dihapus** dari where (semua status milik sendiri: pending/active/rejected/exhausted) — `delete where.status` adalah trik halus yang membuat user melihat seluruh riwayat bibitnya. Filter species (case-insensitive) dan province ditambahkan. `include` bertingkat: user (id, username, points, region), photos, report+photos, `_count.requests`. Hanya jika `mine=1`: `requests` ikut di-include dengan data requester (id, username, phone) — data permintaan masuk HANYA untuk pemilik. Respons daftar tanpa pagination (catatan: di production sebaiknya ditambah).

**Potongan Kode Asli**:

```ts
// app/api/seedlings/route.ts baris ±16-37
    const where: Record<string, unknown> = { status: "active" };

    if (mine === "1" && session?.userId) {
      where.userId = session.userId;
      delete where.status;
    }

    if (species) where.species = { contains: species, mode: "insensitive" };
    if (province) where.province = province;

    const includeBase: Record<string, unknown> = {
      user: { select: { id: true, username: true, points: true, region: true } },
      photos: { select: { id: true, storagePath: true }, orderBy: { createdAt: "asc" } },
      report: { include: { photos: { select: { id: true, storagePath: true }, orderBy: { createdAt: "asc" }, take: 5 } } },
      _count: { select: { requests: true } },
    };
    if (mine === "1") {
      includeBase.requests = {
        include: { requester: { select: { id: true, username: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      };
    }
```

**Konstruk**: `try/catch`; `if (mine === "1" && session)`; `delete where.status`; include kondisional.

**🛡️ Kerentanan**: "Kode ini rentan *IDOR* bila `mine=1` bisa menampilkan bibit orang lain — namun `where.userId` dipaksa dari sesi, bukan dari query param." Tidak ada kerentanan signifikan; nomor telepon requester hanya dikirim ke pemilik bibit.

### `POST /api/seedlings` → app/api/seedlings/route.ts

**Peran**: Menambahkan bibit baru (atau menambah stok bibit yang sama) oleh user yang login.

**Alur Cerita**: CSRF + login wajib. Validasi: `species`, `quantity`, `province` wajib; `quantity` 1–9999. **Deduplikasi stok**: `findFirst` bibit milik user yang sama dengan species + province + regency sama dan status pending/active dan `stock > 0`; jika ada, stok ditambahkan (`quantity` dan `stock` increment) — user tidak perlu membuat entri baru untuk bibit sejenis; jika tidak ada, dibuat bibit baru `pending` (menunggu approve admin sebelum tampil publik). Respons `201`.

**Potongan Kode Asli**:

```ts
// app/api/seedlings/route.ts baris ±83-119
    // Cek: user yang sama, jenis + provinsi sama, masih ada stok?
    const existing = await prisma.seedling.findFirst({
      where: {
        userId: session.userId,
        species,
        province,
        regency: regency || "",
        status: { in: ["pending", "active"] },
        stock: { gt: 0 },
      },
    });

    let seedling;
    if (existing) {
      // User yang sama, jenis sama — tambah stok doang
      seedling = await prisma.seedling.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          stock: existing.stock + quantity,
        },
      });
    } else {
      // Belum ada — bikin baru
      seedling = await prisma.seedling.create({
        data: {
          userId: session.userId,
          species,
          quantity,
          stock: quantity,
          province,
          regency: regency || "",
          notes: notes || "",
          status: "pending",
        },
      });
    }
```

**Konstruk**: `try/catch`; CSRF; validasi wajib + rentang; `findFirst` dedupe; `if (existing)` update else create.

**🛡️ Kerentanan**: "Kode ini rentan *stock inflation* bila quantity negatif diterima — namun validasi 1–9999 menolak nilai tak valid." Tidak ada kerentanan signifikan — status pending wajib lewat moderasi admin sebelum tampil publik.

### `GET /api/seedlings/[id]` → app/api/seedlings/[id]/route.ts

**Peran**: Detail satu bibit: pemilik (termasuk nomor telepon), foto, dan foto laporan asal.

**Alur Cerita**: `findUnique` dengan include user (id, username, points, **phone**), photos, dan report+photos. Tidak ada → 404. Catatan privasi: `phone` pemilik dikirim ke siapa pun yang membuka detail bibit — disengaja (untuk memudahkan kontak), tapi kontak mandiri di route `/contact` membatasi lebih ketat (hanya setelah request).

**Potongan Kode Asli**:

```ts
// app/api/seedlings/[id]/route.ts baris ±10-23
    const seedling = await prisma.seedling.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, username: true, points: true, phone: true } },
        photos: { select: { id: true, storagePath: true, createdAt: true }, orderBy: { createdAt: "asc" } },
        report: { include: { photos: { select: { id: true, storagePath: true }, orderBy: { createdAt: "asc" }, take: 5 } } },
      },
    });
```

**Konstruk**: `try/catch`; `if (!seedling)`; tiga include.

**🛡️ Kerentanan**: "Kode ini rentan *PII exposure* — nomor telepon pemilik tampil publik walau belum ada transaksi." Ini desain sengaja, tapi disarankan menahan phone sampai ada permintaan (seperti route contact). Tidak ada kerentanan signifikan saat ini, namun layak dievaluasi.

### `POST /api/seedlings/[id]/request` → app/api/seedlings/[id]/request/route.ts

**Peran**: Mengirim permintaan bibit (quantity 1–100, tidak boleh bibit sendiri, tidak melebihi stok).

**Alur Cerita**: CSRF + login. Bibit dicari; tidak ada → 404. Empat guard berurutan: status harus `active` (400 "Bibit belum tersedia"); `stock >= 1` (400 "Stok bibit habis"); **bibit sendiri ditolak** (`seedling.userId === session.userId` → 400 "Gak bisa minta bibit sendiri"); quantity di-parse `parseInt(...) || 1` dan divalidasi `1 <= q <= stock` (400). Bonus: `quantity > 100` ditolak dengan pesan edukatif "Untuk lebih dari 100, buat proyek di /projects/new". `seedlingRequest.create` dengan requesterId (sesi), ownerId (pemilik), status `pending`. Respons `201`.

**Potongan Kode Asli**:

```ts
// app/api/seedlings/[id]/request/route.ts baris ±31-71
    if (seedling.status !== "active") {
      return NextResponse.json({ error: "Bibit belum tersedia" }, { status: 400 });
    }

    if (seedling.stock < 1) {
      return NextResponse.json({ error: "Stok bibit habis" }, { status: 400 });
    }

    // Gak bisa minta bibit sendiri
    if (seedling.userId === session.userId) {
      return NextResponse.json({ error: "Gak bisa minta bibit sendiri" }, { status: 400 });
    }

    const body = await request.json();
    const quantity = parseInt(body.quantity, 10) || 1;
    const message = body.message || "";

    if (quantity < 1 || quantity > seedling.stock) {
      return NextResponse.json(
        { error: "Jumlah tidak valid" },
        { status: 400 }
      );
    }

    if (quantity > 100) {
      return NextResponse.json(
        { error: "Maksimal 100 bibit. Untuk lebih dari 100, buat proyek di /projects/new" },
        { status: 400 }
      );
    }

    const req = await prisma.seedlingRequest.create({
      data: {
        seedlingId: seedling.id,
        requesterId: session.userId,
        ownerId: seedling.userId,
        quantity,
        message,
        status: "pending",
      },
    });
```

**Konstruk**: `try/catch`; CSRF; rangkaian guard `if` berurutan; `parseInt || 1`; create.

**🛡️ Kerentanan**: "Kode ini rentan *self-dealing* bila user bisa minta bibit sendiri — menaikkan jumlah transaksi palsu." Guard `seedling.userId === session.userId` menutupnya. Tidak ada kerentanan signifikan — stok dicek saat request, dan pemilik masih menyetujui/menolak.

### `POST /api/seedlings/[id]/photos` → app/api/seedlings/[id]/photos/route.ts

**Peran**: Upload foto bibit — **hanya pemilik bibit** yang boleh.

**Alur Cerita**: CSRF + login. Bibit dicari (404). Guard kepemilikan paling ketat di domain ini: `seedling.userId !== session.userId` → `403 "Hanya pemilik yang bisa upload foto"`. File wajib ada (400). `uploadPhoto(file, "seedlings")` (validasi MIME + kompresi, sama dengan report). `seedlingPhoto.create` + `201`. Tidak ada batas jumlah foto per bibit (berbeda dari report yang max 5).

**Potongan Kode Asli**:

```ts
// app/api/seedlings/[id]/photos/route.ts baris ±23-51
    const seedling = await prisma.seedling.findUnique({
      where: { id: params.id },
    });

    if (!seedling) {
      return NextResponse.json({ error: "Bibit tidak ditemukan" }, { status: 404 });
    }

    if (seedling.userId !== session.userId) {
      return NextResponse.json({ error: "Hanya pemilik yang bisa upload foto" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File foto wajib diupload" }, { status: 400 });
    }

    const result = await uploadPhoto(file, "seedlings");
```

**Konstruk**: `try/catch`; CSRF; guard kepemilikan ketat; validasi file; uploadPhoto.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — hanya pemilik; MIME divalidasi server-side.

### `POST /api/seedlings/[id]/confirm-receive` → app/api/seedlings/[id]/confirm-receive/route.ts

**Peran**: Konfirmasi penerimaan bibit oleh PEMINTA — stok dikurangi dan status permintaan jadi `completed` dalam SATU transaksi.

**Alur Cerita**: CSRF + login. Body wajib `requestId` (400). Permintaan dicari (404). Guard: hanya `seedReq.requesterId === session.userId` yang boleh konfirmasi (`403`); status `completed`/`rejected`/`cancelled` → `400 "Permintaan sudah selesai atau dibatalkan"`. Kunci utamanya adalah **`prisma.$transaction([...])`**: dua operasi atomik — `seedling.update` dengan `stock: { decrement: quantity }` DAN `seedlingRequest.update` ke `completed`. Jika salah satu gagal, keduanya batal (tidak ada stok berkurang tanpa status selesai, atau sebaliknya). Setelah transaksi, cek stok: jika `<= 0`, seedling di-set `exhausted` (otomatis tidak muncul di katalog `status: active`). Notifikasi dibuat untuk pemilik (non-blocking).

**Potongan Kode Asli**:

```ts
// app/api/seedlings/[id]/confirm-receive/route.ts baris ±49-70
    // Kurangi stok
    await prisma.$transaction([
      prisma.seedling.update({
        where: { id: seedReq.seedlingId },
        data: { stock: { decrement: seedReq.quantity } },
      }),
      prisma.seedlingRequest.update({
        where: { id: requestId },
        data: { status: "completed" },
      }),
    ]);

    // Kalau stok habis, update status seedling
    const seedling = await prisma.seedling.findUnique({
      where: { id: seedReq.seedlingId },
    });
    if (seedling && seedling.stock <= 0) {
      await prisma.seedling.update({
        where: { id: seedReq.seedlingId },
        data: { status: "exhausted" },
      });
    }
```

**Konstruk**: `try/catch`; CSRF; guard kepemilikan requester; `$transaction` array; cek stok pasca-transaksi; notifikasi non-blocking.

**🛡️ Kerentanan**: "Kode ini rentan *stock race* bila dua konfirmasi berjalan bersamaan — stok bisa negatif." Di SpringHub `$transaction` menjamin atomisitas dua update, dan guard status mencegah konfirmasi ulang. Stok bisa menuju 0 tapi tidak negatif, karena decrement hanya terjadi sekali per permintaan yang belum selesai. Tidak ada kerentanan signifikan.

### `GET /api/seedlings/[id]/contact` → app/api/seedlings/[id]/contact/route.ts

**Peran**: Memberikan nomor WA pemilik bibit — HANYA setelah user mengirim permintaan (pending/completed) untuk bibit itu.

**Alur Cerita**: Login wajib. `findFirst` permintaan dengan `seedlingId`, `requesterId = sesi`, dan status `pending`/`completed`; jika tidak ada → `403 "Kamu belum minta bibit ini"`. Pemilik diambil; jika `phone` kosong → `404 "Pemilik belum daftarin nomor kontak"`. Nomor dibersihkan non-digit (`replace(/[^0-9]/g, "")`) dan `wa.me` link dibangun. Ini desain privasi yang rapi: nomor WA baru terbuka setelah ada niat transaksi.

**Potongan Kode Asli**:

```ts
// app/api/seedlings/[id]/contact/route.ts baris ±16-52
    // Cari request yang statusnya pending atau completed
    // Requester bisa lihat WA kapan aja setelah minta
    const request = await prisma.seedlingRequest.findFirst({
      where: {
        seedlingId: params.id,
        requesterId: session.userId,
        status: { in: ["pending", "completed"] },
      },
      select: { id: true, status: true },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Kamu belum minta bibit ini" },
        { status: 403 }
      );
    }

    // Ambil nomor HP pemilik
    const seedling = await prisma.seedling.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        user: { select: { phone: true, username: true } },
      },
    });

    if (!seedling?.user?.phone) {
      return NextResponse.json({ error: "Pemilik belum daftarin nomor kontak" }, { status: 404 });
    }

    const waNumber = seedling.user.phone.replace(/[^0-9]/g, "");
    return NextResponse.json({
      phone: seedling.user.phone,
      waLink: `https://wa.me/${waNumber}`,
      ownerName: seedling.user.username,
    });
```

**Konstruk**: `try/catch`; login wajib; `findFirst` permintaan; guard 403; regex pembersihan digit; `wa.me` URL.

**🛡️ Kerentanan**: "Kode ini rentan *contact harvesting* bila tanpa prasyarat permintaan — penyerang bisa mengumpulkan nomor WA semua penjual." Gate `findFirst` permintaan menutupnya: nomor hanya keluar untuk requester yang sah. Tidak ada kerentanan signifikan.

### `GET /api/seedling-requests` → app/api/seedling-requests/route.ts

**Peran**: Menampilkan permintaan user: `?type=outgoing` (yang saya kirim) atau `?type=incoming` (masuk ke bibit saya).

**Alur Cerita**: Login wajib. `type` default "outgoing": `where.requesterId = sesi`; selain itu (`incoming` atau nilai lain — semua dianggap incoming): `where.ownerId = sesi`. Include: seedling (species, quantity, province, regency), requester (id, username, **phone**), owner (id, username, **phone**). Phone ikut dikirim — diperlukan untuk koordinasi, dan hanya kepada dua pihak yang bertransaksi (peminta dan pemilik). Tanpa pagination.

**Potongan Kode Asli**:

```ts
// app/api/seedling-requests/route.ts baris ±13-42
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "outgoing";

    let where: Record<string, unknown> = {};

    if (type === "outgoing") {
      // Permintaan yang saya kirim
      where.requesterId = session.userId;
    } else {
      // Permintaan masuk ke bibit saya
      where.ownerId = session.userId;
    }

    const requests = await prisma.seedlingRequest.findMany({
      where,
      include: {
        seedling: { select: { id: true, species: true, quantity: true, province: true, regency: true } },
        requester: { select: { id: true, username: true, phone: true } },
        owner: { select: { id: true, username: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
```

**Konstruk**: `try/catch`; `if (type === "outgoing")` else; dua include pihak.

**🛡️ Kerentanan**: "Kode ini rentan *IDOR* bila `where` bisa diarahkan ke user lain — namun kunci filter selalu berasal dari `session.userId`." Tidak ada kerentanan signifikan.

---

## Domain Proyek Komunitas

Empat route untuk proyek komunitas: daftar (approved saja), detail, komentar, dan like (toggle).

### `GET /api/projects` → app/api/projects/route.ts

**Peran**: Menampilkan proyek yang disetujui (pagination) dengan foto ber-URL, featured photo, dan jumlah donasi/komentar.

**Alur Cerita**: `where` dipaksa `status: "approved"` — publik tidak pernah melihat proyek pending. Query paralel + `select`: title, summary, region, goal/raised, typeId, likes, comments, user username, 5 foto, `_count` donations/commentList/photos. Normalisasi: `buildPhotoUrls` untuk semua foto; `featuredPhoto` diambil dari featuredPhotoId (fallback foto pertama); `_count` di-rename `comments` (karena relasi asli `commentList`). `logError` untuk jejak error; catch mengembalikan `{ projects: [] }` (graceful). POST di file sama dibahas di bawah.

### `POST /api/projects` → app/api/projects/route.ts

**Peran**: Submit proyek baru oleh Field Lead/Admin dengan wajib 3+ foto lokasi, proposal file base64, dan pembuatan photo records.

**Alur Cerita**: Login wajib. Profil diambil; **gate poin/role**: hanya `admin` atau `field_lead` yang bisa submit — pesan 403 bahkan memberi tahu syarat: "Kumpulkan 20.000 poin untuk jadi Field Lead". Konten wajib `multipart/form-data` (400). Loop `formData.entries()`: file `foto_*` dikumpulkan ke `photoFiles` (dengan nama field), `proposalFile` diubah jadi **data URL base64** dan disimpan ke `fieldData.proposalFile` (perhatikan: base64 dalam DB — besar; pertimbangan desain), field lain disimpan kecuali `form_slug`/`_submit_time`/`_website`/`_captured_at`. Validasi foto: **minimal 3** (`400 "Wajib upload 3 foto lokasi proyek."`). Summary dibangun dari field B1_judul/B3_tempat/B2_jenis/B4_latar/D1_biaya. `project.create` dengan status `pending` + `fieldData` JSON. Foto di-upload satu per satu (`uploadPhoto`) — kegagalan upload di-`catch {}` (diam; proyek tetap ada); foto pertama menjadi `featuredPhotoId`. `201`.

**Potongan Kode Asli**:

```ts
// app/api/projects/route.ts baris ±99-138
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("foto_") && typeof value === "object" && value !== null && (value as any).size > 0) {
      photoFiles.push(value as File);
      fieldPhotos.push(key);
    } else if (key === "proposalFile" && typeof value === "object" && value !== null) {
      const buffer = Buffer.from(await value.arrayBuffer());
      fieldData.proposalFile = `data:${value.type};base64,${buffer.toString("base64")}`;
    } else if (key !== "form_slug" && key !== "_submit_time" && key !== "_website" && key !== "_captured_at") {
      fieldData[key] = value as string;
    }
  }

  if (fieldPhotos.length < 3) {
    return NextResponse.json({ error: "Wajib upload 3 foto lokasi proyek." }, { status: 400 });
  }
```

**Konstruk**: `try/catch`; gate role; `for...of` formData dengan `if/else if`; validasi jumlah foto; create; loop upload dengan catch diam.

**🛡️ Kerentanan**: "Kode ini rentan *oversized base64* bila proposal file raksasa disimpan di DB — kolom fieldData bisa penuh." Belum ada batas ukuran eksplisit untuk `proposalFile` di route ini (berbeda dari foto yang dibatasi uploadPhoto); disarankan batasi ukuran file. GET tidak memiliki kerentanan signifikan (approved-only).

### `GET /api/projects/[id]` → app/api/projects/[id]/route.ts

**Peran**: Detail proyek: untuk admin semua status; untuk publik hanya `approved` (selain itu 404 — bukan 403, agar keberadaan proyek non-publik tidak bocor).

**Alur Cerita**: Sesi dibaca untuk menentukan admin. `findUnique` dengan include user, photos, `_count`. Tidak ada → 404. **Filter visibilitas**: `if (!isAdmin && project.status !== "approved")` → 404. Admin melihat semua. `fieldData` di-parse (catch → {}), proposal diambil dari `proposalFile` DB atau fieldData, foto diberi URL, `featuredPhoto` dipilih. Normalisasi ke objek datar (tanpa kolom mentah tak perlu). 

**Potongan Kode Asli**:

```ts
// app/api/projects/[id]/route.ts baris ±21-32
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Non-admin hanya bisa lihat project approved
    if (!isAdmin && project.status !== "approved") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
```

**Konstruk**: `try/catch`; `if (!isAdmin && status)` → 404 (anti-enumeration).

**🛡️ Kerentanan**: "Kode ini rentan *status enumeration* bila proyek non-approved membalas 403 — penyerang bisa memetakan proyek mana yang sedang direview." 404 seragam mencegahnya. Tidak ada kerentanan signifikan.

### `GET /api/projects/[id]/comments` → app/api/projects/[id]/comments/route.ts

**Peran**: Menampilkan 50 komentar terbaru proyek (publik) dan menambahkan komentar (login).

**Alur Cerita**: GET tanpa auth: `findMany` komentar `projectId`, urut terbaru, take 50, include username. POST: login wajib (`401 "Login required"`); `text` wajib non-kosong setelah trim (400); proyek harus ada (404); `comment.create`; lalu **denormalisasi**: `project.update { comments: { increment: 1 } }` — kolom counter `comments` di Project dijaga sinkron. `201` dengan komentar + username.

**Potongan Kode Asli**:

```ts
// app/api/projects/[id]/comments/route.ts baris ±31-55
    const { text } = await req.json();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Comment text required" }, { status: 400 });
    }
    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: params.id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const comment = await prisma.comment.create({
      data: {
        projectId: params.id,
        userId: session.userId,
        text: text.trim(),
      },
      include: { user: { select: { username: true } } },
    });
    // Also increment project comments count
    await prisma.project.update({
      where: { id: params.id },
      data: { comments: { increment: 1 } },
    });
```

**Konstruk**: `try/catch`; login wajib; validasi teks; cek proyek; create + increment counter.

**🛡️ Kerentanan**: "Kode ini rentan *stored XSS* bila teks komentar dirender mentah — komentar user bisa menyisipkan skrip." Teks komentar belum di-sanitize di route ini (tidak ada `sanitizeHtml`); direkomendasikan sanitasi saat render. Tidak ada CSRF juga di POST — komentar butuh sesi cookie, jadi serangan CSRF bisa membuat komentar atas nama korban (dampak rendah, tapi catatan penting). Tidak ada kerentanan signifikan — dengan rekomendasi sanitasi.

### `POST /api/projects/[id]/like` → app/api/projects/[id]/like/route.ts

**Peran**: Toggle like — like sekali lagi = batal like — dengan sinkronisasi kolom denormalisasi `likes`.

**Alur Cerita**: Login wajib. Proyek harus ada (404). `like.findUnique` dengan compound key `userId_projectId`: jika sudah ada → hapus like + `likes.decrement`; jika belum → buat like + `likes.increment`. Respons `{ liked, likes }` (baca ulang setelah update). GET di file yang sama: total like dari kolom denormalisasi (termasuk seed data) + `liked` pribadi (jika login). Route ini memakai unique constraint `@@unique([userId, projectId])` — dua klik ganda tidak bisa membuat like ganda.

**Potongan Kode Asli**:

```ts
// app/api/projects/[id]/like/route.ts baris ±20-46
    const existing = await prisma.like.findUnique({
      where: { userId_projectId: { userId, projectId: id } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      await prisma.project.update({
        where: { id },
        data: { likes: { decrement: 1 } },
      });
      const updated = await prisma.project.findUnique({
        where: { id },
        select: { likes: true },
      });
      return NextResponse.json({ liked: false, likes: updated?.likes ?? 0 });
    }

    await prisma.like.create({ data: { userId, projectId: id } });
    await prisma.project.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
    const updated = await prisma.project.findUnique({
      where: { id },
      select: { likes: true },
    });
    return NextResponse.json({ liked: true, likes: updated?.likes ?? 0 });
```

**Konstruk**: `try/catch`; login; `findUnique` compound; `if (existing)` branch unlike else like; read-back.

**🛡️ Kerentanan**: "Kode ini rentan *like inflation* bila user bisa like berulang — namun unique constraint `userId_projectId` menjamin satu like per user per proyek." Tidak ada kerentanan signifikan — counter bisa meleset jika seed data tidak sinkron dengan tabel Like, tapi GET memakai kolom denormalisasi yang di-*increment* konsisten.

---

## Domain Dashboard & Statistik

Tiga route untuk angka besar: dashboard landing, leaderboard, dan galeri publik.

### `GET /api/dashboard` → app/api/dashboard/route.ts

**Peran**: Menyusun statistik landing page (impactStats, monthlyProgress, topRegions, topVolunteers) dengan 15 query paralel.

**Alur Cerita**: Route publik berat yang dioptimasi: semua query count independen dijalankan dalam satu `Promise.all` 15 elemen — "memotong waktu dinding dari jumlah berurutan menjadi maksimum paralel" (komentar asli kode). Perhitungan bulan berjalan memakai `firstOfMonth` (tanggal 1 jam 00:00). Hasil: 4 impactStats (Monitored Springs, Restored, Trees, Rorak) dengan display "500+" untuk angka besar; monthlyProgress dengan `total` sintetis (`Math.max(value * 4, 100)` — target progresif yang tumbuh seiring data). **topRegions**: pendekatan pragmatis — karena `fieldData` adalah JSON (tak ter-index), hanya 500 laporan terbaru yang diambil, region diekstrak dari `spring.province` (prefer) atau parse JSON; fallback ke `profile.groupBy(region)` jika data region minim. `topVolunteers`: 5 user poin tertinggi. `logError` pada catch.

**Potongan Kode Asli**:

```ts
// app/api/dashboard/route.ts baris ±116-156
    // ── topRegions ───────────────────────────────────────────────────
    // Instead of loading ALL reports + groupBy on JSON string (no index),
    // we query at most 500 recent active reports and extract region from
    // their JSON fieldData. This is a pragmatic trade-off: the "top 5"
    // regions will converge with just a few hundred reports.
    const recentReports = await prisma.report.findMany({
      where: { isActive: true },
      select: {
        fieldData: true,
        formSlug: true,
        spring: { select: { province: true, regency: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const regionMap = new Map<string, { reports: number; trees: number; trenches: number }>();

    for (const rpt of recentReports) {
      let region: string | null = null;

      // Prefer the spring's own province/regency fields (no parsing needed)
      if (rpt.spring?.province) {
        region = rpt.spring.province;
      } else {
        // Fallback: parse JSON fieldData
        try {
          const data = JSON.parse(rpt.fieldData);
          region = data.province || data.region || null;
        } catch {
          // ignore
        }
      }

      if (!region) region = "Unknown";
      // ... akumulasi ke regionMap
    }
```

**Konstruk**: `try/catch`; `Promise.all` 15 query; `Map` agregasi; `reduce`; `sort` + `slice(0, 5)`; `Math.max` untuk target sintetis.

**🛡️ Kerentanan**: "Kode ini rentan *cache stampede* bila dipanggil publik tanpa cache — 15 query per request bisa membebani DB." Route ini sengaja tidak di-cache (data near-real-time untuk landing); mitigasi tersedia di lapisan CDN. Tidak ada kerentanan keamanan signifikan — endpoint publik read-only.

### `GET /api/leaderboard` → app/api/leaderboard/route.ts

**Peran**: Papan peringkat 20 volunteer teratas + statistik total, di-cache 60 detik.

**Alur Cerita**: `getOrSet("leaderboard", "top20", factory, 60)`. Factory: `Promise.all` — 20 profil non-admin teratas (`role: { not: "admin" }`, order poin desc), total laporan approved, jumlah volunteer. Cache 60 detik menahan beban landing yang sering di-refresh. Tidak ada data pribadi selain username/region/points.

**Potongan Kode Asli**:

```ts
// app/api/leaderboard/route.ts baris ±8-20
    const data = await getOrSet("leaderboard", "top20", async () => {
      const [leaders, totalReports, totalVolunteers] = await Promise.all([
        prisma.profile.findMany({
          where: { role: { not: "admin" } },
          orderBy: { points: "desc" },
          take: 20,
          select: { id: true, username: true, region: true, points: true },
        }),
        prisma.report.count({ where: { status: "approved" } }),
        prisma.profile.count({ where: { role: { not: "admin" } } }),
      ]);
      return { leaders, stats: { totalReports, totalVolunteers } };
    }, 60);
```

**Konstruk**: `try/catch`; `getOrSet` TTL 60; `Promise.all`.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — data publik agregat; admin dikecualikan dari papan.

### `GET /api/gallery` → app/api/gallery/route.ts

**Peran**: Galeri publik — laporan approved yang punya featured photo, filter `?formSlug=`, maks 100.

**Alur Cerita**: `where` memaksa `status: "approved"` DAN `featuredPhotoId: { not: null }`; `formSlug` opsional menambah filter. `take: Math.min(limit, 100)` — limit dipatok 100. Tiap item: reportId, formSlug, tanggal, snapped coords, username, region, plus field terpilih dari fieldData (province, detailName dari B1_nama/T_nama_lokal/spring_name/species, detailCount) dan foto featured dengan URL. `fieldData` di-parse dengan try/catch. Ini contoh pemilihan kolom ketat dari JSON.

**Potongan Kode Asli**:

```ts
// app/api/gallery/route.ts baris ±47-74
    const gallery = reports.map((r) => {
      const featured = r.photos.find((p) => p.id === r.featuredPhotoId);
      let parsedFieldData: Record<string, unknown> = {};
      try { parsedFieldData = JSON.parse(typeof r.fieldData === "string" ? r.fieldData : "{}"); } catch {}
      return {
        reportId: r.id,
        formSlug: r.formSlug,
        createdAt: r.createdAt,
        snappedLat: r.snappedLat,
        snappedLng: r.snappedLng,
        username: r.user?.username || "guest",
        region: r.user?.region || "",
        province: (parsedFieldData.province as string) || "",
        detailName: (parsedFieldData.B1_nama as string) ||
                    (parsedFieldData.T_nama_lokal as string) ||
                    (parsedFieldData.spring_name as string) ||
                    (parsedFieldData.species as string) || "",
        detailCount: (parsedFieldData.count as string) || "",
        photo: featured ? { id: featured.id, url: buildPhotoUrl(featured.storagePath), width: featured.width, height: featured.height } : null,
      };
    });
```

**Konstruk**: `try/catch`; `Math.min` limit; `find` featured; rantai `||` ekstraksi nama.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — hanya approved + featured, koordinat snapped, ekstraksi field selektif.

---

## Domain Notifikasi & Profil User

Enam route personal: notifikasi (list/read/unread), feed aktivitas, poin, dan profil. Semuanya scoped ke `session.userId` (RLS).

### `GET /api/notifications` → app/api/notifications/route.ts

**Peran**: Pagination notifikasi milik user yang login (default 50).

**Alur Cerita**: Login wajib (401). Pagination standar dengan `where: { userId: session.userId }` — tidak mungkin melihat notifikasi orang lain. `logError` + graceful fallback `{ notifications: [] }` (200). POST di file yang sama: membuat notifikasi **untuk diri sendiri** — menariknya, ini dipakai user untuk menandai event lokal; jika tipe `event`/`report-approved`/`report-rejected`, email dikirim ke user (non-blocking).

**Potongan Kode Asli**:

```ts
// app/api/notifications/route.ts baris ±42-74
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const notification = await prisma.notification.create({
    data: {
      userId: session.userId,
      type: body.type || "info",
      title: body.title,
      body: body.body || "",
      link: body.link || "",
    },
  });

  // Send email notification for event type
  if (body.type === "event" || body.type === "report-approved" || body.type === "report-rejected") {
    const user = await prisma.profile.findUnique({
      where: { id: notification.userId },
      select: { email: true },
    });
    if (user?.email) {
      sendNotificationEmail(user.email, body.title || notification.title, body.body || notification.body).catch(() => {});
    }
  }

  return NextResponse.json({ notification }, { status: 201 });
}
```

**Konstruk**: `try/catch` GET; login; create + email non-blocking.

**🛡️ Kerentanan**: "Kode ini rentan bila user bisa membuat notifikasi untuk user lain — namun `userId` dipaksa `session.userId`." Tidak ada kerentanan signifikan; POST tanpa CSRF bisa di-CSRF-kan untuk mengirim email spam ke diri sendiri (dampak rendah).

### `GET /api/notifications/unread` → app/api/notifications/unread/route.ts

**Peran**: Menghitung notifikasi belum dibaca (untuk badge).

**Alur Cerita**: Jika tidak login → `{ unread: 0 }` (bukan error). Jika login, `count` dengan `isRead: false`. Fallback catch → `{ unread: 0 }` 200. Ringan dan sering dipanggil — tanpa query berat.

**Konstruk**: `try/catch`; `if (!session)`; satu count.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — hanya hitungan milik sendiri.

### `POST /api/notifications/[id]/read` → app/api/notifications/[id]/read/route.ts

**Peran**: Menandai satu notifikasi sebagai dibaca.

**Alur Cerita**: Login wajib. Kunci keamanannya di `updateMany` dengan `where: { id: params.id, userId: session.userId }` — jika notifikasi itu bukan milik user, update tidak mengenai baris apa pun (tanpa error). Idempoten: menandai notifikasi yang sudah dibaca tetap sukses. Tanpa CSRF (dampak kecil).

**Potongan Kode Asli**:

```ts
// app/api/notifications/[id]/read/route.ts baris ±6-20
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.notification.updateMany({
      where: { id: params.id, userId: session.userId },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Notifications Read POST]", err);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
```

**Konstruk**: `try/catch`; login; `updateMany` scoped userId (guard IDOR bawaan).

**🛡️ Kerentanan**: "Kode ini rentan *IDOR* bila update memakai `id` saja — user bisa menandai notifikasi orang lain." `userId` di dalam `where` membuatnya tidak mungkin. Tidak ada kerentanan signifikan.

### `GET /api/user/notifications` → app/api/user/notifications/route.ts

**Peran**: Feed aktivitas ringkas (5 poin terakhir + 5 status laporan terakhir) untuk widget profil — tanpa tabel Notification.

**Alur Cerita**: Tanpa login → `{ notifications: [], unread: 0 }`. Dengan login, dua query: 5 `pointsLog` terakhir dan 5 report approved/rejected terakhir. Keduanya di-map jadi notifikasi sintetis: tipe `points` ("+100 pts: ...") dan `success`/`error` ("Laporan ... disetujui ✅"/"ditolak ❌"), diurutkan gabungan (sort by time desc) dan di-slice 10. `unread` = panjang (estimasi). Endpoint ini menghindari tabel Notification untuk kasus sederhana.

**Potongan Kode Asli**:

```ts
// app/api/user/notifications/route.ts baris ±29-46
    const notifications = [
      ...recentPoints.map((p) => ({
        type: "points" as const,
        message: `+${p.amount} pts: ${p.reason}`,
        time: p.createdAt.toISOString(),
        icon: "sparkles" as const,
      })),
      ...recentReports.map((r) => ({
        type: (r.status === "approved" ? "success" : "error") as "success" | "error",
        message: `Laporan ${r.formSlug} ${r.status === "approved" ? "disetujui ✅" : "ditolak ❌"}`,
        time: r.createdAt.toISOString(),
        icon: (r.status === "approved" ? "check" : "x") as "check" | "x",
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
```

**Konstruk**: dua `findMany`; spread + `map`; `sort` gabungan; `slice(0, 10)`.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — data milik sendiri; tanpa login respons kosong (bukan info leak).

### `GET /api/user/points` → app/api/user/points/route.ts

**Peran**: Saldo poin, trust score, dan 100 log poin terakhir milik user.

**Alur Cerita**: Login wajib (401). Dua query: profil (points, trustScore) dan 100 `pointsLog` terakhir. `totalEarned` = jumlah semua amount (tidak termasuk negatif? — semua amount dijumlah, termasuk 0 dan potongan, jadi ini "total earned" kasar). Fallback error → `{ points: 0, trustScore: 50, ... }` (200) + `logError`.

**Potongan Kode Asli**:

```ts
// app/api/user/points/route.ts baris ±16-34
    const profile = await prisma.profile.findUnique({
      where: { id: session.userId },
      select: { points: true, trustScore: true },
    });

    const logs = await prisma.pointsLog.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const totalEarned = logs.reduce((sum, l) => sum + l.amount, 0);

    return NextResponse.json({
      points: profile?.points ?? 0,
      trustScore: profile?.trustScore ?? 50,
      totalEarned,
      logs,
    });
```

**Konstruk**: `try/catch`; login; dua query; `reduce`.

**🛡️ Kerentanan**: Tidak ada kerentanan signifikan — `where` selalu `session.userId`; log tanpa data sensitif (reason + metadata disimpan tapi tidak dibuka ke client di sini — hanya seluruh record... catatan: `logs` dikirim penuh termasuk `metadata` yang berisi email newsletter/JSON; untuk user sendiri ini OK).

### `GET /api/user/profile` → app/api/user/profile/route.ts

**Peran**: Profil lengkap user + riwayat laporan + 50 log poin untuk halaman profil.

**Alur Cerita**: Login wajib. Profil (9 kolom, tanpa hash), semua laporan milik user (id, formSlug, status, createdAt), 50 log poin. Fallback error → `{ error: "Gagal memuat profil" }` 200 + `logError`. PUT-nya: update username/region/phone, dan ganti password bila `newPassword` diberikan — **wajib verifikasi `currentPassword`** via `verifyPassword` (400 jika salah). Skema Zod `updateSchema` memvalidasi; `username` min 2. Ini salah satu route yang TIDAK memakai CSRF untuk PUT-nya — perlu diperhatikan: ganti password tanpa CSRF berarti serangan cross-site bisa mengubah password korban bila cookie terkirim (SameSite=Lax memitigasi sebagian). Catatan: update username tanpa cek duplikat (unique constraint menolak, error 500 — bukan 409).

**Potongan Kode Asli**:

```ts
// app/api/user/profile/route.ts baris ±93-108
    if (parsed.data.newPassword) {
      if (!parsed.data.currentPassword) {
        return NextResponse.json({ error: "Password saat ini diperlukan" }, { status: 400 });
      }
      const profile = await prisma.profile.findUnique({ where: { id: session.userId } });
      if (!profile || !(await verifyPassword(parsed.data.currentPassword, profile.passwordHash))) {
        return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
      }
      data.passwordHash = await hashPassword(parsed.data.newPassword);
    }

    const updated = await prisma.profile.update({
      where: { id: session.userId },
      data,
      select: { id: true, username: true, email: true, region: true, role: true, points: true },
    });
```

**Konstruk**: `try/catch`; login; Zod; `if (newPassword)` → verifikasi password lama; update.

**🛡️ Kerentanan**: "Kode ini rentan *account takeover* bila ganti password tanpa verifikasi password lama — penyerang yang memegang sesi korban bisa mengganti password dan mengunci korban." Verifikasi `currentPassword` menutupnya; namun PUT tanpa CSRF tetap layak ditambahkan (langkah verifikasi password lama mereduksi risiko CSRF karena penyerang tidak tahu password korban). Tidak ada kerentanan signifikan saat ini.

---

## Domain Infrastruktur & Lain-lain

Tujuh route terakhir ini adalah "tukang servis" yang jarang terlihat pengguna: health check untuk memantau server, error logging dari frontend, newsletter, feedback publik, aturan poin yang dipajang publik, presign upload foto, dan thumbnail YouTube. Masing-masing kecil, tapi bersama-sama mereka menjaga server tetap hidup, membantu admin melihat kegagalan, dan menghubungkan dunia luar dengan SpringHub.

### `GET /api/health` → `app/api/health/route.ts`

**Peran**: Mengecek kesehatan database dan Redis, lalu melaporkan status server secara publik — endpoint favorit untuk uptime monitor dan Docker healthcheck.

**Alur Cerita**: Tanpa mengecek sesi atau CSRF — siapa pun boleh mengecek apakah server hidup. Cerita dimulai dengan dua kunci kosong: `checks` untuk database dan Redis. Database diuji dengan `SELECT 1` polos — kalau jawabannya ada, Prisma mengisinya "ok", kalau error, "error". Redis diuji dengan `ping()` — balasan `PONG` berarti sehat. Seluruh nilai kunci lalu dirangkum: kalau semua "ok", statusnya "healthy" dengan kode 200; ada satu saja yang gagal, statusnya "degraded" dengan kode 503. Ditambah `timestamp` saat pengecekan dan `uptime` server dalam detik — ini yang membuat laporan monitoring berbunyi lebih meyakinkan.

**Potongan Kode Asli**:

```ts
// Check database
try {
  await prisma.$queryRaw`SELECT 1`;
  checks.database = "ok";
} catch {
  checks.database = "error";
}

// Check Redis
try {
  await redis.ping();
  checks.redis = "ok";
} catch {
  checks.redis = "error";
}

const allOk = Object.values(checks).every((s) => s === "ok");

return NextResponse.json(
  {
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  },
  { status: allOk ? 200 : 503 }
);
```

**Konstruk**: `force-dynamic`; `try/catch` per layanan; `$queryRaw` untuk heartbeat DB; `redis.ping()`; respons JSON berstatus 200/503.

**🛡️ Kerentanan**: Endpoint publik tanpa rate limit — bisa dibanjiri request murah yang tiap kali menyentuh database dan Redis (mini DoS). Untungnya querynya paling ringan yang ada (`SELECT 1`), jadi dampaknya kecil; Docker healthcheck memang butuh endpoint semacam ini.

### `POST /api/log/error` → `app/api/log/error/route.ts`

**Peran**: Menerima log error dari frontend (juga guest) dan menyimpannya ke `AppError` di database.

**Alur Cerita**: Frontend yang menabrak suatu error tidak membisu — ia menulis surat. Surat itu harus berformat tertentu: `level` (info/warning/error/critical), `message`, `source` (frontend/api/worker/database), `stack`, `url`, `userId`, dan `metadata` JSON. Sebelum masuk, IP pengirim dicek ke `apiLimiter` — bila sudah kebanyakan menulis, jawab 429 tanpa basa-basi. Isi surat divalidasi Zod dan dilarang memuat null byte atau karakter kontrol (`[\u0000-\u001f]` sebagian) — biang kerok log yang merusak tampilan. Surat yang lolos lalu dititipkan ke `prisma.appError.create()`. Semua dibungkus `try/catch` besar dengan pesan tenang: "Jangan sampai error logging malah bikin error" — bila logging gagal, tetap balas `{ ok: false }` alih-alih ikut crash.

**Potongan Kode Asli**:

```ts
const data = parsed.data;
// Tolak null bytes / karakter kontrol pada isi log
if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(data.message + data.stack + data.url)) {
  return NextResponse.json({ ok: false }, { status: 400 });
}

await prisma.appError.create({
  data,
});

return NextResponse.json({ ok: true });
```

**Konstruk**: `z.object` + `safeParse`; `apiLimiter.check` per IP; regex penolak karakter kontrol; `appError.create`; catch yang tidak pernah melempar.

**🛡️ Kerentanan**: Terbuka untuk guest, jadi penyimpanan DB bisa dipakai sebagai kendaraan spam/abuse — dimitigasi rate limit IP. `userId` dan `metadata` dari client tidak divalidasi milik siapa (bisa diisi ID user lain), tapi ini hanya log, bukan data aksi. Bila `appError.create` terus gagal (misal DB down), tiap error frontend berarti satu request sia-sia.

### `POST /api/newsletter` → `app/api/newsletter/route.ts`

**Peran**: Mendaftarkan email ke newsletter — disimpan sebagai `PointsLog` berisi nol poin dengan alasan "newsletter".

**Alur Cerita**: Pengunjung yang ingin kabar SpringHub menyerahkan emailnya, dan token CSRF harus dibawa sebagai tiket masuk. Sebelum menulis, IP dicek ke `newsletterLimiter` — terlalu sering, ditolak 429. Email dipastikan ada, bertipe string, dan memuat `@` — validasi ringkas yang menolak sampah. Lalu ada langkah unik: pendaftaran dicek dulu ke `pointsLog.findFirst` dengan `reason: "newsletter"` dan `metadata contains email` — bila sudah pernah daftar, jawab `{ success: true, message: "Sudah terdaftar" }` alih-alih membuat baris duplikat (idempoten). Pendaftaran baru disimpan sebagai `pointsLog.create` dengan `amount: 0`, `reason: "newsletter"`, dan `metadata` JSON berisi email + waktu langganan — sedikit aneh, karena ini meminjam tabel poin untuk menyimpan daftar email, tapi begitulah ia dibuat agar admin melihat semua email langganan di satu tempat.

**Potongan Kode Asli**:

```ts
const existing = await prisma.pointsLog.findFirst({
  where: { reason: "newsletter", metadata: { contains: email.toLowerCase() } },
});

if (existing) {
  return NextResponse.json({ success: true, message: "Sudah terdaftar" });
}

await prisma.pointsLog.create({
  data: {
    amount: 0,
    reason: "newsletter",
    metadata: JSON.stringify({ email: email.toLowerCase(), subscribedAt: new Date().toISOString() }),
  },
});
```

**Konstruk**: CSRF wajib; `newsletterLimiter` per IP; validasi email inline (bukan Zod); cek idempoten via `pointsLog.findFirst`; `isDatabaseError` → 503.

**🛡️ Kerentanan**: Email disimpan di `PointsLog` yang merupakan tabel poin — akses ke tabel itu kini berisi data PII yang bukan poin; pemisahan model `Newsletter` yang bersih akan lebih aman dan mudah diekspor. Validasi `includes("@")` longgar — `a@` lolos; Zod `z.string().email()` lebih ketat. `metadata` memakai `contains` tanpa escaping, tapi pola statis "newsletter" aman dari injeksi.

### `POST /api/feedback` → `app/api/feedback/route.ts`

**Peran**: Menerima feedback publik (bug/kritik/saran) dengan CSRF, rate limit, batas harian, dan dukungan screenshot.

**Alur Cerita**: Ini cerita paling panjang di domain ini, dan hampir semuanya adalah jaga-jaga. Tiket masuk pertama: CSRF — tanpa `x-csrf-token` yang valid, 403. Kedua: rate limit dengan kunci `session.userId` atau `guestId` — tamu pun dihitung. Ketiga: `content-length` dicek sebelum JSON dibaca — lebih dari 5MB ditolak 413, mencegah koneksi nakal mengirim raksasa. Keempat: JSON harus valid — kalau bukan JSON, 400. Kelima: `type` harus salah satu `bug/kritik/saran/both`; untuk bug harus ada `bugDescription` ≥ 10 karakter, untuk kritik `kritik` ≥ 10, untuk saran `saran` ≥ 10. Keenam: user yang login dibatasi 3 feedback per hari (dihitung lewat `prisma.feedback.count` dengan rentang `createdAt` hari ini). Terakhir, screenshot: array `bugScreenshots` diambil maksimal 3, atau `bugScreenshot` tunggal gaya lama. Semua hasil dibersihkan `trim()` dan disimpan ke `feedback.create` dengan `userId` (bisa null untuk tamu) dan `status: "open"` — siap ditindak admin.

**Potongan Kode Asli**:

```ts
const todayCount = await prisma.feedback.count({
  where: {
    userId: session.userId,
    createdAt: { gte: today, lt: tomorrow },
  },
});

if (todayCount >= DAILY_FEEDBACK_LIMIT) {
  return NextResponse.json(
    { error: "Batas feedback harian (3) tercapai. Coba lagi besok." },
    { status: 429 }
  );
}
```

**Konstruk**: CSRF; `feedbackLimiter` per user/guest; cek `content-length`; validasi per-tipe inline; batas harian via `count` rentang tanggal; dukung screenshot lama & baru; `isDatabaseError` → 503.

**🛡️ Kerentanan**: Screenshot disimpan sebagai string dalam tabel (kemungkinan data URL base64) tanpa validasi MIME/ukuran per field — hanya total 5MB yang dicek, jadi satu request bisa membawa 3 data URL besar; batas per-screenshot akan lebih baik. Guest yang log in bisa menghindari batas hariannya dengan guestId berbeda (rate limit per guestId mudah diputar), tapi batas 3/hari untuk login tetap ditegakkan di DB.

### `GET /api/point-rules` → `app/api/point-rules/route.ts`

**Peran**: Menyajikan aturan poin aktif ke publik, dibungkus cache Redis 1 jam.

**Alur Cerita**: Halaman "cara dapat poin" butuh data — route ini menyajikannya tanpa memerlukan login. Cerita pendek: panggil `getOrSet("point-rules", "active", ...)` — kalau Redis masih menyimpan hasil sebelumnya (TTL 3600 detik), langsung berikan; kalau tidak, query Prisma mengambil semua `PointRule` dengan `isActive: true`, diurutkan `sortOrder` naik, dan hanya bidang yang aman untuk publik (`id`, `name`, `description`, `points`, `category`, `icon`, `sortOrder`). Tidak ada field sensitif yang lolos — tidak ada `isActive`, tidak ada `createdAt` internal, tidak ada apa pun yang tidak perlu. Balasan `{ rules }` pun ringkas.

**Potongan Kode Asli**:

```ts
const rules = await getOrSet("point-rules", "active", () =>
  prisma.pointRule.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, description: true, points: true, category: true, icon: true, sortOrder: true },
  }),
  3600
);
```

**Konstruk**: `getOrSet` cache Redis; `findMany` + `where isActive`; `orderBy sortOrder`; `select` field aman; TTL 3600.

**🛡️ Kerentanan**: Endpoint publik tanpa rate limit, tapi hasilnya di-cache 1 jam — biaya DB nyaris nol, jadi aman. `description` dari admin tidak disanitasi HTML di sisi server; bila nanti dirender sebagai HTML mentah di client, XSS bisa muncul — pastikan client merendernya sebagai teks (lihat pola `{...}` default React yang aman).

### `GET /api/upload/presign` → `app/api/upload/presign/route.ts`

**Peran**: Membuat URL presigned untuk upload foto langsung ke S3 (R2 Cloudflare) — server tak pernah menyentuh byte foto.

**Alur Cerita**: Route ini adalah penjaga gawang upload. Ceritanya: user login wajib membawa sesi (401 tanpa itu), lalu dicek `uploadLimiter` per user — rakus presign, ditolak 429. Setelah itu, dua parameter diperiksa mati-matian. `folder` harus cocok dengan `FOLDER_RE` (`^[a-z0-9-_]+(\/[a-z0-9-_]+)*$`) setelah slash tepi dibuang — melarang `..`, spasi, dan karakter aneh; `contentType` harus salah satu dari jpeg/png/webp. Nama file dibentuk dari `Date.now()` + string acak 6 karakter + ekstensi sesuai MIME — unik dan tidak bisa ditebak. Dengan `PutObjectCommand` yang ditandatangani (`getSignedUrl`, kedaluwarsa 1 jam), URL dikembalikan bersama `publicUrl` (dari `S3_PUBLIC_URL` bila ada), `path`, dan `maxSizeMb: 10` — konsisten dengan `lib/upload-photo.ts` yang jadi penjaga ukuran di lapangan berikutnya.

**Potongan Kode Asli**:

```ts
const rawFolder = url.searchParams.get("folder") || "reports";
const folder = rawFolder.replace(/^\/+|\/+$/g, "");
if (!FOLDER_RE.test(folder)) {
  return NextResponse.json({ error: "Folder tidak valid" }, { status: 400 });
}

const contentType = url.searchParams.get("contentType") || "image/jpeg";
if (!ALLOWED_MIME_TYPES.includes(contentType)) {
  return NextResponse.json({ error: "Format gambar tidak didukung" }, { status: 400 });
}
```

**Konstruk**: S3Client `forcePathStyle`; `PutObjectCommand` + presigner; whitelist MIME; regex folder ketat; rate limit per user; `CacheControl` 1 tahun.

**🛡️ Kerentanan**: Presigned PUT langsung ke S3 berarti server tidak sempat memvalidasi isi file (magic bytes, EXIF) — validasi itu bergantung pada lapisan berikutnya (`lib/upload-photo.ts`). Kunci S3 kosong ("") bila env belum di-set → `getSignedUrl` akan gagal/ambigu; sebaiknya endpoint menolak di awal bila konfigurasi S3 belum ada. Nama file memakai `Math.random()` — bukan kriptografis, tapi cukup sulit ditebak; `crypto.randomUUID()` lebih kuat.

### `GET /api/ytthumb` → `app/api/ytthumb/route.ts`

**Peran**: Proksi thumbnail YouTube — memuat gambar dari `i.ytimg.com` dengan fallback kualitas dan timeout 5 detik.

**Alur Cerita**: Halaman kursus menampilkan thumbnail video YouTube, tapi `img.youtube.com` acap diblokir atau lambat. Route ini menjadi kurir: `videoId` diambil dari query dan harus cocok dengan `/^[a-zA-Z0-9_-]{11}$/` — 11 karakter persis, format ID YouTube; kalau tidak, 400. Kualitas diminta lewat `quality`, fallback `hqdefault`. Kurir mencoba urutan kualitas (yang diminta dulu, lalu sisanya: maxresdefault → hqdefault → mqdefault → sddefault) — karena tidak semua video punya `maxresdefault`. Untuk tiap percobaan, `fetch` ke `https://i.ytimg.com/vi/<id>/<size>.jpg` diberi `AbortController` dengan batas 5 detik — video mati tak boleh menggantung server. Respons pertama yang `ok` diambil sebagai `arrayBuffer` dan dikirim apa adanya dengan `Cache-Control` publik 1 hari (CDN ikut menyimpan) dan `Access-Control-Allow-Origin: *` agar bisa dipakai lintas domain. Semua percobaan gagal → 404 kosong.

**Potongan Kode Asli**:

```ts
for (const size of tryOrder) {
  try {
    const imgUrl = `https://i.ytimg.com/vi/${videoId}/${size}.jpg`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(imgUrl, { signal: controller.signal });
    clearTimeout(t);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, { status: 200, headers: { "Content-Type": ... , "Cache-Control": "public, max-age=86400, s-maxage=86400", "Access-Control-Allow-Origin": "*" } });
    }
  } catch {
    continue;
  }
}
```

**Konstruk**: Regex `^[a-zA-Z0-9_-]{11}$`; daftar kualitas + fallback berurutan; `AbortController` timeout 5 dtk; `arrayBuffer` diteruskan; `Cache-Control` publik.

**🛡️ Kerentanan**: Open proxy — siapa pun bisa memakai endpoint ini untuk menarik file dari `i.ytimg.com` (SSRF terbatas ke satu host tetap, jadi aman dari SSRF sewenang-wenang). Tidak ada rate limit, dan tiap request bisa menunggu hingga 5 dtk per kualitas → potensi exhaust koneksi server; cache CDN meredamnya sebagian. Respons gambar tidak memvalidasi konten (tetap `image/jpeg` dari upstream) — kecil risikonya karena upstream terpercaya.

---

## Susulan — Konten Publik

Satu route "yatim" yang sempat terlewat dari domain admin: pasangan publik dari `app/api/admin/content` — ia melayani landing page dan halaman statis yang butuh blok konten dinamis.

### `GET /api/content` → `app/api/content/route.ts`

**Peran**: Menyajikan blok konten (`ContentBlock`) per `section` ke publik, dengan cache Redis 10 menit.

**Alur Cerita**: Ini kembaran publik dari `GET /api/admin/content` — bedanya, ia tidak butuh sesi maupun CSRF karena hanya membaca. Parameternya wajib: `section` harus ada, kalau tidak 400. Nilainya lalu dipakai sebagai kunci cache `getOrSet("content", section, ...)` — Redis menyimpan hasil 600 detik agar query Prisma tidak berulang untuk tiap kunjungan. Query mengambil `ContentBlock` yang `section`-nya cocok dan `isActive: true`, diurutkan `sortOrder` naik lalu `createdAt` turun. Uniknya: bila semua gagal (DB down, cache mati), catch tidak mengembalikan error melainkan `{ items: [] }` dengan status 200 — halaman tetap tampil, hanya kosong; mematikan "satu blok konten tidak boleh menjatuhkan satu halaman".

**Potongan Kode Asli**:

```ts
const items = await getOrSet("content", section, () =>
  prisma.contentBlock.findMany({
    where: { section, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  }),
  600
);

return NextResponse.json({ items });
```

**Konstruk**: `getOrSet` cache; `findMany` + `where section/isActive`; `orderBy` ganda; catch yang selalu sukses (`items: []`).

**🛡️ Kerentanan**: Catch yang menelan semua error berstatus 200 bisa menyembunyikan masalah server dari pemantauan — respons 200 palsu membuat uptime monitor tersenyum padahal DB sedang sekarat; log tetap ditulis (`console.error`), jadi masih terlacak. Publik tanpa rate limit tapi di-cache 10 menit, jadi aman.

---

## Penutup — 94 Route, Satu Cerita

Demikian perjalanan menembus seluruh 94 route handler SpringHub: dari `GET /api/csrf` yang membuka pintu dengan token, hingga `GET /api/ytthumb` yang menutup daftar sebagai kurir gambar. Satu pola terlihat di mana-mana — setiap cerita berjalan dalam alur yang sama: token CSRF diperiksa lebih dulu untuk setiap aksi yang mengubah keadaan, sesi dan peran diperiksa untuk hak akses, data divalidasi Zod, logika bisnis dieksekusi di server (poin, snapshot 5 km, deteksi duplikat), dan semua kesalahan berakhir di `getErrorMessage()` dengan bahasa Indonesia yang ramah. Itulah SpringHub: bukan sekumpulan endpoint, melainkan satu sistem yang menjaga mata air Indonesia — dan setiap route di dalamnya punya peran, punya jaga-jaga, dan punya cerita.
