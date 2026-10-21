"""SEO & PWA endpoints: sitemap.xml, robots.txt, feed.xml, manifest.webmanifest."""

from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils import timezone
from django.utils.html import strip_tags

from . import content

STATIC_PATHS = [
    "/",
    "/about",
    "/manifesto",
    "/manifesto/print",
    "/campaign",
    "/events",
    "/activities",
    "/news",
    "/blog",
    "/gallery",
    "/polls",
    "/appointment",
    "/appointment/status",
    "/feedback",
    "/feedback/board",
    "/chat",
    "/contact",
    "/media-kit",
    "/privacy",
]


def _abs(path: str) -> str:
    return f"{settings.SITE_URL}{path}"


def sitemap(request: HttpRequest):
    today = timezone.localdate().isoformat()
    urls = [
        (p, "weekly" if p != "/" else "daily", "1.0" if p == "/" else "0.7")
        for p in STATIC_PATHS
    ]
    urls += [(f"/events/{e['id']}", "daily", "0.8") for e in content.events()]
    urls += [(f"/activities/{a['id']}", "monthly", "0.6") for a in content.activities()]
    urls += [(f"/news/{n['id']}", "monthly", "0.6") for n in content.news()]
    urls += [(f"/blog/{p['slug']}", "monthly", "0.6") for p in content.posts()]
    body = "".join(
        f"<url><loc>{escape(_abs(path))}</loc><lastmod>{today}</lastmod>"
        f"<changefreq>{freq}</changefreq><priority>{prio}</priority></url>"
        for path, freq, prio in urls
    )
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>'
    return HttpResponse(xml, content_type="application/xml; charset=utf-8")


def robots(request: HttpRequest):
    text = "\n".join(
        [
            "User-agent: *",
            "Allow: /",
            "Disallow: /admin/",
            "Disallow: /django-admin/",
            "Disallow: /api/",
            "",
            f"Sitemap: {_abs('/sitemap.xml')}",
        ]
    )
    return HttpResponse(text + "\n", content_type="text/plain; charset=utf-8")


def feed(request: HttpRequest):
    site = content.site()
    items = []
    for n in content.news():
        items.append((n["date"], n["title"], f"/news/{n['id']}", n["summary"]))
    for p in content.posts():
        items.append((p["date"], p["title"], f"/blog/{p['slug']}", p["excerpt"]))
    for a in content.activities():
        items.append((a["date"], a["title"], f"/activities/{a['id']}", a["summary"]))
    items.sort(key=lambda x: x[0], reverse=True)

    entries = "".join(
        f"<item><title>{escape(title)}</title><link>{escape(_abs(path))}</link>"
        f"<guid>{escape(_abs(path))}</guid><description>{escape(strip_tags(desc))}</description>"
        f"<pubDate>{date}T00:00:00+06:00</pubDate></item>"
        for date, title, path, desc in items[:50]
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<rss version="2.0"><channel>'
        f"<title>{escape(site['name'])} — {escape(site['role'])}</title>"
        f"<link>{escape(settings.SITE_URL)}</link>"
        f"<description>{escape(site['tagline'])}</description>"
        "<language>bn</language>"
        f"{entries}</channel></rss>"
    )
    return HttpResponse(xml, content_type="application/rss+xml; charset=utf-8")


def manifest(request: HttpRequest):
    site = content.site()
    return JsonResponse(
        {
            "name": f"{site['name']} — প্রচারণা",
            "short_name": site["name"],
            "description": site["tagline"],
            "start_url": "/",
            "display": "standalone",
            "background_color": "#f8f4ea",
            "theme_color": "#0a3025",
            "lang": "bn",
            "icons": [
                {
                    "src": "/static/favicon.svg",
                    "sizes": "any",
                    "type": "image/svg+xml",
                    "purpose": "any",
                }
            ],
        },
        content_type="application/manifest+json",
    )
