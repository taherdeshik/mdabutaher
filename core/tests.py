from django.test import TestCase

from . import content


class PublicPagesTests(TestCase):
    def test_all_public_pages_render(self):
        paths = [
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
        for path in paths:
            with self.subTest(path=path):
                res = self.client.get(path)
                self.assertEqual(res.status_code, 200)
                self.assertContains(
                    res, "মহাদান", msg_prefix=path
                ) if path == "/" else None

    def test_detail_pages_render_for_every_seed_item(self):
        for e in content.events():
            self.assertEqual(self.client.get(f"/events/{e['id']}").status_code, 200)
        for a in content.activities():
            self.assertEqual(self.client.get(f"/activities/{a['id']}").status_code, 200)
        for n in content.news():
            self.assertEqual(self.client.get(f"/news/{n['id']}").status_code, 200)
        for p in content.posts():
            self.assertEqual(self.client.get(f"/blog/{p['slug']}").status_code, 200)

    def test_unknown_detail_is_404(self):
        self.assertEqual(self.client.get("/events/does-not-exist").status_code, 404)
        self.assertEqual(self.client.get("/blog/does-not-exist").status_code, 404)

    def test_clean_urls_redirect_trailing_slash(self):
        res = self.client.get("/about/?x=1")
        self.assertEqual(res.status_code, 301)
        self.assertEqual(res["Location"], "/about?x=1")

    def test_blog_filters(self):
        res = self.client.get("/blog", {"cat": "শিক্ষা", "sort": "popular"})
        self.assertEqual(res.status_code, 200)

    def test_sitemap_robots_feed_manifest(self):
        sitemap = self.client.get("/sitemap.xml").content.decode()
        self.assertIn("/events/", sitemap)
        self.assertIn("<urlset", sitemap)
        robots = self.client.get("/robots.txt").content.decode()
        self.assertIn("Disallow: /admin/", robots)
        self.assertIn("Sitemap:", robots)
        feed = self.client.get("/feed.xml")
        self.assertEqual(feed["Content-Type"], "application/rss+xml; charset=utf-8")
        self.assertEqual(self.client.get("/manifest.webmanifest").status_code, 200)

    def test_security_headers(self):
        res = self.client.get("/")
        self.assertEqual(res["Referrer-Policy"], "strict-origin-when-cross-origin")
        self.assertIn("camera=()", res["Permissions-Policy"])

    def test_bengali_digits_filter(self):
        from core.templatetags.civic_tags import bn, bn_num, bn_date

        self.assertEqual(bn(2026), "২০২৬")
        self.assertEqual(bn_num(12500), "১২,৫০০")
        self.assertEqual(str(bn_date("2026-10-22")), "২২ অক্টোবর ২০২৬")

    def test_home_shows_upcoming_events_and_poll(self):
        res = self.client.get("/")
        self.assertContains(res, "আসন্ন ইভেন্ট")
        self.assertContains(res, "data-poll")
