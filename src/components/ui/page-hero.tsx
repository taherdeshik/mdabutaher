import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Reveal } from "./reveal";

export function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
  children,
  accent,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  crumbs?: { label: string; href?: string }[];
  children?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden mesh-dark text-cream">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "26px 26px" }} />
      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-emerald/20 blur-3xl" />
      <div className="container-x relative py-12 sm:py-16 lg:py-20">
        {crumbs && (
          <nav aria-label="ব্রেডক্রাম্ব" className="mb-6 flex items-center gap-1.5 text-[0.72rem] text-cream/45">
            <Link href="/" className="transition-colors hover:text-gold">হোম</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                {c.href ? <Link href={c.href} className="transition-colors hover:text-gold">{c.label}</Link> : <span className="text-cream/80">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <div className="grid items-end gap-8 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            {eyebrow && <p className="eyebrow mb-3 text-gold/90"><span className="inline-block h-px w-7 bg-gold/60" />{eyebrow}</p>}
            <h1 className="text-balance-tight text-3xl font-bold leading-[1.12] sm:text-4xl lg:text-[3.25rem]">{title}</h1>
            {description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/60 sm:text-base">{description}</p>}
          </Reveal>
          {children && <Reveal delay={0.12}>{children}</Reveal>}
        </div>
        {accent && <p className="mt-8 font-display text-[clamp(3rem,10vw,7rem)] leading-none text-white/[0.06]">{accent}</p>}
      </div>
    </div>
  );
}
