# 03 · Design System & UI Direction

> Inspiration references: **framer.com** (editorial scale, motion choreography, product-grade
> polish) and **21st.dev** (composable, high-craft component patterns: bento grids, spotlight cards,
> animated tabs, marquee, timelines).

---

## 1. Brand direction

A local election site usually looks like a poster. This rebuild borrows the visual language of
**civic institutions + premium editorial**: deep forest green for credibility, warm cream for
approachability, and a restrained gold for the "commitment / seal" accent.

| Token | Hex | Use |
|---|---|---|
| `night` | `#05130f` | Hero base, footer, CRM shell |
| `forest` | `#0a3025` | Primary brand, headings, buttons |
| `forest-2` | `#0e4334` | Hover states, layered surfaces |
| `emerald` | `#17a06a` | Progress, success, "doing" state |
| `emerald-bright` | `#2fd28c` | Live dots, chart accents on dark |
| `gold` | `#e7b75f` | Primary CTA on dark, seals, highlights |
| `cream` | `#f8f4ea` | Page background (light) |
| `cream-2` | `#f1ebdd` | Alternate band, cards |
| `sand` | `#e3d9c5` | Borders on cream |
| `ink` | `#0b1b16` | Body text |
| `muted` | `#5d6f66` | Secondary text |

**Rationale:** green + gold reads as trustworthy and locally rooted (Bangladesh flag adjacency)
without the usual red/blue party-poster clichés. Cream keeps long Bangla text comfortable.

## 2. Typography

| Role | Family | Notes |
|---|---|---|
| Display / Bangla | **Anek Bangla** (variable 100–900, Bengali + Latin subsets) | Self-hosted `woff2`, `display: swap` |
| Latin / numerals | **Inter** variable | Prices, dates, reference IDs |
| Numerals | Bengali digits via `bn()` helper | `১২,৫০০+`, `০৯:৩০` |

Scale (mobile → desktop):
`h1 clamp(2.3rem, 6.2vw, 4.5rem)` · `h2 clamp(1.85rem, 4vw, 2.75rem)` · `h3 1.05rem` · body `0.95→1rem` · micro `0.6–0.72rem`.

Bangla needs more line-height than Latin: body copy uses `leading-relaxed` (1.6–1.9), article body 1.85–1.9.
Never use `tracking-tight` on Bangla headings beyond `-0.02em` (matras collide).

## 3. Layout & grid

- `container-x`: max 84rem, 20px mobile / 32px tablet / 40px desktop gutters.
- Section rhythm: `py-16 sm:py-20 lg:py-24`; alternating `cream` / `cream-2` / `night` bands.
- Cards: radius 16–24px, 1px `forest/10` border, `shadow-soft` on hover, no heavy drop shadows at rest.
- Bento moments: manifesto grid (4-up), campaign phases (4-up), dashboard KPI (4-up).
- Sticky elements: header (76px), blog toolbar, detail-page sidebars (`top-24`).

## 4. Component library (built in-repo)

| Component | Path | Pattern source |
|---|---|---|
| `SiteHeader` + mega menu + mobile sheet | `components/layout/site-header.tsx` | Framer nav, 21st sheet |
| `NewsTicker` | `layout/news-ticker.tsx` | 21st marquee |
| `SiteFooter` | `layout/site-footer.tsx` | editorial footer |
| `ChatWidget` | `layout/chat-widget.tsx` | dock-style floating action |
| `Button` / `ButtonLink` | `ui/button.tsx` | shadcn variants |
| `Reveal` / `Stagger` / `MotionCard` | `ui/reveal.tsx` | Framer scroll choreography |
| `Counter` | `ui/counter.tsx` | 21st number ticker |
| `SmartImage` | `ui/smart-image.tsx` | designed fallback placeholder |
| `Section` / `SectionHeading` / `Badge` | `ui/section.tsx` | editorial section head |
| `PageHero` | `ui/page-hero.tsx` | Framer-style oversized title + breadcrumb |
| `Accordion` | `ui/accordion.tsx` | 21st FAQ |
| `Field/Input/Select/Textarea/Checkbox` | `ui/form.tsx` | shadcn form primitives |
| `PollCard`, `FeedbackBoard`, `AppointmentForm`, `VolunteerForm`, `EventRegister`, `ManifestoExplorer`, `BlogExplorer`, `BlogArticle`, `GalleryTabs`, `AdminDashboard` | `components/features/*` | product-specific |

## 5. Motion rules

1. **Purpose over decoration.** Entry reveals (24px rise, 700ms, `cubic-bezier(.22,1,.36,1)`), progress bars,
   number counters, and state transitions only.
2. **Stagger, don't scatter.** Cards enter with 60–80ms offsets, max 300ms total delay.
3. **Scroll-linked, not scroll-hijacked.** Hero parallax is ±40–60px on `useScroll`; page never traps scroll.
4. **Micro-interactions.** Buttons scale 0.98 on press, cards lift 4–6px, arrows translate on hover.
5. **Respect the user.** Every animation is disabled under `prefers-reduced-motion: reduce`
   (`useReducedMotion` + a global CSS media query).
6. **Performance budget.** Transform/opacity only; no layout-animating properties; `will-change` used sparingly;
   marquee paused on hover; images lazy unless above the fold.

## 6. Mobile-first behaviour

| Breakpoint | Behaviour |
|---|---|
| `< 640` | Single column, 16px body, 44px min tap targets, hero portrait below copy, sticky bottom chat FAB, service rail as 2×2 grid, tables become card rows |
| `640–1023` | 2-column grids, horizontal filter scrollers with hidden scrollbar, blog featured card stacks |
| `≥ 1024` | Sticky sidebars, mega-menu dropdowns, 3–4 column bento, full admin sidebar |
| `≥ 1280` | Wider gutters, larger display type, dashboard 4-col KPIs |

Mobile specifics: the full navigation is a **right-side sheet** (spring slide, backdrop blur) with grouped
sub-links and a service block; the ticker keeps a fixed "সর্বশেষ" badge while text scrolls; gallery uses
2-column masonry; charts scroll horizontally instead of shrinking.

## 7. Accessibility & content rules

- Skip-to-content link, focus-visible ring (3px emerald), landmarks (`header/main/footer/nav`).
- Form labels are visible (never placeholder-only), errors announced inline with Bengali copy.
- Colour contrast: body `ink` on `cream` = 12.8:1; `cream/60` on `night` ≈ 5.2:1 (used only for secondary text ≥14px).
- Icon-only buttons always have `aria-label`.
- Every image has meaningful alt text; decorative layers are `aria-hidden`.
- Content voice: first person for the candidate, second person for the citizen ("আপনার এলাকা"),
  numbers always with a source or a date.

## 8. "Borrowed" patterns, mapped

| Reference pattern | Adaptation here |
|---|---|
| Framer oversized hero headline with underline flourish | Hero `মানুষের পাশে সবসময়` + animated SVG underline |
| Framer sticky product nav with progress bar | Header with scroll-progress gradient line |
| Framer alternating editorial bands | Section tone switching + big background wordmark |
| 21st bento feature grid | Manifesto pillars, campaign phases, quick services |
| 21st spotlight/glow card | Floating hero chips, dashboard "today's focus" card |
| 21st marquee | News ticker, trust strip |
| 21st animated tabs | Manifesto explorer, gallery tabs |
| 21st timeline | About journey, report status timeline |
| 21st testimonial slider | Home testimonials with dot pagination |
| 21st dock | Floating chat button with pulse ring |
