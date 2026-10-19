"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, Check, ChevronDown, Coins, Download, Target } from "lucide-react";
import { pillars, type Pillar } from "@/content/manifesto";
import { Icon } from "@/components/ui/icon";
import { cn, bn } from "@/lib/utils";

const accentBg = {
  emerald: "bg-emerald text-white",
  gold: "bg-gold text-night",
  sky: "bg-sky-600 text-white",
  rose: "bg-rose-500 text-white",
} as const;

const accentSoft = {
  emerald: "bg-emerald/10 text-emerald",
  gold: "bg-gold/15 text-gold-deep",
  sky: "bg-sky-500/10 text-sky-700",
  rose: "bg-rose-500/10 text-rose-600",
} as const;

export function ManifestoExplorer() {
  const [active, setActive] = useState(pillars[0].id);
  const [openCommitment, setOpenCommitment] = useState<string | null>(null);
  const pillar: Pillar = pillars.find((p) => p.id === active) ?? pillars[0];

  return (
    <div>
      {/* Pillar rail */}
      <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar lg:grid lg:grid-cols-8 lg:overflow-visible">
        {pillars.map((p) => {
          const on = active === p.id;
          return (
            <button
              key={p.id}
              onClick={() => { setActive(p.id); setOpenCommitment(null); }}
              className={cn(
                "group flex min-w-[7.5rem] flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all lg:min-w-0",
                on ? "border-forest bg-forest text-cream shadow-soft" : "border-forest/10 bg-white hover:border-forest/25",
              )}
            >
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg transition-colors", on ? "bg-white/10 text-gold" : accentSoft[p.accent])}>
                <Icon name={p.icon} className="h-4 w-4" />
              </span>
              <span className={cn("text-[0.75rem] font-bold leading-tight", on ? "text-cream" : "text-forest")}>{p.short}</span>
              <span className={cn("font-latin text-[0.58rem]", on ? "text-cream/40" : "text-muted/60")}>{p.number}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pillar.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          className="mt-6 grid gap-5 lg:grid-cols-[1.45fr_0.55fr]"
        >
          {/* Main panel */}
          <div className="rounded-3xl border border-forest/10 bg-white p-5 shadow-soft sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", accentBg[pillar.accent])}>
                  <Icon name={pillar.icon} className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-latin text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">স্তম্ভ {pillar.number}</p>
                  <h2 className="mt-0.5 text-xl font-bold leading-tight text-forest sm:text-2xl">{pillar.title}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="font-latin text-2xl font-extrabold text-forest">{pillar.progress}%</p>
                <p className="text-[0.6rem] text-muted">অগ্রগতি</p>
              </div>
            </div>

            <p className="mt-4 text-[0.9rem] leading-relaxed text-muted">{pillar.summary}</p>

            <div className="mt-4 rounded-xl border border-rose-500/15 bg-rose-50/60 p-3.5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-rose-600">সমস্যার চিত্র</p>
              <p className="mt-1 text-[0.8rem] leading-relaxed text-rose-900/70">{pillar.problem}</p>
            </div>

            <p className="mt-6 mb-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">৪টি সুনির্দিষ্ট অঙ্গীকার</p>
            <div className="space-y-2">
              {pillar.commitments.map((c, i) => {
                const key = `${pillar.id}-${i}`;
                const open = openCommitment === key;
                return (
                  <div key={key} className="overflow-hidden rounded-xl border border-forest/10">
                    <button onClick={() => setOpenCommitment(open ? null : key)} className="flex w-full items-center gap-3 bg-cream/40 px-3.5 py-3 text-left transition-colors hover:bg-cream/70">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest/8 text-[0.62rem] font-bold text-forest">{bn(i + 1)}</span>
                      <span className="flex-1 text-[0.84rem] font-semibold text-forest">{c.title}</span>
                      <span className="hidden rounded-full bg-white px-2 py-0.5 text-[0.6rem] font-medium text-muted sm:block">{c.timeline}</span>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="border-t border-forest/8 px-3.5 py-3">
                            <p className="text-[0.8rem] leading-relaxed text-muted">{c.detail}</p>
                            <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] font-semibold text-emerald"><CalendarDays className="h-3 w-3" />সময়সীমা: {c.timeline}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`/feedback?topic=${pillar.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[0.76rem] font-semibold text-cream transition-colors hover:bg-forest-2">
                এই বিষয়ে মতামত দিন <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <button className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 px-4 py-2 text-[0.76rem] font-semibold text-forest transition-colors hover:bg-cream">
                <Download className="h-3.5 w-3.5" /> এই অংশ সংরক্ষণ
              </button>
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-forest/10 bg-cream-2/60 p-4">
              <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted"><Target className="h-3.5 w-3.5" /> লক্ষ্য</p>
              <p className="mt-1.5 text-[0.82rem] font-semibold leading-relaxed text-forest">{pillar.target}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest/10">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald to-emerald-bright" style={{ width: `${pillar.progress}%` }} />
              </div>
              <p className="mt-1.5 text-[0.62rem] text-muted">বাস্তবায়ন অগ্রগতি · লাইভ ড্যাশবোর্ড থেকে</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {pillar.metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-forest/10 bg-white p-3">
                  <p className="font-latin text-sm font-extrabold text-forest">{m.value}</p>
                  <p className="mt-0.5 text-[0.62rem] leading-tight text-muted">{m.label}</p>
                </div>
              ))}
              <div className="rounded-xl border border-forest/10 bg-white p-3">
                <p className="flex items-center gap-1 font-latin text-sm font-extrabold text-forest"><Coins className="h-3 w-3 text-gold-deep" />{pillar.budget}</p>
                <p className="mt-0.5 text-[0.62rem] text-muted">৫ বছরের প্রাক্কলিত ব্যয়</p>
              </div>
            </div>

            <div className="rounded-2xl bg-forest p-4 text-cream">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-gold">SDG সংযোগ</p>
              <p className="mt-1 text-[0.78rem] leading-relaxed">{pillar.sdg}</p>
              <div className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-2.5 text-[0.66rem] text-cream/50">
                <Check className="h-3 w-3 text-emerald-bright" /> জাতীয় উন্নয়ন লক্ষ্যমাত্রার সাথে সামঞ্জস্যপূর্ণ
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
