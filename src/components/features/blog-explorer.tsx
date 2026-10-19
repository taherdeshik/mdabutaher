"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Bookmark, Clock, Eye, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { posts, blogCategories, allTags, type Post } from "@/content/blog";
import { SmartImage } from "@/components/ui/smart-image";
import { cn, bn, formatBnDate } from "@/lib/utils";

function PostCard({ post, featured = false, index = 0 }: { post: Post; featured?: boolean; index?: number }) {
  const [saved, setSaved] = useState(false);
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className={cn("group relative overflow-hidden rounded-3xl border border-forest/10 bg-white transition-all hover:-translate-y-1 hover:shadow-lift", featured && "lg:grid lg:grid-cols-2")}
    >
      <Link href={`/blog/${post.slug}`} className="block overflow-hidden">
        <SmartImage imageKey={post.image} alt={post.title} className={featured ? "aspect-[16/10] lg:aspect-auto lg:h-full" : "aspect-[16/10]"} label={post.title} sizes={featured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"} imgClassName="group-hover:scale-[1.03]" />
        <span className="absolute left-3 top-3 rounded-full bg-night/70 px-2.5 py-1 text-[0.6rem] font-semibold text-gold backdrop-blur">{post.category}</span>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); setSaved((s) => !s); }}
        aria-label="সংরক্ষণ করুন"
        className={cn("absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition-colors", saved ? "bg-gold text-night" : "bg-night/50 text-cream hover:bg-night/70")}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      </button>

      <div className={cn("flex flex-col p-4", featured && "sm:p-6", !featured && "")}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem] text-muted">
          <span>{formatBnDate(post.date, { day: "numeric", month: "short", year: featured ? "numeric" : undefined })}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{bn(post.readTime)} মিনিট</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{bn(post.views.toLocaleString("en-US"))}</span>
        </div>
        <h3 className={cn("mt-1.5 font-bold leading-snug text-forest transition-colors group-hover:text-emerald", featured ? "text-lg sm:text-xl" : "text-[0.95rem]")}>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className={cn("mt-1.5 text-[0.76rem] leading-relaxed text-muted", featured ? "line-clamp-3" : "line-clamp-2")}>{post.excerpt}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {post.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-cream-2/70 px-2 py-0.5 text-[0.58rem] text-muted">#{t}</span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-3.5">
          <span className="flex items-center gap-1.5 text-[0.66rem] text-forest/70">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-forest text-[0.55rem] font-bold text-gold">আ</span>
            {post.author.name}
          </span>
          <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-emerald">
            পড়ুন <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function BlogExplorer() {
  const [cat, setCat] = useState("সব");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "popular">("new");

  const filtered = useMemo(() => {
    const list = posts
      .filter((p) => cat === "সব" || p.category === cat)
      .filter((p) => !tag || p.tags.includes(tag))
      .filter((p) => !query || p.title.includes(query) || p.excerpt.includes(query) || p.tags.some((t) => t.includes(query)));
    return [...list].sort((a, b) => (sort === "new" ? b.date.localeCompare(a.date) : b.views - a.views));
  }, [cat, query, tag, sort]);

  return (
    <div>
      {/* Featured hero */}
      {!query && !tag && cat === "সব" && (
        <div className="mb-6">
          <p className="eyebrow mb-3"><span className="inline-block h-px w-6 bg-gold-deep" /> সম্পাদকের পছন্দ</p>
          <PostCard post={posts[0]} featured index={0} />
        </div>
      )}

      {/* toolbar */}
      <div className="sticky top-[76px] z-20 -mx-1 rounded-2xl border border-forest/10 bg-white/90 p-2.5 backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ব্লগ খুঁজুন — পানি, শিক্ষা, ডিজিটাল..." className="h-9 w-full rounded-full border border-forest/12 bg-cream/50 pl-9 pr-9 text-[0.78rem] focus:border-emerald/50 focus:outline-none" />
            {query && <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-forest" aria-label="মুছুন"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted" />
            <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "popular")} className="rounded-full border border-forest/12 bg-white px-2.5 py-1.5 text-[0.72rem] text-forest focus:outline-none">
              <option value="new">নতুন আগে</option>
              <option value="popular">জনপ্রিয় আগে</option>
            </select>
          </div>
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar">
          {blogCategories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold transition-colors", cat === c ? "bg-forest text-cream" : "text-muted hover:bg-cream")}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {tag && (
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-3 py-1 text-[0.7rem] font-semibold text-emerald">
            #{tag}
            <button onClick={() => setTag(null)} aria-label="ট্যাগ সরান"><X className="h-3 w-3" /></button>
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[0.72rem] text-muted"><strong className="text-forest">{bn(filtered.length)}</strong>টি লেখা পাওয়া গেছে</p>
        <div className="hidden gap-1.5 sm:flex">
          {allTags.slice(0, 4).map((t) => (
            <button key={t} onClick={() => setTag(t)} className="rounded-full border border-forest/10 px-2.5 py-1 text-[0.62rem] text-muted transition-colors hover:border-forest/30 hover:text-forest">#{t}</button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={cat + query + (tag || "") + sort} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-forest/15 bg-white p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted/30" />
          <p className="mt-3 text-sm font-medium text-forest">কোনো লেখা পাওয়া যায়নি</p>
          <p className="mt-1 text-[0.75rem] text-muted">অন্য শব্দে খুঁজুন বা ফিল্টার পরিবর্তন করুন।</p>
        </div>
      )}
    </div>
  );
}
