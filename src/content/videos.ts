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

/* -------------------------------------------------------------------------- */
/*  Intro video ("ভিডিও পরিচিতি")                                              */
/* -------------------------------------------------------------------------- */

/**
 * The single intro / message video shown on the home page and the about page.
 *
 * To change it, just edit this object — nothing else needs touching:
 *  - `enabled: false` hides the section everywhere.
 *  - `id` is the YouTube video id (the part after `watch?v=`).
 *  - `poster` is optional: drop a photo in `public/media/` and point to it,
 *    otherwise YouTube's own thumbnail is used.
 */
export type IntroVideoConfig = {
  enabled: boolean;
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Small label under the player, e.g. the occasion. */
  kicker: string;
  highlights: string[];
  /** Optional still image: "/media/...". Falls back to the YouTube thumbnail. */
  poster?: string;
};

export const introVideo: IntroVideoConfig = {
  enabled: true,
  id: "hnD09TA3Vj8",
  eyebrow: "ভিডিও পরিচিতি",
  title: "দুই মিনিটে জানুন, আমি কে",
  description:
    "নির্বাচনী প্রচারণার ভিডিও বার্তায় মহাদান ইউনিয়নের সার্বিক উন্নয়ন, স্মার্ট শিক্ষা ও ডিজিটাল সেবার অঙ্গীকার — সরাসরি আমার কণ্ঠে।",
  kicker: "প্রার্থীর ভিডিও বার্তা · নির্বাচন ২০২৭",
  highlights: [
    "২৪ বছরের মাঠ অভিজ্ঞতা",
    "৮টি স্তম্ভে ৩২টি অঙ্গীকার",
    "স্বচ্ছ বাজেট, প্রকাশ্য হিসাব",
  ],
};

/** Intro video ids that also live in the archive — used for cross-linking. */
export const introVideoEntry = campaignVideos.find((v) => v.id === introVideo.id);
