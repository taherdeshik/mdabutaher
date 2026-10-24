import { read } from "@/lib/store";
import { cmsTicker } from "@/lib/cms";
import { defaultTickerItems, defaultTickerSettings, type TickerItem } from "@/content/ticker";

/**
 * Resolves the header ticker.
 *
 *  custom → only the admin's active items, in their chosen order (may be empty)
 *  auto   → latest published news/events, then the coded defaults
 *  off    → nothing (the strip disappears)
 *
 * Falls back to the defaults whenever the store cannot be read (static mirror).
 */
export async function getTickerItems(): Promise<{ enabled: boolean; items: { text: string; href: string }[] }> {
  let settings = defaultTickerSettings;
  let items: TickerItem[] = [];
  try {
    const db = await read();
    settings = { ...defaultTickerSettings, ...(db.ticker?.settings || {}) };
    items = (db.ticker?.items || []).filter((i) => i.text?.trim());
  } catch {
    settings = defaultTickerSettings;
    items = [];
  }

  if (!settings.enabled) return { enabled: false, items: [] };

  const active = items.filter((i) => i.active !== false);

  // "custom" is literal: only the admin's active lines, even if that leaves none.
  if (settings.mode === "custom") {
    return {
      enabled: true,
      items: active.map((i) => ({ text: i.text, href: i.href || "/" })),
    };
  }

  // auto: fresh CMS posts first, then the curated defaults — de-duplicated.
  let live: { text: string; href: string }[] = [];
  try {
    live = await cmsTicker();
  } catch {
    live = [];
  }
  const seen = new Set<string>();
  const merged = [...live, ...defaultTickerItems].filter((item) => {
    const key = item.text.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { enabled: true, items: merged.slice(0, 8) };
}
