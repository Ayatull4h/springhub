/**
 * SpringHub Service Worker v3 — Offline Survey Mode
 *
 * Caches:
 * - STATIC: /_next/static/* (app shell — JS/CSS chunks)
 * - PAGES: / (landing), /report/* (forms), /offline (survey page)
 * - TILES: *.tile.openstreetmap.org/* (map tiles for survey area)
 * - FONTS: fonts and svg assets
 *
 * Strategies:
 * - Static assets → Cache-First (installed at SW install)
 * - Navigations → Network-First with cache fallback
 * - Map tiles → Cache-First (pre-cached by area setup)
 * - API calls → Network-Only (not cached)
 */

const CACHE_NAMES = {
  STATIC: "springhub-static-v3",
  PAGES: "springhub-pages-v3",
  TILES: "springhub-tiles-v3",
  ASSETS: "springhub-assets-v3",
};

const ALL_CACHES = Object.values(CACHE_NAMES);

// ─── HELPER: Quota check ─────────────────────────────────────────────────────
async function isStorageQuotaOk(minBytes) {
  try {
    const est = await navigator.storage.estimate();
    const quota = est.quota || 0;
    const usage = est.usage || 0;
    const available = quota - usage;
    return available >= minBytes;
  } catch {
    return true; // Assume OK if we can't check
  }
}

// ─── INSTALL ───────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      // Pre-cache core app shell assets
      return cache.addAll([
        "/",
        "/offline",
        "/sign-in",
        "/join",
      ]).catch((err) => {
        // Individual asset may fail — SW still activates
        console.warn("[SW] Pre-cache partial failure:", err);
      });
    })
  );
});

// ─── ACTIVATE ──────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH STRATEGIES ──────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ── API calls: never cache ────────────────────────────────────────────
  if (url.pathname.startsWith("/api/")) {
    return; // network-only
  }

  // ── Map tiles: cache-first ────────────────────────────────────────────
  if (url.hostname.includes("tile.openstreetmap.org")) {
    event.respondWith(tileStrategy(event.request));
    return;
  }

  // ── Static assets (_next/static): cache-first ─────────────────────────
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(staticStrategy(event.request));
    return;
  }

  // ── Fonts and images: cache-first ─────────────────────────────────────
  if (
    url.pathname.match(/\.(woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/i) ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/favicon.png"
  ) {
    event.respondWith(assetsStrategy(event.request));
    return;
  }

  // ── Navigations (HTML pages): network-first, cache fallback ───────────
  if (event.request.mode === "navigate") {
    event.respondWith(navStrategy(event.request));
    return;
  }
});

// ─── STRATEGY IMPLEMENTATIONS ─────────────────────────────────────────────

/** Static assets (_next/static): cache-first, network fallback */
async function staticStrategy(request) {
  const cached = await caches.match(request, { cacheName: CACHE_NAMES.STATIC });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

/** Map tiles: cache-first */
async function tileStrategy(request) {
  const cached = await caches.match(request, { cacheName: CACHE_NAMES.TILES });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.TILES);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a transparent 1x1 pixel tile as fallback
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect fill="#f0f0f0" width="256" height="256"/><line x1="0" y1="256" x2="256" y2="0" stroke="#ddd" stroke-width="1"/></svg>',
      { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } }
    );
  }
}

/** Fonts, icons, favicon: cache-first */
async function assetsStrategy(request) {
  const cached = await caches.match(request, { cacheName: CACHE_NAMES.ASSETS });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.ASSETS);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 404 });
  }
}

/** Page navigations: network-first, cache fallback */
async function navStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.PAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName: CACHE_NAMES.PAGES });
    if (cached) return cached;

    // If page not in cache, serve /offline as fallback
    const offlineFallback = await caches.match("/offline", { cacheName: CACHE_NAMES.PAGES });
    if (offlineFallback) return offlineFallback;

    return new Response("Offline", { status: 503 });
  }
}

// ─── BACKGROUND SYNC ───────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-reports") {
    event.waitUntil(syncPendingReports());
  }
});

async function syncPendingReports() {
  // Background sync handler — reads from IndexedDB and submits
  // Note: actual sync logic runs in client via NetworkWatcher.
  // SW sync is a fallback for Chromium browsers.
  try {
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) {
      client.postMessage({ type: "sync-pending-reports" });
    }
  } catch {
    // Silently fail — client will handle sync via online event
  }
}

// ─── MESSAGE HANDLER ───────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "precache-tiles") {
    event.waitUntil(precacheTiles(event.data.tiles));
  }

  if (event.data?.type === "clear-tiles") {
    event.waitUntil(
      caches.delete(CACHE_NAMES.TILES)
    );
  }

  if (event.data?.type === "clear-all") {
    event.waitUntil(
      Promise.all(ALL_CACHES.map((name) => caches.delete(name)))
    );
  }
});

/** Pre-cache a batch of tile URLs (sent from offline-setup.tsx) */
async function precacheTiles(tileUrls) {
  // Safari 50MB limit — check quota first (tiles ~20KB each)
  const ONE_TILE_BYTES = 20 * 1024;
  const needed = tileUrls.length * ONE_TILE_BYTES;
  if (!(await isStorageQuotaOk(needed))) {
    console.warn("[SW] Insufficient storage quota for tiles, skipping cache");
    return;
  }

  const cache = await caches.open(CACHE_NAMES.TILES);

  // Process in batches of 20 to avoid overwhelming the network
  const BATCH_SIZE = 20;
  for (let i = 0; i < tileUrls.length; i += BATCH_SIZE) {
    const batch = tileUrls.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch {
          // Skip failed tiles
        }
      })
    );
  }
}
