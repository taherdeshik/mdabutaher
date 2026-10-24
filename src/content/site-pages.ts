/**
 * Every menu and submenu of the public site, in one registry.
 *
 * The admin panel uses this list to build the "সাইট কনটেন্ট" editor, and the
 * public pages use it to look up the saved overrides. Add a page here once and
 * it appears in the editor automatically.
 */

export type SitePageDef = {
  /** Stable key used in storage — never translate or rename. */
  id: string;
  href: string;
  label: string;
  group: string;
  /** What the page shows today; used as a hint inside the editor. */
  builtin: string;
};

export const sitePageGroups = [
  "প্রধান",
  "প্রচারণা",
  "জনসেবা",
  "মিডিয়া",
  "গ্যালারি",
  "যোগাযোগ",
] as const;

export const sitePages: SitePageDef[] = [
  {
    id: "home",
    href: "/",
    label: "হোম",
    group: "প্রধান",
    builtin: "মানুষের পাশে সবসময় — একটি পরিকল্পিত মহাদানের প্রতিশ্রুতি",
  },
  {
    id: "about",
    href: "/about",
    label: "পরিচিতি",
    group: "প্রধান",
    builtin: "যে মানুষ মাঠে থাকে, সে-ই নেতা",
  },
  {
    id: "manifesto",
    href: "/manifesto",
    label: "ম্যানিফেস্টো",
    group: "প্রধান",
    builtin: "৮টি স্তম্ভ, ৩২টি অঙ্গীকার",
  },
  {
    id: "campaign",
    href: "/campaign",
    label: "প্রচারণা পরিকল্পনা",
    group: "প্রচারণা",
    builtin: "২১ সপ্তাহ, ৯টি ওয়ার্ড — একটি পরিকল্পিত পথচলা",
  },
  {
    id: "events",
    href: "/events",
    label: "আসন্ন ইভেন্ট",
    group: "প্রচারণা",
    builtin: "জনসভা, উঠান বৈঠক ও মিছিলের সময়সূচি",
  },
  {
    id: "appointment",
    href: "/appointment",
    label: "অ্যাপয়েন্টমেন্ট",
    group: "জনসেবা",
    builtin: "সাক্ষাতের সময় বুক করুন",
  },
  {
    id: "feedback",
    href: "/feedback",
    label: "সমস্যা ও পরামর্শ",
    group: "জনসেবা",
    builtin: "আপনার সমস্যা, পরামর্শ ও অভিযোগ",
  },
  {
    id: "polls",
    href: "/polls",
    label: "জনমত জরিপ",
    group: "জনসেবা",
    builtin: "ভোট দিন, ফলাফল দেখুন",
  },
  {
    id: "chat",
    href: "/chat",
    label: "লাইভ চ্যাট",
    group: "জনসেবা",
    builtin: "২৪/৭ সহায়তা ও বার্তা",
  },
  {
    id: "activities",
    href: "/activities",
    label: "কার্যক্রম",
    group: "মিডিয়া",
    builtin: "জনকল্যাণের কাজ — ছবি ও বিবরণ",
  },
  {
    id: "news",
    href: "/news",
    label: "সংবাদ",
    group: "মিডিয়া",
    builtin: "গণমাধ্যমে আমরা",
  },
  {
    id: "blog",
    href: "/blog",
    label: "ব্লগ",
    group: "মিডিয়া",
    builtin: "ভাবনা, বিশ্লেষণ ও আপডেট",
  },
  {
    id: "media-kit",
    href: "/media-kit",
    label: "মিডিয়া কিট",
    group: "মিডিয়া",
    builtin: "প্রেস ছবি, জীবনী ও লোগো",
  },
  {
    id: "gallery",
    href: "/gallery",
    label: "গ্যালারি",
    group: "গ্যালারি",
    builtin: "ছবি, পোস্টার ও ভিডিও — এক জায়গায়",
  },
  {
    id: "gallery-photos",
    href: "/gallery/photos",
    label: "ফটো গ্যালারী",
    group: "গ্যালারি",
    builtin: "মাঠের মুহূর্ত — কাজের ছবি",
  },
  {
    id: "gallery-posters",
    href: "/gallery/posters",
    label: "পোস্টার গ্যালারী",
    group: "গ্যালারি",
    builtin: "প্রচারণা ও সচেতনতার ডিজাইন",
  },
  {
    id: "gallery-election",
    href: "/gallery/election-posters",
    label: "নির্বাচনী পোস্টার",
    group: "গ্যালারি",
    builtin: "চশমা প্রতীক ও ভোটের আহ্বান",
  },
  {
    id: "video-gallery",
    href: "/video-gallery",
    label: "ভিডিও গ্যালারি",
    group: "গ্যালারি",
    builtin: "প্রচারণা, ইশতেহার ও সংবাদ সম্মেলন",
  },
  {
    id: "contact",
    href: "/contact",
    label: "যোগাযোগ",
    group: "যোগাযোগ",
    builtin: "আমাদের সাথে যোগাযোগ করুন",
  },
  {
    id: "privacy",
    href: "/privacy",
    label: "গোপনীয়তা নীতি",
    group: "যোগাযোগ",
    builtin: "তথ্যের গোপনীয়তা ও ব্যবহারের নীতি",
  },
];

