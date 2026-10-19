import { NextRequest } from "next/server";
import { fail, ok, requireAdmin } from "@/lib/api";
import { mutate } from "@/lib/store";
import { z } from "zod";

export const dynamic = "force-dynamic";
const schema = z.object({
  stage: z.enum(["new", "contacted", "engaged", "supporter"]).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return fail("অনুমতি নেই", 401);
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail("অবৈধ অনুরোধ", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("অবৈধ আপডেট", 422);
  const result = await mutate((db) => {
    const item = db.leads.find((l) => l.id === id);
    if (!item) return null;
    if (parsed.data.stage) item.stage = parsed.data.stage;
    if (parsed.data.note !== undefined) item.note = parsed.data.note;
    item.updatedAt = new Date().toISOString();
    return item;
  });
  if (!result) return fail("লিড পাওয়া যায়নি", 404);
  return ok({ item: result });
}
