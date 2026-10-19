import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./reveal";

export function Section({
  children,
  className,
  id,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "light" | "dark" | "sand" | "transparent";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-16 sm:py-20 lg:py-24",
        tone === "light" && "bg-cream text-ink",
        tone === "sand" && "bg-cream-2 text-ink",
        tone === "dark" && "bg-night text-cream",
        tone === "transparent" && "text-ink",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className={cn("eyebrow mb-3", dark && "text-gold/90")}>
            <span className={cn("inline-block h-px w-7", dark ? "bg-gold/60" : "bg-emerald/60")} />
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            "text-balance-tight text-3xl font-bold leading-[1.15] sm:text-4xl lg:text-[2.75rem]",
            dark ? "text-cream" : "text-forest",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-4 text-[0.95rem] leading-relaxed sm:text-base", dark ? "text-cream/60" : "text-muted")}>
            {description}
          </p>
        )}
      </Reveal>
      {action && (
        <Reveal delay={0.1}>
          <Link
            href={action.href}
            className={cn(
              "group inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all",
              dark
                ? "border-white/20 text-cream hover:border-gold hover:text-gold"
                : "border-forest/15 text-forest hover:border-forest hover:bg-forest hover:text-cream",
            )}
          >
            {action.label}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = "emerald",
  className,
}: {
  children: ReactNode;
  tone?: "emerald" | "gold" | "dark" | "light" | "rose" | "sky";
  className?: string;
}) {
  const tones = {
    emerald: "bg-emerald/10 text-emerald border-emerald/15",
    gold: "bg-gold/15 text-gold-deep border-gold/25",
    dark: "bg-forest text-cream border-forest",
    light: "bg-white/70 text-forest border-forest/10",
    rose: "bg-rose-500/10 text-rose-700 border-rose-500/15",
    sky: "bg-sky-500/10 text-sky-700 border-sky-500/15",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
