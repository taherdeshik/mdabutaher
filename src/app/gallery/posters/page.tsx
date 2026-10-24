import type { Metadata } from "next";
import { Maximize2, LayoutGrid, Megaphone } from "lucide-react";
import { GalleryShowcase } from "@/components/features/gallery-showcase";
import { galleryPosters } from "@/content/gallery";
import { bn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "পোস্টার গ্যালারী",
  description:
    "প্রচারণার পোস্টার, সামাজিক বার্তা ও নির্বাচনী প্রচারের ডিজাইন — মহাদান ইউনিয়নের ভিজ্যুয়াল আর্কাইভ।",
  alternates: { canonical: "/gallery/posters" },
  openGraph: {
    title: "পোস্টার গ্যালারী — মোঃ আবু তাহের",
    description: "প্রচারণা ও সচেতনতামূলক পোস্টারের সংকলন।",
    url: "/gallery/posters",
  },
};

export default function PosterGalleryPage() {
  return (
    <GalleryShowcase
      eyebrow="পোস্টার গ্যালারী"
      title={<>দেয়ালে দেয়ালে{" "}<span className="ml-1.5 inline-block text-gold">আমাদের কথা</span></>}
      description="প্রচারণার পোস্টার ও সচেতনতামূলক ডিজাইন — প্রতিটি পোস্টারে একেকটি বার্তা। ক্লিক করে পূর্ণ আকারে দেখুন।"
      crumb="পোস্টার গ্যালারী"
      accent="পোস্টার"
      tab="posters"
      stats={[
        { icon: Maximize2, value: bn(galleryPosters.length), label: "পোস্টার" },
        { icon: Megaphone, value: bn(galleryPosters.filter((p) => p.election).length), label: "নির্বাচনী" },
        { icon: LayoutGrid, value: "৩:৪", label: "অনুপাত" },
      ]}
    />
  );
}
