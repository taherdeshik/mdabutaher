import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { makeId, mutate, read, type AdminRole, type AdminUser } from "@/lib/store";

export type Actor = {
  id: string;
  name: string;
  username: string;
  role: AdminRole;
  wardId?: string;
  legacy?: boolean;
};

const SESSION_DAYS = 7;
const KEY = "scrypt";

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${KEY}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== KEY || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const computed = crypto.scryptSync(password, salt, 64);
  return expected.length === computed.length && crypto.timingSafeEqual(expected, computed);
}

function token() {
  return crypto.randomBytes(32).toString("hex");
}

function actor(user: AdminUser): Actor {
  return { id: user.id, name: user.name, username: user.username, role: user.role, wardId: user.wardId };
}

/** First-run bootstrap: create the owner account from env on the first login. */
export async function ensureOwner() {
  return mutate((db) => {
    if (!db.adminUsers.length) {
      db.adminUsers.push({
        id: makeId("USR"),
        name: process.env.ADMIN_NAME || "প্রধান অ্যাডমিন",
        username: (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase(),
        passwordHash: hashPassword(process.env.ADMIN_PASSWORD || "mahadan-2027"),
        role: "owner",
        active: true,
        createdAt: new Date().toISOString(),
      });
    }
    const now = new Date().toISOString();
    db.adminSessions = db.adminSessions.filter((s) => s.expiresAt > now);
    return db.adminUsers.length;
  });
}

export async function login(username: string, password: string, userAgent = "") {
  await ensureOwner();
  const db = await read();
  const user = db.adminUsers.find((u) => u.username === username.trim().toLowerCase() && u.active);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;

  const t = token();
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_DAYS * 86_400_000).toISOString();
  await mutate((state) => {
    const fresh = state.adminUsers.find((u) => u.id === user.id);
    if (fresh) fresh.lastLoginAt = new Date(now).toISOString();
    state.adminSessions.push({
      token: t,
      userId: user.id,
      createdAt: new Date(now).toISOString(),
      expiresAt,
      userAgent: userAgent.slice(0, 160) || undefined,
    });
    // keep the table small: drop expired plus oldest surplus sessions
    state.adminSessions = state.adminSessions
      .filter((s) => s.expiresAt > new Date().toISOString())
      .slice(-120);
  });

  return { token: t, user: actor(user) };
}

export async function actorFromRequest(req: NextRequest): Promise<Actor | null> {
  const provided =
    req.headers.get("x-admin-key") ||
    req.cookies.get("mat_admin")?.value ||
    (req.method === "GET" ? req.nextUrl.searchParams.get("key") : null);
  if (!provided) return null;

  // Legacy single-key mode is opt-in only (set ADMIN_KEY in the environment).
  const legacy = process.env.ADMIN_KEY;
  if (legacy && provided === legacy) {
    return { id: "legacy", name: "Legacy Admin", username: "legacy", role: "owner", legacy: true };
  }

  const db = await read();
  const session = db.adminSessions.find((s) => s.token === provided && s.expiresAt > new Date().toISOString());
  if (!session) return null;
  const user = db.adminUsers.find((u) => u.id === session.userId && u.active);
  return user ? actor(user) : null;
}

export async function logout(req: NextRequest) {
  const provided =
    req.headers.get("x-admin-key") ||
    req.cookies.get("mat_admin")?.value ||
    (req.method === "GET" ? req.nextUrl.searchParams.get("key") : null);
  if (!provided) return;
  await mutate((db) => {
    db.adminSessions = db.adminSessions.filter((s) => s.token !== provided);
  });
}

/** Strip password hashes before sending users to the client. */
export function publicUser(user: AdminUser) {
  const { passwordHash: _hash, ...rest } = user;
  return rest;
}
