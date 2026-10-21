# ০৮ · শেয়ার্ড হোস্টিং (cPanel) ডিপ্লয় গাইড

> লক্ষ্য: সাইটটি cPaneল-এর **Node.js App (Passenger)**-এ চালানো, ডেটা **MySQL/MariaDB**-তে রাখা, আলাদা ভূমিকা-ভিত্তিক লগইন চালু করা এবং নিয়মিত ব্যাকআপ রাখা।
> Vercel/Netlify এখানে ব্যবহার করা হবে না — কোনো serverless ফাংশন বা edge-only ফিচারের ওপর নির্ভরতা নেই।

---

## ১. যা লাগবে

| জিনিস | ন্যূনতম |
| --- | --- |
| cPanel | Node.js Selector / “Setup Node.js App” থাকতে হবে |
| Node.js | ২০ বা তার বেশি (২২ সুপারিশকৃত) |
| MySQL/MariaDB | ১টি ডেটাবেস + ১টি ইউজার (সব প্রিভিলেজ) |
| PHPMyAdmin | ডেটাবেস দেখতে/ব্যাকআপ নিতে |
| SSH (ঐচ্ছিক) | `npm ci`, `node scripts/db.mjs` চালাতে সুবিধা |

> **গুরুত্বপূর্ণ:** অনেক শেয়ার্ড হোস্টে ডিপ্লয় ফোল্ডারে `npm run build` চালাতে মেমরি শেষ হয়। তাই **বিল্ড নিজের কম্পিউটারে/CI-তে করে** শুধু আউটপুট আপলোড করুন (ধাপ ৪)।

---

## ২. MySQL ডেটাবেস তৈরি

1. cPanel → **MySQL® Databases**।
2. `mdabutaher` নামে ডেটাবেস তৈরি করুন → পূর্ণ নাম হবে `cpaneluser_mdabutaher`।
3. ইউজার তৈরি করুন (শক্ত পাসওয়ার্ড) → **All Privileges** দিন।
4. (ঐচ্ছিক) phpMyAdmin → SQL ট্যাবে [`docs/sql/001-civic-store.sql`](sql/001-civic-store.sql) চালান। না চালালেও অ্যাপ প্রথম অনুরোধে টেবিল নিজে তৈরি করে।

`civic_store` টেবিলে পুরো সাইটের ডেটা (পোস্ট, ভিজিট, খানা, ব্যয়, অডিট লগ, বিশ্লেষণ) একটি JSON ডকুমেন্ট হিসেবে থাকে এবং প্রতিটি পরিবর্তন **ট্রানজেকশন + রো লক**-এ হয়। ফলে একই সাথে দুইজন কাজ করলেও ডেটা নষ্ট হয় না।

---

## ৩. এনভায়রনমেন্ট ভেরিয়েবল

রিপোতে `.env.example` আছে; সেটি কপি করে `.env` বানান (রিপোতে commit করবেন না):

```bash
cp .env.example .env
```

```
NEXT_PUBLIC_SITE_URL=https://mdabutaher.com
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=cpaneluser_campaign
MYSQL_PASSWORD=************
MYSQL_DATABASE=cpaneluser_mdabutaher
ADMIN_NAME=মোঃ আবু তাহের
ADMIN_USERNAME=admin
ADMIN_PASSWORD=************
```

- `ADMIN_USERNAME` / `ADMIN_PASSWORD` দিয়ে **প্রথম লগইনে** একবার owner অ্যাকাউন্ট তৈরি হয়। এরপর পাসওয়ার্ড বদলে এই লাইনগুলো মুছে দিতে পারেন।
- `ADMIN_KEY` শুধু পুরোনো সিঙ্গেল-কী লগইন দরকার হলে দিন; নতুন ইনস্টলে **দেবেন না**।
- cPanel Node.js App-এ env দিলে `.env` ফাইল লাগে না; দুটো একসাথে দিলে App-এর মান প্রাধান্য পায়।

---

## ৪. বিল্ড ও আপলোড

নিজের কম্পিউটারে (MySQL env ছাড়া, যাতে বিল্ড ডেটাবেসে না যায়):

```bash
npm ci
npm run build          # ৫৭টি পেজ তৈরি হয়
```

