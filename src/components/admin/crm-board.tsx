"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ContactRound,
  Mail,
  MessageSquare,
  Phone,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Stat } from "./admin-ui";
import { bn, formatBnDate } from "@/lib/utils";

const stageLabels = { new: "নতুন", contacted: "যোগাযোগ", engaged: "সম্পৃক্ত", supporter: "সমর্থক" } as const;
const stageTone = { new: "sky", contacted: "gold", engaged: "emerald", supporter: "emerald" } as const;

const feedbackStatusLabels: Record<string, string> = {
  new: "নতুন",
  reviewing: "পর্যালোচনায়",
  "in-progress": "চলমান",
  resolved: "সমাধান",
};

export function CrmBoard({ data, send }: SectionProps) {
  const { crm } = data;
  const [tab, setTab] = useState<"leads" | "feedback" | "appointments" | "messages">("leads");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="মোট লিড" value={bn(crm.counts.leads)} icon={<Users className="h-3.5 w-3.5" />} sub={`${bn(crm.counts.newLeads)}টি নতুন`} tone="gold" />
        <Stat label="সমর্থক" value={bn(crm.counts.supporters)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" sub="পাইপলাইনে নিশ্চিত" />
        <Stat label="খোলা অভিযোগ" value={bn(crm.counts.openFeedback)} icon={<ShieldAlert className="h-3.5 w-3.5" />} tone={crm.counts.threats ? "rose" : "gold"} sub={`${bn(crm.counts.threats)}টি হুমকি`} />
        <Stat label="অপেক্ষমাণ অ্যাপয়েন্টমেন্ট" value={bn(crm.counts.pendingAppointments)} icon={<CalendarClock className="h-3.5 w-3.5" />} tone="sky" sub={`${bn(crm.counts.unread)}টি অপঠিত বার্তা`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {([
            ["leads", "লিড পাইপলাইন", Users],
            ["feedback", "অভিযোগ ও পরামর্শ", CircleAlert],
            ["appointments", "অ্যাপয়েন্টমেন্ট", CalendarClock],
            ["messages", "বার্তা", MessageSquare],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.64rem] font-semibold transition-colors ${tab === id ? "bg-gold text-night" : "text-cream/45 hover:text-cream"}`}>
              <Icon className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>
        <a href="/admin/crm" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[0.64rem] font-semibold text-gold/70 hover:text-gold">
          সম্পূর্ণ CRM <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      {tab === "leads" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(["new", "contacted", "engaged", "supporter"] as const).map((stage) => {
            const items = crm.leads.filter((l) => l.stage === stage);
            return (
              <Card key={stage} className="flex flex-col">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5"><Badge tone={stageTone[stage]}>{stageLabels[stage]}</Badge><span className="text-[0.58rem] text-cream/30">{bn(items.length)}</span></div>
                  <UserRound className="h-3.5 w-3.5 text-cream/20" />
                </div>
                <div className="max-h-[420px] flex-1 space-y-1.5 overflow-y-auto p-2">
                  {items.map((l) => (
                    <div key={l.id} className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <p className="text-[0.66rem] font-semibold text-cream/75">{l.name}</p>
                        <span className="text-[0.5rem] text-cream/25">{l.source}</span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 font-latin text-[0.56rem] text-cream/35"><Phone className="h-2.5 w-2.5" /> {l.phone}</p>
                      <p className="mt-0.5 text-[0.54rem] text-cream/30">ওয়ার্ড {l.ward || "—"} · {formatBnDate(l.updatedAt.slice(0, 10))}</p>
                      <select
                        value={l.stage}
                        onChange={(e) => send("crm", "lead-stage", l.id, { stage: e.target.value })}
                        className="mt-1.5 w-full rounded border border-white/10 bg-night/60 px-1.5 py-1 text-[0.55rem] text-cream/55 outline-none"
                        aria-label="লিডের ধাপ"
                      >
                        {Object.entries(stageLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                      </select>
                    </div>
                  ))}
                  {items.length === 0 ? <p className="py-5 text-center text-[0.6rem] text-cream/25">খালি</p> : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {tab === "feedback" ? (
        <Card>
          <CardHead title="নাগরিক অভিযোগ, পরামর্শ ও হুমকি" sub={`${bn(crm.feedback.length)}টি সর্বশেষ`} icon={<ContactRound className="h-4 w-4" />} action={<Badge tone={crm.counts.threats ? "rose" : "emerald"}>{bn(crm.counts.threats)} হুমকি</Badge>} />
          <div className="divide-y divide-white/[0.05]">
            {crm.feedback.map((f) => (
              <div key={f.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={f.kind === "threat" ? "rose" : f.kind === "advice" ? "sky" : "gold"}>{f.kind === "threat" ? "হুমকি" : f.kind === "advice" ? "পরামর্শ" : "সমস্যা"}</Badge>
                    <span className="text-[0.58rem] text-cream/30">{f.trackingId} · {f.ward} · {formatBnDate(f.createdAt.slice(0, 10))}</span>
                  </div>
                  <p className="mt-1 truncate text-[0.7rem] font-semibold text-cream/75">{f.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[0.58rem] text-cream/35">{f.details}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[0.55rem] text-cream/30">{bn(f.supports)} সমর্থন</span>
                  <select
                    value={f.status}
                    onChange={(e) => send("crm", "feedback-status", f.id, { status: e.target.value })}
                    className="rounded-md border border-white/10 bg-night/60 px-2 py-1 text-[0.6rem] text-cream/55 outline-none"
                    aria-label="অভিযোগের অবস্থা"
                  >
                    {Object.entries(feedbackStatusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </div>
              </div>
            ))}
            {crm.feedback.length === 0 ? <p className="px-4 py-8 text-center text-[0.7rem] text-cream/35">কোনো অভিযোগ নেই।</p> : null}
          </div>
        </Card>
      ) : null}

      {tab === "appointments" ? (
        <Card>
          <CardHead title="সাক্ষাতের সময়সূচি" sub="নাগরিকদের অ্যাপয়েন্টমেন্ট" icon={<CalendarClock className="h-4 w-4" />} />
          <div className="divide-y divide-white/[0.05]">
            {crm.appointments.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.68rem] font-semibold text-cream/75">{a.name} <span className="font-latin text-[0.56rem] font-normal text-cream/30">{a.reference}</span></p>
                  <p className="mt-0.5 text-[0.56rem] text-cream/35">{a.type} · {formatBnDate(a.date)} · {a.slot} · {a.phone}</p>
                </div>
                <select
                  value={a.status}
                  onChange={(e) => send("crm", "appointment-status", a.id, { status: e.target.value })}
                  className="rounded-md border border-white/10 bg-night/60 px-2 py-1 text-[0.6rem] text-cream/55 outline-none"
                  aria-label="অ্যাপয়েন্টমেন্টের অবস্থা"
                >
                  <option value="pending">অপেক্ষমাণ</option>
                  <option value="confirmed">নিশ্চিত</option>
                  <option value="completed">সম্পন্ন</option>
                  <option value="cancelled">বাতিল</option>
                </select>
              </div>
            ))}
            {crm.appointments.length === 0 ? <p className="px-4 py-8 text-center text-[0.7rem] text-cream/35">কোনো অ্যাপয়েন্টমেন্ট নেই।</p> : null}
          </div>
        </Card>
      ) : null}

      {tab === "messages" ? (
        <Card>
          <CardHead title="বার্তা ইনবক্স" sub="চ্যাট, যোগাযোগ ফর্ম ও হোয়াটসঅ্যাপ" icon={<Mail className="h-4 w-4" />} action={<Badge tone={crm.counts.unread ? "gold" : "emerald"}>{bn(crm.counts.unread)} অপঠিত</Badge>} />
          <div className="divide-y divide-white/[0.05]">
            {crm.messages.map((m) => (
              <div key={m.id} className={`flex items-start gap-3 px-4 py-3 ${m.read ? "" : "bg-gold/[0.03]"}`}>
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${m.read ? "bg-white/[0.05] text-cream/30" : "bg-gold/15 text-gold"}`}><MessageSquare className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[0.66rem] font-semibold text-cream/70">{m.name || "অপরিচিত"}</p>
                    <span className="text-[0.52rem] text-cream/30">{m.channel} · {formatBnDate(m.createdAt.slice(0, 10))}</span>
                    {!m.read ? <span className="h-1.5 w-1.5 rounded-full bg-gold" /> : null}
                  </div>
                  <p className="mt-1 text-[0.62rem] leading-relaxed text-cream/45">{m.text}</p>
                </div>
                {!m.read ? <Button size="sm" variant="ghost" onClick={() => send("crm", "message-read", m.id)}>পঠিত</Button> : null}
              </div>
            ))}
            {crm.messages.length === 0 ? <p className="px-4 py-8 text-center text-[0.7rem] text-cream/35">কোনো বার্তা নেই।</p> : null}
          </div>
        </Card>
      ) : null}

      <p className="flex items-center gap-1.5 px-1 text-[0.56rem] text-cream/25">
        <Users className="h-3 w-3" /> CRM ডেটা পাবলিক ফর্ম, অ্যাপয়েন্টমেন্ট ও চ্যাট থেকে স্বয়ংক্রিয়ভাবে তৈরি হয়। সম্পূর্ণ টুল দেখতে <a href="/admin/crm" className="text-gold/60 hover:text-gold">/admin/crm</a> খুলুন।
      </p>
    </div>
  );
}
