import type {
  Booth,
  Challenge,
  CommandCollections,
  CommandSettings,
  Expense,
  Household,
  Post,
  Task,
  TeamMember,
  Visit,
  Ward,
} from "@/lib/command-types";

/* ------------------------------------------------------------------ *
 * Seed data for the Mahadan Union command center.
 * Demo/working data — clearly marked as sample where it is sampled.
 * Server-only: imported by src/lib/store.ts and merged on first read.
 * ------------------------------------------------------------------ */

const iso = (d: Date) => d.toISOString().slice(0, 10);
const day = (offset: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return iso(d);
};

export const seedSettings: CommandSettings = {
  pollingDate: "2027-01-15",
  rollDate: "2026-11-05",
  nominationDate: "2026-12-10",
  scrutinyDate: "2026-12-13",
  withdrawalDate: "2026-12-17",
  symbolDate: "2026-12-18",
  resultDate: "2027-01-15",
  turnoutAssumption: 72,
  spendCap: 1000000,
  unionVoters: 25540,
};

export const seedWards: Ward[] = [
  {
    id: "w1",
    no: 1,
    name: "কর্পাড়ী",
    villages: ["কর্পাড়ী", "মধ্যপাড়া", "বাদশা"],
    polygon:
      "M52 168 C52 108 88 68 148 62 L268 76 C312 82 332 112 330 160 L322 222 C318 258 292 278 250 274 L142 258 C88 250 52 218 52 168 Z",
    strength: "strong",
    turnout2021: 74,
    note: "প্রচারণার প্রধান ঘাঁটি; বাজার ও ইউনিয়ন পরিষদ এই ওয়ার্ডে।",
  },
  {
    id: "w2",
    no: 2,
    name: "সেংগুয়া",
    villages: ["সেংগুয়া", "নয়াপাড়া"],
    polygon:
      "M346 64 C396 46 500 46 566 62 L594 146 C600 194 574 232 524 238 L396 250 C352 254 336 216 338 168 Z",
    strength: "lean",
    turnout2021: 69,
    note: "নতুন ভোটার বেশি; যুব সমাবেশে সাড়া ভালো।",
  },
  {
    id: "w3",
    no: 3,
    name: "বিলবালিয়া",
    villages: ["বিলবালিয়া", "পূর্বপাড়া", "কান্দাপাড়া"],
    polygon:
      "M606 58 C672 44 768 62 808 104 L836 168 C844 216 812 254 766 260 L646 266 C606 262 590 218 596 168 Z",
    strength: "swing",
    turnout2021: 66,
    note: "মহিলা ভোটার বেশি; পানি ও ড্রেনেজ প্রধান ইস্যু।",
  },
  {
    id: "w4",
    no: 4,
    name: "মহাদান",
    villages: ["মহাদান", "বাজারপাড়া", "মিয়াপাড়া"],
    polygon:
      "M60 330 C60 288 98 296 140 300 L286 310 C326 314 344 342 338 392 L328 444 C322 482 288 494 240 484 L138 468 C92 458 62 424 60 380 Z",
    strength: "strong",
    turnout2021: 76,
    note: "সর্বোচ্চ ভোটার; কর্পাড়ী মোড়ের ব্যবসায়ী সমর্থন শক্ত।",
  },
  {
    id: "w5",
    no: 5,
    name: "তারাকান্দি",
    villages: ["তারাকান্দি", "ধনপাড়া", "শেখপাড়া"],
    polygon:
      "M356 312 L512 298 C554 296 586 320 590 370 L596 434 C598 476 566 496 518 496 L378 486 C342 482 328 452 332 406 Z",
    strength: "swing",
    turnout2021: 68,
    note: "কৃষক ভোটার নির্ধারক; সেচ ও বাজার দর ইস্যু।",
  },
  {
    id: "w6",
    no: 6,
    name: "কুড়িকাহালি",
    villages: ["কুড়িকাহালি", "হরিণদহ", "বেলগাছা"],
    polygon:
      "M608 298 L758 288 C800 290 824 326 828 376 L834 442 C836 478 804 498 758 496 L638 488 C606 484 590 454 596 408 Z",
    strength: "lean",
    turnout2021: 71,
    note: "সড়ক সংস্কার ও বিদ্যুৎ সমস্যা প্রধান।",
  },
  {
    id: "w7",
    no: 7,
    name: "জগন্নাথপুর",
    villages: ["জগন্নাথপুর", "রামনগর", "কালীবাড়ি"],
    polygon:
      "M78 548 C76 512 110 528 154 532 L292 540 C330 544 342 568 338 606 L304 622 L150 626 C102 620 80 590 78 562 Z",
    strength: "swing",
    turnout2021: 64,
    note: "ওয়ার্ড ক্যাপ্টেন পদ vacant — অগ্রাধিকার।",
  },
  {
    id: "w8",
    no: 8,
    name: "পোড়াবাড়ি",
    villages: ["পোড়াবাড়ি", "নান্দিনা", "দক্ষিণপাড়া"],
    polygon:
      "M356 540 L512 528 C554 526 584 550 586 588 L574 632 L378 636 C344 632 330 602 334 564 Z",
    strength: "lean",
    turnout2021: 70,
    note: "আর্সেনিকযুক্ত নলকূপ বেশি; পানি পরীক্ষা ক্যাম্প দরকার।",
  },
  {
    id: "w9",
    no: 9,
    name: "বাঁশতলা",
    villages: ["বাঁশতলা", "চরমহাদান", "গোপালপুর"],
    polygon:
      "M608 528 L756 520 C796 522 822 550 826 588 L800 636 L640 640 C610 636 594 608 600 568 Z",
    strength: "swing",
    turnout2021: 67,
    note: "চর এলাকায় যাতায়াত কঠিন; নৌকা ও সড়ক দুই-ই দরকার।",
  },
];

