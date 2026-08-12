/**
 * IndexedDB wrapper untuk Offline Survey Mode.
 *
 * Stores (10):
 * - pending-reports   → form submissions saved while offline
 * - tracking-points   → GPS trail points (saved every ~5m)
 * - photo-blobs       → captured photos (blobs, uploaded on exit)
 * - form-definitions  → cached form schema from admin panel
 * - tile-manifest     → record of which OSM tiles are cached
 * - tile-blobs        → OSM tile image blobs (tanpa Service Worker)
 * - offline-config    → offline session configuration
 * - draft-reports     → auto-saved form drafts (tiap 30 detik)
 * - submission-queue  → pending submissions dengan retry + backoff
 * - session-cache     → PWA offline auth session cache
 *
 * Koneksi: single persistent connection (singleton promise).
 * JANGAN panggil db.close() dari jalur transaksi — hanya `offlineDB.teardown()`
 * (explicit teardown) yang menutup koneksi, dan guard dbPromise=null dipasang
 * SEBELUM close supaya operasi berikutnya otomatis membuka koneksi baru.
 *
 * Idempotency: setiap laporan offline punya clientCorrelationId (UUID tetap,
 * TIDAK digenerate ulang saat retry). Kirim dalam formData dengan key
 * "clientCorrelationId" — server dedupe laporan berdasarkan key ini.
 */

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

export type DraftReport = {
  id: string;
  formSlug: string;
  fieldData: Record<string, unknown>;
  photoBlobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }>;
  savedAt: number;
};

export type PendingReport = {
  id: string;
  formSlug: string;
  fieldData: Record<string, unknown>;
  photoFieldIds: string[]; // field IDs that have photos
  csrfToken: string;
  guestId: string | null;
  createdAt: number;
  /**
   * Idempotency key — UUID tetap antar retry. Dikirim sebagai
   * "clientCorrelationId" di formData; server dedupe berdasarkan key ini.
   */
  clientCorrelationId?: string;
};

export type PhotoBlob = {
  id: string;
  reportId: string;
  fieldId: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
};

/** Session user yang di-cache di IndexedDB agar PWA bisa offline tanpa login ulang */
export type CachedSession = {
  id: "user-session";
  userId: string;
  username: string;
  role: string;
  phone?: string;
  csrfToken: string;
  cachedAt: number;
};

export type FormDefinition = {
  slug: string;
  title: string;
  description: string;
  pointsOnSubmit: number;
  contributionType: string;
  fields: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder: string;
    help: string;
    options: string[];
  }>;
  cachedAt: number;
};

export type TileRecord = {
  url: string;
  z: number;
  x: number;
  y: number;
  cachedAt: number;
};

export type TileBlob = {
  url: string;
  blob: Blob;
  z: number;
  x: number;
  y: number;
  cachedAt: number;
};

export type QueuedSubmission = {
  id: string;
  formSlug: string;
  fieldData: Record<string, unknown>;
  photoBlobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }>;
  csrfToken: string;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  /**
   * Idempotency key — SAMA antar retry (jangan generate ulang).
   * QueueWorker kirim sebagai "clientCorrelationId" di formData.
   */
  clientCorrelationId?: string;
  /** Waktu percobaan terakhir (ms epoch) — dicatat tiap retry */
  attemptedAt?: number;
  /** Backoff: jangan coba lagi sebelum waktu ini (ms epoch) */
  nextRetryAt?: number;
  /** 4xx (validasi) = gagal permanen — jangan retry otomatis */
  permanentError?: boolean;
  /** "queued" = masih dicoba, "failed" = cap attempts / permanen */
  state?: "queued" | "failed";
  /** Total kegagalan — cap MAX_FAILED_ATTEMPTS (20), lalu tampil di UI */
  failureCount?: number;
};

