import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Download, FileText, Image as ImageIcon, Mail, Palette, Phone } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { site } from "@/content/site";
import { mediaKitBio } from "@/content/media-kit";

export const metadata: Metadata = {
  title: "মিডিয়া কিট — লোগো, ছবি, জীবনী ও তথ্য",
  description: "সাংবাদিক ও সংগঠকদের জন্য মোঃ আবু তাহেরের অফিসিয়াল মিডিয়া কিট: জীবনের সংক্ষিপ্ত ও পূর্ণ বিবরণ, প্রেস ছবি, ব্র্যান্ড রঙ ও যোগাযোগ।",
  alternates: { canonical: "/media-kit" },
};

const palette = [
  { name: "Forest", hex: "#0F3D2E", use: "মূল রঙ, হেডার" },
  { name: "Night", hex: "#05130F", use: "গাঢ় পটভূমি" },
  { name: "Gold", hex: "#E7B75F", use: "অ্যাকসেন্ট, অঙ্গীকার" },
  { name: "Cream", hex: "#F8F4EA", use: "পটভূমি" },
];

const factSheet = [
  ["পূর্ণ নাম", site.name],
  ["ইংরেজি", site.nameEn],
  ["পদ", `${site.role}, ${site.ward}`],
  ["এলাকা", `${site.union}, ${site.upazila}, ${site.district}`],
  ["নির্বাচন", `ইউপি নির্বাচন ${site.electionYear} (নির্দলীয়)`],
  ["স্লোগান", site.slogan],
];

