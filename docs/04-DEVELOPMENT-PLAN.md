# 04 · Step-by-Step Development Plan (for the AI agent)

This is the executable plan used to build the platform. Each phase lists **goal → tasks →
acceptance criteria → verification**. Phases 0–6 are implemented in this repository; phases 7–9 are
the production roadmap.

---

## Phase 0 — Discovery & audit (✅ done)

| Task | Output |
|---|---|
| Crawl `sitemap.xml`, enumerate all 62 URLs | URL inventory in `docs/01` |
| Read home + template pages, extract section order | Home anatomy table |
| Capture screenshots (desktop 1440 + iPhone 13, full page) | `audit/screenshots/*` via GitHub Actions |
| Archive legacy imagery for reuse | `public/media/legacy/*` + `audit/manifest.json` |
| Build feature inventory & defect list | `docs/01` §§3–4 |

**Acceptance:** every route in the sitemap has a manifest entry; feature matrix is exhaustive.
**Verification:** `audit/manifest.json` contains N pages; `audit-log.txt` shows per-route status.

> Sandbox note: `mdabutaher.com` is not routable from the build sandbox (TLS reset). Capture therefore
> runs on GitHub Actions runners, which do have access, and returns an artifact.

## Phase 1 — Foundation (✅ done)

1. Scaffold Next.js 15 App Router + TypeScript strict + Tailwind v4.
2. Install Framer Motion, Lucide, Zod, clsx/tailwind-merge.
3. Self-host Anek Bangla + Inter variable fonts in `src/fonts`.
4. Define the `@theme` token set (colors, radii, shadows, animations) in `globals.css`.
5. Add utilities: `container-x`, `glass`, `mesh-dark/light`, `eyebrow`, `card-surface`, `hide-scrollbar`.
6. Root layout: metadata template, JSON-LD, viewport, skip link, favicon, OG image route.

**Acceptance:** `npm run dev` serves a styled page, `tsc --noEmit` clean, fonts load with no FOUT flash.
**Verification:** `curl localhost:3000/` → 200 with `id="main-content"`; `npx tsc --noEmit` → exit 0.

## Phase 2 — Content model (✅ done)

| File | Contents |
|---|---|
| `src/content/site.ts` | identity, nav, stats, bio, values, FAQ, emergency numbers |
| `src/content/manifesto.ts` | 8 pillars × 4 commitments, targets, budgets, SDG, roadmap FAQ |
| `src/content/campaign.ts` | 4 phases, 9 wards, weekly rhythm, KPIs, volunteer roles |
| `src/content/events.ts` | 11 events with capacity/status/highlights |
| `src/content/activities.ts` | 8 case studies with impact metrics |
| `src/content/news.ts` | 6 press items |
| `src/content/blog.ts` | 8 long-form posts with typed block model |
| `src/content/polls.ts` | 4 polls with seeded counts |
| `src/content/testimonials.ts` | 6 distinct voices |
| `src/content/media.ts` | image registry + `imageFor()` resolver |

**Rules:** content is typed, never inline in components; Bengali numerals only in the UI layer
(`bn()`), never stored; every list has a stable `id`/`slug`.

## Phase 3 — Services & APIs (✅ done)

1. **Store** (`src/lib/store.ts`): typed JSON DB, serialized `mutate()`, atomic tmp-file rename,
   `makeId`, `trackingId`, `pushLead` (dedupe by phone).
2. **Validation** (`src/lib/validation.ts`): Zod schemas with Bengali messages.
3. **Helpers** (`src/lib/api.ts`): `ok`, `fail`, in-memory IP rate limiter, `requireAdmin`.
4. Routes: appointments (GET slots/lookup + POST), feedback (+ support), polls (+ vote),
   events (+ register), volunteers, contact, chat, newsletter, stats, ICS calendar.
5. Every write route: rate limit → parse → validate → business rules → mutate → return Bengali message.

**Acceptance:** each endpoint returns `{ ok: true, data }` or `{ ok: false, error, errors }`.
**Verification:**
```bash
curl -X POST localhost:3000/api/appointments -H 'Content-Type: application/json' \
  -d '{"name":"পরীক্ষা","phone":"01712345678","type":"সরাসরি সাক্ষাৎ","date":"2026-10-22",
       "slot":"10:00","mode":"in-person","ward":"৩","topic":"পানি"}'
# → 201 with reference MAT-XXXXXX
```
Also test: past date → 422, full slot (5th booking) → 409, duplicate poll vote → 409, 6th appointment/minute → 429.

