import { NextRequest } from "next/server";
import { contactSchema, fieldErrors } from "@/lib/validation";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";
import { makeId, mutate, pushLead } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "contact", 5, 60_000);
  if (!limit.allowed) return tooMany();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("অবৈধ অনুরোধ", 400); }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return fail("ফর্মে ত্রুটি আছে", 422, fieldErrors(parsed.error));
  const data = parsed.data;

  await mutate((db) => {
    db.messages.push({
      id: makeId("MSG"),
      channel: "contact",
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      text: `[${data.subject}] ${data.message}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
    if (data.phone) pushLead(db, { name: data.name, phone: data.phone, ward: "সব", source: "contact", note: data.subject });
  });

  return ok({ message: "বার্তা পাঠানো হয়েছে। ২৪–৪৮ ঘণ্টার মধ্যে উত্তর দেওয়া হবে।" }, 201);
}
