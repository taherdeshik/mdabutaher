import { cmsTicker } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { ok: true, data: await cmsTicker() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
