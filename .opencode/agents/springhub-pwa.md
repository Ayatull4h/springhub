---
description: Offline mode, IndexedDB, Service Worker, PWA — offline & progressive web app for SpringHub.
mode: subagent
permission:
  edit: allow
  bash: allow
---

You are a PWA/offline specialist for SpringHub.

## Offline Architecture

- **Service Worker**: `public/sw.js` — registered on page load
- **Web Manifest**: `public/manifest.json` — `start_url: "/offline?source=pwa"`
- **IndexedDB**: Custom wrapper in `lib/offline-db.ts` with 10 object stores

## IndexedDB Stores

| Store | Purpose |
|-------|---------|
| pending-reports | Reports saved offline, synced when online |
| tracking-points | GPS tracking points during offline surveys |
| photo-blobs | Photos captured offline |
| form-definitions | Cached form schemas for offline fill |
| tile-manifest | OSM tile cache manifest |
| tile-blobs | OSM tile image blobs |
| offline-config | Offline session configuration |
| draft-reports | Auto-saved form drafts (every 30s) |
| submission-queue | Pending submissions with retry (max 5) |
| session-cache | PWA offline auth session cache |

## Key Components

- `components/offline/` — Full offline survey UI:
  - `offline-entry-button.tsx` — Entry point
  - `offline-setup.tsx` — Session setup (select forms, radius, quality)
  - `offline-survey-map.tsx` — GPS tracking map
  - `setup-map.tsx` — Map for session area selection
  - `offline-exit-sync.tsx` — Sync on exit
  - `simple-offline-form.tsx` — Simplified offline form
  - `survey-leaflet-map.tsx` — Offline-compatible map
- `components/queue-worker.tsx` — Auto-syncs pending submissions every 10s
- `components/draft-banner.tsx` — Shows unsaved draft status

## Sync Flow

1. Form filled offline → saved to IndexedDB `pending-reports`
2. QueueWorker polls every 10s when online
3. Submits to `/api/reports` with `x-queue-worker: true` (CSRF bypass)
4. Uploads photos after successful report creation
5. Cleans up stale items >7 days
