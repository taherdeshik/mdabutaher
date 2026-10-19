# মোঃ আবু তাহের — মহাদান ইউনিয়ন প্রচারণা প্ল্যাটফর্ম

মহাদান ইউনিয়নের চেয়ারম্যান পদপ্রার্থী **মোঃ আবু তাহের**-এর জন্য একটি আধুনিক, মোবাইল-ফার্স্ট
প্রচারণা ও নাগরিক সেবা প্ল্যাটফর্ম। পুরোনো সাইট (`mdabutaher.com`) এর কনটেন্ট ও কাঠামো
নতুন ডিজাইন সিস্টেমে পুনর্নির্মাণ করা হয়েছে, সাথে যোগ হয়েছে সম্পূর্ণ নতুন সেবা ও CRM।

## দ্রুত শুরু

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # প্রোডাকশন বিল্ড
npm run typecheck
```

ডেটা `data/db.json`-এ সংরক্ষিত হয় (প্রথম রিকোয়েস্টে স্বয়ংক্রিয়ভাবে তৈরি)। প্রোডাকশনে
`src/lib/store.ts`-এর `read()` ও `mutate()` ফাংশন দুটিকে Postgres/Supabase দিয়ে প্রতিস্থাপন
করলেই বাকি কোড অপরিবর্তিত থাকবে।

### ডেমো পাসকোড
- কর্মী CRM: `/admin` → পাসকোড `mahadan-2027` (পরিবর্তন: `ADMIN_KEY` env)

## টেক স্ট্যাক

| স্তর | প্রযুক্তি |
|---|---|
| ফ্রেমওয়ার্ক | Next.js 15 (App Router, RSC) |
| ভাষা | TypeScript (strict) |
| স্টাইল | Tailwind CSS v4 (`@theme` টোকেন) |
| অ্যানিমেশন | Framer Motion |
| আইকন | Lucide |
| ভ্যালিডেশন | Zod |
| ফন্ট | Anek Bangla (বাংলা) + Inter (ল্যাটিন), self-hosted |
| ডেটা | JSON ফাইল স্টোর (প্লাগেবল) |

## পেজ ম্যাপ

| রুট | বিবরণ |
|---|---|
| `/` | হিরো, দ্রুত সেবা, পরিসংখ্যান, পরিচিতি, ম্যানিফেস্টো, প্রচারণা, ইভেন্ট, কার্যক্রম, জরিপ, ব্লগ, মতামত |
| `/about` | জীবনী, দক্ষতা, সক্ষমতা, টাইমলাইন, শিক্ষা/অভিজ্ঞতা, FAQ |
| `/manifesto` | ৮ স্তম্ভ এক্সপ্লোরার, ৩২ অঙ্গীকার, রোডম্যাপ |
| `/campaign` | ৪ ধাপ, ওয়ার্ডভিত্তিক কভারেজ, সাপ্তাহিক রুটিন, স্বেচ্ছাসেবক ফর্ম |
| `/events`, `/events/[id]` | ফিল্টারযোগ্য ইভেন্ট ক্যালেন্ডার + রেজিস্ট্রেশন |
| `/activities`, `/activities/[id]` | কার্যক্রম গ্রিড/লিস্ট + বিস্তারিত |
| `/news`, `/news/[id]` | প্রেস কভারেজ |
| `/blog`, `/blog/[slug]` | অ্যাডভান্সড ব্লগ: সার্চ, ফিল্টার, রিডিং প্রগ্রেস, রিঅ্যাকশন |
| `/gallery` | ছবি/পোস্টার/ভিডিও গ্যালারি + লাইটবক্স |
| `/polls` | জনমত জরিপ ও লাইভ ফলাফল |
| `/appointment`, `/appointment/status` | ৪-ধাপ বুকিং + স্ট্যাটাস লুকআপ |
| `/feedback`, `/feedback/board` | সমস্যা/পরামর্শ/হুমকি রিপোর্ট + পাবলিক বোর্ড |
| `/chat` | পূর্ণ-পাতার চ্যাট (উইজেটও সব পাতায় আছে) |
| `/contact` | ফর্ম, ম্যাপ, যোগাযোগের চ্যানেল |
| `/privacy` | গোপনীয়তা নীতি |
| `/admin` | CRM: ড্যাশবোর্ড, অ্যাপয়েন্টমেন্ট, রিপোর্ট, লিড, বার্তা |

## API

| মেথড | রুট | কাজ |
|---|---|---|
| GET/POST | `/api/appointments` | স্লট চেক, ফোন লুকআপ, বুকিং |
| GET/POST | `/api/feedback` | পাবলিক বোর্ড, রিপোর্ট জমা |
| POST | `/api/feedback/[id]/support` | সমর্থন ভোট |
| GET | `/api/polls` | লাইভ ফলাফল |
| POST | `/api/polls/[id]/vote` | ভোট (ফিঙ্গারপ্রিন্ট-সীমিত) |
| POST | `/api/events/[id]/register` | ইভেন্ট রেজিস্ট্রেশন |
| POST | `/api/volunteers` | স্বেচ্ছাসেবক ফর্ম |
| POST | `/api/contact`, `/api/chat`, `/api/newsletter` | বার্তা ও সাবস্ক্রিপশন |
| GET | `/api/calendar/ics` | সব ইভেন্ট ICS |
| GET | `/api/stats` | পাবলিক পরিসংখ্যান |
| POST | `/api/admin/login` | পাসকোড লগইন |
| GET | `/api/admin/overview` | CRM ডেটা |
| PATCH | `/api/admin/{appointments,feedback,leads}/[id]` | স্ট্যাটাস আপডেট |
| GET | `/api/admin/export?type=` | CSV এক্সপোর্ট |

সব POST রুটে IP-ভিত্তিক রেট লিমিট ও Zod ভ্যালিডেশন আছে।

## ডিজাইন সিস্টেম

- **রঙ:** `night` / `forest` / `emerald` / `gold` / `cream` — সব `src/app/globals.css`-এ `@theme` টোকেন।
- **কম্পোনেন্ট:** `src/components/ui/*` — Button, Section, Reveal, Counter, SmartImage, Accordion, PageHero, Form।
- **মোশন:** সব অ্যানিমেশন `prefers-reduced-motion` মানে।
- **অ্যাক্সেসিবিলিটি:** স্কিপ লিংক, ফোকাস রিং, ARIA লেবেল, সেমান্টিক হেডিং।

## অডিট ও পরিকল্পনা

- [`docs/01-EXISTING-SITE-AUDIT.md`](docs/01-EXISTING-SITE-AUDIT.md) — পুরোনো সাইটের স্ক্রিনশট ও ফিচার ইনভেন্টরি
- [`docs/02-FEATURES-COMPARISON.md`](docs/02-FEATURES-COMPARISON.md) — পুরোনো vs নতুন ফিচার ম্যাট্রিক্স
- [`docs/03-DESIGN-SYSTEM.md`](docs/03-DESIGN-SYSTEM.md) — ভিজ্যুয়াল ভাষা ও UI প্যাটার্ন
- [`docs/04-DEVELOPMENT-PLAN.md`](docs/04-DEVELOPMENT-PLAN.md) — ধাপে ধাপে এজেন্ট ডেভেলপমেন্ট প্ল্যান
- [`docs/05-CONTENT-GUIDE.md`](docs/05-CONTENT-GUIDE.md) — কনটেন্ট এডিট করার নির্দেশিকা

## লিগ্যাসি অডিট ক্যাপচার

`scripts/capture-audit.mjs` GitHub Actions-এ চলে (`.github/workflows/capture-legacy-audit.yml`) —
সাইটটি স্যান্ডবক্স থেকে সরাসরি অ্যাক্সেসযোগ্য নয়, তাই রানার থেকে ক্যাপচার করে artifact হিসেবে
সংরক্ষণ করা হয়। `audit/manifest.json`-এ প্রতিটি পেজের টেক্সট, নেভ, ফর্ম ও ছবির তালিকা থাকে।
