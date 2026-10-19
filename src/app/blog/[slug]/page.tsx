import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { posts as staticPosts } from "@/content/blog";
import { cmsBlogPosts, findCmsBlogPost } from "@/lib/cms";
import { PageHero } from "@/components/ui/page-hero";
import { BlogArticle } from "@/components/features/blog-article";

export const dynamic = "force-dynamic";

export function generateStaticParams() { return staticPosts.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const fromCms = await findCmsBlogPost(slug);
  const p = fromCms || staticPosts.find((x) => x.slug === slug);
  if (!p) return { title: "লেখা পাওয়া যায়নি" };
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title: p.title, description: p.excerpt, publishedTime: p.date, tags: p.tags },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fromCms = await findCmsBlogPost(slug);
  const post = fromCms || staticPosts.find((x) => x.slug === slug);
  if (!post) notFound();
  return (
    <>
      <PageHero eyebrow={post.category} title={post.title} crumbs={[{ label: "ব্লগ", href: "/blog" }, { label: post.category }]} />
      <div className="bg-cream">
        <BlogArticle post={post} />
      </div>
    </>
  );
}
