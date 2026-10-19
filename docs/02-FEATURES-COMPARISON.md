# 02 · Features — Existing vs. New

Legend: ✅ present · ⚠️ partial / broken · ➕ new in rebuild

## A. Public-facing features

| # | Feature | Old site | New site | Where |
|---|---|---|---|---|
| 1 | Bangla-first content | ✅ | ✅ | all pages |
| 2 | News ticker (real, auto-scrolling) | ⚠️ static strip | ➕ marquee, pause-on-hover, 6 rotating items | global header |
| 3 | Hero with trust markers | ⚠️ photo + CTA | ➕ measured stats, verified badge, video CTA, floating proof chips | `/` |
| 4 | Quick-service rail | ✖ | ➕ appointment, feedback, poll, volunteer | `/` |
| 5 | Animated counters | ✖ | ➕ in-view counters | `/`, `/about` |
| 6 | Candidate bio | ⚠️ 2 lines | ➕ long-form bio, philosophy, quote, values | `/about` |
| 7 | Skills with proficiency | ✖ | ➕ 6 skills | `/about` |
| 8 | Personal capacity / network proof | ✖ | ➕ 6 capacity statements | `/about` |
| 9 | Journey timeline | ✖ | ➕ 1999→2027 alternating timeline | `/about` |
| 10 | Education & experience | ✖ | ➕ two-column records | `/about` |
| 11 | Manifesto | ⚠️ poster/PDF only | ➕ 8 pillars × 4 commitments = 32, each with timeline | `/manifesto` |
| 12 | Manifesto progress tracking | ✖ | ➕ per-pillar progress bars, targets, budget, SDG mapping | `/manifesto` |
| 13 | Implementation roadmap | ✖ | ➕ 100-day / 6-month / 12-month / 5-year | `/manifesto#roadmap` |
| 14 | Campaign plan | ⚠️ event list only | ➕ 4 phases with KPIs, 9 ward coverage table, weekly rhythm | `/campaign` |
| 15 | Ward network directory | ✖ | ➕ ward, households, leader, booths, coverage % | `/campaign#zones` |
| 16 | Volunteer sign-up | ✖ | ➕ role, ward, availability → CRM lead | `/campaign#volunteer` |
| 17 | Event calendar | ⚠️ listing | ➕ filters, search, capacity, registration, ICS export | `/events` |
| 18 | Event detail + seats left | ✖ | ➕ live seat counter, related events, share | `/events/[id]` |
| 19 | Activities archive | ⚠️ 4 posts | ➕ 8 posts, category filter, grid/list toggle, impact metrics | `/activities` |
| 20 | Activity detail | ✅ | ✅ + impact stats + related | `/activities/[id]` |
| 21 | Media coverage | ⚠️ no outbound link | ➕ outlet attribution, featured layout, related | `/news` |
| 22 | Blog | ⚠️ 28 thin posts | ➕ 8 flagship posts, search, sort, tags, bookmarks | `/blog` |
| 23 | Reading experience | ✖ | ➕ progress bar, TOC, reactions, share, author card | `/blog/[slug]` |
| 24 | Photo / poster / video gallery | ⚠️ no lightbox, broken embeds | ➕ tabs, masonry, lightbox, outbound video cards | `/gallery` |
| 25 | Polls | ✖ | ➕ 4 polls, live results, duplicate-vote guard | `/polls` |
| 26 | Appointment booking | ✖ | ➕ 4-step wizard, slot availability, office hours logic | `/appointment` |
| 27 | Appointment status lookup | ✖ | ➕ phone lookup with status timeline | `/appointment/status` |
| 28 | Problem / advice / threat intake | ✖ | ➕ 3-mode form, severity, photo, anonymous option | `/feedback` |
| 29 | Tracking ID | ✖ | ➕ `MAT-XXXXXX` per report, timeline of updates | `/feedback` |
| 30 | Public report board | ✖ | ➕ filters by ward/type/status, support upvotes | `/feedback/board` |
| 31 | Live chat | ✖ | ➕ floating widget + full page, quick replies, persistence | global + `/chat` |
| 32 | Contact | ⚠️ static form | ➕ validated form, map, channel tiles, media contact | `/contact` |
| 33 | Newsletter | ✖ | ➕ footer capture → subscriber store | footer |
| 34 | Testimonials | ⚠️ duplicated | ➕ 6 unique voices, ratings, carousel | `/` |
| 35 | Emergency numbers | ✖ | ➕ 999 / 16263 / 109 / 1098 in footer + feedback | footer |
| 36 | Privacy policy | ✖ | ➕ plain-language data policy | `/privacy` |
| 37 | Sharing | ✖ | ➕ article/event/activity share | multiple |
| 38 | 404 page | ✖ | ➕ branded, helpful links | `/not-found` |

