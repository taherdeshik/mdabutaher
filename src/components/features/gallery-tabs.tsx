"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, ExternalLink, Play, X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { activities } from "@/content/activities";
import { posts } from "@/content/blog";
import { news } from "@/content/news";
import { cn } from "@/lib/utils";

const photoKeys = Array.from(new Set([...activities.map((a) => a.image), ...posts.map((p) => p.image), ...news.map((n) => n.image), "community", "campaign", "portrait"]));
const posters = ["poster", "poster2", "posterEid", "posterEducation"];
const videos = [
  { id: "13_YsIbYnAI", title: "স্বতন্ত্র চেয়ারম্যান প্রার্থীর ভোট প্রার্থনা" },
  { id: "dQUP84MXOJU", title: "ডামি নির্বাচনকে না বলুন — মোঃ আবু তাহের" },
  { id: "jzxaaoDebIM", title: "সবার দুয়ারে স্থানীয় সরকার" },
  { id: "OJoSE4Y608E", title: "নির্বাচনী ইশতেহার: দলীয় প্রভাবমুক্ত ইউনিয়ন পরিষদ" },
  { id: "miz_GqVpaiY", title: "নির্বাচনী ইশতেহার: নিরাপদ পানি ও সেনিটেশন" },
];

const tabs = [
  { id: "photos", label: "ছবি", icon: "camera" },
  { id: "posters", label: "পোস্টার", icon: "grid" },
  { id: "videos", label: "ভিডিও", icon: "film" },
] as const;

export function GalleryTabs() {
  const [tab, setTab] = useState<"photos" | "posters" | "videos">("photos");
  const [lightbox, setLightbox] = useState<{ key: string; label: string } | null>(null);

  return (
    <div>
      <div className="flex gap-1.5 rounded-full border border-forest/10 bg-white p-1.5 sm:w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex-1 rounded-full px-4 py-2 text-[0.78rem] font-semibold transition-colors sm:flex-none", tab === t.id ? "bg-forest text-cream" : "text-muted hover:text-forest")}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mt-5">
          {tab === "photos" && (
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
              {photoKeys.map((key, i) => (
                <button key={key + i} onClick={() => setLightbox({ key, label: "কার্যক্রমের ছবি" })} className="group block w-full overflow-hidden rounded-2xl border border-forest/8">
                  <SmartImage imageKey={key} alt={`গ্যালারি ${i + 1}`} className={i % 5 === 0 ? "aspect-[4/5]" : i % 3 === 0 ? "aspect-square" : "aspect-[4/3]"} label="গ্যালারি" sizes="(max-width: 640px) 50vw, 25vw" imgClassName="group-hover:scale-105" />
                </button>
              ))}
            </div>
          )}

          {tab === "posters" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {posters.map((key, i) => (
                <div key={key} className="group overflow-hidden rounded-2xl border border-forest/10 bg-white">
                  <button onClick={() => setLightbox({ key, label: `পোস্টার ${i + 1}` })} className="block w-full">
                    <SmartImage imageKey={key} alt={`পোস্টার ${i + 1}`} className="aspect-[3/4]" label="প্রচারণা পোস্টার" sizes="(max-width: 768px) 50vw, 25vw" imgClassName="group-hover:scale-105" />
                  </button>
                  <div className="flex items-center justify-between p-3">
                    <p className="text-[0.72rem] font-semibold text-forest">প্রচারণা পোস্টার {i + 1}</p>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=https://mdabutaher.com/gallery`} target="_blank" rel="noopener noreferrer" className="grid h-7 w-7 place-items-center rounded-full bg-cream text-forest transition-colors hover:bg-forest hover:text-cream" aria-label="শেয়ার">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "videos" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => (
                <div key={v.id} className="group overflow-hidden rounded-2xl border border-forest/10 bg-white">
                  <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="relative block aspect-video bg-forest">
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-gold text-night transition-transform group-hover:scale-110"><Play className="h-5 w-5 fill-current" /></span>
                    </div>
                    <span className="absolute left-3 top-3 rounded bg-night/60 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-cream backdrop-blur">YouTube</span>
                  </a>
                  <p className="p-3 text-[0.8rem] font-semibold leading-snug text-forest">{v.title}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] grid place-items-center bg-night/90 p-4 backdrop-blur" onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }} className="relative w-full max-w-3xl overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <SmartImage imageKey={lightbox.key} alt={lightbox.label} className="aspect-[4/3] max-h-[80vh]" label={lightbox.label} sizes="90vw" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-night/80 to-transparent p-4">
                <p className="text-[0.8rem] font-semibold text-cream">{lightbox.label}</p>
                <a href="/media-kit" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[0.68rem] font-semibold text-cream backdrop-blur hover:bg-white/25"><Download className="h-3 w-3" /> ডাউনলোড</a>
              </div>
              <button onClick={() => setLightbox(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-night/60 text-cream backdrop-blur hover:bg-night" aria-label="বন্ধ"><X className="h-4 w-4" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
