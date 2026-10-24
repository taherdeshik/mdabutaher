import type { HomeSectionCopy } from "@/content/home-sections";
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { testimonials } from "@/content/testimonials";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";

export function Testimonials({ copy }: { copy?: HomeSectionCopy }) {
  const [index, setIndex] = useState(0);
  const t = testimonials[index];
  const next = () => setIndex((i) => (i + 1) % testimonials.length);
  const prev = () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  return (
    <Section tone="dark" className="overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald/15 blur-[110px]" />
      <div className="pointer-events-none absolute right-0 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gold/8 blur-[90px]" />
      <div className="container-x relative">
        <SectionHeading
          dark
          eyebrow={copy?.eyebrow || "মানুষের কথা"}
          title={copy?.title ? <>{copy.title}</> : <>যারা <span className="text-gold">বিশ্বাস</span> করেন</>}
          description={copy?.description || "আমাদের শক্তি কোনো প্রচার নয় — মানুষের আস্থা। তাদের কথাই আমাদের কাজের মাপকাঠি।"}
          align="center"
        />

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-10">
            <Quote className="absolute -top-4 left-6 h-10 w-10 rounded-full bg-gold p-2.5 text-night sm:left-10" />
            <AnimatePresence mode="wait">
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < t.rating ? "fill-gold text-gold" : "text-white/15")} />
                  ))}
                </div>
                <blockquote className="mt-4 text-lg leading-relaxed text-cream/85 sm:text-xl">“{t.quote}”</blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-forest-2 text-sm font-bold text-gold">{t.name.slice(0, 1)}</span>
                  <div>
                    <p className="text-sm font-bold text-cream">{t.name}</p>
                    <p className="text-[0.7rem] text-cream/45">{t.role} · {t.area}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
              <div className="flex gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`মতামত ${i + 1}`}
                    className={cn("h-1.5 rounded-full transition-all", i === index ? "w-7 bg-gold" : "w-1.5 bg-white/20 hover:bg-white/40")}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={prev} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-cream/70 transition-colors hover:border-gold hover:text-gold" aria-label="আগের">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button onClick={next} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-cream/70 transition-colors hover:border-gold hover:text-gold" aria-label="পরের">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
