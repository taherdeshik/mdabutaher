# Django সংস্করণ — স্থাপত্য, ফিচার তালিকা ও স্থাপন নির্দেশিকা

এই দলিল Next.js (`arena/9badc21b-mdabutaher`) থেকে Django রূপান্তরের অবস্থা বর্ণনা করে।

## ১. স্থাপত্য

- **Django 5.1+** — রাউটিং, ORM, সেশন/অথেনটিকেশন, CSRF, মাইগ্রেশন।
- **ডেটা:** আগে একটি JSON ডকুমেন্ট (MySQL বা `data/db.json`) ছিল। এখন প্রতিটি সংগ্রহের জন্য আলাদা মডেল
  (`civic/models.py`)। **PostgreSQL** (সুপারিশকৃত), MySQL/MariaDB বা SQLite — `settings.py` এ নির্বাচিত হয়:
  `POSTGRES_HOST` + `POSTGRES_DB` থাকলে PostgreSQL, তারপর `MYSQL_HOST` + `MYSQL_DATABASE` থাকলে MySQL,
  কিছুই না থাকলে SQLite (`data/db.sqlite3`, শুধু ডেভেলপমেন্ট)।
- **কন্টেন্ট:** TypeScript ফাইল থেকে `content/data/*.json` বানানো হয়েছে (`core/content.py` লোড করে)।
- **ফ্রন্টএন্ড:** সার্ভার-রেন্ডার্ড Django টেমপ্লেট + অল্প ভ্যানিলা JS (`static/js/site.js`)। ফর্মগুলো JSON API-তে পাঠায়
  এবং বাংলা বার্তা দেখায়। Framer Motion-এর মতো অ্যানিমেশনের বদলে CSS ট্রানজিশন।
- **স্টাইল:** Tailwind CSS v4 (`assets/css/app.css` → `static/css/app.css`)।
- **স্ট্যাটিক ফাইল:** WhiteNoise (প্রোডাকশনে hashed + gzip)। `collectstatic` লাগে।
- **অ্যাপ্লিকেশন সার্ভার:** Gunicorn (লোকাল/VPS) বা Passenger (cPanel)।

## ২. ফিচার অবস্থা

### সম্পন্ন

