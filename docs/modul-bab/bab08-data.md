# BAB 8 — Lapisan Data: Prisma Schema, Migrasi, Seed, dan Email Worker

> Modul Belajar — Kode SpringHub
>
> Bab ini membedah **lapisan data** SpringHub: 30 model di `prisma/schema.prisma`, 7 enum, 10 file migrasi, 4 file seed, 2 skrip perbaikan SQL, dan 1 worker email. Ini adalah bab yang paling "dekat dengan server" — semua yang dibahas di sini menentukan apa yang bisa disimpan, siapa yang boleh melihat, dan bagaimana data contoh dibuat.
>
> **Cara membaca**: buka file yang dibahas berdampingan dengan bab ini. Penomoran baris pada potongan kode mengikuti isi file saat bab ini ditulis; jika kode berubah, gunakan penomoran sebagai perkiraan.

---

## Pendahuluan: Peta Database SpringHub

### 30 Model

Daftar lengkap model di `prisma/schema.prisma` (urut sesuai file, `grep '^model'`):

| No | Model | Baris | Peran |
|---|---|---|---|
| 1 | `Profile` | 41 | Pengguna (volunteer, field_lead, admin) + poin & trust score |
| 2 | `Session` | 75 | Token sesi login |
| 3 | `PasswordResetToken` | 89 | Token reset password sekali pakai (hash) |
| 4 | `Spring` | 108 | Mata air (status, skor kesehatan, koordinat tersnap) |
| 5 | `MapPointType` | 134 | Jenis titik peta ("spring", "conservation", dll.) |
| 6 | `MapPointCategory` | 150 | Kategori titik ("sehat", "terdegradasi", "restorasi") + warna marker |
| 7 | `MapPoint` | 165 | Titik peta umum (menggantikan kebutuhan koordinat presisi publik) |
| 8 | `Report` | 191 | Laporan survei — jantung aplikasi |
| 9 | `ReportPhoto` | 233 | Foto laporan (metadata file, bukan URL langsung) |
| 10 | `Project` | 248 | Proyek restorasi (form dinamis 20 field) |
| 11 | `ProjectPhoto` | 278 | Foto proyek |
| 12 | `Donation` | 288 | Donasi (invoiceId unik untuk idempotensi webhook) |
| 13 | `PointsLog` | 313 | Riwayat poin per pengguna |
| 14 | `CoursesProgress` | 330 | Progres kursus per pengguna |
| 15 | `PointRule` | 347 | Aturan poin dari DB (14 baris di seed) |
| 16 | `Course` | 360 | Kursus edukasi |
| 17 | `CourseModule` | 377 | Modul kursus (konten Markdown/HTML) |
| 18 | `Form` | 389 | Formulir survei (dinamis, dari DB!) |
| 19 | `FormField` | 409 | Field formulir (label, tipe, opsi, dua bahasa) |
| 20 | `OfflineSession` | 429 | Sesi survei offline (jarak total, form terpilih) |
| 21 | `TrackingPoint` | 445 | Titik jejak GPS selama sesi offline |
| 22 | `Feedback` | 461 | Kritik/saran/bug dari pengguna |
| 23 | `Notification` | 474 | Notifikasi (draft, poin, persetujuan, event) |
| 24 | `Comment` | 490 | Komentar proyek |
| 25 | `Like` | 503 | Suka proyek (unik per user+project) |
| 26 | `Seedling` | 532 | Bibit di marketplace (status: pending/active/rejected/exhausted) |
| 27 | `SeedlingPhoto` | 561 | Foto bibit |
| 28 | `SeedlingRequest` | 572 | Permintaan bibit 2 arah (requester ↔ owner) |
| 29 | `ContentBlock` | 593 | Blok konten beranda (media, statistik, testimoni) |
| 30 | `AppError` | 610 | Log error aplikasi (frontend/API/worker/database) |

**7 enum**: `Role`, `ReportStatus`, `ProjectStatus`, `DonationStatus`, `SpringStatus`, `SeedlingStatus`, `RequestStatus`.

**Kisah arsitektur di balik tabel ini**: perhatikan bahwa `Form` dan `FormField` ada sebagai *model*, bukan hardcode — artinya **formulir bisa dibuat/diubah dari panel admin tanpa deploy ulang**. Namun aplikasi juga punya `lib/forms.ts` berisi 5 form statis sebagai *single source of truth* dengan override DB. Dua sumber ini hidup berdampingan (dan kadang bertengkar — lihat bagian Form di bawah).

### 10 Migrasi

| Migrasi | Isi |
|---|---|
| `20260519_init_supabase` | 8 tabel awal: Profile, Report, ReportPhoto, Project, ProjectPhoto, Donation, PointsLog, dll. |
| `20260531_add_featured_photo` | Kolom `featuredPhoto`/`featuredPhotoUrl` di Project |
| `20260601_add_report_isActive` | Kolom `isActive` di Report (soft-delete & filter publik) |
| `20260603_add_comments` | Tabel Comment |
| `20260603_add_likes_comments` | Tabel Like |
| `20260603_add_notifications` | Tabel Notification |
| `20260609_add_spring_model` | Tabel Spring |
| `20260615_add_rls_policies` | Policy RLS pertama (memakai `auth.uid()`) |
| `20260812_add_indexes_and_models` | 4 model baru + 20+ indeks + kolom idempotensi |
| `20260812_add_rls_policies` | RLS ulang dengan GUC `springhub.user_id` |

### 4 File Seed + 2 Skrip Perbaikan + 1 Worker

| File | Baris | Peran |
|---|---|---|
| `prisma/seed.ts` | 666 | Seed utama: 3 akun, 5 form + field, report + foto, kursus, aturan poin, konten |
| `prisma/seed-dummy.ts` | 317 | Seed data demo besar: 40+ mata air, 12 relawan, 25 laporan dummy |
| `prisma/seed-content.ts` | 25 | Seed blok konten media beranda |
| `prisma/seed-test-accounts.ts` | 59 | Akun test terbaru (bcrypt 12, upsert) |
| `prisma/fix-pool.sql` | — | Perbaikan `max_connections` PostgreSQL untuk pooling |
| `prisma/fix-ucup.sql` | — | Perbaikan poin akun ucup |
| `workers/email-worker.ts` | 32 | Worker BullMQ pengirim email |

---

## Prisma Schema: Generator, Datasource, dan 7 Enum

### Generator & Datasource (baris ±1-9)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}
```

Dua hal yang tidak terlihat tapi penting:

1. **URL database tidak ada di sini** — diambil dari env `DATABASE_URL` (file `.env`), dengan parameter pooling `?connection_limit=10&pool_timeout=10` (hasil sesi audit koneksi — lihat `fix-pool.sql` di akhir bab).
2. **Provider `prisma-client-js`** — client Prisma klasik. Beberapa file seed memakai pola `PrismaPg` adapter (lihat `seed-content.ts`) — variasi yang bisa membingungkan, tapi keduanya valid.

### Enum Role (baris ±11-17)

```prisma
enum Role {
  user
  volunteer
  field_lead
  admin
}
```

**Konstruk**: empat peran dengan hierarki halus — `user` (pendaftar biasa) < `volunteer` (bisa isi form & proyek) < `field_lead` (pemimpin lapangan) < `admin`. Perhatikan `Profile.role` ber-default `volunteer`, bukan `user` — keputusan produk: siapa pun yang mendaftar langsung dianggap relawan.

**🛡️ Kerentanan**: peran disimpan sebagai string enum di DB; endpoint admin wajib cek `isAdmin()` dari `lib/auth` — jangan pernah menurunkan keputusan keamanan dari `role` yang dikirim client.

### Enum ReportStatus & ProjectStatus (baris ±19-35)

```prisma
enum ReportStatus {
  pending
  approved
  rejected
}

enum ProjectStatus {
  pending
  under_review
  approved
  rejected
  completed
}
```

**Konstruk**: laporan hanya punya 3 status (sederhana: menunggu/disetujui/ditolak), proyek punya 5 (ada tahap `under_review` — proyek butuh verifikasi lebih ketat karena melibatkan uang donasi).

**🛡️ Kerentanan**: `pending` adalah default; tanpa job/queue yang meninjau, laporan bisa menggantung di pending selamanya. Perhatikan juga bahwa enum tidak memiliki status "ditarik/dihapus" — penghapusan memakai soft-delete `isActive`.

### Enum DonationStatus, SpringStatus, SeedlingStatus, RequestStatus (baris ±32-40, ±120-126, ±527-553)

```prisma
enum DonationStatus {
  pending
  paid
  expired
  failed
}

enum SpringStatus {
  pending  // baru dari report, belum disetujui admin
  active   // sudah disetujui, muncul di publik
  merged   // digabung ke spring lain
}

enum SeedlingStatus {
  pending     // menunggu review admin
  active      // sudah disetujui, muncul di marketplace
  rejected    // ditolak admin
  exhausted   // stok habis
}

