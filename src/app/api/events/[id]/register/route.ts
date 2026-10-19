import { NextRequest } from "next/server";
import { eventRegistrationSchema, fieldErrors } from "@/lib/validation";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";
import { makeId, mutate, pushLead, read } from "@/lib/store";
import { events } from "@/content/events";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = events.find((e) => e.id === id);
  if (!event) return fail("ইভেন্ট পাওয়া যায়নি", 404);
  const db = await read();
  const live = db.registrations.filter((r) => r.eventId === id).reduce((s, r) => s + 1 + r.guests, 0);
  return ok({ registered: event.registered + live, capacity: event.capacity, seatsLeft: Math.max(0, event.capacity - event.registered - live) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limit = rateLimit(req, "event-reg", 10, 60_000);
  if (!limit.allowed) return tooMany();
  const { id } = await params;
  const event = events.find((e) => e.id === id);
  if (!event) return fail("ইভেন্ট পাওয়া যায়নি", 404);
  if (event.status === "past") return fail("এই ইভেন্টটি সম্পন্ন হয়েছে", 409);

  let body: unknown;
  try { body = await req.json(); } catch { return fail("অবৈধ অনুরোধ", 400); }
  const parsed = eventRegistrationSchema.safeParse(body);
  if (!parsed.success) return fail("ফর্মে ত্রুটি আছে", 422, fieldErrors(parsed.error));
  const data = parsed.data;

  const result = await mutate((db) => {
    const live = db.registrations.filter((r) => r.eventId === id).reduce((s, r) => s + 1 + r.guests, 0);
    if (event.registered + live + 1 + data.guests > event.capacity) return null;
    const reg = {
      id: makeId("REG"),
      eventId: id,
      name: data.name,
      phone: data.phone,
      ward: data.ward,
      guests: data.guests,
      createdAt: new Date().toISOString(),
    };
    db.registrations.push(reg);
    pushLead(db, { name: data.name, phone: data.phone, ward: data.ward, source: "event", note: event.title });
    return reg;
  });

  if (!result) return fail("দুঃখিত, এই ইভেন্টের আসন পূর্ণ হয়েছে", 409);
  return ok({ registration: result, message: "রেজিস্ট্রেশন সফল! ইভেন্টের আগে এসএমএসে মনে করিয়ে দেওয়া হবে।" }, 201);
}