type DBSchema = {
  "pending-reports": {
    key: string;
    value: PendingReport;
    indexes: { "by-created": number };
  };
  "tracking-points": {
    key: string;
    value: OfflineTrackingPoint;
    indexes: { "by-recorded": number; "by-marker-type": string };
  };
  "photo-blobs": {
    key: string;
    value: PhotoBlob;
    indexes: { "by-report": string };
  };
  "form-definitions": {
    key: string;
    value: FormDefinition;
    indexes: { "by-slug": string };
  };
  "tile-manifest": {
    key: string;
    value: TileRecord;
    indexes: { "by-url": string };
  };
  "tile-blobs": {
    key: string;
    value: TileBlob;
    indexes: { "by-url": string };
  };
  "offline-config": {
    key: string;
    value: OfflineConfig;
    indexes: {};
  };
  "draft-reports": {
    key: string;
    value: DraftReport;
    indexes: { "by-updated": number };
  };
  "submission-queue": {
    key: string;
    value: QueuedSubmission;
    indexes: { "by-created": number };
  };
  "session-cache": {
    key: string;
    value: CachedSession;
    indexes: {};
  };
};

type StoreNames = keyof DBSchema;

// ─── Retry policy ───────────────────────────────────────────────────────────

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

// ─── Connection management (single persistent connection) ────────────────────

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

      // ── Version 5 — session-cache store ──
      if (oldVersion < 5) {
        if (!db.objectStoreNames.contains("session-cache")) {
          db.createObjectStore("session-cache", { keyPath: "id" });
        }
      }

      // ── Version 4 migration — tile-blobs store ──
      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains("tile-blobs")) {
          db.createObjectStore("tile-blobs", { keyPath: "url" });
        }
      }

      // ── Version 3 migration ──
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains("draft-reports")) {
          const store = db.createObjectStore("draft-reports", { keyPath: "id" });
          store.createIndex("by-updated", "savedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("submission-queue")) {
          const store = db.createObjectStore("submission-queue", { keyPath: "id" });
          store.createIndex("by-created", "createdAt", { unique: false });
        }
      }

      // ── Version 2 migration ──
      if (oldVersion < 2) {
        // offline-config store
        if (!db.objectStoreNames.contains("offline-config")) {
          db.createObjectStore("offline-config", { keyPath: "id" });
        }

        // Migrate tracking-points indexes: replace "by-marker" (isSpringMarker)
        // with "by-marker-type" (markerType)
        if (db.objectStoreNames.contains("tracking-points")) {
          const tx = (event.target as IDBOpenDBRequest).transaction!;
          const store = tx.objectStore("tracking-points");
          if (store.indexNames.contains("by-marker")) {
            store.deleteIndex("by-marker");
          }
          if (!store.indexNames.contains("by-marker-type")) {
            store.createIndex("by-marker-type", "markerType", { unique: false });
          }
        }
      }
    };

    req.onsuccess = () => {
      const db = req.result;
      // Tab lain membuka versi DB yang lebih baru → tutup koneksi ini;
      // operasi berikutnya otomatis buka ulang versi baru.
      db.onversionchange = () => {
        try {
          db.close();
        } catch {
          // ignore
        }
        invalidateDB();
      };
      resolve(db);
    };

    req.onerror = () => {
      invalidateDB();
      reject(req.error);
    };

    req.onblocked = () => {
      // Koneksi versi lama masih terbuka di tab lain — tunggu sampai ditutup.
    };
  });

  return dbPromise;
}

/**
 * Explicit teardown — SATU-SATUNYA tempat db.close() dipanggil.
 * Guard dbPromise=null dipasang SEBELUM close, jadi operasi yang berjalan
 * berikutnya tidak akan memakai handle yang sudah ditutup.
 */
function teardownDB(): void {
  const p = dbPromise;
  invalidateDB();
  if (p) {
    p.then((db) => {
      try {
        db.close();
      } catch {
        // ignore
      }
    }).catch(() => {});
  }
}

// ─── Transaction runner ──────────────────────────────────────────────────────

/**
 * Jalankan operasi di dalam satu transaksi. Write resolve saat
 * tx.oncomplete (commit selesai, bukan cuma request sukses) — jadi tidak
 * ada lagi db.close() di tengah transaksi yang bisa memutus commit.
 */
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

