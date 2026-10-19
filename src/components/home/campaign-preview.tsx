import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, MapPinned } from "lucide-react";
import { campaignOverview, phases, zones } from "@/content/campaign";
import { Section, SectionHeading, Badge } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { bn } from "@/lib/utils";

export function CampaignPreview() {
  const totalHouseholds = zones.reduce((s, z) => s + z.households, 0);
  const active = phases.find((p) => p.status === "active");
  return (
    <Section tone="dark" id="campaign" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "30px 30px" }} />
      <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-emerald/20 blur-[100px]" />
      <div className="container-x relative">
        <SectionHeading
          dark
          eyebrow="প্রচারণা ২০২৭"
          title={<>২১ সপ্তাহ, ৯টি ওয়ার্ড — <span className="text-gold">একটি পরিকল্পিত পথচলা</span></>}
          description={campaignOverview.goal}
          action={{ href: "/campaign", label: "পূর্ণ পরিকল্পনা" }}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="relative">
            <div className="absolute left-[1.15rem] top-3 h-[calc(100%-1.5rem)] w-px bg-white/12 sm:left-[1.4rem]" />
            {phases.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08} className="relative pb-6 last:pb-0">
                <div className="flex gap-4">
                  <span
                    className={`relative z-10 mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border sm:h-11 sm:w-11 ${
                      p.status === "completed"
                        ? "border-emerald/40 bg-emerald text-night"
                        : p.status === "active"
                          ? "border-gold bg-gold text-night"
                          : "border-white/20 bg-night text-cream/40"
                    }`}
                  >
                    {p.status === "completed" ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{bn(i + 1)}</span>}
                  </span>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[0.95rem] font-bold text-cream">{p.name}</p>
                      <Badge tone={p.status === "completed" ? "emerald" : p.status === "active" ? "gold" : "light"} className="border-transparent">
                        {p.status === "completed" ? "সম্পন্ন" : p.status === "active" ? "চলমান" : "আসছে"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[0.7rem] text-cream/40">{p.window}</p>
                    <p className="mt-2 text-[0.8rem] leading-relaxed text-cream/60">{p.objective}</p>
                    {p.status === "active" && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[0.65rem] text-cream/45">
                          <span>অগ্রগতি</span><span className="font-latin font-bold text-gold">{p.progress}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold/60" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="space-y-4">
            <Reveal>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-cream">ওয়ার্ড কভারেজ</p>
                  <MapPinned className="h-4 w-4 text-gold" />
                </div>
                <p className="mt-1 text-[0.7rem] text-cream/40">মোট {bn(totalHouseholds.toLocaleString("en-US"))} পরিবার</p>
                <div className="mt-4 space-y-2.5">
                  {zones.slice(0, 5).map((z) => (
                    <div key={z.ward} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-[0.68rem] text-cream/50">{z.name.slice(0, 8)}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-emerald-bright/80" style={{ width: `${z.coverage}%` }} />
                      </div>
                      <span className="w-8 text-right font-latin text-[0.62rem] text-cream/45">{z.coverage}%</span>
                    </div>
                  ))}
                </div>
                <Link href="/campaign#zones" className="mt-4 inline-flex items-center gap-1 text-[0.72rem] font-semibold text-gold transition-colors hover:text-cream">
                  ৯টি ওয়ার্ড দেখুন <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>

            {active && (
              <Reveal delay={0.1}>
                <div className="rounded-2xl bg-gold p-5 text-night">
                  <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-night/60">এখন চলছে</p>
                  <p className="mt-1.5 font-display text-lg font-bold leading-snug">{active.name}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {active.kpi.map((k) => (
                      <div key={k.label}>
                        <p className="font-latin text-sm font-extrabold">{k.value}</p>
                        <p className="text-[0.6rem] text-night/60">{k.label}</p>
                      </div>
                    ))}
                  </div>
                  <Link href="/campaign" className="group mt-4 flex items-center justify-between rounded-xl bg-night/10 px-3 py-2 text-[0.75rem] font-bold transition-colors hover:bg-night/15">
                    বিস্তারিত দেখুন
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
