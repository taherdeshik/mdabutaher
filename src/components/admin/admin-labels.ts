import { bn } from "@/lib/utils";

export const strengthLabels = {
  strong: "শক্ত ঘাঁটি",
  lean: "ঝোঁক আছে",
  swing: "দোলাচল",
  hostile: "প্রতিদ্বন্দ্বী",
} as const;

export const strengthTone = {
  strong: "emerald",
  lean: "sky",
  swing: "gold",
  hostile: "rose",
} as const;

export const visitStatusLabels = {
  "met-supportive": "সমর্থন জানিয়েছেন",
  "met-undecided": "অনিশ্চিত",
  "met-hostile": "বিরোধী মনোভাব",
  absent: "বাড়িতে কেউ ছিলেন না",
  refused: "কথা বলতে রাজি হননি",
} as const;

export const supportLabels = {
  committed: "প্রতিশ্রুত",
  leaning: "ঝোঁক",
  undecided: "অনিশ্চিত",
  hostile: "বিরোধী",
} as const;

export const roleLabels = {
  manager: "ক্যাম্পেইন ম্যানেজার",
  finance: "অর্থ সম্পাদক",
  media: "মিডিয়া সম্পাদক",
  "ward-captain": "ওয়ার্ড ক্যাপ্টেন",
  "booth-captain": "বুথ ক্যাপ্টেন",
  "household-leader": "দশ-পরিবার প্রধান",
  volunteer: "স্বেচ্ছাসেবক",
} as const;

export const taskTypeLabels = {
  meeting: "সভা / বৈঠক",
  canvass: "গণসংযোগ",
  miking: "মাইকিং",
  rally: "সমাবেশ",
  admin: "প্রশাসনিক",
  media: "মিডিয়া",
} as const;

export const priorityLabels = {
  low: "সাধারণ",
  medium: "মাঝারি",
  high: "জরুরি",
} as const;

export const challengeStatusLabels = {
  open: "খোলা",
  monitoring: "পর্যবেক্ষণে",
  resolved: "সমাধান হয়েছে",
} as const;

export const severityLabels = {
  low: "সাধারণ",
  medium: "মাঝারি",
  high: "জরুরি",
  critical: "সংকটপূর্ণ",
} as const;

export const expenseModeLabels = {
  cash: "নগদ",
  cheque: "চেক",
  bank: "ব্যাংক",
} as const;

export const postTypeLabels = {
  news: "সংবাদ",
  event: "ইভেন্ট",
  blog: "ব্লগ",
} as const;

export function bnNum(n: number) {
  return bn(n.toLocaleString("en-US"));
}

export function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${bn((n / 10_000_000).toFixed(2))} কোটি`;
  if (n >= 100_000) return `৳${bn((n / 100_000).toFixed(2))} লক্ষ`;
  if (n >= 1000) return `৳${bn(n.toLocaleString("en-US"))}`;
  return `৳${bn(n)}`;
}

export function pct(n: number) {
  return `${bn(Math.round(n * 1000) / 10)}%`;
}

export const issueOptions = [
  "রাস্তা",
  "পানি",
  "বিদ্যুৎ",
  "ভাতা কার্ড",
  "শিক্ষা",
  "স্বাস্থ্য",
  "সেচ",
  "আবাসন",
  "নিরাপত্তা",
  "অন্যান্য",
];

export const challengeCategories = [
  "অবকাঠামো",
  "পানি ও স্বাস্থ্য",
  "নিরাপত্তা",
  "ভোটার তালিকা",
  "সংগঠন",
  "আইন ও অনুমতি",
  "গুজব",
  "অন্তর্ভুক্তি",
  "অন্যান্য",
];
