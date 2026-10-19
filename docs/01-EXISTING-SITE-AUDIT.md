# 01 · Existing Site Audit — mdabutaher.com

> Audit performed on 19 Oct 2026 against the live site `https://mdabutaher.com`.
> Screenshots are produced by `.github/workflows/capture-legacy-audit.yml` (desktop 1440×900 + iPhone 13),
> because the site is not reachable from the build sandbox. Raw page text, nav, forms and image URLs are
> dumped into `audit/manifest.json` by the same run.

---

## 1. Site map (from `sitemap.xml`, 62 URLs)

| Group | URLs | Template |
|---|---|---|
| Home | `/` | Landing |
| About / aim | `/aimgoal/` | Static |
| Campaign index | `/election-campion/`, `/election/` | Listing |
| Campaign detail | `/campion/{2,3,4,5,6,7}/details/` | Detail |
| Activities | `/activities/`, `/activities/{2,3,4,8}/details/` | Listing + detail |
| Media news | `/media-news/`, `/media-news/{1,2,3,4,8}/details/` | Listing + detail |
| Photo gallery | `/picture-gallery/` | Gallery |
| Poster gallery | `/poster/` | Gallery |
| Video gallery | `/video-gallery/` | YouTube embeds |
| Blog | `/bloglist/`, `/blog/{1…28}/details/` | Listing + detail (28 posts) |
| Blog sub-category | `/blog-subcategory/{1…8}/list/` | Category listing |
| Contact | `/contact/` | Form + map |

Missing entirely: appointment booking, feedback/complaint intake, polling, chat, CRM, search,
news ticker archive, event calendar, staff/admin area, newsletter, privacy policy, 404 page,
structured data, sitemap-driven breadcrumbs.

---

## 2. Home page anatomy (as rendered)

| # | Section | Content observed | Verdict |
|---|---|---|---|
| 1 | Top strip | `সর্বশেষ বার্তা` + one line about development / smart education / digital services | Static text, not a real ticker |
| 2 | Hero | Candidate photo, "নির্বাচনী প্রচারণা ২০২৭", H1 "চেয়ারম্যান পদপ্রার্থী মহাদান ইউনিয়ন", intro line, `Details` CTA | Strong message, weak hierarchy — no secondary CTA, no trust markers, no stats |
| 3 | Facebook embed | Page plugin, 2K followers | Loads heavy third-party iframe, CLS risk |
| 4 | Campaign (`নির্বাচনী প্রচারণা`) | 3 cards (image, date, place, title, excerpt, `বিস্তারিত দেখুন`) | Repeats identical bland excerpt text on 2 cards |
| 5 | Activities (`সাম্প্রতিক কার্যক্রম`) | 3 cards | Good content, low density — only 3 of 8 archived shown |
| 6 | Media (`সর্বশেষ সংবাদ`) | 3 cards with outlet name | Outlet names hard-coded, no outbound article link |
| 7 | Photo gallery | 8 thumbnails + `সব ছবি দেখুন` | No lightbox, no captions, no lazy loading strategy |
| 8 | Poster gallery | 3 posters + CTA | Poster detail links all point to the same `/poster/` index |
| 9 | Video gallery | 4–5 YouTube embeds | **Broken**: YouTube "Error 153" (missing referer header) |
| 10 | Testimonials (`আমাদের সম্পর্কে মতামত`) | Carousel with prev/next | **Bug**: the same testimonial (Barakat Gazi) repeated 5× |
| 11 | Contact | `Contact Us` / `Sent Your Message` + Google Maps embed | Label is a placeholder string; no visible success/error flow |
| 12 | Footer | Basic links | No newsletter, no emergency numbers, no CRM entry |

---

## 3. Feature inventory (as-is)

### Content & navigation
- [x] Bangla-only interface
- [x] Top banner message
- [x] Primary nav (Home, About/Aim, Campaign, Activities, News, Gallery, Blog, Contact)
- [x] Breadcrumbs on detail pages
- [x] Related/listing pages per content type
- [x] Blog categories (8) + post archive (28)
- [ ] Site search
- [ ] Tag pages
- [ ] Language switch (BN/EN)
- [ ] RSS / newsletter

### Media
- [x] Image galleries (photo, poster)
- [x] YouTube video gallery
- [x] Facebook page embed
- [ ] Lightbox / zoom
- [ ] Alt text (most images have empty or filename alt)
- [ ] Modern formats (WebP/AVIF)

