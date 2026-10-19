import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Newspaper, Quote } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal } from "@/components/ui/reveal";
import { news } from "@/content/news";
import { formatBnDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "সংবাদ ও গণমাধ্যম",
  description: "গণমাধ্যমে প্রকাশিত মহাদান ইউনিয়নের কার্যক্রম, উদ্যোগ ও জনকল্যাণমূলক কাজের সংবাদ।",
  alternates: { canonical: "/news" },
};

export default function NewsPage() {
  const [lead, ...rest] = news;
  return (
    <>
      <PageHero
        eyebrow="প্রেস কভারেজ"
        title={<>গণমাধ্যমে <span className="text-gold">আমরা</span></>}
        description="জাতীয় ও স্থানীয় গণমাধ্যমে প্রকাশিত সংবাদ — কোনো প্রচার নয়, কাজের স্বীকৃতি।"
        crumbs={[{ label: "সংবাদ" }]}
        accent="সংবাদ"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <Newspaper className="h-8 w-8 text-gold" />
          <div>
            <p className="font-latin text-lg font-bold">{news.length}+</p>
            <p className="text-[0.65rem] text-cream/50">গণমাধ্যমে প্রকাশিত</p>
          </div>
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x">
          <Reveal>
            <Link href={`/news/${lead.id}`} className="group grid overflow-hidden rounded-3xl border border-forest/10 bg-white transition-shadow hover:shadow-lift lg:grid-cols-2">
              <SmartImage imageKey={lead.image} alt={lead.title} className="aspect-[16/10] lg:aspect-auto lg:h-full" label={lead.title} sizes="(max-width: 1024px) 100vw, 50vw" imgClassName="group-hover:scale-[1.02]" />
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-forest px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-gold">{lead.outlet}</span>
                  <span className="text-[0.66rem] text-muted">{formatBnDate(lead.date)}</span>
                </div>
                <h2 className="mt-3 text-xl font-bold leading-snug text-forest transition-colors group-hover:text-emerald sm:text-2xl">{lead.title}</h2>
                <p className="mt-2 text-[0.86rem] leading-relaxed text-muted">{lead.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-forest">
                  সংবাদ পড়ুন <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </Reveal>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((n, i) => (
              <Reveal key={n.id} delay={i * 0.06}>
                <Link href={`/news/${n.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-forest/10 bg-white transition-all hover:-translate-y-1 hover:shadow-lift">
                  <SmartImage imageKey={n.image} alt={n.title} className="aspect-[16/10]" label={n.title} sizes="(max-width: 768px) 100vw, 33vw" imgClassName="group-hover:scale-105" />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center gap-2 text-[0.62rem]">
                      <span className="font-bold uppercase tracking-wider text-gold-deep">{n.outlet}</span>
                      <span className="text-muted">· {formatBnDate(n.date)}</span>
                    </div>
                    <h3 className="mt-1.5 text-[0.92rem] font-bold leading-snug text-forest group-hover:text-emerald">{n.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[0.75rem] leading-relaxed text-muted">{n.summary}</p>
                    <span className="mt-auto pt-3 text-[0.7rem] font-semibold text-emerald">বিস্তারিত →</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8">
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-forest p-5 text-cream sm:flex-row">
              <div className="flex items-center gap-3">
                <Quote className="h-6 w-6 text-gold" />
                <p className="text-[0.85rem]">মিডিয়া জিজ্ঞাসা বা সাক্ষাৎকারের জন্য যোগাযোগ করুন</p>
              </div>
              <a href="/contact" className="rounded-full bg-gold px-4 py-2 text-[0.78rem] font-bold text-night">মিডিয়া কিট ও যোগাযোগ</a>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
