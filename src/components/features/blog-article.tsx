"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { Clock, Eye, Heart, MessageCircle, Share2, ThumbsUp } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { posts, type Post } from "@/content/blog";
import { cn, bn, formatBnDate } from "@/lib/utils";

const reactions = [
  { id: "like", icon: ThumbsUp, label: "ভালো লেগেছে", count: 128 },
  { id: "love", icon: Heart, label: "অনুপ্রাণিত", count: 64 },
  { id: "clap", icon: MessageCircle, label: "গুরুত্বপূর্ণ", count: 41 },
];

export function BlogArticle({ post }: { post: Post }) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });
  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mat-react-${post.slug}`);
      if (saved) setPicked(JSON.parse(saved));
    } catch {}
  }, [post.slug]);

  function react(id: string) {
    const next = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
    setPicked(next);
    localStorage.setItem(`mat-react-${post.slug}`, JSON.stringify(next));
  }

  async function share() {
    const url = `https://mdabutaher.com/blog/${post.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch {}
  }

  const related = posts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2);
  const alsoRead = related.length ? related : posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <motion.div style={{ scaleX: progress }} className="fixed left-0 top-[76px] z-40 h-0.5 w-full origin-left bg-gold" />

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_16rem] lg:py-14">
        <article>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-forest px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-gold">{post.category}</span>
            {post.tags.map((t) => <span key={t} className="rounded-full bg-cream-2 px-2 py-0.5 text-[0.6rem] text-muted">#{t}</span>)}
          </div>

          <h1 className="mt-4 text-balance-tight text-[1.85rem] font-bold leading-[1.2] text-forest sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-[1rem] leading-relaxed text-muted">{post.excerpt}</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-forest/8 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-sm font-bold text-gold">আ</span>
              <div>
                <p className="text-[0.8rem] font-bold text-forest">{post.author.name}</p>
                <p className="text-[0.65rem] text-muted">{formatBnDate(post.date)} · {bn(post.readTime)} মিনিট পাঠ · <span className="inline-flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{bn(post.views.toLocaleString("en-US"))}</span></p>
              </div>
            </div>
            <button onClick={share} className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 px-3 py-1.5 text-[0.7rem] font-semibold text-forest transition-colors hover:bg-cream">
              <Share2 className="h-3 w-3" /> {copied ? "লিংক কপি হয়েছে" : "শেয়ার"}
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl">
            <SmartImage imageKey={post.image} alt={post.title} className="aspect-[16/9]" label={post.title} priority sizes="(max-width: 1024px) 100vw, 60vw" />
          </div>

          <div className="mt-7 space-y-4">
            {post.content.map((block, i) => {
              if (block.type === "h2") return <h2 key={i} className="mt-8 text-xl font-bold text-forest">{block.text}</h2>;
              if (block.type === "p") return <p key={i} className="text-[0.98rem] leading-[1.9] text-ink/80">{block.text}</p>;
              if (block.type === "quote")
                return (
                  <blockquote key={i} className="my-6 rounded-2xl border-l-4 border-gold bg-cream-2/60 px-5 py-4 text-[1.02rem] font-medium italic leading-relaxed text-forest">
                    “{block.text}”
                    {block.cite && <footer className="mt-2 text-[0.72rem] font-normal not-italic text-muted">— {block.cite}</footer>}
                  </blockquote>
                );
              if (block.type === "list")
                return (
                  <ul key={i} className="my-4 space-y-2">
                    {block.items.map((it) => (
                      <li key={it} className="flex items-start gap-2.5 text-[0.92rem] leading-relaxed text-ink/80">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />{it}
                      </li>
                    ))}
                  </ul>
                );
              if (block.type === "callout")
                return (
                  <div key={i} className="my-5 rounded-2xl border border-emerald/20 bg-emerald/[0.05] p-4">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald">{block.title}</p>
                    <p className="mt-1 text-[0.86rem] leading-relaxed text-forest/80">{block.text}</p>
                  </div>
                );
              return null;
            })}
          </div>

          {/* reactions */}
          <div className="mt-8 rounded-2xl border border-forest/10 bg-white p-4">
            <p className="text-[0.72rem] font-semibold text-muted">এই লেখাটি আপনার কেমন লেগেছে?</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {reactions.map((r) => {
                const on = picked.includes(r.id);
                return (
                  <button key={r.id} onClick={() => react(r.id)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold transition-all", on ? "border-gold bg-gold/15 text-gold-deep" : "border-forest/12 text-muted hover:border-forest/30 hover:text-forest")}>
                    <r.icon className={cn("h-3.5 w-3.5", on && "fill-current")} /> {r.label} <span className="font-latin text-[0.62rem] opacity-60">{bn(r.count + (on ? 1 : 0))}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* author */}
          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-forest p-5 text-cream sm:flex-row sm:items-center">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold font-display text-lg font-bold text-night">আ</span>
            <div className="flex-1">
              <p className="text-[0.86rem] font-bold">{post.author.name}</p>
              <p className="text-[0.72rem] text-cream/55">{post.author.role}</p>
            </div>
            <Link href="/about" className="rounded-full border border-white/20 px-3.5 py-1.5 text-[0.72rem] font-semibold transition-colors hover:border-gold hover:text-gold">পরিচিতি</Link>
          </div>

          <div className="mt-6">
            <p className="text-[0.75rem] font-bold text-forest">আরও পড়ুন</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {alsoRead.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="group flex items-center gap-2.5 rounded-xl border border-forest/10 bg-white p-2.5 transition-colors hover:bg-cream">
                  <SmartImage imageKey={r.image} alt={r.title} className="h-12 w-16 shrink-0 rounded-lg" label={r.title} sizes="64px" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[0.76rem] font-semibold leading-snug text-forest group-hover:text-emerald">{r.title}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[0.58rem] text-muted"><Clock className="h-2.5 w-2.5" />{bn(r.readTime)} মিনিট</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <div className="rounded-2xl border border-forest/10 bg-white p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">এই পাতায়</p>
              <ul className="mt-2 space-y-1.5">
                {post.content.filter((b) => b.type === "h2").map((b, i) => (
                  <li key={i} className="border-l-2 border-forest/10 py-0.5 pl-2.5 text-[0.7rem] leading-snug text-muted transition-colors hover:border-emerald hover:text-forest">
                    {"text" in b ? b.text : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-cream-2/60 p-4">
              <p className="text-[0.72rem] font-bold text-forest">মতামত জানান</p>
              <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">এই লেখা নিয়ে প্রশ্ন বা পরামর্শ আছে? সরাসরি জানান।</p>
              <Link href="/feedback" className="mt-2.5 block rounded-lg bg-forest px-3 py-2 text-center text-[0.72rem] font-semibold text-cream">ফিডব্যাক পাঠান</Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
