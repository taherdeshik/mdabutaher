"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Clock3,
  Eye,
  Globe2,
  Link2,
  MonitorSmartphone,
  MousePointerClick,
  Radio,
  RefreshCw,
  Users,
} from "lucide-react";
import { Badge, Button, Card, CardHead, Empty, Modal, Progress, Stat } from "./admin-ui";
import { bn, formatBnDate } from "@/lib/utils";
import type { SectionProps } from "./types";
import type { AnalyticsBundle, VisitorSession } from "@/lib/visitor-types";
import { cityName, countryFlag, locationText } from "@/lib/geo";

const ROUTES: Record<string, string> = {
  "/": "হোম",
  "/about": "পরিচিতি",
  "/manifesto": "ম্যানিফেস্টো",
  "/campaign": "প্রচারণা",
  "/events": "ইভেন্ট",
  "/activities": "কার্যক্রম",
  "/news": "সংবাদ",
  "/blog": "ব্লগ",
  "/gallery": "গ্যালারি",
  "/polls": "জনমত জরিপ",
  "/appointment": "অ্যাপয়েন্টমেন্ট",
  "/appointment/status": "অ্যাপয়েন্টমেন্ট স্ট্যাটাস",
  "/feedback": "মতামত ও সমস্যা",
  "/feedback/board": "মতামত বোর্ড",
  "/chat": "চ্যাট",
  "/contact": "যোগাযোগ",
  "/media-kit": "মিডিয়া কিট",
  "/privacy": "গোপনীয়তা",
};

function pathLabel(path: string) {
  if (ROUTES[path]) return ROUTES[path];
  if (path.startsWith("/news/")) return "সংবাদ · বিস্তারিত";
  if (path.startsWith("/blog/")) return "ব্লগ · লেখা";
  if (path.startsWith("/events/")) return "ইভেন্ট · বিস্তারিত";
  if (path.startsWith("/activities/")) return "কার্যক্রম · বিস্তারিত";
  return path;
}

const deviceLabel = (d: string) => (d === "mobile" ? "মোবাইল" : d === "tablet" ? "ট্যাবলেট" : "ডেস্কটপ");

function timeLabel(iso: string) {
  const d = new Date(iso);
  return `${bn(String(d.getHours()).padStart(2, "0"))}:${bn(String(d.getMinutes()).padStart(2, "0"))}`;
}

