import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin, Share2, Users } from "lucide-react";
import { events } from "@/content/events";
import { findCmsEvent } from "@/lib/cms";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { EventRegister } from "@/components/features/event-register";
import { Reveal } from "@/components/ui/reveal";
import { bn } from "@/lib/utils";
import { site } from "@/content/site";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbLd, eventLd, socialImage } from "@/lib/seo";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return events.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = events.find((e) => e.id === id) ?? (await findCmsEvent(id));
  if (!event) return { title: "ইভেন্ট পাওয়া যায়নি" };
  return {
    title: event.title,
    description: event.description,
    alternates: { canonical: `/events/${event.id}` },
    keywords: [event.type, "ইভেন্ট", "মহাদান ইউনিয়ন", event.venue],
    openGraph: {
      type: "article",
      title: event.title,
      description: event.description,
      url: `/events/${event.id}`,
      images: [{ url: socialImage(undefined), width: 1200, height: 630, alt: event.title }],
    },
    twitter: { card: "summary_large_image", title: event.title, description: event.description },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = events.find((e) => e.id === id) ?? (await findCmsEvent(id));
  if (!event) notFound();

  const d = new Date(`${event.date}T00:00:00`);
  const startIso = new Date(`${event.date}T${event.start || "10:00"}:00+06:00`).toISOString();
  const endIso = new Date(`${event.date}T${event.end || event.start || "12:00"}:00+06:00`).toISOString();
  const related = events.filter((e) => e.id !== event.id && e.status === "upcoming").slice(0, 3);
  const pct = Math.round((event.registered / event.capacity) * 100);

  return (
    <>
      <JsonLd
        data={[
          eventLd({
            name: event.title,
            description: event.description,
            start: startIso,
            end: endIso,
            venue: event.venue,
            path: `/events/${event.id}`,
            status: event.status,
          }),
          breadcrumbLd([
            { label: "হোম", href: "/" },
            { label: "ইভেন্ট", href: "/events" },
            { label: event.title },
          ]),
        ]}
      />
      <PageHero
        eyebrow={`${event.type} · ওয়ার্ড ${event.ward}`}
        title={event.title}
        description={event.description}
        crumbs={[{ label: "ইভেন্ট", href: "/events" }, { label: event.type }]}
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-gold text-night">
              <span className="text-center leading-none">
                <span className="block font-display text-xl font-bold">{bn(d.getDate())}</span>
                <span className="mt-1 block text-[0.5rem] uppercase tracking-widest">{d.toLocaleDateString("en-GB", { month: "short" })}</span>
              </span>
            </div>
            <div className="text-[0.76rem] text-cream/70">
              <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gold" />{bn(event.start)} – {bn(event.end)}</p>
              <p className="mt-1 flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-gold" />{d.toLocaleDateString("bn-BD", { weekday: "long" })}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[0.62rem] text-cream/50">
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{bn(event.registered)}/{bn(event.capacity)} রেজিস্টার্ড</span>
              <span className="font-latin">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <Link href="/events" className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-muted transition-colors hover:text-forest">
              <ArrowLeft className="h-3.5 w-3.5" /> সব ইভেন্ট
            </Link>

            <Reveal className="mt-4 rounded-3xl border border-forest/10 bg-white p-5 sm:p-7">
              <h2 className="text-lg font-bold text-forest">ইভেন্ট সম্পর্কে</h2>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{event.description}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-cream-2/60 p-3.5">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">স্থান</p>
                  <p className="mt-1 flex items-start gap-1.5 text-[0.82rem] font-medium text-forest"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />{event.venue}</p>
                </div>
                <div className="rounded-xl bg-cream-2/60 p-3.5">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">সময়</p>
                  <p className="mt-1 flex items-start gap-1.5 text-[0.82rem] font-medium text-forest"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />{bn(event.start)} – {bn(event.end)}</p>
                </div>
              </div>

              {event.highlights && (
                <div className="mt-5">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">বিশেষ আকর্ষণ</p>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-3">
                    {event.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-1.5 rounded-lg border border-forest/8 bg-cream/40 px-2.5 py-2 text-[0.72rem] text-forest/80">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald" />{h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {event.speaker && (
                <p className="mt-5 rounded-xl border border-gold/25 bg-gold/8 px-3.5 py-2.5 text-[0.78rem] text-forest">
                  <strong className="font-bold">বক্তা:</strong> {event.speaker}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=https://mdabutaher.com/events/${event.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 px-3.5 py-2 text-[0.72rem] font-semibold text-forest transition-colors hover:bg-cream">
                  <Share2 className="h-3.5 w-3.5" /> শেয়ার করুন
                </a>
                <a href="/api/calendar/ics" className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 px-3.5 py-2 text-[0.72rem] font-semibold text-forest transition-colors hover:bg-cream">
                  <CalendarDays className="h-3.5 w-3.5" /> ক্যালেন্ডারে যোগ
                </a>
              </div>
            </Reveal>

            <div className="mt-4 rounded-2xl border border-forest/10 bg-cream-2/40 p-4">
              <p className="text-[0.8rem] font-bold text-forest">অন্যান্য আসন্ন ইভেন্ট</p>
              <div className="mt-2 space-y-1.5">
                {related.map((r) => (
                  <Link key={r.id} href={`/events/${r.id}`} className="group flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 transition-colors hover:bg-cream">
                    <span className="min-w-0">
                      <span className="block truncate text-[0.78rem] font-semibold text-forest">{r.title}</span>
                      <span className="text-[0.62rem] text-muted">{new Date(`${r.date}T00:00:00`).toLocaleDateString("bn-BD", { day: "numeric", month: "long" })} · ওয়ার্ড {r.ward}</span>
                    </span>
                    <span className="shrink-0 text-[0.68rem] font-semibold text-emerald opacity-0 transition-opacity group-hover:opacity-100">দেখুন →</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {event.status === "past" ? (
              <div className="rounded-2xl border border-forest/10 bg-white p-5 text-center">
                <p className="text-[0.85rem] font-bold text-forest">এই ইভেন্টটি সম্পন্ন হয়েছে</p>
                <p className="mt-1 text-[0.75rem] text-muted">{bn(event.registered)} জন উপস্থিত ছিলেন</p>
                <Link href="/events" className="mt-3 inline-block rounded-full bg-forest px-4 py-2 text-[0.78rem] font-semibold text-cream">আসন্ন ইভেন্ট দেখুন</Link>
              </div>
            ) : (
              <EventRegister eventId={event.id} registered={event.registered} capacity={event.capacity} />
            )}

            <div className="rounded-2xl border border-forest/10 bg-white p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">দ্রুত যোগাযোগ</p>
              <a href={`tel:${site.phoneHref}`} className="mt-2 flex items-center justify-between rounded-xl bg-cream/60 px-3 py-2 text-[0.78rem] font-semibold text-forest">কল করুন <span className="font-latin text-[0.72rem] text-muted">{site.phone}</span></a>
              <a href="/chat" className="mt-1.5 flex items-center justify-between rounded-xl bg-cream/60 px-3 py-2 text-[0.78rem] font-semibold text-forest">লাইভ চ্যাট <span className="text-[0.68rem] text-muted">২৪/৭ →</span></a>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