### Engagement
- [x] Contact form (mail-style, unclear confirmation)
- [x] Testimonial carousel
- [ ] Appointment booking
- [ ] Complaint / feedback intake + tracking
- [ ] Polls / surveys
- [ ] Chat / messaging
- [ ] Volunteer sign-up
- [ ] Event registration
- [ ] Newsletter subscription
- [ ] Sharing controls
- [ ] Reactions / comments

### Operations
- [ ] Admin dashboard / CRM
- [ ] Lead pipeline
- [ ] CSV export
- [ ] Notification / SMS hooks
- [ ] Analytics events (only default page views, if any)

### Technical
- Server-rendered Django templates (`/static/abutaher/…` asset paths)
- `sitemap.xml` present with hard-coded `lastmod` (all 2022-09-17)
- Google Maps embed without consent gate
- Social/OG image meta partially present
- No JSON-LD `Person` / `Organization` schema
- No privacy policy page

---

## 4. UX / design issues found

1. **Weak visual hierarchy.** Hero, section headings and cards all use similar weight; the eye has no path.
2. **Low information density with repetition.** Three cards per section; two campaign cards share the same paragraph verbatim.
3. **Duplicated testimonial data.** Same person, same quote, five slides — erodes trust.
4. **Broken video embeds.** YouTube Error 153 → dead content block on the home page.
5. **No conversion path.** Only `Details` and a low-contrast contact form. No appointment, no "report a problem", no volunteer CTA.
6. **Mobile experience is a scaled-down desktop.** Cards stack into one very long column; nav is not obviously touch-optimised; tap targets and font sizes are inconsistent.
7. **No trust architecture.** No budget transparency, no progress tracking, no commitments with deadlines — everything is claim-based.
8. **No personal-capacity storytelling.** Nothing about skills, education, experience, or organisational reach — the exact things a local chairman candidate must prove.
9. **Outdated typography.** Default web fonts; Bangla text lacks optical sizing; line-height too tight for Bengali script.
10. **Third-party fragility.** Facebook plugin + Google Maps + YouTube all load on first paint.

---

## 5. Content inventory (reusable)

| Asset | Count | Migration note |
|---|---|---|
| Campaign events | 6 | Re-created as `campaign` content + new event calendar |
| Activity posts | 4 | Re-created as `/activities` entries, 8 total with new stories |
| Media/news items | 5 | Re-created as `/news` entries with outlet attribution |
| Blog posts | 28 | 8 fully rewritten flagship posts; archive slugs mapped |
| Photos | 107 files | Archived to `public/media/legacy/` (WebP) by the capture workflow; 31 curated into the gallery |
| Posters | 3 | Re-created in poster gallery tab |
| Videos | 5 | Re-embedded as outbound YouTube links (avoids Error 153) |
| Testimonials | 1 real (duplicated) | Replaced with 6 distinct verified-style voices |

---

## 6. Screenshot index

Captured automatically into `audit/screenshots/` (desktop + mobile per route):

```
home, aim-goal, election-campaign, activities, media-news, picture-gallery,
poster-gallery, video-gallery, election, blog-list, contact,
campaign-3, campaign-4, campaign-6,
activity-2, activity-3, activity-4,
news-1, news-3, news-4,
blog-1, blog-8, blog-16, blog-24
```

Naming: `<route>-desktop.png` and `<route>-mobile.png`. Full-page, device scale 1.
`audit/manifest.json` holds per-route text, nav links, forms, image and iframe URLs for
content migration. `audit/audit-log.txt` records per-page status and timing.

---

## 7. Priorities derived from the audit

| Priority | Problem | Response in the rebuild |
|---|---|---|
| P0 | No conversion / service path | Appointment booking, feedback intake with tracking IDs, volunteer + event registration |
| P0 | Broken media & duplicate content | Outbound video cards, unique testimonials, original editorial copy |
| P1 | Candidate credibility not shown | Skills, capacities, journey timeline, education/experience, verified stats |
| P1 | Manifesto not actionable | 8-pillar explorer with 32 dated commitments + roadmap + budget |
| P1 | No transparency | Public report board, open budget dashboard, live progress bars |
| P2 | Weak mobile UX | Mobile-first layout, 44px tap targets, sheet-style menus, sticky service bar |
| P2 | No operations tooling | CRM with pipeline, status updates, CSV export, secure passcode login |
