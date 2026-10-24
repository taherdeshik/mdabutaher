import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Film, Megaphone, Radio } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { VideoGallery } from "@/components/features/video-gallery";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbLd } from "@/lib/seo";
import { campaignVideos, embedUrl, thumbnailUrl, watchUrl } from "@/content/videos";
import { getGallery } from "@/lib/gallery-store";
import { site } from "@/content/site";
import { bn } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "ভিডিও গ্যালারি",
  description:
    "মহাদান ইউনিয়নের নির্বাচনী প্রচারণার ভিডিও — ভিডিও বার্তা, ইশতেহার, সাংবাদিক সম্মেলন ও গণমাধ্যমে প্রচারিত প্রতিবেদন।",
  alternates: { canonical: "/video-gallery" },
  openGraph: {
    title: "ভিডিও গ্যালারি — মোঃ আবু তাহের",
    description: "নির্বাচনী প্রচারণা, ইশতেহার ও সাংবাদিক সম্মেলনের ভিডিও সংকলন।",
    url: "/video-gallery",
    type: "video.other",
  },
  twitter: {
    card: "summary_large_image",
    title: "ভিডিও গ্যালারি — মোঃ আবু তাহের",
    description: "নির্বাচনী প্রচারণা, ইশতেহার ও সাংবাদিক সম্মেলনের ভিডিও সংকলন।",
  },
};

const youtube = site.socials.find((s) => s.label === "YouTube");

export default async function VideoGalleryPage() {
  const videos = (await getGallery()).videos;
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([{ label: "হোম", href: "/" }, { label: "ভিডিও গ্যালারি" }]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "ভিডিও গ্যালারি — মোঃ আবু তাহের",
            numberOfItems: videos.length,
            itemListElement: videos.map((v, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "VideoObject",
                name: v.title,
                description: v.note || v.title,
                thumbnailUrl: [thumbnailUrl(v.id)],
                embedUrl: embedUrl(v.id).replace("&autoplay=1", ""),
                contentUrl: watchUrl(v.id),
                inLanguage: "bn",
                publisher: { "@type": "Person", name: site.name },
              },
            })),
          },
        ]}
      />

      <PageHero pageId="video-gallery"
        eyebrow="ভিডিও গ্যালারি"
        title={
          <>
            কথা নয়,{" "}
            <span className="ml-1.5 inline-block text-gold">কাজের ভিডিও</span>
          </>
        }
        description="প্রচারণার মাঠ, নির্বাচনী ইশতেহার ও সাংবাদিক সম্মেলনের ভিডিও — সব এক জায়গায়। যেকোনো ভিডিওতে ক্লিক করলেই চলবে।"
        crumbs={[{ label: "গ্যালারি", href: "/gallery" }, { label: "ভিডিও গ্যালারি" }]}
        accent="ভিডিও"
      >
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          {[
            { icon: Film, value: bn(videos.length), label: "ভিডিও" },
            {
              icon: Megaphone,
              value: bn(videos.filter((v) => v.category === "প্রচারণা").length),
              label: "প্রচারণা",
            },
            { icon: Radio, value: "YouTube", label: "চ্যানেল" },
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
          <VideoGallery videos={videos as unknown as typeof campaignVideos} />

          {/* Cross-links + channel */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-forest/10 bg-white p-5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">আরও দেখুন</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/gallery/photos"
                  className="rounded-full border border-forest/15 px-3.5 py-1.5 text-[0.72rem] font-semibold text-forest transition-colors hover:bg-cream"
                >
                  ফটো গ্যালারী
                </Link>
                <Link
                  href="/gallery/posters"
                  className="rounded-full border border-forest/15 px-3.5 py-1.5 text-[0.72rem] font-semibold text-forest transition-colors hover:bg-cream"
                >
                  পোস্টার গ্যালারী
                </Link>
                <Link
                  href="/gallery/election-posters"
                  className="rounded-full border border-forest/15 px-3.5 py-1.5 text-[0.72rem] font-semibold text-forest transition-colors hover:bg-cream"
                >
                  নির্বাচনী পোস্টার
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-forest p-5 text-cream">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold/80">YouTube চ্যানেল</p>
                <p className="mt-1 text-sm font-semibold">নতুন ভিডিও পেতে সাবস্ক্রাইব করুন</p>
              </div>
              {youtube ? (
                <a
                  href={youtube.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-[0.74rem] font-bold text-night transition-colors hover:bg-gold/90"
                >
                  দেখুন <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
