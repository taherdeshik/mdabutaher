"""Idempotent seeding after migrate: content documents and bundled images.

Existing rows are never overwritten, so an admin's edits survive later migrations.
"""

from django.conf import settings

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
    seed_static_media()
    store.clear_cache()
