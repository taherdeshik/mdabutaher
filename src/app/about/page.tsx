import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight, BadgeCheck, BookOpen, Briefcase, CalendarCheck, GraduationCap,
  HeartHandshake, MapPin, Quote, ShieldCheck, Sparkles, Users,
} from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading, Badge } from "@/components/ui/section";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";
import { CtaBand } from "@/components/home/cta-band";
import { IntroVideoSection } from "@/components/features/intro-video";
import { Accordion } from "@/components/ui/accordion";
import { bio, site, stats, values, faqs } from "@/content/site";
import { Icon } from "@/components/ui/icon";
import { withBasePath } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "আমার পরিচিতি",
  description:
    "মোঃ আবু তাহের — সমাজকর্মে স্নাতক, ২৪ বছরের জনসেবা, শিক্ষা, নিরাপদ পানি ও দুর্যোগ ব্যবস্থাপনায় অভিজ্ঞতা। শক্তি, দক্ষতা ও অঙ্গীকার।",
  alternates: { canonical: "/about" },
};

const journey = [
  { year: "১৯৯৯", title: "প্রথম উদ্যোগ", text: "মহাদান যুব কল্যাণ সংসদের সাথে শিক্ষা উপকরণ বিতরণ শুরু — ১২০ জন শিক্ষার্থী।", icon: HeartHandshake },
  { year: "২০০৮", title: "প্রাতিষ্ঠানিক সংগঠন", text: "মসজিদ ও মাদ্রাসা কমিটিতে যোগ দিয়ে শিক্ষা সহায়তা তহবিল গঠন।", icon: Users },
  { year: "২০১৫", title: "কর্মসংস্থান সৃষ্টি", text: "স্থানীয় ব্যবসায় ৩০+ যুবকের কর্মসংস্থান এবং কারিগরি প্রশিক্ষণের ব্যবস্থা।", icon: Briefcase },
  { year: "২০২১", title: "দুর্যোগে নেতৃত্ব", text: "বন্যায় ২৮০ পরিবারের কাছে ৪৮ ঘণ্টায় ত্রাণ পৌঁছানো — ৬ নৌকা, ৪২ স্বেচ্ছাসেবক।", icon: ShieldCheck },
  { year: "২০২২", title: "শিক্ষা ও পানি", text: "৩,০০০+ বই বিতরণ ও পাবলিক পানি পয়েন্ট স্থাপন।", icon: BookOpen },
  { year: "২০২৭", title: "পরিকল্পিত মহাদান", text: "৮টি স্তম্ভে ৩২টি অঙ্গীকার নিয়ে ইউনিয়ন পরিষদে জনগণের সেবায়।", icon: Sparkles },
];

