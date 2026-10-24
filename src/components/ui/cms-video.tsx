"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { embedUrl, thumbnailUrl } from "@/content/videos";
import { cn } from "@/lib/utils";

/**
 * Click-to-play YouTube block used by CMS-managed page heroes.
 * Nothing is requested from YouTube until the visitor presses play.
 */
export function CmsVideo({
  id,
  title,
  className,
  poster,
}: {
  id: string;
  title: string;
  className?: string;
  poster?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [stage, setStage] = useState(0);

  const sources = [
    poster,
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    thumbnailUrl(id),
  ].filter(Boolean) as string[];
  const src = sources[Math.min(stage, sources.length - 1)];

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl border border-white/12 bg-night shadow-[0_24px_60px_-30px_rgba(0,0,0,.8)]",
        className,
      )}
    >
      {playing ? (
        <iframe
          src={embedUrl(id)}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`ভিডিও চালু করুন — ${title}`}
          className="group absolute inset-0 block h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube CDN still, no cookies until play */}
          <img
            src={src}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            onError={() => setStage((s) => Math.min(s + 1, sources.length - 1))}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/25 to-transparent" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="relative grid h-14 w-14 place-items-center rounded-full bg-gold text-night shadow-[0_14px_35px_-10px_rgba(212,175,55,.9)] transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
              <Play className="h-5 w-5 fill-current sm:h-6 sm:w-6" />
              <span className="absolute inset-0 hidden rounded-full border border-gold/60 motion-safe:block motion-safe:animate-ping" />
            </span>
          </span>
          <span className="absolute inset-x-4 bottom-3 text-left text-[0.66rem] font-semibold text-cream/75">
            {title}
          </span>
        </button>
      )}
    </div>
  );
}
