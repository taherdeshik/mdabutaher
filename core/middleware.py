from django.http import HttpResponsePermanentRedirect

# Paths that keep their trailing slash (JSON API, Django admin, static files).
SLASH_OK_PREFIXES = ("/api/", "/django-admin/", "/static/")


class TrailingSlashMiddleware:
    """Public pages use clean URLs (/about, not /about/), as the original site did.

    A trailing slash on a page URL is redirected (301) to the clean form. The API keeps its slash.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if (
            len(path) > 1
            and path.endswith("/")
            and not path.startswith(SLASH_OK_PREFIXES)
        ):
            target = path.rstrip("/") or "/"
            if request.META.get("QUERY_STRING"):
                target += "?" + request.META["QUERY_STRING"]
            return HttpResponsePermanentRedirect(target)
        return self.get_response(request)


class SecurityHeadersMiddleware:
    """Adds a conservative Permissions-Policy and Referrer-Policy to every response."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.setdefault(
            "Permissions-Policy", "camera=(), microphone=(), geolocation=()"
        )
        return response
