"""মিডিয়া ফাইল সার্ভ — নতুন আপলোড + পুরোনো আর্কাইভ (../public/media)।"""
from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.http import Http404
from django.views.static import serve

REPO_ROOT = Path(settings.BASE_DIR).parent
PUBLIC_MEDIA = REPO_ROOT / "public" / "media"


def serve_media(request, path: str):
    """প্রথমে আপলোড ফোল্ডার, নাহলে Next.js অ্যাপের পুরোনো ছবির আর্কাইভ।"""
    for root in (Path(settings.MEDIA_ROOT), PUBLIC_MEDIA):
        candidate = (root / path).resolve()
        try:
            candidate.relative_to(root.resolve())
        except ValueError:
            continue
        if candidate.is_file():
            return serve(request, path, document_root=str(root))
    raise Http404("মিডিয়া ফাইল পাওয়া যায়নি")
