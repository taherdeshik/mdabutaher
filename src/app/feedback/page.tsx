import type { Metadata } from "next";
import { AlertOctagon, ArrowUpRight, CheckCircle2, Clock3, MessageSquareHeart, ShieldAlert, Sparkles, Users } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { FeedbackForm } from "@/components/features/feedback-form";
import { Reveal } from "@/components/ui/reveal";
import { FeedbackStats } from "@/components/features/feedback-stats";
import { withBasePath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "সমস্যা, পরামর্শ ও হুমকি রিপোর্ট",
  description: "মহাদান ইউনিয়নের স্থানীয় সমস্যা, উন্নয়ন পরামর্শ ও নিরাপত্তা হুমকি সরাসরি জানান — ট্র্যাকিং আইডিসহ।",
  alternates: { canonical: "/feedback" },
};

const channels = [
  { icon: MessageSquareHeart, title: "স্থানীয় সমস্যা", desc: "সড়ক, পানি, স্বাস্থ্য, শিক্ষা — যেকোনো সমস্যা জানান।", tone: "bg-sky-50 text-sky-700" },
  { icon: Sparkles, title: "পরামর্শ", desc: "উন্নয়নের নতুন ধারণা দিন — সেরা আইডিয়া মারিফেস্টোতে যুক্ত হবে।", tone: "bg-gold/15 text-gold-deep" },
  { icon: ShieldAlert, title: "হুমকি ও ঝুঁকি", desc: "মাদক, সন্ত্রাস, দুর্যোগ বা নিরাপত্তা ঝুঁকি গোপনীয়ভাবে জানান।", tone: "bg-rose-50 text-rose-600" },
];

export default function FeedbackPage() {
  return (
    <>
      <PageHero
        eyebrow="জনগণের কণ্ঠস্বর"
        title={<>আপনার সমস্যা জানুন, <span className="text-gold">সমাধান</span> হোক</>}
        description="এই প্ল্যাটফর্ম আপনার কথা শোনার জন্য। প্রতিটি রিপোর্ট একটি ট্র্যাকিং আইডি পায়, সংশ্লিষ্ট ওয়ার্ডে পাঠানো হয় এবং অগ্রগতি প্রকাশ্যে আপডেট হয়।"
        crumbs={[{ label: "সমস্যা ও পরামর্শ" }]}
        accent="কণ্ঠস্বর"
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CheckCircle2, value: "৯২%", label: "নিষ্পত্তি হার" },
            { icon: Clock3, value: "৩.৮ দিন", label: "গড় সমাধান" },
            { icon: Users, value: "৪৮৭২", label: "মতামত" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-center backdrop-blur">
              <s.icon className="mx-auto h-3.5 w-3.5 text-gold" />
              <p className="mt-1 font-latin text-xs font-bold text-cream">{s.value}</p>
              <p className="text-[0.55rem] leading-tight text-cream/45">{s.label}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:gap-10">
          <Reveal>
            <FeedbackForm />
          </Reveal>

          <div className="space-y-4">
            <Reveal delay={0.08}>
              <div className="rounded-2xl border border-forest/10 bg-white p-5">
                <p className="eyebrow mb-3">তিনটি চ্যানেল</p>
                <div className="space-y-3">
                  {channels.map((c) => (
                    <div key={c.title} className="flex gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${c.tone}`}><c.icon className="h-4 w-4" /></span>
                      <div>
                        <p className="text-[0.82rem] font-bold text-forest">{c.title}</p>
                        <p className="mt-0.5 text-[0.72rem] leading-relaxed text-muted">{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <a href={withBasePath("/feedback/board")} className="mt-4 flex items-center justify-between rounded-xl bg-cream-2/70 px-3.5 py-2.5 text-[0.78rem] font-semibold text-forest transition-colors hover:bg-cream-2">
                  পাবলিক বোর্ড দেখুন <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <FeedbackStats />
            </Reveal>

            <Reveal delay={0.2}>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-50/60 p-4">
                <p className="flex items-center gap-2 text-[0.8rem] font-bold text-rose-700"><AlertOctagon className="h-4 w-4" /> জরুরি হলে</p>
                <p className="mt-1.5 text-[0.72rem] leading-relaxed text-rose-700/80">জীবন বা সম্পত্তির তাৎক্ষণিক ঝুঁকিতে ৯৯৯ নম্বরে কল করুন। নারী ও শিশু নির্যাতন প্রতিরোধে ১০৯।</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a href="tel:999" className="rounded-lg bg-rose-600 px-3 py-2 text-center text-[0.72rem] font-bold text-white">৯৯৯ কল</a>
                  <a href="tel:109" className="rounded-lg border border-rose-300 px-3 py-2 text-center text-[0.72rem] font-bold text-rose-700">১০৯ হেল্পলাইন</a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
