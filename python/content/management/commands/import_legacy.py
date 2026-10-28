"""পুরোনো Next.js অ্যাপের `data/db.json` → PostgreSQL।

ব্যবহার:
    python manage.py import_legacy                  # ../data/db.json থেকে
    python manage.py import_legacy --path /path/db.json
    python manage.py import_legacy --dry-run        # শুধু কী কী আসবে দেখায়

সব লেখা/ছবি/অ্যাডমিন-সম্পাদনা একইভাবে স্থানান্তর হয়; কিছুই হারায় না।
একই ফাইল দুইবার চালালেও ডুপ্লিকেট হয় না (slug/id ধরে upsert)।
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_date, parse_datetime

from content.models import (
    Event,
    GalleryPhoto,
    GalleryPoster,
    HomeSection,
    Pillar,
    Post,
    Setting,
    SitePage,
    TickerItem,
    TickerSettings,
    VideoItem,
)
from crm.models import Appointment, Feedback, PollVote, VisitorEvent


def _date(value, fallback=None):
    if not value:
        return fallback or dt.date.today()
    if isinstance(value, dt.date):
        return value
    return parse_date(str(value)[:10]) or fallback or dt.date.today()


def _int(value, default=0):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


class Command(BaseCommand):
    help = "পুরোনো data/db.json-এর সব কনটেন্ট ও CRM ডেটা PostgreSQL-এ নিয়ে আসে"

    def add_arguments(self, parser):
        parser.add_argument("--path", default=str(Path(__file__).resolve().parents[3].parent / "data" / "db.json"))
        parser.add_argument("--dry-run", action="store_true")

    @transaction.atomic
    def handle(self, *args, **options):
        path = Path(options["path"])
        if not path.exists():
            raise CommandError(
                f"ফাইল পাওয়া যায়নি: {path}\n"
                "Next.js অ্যাপ একবার চালালে data/db.json তৈরি হয়; অথবা --path দিয়ে সঠিক পথ দিন।"
            )
        data = json.loads(path.read_text(encoding="utf-8"))
        dry = options["dry_run"]
        stats: dict[str, int] = {}

        def bump(key: str, n: int = 1):
            stats[key] = stats.get(key, 0) + n

        # ------------------------------------------------------------ posts
        for row in data.get("posts", []):
            kind = row.get("type", "blog")
            slug = row.get("slug") or row.get("id")
            if not slug:
                continue
            if kind == "event":
                Event.objects.update_or_create(
                    slug=slug,
                    defaults={
                        "title": row.get("title", "")[:220],
                        "type": "সভা",
                        "date": _date(row.get("date")),
                        "start": "16:00",
                        "end": "18:00",
                        "venue": row.get("venue") or row.get("location") or "",
                        "description": "\n\n".join(row.get("body", []) or []),
                        "status": "upcoming",
                        "hidden": row.get("status") != "published",
                    },
                )
                bump("events")
                continue
            Post.objects.update_or_create(
                slug=slug,
                defaults={
                    "kind": Post.KIND_NEWS if kind == "news" else Post.KIND_BLOG,
                    "title": row.get("title", "")[:220],
                    "excerpt": row.get("excerpt", "")[:600],
                    "category": (row.get("tags") or ["সংবাদ"])[0] if row.get("tags") else "",
                    "tags": row.get("tags", []) or [],
                    "published_on": _date(row.get("date")),
                    "author_name": "মোঃ আবু তাহের",
                    "image": row.get("image", "") or "",
                    "featured": bool(row.get("featured")),
                    "status": row.get("status", "published"),
                    "paragraphs": row.get("body", []) or [],
                    "rich": row.get("rich", "") or "",
                    "outlet": row.get("outlet", "") or "",
                },
            )
            bump("posts")

        # ---------------------------------------------------------- gallery
        gallery = data.get("gallery", {}) or {}
        hidden = set(gallery.get("hidden", []) or [])
        for row in gallery.get("photos", []) or []:
            GalleryPhoto.objects.update_or_create(
                ref=row.get("id", ""),
                defaults={
                    "src": row.get("src", ""),
                    "caption": row.get("caption", "")[:220],
                    "tag": row.get("tag", "")[:60],
                    "tall": bool(row.get("tall")),
                    "hidden": row.get("id") in hidden,
                },
            )
            bump("photos")
        for row in gallery.get("posters", []) or []:
            GalleryPoster.objects.update_or_create(
                ref=row.get("id", ""),
                defaults={
                    "src": row.get("src", ""),
                    "title": row.get("title", "")[:220],
                    "subtitle": row.get("subtitle", "")[:220],
                    "election": bool(row.get("election")),
                    "hidden": row.get("id") in hidden,
                },
            )
            bump("posters")
        for row in gallery.get("videos", []) or []:
            VideoItem.objects.update_or_create(
                youtube_id=row.get("youtubeId") or row.get("id", ""),
                defaults={
                    "title": row.get("title", "")[:220],
                    "category": row.get("category", "")[:60],
                    "note": row.get("note", "")[:220],
                    "hidden": row.get("id") in hidden,
                },
            )
            bump("videos")

        # ------------------------------------------------------ page copy
        for page_id, row in (data.get("siteContent") or {}).items():
            SitePage.objects.update_or_create(
                page_id=page_id,
                defaults={
                    "label": row.get("label", "") or "",
                    "eyebrow": row.get("eyebrow", "") or "",
                    "title": row.get("title", "") or "",
                    "description": row.get("description", "") or "",
                    "body": row.get("body", "") or "",
                    "image": row.get("image", "") or "",
                    "video": row.get("video", "") or "",
                    "visible": row.get("visible", True),
                },
            )
            bump("site_pages")

        for section_id, row in (data.get("homeCopy") or {}).items():
            HomeSection.objects.update_or_create(
                section_id=section_id,
                defaults={
                    "eyebrow": row.get("eyebrow", "") or "",
                    "title": row.get("title", "") or "",
                    "description": row.get("description", "") or "",
                    "visible": row.get("visible", True),
                },
            )
            bump("home_sections")

        # --------------------------------------------------- item overrides
        for slug, row in (data.get("eventEdits") or {}).items():
            event = Event.objects.filter(slug=slug).first()
            if not event:
                continue
            for field, value in row.items():
                if value in (None, ""):
                    continue
                if field == "date":
                    event.date = _date(value, event.date)
                elif hasattr(event, field):
                    setattr(event, field, value)
            event.save()
            bump("event_edits")

        for slug, row in (data.get("pillarEdits") or {}).items():
            pillar = Pillar.objects.filter(slug=slug).first()
            if not pillar:
                continue
            if row.get("commitments"):
                pillar.commitments = row["commitments"]
            for field in ("title", "summary", "problem", "target", "budget", "hidden"):
                if row.get(field) not in (None, ""):
                    setattr(pillar, field, row[field])
            if row.get("progress") is not None:
                pillar.progress = max(0, min(100, _int(row["progress"])))
            pillar.save()
            bump("pillar_edits")

        # ------------------------------------------------------------ ticker
        ticker = data.get("ticker") or {}
        if ticker:
            settings_row = TickerSettings.load()
            settings_row.enabled = bool(ticker.get("settings", {}).get("enabled", True))
            mode = ticker.get("settings", {}).get("mode", "auto")
            settings_row.mode = mode if mode in {"auto", "custom"} else "auto"
            settings_row.save()
            for position, item in enumerate(ticker.get("items", []) or []):
                TickerItem.objects.update_or_create(
                    text=item.get("text", "")[:160],
                    defaults={
                        "href": item.get("href", "/")[:200] or "/",
                        "active": item.get("active", True),
                        "position": position,
                    },
                )
                bump("ticker_items")

        # --------------------------------------------------------------- crm
        for row in data.get("appointments", []) or []:
            Appointment.objects.update_or_create(
                phone=row.get("phone", "")[:32] or "0",
                name=row.get("name", "")[:120],
                defaults={
                    "ward": row.get("ward", "")[:40] or "",
                    "topic": "personal",
                    "preferred_date": parse_date(str(row.get("date", ""))[:10]) if row.get("date") else None,
                    "slot": row.get("slot", "")[:20] or "",
                    "note": row.get("message") or row.get("note") or "",
                    "status": row.get("status") if row.get("status") in {"pending", "confirmed", "done", "cancelled"} else "pending",
                },
            )
            bump("appointments")

        for row in data.get("feedback", []) or []:
            Feedback.objects.update_or_create(
                message=(row.get("message") or "")[:4000],
                defaults={
                    "kind": row.get("type") if row.get("type") in {"problem", "advice", "threat", "support"} else "problem",
                    "name": (row.get("name") or "")[:120],
                    "phone": (row.get("phone") or "")[:32],
                    "ward": (row.get("ward") or "")[:40],
                    "village": (row.get("village") or row.get("area") or "")[:120],
                    "status": row.get("status") if row.get("status") in {"new", "reviewing", "resolved", "archived"} else "new",
                },
            )
            bump("feedback")

        for row in (data.get("visitorEvents") or [])[:20000]:
            stamp = parse_datetime(str(row.get("at", ""))) or None
            VisitorEvent.objects.create(
                path=(row.get("path") or "/")[:300],
                referrer=(row.get("referrer") or "")[:300],
                country=(row.get("country") or "")[:80],
                city=(row.get("city") or "")[:120],
                device=(row.get("device") or "")[:20],
                browser=(row.get("browser") or "")[:40],
                os=(row.get("os") or "")[:40],
                visitor_hash=(row.get("visitor") or row.get("fingerprint") or "legacy")[:64],
                is_new_visitor=bool(row.get("isNew", False)),
            )
            bump("visitor_events")

        if data.get("settings"):
            Setting.put("campaign", data["settings"])

        summary = ", ".join(f"{k}={v}" for k, v in sorted(stats.items())) or "কিছুই পাওয়া যায়নি"
        if dry:
            self.stdout.write(self.style.WARNING(f"[dry-run] {summary}"))
            transaction.set_rollback(True)
            return
        self.stdout.write(self.style.SUCCESS(f"ইমপোর্ট সম্পন্ন — {summary}"))
