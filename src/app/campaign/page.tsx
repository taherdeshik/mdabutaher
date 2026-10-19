import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, CheckCircle2, Clock, Download, Flag, MapPin, Megaphone, Target, Users } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading, Badge } from "@/components/ui/section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";
import { VolunteerForm } from "@/components/features/volunteer-form";
import { campaignKpis, campaignOverview, campaignResources, phases, weeklyRhythm, zones } from "@/content/campaign";
import { bn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "প্রচারণা পরিকল্পনা ও সময়সূচি",
  description: "মহাদান ইউনিয়নের ২০২৭ নির্বাচনী প্রচারণার ধাপ, ওয়ার্ডভিত্তিক পরিকল্পনা, সাপ্তাহিক রুটিন ও স্বেচ্ছাসেবক সুযোগ।",
  alternates: { canonical: "/campaign" },
};

export default function CampaignPage() {
  return (
    <>
      <PageHero
        eyebrow="প্রচারণা ২০২৭"
        title={<>২১ সপ্তাহের <span className="text-gold">পরিকল্পিত পথচলা</span></>}
        description={campaignOverview.goal}
        crumbs={[{ label: "প্রচারণা" }]}
        accent="মাঠ"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <div className="grid grid-cols-2 gap-3">
            {campaignKpis.map((k) => (
              <div key={k.label}>
                <p className="font-display text-xl font-bold text-gold"><Counter value={k.value} suffix={k.suffix} /></p>
                <p className="text-[0.6rem] text-cream/50">{k.label}</p>
              </div>
            ))}
          </div>
          <a href="/api/calendar/ics" className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-[0.75rem] font-semibold text-cream transition-colors hover:border-gold hover:text-gold">
            <CalendarDays className="h-3.5 w-3.5" /> ক্যালেন্ডারে যোগ করুন
          </a>
        </div>
      </PageHero>

      {/* phases */}
      <Section tone="light">
        <div className="container-x">
          <SectionHeading eyebrow="চারটি ধাপ" title={<>শোনা → সংগঠিত → <span className="text-emerald">অঙ্গীকার</span> → বাস্তবায়ন</>} description="প্রতিটি ধাপের নির্দিষ্ট লক্ষ্য, কাজ ও পরিমাপযোগ্য সূচক রয়েছে।" />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {phases.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.07}>
                <div className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 ${p.status === "active" ? "border-gold/60 bg-white shadow-lift" : "border-forest/10 bg-white"}`}>
                  {p.status === "active" && <span className="absolute right-4 top-4 rounded-full bg-gold px-2 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-wider text-night">চলছে</span>}
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${p.status === "completed" ? "bg-emerald text-white" : p.status === "active" ? "bg-gold text-night" : "bg-forest/5 text-forest/40"}`}>
                    {p.status === "completed" ? <Check className="h-5 w-5" /> : <span className="text-xs font-bold">{bn(i + 1)}</span>}
                  </span>
                  <h3 className="mt-3 text-[0.95rem] font-bold text-forest">{p.name}</h3>
                  <p className="mt-0.5 text-[0.64rem] text-muted">{p.window}</p>
                  <p className="mt-2 text-[0.76rem] leading-relaxed text-muted">{p.objective}</p>
                  <ul className="mt-3 space-y-1.5">
                    {p.activities.map((a) => (
                      <li key={a} className="flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-forest/70">
                        <CheckCircle2 className={`mt-0.5 h-3 w-3 shrink-0 ${p.status === "completed" ? "text-emerald" : "text-forest/25"}`} />{a}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between text-[0.62rem] text-muted"><span>অগ্রগতি</span><span className="font-latin font-bold text-forest">{p.progress}%</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald to-emerald-bright" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-forest/8 pt-2.5">
                      {p.kpi.map((k) => <span key={k.label} className="text-[0.6rem] text-muted"><strong className="font-latin text-forest">{k.value}</strong> {k.label}</span>)}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* zones + weekly */}
      <Section tone="sand" id="zones">
        <div className="container-x grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <SectionHeading eyebrow="ওয়ার্ডভিত্তিক নেটওয়ার্ক" title={<>৯ ওয়ার্ড, ৯ <span className="text-emerald">দলপ্রধান</span></>} description="প্রতিটি ওয়ার্ডে একজন সমন্বয়ক, স্বেচ্ছাসেবক দল ও নির্ধারিত বুথ সংখ্যা।" />
            <div className="mt-6 overflow-hidden rounded-2xl border border-forest/10 bg-white">
              <div className="hidden grid-cols-[3rem_1fr_6rem_5rem_5rem] gap-2 border-b border-forest/8 bg-cream/50 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-wider text-muted sm:grid">
                <span>ওয়ার্ড</span><span>এলাকা ও দলপ্রধান</span><span>পরিবার</span><span>বুথ</span><span>কভারেজ</span>
              </div>
              {zones.map((z) => (
                <div key={z.ward} className="grid grid-cols-2 gap-2 border-b border-forest/5 px-4 py-3 last:border-0 sm:grid-cols-[3rem_1fr_6rem_5rem_5rem] sm:items-center">
                  <span className="font-display text-sm font-bold text-forest">ওয়ার্ড {z.ward}</span>
                  <span className="text-right sm:text-left">
                    <span className="block text-[0.78rem] font-semibold text-forest">{z.name}</span>
                    <span className="block text-[0.64rem] text-muted">{z.leader}</span>
                  </span>
                  <span className="text-[0.72rem] text-muted">{bn(z.households.toLocaleString("en-US"))}</span>
                  <span className="text-[0.72rem] text-muted">{bn(z.booths)}টি</span>
                  <span className="flex items-center gap-1.5 sm:justify-start">
                    <span className="h-1 w-10 overflow-hidden rounded-full bg-forest/10"><span className="block h-full rounded-full bg-emerald" style={{ width: `${z.coverage}%` }} /></span>
                    <span className="font-latin text-[0.62rem] font-bold text-forest">{z.coverage}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="সাপ্তাহিক রুটিন" title={<>প্রতি সপ্তাহে <span className="text-emerald">আমরা</span></>} />
            <div className="mt-6 space-y-1.5">
              {weeklyRhythm.map((r) => (
                <div key={r.day} className="flex items-center gap-3 rounded-xl border border-forest/8 bg-white px-3 py-2.5">
                  <span className="w-16 shrink-0 text-[0.68rem] font-bold text-forest">{r.day}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.76rem] font-medium text-forest">{r.title}</p>
                    <p className="text-[0.62rem] text-muted">{r.place}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-cream-2 px-2 py-0.5 font-latin text-[0.58rem] text-muted">{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* resources + volunteer */}
      <Section tone="light" id="volunteer">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="স্বেচ্ছাসেবক" title={<>আপনার <span className="text-emerald">ওয়ার্ডে</span> আপনার হাত দরকার</>} description="শিক্ষার্থী, তরুণ পেশাজীবী, গৃহিণী, প্রবাসী — সবার জন্য জায়গা আছে। প্রশিক্ষণ, সার্টিফিকেট ও টিমের সাথে কাজের সুযোগ।" />
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                { icon: Users, value: "২১০", label: "বর্তমান স্বেচ্ছাসেবক" },
                { icon: Clock, value: "২–৪ ঘণ্টা", label: "সাপ্তাহিক গড় সময়" },
                { icon: MapPin, value: "৯", label: "ওয়ার্ড টিম" },
                { icon: Megaphone, value: "২৪/৭", label: "ডিজিটাল সেল" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-forest/10 bg-white p-3.5">
                  <s.icon className="h-4 w-4 text-emerald" />
                  <p className="mt-2 font-display text-lg font-bold text-forest">{s.value}</p>
                  <p className="text-[0.64rem] text-muted">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {campaignResources.map((r) => (
                <a key={r.title} href={r.href} className="group flex items-center gap-2.5 rounded-xl border border-forest/10 bg-white p-3 transition-colors hover:border-forest/25">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-forest/5 text-forest transition-colors group-hover:bg-forest group-hover:text-gold"><Download className="h-3.5 w-3.5" /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.76rem] font-semibold text-forest">{r.title}</span>
                    <span className="block truncate text-[0.62rem] text-muted">{r.desc}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
          <Reveal>
            <VolunteerForm />
          </Reveal>
        </div>
      </Section>

      <div className="bg-forest py-10 text-cream">
        <div className="container-x flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-gold"><Flag className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-bold">পরবর্তী ইভেন্টে যোগ দিতে চান?</p>
              <p className="text-[0.72rem] text-cream/50">জনসভা, উঠান বৈঠক ও ক্যাম্পের সময়সূচি দেখুন</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/events" className="rounded-full bg-gold px-4 py-2.5 text-[0.8rem] font-bold text-night transition-transform hover:scale-[1.02]">সব ইভেন্ট</Link>
            <Link href="/manifesto" className="rounded-full border border-white/20 px-4 py-2.5 text-[0.8rem] font-semibold text-cream transition-colors hover:border-gold hover:text-gold">ম্যানিফেস্টো</Link>
          </div>
        </div>
      </div>
    </>
  );
}
