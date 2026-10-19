import type { Metadata } from "next";
import { BookOpen, PenLine, TrendingUp, Users } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { BlogExplorer } from "@/components/features/blog-explorer";
import { posts } from "@/content/blog";
import { bn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ব্লগ ও ভাবনা",
  description: "নীতি, উন্নয়ন ও মাঠের অভিজ্ঞতা নিয়ে লিখিত বিশ্লেষণ — মোঃ আবু তাহেরের ব্যক্তিগত ব্লগ।",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const views = posts.reduce((s, p) => s + p.views, 0);
  return (
    <>
      <PageHero
        eyebrow="ব্লগ"
        title={<>সমস্যার কথা নয়, <span className="text-gold">সমাধানের</span> কথা</>}
        description="প্রতিটি লেখায় একটি সমস্যা, একটি বিশ্লেষণ এবং একটি বাস্তবায়নযোগ্য পরিকল্পনা। পাঠকের মতামত ও সংশোধনী সবসময় স্বাগত।"
        crumbs={[{ label: "ব্লগ" }]}
        accent="ভাবনা"
      >
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          {[
            { icon: BookOpen, value: `${bn(posts.length)}টি`, label: "প্রকাশিত লেখা" },
            { icon: Users, value: `${bn(views.toLocaleString("en-US"))}`, label: "মোট পাঠ" },
            { icon: TrendingUp, value: "৯টি", label: "বিষয়" },
            { icon: PenLine, value: "সাপ্তাহিক", label: "নতুন লেখা" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <s.icon className="h-3.5 w-3.5 text-gold" />
              <div>
                <p className="font-latin text-[0.78rem] font-bold">{s.value}</p>
                <p className="text-[0.55rem] text-cream/45">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x">
          <BlogExplorer />
        </div>
      </Section>
    </>
  );
}
