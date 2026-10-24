import type { HomeSectionCopy } from "@/content/home-sections";
import Link from "next/link";
import { ArrowUpRight, Clock, Eye } from "lucide-react";
import { posts } from "@/content/blog";
import { Section, SectionHeading, Badge } from "@/components/ui/section";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal } from "@/components/ui/reveal";
import { bn, formatBnDate } from "@/lib/utils";

export function BlogPreview({ copy }: { copy?: HomeSectionCopy }) {
  const latest = posts.slice(0, 3);
  return (
    <Section tone="light" id="blog">
      <div className="container-x">
        <SectionHeading
          eyebrow={copy?.eyebrow || "ব্লগ ও ভাবনা"}
          title={copy?.title ? <>{copy.title}</> : <>সমস্যার কথা নয়, <span className="text-emerald">সমাধানের</span> কথা</>}
          description={copy?.description || "নীতি, উন্নয়ন ও মাঠের অভিজ্ঞতা নিয়ে লিখিত বিশ্লেষণ — প্রতিটি পোস্টে বাস্তব তথ্য ও পরিকল্পনা।"}
          action={{ href: "/blog", label: "সব লেখা" }}
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {latest.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-forest/8 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                <div className="relative overflow-hidden">
                  <SmartImage imageKey={p.image} alt={p.title} className="aspect-[16/10]" label={p.title} sizes="(max-width: 768px) 100vw, 33vw" imgClassName="group-hover:scale-105" />
                  <Badge tone="light" className="absolute left-3 top-3 bg-white/90 backdrop-blur">{p.category}</Badge>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="flex items-center gap-2 text-[0.64rem] text-muted">
                    {formatBnDate(p.date, { day: "numeric", month: "short" })} · <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{bn(p.readTime)} মিনিট</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{bn(p.views.toLocaleString("en-US"))}</span>
                  </p>
                  <h3 className="mt-1.5 text-[1rem] font-bold leading-snug text-forest transition-colors group-hover:text-emerald">{p.title}</h3>
                  <p className="mt-2 line-clamp-2 text-[0.76rem] leading-relaxed text-muted">{p.excerpt}</p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="text-[0.66rem] font-semibold text-forest/70">{p.author.name}</span>
                    <ArrowUpRight className="h-4 w-4 text-forest/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
