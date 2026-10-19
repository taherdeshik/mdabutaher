import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, Newspaper } from "lucide-react";
import { news } from "@/content/news";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { SmartImage } from "@/components/ui/smart-image";
import { formatBnDate } from "@/lib/utils";

export function generateStaticParams() { return news.map((n) => ({ id: n.id })); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const n = news.find((x) => x.id === id);
  if (!n) return { title: "সংবাদ পাওয়া যায়নি" };
  return { title: n.title, description: n.summary, alternates: { canonical: `/news/${n.id}` } };
}

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = news.find((x) => x.id === id);
  if (!n) notFound();
  const more = news.filter((x) => x.id !== n.id).slice(0, 3);

  return (
    <>
      <PageHero eyebrow={n.outlet} title={n.title} description={n.summary} crumbs={[{ label: "সংবাদ", href: "/news" }, { label: n.outlet }]} />
      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <article>
            <Link href="/news" className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-muted hover:text-forest"><ArrowLeft className="h-3.5 w-3.5" /> সব সংবাদ</Link>
            <div className="mt-4 overflow-hidden rounded-3xl border border-forest/10">
              <SmartImage imageKey={n.image} alt={n.title} className="aspect-[16/9]" label={n.title} sizes="(max-width: 1024px) 100vw, 65vw" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.72rem] text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-gold">{n.outlet}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-emerald" />{formatBnDate(n.date)}</span>
            </div>
            <div className="mt-5 space-y-4">
              {n.body.map((p, i) => <p key={i} className="text-[0.94rem] leading-[1.85] text-ink/80">{p}</p>)}
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-forest/10 bg-cream-2/50 px-3.5 py-2.5 text-[0.72rem] text-muted">
              <Newspaper className="h-3.5 w-3.5 text-emerald" />
              সূত্র: {n.outlet} · সম্পূর্ণ প্রতিবেদনটি মূল প্রকাশনা থেকে দেখা যেতে পারে
              <ExternalLink className="h-3 w-3" />
            </div>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-forest/10 bg-white p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">আরও সংবাদ</p>
              <div className="mt-2 space-y-2">
                {more.map((m) => (
                  <Link key={m.id} href={`/news/${m.id}`} className="group block rounded-lg p-2 transition-colors hover:bg-cream">
                    <p className="text-[0.6rem] font-bold uppercase tracking-wider text-gold-deep">{m.outlet}</p>
                    <p className="mt-0.5 text-[0.78rem] font-semibold leading-snug text-forest group-hover:text-emerald">{m.title}</p>
                    <p className="text-[0.6rem] text-muted">{formatBnDate(m.date)}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