type BoothSeed = {
  code: string;
  name: string;
  ward: number;
  village: string;
  voters: number;
  visitedPct: number;
  commitPct: number;
  x: number;
  y: number;
  strength: Booth["strength"];
};

const boothSeeds: BoothSeed[] = [
  { code: "০১-ক", name: "কর্পাড়ী সরকারি প্রাথমিক বিদ্যালয়", ward: 1, village: "কর্পাড়ী", voters: 1180, visitedPct: 0.78, commitPct: 0.55, x: 140, y: 118, strength: "strong" },
  { code: "০১-খ", name: "কর্পাড়ী উচ্চ বিদ্যালয়", ward: 1, village: "মধ্যপাড়া", voters: 960, visitedPct: 0.71, commitPct: 0.49, x: 250, y: 110, strength: "strong" },
  { code: "০১-গ", name: "বাদশা দাখিল মাদরাসা", ward: 1, village: "বাদশা", voters: 840, visitedPct: 0.62, commitPct: 0.42, x: 177, y: 216, strength: "lean" },

  { code: "০২-ক", name: "সেংগুয়া সরকারি প্রাথমিক বিদ্যালয়", ward: 2, village: "সেংগুয়া", voters: 1040, visitedPct: 0.64, commitPct: 0.39, x: 418, y: 108, strength: "lean" },
  { code: "০২-খ", name: "নয়াপাড়া কমিউনিটি সেন্টার", ward: 2, village: "নয়াপাড়া", voters: 880, visitedPct: 0.52, commitPct: 0.3, x: 520, y: 112, strength: "swing" },
  { code: "০২-গ", name: "সেংগুয়া বাজার মসজিদ", ward: 2, village: "সেংগুয়া", voters: 760, visitedPct: 0.58, commitPct: 0.34, x: 468, y: 202, strength: "lean" },

  { code: "০৩-ক", name: "বিলবালিয়া পূর্বপাড়া প্রাথমিক বিদ্যালয়", ward: 3, village: "বিলবালিয়া", voters: 1220, visitedPct: 0.47, commitPct: 0.25, x: 676, y: 118, strength: "swing" },
  { code: "০৩-খ", name: "বিলবালিয়া উচ্চ বিদ্যালয়", ward: 3, village: "পূর্বপাড়া", voters: 920, visitedPct: 0.55, commitPct: 0.31, x: 778, y: 122, strength: "swing" },
  { code: "০৩-গ", name: "কান্দাপাড়া ঈদগাহ মাঠ", ward: 3, village: "কান্দাপাড়া", voters: 840, visitedPct: 0.38, commitPct: 0.18, x: 706, y: 208, strength: "hostile" },

  { code: "০৪-ক", name: "মহাদান ইউনিয়ন পরিষদ", ward: 4, village: "মহাদান", voters: 1260, visitedPct: 0.82, commitPct: 0.6, x: 148, y: 338, strength: "strong" },
  { code: "০৪-খ", name: "কর্পাড়ী মোড় বাদশা মার্কেট", ward: 4, village: "বাজারপাড়া", voters: 980, visitedPct: 0.76, commitPct: 0.54, x: 258, y: 338, strength: "strong" },
  { code: "০৪-গ", name: "মিয়াপাড়া সরকারি প্রাথমিক বিদ্যালয়", ward: 4, village: "মিয়াপাড়া", voters: 720, visitedPct: 0.69, commitPct: 0.44, x: 190, y: 428, strength: "lean" },

  { code: "০৫-ক", name: "তারাকান্দি সরকারি প্রাথমিক বিদ্যালয়", ward: 5, village: "তারাকান্দি", voters: 1100, visitedPct: 0.6, commitPct: 0.36, x: 450, y: 338, strength: "swing" },
  { code: "০৫-খ", name: "ধনপাড়া মসজিদ ও মাদরাসা", ward: 5, village: "ধনপাড়া", voters: 900, visitedPct: 0.49, commitPct: 0.27, x: 540, y: 340, strength: "swing" },
  { code: "০৫-গ", name: "শেখপাড়া নিম্ন মাধ্যমিক বিদ্যালয়", ward: 5, village: "শেখপাড়া", voters: 780, visitedPct: 0.54, commitPct: 0.3, x: 452, y: 438, strength: "lean" },

  { code: "০৬-ক", name: "কুড়িকাহালি সরকারি প্রাথমিক বিদ্যালয়", ward: 6, village: "কুড়িকাহালি", voters: 1120, visitedPct: 0.57, commitPct: 0.33, x: 690, y: 338, strength: "lean" },
  { code: "০৬-খ", name: "হরিণদহ উচ্চ বিদ্যালয়", ward: 6, village: "হরিণদহ", voters: 860, visitedPct: 0.44, commitPct: 0.22, x: 780, y: 340, strength: "swing" },
  { code: "০৬-গ", name: "বেলগাছা ঈদগাহ মাঠ", ward: 6, village: "বেলগাছা", voters: 740, visitedPct: 0.51, commitPct: 0.28, x: 700, y: 428, strength: "lean" },

  { code: "০৭-ক", name: "জগন্নাথপুর সরকারি প্রাথমিক বিদ্যালয়", ward: 7, village: "জগন্নাথপুর", voters: 1060, visitedPct: 0.41, commitPct: 0.2, x: 168, y: 558, strength: "swing" },
  { code: "০৭-খ", name: "রামনগর দাখিল মাদরাসা", ward: 7, village: "রামনগর", voters: 980, visitedPct: 0.36, commitPct: 0.16, x: 270, y: 560, strength: "lean" },
  { code: "০৭-গ", name: "কালীবাড়ি কমিউনিটি ক্লিনিক", ward: 7, village: "কালীবাড়ি", voters: 820, visitedPct: 0.32, commitPct: 0.14, x: 228, y: 602, strength: "swing" },

  { code: "০৮-ক", name: "পোড়াবাড়ি সরকারি প্রাথমিক বিদ্যালয়", ward: 8, village: "পোড়াবাড়ি", voters: 1180, visitedPct: 0.55, commitPct: 0.31, x: 448, y: 560, strength: "lean" },
  { code: "০৮-খ", name: "নান্দিনা উচ্চ বিদ্যালয়", ward: 8, village: "নান্দিনা", voters: 900, visitedPct: 0.47, commitPct: 0.24, x: 540, y: 568, strength: "swing" },
  { code: "০৮-গ", name: "দক্ষিণপাড়া মসজিদ মাঠ", ward: 8, village: "দক্ষিণপাড়া", voters: 760, visitedPct: 0.39, commitPct: 0.19, x: 478, y: 612, strength: "hostile" },

  { code: "০৯-ক", name: "বাঁশতলা সরকারি প্রাথমিক বিদ্যালয়", ward: 9, village: "বাঁশতলা", voters: 1020, visitedPct: 0.58, commitPct: 0.32, x: 698, y: 558, strength: "lean" },
  { code: "০৯-খ", name: "চরমহাদান নিম্ন মাধ্যমিক বিদ্যালয়", ward: 9, village: "চরমহাদান", voters: 940, visitedPct: 0.43, commitPct: 0.21, x: 782, y: 560, strength: "swing" },
  { code: "০৯-গ", name: "গোপালপুর ঈদগাহ মাঠ", ward: 9, village: "গোপালপুর", voters: 780, visitedPct: 0.35, commitPct: 0.15, x: 740, y: 612, strength: "swing" },
];