// ─── GENERIC CRUD ──────────────────────────────────────────────────────────

function addItem<Store extends StoreNames>(
  storeName: Store,
  item: DBSchema[Store]["value"]
): Promise<void> {
  return enqueueWrite(storeName, () =>
    runInStore(storeName, "readwrite", (store) => store.put(item), "complete").then(() => undefined)
  );
}

async function getAllItems<Store extends StoreNames>(
  storeName: Store
): Promise<DBSchema[Store]["value"][]> {
  return runInStore(storeName, "readonly", (store) => store.getAll(), "request");
}

async function getItem<Store extends StoreNames>(
  storeName: Store,
  key: string
): Promise<DBSchema[Store]["value"] | undefined> {
  const result = await runInStore(storeName, "readonly", (store) => store.get(key), "request");
  return result ?? undefined;
}

function deleteItem<Store extends StoreNames>(storeName: Store, key: string): Promise<void> {
  return enqueueWrite(storeName, () =>
    runInStore(storeName, "readwrite", (store) => store.delete(key), "complete").then(() => undefined)
  );
}

function clearStore(storeName: StoreNames): Promise<void> {
  return enqueueWrite(storeName, () =>
    runInStore(storeName, "readwrite", (store) => store.clear(), "complete").then(() => undefined)
  );
}

async function countItems(storeName: StoreNames): Promise<number> {
  return runInStore(storeName, "readonly", (store) => store.count(), "request");
}

// ─── Selective migration (jangan wipe semua store) ──────────────────────────

/**
 * Schema version per store. Naikkan hanya saat schema store itu benar-benar
 * berubah. Versi tersimpan di localStorage ("springhub_store_versions") —
 * IndexedDB version bump tidak dipakai karena memaksa upgrade seluruh DB.
 */
const STORES_META: Record<StoreNames, number> = {
  "pending-reports": 1,
  "tracking-points": 2, // index by-marker-type sejak DB v2
  "photo-blobs": 1,
  "form-definitions": 1,
  "tile-manifest": 1,
  "tile-blobs": 1,
  "offline-config": 1,
  "draft-reports": 1,
  "submission-queue": 1,
  "session-cache": 1,
};

/** Store berisi data user (queue/foto/draft) — TIDAK PERNAH dibersihkan saat migrasi versi */
const NEVER_CLEAR_ON_MIGRATE: readonly StoreNames[] = [
  "submission-queue",
  "pending-reports",
  "photo-blobs",
  "draft-reports",
];

/**
 * Migrasi selektif saat versi code berubah. Hanya store yang schema-nya
 * benar-benar berubah yang dibersihkan ulang (di-refetch dari server);
 * store lain — terutama queue & foto user — DIKEEP.
 * Pengganti `indexedDB.deleteDatabase()` — jangan pernah wipe semua store.
 */
async function migrateOnVersionBump(): Promise<string[]> {
  const KEY = "springhub_store_versions";
  let saved: Record<string, number> = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, number>;
  } catch {
    // ignore — mulai fresh
  }

  const changed: string[] = [];
  for (const name of Object.keys(STORES_META) as StoreNames[]) {
    const version = STORES_META[name];
    if ((saved[name] ?? 0) < version && !NEVER_CLEAR_ON_MIGRATE.includes(name)) {
      try {
        await clearStore(name);
        changed.push(name);
      } catch {
        // ignore
      }
    }
  }

  if (changed.length > 0) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...saved, ...STORES_META }));
    } catch {
      // ignore
    }
  }
  return changed;
}

// ─── PUBLIC API ─────────────────────────────────────────────────────────────

