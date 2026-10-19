import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, rateLimit } from "@/lib/api";
import { login } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().trim().min(3).max(40),
  password: z.string().min(6).max(120),
});

export async function POST(req: NextRequest) {
  const gate = rateLimit(req, "login", 8, 60_000);
  if (!gate.allowed) return fail("অনেকবার চেষ্টা হয়েছে — এক মিনিট পর আবার চেষ্টা করুন", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("অবৈধ অনুরোধ", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("ইউজারনেম বা পাসওয়ার্ড সঠিক নয়", 422);

  const session = await login(parsed.data.username, parsed.data.password, req.headers.get("user-agent") || "");
  if (!session) return fail("ইউজারনেম বা পাসওয়ার্ড সঠিক নয়", 401);

  const res = ok({ token: session.token, user: session.user });
  res.cookies.set("mat_admin", session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 86_400,
  });
  return res;
}