const wardById = new Map(seedWards.map((w) => [w.no, w]));

const booths: Booth[] = boothSeeds.map((b, i) => {
  const ward = wardById.get(b.ward)!;
  const female = Math.round(b.voters * 0.505);
  const male = b.voters - female;
  const households = Math.round(b.voters / 4.35);
  const visited = Math.round(households * b.visitedPct);
  const committed = Math.round(households * b.commitPct);
  return {
    id: `b${String(i + 1).padStart(2, "0")}`,
    code: b.code,
    name: b.name,
    wardId: ward.id,
    village: b.village,
    centre: b.name,
    voters: b.voters,
    male,
    female,
    youth: Math.round(b.voters * (0.28 + ((i % 4) * 0.015))),
    firstTime: Math.round(b.voters * (0.045 + ((i % 5) * 0.006))),
    households,
    visited,
    committed,
    strength: b.strength,
    x: b.x,
    y: b.y,
  };
});

/* ------------------------------ team ------------------------------ */

const firstNames = [
  "আব্দুল", "মোঃ", "মোছাঃ", "রফিকুল", "শাহাদাত", "নাসরিন", "রহিমা", "জাহাঙ্গীর",
  "আনোয়ার", "ফরিদা", "সেলিম", "মমতাজ", "হাবিব", "কামরুল", "শিরিন", "তানভীর",
  "জসিম", "রুবেল", "আকতার", "পারভীন", "ইসমাইল", "খাদিজা", "বাবুল", "মিনা",
  "সোহেল", "লাভলী", "আবুল", "মেরিনা", "সাইফুল", "রোকেয়া",
];
const lastNames = [
  "ইসলাম", "হোসেন", "বেগম", "মিয়া", "আক্তার", "মোল্লা", "শেখ", "তালুকদার",
  "সরকার", "প্রামাণিক", "হাওলাদার", "কবির", "উদ্দিন", "খাতুন",
];

