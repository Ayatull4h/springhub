const CACHE_NAME = "springhub-v1";
const urlsToCache = [
  "/",
  "/sign-in",
  "/join",
  "/help",
  "/faq",
  "/privacy",
  "/terms",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;
  if (event.request.url.includes("/_next/")) return;
  if (event.request.destination !== "document") return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
