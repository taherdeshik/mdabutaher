import { NextRequest } from "next/server";
import { fail, ok, requireAdmin } from "@/lib/api";
import { mutate } from "@/lib/store";
import { z } from "zod";

export const dynamic = "force-dynamic";
const schema = z.object({
  status: z.enum(["new", "reviewing", "in-progress", "resolved"]).optional(),
  note: z.string().trim().max(500).optional(),
  by: z.string().trim().max(80).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return fail("অনুমতি নেই", 401);
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail("অবৈধ অনুরোধ", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("অবৈধ আপডেট", 422);

  const result = await mutate((db) => {
    const item = db.feedback.find((f) => f.id === id);
    if (!item) return null;
    if (parsed.data.status) item.status = parsed.data.status;
    item.updatedAt = new Date().toISOString();
    if (parsed.data.note) {
      item.timeline.push({ at: new Date().toISOString(), note: parsed.data.note, by: parsed.data.by || "কর্মী" });
    }
    return item;
  });
  if (!result) return fail("রিপোর্ট পাওয়া যায়নি", 404);
  return ok({ item: result });
}
