import { NextRequest } from "next/server";
import { feedbackSchema, fieldErrors } from "@/lib/validation";
import { makeId, mutate, pushLead, read, trackingId } from "@/lib/store";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";

export const dynamic = "force-dynamic";

const PUBLIC_LIMIT = 60;

export async function GET(req: NextRequest) {
  const db = await read();
  const kind = req.nextUrl.searchParams.get("kind");
  const ward = req.nextUrl.searchParams.get("ward");
  const mine = req.nextUrl.searchParams.get("phone");

  if (mine) {
    const items = db.feedback.filter((f) => f.phone && f.phone.endsWith(mine.slice(-11)));
    return ok({ items, isMine: true });
  }

  const visible = db.feedback
    .filter((f) => !f.anonymous && f.kind !== "threat")
    .filter((f) => (kind ? f.kind === kind : true))
    .filter((f) => (ward && ward !== "all" ? f.ward === ward : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, PUBLIC_LIMIT)
    .map((f) => ({
      id: f.id,
      trackingId: f.trackingId,
      kind: f.kind,
      category: f.category,
      title: f.title,
      details: f.details,
      ward: f.ward,
      location: f.location,
      severity: f.severity,
      name: f.name || "নাম প্রকাশে অনিচ্ছুক",
      status: f.status,
      supports: f.supports,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      timeline: f.timeline,
    }));

  const all = db.feedback;
  const stats = {
    total: all.length,
    resolved: all.filter((f) => f.status === "resolved").length,
    inProgress: all.filter((f) => f.status === "in-progress" || f.status === "reviewing").length,
    threats: all.filter((f) => f.kind === "threat").length,
    avgSupport: all.length ? Math.round(all.reduce((s, f) => s + f.supports, 0) / all.length) : 0,
  };

  return ok({ items: visible, stats });
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "feedback", 6, 60_000);
  if (!limit.allowed) return tooMany();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("অবৈধ অনুরোধ", 400);
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) return fail("ফর্মে ত্রুটি আছে", 422, fieldErrors(parsed.error));
  const data = parsed.data;

  if (data.photo && data.photo.length > 1_500_000) return fail("ছবির আকার অনেক বড় (সর্বোচ্চ ১.৫ MB)", 413);
  if (!data.anonymous && !data.phone) return fail("যোগাযোগের জন্য মোবাইল নম্বর দিন অথবা নাম গোপন রাখুন", 422);

  const created = await mutate((db) => {
    const now = new Date().toISOString();
    const item = {
      id: makeId("FB"),
      trackingId: trackingId(),
      kind: data.kind,
      category: data.category,
      title: data.title,
      details: data.details,
      ward: data.ward,
      location: data.location || undefined,
      severity: data.severity,
      name: data.anonymous ? undefined : data.name || undefined,
      phone: data.anonymous ? undefined : data.phone || undefined,
      anonymous: data.anonymous,
      photo: data.photo || undefined,
      status: (data.kind === "threat" ? "reviewing" : "new") as "reviewing" | "new",
      supports: 0,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          at: now,
          note:
            data.kind === "threat"
              ? "হুমকি রিপোর্ট গ্রহণ করা হয়েছে — দায়িত্বপ্রাপ্ত দল দ্রুত পর্যালোচনা করবে।"
              : "রিপোর্ট গ্রহণ করা হয়েছে এবং সংশ্লিষ্ট ওয়ার্ড সমন্বয়কের কাছে পাঠানো হয়েছে।",
          by: "সিস্টেম",
        },
      ],
    };
    db.feedback.push(item);
    if (!data.anonymous && data.phone) {
      pushLead(db, {
        name: data.name || "অভিযোগকারী",
        phone: data.phone,
        ward: data.ward,
        source: "feedback",
        note: data.title,
      });
    }
    return item;
  });

  return ok(
    {
      item: { id: created.id, trackingId: created.trackingId, status: created.status },
      message:
        data.kind === "threat"
          ? `হুমকি রিপোর্ট গৃহীত। ট্র্যাকিং আইডি: ${created.trackingId}। জরুরি হলে ৯৯৯ কল করুন।`
          : `ধন্যবাদ! আপনার রিপোর্ট গৃহীত হয়েছে। ট্র্যাকিং আইডি: ${created.trackingId}`,
    },
    201,
  );
}
