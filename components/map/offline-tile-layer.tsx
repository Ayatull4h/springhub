"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { TileLayer, useMap } from "react-leaflet";
import { offlineDB } from "@/lib/offline-db";

/**
 * TileLayer yang bisa load tile dari IndexedDB saat offline.
 *
 * - Online: fetch tile normal dari OpenStreetMap
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
    // Simpan reference ke original createTile
    const OrigTileLayer = L.TileLayer as any;
    const origCreateTile = OrigTileLayer.prototype.createTile;

    // Override createTile untuk intervensi offline
    // GUARD: _getUrlForCoord adalah method internal Leaflet yang bisa berubah antar versi.
    // Jika method tidak tersedia, fallback konstruksi URL manual.
    OrigTileLayer.prototype.createTile = function (coords: any, done: Function) {
      let tileUrl: string;
      try {
        if (typeof this._getUrlForCoord === "function") {
          tileUrl = this._getUrlForCoord(coords);
        } else {
          // Fallback: konstruksi URL tile manual
          tileUrl = `https://{s}.tile.openstreetmap.org/${coords.z}/${coords.x}/${coords.y}.png`
            .replace("{s}", ["a", "b", "c"][Math.floor(Math.random() * 3)]);
        }
      } catch {
        // Ultimate fallback jika _getUrlForCoord error
        tileUrl = `https://a.tile.openstreetmap.org/${coords.z}/${coords.x}/${coords.y}.png`;
      }

      const tile = document.createElement("img");

      if (!navigator.onLine) {
        offlineDB.getTileBlob(tileUrl).then((cached) => {
          if (cached?.blob) {
            const url = URL.createObjectURL(cached.blob);
            tile.src = url;
            setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 1000);
            done(null, tile);
          } else {
            tile.src = "";
            done(null, tile);
          }
        }).catch(() => {
          tile.src = "";
          done(null, tile);
        });
      } else {
        tile.src = tileUrl;
        tile.onload = () => done(null, tile);
        tile.onerror = () => done(null, tile);
      }
      return tile;
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
