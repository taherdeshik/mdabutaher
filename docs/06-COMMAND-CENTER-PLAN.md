# 06 · Election Command Center — Development Plan

> Scope: turn `/admin` from a small CRM into a Bangla-first **campaign command center + CMS + CRM**
> for the Mahadan Union chairman campaign, based on
> `UP_Chairman_Election_Command_Center_FeatureSpec.md` (M01–M22).
>
> Status date: 19 October 2026 · Branch: `arena/9badc21b-mdabutaher`

---

## 1. Product framing

| Layer | User | Device | Job to be done |
|---|---|---|---|
| **Command center** | Candidate, campaign manager | Laptop / wall display | Know the state of the race in 10 seconds; act on alerts. |
| **Field CRM** | Ward & booth captains | Phone, often offline | Log household visits, follow-ups, challenges, turnout. |
| **CMS** | Media secretary | Laptop / phone | Publish news, events, blog posts and ticker notices. |
| **Public site** | Voters | Phone | Read promises, book appointments, give feedback, follow activity. |

Design rules carried from the spec: **Bangla-first**, phone-first in the field,
laptop-first in HQ, every table exportable, every list printable, and legal
guardrails (expense cap, cheque rule, code of conduct) built into the UI.

---

## 2. Architecture chosen for this codebase

The existing app is Next.js 15 (App Router) + a JSON store (`src/lib/store.ts`)
that already has a `read / mutate` contract. We keep that contract and extend it.

```
Browser (admin)                    Next.js server                   Storage
─────────────────                  ────────────────                 ───────────
AdminShell (client)  ── fetch ──▶  /api/admin/command  ── mutate ──▶ data/db.json
  ├─ situation room                 GET  = one snapshot              (wards, booths,
  ├─ coverage map                   POST = create/update/delete      households, visits,
  ├─ canvass board                     for every command entity      team, tasks, expenses,
  ├─ roll intelligence                                             challenges, posts,
  ├─ win number                                                    visits, settings)
  ├─ team & daily plan
  ├─ challenges + help guide
  ├─ money tracker
  ├─ CMS
  └─ CRM (leads / feedback / appointments / messages)
```

**Why one command endpoint:** field devices on 2G need one round-trip, not
twelve. The snapshot is small (≈ 30 booths, 9 wards, a few hundred rows). Every
mutation returns the fresh snapshot, so the UI never drifts.

**Offline-first path (Phase 2):** visits are written to a `localStorage` queue
first, the UI shows a "pending N" badge, and the queue flushes when
`/api/admin/command` answers. The current build already sends optimistic
updates and a retry queue wrapper so the backend can be swapped for
IndexedDB/service-worker later without UI changes.

**Production path:** replace the JSON adapter with Postgres/Supabase behind the
same `read/mutate` signature. Nothing in the UI imports the store directly
(client components only speak HTTP), so this is a drop-in change.

---

## 3. Module map — spec → this build

| Spec | Module | Priority | This build |
|---|---|---|---|
| M01 | Situation room, countdowns, KPI wall, alerts | P0 | **v1** — statutory countdown, 8 KPI cards, smart brief, live alerts |
| M02 | Electoral-roll intelligence | P0 | **v1** — ward/booth aggregates, gender/age splits, CSV import (preview → apply) |
| M03 | Ward–booth–village structure & coverage map | P0 | **v1** — 9-ward SVG map, 27 booths, coverage heat, captain vacancy alarms |
| M04 | Win number & scenario modelling | P0 | **v1** — turnout slider, win number, ward targets, strength tags |
| M05 | Team & volunteer HQ | P0 | **v1** — 7-level roster, vacancies, tasks, leaderboard |
| M06 | Door-to-door canvassing | P0 | **v1** — household lists, 5 status codes, issue tags, follow-ups, daily digest |
| M07 | Dialer / SMS / voice | P1 | Phase 2 (tel: links + SMS text export in v1) |
| M08 | Digital & social campaign | P1 | Phase 2 |
| M09 | Content studio (speech/poster copy) | P1 | Phase 2 (CMS now, generators later) |
| M10 | Meetings, rallies, miking planner | P1 | **v1-lite** — task types + events CMS |
| M11 | Money tracker & cap compliance | P0 | **v1** — ৳10,00,000 cap meter, categories, cheque-rule guard, voucher log |
| M12 | Rivals & rumour watch | P1 | Phase 2 |
| M13 | Code of conduct & agent paperwork | P1 | Help guide v1; letters Phase 2 |
| M14 | Poll-day command & turnout | P0 | Phase 3 (schema ready: turnout, incidents) |
| M15 | PVT & election night | P0 | Phase 3 |
| M16 | Women / youth / inclusion | P2 | Analytics v1; campaigns Phase 3 |
| M17 | Knowledge base & legal library | P1 | **v1** — searchable help guide |
| M18 | Alerts & daily brief | P0 | **v1** — rule engine on snapshot |
| M19 | Multi-device sync | P0 | JSON adapter v1; hub Phase 2 |
| M20 | Roles & audit | P1 | Phase 2 (single admin key today) |
| M21 | Reports, exports, print packs | P0 | **v1** — CSV for every table, print-ready lists |
| M22 | Post-election transition | P2 | Phase 4 |
| — | **CMS** (news / events / blog / ticker) | new | **v1** — draft→publish, public-site merge |

