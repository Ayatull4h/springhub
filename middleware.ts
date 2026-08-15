import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { verifyJwtWithRotation } from "@/lib/jwt";

const SESSION_COOKIE = "session";
const GUEST_COOKIE = "guest_session_id";

const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/sign-in", "/join"];
const PROJECT_CREATE = "/projects/new";

function ipv4ToInt(ip: string): number | null {
  let value = ip.trim();
  if (value.toLowerCase().startsWith("::ffff:")) value = value.slice(7);
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(value);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  if (octets.some((o) => o > 255)) return null;
  return ((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3];
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [rangeIp, prefixStr] = cidr.split("/");
  const prefix = prefixStr ? Number(prefixStr) : 32;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(rangeIp);
  if (ipInt === null || rangeInt === null) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

// x-real-ip diset oleh nginx dan tidak bisa dipalsukan dari luar.
// x-forwarded-for hanya dipakai sebagai fallback (misal request langsung ke VPS).
function getClientIp(request: NextRequest): string {
  const real = request.headers.get("x-real-ip");
  if (real && ipv4ToInt(real) !== null) return real;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first && ipv4ToInt(first) !== null) return first;
  }
  return "";
}

// Fail-closed: whitelist diset tapi IP tidak valid/tidak terdeteksi → DENY.
function isAllowedIp(ip: string, ranges: string[]): boolean {
  if (ip === "" || ipv4ToInt(ip) === null) return false;
  return ranges.some((range) => isIpInCidr(ip, range));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  let session: { userId: string; role: string } | null = null;

  if (sessionToken) {
    try {
      const result = await verifyJwtWithRotation<JWTPayload>(sessionToken, (secret) =>
        jwtVerify(sessionToken, secret).then((r) => r.payload)
      );
      if (result?.payload && typeof result.payload === "object") {
        const p = result.payload as Record<string, unknown>;
        session = {
          userId: typeof p.userId === "string" ? p.userId : "",
          role: typeof p.role === "string" ? p.role : "user",
        };
      }
    } catch {
      // Invalid token
    }
  }

  // API routes: prevent CDN caching so data always fresh
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // Admin API: role + IP whitelist (H-3 — middleware sebelumnya tidak menjangkau /api/)
    if (pathname.startsWith("/api/admin/")) {
      if (!session || session.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      const allowedCidrs = process.env.ADMIN_ALLOWED_IPS;
      if (allowedCidrs) {
        const ranges = allowedCidrs.split(",").map(s => s.trim()).filter(Boolean);
        if (ranges.length > 0 && !isAllowedIp(getClientIp(request), ranges)) {
          return NextResponse.json({ error: "Access denied: IP not allowed" }, { status: 403 });
        }
      }
    }
    return response;
  }

  if (!request.cookies.get(GUEST_COOKIE)?.value) {
    // Guest cookie will be set by the guest utility when needed
  }

  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "admin") {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // IP whitelist untuk admin (optional)
    const allowedCidrs = process.env.ADMIN_ALLOWED_IPS;
    if (allowedCidrs) {
      const ranges = allowedCidrs.split(",").map(s => s.trim()).filter(Boolean);
      if (ranges.length > 0 && !isAllowedIp(getClientIp(request), ranges)) {
        return new NextResponse("Access denied: IP not allowed", { status: 403 });
      }
    }
  }

  if (AUTH_ROUTES.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/report/")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
