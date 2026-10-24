import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, Film, Maximize2, Vote } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { GalleryTabs } from "@/components/features/gallery-tabs";

export const metadata: Metadata = {
  title: "গ্যালারি — ছবি, পোস্টার ও ভিডিও",
  description: "মহাদান ইউনিয়নের কার্যক্রম, প্রচারণা, পোস্টার ও ভিডিওর ভিজ্যুয়াল আর্কাইভ।",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="ভিজ্যুয়াল আর্কাইভ"
        title={<>স্মৃতির ফ্রেমে{" "}<span className="ml-1.5 inline-block text-gold">আমরা</span></>}
        description="মাঠের মুহূর্ত, প্রচারণার পোস্টার ও ভিডিও — সব এক জায়গায়। ছবিতে ক্লিক করে বড় করে দেখুন।"
        crumbs={[{ label: "গ্যালারি" }]}
        accent="ফ্রেম"
      >
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          {[
            { icon: Camera, value: "৩১", label: "ছবি" },
            { icon: Maximize2, value: "৪", label: "পোস্টার" },
            { icon: Film, value: "৫", label: "ভিডিও" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto h-4 w-4 text-gold" />
              <p className="mt-1 font-latin text-base font-bold">{s.value}</p>
              <p className="text-[0.55rem] text-cream/45">{s.label}</p>
            </div>
          ))}
        </div>
      </PageHero>
      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x">
          <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/gallery/photos", label: "ফটো গ্যালারী", desc: "মাঠের মুহূর্ত", icon: Camera },
              { href: "/gallery/posters", label: "পোস্টার গ্যালারী", desc: "প্রচারণার ডিজাইন", icon: Maximize2 },
              { href: "/gallery/election-posters", label: "নির্বাচনী পোস্টার", desc: "চশমা প্রতীক", icon: Vote },
              { href: "/video-gallery", label: "ভিডিও গ্যালারি", desc: "প্রচারণা ও ইশতেহার", icon: Film },
            ].map(({ href, label, desc, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-forest/10 bg-white px-4 py-3 transition-colors hover:border-forest/30 hover:bg-cream"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest/5 text-forest transition-colors group-hover:bg-forest group-hover:text-gold">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8rem] font-bold text-forest">{label}</span>
                  <span className="block text-[0.66rem] text-muted">{desc}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest" />
              </Link>
            ))}
          </div>
          <GalleryTabs />
        </div>
      </Section>
    </>
  );
}
