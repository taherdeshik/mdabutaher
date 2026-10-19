import { NextRequest } from "next/server";
import { fail, requireAdmin } from "@/lib/api";
import { read } from "@/lib/store";

export const dynamic = "force-dynamic";

function csv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return fail("অনুমতি নেই", 401);
  const type = req.nextUrl.searchParams.get("type") || "feedback";
  const db = await read();

  let rows: Record<string, unknown>[] = [];
  if (type === "appointments") rows = db.appointments as unknown as Record<string, unknown>[];
  else if (type === "leads") rows = db.leads as unknown as Record<string, unknown>[];
  else if (type === "volunteers") rows = db.volunteers as unknown as Record<string, unknown>[];
  else if (type === "messages") rows = db.messages as unknown as Record<string, unknown>[];
  else rows = db.feedback.map((f) => ({ ...f, timeline: JSON.stringify(f.timeline) }));

  return new Response("\uFEFF" + csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