| এলাকা | ফিচার |
| --- | --- |
| পাবলিক পাতা | `/`, `/about`, `/manifesto` (+ `/manifesto/print`), `/campaign`, `/events` (+ বিস্তারিত ও ICS), `/activities` (+ বিস্তারিত), `/news` (+ বিস্তারিত), `/blog` (+ বিস্তারিত, খোঁজ, বিভাগ, ট্যাগ, সাজানো), `/gallery` (লাইটবক্স, পোস্টার, ভিডিও), `/polls`, `/appointment` (+ `/appointment/status`), `/feedback` (+ `/feedback/board`), `/chat`, `/contact`, `/media-kit`, `/privacy` (+ ভিজিটর অপ্ট-আউট), ৪০৪ পাতা |
| জনসেবা API | অ্যাপয়েন্টমেন্ট (তারিখ/সময় প্রাপ্যতা, ৪-জনের সীমা, শুক্রবার নিয়ম, মোবাইল দিয়ে খোঁজা), অভিযোগ/পরামর্শ/হুমকি (ছবিসহ, ট্র্যাকিং আইডি, বোর্ড, সমর্থন), জরিপ ভোট (একবার/ডিভাইস), ইভেন্ট আসন ও রেজিস্ট্রেশন, স্বেচ্ছাসেবক, যোগাযোগ, নিউজলেটার, চ্যাট, `stats`, `health`, `calendar/ics` |
| CRM লিড | একই ফোনে একটি লিড, উৎস/স্টেজ/নোট, সব ফর্ম থেকে স্বয়ংক্রিয় লিড তৈরি |
| ড্যাশবোর্ড | লগইন/লগআউট (সেশন), CRM পাতা (অ্যাপয়েন্টমেন্ট, অভিযোগ + টাইমলাইন, লিড, বার্তা, স্বেচ্ছাসেবক, রেজিস্ট্রেশন, নিউজলেটার), স্ট্যাটাস পরিবর্তন, নোট, পঠিত চিহ্ন, CSV রপ্তানি (BOM সহ), কার্যক্রম লগ |
| ভিজিটর পরিসংখ্যান | কুকিহীন ভিউ ট্র্যাকিং (`/api/track`), বট ফিল্টার, ডিভাইস/ব্রাউজার/OS, দেশ/শহর (CDN হেডার বা টাইমজোন), রেফারার, ৭/৩০/৯০ দিনের রেঞ্জ, সেশন ভিত্তিক তথ্য। কোনো IP সংরক্ষণ হয় না |
| ব্যবহারকারী | owner / manager / captain ভূমিকা, ওয়ার্ড ভিত্তিক ক্যাপ্টেন, owner-এর জন্য তৈরি/মোছা, প্রথম owner `ADMIN_*` env থেকে |
| ব্যাকআপ | owner-এর জন্য সম্পূর্ণ JSON ব্যাকআপ (পাসওয়ার্ড হ্যাশ ছাড়া) |
| SEO | `sitemap.xml`, `robots.txt`, `feed.xml` (RSS), `manifest.webmanifest`, canonical, Open Graph, `Person` JSON-LD |
| নিরাপত্তা | CSRF (অ্যাডমিন), সেশন কুকি HttpOnly/Secure, রেট লিমিট (IP ভিত্তিক), নিরাপত্তা হেডার, প্রোডাকশনে HSTS ও HTTPS রিডাইরেক্ট |
| পুরোনো ডেটা | `python manage.py import_legacy db.json` (idempotent) |
| কনটেন্ট ম্যানেজমেন্ট | `/admin/content`: সব তথ্য (১৫টি JSON), পাতার লেখা (`{% cms %}` ব্লক), মিডিয়া লাইব্রেরি (ছবি/ভিডিও/অডিও, আপলোড ও লিংক), সংস্করণ-যাচাই সহ সংরক্ষণ। বিস্তারিত: ৩ক-এর পরে “কনটেন্ট ম্যানেজমেন্ট”। |

### স্থগিত / আংশিক (সৎভাবে জানানো)

| এলাকা | অবস্থা |
| --- | --- |
| **কমান্ড সেন্টার (`/admin` এর ~২২টি মডিউল)** | **স্থগিত।** ওয়ার্ড, বুথ, পরিবার, ভিজিট, টিম, টাস্ক, ব্যয়, চ্যালেঞ্জ, পোস্ট, সেটিংস, সিচুয়েশন রুম ইত্যাদি। `src/lib/command-types.ts`, `src/content/command-seed.ts` ও `src/app/admin/*` এর মডেল ও UI পরবর্তী ধাপে যোগ হবে। এখন `/admin` হলো CRM ড্যাশবোর্ড। |
| লিগ্যাসি CRM (`/admin/crm`) | CRM পাতার সাথে একীভূত; আলাদা পাতা নেই। |
| ডাইনামিক OG ইমেজ | স্থির হিরো ছবি ব্যবহার হয়। |
| PWA সার্ভিস ওয়ার্কার, ঘোষণা টিকার | নেই। Manifest আছে। |
| ব্লগ রিঅ্যাকশন | শুধু ব্রাউজারে (localStorage) — আগের মতোই স্থির ছিল। |
| ড্যাশবোর্ড ব্যবহারকারীর পাসওয়ার্ড আমদানি | হয় না (ভিন্ন হ্যাশ ফরম্যাট)। নতুন করে তৈরি করুন। |
| অ্যানিমেশন ও প্যারালাঙ্ক | Framer Motion-এর বদলে সাধারণ CSS। |
| ব্রাউজার/ভিজ্যুয়াল QA | স্বয়ংক্রিয় টেস্ট (৮৪টি) আছে। কনটেন্ট এডিটরের UI jsdom দিয়ে লাইভ সার্ভারের বিপক্ষে চালানো হয়েছে; আসল ব্রাউজারে ছবি/ভিডিও আপলোড ও দৃশ্যমান মিল হাতে যাচাই এখনও বাকি। |

