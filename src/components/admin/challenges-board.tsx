"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  LifeBuoy,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Field, Input, Modal, Select, Stat, Textarea } from "./admin-ui";
import { challengeCategories, challengeStatusLabels, severityLabels } from "./admin-labels";
import { bn } from "@/lib/utils";
import { helpArticles } from "@/content/help";
import type { Challenge, ChallengeSeverity, ChallengeStatus } from "@/lib/command-types";

const severityTone: Record<ChallengeSeverity, "muted" | "sky" | "gold" | "rose"> = {
  low: "muted",
  medium: "sky",
  high: "gold",
  critical: "rose",
};

const statusTone: Record<ChallengeStatus, "rose" | "gold" | "emerald"> = {
  open: "rose",
  monitoring: "gold",
  resolved: "emerald",
};

export function ChallengesBoard({ data, send }: SectionProps) {
  const [tab, setTab] = useState<"register" | "help">("register");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [wardId, setWardId] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<Challenge | null>(null);
  const [helpQuery, setHelpQuery] = useState("");
  const [helpCat, setHelpCat] = useState("all");
  const [openHelp, setOpenHelp] = useState<string | null>(helpArticles[0]?.id || null);

  const filtered = data.challenges.filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    if (severity !== "all" && c.severity !== severity) return false;
    if (wardId !== "all" && c.wardId !== wardId) return false;
    return true;
  });

  const helpCats = useMemo(() => ["all", ...new Set(helpArticles.map((a) => a.category))], []);
  const helpFiltered = helpArticles.filter((a) => {
    if (helpCat !== "all" && a.category !== helpCat) return false;
    const q = helpQuery.trim().toLowerCase();
    if (q && !`${a.title} ${a.body} ${a.category}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const counts = {
    open: data.challenges.filter((c) => c.status === "open").length,
    monitoring: data.challenges.filter((c) => c.status === "monitoring").length,
    resolved: data.challenges.filter((c) => c.status === "resolved").length,
    critical: data.challenges.filter((c) => c.severity === "critical" && c.status !== "resolved").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="খোলা চ্যালেঞ্জ" value={bn(counts.open)} icon={<CircleAlert className="h-3.5 w-3.5" />} tone="rose" sub="দ্রুত পদক্ষেপ দরকার" />
        <Stat label="সংকটপূর্ণ" value={bn(counts.critical)} icon={<ShieldAlert className="h-3.5 w-3.5" />} tone="rose" sub="সর্বোচ্চ অগ্রাধিকার" />
        <Stat label="পর্যবেক্ষণে" value={bn(counts.monitoring)} icon={<AlertTriangle className="h-3.5 w-3.5" />} tone="gold" sub="সমাধানের পথে" />
        <Stat label="সমাধান হয়েছে" value={bn(counts.resolved)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" sub="রেকর্ডে সংরক্ষিত" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {([
            ["register", "চ্যালেঞ্জ রেজিস্টার", CircleAlert],
            ["help", "সহায়তা গাইড", BookOpen],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.68rem] font-semibold transition-colors ${tab === id ? "bg-gold text-night" : "text-cream/45 hover:text-cream"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        {tab === "register" ? (
          <Button variant="gold" size="sm" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" /> নতুন চ্যালেঞ্জ</Button>
        ) : (
          <Badge tone="gold">{bn(helpArticles.length)}টি নির্দেশিকা</Badge>
        )}
      </div>

      {tab === "register" ? (
        <>
          <Card>
            <CardHead
              title="মাঠের চ্যালেঞ্জ ও সমাধান"
              sub={`${bn(filtered.length)}টি রেকর্ড`}
              icon={<LifeBuoy className="h-4 w-4" />}
              action={
                <div className="flex flex-wrap gap-1.5">
                  <Select value={wardId} onChange={(e) => setWardId(e.target.value)} className="h-8 w-auto text-[0.64rem]">
                    <option value="all">সব ওয়ার্ড</option>
                    {data.wards.map((w) => <option key={w.id} value={w.id}>ওয়ার্ড {bn(w.no)}</option>)}
                  </Select>
                  <Select value={severity} onChange={(e) => setSeverity(e.target.value)} className="h-8 w-auto text-[0.64rem]">
                    <option value="all">সব গুরুত্ব</option>
                    {Object.entries(severityLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </Select>
                  <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 w-auto text-[0.64rem]">
                    <option value="all">সব অবস্থা</option>
                    {Object.entries(challengeStatusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </Select>
                </div>
              }
            />
            <div className="grid gap-2.5 p-3 sm:p-4 lg:grid-cols-2">
              {filtered.map((c) => {
                const ward = data.wards.find((w) => w.id === c.wardId);
                const booth = data.booths.find((b) => b.id === c.boothId);
                return (
                  <button key={c.id} onClick={() => setDetail(c)} className={`group rounded-xl border p-3 text-left transition-all hover:bg-white/[0.045] ${c.status === "resolved" ? "border-white/[0.05] bg-white/[0.01] opacity-70" : c.severity === "critical" ? "border-rose-400/25 bg-rose-400/[0.037]" : "border-white/[0.07] bg-white/[0.025]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[0.74rem] font-bold leading-snug text-cream/85">{c.title}</p>
                        <p className="mt-1 line-clamp-2 text-[0.6rem] leading-relaxed text-cream/40">{c.detail}</p>
                      </div>
                      <Badge tone={severityTone[c.severity]}>{severityLabels[c.severity]}</Badge>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/[0.05] pt-2 text-[0.55rem] text-cream/30">
                      <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{ward ? `ওয়ার্ড ${bn(ward.no)}` : "ইউনিয়ন"}{booth ? ` · ${booth.code}` : ""}</span>
                      <span>{c.category}</span>
                      <span className="truncate">দায়িত্ব: {c.owner}</span>
                      <Badge tone={statusTone[c.status]}>{challengeStatusLabels[c.status]}</Badge>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 ? <p className="col-span-full px-2 py-8 text-center text-[0.7rem] text-cream/35">এই ফিল্টারে কিছু নেই।</p> : null}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card>
              <CardHead title="সর্বোচ্চ ঝুঁকি" sub="সংকটপূর্ণ ও খোলা চ্যালেঞ্জ" icon={<ShieldAlert className="h-4 w-4" />} />
              <div className="divide-y divide-white/[0.05]">
                {data.challenges.filter((c) => c.status !== "resolved").sort((a, b) => rank(b.severity) - rank(a.severity)).slice(0, 5).map((c) => (
                  <button key={c.id} onClick={() => setDetail(c)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03]">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.severity === "critical" ? "bg-rose-400" : c.severity === "high" ? "bg-gold" : "bg-sky-400"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.68rem] font-semibold text-cream/70">{c.title}</p>
                      <p className="text-[0.54rem] text-cream/30">{c.category} · {c.owner}</p>
                    </div>
                    <span className="shrink-0 text-[0.52rem] text-cream/25">{c.updatedAt}</span>
                  </button>
                ))}
              </div>
            </Card>
            <Card glow="gold">
              <CardHead title="দ্রুত সহায়তা" sub="সংকটে এই ধাপগুলো অনুসরণ করুন" icon={<Sparkles className="h-4 w-4" />} />
              <div className="space-y-2 p-4">
                {[
                  { t: "নিরাপত্তা আগে", d: "সংঘাতে জড়াবেন না; ঘটনার সময়, স্থান ও সাক্ষীর তথ্য লিখুন।" },
                  { t: "৯৯৯ ও ম্যানেজার", d: "জরুরি অবস্থায় ৯৯৯-এ জানান এবং ক্যাম্প ম্যানেজারকে অবহিত করুন।" },
                  { t: "লিখিত প্রমাণ", d: "ছবি, ভিডিও ও লিখিত অভিযোগ সংরক্ষণ করুন — পরে কাজে লাগবে।" },
                  { t: "রেজিস্টারে যোগ করুন", d: "প্রতিটি ঘটনা চ্যালেঞ্জ রেজিস্টারে লিখুন, যাতে ফলো-আপ না হারায়।" },
                ].map((s, i) => (
                  <div key={s.t} className="flex gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 font-latin text-[0.55rem] font-bold text-gold">{bn(i + 1)}</span>
                    <div><p className="text-[0.64rem] font-semibold text-cream/70">{s.t}</p><p className="mt-0.5 text-[0.56rem] leading-relaxed text-cream/35">{s.d}</p></div>
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="mt-1 w-full" onClick={() => setTab("help")}><BookOpen className="h-3.5 w-3.5" /> সম্পূর্ণ গাইড দেখুন</Button>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardHead
            title="সহায়তা ও আইনি নির্দেশিকা"
            sub="মাঠ, আইন, আচরণবিধি ও ভোটের দিনের জন্য"
            icon={<BookOpen className="h-4 w-4" />}
            action={<Badge tone="gold">বাংলা</Badge>}
          />
          <div className="flex flex-col gap-2 border-b border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/30" />
              <Input value={helpQuery} onChange={(e) => setHelpQuery(e.target.value)} placeholder="গাইড খুঁজুন — ব্যয়, ভিজিট, আচরণবিধি…" className="h-8 pl-8 text-[0.68rem]" />
            </div>
            <div className="flex gap-1 overflow-x-auto hide-scrollbar">
              {helpCats.map((cat) => (
                <button key={cat} onClick={() => setHelpCat(cat)} className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.58rem] transition-colors ${helpCat === cat ? "border-gold/40 bg-gold/15 text-gold" : "border-white/10 text-cream/40 hover:border-white/25"}`}>
                  {cat === "all" ? "সব" : cat}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {helpFiltered.map((a) => {
              const open = openHelp === a.id;
              return (
                <div key={a.id}>
                  <button onClick={() => setOpenHelp(open ? null : a.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.025] sm:px-5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-gold"><BookOpen className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.74rem] font-semibold text-cream/75">{a.title}</span>
                      <span className="block text-[0.54rem] text-cream/30">{a.category}</span>
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-cream/30 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open ? <p className="px-4 pb-4 pl-14 text-[0.66rem] leading-relaxed text-cream/45 sm:px-5 sm:pl-[60px]">{a.body}</p> : null}
                </div>
              );
            })}
            {helpFiltered.length === 0 ? <p className="px-4 py-8 text-center text-[0.7rem] text-cream/35">কিছু পাওয়া যায়নি।</p> : null}
          </div>
        </Card>
      )}

      <AddChallengeModal open={addOpen} onClose={() => setAddOpen(false)} data={data} send={send} />
      {detail ? <ChallengeDetail challenge={detail} data={data} send={send} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}

function rank(s: ChallengeSeverity) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s];
}

function ChallengeDetail({ challenge, data, send, onClose }: { challenge: Challenge; data: SectionProps["data"]; send: SectionProps["send"]; onClose: () => void }) {
  const [status, setStatus] = useState<ChallengeStatus>(challenge.status);
  const [resolution, setResolution] = useState(challenge.resolution || "");
  const [saving, setSaving] = useState(false);
  const ward = data.wards.find((w) => w.id === challenge.wardId);
  const booth = data.booths.find((b) => b.id === challenge.boothId);

  async function save() {
    setSaving(true);
    const err = await send("challenge", "update", challenge.id, { status, resolution });
    setSaving(false);
    if (!err) onClose();
  }

  return (
    <Modal open onClose={onClose} title={challenge.title} sub={`${challenge.category} · ${ward ? `ওয়ার্ড ${bn(ward.no)}` : "ইউনিয়ন"}${booth ? ` · ${booth.code}` : ""}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone={severityTone[challenge.severity]}>{severityLabels[challenge.severity]}</Badge>
          <Badge tone={statusTone[challenge.status]}>{challengeStatusLabels[challenge.status]}</Badge>
          <Badge tone="muted">দায়িত্ব: {challenge.owner}</Badge>
        </div>
        <p className="rounded-xl bg-white/[0.03] px-3.5 py-3 text-[0.7rem] leading-relaxed text-cream/60">{challenge.detail}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="অবস্থা">
            <Select value={status} onChange={(e) => setStatus(e.target.value as ChallengeStatus)}>
              {Object.entries(challengeStatusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </Field>
          <Field label="রেকর্ড আপডেট"><Input value={challenge.updatedAt} readOnly className="opacity-50" /></Field>
        </div>
        <Field label="সমাধান / অগ্রগতির নোট"><Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="কী পদক্ষেপ নেওয়া হয়েছে, কে দায়িত্বে, পরবর্তী ধাপ কী" /></Field>
        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <button onClick={() => send("challenge", "delete", challenge.id).then((err) => { if (!err) onClose(); })} className="flex items-center gap-1 text-[0.62rem] text-cream/25 transition-colors hover:text-rose-300"><Trash2 className="h-3 w-3" /> মুছুন</button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>বাতিল</Button>
            <Button variant="gold" size="sm" onClick={save} disabled={saving}>{saving ? "সংরক্ষণ…" : "আপডেট সংরক্ষণ"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AddChallengeModal({ open, onClose, data, send }: { open: boolean; onClose: () => void; data: SectionProps["data"]; send: SectionProps["send"] }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [wardId, setWardId] = useState("");
  const [boothId, setBoothId] = useState("");
  const [category, setCategory] = useState(challengeCategories[0]);
  const [severity, setSeverity] = useState<ChallengeSeverity>("medium");
  const [owner, setOwner] = useState("শাহাদাত হোসেন");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim()) {
      setError("শিরোনাম দিন");
      return;
    }
    setSaving(true);
    const err = await send("challenge", "create", undefined, { title, detail, wardId: wardId || undefined, boothId: boothId || undefined, category, severity, owner });
    setSaving(false);
    if (err) setError(err);
    else {
      setTitle("");
      setDetail("");
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="নতুন চ্যালেঞ্জ" sub="মাঠের সমস্যা, অভিযোগ বা ঝুঁকি রেকর্ড করুন">
      <div className="space-y-3">
        <Field label="শিরোনাম"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: ওয়ার্ড ৩-এ নলকূপের পানি লোহার সমস্যা" /></Field>
        <Field label="বিস্তারিত"><Textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="কী ঘটেছে, কতজন প্রভাবিত, কী দরকার" /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ওয়ার্ড">
            <Select value={wardId} onChange={(e) => { setWardId(e.target.value); setBoothId(""); }}>
              <option value="">ইউনিয়নব্যাপী</option>
              {data.wards.map((w) => <option key={w.id} value={w.id}>ওয়ার্ড {bn(w.no)} — {w.name}</option>)}
            </Select>
          </Field>
          <Field label="বুথ (ঐচ্ছিক)">
            <Select value={boothId} onChange={(e) => setBoothId(e.target.value)}>
              <option value="">নির্দিষ্ট নয়</option>
              {data.booths.filter((b) => !wardId || b.wardId === wardId).map((b) => <option key={b.id} value={b.id}>{b.code} — {b.village}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="ধরন">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {challengeCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="গুরুত্ব">
            <Select value={severity} onChange={(e) => setSeverity(e.target.value as ChallengeSeverity)}>
              {Object.entries(severityLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </Field>
          <Field label="দায়িত্বপ্রাপ্ত">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              {data.team.filter((t) => t.role !== "volunteer").map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </Select>
          </Field>
        </div>
        {error ? <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[0.68rem] text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>বাতিল</Button>
          <Button variant="gold" size="sm" onClick={submit} disabled={saving}>{saving ? "সংরক্ষণ…" : "চ্যালেঞ্জ যোগ করুন"}</Button>
        </div>
      </div>
    </Modal>
  );
}