export const offlineDB = {
  // ── Idempotency key ─────────────────────────────────────────────────────
  /** UUID tetap untuk satu laporan offline — dipakai server untuk dedupe retry */
  generateCorrelationId: generateCorrelationId,

  // ── Pending Reports ────────────────────────────────────────────────────
  saveReport(report: PendingReport) {
    return addItem("pending-reports", report);
  },

  getAllReports(): Promise<PendingReport[]> {
    return getAllItems("pending-reports");
  },

  getReport(id: string): Promise<PendingReport | undefined> {
    return getItem("pending-reports", id);
  },

  deleteReport(id: string) {
    return deleteItem("pending-reports", id);
  },

  reportCount(): Promise<number> {
    return countItems("pending-reports");
  },

  /**
   * Simpan report ke pending-reports + submission-queue sekaligus.
   * QueueWorker auto-sync dari submission-queue.
   * clientCorrelationId dibuat SEKALI di sini dan dipakai terus antar retry.
   */
  async saveReportAndQueue(
    report: PendingReport,
    photoBlobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }>
  ): Promise<void> {
    const reportWithCorr: PendingReport = report.clientCorrelationId
      ? report
      : { ...report, clientCorrelationId: generateCorrelationId() };
    await addItem("pending-reports", reportWithCorr);
    await addItem("submission-queue", {
      id: reportWithCorr.id,
      formSlug: reportWithCorr.formSlug,
      fieldData: reportWithCorr.fieldData,
      photoBlobs,
      csrfToken: reportWithCorr.csrfToken,
      createdAt: reportWithCorr.createdAt,
      retryCount: 0,
      clientCorrelationId: reportWithCorr.clientCorrelationId,
    });
  },

  // ── Tracking Points ────────────────────────────────────────────────────
  saveTrackingPoint(point: OfflineTrackingPoint) {
    return addItem("tracking-points", point);
  },

  saveTrackingPoints(points: OfflineTrackingPoint[]) {
    return Promise.all(points.map((p) => addItem("tracking-points", p)));
  },

  getAllTrackingPoints(): Promise<OfflineTrackingPoint[]> {
    return getAllItems("tracking-points");
  },

  deleteTrackingPoint(id: string) {
    return deleteItem("tracking-points", id);
  },

  trackingPointCount(): Promise<number> {
    return countItems("tracking-points");
  },

  // ── Photo Blobs ────────────────────────────────────────────────────────
  savePhoto(photo: PhotoBlob) {
    return addItem("photo-blobs", photo);
  },

  getAllPhotos(): Promise<PhotoBlob[]> {
    return getAllItems("photo-blobs");
  },

  getPhotosByReport(reportId: string): Promise<PhotoBlob[]> {
    return getAllItems("photo-blobs").then((photos) =>
      photos.filter((p) => p.reportId === reportId)
    );
  },

  deletePhoto(id: string) {
    return deleteItem("photo-blobs", id);
  },

  photoCount(): Promise<number> {
    return countItems("photo-blobs");
  },

  // ── Form Definitions ───────────────────────────────────────────────────
  saveForm(form: FormDefinition) {
    return addItem("form-definitions", form);
  },

  saveForms(forms: FormDefinition[]) {
    return Promise.all(forms.map((f) => addItem("form-definitions", f)));
  },

  getForm(slug: string): Promise<FormDefinition | undefined> {
    return getItem("form-definitions", slug);
  },

  getAllForms(): Promise<FormDefinition[]> {
    return getAllItems("form-definitions");
  },

  clearForms() {
    return clearStore("form-definitions");
  },

  // ── Tile Manifest ──────────────────────────────────────────────────────
  saveTileRecord(tile: TileRecord) {
    return addItem("tile-manifest", tile);
  },

  saveTileRecords(tiles: TileRecord[]) {
    return Promise.all(tiles.map((t) => addItem("tile-manifest", t)));
  },

  getAllTileRecords(): Promise<TileRecord[]> {
    return getAllItems("tile-manifest");
  },

  clearTileManifest() {
    return clearStore("tile-manifest");
  },

  // ── Tile Blobs (tanpa Service Worker) ────────────────────────────────────
  saveTileBlob(tile: TileBlob) {
    return addItem("tile-blobs", tile);
  },

  saveTileBlobs(tiles: TileBlob[]) {
    return Promise.all(tiles.map((t) => addItem("tile-blobs", t)));
  },

  getTileBlob(url: string): Promise<TileBlob | undefined> {
    return getItem("tile-blobs", url);
  },

  clearTileBlobs() {
    return clearStore("tile-blobs");
  },

  // ── Offline Config ──────────────────────────────────────────────────────
  saveConfig(config: OfflineConfig) {
    return addItem("offline-config", config);
  },

  getConfig(): Promise<OfflineConfig | undefined> {
    return getItem("offline-config", "session-config");
  },

  clearConfig() {
    return deleteItem("offline-config", "session-config");
  },

  // ── Draft Reports ──────────────────────────────────────────────────────
  saveDraft(draft: DraftReport) {
    return addItem("draft-reports", draft);
  },

  getDraft(id: string): Promise<DraftReport | undefined> {
    return getItem("draft-reports", id);
  },

  getAllDrafts(): Promise<DraftReport[]> {
    return getAllItems("draft-reports");
  },

  deleteDraft(id: string) {
    return deleteItem("draft-reports", id);
  },

  draftCount(): Promise<number> {
    return countItems("draft-reports");
  },

  // ── Submission Queue ───────────────────────────────────────────────────
  /**
   * Antrekan laporan offline. clientCorrelationId diisi otomatis (UUID tetap,
   * sama antar retry) kalau belum ada — idempotency key untuk server dedupe.
   */
  queueSubmission(sub: QueuedSubmission) {
    return addItem("submission-queue", {
      ...sub,
      clientCorrelationId: sub.clientCorrelationId || generateCorrelationId(),
    });
  },

  getQueued(id: string): Promise<QueuedSubmission | undefined> {
    return getItem("submission-queue", id);
  },

  /** Semua item antrean (tampilan/status; retry gating ada di getRetryableQueued) */
  getAllQueued(): Promise<QueuedSubmission[]> {
    return getAllItems("submission-queue");
  },

  /** Item yang BOLEH dicoba sekarang: bukan permanent-failed & sudah lewat backoff */
  async getRetryableQueued(now = Date.now()): Promise<QueuedSubmission[]> {
    const all = await getAllItems("submission-queue");
    return all.filter(
      (q) => q.permanentError !== true && q.state !== "failed" && (q.nextRetryAt ?? 0) <= now
    );
  },

  /** Item gagal permanen / cap attempts — tampilkan di UI "perlu perbaikan" */
  async getFailedQueued(): Promise<QueuedSubmission[]> {
    const all = await getAllItems("submission-queue");
    return all.filter((q) => q.permanentError === true || q.state === "failed");
  },

  deleteQueued(id: string) {
    return deleteItem("submission-queue", id);
  },

  queueCount(): Promise<number> {
    return countItems("submission-queue");
  },

  /** Patch selektif satu item antrean (tanpa menimpa field lain) */
  async updateQueued(id: string, patch: Partial<QueuedSubmission>): Promise<void> {
    const item = await getItem("submission-queue", id);
    if (!item) return;
    await addItem("submission-queue", { ...item, ...patch, id: item.id });
  },

  /**
   * Catat satu percobaan GAGAL: retryCount++, failureCount++, attemptedAt,
   * lastError, nextRetryAt = now + backoff (min 5 menit). Setelah
   * MAX_FAILED_ATTEMPTS → state "failed" (tidak dihapus — tampil di UI).
   * Untuk 4xx validasi: kirim { permanent: true } → state "failed" langsung.
   */
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
  },

  /** Isi clientCorrelationId untuk item lama yang belum punya (sebelum idempotency) */
  async backfillCorrelationIds(): Promise<number> {
    const all = await getAllItems("submission-queue");
    let fixed = 0;
    for (const item of all) {
      if (!item.clientCorrelationId) {
        await addItem("submission-queue", {
          ...item,
          clientCorrelationId: generateCorrelationId(),
        });
        fixed++;
      }
    }
    return fixed;
  },

  // ── Session Cache ──────────────────────────────────────────────────────
  saveSession(session: CachedSession) {
    return addItem("session-cache", session);
  },

  getSession(): Promise<CachedSession | undefined> {
    return getItem("session-cache", "user-session");
  },

  clearSession() {
    return deleteItem("session-cache", "user-session");
  },

  // ── Bulk Clear ─────────────────────────────────────────────────────────
  async clearAll() {
    await clearStore("pending-reports");
    await clearStore("tracking-points");
    await clearStore("photo-blobs");
    await clearStore("form-definitions");
    await clearStore("tile-manifest");
    await clearStore("tile-blobs");
    await clearStore("draft-reports");
    await clearStore("submission-queue");
    await deleteItem("offline-config", "session-config");
    await deleteItem("session-cache", "user-session");
  },

  /**
   * LOGOUT: bersihkan semua data USER dari perangkat — session cache,
   * antrean pengiriman, foto, draft, tracking, config survey.
   * Cache GLOBAL (non-user) DIKEEP: form-definitions, tile-manifest, tile-blobs.
   * Idempotent — aman dipanggil berkali-kali.
   */
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

  /**
   * Hapus data sesi survey setelah exit-sync.
   * pending-reports & photo-blobs DIKEEP — kalau ada yang gagal terkirim,
   * QueueWorker yang mencoba lagi (jangan buang data user).
   * submission-queue, draft-reports, form-definitions juga tidak dihapus.
   */
  async clearSessionData() {
    await clearStore("tracking-points");
    await clearStore("tile-manifest");
    await clearStore("tile-blobs");
    await deleteItem("offline-config", "session-config");
    await deleteItem("session-cache", "user-session");
  },

  /**
   * Migrasi selektif saat versi code berubah — ganti `indexedDB.deleteDatabase()`.
   * Hanya store yang schema-nya berubah yang dibersihkan; queue & foto DIKEEP.
   */
  migrateOnVersionBump() {
    return migrateOnVersionBump();
  },

  /**
   * Explicit teardown koneksi (dipakai saat app benar-benar bubar).
   * Operasi berikutnya otomatis membuka koneksi baru — aman dipanggil kapan saja.
   */
  teardown() {
    teardownDB();
  },

  async getStats() {
    const [
      reports,       // pending-reports
      tracks,        // tracking-points
      photos,        // photo-blobs
      forms,         // form-definitions
      tileManifest,  // tile-manifest
      tileBlobs,     // tile-blobs
      configCount,   // offline-config
      drafts,        // draft-reports
      queue,         // submission-queue
      sessions,      // session-cache
    ] = await Promise.all([
      countItems("pending-reports"),
      countItems("tracking-points"),
      countItems("photo-blobs"),
      countItems("form-definitions"),
      countItems("tile-manifest"),
      countItems("tile-blobs"),
      countItems("offline-config"),
      countItems("draft-reports"),
      countItems("submission-queue"),
      countItems("session-cache"),
    ]);
    return { reports, tracks, photos, forms, tiles: tileManifest, tileBlobs, configs: configCount, drafts, queue, sessions };
  },

  // ── Storage check ───────────────────────────────────────────────────────
  async isAvailable(): Promise<boolean> {
    if (typeof indexedDB === "undefined" || typeof window === "undefined") return false;
    try {
      const db = await openDB();
      // Test bahwa transaksi benar-benar bisa jalan (bukan cuma open)
      try {
        const tx = db.transaction("pending-reports", "readonly");
        tx.abort();
      } catch {
        teardownDB();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  async estimateUsage(): Promise<{ used: number; quota: number | null }> {
    if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.estimate) {
      return { used: 0, quota: null };
    }
    try {
      const est = await navigator.storage.estimate();
      return { used: est.usage ?? 0, quota: est.quota ?? null };
    } catch {
      return { used: 0, quota: null };
    }
  },

  // ── Sync Status (localStorage) — kelihatan di HP ────────────────────────
  saveSyncStatus(status: { ok: boolean; message: string; time: number }) {
    try { localStorage.setItem("springhub_sync_status", JSON.stringify(status)); } catch {}
  },

  getSyncStatus(): { ok: boolean; message: string; time: number } | null {
    try {
      const raw = localStorage.getItem("springhub_sync_status");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  clearSyncStatus() {
    try { localStorage.removeItem("springhub_sync_status"); } catch {}
  },
};