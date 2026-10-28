"""হালকা ভিজিটর-অ্যানালিটিক্স (প্রাইভেসি-বান্ধব, কোনো কুকি ট্র্যাকিং নয়)।"""
from __future__ import annotations

import hashlib
import re

from crm.models import VisitorEvent

SKIP_PREFIXES = ("/admin", "/django-admin", "/api", "/static", "/media", "/favicon", "/robots.txt")
BOT = re.compile(r"(bot|crawler|spider|preview|monitor|curl|wget|python-requests)", re.I)


def _client_ip(request) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "") or "0.0.0.0"


def _device(ua: str) -> str:
    if re.search(r"(ipad|tablet)", ua, re.I):
        return "tablet"
    if re.search(r"(mobi|android|iphone)", ua, re.I):
        return "mobile"
    return "desktop"


def _browser(ua: str) -> str:
    for name in ("Edg", "OPR", "Chrome", "Firefox", "Safari"):
        if name in ua:
            return {"Edg": "Edge", "OPR": "Opera"}.get(name, name)
    return "অন্যান্য"


def _os(ua: str) -> str:
    for key, name in (("Android", "Android"), ("iPhone", "iOS"), ("iPad", "iPadOS"), ("Windows", "Windows"), ("Mac OS", "macOS"), ("Linux", "Linux")):
        if key in ua:
            return name
    return "অন্যান্য"


class VisitorMiddleware:
    """GET পেজ ভিজিট রেকর্ড করে — `/admin` → ড্যাশবোর্ডের অ্যানালিটিক্সে দেখায়।"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            self.track(request, response)
        except Exception:  # analytics কখনো পেজ আটকাবে না
            pass
        return response

    def track(self, request, response) -> None:
        if request.method != "GET" or response.status_code >= 400:
            return
        if any(request.path.startswith(p) for p in SKIP_PREFIXES):
            return
        ua = request.META.get("HTTP_USER_AGENT", "")
        if not ua or BOT.search(ua):
            return

        ip = _client_ip(request)
        digest = hashlib.sha256(f"{ip}|{ua}".encode()).hexdigest()[:32]

        session = getattr(request, "session", None)
        seen = session.get("_seen_paths", []) if session else []
        if request.path in seen:
            return
        is_new = not session.get("_visitor_key") if session else True
        if session is not None:
            seen.append(request.path)
            session["_seen_paths"] = seen[-12:]
            session.setdefault("_visitor_key", digest)

        country = (
            request.META.get("HTTP_CF_IPCOUNTRY")
            or request.META.get("HTTP_X_VERCEL_IP_COUNTRY")
            or "BD"
        )
        VisitorEvent.objects.create(
            path=request.path[:300],
            referrer=(request.META.get("HTTP_REFERER", "") or "")[:300],
            country=country[:80],
            city=(request.META.get("HTTP_X_VERCEL_IP_CITY", "") or "")[:120],
            device=_device(ua),
            browser=_browser(ua),
            os=_os(ua),
            visitor_hash=digest,
            is_new_visitor=is_new,
        )
