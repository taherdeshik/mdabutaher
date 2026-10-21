"""Visitor analytics aggregation (privacy-first: no cookies, no raw IPs).

Mirrors the shape of `AnalyticsBundle` from the original `src/lib/visitor-types.ts`
so the dashboard and any external consumer see the same contract.
"""

from collections import Counter, defaultdict
from datetime import timedelta

from django.utils import timezone

from civic.models import VisitorEvent

DEVICE_NAMES = {"mobile": "মোবাইল", "tablet": "ট্যাবলেট", "desktop": "ডেস্কটপ"}

COUNTRY_NAMES = {
    "BD": "বাংলাদেশ",
    "IN": "ভারত",
    "US": "যুক্তরাষ্ট্র",
    "GB": "যুক্তরাজ্য",
    "AE": "সংযুক্ত আরব আমিরাত",
    "SA": "সৌদি আরব",
    "QA": "কাতার",
    "KW": "কুয়েত",
    "OM": "ওমান",
    "BH": "বাহরাইন",
    "MY": "মালয়েশিয়া",
    "SG": "সিঙ্গাপুর",
    "CA": "কানাডা",
    "AU": "অস্ট্রেলিয়া",
    "IT": "ইতালি",
    "FR": "ফ্রান্স",
    "DE": "জার্মানি",
    "NL": "নেদারল্যান্ডস",
    "ES": "স্পেন",
    "JP": "জাপান",
    "KR": "দক্ষিণ কোরিয়া",
    "CN": "চীন",
    "PK": "পাকিস্তান",
    "NP": "নেপাল",
    "LK": "শ্রীলঙ্কা",
    "TH": "থাইল্যান্ড",
    "TR": "তুরস্ক",
    "EG": "মিশর",
    "RU": "রাশিয়া",
    "BR": "ব্রাজিল",
}


def _session_stats(events):
    sessions: dict[str, list[VisitorEvent]] = defaultdict(list)
    for ev in events:
        sessions[ev.session].append(ev)
    rows = []
    for sid, evs in sessions.items():
        evs.sort(key=lambda e: e.ts)
        first, last = evs[0], evs[-1]
        rows.append(
            {
                "id": sid,
                "firstSeen": first.ts.isoformat(),
                "lastSeen": last.ts.isoformat(),
                "durationSec": int((last.ts - first.ts).total_seconds()),
                "views": len(evs),
                "entry": first.path,
                "exit": last.path,
                "pages": [e.path for e in evs],
                "device": last.device,
                "browser": last.browser,
                "os": last.os,
                "country": last.country or None,
                "city": last.city or None,
                "referrer": first.referrer or None,
                "lang": last.lang or None,
            }
        )
    rows.sort(key=lambda r: r["lastSeen"], reverse=True)
    return rows


def _top(counter: Counter, limit: int = 10, labels=None):
    out = []
    for key, value in counter.most_common(limit):
        row = {"label": (labels or {}).get(key, key) or "অজানা", "views": value}
        out.append(row)
    return out


def build(days: int = 7) -> dict:
    days = days if days in (7, 30, 90) else 7
    now = timezone.now()
    local_today = timezone.localdate()
    since = now - timedelta(days=days)
    today_start = timezone.make_aware(
        timezone.datetime.combine(local_today, timezone.datetime.min.time())
    )

    ranged = list(VisitorEvent.objects.filter(ts__gte=since))
    today_events = [e for e in ranged if e.ts >= today_start]
    active_sessions = {e.session for e in ranged if e.ts >= now - timedelta(minutes=5)}

    all_count = VisitorEvent.objects.count()
    all_sessions = VisitorEvent.objects.values("session").distinct().count()

    sessions = _session_stats(ranged)
    range_visitors = len(sessions)
    total_duration = sum(s["durationSec"] for s in sessions)
    bounces = sum(1 for s in sessions if s["views"] == 1)

    # Daily series (local dates).
    per_day_views: Counter = Counter()
    per_day_sessions: dict[str, set] = defaultdict(set)
    for ev in ranged:
        key = timezone.localtime(ev.ts).date().isoformat()
        per_day_views[key] += 1
        per_day_sessions[key].add(ev.session)
    series = []
    for offset in range(days - 1, -1, -1):
        day = (local_today - timedelta(days=offset)).isoformat()
        series.append(
            {
                "date": day,
                "views": per_day_views.get(day, 0),
                "visitors": len(per_day_sessions.get(day, set())),
            }
        )

    def row_counter(attr):
        return Counter(getattr(e, attr) for e in ranged)

    page_titles = {}
    for ev in ranged:
        if ev.title and ev.path not in page_titles:
            page_titles[ev.path] = ev.title
    pages = Counter(e.path for e in ranged)
    page_visitors: dict[str, set] = defaultdict(set)
    for ev in ranged:
        page_visitors[ev.path].add(ev.session)
    pages_list = [
        {"label": path, "views": n, "visitors": len(page_visitors[path])}
        for path, n in pages.most_common(15)
    ]
    countries_counter = row_counter("country")
    countries = [
        {
            "label": COUNTRY_NAMES.get(code, code) if code else "অজানা",
            "code": code or "",
            "views": n,
        }
        for code, n in countries_counter.most_common(10)
    ]

    referrers = Counter()
    for ev in ranged:
        if not ev.referrer:
            referrers["সরাসরি"] += 1
        else:
            host = ev.referrer.split("/")[2] if "//" in ev.referrer else ev.referrer
            referrers[host.removeprefix("www.")] += 1

    recent = [
        {
            "id": e.id,
            "session": e.session,
            "path": e.path,
            "title": e.title or None,
            "ts": e.ts.isoformat(),
            "device": e.device,
            "browser": e.browser,
            "os": e.os,
            "country": e.country or None,
            "city": e.city or None,
        }
        for e in ranged[:30]
    ]

    return {
        "generatedAt": now.isoformat(),
        "range": days,
        "totals": {
            "activeNow": len(active_sessions),
            "todayViews": len(today_events),
            "todayVisitors": len({e.session for e in today_events}),
            "rangeViews": len(ranged),
            "rangeVisitors": range_visitors,
            "allViews": all_count,
            "allSessions": all_sessions,
            "pagesPerSession": round(len(ranged) / range_visitors, 2)
            if range_visitors
            else 0,
            "avgDurationSec": round(total_duration / range_visitors)
            if range_visitors
            else 0,
            "bounceRate": round(bounces / range_visitors * 100)
            if range_visitors
            else 0,
        },
        "series": series,
        "pages": pages_list,
        "countries": countries,
        "cities": _top(row_counter("city"), 10),
        "devices": _top(row_counter("device"), 5, DEVICE_NAMES),
        "browsers": _top(row_counter("browser"), 8),
        "sources": _top(referrers, 8),
        "recent": recent,
        "sessions": sessions[:50],
    }
