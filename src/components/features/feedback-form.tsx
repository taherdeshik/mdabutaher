"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon, ArrowRight, CheckCircle2, ImagePlus, Lightbulb, Loader2,
  Lock, MessageSquareWarning, ShieldAlert, Trash2, X,
} from "lucide-react";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/form";
import { cn, withBasePath } from "@/lib/utils";
import { bn } from "@/lib/utils";

const kinds = [
  { id: "problem", label: "স্থানীয় সমস্যা", icon: MessageSquareWarning, desc: "সড়ক, পানি, স্বাস্থ্য, শিক্ষা ইত্যাদি", tone: "border-sky-500/30 bg-sky-50 text-sky-700" },
  { id: "advice", label: "পরামর্শ", icon: Lightbulb, desc: "উন্নয়নের নতুন ধারণা বা মতামত", tone: "border-gold/40 bg-gold/10 text-gold-deep" },
  { id: "threat", label: "হুমকি ও ঝুঁকি", icon: ShieldAlert, desc: "জরুরি নিরাপত্তা বা দুর্যোগ সংক্রান্ত", tone: "border-rose-500/30 bg-rose-50 text-rose-700" },
] as const;

const categories = [
  "পানি ও স্যানিটেশন", "সড়ক ও যোগাযোগ", "স্বাস্থ্যসেবা", "শিক্ষা",
  "বিদ্যুৎ", "মাদক ও নিরাপত্তা", "পরিবেশ ও বর্জ্য", "সামাজিক নিরাপত্তা", "অন্যান্য",
];
const wards = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const severities = [
  { id: "low", label: "সাধারণ" },
  { id: "medium", label: "মাঝারি" },
  { id: "high", label: "জরুরি" },
  { id: "critical", label: "অতি জরুরি" },
] as const;

