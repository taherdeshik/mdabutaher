"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowDownToLine, BarChart3, CalendarCheck, Check, ChevronRight,
  Clock, Download, Inbox, LayoutDashboard, Loader2, LogOut, MessageSquare,
  Phone, RefreshCw, Search, Send, Sparkles, Users, Workflow, X,
} from "lucide-react";
import { cn, bn, timeAgoBn, formatBnDate } from "@/lib/utils";

type Overview = {
  counts: Record<string, number>;
  trend: { day: string; appointments: number; feedback: number; volunteers: number }[];
  categories: Record<string, number>;
  wards: Record<string, number>;
  pipeline: { stage: string; count: number }[];
  recent: {
    appointments: any[];
    feedback: any[];
    messages: any[];
  };
};

type Tab = "overview" | "appointments" | "feedback" | "leads" | "messages";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { id: "appointments", label: "অ্যাপয়েন্টমেন্ট", icon: CalendarCheck },
  { id: "feedback", label: "রিপোর্ট", icon: AlertTriangle },
  { id: "leads", label: "লিড পাইপলাইন", icon: Workflow },
  { id: "messages", label: "বার্তা", icon: MessageSquare },
];

const stageLabel: Record<string, string> = { new: "নতুন", contacted: "যোগাযোগ", engaged: "সম্পৃক্ত", supporter: "সমর্থক" };
const statusLabel: Record<string, string> = {
  pending: "অপেক্ষমাণ", confirmed: "নিশ্চিত", completed: "সম্পন্ন", cancelled: "বাতিল",
  new: "নতুন", reviewing: "পর্যালোচনা", "in-progress": "চলমান", resolved: "সমাধান",
};

function Stat({ icon: Icon, label, value, hint, tone = "forest" }: { icon: any; label: string; value: string; hint?: string; tone?: string }) {
  const tones: Record<string, string> = {
    forest: "bg-forest/5 text-forest",
    gold: "bg-gold/15 text-gold-deep",
    emerald: "bg-emerald/10 text-emerald",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="rounded-2xl border border-forest/10 bg-white p-4">
      <div className="flex items-start justify-between">
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", tones[tone])}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-forest">{value}</p>
      <p className="text-[0.7rem] font-semibold text-forest/70">{label}</p>
      {hint && <p className="text-[0.62rem] text-muted">{hint}</p>}
    </div>
  );
}