const personName = (i: number) =>
  `${firstNames[i % firstNames.length]} ${lastNames[(i * 3 + 1) % lastNames.length]}`;

const team: TeamMember[] = [
  { id: "t-manager", name: "শাহাদাত হোসেন", phone: "01711223344", role: "manager", status: "active", joinedAt: "2026-08-02" },
  { id: "t-finance", name: "মোছাঃ নাসরিন আক্তার", phone: "01811223344", role: "finance", status: "active", joinedAt: "2026-08-05" },
  { id: "t-media", name: "তানভীর আহমেদ", phone: "01911223344", role: "media", status: "active", joinedAt: "2026-08-10" },
];

const wardCaptains = [0, 1, 2, 3, 4, 5, null, 7, 8]; // ward 7 intentionally vacant
seedWards.forEach((w, i) => {
  const idx = wardCaptains[i];
  if (idx === null) return;
  const member: TeamMember = {
    id: `t-wc-${w.no}`,
    name: personName(6 + i),
    phone: `017${String(15000000 + i * 8642).slice(0, 8)}`,
    role: "ward-captain",
    wardId: w.id,
    status: "active",
    joinedAt: `2026-08-${String(12 + i).padStart(2, "0")}`,
  };
  team.push(member);
  w.captainId = member.id;
});

const captainForBooth = new Set([0, 1, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 15, 16, 17, 18, 21, 24]);
booths.forEach((b, i) => {
  if (!captainForBooth.has(i)) return;
  const member: TeamMember = {
    id: `t-bc-${i + 1}`,
    name: personName(20 + i),
    phone: `018${String(23000000 + i * 7153).slice(0, 8)}`,
    role: "booth-captain",
    wardId: b.wardId,
    boothId: b.id,
    status: "active",
    joinedAt: `2026-09-${String(2 + (i % 26)).padStart(2, "0")}`,
  };
  team.push(member);
  b.captainId = member.id;
});

for (let i = 0; i < 8; i++) {
  team.push({
    id: `t-vol-${i + 1}`,
    name: personName(8 + i * 2),
    phone: `016${String(33000000 + i * 9182).slice(0, 8)}`,
    role: i < 3 ? "household-leader" : "volunteer",
    wardId: seedWards[i % seedWards.length].id,
    status: i === 7 ? "pending" : "active",
    joinedAt: `2026-09-${String(10 + i).padStart(2, "0")}`,
  });
}

/* --------------------------- households --------------------------- */

const households: Household[] = [];
const visits: Visit[] = [];
let householdSeq = 0;

booths.forEach((b, boothIndex) => {
  const sample = 15;
  const visitedCount = Math.max(2, Math.round(sample * (b.visited / b.households)));
  const committedCount = Math.max(1, Math.round(sample * (b.committed / b.households)));
  for (let k = 0; k < sample; k++) {
    const id = `h-${b.id}-${k + 1}`;
    const visited = k < visitedCount;
    const committed = k < committedCount;
    const hostile = b.strength === "hostile" && k >= sample - 2;
    const support: Household["support"] = committed
      ? "committed"
      : hostile
        ? "hostile"
        : visited
          ? k % 3 === 0
            ? "undecided"
            : "leaning"
          : "undecided";
    const issues: string[] = [];
    if (k % 4 === 0) issues.push("পানি");
    if (k % 5 === 0) issues.push("রাস্তা");
    if (k % 7 === 0) issues.push("ভাতা কার্ড");
    const h: Household = {
      id,
      boothId: b.id,
      wardId: b.wardId,
      village: b.village,
      head: personName(boothIndex * 3 + k + 2),
      phone: k % 3 === 0 ? `017${String(50000000 + householdSeq * 137).slice(0, 8)}` : undefined,
      members: 3 + ((k + boothIndex) % 5),
      status: hostile ? "hostile" : committed ? "committed" : visited ? "visited" : "unvisited",
      support,
      issues,
      route: k + 1,
      lastVisit: visited ? day(-((k % 9) + 1)) : undefined,
      followUp: visited && k % 4 === 0 ? (k % 8 === 0 ? day(-1 - (k % 3)) : day(2 + (k % 5))) : undefined,
      note: committed ? "পরিবারপ্রধান মুখে সমর্থনের আশ্বাস দিয়েছেন।" : undefined,
    };
    households.push(h);
    householdSeq += 1;

    if (visited) {
      visits.push({
        id: `v-seed-${id}`,
        householdId: h.id,
        boothId: b.id,
        wardId: b.wardId,
        by: b.captainId ? team.find((t) => t.id === b.captainId)?.name || "বুথ ক্যাপ্টেন" : "ওয়ার্ড ক্যাপ্টেন",
        status: h.support === "committed" ? "met-supportive" : h.support === "hostile" ? "met-hostile" : "met-undecided",
        issues,
        promise: k % 3 === 0 ? "পানি পরীক্ষার তারিখ জানানো হবে" : undefined,
        followUp: h.followUp,
        note: k % 5 === 0 ? "নারী সদস্যদের সাথে আলাদা আলোচনা হয়েছে।" : undefined,
        createdAt: new Date(`${h.lastVisit}T10:${String(10 + (k % 45)).padStart(2, "0")}:00`).toISOString(),
      });
    }
  }
});

