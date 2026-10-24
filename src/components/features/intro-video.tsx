"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Film, Play, ShieldCheck, Video } from "lucide-react";
import { embedUrl, introVideo, watchUrl } from "@/content/videos";
import { site } from "@/content/site";
import { imageFor } from "@/content/media";
import { withBasePath } from "@/lib/utils";
import { Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1] as const;

function posterSources() {
  const custom = introVideo.poster ? withBasePath(introVideo.poster) : undefined;
  const local = imageFor("campaign");
  return {
    sources: [
      custom,
      `https://i.ytimg.com/vi/${introVideo.id}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${introVideo.id}/hqdefault.jpg`,
      local ? withBasePath(local) : undefined,
    ].filter(Boolean) as string[],
  };
}

export function IntroVideoSection({
  showAboutLink = true,
  className,
}: {
  showAboutLink?: boolean;
  className?: string;
}) {
  const { sources } = posterSources();
  const [posterIndex, setPosterIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduce = useReducedMotion();

  // The hero's play button links to #intro-video — start the video when it lands.
  useEffect(() => {
    const open = () => {
      if (window.location.hash !== "#intro-video") return;
      setPlaying(true);
      document.getElementById("intro-video")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  if (!introVideo.enabled) return null;

  const poster = sources[Math.min(posterIndex, sources.length - 1)];

  return (
    <Section
      tone="dark"
      id="intro-video"
      className={`scroll-mt-20 overflow-hidden ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute -left-24 top-0 h-[26rem] w-[26rem] rounded-full bg-emerald/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[24rem] w-[24rem] rounded-full bg-gold/10 blur-[110px]" />

      <div className="container-x relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          {/* Player */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="relative"
          >
            <div className="absolute -inset-3 rounded-[2.2rem] border border-gold/20" />
            <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-b from-gold/10 to-transparent" />

            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-forest-2 shadow-[0_40px_90px_-40px_rgba(0,0,0,.85)]">
              <div className="relative aspect-video w-full bg-night">
                {playing ? (
                  <iframe
                    key="intro-player"
                    src={embedUrl(introVideo.id)}
                    title={introVideo.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    aria-label={`ভিডিও চালু করুন — ${introVideo.title}`}
                    className="group absolute inset-0 block h-full w-full text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- YouTube CDN still, loaded without cookies */}
                    <img
                      src={poster}
                      alt={`${introVideo.title} — ${site.name}`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                      onError={() => setPosterIndex((i) => Math.min(i + 1, sources.length - 1))}
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/35 to-night/10" />
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(3,20,16,.45)_100%)]" />

                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gold/95 px-3 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-night">
                      <Video className="h-3 w-3" /> {introVideo.eyebrow}
                    </span>

                    <span className="absolute inset-0 grid place-items-center">
                      <span className="relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-gold text-night shadow-[0_18px_45px_-12px_rgba(212,175,55,.9)] transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
                        <Play className="h-6 w-6 fill-current sm:h-7 sm:w-7" />
                        <span className="absolute inset-0 hidden rounded-full border border-gold/60 motion-safe:block motion-safe:animate-ping" />
                        <span className="absolute -inset-3 rounded-full border border-white/15" />
                      </span>
                    </span>

                    <span className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold/85">
                          চালু করতে ক্লিক করুন
                        </span>
                        <span className="mt-1 block truncate font-display text-base font-bold text-cream sm:text-lg">
                          {introVideo.title}
                        </span>
                      </span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.6rem] font-semibold text-cream/70 backdrop-blur">
                        YouTube
                      </span>
                    </span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-white/[0.03] px-4 py-3 text-[0.66rem] text-cream/55">
                <span className="inline-flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5 text-gold" /> {introVideo.kicker}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-bright" /> কুকি ছাড়া প্লেয়ার
                </span>
              </div>
            </div>
          </motion.div>

          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-gold backdrop-blur">
              <Play className="h-3 w-3 fill-current" /> {introVideo.eyebrow}
            </span>

            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-cream sm:text-4xl">
              {introVideo.title}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-cream/60 sm:text-base">
              {introVideo.description}
            </p>

            <ul className="mt-6 space-y-2.5">
              {introVideo.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-[0.82rem] text-cream/75">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-bright" />
                  {h}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-center gap-4 border-t border-white/10 pt-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- signature is a PNG mark */}
              <img
                src={withBasePath(imageFor("signature") ?? "/media/signature/abu-taher-signature-2026.png")}
                alt={`${site.name}-এর স্বাক্ষর`}
                className="h-10 w-auto opacity-90"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-cream">{site.name}</p>
                <p className="text-[0.68rem] text-cream/45">
                  {site.role} · {site.union}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <ButtonLink href="/video-gallery" variant="gold" size="md" className="gap-2">
                সব ভিডিও দেখুন <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
              {showAboutLink && (
                <ButtonLink href="/about" variant="outline-light" size="md">
                  বিস্তারিত পরিচিতি
                </ButtonLink>
              )}
              <Link
                href={watchUrl(introVideo.id)}
                target="_blank"
                rel="noreferrer"
                className="ml-1 text-[0.7rem] font-semibold text-cream/50 underline-offset-4 transition-colors hover:text-gold hover:underline"
              >
                YouTube-এ দেখুন
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
