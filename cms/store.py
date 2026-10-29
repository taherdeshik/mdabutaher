"""Read/write access to editable site content.

Reads go through a small per-process cache (``CMS_CACHE_SECONDS``), so other
gunicorn workers pick up an edit after at most that many seconds. Writes are
validated, versioned (optimistic concurrency) and recorded in the audit log.
"""

from __future__ import annotations

import json
import re
import time
from functools import lru_cache
from pathlib import Path
from typing import Any

from django.conf import settings
from django.db import transaction
from django.templatetags.static import static

from dashboard.models import AuditLog

from .models import ContentDocument, MediaAsset, SiteText

# Bengali labels for the dashboard. Unknown documents fall back to their file name.
DOC_LABELS = {
    "site": "সাইট ও সাধারণ তথ্য",
    "manifesto": "ইশতেহার",
    "campaign": "প্রচারণা",
    "events": "ইভেন্ট",
    "activities": "কার্যক্রম",
    "news": "সংবাদ",
    "blog": "ব্লগ",
    "gallery": "গ্যালারি",
    "media": "ছবির তালিকা",
    "media-kit": "মিডিয়া কিট",
    "polls": "পোল",
    "testimonials": "মতামত",
    "help": "সাহায্য কেন্দ্র",
    "chat": "চ্যাট সহায়ক",
    "privacy": "গোপনীয়তা নীতি",
}

MAX_DOC_BYTES = 2 * 1024 * 1024
MAX_TEXT_CHARS = 2000
ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,80}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TEXT_KEY_RE = re.compile(r"^[a-z0-9_.]{1,120}$")

_cache: dict[Any, tuple[float, Any]] = {}


class ContentError(Exception):
    """Raised for invalid input; ``errors`` is a list of human-readable messages."""

    def __init__(self, message: str, errors: list[str] | None = None, status: int = 400):
        super().__init__(message)
        self.errors = errors or [message]
        self.status = status


class ConflictError(ContentError):
    def __init__(self, current_version: int):
        super().__init__(
            "অন্য কেউ এই তথ্য বদলেছেন। পাতাটি আবার খুলে নতুন করে সম্পাদনা করুন।",
            status=409,
        )
        self.current_version = current_version


def clear_cache() -> None:
    _cache.clear()


def _cached(key, loader):
    now = time.monotonic()
    hit = _cache.get(key)
    if hit and hit[0] > now:
        return hit[1]
    value = loader()
    _cache[key] = (now + settings.CMS_CACHE_SECONDS, value)
    return value


# --- content documents --------------------------------------------------------


@lru_cache(maxsize=1)
def document_names() -> tuple[str, ...]:
    return tuple(sorted(p.stem for p in (settings.BASE_DIR / "content" / "data").glob("*.json")))


def _dump(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False)


def _file_doc(name: str) -> Any:
    path = settings.BASE_DIR / "content" / "data" / f"{name}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _db_doc(name: str) -> Any:
    body = ContentDocument.objects.filter(pk=name).values_list("body", flat=True).first()
    return _file_doc(name) if body is None else json.loads(body)


def load_document(name: str) -> Any:
    """Current data for a content document (database first, JSON file as fallback)."""
    if name not in document_names():
        raise KeyError(name)
    return _cached(("doc", name), lambda: _db_doc(name))


def document_info(name: str) -> dict[str, Any]:
    row = ContentDocument.objects.filter(pk=name).first()
    return {
        "name": name,
        "label": DOC_LABELS.get(name, name),
        "version": row.version if row else 0,
        "updatedAt": row.updated_at.isoformat() if row else None,
        "updatedBy": row.updated_by if row else "",
        "isDefault": row is None,
    }


def list_documents() -> list[dict[str, Any]]:
    return [document_info(n) for n in document_names()]


def get_document(name: str) -> dict[str, Any]:
    if name not in document_names():
        raise ContentError("এই নামের কোনো তথ্য নেই।", status=404)
    info = document_info(name)
    info["data"] = _db_doc(name)
    return info


