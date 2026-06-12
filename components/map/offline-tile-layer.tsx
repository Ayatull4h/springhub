"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { TileLayer, useMap } from "react-leaflet";
import { offlineDB } from "@/lib/offline-db";

/**
 * TileLayer yang bisa load tile dari IndexedDB saat offline.
 *
 * - Online: pakai implementasi asli Leaflet (getTileUrl, crossorigin, alt, dll)
 * - Offline: load tile dari IndexedDB (tile-blobs store)
 */
export function OfflineTileLayer() {
  const map = useMap();
  const isOfflineRef = useRef(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      isOfflineRef.current = !navigator.onLine;
    };
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const OrigTileLayer = L.TileLayer as any;
    const origCreateTile = OrigTileLayer.prototype.createTile;

    OrigTileLayer.prototype.createTile = function (coords: any, done: Function) {
      // Mode offline: ambil tile dari IndexedDB
      if (!navigator.onLine) {
        const tileUrl = this.getTileUrl(coords);
        const tile = document.createElement("img");

        offlineDB.getTileBlob(tileUrl).then((cached) => {
          if (cached?.blob) {
            const url = URL.createObjectURL(cached.blob);
            tile.src = url;
            setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 1000);
          }
          done(null, tile);
        }).catch(() => {
          done(null, tile);
        });

        return tile;
      }

      // Mode online: pakai createTile asli Leaflet (crossOrigin, alt, referrerPolicy, dll berfungsi normal)
      return origCreateTile.call(this, coords, done);
    };

    return () => {
      OrigTileLayer.prototype.createTile = origCreateTile;
    };
  }, [map]);

  return (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    />
  );
}
