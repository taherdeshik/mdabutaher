import type { GalleryTab } from "@/content/gallery";
import { GalleryTabs } from "./gallery-tabs";
import { PageHero } from "@/components/ui/page-hero";
import { getGallery } from "@/lib/gallery-store";
import { Section } from "@/components/ui/section";

type Props = {
  pageId: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  crumb: string;
  accent: string;
  tab: GalleryTab;
  electionOnly?: boolean;
  stats: { icon: React.ComponentType<{ className?: string }>; value: string; label: string }[];
};

/** Shared shell for the gallery sub-pages (ছবি / পোস্টার / নির্বাচনী পোস্টার). */
export async function GalleryShowcase({ pageId, eyebrow, title, description, crumb, accent, tab, electionOnly, stats }: Props) {
  const gallery = await getGallery();
  return (
    <>
      <PageHero
        pageId={pageId}
        eyebrow={eyebrow}
        title={title}
        description={description}
        crumbs={[{ label: "গ্যালারি", href: "/gallery" }, { label: crumb }]}
        accent={accent}
      >
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          {stats.map((s) => (
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
          <GalleryTabs
            initialTab={tab}
            electionOnly={electionOnly}
            photos={gallery.photos}
            posters={gallery.posters}
            videos={gallery.videos}
          />
        </div>
      </Section>
    </>
  );
}
