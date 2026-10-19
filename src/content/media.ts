/**
 * Image registry.
 *
 * Every content item references a semantic key (e.g. "water", "books").
 * The registry maps that key to an archived asset from the legacy site
 * (captured by scripts/capture-audit.mjs) or to a bundled fallback.
 *
 * `SmartImage` renders a designed gradient placeholder when a key is missing,
 * so the UI never shows a broken image while content is being migrated.
 */
export const imageMap: Record<string, string> = {
  // Real photographs archived from the legacy site by the audit workflow.
  portrait: "/media/legacy/taher_image-f08126a2.webp",
  hero: "/media/legacy/hero-portrait-4x5.webp",
  community: "/media/legacy/sarishabari_pic-1235-c175e898.webp",
  water: "/media/legacy/284557816_10228246788222787_2385912760104853652_-608dd608.webp",
  relief: "/media/legacy/IMG_20211212_115118-30dbe4f6.webp",
  books: "/media/legacy/received_483306492835495_5otdrrm-c0285602.webp",
  education: "/media/legacy/received_376456034235590-fb811eca.webp",
  library: "/media/legacy/received_1153869532069476-d996bcf4.webp",
  medical: "/media/legacy/IMG_20211215_105534-a7c674c4.webp",
  trees: "/media/legacy/IMG_20211222_114615-9b0b309d.webp",
  road: "/media/legacy/791078260_1078384274577189_6165485474257422821_n-7974759c.webp",
  eid: "/media/legacy/161011286_2937729633180449_8825047337858256039_n-50b9dad0.webp",
  winter: "/media/legacy/IMG_20211212_120618-dee88783.webp",
  youth: "/media/legacy/214874809_835312057094298_3251119913130677045_n-7a4de9a2.webp",
  women: "/media/legacy/IMG_20211222_125557-ba30e8e9.webp",
  digital: "/media/legacy/seo-9cf2302b.webp",
  agriculture: "/media/legacy/IMG_20211222_114111-00c6557d.webp",
  campaign: "/media/legacy/IMG_20211217_163952-ed401482.webp",
  rally: "/media/legacy/su-2-20211030162511-69e2ffd6.webp",
  campaign2: "/media/legacy/su-2-20211030162511-bf810e7d.webp",
  campaign3: "/media/legacy/untitled-20-20211030162547-95c9dd2f.webp",
  poster: "/media/legacy/118877907_2783264545293626_8497971054621986768_n-4a9fcd78.webp",
  posterEid: "/media/legacy/poster-eid-2027.webp",
  posterEducation: "/media/legacy/poster-daridro-2027.webp",
  poster2: "/media/legacy/123484324_10224488721953479_2034934907087761587_-0de3b56e.webp",
};

export function imageFor(key?: string) {
  if (!key) return undefined;
  const src = imageMap[key];
  return src && src.length > 0 ? src : undefined;
}
