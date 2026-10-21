"""Read-only campaign content.

The JSON documents in `content/data/` were generated from the original
TypeScript content modules (`src/content/*.ts`). Editing them changes the
public site without touching code. Loading is cached per process.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from django.conf import settings
from django.templatetags.static import static


@lru_cache(maxsize=None)
def load(name: str) -> dict[str, Any]:
    path = settings.BASE_DIR / "content" / "data" / f"{name}.json"
    return json.loads(path.read_text(encoding="utf-8"))


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
    """Resolve a semantic image key (e.g. "water") to a static URL.

    Direct paths and remote URLs are returned unchanged, so new photos can be
    used without editing the registry.
    """
    if not key:
        return None
    if key.startswith(("http://", "https://", "data:")):
        return key
    src = image_map().get(key, key)
    if src.startswith("/media/"):
        # Registry paths are written against the old Next.js public/ folder.
        return static(src.removeprefix("/"))
    if src.startswith("/"):
        return src
    return None
