# ০৯ · Python + PostgreSQL সংস্করণ

> **কী:** পুরো সাইটটি এখন **Django 5.2 (Python)** দিয়ে তৈরি, ডেটাবেস **PostgreSQL**।
> আগের Next.js/React অ্যাপটি (এবং তার MySQL/JSON স্টোর) রিপোতে অপরিবর্তিত আছে —
> দুটিই একসাথে চলতে পারে। নতুন অ্যাপের ঠিকানা: `python/` ফোল্ডার।

---

## 1. দুই সংস্করণের তুলনা

| বিষয় | আগের অ্যাপ (Node) | নতুন অ্যাপ (Python) |
|---|---|---|
| ভাষা | TypeScript / React | **Python 3.11+** |
| ফ্রেমওয়ার্ক | Next.js 15 | **Django 5.2** |
| ডেটাবেস | MySQL/MariaDB বা `data/db.json` | **PostgreSQL** (নাহলে লোকালে SQLite) |
| টেমপ্লেট | React কম্পোনেন্ট | Django templates (সার্ভার-রেন্ডার্ড HTML) |
| স্টাইল | Tailwind (বিল্ড লাগে) | হাতে লেখা CSS (কোনো বিল্ড স্টেপ নেই) |
| অ্যাডমিন | React কমান্ড সেন্টার + `/api/admin/command` | Django ড্যাশবোর্ড + ফর্ম (`/admin/`) |
| পাবলিক URL | একই | **হুবহু একই** (`/`, `/manifesto/`, `/news/<slug>/`, …) |

সাইটের লেখা, ছবি, ইভেন্ট, ম্যানিফেস্টো, গ্যালারি, টিকার — সব ডেটা
`src/content/*.ts` থেকে `python/seed/content.json`-এ হুবহু অনুলিপি করা হয়েছে,
তাই দেখতে ও পড়তে কোনো পার্থক্য নেই।

---

## 2. ফোল্ডার কাঠামো

```
python/
├─ manage.py
├─ requirements.txt          Django, psycopg (PostgreSQL), Pillow, gunicorn, whitenoise
├─ .env.example              কনফিগারেশনের নমুনা
├─ campaign/                 সেটিংস, URL, WSGI/ASGI
├─ accounts/                 কাস্টম ব্যবহারকারী + ভূমিকা (admin/manager/captain/volunteer)
├─ content/                  পোস্ট, ইভেন্ট, ম্যানিফেস্টো, গ্যালারি, টিকার, মিডিয়া
│   ├─ management/commands/  seed_content · import_legacy
│   └─ services.py           পাবলিক কনটেন্ট রেজলভার (DB + কোডের ডিফল্ট)
├─ crm/                      ওয়ার্ড, পরিবার, অ্যাপয়েন্টমেন্ট, অভিযোগ, চ্যাট, জরিপ, ভিজিটর
├─ web/                      পাবলিক ভিউ, ফর্ম, টেমপ্লেট ট্যাগ, টেস্ট
├─ dashboard/                কমান্ড সেন্টার (১৫টি সেকশন)
├─ api/                      ছোট JSON API (`/api/site/ticker/`, `/api/health/`)
├─ templates/                base + web/ + dashboard/
├─ static/                   css, js, ফন্ট (Anek Bangla), আইকন
└─ seed/content.json         কোডে থাকা সব বাংলা কনটেন্ট
```

---

## 3. লোকাল সেটআপ (PostgreSQL সহ)

```bash
# ১. ভার্চুয়াল এনভায়রনমেন্ট
cd python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# ২. PostgreSQL ডেটাবেস তৈরি (নিজের সার্ভারে)
sudo -u postgres psql -c "CREATE USER mdabutaher WITH PASSWORD 'strong-password';"
sudo -u postgres psql -c "CREATE DATABASE mdabutaher OWNER mdabutaher;"

# ৩. কনফিগার
cp .env.example .env
#   .env খুলে DATABASE_URL বসান:
#   DATABASE_URL=postgresql://mdabutaher:strong-password@127.0.0.1:5432/mdabutaher
export $(grep -v '^#' .env | xargs)      # অথবা: set -a; . ./.env; set +a

# ৪. টেবিল + ডেটা
python manage.py migrate
python manage.py seed_content            # ১৪ পোস্ট, ১১ ইভেন্ট, ৮ স্তম্ভ, গ্যালারি, ওয়ার্ড…
python manage.py collectstatic --noinput # শুধু প্রোডাকশনে দরকার

# ৫. চালু
python manage.py runserver 0.0.0.0:8000
```

