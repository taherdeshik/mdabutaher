"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, CheckCircle2, Clock, Loader2, Lock, Users } from "lucide-react";
import type { Poll } from "@/content/polls";
import { bn } from "@/lib/utils";
import { cn } from "@/lib/utils";

function getFingerprint() {
  let fp = localStorage.getItem("mat-fp");
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem("mat-fp", fp);
  }
  return fp;
}

export function PollCard({ poll, featured = false }: { poll: Poll; featured?: boolean }) {
  const [current, setCurrent] = useState<Poll>(poll);
  const [choice, setChoice] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "voted" | "error">("idle");
  const [message, setMessage] = useState("");

  const total = current.options.reduce((s, o) => s + o.votes, 0);
  const votedOption = useMemo(
    () => current.options.find((o) => o.id === choice),
    [current.options, choice],
  );
  const closed = current.status === "closed";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mat-poll-${current.id}`);
      if (saved) {
        setChoice(saved);
        setState("voted");
      }
    } catch {}
  }, [current.id]);

  async function vote(optionId: string) {
    if (closed || state === "voted") return;
    setState("loading");
    setMessage("");
    try {
      const res = await fetch(`/api/polls/${current.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, fingerprint: getFingerprint() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ভোট গ্রহণ ব্যর্থ");
      localStorage.setItem(`mat-poll-${current.id}`, optionId);
      setChoice(optionId);
      setState("voted");
      setCurrent((p) => ({
        ...p,
        options: p.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
      }));
      setMessage("ভোট গ্রহণ হয়েছে — ধন্যবাদ!");
    } catch (e) {
      const err = e instanceof Error ? e.message : "আবার চেষ্টা করুন";
      setState("error");
      setMessage(err);
    }
  }

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-forest/10 bg-white", featured && "shadow-soft")}>
      <div className="flex items-start justify-between gap-3 border-b border-forest/8 bg-cream/50 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-cream">
              <BarChart3 className="h-3 w-3" /> {current.category}
            </span>
            {closed ? (
              <span className="inline-flex items-center gap-1 text-[0.62rem] text-muted"><Lock className="h-3 w-3" /> বন্ধ</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[0.62rem] text-emerald"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald" /> চলছে</span>
            )}
          </div>
          <h3 className="mt-2.5 text-[1.02rem] font-bold leading-snug text-forest">{current.question}</h3>
          <p className="mt-1 text-[0.76rem] text-muted">{current.description}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-2">
          {current.options.map((opt) => {
            const pct = total ? Math.round((opt.votes / total) * 100) : 0;
            const showResult = state === "voted" || closed;
            const selected = choice === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => vote(opt.id)}
                disabled={showResult || state === "loading"}
                className={cn(
                  "group relative w-full overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-all",
                  selected ? "border-emerald/40 bg-emerald/[0.06]" : "border-forest/10 bg-white hover:border-forest/25",
                  showResult && "cursor-default",
                )}
              >
                {showResult && (
                  <motion.span
                    className={cn("absolute inset-y-0 left-0", selected ? "bg-emerald/15" : "bg-forest/[0.045]")}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[0.83rem] font-medium text-forest">
                    <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full border", selected ? "border-emerald bg-emerald text-white" : "border-forest/20")}>
                      {selected && <CheckCircle2 className="h-3 w-3" />}
                    </span>
                    {opt.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {showResult && <span className="font-latin text-[0.7rem] font-bold text-forest">{pct}%</span>}
                    {showResult && <span className="text-[0.62rem] text-muted">{bn(opt.votes)}</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[0.68rem] text-muted">
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {bn(total)} জন ভোট দিয়েছেন</span>
          {current.closesAt && !closed && (
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> শেষ: {new Date(current.closesAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}</span>
          )}
        </div>

        <AnimatePresence>
          {(message || state === "loading") && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.72rem]",
                state === "error" ? "bg-rose-50 text-rose-600" : "bg-emerald/8 text-emerald",
              )}
            >
              {state === "loading" && <Loader2 className="h-3 w-3 animate-spin" />}
              {state === "loading" ? "ভোট পাঠানো হচ্ছে..." : message}
            </motion.p>
          )}
        </AnimatePresence>

        {state === "voted" && votedOption && (
          <p className="mt-3 rounded-lg bg-cream-2 px-3 py-2 text-[0.68rem] text-muted">
            আপনার ভোট: <strong className="text-forest">{votedOption.label}</strong> · ফলাফল লাইভ আপডেট হচ্ছে
          </p>
        )}
      </div>
    </div>
  );
}