/* ----------------------------- tasks ------------------------------ */

const tasks: Task[] = [
  { id: "task-1", title: "সকালের ক্যাপ্টেন হাডল — সাপ্তাহিক পরিকল্পনা", type: "meeting", date: day(0), time: "08:30", assignee: "শাহাদাত হোসেন", priority: "high", done: false, notes: "৯ ওয়ার্ড ক্যাপ্টেনের উপস্থিতি নিশ্চিত করতে হবে।" },
  { id: "task-2", title: "বিলবালিয়া পূর্বপাড়ায় উঠান বৈঠক", type: "meeting", date: day(0), time: "16:00", wardId: "w3", assignee: "ওয়ার্ড ৩ ক্যাপ্টেন", priority: "high", done: false },
  { id: "task-3", title: "তারাকান্দি বাজারে মাইকিং", type: "miking", date: day(0), time: "11:30", wardId: "w5", assignee: "মিডিয়া টিম", priority: "medium", done: false },
  { id: "task-4", title: "ওয়ার্ড ৭ ক্যাপ্টেন নিয়োগের সাক্ষাৎকার", type: "admin", date: day(0), time: "19:00", wardId: "w7", assignee: "শাহাদাত হোসেন", priority: "high", done: false },
  { id: "task-5", title: "কর্পাড়ী বাজারে গণসংযোগ", type: "canvass", date: day(0), time: "17:00", wardId: "w1", assignee: "ওয়ার্ড ১ ক্যাপ্টেন", priority: "medium", done: true },
  { id: "task-6", title: "ম্যানিফেস্টো উন্মোচন প্রস্তুতি সভা", type: "meeting", date: day(1), time: "10:00", wardId: "w4", assignee: "তানভীর আহমেদ", priority: "high", done: false },
  { id: "task-7", title: "ওয়ার্ড ৮-এ পানি পরীক্ষা ক্যাম্প", type: "meeting", date: day(2), time: "09:00", wardId: "w8", assignee: "ওয়ার্ড ৮ ক্যাপ্টেন", priority: "high", done: false },
  { id: "task-8", title: "স্বেচ্ছাসেবক প্রশিক্ষণ (দ্বিতীয় ব্যাচ)", type: "meeting", date: day(3), time: "15:00", wardId: "w4", assignee: "শাহাদাত হোসেন", priority: "medium", done: false },
  { id: "task-9", title: "ডিজিটাল কনটেন্ট ক্যালেন্ডার ফাইনাল", type: "media", date: day(3), time: "20:00", assignee: "তানভীর আহমেদ", priority: "medium", done: false },
  { id: "task-10", title: "বিলবালিয়া ব্রিজ সংস্কারের চিঠি", type: "admin", date: day(4), time: "11:00", wardId: "w3", assignee: "শাহাদাত হোসেন", priority: "high", done: false },
  { id: "task-11", title: "যুব ক্রীড়া প্রতিযোগিতা আয়োজন", type: "rally", date: day(5), time: "16:00", wardId: "w2", assignee: "ওয়ার্ড ২ ক্যাপ্টেন", priority: "low", done: false },
  { id: "task-12", title: "সাপ্তাহিক ব্যয়ের হিসাব মিলানো", type: "admin", date: day(1), time: "18:00", assignee: "মোছাঃ নাসরিন আক্তার", priority: "high", done: false },
  { id: "task-13", title: "পোস্টার লাগানোর অনুমতি যাচাই", type: "admin", date: day(2), time: "12:00", assignee: "তানভীর আহমেদ", priority: "medium", done: false },
  { id: "task-14", title: "চরমহাদান এলাকায় গণসংযোগ", type: "canvass", date: day(-1), time: "15:00", wardId: "w9", assignee: "ওয়ার্ড ৯ ক্যাপ্টেন", priority: "medium", done: true },
  { id: "task-15", title: "নারী ভোটার ফোকাস গ্রুপ", type: "meeting", date: day(-2), time: "11:00", wardId: "w6", assignee: "মোছাঃ নাসরিন আক্তার", priority: "medium", done: true },
  { id: "task-16", title: "ম্যানিফেস্টো ড্রাফট চূড়ান্ত", type: "admin", date: day(-3), time: "10:00", assignee: "মোঃ আবু তাহের", priority: "high", done: true },
];