খুলুন → `http://localhost:8000` (সাইট) এবং `http://localhost:8000/admin/` (কমান্ড সেন্টার)।
ডিফল্ট লগইন: **admin / mahadan-2027** — প্রথমেই সেটিংস → পাসওয়ার্ড পরিবর্তন করুন।

> `DATABASE_URL` না দিলে অ্যাপ **SQLite** (`python/db.sqlite3`) ব্যবহার করে —
> শুধু ডেমো/টেস্টের জন্য। প্রোডাকশনে সবসময় PostgreSQL দিন।

**PostgreSQL কোথায় পাবেন (ম্যানেজড, সহজ):**

| সার্ভিস | কেমন | নোট |
|---|---|---|
| **Supabase** | ফ্রি টিয়ার | Prisma-স্টাইল pooler URL, `?sslmode=require` দিন |
| **Neon** | ফ্রি টিয়ার, serverless | `ep-….aws.neon.tech`, `sslmode=require` |
| **Railway / Render** | পেইড, সহজ | সার্ভিসের ভেতরেই Postgres অ্যাড-on |
| **নিজের VPS** | পূর্ণ নিয়ন্ত্রণ | `apt install postgresql`, নিচের ৭ নং দেখুন |

> **cPanel নোট:** শেয়ার্ড cPanel-এ সাধারণত PostgreSQL সার্ভার থাকে না।
> তাই দুইটি পথ — (ক) শেয়ার্ড হোস্টিংয়ে Django + **দূরের ম্যানেজড Postgres**
> (Supabase/Neon), অথবা (খ) VPS-এ PostgreSQL + gunicorn + nginx।
> আগের Node অ্যাপ + MySQL পথটি এখনো কাজ করে, চাইলে সেটাই চালিয়ে যেতে পারেন।

---

## 4. পুরোনো ডেটা নিয়ে আসা (`data/db.json`)

আগের Next.js অ্যাপ চালালে `data/db.json` তৈরি হয় (MySQL ব্যবহার করলে সেটি এক্সপোর্ট করুন)।
সব কিছু এক কমান্ডে আনা যায়:

```bash
python manage.py import_legacy --dry-run       # আগে দেখুন কী কী আসবে
python manage.py import_legacy                 # ../data/db.json থেকে
python manage.py import_legacy --path /home/user/backup/db.json
```

যা যা আসে: ব্লগ/সংবাদ পোস্ট (রিচ লেখাসহ), CMS ইভেন্ট, গ্যালারির ছবি/পোস্টার/ভিডিও
(এবং কোনগুলো লুকানো ছিল), সাইট-পেজ ও হোমপেজের লেখা, ইভেন্ট/স্তম্ভের সম্পাদনা,
টিকারের লাইন ও মোড, অ্যাপয়েন্টমেন্ট, অভিযোগ/পরামর্শ, ভিজিটর-ইভেন্ট এবং নির্বাচনী সেটিংস।
একই ফাইল দুইবার চালালেও ডুপ্লিকেট হয় না (slug/আইডি ধরে আপসার্ট)।

---

## 5. কমান্ড সেন্টার (`/admin/`)

