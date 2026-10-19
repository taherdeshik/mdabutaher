"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/form";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrors({});
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setErrors({ ...(json.errors || {}), form: json.error }); setState("idle"); return; }
      setState("done");
    } catch { setErrors({ form: "নেটওয়ার্ক সমস্যা" }); setState("idle"); }
  }

  if (state === "done") {
    return (
      <div className="rounded-3xl border border-emerald/25 bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald" />
        <h3 className="mt-3 text-lg font-bold text-forest">বার্তা পাঠানো হয়েছে</h3>
        <p className="mt-1.5 text-[0.85rem] text-muted">২৪–৪৮ ঘণ্টার মধ্যে উত্তর দেওয়া হবে। জরুরি হলে সরাসরি কল করুন।</p>
        <button onClick={() => { setState("idle"); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }} className="mt-4 rounded-full border border-forest/15 px-5 py-2 text-sm font-semibold text-forest">আরেকটি বার্তা</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-forest/10 bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-lg font-bold text-forest">বার্তা পাঠান</h2>
      <p className="mt-1 text-[0.8rem] text-muted">সাধারণ জিজ্ঞাসা, প্রস্তাব বা মিডিয়া অনুরোধ — সবকিছুর জন্য এই ফর্ম।</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="নাম" required error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার নাম" autoComplete="name" /></Field>
        <Field label="মোবাইল" error={errors.phone} hint="ঐচ্ছিক"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01712345678" inputMode="tel" autoComplete="tel" /></Field>
        <Field label="ইমেইল" error={errors.email} className="sm:col-span-2"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" /></Field>
        <Field label="বিষয়" required error={errors.subject} className="sm:col-span-2"><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="কী নিয়ে কথা বলতে চান?" /></Field>
        <Field label="বার্তা" required error={errors.message} className="sm:col-span-2"><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="বিস্তারিত লিখুন..." className="min-h-32" /></Field>
      </div>
      {errors.form && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[0.75rem] text-rose-600">{errors.form}</p>}
      <button type="submit" disabled={state === "loading"} className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-forest-2 disabled:opacity-60">
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} বার্তা পাঠান
      </button>
    </form>
  );
}
