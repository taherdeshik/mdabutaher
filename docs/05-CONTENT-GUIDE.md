# 05 · Content Guide & Migration Map

Everything visible on the site lives in `src/content/*.ts`. No component hard-codes copy.

---

## 1. Files and what they control

| File | Controls | Edit when |
|---|---|---|
| `site.ts` | Name, role, ward, contacts, office hours, nav, stats, bio, skills, capacities, values, FAQ, emergency numbers | Profile or contact changes |
| `manifesto.ts` | 8 pillars, 4 commitments each, targets, budgets, progress %, SDG tags, roadmap FAQ | Policy updates |
| `campaign.ts` | 4 phases, 9 ward rows, weekly rhythm, KPIs, volunteer roles, resources | Campaign plan changes |
| `events.ts` | Event list, capacity, status (`upcoming`/`past`), highlights | New rally / camp announced |
| `activities.ts` | Case studies with impact metrics | After each field activity |
| `news.ts` | Press coverage with outlet attribution | New article published |
| `blog.ts` | Posts, typed content blocks, tags, read time, views | Weekly publishing |
| `polls.ts` | Poll questions, options, seeded votes, status | New poll cycle |
| `testimonials.ts` | Quotes with name, role, area, rating | New verified quote |
| `media.ts` | `imageKey → /file` map consumed by `SmartImage` | New photo uploaded |

## 2. Adding a blog post

```ts
// src/content/blog.ts
{
  id: "p9",
  slug: "ward-3-drainage-plan",           // URL: /blog/ward-3-drainage-plan
  title: "ওয়ার্ড ৩-এর ড্রেনেজ সমস্যার সমাধান পরিকল্পনা",
  excerpt: "২০০ শব্দের কম সারাংশ — কার্ড ও মেটা ডেসক্রিপশনে ব্যবহৃত হয়।",
  category: "ডিজিটাল",                     // must exist in blogCategories
  tags: ["ড্রেনেজ", "ওয়ার্ড ৩"],
  date: "2026-10-20",                      // ISO, controls sorting
  readTime: 5,
  author: { name: "মোঃ আবু তাহের", role: "চেয়ারম্যান পদপ্রার্থী, মহাদান ইউনিয়ন" },
  image: "road",                           // key from media.ts
  views: 0, reactions: 0,
  content: [
    { type: "p", text: "..." },
    { type: "h2", text: "সমস্যাটি কী" },
    { type: "list", items: ["...", "..."] },
    { type: "callout", title: "লক্ষ্য", text: "..." },
    { type: "quote", text: "..." },
  ],
}
```

Checklist: slug unique & latin · date ISO · image key exists or `SmartImage` shows the fallback ·
at least one `h2` (drives the table of contents) · excerpt under 160 characters for meta.

## 3. Adding an activity

Add an object to `activities.ts` with `category` from the union, 2–4 paragraphs in `body`,
2–3 `impact` metrics, and an `image` key. Mark `featured: true` (max 3) to show it on the home page.

## 4. Adding an event

```ts
{
  id: "evt-ward-6-courtyard",
  title: "উঠান বৈঠক — ওয়ার্ড ৬",
  type: "উঠান বৈঠক",          // one of the union
  date: "2026-11-30", start: "16:00", end: "18:00",
  venue: "মহাদান পূর্বপাড়া প্রাথমিক বিদ্যালয়",
  ward: "৬",
  description: "…",
  capacity: 200, registered: 0,
  status: "upcoming",          // future → upcoming, over → past
  highlights: ["…"],
}
```

`registered` is a base number from offline sign-ups; online registrations are added on top from the store.
After the event, flip `status` to `"past"` — it automatically moves to the "সম্পন্ন" filter and the
registration form is replaced with an attendance summary.

## 5. Image pipeline

The visual archive is **real campaign photography**, not stock. It is produced once by
`.github/workflows/capture-legacy-audit.yml`, which:

1. screenshots every legacy route at 1440×900 and iPhone 13, then
2. archives each referenced image into `public/media/legacy/`, and
3. converts both sets to WebP with `scripts/optimize-audit.mjs` (screenshots → `audit/screenshots/`),
   committing the result back to the working branch.

### Adding images — the short version

Images live in `public/media/…` and are referenced in **two ways**:

