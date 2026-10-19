import type { MetadataRoute } from "next";
import { posts } from "@/content/blog";
import { activities } from "@/content/activities";
import { events } from "@/content/events";
import { news } from "@/content/news";

const base = "https://mdabutaher.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    "", "/about", "/manifesto", "/campaign", "/events", "/activities", "/news",
    "/blog", "/gallery", "/polls", "/appointment", "/appointment/status", "/feedback",
    "/feedback/board", "/chat", "/contact", "/privacy",
  ].map((p) => ({ url: base + p, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 }));

  return [
    ...staticRoutes,
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.date), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...activities.map((a) => ({ url: `${base}/activities/${a.id}`, lastModified: new Date(a.date), changeFrequency: "yearly" as const, priority: 0.5 })),
    ...news.map((n) => ({ url: `${base}/news/${n.id}`, lastModified: new Date(n.date), changeFrequency: "yearly" as const, priority: 0.5 })),
    ...events.map((e) => ({ url: `${base}/events/${e.id}`, lastModified: new Date(e.date), changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
