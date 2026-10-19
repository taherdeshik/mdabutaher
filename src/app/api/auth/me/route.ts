import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { actorFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorFromRequest(req);
  if (!actor) return fail("অনুমতি নেই", 401);
  return ok({ user: actor });
}