| Way | Example | Where it works |
|---|---|---|
| Registry key | `"water"` | anywhere `SmartImage` is used |
| Direct path | `"/media/campaign/iftar-2027.webp"` | anywhere `SmartImage` is used |

`imageFor()` passes through paths that start with `/`, `http(s)://` or `data:`, so **you do not have
to edit `media.ts` for a new photo** — drop the file under `public/media/` and use its path.

1. **Content files** (`src/content/activity…`, `blog.ts`, `news.ts`, `events.ts`): set the item's
   `image` field to a key or a direct path.
2. **Blog / news / event posts from the command center**: `/admin` → কনটেন্ট স্টুডিও → নতুন পোস্ট →
   **ছবি** field. Type a registry key (autocomplete lists every key) or a path such as
   `/media/legacy/IMG_20211212_115118.webp`. The form shows a live thumbnail; publishing the post
   carries the image to `/news`, `/news/[id]`, `/blog`, `/blog/[slug]` and the ticker.
3. **Gallery** (`src/content/gallery.ts`): each tile has a unique `key` field — a registry key or a
   direct `/media/...` path; captions and tags live in the gallery file. Posters/videos use the same
   pattern.
4. **Home sections** use the key directly, e.g. `<SmartImage imageKey="water" …>`; pass `imageKey`
   or `src` explicitly in components.

Image specs that keep the site fast: WebP (or JPEG fallback), **1600–2000 px on the long edge**,
≤ 300 KB, 16:10 for cards, 16:9 for article headers, 4:5 for portraits. Always supply meaningful
`alt` text — the admin form derives it from the title, content files set it from the item title.
If a path is wrong, `SmartImage` shows its designed placeholder instead of a broken image.

External images need their host in `next.config.ts` → `images.remotePatterns` (`https` only).
To add or swap a photo the long way: drop the file in `public/media/`, register a semantic key in
`src/content/media.ts` (`water: "/media/water-tank.webp"`), then use `imageKey="water"`.

**Hero portrait:** the home-page portrait is `public/media/candidate/hero-portrait.webp`
(1080×1350, 4:5, retouched from the campaign studio shoot of 19 Oct 2026) and is mapped to the
`hero` key in `src/content/media.ts`. To regenerate the retouch from a new source photo:
`node scripts/retouch-hero.mjs path/to/portrait.jpg` (needs `sharp`). Keep the 4:5 ratio, place the
face in the upper third, and keep the WebP ≤ 250 KB. The card adds its own night-green gradients at
the top and bottom, so do not bake dark edges into the file.

**Signature:** `public/media/signature/abu-taher-signature-2026.png` — the campaign's supplied
calligraphic artwork (Bengali name, Arabic-calligraphy styling), keyed to true transparency
(2298×589) and mapped to the `signature` key. The source export had a checkerboard baked into the
pixels; regenerate the clean asset with
`node scripts/clean-signature.mjs path/to/source.jpeg` (luminance → alpha, ink colour preserved).
The block in the about section adds the স্বাক্ষর label and sizes the image `h-16` (mobile) / `h-24` (desktop).

`galleryPhotos`, `galleryPosters` and `galleryVideos` in `src/content/gallery.ts` drive the `/gallery`
page (filters, captions, keyboard-navigable lightbox). Each photo needs a unique key — the gallery
prints a duplicate/missing warning through `node` checks in code review.

### গ্যালারি মেনু — কোন ফাইল কী চালায়

| মেনু | রুট | কনটেন্ট | নতুন কিছু যোগ করতে |
|---|---|---|---|
| ফটো গ্যালারী | `/gallery/photos` | `galleryPhotos` | ছবি `public/media/`-তে রেখে `galleryPhotos`-এ `{ key, caption, tag }` যোগ করুন |
| পোস্টার গ্যালারী | `/gallery/posters` | `galleryPosters` | `{ key, title, subtitle }` যোগ করুন |
| নির্বাচনী পোস্টার | `/gallery/election-posters` | `galleryPosters` যেখানে `election: true` | `{ key, title, subtitle, election: true }` |
| ভিডিও গ্যালারি | `/video-gallery` | `campaignVideos` (`src/content/videos.ts`) | `{ id, title, category }` যোগ করুন — `id` হলো YouTube ভিডিও আইডি |
| সব গ্যালারি | `/gallery` | উপরের সব | স্বয়ংক্রিয়ভাবে যুক্ত হবে |

