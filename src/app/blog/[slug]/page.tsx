import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { posts as staticPosts } from "@/content/blog";
import { cmsBlogPosts, findCmsBlogPost } from "@/lib/cms";
import { PageHero } from "@/components/ui/page-hero";
import { BlogArticle } from "@/components/features/blog-article";
import { JsonLd } from "@/components/seo/json-ld";
import { articleLd, breadcrumbLd, socialImage } from "@/lib/seo";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";

function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function generateStaticParams() { return staticPosts.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);
  const fromCms = await findCmsBlogPost(slug);
  const p = fromCms || staticPosts.find((x) => x.slug === slug);
  if (!p) return { title: "লেখা পাওয়া যায়নি" };
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `/blog/${p.slug}` },
    keywords: p.tags,
    openGraph: {
      type: "article",
      title: p.title,
      description: p.excerpt,
      url: `/blog/${p.slug}`,
      publishedTime: p.date,
      authors: [site.name],
      section: p.category,
      tags: p.tags,
      images: [{ url: socialImage(p.image), width: 1200, height: 630, alt: p.title }],
    },
    twitter: { card: "summary_large_image", title: p.title, description: p.excerpt, images: [socialImage(p.image)] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);
  const fromCms = await findCmsBlogPost(slug);
  const post = fromCms || staticPosts.find((x) => x.slug === slug);
  if (!post) notFound();
  const bodyText = post.content.map((block) => ("text" in block ? block.text : block.items.join(", "))).join(" ");
  return (
    <>
      <JsonLd
        data={[
          articleLd({
            type: "BlogPosting",
            title: post.title,
            description: post.excerpt,
            path: `/blog/${post.slug}`,
            image: post.image,
            published: post.date,
            section: post.category,
            tags: post.tags,
            body: bodyText,
          }),
          breadcrumbLd([
            { label: "হোম", href: "/" },
            { label: "ব্লগ", href: "/blog" },
            { label: post.title },
          ]),
        ]}
      />
      <PageHero eyebrow={post.category} title={post.title} crumbs={[{ label: "ব্লগ", href: "/blog" }, { label: post.category }]} />
      <div className="bg-cream">
        <BlogArticle post={post} />
      </div>
    </>
  );
}
