"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, MessageCircle, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Msg = { id: string; role: "user" | "bot"; text: string; ts: number };

const quickPrompts = [
  "অ্যাপয়েন্টমেন্ট কীভাবে নেব?",
  "এলাকার পানি সমস্যা",
  "ম্যানিফেস্টো পড়তে চাই",
  "স্বেচ্ছাসেবক হতে চাই",
];

function botReply(input: string): string {
  const t = input.toLowerCase();
  if (/অ্যাপয়েন্ট|সাক্ষাৎ|সময়|appoint/.test(input))
    return "অ্যাপয়েন্টমেন্ট পাতায় গিয়ে ধরন, তারিখ ও সময় বেছে নিন — ২ মিনিটে বুকিং সম্পন্ন হবে। নিশ্চিতকরণ রেফারেন্স নম্বরসহ পাবেন। চাইলে আমি লিংকটি দিতে পারি: /appointment";
  if (/পানি|নলকূপ|আর্সেনিক/.test(input))
    return "নিরাপদ পানি আমাদের ২ নং স্তম্ভ। আপনার এলাকার নলকূপ পরীক্ষা বা নতুন টিউবওয়েল প্রয়োজন হলে ‘সমস্যা ও পরামর্শ’ পাতায় ওয়ার্ড ও অবস্থানসহ রিপোর্ট করুন — ৭ কার্যদিবসে পদক্ষেপের আপডেট পাবেন।";
  if (/ম্যানিফেস্টো|অঙ্গীকার|ইশতেহার/.test(t))
    return "৮টি স্তম্ভে ৩২টি অঙ্গীকার রয়েছে — শিক্ষা, পানি, স্বাস্থ্য, অবকাঠামো, নিরাপত্তা, কৃষি, ডিজিটাল ও অন্তর্ভুক্তি। ‘ম্যানিফেস্টো’ পাতায় প্রতিটির সময়সীমা ও অগ্রগতি দেখতে পাবেন।";
  if (/স্বেচ্ছাসেবক|volunteer|যুক্ত/.test(input))
    return "দারুণ! ‘প্রচারণা’ পাতার স্বেচ্ছাসেবক ফর্মে নাম, ওয়ার্ড ও দক্ষতা দিন। আপনার ওয়ার্ড সমন্বয়ক ৪৮ ঘণ্টার মধ্যে যোগাযোগ করবেন।";
  if (/ইভেন্ট|সভা|ক্যাম্প|meeting/.test(input))
    return "আসন্ন ইভেন্ট: ২২ অক্টো যুব ডিজিটাল সংলাপ, ৮ নভে ফ্রি মেডিকেল ক্যাম্প, ১৪ নভে ম্যানিফেস্টো উন্মোচন। ‘ইভেন্ট’ পাতায় রেজিস্ট্রেশন করুন।";
  if (/অভিযোগ|সমস্যা|রিপোর্ট|feedback/.test(input))
    return "আপনার সমস্যা জানাতে ‘সমস্যা ও পরামর্শ’ পাতায় যান — ছবি সংযুক্ত করতে পারবেন এবং ট্র্যাকিং আইডি পাবেন। জরুরি হলে সরাসরি ০১৭১২-৩৪৫৬৭৮ নম্বরে কল করুন।";
  if (/ধন্যবাদ|thanks|শুকরিয়া/.test(input)) return "আপনাকেও ধন্যবাদ। মহাদান ইউনিয়নের জন্য আপনার মতামতই আমাদের শক্তি।";
  return "ধন্যবাদ আপনার বার্তার জন্য। আমি আবু তাহেরের ডিজিটাল সহকারী। আপনি অ্যাপয়েন্টমেন্ট, অভিযোগ, ম্যানিফেস্টো বা ইভেন্ট নিয়ে জিজ্ঞাসা করতে পারেন — অথবা সরাসরি মানুষের সাথে কথা বলতে চাইলে হোয়াটসঅ্যাপে যুক্ত হতে পারেন।";
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "bot",
      text: "আসসালামু আলাইকুম! আমি আবু তাহেরের ডিজিটাল সহকারী। কীভাবে সাহায্য করতে পারি?",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [nudge, setNudge] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setNudge(true), 12000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem("mat-chat");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Msg[];
        if (Array.isArray(parsed) && parsed.length > 1) setMessages(parsed);
      } catch {}
    }
  }, [open]);

  useEffect(() => {
    localStorage.setItem("mat-chat", JSON.stringify(messages.slice(-30)));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: trimmed, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    }).catch(() => {});
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "bot", text: botReply(trimmed), ts: Date.now() }]);
    }, 900);
  }

  return (
    <>
      <AnimatePresence>
        {nudge && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="fixed bottom-[5.4rem] right-4 z-40 hidden max-w-[15rem] rounded-2xl rounded-br-sm border border-forest/10 bg-white p-3 shadow-lift sm:block"
          >
            <button onClick={() => setNudge(false)} className="absolute right-2 top-2 text-muted hover:text-forest" aria-label="বন্ধ">
              <X className="h-3 w-3" />
            </button>
            <p className="pr-3 text-xs font-semibold text-forest">আপনার এলাকার সমস্যা আছে?</p>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">চ্যাটে লিখুন — আমরা ২৪ ঘণ্টার মধ্যে উত্তর দিই।</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => { setOpen((v) => !v); setNudge(false); }}
        className="fixed bottom-4 right-4 z-50 flex h-14 items-center gap-2 rounded-full bg-forest px-4 text-cream shadow-[0_18px_40px_-12px_rgba(10,48,37,.7)] sm:bottom-6 sm:right-6 sm:h-15"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-label={open ? "চ্যাট বন্ধ করুন" : "চ্যাট শুরু করুন"}
      >
        <span className="relative grid place-items-center">
          <span className="absolute h-8 w-8 animate-pulse-ring rounded-full bg-gold/50" />
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </span>
        <span className="hidden text-sm font-semibold sm:block">{open ? "বন্ধ" : "কথা বলুন"}</span>
        {!open && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-cream bg-gold" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-night/40 backdrop-blur-[2px] sm:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[86vh] flex-col overflow-hidden rounded-t-3xl border border-forest/10 bg-cream shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[34rem] sm:w-[23.5rem] sm:rounded-3xl"
            >
              <div className="flex items-center justify-between bg-forest px-4 py-3.5 text-cream">
                <div className="flex items-center gap-3">
                  <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gold font-display text-lg font-bold text-night">
                    আ
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-forest bg-emerald-bright" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">আবু তাহেরের টিম</p>
                    <p className="text-[0.65rem] text-cream/55">সাধারণত ৫ মিনিটে উত্তর দেয়</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link href="/chat" className="hidden rounded-full px-2 py-1 text-[0.65rem] text-cream/60 hover:text-gold sm:block" onClick={() => setOpen(false)}>
                    পূর্ণ পাতা
                  </Link>
                  <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" aria-label="বন্ধ">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(23,160,106,.06),transparent_55%)] p-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.8rem] leading-relaxed whitespace-pre-line",
                        m.role === "user"
                          ? "rounded-br-sm bg-forest text-cream"
                          : "rounded-bl-sm border border-forest/8 bg-white text-ink shadow-sm",
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-forest/8 bg-white px-3 py-3">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-forest/40"
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {messages.length < 4 && (
                <div className="flex gap-1.5 overflow-x-auto border-t border-forest/8 bg-white/60 px-3 py-2 hide-scrollbar">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="shrink-0 rounded-full border border-forest/12 bg-white px-2.5 py-1.5 text-[0.68rem] font-medium text-forest transition-colors hover:border-forest/30 hover:bg-cream"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="flex items-center gap-2 border-t border-forest/10 bg-white p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="আপনার বার্তা লিখুন..."
                  className="h-10 flex-1 rounded-full border border-forest/12 bg-cream/60 px-4 text-sm text-ink placeholder:text-muted/70 focus:border-emerald/50 focus:outline-none"
                  aria-label="বার্তা"
                />
                <button
                  type="submit"
                  className="grid h-10 w-10 place-items-center rounded-full bg-gold text-night transition-transform hover:scale-105"
                  aria-label="পাঠান"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </form>
              <p className="flex items-center justify-center gap-1 bg-white pb-2 text-[0.6rem] text-muted">
                <Sparkles className="h-2.5 w-2.5 text-gold-deep" /> এটি একটি ডেমো চ্যাট · জরুরি হলে ৯৯৯ কল করুন
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