def validate_document(name: str, data: Any) -> list[str]:
    """Structural checks that keep the public pages from breaking."""
    errors: list[str] = []
    seed = _file_doc(name)
    if type(data) is not type(seed):
        return ["উপরের স্তরের ধরন মিলছে না (সাধারণত { … } বা […] হতে হবে)।"]
    if len(json.dumps(data, ensure_ascii=False)) > MAX_DOC_BYTES:
        return ["তথ্যের আকার খুব বড় (সর্বোচ্চ ২ MB)।"]

    if isinstance(seed, dict):
        missing = [k for k in seed if k not in data]
        if missing:
            errors.append(f"এই অংশগুলো মুছে ফেলা যাবে না: {', '.join(missing)}")
        for key in seed:
            if key in data and type(data[key]) is not type(seed[key]):
                errors.append(f"«{key}» এর ধরন ভুল হয়েছে।")

    def walk(node: Any, path: str) -> None:
        if isinstance(node, str):
            if len(node) > 20000:
                errors.append(f"{path}: লেখাটি অনেক দীর্ঘ।")
            return
        if isinstance(node, list):
            seen: set[str] = set()
            for i, item in enumerate(node):
                if isinstance(item, dict):
                    ident = item.get("id")
                    if isinstance(ident, str):
                        if not ID_RE.match(ident):
                            errors.append(
                                f"{path}[{i}].id «{ident}» — শুধু ইংরেজি অক্ষর, সংখ্যা, - ও _ চলবে।"
                            )
                        elif ident in seen:
                            errors.append(f"{path}: আইডি «{ident}» একাধিকবার আছে।")
                        seen.add(ident)
                walk(item, f"{path}[{i}]")
            return
        if isinstance(node, dict):
            slug = node.get("slug")
            if isinstance(slug, str) and not SLUG_RE.match(slug):
                errors.append(f"{path}.slug «{slug}» — ছোট ইংরেজি অক্ষর ও «-» ব্যবহার করুন।")
            for k, v in node.items():
                walk(v, f"{path}.{k}" if path else k)

    walk(data, "")
    return errors


def save_document(name: str, data: Any, actor: str, expected_version: int) -> dict[str, Any]:
    if name not in document_names():
        raise ContentError("এই নামের কোনো তথ্য নেই।", status=404)
    errors = validate_document(name, data)
    if errors:
        raise ContentError("কিছু তথ্য সঠিক নয়। সংশোধন করে আবার সংরক্ষণ করুন।", errors)
    with transaction.atomic():
        row = ContentDocument.objects.select_for_update().filter(pk=name).first()
        if row is None:
            row = ContentDocument(pk=name, body=_dump(data), version=1, updated_by=actor)
            row.save()
        else:
            if expected_version != row.version:
                raise ConflictError(row.version)
            row.body = _dump(data)
            row.version += 1
            row.updated_by = actor
            row.save()
    clear_cache()
    AuditLog.record(actor, "content.save", f"{name} (v{row.version})")
    return get_document(name)


def reset_document(name: str, actor: str) -> dict[str, Any]:
    """Restore a document to the original JSON shipped with the code."""
    current = document_info(name)
    data = _file_doc(name)
    result = save_document(name, data, actor, expected_version=current["version"])
    AuditLog.record(actor, "content.reset", name)
    return result


# --- page copy (template text) ----------------------------------------------

CMS_BLOCK_RE = re.compile(
    r'\{%\s*cms\s+"(?P<key>[a-z0-9_.]+)"\s*%\}(?P<default>.*?)\{%\s*endcms\s*%\}', re.S
)
CMS_STR_RE = re.compile(
    r"""\{%\s*cms_str\s+(?:"(?P<k1>[a-z0-9_.]+)"|'(?P<k2>[a-z0-9_.]+)')\s+"""
    r"""(?:"(?P<d1>(?:[^"\\]|\\.)*)"|'(?P<d2>(?:[^'\\]|\\.)*)')""",
    re.S,
)


