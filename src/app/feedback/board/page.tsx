import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { FeedbackBoard } from "@/components/features/feedback-board";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "পাবলিক রিপোর্ট বোর্ড",
  description: "মহাদান ইউনিয়নের নাগরিকদের রিপোর্ট, অভিযোগ ও পরামর্শের প্রকাশ্য বোর্ড — ট্র্যাকিং ও অগ্রগতিসহ।",
  alternates: { canonical: "/feedback/board" },
};

export default function FeedbackBoardPage() {
  return (
    <>
      <PageHero
        eyebrow="স্বচ্ছতা"
        title={<>পাবলিক রিপোর্ট <span className="text-gold">বোর্ড</span></>}
        description="নাগরিকদের প্রতিটি অভিযোগ, পরামর্শ ও অগ্রগতি এখানে প্রকাশ্য। কোনো রিপোর্ট লুকানো হয় না — শুধু নাম গোপন রাখার অনুরোধ মানা হয়।"
        crumbs={[{ label: "সমস্যা ও পরামর্শ", href: "/feedback" }, { label: "বোর্ড" }]}
      >
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-bright" />
          <div>
            <p className="text-[0.8rem] font-semibold text-cream">হুমকি রিপোর্ট পাবলিক নয়</p>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-cream/50">নিরাপত্তা ও হুমকি সংক্রান্ত রিপোর্ট গোপনীয়ভাবে দায়িত্বপ্রাপ্ত দলের কাছে যায়, প্রকাশ্যে দেখানো হয় না।</p>
          </div>
        </div>
      </PageHero>
      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x">
          <FeedbackBoard />
        </div>
      </Section>
    </>
  );
}
