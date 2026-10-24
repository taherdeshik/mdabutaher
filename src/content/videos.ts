/**
 * Video archive.
 *
 * IDs and titles are carried over verbatim from the legacy site's
 * `/video-gallery/` page so nothing is invented — only the copy is tidied
 * (punctuation, spacing) and each clip is tagged with a category.
 */

export type VideoCategory = "প্রচারণা" | "ইশতেহার" | "সাংবাদিক সম্মেলন" | "মিডিয়া";

export type CampaignVideo = {
  id: string;
  title: string;
  category: VideoCategory;
  /** Short line shown under the title where there is room. */
  note?: string;
  featured?: boolean;
};

export const campaignVideos: CampaignVideo[] = [
  {
    id: "hnD09TA3Vj8",
    title: "নির্বাচনী প্রচারণা ২০২৭ — ভিডিও বার্তা",
    note: "মহাদান ইউনিয়নের সার্বিক উন্নয়ন, স্মার্ট শিক্ষা ও ডিজিটাল সেবা — প্রার্থীর সরাসরি বার্তা।",
    category: "প্রচারণা",
    featured: true,
  },
  {
    id: "13_YsIbYnAI",
    title: "স্বতন্ত্র চেয়ারম্যান প্রার্থীর ভোট প্রার্থনা",
    category: "প্রচারণা",
  },
  {
    id: "dQUP84MXOJU",
    title: "ডামি নির্বাচনকে না বলুন",
    note: "মোঃ আবু তাহের, চেয়ারম্যান প্রার্থী, মহাদান ইউনিয়ন।",
    category: "প্রচারণা",
  },
  {
    id: "jzxaaoDebIM",
    title: "সবার দুয়ারে স্থানীয় সরকার",
    note: "ভোট চাই, ভোটারের দোয়া চাই — সবার দুয়ারে স্থানীয় সরকার।",
    category: "প্রচারণা",
  },
  {
    id: "OJoSE4Y608E",
    title: "নির্বাচনী ইশতেহার: দলীয় প্রভাবমুক্ত নির্দলীয় ইউনিয়ন পরিষদ",
    category: "ইশতেহার",
  },
  {
    id: "miz_GqVpaiY",
    title: "নির্বাচনী ইশতেহার: সবার জন্য নিরাপদ পানি ও সেনিটেশন",
    category: "ইশতেহার",
  },
  {
    id: "rKxLsfPfMa0",
    title: "জনগণের দুয়ারে স্থানীয় সরকার — নির্বাচনী সাংবাদিক সম্মেলন",
    note: "মহাদান ইউনিয়ন।",
    category: "সাংবাদিক সম্মেলন",
  },
  {
    id: "mn4qdkXhpkM",
    title: "নির্বাচনী সাংবাদিক সম্মেলন, মহাদান ইউনিয়ন",
    category: "সাংবাদিক সম্মেলন",
  },
  {
    id: "9ZpWSRDyemw",
    title: "সরিষাবাড়ীর সাবেক শিবির নেতা মোঃ আবু তাহেরকে মিথ্যা মামলায় গ্রেফতার",
    note: "গণমাধ্যমে প্রচারিত প্রতিবেদন।",
    category: "মিডিয়া",
  },
];

export const videoCategories: VideoCategory[] = ["প্রচারণা", "ইশতেহার", "সাংবাদিক সম্মেলন", "মিডিয়া"];

export const featuredVideo = campaignVideos.find((v) => v.featured) ?? campaignVideos[0];

/** Privacy-first embed host: no cookies until the viewer presses play. */
export function embedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
}

export function watchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function thumbnailUrl(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
