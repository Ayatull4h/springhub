/**
 * IndexedDB wrapper untuk Offline Survey Mode.
 *
 * Stores:
 * - pending-reports   → form submissions saved while offline
 * - tracking-points   → GPS trail points (saved every ~5m)
 * - photo-blobs       → captured photos (blobs, uploaded on exit)
 * - form-definitions  → cached form schema from admin panel
 * - tile-manifest     → record of which OSM tiles are cached
 * - offline-config    → offline session configuration
 *
 * Semua data dihapus setelah berhasil sync keluar.
 */

const DB_NAME = "springhub-offline";
const DB_VERSION = 4;

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

export type QueuedSubmission = {
  id: string;
  formSlug: string;
  fieldData: Record<string, unknown>;
  photoBlobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }>;
  csrfToken: string;
  createdAt: number;
  retryCount: number;
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
};

export type PendingReport = {
  id: string;
  formSlug: string;
  fieldData: Record<string, unknown>;
  photoFieldIds: string[]; // field IDs that have photos
  csrfToken: string;
  guestId: string | null;
  createdAt: number;
};

export type PhotoBlob = {
  id: string;
  reportId: string;
  fieldId: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
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

type StoreNames = keyof DBSchema;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getStore<Store extends StoreNames>(
  db: IDBDatabase,
  name: Store,
  mode: IDBTransactionMode = "readonly"
): IDBObjectStore {
  const tx = db.transaction(name, mode);
  return tx.objectStore(name);
}

// ─── GENERIC CRUD ──────────────────────────────────────────────────────────

async function addItem<Store extends StoreNames>(
  storeName: Store,
  item: DBSchema[Store]["value"]
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, storeName, "readwrite");
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    db.close();
  });
}

async function getAllItems<Store extends StoreNames>(
  storeName: Store
): Promise<DBSchema[Store]["value"][]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    db.close();
  });
}

async function getItem<Store extends StoreNames>(
  storeName: Store,
  key: string
): Promise<DBSchema[Store]["value"] | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? undefined);
    req.onerror = () => reject(req.error);
    db.close();
  });
}

async function deleteItem<Store extends StoreNames>(
  storeName: Store,
  key: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, storeName, "readwrite");
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    db.close();
  });
}

async function clearStore(storeName: StoreNames): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, storeName, "readwrite");
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    db.close();
  });
}

async function countItems(storeName: StoreNames): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, storeName);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    db.close();
  });
}

// ─── PUBLIC API ─────────────────────────────────────────────────────────────

export const offlineDB = {
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
  queueSubmission(sub: QueuedSubmission) {
    return addItem("submission-queue", sub);
  },

  getAllQueued(): Promise<QueuedSubmission[]> {
    return getAllItems("submission-queue");
  },

  deleteQueued(id: string) {
    return deleteItem("submission-queue", id);
  },

  queueCount(): Promise<number> {
    return countItems("submission-queue");
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
  },

  async getStats() {
    const [reports, tracks, photos, forms, tiles, configs, drafts, queue] = await Promise.all([
      countItems("pending-reports"),
      countItems("tracking-points"),
      countItems("photo-blobs"),
      countItems("form-definitions"),
      countItems("tile-manifest"),
      countItems("tile-blobs"),
      countItems("offline-config"),
      countItems("draft-reports"),
      countItems("submission-queue"),
    ]);
    return { reports, tracks, photos, forms, tiles, configs, drafts, queue };
  },

  // ── Storage check ───────────────────────────────────────────────────────
  async isAvailable(): Promise<boolean> {
    if (typeof indexedDB === "undefined" || typeof window === "undefined") return false;
    try {
      const db = await openDB();
      // Test bahwa transaksi benar-benar bisa jalan (bukan cuma open)
      // INI HARUS SEBELUM db.close() — db yang sudah ditutup gak bisa dipake!
      try {
        const tx = db.transaction("pending-reports", "readonly");
        tx.abort();
      } catch {
        db.close();
        return false;
      }
      db.close();
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
};
