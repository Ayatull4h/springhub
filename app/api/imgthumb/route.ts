import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Host yang boleh di-proxy (thumbnail media eksternal).
// Pola sama seperti /api/ytthumb: fetch server-side lalu cache,
// supaya tidak kena hotlink-protection / flakiness CDN di browser.
const ALLOWED_HOSTS = [
  "greennetwork.id",
  "blogger.googleusercontent.com",
  "images.unsplash.com",
  "upload.wikimedia.org",
];

function hostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((a) => h === a || h.endsWith(`.${a}`));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const src = url.searchParams.get("url");
  if (!src) {
    return new NextResponse(null, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if ((target.protocol !== "http:" && target.protocol !== "https:") || !hostAllowed(target.hostname)) {
    return new NextResponse(null, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "SpringHub/1.0 (+https://www.springhub.id)" },
    });
    clearTimeout(t);
    if (!res.ok) {
      return new NextResponse(null, { status: 502 });
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new NextResponse(null, { status: 502 });
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return new NextResponse(null, { status: 502 });
    }
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
