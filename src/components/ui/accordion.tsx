"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({
  items,
  dark = false,
  className,
  defaultOpen = 0,
}: {
  items: { q: string; a: string }[];
  dark?: boolean;
  className?: string;
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className={cn("divide-y", dark ? "divide-white/10" : "divide-forest/10", className)}>
      {items.map((item, i) => {
        const active = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(active ? null : i)}
              aria-expanded={active}
              className={cn(
                "flex w-full items-center justify-between gap-4 py-4 text-left text-[0.95rem] font-semibold transition-colors",
                dark ? "text-cream hover:text-gold" : "text-forest hover:text-emerald",
              )}
            >
              <span>{item.q}</span>
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors",
                  active
                    ? "border-forest bg-forest text-cream"
                    : dark
                      ? "border-white/20 text-cream/70"
                      : "border-forest/15 text-forest/70",
                )}
              >
                {active ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className={cn("pb-5 pr-10 text-sm leading-relaxed", dark ? "text-cream/60" : "text-muted")}>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
