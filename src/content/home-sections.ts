/**
 * Home-page sections, in the order they appear.
 *
 * Each entry is editable from the admin panel ("হোমপেজ সেকশন"): eyebrow,
 * heading, description and a visibility switch. Empty fields fall back to the
 * copy coded in the component, so nothing changes until it is edited.
 */

export type HomeSectionDef = {
  id: string;
  label: string;
  /** Where the section sits, shown as a hint in the editor. */
  hint: string;
  /** Shown in the editor as the current (default) heading. */
  builtin: string;
};

export const homeSections: HomeSectionDef[] = [
  { id: "hero", label: "হিরো (প্রথম পর্দা)", hint: "হিরোর বড় শিরোনাম, বর্ণনা ও প্রার্থীর ছবি — “সাইট কনটেন্ট → হোম” থেকেও বদলানো যায়", builtin: "মানুষের পাশে সবসময়" },
  { id: "quick-actions", label: "দ্রুত সেবা", hint: "হিরোর নিচের ৪টি কার্ড (অ্যাপয়েন্টমেন্ট, সমস্যা, জরিপ, স্বেচ্ছাসেবক)", builtin: "অ্যাপয়েন্টমেন্ট · সমস্যা জানান · জনমত জরিপ · স্বেচ্ছাসেবক" },
  { id: "stats", label: "পরিসংখ্যান", hint: "২৪+ বছর, ১৮৬+ উদ্যোগ — সংখ্যাগুলো কোডে আছে, এখানে শুধু লেখা", builtin: "বছরের জনসেবা · সম্পন্ন উদ্যোগ · সংস্কারকৃত সড়ক" },
  { id: "about", label: "আমার সম্পর্কে", hint: "ছবি ও সংক্ষিপ্ত পরিচিতি", builtin: "মাটি, মানুষ আর মায়ের দোয়া — এই তিনটিই আমার শক্তি" },
  { id: "manifesto", label: "ম্যানিফেস্টো", hint: "৮ স্তম্ভের প্রিভিউ", builtin: "৮টি স্তম্ভ, ৩২টি অঙ্গীকার — সময়সীমা সহ" },
  { id: "campaign", label: "প্রচারণা পরিকল্পনা", hint: "৪ ধাপের সময়সূচি", builtin: "২১ সপ্তাহ, ৯টি ওয়ার্ড — একটি পরিকল্পিত পথচলা" },
  { id: "events", label: "আসন্ন ইভেন্ট", hint: "ইভেন্ট কার্ড ও রেজিস্ট্রেশন", builtin: "আপনার এলাকায় আমরা — সরাসরি" },
  { id: "activities", label: "কার্যক্রম", hint: "মাঠের কাজের ছবি ও বিবরণ", builtin: "কথা নয়, কাজ — মাঠের প্রমাণ" },
  { id: "polls", label: "জনমত জরিপ", hint: "লাইভ ভোটের প্রিভিউ", builtin: "আপনার মতই আমাদের অগ্রাধিকার" },
  { id: "blog", label: "ব্লগ", hint: "সাম্প্রতিক লেখা", builtin: "সমস্যার কথা নয়, সমাধানের কথা" },
  { id: "testimonials", label: "মানুষের কথা", hint: "সমর্থকদের মতামত", builtin: "যারা বিশ্বাস করেন" },
  { id: "cta", label: "শেষ আহ্বান (CTA)", hint: "পেজের নিচের কল-টু-অ্যাকশন ব্যান্ড", builtin: "একটি ফোন, একটি বার্তা — পরিবর্তনের শুরু আপনার হাতেই" },
];

export type HomeSectionCopy = {
  eyebrow?: string;
  title?: string;
  description?: string;
  visible?: boolean;
};

export type HomeCopyMap = Record<string, HomeSectionCopy>;

export const emptyHomeSection: HomeSectionCopy = {
  eyebrow: "",
  title: "",
  description: "",
  visible: true,
};

export function mergeHomeCopy(raw: Partial<HomeSectionCopy> | undefined): HomeSectionCopy {
  if (!raw) return { ...emptyHomeSection };
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    eyebrow: text(raw.eyebrow),
    title: text(raw.title),
    description: text(raw.description),
    visible: raw.visible !== false,
  };
}

/** True when a section has been edited in any way. */
export function isSectionCustomised(raw: Partial<HomeSectionCopy> | undefined) {
  if (!raw) return false;
  return Boolean(raw.eyebrow || raw.title || raw.description) || raw.visible === false;
}
