"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck2,
  ContactRound,
  Database,
  Footprints,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Map as MapIcon,
  Menu,
  Newspaper,
  Radio,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Target,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { bn, cn, formatBnDate } from "@/lib/utils";
import type { SectionId, Send, Snapshot } from "./types";
import { Button, Input } from "./admin-ui";
import { SituationRoom } from "./situation-room";
import { CoverageMap } from "./coverage-map";
import { CanvassBoard } from "./canvass-board";
import { RollIntel } from "./roll-intel";
import { WinNumber } from "./win-number";
import { DailyPlan } from "./daily-plan";
import { TeamBoard } from "./team-board";
import { ChallengesBoard } from "./challenges-board";
import { MoneyBoard } from "./money-board";
import { CmsManager } from "./cms-manager";
import { CrmBoard } from "./crm-board";
import { AdminSettings } from "./admin-settings";

const NAV: { group: string; items: { id: SectionId; label: string; short: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    group: "কমান্ড",
    items: [
      { id: "situation", label: "সিচুয়েশন রুম", short: "সিচুয়েশন", icon: LayoutDashboard },
      { id: "map", label: "কভারেজ ম্যাপ", short: "ম্যাপ", icon: MapIcon },
      { id: "win", label: "জয়ের হিসাব", short: "জয়", icon: Target },
    ],
  },
  {
    group: "মাঠ",
    items: [
      { id: "canvass", label: "দরজায় দরজায়", short: "ক্যানভাস", icon: Footprints },
      { id: "roll", label: "ভোটার তালিকা", short: "ভোটার", icon: Database },
      { id: "plan", label: "দৈনিক পরিকল্পনা", short: "পরিকল্পনা", icon: CalendarCheck2 },
    ],
  },
  {
    group: "সংগঠন",
    items: [
      { id: "team", label: "দল ও স্বেচ্ছাসেবক", short: "দল", icon: Users },
      { id: "challenges", label: "চ্যালেঞ্জ ও সহায়তা", short: "সহায়তা", icon: ShieldAlert },
    ],
  },
  {
    group: "অর্থ ও কনটেন্ট",
    items: [
      { id: "money", label: "ব্যয় ট্র্যাকার", short: "অর্থ", icon: Wallet },
      { id: "cms", label: "কনটেন্ট স্টুডিও", short: "কনটেন্ট", icon: Newspaper },
    ],
  },
  {
    group: "সম্পর্ক",
    items: [
      { id: "crm", label: "CRM ও বার্তা", short: "CRM", icon: ContactRound },
      { id: "settings", label: "সেটিংস", short: "সেটিংস", icon: Settings2 },
    ],
  },
];

const TITLES: Record<SectionId, { title: string; sub: string }> = {
  situation: { title: "সিচুয়েশন রুম", sub: "নির্বাচনের সার্বিক চিত্র — এক নজরে" },
  map: { title: "কভারেজ ম্যাপ", sub: "ওয়ার্ড ও বুথভিত্তিক দরজায় দরজায় কভারেজ" },
  canvass: { title: "দরজায় দরজায়", sub: "খানা ভিজিট, সমস্যা ও ফলো-আপ" },
  roll: { title: "ভোটার তালিকা বুদ্ধিমত্তা", sub: "বুথভিত্তিক ভোটার বিশ্লেষণ ও তালিকা আমদানি" },
  win: { title: "জয়ের হিসাব", sub: "টার্নআউট অনুমান, প্রয়োজনীয় ভোট ও ওয়ার্ড লক্ষ্য" },
  plan: { title: "দৈনিক পরিকল্পনা", sub: "আজকের কাজ, সময়সূচি ও মাঠের গতিবিধি" },
  team: { title: "দল ও স্বেচ্ছাসেবক", sub: "সংগঠন কাঠামো, দায়িত্ব ও পদ খালি" },
  challenges: { title: "চ্যালেঞ্জ ও সহায়তা", sub: "সমস্যা রেজিস্টার, সমাধান ও আইনি নির্দেশিকা" },
  money: { title: "ব্যয় ট্র্যাকার", sub: "ব্যয়সীমা, রশিদ ও নির্বাচনী হিসাব" },
  cms: { title: "কনটেন্ট স্টুডিও", sub: "সংবাদ, ইভেন্ট ও ব্লগ প্রকাশ — সাইটে সরাসরি" },
  crm: { title: "CRM ও বার্তা", sub: "সম্পর্ক, অভিযোগ, অ্যাপয়েন্টমেন্ট ও বার্তা" },
  settings: { title: "সেটিংস ও রিপোর্ট", sub: "নির্বাচনী তারিখ, টার্নআউট ও রপ্তানি" },
};

