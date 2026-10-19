"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { bn } from "@/lib/utils";

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
  const [display, setDisplay] = useState(0);

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