export function AdminDashboard() {
  const [key, setKey] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Overview | null>(null);
  const [rows, setRows] = useState<{ appointments: any[]; feedback: any[]; leads: any[]; messages: any[] }>({ appointments: [], feedback: [], leads: [], messages: [] });
  const [query, setQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("mat-admin-key");
    if (saved) setKey(saved);
    const savedTab = localStorage.getItem("mat-admin-tab") as Tab | null;
    if (savedTab && tabs.some((t) => t.id === savedTab)) setTab(savedTab);
  }, []);

  const load = useCallback(async (adminKey: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/overview", { headers: { "x-admin-key": adminKey }, cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "লোড করা যায়নি");
      setData(json.data);
      const [a, f, l, m] = await Promise.all([
        fetch("/api/admin/export?type=appointments&key=" + adminKey, { cache: "no-store" }).then((r) => r.text()),
        fetch("/api/admin/export?type=feedback&key=" + adminKey, { cache: "no-store" }).then((r) => r.text()),
        fetch("/api/admin/export?type=leads&key=" + adminKey, { cache: "no-store" }).then((r) => r.text()),
        fetch("/api/admin/export?type=messages&key=" + adminKey, { cache: "no-store" }).then((r) => r.text()),
      ]);
      setRows({ appointments: parseCsv(a), feedback: parseCsv(f), leads: parseCsv(l), messages: parseCsv(m) });
      setKey(adminKey);
      localStorage.setItem("mat-admin-key", adminKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "লগইন ব্যর্থ");
      localStorage.removeItem("mat-admin-key");
      setKey("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (key) load(key);
  }, [key, load]);

  useEffect(() => { localStorage.setItem("mat-admin-tab", tab); }, [tab]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await load(json.data.key);
      setPasscode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "লগইন ব্যর্থ");
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("mat-admin-key");
    setKey("");
    setData(null);
  }

  if (!key || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-night p-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold font-display text-lg font-bold text-night">আ</span>
            <div>
              <p className="text-sm font-bold text-cream">কর্মী ড্যাশবোর্ড</p>
              <p className="text-[0.65rem] text-cream/40">CRM · ভেতরের ব্যবহারের জন্য</p>
            </div>
          </div>
          <form onSubmit={login} className="mt-6">
            <label className="text-[0.72rem] font-semibold text-cream/70" htmlFor="passcode">পাসকোড</label>
            <input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-cream placeholder:text-cream/30 focus:border-gold/60 focus:outline-none"
              autoComplete="current-password"
            />
            {error && <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-[0.72rem] text-rose-300">{error}</p>}
            <button type="submit" disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-night disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />} প্রবেশ করুন
            </button>
          </form>
          <p className="mt-4 rounded-lg border border-dashed border-white/15 px-3 py-2 text-center text-[0.62rem] leading-relaxed text-cream/40">
            ডেমো পাসকোড: <span className="font-latin font-bold text-gold">mahadan-2027</span>
            <br />
            <span className="text-cream/30">লাইভে যাওয়ার আগে <span className="font-latin">ADMIN_KEY</span> পরিবর্তন করুন</span>
          </p>
        </motion.div>
      </div>
    );
  }

  const c = data.counts;
  const q = query.trim();
  const fAppointments = rows.appointments.filter((r) => !q || JSON.stringify(r).includes(q));
  const fFeedback = rows.feedback.filter((r) => !q || JSON.stringify(r).includes(q));
  const fLeads = rows.leads.filter((r) => !q || JSON.stringify(r).includes(q));
  const fMessages = rows.messages.filter((r) => !q || JSON.stringify(r).includes(q));

  const maxTrend = Math.max(1, ...data.trend.map((t) => t.appointments + t.feedback + t.volunteers));

  return (
    <div className="min-h-screen bg-cream">
      {/* sidebar */}
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-forest/10 bg-night p-3 lg:flex">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold font-display text-base font-bold text-night">আ</span>
            <div>
              <p className="text-[0.78rem] font-bold text-cream">কর্মী CRM</p>
              <p className="text-[0.58rem] text-cream/40">মহাদান ২০২৭</p>
            </div>
          </div>
          <nav className="mt-3 space-y-0.5">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.76rem] font-medium transition-colors", tab === t.id ? "bg-white/10 text-gold" : "text-cream/55 hover:bg-white/5 hover:text-cream")}>
                <t.icon className="h-4 w-4" /> {t.label}
                {t.id === "feedback" && c.openFeedback > 0 && <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[0.58rem] font-bold text-white">{c.openFeedback}</span>}
                {t.id === "messages" && c.unread > 0 && <span className="ml-auto rounded-full bg-gold px-1.5 text-[0.58rem] font-bold text-night">{c.unread}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-1.5">
            <button onClick={() => load(key)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[0.72rem] text-cream/50 hover:bg-white/5 hover:text-cream">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> রিফ্রেশ
            </button>
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[0.72rem] text-cream/50 hover:bg-white/5 hover:text-cream">
              <LogOut className="h-3.5 w-3.5" /> লগআউট
            </button>
            <a href="/" className="block rounded-lg bg-white/5 px-2.5 py-2 text-center text-[0.68rem] text-cream/60">সাইটে ফিরুন</a>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-forest/10 bg-cream/90 backdrop-blur">
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="flex-1">
                <p className="text-[0.9rem] font-bold text-forest">{tabs.find((t) => t.id === tab)?.label}</p>
                <p className="text-[0.62rem] text-muted">সর্বশেষ আপডেট: এইমাত্র · স্বয়ংক্রিয় রিফ্রেশ</p>
              </div>
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="খুঁজুন..." className="h-9 w-44 rounded-full border border-forest/12 bg-white pl-8 pr-3 text-[0.72rem] focus:outline-none" />
              </div>
              <a href={`/api/admin/export?type=feedback&key=${key}`} className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-2 text-[0.68rem] font-semibold text-cream"><Download className="h-3 w-3" /> এক্সপোর্ট</a>
            </div>
            <div className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden hide-scrollbar">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[0.68rem] font-semibold", tab === t.id ? "bg-forest text-cream" : "bg-white text-muted")}>{t.label}</button>
              ))}
            </div>
          </header>

          <div className="p-4">
            {tab === "overview" && (
              <div>
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                  <Stat icon={CalendarCheck} label="মোট অ্যাপয়েন্টমেন্ট" value={bn(c.appointments)} hint={`${bn(c.pendingAppointments)} অপেক্ষমাণ`} />
                  <Stat icon={AlertTriangle} label="রিপোর্ট" value={bn(c.feedback)} hint={`${bn(c.openFeedback)} চলমান · ${bn(c.threats)} হুমকি`} tone="rose" />
                  <Stat icon={Users} label="লিড" value={bn(c.leads)} hint={`${bn(c.volunteers)} স্বেচ্ছাসেবক`} tone="emerald" />
                  <Stat icon={MessageSquare} label="বার্তা" value={bn(c.messages)} hint={`${bn(c.unread)} অপঠিত`} tone="gold" />
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
                  <div className="rounded-2xl border border-forest/10 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.8rem] font-bold text-forest">গত ১৪ দিনের কার্যক্রম</p>
                      <BarChart3 className="h-4 w-4 text-muted" />
                    </div>
                    <div className="mt-4 flex h-40 items-end gap-1.5">
                      {data.trend.map((t) => {
                        const total = t.appointments + t.feedback + t.volunteers;
                        return (
                          <div key={t.day} className="group relative flex flex-1 flex-col items-center gap-1">
                            <div className="relative flex w-full flex-col-reverse gap-0.5">
                              <div className="w-full rounded-t bg-forest/80 transition-all" style={{ height: `${(t.appointments / maxTrend) * 120}px` }} />
                              <div className="w-full bg-rose-400/80" style={{ height: `${(t.feedback / maxTrend) * 120}px` }} />
                              <div className="w-full rounded-t bg-gold" style={{ height: `${(t.volunteers / maxTrend) * 120}px` }} />
                            </div>
                            <span className="text-[0.5rem] text-muted">{t.day.slice(8)}</span>
                            <span className="pointer-events-none absolute -top-7 z-10 hidden rounded bg-night px-1.5 py-0.5 text-[0.55rem] text-cream group-hover:block">{bn(total)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex gap-3 text-[0.6rem] text-muted">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-forest" />অ্যাপয়েন্টমেন্ট</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-400" />রিপোর্ট</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-gold" />স্বেচ্ছাসেবক</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-forest/10 bg-white p-4">
                      <p className="text-[0.8rem] font-bold text-forest">লিড পাইপলাইন</p>
                      <div className="mt-3 space-y-2">
                        {data.pipeline.map((p) => (
                          <div key={p.stage}>
                            <div className="flex items-center justify-between text-[0.66rem]">
                              <span className="text-muted">{stageLabel[p.stage] || p.stage}</span>
                              <span className="font-latin font-bold text-forest">{bn(p.count)}</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest/8">
                              <div className="h-full rounded-full bg-gradient-to-r from-forest to-emerald" style={{ width: `${Math.min(100, (p.count / Math.max(1, c.leads)) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-forest p-4 text-cream">
                      <p className="text-[0.62rem] uppercase tracking-[0.16em] text-gold">আজকের ফোকাস</p>
                      <p className="mt-1.5 text-[0.78rem] leading-relaxed">৩টি অপেক্ষমাণ অ্যাপয়েন্টমেন্ট নিশ্চিত করুন এবং ২টি উচ্চ-গুরুত্বের রিপোর্টে সাড়া দিন।</p>
                      <button onClick={() => setTab("feedback")} className="mt-2.5 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-gold">রিপোর্ট দেখুন <ChevronRight className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  {[
                    { title: "সাম্প্রতিক অ্যাপয়েন্টমেন্ট", items: data.recent.appointments, type: "appointments" },
                    { title: "সাম্প্রতিক রিপোর্ট", items: data.recent.feedback, type: "feedback" },
                    { title: "সাম্প্রতিক বার্তা", items: data.recent.messages, type: "messages" },
                  ].map((block) => (
                    <div key={block.title} className="rounded-2xl border border-forest/10 bg-white p-4">
                      <p className="text-[0.76rem] font-bold text-forest">{block.title}</p>
                      <div className="mt-2 space-y-1.5">
                        {block.items.length === 0 && <p className="py-4 text-center text-[0.68rem] text-muted">এখনো কোনো তথ্য নেই</p>}
                        {block.items.map((it: any) => (
                          <div key={it.id} className="rounded-lg bg-cream/50 px-2.5 py-2">
                            <p className="truncate text-[0.7rem] font-semibold text-forest">{it.name || it.title || it.text?.slice(0, 40) || "—"}</p>
                            <p className="truncate text-[0.6rem] text-muted">{(it.topic || it.category || it.channel || "") + " · " + timeAgoBn(it.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "appointments" && (
              <div className="overflow-hidden rounded-2xl border border-forest/10 bg-white">
                <table className="w-full text-left text-[0.72rem]">
                  <thead className="bg-cream/60 text-[0.6rem] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-3 py-2.5">রেফারেন্স</th>
                      <th className="px-3 py-2.5">নাম / ফোন</th>
                      <th className="hidden px-3 py-2.5 sm:table-cell">তারিখ</th>
                      <th className="px-3 py-2.5">অবস্থা</th>
                      <th className="px-3 py-2.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest/5">
                    {fAppointments.length === 0 && <tr><td colSpan={5} className="px-3 py-10 text-center text-muted">কোনো অ্যাপয়েন্টমেন্ট নেই</td></tr>}
                    {fAppointments.map((r) => (
                      <tr key={r.id} className="hover:bg-cream/30">
                        <td className="px-3 py-2.5 font-latin text-[0.64rem] font-bold text-forest">{r.reference}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-forest">{r.name}</p>
                          <p className="font-latin text-[0.62rem] text-muted">{r.phone}</p>
                        </td>
                        <td className="hidden px-3 py-2.5 text-muted sm:table-cell">{formatBnDate(r.date)} · {r.slot}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-[0.58rem] font-semibold", r.status === "confirmed" ? "bg-emerald/10 text-emerald" : r.status === "pending" ? "bg-gold/20 text-gold-deep" : "bg-forest/5 text-muted")}>{statusLabel[r.status] || r.status}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1">
                            {r.status !== "confirmed" && (
                              <button onClick={() => updateAppointment(key, r.id, "confirmed", load)} className="grid h-7 w-7 place-items-center rounded-full bg-emerald/10 text-emerald hover:bg-emerald hover:text-white" aria-label="নিশ্চিত করুন" title="নিশ্চিত করুন"><Check className="h-3.5 w-3.5" /></button>
                            )}
                            <button onClick={() => updateAppointment(key, r.id, "cancelled", load)} className="grid h-7 w-7 place-items-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white" aria-label="বাতিল করুন" title="বাতিল করুন"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "feedback" && (
              <div className="space-y-2">
                {fFeedback.length === 0 && <div className="rounded-2xl border border-forest/10 bg-white py-12 text-center text-[0.75rem] text-muted">কোনো রিপোর্ট নেই</div>}
                {fFeedback.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-forest/10 bg-white p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-[0.56rem] font-bold uppercase", r.kind === "threat" ? "bg-rose-500 text-white" : r.kind === "advice" ? "bg-gold/20 text-gold-deep" : "bg-sky-50 text-sky-700")}>{r.kind}</span>
                          <span className="rounded-full bg-cream-2 px-2 py-0.5 text-[0.56rem] text-muted">{r.category} · ওয়ার্ড {r.ward}</span>
                          <span className="rounded-full bg-forest/5 px-2 py-0.5 text-[0.56rem] text-muted">{statusLabel[r.status] || r.status}</span>
                          <span className="text-[0.56rem] text-muted">{timeAgoBn(r.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-[0.8rem] font-bold text-forest">{r.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[0.68rem] text-muted">{r.details}</p>
                        <p className="mt-1 text-[0.6rem] text-muted">{r.name || "নাম গোপন"} · <span className="font-latin">{r.phone || "—"}</span> · {r.trackingId}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(["reviewing", "in-progress", "resolved"] as const).map((s) => (
                          <button key={s} onClick={() => updateFeedback(key, r.id, s, load)} className={cn("rounded-full border px-2 py-1 text-[0.56rem] font-semibold transition-colors", r.status === s ? "border-forest bg-forest text-cream" : "border-forest/12 text-muted hover:border-forest/30")}>{statusLabel[s]}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "leads" && (
              <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                {(["new", "contacted", "engaged", "supporter"] as const).map((stage) => (
                  <div key={stage} className="rounded-2xl border border-forest/10 bg-cream/50 p-2.5">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[0.7rem] font-bold text-forest">{stageLabel[stage]}</p>
                      <span className="rounded-full bg-white px-1.5 text-[0.58rem] font-bold text-muted">{fLeads.filter((l) => l.stage === stage).length}</span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {fLeads.filter((l) => l.stage === stage).map((l) => (
                        <div key={l.id} className="rounded-xl border border-forest/8 bg-white p-2.5">
                          <p className="text-[0.72rem] font-semibold text-forest">{l.name}</p>
                          <p className="font-latin text-[0.6rem] text-muted">{l.phone} · ওয়ার্ড {l.ward}</p>
                          <p className="mt-0.5 truncate text-[0.58rem] text-muted">{l.note || l.source}</p>
                          <div className="mt-1.5 flex gap-1">
                            {(["new", "contacted", "engaged", "supporter"] as const).filter((s) => s !== stage && s !== "new").map((s) => (
                              <button key={s} onClick={() => updateLead(key, l.id, s, load)} className="rounded bg-forest/5 px-1.5 py-0.5 text-[0.52rem] text-forest hover:bg-forest hover:text-cream">{stageLabel[s]}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "messages" && (
              <div className="space-y-2">
                {fMessages.length === 0 && <div className="rounded-2xl border border-forest/10 bg-white py-12 text-center text-[0.75rem] text-muted">কোনো বার্তা নেই</div>}
                {fMessages.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-2xl border border-forest/10 bg-white p-3.5">
                    <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full", m.read === "true" ? "bg-forest/5 text-muted" : "bg-gold/20 text-gold-deep")}><Inbox className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[0.76rem] font-semibold text-forest">{m.name || "অতিথি"}</p>
                        <span className="rounded-full bg-cream-2 px-1.5 py-0.5 text-[0.54rem] text-muted">{m.channel}</span>
                        <span className="text-[0.56rem] text-muted">{timeAgoBn(m.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[0.7rem] leading-relaxed text-ink/75">{m.text}</p>
                      {m.phone && <a href={`tel:${m.phone}`} className="mt-1 inline-flex items-center gap-1 text-[0.62rem] font-semibold text-emerald"><Phone className="h-2.5 w-2.5" />{m.phone}</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseCsv(csv: string): any[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map((line) => {
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cells[i] ?? ""));
    return obj;
  });
}

async function updateAppointment(key: string, id: string, status: string, reload: (k: string) => void) {
  await fetch(`/api/admin/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ status }) });
  reload(key);
}

async function updateFeedback(key: string, id: string, status: string, reload: (k: string) => void) {
  await fetch(`/api/admin/feedback/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ status, note: `অবস্থা আপডেট: ${statusLabel[status]}` }) });
  reload(key);
}

async function updateLead(key: string, id: string, stage: string, reload: (k: string) => void) {
  await fetch(`/api/admin/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ stage }) });
  reload(key);
}
