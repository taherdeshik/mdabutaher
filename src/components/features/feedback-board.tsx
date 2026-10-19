"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Filter, Loader2, MapPin, MessageSquareHeart, ThumbsUp } from "lucide-react";
import { cn, bn, timeAgoBn } from "@/lib/utils";

type Item = {
  id: string; trackingId: string; kind: "problem" | "advice" | "threat"; category: string;
  title: string; details: string; ward: string; location?: string; severity: string;
  name: string; status: "new" | "reviewing" | "in-progress" | "resolved";
  supports: number; createdAt: string; updatedAt: string;
  timeline: { at: string; note: string; by: string }[];
};

const statusMeta = {
  new: { label: "নতুন", tone: "bg-sky-50 text-sky-700", ring: "bg-sky-500" },
  reviewing: { label: "পর্যালোচনায়", tone: "bg-gold/15 text-gold-deep", ring: "bg-gold-deep" },
  "in-progress": { label: "কাজ চলছে", tone: "bg-emerald/10 text-emerald", ring: "bg-emerald" },
  resolved: { label: "সমাধান হয়েছে", tone: "bg-emerald/15 text-emerald", ring: "bg-emerald" },
} as const;

const severities = ["low", "medium", "high", "critical"];
const wardOptions = ["all", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function FeedbackBoard() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [ward, setWard] = useState("all");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [supported, setSupported] = useState<Record<string, number>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/feedback?ward=${ward}&kind=${kind === "all" ? "" : kind}`)
      .then((r) => r.json())
      .then((j) => setItems(j.data?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [ward, kind]);

  const filtered = useMemo(
    () => items.filter((i) => status === "all" || i.status === status),
    [items, status],
  );

  async function support(id: string) {
    if (supported[id]) return;
    setSupported((s) => ({ ...s, [id]: 1 }));
    try {
      await fetch(`/api/feedback/${id}/support`, { method: "POST" });
      setItems((list) => list.map((i) => (i.id === id ? { ...i, supports: i.supports + 1 } : i)));
    } catch {}
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-forest/10 bg-white p-3">
        <span className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-muted"><Filter className="h-3.5 w-3.5" /> ফিল্টার</span>
        <select value={ward} onChange={(e) => setWard(e.target.value)} className="rounded-lg border border-forest/12 bg-white px-2.5 py-1.5 text-[0.72rem] text-forest focus:outline-none">
          {wardOptions.map((w) => <option key={w} value={w}>{w === "all" ? "সব ওয়ার্ড" : `ওয়ার্ড ${w}`}</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg border border-forest/12 bg-white px-2.5 py-1.5 text-[0.72rem] text-forest focus:outline-none">
          <option value="all">সব ধরন</option>
          <option value="problem">সমস্যা</option>
          <option value="advice">পরামর্শ</option>
        </select>
        <div className="ml-auto flex flex-wrap gap-1">
          {["all", "in-progress", "resolved"].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={cn("rounded-full px-3 py-1.5 text-[0.7rem] font-semibold transition-colors", status === s ? "bg-forest text-cream" : "text-muted hover:bg-cream")}>
              {s === "all" ? "সব" : s === "in-progress" ? "চলমান" : "সমাধান"}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="mt-8 flex items-center justify-center gap-2 py-12 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...</div>}

      {!loading && filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-forest/15 bg-white p-10 text-center">
          <MessageSquareHeart className="mx-auto h-9 w-9 text-muted/30" />
          <p className="mt-3 text-sm font-semibold text-forest">এখনো কোনো পাবলিক রিপোর্ট নেই</p>
          <p className="mt-1 text-[0.78rem] text-muted">প্রথম রিপোর্টটি আপনিই দিন — আপনার সমস্যা অনেকের সমস্যা হতে পারে।</p>
          <a href="/feedback" className="mt-4 inline-block rounded-full bg-forest px-4 py-2 text-[0.78rem] font-semibold text-cream">রিপোর্ট করুন</a>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {filtered.map((item, i) => {
          const meta = statusMeta[item.status];
          const sev = severities.indexOf(item.severity);
          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="flex flex-col rounded-2xl border border-forest/10 bg-white p-4 transition-shadow hover:shadow-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-forest/5 px-2 py-0.5 text-[0.6rem] font-semibold text-forest">{item.category}</span>
                  <span className="rounded-full bg-cream-2 px-2 py-0.5 text-[0.6rem] font-medium text-muted">ওয়ার্ড {item.ward}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-semibold", meta.tone)}>{meta.label}</span>
                </div>
                <span className="font-latin text-[0.58rem] text-muted/70">{item.trackingId}</span>
              </div>

              <h3 className="mt-2.5 text-[0.9rem] font-bold leading-snug text-forest">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-[0.75rem] leading-relaxed text-muted">{item.details}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] text-muted">
                {item.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>}
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{timeAgoBn(item.createdAt)}</span>
                <span className="inline-flex items-center gap-0.5">
                  {severities.map((_, idx) => (
                    <span key={idx} className={cn("h-1 w-3 rounded-full", idx <= sev ? (sev >= 2 ? "bg-rose-400" : "bg-gold") : "bg-forest/10")} />
                  ))}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-forest/8 pt-2.5">
                <span className="text-[0.66rem] text-muted">{item.name}</span>
                <button
                  onClick={() => support(item.id)}
                  disabled={Boolean(supported[item.id])}
                  className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.66rem] font-semibold transition-colors", supported[item.id] ? "border-emerald/30 bg-emerald/10 text-emerald" : "border-forest/12 text-forest hover:border-forest/30 hover:bg-cream")}
                >
                  <ThumbsUp className="h-3 w-3" /> {bn(item.supports)} {supported[item.id] ? "সমর্থন" : "সমর্থন করুন"}
                </button>
              </div>

              {item.timeline.length > 0 && (
                <div className="mt-2 rounded-lg bg-cream/60 px-2.5 py-2">
                  <p className="flex items-start gap-1.5 text-[0.65rem] leading-relaxed text-muted">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald" />
                    {item.timeline[item.timeline.length - 1].note}
                  </p>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