তারপর cPanel File Manager (বা FTP/SFTP) দিয়ে হোস্টিংয়ের অ্যাপ্লিকেশন ফোল্ডারে (যেমন `~/mdabutaher`) আপলোড করুন:

```
.next/            (সম্পূর্ণ)
public/
package.json
package-lock.json
next.config.ts
server.js
scripts/
docs/
```

> `node_modules/` আপলোড করার দরকার নেই — cPanel-এ `npm ci --omit=dev` চালান (ধাপ ৫)। যদি হোস্টে npm বিল্ড সীমিত হয়, শুধু `npm ci --omit=dev` চালিয়ে `node_modules` তৈরি করুন; এরপর **Restart**।

**ছবি অপ্টিমাইজেশন:** `sharp` এখন runtime ডিপেন্ডেন্সি (Next.js-এর `next/image` প্রোডাকশনে এটি দরকার)। `npm ci --omit=dev` এটি ইনস্টল করবে; লিনাক্স x64 হোস্টে প্রি-বিল্ড বাইনারি সাধারণত ঠিকঠাক নামে। ইনস্টল ব্যর্থ হলে `npm ci --omit=dev --cpu=x64 --os=linux` চেষ্টা করুন বা `images.unoptimized` চালু করুন (ধীর, কিন্তু কাজ করবে)।

---

## ৫. cPanel-এ Node.js App

1. cPanel → **Setup Node.js App** → **Create Application**।
2. Application root: `mdabutaher`
3. Application URL: `mdabutaher.com` (বা সাবডোমেইন)
4. Application startup file: **`server.js`**
5. Node version: ২০/২২ → **Create**।
6. “Run NPM Install” চাপুন (বা SSH: `cd ~/mdabutaher && npm ci --omit=dev`).
7. Environment variables-এ ধাপ ৩-এর মানগুলো দিন → **Save** → **Restart**।

`server.js` মূলত:

```js
const app = next({ dev: false, dir: __dirname });
app.prepare().then(() => createServer((req, res) => handle(req, res)).listen(PORT));
```

SSL: cPanel → **SSL/TLS Status** → AutoSSL চালু করুন। সব URL `https://`-এ রিডাইরクト হবে (`NEXT_PUBLIC_SITE_URL` ঠিক রাখুন)।

---

## ৬. পুরোনো JSON ডেটা মাইগ্রেট

যদি আগে `data/db.json`-তে ডেটা জমে থাকে:

```bash
node --env-file=.env scripts/db.mjs ping       # সংযোগ পরীক্ষা
node --env-file=.env scripts/db.mjs migrate    # data/db.json → MySQL
```

আগে থেকে ডেটা থাকলে `--force` দিন। এরপর অ্যাডমিনে ঢুকে একটি পোস্ট/ভিজিট তৈরি করে দেখুন — MySQL-এ `updated_at` বদলাবে।

MySQL-এ যাওয়ার পর `data/db.json` আর পড়া/লেখা হয় না (ফাইলটি শুধু পুরোনো ব্যাকআপ হিসেবে থাকতে পারে)।

---

## ৭. ভূমিকা ও লগইন

| ভূমিকা | ক্ষমতা |
| --- | --- |
| **প্রধান অ্যাডমিন (owner)** | সব কিছু + ব্যবহারকারী তৈরি/নিষ্ক্রিয়/মুছে ফেলা + পূর্ণ ব্যাকআপ |
| **ম্যানেজার** | মাঠ, খানা, দল, ব্যয়, চ্যালেঞ্জ, CMS, CRM, বিশ্লেষণ |
| **ওয়ার্ড ক্যাপ্টেন** | নিজের এলাকার ভিজিট, কাজ, খানা, চ্যালেঞ্জ; সেটিংস/দল/ব্যয়/বুথ সম্পাদনা বন্ধ |

- লগইন: `/admin` → ইউজারনেম + পাসওয়ার্ড (সেশন ৭ দিন, HttpOnly কুকি `mat_admin`)।
- নতুন অ্যাকাউন্ট: **সেটিংস → ব্যবহারকারী ও ভূমিকা** (শুধু owner দেখেন)।
- প্রতিটি পরিবর্তন **অডিট লগে** নামসহ জমা হয় (`সেটিংস → অডিট লগ`)।
- পাসওয়ার্ড `scrypt` দিয়ে হ্যাশ করা; সেশন টোকেন ডেটাবেসে, ব্রাউজারে `HttpOnly` কুকি।