## ৩. পরীক্ষা

```bash
python manage.py test      # ৮৪টি টেস্ট: CMS, API ভ্যালিডেশন, রেট লিমিট, পেজ রেন্ডার, ড্যাশবোর্ড অনুমতি, ইম্পোর্ট
```

## ৩ক. PostgreSQL

```bash
pip install -r requirements-postgres.txt
export POSTGRES_HOST=127.0.0.1 POSTGRES_DB=mahadan POSTGRES_USER=mahadan POSTGRES_PASSWORD=...
python manage.py migrate        # প্রথমবার: টেবিল তৈরি + owner অ্যাকাউন্ট
python manage.py test           # টেস্ট একটি আলাদা `test_mahadan` DB-তে চলে (CREATEDB অধিকার লাগে)
```

- `GET /api/health/` ও `GET /api/admin/system/` এ `storage` = `postgresql` দেখায়।
- ঐচ্ছিক: `POSTGRES_SSLMODE` (যেমন `require`), `POSTGRES_PORT` (ডিফল্ট ৫৪৩২), `POSTGRES_CONN_MAX_AGE` (ডিফল্ট ৬০ সেকেন্ড)।
- পরীক্ষিত: PostgreSQL 16.2 (লোকাল)  — ৮৪টি টেস্ট পাস, `migrate` ও `import_legacy` (দুইবার চালিয়ে idempotent) সফল।
- লিগ্যাসি JSON ইম্পোর্ট ও নতুন ডেটা লেখা সব ডেটাবেস-এ একই কোড ব্যবহার করে; মডেলের প্রাইমারি কি বেশিরভাগ `CharField`
  (যেমন `APT-…`), তাই ইম্পোর্টে ID হাতে দিলে PostgreSQL সিকোয়েন্স নিয়ে সমস্যা হয় না।

## ৩ক-খ. কনটেন্ট ম্যানেজমেন্ট

ড্যাশবোর্ডের **কনটেন্ট** (`/admin/content`) শুধু owner ও manager ব্যবহার করতে পারেন। তিনটি ট্যাব:

- **তথ্য ও তালিকা:** `content/data/*.json` এর ১৫টি ডকুমেন্ট ডেটাবেসে (`ContentDocument`) থাকে। ফর্মে বদলানো যায়, অথবা কাঁচা JSON। প্রতিটি সংরক্ষণে সংস্করণ বাড়ে; দুজন একসাথে বদলালে দ্বিতীয়জনের সংরক্ষণ ৪০৯-এর মতো “অন্য কেউ বদলেছেন” বার্তা দিয়ে আটকায়। “মূল অবস্থায় ফেরান” কোডের সাথে আসা JSON-এ ফেরায়। কী-এর ক্রম (যেমন ফুটারের দ্রুত লিংক) সংরক্ষিত থাকে। অবৈধ গঠন (মুছে ফেলা কী, ডুপ্লিকেট আইডি, ভুল ধরন) সংরক্ষিত হয় না।
- **পাতার লেখা:** পাবলিক টেমপ্লেটের `{% cms "key" %}…{% endcms %}` ব্লকগুলো। খালি রাখলে মূল লেখা দেখায়। এখানে শুধু পাতার বাংলা লেখা আছে; JavaScript ও API-র বার্তা এখনও কোডে আছে।
- **মিডিয়া লাইব্রেরি:** ছবি (≤১৫ MB; JPG/PNG/WebP/GIF), ভিডিও (MP4/WebM), অডিও (MP3/M4A/OGG/WAV/FLAC, ≤৬০ MB) আপলোড, অথবা YouTube/Vimeo/সরাসরি ফাইলের লিংক। ফাইলের শুরুর বাইট ধরনের সাথে মিলিয়ে দেখা হয়। কোনো তথ্যে ব্যবহৃত ফাইল মোছা যায় না; সাইটের সাথে আসা ১১৬টি ছবি মোছা যায় না।

