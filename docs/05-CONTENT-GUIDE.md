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

1. Capture workflow downloads legacy images to `public/media/legacy/`.
2. Put approved photos in `public/media/` (e.g. `public/media/water-tank.jpg`).
3. Register in `media.ts`: `water: "/media/water-tank.jpg"`.
4. Use `imageKey="water"` in components.

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
