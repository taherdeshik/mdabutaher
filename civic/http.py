"""JSON response helpers that mirror the original `{ ok, data }` contract."""

import json
from functools import wraps

from django.core.cache import cache
from cms.copy import message_text
from django.http import HttpRequest, JsonResponse


def ok(data=None, status: int = 200) -> JsonResponse:
    return JsonResponse(
        {"ok": True, "data": data},
        status=status,
        json_dumps_params={"ensure_ascii": False},
    )


def fail(
    message: str,
    status: int = 400,
    errors: dict | None = None,
    headers: dict | None = None,
) -> JsonResponse:
    body = {"ok": False, "error": message}
    if errors:
        body["errors"] = errors
    response = JsonResponse(
        body, status=status, json_dumps_params={"ensure_ascii": False}
    )
    for k, v in (headers or {}).items():
        response[k] = v
    return response


def client_ip(request: HttpRequest) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip() or "local"
    return (
        request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR") or "local"
    )


def rate_limited(request: HttpRequest, key: str, limit: int = 8, window: int = 60):
    """Fixed-window limiter backed by Django's cache. Returns (allowed, retry_after)."""
    bucket = f"rl:{key}:{client_ip(request)}"
    if cache.add(bucket, 1, timeout=window):
        return True, 0
    try:
        count = cache.incr(bucket)
    except ValueError:
        cache.set(bucket, 1, timeout=window)
        return True, 0
    if count > limit:
        return False, window
    return True, 0


def limit(key: str, max_requests: int = 8, window: int = 60):
    """Decorator: rate-limit a view by client IP, responding 429 when exceeded."""

    def decorator(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            allowed, retry = rate_limited(request, key, max_requests, window)
            if not allowed:
                return fail(
                    message_text("http.rate_limited"),
                    429,
                    headers={"Retry-After": str(retry)},
                )
            return view(request, *args, **kwargs)

        return wrapped

    return decorator


def parse_json(request: HttpRequest):
    """Return the decoded JSON body, or None when it is not a JSON object."""
    try:
        body = json.loads(request.body or b"{}")
    except (ValueError, UnicodeDecodeError):
        return None
    return body if isinstance(body, dict) else None
