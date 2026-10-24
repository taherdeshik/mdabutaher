import type { Metadata } from "next";
import { Camera, Images, Film } from "lucide-react";
import { GalleryShowcase } from "@/components/features/gallery-showcase";
import { galleryPhotos, galleryVideos } from "@/content/gallery";
import { bn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ফটো গ্যালারী",
  description:
    "মহাদান ইউনিয়নের মাঠের মুহূর্ত — ত্রাণ, শিক্ষা, স্বাস্থ্য, কৃষি ও প্রচারণার ছবির আর্কাইভ। ছবিতে ক্লিক করে বড় করে দেখুন।",
  alternates: { canonical: "/gallery/photos" },
  openGraph: {
    title: "ফটো গ্যালারী — মোঃ আবু তাহের",
    description: "মহাদান ইউনিয়নের কার্যক্রম ও প্রচারণার ছবির সংকলন।",
    url: "/gallery/photos",
  },
};

export default function PhotoGalleryPage() {
  return (
    <GalleryShowcase
      eyebrow="ফটো গ্যালারী"
      title={<>মাঠের প্রতিটি{" "}<span className="ml-1.5 inline-block text-gold">মুহূর্ত</span></>}
      description="ত্রাণ বিতরণ থেকে উঠান বৈঠক — কাজের প্রমাণ ছবিতে। যেকোনো ছবিতে ক্লিক করে বড় করে দেখুন।"
      crumb="ফটো গ্যালারী"
      accent="ছবি"
      tab="photos"
      stats={[
        { icon: Camera, value: bn(galleryPhotos.length), label: "ছবি" },
        { icon: Images, value: bn(new Set(galleryPhotos.map((p) => p.tag)).size), label: "বিভাগ" },
        { icon: Film, value: bn(galleryVideos.length), label: "ভিডিও" },
      ]}
    />
  );
}
