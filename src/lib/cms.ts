import { read } from "@/lib/store";
import type { NewsItem } from "@/content/news";
import type { CampaignEvent } from "@/content/events";
import type { Post } from "@/content/blog";
import type { Post as CmsPost } from "@/lib/command-types";

/** CMS bridge: turns published command-center posts into the public content shapes. */

const author = { name: "মোঃ আবু তাহের", role: "চেয়ারম্যান পদপ্রার্থী, মহাদান ইউনিয়ন" };

async function published(type: CmsPost["type"]) {
  const db = await read();
  return db.posts
    .filter((p) => p.status === "published" && p.type === type)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function cmsNews(): Promise<NewsItem[]> {
  return (await published("news")).map((p) => ({
    id: p.id,
    outlet: p.outlet || "প্রচারণা ডেস্ক",
    title: p.title,
    date: p.date,
    summary: p.excerpt,
    body: p.body.length ? p.body : [p.excerpt],
    image: p.image,
    featured: p.featured,
  }));
}

export async function cmsEvents(): Promise<CampaignEvent[]> {
  return (await published("event")).map((p) => ({
    id: p.id,
    title: p.title,
    type: "সভা",
    date: p.date,
    start: "16:00",
    end: "18:00",
    venue: p.venue || p.location || "মহাদান ইউনিয়ন",
    ward: p.location?.match(/ওয়ার্ড\s*([০-৯\d]+)/)?.[1] || "ইউনিয়ন",
    description: p.excerpt,
    capacity: 200,
    registered: 0,
    speaker: "মোঃ আবু তাহের",
    status: "upcoming",
    highlights: p.tags,
  }));
}

export async function cmsBlogPosts(): Promise<Post[]> {
  return (await published("blog")).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: "প্রচারণা",
    tags: p.tags,
    date: p.date,
    readTime: Math.max(1, Math.ceil(p.body.join(" ").split(/\s+/).length / 180)),
    author,
    image: p.image,
    featured: p.featured,
    views: 0,
    reactions: 0,
    content: p.body.length ? p.body.map((text) => ({ type: "p" as const, text })) : [{ type: "p" as const, text: p.excerpt }],
  }));
}

export async function cmsTicker(): Promise<{ text: string; href: string }[]> {
  const [news, events] = await Promise.all([published("news"), published("event")]);
  return [...news, ...events]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map((p) => ({
      text: p.title,
      href: p.type === "news" ? `/news/${p.id}` : "/events",
    }));
}

export async function findCmsBlogPost(slug: string): Promise<Post | undefined> {
  return (await cmsBlogPosts()).find((p) => p.slug === slug);
}

export async function findCmsEvent(id: string): Promise<CampaignEvent | undefined> {
  return (await cmsEvents()).find((e) => e.id === id);
}

export async function findCmsNews(id: string): Promise<NewsItem | undefined> {
  return (await cmsNews()).find((n) => n.id === id);
}
