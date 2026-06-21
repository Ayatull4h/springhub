/**
 * Session Cache — menyimpan sesi user di IndexedDB sebagai fallback PWA.
 *
 * Masalah: PWA standalone mode di beberapa browser tidak mengirim cookie
 * HTTP-only. Akibatnya, /api/auth/me return null meskipun user sudah login.
 *
 * Solusi:
 * 1. Setelah login sukses → cache session ke IndexedDB (offlineDB.saveSession)
 * 2. SiteHeader coba fetch /api/auth/me dulu
 * 3. Jika null → fallback ke IndexedDB cached session
 * 4. Tampilkan user sebagai "logged in (offline)" jika dari cache
 */

import { offlineDB, type CachedSession } from "./offline-db";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari (sama dengan cookie)

/**
 * Coba fetch sesi dari API. Jika sukses, cache ke IndexedDB.
 * Jika API return null, fallback ke IndexedDB.
 */
export async function fetchAndCacheSession(): Promise<{
  user: {
    id: string;
    username: string;
    role: string;
    points?: number;
  } | null;
  fromCache: boolean;
}> {
  // 1. Coba dari API dulu
  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        // Cache ke IndexedDB untuk PWA offline fallback
        const session: CachedSession = {
          id: "user-session",
          userId: data.user.id || data.user.email,
          username: data.user.username || "User",
          role: data.user.role || "volunteer",
          csrfToken: "",
          cachedAt: Date.now(),
        };
        try {
          await offlineDB.saveSession(session);
        } catch {
          // Non-critical — session tetap work walau gagal cache
        }
        return { user: data.user, fromCache: false };
      }
    }
  } catch {
    // API gagal (offline) — lanjut ke cache
  }

  // 2. Fallback: coba dari IndexedDB
  try {
    const cached = await offlineDB.getSession();
    if (cached && Date.now() - cached.cachedAt < SESSION_MAX_AGE_MS) {
      return {
        user: {
          id: cached.userId,
          username: cached.username,
          role: cached.role,
        },
        fromCache: true,
      };
    }
  } catch {
    // IndexedDB tidak tersedia
  }

  return { user: null, fromCache: false };
}
