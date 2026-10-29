"""Campaign content used by the public pages.

Documents are stored in the database (``cms.ContentDocument``) and seeded from
``content/data/*.json``. Edits made in the dashboard take effect within
``CMS_CACHE_SECONDS``. Image references may be semantic keys (``"water"``),
library references (``"asset:12"``), direct paths or remote URLs.
"""

from __future__ import annotations

from typing import Any

from django.templatetags.static import static

from cms import store as cms_store


def load(name: str) -> dict[str, Any]:
    return cms_store.load_document(name)


def site() -> dict[str, Any]:
    return load("site")["site"]


def nav() -> list[dict[str, Any]]:
    return site()["nav"]


def events() -> list[dict[str, Any]]:
    return load("events")["events"]


def event_types() -> list[str]:
    return load("events")["eventTypes"]


def find_event(event_id: str) -> dict[str, Any] | None:
    return next((e for e in events() if e["id"] == event_id), None)


def activities() -> list[dict[str, Any]]:
    return load("activities")["activities"]


def find_activity(activity_id: str) -> dict[str, Any] | None:
    return next((a for a in activities() if a["id"] == activity_id), None)


def news() -> list[dict[str, Any]]:
    return load("news")["news"]


def find_news(news_id: str) -> dict[str, Any] | None:
    return next((n for n in news() if n["id"] == news_id), None)


def posts() -> list[dict[str, Any]]:
    return load("blog")["posts"]


def find_post(slug: str) -> dict[str, Any] | None:
    return next((p for p in posts() if p["slug"] == slug), None)


def polls() -> list[dict[str, Any]]:
    return load("polls")["seedPolls"]


def find_poll(poll_id: str) -> dict[str, Any] | None:
    return next((p for p in polls() if p["id"] == poll_id), None)


def image_map() -> dict[str, str]:
    return load("media")["imageMap"]


def image_for(key: str | None) -> str | None:
    """Resolve an image reference to a URL (see module docstring)."""
    if not key:
        return None
    if key.startswith(("http://", "https://", "data:")):
        return key
    if key.startswith("asset:"):
        return cms_store.resolve_ref(key)
    src = image_map().get(key, key)
    if src.startswith("asset:"):
        return cms_store.resolve_ref(src)
    if src.startswith("/media/"):
        # Registry paths are written against the old Next.js public/ folder.
        return static(src.removeprefix("/"))
    if src.startswith("/"):
        return src
    return None
