"use client";

/**
 * Kompres foto di HP SEBELUM disimpan ke IndexedDB / dikirim.
 * Tanpa ini, foto kamera 5–12MB (apalagi HEIC iPhone) cepat menghabiskan
 * kuota IndexedDB — apalagi di mode Incognito iOS yang kuotanya kecil.
 * Pola yang sama dipakai offline-survey-map (terbukti di iOS) dan queue-worker.
 */

export async function compressImageBlob(
  blob: Blob,
  maxDimension = 1280,
  quality = 0.8
): Promise<Blob> {
  // Lewati file yang sudah kecil & format standar — hemat CPU/baterai
  if (
    blob.size <= 2 * 1024 * 1024 &&
    ["image/jpeg", "image/png", "image/webp"].includes(blob.type)
  ) {
    return blob;
  }

  try {
    if (typeof createImageBitmap !== "undefined") {
      try {
        const bitmap = await createImageBitmap(blob);
        try {
          const scale = Math.min(
            1,
            maxDimension / Math.max(bitmap.width, bitmap.height)
          );
          // Sudah kecil — kembalikan asli
          if (scale >= 1 && blob.size <= 2 * 1024 * 1024) return blob;
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const out = await new Promise<Blob | null>((res) =>
              canvas.toBlob(res, "image/jpeg", quality)
            );
            if (out && out.size > 0) return out;
          }
        } finally {
          bitmap.close();
        }
      } catch {
        // createImageBitmap gagal (mis. HEIC di Chrome) — lanjut ke <img>
      }
    }

    // Fallback <img> + object URL (terbukti jalan di iOS Safari / WebView)
    const compressed = await compressViaImageElement(blob, maxDimension, quality);
    if (compressed && compressed.size > 0) return compressed;
  } catch {
    // abaikan — fallback di bawah
  }
  return blob;
}

function compressViaImageElement(
  blob: Blob,
  maxDimension: number,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    let resolved = false;
    const done = (b: Blob | null) => {
      if (resolved) return;
      resolved = true;
      URL.revokeObjectURL(url);
      resolve(b);
    };
    // Safety timeout — beberapa WebView kadang hang
    const timer = setTimeout(() => done(null), 10000);
    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      try {
        const scale = Math.min(
          maxDimension / img.width,
          maxDimension / img.height,
          1
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return done(null);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => done(b || null), "image/jpeg", quality);
        setTimeout(() => {
          canvas.toBlob((b2) => done(b2 || null), "image/jpeg", quality);
        }, 3000);
      } catch {
        done(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    img.src = url;
  });
}

/** Bungkus hasil kompres jadi File (untuk preview & state form). */
export async function compressImageFile(file: File): Promise<File> {
  const blob = await compressImageBlob(file);
  if (blob === file) return file;
  const name = file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg";
  try {
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
