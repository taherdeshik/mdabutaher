/**
 * News-ticker defaults.
 *
 * Shown while the live list loads, and used as the fallback when the admin has
 * not curated a ticker (or on the static GitHub Pages mirror, where the API is
 * unavailable). The editor can replace these entirely.
 */

export type TickerItem = { id: string; text: string; href: string; active: boolean };

export const defaultTickerItems: { text: string; href: string }[] = [
  { text: "ম্যানিফেস্টো উন্মোচন ১৪ নভেম্বর, মহাদান ইউনিয়ন পরিষদ মাঠ", href: "/events" },
  { text: "ফ্রি মেডিকেল ক্যাম্প ৮ নভেম্বর — রেজিস্ট্রেশন চলছে", href: "/events" },
  { text: "আজকের উঠান বৈঠক: বিকাল ৪টা, বিলবালিয়া পূর্বপাড়া", href: "/campaign" },
  { text: "জনমত জরিপ: এলাকার প্রধান সমস্যা কোনটি? ভোট দিন", href: "/polls" },
  { text: "অ্যাপয়েন্টমেন্ট বুকিং এখন অনলাইনে — ২ মিনিটে সময় নিন", href: "/appointment" },
  { text: "নিরাপদ পানির ৫০টি নতুন টিউবওয়েল প্রকল্প শুরু", href: "/manifesto#water" },
];

export type TickerSettings = {
  /** false hides the whole strip on every page. */
  enabled: boolean;
  /** "auto" = latest published news/events + defaults; "custom" = only the admin list. */
  mode: "auto" | "custom";
};

export const defaultTickerSettings: TickerSettings = { enabled: true, mode: "auto" };
