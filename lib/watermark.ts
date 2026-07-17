import sharp from "sharp";

const WATERMARK_TEXT = "@jaga_semesta";

function createWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(12, Math.round(width / 30));
  const padding = Math.max(8, Math.round(fontSize / 3));

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text { fill: white; font-size: ${fontSize}px; font-family: Arial, sans-serif;
                font-weight: bold; opacity: 0.6; }
      </style>
      <text x="${padding}" y="${height - padding - 4}" class="text">${WATERMARK_TEXT}</text>
    </svg>
  `;

  return Buffer.from(svg);
}

export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1280;
  const height = metadata.height || 720;

  const svgOverlay = createWatermarkSvg(width, height);

  return sharp(imageBuffer)
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .toBuffer();
}
