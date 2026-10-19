"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Footprints,
  MessageSquareText,
  Phone,
  Search,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Field, Input, Modal, Progress, Select, Stat, Textarea } from "./admin-ui";
import { issueOptions, pct, supportLabels, visitStatusLabels } from "./admin-labels";
import { bn, formatBnDate } from "@/lib/utils";
import type { Household, VisitStatus } from "@/lib/command-types";

const supportTone = { committed: "emerald", leaning: "gold", undecided: "muted", hostile: "rose" } as const;

export function CanvassBoard({ data, send }: SectionProps) {
  const { households, wards, booths, team } = data;
  const [wardId, setWardId] = useState("all");
  const [boothId, setBoothId] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [onlyFollow, setOnlyFollow] = useState(false);
  const [limit, setLimit] = useState(36);
  const [active, setActive] = useState<Household | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return households.filter((h) => {
      if (wardId !== "all" && h.wardId !== wardId) return false;
      if (boothId !== "all" && h.boothId !== boothId) return false;
      if (status !== "all" && h.support !== status) return false;
      if (onlyFollow && !(h.followUp && h.followUp <= today && h.support !== "committed")) return false;
      if (q && !`${h.head} ${h.village} ${h.phone || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [households, wardId, boothId, status, onlyFollow, query, today]);

  const visible = filtered.slice(0, limit);
  const sample = {
    total: households.length,
    visited: households.filter((h) => h.status !== "unvisited").length,
    committed: households.filter((h) => h.support === "committed").length,
    follow: households.filter((h) => h.followUp && h.followUp <= today && h.support !== "committed").length,
  };
  const wardBooths = wardId === "all" ? booths : booths.filter((b) => b.wardId === wardId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="ওয়ার্কিং খাতা" value={bn(sample.total)} sub="নমুনা খানা (প্রতি বুথে ১৫)" icon={<Users className="h-3.5 w-3.5" />} />
        <Stat label="ভিজিট হয়েছে" value={bn(sample.visited)} progress={sample.total ? sample.visited / sample.total : 0} tone="emerald" icon={<Footprints className="h-3.5 w-3.5" />} sub={`${pct(sample.total ? sample.visited / sample.total : 0)} নমুনার`} />
        <Stat label="প্রতিশ্রুত খানা" value={bn(sample.committed)} tone="gold" icon={<CheckCircle2 className="h-3.5 w-3.5" />} sub="সমর্থন নিশ্চিত" />
        <Stat label="ফলো-আপ বাকি" value={bn(sample.follow)} tone={sample.follow ? "rose" : "muted"} icon={<CalendarClock className="h-3.5 w-3.5" />} sub="আজ বা তার আগে" />
      </div>

      <Card>
        <CardHead
          title="খানা ওয়ার্কিং লিস্ট"
          sub="গ্রাম/বুথ অনুযায়ী রুট — খানায় ক্লিক করে ভিজিট লগ করুন"
          icon={<Footprints className="h-4 w-4" />}
          action={
            <Button size="sm" variant={onlyFollow ? "gold" : "outline"} onClick={() => setOnlyFollow((v) => !v)}>
              <CalendarClock className="h-3.5 w-3.5" /> আজকের ফলো-আপ
            </Button>
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/30" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="নাম, গ্রাম বা ফোন খুঁজুন" className="h-8 pl-8 text-[0.68rem]" />
          </div>
          <Select value={wardId} onChange={(e) => { setWardId(e.target.value); setBoothId("all"); }} className="h-8 w-auto text-[0.68rem]">
            <option value="all">সব ওয়ার্ড</option>
            {wards.map((w) => <option key={w.id} value={w.id}>ওয়ার্ড {bn(w.no)} — {w.name}</option>)}
          </Select>
          <Select value={boothId} onChange={(e) => setBoothId(e.target.value)} className="h-8 w-auto text-[0.68rem]">
            <option value="all">সব বুথ</option>
            {wardBooths.map((b) => <option key={b.id} value={b.id}>{b.code} — {b.village}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 w-auto text-[0.68rem]">
            <option value="all">সব সমর্থন</option>
            <option value="committed">প্রতিশ্রুত</option>
            <option value="leaning">ঝোঁক</option>
            <option value="undecided">অনিশ্চিত</option>
            <option value="hostile">বিরোধী</option>
          </Select>
          <span className="text-[0.6rem] text-cream/30"><Filter className="mr-1 inline h-3 w-3" />{bn(filtered.length)} খানা</span>
        </div>

        <div className="grid gap-2.5 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
          {visible.map((h) => {
            const booth = booths.find((b) => b.id === h.boothId);
            const ward = wards.find((w) => w.id === h.wardId);
            const due = h.followUp && h.followUp <= today && h.support !== "committed";
            return (
              <button
                key={h.id}
                onClick={() => setActive(h)}
                className="group relative rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition-all hover:border-gold/30 hover:bg-white/[0.045]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${h.support === "committed" ? "bg-emerald-bright" : h.support === "hostile" ? "bg-rose-400" : "bg-gold"}`} />
                      <p className="truncate text-[0.76rem] font-bold text-cream/85">{h.head}</p>
                    </div>
                    <p className="mt-0.5 truncate text-[0.58rem] text-cream/35">{h.village} · ওয়ার্ড {bn(ward?.no || 0)} · {booth?.code}</p>
                  </div>
                  <Badge tone={supportTone[h.support]}>{supportLabels[h.support]}</Badge>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {h.issues.length ? h.issues.map((i) => <span key={i} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[0.54rem] text-cream/45">{i}</span>) : <span className="text-[0.54rem] text-cream/20">কোনো ইস্যু নেই</span>}
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.05] pt-2 text-[0.55rem] text-cream/30">
                  <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {bn(h.members)} সদস্য</span>
                  {due ? (
                    <span className="flex items-center gap-1 font-semibold text-rose-300"><CalendarClock className="h-2.5 w-2.5" /> ফলো-আপ</span>
                  ) : h.lastVisit ? (
                    <span className="flex items-center gap-1"><Clock3 className="h-2.5 w-2.5" /> {formatBnDate(h.lastVisit)}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-gold/60">ভিজিট বাকি</span>
                  )}
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="px-5 pb-8 text-center text-[0.72rem] text-cream/35">এই ফিল্টারে কোনো খানা পাওয়া যায়নি।</p>
        ) : null}

        {filtered.length > limit ? (
          <div className="border-t border-white/[0.06] px-5 py-3 text-center">
            <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + 36)}>আরও {bn(Math.min(36, filtered.length - limit))}টি খানা দেখুন</Button>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHead title="সাম্প্রতিক ভিজিট লগ" sub={`${bn(data.visits.length)}টি রেকর্ড`} icon={<MessageSquareText className="h-4 w-4" />} />
          <div className="max-h-[330px] divide-y divide-white/[0.05] overflow-y-auto">
            {data.visits.slice(0, 14).map((v) => {
              const h = households.find((x) => x.id === v.householdId);
              const b = booths.find((x) => x.id === v.boothId);
              return (
                <div key={v.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${v.status === "met-supportive" ? "bg-emerald-bright" : v.status === "met-hostile" ? "bg-rose-400" : "bg-gold"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[0.7rem] font-semibold text-cream/75">{h?.head || "খানা"} <span className="font-normal text-cream/30">· {b?.code}</span></p>
                      <span className="shrink-0 text-[0.54rem] text-cream/25">{new Date(v.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[0.59rem] text-cream/40">{visitStatusLabels[v.status]} · {v.by}</p>
                    {v.promise ? <p className="mt-0.5 truncate text-[0.56rem] text-gold/50">প্রতিশ্রুতি: {v.promise}</p> : null}
                  </div>
                </div>
              );
            })}
            {data.visits.length === 0 ? <p className="px-4 py-6 text-center text-[0.7rem] text-cream/35">এখনো কোনো ভিজিট নেই।</p> : null}
          </div>
        </Card>

        <Card>
          <CardHead title="বুথ কভারেজ — অগ্রাধিকার" sub="সবচেয়ে কম কভারেজ আগে" icon={<Target className="h-4 w-4" />} />
          <div className="space-y-2.5 p-4">
            {[...booths]
              .sort((a, b) => a.visited / a.households - b.visited / b.households)
              .slice(0, 6)
              .map((b) => {
                const w = wards.find((x) => x.id === b.wardId);
                const cov = b.visited / b.households;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between gap-2 text-[0.62rem]">
                      <span className="truncate text-cream/60">{b.code} · {b.village} <span className="text-cream/25">· ওয়ার্ড {bn(w?.no || 0)}</span></span>
                      <span className="font-latin font-semibold text-cream/50">{pct(cov)}</span>
                    </div>
                    <Progress value={cov} tone={cov < 0.4 ? "rose" : cov < 0.55 ? "gold" : "emerald"} className="mt-1" height="h-1" />
                  </div>
                );
              })}
          </div>
          <div className="border-t border-white/[0.06] px-4 py-3">
            <p className="text-[0.58rem] leading-relaxed text-cream/30">
              কভারেজ হিসাব মোট খানা থেকে; তালিকায় দেখানো হচ্ছে প্রতি বুথের ১৫টি নমুনা খানা (ডেমো)। বাস্তব ফিল্ড অ্যাপে সম্পূর্ণ তালিকা সিঙ্ক হবে।
            </p>
          </div>
        </Card>
      </div>

      {active ? <VisitModal household={active} data={data} send={send} onClose={() => setActive(null)} /> : null}
    </div>
  );
}

function VisitModal({ household, data, send, onClose }: { household: Household; data: SectionProps["data"]; send: SectionProps["send"]; onClose: () => void }) {
  const booth = data.booths.find((b) => b.id === household.boothId);
  const ward = data.wards.find((w) => w.id === household.wardId);
  const [status, setStatus] = useState<VisitStatus>("met-supportive");
  const [issues, setIssues] = useState<string[]>(household.issues || []);
  const [promise, setPromise] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleIssue = (i: string) => setIssues((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  async function submit() {
    setSaving(true);
    setError("");
    const err = await send("visit", "create", household.id, { status, issues, promise, followUp, note, by: data.team.find((t) => t.id === booth?.captainId)?.name || "ক্যাম্প ম্যানেজার" });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  }

  const statuses: { id: VisitStatus; label: string; tone: string }[] = [
    { id: "met-supportive", label: "সমর্থন জানিয়েছেন", tone: "border-emerald-bright/50 bg-emerald-bright/10 text-emerald-bright" },
    { id: "met-undecided", label: "অনিশ্চিত", tone: "border-gold/50 bg-gold/10 text-gold" },
    { id: "met-hostile", label: "বিরোধী", tone: "border-rose-400/50 bg-rose-400/10 text-rose-300" },
    { id: "absent", label: "কেউ ছিলেন না", tone: "border-white/20 bg-white/[0.06] text-cream/60" },
    { id: "refused", label: "কথা বলতে রাজি নন", tone: "border-white/10 bg-white/[0.03] text-cream/40" },
  ];

  return (
    <Modal open onClose={onClose} title={household.head} sub={`${household.village} · ${booth?.code} · ওয়ার্ড ${bn(ward?.no || 0)} · ${bn(household.members)} সদস্য`} width="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-[0.6rem]">
          <div className="rounded-lg bg-white/[0.04] p-2.5"><p className="text-cream/30">বর্তমান অবস্থা</p><p className="mt-0.5 font-semibold text-cream/70">{supportLabels[household.support]}</p></div>
          <div className="rounded-lg bg-white/[0.04] p-2.5"><p className="text-cream/30">শেষ ভিজিট</p><p className="mt-0.5 font-semibold text-cream/70">{household.lastVisit || "কখনো নয়"}</p></div>
          <div className="rounded-lg bg-white/[0.04] p-2.5"><p className="text-cream/30">ফোন</p><p className="mt-0.5 flex items-center gap-1 font-latin font-semibold text-cream/70">{household.phone ? <><Phone className="h-2.5 w-2.5" /> {household.phone}</> : "নেই"}</p></div>
        </div>

        <div>
          <p className="mb-1.5 text-[0.68rem] font-semibold text-cream/60">আজকের ভিজিটের ফলাফল</p>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <button key={s.id} onClick={() => setStatus(s.id)} className={`rounded-lg border px-2.5 py-1.5 text-[0.64rem] font-semibold transition-all ${status === s.id ? s.tone : "border-white/10 bg-white/[0.02] text-cream/40 hover:border-white/20"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[0.68rem] font-semibold text-cream/60">উত্থাপিত সমস্যা</p>
          <div className="flex flex-wrap gap-1.5">
            {issueOptions.map((i) => (
              <button key={i} onClick={() => toggleIssue(i)} className={`rounded-full border px-2.5 py-1 text-[0.6rem] transition-colors ${issues.includes(i) ? "border-gold/50 bg-gold/15 text-gold" : "border-white/10 text-cream/40 hover:border-white/25"}`}>
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="প্রতিশ্রুতি / সমাধানের আশ্বাস"><Textarea value={promise} onChange={(e) => setPromise(e.target.value)} placeholder="যেমন: আগামী ১৫ দিনের মধ্যে পানি পরীক্ষার তারিখ জানাবো" className="min-h-[64px]" /></Field>
          <div className="space-y-3">
            <Field label="পরবর্তী ফলো-আপ"><Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} /></Field>
            <Field label="সংক্ষিপ্ত নোট"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="পরিবারের সদস্যদের মন্তব্য" /></Field>
          </div>
        </div>

        {error ? <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[0.68rem] text-rose-300">{error}</p> : null}

        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <p className="flex items-center gap-1 text-[0.56rem] text-cream/30"><UserRound className="h-3 w-3" /> রিপোর্টার: {data.team.find((t) => t.id === booth?.captainId)?.name || "ক্যাম্প ম্যানেজার"}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>বাতিল</Button>
            <Button variant="gold" size="sm" onClick={submit} disabled={saving}>{saving ? "সংরক্ষণ হচ্ছে…" : "ভিজিট সংরক্ষণ করুন"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
