import { NextRequest } from "next/server";
import { fail, rateLimit, tooMany } from "@/lib/api";
import { makeId, mutate } from "@/lib/store";
import type { DeviceKind, VisitorEvent } from "@/lib/visitor-types";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

const BOT = /bot|crawler|spider|crawl|preview|headless|monitor|curl|wget/i;

function parseUA(ua: string): { device: DeviceKind; browser: string; os: string } {
  const device: DeviceKind = /iPad|Tablet|PlayBook|Silk/i.test(ua)
    ? "tablet"
    : /Mobi|Android|iPhone|iPod/i.test(ua)
      ? "mobile"
      : "desktop";

  let os = "অন্যান্য";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "অন্যান্য";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  return { device, browser, os };
}

/** Country guessed from the browser timezone when no edge geo headers exist. */
function countryFromTz(tz: string) {
  if (!tz) return "";
  if (tz === "Asia/Dhaka") return "BD";
  if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
  if (tz === "Asia/Karachi") return "PK";
  if (tz === "Asia/Dubai") return "AE";
  if (tz === "Asia/Riyadh") return "SA";
  if (tz === "Asia/Kuala_Lumpur") return "MY";
  if (tz === "Asia/Singapore") return "SG";
  if (tz === "Asia/Qatar") return "QA";
  if (tz === "Asia/Kuwait") return "KW";
  if (tz === "Europe/London") return "GB";
  if (tz === "America/New_York" || tz === "America/Chicago" || tz === "America/Los_Angeles") return "US";
  return "";
}

function decode(value: string | null) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "track", 120, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("অনুরোধ পড়া যায়নি", 400);
  }

  const path = str(body.path, 200).split("?")[0];
  if (!path.startsWith("/")) return fail("পাথ ঠিক নয়", 400);
  if (/^\/(admin|api|_next|login)/.test(path)) return new Response(null, { status: 204 });

  const ua = req.headers.get("user-agent") || "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });

  const parsed = parseUA(ua);
  const tz = str(body.tz, 60);
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    countryFromTz(tz);
  const city =
    decode(req.headers.get("x-vercel-ip-city")) || decode(req.headers.get("cf-ipcity"));
  const region =
    decode(req.headers.get("x-vercel-ip-country-region")) || decode(req.headers.get("cf-region"));

  const sessionRaw = str(body.session, 64);
  const session = /^[A-Za-z0-9-]{8,64}$/.test(sessionRaw) ? sessionRaw : makeId("SES");

  const event: VisitorEvent = {
    id: makeId("VIS"),
    session,
    path,
    title: str(body.title, 140) || undefined,
    ts: new Date().toISOString(),
    referrer: str(body.referrer, 300) || undefined,
    device: parsed.device,
    browser: parsed.browser,
    os: parsed.os,
    lang: str(body.lang, 20) || undefined,
    tz: tz || undefined,
    country: country || undefined,
    region: region || undefined,
    city: city || undefined,
  };

  await mutate((db) => {
    db.visitorEvents.unshift(event);
    db.visitorEvents = db.visitorEvents.slice(0, 4000);
    db.meta.seeded = true;
  });

  return new Response(null, { status: 204 });
}
