import type { MetadataRoute } from "next";
import { posts } from "@/content/blog";
import { activities } from "@/content/activities";
import { events } from "@/content/events";
import { news } from "@/content/news";
import { cmsBlogPosts, cmsEvents, cmsNews } from "@/lib/cms";

export const dynamic = "force-dynamic";

const base = "https://mdabutaher.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cmsPosts, cmsEventItems, cmsNewsItems] = await Promise.all([
    cmsBlogPosts(),
    cmsEvents(),
    cmsNews(),
  ]);

  const now = new Date();
  const staticRoutes = [
    "", "/about", "/manifesto", "/campaign", "/events", "/activities", "/news",
    "/blog", "/gallery", "/gallery/photos", "/gallery/posters", "/gallery/election-posters", "/polls", "/appointment", "/appointment/status", "/feedback",
    "/feedback/board", "/chat", "/contact", "/media-kit", "/privacy",
  ].map((p) => ({
    url: base + p,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  const blog = [...posts, ...cmsPosts];
  const newsAll = [...news, ...cmsNewsItems];
  const eventsAll = [...events, ...cmsEventItems];

  return [
    ...staticRoutes,
    ...blog.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...activities.map((a) => ({
      url: `${base}/activities/${a.id}`,
      lastModified: new Date(a.date),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    ...newsAll.map((n) => ({
      url: `${base}/news/${n.id}`,
      lastModified: new Date(n.date),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...eventsAll.map((e) => ({
      url: `${base}/events/${e.id}`,
      lastModified: new Date(e.date),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
