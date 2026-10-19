import { mysqlEnabled } from "@/lib/mysql";

export const dynamic = "force-dynamic";

/** Public liveness probe — no secrets, safe for uptime monitors (UptimeRobot, cPanel cron). */
export async function GET() {
  return Response.json(
    {
      ok: true,
      service: "mdabutaher",
      storage: mysqlEnabled() ? "mysql" : "json",
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
