import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { manifestoIntro, pillars } from "@/content/manifesto";
import { site } from "@/content/site";
import { PrintButton } from "@/components/features/print-button";

export const metadata: Metadata = {
  title: "ম্যানিফেস্টো — প্রিন্ট / PDF সংস্করণ",
  description: "মোঃ আবু তাহেরের ৮ স্তম্ভ ও ৩২ অঙ্গীকারের প্রিন্ট-উপযোগী সংস্করণ। ব্রাউজার থেকে PDF হিসেবে সেভ করুন।",
  robots: { index: false, follow: true },
  alternates: { canonical: "/manifesto/print" },
};

export default function ManifestoPrintPage() {
  return (
    <div className="min-h-screen bg-[#e9e4d8] py-6 text-[#14201b] print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm 13mm; }
          .no-print { display: none !important; }
          .paper { box-shadow: none !important; border: 0 !important; margin: 0 !important; max-width: none !important; padding: 0 !important; }
          .pillar { break-inside: avoid; }
          a { text-decoration: none; color: inherit; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-20 mx-auto mb-4 flex max-w-[900px] flex-wrap items-center justify-between gap-3 rounded-b-2xl border-b border-[#14201b]/10 bg-[#e9e4d8]/90 px-4 py-3 backdrop-blur">
        <Link href="/manifesto" className="inline-flex items-center gap-2 text-[0.78rem] font-semibold text-[#14201b]/70 hover:text-[#14201b]">
          <ArrowLeft className="h-4 w-4" /> ম্যানিফেস্টোতে ফিরুন
        </Link>
        <PrintButton />
      </div>

      <article className="paper mx-auto max-w-[820px] border border-[#14201b]/10 bg-white px-8 py-10 shadow-[0_20px_60px_-30px_rgba(20,32,27,0.45)] sm:px-12 sm:py-14">
        {/* Letterhead */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#0f3d2e] pb-5">
          <div>
            <p className="text-[0.66rem] font-semibold text-[#0f3d2e]/60">
              নির্বাচনী ম্যানিফেস্টো · {site.electionYear}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#0f3d2e]">{site.name}</h1>
            <p className="mt-1 text-[0.82rem] font-medium text-[#14201b]/70">
              {site.role} · {site.ward}, {site.upazila}, {site.district}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#0f3d2e] px-3 py-1 text-[0.62rem] font-bold text-[#f5f0e4]">
              <ShieldCheck className="h-3 w-3" /> স্বতন্ত্র প্রার্থী
            </div>
            <p className="mt-2 text-[0.62rem] text-[#14201b]/50">প্রকাশ: ১ সেপ্টেম্বর ২০২৬ · সংস্করণ ১.০</p>
          </div>
        </header>

        <section className="mt-7">
          <h2 className="text-[1.35rem] font-extrabold text-[#14201b]">{manifestoIntro.title}</h2>
          <p className="mt-1 text-[0.78rem] font-medium text-[#0f3d2e]/70">{manifestoIntro.subtitle}</p>
          <blockquote className="mt-4 border-l-4 border-[#c9a227] bg-[#faf7ef] px-4 py-3 text-[0.82rem] leading-relaxed text-[#14201b]/80">
            “{manifestoIntro.quote}”
          </blockquote>
          <div className="mt-4 grid grid-cols-3 divide-x divide-[#14201b]/10 rounded-xl bg-[#0f3d2e] py-3 text-center text-[#f5f0e4]">
            {[["৮", "স্তম্ভ"], ["৩২", "অঙ্গীকার"], ["৫ বছর", "রোডম্যাপ"]].map(([v, l]) => (
              <div key={l}>
                <p className="text-lg font-extrabold text-[#e6c35c]">{v}</p>
                <p className="text-[0.6rem] text-[#f5f0e4]/60">{l}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-6">
          {pillars.map((p) => (
            <div key={p.id} className="pillar break-inside-avoid rounded-lg border border-[#14201b]/10 p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-[0.72rem] font-extrabold text-[#c9a227]">{p.number}</span>
                <h3 className="text-[1.02rem] font-bold text-[#0f3d2e]">{p.title}</h3>
              </div>
              <p className="mt-1.5 text-[0.76rem] leading-relaxed text-[#14201b]/70">{p.summary}</p>
              <p className="mt-1.5 text-[0.7rem] leading-relaxed text-[#14201b]/50">
                <span className="font-semibold text-[#14201b]/70">সমস্যা:</span> {p.problem}
              </p>
              <ol className="mt-3 space-y-1.5">
                {p.commitments.map((c) => (
                  <li key={c.title} className="flex gap-2 text-[0.74rem] leading-relaxed">
                    <span className="mt-[0.38rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f3d2e]" />
                    <span className="text-[#14201b]/80">
                      <span className="font-semibold text-[#14201b]">{c.title}</span> — {c.detail}{" "}
                      <span className="whitespace-nowrap rounded bg-[#f0ead9] px-1.5 py-0.5 text-[0.6rem] font-semibold text-[#0f3d2e]">
                        {c.timeline}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-dashed border-[#14201b]/15 pt-2.5 text-[0.62rem] text-[#14201b]/55">
                <span><span className="font-semibold">লক্ষ্য:</span> {p.target}</span>
                <span><span className="font-semibold">বাজেট:</span> {p.budget}</span>
                <span><span className="font-semibold">SDG:</span> {p.sdg}</span>
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-8 border-t-2 border-[#0f3d2e] pt-4 text-[0.66rem] leading-relaxed text-[#14201b]/60">
          <p className="font-semibold text-[#0f3d2e]">{site.slogan}</p>
          <p className="mt-0.5">
            {site.office} · {site.phone} · {site.email}
          </p>
          <p className="mt-0.5 text-[0.58rem] text-[#14201b]/40">
            এই নথিটি mdabutaher.com থেকে স্বয়ংক্রিয়ভাবে তৈরি। অঙ্গীকারের অগ্রগতি প্রতি মাসে ওয়েবসাইটে প্রকাশিত হয়।
          </p>
        </footer>
      </article>
    </div>
  );
}
