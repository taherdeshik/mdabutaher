import fs from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Serves images uploaded through the admin panel.
 *
 * Uploads land in `data/uploads/` at runtime (outside `public/`, so they are
 * never committed and never conflict with build-time assets). File names are
 * content-unique, hence the long cache.
 */
const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  const ext = path.extname(name).toLowerCase();
  if (!TYPES[ext]) return new Response("Not found", { status: 404 });

  try {
    const file = await fs.readFile(path.join(process.cwd(), "data", "uploads", name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": TYPES[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
