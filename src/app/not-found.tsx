import Link from "next/link";
import { ArrowLeft, Compass, MessageCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center mesh-dark px-4 py-16 text-cream">
      <div className="max-w-lg text-center">
        <p className="font-display text-[clamp(5rem,18vw,9rem)] font-bold leading-none text-gold/25">৪০৪</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">পাতাটি খুঁজে পাওয়া যায়নি</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-cream/55">
          লিংকটি পুরোনো হতে পারে অথবা পৃষ্ঠাটি সরানো হয়েছে। নিচের অপশন থেকে চালিয়ে যান।
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-night"><ArrowLeft className="h-4 w-4" /> হোমে ফিরুন</Link>
          <Link href="/manifesto" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-cream"><Compass className="h-4 w-4" /> ম্যানিফেস্টো</Link>
          <Link href="/chat" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-cream"><MessageCircle className="h-4 w-4" /> সহায়তা</Link>
        </div>
      </div>
    </div>
  );
}
