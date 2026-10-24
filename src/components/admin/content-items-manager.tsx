"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  EyeOff,
  Loader2,
  MapPinned,
  RotateCcw,
  Save,
  ScrollText,
  Search,
  Target,
} from "lucide-react";
import { events as baseEvents } from "@/content/events";
import { pillars as basePillars } from "@/content/manifesto";
import { cn, bn, formatBnDate } from "@/lib/utils";
import { Badge, Button, Card, CardHead, Field, Input, Progress, Stat, Textarea } from "./admin-ui";
import type { SectionProps } from "./types";

type Tab = "events" | "manifesto";

const STATUS_LABEL: Record<string, string> = { upcoming: "আসন্ন", past: "সম্পন্ন", live: "চলমান" };

export function ContentItemsManager({ data, send }: SectionProps) {
  const [tab, setTab] = useState<Tab>("events");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>(baseEvents[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const eventEdits = data.eventEdits ?? {};
  const pillarEdits = data.pillarEdits ?? {};

  // CMS posts of type "event" also appear on the public /events page.
  const cmsEventItems = useMemo(
    () => data.posts.filter((p) => p.type === "event").map((p) => ({ id: p.id, title: p.title, date: p.date, venue: p.venue || "", description: p.excerpt })),
    [data.posts],
  );

  const allEvents = useMemo(
    () => [
      ...cmsEventItems.map((p) => ({ id: p.id, title: p.title, date: p.date, venue: p.venue, description: p.description, start: "", end: "", ward: "", status: "upcoming" as const, cms: true })),
      ...baseEvents.map((e) => ({ id: e.id, title: e.title, date: e.date, venue: e.venue, description: e.description, start: e.start, end: e.end, ward: e.ward, status: e.status, cms: false })),
    ],
    [cmsEventItems],
  );

  const q = query.trim().toLowerCase();
  const filteredEvents = allEvents.filter((e) => !q || `${e.title} ${e.venue} ${e.date}`.toLowerCase().includes(q));
  const filteredPillars = basePillars.filter((p) => !q || `${p.title} ${p.summary} ${p.number}`.toLowerCase().includes(q));

  const customised =
    (tab === "events"
      ? allEvents.filter((e) => Object.keys(eventEdits[e.id] || {}).some((k) => k !== "hidden" && (eventEdits[e.id] as any)[k]))
      : basePillars.filter((p) => Object.keys(pillarEdits[p.id] || {}).some((k) => k !== "hidden" && (pillarEdits[p.id] as any)[k]))
    ).length;
  const hiddenCount =
    tab === "events"
      ? allEvents.filter((e) => eventEdits[e.id]?.hidden).length
      : basePillars.filter((p) => pillarEdits[p.id]?.hidden).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <Stat
          label={tab === "events" ? "মোট ইভেন্ট" : "মোট স্তম্ভ"}
          value={bn(tab === "events" ? allEvents.length : basePillars.length)}
          icon={tab === "events" ? <CalendarDays className="h-3.5 w-3.5" /> : <ScrollText className="h-3.5 w-3.5" />}
          sub={tab === "events" ? "কিউরেটেড + CMS পোস্ট" : "ম্যানিফেস্টোর ৮ স্তম্ভ"}
        />
        <Stat label="সম্পাদিত" value={bn(customised)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" sub="নিজের লেখা বসানো" />
        <Stat label="লুকানো" value={bn(hiddenCount)} icon={<EyeOff className="h-3.5 w-3.5" />} tone="rose" sub="সাইটে দেখাবে না" />
      </div>

      <Card>
        <CardHead
          title="ইভেন্ট ও ম্যানিফেস্টো"
          sub="প্রতিটি ইভেন্ট ও প্রতিটি অঙ্গীকার আলাদাভাবে সম্পাদনা করুন"
          icon={tab === "events" ? <CalendarDays className="h-4 w-4" /> : <ScrollText className="h-4 w-4" />}
          action={<Badge tone="muted">{bn(filteredEvents.length + filteredPillars.length)}</Badge>}
        />

        <div className="flex flex-col gap-2 border-b border-white/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {([
              { id: "events", label: "ইভেন্ট", icon: CalendarDays },
              { id: "manifesto", label: "ম্যানিফেস্টো", icon: ScrollText },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSelected(t.id === "events" ? baseEvents[0]?.id ?? "" : basePillars[0]?.id ?? "");
                  setNotice(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.68rem] font-semibold transition-colors",
                  tab === t.id ? "bg-gold text-night" : "text-cream/55 hover:text-cream",
                )}
              >
                <t.icon className="h-3 w-3" /> {t.label}
              </button>
            ))}
          </div>
          <div className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/25" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="খুঁজুন…" className="pl-8" />
          </div>
        </div>

        {notice && <p className="border-b border-emerald-bright/20 bg-emerald-bright/[0.06] px-4 py-2 text-[0.66rem] text-emerald-bright">{notice}</p>}

        <div className="grid gap-3 p-3 lg:grid-cols-[0.8fr_1.2fr]">
          {/* list */}
          <div className="max-h-[30rem] space-y-1 overflow-y-auto">
            {tab === "events"
              ? filteredEvents.map((e) => {
                  const edit = eventEdits[e.id];
                  const active = selected === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => { setSelected(e.id); setNotice(null); }}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                        active ? "bg-gold/12 text-gold" : "text-cream/70 hover:bg-white/[0.05] hover:text-cream",
                      )}
                    >
                      <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.72rem] font-semibold">{e.title}</span>
                        <span className="block truncate text-[0.56rem] text-cream/35">
                          {formatBnDate(e.date)} · {e.venue || "স্থান নেই"}
                          {e.cms ? " · CMS" : ""}
                        </span>
                      </span>
                      {edit?.hidden ? <EyeOff className="mt-0.5 h-3 w-3 shrink-0 text-rose-300/80" /> : null}
                    </button>
                  );
                })
              : filteredPillars.map((p) => {
                  const active = selected === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setSelected(p.id); setNotice(null); }}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                        active ? "bg-gold/12 text-gold" : "text-cream/70 hover:bg-white/[0.05] hover:text-cream",
                      )}
                    >
                      <span className="mt-0.5 font-latin text-[0.58rem] text-cream/25">{p.number}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.72rem] font-semibold">{pillarEdits[p.id]?.title || p.title}</span>
                        <span className="block truncate text-[0.56rem] text-cream/35">{p.commitments.length} অঙ্গীকার · {p.progress}%</span>
                      </span>
                      {pillarEdits[p.id]?.hidden ? <EyeOff className="mt-0.5 h-3 w-3 shrink-0 text-rose-300/80" /> : null}
                    </button>
                  );
                })}
          </div>

          {/* editor */}
          {tab === "events" ? (
            <EventEditor
              key={selected}
              id={selected}
              base={allEvents.find((e) => e.id === selected)}
              edit={eventEdits[selected]}
              busy={busy}
              setBusy={setBusy}
              onSaved={(msg) => setNotice(msg)}
              send={send}
            />
          ) : (
            <PillarEditor
              key={selected}
              id={selected}
              base={basePillars.find((p) => p.id === selected) ?? basePillars[0]}
              edit={pillarEdits[selected]}
              busy={busy}
              setBusy={setBusy}
              onSaved={(msg) => setNotice(msg)}
              send={send}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function EventEditor({
  id, base, edit, busy, setBusy, onSaved, send,
}: {
  id: string;
  base?: { title: string; date: string; start: string; end: string; venue: string; ward: string; description: string; status: string };
  edit?: Record<string, any>;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onSaved: (msg: string) => void;
  send: SectionProps["send"];
}) {
  const [title, setTitle] = useState(edit?.title || "");
  const [date, setDate] = useState(edit?.date || "");
  const [start, setStart] = useState(edit?.start || "");
  const [end, setEnd] = useState(edit?.end || "");
  const [venue, setVenue] = useState(edit?.venue || "");
  const [ward, setWard] = useState(edit?.ward || "");
  const [description, setDescription] = useState(edit?.description || "");
  const [status, setStatus] = useState(edit?.status || "");
  const [hidden, setHidden] = useState(Boolean(edit?.hidden));

  if (!base) return <p className="text-[0.7rem] text-cream/40">বাঁ দিক থেকে একটি ইভেন্ট বাছুন।</p>;

  async function save() {
    setBusy(true);
    const error = await send("eventitem", "update", id, { title, date, start, end, venue, ward, description, status, hidden });
    setBusy(false);
    if (!error) onSaved("ইভেন্ট সংরক্ষিত — সাইটে দেখা যাচ্ছে");
  }

  async function reset() {
    setBusy(true);
    const error = await send("eventitem", "reset", id);
    setBusy(false);
    if (!error) {
      setTitle(""); setDate(""); setStart(""); setEnd(""); setVenue("");
      setWard(""); setDescription(""); setStatus(""); setHidden(false);
      onSaved("ডিফল্ট ইভেন্ট ফিরিয়ে আনা হয়েছে");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[0.78rem] font-bold text-cream">{edit?.title || base.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[0.58rem] text-cream/35">
            <MapPinned className="h-2.5 w-2.5" /> {edit?.venue || base.venue || "স্থান নেই"} · {formatBnDate(edit?.date || base.date)}
          </p>
        </div>
        <Badge tone={hidden ? "rose" : "emerald"}>{hidden ? "লুকানো" : STATUS_LABEL[edit?.status || base.status] || "আসন্ন"}</Badge>
      </div>

      <Field label="শিরোনাম" hint={`খালি রাখলে: ${base.title}`}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={base.title} />
      </Field>

      <div className="grid grid-cols-3 gap-2">
        <Field label="তারিখ"><Input type="date" value={date || base.date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="শুরু"><Input type="time" value={start || base.start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="শেষ"><Input type="time" value={end || base.end} onChange={(e) => setEnd(e.target.value)} /></Field>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="স্থান"><Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={base.venue} /></Field>
        <Field label="ওয়ার্ড"><Input value={ward} onChange={(e) => setWard(e.target.value)} placeholder={base.ward || "ওয়ার্ড ৫"} /></Field>
      </div>

      <Field label="বর্ণনা">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={base.description} />
      </Field>

      <Field label="অবস্থা">
        <select
          value={status || base.status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full appearance-none rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-[0.78rem] text-cream outline-none focus:border-gold/60"
        >
          <option value="upcoming">আসন্ন</option>
          <option value="live">চলমান</option>
          <option value="past">সম্পন্ন</option>
        </select>
      </Field>

      <label className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-2 text-[0.66rem] text-cream/60">
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="h-3.5 w-3.5 accent-[#e7b75f]" />
        এই ইভেন্ট সাইটে দেখাবেন না
      </label>

      <div className="flex justify-end gap-1.5 border-t border-white/[0.06] pt-2.5">
        <Button size="sm" variant="outline" onClick={reset} disabled={busy}>
          <RotateCcw className="h-3 w-3" /> ডিফল্টে ফেরান
        </Button>
        <Button size="sm" variant="gold" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} সংরক্ষণ
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PillarEditor({
  id, base, edit, busy, setBusy, onSaved, send,
}: {
  id: string;
  base: { title: string; summary: string; problem: string; target: string; budget: string; progress: number; commitments: { title: string; detail: string; timeline: string }[] };
  edit?: Record<string, any>;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onSaved: (msg: string) => void;
  send: SectionProps["send"];
}) {
  const [title, setTitle] = useState(edit?.title || "");
  const [summary, setSummary] = useState(edit?.summary || "");
  const [problem, setProblem] = useState(edit?.problem || "");
  const [target, setTarget] = useState(edit?.target || "");
  const [budget, setBudget] = useState(edit?.budget || "");
  const [progress, setProgress] = useState<number>(typeof edit?.progress === "number" ? edit.progress : base.progress);
  const [hidden, setHidden] = useState(Boolean(edit?.hidden));
  const [commitments, setCommitments] = useState(
    base.commitments.map((c, i) => {
      const e = edit?.commitments?.[i] || {};
      return { title: e.title || "", detail: e.detail || "", timeline: e.timeline || "", original: c };
    }),
  );

  async function save() {
    setBusy(true);
    const error = await send("pillar", "update", id, {
      title, summary, problem, target, budget, progress, hidden,
      commitments: commitments.map((c) => ({ title: c.title, detail: c.detail, timeline: c.timeline })),
    });
    setBusy(false);
    if (!error) onSaved("স্তম্ভ ও অঙ্গীকার সংরক্ষিত — সাইটে দেখা যাচ্ছে");
  }

  async function reset() {
    setBusy(true);
    const error = await send("pillar", "reset", id);
    setBusy(false);
    if (!error) {
      setTitle(""); setSummary(""); setProblem(""); setTarget(""); setBudget("");
      setProgress(base.progress); setHidden(false);
      setCommitments(base.commitments.map((c) => ({ title: "", detail: "", timeline: "", original: c })));
      onSaved("ডিফল্ট ম্যানিফেস্টো ফিরিয়ে আনা হয়েছে");
    }
  }

  function setCommitment(index: number, key: "title" | "detail" | "timeline", value: string) {
    setCommitments((prev) => prev.map((c, i) => (i === index ? { ...c, [key]: value } : c)));
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[0.78rem] font-bold text-cream">{edit?.title || base.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[0.58rem] text-cream/35">
            <Target className="h-2.5 w-2.5" /> {base.commitments.length} অঙ্গীকার · অগ্রগতি {progress}%
          </p>
        </div>
        <Badge tone={hidden ? "rose" : "emerald"}>{hidden ? "লুকানো" : "দৃশ্যমান"}</Badge>
      </div>

      <Progress value={progress / 100} tone="emerald" />

      <Field label="স্তম্ভের নাম" hint={`খালি রাখলে: ${base.title}`}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={base.title} />
      </Field>

      <Field label="সারসংক্ষেপ">
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder={base.summary} />
      </Field>

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="সমস্যা / প্রেক্ষাপট"><Textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} placeholder={base.problem} /></Field>
        <Field label="লক্ষ্য (৫ বছরে)"><Textarea value={target} onChange={(e) => setTarget(e.target.value)} rows={2} placeholder={base.target} /></Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="বাজেট"><Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={base.budget} /></Field>
        <Field label={`অগ্রগতি — ${progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="mt-2 w-full accent-[#e7b75f]"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-white/[0.06] p-2.5">
        <p className="mb-2 text-[0.64rem] font-bold text-cream/70">অঙ্গীকারগুলো ({commitments.length})</p>
        <div className="space-y-2.5">
          {commitments.map((c, i) => (
            <div key={`${id}-${i}`} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
              <p className="text-[0.55rem] text-cream/30">অঙ্গীকার {bn(i + 1)}</p>
              <Input
                value={c.title}
                onChange={(e) => setCommitment(i, "title", e.target.value)}
                placeholder={c.original.title}
                className="mt-1 h-7 text-[0.68rem]"
              />
              <Textarea
                value={c.detail}
                onChange={(e) => setCommitment(i, "detail", e.target.value)}
                rows={2}
                placeholder={c.original.detail}
                className="mt-1 text-[0.68rem]"
              />
              <Input
                value={c.timeline}
                onChange={(e) => setCommitment(i, "timeline", e.target.value)}
                placeholder={c.original.timeline}
                className="mt-1 h-7 text-[0.66rem]"
              />
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-2 text-[0.66rem] text-cream/60">
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="h-3.5 w-3.5 accent-[#e7b75f]" />
        এই স্তম্ভ সাইটে দেখাবেন না
      </label>

      <div className="flex justify-end gap-1.5 border-t border-white/[0.06] pt-2.5">
        <Button size="sm" variant="outline" onClick={reset} disabled={busy}>
          <RotateCcw className="h-3 w-3" /> ডিফল্টে ফেরান
        </Button>
        <Button size="sm" variant="gold" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} সংরক্ষণ
        </Button>
      </div>
    </div>
  );
}
