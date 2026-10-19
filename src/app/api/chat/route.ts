import { NextRequest } from "next/server";
import { chatSchema, fieldErrors } from "@/lib/validation";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";
import { makeId, mutate } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "chat", 25, 60_000);
  if (!limit.allowed) return tooMany();
  let body: unknown;
  try { body = await req.json(); } catch { return fail("অবৈধ অনুরোধ", 400); }
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return fail("বার্তা সঠিক নয়", 422, fieldErrors(parsed.error));

  await mutate((db) => {
    db.messages.push({
      id: makeId("CHAT"),
      channel: "web-chat",
      name: parsed.data.name,
      phone: parsed.data.phone || undefined,
      text: parsed.data.message,
      createdAt: new Date().toISOString(),
      read: false,
    });
  });

  return ok({ received: true }, 201);
}