enum RequestStatus {
  pending     // baru diminta, belum diambil
  completed   // penerima klik Selesai, stok berkurang
  rejected    // ditolak
  cancelled   // dibatalkan peminta
}
```

**Konstruk**:

- `DonationStatus.expired` — donasi punya masa berlaku (Xendit invoice); tanpa status ini, donasi hangus tak terlihat.
- `SpringStatus.merged` — dua laporan mata air yang sama bisa digabung; ini menghindari duplikat tanpa menghapus data (laporan tetap menunjuk ke spring hasil merge).
- Komentar di enum memakai bahasa Indonesia — dokumentasi inline yang menolong siapa pun yang membuka schema.
MDEOF

---

## Model Inti: Profile

### model Profile — pengguna, poin, dan trust score (baris ±41-74)

**Alur Cerita**

`Profile` adalah pusat dari hampir semua relasi di database: 13 relasi keluar (report, donasi, proyek, poin, sesi, kursus, notifikasi, komentar, like, bibit, permintaan bibit, token reset, review). Setiap akun di SpringHub — termasuk admin — adalah satu baris Profile.

**Potongan Kode Asli — field & relasi** (baris ±41-74):

```prisma
model Profile {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  username      String   @unique @default("")
  role          Role     @default(volunteer)
  phone         String   @default("")
  phoneVerified Boolean  @default(false)
  region        String   @default("")
  points        Int      @default(0)
  trustScore    Int      @default(50)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  reports         Report[]
  donations       Donation[]
  projects        Project[]
  pointsLogs      PointsLog[]
  sessions        Session[]
  courses         CoursesProgress[]
  reviewedReports Report[]          @relation("reviewedReports")
  offlineSessions OfflineSession[]
  notifications  Notification[]
  userComments   Comment[]
  likes          Like[]
  seedlings      Seedling[]
  seedlingRequests  SeedlingRequest[] @relation("SeedlingRequests")
  seedlingOwnedRequests SeedlingRequest[] @relation("SeedlingOwnedRequests")
  passwordResetTokens PasswordResetToken[]

  @@index([role])
  @@index([points(sort: Desc)])
}
```

**Konstruk**

- **`points` dan `trustScore` di-denormalisasi** — angka total poin disimpan langsung di Profile, bukan dihitung dari PointsLog setiap kali. Kecepatan baca vs. risiko inkonsistensi: jika poin dihitung di `lib/points.ts` server-only, perbarui kedua tempat dalam transaksi yang sama.
- **`trustScore` default 50** — skor kepercayaan (0-100) yang menentukan bobot laporan; anti-spam berlapis memakai ini (lihat bab anti-spam di modul lain).
- **Dua relasi ke SeedlingRequest** — `seedlingRequests` (saya yang minta) dan `seedlingOwnedRequests` (saya yang punya bibit); nama relasi eksplisit `"SeedlingRequests"`/`"SeedlingOwnedRequests"` wajib karena dua relasi ke model yang sama.
- **`@@index([points(sort: Desc)])`** — indeks untuk leaderboard "top relawan".

**🛡️ Kerentanan**

1. **`email` unik = oracle akun** — endpoint publik yang membedakan "email sudah terdaftar" vs "belum" bisa dipakai enumerasi akun; pertimbangkan respons seragam.
2. **Poin & trust score di client** — komponen React menampilkan `user.points`; jangan pernah menerima nilai poin dari client untuk kalkulasi (aturan keamanan #4 proyek).
3. **`phone` tanpa format baku** — string bebas; validasi di lapisan aplikasi (lib/forms), bukan schema.

### model Spring — mata air dengan koordinat tersnap (baris ±108-133)

**Alur Cerita**

`Spring` adalah mata air hasil persetujuan laporan. Detail penting: koordinatnya **tidak pernah presisi** — `snappedLat`/`snappedLng` adalah hasil `snapToProtectionGrid()` (kotak 5 km) untuk melindungi lokasi asli dari eksploitasi (aturan keamanan #5 proyek). Koordinat presisi laporan disimpan terpisah di `Report.preciseLat/preciseLng` (hanya admin).

**Potongan Kode Asli — model lengkap** (baris ±108-133):

```prisma
model Spring {
  id              String        @id @default(uuid())
  name            String
  snappedLat      Float?
  snappedLng      Float?
  province        String        @default("")
  regency         String        @default("")
  village         String        @default("")
  subdistrict     String        @default("")
  status          SpringStatus  @default(pending)
  healthScore     Int?          // 0-100, dari survei terakhir
  healthStatus    String        @default("") // sehat, ringan, berat, kritis
  lastSurveyedAt  DateTime?     // kapan terakhir disurvei
  isDummy         Boolean       @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  reports Report[]

  @@index([snappedLat, snappedLng])
  @@index([name])
  @@index([status])
}
```

**Konstruk**

- **`healthScore` (0-100) + `healthStatus` (teks)** — duet numerik & label; healthStatus dihitung dari survei terakhir, bukan disimpan manual.
- **`isDummy`** — penanda data demo dari seed; UI memakai ini untuk badge "[Demo]" dan statistik memfilter-nya.
- **`@@index([snappedLat, snappedLng])`** — indeks geospasial sederhana untuk query bounding box peta.

**🛡️ Kerentanan**

1. **Koordinat null** — spring baru dari laporan yang gagal GPS punya `snappedLat = null`; peta harus menyaring, jangan sampai titik null dirender (Leaflet akan error).
2. **Duplikat nama** — tidak ada unique constraint di `name` (dua laporan bisa bikin dua spring bernama sama); admin harus rajin merge (status `merged`).

---

## Model Inti: Sistem Peta Umum (MapPointType / MapPointCategory / MapPoint)

### MapPointType, MapPointCategory, MapPoint — peta yang digeneralisasi (baris ±134-190)

**Alur Cerita**

Awalnya peta hanya menampilkan mata air (`Spring`). Setelah proyek tumbuh (ada penanaman pohon, rorak, konservasi), skema di-generalisasi: **`MapPointType`** (jenis titik), **`MapPointCategory`** (kategori visual per jenis), dan **`MapPoint`** (titik itu sendiri). Sistem ini menggantikan kebutuhan "koordinat presisi publik" — semua titik publik memakai koordinat tersnap.

**Potongan Kode Asli — tiga model** (baris ±134-190):

```prisma
model MapPointType {
  id          String              @id @default(uuid())
  slug        String              @unique // "spring", "conservation", "tree-planting", "trench"
  name        String              // "Mata Air", "Konservasi", "Tanam Pohon", "Parit Resapan"
  description String              @default("")
  icon        String              @default("MapPin")
  sortOrder   Int                 @default(0)
  isActive    Boolean             @default(true)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  categories  MapPointCategory[]
  forms       Form[]
  points      MapPoint[]
}

model MapPointCategory {
  id        String   @id @default(uuid())
  typeId    String
  slug      String   // "sehat", "terdegradasi", "restorasi", "pohon-hampir-punah"
  name      String   // "Sehat", "Terdegradasi", "Dalam Restorasi", "Pohon Hampir Punah"
  color     String   @default("#2563eb") // hex color for marker
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  type     MapPointType @relation(fields: [typeId], references: [id], onDelete: Cascade)
  mapPoints MapPoint[]

  @@unique([typeId, slug])
}

model MapPoint {
  id            String      @id @default(uuid())
  typeId        String
  categoryId    String?
  name          String
  slug          String      @unique
  snappedLat    Float?
  snappedLng    Float?
  province      String      @default("")
  regency       String      @default("")
  village       String      @default("")
  subdistrict   String      @default("")
  description   String      @default("")
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  type          MapPointType     @relation(fields: [typeId], references: [id])
  category      MapPointCategory? @relation(fields: [categoryId], references: [id])
  reports       Report[]

  @@index([typeId, isActive])
  @@index([snappedLat, snappedLng])
  @@index([slug])
}
```

**Konstruk**

- **`color` sebagai data** — warna marker tersimpan di DB (`#2563eb`), bukan hardcode di komponen; admin bisa mengubah tanpa deploy.
- **`@@unique([typeId, slug])`** — kategori unik per jenis; "sehat" untuk mata air dan "sehat" untuk pohon tidak bentrok.
- **`Form.mapTypeId`** — form dikaitkan ke jenis titik peta (`Form → MapPointType`); laporan dari form itu otomatis menjadi kandidat titik peta.

**🛡️ Kerentanan**

1. **`color` dari DB masuk ke style marker** — pastikan divalidasi format hex di server, jangan sampai string arbitrer masuk `pathOptions.color`.
2. **`icon` string = nama komponen** — pemetaan nama ikon → komponen harus whitelist (jangan `eval`).
3. **Koordinat tersnap bisa disalahgunakan** — grid 5 km bukan enkripsi; kombinasi beberapa titik bisa mempersempit lokasi asli. Jangan pernah menampilkan snappedLat/snappedLng sebagai "lokasi persis" di UI.

---

## Model Inti: Report

### model Report — jantung aplikasi (baris ±191-232)

**Alur Cerita**

`Report` adalah satu laporan survei — dari pemantauan mata air sampai penanaman pohon. Ia menyimpan data lapangan sebagai **string JSON** (`fieldData`), koordinat presisi & tersnap secara terpisah, dan **`clientCorrelationId` unik** sebagai kunci idempotensi offline (aturan anti-duplikat dari sesi 10).

**Potongan Kode Asli — model lengkap** (baris ±191-232):

```prisma
model Report {
  id              String       @id @default(uuid())
  userId          String?
  guestId         String?
  formSlug        String
  status          ReportStatus @default(pending)
  isActive        Boolean      @default(true)
  isDummy         Boolean      @default(false)
  fieldData       String // JSON string of form fields
  preciseLat      Float?
  preciseLng      Float?
  snappedLat      Float?
  snappedLng      Float?
  reviewedById    String?
  reviewNote      String       @default("")
  featuredPhotoId String?
  springId        String?
  mapPointId      String?
  clientCorrelationId String?  @unique // offline-sync idempotency key (pwa agent)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  user       Profile?      @relation(fields: [userId], references: [id])
  reviewedBy Profile?      @relation("reviewedReports", fields: [reviewedById], references: [id])
  photos     ReportPhoto[] @relation("ReportPhotos")
  spring     Spring?       @relation(fields: [springId], references: [id])
  mapPoint   MapPoint?     @relation(fields: [mapPointId], references: [id])

  pointsLogs PointsLog[]
  seedlings  Seedling[] @relation("SeedlingReport")

  form       Form?       @relation(fields: [formSlug], references: [slug])

  @@index([status])
  @@index([status, createdAt])
  @@index([userId, createdAt(sort: Desc)])
}
```

**Konstruk**

- **`userId` dan `guestId` nullable** — laporan boleh datang dari tamu (dengan rate limit 5/hari); dua kolom terpisah agar bisa dibedakan.
- **`fieldData String` (JSON)** — bukan kolom per-field: fleksibilitas maksimal untuk form dinamis. Konsekuensinya, query SQL atas isi form tidak bisa diindeks — terima untuk volume POC, waspadai saat skala naik.
- **`preciseLat/Lng` vs `snappedLat/Lng`** — pasangan ini adalah implementasi aturan privasi #5: presisi hanya untuk admin, publik melihat versi tersnap.
- **`clientCorrelationId @unique`** — kunci idempotensi: retry offline dengan id yang sama ditolak (409), mencegah poin ganda (lihat cerita webhook duplikat di sesi 15: `already_processed`, poin +50 tepat sekali, CAS atomic).
- **Relasi `form` via `formSlug`** — relasi berbasis slug, bukan UUID; membuat laporan tetap bermakna walau form dihapus (soft-delete).

