import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret, getJwtSecrets, verifyJwtWithRotation } from "./jwt";

const SECRET = getJwtSecret();

const SESSION_COOKIE = "session";
const SESSION_DURATION_SEC = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  role: string;
  username: string;
};

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "admin";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload, isSecure?: boolean): Promise<string> {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid session payload");
  }
  const jwtPayload: JWTPayload = {
    userId: payload.userId,
    role: payload.role,
    username: payload.username,
  };
  const token = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION_SEC}s`)
    .sign(SECRET);

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecure ?? true,
    sameSite: "lax",
    maxAge: SESSION_DURATION_SEC,
    path: "/",
  });

  return token;
}

export async function destroySession(isSecure?: boolean): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isSecure ?? true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Cek apakah IP request termasuk dalam whitelist admin.
 * Set ADMIN_ALLOWED_IPS di .env dengan format: "192.168.1.1,10.0.0.0/8"
 * Kosongkan (atau tidak diset) untuk mengizinkan semua IP.
 */
export function isAdminIpAllowed(request: Request): boolean {
  const allowedCidrs = process.env.ADMIN_ALLOWED_IPS;
  if (!allowedCidrs) return true; // Tidak ada whitelist → izinkan semua

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  if (!ip) return true; // IP tidak terdeteksi → izinkan (hindari lockout)

  const ranges = allowedCidrs.split(",").map(s => s.trim()).filter(Boolean);
  if (ranges.length === 0) return true;

  // Simple IP match (CIDR parsing bisa ditambah nanti)
  return ranges.some(range => {
    if (range.includes("/")) {
      // CIDR — basic prefix check
      const [baseIp] = range.split("/");
      return ip.startsWith(baseIp.substring(0, baseIp.lastIndexOf(".")));
    }
    return ip === range;
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    // Coba verifikasi dengan current + previous key (rotasi support)
    const result = await verifyJwtWithRotation<JWTPayload>(token, (secret) =>
      jwtVerify(token, secret).then((r) => r.payload)
    );

    if (!result) return null;
    const payload = result.payload;

    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (
      typeof p.userId !== "string" ||
      typeof p.role !== "string" ||
      typeof p.username !== "string"
    ) {
      return null;
    }
    return { userId: p.userId, role: p.role, username: p.username };
  } catch {
    return null;
  }
}
