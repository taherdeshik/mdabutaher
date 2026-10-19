"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CalendarCheck, Check, CheckCircle2, Clock, Home, Loader2,
  MapPin, Phone, User, Video,
} from "lucide-react";
import { appointmentTypes } from "@/lib/constants";
import { bn } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/form";

const wards = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const modes = [
  { id: "in-person", label: "কার্যালয়ে", icon: MapPin, desc: "সরাসরি সাক্ষাৎ" },
  { id: "phone", label: "ফোনে", icon: Phone, desc: "নির্ধারিত সময়ে কল" },
  { id: "home-visit", label: "বাড়ি পরিদর্শন", icon: Home, desc: "বিশেষ প্রয়োজন" },
] as const;

const steps = ["ধরন", "তারিখ ও সময়", "তথ্য", "নিশ্চিতকরণ"];

function nextDays(count = 21) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (out.length < count) {
    if (d.getDay() !== 5) out.push(new Date(d)); // Friday = scheduled-only
    d.setDate(d.getDate() + 1);
  }
  return out;
}

type SlotInfo = { slot: string; taken: number; available: boolean };

export function AppointmentForm() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState("");
  const [mode, setMode] = useState<"in-person" | "phone" | "home-visit">("in-person");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", ward: "", topic: "", notes: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ reference: string; date: string; slot: string } | null>(null);

  const days = useMemo(() => nextDays(15), []);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setSlot("");
    fetch(`/api/appointments?date=${date}`)
      .then((r) => r.json())
      .then((j) => setSlots(j.data?.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date]);

  const canNext = [
    Boolean(type),
    Boolean(date && slot),
    form.name.trim().length >= 3 && /^(\+?88)?01[3-9]\d{8}$/.test(form.phone) && Boolean(form.ward) && form.topic.trim().length >= 5,
    consent,
  ];

  async function submit() {
    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type, date, slot, mode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors({ ...(json.errors || {}), form: json.error });
        if (json.errors) setStep(2);
        return;
      }
      setResult({ reference: json.data.appointment.reference, date, slot });
    } catch {
      setErrors({ form: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন" });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-emerald/20 bg-white p-6 text-center shadow-soft sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald/10 text-emerald">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-forest">অ্যাপয়েন্টমেন্ট অনুরোধ গৃহীত</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          ২৪ ঘণ্টার মধ্যে এসএমএস/হোয়াটসঅ্যাপে নিশ্চিতকরণ পাঠানো হবে। নিচের রেফারেন্স নম্বরটি সংরক্ষণ করুন।
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-dashed border-forest/20 bg-cream/60 p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted">রেফারেন্স নম্বর</p>
          <p className="mt-1 font-latin text-2xl font-extrabold tracking-wide text-forest">{result.reference}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-forest/10 pt-3 text-[0.75rem]">
            <span className="flex items-center gap-1.5 text-muted"><CalendarCheck className="h-3.5 w-3.5" />{new Date(result.date).toLocaleDateString("bn-BD", { day: "numeric", month: "long" })}</span>
            <span className="flex items-center gap-1.5 text-muted"><Clock className="h-3.5 w-3.5" />{bn(result.slot)}</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a href={`/appointment/status?ref=${result.reference}`} className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream">স্ট্যাটাস দেখুন</a>
          <button onClick={() => { setResult(null); setStep(0); setType(""); setDate(""); setSlot(""); }} className="rounded-full border border-forest/15 px-5 py-2.5 text-sm font-semibold text-forest">
            আরেকটি বুকিং
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-soft">
      {/* progress */}
      <div className="border-b border-forest/8 bg-cream/50 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold transition-colors",
                    i < step ? "bg-emerald text-white" : i === step ? "bg-forest text-cream" : "bg-forest/8 text-muted",
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : bn(i + 1)}
                </span>
                <span className={cn("hidden text-[0.72rem] font-semibold sm:block", i === step ? "text-forest" : "text-muted")}>{s}</span>
              </div>
              {i < steps.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-emerald/40" : "bg-forest/10")} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <div>
                <h3 className="text-lg font-bold text-forest">কী বিষয়ে কথা বলতে চান?</h3>
                <p className="mt-1 text-[0.8rem] text-muted">সাক্ষাতের ধরন বেছে নিন, তারপর সময় নির্ধারণ করব।</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {appointmentTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.label)}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all",
                        type === t.label ? "border-forest bg-forest/[0.03] shadow-sm" : "border-forest/10 hover:border-forest/25 hover:bg-cream/50",
                      )}
                    >
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", type === t.label ? "bg-forest text-gold" : "bg-forest/5 text-forest")}>
                        <Icon name={t.icon} className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-[0.85rem] font-semibold text-forest">{t.label}</span>
                        <span className="mt-0.5 block text-[0.7rem] leading-snug text-muted">{t.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <p className="mt-6 mb-2 text-[0.8rem] font-semibold text-forest">কীভাবে দেখা করবেন?</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        mode === m.id ? "border-emerald bg-emerald/[0.06]" : "border-forest/10 hover:border-forest/25",
                      )}
                    >
                      <m.icon className={cn("h-4 w-4", mode === m.id ? "text-emerald" : "text-muted")} />
                      <span className="mt-1.5 block text-[0.8rem] font-semibold text-forest">{m.label}</span>
                      <span className="block text-[0.66rem] text-muted">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 className="text-lg font-bold text-forest">তারিখ ও সময় বেছে নিন</h3>
                <p className="mt-1 text-[0.8rem] text-muted">শুক্রবার শুধু পূর্বনির্ধারিত সাক্ষাৎ — তাই তালিকায় শুক্রবার বাদ দেওয়া হয়েছে।</p>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {days.map((d) => {
                    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    const on = date === iso;
                    return (
                      <button
                        key={iso}
                        onClick={() => setDate(iso)}
                        className={cn(
                          "flex w-16 shrink-0 flex-col items-center rounded-xl border py-2.5 transition-all",
                          on ? "border-forest bg-forest text-cream" : "border-forest/10 text-forest hover:border-forest/30",
                        )}
                      >
                        <span className={cn("text-[0.6rem] uppercase tracking-wider", on ? "text-cream/60" : "text-muted")}>
                          {d.toLocaleDateString("bn-BD", { weekday: "short" }).replace("বার", "")}
                        </span>
                        <span className="font-display text-lg font-bold leading-tight">{bn(d.getDate())}</span>
                        <span className={cn("text-[0.55rem]", on ? "text-cream/60" : "text-muted")}>
                          {d.toLocaleDateString("bn-BD", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[0.8rem] font-semibold text-forest">উপলব্ধ সময়</p>
                  {!date && <p className="rounded-xl border border-dashed border-forest/15 p-4 text-center text-[0.8rem] text-muted">প্রথমে একটি তারিখ বেছে নিন</p>}
                  {loadingSlots && <div className="flex items-center gap-2 text-[0.8rem] text-muted"><Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...</div>}
                  {date && !loadingSlots && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {slots.map((s) => (
                        <button
                          key={s.slot}
                          disabled={!s.available}
                          onClick={() => setSlot(s.slot)}
                          className={cn(
                            "rounded-xl border py-2 text-center font-latin text-[0.78rem] font-semibold transition-all",
                            slot === s.slot ? "border-forest bg-forest text-cream" : s.available ? "border-forest/12 text-forest hover:border-forest/35" : "cursor-not-allowed border-forest/5 bg-cream-2 text-muted/40 line-through",
                          )}
                        >
                          {bn(s.slot)}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 flex items-center gap-1.5 text-[0.68rem] text-muted">
                    <Video className="h-3.5 w-3.5" /> প্রতিটি সময়ে সর্বোচ্চ ৪টি সাক্ষাৎ — সময়মতো পৌঁছানোর অনুরোধ।
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-lg font-bold text-forest">আপনার তথ্য</h3>
                <p className="mt-1 text-[0.8rem] text-muted">শুধু সাক্ষাৎ নিশ্চিত করতে ব্যবহার হবে — অন্য কোথাও শেয়ার করা হবে না।</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="পূর্ণ নাম" required error={errors.name}>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার নাম" autoComplete="name" />
                  </Field>
                  <Field label="মোবাইল নম্বর" required error={errors.phone} hint="০১৭XXXXXXXX">
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01712345678" inputMode="tel" autoComplete="tel" />
                  </Field>
                  <Field label="ইমেইল" error={errors.email} hint="ঐচ্ছিক">
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" />
                  </Field>
                  <Field label="ওয়ার্ড" required error={errors.ward}>
                    <Select value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })}>
                      <option value="">ওয়ার্ড বেছে নিন</option>
                      {wards.map((w) => <option key={w} value={w}>ওয়ার্ড {w}</option>)}
                    </Select>
                  </Field>
                  <Field label="আলোচনার বিষয়" required error={errors.topic} className="sm:col-span-2">
                    <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="যেমন: ওয়ার্ড ৩-এ পানির সমস্যা" />
                  </Field>
                  <Field label="অতিরিক্ত তথ্য" error={errors.notes} hint="ঐচ্ছিক" className="sm:col-span-2">
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="সংক্ষেপে বিস্তারিত লিখুন..." />
                  </Field>
                </div>
                <div className="mt-4 rounded-xl bg-cream-2/60 p-3">
                  <Checkbox
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    label={<span className="text-[0.75rem]">আমি সম্মতি দিচ্ছি যে আমার তথ্য শুধু অ্যাপয়েন্টমেন্ট ও যোগাযোগের জন্য ব্যবহার করা হবে। <span className="text-muted">(গোপনীয়তা নীতি অনুযায়ী)</span></span>}
                  />
                </div>
                {errors.form && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[0.75rem] text-rose-600">{errors.form}</p>}
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-lg font-bold text-forest">নিশ্চিত করুন</h3>
                <p className="mt-1 text-[0.8rem] text-muted">সব তথ্য যাচাই করুন — ভুল থাকলে পেছনে গিয়ে সংশোধন করুন।</p>
                <div className="mt-4 divide-y divide-forest/8 rounded-2xl border border-forest/10">
                  {[
                    { label: "সাক্ষাতের ধরন", value: type, icon: User },
                    { label: "তারিখ", value: date ? new Date(`${date}T00:00:00`).toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—", icon: CalendarCheck },
                    { label: "সময়", value: bn(slot), icon: Clock },
                    { label: "ধরন", value: modes.find((m) => m.id === mode)?.label || "", icon: Video },
                    { label: "নাম", value: form.name, icon: User },
                    { label: "মোবাইল", value: <span className="font-latin">{form.phone}</span>, icon: Phone },
                    { label: "ওয়ার্ড", value: `ওয়ার্ড ${form.ward}`, icon: MapPin },
                    { label: "বিষয়", value: form.topic, icon: Check },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-2.5">
                      <span className="flex items-center gap-2 text-[0.75rem] text-muted"><row.icon className="h-3.5 w-3.5" />{row.label}</span>
                      <span className="text-right text-[0.8rem] font-semibold text-forest">{row.value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-forest/5 disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" /> পেছনে
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={!canNext[step]}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-cream transition-all hover:bg-forest-2 disabled:opacity-40"
            >
              পরবর্তী <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!consent || submitting}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-night transition-all hover:brightness-105 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? "পাঠানো হচ্ছে..." : "বুকিং নিশ্চিত করুন"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
