import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { activities } from "@/content/activities";
import { Section, SectionHeading, Badge } from "@/components/ui/section";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal } from "@/components/ui/reveal";
import { bn, formatBnDate } from "@/lib/utils";

export function ActivitiesPreview() {
  const featured = activities.filter((a) => a.featured).slice(0, 3);
  return (
    <Section tone="sand" id="activities">
      <div className="container-x">
        <SectionHeading
          eyebrow="সাম্প্রতিক কার্যক্রম"
          title={<>কথা নয়, <span className="text-emerald">কাজ</span> — মাঠের প্রমাণ</>}
          description="শিক্ষা, পানি, স্বাস্থ্য ও দুর্যোগে মানুষের পাশে দাঁড়ানোর নির্বাচিত কিছু মুহূর্ত।"
          action={{ href: "/activities", label: "সব কার্যক্রম" }}
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {featured.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.08}>
              <Link href={`/activities/${a.id}`} className="group block overflow-hidden rounded-3xl border border-forest/8 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                <div className="relative overflow-hidden">
                  <SmartImage imageKey={a.image} alt={a.title} className="aspect-[4/3]" label={a.title} sizes="(max-width: 768px) 100vw, 33vw" imgClassName="group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night/70 to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <Badge tone="gold" className="bg-night/70 text-gold backdrop-blur">{a.category}</Badge>
                  </div>
                  <p className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[0.66rem] text-cream/80"><MapPin className="h-3 w-3" />{a.location}</p>
                </div>
                <div className="p-4">
                  <p className="text-[0.65rem] text-muted">{formatBnDate(a.date)}</p>
                  <h3 className="mt-1 text-[0.98rem] font-bold leading-snug text-forest transition-colors group-hover:text-emerald">{a.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[0.76rem] leading-relaxed text-muted">{a.summary}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-forest/8 pt-3">
                    <div className="flex gap-3">
                      {a.impact.slice(0, 2).map((m) => (
                        <span key={m.label} className="text-[0.62rem] text-muted">
                          <strong className="font-latin font-bold text-forest">{m.value}</strong> {m.label}
                        </span>
                      ))}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-forest/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-5">
          <div className="grid gap-2 rounded-2xl border border-forest/10 bg-white/60 p-3 sm:grid-cols-3">
            {[
              { label: "সম্পন্ন কার্যক্রম", value: "১৮৬+" },
              { label: "উপকৃত পরিবার", value: "১২,৫০০+" },
              { label: "স্বেচ্ছাসেবক", value: "১২০+" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-cream">
                <span className="text-[0.72rem] text-muted">{s.label}</span>
                <span className="font-latin text-sm font-bold text-forest">{s.value}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
