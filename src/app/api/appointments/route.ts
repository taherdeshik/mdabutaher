import { NextRequest } from "next/server";
import { z } from "zod";
import { appointmentSchema, fieldErrors } from "@/lib/validation";
import { makeId, mutate, pushLead, read, trackingId } from "@/lib/store";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";
import { appointmentSlots } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  const date = req.nextUrl.searchParams.get("date");
  const db = await read();

  if (date) {
    const taken = db.appointments
      .filter((a) => a.date === date && a.status !== "cancelled")
      .reduce<Record<string, number>>((acc, a) => {
        acc[a.slot] = (acc[a.slot] || 0) + 1;
        return acc;
      }, {});
    return ok({
      date,
      slots: appointmentSlots.map((slot) => ({
        slot,
        taken: taken[slot] || 0,
        available: (taken[slot] || 0) < 4,
      })),
    });
  }

  if (phone) {
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(phone)) return fail("সঠিক মোবাইল নম্বর দিন", 422);
    const mine = db.appointments
      .filter((a) => a.phone.endsWith(phone.slice(-11)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return ok({ appointments: mine });
  }
  return fail("phone অথবা date প্যারামিটার প্রয়োজন", 400);
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "appointment", 5, 60_000);
  if (!limit.allowed) return tooMany();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("অবৈধ অনুরোধ", 400);
  }

  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) return fail("ফর্মে ত্রুটি আছে", 422, fieldErrors(parsed.error));
  const data = parsed.data;

  const day = new Date(`${data.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(day.getTime())) return fail("তারিখ সঠিক নয়", 422);
  if (day < today) return fail("অতীত তারিখে অ্যাপয়েন্টমেন্ট নেওয়া যায় না", 422);
  if (day.getDay() === 5 && data.mode === "in-person")
    return fail("শুক্রবার শুধু পূর্বনির্ধারিত সাক্ষাৎ — অন্য দিন বেছে নিন", 422);

  const existing = await read();
  const slotCount = existing.appointments.filter(
    (a) => a.date === data.date && a.slot === data.slot && a.status !== "cancelled",
  ).length;
  if (slotCount >= 4) return fail("এই সময়টি পূর্ণ — অন্য সময় বেছে নিন", 409);

  const created = await mutate((db) => {
    const appointment = {
      id: makeId("APT"),
      reference: trackingId(),
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      type: data.type,
      date: data.date,
      slot: data.slot,
      mode: data.mode,
      ward: data.ward,
      topic: data.topic,
      notes: data.notes || undefined,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };
    db.appointments.push(appointment);
    pushLead(db, {
      name: data.name,
      phone: data.phone,
      ward: data.ward,
      source: "appointment",
      note: appointment.topic,
    });
    return appointment;
  });

  return ok(
    {
      appointment: created,
      message: `অ্যাপয়েন্টমেন্ট অনুরোধ গৃহীত। রেফারেন্স: ${created.reference}। ২৪ ঘণ্টার মধ্যে নিশ্চিতকরণ পাবেন।`,
    },
    201,
  );
}

export const runtime = "nodejs";
export type AppointmentPayload = z.infer<typeof appointmentSchema>;
