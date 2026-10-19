"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Clock, Loader2, MapPin, Search, XCircle } from "lucide-react";
import { Input } from "@/components/ui/form";
import { bn } from "@/lib/utils";

type Appointment = {
  id: string;
  reference: string;
  type: string;
  date: string;
  slot: string;
  ward: string;
  topic: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
};

const statusMap: Record<Appointment["status"], { label: string; tone: string; dot: string }> = {
  pending: { label: "অনুমোদনের অপেক্ষায়", tone: "bg-gold/15 text-gold-deep", dot: "bg-gold-deep" },
  confirmed: { label: "নিশ্চিত", tone: "bg-emerald/12 text-emerald", dot: "bg-emerald" },
  completed: { label: "সম্পন্ন", tone: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  cancelled: { label: "বাতিল", tone: "bg-rose-50 text-rose-600", dot: "bg-rose-500" },
};

export function AppointmentStatusLookup() {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [items, setItems] = useState<Appointment[]>([]);
  const [message, setMessage] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch(`/api/appointments?phone=${encodeURIComponent(phone)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setItems(json.data.appointments);
      setState("done");
      if (json.data.appointments.length === 0) setMessage("এই নম্বরে কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "আবার চেষ্টা করুন");
    }
  }

  return (
    <div>
      <form onSubmit={search} className="rounded-2xl border border-forest/10 bg-white p-4 shadow-soft sm:p-5">
        <label className="text-[0.8rem] font-semibold text-forest" htmlFor="phone">মোবাইল নম্বর</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01712345678" inputMode="tel" className="flex-1" required />
          <button type="submit" disabled={state === "loading"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-60">
            {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} খুঁজুন
          </button>
        </div>
        <p className="mt-2 text-[0.68rem] text-muted">যে নম্বর দিয়ে বুকিং করেছেন সেটিই দিন। তথ্য শুধু দেখার জন্য — কোনো পরিবর্তন নয়।</p>
      </form>

      {state === "error" && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{message}</p>}
      {state === "done" && items.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-forest/15 bg-white p-8 text-center">
          <XCircle className="mx-auto h-8 w-8 text-muted/40" />
          <p className="mt-3 text-sm text-muted">{message}</p>
          <a href="/appointment" className="mt-4 inline-block rounded-full bg-forest px-4 py-2 text-[0.8rem] font-semibold text-cream">নতুন অ্যাপয়েন্টমেন্ট নিন</a>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {items.map((a, i) => {
          const s = statusMap[a.status];
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-forest/10 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-latin text-[0.7rem] font-bold tracking-wide text-muted">{a.reference}</p>
                  <p className="mt-1 text-[0.95rem] font-bold text-forest">{a.type}</p>
                  <p className="mt-0.5 text-[0.78rem] text-muted">{a.topic}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${s.tone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.label}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-forest/8 pt-3 text-[0.76rem] text-muted">
                <span className="inline-flex items-center gap-1.5"><CalendarCheck className="h-3.5 w-3.5 text-emerald" />{new Date(`${a.date}T00:00:00`).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald" />{bn(a.slot)}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald" />ওয়ার্ড {a.ward}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
