export type PollOption = { id: string; label: string; votes: number };
export type Poll = {
  id: string;
  question: string;
  description: string;
  options: PollOption[];
  status: "active" | "closed";
  closesAt?: string;
  category: string;
  totalVotes?: number;
};

export const seedPolls: Poll[] = [
  {
    id: "poll-1",
    question: "আপনার এলাকার সবচেয়ে জরুরি সমস্যা কোনটি?",
    description: "আপনার একটি ভোট আমাদের ২০২৭ সালের অগ্রাধিকার নির্ধারণে সাহায্য করবে।",
    options: [
      { id: "water", label: "নিরাপদ পানি ও স্যানিটেশন", votes: 412 },
      { id: "road", label: "সড়ক ও যোগাযোগ", votes: 336 },
      { id: "health", label: "স্বাস্থ্যসেবা ও অ্যাম্বুলেন্স", votes: 271 },
      { id: "education", label: "শিক্ষা ও বৃত্তি", votes: 198 },
      { id: "safety", label: "মাদক ও নিরাপত্তা", votes: 154 },
    ],
    status: "active",
    closesAt: "2026-11-30T18:00:00.000Z",
    category: "অগ্রাধিকার",
  },
  {
    id: "poll-2",
    question: "অনলাইন সেবার মধ্যে কোনটি সবার আগে চালু করা উচিত?",
    description: "ইউনিয়ন পরিষদের ১১টি সেবার মধ্যে প্রথম ধাপে কোনটি অনলাইনে আনব?",
    options: [
      { id: "birth", label: "জন্ম ও মৃত্যু নিবন্ধন", votes: 288 },
      { id: "warish", label: "ওয়ারিশ সনদ", votes: 341 },
      { id: "vata", label: "ভাতা ও সামাজিক নিরাপত্তা আবেদন", votes: 219 },
      { id: "trade", label: "ট্রেড লাইসেন্স", votes: 87 },
    ],
    status: "active",
    closesAt: "2026-12-15T18:00:00.000Z",
    category: "ডিজিটাল সেবা",
  },
  {
    id: "poll-3",
    question: "আসন্ন কোন ইভেন্টে আপনি অংশ নিতে চান?",
    description: "সর্বাধিক ভোট পাওয়া ইভেন্টে অতিরিক্ত ব্যবস্থা নেওয়া হবে।",
    options: [
      { id: "manifesto", label: "ম্যানিফেস্টো উন্মোচন (১৪ নভে)", votes: 176 },
      { id: "health", label: "ফ্রি মেডিকেল ক্যাম্প (৮ নভে)", votes: 162 },
      { id: "cricket", label: "যুব ক্রিকেট লিগ ফাইনাল (২১ নভে)", votes: 143 },
      { id: "bootcamp", label: "স্বেচ্ছাসেবক বুটক্যাম্প (২৮ নভে)", votes: 98 },
    ],
    status: "active",
    closesAt: "2026-11-10T18:00:00.000Z",
    category: "ইভেন্ট",
  },
  {
    id: "poll-4",
    question: "মহাদান ইউনিয়নে যুবদের জন্য কোন উদ্যোগ সবচেয়ে জরুরি?",
    description: "গত মাসের জরিপ — ১,২৪০ জন অংশ নিয়েছিলেন।",
    options: [
      { id: "freelance", label: "ফ্রিল্যান্সিং ও আইটি প্রশিক্ষণ", votes: 512 },
      { id: "sports", label: "ক্রীড়া ও সাংস্কৃতিক সুযোগ", votes: 384 },
      { id: "jobs", label: "স্থানীয় কর্মসংস্থান", votes: 344 },
    ],
    status: "closed",
    category: "যুব",
  },
];

export const pollArchiveSummary = {
  totalPolls: 12,
  totalVotes: 8640,
  participants: 5230,
  lastUpdated: "2026-10-18",
};
