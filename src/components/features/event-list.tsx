"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Search, Users } from "lucide-react";
import { events, eventTypes, type CampaignEvent } from "@/content/events";
import { cn, bn } from "@/lib/utils";

export function EventList({ items = events }: { items?: CampaignEvent[] }) {
  const [type, setType] = useState<string>("সব");
  const [query, setQuery] = useState("");
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");

  const filtered = useMemo(() => {
    return items
      .filter((e) => (when === "upcoming" ? e.status !== "past" : e.status === "past"))
      .filter((e) => type === "সব" || e.type === type)
      .filter((e) => !query || e.title.includes(query) || e.venue.includes(query) || e.ward.includes(query))
      .sort((a, b) => (when === "upcoming" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  }, [items, type, query, when]);

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-2xl border border-forest/10 bg-white p-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-full bg-cream p-1">
          {(["upcoming", "past"] as const).map((w) => (
            <button key={w} onClick={() => setWhen(w)} className={cn("rounded-full px-3.5 py-1.5 text-[0.72rem] font-semibold transition-colors", when === w ? "bg-forest text-cream" : "text-muted hover:text-forest")}>
              {w === "upcoming" ? "আসন্ন" : "সম্পন্ন"}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ইভেন্ট, স্থান বা ওয়ার্ড খুঁজুন" className="h-9 w-full rounded-full border border-forest/12 bg-white pl-9 pr-3 text-[0.78rem] focus:border-emerald/50 focus:outline-none" />
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-2 hide-scrollbar">
        {eventTypes.map((t) => (
          <button key={t} onClick={() => setType(t)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-[0.7rem] font-medium transition-colors", type === t ? "border-forest bg-forest text-cream" : "border-forest/12 bg-white text-muted hover:border-forest/30 hover:text-forest")}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-forest/15 bg-white p-10 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted/30" />
          <p className="mt-3 text-sm font-medium text-forest">কোনো ইভেন্ট পাওয়া যায়নি</p>
          <p className="mt-1 text-[0.75rem] text-muted">ফিল্টার পরিবর্তন করে দেখুন অথবা পরে আবার চেক করুন।</p>
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {filtered.map((e, i) => {
          const d = new Date(`${e.date}T00:00:00`);
          const pct = Math.round((e.registered / e.capacity) * 100);
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
              <Link href={`/events/${e.id}`} className="group flex flex-col gap-3 rounded-2xl border border-forest/10 bg-white p-4 transition-all hover:border-forest/20 hover:shadow-soft sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center gap-3">
                  <div className={cn("grid h-16 w-16 place-items-center rounded-xl", e.status === "past" ? "bg-cream-2 text-muted" : "bg-forest text-cream")}>
                    <span className="text-center leading-none">
                      <span className="block font-display text-xl font-bold">{bn(d.getDate())}</span>
                      <span className={cn("mt-1 block text-[0.52rem] uppercase tracking-widest", e.status === "past" ? "text-muted" : "text-cream/60")}>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                    </span>
                  </div>
                  <div className="sm:hidden">
                    <p className="text-[0.62rem] text-muted">{e.type} · ওয়ার্ড {e.ward}</p>
                    <p className="text-[0.72rem] font-semibold text-forest">{bn(e.start)}</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="hidden rounded-full bg-cream-2 px-2 py-0.5 text-[0.6rem] font-semibold text-forest sm:block">{e.type}</span>
                    <span className="text-[0.62rem] text-muted">ওয়ার্ড {e.ward}</span>
                    {e.status === "past" && <span className="rounded-full bg-forest/5 px-2 py-0.5 text-[0.58rem] text-muted">সম্পন্ন</span>}
                  </div>
                  <h3 className="mt-1 text-[0.92rem] font-bold leading-snug text-forest group-hover:text-emerald">{e.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.66rem] text-muted">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.venue}</span>
                    <span className="hidden items-center gap-1 sm:inline-flex"><Clock className="h-3 w-3" />{bn(e.start)} – {bn(e.end)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-forest/8 pt-2.5 sm:w-36 sm:border-0 sm:pt-0">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[0.6rem] text-muted">
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{bn(e.registered)}</span>
                      <span className="font-latin">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-forest/8">
                      <div className={cn("h-full rounded-full", pct > 90 ? "bg-rose-400" : "bg-gold")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="rounded-full bg-forest/5 px-2.5 py-1 text-[0.62rem] font-semibold text-forest transition-colors group-hover:bg-forest group-hover:text-cream">
                    {e.status === "past" ? "দেখুন" : "যোগ দিন"}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
