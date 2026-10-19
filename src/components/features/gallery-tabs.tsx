"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, Film, Maximize2, Play, X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { galleryPhotos, galleryPosters, galleryVideos } from "@/content/gallery";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "photos", label: "ছবি", icon: Camera, count: galleryPhotos.length },
  { id: "posters", label: "পোস্টার", icon: Maximize2, count: galleryPosters.length },
  { id: "videos", label: "ভিডিও", icon: Film, count: galleryVideos.length },
] as const;

type TabId = (typeof tabs)[number]["id"];

const filters = ["সব", ...Array.from(new Set(galleryPhotos.map((p) => p.tag)))];

export function GalleryTabs() {
  const [tab, setTab] = useState<TabId>("photos");
  const [filter, setFilter] = useState("সব");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const photos = useMemo(
    () => galleryPhotos.filter((p) => filter === "সব" || p.tag === filter),
    [filter],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      setLightbox((current) => {
        if (current === null) return current;
        return (current + dir + photos.length) % photos.length;
      });
    },
    [photos.length],
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, step]);

  const active = lightbox === null ? null : photos[lightbox];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 rounded-full border border-forest/10 bg-white p-1.5 sm:w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[0.78rem] font-semibold transition-colors sm:flex-none",
                tab === t.id ? "bg-forest text-cream" : "text-muted hover:text-forest",
              )}
            >
              {t.label}
              <span className={cn("font-latin text-[0.62rem]", tab === t.id ? "text-cream/60" : "text-muted/60")}>{t.count}</span>
            </button>
          ))}
        </div>

        {tab === "photos" && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[0.7rem] font-semibold transition-colors",
                  filter === f
                    ? "border-forest bg-forest text-cream"
                    : "border-forest/12 bg-white text-muted hover:border-forest/30 hover:text-forest",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab + filter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-5"
        >
          {tab === "photos" && (
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
              {photos.map((photo, i) => (
                <button
                  key={photo.key}
                  onClick={() => setLightbox(i)}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-forest/8 bg-forest/5 text-left"
                >
                  <SmartImage
                    imageKey={photo.key}
                    alt={photo.caption}
                    className={photo.tall ? "aspect-[4/5]" : i % 3 === 0 ? "aspect-square" : "aspect-[4/3]"}
                    label={photo.caption}
                    sizes="(max-width: 640px) 50vw, 25vw"
                    imgClassName="group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/85 via-night/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="rounded-full bg-gold/90 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-night">{photo.tag}</span>
                    <p className="mt-1.5 line-clamp-2 text-[0.7rem] font-semibold leading-snug text-cream">{photo.caption}</p>
                  </div>
                  <span className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-night/50 text-cream opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <Maximize2 className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {tab === "posters" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {galleryPosters.map((poster, i) => (
                <motion.div
                  key={poster.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group overflow-hidden rounded-2xl border border-forest/10 bg-white"
                >
                  <button
                    onClick={() => setLightbox(null)}
                    className="block w-full"
                    aria-label={`${poster.title} বড় করে দেখুন`}
                  >
                    <SmartImage
                      imageKey={poster.key}
                      alt={poster.title}
                      className="aspect-[3/4]"
                      label={poster.title}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      imgClassName="group-hover:scale-105"
                    />
                  </button>
                  <div className="p-3">
                    <p className="text-[0.78rem] font-bold text-forest">{poster.title}</p>
                    <p className="mt-0.5 text-[0.65rem] text-muted">{poster.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {tab === "videos" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryVideos.map((v) => (
                <div key={v.id} className="group overflow-hidden rounded-2xl border border-forest/10 bg-white">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-video bg-gradient-to-br from-forest to-night"
                  >
                    <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:22px_22px]" />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-gold text-night transition-transform group-hover:scale-110">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </div>
                    <span className="absolute left-3 top-3 rounded bg-night/60 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-cream backdrop-blur">
                      YouTube
                    </span>
                  </a>
                  <p className="p-3 text-[0.8rem] font-semibold leading-snug text-forest">{v.title}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-night/92 p-4 backdrop-blur"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <SmartImage
                imageKey={active.key}
                alt={active.caption}
                className="aspect-[4/3] max-h-[78vh]"
                label={active.caption}
                sizes="90vw"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-night/90 to-transparent p-4">
                <div>
                  <span className="rounded-full bg-gold px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-night">{active.tag}</span>
                  <p className="mt-1.5 text-[0.82rem] font-semibold text-cream">{active.caption}</p>
                </div>
                <span className="shrink-0 font-latin text-[0.7rem] text-cream/50">
                  {(lightbox ?? 0) + 1} / {photos.length}
                </span>
              </div>
              <button onClick={() => setLightbox(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-night/60 text-cream backdrop-blur hover:bg-night" aria-label="বন্ধ">
                <X className="h-4 w-4" />
              </button>
              <button onClick={() => step(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-night/55 text-cream backdrop-blur hover:bg-night" aria-label="আগের ছবি">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button onClick={() => step(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-night/55 text-cream backdrop-blur hover:bg-night" aria-label="পরের ছবি">
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
