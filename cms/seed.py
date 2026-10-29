"""Idempotent seeding after migrate: content documents and bundled images.

Existing rows are never overwritten, so an admin's edits survive later migrations.
"""

import json

from django.conf import settings

from dashboard.models import AuditLog

from . import store
from .models import ContentDocument, MediaAsset

IMAGE_SUFFIXES = {".webp", ".png", ".jpg", ".jpeg", ".gif"}


def seed_documents() -> int:
    created = 0
    for name in store.document_names():
        _, was_created = ContentDocument.objects.get_or_create(
            pk=name,
            defaults={"body": store._dump(store._file_doc(name)), "updated_by": "seed"},
        )
        created += int(was_created)
    return created


def upgrade_documents() -> int:
    """Add top-level keys shipped in newer JSON files to rows saved before they existed.

    Only missing keys are copied (existing values and key order are kept). Each upgrade is a
    new version and is recorded in the audit log.
    """
    upgraded = 0
    for name in store.document_names():
        row = ContentDocument.objects.filter(pk=name).first()
        if row is None:
            continue
        data = json.loads(row.body)
        shipped = store._file_doc(name)
        if not isinstance(data, dict) or not isinstance(shipped, dict):
            continue
        missing = [key for key in shipped if key not in data]
        if not missing:
            continue
        for key in missing:
            data[key] = shipped[key]
        row.body = store._dump(data)
        row.version += 1
        row.updated_by = "seed"
        row.save()
        AuditLog.record("seed", "content.upgrade", f"{name}: +{', '.join(missing)}")
        upgraded += 1
    return upgraded


def seed_static_media() -> int:
    root = settings.BASE_DIR / "static" / "media"
    if not root.exists():
        return 0
    created = 0
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        static_path = path.relative_to(settings.BASE_DIR / "static").as_posix()
        _, was_created = MediaAsset.objects.get_or_create(
            static_path=static_path,
            defaults={
                "kind": MediaAsset.Kind.IMAGE,
                "title": path.stem,
                "created_by": "seed",
            },
        )
        created += int(was_created)
    return created


def seed_defaults(sender=None, **kwargs) -> None:
    seed_documents()
    upgrade_documents()
    seed_static_media()
    store.clear_cache()
