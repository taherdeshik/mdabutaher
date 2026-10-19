/** Small geo helpers shared by the analytics API and the dashboard UI. */

export const countryNames: Record<string, string> = {
  BD: "বাংলাদেশ",
  IN: "ভারত",
  US: "যুক্তরাষ্ট্র",
  GB: "যুক্তরাজ্য",
  AE: "সংযুক্ত আরব আমিরাত",
  SA: "সৌদি আরব",
  QA: "কাতার",
  KW: "কুয়েত",
  OM: "ওমান",
  BH: "বাহরাইন",
  MY: "মালয়েশিয়া",
  SG: "সিঙ্গাপুর",
  CA: "কানাডা",
  AU: "অস্ট্রেলিয়া",
  IT: "ইতালি",
  FR: "ফ্রান্স",
  DE: "জার্মানি",
  NL: "নেদারল্যান্ডস",
  ES: "স্পেন",
  JP: "জাপান",
  KR: "দক্ষিণ কোরিয়া",
  CN: "চীন",
  PK: "পাকিস্তান",
  NP: "নেপাল",
  LK: "শ্রীলঙ্কা",
  TH: "থাইল্যান্ড",
  TR: "তুরস্ক",
  EG: "মিশর",
  RU: "রাশিয়া",
  BR: "ব্রাজিল",
};

const cityNames: Record<string, string> = {
  Dhaka: "ঢাকা",
  "Dhaka Division": "ঢাকা",
  Jamalpur: "জামালপুর",
  Sarishabari: "সরিষাবাড়ী",
  Mymensingh: "ময়মনসিংহ",
  Kolkata: "কলকাতা",
  Delhi: "দিল্লি",
  Mumbai: "মুম্বই",
  Dubai: "দুবাই",
  "Abu Dhabi": "আবুধাবি",
  London: "লন্ডন",
  "New York": "নিউ ইয়র্ক",
  Toronto: "টরন্টো",
  Sydney: "সিডনি",
  Singapore: "সিঙ্গাপুর",
  "Kuala Lumpur": "কুয়ালালামপুর",
  Riyadh: "রিয়াদ",
  Doha: "দোহা",
};

export function cityName(city?: string) {
  if (!city) return "";
  return cityNames[city] || city;
}

export function countryName(code?: string) {
  if (!code) return "";
  const key = code.toUpperCase();
  return countryNames[key] || key;
}

/** Flag emoji from an ISO country code. Falls back to the code itself. */
export function countryFlag(code?: string) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

export function locationText(country?: string, city?: string) {
  const parts = [city?.trim(), countryName(country)].filter(Boolean);
  return parts.join(", ") || "অজানা";
}
