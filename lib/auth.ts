import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret, verifyJwtWithRotation } from "./jwt";
import { prisma } from "./prisma";

const SESSION_COOKIE = "session";
const SESSION_DURATION_SEC = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  role: string;
  username: string;
  phone?: string;
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

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function createSession(payload: SessionPayload, isSecure?: boolean): Promise<string> {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid session payload");
  }
  const jwtPayload: JWTPayload = {
    userId: payload.userId,
    role: payload.role,
    username: payload.username,
    phone: payload.phone || "",
  };
  const secret = getJwtSecret();
  const token = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION_SEC}s`)
    .sign(secret);

  // Session ledger: row must exist and be unexpired for the JWT to be accepted.
  // Store only the SHA-256 hash of the token in the database.
  await prisma.session.create({
    data: {
      profileId: payload.userId,
      token: sha256Hex(token),
      expiresAt: new Date(Date.now() + SESSION_DURATION_SEC * 1000),
    },
  });

  const cookieStore = await cookies();
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
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await prisma.session.updateMany({
        where: { token: sha256Hex(token) },
        data: { expiresAt: new Date(0) },
      });
    } catch (err) {
      console.warn("[auth] Failed to revoke session ledger row:", err);
    }
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isSecure ?? true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

export async function deactivateUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { profileId: userId },
    data: { expiresAt: new Date(0) },
  });
}

/**
 * Cek apakah IP request termasuk dalam whitelist admin.
 * Set ADMIN_ALLOWED_IPS di .env dengan format: "192.168.1.1,10.0.0.0/8"
 * Kosongkan (atau tidak diset) untuk mengizinkan semua IP.
 * Fail-closed: jika whitelist diset tapi IP tidak terdeteksi/tidak valid → DENY.
 */
export function getClientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real && ipv4ToInt(real) !== null) return real;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first && ipv4ToInt(first) !== null) return first;
  }
  return "unknown";
}

function ipv4ToInt(ip: string): number | null {
  let value = ip.trim();
  if (value.toLowerCase().startsWith("::ffff:")) value = value.slice(7);
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(value);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  if (octets.some((o) => o > 255)) return null;
  return ((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3];
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  const [rangeIp, prefixStr] = cidr.split("/");
  const prefix = prefixStr ? Number(prefixStr) : 32;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(rangeIp);
  if (ipInt === null || rangeInt === null) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

export function isAdminIpAllowed(request: Request): boolean {
  const allowedCidrs = process.env.ADMIN_ALLOWED_IPS;
  if (!allowedCidrs) return true; // Tidak ada whitelist → izinkan semua

  const ranges = allowedCidrs.split(",").map(s => s.trim()).filter(Boolean);
  if (ranges.length === 0) return true;

  const ip = getClientIp(request);
  if (ip === "unknown" || ipv4ToInt(ip) === null) return false; // fail-closed

  return ranges.some(range => isIpInCidr(ip, range));
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
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

    // Revocation ledger: token hash must have an active, unexpired Session row.
    const row = await prisma.session.findUnique({
      where: { token: sha256Hex(token) },
      select: { expiresAt: true },
    });
    if (!row || row.expiresAt.getTime() < Date.now()) return null;

    return { userId: p.userId, role: p.role, username: p.username, phone: (p.phone as string) || "" };
  } catch {
    return null;
  }
}