@lru_cache(maxsize=1)
def _scan_templates() -> tuple[tuple[str, str, str], ...]:
    root = Path(settings.BASE_DIR) / "templates"
    found = []
    for path in sorted(root.rglob("*.html")):
        rel = path.relative_to(root).as_posix()
        if rel.startswith("dashboard/"):
            continue
        page = rel.removesuffix(".html")
        text = path.read_text(encoding="utf-8")
        for m in CMS_BLOCK_RE.finditer(text):
            found.append((m.group("key"), page, m.group("default").strip()))
        for m in CMS_STR_RE.finditer(text):
            key = m.group("k1") or m.group("k2")
            default = m.group("d1") if m.group("d1") is not None else m.group("d2")
            found.append((key, page, default))
    return tuple(found)


def discovered_texts() -> list[dict[str, str]]:
    """Every editable text key found in the public templates (the source of truth)."""
    out: dict[str, dict[str, str]] = {}
    for key, page, default in _scan_templates():
        out.setdefault(key, {"key": key, "page": page, "default": default})
    return list(out.values())


def _text_overrides() -> dict[str, str]:
    return _cached(
        ("texts",),
        lambda: dict(SiteText.objects.values_list("key", "value")),
    )


def text_value(key: str, default: str) -> str:
    return _text_overrides().get(key, default)


def list_texts() -> list[dict[str, Any]]:
    overrides = dict(SiteText.objects.values_list("key", "value"))
    rows = []
    for item in discovered_texts():
        rows.append({**item, "value": overrides.get(item["key"])})
    return rows


def save_text(key: str, value: str, actor: str) -> dict[str, Any]:
    known = {t["key"]: t for t in discovered_texts()}
    if key not in known:
        raise ContentError("এই লেখাটি সম্পাদনাযোগ্য নয়।", status=404)
    value = (value or "").strip()
    if len(value) > MAX_TEXT_CHARS:
        raise ContentError(f"লেখা সর্বোচ্চ {MAX_TEXT_CHARS} অক্ষর হতে পারে।")
    if not value:
        SiteText.objects.filter(pk=key).delete()
        action = "text.reset"
    else:
        SiteText.objects.update_or_create(
            key=key, defaults={"value": value, "updated_by": actor}
        )
        action = "text.save"
    clear_cache()
    AuditLog.record(actor, action, key)
    return {**known[key], "value": value or None}


# --- media assets ------------------------------------------------------------


def asset_url(asset: MediaAsset) -> str:
    if asset.file:
        return asset.file.url
    if asset.static_path:
        return static(asset.static_path)
    return asset.external_url


def _asset_urls() -> dict[int, str]:
    def load():
        return {a.pk: asset_url(a) for a in MediaAsset.objects.all()}

    return _cached(("assets",), load)


def resolve_ref(value: Any) -> str | None:
    """Turn a stored reference into a URL.

    ``asset:<id>`` → the library file/link; ``http(s)://…`` and ``/…`` pass through.
    """
    if not isinstance(value, str) or not value:
        return None
    if value.startswith("asset:"):
        try:
            return _asset_urls().get(int(value.removeprefix("asset:")))
        except ValueError:
            return None
    return value


def asset_references(asset_id: int) -> list[str]:
    """Names of content documents that reference ``asset:<id>`` anywhere."""
    needle = f"asset:{asset_id}"
    hits = []
    for name in document_names():
        if _contains(_db_doc(name), needle):
            hits.append(name)
    return hits


def _contains(node: Any, needle: str) -> bool:
    if isinstance(node, str):
        return node == needle
    if isinstance(node, dict):
        return any(_contains(v, needle) for v in node.values())
    if isinstance(node, list):
        return any(_contains(v, needle) for v in node)
    return False


def invalidate_assets() -> None:
    _cache.pop(("assets",), None)
