"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "সাবস্ক্রিপশন ব্যর্থ");
      setState("done");
      setMessage("ধন্যবাদ! আপডেট পাঠানো হবে।");
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "আবার চেষ্টা করুন");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald/30 bg-emerald/10 px-3 py-3 text-xs text-emerald-bright">
        <Check className="h-4 w-4 shrink-0" /> {message}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? "mt-3" : "mt-3"}>
      <div className="flex overflow-hidden rounded-full border border-white/15 bg-white/5 focus-within:border-gold/60">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ইমেইল দিন"
          aria-label="ইমেইল"
          className="h-10 w-full bg-transparent px-4 text-xs text-cream placeholder:text-cream/35 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="grid w-11 shrink-0 place-items-center bg-gold text-night transition-colors hover:bg-[#f0c777] disabled:opacity-60"
          aria-label="সাবস্ক্রাইব"
        >
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-[0.7rem] text-rose-300">{message}</p>}
    </form>
  );
}
