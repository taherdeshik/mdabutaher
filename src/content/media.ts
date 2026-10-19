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
  // Filled in by the legacy audit pipeline (see audit/IMAGE-MAP.md).
  portrait: "",
  hero: "",
  community: "",
  water: "",
  relief: "",
  books: "",
  education: "",
  library: "",
  medical: "",
  trees: "",
  road: "",
  eid: "",
  winter: "",
  youth: "",
  women: "",
  digital: "",
  agriculture: "",
  campaign: "",
  campaign2: "",
  campaign3: "",
  poster: "",
  poster2: "",
};

export function imageFor(key?: string) {
  if (!key) return undefined;
  const src = imageMap[key];
  return src && src.length > 0 ? src : undefined;
}
