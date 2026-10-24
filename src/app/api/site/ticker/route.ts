import { getTickerItems } from "@/lib/ticker";

export const dynamic = "force-dynamic";

export async function GET() {
  const { enabled, items } = await getTickerItems();
  return Response.json(
    { ok: true, data: { enabled, items } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
