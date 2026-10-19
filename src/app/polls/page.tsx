import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { PollsPage } from "@/components/features/polls-page";

export const metadata: Metadata = {
  title: "জনমত জরিপ ও পাবলিক পোল",
  description: "এলাকার সমস্যা, সেবার অগ্রাধিকার ও প্রচারণা নিয়ে জনমত জানুন — লাইভ ফলাফলসহ।",
  alternates: { canonical: "/polls" },
};

export default function Polls() {
  return (
    <>
      <PageHero
        eyebrow="জনমত"
        title={<>আপনার ভোট, <span className="text-gold">আমাদের পথ</span></>}
        description="আমরা সিদ্ধান্ত নিই একা নয় — জনমতের সাথে। প্রতিটি জরিপের ফলাফল প্রকাশ্য এবং ম্যানিফেস্টো ও অগ্রাধিকার নির্ধারণে ব্যবহৃত হয়।"
        crumbs={[{ label: "জনমত জরিপ" }]}
        accent="ভোট"
      />
      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x">
          <PollsPage />
        </div>
      </Section>
    </>
  );
}
