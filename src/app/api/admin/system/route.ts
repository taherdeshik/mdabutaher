import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { actorFromRequest } from "@/lib/auth";
import { mysqlEnabled } from "@/lib/mysql";
import { read } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorFromRequest(req);
  if (!actor) return fail("অনুমতি নেই", 401);

  const db = await read();
  const now = Date.now();
  return ok({
    storage: mysqlEnabled() ? "mysql" : "json",
    database: process.env.MYSQL_DATABASE || "data/db.json",
    users: db.adminUsers.length,
    activeSessions: db.adminSessions.filter((s) => new Date(s.expiresAt).getTime() > now).length,
    auditEntries: db.audit.length,
    seeded: db.meta.seeded,
    node: process.version,
  });
}
