import { NextRequest } from "next/server";
import { fail, ok, requireAdmin } from "@/lib/api";
import { mutate } from "@/lib/store";
import { z } from "zod";

export const dynamic = "force-dynamic";
const schema = z.object({ status: z.enum(["pending", "confirmed", "completed", "cancelled"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return fail("অনুমতি নেই", 401);
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail("অবৈধ অনুরোধ", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("অবৈধ স্ট্যাটাস", 422);
  const result = await mutate((db) => {
    const item = db.appointments.find((a) => a.id === id);
    if (!item) return null;
    item.status = parsed.data.status;
    return item;
  });
  if (!result) return fail("অ্যাপয়েন্টমেন্ট পাওয়া যায়নি", 404);
  return ok({ item: result });
}
