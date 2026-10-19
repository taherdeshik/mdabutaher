import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Share2 } from "lucide-react";
import { activities } from "@/content/activities";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal } from "@/components/ui/reveal";
import { formatBnDate } from "@/lib/utils";
import { JsonLd } from "@/components/seo/json-ld";
import { articleLd, breadcrumbLd, socialImage } from "@/lib/seo";

export function generateStaticParams() {
  return activities.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = activities.find((x) => x.id === id);
  if (!a) return { title: "কার্যক্রম পাওয়া যায়নি" };
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: `/activities/${a.id}` },
    keywords: [a.category, "কার্যক্রম", "মহাদান ইউনিয়ন", "মোঃ আবু তাহের"],
    openGraph: {
      type: "article",
      title: a.title,
      description: a.summary,
      url: `/activities/${a.id}`,
      publishedTime: a.date,
      images: [{ url: socialImage(a.image), width: 1200, height: 630, alt: a.title }],
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.summary, images: [socialImage(a.image)] },
  };
}

export default async function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = activities.find((x) => x.id === id);
  if (!a) notFound();
  const related = activities.filter((x) => x.id !== a.id).slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          articleLd({
            type: "Article",
            title: a.title,
            description: a.summary,
            path: `/activities/${a.id}`,
            image: a.image,
            published: a.date,
            section: a.category,
            body: a.body?.join(" ") || a.summary,
          }),
          breadcrumbLd([
            { label: "হোম", href: "/" },
            { label: "কার্যক্রম", href: "/activities" },
            { label: a.category },
          ]),
        ]}
      />
      <PageHero
        eyebrow={`${a.category} · ওয়ার্ড ${a.ward}`}
        title={a.title}
        description={a.summary}
        crumbs={[{ label: "কার্যক্রম", href: "/activities" }, { label: a.category }]}
      >
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          {a.impact.map((m) => (
            <div key={m.label} className="text-center">
              <p className="font-latin text-sm font-bold text-gold">{m.value}</p>
              <p className="text-[0.55rem] leading-tight text-cream/45">{m.label}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x grid gap-8 lg:grid-cols-[1.45fr_0.55fr]">
          <article>
            <Link href="/activities" className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-muted hover:text-forest">
              <ArrowLeft className="h-3.5 w-3.5" /> সব কার্যক্রম
            </Link>

            <Reveal className="mt-4 overflow-hidden rounded-3xl border border-forest/10">
              <SmartImage imageKey={a.image} alt={a.title} className="aspect-[16/9]" label={a.title} priority sizes="(max-width: 1024px) 100vw, 65vw" />
            </Reveal>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.75rem] text-muted">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-emerald" />{formatBnDate(a.date, { weekday: "long" })}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald" />{a.location} · ওয়ার্ড {a.ward}</span>
            </div>

            <div className="mt-5 space-y-4">
              {a.body.map((p, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <p className="text-[0.94rem] leading-[1.85] text-ink/80">{p}</p>
                </Reveal>
              ))}
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {a.impact.map((m) => (
                <div key={m.label} className="rounded-2xl border border-forest/10 bg-white p-3.5 text-center">
                  <p className="font-display text-xl font-bold text-forest">{m.value}</p>
                  <p className="text-[0.66rem] text-muted">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-forest/8 pt-5">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=https://mdabutaher.com/activities/${a.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 px-4 py-2 text-[0.75rem] font-semibold text-forest hover:bg-cream">
                <Share2 className="h-3.5 w-3.5" /> শেয়ার করুন
              </a>
              <Link href="/feedback" className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[0.75rem] font-semibold text-cream">
                এই ধরনের কাজ আমার এলাকায় দরকার
              </Link>
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-forest/10 bg-white p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">এই বিভাগে আরও</p>
              <div className="mt-2 space-y-1.5">
                {related.map((r) => (
                  <Link key={r.id} href={`/activities/${r.id}`} className="group flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-cream">
                    <SmartImage imageKey={r.image} alt={r.title} className="h-12 w-16 shrink-0 rounded-lg" label={r.title} sizes="64px" />
                    <span className="min-w-0">
                      <span className="block truncate text-[0.76rem] font-semibold text-forest group-hover:text-emerald">{r.title}</span>
                      <span className="text-[0.6rem] text-muted">{formatBnDate(r.date)}</span>
                    </span>
                  </Link>
                ))}
              </div>
              <Link href="/activities" className="mt-3 flex items-center justify-between rounded-xl bg-cream-2/60 px-3 py-2 text-[0.74rem] font-semibold text-forest">
                সব দেখুন <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl bg-forest p-4 text-cream">
              <p className="text-[0.78rem] font-bold">আপনিও অংশ নিতে পারেন</p>
              <p className="mt-1 text-[0.7rem] leading-relaxed text-cream/60">স্বেচ্ছাসেবক হিসেবে যোগ দিন অথবা আপনার এলাকার প্রয়োজন জানান।</p>
              <Link href="/campaign#volunteer" className="mt-3 block rounded-lg bg-gold px-3 py-2 text-center text-[0.74rem] font-bold text-night">স্বেচ্ছাসেবক হোন</Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