| সেকশন | কাজ |
|---|---|
| সারসংক্ষেপ | ভোটার, কভারেজ, ব্যয়, আজকের কাজ, আসন্ন ইভেন্ট, নতুন বার্তা |
| ওয়ার্ড ও কভারেজ | ৯ ওয়ার্ড, ভোটকেন্দ্র, পরিবার-তালিকা, স্কিমেটিক ম্যাপ |
| দৈনিক পরিকল্পনা | কাজ যোগ/সম্পন্ন/মুছে ফেলা, সময়-পার হওয়া কাজ |
| দল ও স্বেচ্ছাসেবক | সদস্য, ভূমিকা, ওয়ার্ড, মোবাইল |
| চ্যালেঞ্জ ও সহায়তা | সমস্যা, গুরুত্ব, অবস্থা + আইনি নির্দেশিকা |
| ব্যয় ট্র্যাকার | খরচ যোগ, খাতভিত্তিক চার্ট, ২০,০০০+ টাকায় **চেক-সতর্কতা** |
| কনটেন্ট স্টুডিও | ব্লগ/সংবাদ তৈরি ও সম্পাদনা, রিচ টেক্সট, কভার আপলোড |
| সাইট কনটেন্ট | ২০টি পেজের শিরোনাম/বর্ণনা/ছবি/ভিডিও/দৃশ্যমানতা |
| হোমপেজ সেকশন | ১২টি ব্লকের লেখা ও দেখানো/লুকানো |
| গ্যালারি | ছবি/পোস্টার/ভিডিও যোগ, লুকানো, মোছা, আপলোড |
| ইভেন্ট ও ম্যানিফেস্টো | প্রতিটি ইভেন্ট ও প্রতিটি স্তম্ভ আলাদাভাবে |
| নিউজ টিকার | চালু/বন্ধ, অটো/নিজের তালিকা, ক্রম, লুকানো, রিসেট + লাইভ প্রিভিউ |
| CRM ও বার্তা | অ্যাপয়েন্টমেন্ট, অভিযোগ (হুমকি আলাদা), চ্যাটে উত্তর, জরিপের ফল |
| ভিজিটর অ্যানালিটিক্স | পেজভিত্তিক ভিউ, ইউনিক ভিজিটর, ডিভাইস, দেশ, রেফারার |
| সেটিংস ও রিপোর্ট | নির্বাচনী তারিখ, ব্যবহারকারী ও ভূমিকা, অডিট লগ, CSV রপ্তানি |

**ভূমিকা:** `admin` (সব), `manager` (সেটিংস ছাড়া সব), `captain` (কভারেজ, পরিকল্পনা,
দল, চ্যালেঞ্জ, CRM), `volunteer` (পরিকল্পনা, চ্যালেঞ্জ, CRM)। প্রতিটি পরিবর্তন
`AuditLog`-এ থাকে।

---

## ৫ক. ব্যবস্থাপনা কমান্ড এক নজরে

```bash
python manage.py migrate                 # টেবিল তৈরি
python manage.py seed_content            # সব বাংলা কনটেন্ট + জরিপ + ওয়ার্ড + অ্যাডমিন
python manage.py seed_content --force    # কোডের ডিফল্ট মান আবার বসায়
python manage.py seed_demo               # ড্যাশবোর্ড দেখার জন্য ডেমো CRM ডেটা
python manage.py seed_demo --clear       # ডেমো ডেটা মুছে ফেলে (আসল কাজ শুরুর আগে)
python manage.py collect_media           # ../public/media → media/ (ছবি স্বয়ংসম্পূর্ণ)
python manage.py import_legacy           # পুরোনো data/db.json নিয়ে আসা
python manage.py test web                # ২৪টি টেস্ট
```

`seed_content` সবসময় নিরাপদ — আগে থেকে থাকা লেখা মুছে দেয় না। ডেমো ডেটা
(ওয়ার্ড-ভিত্তিক কেন্দ্র, ৩২৪ পরিবার, কাজ, খরচ, চ্যাট, ভিজিটর) শুধু অনুশীলনের জন্য;
আসল ক্যাম্পেইন শুরুর আগে `seed_demo --clear` চালিয়ে পরিষ্কার করে নিন।

`collect_media` একবার চালালে পুরোনো Next.js ফোল্ডার ছাড়াই `python/` ফোল্ডার
একা চলবে — ডিপ্লয়ে আপলোডের আগে এটি চালানোই ভালো।

### Django-র নিজস্ব অ্যাডমিন (`/django-admin/`)

কমান্ড সেন্টার (`/admin/`) বাংলায় তৈরি; ডেটা-লেভেলে দ্রুত কাজ (বাল্ক এডিট, ফিল্টার,
CSV, ইনলাইন অপশন) করতে চাইলে সুপারইউজার দিয়ে `/django-admin/`-এ ঢুকুন।
এখানে সব কনটেন্ট ও CRM মডেল নিবন্ধিত — জরিপের অপশন ইনলাইন, খরচ, পরিবার,
ভিজিট-লগ, অডিট লগ (রিড-অনলি) সবই।

