import { cmsBlogPosts, cmsEvents, cmsNews } from "@/lib/cms";
import { activities } from "@/content/activities";
import { posts as staticPosts } from "@/content/blog";
import { events as staticEvents } from "@/content/events";
import { news as staticNews } from "@/content/news";
import { site } from "@/content/site";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

type Item = { title: string; link: string; description: string; date: string; category: string };

export async function GET() {
  const [cmsNew, cmsBlog, cmsEvent] = await Promise.all([cmsNews(), cmsBlogPosts(), cmsEvents()]);

  const items: Item[] = [
    ...[...cmsNew, ...staticNews].map((n) => ({
      title: n.title,
      link: `${SITE_URL}/news/${n.id}`,
      description: n.summary,
      date: n.date,
      category: "সংবাদ",
    })),
    ...[...cmsBlog, ...staticPosts].map((p) => ({
      title: p.title,
      link: `${SITE_URL}/blog/${p.slug}`,
      description: p.excerpt,
      date: p.date,
      category: "ব্লগ",
    })),
    ...[...cmsEvent, ...staticEvents].map((e) => ({
      title: e.title,
      link: `${SITE_URL}/events/${e.id}`,
      description: e.description,
      date: e.date,
      category: "ইভেন্ট",
    })),
    ...activities.slice(0, 12).map((a) => ({
      title: a.title,
      link: `${SITE_URL}/activities/${a.id}`,
      description: a.summary,
      date: a.date,
      category: "কার্যক্রম",
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 40);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${site.name} — ${site.union}`)}</title>
    <link>${SITE_URL}</link>
    <description>${esc("ম্যানিফেস্টো, প্রচারণা, ইভেন্ট, সংবাদ ও জনসেবার সর্বশেষ আপডেট।")}</description>
    <language>bn-BD</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (item) => `    <item>
      <title>${esc(item.title)}</title>
      <link>${esc(item.link)}</link>
      <guid isPermaLink="true">${esc(item.link)}</guid>
      <description>${esc(item.description)}</description>
      <category>${esc(item.category)}</category>
      <pubDate>${new Date(`${item.date}T09:00:00+06:00`).toUTCString()}</pubDate>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