**প্রথম দিনের কাজ:** ডিফল্ট `admin` পাসওয়ার্ড বদলানো → প্রত্যেক ক্যাপ্টেনের আলাদা অ্যাকাউন্ট → পুরোনো `ADMIN_KEY` বন্ধ করা।

---

## ৮. ব্যাকআপ

### ডাউনলোড (ম্যানুয়াল)
অ্যাডমিন → **সেটিংস → ডেটাবেস ও ব্যাকআপ → পূর্ণ ব্যাকআপ (JSON)**। শুধু owner পারবেন; ডাউনলোড অডিট লগে ওঠে।

### cPanel Cron (দৈনিক)
cPanel → **Cron Jobs** → প্রতিদিন রাত ২টা:

```bash
cd /home/cpaneluser/mdabutaher && /usr/local/bin/node --env-file=.env scripts/db.mjs backup /home/cpaneluser/backups/db-$(date +\%F).json >/dev/null 2>&1
```

৩০ দিনের পুরোনো ফাইল মুছতে আরেকটি cron:

```bash
find /home/cpaneluser/backups -name 'db-*.json' -mtime +30 -delete
```

### পুনরুদ্ধার
```bash
node --env-file=.env scripts/db.mjs restore /home/cpaneluser/backups/db-2027-01-10.json
```

### MySQL ডাম্প (ঐচ্ছিক, বড় সাইটে)
cPanel → phpMyAdmin → `civic_store` → Export। অথবা SSH: `mysqldump -u USER -p DB civic_store > civic_store.sql`.

---

## ৯. আপডেট প্রকাশ

1. ব্যাকআপ নিন (উপরের ধাপ)।
2. নতুন কোড আপলোড করুন (`.next`, `public`, `package*.json`, `server.js`)।
3. `npm ci --omit=dev` (যদি ডিপেন্ডেন্সি বদলেছে)।
4. cPanel Node App → **Restart**।
5. যাচাই: `/`, `/admin`, `/sitemap.xml`, `/api/admin/system` (লগইন করে)।

> `next start` এবং `server.js` একসাথে চালাবেন না। cPanel-এ শুধু `server.js`; VPS-এ `npm start`।

---

## ১০. শেয়ার্ড হোস্টিংয়ের সীমাবদ্ধতা ও সমাধান

| সীমাবদ্ধতা | প্রভাব | সমাধান |
| --- | --- | --- |
| Edge geo হেডার নেই | ভিজিটরের শহর অনুমানভিত্তিক | `src/lib/geo.ts` টাইমজোন থেকে দেশ/শহর অনুমান করে; সঠিক শহর চাইলে Cloudflare + `cf-ipcountry`/`cf-ipcity` হেডার ম্যাপ করুন |
| Passenger একটি প্রসেস | ইন-মেমরি রেট লিমিট প্রসেসভিত্তিক | MySQL-এ লগইন থ্রটল দরকার হলে আলাদা টেবিল; এখনকার ৮/মিনিট সীমা যথেষ্ট |
| ফাইল সিস্টেম পার্সিস্টেন্ট নয় সব হোস্টে | আপলোডেড ছবি হারাতে পারে | `public/media`-তে আপলোডের বদলে CDN/S3/Cloudinary, অথবা cPanel backup-এ `public/media` অন্তর্ভুক্ত করুন |
| বিল্ড মেমরি সীমিত | `next build` ব্যর্থ হতে পারে | লোকাল/CI বিল্ড আপলোড করুন |
| ক্রনই কেবল কমান্ড | API ব্যাকআপ শিডিউল করা কঠিন | `scripts/db.mjs backup` + cron |
| একই MySQL হোস্ট | ডেটাবেস শেয়ার্ড | আলাদা DB ইউজার, শুধু প্রয়োজনীয় প্রিভিলেজ |

---

## ১১. সমস্যা ও সমাধান