---

## 4. Data model (new collections)

| Collection | Key fields |
|---|---|
| `settings` | polling date, roll/nomination/scrutiny/withdrawal/symbol/result dates, turnout assumption, spend cap |
| `wards` | no, name, villages, SVG polygon, strength tag, captain, 2021 turnout |
| `booths` | code, centre, ward, village, voters (m/f/youth/first-time), households, visited, committed, captain, map x/y |
| `households` | head, phone, members, booth, route, visit status, support level, issue tags, follow-up |
| `visits` | household, booth, captain, status code, issues, promise, follow-up, timestamp |
| `team` | name, phone, role (7 levels), ward/booth posting, status |
| `tasks` | title, type (meeting/canvass/miking/rally/admin), date, time, assignee, priority, done |
| `expenses` | date, category, amount, mode (cash/cheque/bank), voucher, note |
| `challenges` | title, detail, ward/booth, category, severity, status, owner, resolution |
| `posts` | type (news/event/blog), title, slug, excerpt, body, cover, status, date, tags, outlet/venue |

Derived KPIs (never stored): coverage %, commitment ratio, win number, cap burn,
booth gap, captain vacancies, ward strength weighting.

---

## 5. Delivery phases

### Phase 1 — Command center v1 (this iteration)
1. Extend store + seed a realistic union (9 wards, 27 booths, ~27k voters,
   135 working households, 25 team members, 20 tasks, ledger, challenges).
2. `/api/admin/command` GET snapshot + POST mutations (visit, task, expense,
   challenge, team, post, roll import, settings).
3. Admin shell: dark command-center UI, responsive sidebar → bottom sheet on phone.
4. Sections: Situation · Coverage map · Canvass · Roll · Win number · Team &
   Daily plan · Challenges & Help · Money · CMS · CRM.
5. CMS merge into public ticker, `/news`, `/events` and `/blog`.
6. KPI/alert engine + CSV exports + print CSS.

**Acceptance:** manager can open one page and see coverage, commitments, money
burn, vacancies, today's plan and alerts; a captain can log a visit in <20 s on
a phone; a published CMS post appears on the public site.

### Phase 2 — Field power tools
Offline IndexedDB queue + service worker, SMS compose/export, WhatsApp deep
links, content studio (speech/poster generators), rival register & rumour log,
code-of-conduct complaint/agent-letter generator, role-based access + audit log,
hub sync server.

### Phase 3 — Poll day & night
Booth agent rosters & kits, hourly turnout (app + SMS code parser), incident
log + QRT dispatch, GOTV waves, PVT validation, election-night board,
victory/concession statements, discrepancy evidence pack.

### Phase 4 — Post-election
100-day plan, promise tracker, open-budget calendar, petition workflow, CRM
continuity mode.

---

## 6. Verification checklist (Phase 1)

- [ ] `npx tsc --noEmit` clean; `npm run build` clean.
- [ ] `/admin` passcode gate; wrong key rejected; key persists in localStorage.
- [ ] Every mutation round-trips and is reflected after reload.
- [ ] Mobile 390 px: no horizontal scroll; nav reachable; visit form usable.
- [ ] CSV downloads open in Excel with Bangla (UTF-8 BOM).
- [ ] Print styles: ward canvass list and money ledger fit A4.
- [ ] CMS publish → public ticker/news/events within one refresh.
- [ ] No hydration warnings on public pages touched by the CMS merge.
