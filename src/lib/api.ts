import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(message: string, status = 400, errors?: Record<string, string>) {
  return NextResponse.json({ ok: false, error: message, errors }, { status });
}

const buckets = new Map<string, { count: number; reset: number }>();

/** Simple in-memory rate limiter — good enough for a single instance demo. */
export function rateLimit(req: NextRequest, key: string, limit = 8, windowMs = 60_000) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey);
  if (!bucket || bucket.reset < now) {
    buckets.set(bucketKey, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((bucket.reset - now) / 1000) };
  }
  return { allowed: true, remaining: limit - bucket.count };
}

export function tooMany(retryAfter = 60) {
  return NextResponse.json(
    { ok: false, error: "অনেকবার অনুরোধ করা হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন।" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export function requireAdmin(req: NextRequest) {
  const key = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  const expected = process.env.ADMIN_KEY || "mahadan-2027";
  return key === expected;
}
