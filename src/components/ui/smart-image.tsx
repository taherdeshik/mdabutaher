"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { imageFor } from "@/content/media";

type Props = {
  imageKey?: string;
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  label?: string;
  fill?: boolean;
};

/**
 * Image with a designed fallback: if the archived asset is missing or fails to
 * load, we render an intentional-looking editorial placeholder instead of a
 * broken image icon. This keeps the layout stable during content migration.
 */
export function SmartImage({
  imageKey,
  src,
  alt,
  className,
  imgClassName,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
  label,
  fill = true,
}: Props) {
  const resolved = src || imageFor(imageKey);
  const [failed, setFailed] = useState(false);
  const showFallback = !resolved || failed;

  return (
    <div className={cn("relative overflow-hidden bg-forest", className)}>
      {showFallback ? (
        <div
          aria-label={alt}
          role="img"
          className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#0a3025_0%,#0e4334_45%,#17a06a_140%)]"
        >
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,.9) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-gold/30" />
          <div className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full border border-white/10" />
          <div className="relative z-10 px-6 text-center">
            <svg viewBox="0 0 48 48" className="mx-auto mb-3 h-9 w-9 text-gold/80" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 34c4-9 8-13 12-13s6 5 10 5 5-4 8-4 4 3 6 7" />
              <path d="M6 40h36" />
              <circle cx="16" cy="13" r="5" />
            </svg>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/55">Md. Abu Taher</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium text-cream/90">{label || alt}</p>
          </div>
        </div>
      ) : (
        <Image
          src={resolved}
          alt={alt}
          fill={fill}
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className={cn("object-cover transition-transform duration-700 will-change-transform", imgClassName)}
        />
      )}
    </div>
  );
}
