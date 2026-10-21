"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Bot, Clock, MessageCircle, Paperclip, Phone, ShieldCheck, Sparkles, User } from "lucide-react";
import { cn, withBasePath } from "@/lib/utils";
import { site } from "@/content/site";

type Msg = { id: string; role: "user" | "agent"; text: string; ts: number };

const suggestions = [
  "অ্যাপয়েন্টমেন্ট কীভাবে নেব?",
  "আমার এলাকায় পানির সমস্যা",
  "স্বেচ্ছাসেবক হতে চাই",
  "ম্যানিফেস্টো সম্পর্কে জানতে চাই",
  "আসন্ন ইভেন্টের তালিকা",
];

function reply(input: string) {
  if (/অ্যাপয়েন্ট|সাক্ষাৎ|সময়/.test(input)) return "‘অ্যাপয়েন্টমেন্ট’ পাতায় গিয়ে ধরন, তারিখ ও সময় বেছে নিলেই ২ মিনিটে বুকিং সম্পন্ন। রেফারেন্স নম্বর দিয়ে স্ট্যাটাসও দেখতে পারবেন।";
  if (/পানি|নলকূপ|আর্সেনিক/.test(input)) return "নিরাপদ পানি আমাদের দ্বিতীয় স্তম্ভ। ‘সমস্যা ও পরামর্শ’ পাতায় ওয়ার্ড ও স্থান উল্লেখ করে রিপোর্ট করুন — ৭ কার্যদিবসে প্রাথমিক পদক্ষেপের আপডেট পাবেন।";
  if (/স্বেচ্ছাসেবক|যুক্ত/.test(input)) return "প্রচারণা পাতার স্বেচ্ছাসেবক ফর্মে নাম, ওয়ার্ড ও দক্ষতা দিন। আপনার ওয়ার্ড সমন্বয়ক ৪৮ ঘণ্টায় যোগাযোগ করবেন।";
  if (/ম্যানিফেস্টো|অঙ্গীকার/.test(input)) return "৮টি স্তম্ভে ৩২টি অঙ্গীকার — শিক্ষা, পানি, স্বাস্থ্য, অবকাঠামো, নিরাপত্তা, কৃষি, ডিজিটাল ও অন্তর্ভুক্তি। প্রতিটির সময়সীমা ও অগ্রগতি ম্যানিফেস্টো পাতায় দেখুন।";
  if (/ইভেন্ট|সভা|ক্যাম্প/.test(input)) return "আসন্ন ইভেন্ট: ২২ অক্টো যুব ডিজিটাল সংলাপ, ২৪ অক্টো উঠান বৈঠক, ৮ নভে ফ্রি মেডিকেল ক্যাম্প, ১৪ নভে ম্যানিফেস্টো উন্মোচন। ‘ইভেন্ট’ পাতায় রেজিস্ট্রেশন করুন।";
  if (/অভিযোগ|সমস্যা|রিপোর্ট/.test(input)) return "‘সমস্যা ও পরামর্শ’ পাতায় ছবিসহ রিপোর্ট করুন। ট্র্যাকিং আইডি পাবেন, যা দিয়ে অগ্রগতি দেখতে পারবেন। জরুরি হলে ০১৭১১-২০৩৯৯৭।";
  return "ধন্যবাদ! আপনার বার্তাটি আমাদের টিমের কাছে পৌঁছেছে। সাধারণত ৫ মিনিটে উত্তর দেওয়া হয়। আপনি চাইলে অ্যাপয়েন্টমেন্ট, অভিযোগ বা ইভেন্ট নিয়েও জিজ্ঞাসা করতে পারেন।";
}

