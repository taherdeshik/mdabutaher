"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CircleAlert,
  Download,
  FileCheck2,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Field, Input, Modal, Progress, Select, Stat } from "./admin-ui";
import { expenseModeLabels, formatMoney, pct } from "./admin-labels";
import { bn } from "@/lib/utils";
import type { Expense, ExpenseMode } from "@/lib/command-types";

const categories = ["সভা ও উঠান বৈঠক", "মাইকিং", "পোস্টার ও ব্যানার", "যাতায়াত", "খাবার", "ডিজিটাল প্রচার", "এজেন্ট ফি", "অফিস", "অন্যান্য"];

export function MoneyBoard({ data, send }: SectionProps) {
  const { expenses, settings, kpis } = data;
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = settings.spendCap - spent;
  const burn = settings.spendCap ? spent / settings.spendCap : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.category === filter);
  const cashOver = expenses.filter((e) => e.mode === "cash" && e.amount >= 20000);
  const byMode = (["cash", "cheque", "bank"] as ExpenseMode[]).map((m) => ({ mode: m, total: expenses.filter((e) => e.mode === m).reduce((s, e) => s + e.amount, 0) }));

  const daysLeft = Math.max(1, kpis.daysLeft);
  const daysTracked = Math.max(
    1,
    Math.round((Date.now() - new Date(expenses[expenses.length - 1]?.date || new Date().toISOString()).getTime()) / 86_400_000),
  );
  const projected = Math.round(spent + (spent / daysTracked) * daysLeft);

  function exportCsv() {
    const header = "তারিখ,শ্রেণি,বিবরণ,পরিমাণ,ধরন,ভাউচার";
    const rows = expenses.map((e) => [e.date, e.category, e.description, e.amount, expenseModeLabels[e.mode], e.voucher].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob(["\ufeff" + header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mahadan-expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="মোট ব্যয়" value={formatMoney(spent)} icon={<Wallet className="h-3.5 w-3.5" />} tone="gold" progress={burn} sub={`সীমার ${pct(burn)}`} />
        <Stat label="অবশিষ্ট" value={formatMoney(remaining)} icon={<Banknote className="h-3.5 w-3.5" />} tone={remaining < 100000 ? "rose" : "emerald"} sub={`সীমা ${formatMoney(settings.spendCap)}`} />
        <Stat label="লেনদেন" value={bn(expenses.length)} icon={<Receipt className="h-3.5 w-3.5" />} sub={`${bn(byCategory.length)}টি শ্রেণি`} />
        <Stat label="চেক নিয়ম লঙ্ঘন" value={bn(cashOver.length)} icon={<CircleAlert className="h-3.5 w-3.5" />} tone={cashOver.length ? "rose" : "emerald"} sub="২০,০০০+ নগদ" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHead title="ব্যয়সীমা মিটার" sub="চেয়ারম্যান প্রার্থীর সর্বোচ্চ সীমা ৳১০,০০,০০০" icon={<ShieldCheck className="h-4 w-4" />} action={<Badge tone={burn > 0.85 ? "rose" : burn > 0.7 ? "gold" : "emerald"}>{pct(burn)} ব্যবহৃত</Badge>} />
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-latin text-[2rem] font-extrabold leading-none text-cream">{formatMoney(spent)}</p>
                <p className="mt-1 text-[0.62rem] text-cream/35">সীমার {pct(burn)} · অবশিষ্ট {formatMoney(remaining)}</p>
              </div>
              <p className="font-latin text-[0.7rem] text-cream/30">৳{bn(settings.spendCap.toLocaleString("en-US"))}</p>
            </div>
            <div className="relative mt-4">
              <Progress value={burn} height="h-3" tone={burn > 0.85 ? "rose" : burn > 0.7 ? "gold" : "emerald"} />
              {[0.7, 0.85, 0.95].map((m) => (
                <span key={m} className="absolute top-0 h-3 w-px bg-night/60" style={{ left: `${m * 100}%` }} title={`${m * 100}% সতর্কতা`} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[0.54rem] text-cream/25"><span>০%</span><span className="text-gold/60">৭০% সতর্ক</span><span className="text-amber-300/60">৮৫%</span><span className="text-rose-300/60">৯৫%</span></div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {byMode.map((m) => (
                <div key={m.mode} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                  <p className="text-[0.54rem] text-cream/30">{expenseModeLabels[m.mode]}</p>
                  <p className="mt-0.5 font-latin text-[0.76rem] font-bold text-cream/70">{formatMoney(m.total)}</p>
                  <p className="text-[0.5rem] text-cream/25">{pct(spent ? m.total / spent : 0)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {byCategory.map(([cat, amount]) => (
                <button key={cat} onClick={() => setFilter(filter === cat ? "all" : cat)} className="w-full text-left">
                  <div className="flex justify-between text-[0.6rem]">
                    <span className={filter === cat ? "font-semibold text-gold" : "text-cream/45"}>{cat}</span>
                    <span className="font-latin text-cream/45">{formatMoney(amount)}</span>
                  </div>
                  <Progress value={spent ? amount / spent : 0} height="h-1" className="mt-1" tone={filter === cat ? "gold" : "emerald"} />
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead title="আইনি কমপ্লায়েন্স" sub="নির্বাচন কমিশনের ২০২৬ নিয়ম" icon={<FileCheck2 className="h-4 w-4" />} />
            <div className="space-y-2.5 p-4">
              {[
                { ok: true, t: "আলাদা ব্যাংক হিসাব", d: "সব প্রচার ব্যয় আলাদা হিসাব দিয়ে" },
                { ok: expenses.every((e) => e.mode !== "cash" || e.amount < 20000), t: "২০,০০০+ টাকা চেকে", d: "নগদ সীমা মানা হয়েছে" },
                { ok: true, t: "জামানত ২৫,০০০ টাকা", d: "ট্রেজারি চালান সংরক্ষিত" },
                { ok: burn < 0.85, t: "ব্যয়সীমার নিচে", d: `বর্তমানে ${pct(burn)}` },
                { ok: true, t: "ভাউচার সংরক্ষণ", d: "প্রতিটি লেনদেনে ভাউচার নম্বর" },
              ].map((c) => (
                <div key={c.t} className="flex items-start gap-2">
                  {c.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-bright" /> : <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />}
                  <div><p className={`text-[0.64rem] font-semibold ${c.ok ? "text-cream/65" : "text-rose-300"}`}>{c.t}</p><p className="text-[0.54rem] text-cream/30">{c.d}</p></div>
                </div>
              ))}
              <p className="rounded-lg bg-gold/[0.06] px-2.5 py-2 text-[0.54rem] leading-relaxed text-gold/60">ব্যয়সীমা ছাড়ালে প্রার্থিতা বাতিল হতে পারে। প্রতিদিনের খরচ দিনের শেষে এখানে লিখুন।</p>
            </div>
          </Card>

          <Card>
            <CardHead title="প্রকল্পিত ব্যয়" sub="বাকি দিনগুলোর জন্য পরামর্শ" icon={<Receipt className="h-4 w-4" />} />
            <div className="p-4">
              <div className="flex items-center justify-between text-[0.64rem]"><span className="text-cream/40">বাকি দিন</span><span className="font-latin font-bold text-cream/65">{bn(daysLeft)}</span></div>
              <div className="mt-1.5 flex items-center justify-between text-[0.64rem]"><span className="text-cream/40">দৈনিক গড় (এখন পর্যন্ত)</span><span className="font-latin font-bold text-cream/65">{formatMoney(Math.round(spent / daysTracked))}</span></div>
              <div className="mt-1.5 flex items-center justify-between text-[0.64rem]"><span className="text-cream/40">সম্ভাব্য সমাপনী ব্যয়</span><span className="font-latin font-bold text-gold">{formatMoney(Math.round(projected))}</span></div>
              <p className="mt-3 text-[0.55rem] leading-relaxed text-cream/30">ভোটের দিনের আগে ব্যয়সীমার ৮৫% এর মধ্যে রাখার পরিকল্পনা করুন। বাকি অর্থ এজেন্ট, যাতায়াত ও ভোটের দিনের প্রস্তুতিতে রাখুন।</p>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHead
          title="ব্যয়ের খাতা"
          sub={`${bn(filtered.length)}টি লেনদেন${filter !== "all" ? ` · ${filter}` : ""}`}
          icon={<Receipt className="h-4 w-4" />}
          action={
            <div className="flex gap-2">
              {filter !== "all" ? <Button size="sm" variant="ghost" onClick={() => setFilter("all")}>ফিল্টার সরান</Button> : null}
              <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-3.5 w-3.5" /> CSV</Button>
              <Button size="sm" variant="gold" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" /> নতুন ব্যয়</Button>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-white/[0.06] text-[0.54rem] uppercase tracking-wider text-cream/30">
              <tr>
                <th className="px-4 py-2 font-semibold">তারিখ</th>
                <th className="px-3 py-2 font-semibold">শ্রেণি</th>
                <th className="px-3 py-2 font-semibold">বিবরণ</th>
                <th className="px-3 py-2 font-semibold">ধরন</th>
                <th className="px-3 py-2 font-semibold">ভাউচার</th>
                <th className="px-3 py-2 text-right font-semibold">পরিমাণ</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((e) => (
                <tr key={e.id} className="text-[0.67rem] transition-colors hover:bg-white/[0.025]">
                  <td className="whitespace-nowrap px-4 py-2.5 font-latin text-cream/45">{e.date}</td>
                  <td className="px-3 py-2.5"><Badge tone={e.category.includes("পোস্টার") ? "gold" : e.category.includes("সভা") ? "sky" : "muted"}>{e.category}</Badge></td>
                  <td className="max-w-[260px] truncate px-3 py-2.5 text-cream/60">{e.description}</td>
                  <td className="px-3 py-2.5">
                    <span className={e.mode === "cash" && e.amount >= 20000 ? "text-rose-300" : "text-cream/45"}>{expenseModeLabels[e.mode]}{e.mode === "cash" && e.amount >= 20000 ? " ⚠" : ""}</span>
                  </td>
                  <td className="px-3 py-2.5 font-latin text-cream/35">{e.voucher}</td>
                  <td className="px-3 py-2.5 text-right font-latin font-bold text-cream/70">{formatMoney(e.amount)}</td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={() => send("expense", "delete", e.id)} className="rounded p-1 text-cream/20 transition-colors hover:bg-rose-500/10 hover:text-rose-300" title="মুছুন"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <p className="px-4 py-8 text-center text-[0.7rem] text-cream/35">এই শ্রেণিতে কোনো ব্যয় নেই।</p> : null}
      </Card>

      <AddExpenseModal open={addOpen} onClose={() => setAddOpen(false)} send={send} remaining={remaining} />
    </div>
  );
}

function AddExpenseModal({ open, onClose, send, remaining }: { open: boolean; onClose: () => void; send: SectionProps["send"]; remaining: number }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<ExpenseMode>("cash");
  const [voucher, setVoucher] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(false);
  const [saving, setSaving] = useState(false);

  const numeric = Number(amount.replace(/[^\d]/g, "")) || 0;
  const needsCheque = numeric >= 20000 && mode === "cash";

  async function submit() {
    setError("");
    if (!numeric) {
      setError("সঠিক পরিমাণ দিন");
      return;
    }
    if (numeric > remaining) {
      setError(`ব্যয়সীমা ছাড়িয়ে যাবে — অবশিষ্ট ${formatMoney(remaining)}`);
      return;
    }
    if (needsCheque && !warning) {
      setWarning(true);
      setError("২০,০০০ টাকার বেশি নগদ ব্যয় নির্বাচনী নিয়মে নিষিদ্ধ। চেক/ব্যাংক নির্বাচন করুন, অথবা নিচের নিশ্চিতকরণে ক্লিক করুন।");
      return;
    }
    setSaving(true);
    const err = await send("expense", "create", undefined, { date, category, description, amount: numeric, mode, voucher });
    setSaving(false);
    if (err) setError(err);
    else {
      setAmount("");
      setDescription("");
      setVoucher("");
      setWarning(false);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="নতুন ব্যয় যোগ করুন" sub={`অবশিষ্ট সীমা: ${formatMoney(remaining)}`}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="তারিখ"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="শ্রেণি">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="বিবরণ"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="যেমন: ওয়ার্ড ৩-এ ৪টি ব্যানার" /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="পরিমাণ (৳)"><Input value={amount} onChange={(e) => { setAmount(e.target.value); setWarning(false); }} inputMode="numeric" placeholder="15000" /></Field>
          <Field label="পরিশোধের ধরন">
            <Select value={mode} onChange={(e) => { setMode(e.target.value as ExpenseMode); setWarning(false); }}>
              {Object.entries(expenseModeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </Field>
          <Field label="ভাউচার নম্বর"><Input value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="V-1053" /></Field>
        </div>
        {needsCheque ? (
          <div className="rounded-lg border border-gold/30 bg-gold/[0.07] px-3 py-2.5">
            <p className="text-[0.64rem] font-semibold text-gold">২০,০০০ টাকার বেশি — চেক/ব্যাংক প্রয়োজন</p>
            <p className="mt-0.5 text-[0.56rem] leading-relaxed text-gold/60">নির্বাচনী আচরণবিধি অনুযায়ী এই পেমেন্ট চেক বা ব্যাংক ট্রান্সফারে হওয়া উচিত।</p>
          </div>
        ) : null}
        {error ? <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[0.66rem] leading-relaxed text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>বাতিল</Button>
          <Button variant="gold" size="sm" onClick={submit} disabled={saving}>
            {saving ? "সংরক্ষণ…" : needsCheque && warning ? "তবুও নগদ হিসেবে সংরক্ষণ" : "ব্যয় সংরক্ষণ করুন"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
