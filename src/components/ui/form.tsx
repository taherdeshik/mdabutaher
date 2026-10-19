import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[0.8rem] font-semibold text-forest">
          {label} {required && <span className="text-rose-600">*</span>}
        </span>
        {hint && <span className="text-[0.68rem] text-muted">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-[0.72rem] font-medium text-rose-600">{error}</span>}
    </label>
  );
}

const fieldBase =
  "w-full rounded-xl border border-forest/12 bg-white px-3.5 text-sm text-ink shadow-[0_1px_0_rgba(6,30,22,.03)] transition-colors placeholder:text-muted/60 focus:border-emerald/60 focus:outline-none focus:ring-4 focus:ring-emerald/10 disabled:bg-cream-2 disabled:text-muted";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldBase, "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%235d6f66%22 stroke-width=%221.6%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[right_0.9rem_center] bg-no-repeat pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-ink", className)}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-forest/25 text-emerald accent-emerald" {...props} />
      <span className="leading-snug">{label}</span>
    </label>
  );
}
