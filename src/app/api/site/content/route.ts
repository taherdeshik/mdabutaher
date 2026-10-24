import { NextResponse } from "next/server";
import { getAllSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

/**
 * Public, read-only slice of the page editor: menu labels and visibility.
 * Full copy (title/description/image/video) is rendered on the server.
 */
export async function GET() {
  const all = await getAllSiteContent();
  const pages: Record<string, { label?: string; visible: boolean }> = {};
  for (const [id, content] of Object.entries(all)) {
    pages[id] = { label: content.label || undefined, visible: content.visible !== false };
  }
  return NextResponse.json(
    { ok: true, data: { pages, generatedAt: new Date().toISOString() } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
