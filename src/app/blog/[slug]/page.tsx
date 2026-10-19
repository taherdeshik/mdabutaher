import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { posts } from "@/content/blog";
import { PageHero } from "@/components/ui/page-hero";
import { BlogArticle } from "@/components/features/blog-article";

export function generateStaticParams() { return posts.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = posts.find((x) => x.slug === slug);
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
  const post = posts.find((x) => x.slug === slug);
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
