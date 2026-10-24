"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown, ArrowUpRight, BadgeCheck, CalendarCheck, MapPin, Play, ShieldCheck, Sparkles, Users } from "lucide-react";
import { site } from "@/content/site";
import { SmartImage } from "@/components/ui/smart-image";
import { ButtonLink } from "@/components/ui/button";
import { introVideo } from "@/content/videos";
import type { SitePageContent } from "@/content/site-pages";
import type { HomeSectionCopy } from "@/content/home-sections";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ cms, copy }: { cms?: SitePageContent; copy?: HomeSectionCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yPortrait = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.35]);

  return (
    <section ref={ref} className="relative overflow-hidden mesh-dark text-cream">
      {/* decorative layers */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      <div className="pointer-events-none absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-emerald/25 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-[26rem] w-[26rem] rounded-full bg-gold/10 blur-[100px]" />
      <div className="pointer-events-none absolute right-1/4 top-24 hidden h-40 w-40 animate-spin-slow rounded-full border border-dashed border-gold/20 lg:block" />
      <p className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 select-none font-display text-[22vw] font-bold leading-none text-white/[0.025]">
        মহাদান
      </p>

      <div className="container-x relative grid items-center gap-10 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pb-28 lg:pt-20">
        <motion.div style={{ y: yText, opacity }} className="relative z-10">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-1.5 pl-2 pr-4 backdrop-blur"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-night">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-night" />
              নির্বাচন {site.electionYear}
            </span>
            <span className="text-[0.72rem] font-medium text-cream/65">৮ নং মহাদান ইউনিয়ন পরিষদ</span>
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            className="mt-6 text-balance-tight text-[clamp(2.3rem,6.2vw,4.5rem)] font-bold leading-[1.08]"
          >
            {cms?.title || copy?.title ? (
              <span className="text-balance-tight">{cms?.title || copy?.title}</span>
            ) : (
              <>
                মানুষের পাশে
                <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-gold via-[#f5d79b] to-gold bg-clip-text text-transparent">
                    সবসময়
                  </span>
                  <motion.svg
                    viewBox="0 0 320 18"
                    className="absolute -bottom-3 left-0 w-full text-gold/60"
                    fill="none"
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.3, delay: 0.9 }}
                  >
                    <motion.path d="M4 12C70 4 190 3 316 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </motion.svg>
                </span>
                <span className="block text-[0.52em] font-semibold text-cream/80">
                  — একটি পরিকল্পিত মহাদানের প্রতিশ্রুতি
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-cream/60 sm:text-base"
          >
            {copy?.description || cms?.description || site.heroQuote}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <ButtonLink href="/manifesto" variant="gold" size="lg" className="gap-2">
              ম্যানিফেস্টো পড়ুন
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </ButtonLink>
            <ButtonLink href="/appointment" variant="outline-light" size="lg" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              সাক্ষাতের সময় নিন
            </ButtonLink>
            {introVideo.enabled && (
              <Link
                href="#intro-video"
                className="group inline-flex items-center gap-2 rounded-full px-2 py-2 text-[0.85rem] font-semibold text-cream/75 transition-colors hover:text-gold"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/[0.04] transition-all group-hover:border-gold/60 group-hover:bg-gold/15">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
                ভিডিও বার্তা
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {["ক", "র", "শ", "ন"].map((ch, i) => (
                  <span
                    key={ch}
                    className="grid h-8 w-8 place-items-center rounded-full border-2 border-night bg-forest-2 text-[0.65rem] font-bold text-cream/80"
                    style={{ zIndex: 4 - i }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <div className="text-[0.72rem] leading-tight">
                <p className="font-semibold text-cream/90">১২,৫০০+ পরিবারের আস্থা</p>
                <p className="text-cream/40">৯টি ওয়ার্ড · ২৪ বছরের সেবা</p>
              </div>
            </div>
            <span className="hidden h-8 w-px bg-white/12 sm:block" />
            <div className="flex items-center gap-2 text-[0.72rem] text-cream/55">
              <ShieldCheck className="h-4 w-4 text-emerald-bright" />
              স্বচ্ছ হিসাব · প্রকাশ্য বাজেট
            </div>
          </motion.div>
        </motion.div>

        {/* Portrait card */}
        <motion.div
          style={{ y: yPortrait }}
          initial={reduce ? false : { opacity: 0, scale: 0.94, rotate: 1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease }}
          className="relative mx-auto w-full max-w-[24rem] lg:max-w-none"
        >
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2.4rem] border border-gold/25" />
            <div className="absolute -inset-3 rounded-[2.4rem] bg-gradient-to-b from-gold/10 to-transparent" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-forest-2 shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)]">
              <SmartImage imageKey="hero" src={cms?.image || undefined} alt={`${site.name} — ${site.role}`} className="aspect-[4/5]" label="প্রার্থীর ছবি" priority sizes="(max-width: 1024px) 90vw, 40vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/10 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-night/55 via-night/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-gold/90 px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-night">
                  <BadgeCheck className="h-3 w-3" /> প্রত্যয়িত প্রার্থী
                </p>
                <h2 className="mt-2.5 font-display text-2xl font-bold leading-tight">{site.name}</h2>
                <p className="mt-0.5 text-[0.75rem] text-cream/60">{site.role} · {site.ward}</p>
                <div className="mt-3 flex items-center gap-3 text-[0.68rem] text-cream/50">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{site.upazila}, {site.district}</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />৯ ওয়ার্ড</span>
                </div>
              </div>
              {introVideo.enabled && (
                <Link
                  href="#intro-video"
                  className="group absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-cream backdrop-blur transition-all hover:bg-gold hover:text-night"
                  aria-label="ভিডিও পরিচিতি চালু করুন"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span className="absolute inset-0 animate-ping rounded-full border border-white/30" />
                </Link>
              )}
            </div>

            {/* floating chips */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="absolute -left-1 top-4 rounded-2xl border border-white/12 bg-night/80 px-3 py-2 backdrop-blur-md sm:-left-8 sm:top-10 sm:px-3.5 sm:py-2.5"
            >
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/40">জনসেবা</p>
              <p className="font-display text-lg font-bold text-gold">২৪+ বছর</p>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75, duration: 0.7 }}
              className="absolute bottom-24 right-3 hidden max-w-[12rem] rounded-2xl border border-white/12 bg-cream/95 px-3 py-2 text-forest shadow-xl backdrop-blur sm:block lg:-right-2"
            >
              <p className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-emerald">
                <Sparkles className="h-3 w-3" /> প্রতিশ্রুতি
              </p>
              <p className="mt-0.5 text-sm font-bold">৮টি স্তম্ভ · ৩২ অঙ্গীকার</p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="container-x relative flex items-center justify-between border-t border-white/8 py-4">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-cream/30">মানুষের কথা শুনে, মানুষের জন্য কাজ</p>
        <Link href="#quick-actions" className="group inline-flex items-center gap-2 text-[0.7rem] text-cream/45 transition-colors hover:text-gold">
          স্ক্রল করুন
          <span className="grid h-7 w-7 place-items-center rounded-full border border-white/15 transition-colors group-hover:border-gold/50">
            <ArrowDown className="h-3 w-3 animate-bounce" />
          </span>
        </Link>
      </div>
    </section>
  );
}
