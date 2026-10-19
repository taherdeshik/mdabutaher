"use client";

import { useEffect, useState } from "react";
import { EyeOff, Eye } from "lucide-react";

/** Local, cookie-free opt-out for the anonymous page-view counter. */
export function AnalyticsOptOut() {
  const [off, setOff] = useState(false);

  useEffect(() => {
    try {
      setOff(localStorage.getItem("mat-analytics-off") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    try {
      if (off) localStorage.removeItem("mat-analytics-off");
      else localStorage.setItem("mat-analytics-off", "1");
      setOff(!off);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={toggle}
      className="mt-3 inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white px-4 py-2 text-[0.72rem] font-semibold text-forest transition-colors hover:border-forest/30 hover:bg-cream-2/60"
    >
      {off ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      {off ? "বেনামি পরিসংখ্যান চালু করুন" : "বেনামি পরিসংখ্যান বন্ধ করুন"}
    </button>
  );
}
