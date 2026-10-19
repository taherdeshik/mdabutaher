"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-[#0f3d2e] px-5 py-2.5 text-[0.78rem] font-bold text-[#f5f0e4] shadow-lg shadow-[#0f3d2e]/20 transition-transform hover:scale-[1.02] active:scale-95"
    >
      <Printer className="h-4 w-4" /> প্রিন্ট করুন / PDF সেভ করুন
    </button>
  );
}
