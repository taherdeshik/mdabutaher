import type { Metadata } from "next";
import { BadgeCheck, Flag, Vote } from "lucide-react";
import { GalleryShowcase } from "@/components/features/gallery-showcase";
import { electionPosters } from "@/content/gallery";
import { bn } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "নির্বাচনী পোস্টার",
  description:
    "৮ নং মহাদান ইউনিয়ন পরিষদ নির্বাচনের প্রচারণা পোস্টার — চশমা প্রতীক, প্রার্থীর আহ্বান ও ভোটের সময়সূচি।",
  alternates: { canonical: "/gallery/election-posters" },
  openGraph: {
    title: "নির্বাচনী পোস্টার — মোঃ আবু তাহের",
    description: "চশমা প্রতীকে ভোট দিন — ৮ নং মহাদান ইউনিয়ন পরিষদ নির্বাচন।",
    url: "/gallery/election-posters",
  },
};

export default function ElectionPosterPage() {
  return (
    <GalleryShowcase
      pageId="gallery-election"
      eyebrow="নির্বাচনী পোস্টার"
      title={<>প্রতীক <span className="ml-1.5 inline-block text-gold">চশমা</span></>}
      description="৮ নং মহাদান ইউনিয়ন পরিষদ নির্বাচনের অফিসিয়াল প্রচারণা পোস্টার। পোস্টারে ক্লিক করে পূর্ণ আকারে দেখুন ও বার্তাটি পড়ুন।"
      crumb="নির্বাচনী পোস্টার"
      accent="ভোট"
      tab="posters"
      electionOnly
      stats={[
        { icon: Vote, value: bn(electionPosters.length), label: "পোস্টার" },
        { icon: Flag, value: "চশমা", label: "প্রতীক" },
        { icon: BadgeCheck, value: "২০২৭", label: "নির্বাচন" },
      ]}
    />
  );
}
