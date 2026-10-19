import { NextRequest } from "next/server";
import { volunteerSchema, fieldErrors } from "@/lib/validation";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";
import { makeId, mutate, pushLead } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "volunteer", 5, 60_000);
  if (!limit.allowed) return tooMany();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("অবৈধ অনুরোধ", 400); }
  const parsed = volunteerSchema.safeParse(body);
  if (!parsed.success) return fail("ফর্মে ত্রুটি আছে", 422, fieldErrors(parsed.error));
  const data = parsed.data;

  await mutate((db) => {
    db.volunteers.push({
      id: makeId("VOL"),
      name: data.name,
      phone: data.phone,
      ward: data.ward,
      role: data.role,
      availability: data.availability,
      createdAt: new Date().toISOString(),
    });
    pushLead(db, {
      name: data.name,
      phone: data.phone,
      ward: data.ward,
      source: "volunteer",
      note: `স্বেচ্ছাসেবক — ${data.role}`,
    });
  });

  return ok({ message: "স্বাগতম! আপনার ওয়ার্ড সমন্বয়ক ৪৮ ঘণ্টার মধ্যে যোগাযোগ করবেন।" }, 201);
}