## Phase 4 — UI system (✅ done)

Order of construction: tokens → primitives (`Button`, `Section`, `Reveal`, `Counter`, `SmartImage`,
`Accordion`, `PageHero`, form controls) → layout (header, ticker, footer, chat widget) → home
sections → service pages → CRM.

**Rule:** no page builds a bespoke button/field; extend the primitive instead.

## Phase 5 — Page build-out (✅ done)

Home → About → Manifesto → Campaign → Events (+detail) → Activities (+detail) → News (+detail) →
Blog (+slug) → Gallery → Polls → Appointment (+status) → Feedback (+board) → Chat → Contact →
Privacy → 404 → sitemap/robots/OG.

**Per-page checklist**
- [ ] `generateMetadata` with title, description, canonical
- [ ] `PageHero` with breadcrumb
- [ ] Empty, loading, error states for any async block
- [ ] Mobile pass at 390px
- [ ] Bengali copy proofread (no Latin leftovers, correct numerals)
- [ ] Reduced-motion pass

## Phase 6 — CRM (✅ done)

Login (`/api/admin/login`, rate-limited, passcode) → dashboard KPIs + 14-day chart + pipeline →
appointments table with confirm/cancel → report queue with status workflow → lead kanban →
message inbox → CSV export. Client stores the key in `localStorage`; every admin request sends
`x-admin-key`.

**Acceptance:** login with `mahadan-2027`, confirm an appointment, resolve a report, move a lead,
download CSV. Logout clears the key.

## Phase 7 — Hardening (next)

| Task | Detail | Done when |
|---|---|---|
| Database | Prisma + Postgres; port `read`/`mutate` | `DATABASE_URL` set, no `data/db.json` writes |
| Uploads | S3/R2 presigned upload for report photos | Photos > 1.5 MB accepted |
| Auth | OTP login for staff, roles (admin / ward lead) | Passcode removed |
| Notifications | SMS on appointment confirm; email via Resend | Webhook logs + delivery report |
| PDF | `/api/manifesto.pdf` generated from content | Linked file downloads 200 |
| Rate limiter | Redis-backed, per-route budgets | Survives restart / multi-instance |
| Tests | Playwright E2E for the 6 critical flows + Vitest for validation | CI green |
| CI | Lint, typecheck, build, E2E on PR | Required checks on `main` |

## Phase 8 — Content & SEO activation

1. Replace placeholder imagery with approved photography (`imageMap` keys).
2. Rewrite remaining 20 blog posts; add `BlogPosting` JSON-LD per article.
3. Bengali + English toggle for key pages (hero, bio, manifesto summary).
4. Google Business Profile + Search Console verification; submit sitemap.
5. Lighthouse budget: ≥ 90 performance / 100 accessibility / ≥ 95 SEO on mobile.

## Phase 9 — Launch & operations

1. Domain cutover with 301 map from every legacy URL (see mapping table in `docs/05`).
2. Uptime + error monitoring (Sentry), analytics (Plausible) with consent banner.
3. Staff training: how to triage reports within 7 working days, weekly KPI review.
4. Monthly transparency report auto-generated from CRM counts.
5. Post-launch: A/B test hero CTA, measure appointment completion rate and report resolution time.

---

## Working agreements for the agent

1. **Never break the build.** Run `npx tsc --noEmit` before every commit; start the dev server and
   `curl` each new route for 200.
2. **One concern per commit** (`feat:`, `fix:`, `docs:`, `chore:`), message in English, UI copy in Bengali.
3. **Content edits go in `src/content/*`**, never inline in a page component.
4. **Server-only modules** (`store.ts`, `api.ts`) must never be imported by a `"use client"` file —
   shared constants live in `src/lib/constants.ts`. (This caused a real `node:crypto` build failure.)
5. **Verify visually.** Screenshot desktop + mobile after every page; check for blank bands caused by
   entry animations (capture with `reducedMotion: 'reduce'`).
6. **No secrets in the repo.** `ADMIN_KEY`, delivery keys come from env; `.env*` is git-ignored.

## Definition of done (per feature)

- [ ] Works at 390 / 768 / 1440 px
- [ ] Empty + loading + error states
- [ ] Bengali microcopy reviewed
- [ ] Keyboard reachable, focus visible, ARIA correct
- [ ] API validated + rate-limited, error messages in Bengali
- [ ] Documented in README route/API tables
