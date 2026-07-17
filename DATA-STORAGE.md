# Penyimpanan Data SpringHub

## Database (Supabase PostgreSQL)
Tabel dan fungsinya:

| Tabel | Fungsi | Data Penting |
|-------|--------|-------------|
| Profile | Data user | id, email, username, role, points, trustScore |
| Session | Sesi login | token, expiresAt |
| Report | Laporan form | formSlug, fieldData (JSON), preciseLat/Lng, snappedLat/Lng, status |
| ReportPhoto | Foto laporan | storagePath, mimeType, width, height |
| Project | Projek | title, goalAmount, raisedAmount, likes, comments |
| Donation | Donasi | amountIdr, donorName, donorEmail, status |
| PointsLog | Riwayat poin | amount, reason, createdAt |
| CoursesProgress | Progress kursus | courseSlug, completedModules, completed |
| Notification | Notifikasi | type, title, body, isRead, link |
| Feedback | Kritik/saran | type, kritik, saran, bugDescription |
| Form | Definisi form | slug, title, pointsOnSubmit, fields |
| OfflineSession | Sesi offline | selectedForms, totalDistance |
| TrackingPoint | Titik GPS offline | lat, lng, accuracy, isSpringMarker |

## Storage (Cloudflare R2 / Supabase Storage)
| Data | Lokasi | Format |
|------|--------|--------|
| Foto laporan | `/reports/{reportId}/{fieldId}/{timestamp}.jpg` | JPEG 720p |
| Screenshot feedback | `/feedback/{id}.png` | PNG |
| File proposal proyek | `/proposals/{projectId}.pdf` | PDF |

## Local Storage (Browser — IndexedDB)
Digunakan untuk mode offline:

| Store | Isi | Fungsi |
|-------|-----|--------|
| pending-reports | Laporan yang belum terkirim | Queue offline |
| tracking-points | Titik GPS tracking | Rute perjalanan |
| photo-blobs | Foto yang diambil offline | Blob gambar |
| form-definitions | Cache definisi form | Isi form offline |
| tile-manifest | Cache tile peta | Map offline |
| draft-reports | Draft form yang belum selesai | Auto-save |
| submission-queue | Antrian submit yang gagal | Retry saat online |
| offline-config | Konfigurasi sesi offline | Radius, form terpilih |

## Penyimpanan Sementara (Runtime)
| Data | Lokasi | Fungsi |
|------|--------|--------|
| Login user | React state (user) | Navbar, gate |
| Like proyek | React state (likedProjects) | Optimistic UI |
| Komentar proyek | React state (currentComments) | Optimistic UI |
| Form data | React state (formData) | Input form |
| Tracking points | React state (trackingPoints) | Map real-time |

## Catatan Penting
- Foto dikompres ke 720p sebelum disimpan
- Lokasi presisi hanya untuk admin
- Data IndexedDB dihapus setelah sync berhasil
- Like & komen saat ini optimistic (lokal dulu, nanti sync ke DB)
