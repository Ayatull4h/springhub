import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/jwt";

const SECRET = getJwtSecret();

const SESSION_COOKIE = "session";
const GUEST_COOKIE = "guest_session_id";

const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/sign-in", "/join"];
const PROJECT_CREATE = "/projects/new";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes: prevent CDN caching so data always fresh
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  let session: { userId: string; role: string } | null = null;

  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, SECRET);
      if (!payload || typeof payload !== "object") {
        session = null;
      } else {
        const p = payload as Record<string, unknown>;
        session = {
          userId: typeof p.userId === "string" ? p.userId : "",
          role: typeof p.role === "string" ? p.role : "user",
        };
      }
    } catch {
      // Invalid token
    }
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
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
