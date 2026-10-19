import { NextRequest } from "next/server";
import { fail } from "@/lib/api";
import { actorFromRequest } from "@/lib/auth";
import { mutate, pushAudit, read } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Full JSON backup — download before deploying, before migrations, and weekly via cron. */
export async function GET(req: NextRequest) {
  const actor = await actorFromRequest(req);
  if (!actor) return fail("অনুমতি নেই", 401);
  if (actor.role !== "owner") return fail("শুধু প্রধান অ্যাডমিন ব্যাকআপ নিতে পারেন", 403);

  const db = await read();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  await mutate((state) => {
    pushAudit(state, actor.name, "backup.download", `ব্যাকআপ ${stamp}`);
  });

  return new Response(JSON.stringify(db, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mdabutaher-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
