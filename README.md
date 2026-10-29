# মহাদান — প্রচারণা ওয়েবসাইট (Django)

মহাদান ইউনিয়ন পরিষদ নির্বাচনের প্রচারণা ওয়েবসাইট ও কমান্ড সেন্টার। এই ব্রাঞ্চে প্রকল্পটি
**Next.js থেকে Django-তে** রূপান্তর করা হয়েছে। পাবলিক পাতা, জনসেবা ফর্ম, API, CRM,
ভিজিটর পরিসংখ্যান ও SEO ফিচার Django দিয়ে চলে। বিস্তারিত: [`docs/DJANGO.md`](docs/DJANGO.md)।

## দ্রুত শুরু (লোকাল)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate           # প্রথমবার: owner অ্যাকাউন্ট তৈরি হয়
python manage.py runserver 0.0.0.0:8000
```

- পাবলিক সাইট: <http://localhost:8000/>
- ড্যাশবোর্ড (CRM): <http://localhost:8000/admin> — ডেভেলপমেন্টে ডিফল্ট `admin` / `mahadan-2027`
  (প্রোডাকশনে `ADMIN_PASSWORD` অবশ্যই দিন)।
- Django-এর নিজস্ব অ্যাডমিন: <http://localhost:8000/django-admin/>

কনফিগারেশনের জন্য `.env.example` দেখুন। `.env` ফাইল থাকলে স্বয়ংক্রিয়ভাবে পড়া হয়।
PostgreSQL ব্যবহার করতে `POSTGRES_HOST` ও `POSTGRES_DB` (+ `POSTGRES_USER`, `POSTGRES_PASSWORD`) দিন এবং
`pip install -r requirements-postgres.txt` করুন। MySQL/MariaDB (পুরোনো cPanel) হলে `MYSQL_*` ও `requirements-mysql.txt`;
কিছুই না দিলে SQLite (`data/db.sqlite3`) ব্যবহার হয়। বিস্তারিত: `docs/DJANGO.md` → PostgreSQL।

## CSS বিল্ড (ঐচ্ছিক)

Tailwind CSS-এর কম্পাইল করা ফাইল `static/css/app.css` রিপোজিটরিতে আছে, তাই সার্ভারে Node লাগে না।
টেমপ্লেট বদলালে আবার বানান:

```bash
npm install
npm run build:css
```

## প্রোজেক্টের কাঠামো

| পথ | কাজ |
| --- | --- |
| `mahadan/` | Django প্রজেক্ট: settings, URL, WSGI/ASGI |
| `core/` | পাবলিক পাতা (views), কন্টেন্ট লোডার, SEO (sitemap, RSS, manifest, robots), মিডলওয়্যার, Bengali ফিল্টার |
| `civic/` | ডেটা মডেল (অ্যাপয়েন্টমেন্ট, অভিযোগ, বার্তা, লিড, ভোট, ভিজিটর…), ফর্ম-ভ্যালিডেশন, পাবলিক JSON API |
| `dashboard/` | লগইন, CRM ড্যাশবোর্ড, ভিজিটর পরিসংখ্যান, ব্যবহারকারী ব্যবস্থাপনা, ব্যাকআপ, CSV export |
| `content/data/*.json` | প্রচারণার সব লেখা/তথ্য (আগের TypeScript কন্টেন্ট থেকে তৈরি) — কোড না বদলে এখানে বদলান |
| `templates/` | HTML টেমপ্লেট (Tailwind) |
| `static/` | CSS, JS, ফন্ট, ছবি (WhiteNoise দিয়ে সার্ভ হয়) |
| `assets/css/app.css` | Tailwind-এর সোর্স (theme ও কাস্টম utility) |
| `passenger_wsgi.py` | cPanel “Setup Python App” এর এন্ট্রি পয়েন্ট |

## পরীক্ষা

```bash
python manage.py test
```

## ডেটা স্থানান্তর (পুরোনো Next.js সাইট থেকে)

পুরোনো `data/db.json` থাকলে:

```bash
python manage.py import_legacy path/to/db.json --dry-run   # শুধু গণনা
python manage.py import_legacy path/to/db.json             # লেখা
```

আইডি/ফোন/ইমেইল দিয়ে মেলানো হয়, তাই আবার চালালে ডুপ্লিকেট হয় না। ড্যাশবোর্ড ব্যবহারকারী আমদানি হয় না (পাসওয়ার্ড ফরম্যাট আলাদা)।

## লাইসেন্স / ডেটা

ছবি ও কন্টেন্ট প্রচারণার নিজস্ব। ক্রেডিট ও লাইসেন্স বিবরণ `content/data/media.json` এ আছে।
