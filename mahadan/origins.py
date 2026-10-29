"""Derive CSRF trusted origins from ALLOWED_HOSTS.

Django compares the request's ``Origin`` header against exact ``scheme://host``
entries, and supports wildcard subdomains only in the ``https://*.example.com``
form. A leading-dot host (``.e2b.app``) therefore has to become that wildcard;
stripping the dot (``https://e2b.app``) silently rejects every subdomain and
breaks the login form with a 403.
"""

LOCAL_NAMES = ("localhost", "127.0.0.1", "0.0.0.0")


def csrf_trusted_origins(allowed_hosts, extra=()):
    origins: list[str] = []
    for raw in allowed_hosts:
        host = raw.strip()
        name = host.lstrip(".")
        if not name or name == "*":
            continue
        if name in LOCAL_NAMES or name.endswith(".localhost"):
            continue  # plain-http local dev is covered by Django's same-origin check
        origin = f"https://*{host}" if host.startswith(".") else f"https://{host}"
        if origin not in origins:
            origins.append(origin)
    for item in extra:
        item = item.strip()
        if item and item not in origins:
            origins.append(item)
    return origins