**🛡️ Kerentanan**

1. **`fieldData` adalah JSON string bebas** — titik masuk XSS/JSON-injection terbesar: validasi ketat dengan Zod (`lib/dynamic-validation.ts`) di server, sanitasi DOMPurify untuk konten kaya.
2. **Koordinat presisi bocor lewat API** — endpoint publik wajib menyaring `preciseLat/Lng`; jangan pernah `select *` lalu kirim mentah ke client.
3. **`isDummy` bisa disalahgunakan** — jika endpoint publik menulis `isDummy: true` (untuk "mode demo"), pastikan hanya admin yang bisa; data dummy tidak boleh ikut statistik publik.

### model ReportPhoto — foto dengan metadata, bukan URL (baris ±233-247)

**Alur Cerita**

Foto laporan disimpan dengan **metadata teknis** (path storage, MIME, dimensi) — bukan URL publik. Ini memungkinkan validasi ulang MIME di server (aturan foto: magic bytes, EXIF stripped, kompresi 720p) dan rotasi file.

**Potongan Kode Asli** (baris ±233-247):

```prisma
model ReportPhoto {
  id          String   @id @default(uuid())
  reportId    String
  fieldId     String
  storagePath String   @default("")
  mimeType    String   @default("image/jpeg")
  width       Int      @default(0)
  height      Int      @default(0)
  createdAt   DateTime @default(now())

  report Report @relation("ReportPhotos", fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId])
}
```

**Konstruk**

- **`fieldId`** — menghubungkan foto ke field form tertentu (B2_foto_1, B3_foto_2, dst.) — aturan min 3/max 5 per field bisa ditegakkan di level data.
- **`onDelete: Cascade`** — foto terhapus otomatis saat report dihapus (soft-delete menghindari cascade ini).

**🛡️ Kerentanan**

- **`storagePath` tidak unik** — dua foto bisa menunjuk file sama; dedupe di lapisan aplikasi (bandingkan hash).
- **File orphan** — jika upload sukses tapi report gagal dibuat, file di storage jadi yatim; perlukan job pembersihan berkala.

---

## Model Inti: Formulir Dinamis

### model Form & FormField — formulir dari database (baris ±389-428)

**Alur Cerita**

Ini salah satu keputusan arsitektur paling penting: **formulir survei bisa dibuat dan diubah dari panel admin** — tanpa mengubah kode. `Form` menyimpan judul, slug, poin, dan tipe kontribusi; `FormField` menyimpan setiap field dengan label dua bahasa (Indonesia/Inggris), tipe (text/select/photo/location/date/number), dan opsi.

**Potongan Kode Asli — dua model** (baris ±389-428):

```prisma
model Form {
  id               String   @id @default(uuid())
  slug             String   @unique
  title            String
  description      String   @default("")
  pointsOnSubmit   Int      @default(25)
  contributionType String   @default("monitoring")
  isActive         Boolean  @default(true)
  sortOrder        Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  fields  FormField[]
  reports Report[]
  mapTypeId String?
  mapType   MapPointType? @relation(fields: [mapTypeId], references: [id])

  @@index([mapTypeId])
}

model FormField {
  id          String   @id @default(uuid())
  formId      String
  fieldId     String
  label       String
  labelEn     String   @default("")
  type        String   @default("text")
  required    Boolean  @default(false)
  placeholder String   @default("")
  helpText    String   @default("")
  options     String   @default("[]")
  optionsEn   String   @default("[]")
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  form Form @relation(fields: [formId], references: [id], onDelete: Cascade)

  @@unique([formId, fieldId])
}
```

**Konstruk**

- **`fieldId` unik per form (`@@unique([formId, fieldId])`)** — kunci ini dipakai sebagai `name` HTML; kode frontend bergantung padanya (lihat cerita perbaikan di `simple-offline-form.tsx` yang membersihkan data lama ber-`fieldId` numeric).
- **`options` sebagai string JSON** — opsi select disimpan serial; `lib/dynamic-validation.ts` me-parse ulang untuk validasi Zod.
- **`pointsOnSubmit` di Form** — poin dasar per form; nilai override dari `PointRule`/`lib/points.ts` — **server yang menghitung, client hanya menampilkan**.
- **Dua sumber kebenaran** — `lib/forms.ts` (5 form statis + Zod schemas) vs tabel Form (override dinamis). Desainnya: DB override menang saat `isActive`.

**🛡️ Kerentanan**

1. **Form buatan admin = permukaan serangan baru** — field dengan `type: "text"` yang tidak divalidasi dengan benar bisa jadi vektor XSS saat laporan dirender; skema Zod dinamis harus dibangun dari tipe field, bukan dipercaya begitu saja.
2. **`options` JSON rusak** — jika admin mengetik opsi tidak valid, `JSON.parse` melempar; parse dengan try/catch + fallback (pola yang sudah dipakai di `offline-setup.tsx`).
3. **Label dua bahasa** — jika `labelEn` kosong, UI harus fallback ke `label`; tanpa itu tampilan Inggris menampilkan teks kosong.

---

## Model Inti: Project & Donation

### model Project — proyek restorasi dengan form dinamis (baris ±248-277)

**Alur Cerita**

`Project` adalah pengajuan proyek restorasi oleh relawan (bisa karena punya ≥ 10.000 poin — lihat demo akun ucup). Datanya disimpan dalam `fieldData` JSON (20 field dari form) plus kolom denormalisasi untuk tampilan kartu (title, region, goal, raised).

**Potongan Kode Asli** (baris ±248-277):

```prisma
model Project {
  id              String        @id @default(uuid())
  userId          String?
  title           String
  summary         String        @default("")
  region          String        @default("")
  typeId          String
  fieldData       String        @default("{}") // JSON — 20 field dari form
  status          ProjectStatus @default(pending)
  goalAmount      Int           @default(0)
  raisedAmount    Int           @default(0)
  likes           Int           @default(0)
  comments        Int           @default(0)
  contactName     String        @default("")
  contactEmail    String        @default("")
  contactPhone    String        @default("")
  proposalFile    String        @default("")
  featuredPhotoId String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user        Profile?       @relation(fields: [userId], references: [id])
  donations   Donation[]
  commentList Comment[]      @relation("ProjectComments")
  likesList   Like[]
  photos      ProjectPhoto[]

  @@index([status, createdAt])
}
```

**Konstruk**

- **`likes` dan `comments` di-denormalisasi** — angka cepat untuk kartu; risiko inkonsistensi dengan tabel `Like`/`Comment` (perbarui dalam transaksi yang sama).
- **`typeId`** — menghubungkan proyek ke `MapPointType` (proyek konservasi vs penanaman, dll.).
- **Kontak & proposal di Project** — data bisnis (nama/email/HP, file proposal) yang tidak boleh bocor ke publik tanpa persetujuan admin.

**🛡️ Kerentanan**

1. **`raisedAmount` harus dihitung server** — jangan pernah menerima nilai dari client; donasi menambah angka ini hanya lewat webhook terverifikasi (status `paid`).
2. **`proposalFile`** — file upload dari user; validasi tipe & ukuran (magic bytes, batas MB).
3. **Kontak bocor** — endpoint publik project list harus menyaring `contactEmail/Phone`; hanya admin yang melihat.

### model Donation — donasi dengan idempotensi invoice (baris ±288-312)

**Alur Cerita**

`Donation` adalah transaksi donasi dengan `invoiceId` **unik** — kunci idempotensi webhook pembayaran: webhook yang sama dikirim dua kali tidak akan membuat dua donasi (ini bug nyata yang pernah terjadi di sesi 15: webhook duplikat → `already_processed`, poin +50 tepat sekali).

**Potongan Kode Asli** (baris ±288-312):

```prisma
model Donation {
  id         String         @id @default(uuid())
  userId     String?
  projectId  String?
  invoiceId  String         @unique @default("")
  externalId String         @default("")
  amountIdr  Int
  tierId     String         @default("")
  donorName  String         @default("")
  donorEmail String         @default("")
  status     DonationStatus @default(pending)
  paidAt     DateTime?
  expiresAt  DateTime?
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  user    Profile? @relation(fields: [userId], references: [id])
  project Project? @relation(fields: [projectId], references: [id])

  @@index([status])
  @@index([status, createdAt])
  @@index([userId])
  @@index([projectId])
}
```

**Konstruk**

- **`invoiceId @unique`** — pembayaran di-proses dengan CAS atomic (compare-and-swap status) sehingga webhook duplikat aman.
- **`externalId`** — id dari penyedia pembayaran (Xendit) untuk rekonsiliasi manual.
- **`expiresAt`** — invoice kedaluwarsa; worker menandai `expired` (lihat status enum).
- **`donorName/donorEmail` nullable-ish** — donasi boleh anonim; jangan pernah ekspos email donor di publik.

**🛡️ Kerentanan**

1. **Webhook tanpa verifikasi tanda tangan** — endpoint webhook harus memverifikasi signature penyedia; tanpa itu, siapa pun bisa menandai donasi `paid`.
2. **`amountIdr` dari client saat pembuatan invoice** — jumlah harus diverifikasi server; jangan percaya nominal dari body request.
3. **Status transisi** — `paid` hanya boleh terjadi dari `pending`/`expired` (atau via CAS), jangan dari `failed` langsung `paid` tanpa audit.

---

## Model Inti: PointsLog & PointRule

### model PointsLog — buku besar poin (baris ±313-329)

**Alur Cerita**

