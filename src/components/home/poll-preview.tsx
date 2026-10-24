import type { HomeSectionCopy } from "@/content/home-sections";
import { Section, SectionHeading } from "@/components/ui/section";
import { PollCard } from "@/components/features/poll-card";
import { seedPolls, pollArchiveSummary } from "@/content/polls";
import { Reveal } from "@/components/ui/reveal";
import { ArrowUpRight, BarChart3, Users } from "lucide-react";
import Link from "next/link";
import { bn } from "@/lib/utils";

export function PollPreview({ copy }: { copy?: HomeSectionCopy }) {
  const active = seedPolls.filter((p) => p.status === "active").slice(0, 1);
  return (
    <Section tone="light" id="polls">
      <div className="container-x">
        <SectionHeading
          eyebrow={copy?.eyebrow || "জনমত জরিপ"}
          title={copy?.title ? <>{copy.title}</> : <>আপনার মতই <span className="text-emerald">আমাদের অগ্রাধিকার</span></>}
          description={copy?.description || "এলাকার সমস্যা, সেবার অগ্রাধিকার ও ইভেন্ট— প্রতিটি সিদ্ধান্তে জনমত নেওয়া হয়। ভোট দিন, লাইভ ফলাফল দেখুন।"}
          action={{ href: "/polls", label: "সব জরিপ" }}
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal>{active[0] && <PollCard poll={active[0]} featured />}</Reveal>
          <div className="space-y-3">
            <Reveal delay={0.08}>
              <div className="rounded-3xl bg-forest p-6 text-cream">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">সর্বমোট অংশগ্রহণ</p>
                <p className="mt-3 font-display text-4xl font-bold">{bn(pollArchiveSummary.totalVotes.toLocaleString("en-US"))}+</p>
                <p className="mt-1 text-[0.8rem] text-cream/50">{bn(pollArchiveSummary.totalPolls)}টি জরিপ · {bn(pollArchiveSummary.participants.toLocaleString("en-US"))} জন অংশগ্রহণকারী</p>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                  {[["৭ দিনে", "১,২৪০"], ["গড়", "৮.৪ মিনিট"], ["সন্তুষ্টি", "৯২%"]].map(([k, v]) => (
                    <div key={k}>
                      <p className="font-latin text-xs font-bold text-gold">{v}</p>
                      <p className="text-[0.6rem] text-cream/40">{k}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.14}>
              <Link href="/polls" className="group flex items-center justify-between rounded-2xl border border-forest/10 bg-white p-4 transition-colors hover:bg-cream">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold-deep"><BarChart3 className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-bold text-forest">গত মাসের ফলাফল</p>
                    <p className="text-[0.7rem] text-muted">যুবদের জন্য কোন উদ্যোগ জরুরি?</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" />
              </Link>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-forest/15 p-4">
                <Users className="h-5 w-5 text-emerald" />
                <p className="text-[0.72rem] leading-relaxed text-muted">প্রতি ব্রাউজার থেকে একবার ভোট গ্রহণ করা হয়। ফলাফল আনুষ্ঠানিক নির্বাচনী জরিপ নয়।</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