export function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "a1", role: "agent", text: "আসসালামু আলাইকুম! মহাদান ইউনিয়নের ডিজিটাল সহায়তা কেন্দ্রে স্বাগতম। আপনার প্রশ্ন লিখুন — সাধারণত ২–৫ মিনিটে উত্তর পাবেন।", ts: 0 },
  ]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  function send(value?: string) {
    const t = (value ?? text).trim();
    if (!t) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: t, ts: Date.now() }]);
    setText("");
    setTyping(true);
    fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: t }) }).catch(() => {});
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "agent", text: reply(t), ts: Date.now() }]);
    }, 1000);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="flex h-[70vh] min-h-[32rem] flex-col overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-forest/8 bg-forest px-4 py-3 text-cream">
          <div className="flex items-center gap-2.5">
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gold font-display text-base font-bold text-night">
              আ
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-forest bg-emerald-bright" />
            </span>
            <div>
              <p className="text-[0.86rem] font-semibold">জনসংযোগ ডেস্ক</p>
              <p className="flex items-center gap-1 text-[0.62rem] text-cream/55"><span className="h-1.5 w-1.5 rounded-full bg-emerald-bright" /> অনলাইন · গড় প্রতিক্রিয়া ৫ মিনিট</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a href={`tel:${site.phoneHref}`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" aria-label="কল"><Phone className="h-4 w-4" /></a>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(23,160,106,.05),transparent_50%)] p-4">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "agent" && <span className="mt-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-gold"><Bot className="h-3.5 w-3.5" /></span>}
              <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-relaxed", m.role === "user" ? "rounded-br-sm bg-forest text-cream" : "rounded-bl-sm border border-forest/8 bg-white text-ink shadow-sm")}>
                {m.text}
                <span className={cn("mt-1 block text-[0.55rem]", m.role === "user" ? "text-cream/40" : "text-muted/60")}>
                  {m.ts > 0 ? new Date(m.ts).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) : "এখন"}
                </span>
              </div>
              {m.role === "user" && <span className="mt-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cream-2 text-forest"><User className="h-3.5 w-3.5" /></span>}
            </div>
          ))}
          {typing && (
            <div className="flex gap-2">
              <span className="mt-auto grid h-7 w-7 place-items-center rounded-full bg-forest text-gold"><Bot className="h-3.5 w-3.5" /></span>
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-forest/8 bg-white px-3 py-3">
                {[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-forest/40" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length < 3 && (
          <div className="flex gap-1.5 overflow-x-auto border-t border-forest/8 bg-cream/40 px-3 py-2 hide-scrollbar">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-forest/12 bg-white px-2.5 py-1.5 text-[0.68rem] text-forest transition-colors hover:border-forest/30">{s}</button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-forest/10 p-3">
          <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-cream hover:text-forest" aria-label="সংযুক্তি"><Paperclip className="h-4 w-4" /></button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="আপনার বার্তা লিখুন..." className="h-10 flex-1 rounded-full border border-forest/12 bg-cream/50 px-4 text-sm focus:border-emerald/50 focus:outline-none" />
          <button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-night transition-transform hover:scale-105" aria-label="পাঠান"><ArrowUp className="h-4 w-4" /></button>
        </form>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-forest/10 bg-white p-4">
          <p className="flex items-center gap-2 text-[0.78rem] font-bold text-forest"><Clock className="h-3.5 w-3.5 text-emerald" /> সেবার সময়</p>
          <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted">শনি–বৃহস্পতি, সকাল ১০টা – রাত ৮টা। এর বাইরে বার্তা রেখে যান — পরদিন উত্তর পাবেন।</p>
        </div>
        <div className="rounded-2xl border border-forest/10 bg-white p-4">
          <p className="flex items-center gap-2 text-[0.78rem] font-bold text-forest"><ShieldCheck className="h-3.5 w-3.5 text-emerald" /> গোপনীয়তা</p>
          <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted">চ্যাটের তথ্য শুধু দায়িত্বপ্রাপ্ত দল দেখে। জরুরি বা সংবেদনশীল বিষয়ে সরাসরি কল করুন।</p>
        </div>
        <div className="rounded-2xl bg-gold p-4 text-night">
          <p className="flex items-center gap-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-night/60"><Sparkles className="h-3 w-3" /> দ্রুত সেবা</p>
          <a href={withBasePath("/appointment")} className="mt-2 flex items-center justify-between rounded-xl bg-night/10 px-3 py-2 text-[0.76rem] font-bold hover:bg-night/15">অ্যাপয়েন্টমেন্ট <MessageCircle className="h-3.5 w-3.5" /></a>
          <a href={withBasePath("/feedback")} className="mt-1.5 flex items-center justify-between rounded-xl bg-night/10 px-3 py-2 text-[0.76rem] font-bold hover:bg-night/15">সমস্যা জানান <MessageCircle className="h-3.5 w-3.5" /></a>
        </div>
      </div>
    </div>
  );
}
