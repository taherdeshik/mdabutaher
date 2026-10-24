"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ExternalLink, Film, Play, X } from "lucide-react";
import {
  campaignVideos,
  embedUrl,
  featuredVideo,
  thumbnailUrl,
  videoCategories,
  watchUrl,
  type CampaignVideo,
} from "@/content/videos";
import { cn, bn } from "@/lib/utils";

/** Thumbnail with a designed fallback when YouTube's CDN is unreachable. */
function Thumb({ video, className, eager }: { video: CampaignVideo; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-[linear-gradient(135deg,#0a3025_0%,#0e4334_45%,#17a06a_140%)]",
          className,
        )}
      >
        <Film className="h-8 w-8 text-gold/70" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- YouTube CDN thumbs are already optimised
    <img
      src={thumbnailUrl(video.id)}
      alt=""
      aria-hidden
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

function PlayButton({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full bg-gold text-night shadow-[0_10px_30px_-10px_rgba(212,175,55,.8)] transition-transform duration-300 group-hover:scale-110",
        size === "lg" ? "h-16 w-16" : "h-12 w-12",
      )}
    >
      <Play className={cn("fill-current", size === "lg" ? "h-6 w-6" : "h-5 w-5")} />
    </span>
  );
}

export function VideoGallery() {
  const [category, setCategory] = useState<string>("সব");
  const [playing, setPlaying] = useState<CampaignVideo | null>(null);
  const [featuredPlaying, setFeaturedPlaying] = useState(false);

  const list = campaignVideos.filter((v) => !v.featured);
  const filtered = category === "সব" ? list : list.filter((v) => v.category === category);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlaying(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [playing]);

  return (
    <div>
      {/* Featured player */}
      <div className="overflow-hidden rounded-3xl border border-forest/10 bg-night shadow-[0_30px_70px_-40px_rgba(6,30,22,.7)]">
        <div className="relative aspect-video w-full bg-night">
          {featuredPlaying ? (
            <iframe
              src={embedUrl(featuredVideo.id)}
              title={featuredVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setFeaturedPlaying(true)}
              className="group absolute inset-0 h-full w-full"
              aria-label={`${featuredVideo.title} — ভিডিও চালান`}
            >
              <Thumb video={featuredVideo} eager className="opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
              <span className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-night/10" />
              <span className="absolute inset-0 grid place-items-center">
                <PlayButton size="lg" />
              </span>
              <span className="absolute inset-x-0 bottom-0 p-4 text-left sm:p-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-night">
                  <Film className="h-3 w-3" /> প্রধান ভিডিও
                </span>
                <span className="mt-2 block font-display text-lg font-bold leading-snug text-cream sm:text-2xl">
                  {featuredVideo.title}
                </span>
                {featuredVideo.note ? (
                  <span className="mt-1 hidden max-w-2xl text-[0.78rem] leading-relaxed text-cream/60 sm:block">
                    {featuredVideo.note}
                  </span>
                ) : null}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["সব", ...videoCategories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[0.72rem] font-semibold transition-colors",
                category === c
                  ? "border-forest bg-forest text-cream"
                  : "border-forest/12 bg-white text-muted hover:border-forest/30 hover:text-forest",
              )}
            >
              {c}
              <span className="ml-1.5 font-latin text-[0.6rem] opacity-60">
                {c === "সব" ? bn(list.length) : bn(list.filter((v) => v.category === c).length)}
              </span>
            </button>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-[0.68rem] text-muted">
          <Clock className="h-3.5 w-3.5" /> ক্লিক করলেই ভিডিও চালু হবে — কোনো কুকি ছাড়া
        </p>
      </div>

      {/* Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((video, i) => (
          <motion.article
            key={video.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, delay: Math.min(i, 5) * 0.04 }}
            className="group overflow-hidden rounded-2xl border border-forest/10 bg-white transition-shadow hover:shadow-[0_20px_45px_-30px_rgba(6,30,22,.5)]"
          >
            <button
              type="button"
              onClick={() => setPlaying(video)}
              className="relative block aspect-video w-full overflow-hidden bg-forest/5"
              aria-label={`${video.title} — ভিডিও চালান`}
            >
              <Thumb video={video} className="transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-night/25 transition-colors group-hover:bg-night/10" />
              <span className="absolute inset-0 grid place-items-center">
                <PlayButton />
              </span>
              <span className="absolute left-2.5 top-2.5 rounded-full bg-night/70 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-cream backdrop-blur">
                {video.category}
              </span>
            </button>
            <div className="p-3.5">
              <h3 className="line-clamp-2 text-[0.82rem] font-bold leading-snug text-forest">{video.title}</h3>
              {video.note ? <p className="mt-1 line-clamp-2 text-[0.68rem] leading-relaxed text-muted">{video.note}</p> : null}
              <Link
                href={watchUrl(video.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[0.66rem] font-semibold text-forest/60 transition-colors hover:text-forest"
              >
                YouTube-এ দেখুন <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </motion.article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-[0.8rem] text-muted">এই বিভাগে এখনো কোনো ভিডিও নেই।</p>
      ) : null}

      {/* Player modal */}
      <AnimatePresence>
        {playing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-night/92 p-4 backdrop-blur"
            onClick={() => setPlaying(null)}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-hidden rounded-2xl bg-night">
                <div className="relative aspect-video w-full">
                  <iframe
                    src={embedUrl(playing.id)}
                    title={playing.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 bg-white p-3.5">
                  <div className="min-w-0">
                    <p className="text-[0.84rem] font-bold leading-snug text-forest">{playing.title}</p>
                    <p className="mt-0.5 text-[0.66rem] text-muted">{playing.category}</p>
                  </div>
                  <Link
                    href={watchUrl(playing.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-forest/15 px-2.5 py-1.5 text-[0.64rem] font-semibold text-forest transition-colors hover:bg-cream"
                  >
                    YouTube <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <button
                onClick={() => setPlaying(null)}
                className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-gold text-night shadow-lg hover:bg-gold/90"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