**ভিডিও ও অডিও:** যেকোনো ব্লগ, সংবাদ, কার্যক্রম, ইভেন্ট বা গ্যালারি আইটেমে `video` (ও অডিওর জন্য `audio`) ফিল্ড যোগ করা যায়; পাতায় সেটি এম্বেড হয়। মূল কোডে আগে শুধু YouTube আইডি ছিল (গ্যালারি), এখন সেটি স্বয়ংক্রিয়ভাবে YouTube লিংকে রূপান্তর হয়। মূল সোর্সে কোনো অডিও ফাইল ছিল না।

**ফাইল সংরক্ষণ:** `MEDIA_ROOT` (ডিফল্ট: প্রজেক্টের `uploads/`, Git-এর বাইরে) থেকে `/uploads/…` URL-এ Django সার্ভ করে; ভিডিও সিকিংয়ের জন্য HTTP Range সাপোর্ট আছে। cPanel-এ `MEDIA_ROOT` লেখার যোগ্য আলাদা ফোল্ডারে রাখুন এবং ডেটাবেসের সাথে এটিও ব্যাকআপ নিন। বড় ট্রাফিকে ফাইল সার্ভ করতে চাইলে পরে এটি স্ট্যাটিক/CDN-এ সরানো যায়।

পরীক্ষা: `python manage.py test cms dashboard`।

## ৪. cPanel-এ স্থাপন

1. **ডেটাবেস:** PostgreSQL হলে সার্ভারে একটি DB ও ইউজার তৈরি করুন (`CREATE ROLE ... LOGIN PASSWORD ...`,
   `CREATE DATABASE ... OWNER ...`)। cPanel-এ MySQL ব্যবহার করলে cPanel → MySQL Databases-এ DB ও ইউজার বানান।
2. **Setup Python App:** Python 3.11+ নির্বাচন করুন। Application root = প্রজেক্ট ফোল্ডার।
   Startup file: `passenger_wsgi.py`, Application callable: `application`।
3. **Dependencies:** virtualenv সক্রিয় করে PostgreSQL হলে `pip install -r requirements-postgres.txt`,
   MySQL হলে `pip install -r requirements-mysql.txt`।
4. **Secrets:** প্রজেক্টে `.env` বানান (`.env.example` থেকে কপি করে):
   `DJANGO_SECRET_KEY` (৫০+ অক্ষরের র‍্যান্ডম), `DJANGO_DEBUG=0`, `DJANGO_ALLOWED_HOSTS=mdabutaher.com,www.mdabutaher.com`,
   `SITE_URL=https://mdabutaher.com`, `POSTGRES_*` (অথবা `MYSQL_*`), `ADMIN_USERNAME`, `ADMIN_PASSWORD`।
5. **Database ও স্ট্যাটিক:**
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```
   (পুরোনো ডেটা থাকলে: `python manage.py import_legacy data/db.json --dry-run`, তারপর আসল চালান।)
6. **রিস্টার্ট:** cPanel-এ Python App “Restart” চাপুন।
7. **SSL:** AutoSSL/Let's Encrypt চালু করুন। তারপর `.env`-এ HTTPS সব সময় চালু থাকে (প্রোডাকশন মোডে)।
8. **পরীক্ষা:** `https://আপনার-ডোমেইন/api/health/` → `{"ok": true, "data": {...}}` আসা উচিত।

Node.js সার্ভারে লাগে না; CSS বিল্ড করা ফাইল রিপোজিটরিতেই আছে।

## ৫. GitHub Pages সম্পর্কে

Django একটি সার্ভার অ্যাপ্লিকেশন। GitHub Pages শুধু স্ট্যাটিক ফাইল হোস্ট করে, তাই এই ব্রাঞ্চটি সেখানে সরাসরি চলবে না।
বর্তমান লাইভ সাইট (`taherdeshik.github.io/mdabutaher`) পুরোনো ব্রাঞ্চ থেকে আসছে এবং তাতে কোনো পরিবর্তন করা হয়নি।
Django সংস্করণ চালাতে cPanel বা অন্য Python হোস্টিং লাগবে।