export default function MediaKitPage() {
  return (
    <>
      <PageHero
        eyebrow="প্রেস ও মিডিয়া"
        title={<>মিডিয়া <span className="text-gold">কিট</span></>}
        description="সাংবাদিক, ফটোগ্রাফার ও সংগঠকদের জন্য প্রয়োজনীয় সব উপকরণ এক জায়গায় — প্রেস ছবি, জীবনী, ব্র্যান্ড রঙ ও সরাসরি যোগাযোগ।"
        crumbs={[{ label: "মিডিয়া কিট" }]}
        accent="প্রেস"
      >
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          {[["৮", "প্রেস ছবি"], ["৪", "ব্র্যান্ড রঙ"], ["২", "ভাষায় জীবনী"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="font-latin text-base font-bold text-gold">{v}</p>
              <p className="text-[0.55rem] text-cream/45">{l}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <SectionHeading eyebrow="জীবনী" title={<>প্রেসের জন্য <span className="text-emerald">প্রস্তুত বিবরণ</span></>} description="যেকোনো প্রতিবেদনে হুবহু ব্যবহার করা যাবে — সম্পাদনার প্রয়োজন নেই।" />

            <div className="mt-6 space-y-4">
              {[
                { label: "সংক্ষিপ্ত (৪০ শব্দ)", text: mediaKitBio.short },
                { label: "পূর্ণ (১২০ শব্দ)", text: mediaKitBio.long },
              ].map((b) => (
                <Reveal key={b.label}>
                  <div className="rounded-2xl border border-forest/10 bg-white p-5">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-emerald">{b.label}</p>
                    <p className="mt-2 text-[0.86rem] leading-relaxed text-muted">{b.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-[1.05rem] font-bold text-forest">এক নজরে</h3>
              <dl className="mt-3 divide-y divide-forest/8 overflow-hidden rounded-2xl border border-forest/10 bg-white">
                {factSheet.map(([k, v]) => (
                  <div key={k} className="flex flex-wrap items-baseline gap-x-4 px-4 py-2.5">
                    <dt className="w-28 shrink-0 text-[0.68rem] font-semibold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="text-[0.82rem] font-medium text-forest">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-8">
              <h3 className="flex items-center gap-2 text-[1.05rem] font-bold text-forest"><Palette className="h-4 w-4 text-emerald" /> ব্র্যান্ড রঙ</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {palette.map((c) => (
                  <div key={c.hex} className="flex items-center gap-3 rounded-xl border border-forest/10 bg-white p-2.5">
                    <span className="h-10 w-10 shrink-0 rounded-lg border border-black/5" style={{ background: c.hex }} />
                    <div>
                      <p className="text-[0.78rem] font-bold text-forest">{c.name}</p>
                      <p className="font-latin text-[0.62rem] text-muted">{c.hex} · {c.use}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-forest/10 bg-white p-5">
              <h3 className="flex items-center gap-2 text-[0.95rem] font-bold text-forest"><ImageIcon className="h-4 w-4 text-emerald" /> প্রেস ছবি</h3>
              <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">উচ্চ রেজোলিউশনের ছবি — ক্রেডিট: “ছবি: মোঃ আবু তাহেরের প্রচারণা দল”।</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["hero", "portrait", "water", "community"].map((k) => (
                  <div key={k} className="overflow-hidden rounded-xl border border-forest/8">
                    <SmartImage imageKey={k} alt={`প্রেস ছবি — ${k}`} className="aspect-[4/3]" label="প্রেস ছবি" sizes="(max-width: 768px) 50vw, 20vw" />
                  </div>
                ))}
              </div>
              <a href="#photos" className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[0.72rem] font-bold text-cream transition-colors hover:bg-forest-2">
                <Download className="h-3.5 w-3.5" /> সব ছবি গ্যালারিতে
              </a>
            </div>

            <div className="rounded-2xl border border-forest/10 bg-white p-5">
              <h3 className="flex items-center gap-2 text-[0.95rem] font-bold text-forest"><FileText className="h-4 w-4 text-emerald" /> নথি</h3>
              <div className="mt-3 space-y-2">
                <Link href="/manifesto/print" className="flex items-center justify-between rounded-xl bg-cream px-3 py-2.5 text-[0.76rem] font-semibold text-forest transition-colors hover:bg-gold/25">
                  ম্যানিফেস্টো (প্রিন্ট/PDF) <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/manifesto" className="flex items-center justify-between rounded-xl bg-cream px-3 py-2.5 text-[0.76rem] font-semibold text-forest transition-colors hover:bg-gold/25">
                  ৮ স্তম্ভ · ৩২ অঙ্গীকার <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/about" className="flex items-center justify-between rounded-xl bg-cream px-3 py-2.5 text-[0.76rem] font-semibold text-forest transition-colors hover:bg-gold/25">
                  পূর্ণ জীবনী ও দক্ষতা <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-forest p-5 text-cream">
              <h3 className="text-[0.95rem] font-bold text-gold">প্রেস যোগাযোগ</h3>
              <p className="mt-1 text-[0.72rem] leading-relaxed text-cream/60">সাক্ষাৎকার, তথ্য যাচাই বা ছবির অনুরোধে সরাসরি যোগাযোগ করুন।</p>
              <a href={`tel:${site.phoneHref}`} className="mt-3 flex items-center gap-2 text-[0.8rem] font-semibold"><Phone className="h-3.5 w-3.5 text-gold" /> {site.phone}</a>
              <a href={`mailto:${site.email}`} className="mt-1.5 flex items-center gap-2 text-[0.8rem] font-semibold"><Mail className="h-3.5 w-3.5 text-gold" /> {site.email}</a>
              <p className="mt-3 border-t border-white/10 pt-3 text-[0.68rem] text-cream/45">
                {site.officeHours} · {site.office}
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="dark" id="photos" className="py-12">
        <div className="container-x">
          <SectionHeading dark align="center" eyebrow="ডাউনলোডযোগ্য আর্কাইভ" title={<>প্রচারণার <span className="text-gold">বাস্তব ছবি</span></>} description="সব ছবি মূল সাইট থেকে সংরক্ষিত — ওয়েব মানের WebP ফরম্যাটে।" />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {["road", "water", "relief", "medical", "books", "winter", "trees", "youth"].map((k) => (
              <div key={k} className="overflow-hidden rounded-2xl border border-white/10">
                <SmartImage imageKey={k} alt={`প্রচারণার ছবি — ${k}`} className="aspect-[4/3]" label="প্রচারণার ছবি" sizes="(max-width: 640px) 50vw, 25vw" />
              </div>
            ))}
          </div>
          <div className="mt-7 text-center">
            <Link href="/gallery" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[0.8rem] font-bold text-night transition-transform hover:scale-[1.02]">
              পূর্ণ গ্যালারি দেখুন <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