Setiap poin yang pernah diberikan tercatat di `PointsLog` — audit trail lengkap dengan alasan dan metadata JSON. Poin dihitung **server-only** di `lib/points.ts` (aturan keamanan #4); PointsLog adalah buktinya.

**Potongan Kode Asli** (baris ±313-329):

```prisma
model PointsLog {
  id        String   @id @default(uuid())
  userId    String?
  guestId   String?
  reportId  String?
  amount    Int
  reason    String
  metadata  String   @default("{}") // JSON
  createdAt DateTime @default(now())

  user   Profile? @relation(fields: [userId], references: [id])
  report Report?  @relation(fields: [reportId], references: [id])

  @@index([userId])
  @@index([userId, createdAt])
}
```

**Konstruk**

- **`amount` bisa negatif?** — tidak ada constraint; hati-hati: penalti poin (jika ada) harus eksplisit dan tercatat `reason`-nya.
- **`metadata` JSON string** — menyimpan konteks (nama mata air, formSlug, isDummy) tanpa mengubah skema.

**🛡️ Kerentanan**

1. **Poin dobel** — tanpa unique constraint `(userId, reportId, reason)`, retry bisa menggandakan poin; `clientCorrelationId` di Report adalah pertahanan utamanya.
2. **Log tanpa relasi ke form** — audit "siapa dapat berapa untuk apa" bergantung pada `metadata`; pastikan selalu diisi.

### model PointRule — aturan poin dari database (baris ±347-359)

**Alur Cerita**

`PointRule` menyimpan **14 aturan poin** (di-seed): poin dasar per form (25-100), bonus (streak, kualitas, discovery, milestone), dengan kategori `basic`/`bonus`/`milestone`. Ini membuat penyesuaian poin bisa dilakukan admin tanpa deploy.

**Potongan Kode Asli** (baris ±347-359):

```prisma
model PointRule {
  id          String   @id @default(uuid())
  name        String
  description String   @default("")
  points      Int
  category    String // "basic", "bonus", "milestone"
  icon        String   @default("Star")
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Konstruk**

- **Tanpa relasi ke Form** — aturan dihubungkan lewat `name` (string) yang cocok dengan `formSlug` — longgar, tapi sederhana.
- **`isActive`** — aturan bisa dimatikan tanpa menghapus (audit historis tetap utuh).

**🛡️ Kerentanan**

- **Dua sumber aturan (DB + lib/points.ts)** — jika tidak sinkron, UI dan kalkulasi berbeda; tetapkan server (`lib/points.ts`) sebagai otoritas dan DB sebagai tampilan/override.

---

## Model Pendukung

### Session & PasswordResetToken — autentikasi (baris ±75-107)

```prisma
model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user Profile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  profileId String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId, expiresAt])
}
```

**Alur Cerita**: `Session` adalah token login (cookie); `PasswordResetToken` adalah token reset sekali pakai. Perhatikan perbedaan penting: session menyimpan `token` **mentah** (harus cepat dibandingkan), reset token menyimpan `tokenHash` (sekali pakai, hashed — pola aman).

**🛡️ Kerentanan**

1. **Token sesi di DB** — rotasi memakai `verifyJwtWithRotation()` di `lib/jwt`; Session adalah lapisan kedua, bukan pengganti JWT.
2. **`tokenHash` unik** — jika hash memakai salt acak, uniqueness tetap berlaku di hash-nya; pastikan panjang kolom cukup (bcrypt 60 char).
3. **`usedAt` tanpa unique** — token bekas tidak bisa langsung dideteksi unik; cek `usedAt != null` sebelum memakai.

### CoursesProgress, Course, CourseModule — edukasi (baris ±330-388)

```prisma
model CoursesProgress {
  id               String   @id @default(uuid())
  userId           String
  courseId         String   @default("")
  courseSlug       String
  completedModules Int      @default(0)
  totalModules     Int      @default(1)
  completed        Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user   Profile @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course? @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseSlug])
}

model Course {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  description String   @default("")
  level       String   @default("Beginner")
  duration    String   @default("30 min")
  icon        String   @default("BookOpen")
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  modules  CourseModule[]
  progress CoursesProgress[]
}

model CourseModule {
  id        String   @id @default(uuid())
  courseId  String
  title     String
  content   String   @default("") // Markdown atau HTML content
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
}
```

**Alur Cerita**: 3 kursus di-seed (seed.ts), progres per pengguna unik per `(userId, courseSlug)`. Konten modul disimpan sebagai Markdown/HTML — **sanitasi DOMPurify 2 lapis di server** (cerita sesi 15: `<script>`, `onerror`, `javascript:` URL, `<iframe>` semua dibersihkan sebelum disimpan/dikirim).

**🛡️ Kerentanan**

- **`content` HTML dari admin** — jalur sanitasi wajib; admin terpercaya pun bisa salah-paste konten berbahaya.
- **`courseId` default ""** — relasi longgar; saat kursus dihapus, progress `courseId` jadi yatim — lebih aman memakai `courseSlug` untuk query.

### OfflineSession & TrackingPoint — sesi survei offline (baris ±429-460)

```prisma
model OfflineSession {
  id            String    @id @default(uuid())
  userId        String
  isActive      Boolean   @default(true)
  selectedForms Json      @default("[]")
  totalDistance Float? // meters
  startedAt     DateTime  @default(now())
  endedAt       DateTime?

  user           Profile         @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackingPoints TrackingPoint[]

  @@index([userId])
}

