import { imageMap } from "@/content/media";
import { site } from "@/content/site";

export const SITE_URL = "https://mdabutaher.com";

export function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Resolve a content image key / media path to an absolute URL for OG & JSON-LD. */
export function socialImage(key?: string) {
  const fallback = `${SITE_URL}/opengraph-image`;
  if (!key) return fallback;
  if (/^https?:\/\//.test(key)) return key;
  const resolved = imageMap[key] || key;
  return resolved.startsWith("/") ? `${SITE_URL}${resolved}` : fallback;
}

export function breadcrumbLd(items: { label: string; href?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export function articleLd({
  type = "NewsArticle",
  title,
  description,
  path,
  image,
  published,
  modified,
  section,
  tags,
  body,
}: {
  type?: "NewsArticle" | "BlogPosting" | "Article";
  title: string;
  description: string;
  path: string;
  image?: string;
  published: string;
  modified?: string;
  section?: string;
  tags?: string[];
  body?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    headline: title,
    description,
    image: [socialImage(image)],
    datePublished: published,
    dateModified: modified || published,
    inLanguage: "bn-BD",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    author: {
      "@type": "Person",
      name: site.name,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: `${site.name} — ${site.union} প্রচারণা`,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.svg` },
    },
    ...(section ? { articleSection: section } : {}),
    ...(tags && tags.length ? { keywords: tags.join(", ") } : {}),
    ...(body ? { articleBody: body.slice(0, 5000) } : {}),
  };
}

export function eventLd({
  name,
  description,
  start,
  end,
  venue,
  path,
  image,
  status,
  performer = site.name,
}: {
  name: string;
  description: string;
  start: string;
  end?: string;
  venue: string;
  path: string;
  image?: string;
  status?: "upcoming" | "past" | "live";
  performer?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description,
    startDate: start,
    ...(end ? { endDate: end } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "bn-BD",
    location: {
      "@type": "Place",
      name: venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: site.union,
        addressRegion: site.district,
        addressCountry: "BD",
      },
    },
    image: [socialImage(image)],
    organizer: {
      "@type": "Organization",
      name: `${site.name} — ${site.union} প্রচারণা`,
      url: SITE_URL,
    },
    performer: { "@type": "Person", name: performer, url: SITE_URL },
    url: absoluteUrl(path),
  };
}