উদাহরণ — নতুন নির্বাচনী পোস্টার:

1. পোস্টারটি WebP করে `public/media/legacy/my-poster-2027.webp` হিসেবে রাখুন (3:4, ≤ 300 KB)।
2. `src/content/media.ts`-এ কী যোগ করুন: `myPoster: "/media/legacy/my-poster-2027.webp",`
3. `src/content/gallery.ts` → `galleryPosters`-এ যোগ করুন:
   `{ key: "myPoster", title: "পোস্টারের শিরোনাম", subtitle: "ছোট বার্তা", election: true },`
4. `node scripts/build-ghpages.mjs --publish` (GitHub Pages মিরর) — সাধারণ সার্ভারে শুধু রিবিল্ড।
5. `key` ছাড়া সরাসরি পথও চলে: `{ key: "/media/campaign/new-poster.webp", … }`.

পোস্টার গ্রিডে ক্লিক করলে লাইটবক্স খোলে (কিবোর্ড: ← → এবং Esc); নির্বাচনী পোস্টার পাতায় শুধু
`election: true` পোস্টারগুলো দেখায়।

### ভিডিও গ্যালারি — নতুন ভিডিও যোগ করা

`src/content/videos.ts` → `campaignVideos`-এ একটি লাইন:

```ts
{ id: "YouTubeVideoID", title: "ভিডিওর শিরোনাম", category: "প্রচারণা" },
```

- `id` = YouTube লিংকের শেষ অংশ (`https://www.youtube.com/watch?v=**hnD09TA3Vj8**`)
- `category` = `প্রচারণা` | `ইশতেহার` | `সাংবাদিক সম্মেলন` | `মিডিয়া`
- প্রথম ভিডিওটি বড় "প্রধান ভিডিও" হিসেবে দেখাতে চাইলে `featured: true`
- থাম্বনেইল YouTube থেকে অটো আসে (`i.ytimg.com`) — আলাদা ছবি লাগে না
- ক্লিক না করা পর্যন্ত কোনো YouTube iframe লোড হয় না (গতি ও প্রাইভেসি), প্লে করলে
  `youtube-nocookie.com` থেকে চলে

If a key is missing or the file 404s, `SmartImage` renders a designed forest-green placeholder with
the caption — never a broken-image icon. This keeps layout and client demos intact while photos are
being cleared.

## 6. Legacy URL → new URL mapping (for 301s)

| Old | New |
|---|---|
| `/` | `/` |
| `/aimgoal/` | `/about` |
| `/election-campion/`, `/election/` | `/campaign` |
| `/campion/{id}/details/` | `/events` (archive) or `/activities/{slug}` |
| `/activities/`, `/activities/{id}/details/` | `/activities`, `/activities/{slug}` |
| `/media-news/`, `/media-news/{id}/details/` | `/news`, `/news/{id}` |
| `/picture-gallery/`, `/poster/` | `/gallery` |
| `/video-gallery/` | `/gallery#videos` |
| `/bloglist/` | `/blog` |
| `/blog/{id}/details/` | `/blog/{slug}` |
| `/blog-subcategory/{id}/list/` | `/blog` (category filter) |
| `/contact/` | `/contact` |

Old integer IDs must be mapped to new slugs in the redirect config (Vercel `redirects()` or Nginx map).

## 7. Copy rules

- Address the reader as **আপনি**, never **তুমি**.
- Cite a number with a period: "৪২ কিমি সড়ক (২০২৬ পরিকল্পনা)".
- No unverifiable superlatives ("সর্বকালের সেরা") — state the metric instead.
- Commitments always include a **time window** and an **owner**.
- Sensitive topics (drugs, violence, harassment) use neutral, non-stigmatising language and always
  surface the hotline (৯৯৯ / ১০৯).
- Bengali numerals in UI (`bn()` helper); Latin numerals allowed only inside IDs and phone numbers.

## 8. Content QA script (manual, 5 minutes)

```
[ ] No English words left in Bengali sentences (except brand/URLs)
[ ] No Hindi/Devanagari characters (a real bug caught: स्वास्थ्य)
[ ] Every date renders in Bengali numerals
[ ] Every card has an image or an intentional placeholder
[ ] Every external link opens in a new tab and has rel="noopener"
[ ] No lorem ipsum, no "TODO", no duplicated paragraphs
```
