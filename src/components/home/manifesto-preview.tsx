import type { HomeSectionCopy } from "@/content/home-sections";
import Link from "next/link";
import { ArrowUpRight, CircleDot } from "lucide-react";
import { pillars, manifestoIntro } from "@/content/manifesto";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";

const accentStyles = {
  emerald: "bg-emerald/10 text-emerald group-hover:bg-emerald",
  gold: "bg-gold/15 text-gold-deep group-hover:bg-gold",
  sky: "bg-sky-500/10 text-sky-700 group-hover:bg-sky-600",
  rose: "bg-rose-500/10 text-rose-600 group-hover:bg-rose-500",
} as const;

export function ManifestoPreview({ copy }: { copy?: HomeSectionCopy }) {
  return (
    <Section tone="sand" id="manifesto">
      <div className="container-x">
        <SectionHeading
          eyebrow={copy?.eyebrow || "ম্যানিফেস্টো ২০২৭"}
          title={copy?.title ? <>{copy.title}</> : <>৮টি স্তম্ভ, <span className="text-emerald">৩২টি অঙ্গীকার</span> — সময়সীমা সহ</>}
          description={copy?.description || manifestoIntro.subtitle + "। প্রতিটি অঙ্গীকারের অগ্রগতি উন্মুক্ত ড্যাশবোর্ডে প্রকাশিত হবে।"}
          action={{ href: "/manifesto", label: "পূর্ণ ম্যানিফেস্টো" }}
        />

        <Stagger className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <StaggerItem key={p.id}>
              <Link
                href={`/manifesto#${p.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-forest/8 bg-white p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-forest/15 hover:shadow-lift"
              >
                <div className="flex items-start justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl transition-all duration-300 group-hover:text-white ${accentStyles[p.accent]}`}>
                    <Icon name={p.icon} className="h-5 w-5" />
                  </span>
                  <span className="font-latin text-[0.7rem] font-bold tracking-[0.14em] text-forest/20">{`0${i + 1}`}</span>
                </div>
                <h3 className="mt-4 text-[0.98rem] font-bold leading-snug text-forest">{p.title}</h3>
                <p className="mt-2 line-clamp-2 text-[0.76rem] leading-relaxed text-muted">{p.summary}</p>
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between text-[0.62rem] font-medium text-muted">
                    <span>অগ্রগতি</span>
                    <span className="font-latin font-bold text-forest">{p.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-forest/8">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald to-emerald-bright transition-all duration-700" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
                <ArrowUpRight className="absolute right-4 top-[4.4rem] h-4 w-4 text-forest/0 transition-all duration-300 group-hover:text-forest/40" />
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.15} className="mt-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-forest/10 bg-forest p-5 text-cream sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <CircleDot className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <p className="text-sm font-bold">প্রথম ১০০ দিনের কর্মপরিকল্পনা</p>
                <p className="mt-1 text-[0.78rem] text-cream/60">অগ্রাধিকার প্রকল্প, দায়িত্বপ্রাপ্ত ব্যক্তি ও ব্যয়ের বিবরণসহ প্রকাশিত হবে।</p>
              </div>
            </div>
            <Link href="/manifesto#roadmap" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[0.78rem] font-semibold text-cream transition-colors hover:border-gold hover:text-gold">
              ১০০ দিনের পরিকল্পনা <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
