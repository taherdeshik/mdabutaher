import type { Metadata } from "next";
import { ArrowUpRight, CalendarDays, CheckCircle2, Download, FileText, Layers, Quote, Target } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
import { ManifestoExplorer } from "@/components/features/manifesto-explorer";
import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/home/cta-band";
import { manifestoIntro, manifestoFaq, pillars } from "@/content/manifesto";
import { withBasePath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "নির্বাচনী ম্যানিফেস্টো ২০২৭",
  description: "৮টি স্তম্ভে ৩২টি সুনির্দিষ্ট অঙ্গীকার — শিক্ষা, পানি, স্বাস্থ্য, অবকাঠামো, নিরাপত্তা, কৃষি, ডিজিটাল ও অন্তর্ভুক্তি। প্রতিটি অঙ্গীকারের সময়সীমা ও অগ্রগতি।",
  alternates: { canonical: "/manifesto" },
};

const roadmap = [
  { phase: "০ – ১০০ দিন", title: "জরুরি ও দৃশ্যমান", items: ["পানি পরীক্ষা ল্যাব", "উন্মুক্ত বাজেট ড্যাশবোর্ড", "মাদক প্রতিরোধ কমিটি", "২৪/৭ অ্যাম্বুলেন্স চালু"] },
  { phase: "৬ মাস", title: "ভিত্তি স্থাপন", items: ["১১ বিদ্যালয়ে পাঠাগার", "ঝরে পড়া প্রতিরোধ তহবিল", "কৃষক সহায়তা ডেস্ক", "সেবা অনলাইনে (প্রথম ধাপ)"] },
  { phase: "১২ মাস", title: "বড় প্রকল্প শুরু", items: ["৫০ টিউবওয়েল (১ম ধাপ)", "১,৫০০ সৌরবাতির কাজ শুরু", "যুব দক্ষতা কেন্দ্র", "ডিজিটাল সাক্ষরতা ৫০০ জন"] },
  { phase: "৫ বছর", title: "টেকসই রূপান্তর", items: ["১০০% নিরাপদ পানি", "৪২ কিমি সড়ক সংস্কার", "স্বাস্থ্য বীমা পাইলট সম্প্রসারণ", "সব সেবা ডিজিটাল"] },
];

export default function ManifestoPage() {
  return (
    <>
      <PageHero
        eyebrow="ম্যানিফেস্টো ২০২৭"
        title={<>প্রতিশ্রুতি নয়, <span className="text-gold">পরিকল্পনা</span></>}
        description={manifestoIntro.quote}
        crumbs={[{ label: "ম্যানিফেস্টো" }]}
        accent="অঙ্গীকার"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="font-latin text-xl font-bold text-gold">৮</p><p className="text-[0.6rem] text-cream/50">স্তম্ভ</p></div>
            <div><p className="font-latin text-xl font-bold text-gold">৩২</p><p className="text-[0.6rem] text-cream/50">অঙ্গীকার</p></div>
            <div><p className="font-latin text-xl font-bold text-gold">৫</p><p className="text-[0.6rem] text-cream/50">বছরের রোডম্যাপ</p></div>
          </div>
          <a href={withBasePath("/manifesto/print")} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-[0.8rem] font-bold text-night transition-transform hover:scale-[1.01]">
            <Download className="h-4 w-4" /> ম্যানিফেস্টো ডাউনলোড (PDF)
          </a>
          <p className="mt-2 text-center text-[0.6rem] text-cream/35">প্রকাশিত: ১ সেপ্টেম্বর ২০২৬ · সংস্করণ ১.০</p>
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x">
          <ManifestoExplorer />
        </div>
      </Section>

      {/* Roadmap */}
      <Section tone="dark" id="roadmap">
        <div className="container-x">
          <SectionHeading dark align="center" eyebrow="বাস্তবায়ন রোডম্যাপ" title={<>কখন কী হবে — <span className="text-gold">স্পষ্ট সময়সীমা</span></>} description="প্রতিটি ধাপের অগ্রগতি প্রতি মাসে প্রকাশ্যে আপডেট হবে।" />
          <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {roadmap.map((r, i) => (
              <Reveal key={r.phase} delay={i * 0.08}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="absolute -top-3 left-5 rounded-full bg-gold px-2.5 py-1 font-latin text-[0.6rem] font-extrabold text-night">{r.phase}</span>
                  <p className="mt-2 text-[0.95rem] font-bold text-cream">{r.title}</p>
                  <ul className="mt-3 space-y-2">
                    {r.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-[0.76rem] leading-relaxed text-cream/55">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-bright" />{it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10">
            <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-3">
              {[
                { icon: Target, title: "মোট প্রাক্কলিত বাজেট", value: "৳ ৫.৮৬ কোটি", note: "৫ বছরে, তিনটি উৎস" },
                { icon: Layers, title: "বাস্তবায়ন দল", value: "৯ ওয়ার্ড কমিটি", note: "৩৬ জন দায়িত্বপ্রাপ্ত" },
                { icon: CalendarDays, title: "পর্যালোচনা", value: "প্রতি ৬ মাস", note: "পাবলিক প্রগ্রেস রিভিউ" },
              ].map((s) => (
                <div key={s.title} className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-gold"><s.icon className="h-4 w-4" /></span>
                  <div>
                    <p className="text-[0.68rem] text-cream/45">{s.title}</p>
                    <p className="mt-0.5 text-[0.95rem] font-bold text-cream">{s.value}</p>
                    <p className="text-[0.62rem] text-cream/35">{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Pillar quick index + FAQ */}
      <Section tone="sand">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="দ্রুত নির্দেশিকা" title={<>৮টি স্তম্ভ <span className="text-emerald">এক নজরে</span></>} />
            <div className="mt-6 divide-y divide-forest/10 rounded-2xl border border-forest/10 bg-white">
              {pillars.map((p) => (
                <a key={p.id} href={`#${p.id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cream/60">
                  <span className="font-latin text-[0.7rem] font-bold text-forest/30">{p.number}</span>
                  <span className="flex-1 text-[0.85rem] font-semibold text-forest">{p.title}</span>
                  <span className="hidden items-center gap-1 sm:flex">
                    <span className="h-1 w-14 overflow-hidden rounded-full bg-forest/10">
                      <span className="block h-full rounded-full bg-emerald" style={{ width: `${p.progress}%` }} />
                    </span>
                    <span className="font-latin text-[0.62rem] text-muted">{p.progress}%</span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="প্রশ্নোত্তর" title={<>ম্যানিফেস্টো নিয়ে <span className="text-emerald">প্রশ্ন</span></>} />
            <div className="mt-4 rounded-2xl border border-forest/10 bg-white px-5">
              <Accordion items={manifestoFaq} />
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/8 p-4">
              <Quote className="h-5 w-5 shrink-0 text-gold-deep" />
              <p className="text-[0.8rem] leading-relaxed text-forest/80">
                ম্যানিফেস্টো একটি জীবন্ত দলিল। আপনার পরামর্শ এলে সংশোধনী আকারে যুক্ত হবে — সংস্করণ নম্বর ও তারিখসহ।
              </p>
            </div>
            <a href={withBasePath("/feedback")} className="mt-3 flex items-center justify-between rounded-2xl bg-forest px-4 py-3 text-cream transition-colors hover:bg-forest-2">
              <span className="flex items-center gap-2 text-[0.82rem] font-semibold"><FileText className="h-4 w-4 text-gold" /> ম্যানিফেস্টোতে পরামর্শ দিন</span>
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
