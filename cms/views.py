"""Dashboard content page and the public upload server (/uploads/…)."""

import mimetypes
import re
from pathlib import Path

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import FileResponse, Http404, HttpRequest, HttpResponse
from django.shortcuts import redirect, render

from dashboard.auth import actor_for

from .api import EDIT_ROLES

for _ext, _type in {".webp": "image/webp", ".m4a": "audio/mp4", ".flac": "audio/flac",
                     ".webm": "video/webm", ".mp4": "video/mp4", ".ogg": "audio/ogg"}.items():
    mimetypes.add_type(_type, _ext)

RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)$")


@login_required(login_url="dashboard:login")
def content_page(request: HttpRequest):
    actor = actor_for(request)
    if actor is None or not actor.can(EDIT_ROLES):
        messages.error(request, "কনটেন্ট সম্পাদনার অনুমতি শুধু মালিক ও ম্যানেজারের।")
        return redirect("dashboard:login")
    return render(request, "dashboard/content.html", {"actor": actor})


def serve_upload(request: HttpRequest, path: str):
    """Serve uploaded media with HTTP Range support (needed for video/audio seeking)."""
    root = Path(settings.MEDIA_ROOT).resolve()
    target = (root / path).resolve()
    if root not in target.parents or not target.is_file():
        raise Http404
    size = target.stat().st_size
    ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    headers = {
        "Cache-Control": "public, max-age=604800",
        "Accept-Ranges": "bytes",
        "X-Content-Type-Options": "nosniff",
    }
    match = RANGE_RE.match(request.headers.get("Range", ""))
    if match and size:
        start_s, end_s = match.groups()
        if start_s:
            start = int(start_s)
            end = min(int(end_s) if end_s else size - 1, size - 1)
        else:  # suffix range: last N bytes
            start = max(size - int(end_s or 0), 0)
            end = size - 1
        if start > end or start >= size:
            response = HttpResponse(status=416)
            response["Content-Range"] = f"bytes */{size}"
            return response
        with target.open("rb") as fh:
            fh.seek(start)
            data = fh.read(end - start + 1)
        response = HttpResponse(data, status=206, content_type=ctype)
        response["Content-Range"] = f"bytes {start}-{end}/{size}"
        response["Content-Length"] = str(len(data))
        for k, v in headers.items():
            response[k] = v
        return response
    response = FileResponse(target.open("rb"), content_type=ctype)
    response["Content-Length"] = str(size)
    for k, v in headers.items():
        response[k] = v
    return response
