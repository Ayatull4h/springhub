import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { addWatermark } from "./watermark";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type UploadResult = {
  url: string;
  path: string;
  width: number;
  height: number;
};

/**
 * Detect image MIME type from file bytes (magic bytes signature).
 * Fallback jika file.type kosong atau tidak dikenali.
 */
function detectMimeFromBuffer(buffer: Buffer): string {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return "image/webp";
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return "image/gif";
  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return "image/bmp";
  // Default
  return "image/jpeg";
}

export async function uploadPhoto(
  file: File,
  folder: string = "reports"
): Promise<UploadResult> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Ukuran foto maksimal 10MB");
  }

  const arrayBuffer = await file.arrayBuffer();
  const initialBuffer = Buffer.from(arrayBuffer);

  // Detect MIME from file bytes (more reliable than file.type on Chrome Android)
  const detectedMime = detectMimeFromBuffer(initialBuffer);
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(detectedMime)) {
    throw new Error(
      `Format foto harus JPG, PNG, atau WebP (terdeteksi: ${detectedMime})`
    );
  }

  // Step 1: resize & compress
  const compressed = await sharp(initialBuffer)
    .resize(1280, 720, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .withMetadata({ exif: undefined })
    .toBuffer();

  // Step 2: add watermark
  const watermarked = await addWatermark(compressed);

  const metadata = await sharp(watermarked).metadata();

  const ext = "jpg";
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("photos")
    .upload(filename, watermarked, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
    });

  if (error) throw new Error(`Upload gagal: ${error.message}`);

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(filename);

  return {
    url: urlData.publicUrl,
    path: filename,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

export async function deletePhoto(path: string): Promise<void> {
  await supabase.storage.from("photos").remove([path]);
}