---

## 6. রিচ টেক্সট নিয়ম (ব্লগ/সংবাদ)

```
## বড় শিরোনাম        ### উপশিরোনাম      #### ছোট শিরোনাম
**বোল্ড**  *ইটালিক*  `কোড`  [লিংক](https://…)
- তালিকা            1. সংখ্যাযুক্ত (বাংলা ১. ২. — দুটোই চলে)
> উদ্ধৃতি            --- (আড়াআড়ি রেখা)
![ছবির নাম](/media/uploads/2026/10/ছবি.webp)
```

রেন্ডারার সব HTML escape করে, তাই `<script>` লেখা হলেও তা নিরাপদ টেক্সট হিসেবে দেখায়।
লিংক শুধু `http(s)://`, `/আপেক্ষিক`, `mailto:`, `tel:` অনুমোদিত।

---

## 7. প্রোডাকশন ডিপ্লয়

### ক) VPS (সবচেয়ে সহজ ও নির্ভরযোগ্য)

```bash
# PostgreSQL (একই সার্ভারে)
sudo apt install postgresql nginx python3-venv
sudo -u postgres createuser mdabutaher -P
sudo -u postgres createdb mdabutaher -O mdabutaher

# অ্যাপ
cd /var/www/mdabutaher/python
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env && nano .env        # DATABASE_URL, SECRET_KEY, DEBUG=0, ALLOWED_HOSTS
set -a; . ./.env; set +a
python manage.py migrate
python manage.py seed_content
python manage.py collectstatic --noinput
```

`/etc/systemd/system/mdabutaher.service`:

```ini
[Unit]
Description=Md Abu Taher campaign site (Django)
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/var/www/mdabutaher/python
EnvironmentFile=/var/www/mdabutaher/python/.env
ExecStart=/var/www/mdabutaher/python/.venv/bin/gunicorn campaign.wsgi:application \
  --bind 127.0.0.1:8001 --workers 3 --timeout 90
Restart=always

[Install]
WantedBy=multi-user.target
```

nginx:

```nginx
server {
    listen 80;
    server_name mdabutaher.com www.mdabutaher.com;
    client_max_body_size 12m;

    location /static/ { alias /var/www/mdabutaher/python/staticfiles/; expires 30d; }
    location /media/  { alias /var/www/mdabutaher/python/media/; expires 7d; }

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

তারপর `sudo systemctl enable --now mdabutaher`, এবং `certbot --nginx` দিয়ে HTTPS।

### খ) cPanel → Setup Python App (Passenger)

1. cPanel → **Setup Python App** → Create application
   - Application root: `python`
   - Application startup file: `passenger_wsgi.py`
   - Application Entry point: `application`
2. Terminal-এ:
   ```bash
   cd ~/mdabutaher/python
   source /home/USER/virtualenv/mdabutaher/python/3.11/bin/activate
   pip install -r requirements.txt
   ```
3. cPanel → Python App → **Environment variables**-এ `DATABASE_URL` (দূরের Postgres),
   `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, `DJANGO_ALLOWED_HOSTS` বসান।
4. `python manage.py migrate && python manage.py seed_content && python manage.py collectstatic --noinput`
5. Restart app।

### গ) Docker / Railway / Render

```bash
docker run -d --name mdabutaher-pg -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres:16
DATABASE_URL=postgresql://postgres:pass@127.0.0.1:5432/postgres ./start.sh
```

`start.sh` নিজেই migrate + seed + collectstatic করে gunicorn চালায়।
`Procfile`-ও দেওয়া আছে (Railway/Heroku স্টাইল)।

---

## 8. ব্যাকআপ ও রক্ষণাবেক্ষণ

```bash
# পূর্ণ ব্যাকআপ (ডেটা)
pg_dump --no-owner --format=custom "$DATABASE_URL" > backup-$(date +%F).dump

# ফেরানো
pg_restore --clean --no-owner -d "$DATABASE_URL" backup-2026-10-28.dump

# শুধু পড়ার মতো এক্সপোর্ট
pg_dump --data-only --inserts "$DATABASE_URL" > data.sql
```

