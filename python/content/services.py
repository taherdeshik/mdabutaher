"""পাবলিক সাইটের কনটেন্ট রেজলভার — ডেটাবেস + কোডের ডিফল্ট একসাথে।"""
from __future__ import annotations

from datetime import date, timedelta

from django.db.models import QuerySet
from django.utils import timezone

from . import data
from .models import (
    Event,
    GalleryPhoto,
    GalleryPoster,
    HomeSection,
    Pillar,
    Post,
    SitePage,
    TickerItem,
    TickerSettings,
    VideoItem,
)


# ------------------------------------------------------------------ posts
def posts(kind: str = Post.KIND_BLOG) -> QuerySet[Post]:
    return Post.objects.filter(kind=kind, status="published")


def post_by_slug(slug: str, kind: str | None = None) -> Post | None:
    qs = Post.objects.filter(slug=slug, status="published")
    if kind:
        qs = qs.filter(kind=kind)
    return qs.first()


def related_posts(post: Post, limit: int = 3) -> list[Post]:
    qs = posts(post.kind).exclude(pk=post.pk)
    same = list(qs.filter(category=post.category)[:limit])
    if len(same) < limit:
        for other in qs[: limit * 2]:
            if other not in same:
                same.append(other)
            if len(same) == limit:
                break
    return same


def blog_tags() -> list[str]:
    seen: list[str] = []
    for post in posts(Post.KIND_BLOG).only("tags"):
        for tag in post.tags or []:
            if tag and tag not in seen:
                seen.append(tag)
    return seen or data.all_tags()


# ----------------------------------------------------------------- events
def events(include_past: bool = True) -> list[Event]:
    qs = Event.objects.filter(hidden=False)
    if not include_past:
        qs = qs.filter(date__gte=timezone.localdate())
    return list(qs)


def upcoming_events(limit: int | None = None) -> list[Event]:
    today = timezone.localdate()
    qs = Event.objects.filter(hidden=False, date__gte=today).order_by("date", "start")
    return list(qs[:limit] if limit else qs)


def past_events(limit: int | None = None) -> list[Event]:
    today = timezone.localdate()
    qs = Event.objects.filter(hidden=False, date__lt=today).order_by("-date")
    return list(qs[:limit] if limit else qs)


def event_by_slug(slug: str) -> Event | None:
    return Event.objects.filter(slug=slug, hidden=False).first()


def next_event() -> Event | None:
    found = upcoming_events(1)
    return found[0] if found else None


# ---------------------------------------------------------------- pillars
def pillars() -> list[Pillar]:
    return list(Pillar.objects.filter(hidden=False))


def pillar_by_slug(slug: str) -> Pillar | None:
    return Pillar.objects.filter(slug=slug, hidden=False).first()


def manifesto_totals() -> dict:
    rows = pillars()
    commitments = sum(len(p.commitments or []) for p in rows)
    progress = [p.progress for p in rows if p.progress]
    return {
        "pillars": len(rows),
        "commitments": commitments,
        "progress": round(sum(progress) / len(progress)) if progress else 0,
    }


# ---------------------------------------------------------------- gallery
def photos() -> list[GalleryPhoto]:
    return list(GalleryPhoto.objects.filter(hidden=False))


def posters() -> list[GalleryPoster]:
    return list(GalleryPoster.objects.filter(hidden=False))


def videos() -> list[VideoItem]:
    return list(VideoItem.objects.filter(hidden=False))


def photo_tags() -> list[str]:
    seen: list[str] = []
    for photo in photos():
        if photo.tag and photo.tag not in seen:
            seen.append(photo.tag)
    return seen


# ------------------------------------------------------------ site pages
def page_override(page_id: str) -> dict | None:
    row = SitePage.objects.filter(page_id=page_id).first()
    if not row:
        return None
    payload = {
        "label": row.label,
        "eyebrow": row.eyebrow,
        "title": row.title,
        "description": row.description,
        "body": row.body,
        "image": row.image,
        "video": row.video,
        "visible": row.visible,
    }
    return payload if any(str(v).strip() for k, v in payload.items() if k != "visible") or not row.visible else None


def page_copy(page_id: str) -> dict:
    """সাইট পেজের চূড়ান্ত লেখা: ডেটাবেসের ওভাররাইড + কোডের ডিফল্ট।"""
    base = next((p for p in data.site_pages() if p["id"] == page_id), None) or {"id": page_id}
    override = page_override(page_id) or {}
    merged = {
        "id": page_id,
        "href": base.get("href", "/"),
        "label": override.get("label") or base.get("label", ""),
        "group": base.get("group", ""),
        "builtin": base.get("builtin", ""),
        "eyebrow": override.get("eyebrow", ""),
        "title": override.get("title", ""),
        "description": override.get("description", ""),
        "body": override.get("body", ""),
        "image": override.get("image", ""),
        "video": override.get("video", ""),
        "visible": override.get("visible", True),
    }
    return merged


def page_visible(page_id: str) -> bool:
    return page_copy(page_id)["visible"]


# --------------------------------------------------------- home sections
def home_copy(section_id: str) -> dict:
    base = next((s for s in data.home_sections() if s["id"] == section_id), {"id": section_id})
    row = HomeSection.objects.filter(section_id=section_id).first()
    return {
        "id": section_id,
        "label": base.get("label", ""),
        "hint": base.get("hint", ""),
        "builtin": base.get("builtin", ""),
        "eyebrow": (row.eyebrow if row else "") or "",
        "title": (row.title if row else "") or "",
        "description": (row.description if row else "") or "",
        "visible": row.visible if row else True,
    }


# --------------------------------------------------------------- ticker
def ticker() -> dict:
    """হেডার টিকার — `src/lib/ticker.ts`-এর সমতুল্য।"""
    settings = TickerSettings.load()
    if not settings.enabled:
        return {"enabled": False, "items": []}

    active = list(TickerItem.objects.filter(active=True))
    if settings.mode == "custom":
        return {
            "enabled": True,
            "items": [{"text": i.text, "href": i.href or "/"} for i in active],
        }

    live: list[dict] = []
    for post in posts(Post.KIND_BLOG)[:4]:
        live.append({"text": post.title, "href": post.get_absolute_url()})
    for event in upcoming_events(3):
        live.append({"text": f"{event.title} · {event.venue}", "href": event.get_absolute_url()})

    seen: set[str] = set()
    merged: list[dict] = []
    for item in [*live, *data.ticker_defaults()]:
        key = item["text"].strip()
        if not key or key in seen:
            continue
        seen.add(key)
        merged.append({"text": key, "href": item.get("href", "/")})
    return {"enabled": True, "items": merged[:8]}


# ------------------------------------------------------------- dashboard
def dashboard_numbers() -> dict:
    today = timezone.localdate()
    week_ago = today - timedelta(days=7)
    total_voters = sum(b.voters for b in data.command_seed().get("wards", []) if isinstance(b, dict)) or 0
    return {
        "today": today,
        "week_ago": week_ago,
    }
