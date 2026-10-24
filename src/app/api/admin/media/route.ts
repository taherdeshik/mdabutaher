import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { fail, ok, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"]);
const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_FILES = 800;
const MAX_BYTES = 6 * 1024 * 1024;

type MediaFile = { url: string; name: string; size: number };

async function walk(dir: string, urlBase: string, out: MediaFile[], depth = 0) {
  if (depth > 4 || out.length >= MAX_FILES) return;
  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (out.length >= MAX_FILES) return;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, `${urlBase}/${entry.name}`, out, depth + 1);
      continue;
    }
    if (!IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) continue;
    let size = 0;
    try {
      size = (await fs.stat(full)).size;
    } catch {
      size = 0;
    }
    out.push({ url: `${urlBase}/${entry.name}`, name: entry.name, size });
  }
}

/** List the image library (newest uploads first, then the curated archive). */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return fail("অনুমতি নেই", 401);

  const files: MediaFile[] = [];
  // Fresh uploads first, then the curated archive.
  await walk(UPLOAD_DIR, "/media/uploads", files);
  await walk(path.join(PUBLIC_DIR, "media"), "/media", files, 0);
  files.sort((a, b) => {
    const aUp = a.url.includes("/media/uploads/") ? 0 : 1;
    const bUp = b.url.includes("/media/uploads/") ? 0 : 1;
    return aUp - bUp || (aUp === 1 ? a.url.localeCompare(b.url) : 0);
  });
  return ok({ files, truncated: files.length >= MAX_FILES });
}

/** Upload a new image into public/media/uploads and return its public path. */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return fail("অনুমতি নেই", 401);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("ফাইল পড়া যায়নি", 400);
  }

  const file = form.get("file");
  if (!file || typeof file === "string") return fail("কোনো ফাইল পাওয়া যায়নি", 400);
  if (!file.type.startsWith("image/")) return fail("শুধু ছবি (jpg, png, webp) আপলোড করা যায়", 400);
  if (file.size > MAX_BYTES) return fail("ছবিটি ৬ MB-এর বেশি — ছোট করে নিন", 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const rawExt = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ext = IMAGE_EXT.has(`.${rawExt}`) ? rawExt : "jpg";
  const slug =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image";
  const name = `${new Date().toISOString().slice(0, 10)}-${slug}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

  const dir = UPLOAD_DIR;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);

  return ok({ url: `/media/uploads/${name}`, name, size: file.size }, 201);
}
