import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "springhub-dev-secret-key-change-in-production"
);

const SESSION_COOKIE = "session";
const GUEST_COOKIE = "guest_session_id";

const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/sign-in", "/join"];
const REPORT_ROUTES = ["/report"];
const PROJECT_CREATE = "/projects/new";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session token
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  let session: { userId: string; role: string } | null = null;

  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, SECRET);
      session = payload as unknown as { userId: string; role: string };
    } catch {
      // Invalid token, continue as guest
    }
  }

  // Ensure guest cookie exists for all visitors
  if (!request.cookies.get(GUEST_COOKIE)?.value) {
    // Guest cookie will be set by the guest utility when needed
  }

  // Admin routes — require admin role
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "admin") {
      // Redirect to sign-in with return URL
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Auth routes — redirect to home if already logged in
  if (AUTH_ROUTES.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Report form routes — accessible to all (guest or logged in)
  if (pathname.startsWith("/report/")) {
    // Allow all — guests can submit too
    return NextResponse.next();
  }

  // Project creation — requires login
  if (pathname === PROJECT_CREATE) {
    if (!session) {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Profile page — requires login
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