আপলোড করা ছবি আলাদা ফোল্ডারে (`python/media/uploads/`) — সেটিও নিয়মিত কপি করুন।
`python manage.py dumpdata content crm --indent 2 > content.json` দিয়ে JSON ব্যাকআপও নেওয়া যায়।

**চেকলিস্ট (লাইভ করার আগে)**
- [ ] `DJANGO_DEBUG=0`, শক্ত `DJANGO_SECRET_KEY`
- [ ] `DJANGO_ALLOWED_HOSTS` ও `CSRF_TRUSTED_ORIGINS`-এ আসল ডোমেইন
- [ ] HTTPS + `DJANGO_SECURE_COOKIES=1`
- [ ] `admin`-এর পাসওয়ার্ড বদলানো, অতিরিক্ত অ্যাকাউন্ট শুধু প্রয়োজন অনুযায়ী
- [ ] প্রতিদিন `pg_dump` (cron)
- [ ] `/admin/`-এ `noindex` আছে (আছে)

---

## 9. টেস্ট

```bash
python manage.py test web -v 2      # ২৪টি টেস্ট: পেজ, ফর্ম, জরিপ, টিকার, অ্যাডমিন, রিচ টেক্সট
```

টেস্ট PostgreSQL-এও চলে (`DATABASE_URL` দিলে আলাদা টেস্ট-ডেটাবেস তৈরি হয়)।
কভার করে: সব পাবলিক পেজ, ব্লগ/সংবাদ/ইভেন্ট ডিটেইল, গ্যালারি, SEO ফাইল, অ্যাপয়েন্টমেন্ট
(বাংলা অঙ্কের ফোন নম্বরসহ), অভিযোগ, জরিপ (একবারই ভোট), চ্যাট, টিকারের তিন মোড,
অ্যাডমিনের ১৭টি সেকশন, ভূমিকা-ভিত্তিক বাধা, রিচ টেক্সট ও XSS, খরচের চেক-সতর্কতা, CSV।

---

## 10. API (ছোট, শুধু যেটুকু দরকার)

| পদ্ধতি | পথ | ফল |
|---|---|---|
| GET | `/api/health/` | `{ok, database}` |
| GET | `/api/site/ticker/` | `{ok, data:{enabled, items[]}}` |
| GET | `/api/site/summary/` | ইভেন্ট/পোস্ট/ম্যানিফেস্টোর সংক্ষিপ্ত সংখ্যা |
| GET | `/sitemap.xml`, `/robots.txt`, `/feed.xml`, `/manifest.webmanifest` | SEO |

---

## 11. প্রায়ই জিজ্ঞাসা

**প্রশ্ন: Next.js অ্যাপটা কি মুছে ফেলব?**
না — দুটোই থাকুক। `python/` নতুন অ্যাপ, রুটের Next অ্যাপ আগের মতোই চলবে।
একই ডোমেইনে দুটো একসাথে চালাতে হলে nginx-এ একটি `location` দিয়ে Python অ্যাপে পাঠান।

**প্রশ্ন: GitHub Pages মিরর?**
সেটি এখনো Next অ্যাপের স্ট্যাটিক বিল্ড (`scripts/build-ghpages.mjs`)। Python অ্যাপের
জন্য আলাদা স্ট্যাটিক মিরর দরকার হলে পরে যোগ করা যাবে — অ্যাডমিন ছাড়া সাইট হিসেবে।

**প্রশ্ন: ছবি আপলোড কোথায় যায়?**
`python/media/uploads/YYYY/MM/` — `/media/uploads/…` পাথে সার্ভ হয়। পুরোনো ছবিগুলো
`public/media/` থেকে সরাসরি পড়া হয় (কপি করতে হয় না)।

**প্রশ্ন: ব্যয়সীমা/চেক নিয়ম?**
সেটিংসে সীমা ১০,০০,০০০ টাকা; ২০,০০০ টাকা বা বেশি হলে চেক/ব্যাংক না দিলে ব্যয় পাতায়
লাল সতর্কতা দেখায়।
