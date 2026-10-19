export type CampaignEvent = {
  id: string;
  title: string;
  type: "জনসভা" | "উঠান বৈঠক" | "পদযাত্রা" | "স্বেচ্ছাসেবক" | "মিডিয়া" | "সেবা" | "সভা";
  date: string;
  start: string;
  end: string;
  venue: string;
  ward: string;
  description: string;
  capacity: number;
  registered: number;
  speaker?: string;
  status: "upcoming" | "past" | "live";
  highlights?: string[];
};

export const events: CampaignEvent[] = [
  {
    id: "evt-climate-dialog",
    title: "যুব ডিজিটাল সংলাপ — ভবিষ্যতের মহাদান",
    type: "সভা",
    date: "2026-10-22",
    start: "19:00",
    end: "21:00",
    venue: "ফেসবুক লাইভ + কর্পাড়ী কমিউনিটি হল",
    ward: "৪",
    description:
      "তরুণদের সাথে সরাসরি সংলাপ: ফ্রিল্যান্সিং, ক্রীড়া, মাদক প্রতিরোধ ও ডিজিটাল সেবা নিয়ে খোলা আলোচনা। প্রশ্ন করতে পারবেন অনলাইনে।",
    capacity: 300,
    registered: 214,
    speaker: "মোঃ আবু তাহের",
    status: "upcoming",
    highlights: ["লাইভ প্রশ্নোত্তর", "যুব কমিটি ঘোষণা", "ফ্রি রেজিস্ট্রেশন"],
  },
  {
    id: "evt-courtyard-bilbalia",
    title: "নারীদের উঠান বৈঠক — বিলবালিয়া",
    type: "উঠান বৈঠক",
    date: "2026-10-24",
    start: "16:00",
    end: "18:00",
    venue: "বিলবালিয়া পূর্বপাড়া প্রাথমিক বিদ্যালয় মাঠ",
    ward: "৩",
    description:
      "নারীদের নিরাপত্তা, স্বাস্থ্যসেবা, শিশু শিক্ষা ও ভাতা বিতরণ নিয়ে খোলা আলোচনা। শিশুদের জন্য আলাদা খেলার ব্যবস্থা থাকবে।",
    capacity: 200,
    registered: 146,
    status: "upcoming",
    highlights: ["মহিলা নেতৃত্ব", "শিশু যত্ন কর্নার", "চা-নাস্তা"],
  },
  {
    id: "evt-padyatra-sengua",
    title: "ভোরের পদযাত্রা ও বাজার সংলাপ",
    type: "পদযাত্রা",
    date: "2026-10-26",
    start: "07:30",
    end: "09:30",
    venue: "সেংগুয়া বাজার → মহাদান চৌরাস্তা",
    ward: "৪",
    description:
      "ব্যবসায়ী ও কৃষকদের সাথে ন্যায্য মূল্য, বাজার ড্রেনেজ এবং সড়ক সংস্কার নিয়ে সরাসরি কথা।",
    capacity: 500,
    registered: 318,
    status: "upcoming",
    highlights: ["সকালের নাস্তা", "বাজার কমিটি সংলাপ"],
  },
  {
    id: "evt-scholarship",
    title: "মেধা বৃত্তি ও বই বিতরণ উৎসব",
    type: "সেবা",
    date: "2026-11-02",
    start: "10:00",
    end: "13:00",
    venue: "মহাদান উচ্চ বিদ্যালয় মাঠ",
    ward: "৬",
    description:
      "২০০ শিক্ষার্থীর মধ্যে বই ও শিক্ষা উপকরণ বিতরণ এবং ৫০ জন মেধাবী শিক্ষার্থীকে বৃত্তি প্রদান।",
    capacity: 700,
    registered: 402,
    status: "upcoming",
    highlights: ["বৃত্তি", "বই বিতরণ", "অভিভাবক সভা"],
  },
  {
    id: "evt-health-camp",
    title: "ফ্রি মেডিকেল ক্যাম্প — স্বাস্থ্য সেবা সপ্তাহ",
    type: "সেবা",
    date: "2026-11-08",
    start: "09:00",
    end: "15:00",
    venue: "কর্পাড়ী কমিউনিটি ক্লিনিক",
    ward: "১",
    description:
      "বিশেষজ্ঞ চিকিৎসক, বিনামূল্যে ওষুধ, ডায়াবেটিস ও রক্তচাপ পরীক্ষা। নারীর জন্য আলাদা কক্ষ।",
    capacity: 400,
    registered: 267,
    status: "upcoming",
    highlights: ["ফ্রি ওষুধ", "মহিলা কর্নার", "রক্তের গ্রুপ পরীক্ষা"],
  },
  {
    id: "evt-manifesto",
    title: "ম্যানিফেস্টো উন্মোচন ও নাগরিক সংলাপ",
    type: "জনসভা",
    date: "2026-11-14",
    start: "15:00",
    end: "18:00",
    venue: "মহাদান ইউনিয়ন পরিষদ মাঠ",
    ward: "৫",
    description:
      "৮টি স্তম্ভের পূর্ণাঙ্গ অঙ্গীকার প্রকাশ, বিশেষজ্ঞ প্যানেল আলোচনা ও নাগরিকদের প্রশ্নোত্তর।",
    capacity: 1500,
    registered: 684,
    status: "upcoming",
    highlights: ["ম্যানিফেস্টো উন্মোচন", "প্যানেল আলোচনা", "লাইভ স্ট্রিম"],
  },
  {
    id: "evt-youth-league",
    title: "মহাদান যুব ক্রিকেট লিগ — ফাইনাল",
    type: "সভা",
    date: "2026-11-21",
    start: "14:00",
    end: "18:30",
    venue: "চরপাড়া খেলার মাঠ",
    ward: "৭",
    description:
      "৯টি ওয়ার্ডের যুব দলের ক্রিকেট লিগের ফাইনাল। বিজয়ীদের মাঝে ক্রীড়া উপকরণ বিতরণ।",
    capacity: 900,
    registered: 512,
    status: "upcoming",
    highlights: ["৯ ওয়ার্ড দল", "ট্রফি বিতরণ", "সাংস্কৃতিক সন্ধ্যা"],
  },
  {
    id: "evt-volunteer-bootcamp",
    title: "স্বেচ্ছাসেবক বুটক্যাম্প ও নেটওয়ার্কিং",
    type: "স্বেচ্ছাসেবক",
    date: "2026-11-28",
    start: "10:00",
    end: "16:00",
    venue: "সরিষাবাড়ী ডিগ্রি কলেজ অডিটোরিয়াম",
    ward: "৮",
    description:
      "প্রচারণার ২৫০ স্বেচ্ছাসেবকের জন্য যোগাযোগ দক্ষতা, ডিজিটাল সোশ্যাল মিডিয়া ও মাঠ ব্যবস্থাপনার প্রশিক্ষণ।",
    capacity: 250,
    registered: 198,
    status: "upcoming",
    highlights: ["প্রশিক্ষণ", "সার্টিফিকেট", "টিম গঠন"],
  },
  {
    id: "evt-press-briefing",
    title: "সংবাদ সম্মেলন — উন্নয়ন রোডম্যাপ",
    type: "মিডিয়া",
    date: "2026-12-05",
    start: "11:00",
    end: "12:30",
    venue: "সরিষাবাড়ী প্রেস ক্লাব",
    ward: "৯",
    description:
      "স্থানীয় ও জাতীয় গণমাধ্যমের সামনে ৫ বছরের উন্নয়ন রোডম্যাপ ও প্রথম ১০০ দিনের পরিকল্পনা উপস্থাপন।",
    capacity: 120,
    registered: 86,
    status: "upcoming",
    highlights: ["প্রেস কিট", "প্রশ্নোত্তর", "ডিজিটাল প্রকাশ"],
  },
  {
    id: "evt-listen-phase-end",
    title: "শোনা পর্বের সমাপনী পাড়া সভা",
    type: "উঠান বৈঠক",
    date: "2026-10-14",
    start: "16:00",
    end: "18:00",
    venue: "দিঘলকান্দি সরকারি প্রাথমিক বিদ্যালয়",
    ward: "৯",
    description: "৪৮টি পাড়া সভার সারসংক্ষেপ ও নাগরিকদের সমস্যার তালিকা উপস্থাপন।",
    capacity: 180,
    registered: 172,
    status: "past",
    highlights: ["৩,২০০ পরিবার সাক্ষাৎ", "৪১২ অভিযোগ তালিকাভুক্ত"],
  },
  {
    id: "evt-kickoff",
    title: "প্রচারণার শুভ সূচনা ও দোয়া মাহফিল",
    type: "জনসভা",
    date: "2026-09-15",
    start: "15:00",
    end: "18:00",
    venue: "কর্পাড়ী জামে মসজিদ মাঠ",
    ward: "১",
    description: "৮ নং মহাদান ইউনিয়ন পরিষদ নির্বাচনের প্রস্তুতি শুরু — স্থানীয় গণ্যমান্য ব্যক্তিদের উপস্থিতি।",
    capacity: 1200,
    registered: 1200,
    status: "past",
    highlights: ["১,২০০+ উপস্থিতি", "কমিটি ঘোষণা"],
  },
];

export const eventTypes = ["সব", "জনসভা", "উঠান বৈঠক", "পদযাত্রা", "সেবা", "সভা", "স্বেচ্ছাসেবক", "মিডিয়া"] as const;