model TrackingPoint {
  id             String   @id @default(uuid())
  sessionId      String
  lat            Float
  lng            Float
  accuracy       Float?
  isSpringMarker Boolean  @default(false)
  springName     String? // nama mata air jika marker
  recordedAt     DateTime @default(now())

  session OfflineSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([recordedAt])
}
```

**Alur Cerita**: Satu sesi lapangan (mulai → selesai) dengan jejak `TrackingPoint`. `totalDistance` (meter) dihitung server dari titik jejak — bukan dari client (cerita sesi 10: tracking field mismatch — dulu `markerType`/`name`, sekarang `isSpringMarker`/`springName`, kedua nama diterima API untuk kompatibilitas).

**🛡️ Kerentanan**

- **`accuracy` tidak dipakai di schema** — GPS akurasi buruk tetap tercatat; pertimbangkan filter `accuracy < 100m` di server saat menghitung jarak.
- **Sesi menggantung `isActive: true`** — tanpa mekanisme timeout, sesi yang lupa diakhiri tetap "aktif" selamanya (dulu pernah auto-end, dihapus — sesi 10).

### Feedback & AppError — umpan balik & log error (baris ±461-473, ±610-625)

```prisma
model Feedback {
  id             String   @id @default(uuid())
  type           String   @default("bug") // "bug", "kritik", "saran", "both"
  kritik         String   @default("")
  saran          String   @default("")
  bugDescription String   @default("")
  bugScreenshot  String   @default("") // storage path
  status         String   @default("open") // "open", "read", "resolved"
  userId         String? // null if guest
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model AppError {
  id        String   @id @default(uuid())
  level     String   @default("error") // "info", "warning", "error", "critical"
  message   String
  source    String   @default("") // "frontend", "api", "worker", "database"
  stack     String   @default("")
  url       String   @default("")
  userId    String   @default("")
  metadata  String   @default("{}") // JSON string
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([level, createdAt])
  @@index([source, createdAt])
  @@index([read, createdAt])
}
```

**Alur Cerita**: `Feedback` adalah kotak saran/bug dari halaman bantuan; `AppError` adalah log error terpusat (frontend lewat `error-logger-init.tsx`, API, worker, database) yang bisa dilihat admin — pengganti Sentry yang belum terpasang.

**🛡️ Kerentanan**

- **`bugScreenshot` upload** — validasi MIME & ukuran (jalur photo rules berlaku).
- **AppError.metadata bisa memuat data sensitif** — sanitasi sebelum simpan; jangan log body request penuh.
- **Feedback tanpa rate limit** — spammable; batasi per user/IP.

### Notification, Comment, Like — interaksi sosial (baris ±474-531)

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   @default("info") // "draft", "submission-sent", "points-earned", "report-approved", "report-rejected", "project-verified", "event"
  title     String
  body      String   @default("")
  isRead    Boolean  @default(false)
  link      String   @default("") // deep link to relevant page
  createdAt DateTime @default(now())

  user Profile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

model Comment {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  text      String
  createdAt DateTime @default(now())

  project   Project  @relation("ProjectComments", fields: [projectId], references: [id], onDelete: Cascade)
  user      Profile  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([projectId, createdAt])
}

model Like {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    Profile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, projectId])
  @@index([projectId])
}
```

**Alur Cerita**: notifikasi dibuat oleh server saat event (laporan disetujui, poin, permintaan bibit — aturan di AGENTS.md: "create on events via Prisma"); komentar & like terikat ke proyek dengan relasi bernama eksplisit.

**🛡️ Kerentanan**

- **`text` komentar** — batasi panjang di server (mis. 500) + rate limit; React meng-escape saat render, tapi API publik tetap harus validasi.
- **`@@unique([userId, projectId])`** — mencegah like ganda di level DB; endpoint harus menangani error constraint (bukan asumsi 200).

### Seedling, SeedlingPhoto, SeedlingRequest — marketplace bibit 2 arah (baris ±532-592)

```prisma
model Seedling {
  id           String         @id @default(uuid())
  userId       String
  formSlug     String         @default("seedling-stock")
  species      String         // jenis bibit (Jati, Bambu, dll)
  quantity     Int            // jumlah awal
  stock        Int            // stok tersisa
  height       String         @default("") // C2_tinggi
  seedlingForm String         @default("") // C3_bentuk
  readiness    String         @default("") // C4_kesiapan
  province     String
  regency      String
  notes        String         @default("")
  reportId     String?        // link ke Report asal
  status       SeedlingStatus @default(pending)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  user     Profile           @relation(fields: [userId], references: [id])
  photos   SeedlingPhoto[]
  requests SeedlingRequest[]
  report   Report?           @relation("SeedlingReport", fields: [reportId], references: [id], onDelete: SetNull)

  @@index([status])
  @@index([userId])
  @@index([species])
  @@index([province])
}

model SeedlingPhoto {
  id          String   @id @default(uuid())
  seedlingId  String
  storagePath String
  createdAt   DateTime @default(now())

  seedling Seedling @relation(fields: [seedlingId], references: [id], onDelete: Cascade)

  @@index([seedlingId])
}

model SeedlingRequest {
  id              String        @id @default(uuid())
  seedlingId      String
  requesterId     String        // yang minta (Volunteer B)
  ownerId         String        // pemilik (Volunteer A) — denormalized biar gampang query
  quantity        Int           // jumlah diminta
  message         String        @default("")
  status          RequestStatus @default(pending)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  seedling  Seedling @relation(fields: [seedlingId], references: [id], onDelete: Cascade)
  requester Profile  @relation("SeedlingRequests", fields: [requesterId], references: [id])
  owner     Profile  @relation("SeedlingOwnedRequests", fields: [ownerId], references: [id])

  @@index([seedlingId])
  @@index([requesterId])
  @@index([ownerId])
  @@index([status])
}
```

**Alur Cerita**: bibit dari laporan `seedling-stock` (`reportId` menautkan ke Report asal, `onDelete: SetNull`) muncul di marketplace; relawan lain mengajukan `SeedlingRequest` (status: pending → completed/rejected/cancelled). `ownerId` di-denormalisasi agar query "permintaan masuk untuk bibitku" cepat — komentar kodenya jujur: "denormalized biar gampang query". Perhatikan pembagian peran dua kolom: `quantity` = jumlah awal dari laporan, `stock` = sisa yang bisa diminta; `height`/`seedlingForm`/`readiness` menyimpan jawaban field form C2/C3/C4 (tinggi bibit, bentuk, kesiapan).

**🛡️ Kerentanan**

- **`quantity` vs `stock`** — dua kolom serupa (awal vs sisa) rawan salah pakai; selalu kurangi `stock` saat permintaan `completed` (CAS atomik), jangan baca-tulis biasa.
- **`reportId` nullable** — bibit manual (tanpa laporan) bisa lolos verifikasi; admin harus bisa membedakan.
- **Stok berkurang saat `completed`** — update `Seedling.quantity` harus atomik (CAS), jangan baca-tulis biasa.

### ContentBlock — konten beranda dari database (baris ±593-609)

```prisma
model ContentBlock {
  id          String   @id @default(uuid())
  section     String // "media", "projects", "stats", "testimonials"
  type        String   @default("") // "video", "event", "publication", "press", "project", "stat"
  title       String
  subtitle    String   @default("")
  description String   @default("")
  imageUrl    String   @default("")
  linkUrl     String   @default("")
  linkLabel   String   @default("")
  data        String   @default("{}") // JSON for extra fields
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Alur Cerita**: 4 blok konten di-seed (video, event, publikasi, press — lihat `seed-content.ts`). Admin bisa mengubah isi beranda (media, statistik, testimoni) tanpa deploy.

**🛡️ Kerentanan**

- **`imageUrl`/`linkUrl` dari admin** — whitelist protokol `http(s)://`; jangan izinkan `javascript:` (bisa jadi XSS saat dirender sebagai `<a href>`).
- **`data` JSON bebas** — parse dengan try/catch; jangan di-`eval`.

---

## Migrasi 1-8: Perjalanan Skema dari Supabase ke VPS

Sepuluh migrasi menceritakan evolusi SpringHub. Delapan migrasi awal pendek — masing-masing satu fokus. Mari kita lihat masing-masing secara singkat.

### 20260519_init_supabase — kelahiran (tabel awal)

Migrasi pertama membuat **8 tabel inti** di database Supabase: `Profile`, `Report`, `ReportPhoto`, `Project`, `ProjectPhoto`, `Donation`, dan lainnya. Ini adalah "big bang" schema — sebelum ada Session, Spring, atau Form.

**Alur Cerita**: aplikasi versi pertama hanya punya profil, laporan, proyek, dan donasi. Tidak ada konsep poin terstruktur, tidak ada kursus, tidak ada offline — semuanya datang belakangan lewat migrasi berikutnya.

### 20260531_add_featured_photo — foto unggulan proyek

```sql
ALTER TABLE "Project" ADD COLUMN "featuredPhoto" TEXT;
ALTER TABLE "Project" ADD COLUMN "featuredPhotoUrl" TEXT;
```

**Alur Cerita**: kartu proyek di beranda butuh foto cover. Dua kolom ditambahkan (`featuredPhoto` dan `featuredPhotoUrl` — duplikasi yang kemudian dirapikan oleh desain `ProjectPhoto`).

### 20260601_add_report_isActive — soft-delete laporan

```sql
ALTER TABLE "Report" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
```

**Alur Cerita**: keputusan penting dari sesi audit (1 Juni): laporan yang dihapus admin harus hilang dari publik **tanpa menghapus baris** (audit & statistik tetap utuh). Semua GET publik kini menyaring `isActive: true` — termasuk filter `form.isActive`.

### 20260603_add_comments / add_likes_comments / add_notifications — interaksi sosial

Tiga migrasi di hari yang sama menambahkan `Comment`, `Like`, dan `Notification`. Pola menarik: **migrasi terpisah per fitur walau dibuat bersamaan** — disiplin yang membuat rollback per-fitur mudah.

**Alur Cerita**: komentar & like pada proyek, notifikasi per pengguna (draft, poin, persetujuan laporan). Ketiganya model "anak" yang ber-relasi ke Profile dengan `onDelete: Cascade`.

### 20260609_add_spring_model — mata air jadi warga kelas satu

Migrasi ini membuat tabel `Spring` — sebelumnya mata air hanya string di `fieldData` laporan. Sekarang ia entitas sendiri dengan status, provinsi, dan koordinat tersnap.

**Alur Cerita**: munculnya kebutuhan peta interaktif memaksa mata air diangkat jadi model. Ini contoh klasik "data dulu tersembunyi di JSON, lalu di-strukturkan saat dipakai banyak tempat".

### 20260615_add_rls_policies — RLS pertama (dan bermasalah)

Migrasi ini menambahkan **Row Level Security** pertama, memakai `auth.uid()` — fungsi dari Supabase Auth. Masalahnya: aplikasi pindah dari Supabase ke VPS PostgreSQL biasa, dan `auth.uid()` tidak ada di PostgreSQL vanilla. Policy lama ini **dibuang** oleh migrasi RLS terakhir (10) dengan `DROP POLICY IF EXISTS` — cerita lengkapnya di bagian migrasi 10.

---

## Migrasi 9: 20260812_add_indexes_and_models — Perombakan Besar (deep-dive)

**Alur Cerita**

Migrasi ini adalah "rumah baru": menambahkan **4 model** (PasswordResetToken, SeedlingRequest, dan kolom-kolom kunci) plus **20+ indeks** untuk performa dan idempotensi. Struktur filenya dibagi menjadi langkah-langkah bernomor — mari bedah setiap langkah.

**Langkah 1 — idempotensi offline: `Report.clientCorrelationId`** (baris ±1-17):

```sql
-- ═══════════════════════════════════════════════════════════════
-- 1. Report.clientCorrelationId — idempotency key offline sync
-- ═══════════════════════════════════════════════════════════════
-- idempotency key untuk dedupe offline retry: (profileId, clientCorrelationId)
-- value: UUID acak dari client (PWA), dibuat sekali saat report dibuat offline
-- digunakan oleh /api/reports (POST) untuk dedupe
ALTER TABLE "Report" ADD COLUMN "clientCorrelationId" TEXT;
CREATE UNIQUE INDEX "Report_clientCorrelationId_key" ON "Report"("clientCorrelationId");
```

> **Konstruk**: kolom `TEXT` + `UNIQUE INDEX` (bukan constraint `UNIQUE` di inline column) — di PostgreSQL hasilnya mirip, tapi indeks terpisah memudahkan `DROP INDEX` tanpa `ALTER TABLE` jika suatu saat mau diganti. Kunci ini dipakai `/api/reports` untuk menolak retry ganda: POST kedua dengan id sama → `409 already_processed` → poin tidak digandakan (ini yang menyelamatkan dari bug webhook duplikat di sesi 15).

**Langkah 2 — idempotensi webhook: `Donation.invoiceId`**

```sql
-- ═══════════════════════════════════════════════════════════════
-- 2. Donation.invoiceId — UNIQUE untuk webhook idempotency
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE "Donation" ADD COLUMN "invoiceId" TEXT DEFAULT '';
CREATE UNIQUE INDEX "Donation_invoiceId_key" ON "Donation"("invoiceId");
```

> **Konstruk**: pola yang sama, masalah yang sama (webhook pembayaran bisa dikirim dua kali oleh penyedia). Idempotensi adalah tema migrasi ini — dua kolom unik untuk dua jalur masuk data (PWA offline & webhook Xendit).

**Langkah 3 — indeks komposit untuk performa query admin**

```sql
CREATE INDEX "Project_status_createdAt_idx" ON "Project"("status", "createdAt");
CREATE INDEX "Project_profileId_createdAt_idx" ON "Project"("profileId", "createdAt");
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");
```

> **Konstruk**: daftar admin "proyek menurut status, diurutkan terbaru" memakai indeks komposit `(status, createdAt)` — kolom filter dulu, kolom urut kedua. Indeks ketiga untuk query yang hanya butuh createdAt. Tiga indeks di satu tabel = trade-off kecepatan tulis vs baca; pada volume POC ini wajar.

**Langkah 4 — tabel PasswordResetToken**

```sql
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
CREATE INDEX "PasswordResetToken_profileId_idx" ON "PasswordResetToken"("profileId");
```

> **Konstruk**: perhatikan kolom `token` di migrasi vs `tokenHash` di schema saat ini — kolomnya di-rename belakangan (lewat `db push`/edit schema) karena menyimpan token mentah di DB adalah risiko; schema akhir memakai hash. Ini contoh nyata migrasi → skema tidak selalu identik.

**Langkah 5 — relasi donasi → proyek**

```sql
ALTER TABLE "Donation" ADD COLUMN "projectId" TEXT DEFAULT '';
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

> **Konstruk**: `ON DELETE SET NULL` — jika proyek dihapus, donasi tetap ada (audit keuangan) tapi tidak menunjuk ke mana-mana. `ON UPDATE CASCADE` menjaga relasi saat id berubah (jarang, tapi aman).

**Langkah 6 — tabel SeedlingRequest**

```sql
CREATE TABLE "SeedlingRequest" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "springId" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "quantity" INT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeedlingRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SeedlingRequest_profileId_idx" ON "SeedlingRequest"("profileId");
CREATE INDEX "SeedlingRequest_springId_idx" ON "SeedlingRequest"("springId");
CREATE INDEX "SeedlingRequest_status_idx" ON "SeedlingRequest"("status");
```

> **Konstruk**: versi migrasi ini memakai `profileId`/`springId`/`requested` — schema final berubah menjadi `seedlingId`/`requesterId`/`ownerId`/`pending` (model marketplace 2 arah lahir belakangan). Migrasi adalah *snapshot evolusi*; yang terbaru menang.

**Konstruk keseluruhan**

- **Satu migrasi, banyak langkah bernomor** — setiap langkah berkomentar jelas; memudahkan audit "apa yang ditambahkan kapan dan kenapa".
- **Idempotensi sebagai tema** — dua unique index untuk dua jalur data (offline PWA & webhook).
- **Indeks untuk query admin** — pola `(filter, order)` komposit.

**🛡️ Kerentanan**

1. **Migrasi ≠ schema saat ini** — beberapa kolom (token, profileId di SeedlingRequest) sudah berubah di schema tanpa migrasi lanjutan (dikelola lewat `db push` di dev). Di produksi, disiplin `migrate deploy` wajib; jangan pernah `db push` ke DB produksi.
2. **`ALTER ... DEFAULT ''` di kolom unik** — banyak baris dengan `invoiceId = ''` melanggar keunikan? Tidak, karena PostgreSQL mengizinkan banyak `''` (bukan NULL) — tapi hati-hati: baris kedua dengan `invoiceId` kosong TETAP ditolak jika kolom punya `NOT NULL` + UNIQUE tanpa default... di sini default `''` membuat SEMUA baris punya nilai sama → UNIQUE index akan gagal untuk baris kedua. Kenyataannya migrasi ini sukses dijalankan — indikasi tabel Donation masih kosong saat itu, atau kolom dibuat nullable. Pelajaran: saat menambah UNIQUE di kolom dengan default non-null, pastikan data lama tidak bertabrakan (dedupe dulu).

---

## Migrasi 10: 20260812_add_rls_policies — RLS dengan GUC (deep-dive)

**Alur Cerita**

Migrasi terakhir adalah respons atas temuan audit (#5): **aktifkan Row Level Security** pada tabel sensitif (`Report`, `Profile`) dengan mekanisme GUC `springhub.user_id` — pengganti `auth.uid()` dari era Supabase yang sudah tidak ada. File 85 baris ini idempotent (DROP IF EXISTS + CREATE) sehingga bisa dijalankan berulang.

**Potongan Kode Asli — komentar kepala yang menjelaskan desain** (baris ±1-13):

```sql
-- Migration: Activate RLS on sensitive tables (Report, Profile)
-- 2026-08-12 (audit finding #5)
-- Idempotent: DROP IF EXISTS + CREATE.
--
-- ⚠️ Penting:
--   - RLS hanya mengikat koneksi NON-superuser. Koneksi superuser (BYPASSRLS)
--     yang dipakai aplikasi saat ini TIDAK terpengaruh — aman tanpa perubahan app.
--   - GUC "springhub.user_id" di-set oleh aplikasi per-request sebelum query:
--       SET LOCAL "springhub.user_id" = '<profileId | "admin">';
--     (tidak di-set / NULL = publik / anonymous)
--   - Kebijakan: admin melihat semua baris, pemilik melihat barisnya sendiri,
--     publik hanya melihat baris "aman" (Report: status='approved' AND isActive=true;
--     koordinat presisi tetap dipisah di lapisan aplikasi via lib/geo.ts).
```

> **Konstruk**: komentar ini bukan hiasan — ia mendokumentasikan keputusan arsitektur yang bisa membingungkan 6 bulan kemudian: *mengapa* GUC, *siapa* yang diikat RLS, dan *apa* yang masih tanggung jawab aplikasi. `SET LOCAL` (bukan `SET`) memastikan nilai hanya berlaku untuk transaksi itu.

**Potongan Kode Asli — aktifkan RLS & buang policy lama** (baris ±14-21):

```sql
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama dari 20260615 yang masih memakai auth.uid()
-- agar tidak menimbulkan error saat dievaluasi di koneksi non-superuser.
DROP POLICY IF EXISTS "Admin akses semua report" ON "Report";
DROP POLICY IF EXISTS "Admin semua report" ON "Report";
DROP POLICY IF EXISTS "Admin akses semua profile" ON "Profile";
```

**Potongan Kode Asli — tiga policy SELECT untuk Report** (baris ±25-35):

```sql
DROP POLICY IF EXISTS "Report publik lihat aman" ON "Report";
CREATE POLICY "Report publik lihat aman" ON "Report"
  FOR SELECT USING ("status" = 'approved' AND "isActive" = true);

DROP POLICY IF EXISTS "Report pemilik lihat sendiri" ON "Report";
CREATE POLICY "Report pemilik lihat sendiri" ON "Report"
  FOR SELECT USING ("userId" = current_setting('springhub.user_id', true));

DROP POLICY IF EXISTS "Report admin semua" ON "Report";
CREATE POLICY "Report admin semua" ON "Report"
  FOR SELECT USING (current_setting('springhub.user_id', true) = 'admin');
```

> **Konstruk**: `current_setting(name, true)` — argumen kedua `true` membuatnya tidak melempar saat GUC belum di-set (mengembalikan NULL). Tanpa ini, query dari koneksi tanpa GUC akan error. Tiga lapis SELECT: publik (baris aman saja) + pemilik (baris sendiri) + admin (semua).

**Potongan Kode Asli — policy INSERT & UPDATE** (baris ±37-63):

```sql
DROP POLICY IF EXISTS "Report publik boleh like" ON "Report";
CREATE POLICY "Report publik boleh like" ON "Report"
  FOR INSERT WITH CHECK (current_setting('springhub.user_id', true) = '');

-- (ini bukan kesalahan: like didasarkan pada Session alih-alih Report)

DROP POLICY IF EXISTS "Report pemilik update" ON "Report";
CREATE POLICY "Report pemilik update" ON "Report"
  FOR UPDATE USING (current_setting('springhub.user_id', true) = 'admin');
```

> **Konstruk**: dua hal menarik. Pertama, policy UPDATE hanya untuk `admin` — pemilik laporan pun tidak bisa mengubah laporannya sendiri di level DB (perubahan via alur review admin). Kedua, ada policy INSERT "publik boleh like" dengan komentar jujur: **"ini bukan kesalahan: like didasarkan pada Session alih-alih Report"** — komentar ini mencegah orang "memperbaiki" kode yang sebenarnya disengaja.

**Potongan Kode Asli — policy Profile** (baris ±65-84):

```sql
DROP POLICY IF EXISTS "Admin akses semua profile" ON "Profile";
CREATE POLICY "Admin akses semua profile" ON "Profile"
  FOR SELECT USING (current_setting('springhub.user_id', true) = 'admin');

-- (tidak ada policy SELECT untuk publik; Profile publik tidak diekspos langsung)

DROP POLICY IF EXISTS "Profile pemilik update" ON "Profile";
CREATE POLICY "Profile pemilik update" ON "Profile"
  FOR UPDATE USING (current_setting('springhub.user_id', true) = 'admin'
    OR current_setting('springhub.user_id', true) = "Profile".id::text);

-- (tidak ada policy SELECT untuk user lain; profil orang lain tidak diekspos)

-- Note: RLS tidak menutup endpoint; aplikasi tetap wajib cek otorisasi.
--       Dengan GUC, policy di-evaluasi ulang per transaksi/jalur query.
```

**Konstruk keseluruhan**

- **GUC sebagai "user context"** — pola standar RLS aplikasi yang tidak memakai Supabase Auth: aplikasi men-set nilai per request, policy mengevaluasi.
- **Idempotent** — `DROP IF EXISTS` sebelum `CREATE`; migrasi bisa diulang tanpa error.
- **RLS = lapisan kedua** — komentar penutup menegaskan: RLS bukan pengganti cek otorisasi di aplikasi.

**🛡️ Kerentanan**

1. **Superuser BYPASSRLS** — komentar jujur mengakui koneksi aplikasi saat ini superuser → RLS praktis tidak mengikat. Jika kelak pindah ke user non-superuser, semua query harus sudah men-set GUC; audit menyeluruh diperlukan sebelum switch.
2. **Policy "publik boleh like" dengan `= ''`** — INSERT dengan CHECK GUC kosong; siapa pun (termasuk bot) bisa insert tanpa autentikasi selama GUC kosong. Rate limit aplikasi adalah satu-satunya pertahanan.
3. **`"Profile".id::text`** — perbandingan string; pastikan GUC di-set sebagai string id, bukan angka/objek (tipe salah = policy tak pernah cocok).

---

## Seed: prisma/seed.ts — Data Awal (deep-dive)

**Alur Cerita**

`seed.ts` adalah "dapur demo": membuat **3 akun, 5 form + field, 4 mata air, puluhan laporan + foto, proyek, donasi, kursus, 14 aturan poin, blok konten, notifikasi, komentar, feedback**. Tapi ada satu hal yang mengubah segalanya di sesi 15: seed ini **menghapus semua data** — dan sekarang punya pengaman.

**Potongan Kode Asli — pengaman penghapusan** (baris ±19-45):

```ts
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
```

> **Konstruk**: guard sederhana tapi efektif — hitung `Profile`; kalau bukan nol dan tanpa `SEED_FORCE=1`, langsung `process.exit(1)`. Ini menyelamatkan DB staging yang sudah berisi data hasil restore (cerita sesi 15: "Seed ke staging = jangan, data sudah dari dump").

**Potongan Kode Asli — koneksi dengan batas ketat** (baris ±5-9):

```ts
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

> **Konstruk**: `max: 3` — seed membatasi koneksi agar tidak ikut menghabiskan kuota pool server. `connectionTimeoutMillis: 10000` mencegah seed menggantung selamanya saat DB lambat. Ini juga alasan mengapa ada dua gaya koneksi di file seed (pool langsung vs `PrismaPg` adapter) — semuanya valid, konsistensi yang jadi PR.

**Potongan Kode Asli — penghapusan berurutan (dependency order)** (baris ±46-65):

```ts
await prisma.trackingPoint.deleteMany();
await prisma.offlineSession.deleteMany();
// ... (notification, like, comment, projectPhoto, project, reportPhoto,
//      report, spring, seedling, seedlingRequest, passwordResetToken,
//      formField, form, contentBlock, donation, pointsLog, ...)
await prisma.profile.deleteMany();
```

> **Konstruk**: urutan deleteMany **dari anak ke induk** (tracking point sebelum offline session, reportPhoto sebelum report, dst.) — kalau terbalik, constraint foreign key melempar error. `Profile` dihapus paling akhir karena hampir semua tabel mereferensikannya.

**Potongan Kode Asli — tiga akun demo** (baris ±69-107):

```ts
const adminPassword = await bcrypt.hash("admin123", 12);
const admin = await prisma.profile.create({
  data: {
    email: "admin@springhub.id",
    passwordHash: adminPassword,
    username: "Admin",
    role: "admin",
    points: 99999,
    trustScore: 100,
  },
});

const ucupUser = await prisma.profile.create({
  data: {
    email: "ucup@springhub.id",
    passwordHash: await bcrypt.hash("ucup12345", 12),
    username: "Ucup",
    role: "volunteer",
    points: 20168,
    trustScore: 50,
    region: "Jawa Timur",
  },
});
```

> **Konstruk**: `bcrypt.hash(x, 12)` — 12 rounds (aturan keamanan #6). Perhatikan angka: admin 99.999 poin (semua fitur), ucup 20.168 poin (bisa buat proyek, ambang ~10.000), volunteer 10.000 poin (belum bisa proyek) — angka-angka ini sengaja di-set agar demo akun menunjukkan perbedaan hak akses.

**Potongan Kode Asli — form dinamis dengan field ber-ID rapi** (baris ±179-205):

```ts
// ── 3. Forms + Fields ───────────────────────────────────────────────────
const formDefs = [
  {
    slug: "spring-monitoring", title: "Survei Mata Air", points: 100, type: "monitoring",
    fields: [
      { fieldId: "A1_tanggal", label: "Tanggal Survei", type: "date", required: true, placeholder: "", sortOrder: 1 },
      { fieldId: "A2_nama_surveyor", label: "Nama Surveyor", type: "text", required: true, placeholder: "", sortOrder: 2 },
      { fieldId: "A3_wa", label: "Nomor WA", type: "phone", required: true, placeholder: "", sortOrder: 3 },
      { fieldId: "A4_geotag", label: "Geotag", type: "location", required: true, sortOrder: 4 },
      { fieldId: "A5_cek_duplikat", label: "Cek Duplikat (radius 20m)", type: "select", required: true, options: JSON.stringify(["Baru","Kunjungan Ulang"]), sortOrder: 5 },
      { fieldId: "B1_nama", label: "Nama Lokal Mata Air", type: "text", required: true, sortOrder: 7 },
      { fieldId: "B2_foto_1", label: "Foto 1: Titik Keluar Air (dekat)", type: "photo", required: true, sortOrder: 8 },
      // ... B3-B9, C1-C2 (warna air, pemanfaatan lahan, dll.)
    ],
  },
  // 4 form lain: spring-restoration, trench-development, tree-planting, seedling-stock
];
```

> **Konstruk**: `fieldId` berpola seksi-bermakna (`A1_`, `B2_`, `C1_`) — ini bukan sekadar id, tapi skema form versi cetak (blok A: identitas, B: kondisi mata air, C: kualitas). ID inilah yang jadi `name` HTML dan kunci `fieldData`. `options` diserialisasi `JSON.stringify` karena kolomnya string.

**Sisa seed** (baris ±325-666): laporan + foto (dengan `img()` placeholder), points log, proyek, donasi, kursus (di-recreate dengan modul), 14 blok konten (`ContentBlock`), 14 aturan poin (`PointRule`), notifikasi, komentar, feedback, lalu ringkasan cetak.

**🛡️ Kerentanan**

1. **`SEED_FORCE=1` adalah senjata** — sekali dijalankan di DB berisi, data hilang permanen. Aturan tim: hanya di DB kosong; `SEED_FORCE` hanya untuk lingkungan dev yang memang sengaja direset.
2. **Password demo publik** — `admin123`/`ucup12345`/`vol123` ada di dokumentasi; jangan pernah dipakai di produksi (ganti via admin panel setelah deploy).
3. **Placeholder image eksternal** — `placehold.co` dipakai untuk foto demo; butuh internet. Untuk seed offline, ganti dengan path lokal.

---

## Seed: prisma/seed-dummy.ts — Data Demo Besar (317 baris)

**Alur Cerita**

`seed-dummy.ts` menanam **data palsu yang terlihat nyata**: 40+ mata air dengan koordinat asli Indonesia, 12 relawan dummy, 4 proyek, dan 25 laporan dengan distribusi status realistis (70% approved / 20% pending / 10% rejected). Semua data ditandai `isDummy: true` agar tidak mencemari statistik dan diberi badge "[Demo]" di admin.

**Potongan Kode Asli — helper & kumpulan mata air** (baris ±1-45):

```ts
function randomCoord(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number): Date {
  return new Date(Date.now() - Math.floor(Math.random() * daysAgo) * 86400000);
}

const SPRINGS = [
  { name: "Mata Air Cipamingkis", province: "Jawa Barat", regency: "Bogor", village: "Sukamakmur", lat: -6.6530, lng: 106.7723 },
  { name: "Mata Air Sumber Jalatunda", province: "Jawa Tengah", regency: "Banjarnegara", village: "Pekasiran", lat: -7.2032, lng: 109.8701 },
  { name: "Mata Air Tuk Bening", province: "DI Yogyakarta", regency: "Gunung Kidul", village: "Plembutan", lat: -7.9528, lng: 110.5367 },
  { name: "Mata Air Sendang Biru", province: "Jawa Timur", regency: "Malang", village: "Sumbermanjing", lat: -8.3050, lng: 112.6845 },
  // ... 40+ mata air nyata dari 5 provinsi
];
```

**Potongan Kode Asli — 12 relawan + 4 proyek dummy** (baris ±176-206):

```ts
const dummyProfiles = await prisma.profile.createMany({
  data: Array.from({ length: 12 }, (_, i) => ({
    email: `volunteer${i + 1}@dummy.id`,
    username: `Relawan ${i + 1}`,
    passwordHash,
    role: "volunteer",
    points: Math.floor(Math.random() * 3000) + 500,
    trustScore: Math.floor(Math.random() * 50) + 50,
    region: pick(["Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Jawa Barat", "Banten"]),
    isDummy: true,
  })),
});

const projectDummy = await prisma.project.createMany({
  data: Array.from({ length: 4 }, (_, i) => ({
    title: `Proyek ${i + 1}: Restorasi Mata Air ${pick(SPRINGS).name}`,
    slug: `proyek-${i + 1}`,
    status: pick(["approved", "approved", "approved", "completed"]),
    goalAmount: 5000000 * (i + 1),
    raisedAmount: Math.floor(Math.random() * 4000000) + 1000000,
    region: pick(["Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Jawa Barat"]),
    isDummy: true,
  })),
});
```

**Potongan Kode Asli — 25 laporan dengan distribusi status & poin** (baris ±208-280):

```ts
// 70% approved, 20% pending, 10% rejected
const statusRoll = Math.random();
const status = statusRoll < 0.7 ? "approved" : statusRoll < 0.9 ? "pending" : "rejected" as const;

const report = await prisma.report.create({
  data: {
    userId: user.id,
    formSlug,
    status,
    isActive: true,
    isDummy: true,
    fieldData,
    snappedLat: spring.lat,
    snappedLng: spring.lng,
    springId: spring.id,
    createdAt: randomDate(90),
  },
});

// Award points for approved reports
if (status === "approved") {
  const ptsMap: Record<string, number> = {
    "spring-monitoring": 25,
    "spring-restoration": 100,
    "trench-development": 50,
    "tree-planting": 50,
    "seedling-stock": 15,
  };
  const pts = ptsMap[formSlug] || 25;
  await prisma.pointsLog.create({
    data: {
      userId: user.id,
      reportId: report.id,
      amount: pts,
      reason: `Dummy: Approved ${formSlug}`,
      metadata: JSON.stringify({ isDummy: true, springName: spring.name }),
      createdAt: report.createdAt,
    },
  });
}
```

**Konstruk**

- **Distribusi statistik** — `Math.random()` di-roll tiga cabang (70/20/10) membuat peta & dashboard terlihat hidup, bukan seragam.
- **Poin hanya untuk approved** — konsisten dengan logika produksi: laporan ditolak tidak memberi poin.
- **Notifikasi 40% acak** — sebagian laporan disetujui memicu notifikasi "Laporan Anda disetujui! 🎉".
- **ucup di-boost ke 25.000 poin** — agar akun demo selalu memenuhi syarat proyek.

**🛡️ Kerentanan**

1. **Data dummy mengalir ke API publik** — semua query publik wajib filter `isDummy: false` (atau `isActive`); satu query yang lupa = statistik tercemar.
2. **Password semua relawan dummy sama** — `vol12345` untuk semua; kalau akun ini bocor ke produksi, mereka login bersama. Jangan pernah men-seed dummy ke produksi.
3. **`Math.random` tanpa seed** — hasil berbeda tiap run; bagus untuk demo, buruk untuk reproduksi bug. Pertimbangkan seed PRNG bila perlu determinisme.

---

## Seed: prisma/seed-content.ts — Blok Konten (25 baris)

**Alur Cerita**

File terkecil tapi spesifik: menanam **4 blok konten media** (video, event, publikasi, press) ke `ContentBlock`. Koneksinya memakai pola `PrismaPg` + pool.

**Potongan Kode Asli — inti** (baris ±1-25):

```ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "public" });
const p = new PrismaClient({ adapter });

const mediaItems = [
  { section: 'media', type: 'video', title: 'Jaga Semesta · Restorasi Mata Air', subtitle: 'Apr 2026', description: '...', imageUrl: 'https://i.ytimg.com/vi/oUDA1loE8BE/maxresdefault.jpg', linkUrl: 'https://www.youtube.com/watch?v=oUDA1loE8BE', linkLabel: 'Watch on YouTube', sortOrder: 1 },
  { section: 'media', type: 'event', title: 'Restorasi Sumber Sabrangan, Mojokerto', subtitle: '30 Des 2025 · Reboisasi · Sumber Jubel', description: '...', linkUrl: 'https://mojokerto.disway.id/...', linkLabel: 'Baca selengkapnya', sortOrder: 2 },
  { section: 'media', type: 'publication', title: 'Laporan Dampak 2025: 200+ Mata Air Terlindungi', subtitle: 'Jan 2026 · Video, 15 menit', sortOrder: 3 },
  { section: 'media', type: 'press', title: 'Kompas: Sumber Air di Kebumen Diselamatkan Warga', subtitle: 'Jan 2026 · Kompas.id', linkUrl: 'https://interaktif.kompas.id/...', linkLabel: 'Baca artikel', sortOrder: 4 },
];

async function main() {
  for (const item of mediaItems) {
    await p.contentBlock.create({ data: item });
  }
  console.log('✅ Seeded', mediaItems.length, 'media items');
}

main().finally(() => p.$disconnect());
```

**Konstruk**

- **Tanpa pengaman wipe** — file ini aman dijalankan berulang (hanya insert); beda nasib dengan `seed.ts`.
- **Konten nyata** — link ke liputan media sungguhan; data contoh yang bisa langsung dipakai meninjau tampilan media section.
- **`p.contentBlock`** — nama model `contentBlock` di sini vs `ContentBlock` di schema: Prisma client case-insensitive untuk akses model (`p.contentBlock` ≡ `p.ContentBlock`) — ini bukan bug, tapi bisa membingungkan pembaca baru.

**🛡️ Kerentanan**

- **Insert duplikat saat dijalankan dua kali** — tidak ada `upsert`; jalankan sekali atau tambahkan guard `count()`.

---

## Seed: prisma/seed-test-accounts.ts — Akun Test Terkini (59 baris)

**Alur Cerita**

File ini adalah versi "ringan" dari akun seed utama: **upsert `admin@springhub.id` dan `ucup@springhub.id`** dengan bcrypt 12 rounds — aman dijalankan kapan pun karena `upsert` (update bila ada, create bila belum).

**Potongan Kode Asli — upsert admin** (baris ±15-30):

```ts
async function main() {
  console.log("🔐 Seeding test accounts...");

  // Upsert admin@springhub.id
  const adminPw = await bcrypt.hash("admin123", 12);
  const admin = await prisma.profile.upsert({
    where: { email: "admin@springhub.id" },
    update: { passwordHash: adminPw },
    create: {
      email: "admin@springhub.id",
      passwordHash: adminPw,
      username: "Admin",
      role: "admin",
      points: 99999,
      trustScore: 100,
    },
  });
  console.log(`   ✅ Admin: ${admin.email} (id: ${admin.id})`);
}
```

**Konstruk**

- **`upsert`** — pola idempoten: tidak menghapus data lain, aman di produksi (selama password demo tidak dipakai user sungguhan).
- **`update` hanya passwordHash** — kalau admin sudah mengubah username/region, seed tidak menimpa.

**🛡️ Kerentanan**

- **Menimpa password admin yang sudah diganti** — siapa pun yang menjalankan file ini me-reset password `admin@springhub.id` ke `admin123`; di produksi ini pintu masuk! Jangan jalankan di produksi tanpa diskusi tim.

---

## Cerita Samping: fix-pool.sql & fix-ucup.sql

### fix-pool.sql — melawan EMAXCONNSESSION

**Alur Cerita**: aplikasi Vercel membuka banyak koneksi ke Supabase; pool PostgreSQL mentok (`EMAXCONNSESSION`). Skrip ini memutus koneksi idle > 5 menit, memverifikasi koneksi aktif/idle, dan mencatat bahwa pool_size Supabase tidak bisa di-set lewat SQL (harus via Dashboard).

**Potongan Kode Asli** (baris ±1-30):

```sql
-- =====================================================================
--  FIX: Supabase Connection Pool — Prevent EMAXCONNSESSION
--  Run this in Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1. Terminate idle connections dari aplikasi (bukan Supabase sendiri)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'postgres'
  AND state = 'idle'
  AND state_change < now() - interval '5 minutes'
  AND application_name NOT LIKE 'pgbouncer%'
  AND pid <> pg_backend_pid();
```

**Konstruk**: `pg_terminate_backend` + filter ketat (hanya idle > 5 menit, bukan koneksi pgbouncer, bukan diri sendiri). Solusi jangka panjangnya ada di `.env`: `?connection_limit=10&pool_timeout=10` (cerita sesi 10).

### fix-ucup.sql — menyelamatkan akun ucup

**Alur Cerita**: password ucup `ucup123` (7 karakter) ditolak validasi Zod baru (min 8, huruf besar+kecil+digit). Skrip ini menulis ulang akun dengan `ucup12345` dan poin 20.168, plus hash bcrypt cost 12.

**Potongan Kode Asli** (baris ±1-30):

```sql
-- Fix ucup account: reset password + tambah points untuk submit project
-- Jalankan di Supabase Dashboard > SQL Editor

-- Password: ucup12345 (hash bcrypt cost 12, valid)
INSERT INTO "Profile" (id, email, "passwordHash", username, role, points, "trustScore", region, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'ucup@springhub.id',
  '$2b$12$eT7oozvJe4CRGFeXKlXoveRFvdGzEKHQWdLt5iSKlpEO3e3GPWGgC',
  'Ucup',
  'volunteer',
  20168,
  50,
  'Jawa Timur',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  points = 20168,
  username = 'Ucup',
  role = 'volunteer',
  region = 'Jawa Timur',
  "updatedAt" = NOW();
```

**Konstruk**: `INSERT ... ON CONFLICT DO UPDATE` — upsert murni SQL tanpa Prisma. Catatan: `gen_random_uuid()` butuh ekstensi `pgcrypto`/PostgreSQL 13+.

**🛡️ Kerentanan**

- **Hash tertulis di file repo** — hash ini untuk password demo yang memang publik; jangan pernah menaruh hash password produksi di repo.
- **Skrip SQL ad-hoc = bypass aplikasi** — tidak ada audit log, tidak ada validasi Zod; gunakan hanya untuk perbaikan darurat, lalu catat di dokumentasi (AGENTS.md).

---

## Worker: workers/email-worker.ts — Pengirim Email (32 baris)

**Alur Cerita**

`email-worker.ts` adalah worker **BullMQ** yang menunggu job di antrean Redis `"email"`: menerima `{ to, subject, html, text }`, mengirim via Resend (`lib/email`), dan mencatat sukses/gagal ke logger. Konfigurasinya membatasi kecepatan (50 email/menit) dan konkurensi (5 paralel).

**Potongan Kode Asli — seluruh worker** (baris ±1-32):

```ts
import { Worker } from "bullmq";
import { sendEmail } from "../lib/email";
import logger from "../lib/logger";
import { redisConnectionFromUrl } from "../lib/redis-connection";

const connection = redisConnectionFromUrl(process.env.REDIS_QUEUE_URL);

const worker = new Worker(
  "email",
  async (job) => {
    const { to, subject, html, text } = job.data;
    await sendEmail({ to, subject, html, text });
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 50,
      duration: 60_000, // max 50 emails per minute
    },
  }
);

worker.on("completed", (job) => {
  logger.info({ to: job.data.to }, "Email sent");
});

worker.on("failed", (job, err) => {
  logger.error({ to: job?.data?.to, error: err.message }, "Email failed");
});

logger.info("Email worker started");
```

**Konstruk**

- **BullMQ Worker + Redis** — antrean pekerjaan yang tahan crash: job yang gagal di-retry BullMQ (default), yang sukses dihapus otomatis.
- **`limiter`** — 50 email/menit: melindungi kuota Resend dan reputasi domain (rate limit penyedia).
- **`concurrency: 5`** — lima job diproses paralel; seimbang dengan limit agar antrean tidak menumpuk.
- **Event `completed`/`failed`** — observabilitas tanpa poll: logger terstruktur (`pino`-style) mencatat alamat tujuan.

**🛡️ Kerentanan**

1. **Job payload dari Redis** — `to`, `subject`, `html` datang dari job; sanitasi HTML (jangan kirim script mentah) dan validasi email di `sendEmail`.
2. **Rate limit global vs per-pengirim** — 50/menit global; saat kampanye massal, email penting (reset password) bisa antre lama. Pertimbangkan antrean prioritas.
3. **Secrets** — `REDIS_QUEUE_URL` harus berisi kredensial terenkripsi; jangan pernah log URL lengkap (logger di atas hanya mencatat `to`).

---

## Penutup Bab 8

Tiga pelajaran dari lapisan data SpringHub:

1. **Skema berevolusi lewat cerita.** 10 migrasi mencatat perjalanan dari Supabase → VPS, dari `auth.uid()` → GUC, dari form hardcode → model `Form`/`FormField`. Membaca migrasi = membaca sejarah keputusan tim.
2. **Idempotensi adalah tema.** `clientCorrelationId` (laporan offline), `invoiceId` (donasi webhook), `@@unique([userId, projectId])` (like), `upsert` (seed) — semua melindungi dari pengiriman ganda. Di aplikasi dengan PWA offline + pembayaran, ini bukan fitur, ini kebutuhan.
3. **Dua lapis kontrol akses.** RLS di database + cek otorisasi di aplikasi + pemisahan koordinat presisi/tersnap — keamanan data tidak pernah bergantung pada satu lapisan.

Bab berikutnya: **lapisan kecerdasan** — poin, klaster peta, i18n, dan mesin validasi dinamis di `lib/`.