## B. Operational (CRM)

| # | Feature | Old | New | Where |
|---|---|---|---|---|
| 39 | Passcode-protected staff area | ✖ | ➕ `/admin` login with rate limit | `/admin` |
| 40 | KPI dashboard | ✖ | ➕ appointments, reports, leads, messages, unread | `/admin` |
| 41 | 14-day activity chart | ✖ | ➕ stacked bars (appointments / reports / volunteers) | `/admin` |
| 42 | Lead pipeline | ✖ | ➕ New → Contacted → Engaged → Supporter, one-click moves | `/admin` |
| 43 | Appointment status workflow | ✖ | ➕ confirm / cancel inline | `/admin` |
| 44 | Report workflow | ✖ | ➕ reviewing → in-progress → resolved with timeline notes | `/admin` |
| 45 | Message inbox | ✖ | ➕ web chat, contact form, channel tags | `/admin` |
| 46 | CSV export | ✖ | ➕ appointments, feedback, leads, volunteers, messages | `/api/admin/export` |
| 47 | Search inside CRM | ✖ | ➕ client-side filter across tables | `/admin` |
| 48 | Auto lead capture | ✖ | ➕ every form writes a deduplicated lead by phone | all APIs |

## C. Platform / engineering

| # | Feature | Old | New |
|---|---|---|---|
| 49 | SSR + SEO metadata per page | ⚠️ | ✅ `generateMetadata`, canonical, OG |
| 50 | JSON-LD Person / campaign schema | ✖ | ✅ root layout |
| 51 | Dynamic OG image | ✖ | ✅ `opengraph-image.tsx` |
| 52 | Sitemap | ⚠️ static, stale | ✅ generated from content |
| 53 | Robots | ✖ | ✅ generated |
| 54 | Self-hosted Bangla + Latin fonts | ✖ | ✅ Anek Bangla variable + Inter variable |
| 55 | Reduced-motion support | ✖ | ✅ every animation |
| 56 | Keyboard + screen-reader support | ⚠️ | ✅ skip link, focus rings, ARIA, semantic landmarks |
| 57 | Rate limiting | ✖ | ✅ per-IP buckets on all write routes |
| 58 | Server-side validation | ✖ | ✅ Zod schemas, Bengali error messages |
| 59 | Atomic JSON persistence | ✖ | ✅ serialized writes + tmp rename |
| 60 | Pluggable data layer | ✖ | ✅ `read()` / `mutate()` swap for Postgres |
| 61 | Calendar export (ICS) | ✖ | ✅ `/api/calendar/ics` |
| 62 | Public stats API | ✖ | ✅ `/api/stats` |

## D. Still to be wired in a later phase (roadmap items)

- Real SMS / WhatsApp notifications (SSL Wireless / Twilio) for appointment confirmation
- Email delivery for newsletter & contact (Resend / SES)
- Real authentication (OTP or NextAuth) instead of shared passcode
- Postgres + Prisma migration, file upload to S3/R2 instead of base64
- Bangla/English toggle
- Analytics dashboard (Plausible) and UTM-based funnel tracking
- PDF manifesto generation endpoint (`/api/manifesto.pdf` currently linked, not yet implemented)