export function FeedbackForm({ initialKind = "problem" }: { initialKind?: "problem" | "advice" | "threat" }) {
  const [kind, setKind] = useState<"problem" | "advice" | "threat">(initialKind);
  const [form, setForm] = useState({
    category: "", title: "", details: "", ward: "", location: "",
    severity: "medium", name: "", phone: "",
  });
  const [anonymous, setAnonymous] = useState(false);
  const [photo, setPhoto] = useState<string>("");
  const [photoName, setPhotoName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");
  const [ticket, setTicket] = useState<{ trackingId: string; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhoto(file?: File) {
    if (!file) return;
    if (file.size > 1_400_000) {
      setErrors((e) => ({ ...e, photo: "ছবির আকার সর্বোচ্চ ১.৪ MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
      setPhotoName(file.name);
      setErrors((e) => ({ ...e, photo: "" }));
    };
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrors({});
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kind, anonymous, photo: photo || "" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors({ ...(json.errors || {}), form: json.error });
        setState("idle");
        return;
      }
      setTicket({ trackingId: json.data.item.trackingId, message: json.data.message });
      setState("done");
    } catch {
      setErrors({ form: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন" });
      setState("idle");
    }
  }

  if (state === "done" && ticket) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-emerald/20 bg-white p-6 text-center shadow-soft sm:p-9">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald/10 text-emerald"><CheckCircle2 className="h-8 w-8" /></span>
        <h3 className="mt-5 text-xl font-bold text-forest">ধন্যবাদ, আপনার কথা পৌঁছেছে</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{ticket.message}</p>
        <div className="mx-auto mt-5 max-w-xs rounded-2xl border border-dashed border-forest/20 bg-cream/60 p-4">
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-muted">ট্র্যাকিং আইডি</p>
          <p className="mt-1 font-latin text-xl font-extrabold text-forest">{ticket.trackingId}</p>
        </div>
        {kind === "threat" && (
          <div className="mx-auto mt-4 flex max-w-md items-start gap-2 rounded-xl bg-rose-50 p-3 text-left text-[0.75rem] text-rose-700">
            <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>জীবন বা সম্পত্তির তাৎক্ষণিক ঝুঁকি থাকলে এখনই <strong>৯৯৯</strong> নম্বরে কল করুন। এই রিপোর্টটি দায়িত্বপ্রাপ্ত দল দ্রুত পর্যালোচনা করবে।</span>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a href={withBasePath("/feedback/board")} className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream">পাবলিক বোর্ড দেখুন</a>
          <button onClick={() => { setState("idle"); setTicket(null); setForm({ category: "", title: "", details: "", ward: "", location: "", severity: "medium", name: "", phone: "" }); setPhoto(""); }} className="rounded-full border border-forest/15 px-5 py-2.5 text-sm font-semibold text-forest">
            আরেকটি রিপোর্ট
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-soft">
      <div className="border-b border-forest/8 bg-cream/50 p-5">
        <h3 className="text-lg font-bold text-forest">আপনার কথা আমাদের কাছে গুরুত্বপূর্ণ</h3>
        <p className="mt-1 text-[0.8rem] text-muted">সমস্যা, পরামর্শ বা ঝুঁকি — যা-ই হোক, লিখুন। প্রতিটি রিপোর্ট ট্র্যাকিং আইডি পায়।</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {kinds.map((k) => (
            <button
              type="button"
              key={k.id}
              onClick={() => setKind(k.id)}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all",
                kind === k.id ? k.tone : "border-forest/10 bg-white hover:border-forest/25",
              )}
            >
              <k.icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="block text-[0.8rem] font-semibold">{k.label}</span>
                <span className="mt-0.5 block text-[0.64rem] opacity-70">{k.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="বিভাগ" required error={errors.category}>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">সমস্যার বিভাগ বেছে নিন</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="ওয়ার্ড" required error={errors.ward}>
            <Select value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })}>
              <option value="">ওয়ার্ড বেছে নিন</option>
              {wards.map((w) => <option key={w} value={w}>ওয়ার্ড {w}</option>)}
            </Select>
          </Field>
          <Field label="শিরোনাম" required error={errors.title} className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="যেমন: বিলবালিয়া সড়কে ড্রেনেজ বন্ধ" maxLength={140} />
          </Field>
          <Field label="বিস্তারিত" required error={errors.details} hint={`${bn(form.details.length)}/৩০০০`} className="sm:col-span-2">
            <Textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="কী ঘটছে, কখন থেকে, কারা ক্ষতিগ্রস্ত — বিস্তারিত লিখুন..." maxLength={3000} className="min-h-32" />
          </Field>
          <Field label="নির্দিষ্ট স্থান" error={errors.location} hint="ঐচ্ছিক">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="গ্রাম, পাড়া বা মোড়ের নাম" />
          </Field>
          <Field label="গুরুত্ব" required>
            <div className="grid grid-cols-4 gap-1.5">
              {severities.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm({ ...form, severity: s.id })}
                  className={cn(
                    "rounded-lg border py-2 text-[0.7rem] font-semibold transition-all",
                    form.severity === s.id ? "border-forest bg-forest text-cream" : "border-forest/10 text-muted hover:border-forest/25",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="sm:col-span-2">
            <p className="mb-1.5 text-[0.8rem] font-semibold text-forest">ছবি সংযুক্ত করুন <span className="font-normal text-muted">(ঐচ্ছিক)</span></p>
            <AnimatePresence mode="wait">
              {photo ? (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 rounded-xl border border-forest/10 bg-cream/50 p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="সংযুক্ত ছবি" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.78rem] font-medium text-forest">{photoName}</p>
                    <p className="text-[0.65rem] text-muted">সংযুক্ত হয়েছে</p>
                  </div>
                  <button type="button" onClick={() => { setPhoto(""); setPhotoName(""); }} className="grid h-8 w-8 place-items-center rounded-full text-rose-500 hover:bg-rose-50" aria-label="ছবি মুছুন">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="upload"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-forest/20 bg-cream/30 py-5 text-[0.78rem] text-muted transition-colors hover:border-emerald/50 hover:bg-emerald/[0.03] hover:text-forest"
                >
                  <ImagePlus className="h-4 w-4" /> ছবি আপলোড করুন (সর্বোচ্চ ১.৪ MB)
                </motion.button>
              )}
            </AnimatePresence>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
            {errors.photo && <p className="mt-1 text-[0.7rem] text-rose-600">{errors.photo}</p>}
          </div>

          <div className="rounded-2xl border border-forest/10 bg-cream/40 p-4 sm:col-span-2">
            <Checkbox
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              label={
                <span className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest/60" />
                  <span className="text-[0.78rem]">
                    <strong className="font-semibold text-forest">নাম ও নম্বর গোপন রাখুন</strong>
                    <span className="block text-[0.68rem] text-muted">পাবলিক বোর্ডে আপনার পরিচয় দেখানো হবে না। তবে ট্র্যাকিং আইডি দিয়ে অগ্রগতি জানতে পারবেন।</span>
                  </span>
                </span>
              }
            />
            {!anonymous && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="আপনার নাম" error={errors.name}>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="নাম" autoComplete="name" />
                </Field>
                <Field label="মোবাইল নম্বর" required error={errors.phone} hint="আপডেট পাঠাতে">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01711203997" inputMode="tel" autoComplete="tel" />
                </Field>
              </div>
            )}
          </div>
        </div>

        {errors.form && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[0.75rem] text-rose-600">{errors.form}</p>}

        <div className="mt-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="flex items-center gap-1.5 text-[0.68rem] text-muted">
            <Lock className="h-3 w-3" /> তথ্য শুধু দায়িত্বপ্রাপ্ত দল দেখবে · ৭ কার্যদিবসে প্রাথমিক পদক্ষেপ
          </p>
          <button
            type="submit"
            disabled={state === "submitting"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-forest-2 disabled:opacity-60 sm:w-auto"
          >
            {state === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {state === "submitting" ? "পাঠানো হচ্ছে..." : "রিপোর্ট জমা দিন"}
          </button>
        </div>
      </div>
    </form>
  );
}
