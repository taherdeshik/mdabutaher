"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* Shared presentation primitives for the command center. */

export function Card({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: "gold" | "emerald" | "rose" | false;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-sm",
        glow === "gold" && "border-gold/25 bg-gold/[0.06]",
        glow === "emerald" && "border-emerald-bright/25 bg-emerald-bright/[0.05]",
        glow === "rose" && "border-rose-400/25 bg-rose-400/[0.06]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHead({
  title,
  sub,
  action,
  icon,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-gold">{icon}</span> : null}
        <div className="min-w-0">
          <p className="truncate text-[0.82rem] font-bold text-cream">{title}</p>
          {sub ? <p className="mt-0.5 truncate text-[0.66rem] text-cream/45">{sub}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const badgeTones = {
  gold: "border-gold/30 bg-gold/12 text-gold",
  emerald: "border-emerald-bright/30 bg-emerald-bright/10 text-emerald-bright",
  rose: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  muted: "border-white/12 bg-white/[0.05] text-cream/60",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold leading-relaxed", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

export function Progress({
  value,
  tone = "emerald",
  className,
  height = "h-1.5",
}: {
  value: number;
  tone?: "emerald" | "gold" | "rose" | "sky";
  className?: string;
  height?: string;
}) {
  const tones = {
    emerald: "bg-emerald-bright",
    gold: "bg-gold",
    rose: "bg-rose-400",
    sky: "bg-sky-400",
  };
  return (
    <div className={cn("overflow-hidden rounded-full bg-white/10", height, className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  icon,
  tone = "gold",
  progress,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  tone?: "gold" | "emerald" | "rose" | "sky" | "muted";
  progress?: number;
}) {
  const toneClass = {
    gold: "text-gold",
    emerald: "text-emerald-bright",
    rose: "text-rose-300",
    sky: "text-sky-300",
    muted: "text-cream",
  }[tone];
  return (
    <Card className="p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.66rem] font-medium leading-tight text-cream/50">{label}</p>
        {icon ? <span className={cn("opacity-80", toneClass)}>{icon}</span> : null}
      </div>
      <p className={cn("mt-1.5 font-latin text-[1.35rem] font-extrabold leading-none tracking-tight sm:text-[1.55rem]", toneClass)}>{value}</p>
      {progress !== undefined ? <Progress value={progress} tone={tone === "muted" ? "emerald" : tone} className="mt-2.5" /> : null}
      {sub ? <p className="mt-1.5 text-[0.6rem] leading-snug text-cream/40">{sub}</p> : null}
    </Card>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[0.68rem] font-semibold text-cream/60">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[0.6rem] text-cream/35">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-white/12 bg-night/60 px-3 py-2 text-[0.78rem] text-cream placeholder:text-cream/25 outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/15";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, "appearance-none", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-[76px] resize-y leading-relaxed", props.className)} />;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "gold";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-emerald-bright text-night hover:bg-emerald-bright/90",
    gold: "bg-gold text-night hover:bg-gold/90",
    ghost: "bg-white/[0.06] text-cream hover:bg-white/10",
    outline: "border border-white/15 text-cream/80 hover:border-white/30 hover:text-cream",
    danger: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25",
  };
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "px-3 py-1.5 text-[0.66rem]" : "px-4 py-2 text-[0.76rem]",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-night/80 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 cursor-default" aria-label="বন্ধ করুন" onClick={onClose} />
      <div className={cn("relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0a211a] shadow-2xl sm:rounded-2xl", width)}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#0a211a]/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[0.95rem] font-bold text-cream">{title}</p>
            {sub ? <p className="mt-0.5 text-[0.68rem] text-cream/45">{sub}</p> : null}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-cream/60 transition-colors hover:bg-white/10 hover:text-cream" aria-label="বন্ধ করুন">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
      <p className="text-[0.8rem] font-semibold text-cream/60">{title}</p>
      {sub ? <p className="mt-1 max-w-sm text-[0.68rem] text-cream/35">{sub}</p> : null}
    </div>
  );
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function MiniBars({ data, tone = "emerald" }: { data: { label: string; value: number }[]; tone?: "emerald" | "gold" | "sky" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const color = { emerald: "bg-emerald-bright", gold: "bg-gold", sky: "bg-sky-400" }[tone];
  return (
    <div className="flex h-16 items-end gap-1">
      {data.map((d, i) => (
        <div key={i} className="group relative flex h-full flex-1 items-end" title={`${d.label}: ${d.value}`}>
          <div className={cn("w-full rounded-sm opacity-70 transition-opacity group-hover:opacity-100", color)} style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}
