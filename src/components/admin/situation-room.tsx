"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Footprints,
  Info,
  MapPin,
  Radio,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Progress, Stat } from "./admin-ui";
import { bnNum, formatMoney, pct, strengthLabels, strengthTone } from "./admin-labels";
import { bn, formatBnDate } from "@/lib/utils";
import { daysUntil } from "@/lib/command-calc";

export function SituationRoom({ data, go }: SectionProps) {
  const { kpis, settings, brief, alerts, wardCoverage, tasks, visits, households, booths, team } = data;

  const milestones = [
    { label: "ভোটার তালিকা", date: settings.rollDate },
    { label: "মনোনয়ন", date: settings.nominationDate },
    { label: "যাচাই", date: settings.scrutinyDate },
    { label: "প্রত্যাহার", date: settings.withdrawalDate },
    { label: "প্রতীক", date: settings.symbolDate },
    { label: "ভোট", date: settings.pollingDate },
    { label: "ফলাফল", date: settings.resultDate },
  ].filter((m) => m.date);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = tasks
    .filter((t) => !t.done && t.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);
  const recentVisits = visits.slice(0, 5);
  const committedPct = kpis.winNumber ? kpis.committedVotes / kpis.winNumber : 0;
  const turnoutVotes = Math.round((kpis.voters * settings.turnoutAssumption) / 100);

  const levelIcon = {
    critical: <ShieldAlert className="h-3.5 w-3.5" />,
    high: <AlertTriangle className="h-3.5 w-3.5" />,
    medium: <Info className="h-3.5 w-3.5" />,
    info: <Radio className="h-3.5 w-3.5" />,
  };
  const levelTone = {
    critical: "text-rose-300 bg-rose-400/10 border-rose-400/25",
    high: "text-amber-300 bg-amber-400/10 border-amber-400/25",
    medium: "text-sky-300 bg-sky-400/10 border-sky-400/25",
    info: "text-emerald-bright bg-emerald-bright/10 border-emerald-bright/25",
  };

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0b3428] via-[#072019] to-[#04110e] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-emerald-bright/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at 70% 30%, black, transparent 72%)",
          }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-gold">
                <Radio className="h-3 w-3 animate-pulse" /> নির্বাচন {bn(2027)}
              </span>
              <span className="text-[0.62rem] text-cream/40">মহাদান ইউনিয়ন · সরিষাবাড়ী · জামালপুর</span>
            </div>
            <h2 className="mt-3 font-display text-[1.9rem] font-extrabold leading-[1.15] text-cream sm:text-[2.4rem]">
              ভোটের বাকি <span className="text-gold">{bn(Math.max(0, kpis.daysLeft))}</span> দিন
            </h2>
            <p className="mt-1.5 text-[0.78rem] leading-relaxed text-cream/50">
              {formatBnDate(settings.pollingDate)} · {bn(kpis.wards)} ওয়ার্ড · {bn(kpis.booths)} বুথ ·{" "}
              <span className="text-cream/70">{bnNum(kpis.voters)} ভোটার</span>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="gold" size="sm" onClick={() => go("canvass")}>
                <Footprints className="h-3.5 w-3.5" /> আজকের ক্যানভাস
              </Button>
              <Button variant="outline" size="sm" onClick={() => go("map")}>
                <MapPin className="h-3.5 w-3.5" /> কভারেজ ম্যাপ
              </Button>
              <Button variant="ghost" size="sm" onClick={() => go("plan")}>
                <ClipboardList className="h-3.5 w-3.5" /> আজকের কাজ {bn(kpis.tasksDoneToday)}/{bn(kpis.tasksToday)}
              </Button>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-5 sm:w-auto sm:flex-row">
            <Gauge value={kpis.coverage} label="খানা কভারেজ" />
            <div className="hidden space-y-3 sm:block">
              <MiniStat label="প্রতিশ্রুত ভোট" value={bn(kpis.committedVotes)} sub={`জয়ের ${pct(committedPct)}`} />
              <MiniStat label="ব্যয়" value={formatMoney(kpis.spent)} sub={`সীমার ${pct(kpis.capPct)}`} />
              <MiniStat label="ওয়ার্ড ক্যাপ্টেন" value={`${bn(kpis.wards - kpis.wardVacancies)}/${bn(kpis.wards)}`} sub={`${bn(kpis.boothVacancies)} বুথ খালি`} />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" />
            <p className="text-[0.8rem] font-bold">নির্বাচনী সময়রেখা</p>
            <Badge tone="emerald">{bn(Math.max(0, kpis.daysLeft))} দিন বাকি</Badge>
          </div>
          <p className="text-[0.62rem] text-cream/35">
            <span className="sm:hidden">← সোয়াইপ করে বাকি ধাপ দেখুন</span>
            <span className="hidden sm:inline">তারিখ বদলালে সব কাউন্টডাউন স্বয়ংক্রিয়ভাবে বদলাবে</span>
          </p>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-night via-night/70 to-transparent sm:hidden" />
          <div className="hide-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 py-4 sm:px-5">
          {milestones.map((m) => {
            const d = daysUntil(m.date);
            const done = d < 0;
            return (
              <div
                key={m.label}
                className={`min-w-[124px] flex-1 snap-start rounded-xl border px-3 py-2.5 ${
                  done ? "border-white/[0.06] bg-white/[0.02] opacity-50" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.66rem] font-semibold text-cream/70">{m.label}</p>
                  {done ? <CheckCircle2 className="h-3 w-3 text-emerald-bright" /> : null}
                </div>
                <p className="mt-1 font-latin text-[0.78rem] font-bold text-cream">{formatBnDate(m.date, { day: "numeric", month: "short" })}</p>
                <p className={`mt-0.5 text-[0.56rem] ${done ? "text-cream/30" : "text-gold/70"}`}>
                  {done ? "সম্পন্ন" : `${bn(d)} দিন বাকি`}
                </p>
              </div>
            );
          })}
          </div>
        </div>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        <Stat label="মোট ভোটার" value={bnNum(kpis.voters)} icon={<Users className="h-3.5 w-3.5" />} sub="বুথভিত্তিক তালিকা" />
        <Stat label="খানা কভারেজ" value={pct(kpis.coverage)} icon={<Footprints className="h-3.5 w-3.5" />} progress={kpis.coverage} sub={`${bnNum(kpis.visited)} / ${bnNum(kpis.households)} খানা`} tone="emerald" />
        <Stat label="প্রতিশ্রুত ভোট" value={bnNum(kpis.committedVotes)} icon={<Target className="h-3.5 w-3.5" />} progress={committedPct} sub={`জয়ের ${pct(committedPct)}`} tone="gold" />
        <Stat label="জয়ের সংখ্যা" value={bnNum(kpis.winNumber)} icon={<TrendingUp className="h-3.5 w-3.5" />} sub={`${bn(turnoutVotes)} ভোট পড়বে (${bn(settings.turnoutAssumption)}%)`} />
        <Stat label="ব্যয়" value={formatMoney(kpis.spent)} icon={<Wallet className="h-3.5 w-3.5" />} progress={kpis.capPct} tone={kpis.capPct > 0.85 ? "rose" : "sky"} sub={`সীমা ${formatMoney(kpis.cap)}`} />
        <Stat label="পদ খালি" value={bn(kpis.wardVacancies + kpis.boothVacancies)} icon={<UserRound className="h-3.5 w-3.5" />} tone={kpis.wardVacancies ? "rose" : "muted"} sub={`${bn(kpis.wardVacancies)} ওয়ার্ড · ${bn(kpis.boothVacancies)} বুথ`} />
        <Stat label="খোলা চ্যালেঞ্জ" value={bn(kpis.openChallenges)} icon={<ShieldAlert className="h-3.5 w-3.5" />} tone={kpis.criticalChallenges ? "rose" : "gold"} sub={`${bn(kpis.criticalChallenges)}টি সংকটপূর্ণ`} />
        <Stat label="আজকের কাজ" value={`${bn(kpis.tasksDoneToday)}/${bn(kpis.tasksToday)}`} icon={<ClipboardList className="h-3.5 w-3.5" />} progress={kpis.tasksToday ? kpis.tasksDoneToday / kpis.tasksToday : 0} tone="emerald" sub={`${bn(kpis.teamSize)} জন দলে`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brief */}
        <Card>
          <CardHead
            title="আজকের স্মার্ট ব্রিফ"
            sub="ম্যানেজারের জন্য ৫টি অগ্রাধিকার"
            icon={<Sparkles className="h-4 w-4" />}
            action={<Badge tone="gold">স্বয়ংক্রিয়</Badge>}
          />
          <div className="divide-y divide-white/[0.05]">
            {brief.map((b, i) => (
              <button key={i} onClick={() => go(b.href as never)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] sm:px-5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/15 font-latin text-[0.62rem] font-bold text-gold">{bn(i + 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.76rem] font-semibold leading-snug text-cream/85">{b.title}</span>
                  <span className="mt-0.5 block truncate text-[0.62rem] text-cream/40">{b.detail}</span>
                </span>
                <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-cream/20" />
              </button>
            ))}
            {brief.length === 0 ? <p className="px-5 py-6 text-center text-[0.72rem] text-cream/35">আজ কোনো জরুরি কাজ নেই।</p> : null}
          </div>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHead title="সতর্কতা ও সংকেত" sub="থ্রেশহোল্ড ছাড়ালে স্বয়ংক্রিয় অ্যালার্ট" icon={<AlertTriangle className="h-4 w-4" />} action={<Badge tone={alerts.length ? "rose" : "emerald"}>{bn(alerts.length)}টি</Badge>} />
          <div className="max-h-[300px] space-y-2 overflow-y-auto p-3 sm:p-4">
            {alerts.map((a) => (
              <button key={a.id} onClick={() => a.href && go(a.href as never)} className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-transform hover:scale-[1.005] ${levelTone[a.level]}`}>
                <span className="mt-0.5 shrink-0">{levelIcon[a.level]}</span>
                <span className="min-w-0">
                  <span className="block text-[0.72rem] font-bold leading-snug">{a.title}</span>
                  <span className="mt-0.5 block text-[0.6rem] leading-relaxed opacity-70">{a.detail}</span>
                </span>
              </button>
            ))}
            {alerts.length === 0 ? <p className="px-2 py-6 text-center text-[0.72rem] text-emerald-bright/70">সব সূচক স্বাভাবিক আছে।</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Ward coverage */}
        <Card>
          <CardHead
            title="ওয়ার্ডভিত্তিক কভারেজ"
            sub="দরজায় দরজায় ভিজিটের অগ্রগতি"
            icon={<MapPin className="h-4 w-4" />}
            action={<Button size="sm" variant="ghost" onClick={() => go("map")}>ম্যাপে দেখুন</Button>}
          />
          <div className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 sm:p-5">
            {wardCoverage.map((w) => (
              <button key={w.id} onClick={() => go("map")} className="group text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-cream/75">
                    <span className="font-latin text-[0.6rem] text-cream/30">{bn(w.no)}</span> {w.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Badge tone={strengthTone[w.strength]}>{strengthLabels[w.strength]}</Badge>
                    <span className="font-latin text-[0.66rem] font-bold text-cream/60">{pct(w.coverage)}</span>
                  </span>
                </div>
                <Progress value={w.coverage} tone={w.coverage < 0.4 ? "rose" : w.coverage < 0.55 ? "gold" : "emerald"} className="mt-1.5" height="h-1" />
                <p className="mt-1 text-[0.55rem] text-cream/30">{bnNum(w.visited)} / {bnNum(w.households)} খানা · {bnNum(w.voters)} ভোটার</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Upcoming tasks */}
        <Card>
          <CardHead title="আসন্ন কাজ" sub="পরবর্তী ৫টি নির্ধারিত কাজ" icon={<CalendarDays className="h-4 w-4" />} action={<Button size="sm" variant="ghost" onClick={() => go("plan")}>সব দেখুন</Button>} />
          <div className="divide-y divide-white/[0.05]">
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-start gap-2.5 px-4 py-2.5">
                <div className="mt-0.5 w-9 shrink-0 rounded-md bg-white/[0.05] py-1 text-center">
                  <p className="font-latin text-[0.56rem] font-bold text-gold">{formatBnDate(t.date, { day: "2-digit" })}</p>
                  <p className="text-[0.48rem] text-cream/30">{formatBnDate(t.date, { month: "short" })}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.7rem] font-semibold text-cream/75">{t.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[0.56rem] text-cream/35"><Clock3 className="h-2.5 w-2.5" /> {t.time} · {t.assignee}</p>
                </div>
                {t.priority === "high" ? <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" title="জরুরি" /> : null}
              </div>
            ))}
            {upcoming.length === 0 ? <p className="px-4 py-6 text-center text-[0.7rem] text-cream/35">কোনো কাজ নির্ধারিত নেই।</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend */}
        <Card className="lg:col-span-2">
          <CardHead title="মাঠের গতি — শেষ ১৪ দিন" sub="খানা ভিজিট, অভিযোগ ও নতুন লিড" icon={<TrendingUp className="h-4 w-4" />} />
          <div className="p-4 sm:p-5">
            <TrendChart data={data.trend} />
            <div className="mt-3 flex flex-wrap gap-4 text-[0.62rem]">
              <span className="flex items-center gap-1.5 text-cream/45"><span className="h-2 w-2 rounded-sm bg-emerald-bright" /> ভিজিট ({bn(kpis.visits7d)} এই সপ্তাহে)</span>
              <span className="flex items-center gap-1.5 text-cream/45"><span className="h-2 w-2 rounded-sm bg-gold" /> অভিযোগ</span>
              <span className="flex items-center gap-1.5 text-cream/45"><span className="h-2 w-2 rounded-sm bg-sky-400" /> নতুন লিড</span>
            </div>
          </div>
        </Card>

        {/* Recent visits */}
        <Card>
          <CardHead title="সাম্প্রতিক ভিজিট" sub="সর্বশেষ ৫টি খানা রিপোর্ট" icon={<Footprints className="h-4 w-4" />} action={<Button size="sm" variant="ghost" onClick={() => go("canvass")}>লগ</Button>} />
          <div className="divide-y divide-white/[0.05]">
            {recentVisits.map((v) => {
              const h = households.find((x) => x.id === v.householdId);
              const booth = booths.find((b) => b.id === v.boothId);
              return (
                <div key={v.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[0.7rem] font-semibold text-cream/75">{h?.head || "খানা"}</p>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${v.status === "met-supportive" ? "bg-emerald-bright" : v.status === "met-hostile" ? "bg-rose-400" : "bg-gold"}`} />
                  </div>
                  <p className="mt-0.5 truncate text-[0.56rem] text-cream/35">
                    {booth?.code} · {booth?.village} · {v.by}
                  </p>
                </div>
              );
            })}
            {recentVisits.length === 0 ? <p className="px-4 py-6 text-center text-[0.7rem] text-cream/35">এখনো কোনো ভিজিট নেই।</p> : null}
          </div>
        </Card>
      </div>

      <p className="flex items-center gap-1.5 px-1 text-[0.56rem] text-cream/25">
        <CircleDollarSign className="h-3 w-3" /> ডেটা: {bn(team.length)} জন দল · {bn(data.crm.counts.feedback)} জনসেবা রেকর্ড · {bn(data.crm.counts.leads)} লিড · সর্বশেষ সিঙ্ক {new Date(data.generatedAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  const pctValue = Math.min(100, Math.max(0, Math.round(value * 100)));
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-[124px] w-[124px] shrink-0 place-items-center">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="#e7b75f"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pctValue) / 100}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-latin text-[1.45rem] font-extrabold leading-none text-cream">{bn(pctValue)}%</p>
        <p className="mt-1 text-[0.56rem] text-cream/40">{label}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-night/30 px-3 py-2">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[0.56rem] text-cream/40">{label}</p>
        <p className="font-latin text-[0.82rem] font-bold text-cream">{value}</p>
      </div>
      <p className="mt-0.5 text-right text-[0.52rem] text-gold/60">{sub}</p>
    </div>
  );
}

function TrendChart({ data }: { data: { day: string; visits: number; feedback: number; leads: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.visits));
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((d) => {
        const h = (d.visits / max) * 100;
        return (
          <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end gap-1">
            <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-night px-2 py-1 text-[0.55rem] text-cream/70 shadow-lg group-hover:block">
              {bn(d.visits)} ভিজিট · {formatBnDate(d.day, { day: "numeric", month: "short" })}
            </div>
            <div className="w-full rounded-t-sm bg-emerald-bright/55 transition-colors group-hover:bg-emerald-bright" style={{ height: `${Math.max(3, h)}%` }} />
            <div className="w-full rounded-b-sm bg-gold/35" style={{ height: `${Math.min(18, d.feedback * 6)}%` }} />
          </div>
        );
      })}
    </div>
  );
}
