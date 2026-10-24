import { read } from "@/lib/store";
import { mergePageContent, sitePages, type SitePageContent } from "@/content/site-pages";

/**
 * Reads the admin-edited page overrides.
 *
 * Everything is optional: an empty field means "keep what the page already
 * renders", so a fresh install looks exactly like the coded design.
 */
export async function getPageContent(pageId: string): Promise<SitePageContent> {
  try {
    const db = await read();
    return mergePageContent(db.siteContent?.[pageId]);
  } catch {
    return mergePageContent(undefined);
  }
}

export async function getAllSiteContent(): Promise<Record<string, SitePageContent>> {
  let stored: Record<string, SitePageContent> = {};
  try {
    const db = await read();
    stored = db.siteContent || {};
  } catch {
    stored = {};
  }
  const out: Record<string, SitePageContent> = {};
  for (const page of sitePages) out[page.id] = mergePageContent(stored[page.id]);
  return out;
}

/** Ids hidden by the editor — used by the header to drop menu links. */
export async function hiddenPageIds(): Promise<string[]> {
  const all = await getAllSiteContent();
  return Object.entries(all)
    .filter(([, content]) => content.visible === false)
    .map(([id]) => id);
}