/* ---------------------------- expenses ---------------------------- */

const expenses: Expense[] = [
  { id: "exp-1", date: day(-18), category: "পোস্টার ও ব্যানার", description: "৯ ওয়ার্ডের জন্য ৫০০ পোস্টার", amount: 84000, mode: "cheque", voucher: "V-1041", by: "মোছাঃ নাসরিন আক্তার" },
  { id: "exp-2", date: day(-14), category: "সভা ও উঠান বৈঠক", description: "কর্পাড়ী উঠান বৈঠক — চা-নাস্তা", amount: 26500, mode: "cash", voucher: "V-1042", by: "মোছাঃ নাসরিন আক্তার" },
  { id: "exp-3", date: day(-12), category: "মাইকিং", description: "ওয়ার্ড ১ ও ৪ মাইকিং (৪ দিন)", amount: 31500, mode: "cash", voucher: "V-1043", by: "তানভীর আহমেদ" },
  { id: "exp-4", date: day(-10), category: "ডিজিটাল প্রচার", description: "ফেসবুক বুস্ট ও ভিডিও সম্পাদনা", amount: 45000, mode: "bank", voucher: "V-1044", by: "তানভীর আহমেদ" },
  { id: "exp-5", date: day(-8), category: "যাতায়াত", description: "ক্যাম্প অফিস — চর এলাকা যাতায়াত", amount: 38000, mode: "cash", voucher: "V-1045", by: "শাহাদাত হোসেন" },
  { id: "exp-6", date: day(-6), category: "সভা ও উঠান বৈঠক", description: "ওয়ার্ড ৫ কৃষক সমাবেশ", amount: 52000, mode: "bank", voucher: "V-1046", by: "মোছাঃ নাসরিন আক্তার" },
  { id: "exp-7", date: day(-5), category: "এজেন্ট ফি", description: "২৭ বুথ এজেন্ট প্রথম কিস্তি", amount: 60000, mode: "cheque", voucher: "V-1047", by: "মোছাঃ নাসরিন আক্তার" },
  { id: "exp-8", date: day(-4), category: "খাবার", description: "স্বেচ্ছাসেবক প্রশিক্ষণ খাবার", amount: 22000, mode: "cash", voucher: "V-1048", by: "শাহাদাত হোসেন" },
  { id: "exp-9", date: day(-3), category: "অফিস", description: "ক্যাম্প অফিস ভাড়া (অক্টোবর)", amount: 24000, mode: "bank", voucher: "V-1049", by: "মোছাঃ নাসরিন আক্তার" },
  { id: "exp-10", date: day(-2), category: "পোস্টার ও ব্যানার", description: "বিলবালিয়া স্ট্যান্ড ব্যানার ৪টি", amount: 18500, mode: "cash", voucher: "V-1050", by: "তানভীর আহমেদ" },
  { id: "exp-11", date: day(-1), category: "যাতায়াত", description: "গাড়ি ভাড়া — ম্যানিফেস্টো প্রস্তুতি", amount: 14500, mode: "cash", voucher: "V-1051", by: "শাহাদাত হোসেন" },
  { id: "exp-12", date: day(0), category: "সভা ও উঠান বৈঠক", description: "বিলবালিয়া উঠান বৈঠক — প্যান্ডেল", amount: 32000, mode: "cheque", voucher: "V-1052", by: "মোছাঃ নাসরিন আক্তার" },
];

/* --------------------------- challenges --------------------------- */