| উপসর্গ | সম্ভাব্য কারণ | সমাধান |
| --- | --- | --- |
| ৫০৩ / “Application failed to start” | ভুল startup file, Node ভার্সন, বিল্ড নেই | `server.js` নির্বাচন, `.next` আছে কিনা, Node ২০+ |
| সাইট খোলে কিন্তু ডেটা খালি | MySQL env ভুল | `npm run db:ping`, env নাম ঠিক করুন |
| `ER_ACCESS_DENIED_ERROR` | ইউজার/DB প্রিফিক্স ভুল | `cpaneluser_dbname` পূর্ণ নাম ব্যবহার |
| ছবি আপলোডের পর হারিয়ে যায় | ফাইল সিস্টেম রিসেট | মিডিয়া CDN-এ সরান |
| “অনুমতি নেই” অথচ লগইন করেছেন | পুরোনো `mat-admin-key` লোকাল স্টোরেজে | লগআউট → আবার লগইন |
| বিল্ডে `JavaScript heap out of memory` | শেয়ার্ড মেমরি | `NODE_OPTIONS=--max-old-space-size=1024` অথবা লোকাল বিল্ড |
| `Module not found: sharp` | runtime ডিপেন্ডেন্সি ইনস্টল হয়নি | `npm ci --omit=dev` পুনরায় চালান |
| ছবি অপ্টিমাইজ হচ্ছে না | sharp বাইনারি অনুপযুক্ত | `images: { unoptimized: true }` সাময়িকভাবে |

---

## ১২. নিরাপত্তা চেকলিস্ট

- [ ] ডিফল্ট `admin` পাসওয়ার্ড বদলানো হয়েছে
- [ ] প্রত্যেক ক্যাপ্টেনের আলাদা অ্যাকাউন্ট, ওয়ার্ড নির্ধারিত
- [ ] `ADMIN_KEY` env থেকে মুছে ফেলা হয়েছে
- [ ] AutoSSL চালু, `NEXT_PUBLIC_SITE_URL` = https
- [ ] db ইউজারের সব প্রিভিলেজ (শুধু দরকারি হলে সীমিত করুন)
- [ ] দৈনিক cron ব্যাকআপ + মাসিক restore টেস্ট
- [ ] `/admin` অডিট লগ সপ্তাহে একবার দেখা
- [ ] গোপনীয়তা নীতি (`/privacy`) ও বিশ্লেষণ অপ্ট-আউট লিংক ঠিক আছে

---

## ১৩. ডিপ্লয়ের পর যাচাই (৫ মিনিট)

```bash
curl -I https://mdabutaher.com/                 # 200 + https
curl -s https://mdabutaher.com/sitemap.xml | grep -c '<url>'   # ৫৬
curl -s https://mdabutaher.com/feed.xml | grep -c '<item>'     # ৩৮
curl -s -o /dev/null -w '%{http_code}\n' https://mdabutaher.com/api/admin/system   # 401 (লগইন ছাড়া)
curl -s https://mdabutaher.com/api/health        # {"ok":true,"storage":"mysql"}
```

অ্যাডমিনে লগইন করে: **সেটিংস → ডেটাবেস ও ব্যাকআপ**-এ `MySQL` ব্যাজ দেখা ⇒ সঞ্চয়স্থান ঠিক। তারপর একটি পোস্ট প্রকাশ করে পাবলিক সাইটে দেখা, একটি ভিজিট যোগ করে অডিট লগে নাম দেখা।

---

---

## ১৪. GitHub Pages (ঐচ্ছিক প্রিভিউ)

`https://taherdeshik.github.io/mdabutaher/` — পাবলিক পেজগুলোর স্ট্যাটিক মিরর, শুধু দেখানোর জন্য।

```bash
node scripts/build-ghpages.mjs --publish
git add -A && git commit -m "chore(pages): refresh static mirror" && git push
```

- API রুট, অ্যাডমিন ও ফর্ম বাদ যায়; CMS তালিকা `src/content`-এর সম্পাদকীয় কনটেন্ট থেকে তৈরি হয়।
- `basePath` ডিফল্ট `/mdabutaher`; কাস্টম ডোমেইনে `GH_PAGES_BASE="" node scripts/build-ghpages.mjs --publish`।
- আসল সাইট (ফর্ম, লগইন, ডেটাবেস) সবসময় cPanel ডিপ্লয়মেন্ট।

সম্পর্কিত: [`01-PLAN.md`](01-PLAN.md) · [`05-CONTENT-GUIDE.md`](05-CONTENT-GUIDE.md) · [`07-ANALYTICS-SEO.md`](07-ANALYTICS-SEO.md)
