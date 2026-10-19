import { NextRequest } from "next/server";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";
import { mutate } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limit = rateLimit(req, "support", 20, 60_000);
  if (!limit.allowed) return tooMany();
  const { id } = await params;

  const result = await mutate((db) => {
    const item = db.feedback.find((f) => f.id === id);
    if (!item) return null;
    item.supports += 1;
    return { id: item.id, supports: item.supports };
  });

  if (!result) return fail("রিপোর্টটি পাওয়া যায়নি", 404);
  return ok(result);
}
