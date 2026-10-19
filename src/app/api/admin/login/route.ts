import { NextRequest } from "next/server";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "admin-login", 8, 5 * 60_000);
  if (!limit.allowed) return tooMany(300);
  let body: { passcode?: string };
  try { body = await req.json(); } catch { return fail("অবৈধ অনুরোধ", 400); }
  const expected = process.env.ADMIN_KEY || "mahadan-2027";
  if (!body.passcode || body.passcode !== expected) return fail("পাসকোড সঠিক নয়", 401);
  return ok({ message: "স্বাগতম", key: expected });
}