const challenges: Challenge[] = [
  { id: "ch-1", title: "বিলবালিয়া ব্রিজের রেলিং ঝুঁকিপূর্ণ", detail: "বর্ষায় পিচ্ছিল রেলিং; শিশুদের পারাপারের ঝুঁকি। এলাকাবাসী দ্রুত মেরামত দাবি করছেন।", wardId: "w3", boothId: "b07", category: "অবকাঠামো", severity: "critical", status: "open", owner: "ওয়ার্ড ৩ ক্যাপ্টেন", createdAt: day(-6), updatedAt: day(-1), resolution: "" },
  { id: "ch-2", title: "ওয়ার্ড ৮-এ ৯টি নলকূপে আর্সেনিক", detail: "পানি পরীক্ষায় ৯টি নলকূপে আর্সেনিক মাত্রা বেশি পাওয়া গেছে; বিকল্প উৎস নেই।", wardId: "w8", category: "পানি ও স্বাস্থ্য", severity: "high", status: "monitoring", owner: "ওয়ার্ড ৮ ক্যাপ্টেন", createdAt: day(-9), updatedAt: day(-2), resolution: "একটি কমিউনিটি ফিল্টার স্থাপনের প্রস্তাব পাঠানো হয়েছে।" },
  { id: "ch-3", title: "যুবদের মধ্যে মাদকের প্রবণতা", detail: "কুড়িকাহালি বাজারে তরুণদের আড্ডায় মাদক ব্যবহারের অভিযোগ।", wardId: "w6", category: "নিরাপত্তা", severity: "high", status: "open", owner: "মিডিয়া টিম", createdAt: day(-4), updatedAt: day(-4), resolution: "" },
  { id: "ch-4", title: "ভোটার তালিকায় ১৪ জনের নাম নেই", detail: "নতুন ভোটারদের নাম তালিকায় না থাকায় সংশোধন আবেদন প্রক্রিয়া দরকার।", wardId: "w2", category: "ভোটার তালিকা", severity: "medium", status: "monitoring", owner: "শাহাদাত হোসেন", createdAt: day(-7), updatedAt: day(-3), resolution: "৮ জনের তথ্য সংগ্রহ করা হয়েছে।" },
  { id: "ch-5", title: "ওয়ার্ড ৭ ক্যাপ্টেন পদ vacant", detail: "গণসংযোগ শুরুর আগে ওয়ার্ড ক্যাপ্টেন নিয়োগ জরুরি।", wardId: "w7", category: "সংগঠন", severity: "medium", status: "open", owner: "শাহাদাত হোসেন", createdAt: day(-3), updatedAt: day(-3), resolution: "" },
  { id: "ch-6", title: "মাইকিং অনুমতিতে দেরি", detail: "ইউনিয়ন পরিষদ থেকে অনুমতি পেতে ৩ দিন সময় লাগছে; সময়সূচি পিছিয়ে যাচ্ছে।", category: "আইন ও অনুমতি", severity: "low", status: "open", owner: "তানভীর আহমেদ", createdAt: day(-2), updatedAt: day(-2), resolution: "" },
  { id: "ch-7", title: "সোশ্যাল মিডিয়ায় গুজব", detail: "ভুয়া পরিসংখ্যানসহ একটি পোস্ট ছড়াচ্ছে; দ্রুত প্রতিবাদ দরকার।", category: "গুজব", severity: "high", status: "monitoring", owner: "মিডিয়া টিম", createdAt: day(-1), updatedAt: day(0), resolution: "ফ্যাক্ট-চেক পোস্ট তৈরি হচ্ছে।" },
  { id: "ch-8", title: "শেখপাড়া সড়কের কাজ থেমে আছে", detail: "গত বছর শুরু হওয়া সড়কের কাজ ৪ মাস ধরে বন্ধ; ঠিকাদার পালিয়েছেন।", wardId: "w5", category: "অবকাঠামো", severity: "medium", status: "open", owner: "ওয়ার্ড ৫ ক্যাপ্টেন", createdAt: day(-11), updatedAt: day(-5), resolution: "" },
  { id: "ch-9", title: "বৃদ্ধ ভোটারদের যাতায়াত সমস্যা", detail: "ওয়ার্ড ৯-এ নৌকা ঘাট থেকে ভোটকেন্দ্র পর্যন্ত হাঁটার পথ কাদাময়।", wardId: "w9", category: "অন্তর্ভুক্তি", severity: "low", status: "resolved", owner: "ওয়ার্ড ৯ ক্যাপ্টেন", createdAt: day(-15), updatedAt: day(-6), resolution: "ভোটের দিন যাতায়াত সহায়তার তালিকা তৈরি হয়েছে।" },
];

/* ------------------------------ posts ----------------------------- */

