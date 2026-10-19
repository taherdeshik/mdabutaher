"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { bn } from "@/lib/utils";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Counter({
  value,
  suffix = "",
  duration = 1.8,
  className,
  bengali = true,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
  bengali?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  // SSR must render the final number so no-JS and crawlers see real data.
  const [display, setDisplay] = useState(value);
  const reset = useRef(false);

  // Runs after hydration but before paint, so the count-up still starts at 0
  // without ever flashing the final value.
  useIsoLayoutEffect(() => {
    if (reset.current) return;
    reset.current = true;
    setDisplay(0);
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const formatted = bengali ? bn(display.toLocaleString("en-US")) : display.toLocaleString("en-US");

  return (
    <span ref={ref} className={className}>
      <motion.span>{formatted}</motion.span>
      {suffix}
    </span>
  );
}
