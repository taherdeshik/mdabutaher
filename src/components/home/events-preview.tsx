import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { events } from "@/content/events";
import { Section, SectionHeading, Badge } from "@/components/ui/section";
import { formatBnDate, bn, withBasePath } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

export function EventsPreview() {
  const upcoming = events.filter((e) => e.status === "upcoming").slice(0, 4);
  return (
    <Section tone="light" id="events">
      <div className="container-x">
        <SectionHeading
          eyebrow="আসন্ন ইভেন্ট"
          title={<>আপনার এলাকায় <span className="text-emerald">আমরা</span> — সরাসরি</>}
          description="জনসভা, উঠান বৈঠক, স্বাস্থ্য ক্যাম্প ও স্বেচ্ছাসেবক কর্মশালা। ইভেন্টে যোগ দিতে অনলাইনে রেজিস্ট্রেশন করুন।"
          action={{ href: "/events", label: "সব ইভেন্ট" }}
        />

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map((e, i) => {
            const d = new Date(`${e.date}T00:00:00`);
            const pct = Math.round((e.registered / e.capacity) * 100);
            return (
              <Reveal key={e.id} delay={i * 0.07}>
                <Link href={`/events/${e.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-forest/8 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                  <div className="flex items-start justify-between border-b border-dashed border-forest/10 bg-cream/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-forest text-cream">
                        <span className="text-center leading-none">
                          <span className="block font-display text-xl font-bold">{bn(d.getDate())}</span>
                          <span className="mt-1 block text-[0.55rem] uppercase tracking-widest text-cream/60">
                            {d.toLocaleDateString("en-GB", { month: "short" })}
                          </span>
                        </span>
                      </div>
                      <div>
                        <Badge tone="gold" className="mb-1.5">{e.type}</Badge>
                        <p className="flex items-center gap-1 text-[0.66rem] text-muted"><MapPin className="h-3 w-3" />ওয়ার্ড {e.ward} · {e.venue.split("+")[0].slice(0, 26)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-[0.92rem] font-bold leading-snug text-forest transition-colors group-hover:text-emerald">{e.title}</h3>
                    <p className="mt-2 line-clamp-2 text-[0.75rem] leading-relaxed text-muted">{e.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.68rem] text-muted">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{bn(e.start)} – {bn(e.end)}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{bn(e.registered)}/{bn(e.capacity)}</span>
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="h-1 overflow-hidden rounded-full bg-forest/8">
                        <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-deep" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[0.62rem] text-muted">{pct >= 95 ? "আসন প্রায় পূর্ণ" : `${bn(100 - pct)}% আসন বাকি`}</span>
                        <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-forest">
                          রেজিস্ট্রেশন <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-6">
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-forest/10 bg-cream-2/60 p-4 sm:flex-row">
            <p className="flex items-center gap-2 text-[0.8rem] text-muted">
              <CalendarDays className="h-4 w-4 text-emerald" />
              সব ইভেন্ট একসাথে আপনার ফোনের ক্যালেন্ডারে যোগ করুন
            </p>
            <a href={withBasePath("/api/calendar/ics")} className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white px-4 py-2 text-[0.75rem] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream">
              ক্যালেন্ডারে যোগ করুন (ICS) <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