function duration(sec: number) {
  if (sec < 60) return `${bn(sec)} সে`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${bn(m)} মি ${bn(sec % 60)} সে`;
  return `${bn(Math.floor(m / 60))} ঘ ${bn(m % 60)} মি`;
}

function shortId(id: string) {
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
}

export function VisitorAnalytics({ adminKey }: SectionProps) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState<VisitorSession | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`, {
        headers: { "x-admin-key": adminKey },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "অ্যানালিটিক্স লোড করা যায়নি");
      setData(json.data as AnalyticsBundle);
    } catch (e) {
      setError(e instanceof Error ? e.message : "অ্যানালিটিক্স লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [adminKey, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = data?.totals;
  const series = data?.series ?? [];
  const max = Math.max(1, ...series.flatMap((p) => [p.views, p.visitors]));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg border px-2.5 py-1 text-[0.62rem] font-bold transition-colors ${
                days === d
                  ? "border-gold/40 bg-gold/12 text-gold"
                  : "border-white/10 text-cream/45 hover:border-white/20 hover:text-cream/70"
              }`}
            >
              {bn(d)} দিন
            </button>
          ))}
          {totals && totals.activeNow > 0 ? (
            <Badge tone="emerald" className="ml-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-bright opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-bright" />
              </span>
              এখন {bn(totals.activeNow)} জন অনলাইনে
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-[0.6rem] text-cream/35">
          {data ? <span>আপডেট {timeLabel(data.generatedAt)}</span> : null}
          <Button size="sm" variant="ghost" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> রিফ্রেশ
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-rose-400/25 bg-rose-400/[0.05] px-4 py-3 text-[0.72rem] text-rose-200">{error}</Card>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="এখন অনলাইনে" value={bn(totals?.activeNow ?? 0)} icon={<Radio className="h-4 w-4" />} tone="emerald" sub="শেষ ৫ মিনিটে সক্রিয়" />
        <Stat label="আজকের ভিজিটর" value={bn(totals?.todayVisitors ?? 0)} icon={<Users className="h-4 w-4" />} tone="gold" sub={`${bn(totals?.todayViews ?? 0)} পেজভিউ`} />
        <Stat label={`${bn(days)} দিনের ভিজিটর`} value={bn(totals?.rangeVisitors ?? 0)} icon={<Eye className="h-4 w-4" />} tone="sky" sub={`${bn(totals?.rangeViews ?? 0)} পেজভিউ`} />
        <Stat label="পেজ / সেশন" value={bn(totals?.pagesPerSession ?? 0)} icon={<MousePointerClick className="h-4 w-4" />} tone="muted" sub="গড় গভীরতা" />
        <Stat label="গড় সময়" value={duration(totals?.avgDurationSec ?? 0)} icon={<Clock3 className="h-4 w-4" />} tone="emerald" sub="প্রতি সেশনে" />
        <Stat label="বাউন্স রেট" value={`${bn(totals?.bounceRate ?? 0)}%`} icon={<ArrowUpRight className="h-4 w-4" />} tone="rose" sub="১ পেজেই বিদায়" />
      </div>

      <Card>
        <CardHead
          title="দৈনিক ট্র্যাফিক"
          sub="হালকা সবুজ = পেজভিউ · সোনালি = ইউনিক ভিজিটর"
          icon={<BarChart3 className="h-4 w-4" />}
          action={<Badge tone="gold">{bn(days)} দিন</Badge>}
        />
        <div className="px-4 pb-2 pt-5 sm:px-5">
          {series.length === 0 ? (
            <div className="py-12 text-center text-[0.7rem] text-cream/35">এখনো কোনো ডেটা নেই</div>
          ) : (
            <>
              <div className="flex h-40 items-end gap-[3px]">
                {series.map((p, i) => {
                  const showDesktop = i === 0 || i === series.length - 1 || i % Math.ceil(days / 5) === 0;
                  const showMobile = i === 0 || i === series.length - 1 || i % Math.ceil(days / 3) === 0;
                  return (
                    <div key={p.date} className="group relative flex h-full flex-1 items-end justify-center gap-[2px]">
                      <div
                        className="w-full max-w-[10px] rounded-t-sm bg-emerald-bright/75 transition-colors group-hover:bg-emerald-bright"
                        style={{ height: `${Math.max(2, (p.views / max) * 100)}%` }}
                        title={`${formatBnDate(p.date)} — ${bn(p.views)} পেজভিউ`}
                      />
                      <div
                        className="w-full max-w-[10px] rounded-t-sm bg-gold/70 transition-colors group-hover:bg-gold"
                        style={{ height: `${Math.max(2, (p.visitors / max) * 100)}%` }}
                        title={`${formatBnDate(p.date)} — ${bn(p.visitors)} ভিজিটর`}
                      />
                      <span className="pointer-events-none absolute -bottom-5 hidden whitespace-nowrap text-[0.55rem] text-cream/35 sm:block">
                        {showDesktop ? (days <= 7 ? formatBnDate(p.date, { month: "short", year: undefined }) : bn(p.date.slice(8, 10))) : ""}
                      </span>
                      <span className="pointer-events-none absolute -bottom-5 whitespace-nowrap text-[0.55rem] text-cream/35 sm:hidden">
                        {showMobile ? bn(p.date.slice(8, 10)) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-6" />
            </>
          )}
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHead title="শীর্ষ পেজ" sub="কোন পেজে মানুষ সবচেয়ে বেশি আসছে" icon={<Eye className="h-4 w-4" />} />
          <div className="space-y-2.5 p-4">
            {(data?.pages ?? []).length === 0 ? (
              <p className="py-6 text-center text-[0.68rem] text-cream/30">এখনো কোনো পেজভিউ নেই</p>
            ) : (
              data!.pages.map((p) => (
                <div key={p.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[0.68rem] text-cream/75">{pathLabel(p.label)}</span>
                    <span className="shrink-0 font-latin text-[0.6rem] text-cream/40">
                      {bn(p.views)} <span className="text-cream/25">/ {bn(p.visitors ?? 0)} জন</span>
                    </span>
                  </div>
                  <Progress value={p.views / Math.max(1, data!.pages[0].views)} tone="emerald" height="h-1" />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="কোথা থেকে এসেছে" sub="অবস্থান — দেশ ও শহর" icon={<Globe2 className="h-4 w-4" />} />
          <div className="space-y-2.5 p-4">
            {(data?.countries ?? []).length === 0 ? (
              <p className="py-6 text-center text-[0.68rem] text-cream/30">লোকেশন ডেটা নেই</p>
            ) : (
              data!.countries.map((c) => (
                <div key={c.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[0.68rem] text-cream/75">
                      <span className="mr-1">{countryFlag(c.code)}</span>
                      {c.label}
                    </span>
                    <span className="shrink-0 font-latin text-[0.6rem] text-cream/40">{bn(c.views)}</span>
                  </div>
                  <Progress value={c.views / Math.max(1, data!.countries[0].views)} tone="gold" height="h-1" />
                </div>
              ))
            )}
            {(data?.cities ?? []).length ? (
              <div className="border-t border-white/[0.06] pt-2.5">
                <p className="mb-1.5 text-[0.56rem] uppercase tracking-wider text-cream/25">শহর</p>
                <div className="flex flex-wrap gap-1">
                  {data!.cities.map((c) => (
                    <Badge key={c.label} tone="muted">
                      {c.label} · {bn(c.views)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHead title="ডিভাইস ও ব্রাউজার" sub="ফোনে না ল্যাপটপে — কে কী ব্যবহার করছে" icon={<MonitorSmartphone className="h-4 w-4" />} />
          <div className="p-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.06]">
              {(data?.devices ?? []).map((d, i) => (
                <div
                  key={d.label}
                  className={["bg-emerald-bright", "bg-gold", "bg-sky-400", "bg-white/25"][i % 4]}
                  style={{ width: `${(d.views / Math.max(1, data!.totals.rangeViews)) * 100}%` }}
                  title={`${deviceLabel(d.label)} — ${bn(d.views)}`}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(data?.devices ?? []).map((d, i) => (
                <div key={d.label} className="rounded-lg border border-white/[0.06] px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={["h-1.5 w-1.5 rounded-full", "bg-emerald-bright", "bg-gold", "bg-sky-400", "bg-white/25"][i % 4]} />
                    <span className="text-[0.6rem] text-cream/60">{deviceLabel(d.label)}</span>
                  </div>
                  <p className="mt-0.5 font-latin text-[0.8rem] font-bold text-cream">{bn(d.views)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-white/[0.06] pt-3">
              <p className="mb-2 text-[0.56rem] uppercase tracking-wider text-cream/25">ব্রাউজার</p>
              <div className="flex flex-wrap gap-1.5">
                {(data?.browsers ?? []).map((b) => (
                  <Badge key={b.label} tone="muted">
                    {b.label} · {bn(b.views)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="ট্র্যাফিকের সূত্র" sub="সোশ্যাল, সার্চ নাকি সরাসরি" icon={<Link2 className="h-4 w-4" />} />
          <div className="space-y-2.5 p-4">
            {(data?.sources ?? []).length === 0 ? (
              <p className="py-6 text-center text-[0.68rem] text-cream/30">কোনো সূত্র নেই</p>
            ) : (
              data!.sources.map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[0.68rem] text-cream/75">{s.label}</span>
                    <span className="shrink-0 font-latin text-[0.6rem] text-cream/40">{bn(s.views)}</span>
                  </div>
                  <Progress value={s.views / Math.max(1, data!.sources[0].views)} tone="sky" height="h-1" />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead
          title="ভিজিটর সেশন"
          sub="প্রতিটি সেশন আলাদা ট্যাব ভিজিট — বিস্তারিত দেখতে সারিতে ক্লিক করুন"
          icon={<Users className="h-4 w-4" />}
          action={<Badge tone={loading ? "muted" : "emerald"}>{bn(data?.sessions.length ?? 0)} সেশন</Badge>}
        />
        <div className="overflow-x-auto">
          {(data?.sessions ?? []).length === 0 ? (
            <div className="p-4">
              <Empty
                title="এখনো কোনো ভিজিটর রেকর্ড হয়নি"
                sub="পাবলিক সাইটে কোনো পেজ খুললেই এখানে সেশন, লোকেশন ও ডিভাইসের তথ্য জমা হবে। সাইট প্রিভিউ নতুন ট্যাবে খুলে দেখুন।"
              />
            </div>
          ) : (
            <table className="w-full min-w-[740px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[0.55rem] uppercase tracking-wider text-cream/30">
                  <th className="px-4 py-2 font-semibold">ভিজিটর</th>
                  <th className="px-3 py-2 font-semibold">লোকেশন</th>
                  <th className="px-3 py-2 font-semibold">ডিভাইস</th>
                  <th className="px-3 py-2 font-semibold">পেজ</th>
                  <th className="px-3 py-2 font-semibold">সময়</th>
                  <th className="px-4 py-2 text-right font-semibold">শেষ পেজ</th>
                </tr>
              </thead>
              <tbody>
                {data!.sessions.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSession(s)}
                    className="cursor-pointer border-b border-white/[0.04] text-[0.66rem] transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-2.5 font-latin text-cream/70">
                      {shortId(s.id)}
                      <span className="ml-1 text-[0.55rem] text-cream/25">সেশন</span>
                    </td>
                    <td className="px-3 py-2.5 text-cream/60">
                      <span className="mr-1">{countryFlag(s.country)}</span>
                      {locationText(s.country, s.city)}
                    </td>
                    <td className="px-3 py-2.5 text-cream/55">{deviceLabel(s.device)}</td>
                    <td className="px-3 py-2.5 font-latin text-cream/55">{bn(s.views)}</td>
                    <td className="px-3 py-2.5 font-latin text-cream/55">{duration(s.durationSec)}</td>
                    <td className="max-w-[180px] truncate px-4 py-2.5 text-right text-cream/45">{pathLabel(s.exit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Card>
        <CardHead title="সাম্প্রতিক পেজভিউ" sub="সর্বশেষ ৪০টি ভিজিট — রিয়েল-টাইমে" icon={<Eye className="h-4 w-4" />} />
        <div className="overflow-x-auto">
          {(data?.recent ?? []).length === 0 ? (
            <p className="p-6 text-center text-[0.68rem] text-cream/30">কোনো পেজভিউ নেই</p>
          ) : (
            <table className="w-full min-w-[780px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[0.55rem] uppercase tracking-wider text-cream/30">
                  <th className="px-4 py-2 font-semibold">সময়</th>
                  <th className="px-3 py-2 font-semibold">পেজ</th>
                  <th className="px-3 py-2 font-semibold">লোকেশন</th>
                  <th className="px-3 py-2 font-semibold">ডিভাইস</th>
                  <th className="px-3 py-2 font-semibold">ব্রাউজার</th>
                  <th className="px-4 py-2 font-semibold">সূত্র</th>
                </tr>
              </thead>
              <tbody>
                {data!.recent.map((e) => (
                  <tr key={e.id} className="border-b border-white/[0.04] text-[0.66rem] last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 font-latin text-cream/40">{timeLabel(e.ts)}</td>
                    <td className="max-w-[240px] truncate px-3 py-2 text-cream/75">{pathLabel(e.path)}</td>
                    <td className="px-3 py-2 text-cream/55">
                      <span className="mr-1">{countryFlag(e.country)}</span>
                      {e.country || e.city ? locationText(e.country, cityName(e.city)) : e.tz || "অজানা"}
                    </td>
                    <td className="px-3 py-2 text-cream/55">{deviceLabel(e.device)}</td>
                    <td className="px-3 py-2 text-cream/55">{e.browser}</td>
                    <td className="max-w-[160px] truncate px-4 py-2 text-cream/40">
                      {e.referrer ? e.referrer.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] : "সরাসরি"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal open={Boolean(session)} onClose={() => setSession(null)} title="ভিজিটর সেশনের বিস্তারিত" sub="বেনামি সেশন — কোনো নাম, ফোন বা আইপি সংরক্ষণ করা হয় না" width="max-w-lg">
        {session ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 text-[0.68rem]">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[0.55rem] uppercase tracking-wider text-cream/30">সেশন আইডি</p>
                <p className="mt-0.5 font-latin text-cream/80">{shortId(session.id)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[0.55rem] uppercase tracking-wider text-cream/30">মোট সময়</p>
                <p className="mt-0.5 text-cream/80">{duration(session.durationSec)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[0.55rem] uppercase tracking-wider text-cream/30">লোকেশন</p>
                <p className="mt-0.5 text-cream/80">
                  <span className="mr-1">{countryFlag(session.country)}</span>
                  {locationText(session.country, session.city)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[0.55rem] uppercase tracking-wider text-cream/30">ডিভাইস</p>
                <p className="mt-0.5 text-cream/80">
                  {deviceLabel(session.device)} · {session.browser}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[0.55rem] uppercase tracking-wider text-cream/30">প্রবেশ</p>
                <p className="mt-0.5 truncate text-cream/80">{pathLabel(session.entry)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[0.55rem] uppercase tracking-wider text-cream/30">সূত্র</p>
                <p className="mt-0.5 truncate text-cream/80">{session.referrer || "সরাসরি"}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-wider text-cream/35">দেখা পেজগুলো</p>
              <ol className="space-y-1.5">
                {session.pages.map((p, i) => (
                  <li key={`${p}-${i}`} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-[0.68rem] text-cream/70">
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gold/15 font-latin text-[0.5rem] text-gold">{bn(i + 1)}</span>
                    {pathLabel(p)}
                    <span className="ml-auto truncate font-latin text-[0.55rem] text-cream/25">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="rounded-lg border border-white/[0.06] px-3 py-2 text-[0.6rem] leading-relaxed text-cream/35">
              লোকেশন এজ (Vercel/Cloudflare) হেডার থেকে নেওয়া হয়; না থাকলে ব্রাউজারের টাইমজোন থেকে আন্দাজ করা হয়।
              আইপি ঠিকানা কোথাও সংরক্ষণ করা হয় না।
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