export default function AboutPage() {
  return (
    <>
      <PageHero pageId="about"
        eyebrow="পরিচিতি"
        title={<>যে মানুষ মাঠে থাকে, <span className="text-gold">সে-ই নেতা</span></>}
        description={site.intro}
        crumbs={[{ label: "পরিচিতি" }]}
        accent="আবু তাহের"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gold font-display text-xl font-bold text-night">আ</span>
            <div>
              <p className="text-sm font-bold text-cream">{site.name}</p>
              <p className="text-[0.68rem] text-cream/50">{site.role} · {site.ward}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-[0.7rem] text-cream/60">
            <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gold" />{site.union}, {site.upazila}, {site.district}</p>
            <p className="flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-emerald-bright" />২৪ বছরের নিরবচ্ছিন্ন জনসেবা</p>
            <p className="flex items-center gap-2"><CalendarCheck className="h-3.5 w-3.5 text-gold" />নির্বাচন {site.electionYear} · ৮ নং ওয়ার্ড ইউপি</p>
          </div>
        </div>
      </PageHero>

      {/* Profile + bio */}
      <Section tone="light">
        <div className="container-x grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <Reveal>
            <div className="sticky top-24">
              <div className="overflow-hidden rounded-[2rem] border border-forest/10 shadow-lift">
                <SmartImage imageKey="portrait" alt={site.name} className="aspect-[4/5]" label="প্রার্থীর প্রতিকৃতি" priority sizes="(max-width: 1024px) 90vw, 36vw" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { k: "শিক্ষা", v: "স্নাতক" },
                  { k: "অভিজ্ঞতা", v: "২৪ বছর" },
                  { k: "ওয়ার্ড", v: "৯টি" },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-forest/10 bg-white p-2.5 text-center">
                    <p className="text-[0.62rem] text-muted">{s.k}</p>
                    <p className="mt-0.5 text-[0.82rem] font-bold text-forest">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`tel:${site.phoneHref}`} className="flex-1 rounded-xl bg-forest px-3 py-2.5 text-center text-[0.78rem] font-semibold text-cream">সরাসরি কল</a>
                <a href={withBasePath("/appointment")} className="flex-1 rounded-xl border border-forest/15 px-3 py-2.5 text-center text-[0.78rem] font-semibold text-forest">সময় নিন</a>
              </div>
            </div>
          </Reveal>

          <div>
            <SectionHeading
              eyebrow="জীবন ও দর্শন"
              title={<>মানুষের আস্থাই আমার <span className="text-emerald">রাজনৈতিক পুঁজি</span></>}
            />
            <div className="mt-5 space-y-4 text-[0.92rem] leading-relaxed text-muted">
              <p>
                আমার জন্ম ও বেড়ে ওঠা এই মহাদানের মাটিতে। বাবা ছিলেন কৃষক, মা গৃহিণী। সংসারের টানাপোড়েনের মধ্যেও বাবা-মা শিখিয়েছেন — <strong className="font-semibold text-forest">যার যা সামর্থ্য, তার পাশে দাঁড়াও।</strong> সেই শিক্ষাই আজ আমার কাজের ভিত্তি।
              </p>
              <p>
                সমাজকর্মে স্নাতক শেষে আমি বুঝলাম, ব্যক্তিগত দান-সদকা দিয়ে মানুষের দীর্ঘমেয়াদি সমস্যা সমাধান হয় না। প্রয়োজন প্রতিষ্ঠান, প্রয়োজন স্বচ্ছ ব্যবস্থাপনা, প্রয়োজন জবাবদিহিতা। তাই ইউনিয়ন পরিষদকে শুধু একটি সেবা কেন্দ্র নয়, <strong className="font-semibold text-forest">একটি উন্মুক্ত ও জবাবদিহিমূলক প্রতিষ্ঠান</strong> হিসেবে গড়তে চাই।
              </p>
              <blockquote className="relative rounded-2xl border-l-4 border-gold bg-cream-2/60 p-4 text-[0.92rem] italic text-forest">
                <Quote className="absolute -top-3 left-3 h-6 w-6 rounded-full bg-gold p-1 text-night" />
                “আমি প্রতিশ্রুতি দিয়ে ভোট চাই না। আমি কাজ দেখিয়ে ভোট চাই। প্রতিটি কাজের হিসাব, প্রতিটি টাকার ব্যয় — সবকিছু মানুষের সামনে খোলা থাকবে।”
              </blockquote>
              <p>
                এই ওয়েবসাইটটাই তার প্রমাণ — প্রতিটি অঙ্গীকারের সময়সীমা, অগ্রগতি ও খরচ এখানে প্রকাশ্য। কেউ প্রশ্ন করলে উত্তর পাবেন; কেউ অভিযোগ করলে ট্র্যাকিং আইডি পাবেন।
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {values.map((v) => (
                <div key={v.title} className="flex gap-3 rounded-2xl border border-forest/8 bg-white p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest/5 text-forest"><Icon name={v.icon} className="h-4 w-4" /></span>
                  <div>
                    <p className="text-[0.85rem] font-bold text-forest">{v.title}</p>
                    <p className="mt-0.5 text-[0.72rem] leading-relaxed text-muted">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Stats */}
      <div className="bg-forest py-10 text-cream">
        <div className="container-x grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <p className="font-display text-3xl font-bold text-gold sm:text-4xl"><Counter value={s.value} suffix={s.suffix} /></p>
              <p className="mt-1 text-[0.8rem] font-semibold text-cream/80">{s.label}</p>
              <p className="text-[0.66rem] text-cream/40">{s.hint}</p>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Skills + capacities */}
      <Section tone="sand">
        <div className="container-x grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeading eyebrow="দক্ষতা" title={<>যা জানি, তা <span className="text-emerald">কাজে লাগাই</span></>} description="শুধু অভিজ্ঞতা নয় — প্রতিটি দক্ষতা মাঠে যাচাই করা।" />
            <div className="mt-6 space-y-4">
              {bio.skills.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.05}>
                  <div>
                    <div className="flex items-center justify-between text-[0.8rem]">
                      <span className="font-medium text-forest">{s.label}</span>
                      <span className="font-latin text-[0.72rem] font-bold text-emerald">{s.value}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-forest to-emerald transition-all duration-1000" style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="সক্ষমতা" title={<>নেতৃত্বের <span className="text-emerald">প্রমাণ</span></>} description="কথায় নয় — সম্পদ, নেটওয়ার্ক ও অভিজ্ঞতায় যা ইতিমধ্যেই আছে।" />
            <ul className="mt-6 space-y-2.5">
              {bio.capacities.map((c, i) => (
                <Reveal key={c} delay={i * 0.05}>
                  <li className="flex items-start gap-3 rounded-xl border border-forest/8 bg-white p-3.5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald/10 text-[0.65rem] font-bold text-emerald">{i + 1}</span>
                    <span className="text-[0.82rem] leading-relaxed text-forest/85">{c}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Timeline */}
      <Section tone="light">
        <div className="container-x">
          <SectionHeading eyebrow="যাত্রা" title={<>১৯৯৯ থেকে <span className="text-emerald">আজ পর্যন্ত</span></>} align="center" description="প্রতিটি বছর একটি কাজ, প্রতিটি কাজ একটি গল্প।" />
          <div className="relative mx-auto mt-12 max-w-3xl">
            <div className="absolute left-4 top-0 h-full w-px bg-forest/10 sm:left-1/2" />
            {journey.map((j, i) => (
              <Reveal key={j.year} delay={i * 0.06} className={`relative mb-6 pl-12 sm:w-1/2 sm:pl-0 ${i % 2 === 0 ? "sm:pr-10 sm:text-right" : "sm:ml-auto sm:pl-10"}`}>
                <span className={`absolute left-[0.6rem] top-3 grid h-7 w-7 place-items-center rounded-full border-2 border-cream bg-forest text-gold sm:left-auto ${i % 2 === 0 ? "sm:-right-[0.9rem]" : "sm:-left-[0.9rem]"}`}>
                  <j.icon className="h-3.5 w-3.5" />
                </span>
                <div className="rounded-2xl border border-forest/10 bg-white p-4 shadow-soft">
                  <span className="font-latin text-[0.68rem] font-bold uppercase tracking-widest text-emerald">{j.year}</span>
                  <p className="mt-1 text-[0.92rem] font-bold text-forest">{j.title}</p>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-muted">{j.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Education & experience */}
      <Section tone="sand">
        <div className="container-x grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-forest/10 bg-white p-6">
              <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold-deep"><GraduationCap className="h-4 w-4" /> শিক্ষা</p>
              <div className="mt-5 space-y-5">
                {bio.education.map((e) => (
                  <div key={e.title} className="border-l-2 border-forest/10 pl-4">
                    <p className="font-latin text-[0.65rem] font-bold text-emerald">{e.year}</p>
                    <p className="mt-0.5 text-[0.9rem] font-bold text-forest">{e.title}</p>
                    <p className="text-[0.76rem] text-muted">{e.org} · {e.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="h-full rounded-3xl border border-forest/10 bg-white p-6">
              <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-emerald"><Briefcase className="h-4 w-4" /> অভিজ্ঞতা</p>
              <div className="mt-5 space-y-5">
                {bio.experience.map((e) => (
                  <div key={e.title} className="border-l-2 border-forest/10 pl-4">
                    <p className="font-latin text-[0.65rem] font-bold text-emerald">{e.year}</p>
                    <p className="mt-0.5 text-[0.9rem] font-bold text-forest">{e.title}</p>
                    <p className="text-[0.76rem] text-muted">{e.org}</p>
                    <p className="mt-1 text-[0.72rem] leading-relaxed text-muted/80">{e.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="light">
        <div className="container-x grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="প্রশ্নোত্তর" title={<>আপনার <span className="text-emerald">জিজ্ঞাসা</span></>} description="সাধারণ কিছু প্রশ্নের সরাসরি উত্তর।" />
          <Accordion items={faqs} />
        </div>
      </Section>

      <IntroVideoSection showAboutLink={false} />

      <CtaBand />
    </>
  );
}