export function AdminShell() {
  const [checking, setChecking] = useState(true);
  const [key, setKey] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [data, setData] = useState<Snapshot | null>(null);
  const [section, setSection] = useState<SectionId>("situation");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [clock, setClock] = useState("");

  const load = useCallback(async (adminKey: string, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/admin/command", { headers: { "x-admin-key": adminKey }, cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ডেটা লোড করা যায়নি");
      setData(json.data);
      setKey(adminKey);
      localStorage.setItem("mat-admin-key", adminKey);
      setChecking(false);
      return true;
    } catch (error) {
      localStorage.removeItem("mat-admin-key");
      setData(null);
      setKey("");
      setLoginError(error instanceof Error ? error.message : "লগইন ব্যর্থ হয়েছে");
      setChecking(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("mat-admin-key");
    if (saved) {
      load(saved, true);
    } else {
      setChecking(false);
    }
    const savedSection = localStorage.getItem("mat-admin-section") as SectionId | null;
    if (savedSection) setSection(savedSection);
    setClock(
      new Date().toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    );
  }, [load]);

  useEffect(() => {
    localStorage.setItem("mat-admin-section", section);
  }, [section]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  const send: Send = useCallback(
    async (entity, action, id, payload) => {
      if (!key) return "লগইন প্রয়োজন";
      setBusy(true);
      try {
        const res = await fetch("/api/admin/command", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": key },
          body: JSON.stringify({ entity, action, id, data: payload, actor: "ক্যাম্প ম্যানেজার" }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "সংরক্ষণ ব্যর্থ হয়েছে");
        setData(json.data);
        setToast({ tone: "ok", text: "সংরক্ষিত হয়েছে" });
        return null;
      } catch (error) {
        const message = error instanceof Error ? error.message : "সংরক্ষণ ব্যর্থ হয়েছে";
        setToast({ tone: "error", text: message });
        return message;
      } finally {
        setBusy(false);
      }
    },
    [key],
  );

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) return;
    setLoginBusy(true);
    setLoginError("");
    const ok = await load(passcode.trim());
    if (!ok) setLoginError("পাসকোড সঠিক নয়। আবার চেষ্টা করুন।");
    setLoginBusy(false);
  }

  function logout() {
    localStorage.removeItem("mat-admin-key");
    setKey("");
    setData(null);
    setPasscode("");
    setLoginError("");
  }

  const counts = useMemo(() => {
    if (!data) return { alerts: 0, challenges: 0, drafts: 0, unread: 0 };
    return {
      alerts: data.alerts.filter((a) => a.level === "critical" || a.level === "high").length,
      challenges: data.kpis.openChallenges,
      drafts: data.posts.filter((p) => p.status === "draft").length,
      unread: data.crm.counts.unread,
    };
  }, [data]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#04110e] text-cream">
        <div className="flex flex-col items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold font-display text-2xl font-bold text-night">আ</span>
          <p className="flex items-center gap-2 text-[0.78rem] text-cream/50"><Loader2 className="h-3.5 w-3.5 animate-spin" /> কমান্ড সেন্টার লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  if (!data || !key) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#04110e] text-cream">
        <div className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-emerald/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-[0.72rem] text-cream/45 transition-colors hover:text-cream">
              <ArrowUpRight className="h-3.5 w-3.5 rotate-[-135deg]" /> পাবলিক সাইটে ফিরুন
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold font-display text-xl font-bold text-night">আ</span>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-gold/80">নির্বাচন ২০২৭</p>
                <p className="text-[0.8rem] font-bold">মোঃ আবু তাহের · মহাদান ইউনিয়ন</p>
              </div>
            </div>
            <h1 className="mt-8 max-w-lg font-display text-4xl font-extrabold leading-[1.12] sm:text-5xl">
              নির্বাচনী <span className="text-gold">কমান্ড সেন্টার</span>
            </h1>
            <p className="mt-4 max-w-md text-[0.86rem] leading-relaxed text-cream/50">
              দরজায় দরজায় কভারেজ, বুথভিত্তিক হিসাব, দলের দৈনিক পরিকল্পনা, ব্যয়সীমা ও কনটেন্ট — সব এক ড্যাশবোর্ডে।
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["৯ ওয়ার্ড", "২৭ বুথ", "খানা ক্যানভাস", "ব্যয়সীমা", "CMS"].map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.64rem] text-cream/55">{t}</span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-emerald-bright">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-bright opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-bright" />
              </span>
              সুরক্ষিত প্রবেশ
            </div>
            <h2 className="mt-3 text-xl font-bold">ক্যাম্পেইন টিম লগইন</h2>
            <p className="mt-1 text-[0.74rem] leading-relaxed text-cream/40">শুধু অনুমোদিত ক্যাম্প ম্যানেজার ও ক্যাপ্টেনদের জন্য।</p>
            <form onSubmit={login} className="mt-5 space-y-3">
              <div>
                <label htmlFor="passcode" className="mb-1 block text-[0.68rem] font-semibold text-cream/60">পাসকোড</label>
                <Input
                  id="passcode"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="h-11 bg-night/70 text-[0.9rem] tracking-[0.2em]"
                />
              </div>
              {loginError ? <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[0.7rem] text-rose-300">{loginError}</p> : null}
              <Button type="submit" variant="gold" className="h-11 w-full text-[0.82rem]" disabled={loginBusy}>
                {loginBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loginBusy ? "যাচাই হচ্ছে…" : "ড্যাশবোর্ডে প্রবেশ করুন"}
              </Button>
            </form>
            <div className="mt-5 rounded-xl border border-gold/20 bg-gold/[0.06] px-3.5 py-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-gold/70">ডেমো পাসকোড</p>
              <p className="mt-1 font-latin text-[0.95rem] font-bold tracking-wider text-gold">mahadan-2027</p>
              <p className="mt-1 text-[0.6rem] leading-relaxed text-cream/35">প্রোডাকশনে ADMIN_KEY এনভায়রনমেন্ট ভেরিয়েবল দিয়ে বদলে নিন।</p>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[0.6rem] text-cream/30">
              <LifeBuoy className="h-3 w-3" /> সহায়তা: ক্যাম্পেইন ম্যানেজার · ০১৭১২-৩৪৫৬৭৮
            </p>
          </div>
        </div>
      </div>
    );
  }

  const meta = TITLES[section];
  const Section = {
    situation: SituationRoom,
    map: CoverageMap,
    canvass: CanvassBoard,
    roll: RollIntel,
    win: WinNumber,
    plan: DailyPlan,
    team: TeamBoard,
    challenges: ChallengesBoard,
    money: MoneyBoard,
    cms: CmsManager,
    crm: CrmBoard,
    settings: AdminSettings,
  }[section];

  const badgeFor = (idsection: SectionId) => {
    if (idsection === "situation" && counts.alerts) return counts.alerts;
    if (idsection === "challenges" && counts.challenges) return counts.challenges;
    if (idsection === "cms" && counts.drafts) return counts.drafts;
    if (idsection === "crm" && counts.unread) return counts.unread;
    return null;
  };

  const Sidebar = (
    <div className="flex h-full w-[270px] shrink-0 flex-col border-r border-white/[0.07] bg-[#061713]">
      <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4 py-4">
        <Link href="/" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold font-display text-lg font-bold text-night" title="পাবলিক সাইট">আ</Link>
        <div className="min-w-0">
          <p className="truncate text-[0.78rem] font-bold text-cream">কমান্ড সেন্টার</p>
          <p className="truncate text-[0.58rem] text-cream/40">মহাদান ইউনিয়ন · ২০২৭</p>
        </div>
        <button onClick={() => setNavOpen(false)} className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-cream/50 lg:hidden" aria-label="মেনু বন্ধ">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {NAV.map((group) => (
          <div key={group.group} className="mb-3">
            <p className="px-2.5 pb-1 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-cream/25">{group.group}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = section === item.id;
                const badge = badgeFor(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSection(item.id);
                      setNavOpen(false);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[0.74rem] font-medium transition-colors",
                      active ? "bg-emerald-bright/12 text-cream" : "text-cream/50 hover:bg-white/[0.05] hover:text-cream/85",
                    )}
                  >
                    <item.icon className={cn("h-[15px] w-[15px] shrink-0", active ? "text-emerald-bright" : "text-cream/35 group-hover:text-gold/80")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge ? (
                      <span className={cn("grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.52rem] font-bold", item.id === "situation" ? "bg-rose-500/20 text-rose-300" : "bg-gold/20 text-gold")}>
                        {bn(badge)}
                      </span>
                    ) : null}
                    {active ? <span className="h-1 w-1 rounded-full bg-emerald-bright" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.07] p-3">
        <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/[0.1] to-transparent p-3">
          <div className="flex items-center justify-between">
            <p className="text-[0.58rem] font-semibold uppercase tracking-wider text-gold/70">ভোটের বাকি</p>
            <Radio className="h-3 w-3 animate-pulse text-gold" />
          </div>
          <p className="mt-1 font-latin text-2xl font-extrabold leading-none text-cream">
            {bn(Math.max(0, data.kpis.daysLeft))} <span className="text-[0.66rem] font-medium text-cream/45">দিন</span>
          </p>
          <p className="mt-1 text-[0.56rem] text-cream/35">{formatBnDate(data.settings.pollingDate)} · টার্নআউট লক্ষ্য {bn(data.settings.turnoutAssumption)}%</p>
        </div>
        <button onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[0.68rem] text-cream/35 transition-colors hover:bg-white/[0.05] hover:text-rose-300">
          <LogOut className="h-3.5 w-3.5" /> লগআউট
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#04110e] text-cream">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen lg:block">{Sidebar}</aside>

        {navOpen ? (
          <div className="fixed inset-0 z-[80] flex lg:hidden">
            <div className="absolute inset-0 bg-night/80 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
            <div className="relative h-full">{Sidebar}</div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#04110e]/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <button onClick={() => setNavOpen(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-cream/70 lg:hidden" aria-label="মেনু খুলুন">
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[0.92rem] font-bold leading-tight text-cream sm:text-[1rem]">{meta.title}</h1>
                <p className="truncate text-[0.6rem] text-cream/40">{meta.sub}</p>
              </div>
              <div className="hidden items-center gap-2 text-[0.62rem] text-cream/35 sm:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-bright opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-bright" />
                </span>
                লাইভ · {clock}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(key, true)}
                disabled={loading || busy}
                className="shrink-0"
                title="ডেটা রিফ্রেশ করুন"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", (loading || busy) && "animate-spin")} />
                <span className="hidden sm:inline">রিফ্রেশ</span>
              </Button>
              <Link href="/" className="hidden items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[0.66rem] text-cream/50 transition-colors hover:text-cream sm:inline-flex" title="পাবলিক সাইট">
                সাইট <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1450px] px-4 py-5 sm:px-6 sm:py-6">
            {loading ? <LoadingState /> : <Section data={data} send={send} adminKey={key} go={(id) => setSection(id)} />}
          </main>

          <footer className="mx-auto flex w-full max-w-[1450px] flex-col items-start justify-between gap-2 px-4 pb-8 pt-2 text-[0.58rem] text-cream/25 sm:flex-row sm:items-center sm:px-6">
            <p>মহাদান ইউনিয়ন কমান্ড সেন্টার · ডেমো ডেটা (নমুনা খানা ও ভোটার পরিসংখ্যান)</p>
            <p>সর্বশেষ সিঙ্ক {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
          </footer>
        </div>
      </div>

      {toast ? (
        <div className={cn("fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 rounded-full px-4 py-2 text-[0.72rem] font-semibold shadow-2xl sm:bottom-6", toast.tone === "ok" ? "bg-emerald-bright text-night" : "bg-rose-400 text-night")}>
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
      ))}
    </div>
  );
}
