import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Convert any latin digits inside a string to Bengali numerals. */
export function bn(value: number | string): string {
  return String(value).replace(/\d/g, (d) => bnDigits[Number(d)]);
}

const bnMonthsLong = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];
const bnMonthsShort = [
  "জানু", "ফেব", "মার্চ", "এপ্রি", "মে", "জুন",
  "জুল", "আগ", "সেপ", "অক্টো", "নভে", "ডিসে",
];
const bnWeekdays = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

function isoParts(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const date = new Date(iso);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/**
 * Deterministic Bengali date formatting.
 *
 * Intl "bn-BD" data differs between Node and browsers (e.g. জানুয়ারি vs
 * জানুয়ারী), which caused React hydration mismatches. Formatting the parts
 * ourselves keeps server and client output byte-identical.
 */
export function formatBnDate(iso: string, opts: { weekday?: "long" | "short"; day?: "numeric"; month?: "long" | "short" | "numeric"; year?: "numeric" } = {}) {
  const { year, month, day } = isoParts(iso);
  const monthName = opts.month === "short" ? bnMonthsShort[month - 1] : bnMonthsLong[month - 1];
  const includeYear = "year" in opts ? opts.year !== undefined : true;
  const weekday = opts.weekday ? bnWeekdays[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] : "";
  return [
    weekday ? `${weekday},` : "",
    `${bn(day)} ${monthName}${includeYear ? `, ${bn(year)}` : ""}`,
  ].filter(Boolean).join(" ");
}

export function timeAgoBn(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${bn(mins)} মিনিট আগে`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${bn(hours)} ঘণ্টা আগে`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${bn(days)} দিন আগে`;
  return formatBnDate(iso);
}

export function readingTimeBn(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
