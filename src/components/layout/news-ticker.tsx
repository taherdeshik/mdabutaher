"use client";

import Link from "next/link";
import { Radio } from "lucide-react";

const tickerItems = [
  { text: "ম্যানিফেস্টো উন্মোচন ১৪ নভেম্বর, মহাদান ইউনিয়ন পরিষদ মাঠ", href: "/events" },
  { text: "ফ্রি মেডিকেল ক্যাম্প ৮ নভেম্বর — রেজিস্ট্রেশন চলছে", href: "/events" },
  { text: "আজকের উঠান বৈঠক: বিকাল ৪টা, বিলবালিয়া পূর্বপাড়া", href: "/campaign" },
  { text: "জনমত জরিপ: এলাকার প্রধান সমস্যা কোনটি? ভোট দিন", href: "/polls" },
  { text: "অ্যাপয়েন্টমেন্ট বুকিং এখন অনলাইনে — ২ মিনিটে সময় নিন", href: "/appointment" },
  { text: "নিরাপদ পানির ৫০টি নতুন টিউবওয়েল প্রকল্প শুরু", href: "/manifesto#water" },
];

export function NewsTicker() {
  return (
    <div className="relative z-30 overflow-hidden border-b border-white/10 bg-forest text-cream">
      <div className="flex items-stretch">
        <div className="relative z-10 flex shrink-0 items-center gap-2 bg-gold px-3 py-2 text-night sm:px-4">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] sm:text-[0.72rem]">সর্বশেষ</span>
          <span className="absolute -right-2 top-0 hidden h-full w-4 bg-gold [clip-path:polygon(0_0,100%_50%,0_100%)] sm:block" />
        </div>
        <div className="group relative flex flex-1 items-center overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-forest to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-forest to-transparent" />
          <div className="flex w-max animate-marquee items-center gap-8 py-2 pl-4 group-hover:[animation-play-state:paused]">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex shrink-0 items-center gap-2 text-[0.76rem] text-cream/85 transition-colors hover:text-gold sm:text-[0.8rem]"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-gold/80" />
                {item.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
