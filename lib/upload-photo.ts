import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

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

export async function uploadPhoto(
  file: File,
  folder: string = 'reports'
): Promise<UploadResult> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format foto harus JPG, PNG, atau WebP');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Ukuran foto maksimal 10MB');
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const compressed = await sharp(buffer)
    .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .withMetadata({ exif: undefined })
    .toBuffer();

  const metadata = await sharp(compressed).metadata();

  const ext = 'jpg';
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(filename, compressed, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
    });

  if (error) throw new Error(`Upload gagal: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(filename);

  return {
    url: urlData.publicUrl,
    path: filename,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}
