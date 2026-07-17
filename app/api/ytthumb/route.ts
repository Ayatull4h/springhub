import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SIZES = ["maxresdefault", "hqdefault", "mqdefault", "sddefault"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const videoId = url.searchParams.get("videoId");
  const quality = url.searchParams.get("quality") || "hqdefault";

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return new NextResponse(null, { status: 400 });
  }

  const preferred = SIZES.includes(quality) ? quality : "hqdefault";
  const tryOrder = [preferred, ...SIZES.filter(s => s !== preferred)];

  for (const size of tryOrder) {
    try {
      const imgUrl = `https://i.ytimg.com/vi/${videoId}/${size}.jpg`;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(imgUrl, { signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": res.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch {
      continue;
    }
  }

  return new NextResponse(null, { status: 404 });
}
