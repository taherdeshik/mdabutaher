import { NextRequest } from "next/server";
import { fail, ok, requireAdmin } from "@/lib/api";
import { read } from "@/lib/store";
import type { AnalyticsBundle, VisitorEvent, VisitorSession } from "@/lib/visitor-types";
import { cityName, countryName } from "@/lib/geo";

export const dynamic = "force-dynamic";

const DHAKA = 6 * 60 * 60 * 1000;
const dayKey = (iso: string) => new Date(Date.parse(iso) + DHAKA).toISOString().slice(0, 10);
const todayKey = () => new Date(Date.now() + DHAKA).toISOString().slice(0, 10);

function countryLabel(code?: string) {
  if (!code) return "অজানা";
  return countryName(code);
}

function sourceLabel(referrer?: string) {
  if (!referrer) return "সরাসরি / বুকমার্ক";
  if (referrer.startsWith("/")) return "সাইটের ভেতরে";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === "mdabutaher.com" || host.endsWith(".e2b.app") || host === "localhost") return "সাইটের ভেতরে";
    return host;
  } catch {
    return "অন্যান্য";
  }
}

function countBy(events: VisitorEvent[], pick: (e: VisitorEvent) => string) {
  const map = new Map<string, { views: number; sessions: Set<string> }>();
  for (const e of events) {
    const key = pick(e) || "অজানা";
    const row = map.get(key) || { views: 0, sessions: new Set<string>() };
    row.views += 1;
    row.sessions.add(e.session);
    map.set(key, row);
  }
  return [...map.entries()]
    .map(([label, row]) => ({ label, views: row.views, visitors: row.sessions.size }))
    .sort((a, b) => b.views - a.views);
}

function buildSessions(events: VisitorEvent[]): VisitorSession[] {
  const map = new Map<string, VisitorEvent[]>();
  for (const e of events) {
    const list = map.get(e.session) || [];
    list.push(e);
    map.set(e.session, list);
  }
  return [...map.entries()]
    .map(([id, list]) => {
      const sorted = [...list].sort((a, b) => a.ts.localeCompare(b.ts));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const seen = new Set<string>();
      const pages: string[] = [];
      for (const e of sorted) {
        if (!seen.has(e.path)) {
          seen.add(e.path);
          pages.push(e.path);
        }
      }
      return {
        id,
        firstSeen: first.ts,
        lastSeen: last.ts,
        durationSec: Math.max(0, Math.round((Date.parse(last.ts) - Date.parse(first.ts)) / 1000)),
        views: sorted.length,
        entry: first.path,
        exit: last.path,
        pages: pages.slice(-8),
        device: last.device,
        browser: last.browser,
        os: last.os,
        country: last.country,
        city: cityName(last.city),
        referrer: sourceLabel(first.referrer),
        lang: first.lang,
      };
    })
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return fail("অনুমতি নেই", 401);

  const days = Math.min(90, Math.max(7, Number(req.nextUrl.searchParams.get("days")) || 30));
  const db = await read();
  const all = [...db.visitorEvents].sort((a, b) => b.ts.localeCompare(a.ts));
  const today = todayKey();
  const startDay = todayKey();
  const startDate = new Date(Date.parse(`${startDay}T00:00:00Z`) - DHAKA);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  const cutoff = startDate.getTime();

  const range = all.filter((e) => Date.parse(e.ts) >= cutoff);
  const sessions = buildSessions(range);
  const now = Date.now();
  const activeNow = new Set(all.filter((e) => now - Date.parse(e.ts) <= 5 * 60_000).map((e) => e.session)).size;

  const todayEvents = all.filter((e) => dayKey(e.ts) === today);
  const allSessions = new Set(all.map((e) => e.session)).size;
  const avgDuration = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + s.durationSec, 0) / sessions.length)
    : 0;
  const bounces = sessions.filter((s) => s.views === 1).length;

  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(cutoff + i * 86_400_000);
    const key = dayKey(d.toISOString());
    const dayEvents = all.filter((e) => dayKey(e.ts) === key);
    return { date: key, views: dayEvents.length, visitors: new Set(dayEvents.map((e) => e.session)).size };
  });

  const pages = countBy(range, (e) => e.path).slice(0, 14);
  const countries = countBy(range, (e) => (e.country ? e.country.toUpperCase() : "??"))
    .map((row) => ({
      label: row.label === "??" ? "অজানা" : countryLabel(row.label),
      code: row.label === "??" ? undefined : row.label,
      views: row.views,
      visitors: row.visitors,
    }))
    .slice(0, 8);
  const cities = countBy(range, (e) => cityName(e.city) || cityName(e.region) || "")
    .filter((r) => r.label !== "অজানা")
    .slice(0, 8);
  const devices = countBy(range, (e) => e.device).slice(0, 4);
  const browsers = countBy(range, (e) => e.browser).slice(0, 6);
  const sources = countBy(range, (e) => sourceLabel(e.referrer)).slice(0, 8);

  const bundle: AnalyticsBundle = {
    generatedAt: new Date().toISOString(),
    range: days,
    totals: {
      activeNow,
      todayViews: todayEvents.length,
      todayVisitors: new Set(todayEvents.map((e) => e.session)).size,
      rangeViews: range.length,
      rangeVisitors: sessions.length,
      allViews: all.length,
      allSessions,
      pagesPerSession: sessions.length ? Number((range.length / sessions.length).toFixed(1)) : 0,
      avgDurationSec: avgDuration,
      bounceRate: sessions.length ? Math.round((bounces / sessions.length) * 100) : 0,
    },
    series,
    pages,
    countries,
    cities,
    devices,
    browsers,
    sources,
    recent: all.slice(0, 40),
    sessions: sessions.slice(0, 24),
  };

  const res = ok(bundle);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
