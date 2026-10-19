"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import { activities, activityCategories } from "@/content/activities";
import { SmartImage } from "@/components/ui/smart-image";
import { cn, bn, formatBnDate } from "@/lib/utils";

export function ActivityGrid() {
  const [cat, setCat] = useState("সব");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(
    () => activities.filter((a) => cat === "সব" || a.category === cat),
    [cat],
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {activityCategories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-[0.72rem] font-semibold transition-colors", cat === c ? "border-forest bg-forest text-cream" : "border-forest/12 bg-white text-muted hover:border-forest/30 hover:text-forest")}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-1 rounded-full border border-forest/10 bg-white p-1">
          {(["grid", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("rounded-full px-3 py-1 text-[0.68rem] font-semibold transition-colors", view === v ? "bg-forest text-cream" : "text-muted")}>
              {v === "grid" ? "গ্রিড" : "তালিকা"}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={cat + view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={cn("mt-5", view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2.5")}
        >
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/activities/${a.id}`}
              className={cn(
                "group overflow-hidden border border-forest/10 bg-white transition-all hover:-translate-y-1 hover:shadow-lift",
                view === "grid" ? "rounded-3xl" : "flex items-center gap-4 rounded-2xl p-3",
              )}
            >
              <div className={cn("relative overflow-hidden", view === "grid" ? "" : "h-20 w-28 shrink-0 rounded-xl")}>
                <SmartImage imageKey={a.image} alt={a.title} className={view === "grid" ? "aspect-[16/11]" : "h-full w-full"} label={a.title} sizes="(max-width: 768px) 100vw, 33vw" imgClassName="group-hover:scale-105" />
                {view === "grid" && (
                  <>
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-night/70 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-night/70 px-2.5 py-0.5 text-[0.6rem] font-semibold text-gold backdrop-blur">{a.category}</span>
                    <p className="absolute bottom-2.5 left-3 flex items-center gap-1 text-[0.62rem] text-cream/80"><MapPin className="h-3 w-3" />{a.location}</p>
                  </>
                )}
              </div>
              <div className={view === "grid" ? "p-4" : "min-w-0 flex-1"}>
                <p className="text-[0.62rem] text-muted">{formatBnDate(a.date)} · ওয়ার্ড {a.ward}</p>
                <h3 className={cn("mt-0.5 font-bold leading-snug text-forest transition-colors group-hover:text-emerald", view === "grid" ? "text-[0.95rem]" : "text-[0.84rem]")}>{a.title}</h3>
                <p className={cn("mt-1 text-[0.74rem] leading-relaxed text-muted", view === "grid" ? "line-clamp-2" : "line-clamp-1")}>{a.summary}</p>
                {view === "grid" && (
                  <div className="mt-3 flex items-center justify-between border-t border-forest/8 pt-2.5">
                    <div className="flex gap-3">
                      {a.impact.slice(0, 2).map((m) => (
                        <span key={m.label} className="text-[0.6rem] text-muted"><strong className="font-latin font-bold text-forest">{m.value}</strong> {m.label}</span>
                      ))}
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-forest/25 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" />
                  </div>
                )}
              </div>
              {view === "list" && <ArrowUpRight className="h-4 w-4 shrink-0 text-forest/25 group-hover:text-forest" />}
            </Link>
          ))}
        </motion.div>
      </AnimatePresence>

      <p className="mt-5 text-center text-[0.72rem] text-muted">
        মোট {bn(filtered.length)}টি কার্যক্রম দেখানো হচ্ছে · {bn(activities.length)}টি নিবন্ধিত
      </p>
    </div>
  );
}
