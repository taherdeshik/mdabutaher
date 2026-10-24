import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Reveal } from "./reveal";
import { SmartImage } from "./smart-image";
import { CmsVideo } from "./cms-video";
import { getPageContent } from "@/lib/site-content";
import { contentParagraphs, extractVideoId } from "@/content/site-pages";

/**
 * Page header used by every inner page.
 *
 * Pass `pageId` and the header also honours whatever the admin saved in
 * "সাইট কনটেন্ট": eyebrow, title, description, extra paragraphs, an image and
 * a video. Empty fields fall back to the values coded here, so the site keeps
 * looking the same until something is actually edited.
 */
export async function PageHero({
  pageId,
  eyebrow,
  title,
  description,
  crumbs,
  children,
  accent,
}: {
  pageId?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  crumbs?: { label: string; href?: string }[];
  children?: ReactNode;
  accent?: string;
}) {
  const cms = pageId ? await getPageContent(pageId) : null;
  if (cms && cms.visible === false) notFound();

  const finalEyebrow = cms?.eyebrow.trim() || eyebrow;
  const finalTitle: ReactNode = cms?.title.trim() ? cms.title : title;
  const finalDescription = cms?.description.trim() || description;
  const paragraphs = cms?.body ? contentParagraphs(cms.body) : [];
  const image = cms?.image.trim() ?? "";
  const videoId = cms?.video ? extractVideoId(cms.video) : "";
  const showMedia = Boolean(videoId || image);

  return (
    <div className="relative overflow-hidden mesh-dark text-cream">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "26px 26px" }} />
      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-emerald/20 blur-3xl" />
      <div className="container-x relative py-12 sm:py-16 lg:py-20">
        {crumbs && (
          <nav aria-label="ব্রেডক্রাম্ব" className="mb-6 flex items-center gap-1.5 text-[0.72rem] text-cream/45">
            <Link href="/" className="transition-colors hover:text-gold">হোম</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                {c.href ? <Link href={c.href} className="transition-colors hover:text-gold">{c.label}</Link> : <span className="text-cream/80">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <div className="grid items-end gap-8 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            {finalEyebrow && <p className="eyebrow mb-3 text-gold/90"><span className="inline-block h-px w-7 bg-gold/60" />{finalEyebrow}</p>}
            <h1 className="text-balance-tight text-3xl font-bold leading-[1.12] sm:text-4xl lg:text-[3.25rem]">{finalTitle}</h1>
            {finalDescription && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/60 sm:text-base">{finalDescription}</p>}
            {paragraphs.length > 0 && (
              <div className="mt-4 max-w-2xl space-y-2.5 text-[0.86rem] leading-relaxed text-cream/55">
                {paragraphs.map((text) => (
                  <p key={text.slice(0, 48)}>{text}</p>
                ))}
              </div>
            )}
          </Reveal>
          {(children || showMedia) && (
            <Reveal delay={0.12} className="space-y-3">
              {videoId ? (
                <CmsVideo id={videoId} title={finalEyebrow || "ভিডিও"} poster={image || undefined} />
              ) : (
                image && (
                  <div className="overflow-hidden rounded-2xl border border-white/12">
                    <SmartImage
                      src={image}
                      alt={typeof finalTitle === "string" ? finalTitle : "পেজের ছবি"}
                      className="aspect-[4/3]"
                      label="পেজের ছবি"
                      sizes="(max-width: 1024px) 92vw, 420px"
                    />
                  </div>
                )
              )}
              {children}
            </Reveal>
          )}
        </div>
        {accent && <p className="mt-8 font-display text-[clamp(3rem,10vw,7rem)] leading-none text-white/[0.06]">{accent}</p>}
      </div>
    </div>
  );
}
