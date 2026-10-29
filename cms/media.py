"""Media library: validated uploads (images, video, audio) and linked media."""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from django.core.files.storage import default_storage

from dashboard.models import AuditLog

from . import store
from .models import MediaAsset

KIND_EXTENSIONS = {
    MediaAsset.Kind.IMAGE: {".png", ".jpg", ".jpeg", ".webp", ".gif"},
    MediaAsset.Kind.VIDEO: {".mp4", ".webm"},
    MediaAsset.Kind.AUDIO: {".mp3", ".m4a", ".ogg", ".wav", ".flac"},
}
YOUTUBE_RE = re.compile(r"(youtube\.com/(watch\?v=|embed/|shorts/)|youtu\.be/)[\w-]{6,}")
VIMEO_RE = re.compile(r"vimeo\.com/(video/)?\d+")


class MediaError(store.ContentError):
    pass


def _sniff(head: bytes, ext: str, kind: str) -> str | None:
    """Return the MIME type if the file's first bytes match its claimed kind, else None."""
    if kind == MediaAsset.Kind.IMAGE:
        if head.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        if head.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        if head[:6] in (b"GIF87a", b"GIF89a"):
            return "image/gif"
        if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
            return "image/webp"
        return None
    if kind == MediaAsset.Kind.VIDEO:
        if head[4:8] == b"ftyp":
            return "video/mp4"
        if head.startswith(b"\x1a\x45\xdf\xa3"):
            return "video/webm"
        return None
    if kind == MediaAsset.Kind.AUDIO:
        if head.startswith(b"ID3") or head[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
            return "audio/mpeg"
        if head.startswith(b"OggS"):
            return "audio/ogg"
        if head[:4] == b"RIFF" and head[8:12] == b"WAVE":
            return "audio/wav"
        if head.startswith(b"fLaC"):
            return "audio/flac"
        if head[4:8] == b"ftyp":
            return "audio/mp4"
        return None
    return None


def _check_kind(kind: str) -> str:
    if kind not in KIND_EXTENSIONS:
        raise MediaError("ধরন হতে হবে ছবি, ভিডিও বা অডিও।")
    return kind


def upload(uploaded, kind: str, title: str, alt: str, actor: str) -> MediaAsset:
    kind = _check_kind(kind)
    ext = Path(uploaded.name or "").suffix.lower()
    if ext not in KIND_EXTENSIONS[kind]:
        allowed = ", ".join(sorted(e.lstrip(".") for e in KIND_EXTENSIONS[kind]))
        raise MediaError(f"এই ধরনের জন্য শুধু এই ফরম্যাট চলে: {allowed}")
    limit_mb = (
        settings.IMAGE_UPLOAD_MAX_MB
        if kind == MediaAsset.Kind.IMAGE
        else settings.UPLOAD_MAX_MB
    )
    if uploaded.size > limit_mb * 1024 * 1024:
        raise MediaError(f"ফাইল খুব বড়। সর্বোচ্চ {limit_mb} MB।")
    head = uploaded.read(64)
    uploaded.seek(0)
    mime = _sniff(head, ext, kind)
    if mime is None:
        raise MediaError("ফাইলের ভেতরের তথ্য দাবি করা ধরনের সাথে মিলছে না।")

    asset = MediaAsset(
        kind=kind,
        title=(title or Path(uploaded.name).stem)[:200],
        alt=(alt or "")[:300],
        mime=mime,
        size=uploaded.size,
        created_by=actor,
    )
    asset.file.save(f"{uuid.uuid4().hex}{ext}", uploaded, save=False)
    asset.save()
    store.invalidate_assets()
    AuditLog.record(actor, "media.upload", f"{kind}: {asset.title}")
    return asset


def add_link(kind: str, url: str, title: str, alt: str, actor: str) -> MediaAsset:
    kind = _check_kind(kind)
    url = (url or "").strip()
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise MediaError("সঠিক লিংক দিন (https:// দিয়ে শুরু)।")
    path_ext = Path(parsed.path).suffix.lower()
    if kind == MediaAsset.Kind.IMAGE:
        if path_ext not in KIND_EXTENSIONS[kind]:
            raise MediaError("ছবির লিংক হতে হবে .jpg, .png, .webp বা .gif দিয়ে শেষ হওয়া।")
    elif kind == MediaAsset.Kind.VIDEO:
        if not (YOUTUBE_RE.search(url) or VIMEO_RE.search(url)):
            if path_ext not in KIND_EXTENSIONS[kind]:
                raise MediaError(
                    "ভিডিও লিংক হতে হবে YouTube/Vimeo বা সরাসরি .mp4 / .webm ফাইলের লিংক।"
                )
    elif kind == MediaAsset.Kind.AUDIO:
        if path_ext not in KIND_EXTENSIONS[kind]:
            raise MediaError("অডিও লিংক হতে হবে .mp3, .m4a, .ogg বা .wav ফাইলের লিংক।")
    asset = MediaAsset.objects.create(
        kind=kind,
        title=(title or parsed.path.rsplit("/", 1)[-1] or parsed.netloc)[:200],
        alt=(alt or "")[:300],
        external_url=url,
        created_by=actor,
    )
    store.invalidate_assets()
    AuditLog.record(actor, "media.link", f"{kind}: {asset.title}")
    return asset


def update(asset: MediaAsset, data: dict, actor: str) -> MediaAsset:
    if "title" in data:
        asset.title = str(data["title"] or "")[:200]
    if "alt" in data:
        asset.alt = str(data["alt"] or "")[:300]
    if "externalUrl" in data and asset.external_url:
        url = str(data["externalUrl"] or "").strip()
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise MediaError("সঠিক লিংক দিন (https:// দিয়ে শুরু)।")
        asset.external_url = url
    asset.save()
    store.invalidate_assets()
    AuditLog.record(actor, "media.update", f"{asset.kind}: {asset.title}")
    return asset


def delete(asset: MediaAsset, actor: str) -> None:
    if not asset.is_deletable:
        raise MediaError("সাইটের সাথে আসা ছবি মুছে ফেলা যাবে না। বদলাতে নতুন ছবি আপলোড করুন।")
    used = store.asset_references(asset.pk)
    if used:
        labels = ", ".join(store.DOC_LABELS.get(n, n) for n in used)
        raise MediaError(f"এই ফাইলটি ব্যবহার হচ্ছে ({labels})। আগে সেখান থেকে সরান।", status=409)
    name = asset.file.name if asset.file else ""
    title = asset.title
    asset.delete()
    if name and default_storage.exists(name):
        default_storage.delete(name)
    store.invalidate_assets()
    AuditLog.record(actor, "media.delete", f"{asset.kind}: {title}")