export const sitePageById = new Map(sitePages.map((p) => [p.id, p]));

/** "/gallery/photos/" → "gallery-photos"; unknown paths return undefined. */
export function pageIdForHref(href: string) {
  const clean = href.split("#")[0].replace(/\/+$/, "") || "/";
  return sitePages.find((p) => p.href === clean)?.id;
}

/* -------------------------------------------------------------------------- */
/*  Editable content                                                          */
/* -------------------------------------------------------------------------- */

export type SitePageContent = {
  /** Menu label override — empty keeps the built-in label. */
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Extra paragraphs, separated by a blank line. */
  body: string;
  /** Image path/URL (e.g. "/media/legacy/…") or "" for none. */
  image: string;
  /** YouTube id or full URL; "" for none. */
  video: string;
  visible: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

export const emptyPageContent: SitePageContent = {
  label: "",
  eyebrow: "",
  title: "",
  description: "",
  body: "",
  image: "",
  video: "",
  visible: true,
};

/** True when the editor holds anything worth saving. */
export function hasCustomContent(c: Partial<SitePageContent> | undefined) {
  if (!c) return false;
  return Boolean(c.label || c.eyebrow || c.title || c.description || c.body || c.image || c.video)
    || c.visible === false;
}

/** Merge a stored override over the empty defaults, dropping unknown types. */
export function mergePageContent(raw: Partial<SitePageContent> | undefined): SitePageContent {
  const out: SitePageContent = { ...emptyPageContent };
  if (!raw) return out;
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  out.label = text(raw.label);
  out.eyebrow = text(raw.eyebrow);
  out.title = text(raw.title);
  out.description = text(raw.description);
  out.body = text(raw.body);
  out.image = text(raw.image);
  out.video = text(raw.video);
  out.visible = raw.visible !== false;
  if (raw.updatedAt) out.updatedAt = String(raw.updatedAt);
  if (raw.updatedBy) out.updatedBy = String(raw.updatedBy);
  return out;
}

/** Accepts "https://youtu.be/ID", "…watch?v=ID", "…/embed/ID" or a bare id. */
export function extractVideoId(input: string) {
  const value = input.trim();
  if (!value) return "";
  const patterns = [
    /youtu\.be\/([\w-]{6,})/,
    /[?&]v=([\w-]{6,})/,
    /\/embed\/([\w-]{6,})/,
    /\/shorts\/([\w-]{6,})/,
  ];
  for (const re of patterns) {
    const m = value.match(re);
    if (m) return m[1];
  }
  return /^[\w-]{6,}$/.test(value) ? value : "";
}

/** Blank-line separated paragraphs → array. */
export function contentParagraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/*  Menu helpers (client-safe)                                                */
/* -------------------------------------------------------------------------- */

export type NavOverride = { label?: string; visible?: boolean };

type NavChild = { label: string; href: string; desc?: string };
type NavItem = { label: string; href: string; children?: readonly NavChild[] };

/**
 * Applies the editor's label + visibility choices to the header menu.
 * Items without an override pass through untouched.
 */
export function applyNavOverrides(
  nav: readonly NavItem[],
  overrides: Record<string, NavOverride>,
): NavItem[] {
  const state = (href: string) => {
    const id = pageIdForHref(href);
    const o = id ? overrides[id] : undefined;
    return { visible: o?.visible !== false, label: o?.label?.trim() || undefined };
  };

  return nav
    .map((item) => {
      const own = state(item.href);
      const children = item.children
        ?.map((child) => {
          const kid = state(child.href);
          return kid.visible ? { ...child, label: kid.label || child.label } : null;
        })
        .filter((child): child is NavChild => Boolean(child));
      return {
        ...item,
        label: own.label || item.label,
        children: children?.length ? children : undefined,
        visible: own.visible,
      };
    })
    .filter((item) => item.visible)
    .map(({ visible: _visible, ...item }) => item);
}