const posts: Post[] = [
  {
    id: "post-1",
    type: "news",
    title: "ম্যানিফেস্টো উন্মোচন ১৪ নভেম্বর — সবাইকে আমন্ত্রণ",
    slug: "manifesto-unveil-14-nov",
    excerpt: "৮ স্তম্ভ ও ৩২ অঙ্গীকারের নির্বাচনী ম্যানিফেস্টো উন্মোচিত হবে মহাদান ইউনিয়ন পরিষদ মাঠে।",
    body: [
      "আগামী ১৪ নভেম্বর বিকাল ৪টায় মহাদান ইউনিয়ন পরিষদ মাঠে ম্যানিফেস্টো উন্মোচন অনুষ্ঠান অনুষ্ঠিত হবে।",
      "অনুষ্ঠানে শিক্ষা, নিরাপদ পানি, স্বাস্থ্য, অবকাঠামো, নিরাপত্তা, কৃষি, ডিজিটাল সেবা ও অন্তর্ভুক্তি — এই আট স্তম্ভে ৩২টি সুনির্দিষ্ট অঙ্গীকার উপস্থাপন করা হবে।",
      "সকল ওয়ার্ডের ভোটার, যুব প্রতিনিধি ও নারী নেতৃত্বকে আমন্ত্রণ জানানো হয়েছে।",
    ],
    image: "campaign",
    status: "published",
    date: day(1),
    tags: ["ম্যানিফেস্টো", "অনুষ্ঠান"],
    outlet: "ক্যাম্প অফিস",
    venue: "মহাদান ইউনিয়ন পরিষদ মাঠ",
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "post-2",
    type: "event",
    title: "উঠান বৈঠক — তারাকান্দি ধনপাড়া",
    slug: "courtyard-tarakandi",
    excerpt: "কৃষি, সেচ ও বাজার দর নিয়ে কৃষক পরিবারগুলোর সাথে খোলা আলোচনা।",
    body: ["তারাকান্দি ধনপাড়ায় কৃষক পরিবারগুলোর সাথে উঠান বৈঠক হবে।", "সেচ, বীজ সহায়তা ও বাজার দর নিয়ে সরাসরি মত বিনিময় করা হবে।"],
    image: "community",
    status: "published",
    date: day(3),
    tags: ["উঠান বৈঠক", "কৃষি"],
    venue: "ধনপাড়া ঈদগাহ মাঠ",
    location: "তারাকান্দি, ওয়ার্ড ৫",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "post-3",
    type: "blog",
    title: "দরজায় দরজায় কেন যাচ্ছি",
    slug: "why-door-to-door",
    excerpt: "প্রচারণা মানে শুধু মঞ্চ নয় — 각 বাড়ির চৌকাঠে দাঁড়িয়ে মানুষের সমস্যা শোনাই আসল কাজ।",
    body: [
      "নির্বাচনের আগে অনেক প্রার্থী বড় মঞ্চ আর মাইকে কথা বলেন। কিন্তু মানুষের আসল সমস্যা থাকে রান্নাঘরে, নলকূপের পাশে, সন্তানের স্কুলের পথে।",
      "তাই আমরা দরজায় দরজায় যাচ্ছি। প্রতিটি খানায় জিজ্ঞেস করছি — এই বছর আপনার সবচেয়ে বড় কষ্ট কী?",
      "এই তালিকা থেকেই তৈরি হচ্ছে ওয়ার্ডভিত্তিক অগ্রাধিকার। কোনো প্রতিশ্রুতি দেওয়ার আগে আমরা সমস্যাটা লিখে নিচ্ছি, দায়িত্ব নিচ্ছি এবং সময়সীমা দিচ্ছি।",
      "যে রাজনীতি মানুষের দরজা থেকে শুরু হয়, সে রাজনীতি ক্ষমতায় গিয়েও মানুষের কথা মনে রাখে।",
    ],
    image: "campaign2",
    status: "published",
    date: day(-2),
    tags: ["প্রচারণা", "গণসংযোগ"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "post-4",
    type: "news",
    title: "নিরাপদ পানির ৫০ টিউবওয়েল প্রকল্প — সম্ভাব্যতা যাচাই চলছে",
    slug: "water-project-feasibility",
    excerpt: "ওয়ার্ড ৩, ৬ ও ৮-এ আর্সেনিকমুক্ত পানির উৎস চিহ্নিত করার কাজ শুরু হয়েছে।",
    body: ["আর্সেনিকমুক্ত পানির জন্য ৫০টি টিউবওয়েলের সম্ভাব্যতা যাচাই শুরু হয়েছে।", "প্রথম ধাপে সবচেয়ে ঝুঁকিপূর্ণ ৯টি নলকূপের পানি পরীক্ষা করা হবে।"],
    image: "water",
    status: "draft",
    date: day(0),
    tags: ["পানি", "প্রকল্প"],
    outlet: "প্রচারণা ডেস্ক",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function seedCollections(): CommandCollections {
  return {
    settings: structuredClone(seedSettings),
    wards: structuredClone(seedWards),
    booths: structuredClone(booths),
    households: structuredClone(households),
    visits: structuredClone(visits),
    team: structuredClone(team),
    tasks: structuredClone(tasks),
    expenses: structuredClone(expenses),
    challenges: structuredClone(challenges),
    posts: structuredClone(posts),
    audit: [],
  };
}
