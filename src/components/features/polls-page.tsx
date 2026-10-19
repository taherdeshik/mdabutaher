"use client";

import { useMemo, useState } from "react";
import { BarChart3, Filter, TrendingUp, Users } from "lucide-react";
import { PollCard } from "./poll-card";
import { seedPolls, pollArchiveSummary } from "@/content/polls";
import { cn, bn } from "@/lib/utils";

export function PollsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  const [category, setCategory] = useState("সব");

  const categories = useMemo(() => ["সব", ...new Set(seedPolls.map((p) => p.category))], []);
  const filtered = seedPolls
    .filter((p) => filter === "all" || p.status === filter)
    .filter((p) => category === "সব" || p.category === category);

  return (
    <div>
      <div className="grid gap-2 rounded-2xl border border-forest/10 bg-white p-3 sm:grid-cols-4">
        {[
          { icon: BarChart3, value: bn(pollArchiveSummary.totalPolls), label: "মোট জরিপ" },
          { icon: Users, value: bn(pollArchiveSummary.totalVotes.toLocaleString("en-US")), label: "মোট ভোট" },
          { icon: TrendingUp, value: "৯২%", label: "গড় সন্তুষ্টি" },
          { icon: Filter, value: bn(seedPolls.filter((p) => p.status === "active").length), label: "চলমান জরিপ" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 rounded-xl bg-cream/50 px-3 py-2">
            <s.icon className="h-4 w-4 text-emerald" />
            <div>
              <p className="font-latin text-sm font-bold text-forest">{s.value}</p>
              <p className="text-[0.6rem] text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-full bg-white p-1 border border-forest/10 sm:w-fit">
          {(["all", "active", "closed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("flex-1 rounded-full px-3.5 py-1.5 text-[0.72rem] font-semibold transition-colors sm:flex-none", filter === f ? "bg-forest text-cream" : "text-muted hover:text-forest")}>
              {f === "all" ? "সব" : f === "active" ? "চলমান" : "সম্পন্ন"}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[0.66rem] transition-colors", category === c ? "border-emerald bg-emerald/10 text-emerald" : "border-forest/10 text-muted hover:text-forest")}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {filtered.map((p) => <PollCard key={p.id} poll={p} />)}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-dashed border-forest/15 bg-white p-4">
        <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
        <p className="text-[0.72rem] leading-relaxed text-muted">
          জরিপের ফলাফল জনমতের প্রবণতা বোঝার জন্য — এটি কোনো আনুষ্ঠানিক নির্বাচনী জরিপ নয়। প্রতি ব্রাউজার/ডিভাইস থেকে একবার ভোট গ্রহণ করা হয়। ফলাফল প্রতিদিন স্বয়ংক্রিয়ভাবে আপডেট হয়।
        </p>
      </div>
    </div>
  );
}
