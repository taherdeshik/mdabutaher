import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/utils";
import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.role}, ${site.union}`,
    short_name: "আবু তাহের",
    description:
      "মহাদান ইউনিয়নের চেয়ারম্যান পদপ্রার্থী মোঃ আবু তাহেরের অফিসিয়াল সাইট — ম্যানিফেস্টো, প্রচারণা, ইভেন্ট ও জনসেবা।",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#f8f4ea",
    theme_color: "#0a3025",
    lang: "bn-BD",
    dir: "ltr",
    categories: ["politics", "news", "government"],
    icons: [
      { src: `${BASE_PATH}/favicon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: `${BASE_PATH}/favicon.svg`, sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "ম্যানিফেস্টো", url: `${BASE_PATH}/manifesto` },
      { name: "ইভেন্ট", url: `${BASE_PATH}/events` },
      { name: "যোগাযোগ", url: `${BASE_PATH}/contact` },
    ],
  };
}
