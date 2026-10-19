import { NextRequest } from "next/server";
import { newsletterSchema, fieldErrors } from "@/lib/validation";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";
import { makeId, mutate, pushLead } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "newsletter", 6, 60_000);
  if (!limit.allowed) return tooMany();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("অবৈধ অনুরোধ", 400); }
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) return fail("সঠিক ইমেইল দিন", 422, fieldErrors(parsed.error));

  const result = await mutate((db) => {
    const email = parsed.data.email.toLowerCase();
    if (db.subscribers.some((s) => s.email === email)) return { exists: true };
    db.subscribers.push({ id: makeId("SUB"), email, createdAt: new Date().toISOString() });
    pushLead(db, { name: email.split("@")[0], phone: `sub-${email}`, ward: "সব", source: "newsletter", note: "নিউজলেটার সাবস্ক্রাইবার" });
    return { exists: false };
  });

  return ok({ message: result.exists ? "আপনি আগে থেকেই সাবস্ক্রাইব করেছেন।" : "সাবস্ক্রিপশন সফল হয়েছে।" }, 201);
}
