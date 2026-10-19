# ভিজিটর অ্যানালিটিক্স ও SEO

## ১. ভিজিটর অ্যানালিটিক্স

### কোথায় থাকে

- প্রতিটি পেজভিউ `data/db.json` → `visitorEvents`-এ জমা হয় (সর্বশেষ ৪,০০০ ইভেন্ট রাখা হয়)।
- পাবলিক সাইটের প্রতিটি নেভিগেশনে `VisitorTracker` (client) `/api/track`-এ একটি ছোট JSON পাঠায়।
- অ্যাডমিন ড্যাশবোর্ড: `/admin` → **ভিজিটর অ্যানালিটিক্স** (`/api/admin/analytics?days=7|30|90`)।

### কী সংরক্ষণ হয়

| ফিল্ড | উদাহরণ | উৎস |
|---|---|---|
| `path` | `/news/post-1` | ব্রাউজারের পাথ |
| `session` | র‍্যান্ডম UUID | প্রতি ট্যাবে `sessionStorage` |
| `ts` | ISO টাইমস্ট্যাম্প | সার্ভার |
| `device` / `browser` / `os` | `mobile` / `Chrome` / `Android` | User-Agent পার্স |
| `country` / `region` / `city` | `BD` / `Jamalpur` / `Sarishabari` | এজ হেডার (`x-vercel-ip-*`, `cf-ip*`) |
| `referrer` | `facebook.com` | প্রথম নেভিগেশনের রেফারার |
| `lang` / `tz` | `bn-BD` / `Asia/Dhaka` | ব্রাউজার |

**সংরক্ষণ হয় না:** আইপি ঠিকানা, কুকি, নাম, ফোন, ক্রস-সাইট আইডি। লোকেশন হেডার না থাকলে টাইমজোন থেকে দেশ আন্দাজ করা হয় এবং শহর অজানা থাকে।

### প্রাইভেসি

- `Do Not Track` চালু থাকলে ট্র্যাকিং বন্ধ।
- `/privacy` পেজে **“বেনামি পরিসংখ্যান বন্ধ করুন”** বাটন — `localStorage['mat-analytics-off']=1` সেট করে।
- `/admin` ও `/api` পাথ কখনো ট্র্যাক হয় না।
- বট/ক্রলার User-Agent ফিল্টার করা হয়; `/api/track`-এ রেট লিমিট ১২০/মিনিট।

### ড্যাশবোর্ড পড়া

- **এখন অনলাইনে** — শেষ ৫ মিনিটে সক্রিয় সেশন।
- **আজকের ভিজিটর / পেজভিউ**, **৭/৩০/৯০ দিনের** ইউনিক সেশন ও ভিউ।
- **পেজ / সেশন**, **গড় সময়**, **বাউন্স রেট**।
- **শীর্ষ পেজ**, **দেশ ও শহর**, **ডিভাইস ও ব্রাউজার**, **ট্র্যাফিকের সূত্র**।
- **ভিজিটর সেশন** টেবিলে ক্লিক করলে সেই সেশনের পেজ-সিকোয়েন্স, প্রবেশ/প্রস্থান, সময়, ডিভাইস ও লোকেশন দেখা যায়।
- **সাম্প্রতিক পেজভিউ** — সর্বশেষ ৪০টি ইভেন্ট।

### প্রোডাকশনে নোট

- সিটি/দেশ পেতে হোস্টিং এজ হেডার দিতে হবে (Vercel বা Cloudflare স্বয়ংক্রিয়ভাবে দেয়)। নিজের সার্ভারে হেডার না থাকলে টাইমজোন-ভিত্তিক দেশ ও “শহর অজানা” দেখাবে।
- একাধিক ইনস্ট্যান্সে চললে `data/db.json`-এর বদলে Postgres/Supabase অ্যাডাপ্টার ব্যবহার করুন (একই `visitorEvents` শেপ)।

## ২. SEO অবকাঠামো

| ফিচার | কোথায় |
|---|---|
| বাংলা মেটাডেটা, title template, keywords | `src/app/layout.tsx`, প্রতিটি `page.tsx` |
| ক্যানোনিক্যাল URL | প্রতিটি পেজের `alternates.canonical` |
| Open Graph + Twitter কার্ড | `layout.tsx` + প্রতিটি বিস্তারিত পেজ |
| JSON-LD: Person, PoliticalParty, WebSite | `layout.tsx` |
| JSON-LD: NewsArticle, BlogPosting, Article | সংবাদ/ব্লগ/কার্যক্রম বিস্তারিত পেজ |
| JSON-LD: Event + BreadcrumbList | ইভেন্ট বিস্তারিত + সব বিস্তারিত পেজ |
| ডাইনামিক সাইটম্যাপ (CMS পোস্টসহ) | `src/app/sitemap.ts` |
| robots.txt (admin/api বাদ) | `src/app/robots.ts` |
| RSS ফিড | `src/app/feed.xml/route.ts` |
| PWA ম্যানিফেস্ট | `src/app/manifest.ts` |
| ছবির alt, lazy loading, WebP | `SmartImage`, `next/image` |

### লঞ্চ চেকলিস্ট

1. Google Search Console-এ `https://mdabutaher.com/sitemap.xml` সাবমিট করুন।
2. Facebook Sharing Debugger ও Twitter Card Validator-এ হোম ও একটি সংবাদ লিংক যাচাই করুন।
3. Rich Results Test-এ `/news/<id>`, `/blog/<slug>`, `/events/<id>` পরীক্ষা করুন।
4. `https://mdabutaher.com/feed.xml` ও `/manifest.webmanifest` খুলে দেখুন।
5. নতুন পোস্ট প্রকাশের পর সাইটম্যাপ স্বয়ংক্রিয়ভাবে আপডেট হয় (force-dynamic)।

## ৩. ফাইল ম্যাপ

```
src/lib/visitor-types.ts            ট্র্যাকিং টাইপ
src/lib/geo.ts                      দেশ/শহরের বাংলা নাম
src/app/api/track/route.ts          পাবলিক বিকন
src/app/api/admin/analytics/route.ts অ্যাগ্রিগেশন API
src/components/analytics/visitor-tracker.tsx
src/components/admin/visitor-analytics.tsx
src/app/sitemap.ts · robots.ts · manifest.ts · feed.xml/route.ts
src/lib/seo.ts · src/components/seo/json-ld.tsx
```
