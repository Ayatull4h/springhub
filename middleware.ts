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

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  let session: { userId: string; role: string } | null = null;

  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, SECRET);
      session = payload as unknown as { userId: string; role: string };
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

  if (pathname === PROJECT_CREATE) {
    if (!session) {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/profile") {
    if (!session) {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
