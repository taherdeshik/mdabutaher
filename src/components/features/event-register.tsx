"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Ticket } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/form";
import { wards } from "@/lib/constants";
import { bn } from "@/lib/utils";

export function EventRegister({ eventId, registered, capacity }: { eventId: string; registered: number; capacity: number }) {
  const [form, setForm] = useState({ name: "", phone: "", ward: "", guests: "0" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [count, setCount] = useState(registered);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrors({});
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guests: Number(form.guests) }),
      });
      const json = await res.json();
      if (!res.ok) { setErrors({ ...(json.errors || {}), form: json.error }); setState("idle"); return; }
      setCount((c) => c + 1 + Number(form.guests));
      setState("done");
    } catch { setErrors({ form: "নেটওয়ার্ক সমস্যা" }); setState("idle"); }
  }

  const seatsLeft = Math.max(0, capacity - count);

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-emerald/25 bg-emerald/[0.04] p-5 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald" />
        <p className="mt-2 text-[0.92rem] font-bold text-forest">রেজিস্ট্রেশন সম্পন্ন!</p>
        <p className="mt-1 text-[0.76rem] text-muted">ইভেন্টের একদিন আগে এসএমএসে মনে করিয়ে দেওয়া হবে।</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-forest/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[0.85rem] font-bold text-forest"><Ticket className="h-4 w-4 text-gold-deep" /> বিনামূল্যে রেজিস্ট্রেশন</p>
        <span className="rounded-full bg-cream-2 px-2 py-0.5 text-[0.6rem] font-medium text-muted">{bn(seatsLeft)} আসন বাকি</span>
      </div>
      <div className="mt-3 space-y-3">
        <Field label="নাম" required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার নাম" autoComplete="name" />
        </Field>
        <Field label="মোবাইল" required error={errors.phone}>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01712345678" inputMode="tel" autoComplete="tel" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="ওয়ার্ড" required error={errors.ward}>
            <Select value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })}>
              <option value="">ওয়ার্ড</option>
              {wards.map((w) => <option key={w} value={w}>ওয়ার্ড {w}</option>)}
            </Select>
          </Field>
          <Field label="অতিথি" hint="সর্বোচ্চ ১০">
            <Select value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })}>
              {[0, 1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>{bn(g)} জন</option>)}
            </Select>
          </Field>
        </div>
      </div>
      {errors.form && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[0.72rem] text-rose-600">{errors.form}</p>}
      <button type="submit" disabled={state === "loading"} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-4 py-2.5 text-[0.82rem] font-bold text-cream transition-colors hover:bg-forest-2 disabled:opacity-60">
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />} রেজিস্ট্রেশন করুন
      </button>
    </form>
  );
}
