"use client";

import { useState } from "react";
import {
  CalendarDays,
  Download,
  Files,
  Globe2,
  FileSpreadsheet,
  History,
  Printer,
  Rss,
  Search,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  Target,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Field, Input, Stat } from "./admin-ui";
import { bnNum, formatMoney, pct } from "./admin-labels";
import { bn } from "@/lib/utils";

export function AdminSettings({ data, send, adminKey }: SectionProps) {
  const { settings, kpis } = data;
  const [pollingDate, setPollingDate] = useState(settings.pollingDate);
  const [turnout, setTurnout] = useState(settings.turnoutAssumption);
  const [spendCap, setSpendCap] = useState(settings.spendCap);
  const [unionVoters, setUnionVoters] = useState(settings.unionVoters);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const err = await send("settings", "update", undefined, {
      pollingDate,
      turnoutAssumption: turnout,
      spendCap,
      unionVoters,
    });
    setSaving(false);
    if (!err) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  function exportCsv(name: string, header: string, rows: (string | number)[][]) {
    const body = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mahadan-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const exports = [
    {
      label: "বুথ ও কভারেজ",
      sub: `${bn(data.booths.length)} বুথ`,
      action: () =>
        exportCsv(
          "booths",
          "কোড,কেন্দ্র,ওয়ার্ড,গ্রাম,ভোটার,খানা,ভিজিট,প্রতিশ্রুত,কভারেজ",
          data.booths.map((b) => [b.code, b.name, b.wardId, b.village, b.voters, b.households, b.visited, b.committed, b.households ? Math.round((b.visited / b.households) * 100) + "%" : "0%"]),
        ),
    },
    {
      label: "খানা ওয়ার্কিং লিস্ট",
      sub: `${bn(data.households.length)} খানা`,
      action: () =>
        exportCsv(
          "households",
          "পরিবারপ্রধান,গ্রাম,বুথ,সদস্য,সমর্থন,ইস্যু,ফলো-আপ,শেষ ভিজিট",
          data.households.map((h) => [h.head, h.village, h.boothId, h.members, h.support, h.issues.join(" / "), h.followUp || "", h.lastVisit || ""]),
        ),
    },
    {
      label: "ভিজিট লগ",
      sub: `${bn(data.visits.length)} রেকর্ড`,
      action: () =>
        exportCsv(
          "visits",
          "তারিখ,পরিবার,বুথ,স্ট্যাটাস,ইস্যু,প্রতিশ্রুতি,রিপোর্টার",
          data.visits.map((v) => [v.createdAt.slice(0, 10), data.households.find((h) => h.id === v.householdId)?.head || "", v.boothId, v.status, v.issues.join(" / "), v.promise || "", v.by]),
        ),
    },
    {
      label: "দল",
      sub: `${bn(data.team.length)} জন`,
      action: () =>
        exportCsv(
          "team",
          "নাম,ভূমিকা,ফোন,ওয়ার্ড,বুথ,অবস্থা",
          data.team.map((t) => [t.name, t.role, t.phone, t.wardId || "", t.boothId || "", t.status]),
        ),
    },
    {
      label: "কাজ",
      sub: `${bn(data.tasks.length)} কাজ`,
      action: () =>
        exportCsv(
          "tasks",
          "শিরোনাম,ধরন,তারিখ,সময়,দায়িত্ব,অগ্রাধিকার,সম্পন্ন",
          data.tasks.map((t) => [t.title, t.type, t.date, t.time, t.assignee, t.priority, t.done ? "হ্যাঁ" : "না"]),
        ),
    },
    {
      label: "চ্যালেঞ্জ",
      sub: `${bn(data.challenges.length)}টি`,
      action: () =>
        exportCsv(
          "challenges",
          "শিরোনাম,শ্রেণি,গুরুত্ব,অবস্থা,ওয়ার্ড,দায়িত্ব,সমাধান",
          data.challenges.map((c) => [c.title, c.category, c.severity, c.status, c.wardId || "", c.owner, c.resolution || ""]),
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHead title="নির্বাচনী সেটিংস" sub="তারিখ ও লক্ষ্য পরিবর্তনে পুরো ড্যাশবোর্ড আপডেট হবে" icon={<Settings2 className="h-4 w-4" />} />
          <div className="space-y-3 p-4 sm:p-5">
            <Field label="ভোটের দিন" hint="সব কাউন্টডাউন নতুন তারিখ অনুযায়ী বদলে যাবে">
              <Input type="date" value={pollingDate} onChange={(e) => setPollingDate(e.target.value)} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="টার্নআউট অনুমান (%)">
                <Input type="number" min={35} max={95} value={turnout} onChange={(e) => setTurnout(Number(e.target.value))} />
              </Field>
              <Field label="ব্যয়সীমা (৳)">
                <Input type="number" value={spendCap} onChange={(e) => setSpendCap(Number(e.target.value))} />
              </Field>
            </div>
            <Field label="নিবন্ধিত ভোটার (তালিকা অনুযায়ী)">
              <Input type="number" value={unionVoters} onChange={(e) => setUnionVoters(Number(e.target.value))} />
            </Field>
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[0.58rem] text-cream/30">জয়ের সংখ্যা হবে {bn(kpis.winNumber)} (বর্তমান সেটিংস)</p>
              <Button variant={saved ? "primary" : "gold"} size="sm" onClick={save} disabled={saving}>
                <Save className="h-3.5 w-3.5" /> {saved ? "সংরক্ষিত" : saving ? "সংরক্ষণ…" : "সেটিংস সংরক্ষণ"}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="নির্বাচনী সারসংক্ষেপ" sub="রিপোর্ট ও প্রিন্টের জন্য" icon={<ShieldCheck className="h-4 w-4" />} action={<Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> প্রিন্ট</Button>} />
          <div className="grid grid-cols-2 gap-2.5 p-4">
            {[
            { href: "/sitemap.xml", label: "সাইটম্যাপ", sub: "সব পাবলিক পেজ + CMS পোস্ট", icon: Globe2 },
            { href: "/robots.txt", label: "Robots", sub: "ক্রলার নির্দেশনা", icon: Files },
            { href: "/feed.xml", label: "RSS ফিড", sub: "সংবাদ, ব্লগ ও ইভেন্ট", icon: Rss },
            { href: "/manifest.webmanifest", label: "ওয়েব ম্যানিফেস্ট", sub: "ফোনে অ্যাপ হিসেবে ইনস্টল", icon: Smartphone },
          ].map(({ href, label, sub, icon: Icon }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 transition-colors hover:border-emerald-bright/30 hover:bg-white/[0.04]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-bright/10 text-emerald-bright"><Icon className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.66rem] font-semibold text-cream/70">{label}</span>
                <span className="block truncate text-[0.54rem] text-cream/30">{sub}</span>
              </span>
            </a>
          ))}
          </div>
          <div className="border-t border-white/[0.06] p-4">
            <p className="flex items-start gap-1.5 text-[0.56rem] leading-relaxed text-cream/30">
              <Target className="mt-0.5 h-3 w-3 shrink-0" /> এই সারসংক্ষেপ প্রিন্ট করে ক্যাম্প অফিসের দেয়ালে টাঙানো যায়। ডেটা ডেমো/ওয়ার্কিং সেট; বাস্তব ব্যবহারে ভোটার ব্যক্তিগত তথ্য সুরক্ষিত রাখুন।
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="রিপোর্ট ও রপ্তানি" sub="প্রতিটি তালিকা CSV-তে নামান" icon={<FileSpreadsheet className="h-4 w-4" />} action={<Badge tone="emerald">UTF-8</Badge>} />
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {exports.map((e) => (
            <button key={e.label} onClick={e.action} className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-left transition-colors hover:border-gold/30 hover:bg-white/[0.04]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold"><Download className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.66rem] font-semibold text-cream/70">{e.label}</span>
                <span className="block text-[0.54rem] text-cream/30">{e.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="border-t border-white/[0.06] p-4">
          <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-wider text-cream/30">CRM রপ্তানি (সার্ভার)</p>
          <div className="flex flex-wrap gap-2">
            {[
              ["appointments", "অ্যাপয়েন্টমেন্ট"],
              ["feedback", "অভিযোগ"],
              ["leads", "লিড"],
              ["messages", "বার্তা"],
              ["volunteers", "স্বেচ্ছাসেবক"],
            ].map(([type, label]) => (
              <a key={type} href={`/api/admin/export?type=${type}&key=${encodeURIComponent(adminKey)}`} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[0.62rem] text-cream/50 transition-colors hover:border-gold/30 hover:text-gold">
                <Download className="h-3 w-3" /> {label}
              </a>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHead
          title="সার্চ ইঞ্জিন ও সোশ্যাল"
          sub="SEO অবকাঠামো — সাইটম্যাপ, ফিড ও স্ট্রাকচার্ড ডেটা"
          icon={<Search className="h-4 w-4" />}
          action={<Badge tone="emerald">সক্রিয়</Badge>}
        />
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/sitemap.xml", label: "সাইটম্যাপ", sub: "সব পাবলিক পেজ + CMS পোস্ট", icon: Globe2 },
            { href: "/robots.txt", label: "Robots", sub: "ক্রলার নির্দেশনা", icon: Files },
            { href: "/feed.xml", label: "RSS ফিড", sub: "সংবাদ, ব্লগ ও ইভেন্ট", icon: Rss },
            { href: "/manifest.webmanifest", label: "ওয়েব ম্যানিফেস্ট", sub: "ফোনে অ্যাপ হিসেবে ইনস্টল", icon: Smartphone },
          ].map(({ href, label, sub, icon: Icon }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 transition-colors hover:border-emerald-bright/30 hover:bg-white/[0.04]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-bright/10 text-emerald-bright"><Icon className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.66rem] font-semibold text-cream/70">{label}</span>
                <span className="block truncate text-[0.54rem] text-cream/30">{sub}</span>
              </span>
            </a>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-white/[0.06] px-4 py-3 text-[0.6rem] leading-relaxed text-cream/40">
          <p>সক্রিয়: বাংলা মেটাডেটা ও ক্যানোনিক্যাল URL, Open Graph ও Twitter কার্ড, NewsArticle / BlogPosting / Event / Breadcrumb স্কিমা, ছবির অল্ট টেক্সট, মোবাইল-ফ্রেন্ডলি viewport।</p>
          <p>Google Search Console-এ <span className="font-latin text-cream/65">sitemap.xml</span> সাবমিট করুন; নতুন পোস্ট প্রকাশের সাথে সাথে সাইটম্যাপে যুক্ত হবে।</p>
        </div>
      </Card>

      <Card>
        <CardHead title="অডিট লগ" sub="কে কী পরিবর্তন করেছেন" icon={<History className="h-4 w-4" />} action={<Badge tone="muted">{bn(data.audit.length)}</Badge>} />
        <div className="max-h-[300px] divide-y divide-white/[0.05] overflow-y-auto">
          {data.audit.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-bright/60" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.64rem] text-cream/60"><span className="font-semibold text-cream/75">{a.actor}</span> · {a.action}</p>
                <p className="truncate text-[0.54rem] text-cream/30">{a.detail}</p>
              </div>
              <span className="shrink-0 text-[0.52rem] text-cream/25">{new Date(a.at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
          {data.audit.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CalendarDays className="mx-auto h-5 w-5 text-cream/15" />
              <p className="mt-2 text-[0.66rem] text-cream/30">এখনো কোনো পরিবর্তন রেকর্ড হয়নি।</p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
