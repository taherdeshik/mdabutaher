"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/form";
import { volunteerRoles } from "@/content/campaign";
import { wards } from "@/lib/constants";
import { cn } from "@/lib/utils";

const availabilities = ["সপ্তাহে ২–৪ ঘণ্টা", "সপ্তাহে ৫–১০ ঘণ্টা", "শুধু ইভেন্টের দিন", "পূর্ণ সময়"];

export function VolunteerForm() {
  const [form, setForm] = useState({ name: "", phone: "", ward: "", role: "", availability: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrors({});
    try {
      const res = await fetch("/api/volunteers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setErrors({ ...(json.errors || {}), form: json.error }); setState("idle"); return; }
      setState("done");
    } catch { setErrors({ form: "নেটওয়ার্ক সমস্যা" }); setState("idle"); }
  }

  if (state === "done") {
    return (
      <div className="rounded-3xl border border-emerald/25 bg-white p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald/10 text-emerald"><CheckCircle2 className="h-7 w-7" /></span>
        <h3 className="mt-4 text-lg font-bold text-forest">স্বাগতম, আপনি এখন আমাদের দলে!</h3>
        <p className="mt-1.5 text-[0.85rem] text-muted">আপনার ওয়ার্ড সমন্বয়ক ৪৮ ঘণ্টার মধ্যে যোগাযোগ করবেন।</p>
        <a href="/campaign" className="mt-4 inline-block rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream">প্রচারণা পরিকল্পনা দেখুন</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-forest/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="নাম" required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার নাম" autoComplete="name" />
        </Field>
        <Field label="মোবাইল" required error={errors.phone}>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01711203997" inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="ওয়ার্ড" required error={errors.ward}>
          <Select value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })}>
            <option value="">ওয়ার্ড বেছে নিন</option>
            {wards.map((w) => <option key={w} value={w}>ওয়ার্ড {w}</option>)}
          </Select>
        </Field>
        <Field label="ভূমিকা" required error={errors.role}>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="">কী করতে চান?</option>
            {volunteerRoles.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[0.8rem] font-semibold text-forest">সময় দিতে পারবেন <span className="text-rose-600">*</span></p>
          <div className="grid grid-cols-2 gap-2">
            {availabilities.map((a) => (
              <button key={a} type="button" onClick={() => setForm({ ...form, availability: a })} className={cn("rounded-xl border px-3 py-2 text-[0.75rem] font-medium transition-all", form.availability === a ? "border-forest bg-forest text-cream" : "border-forest/10 text-muted hover:border-forest/25")}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
      {errors.form && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[0.75rem] text-rose-600">{errors.form}</p>}
      <button type="submit" disabled={state === "loading" || !form.availability} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-night transition-colors hover:brightness-105 disabled:opacity-50">
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        স্বেচ্ছাসেবক হিসেবে যোগ দিন
      </button>
    </form>
  );
}
