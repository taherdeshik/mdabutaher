"""পাবলিক সাইটের টেস্ট — পেজ, ফর্ম, জরিপ, টিকার।"""
from __future__ import annotations

import datetime as dt

from django.test import TestCase
from django.urls import reverse

from content import services
from content.models import Event, Pillar, Post, TickerItem, TickerSettings
from crm.models import Appointment, Conversation, Feedback, Poll, PollOption, PollVote


class PublicPagesTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Pillar.objects.create(slug="water", number="০১", title="নিরাপদ পানি", summary="সারসংক্ষেপ", progress=40,
                              commitments=[{"title": "নলকূপ", "detail": "বিবরণ", "timeline": "৬ মাস"}])
        Event.objects.create(slug="evt-a", title="উঠান বৈঠক", type="উঠান বৈঠক", date=dt.date(2026, 12, 1),
                             venue="মাঠ", description="বর্ণনা", capacity=100, registered=20)
        Post.objects.create(kind=Post.KIND_BLOG, slug="blog-a", title="ব্লগ লেখা", excerpt="সার",
                            category="শিক্ষা", published_on=dt.date(2026, 9, 1), blocks=[{"type": "p", "text": "লেখা"}])
        Post.objects.create(kind=Post.KIND_NEWS, slug="news-a", title="সংবাদ", excerpt="সার",
                            published_on=dt.date(2026, 9, 2), paragraphs=["প্যারাগ্রাফ"], outlet="দৈনিক")
        poll = Poll.objects.create(slug="poll-x", question="সবচেয়ে জরুরি?", base_votes=100)
        PollOption.objects.create(poll=poll, key="water", label="পানি", seed_votes=60, position=0)
        PollOption.objects.create(poll=poll, key="road", label="সড়ক", seed_votes=40, position=1)

    def test_all_public_pages_render(self):
        for name in ["home", "about", "activities", "manifesto", "manifesto_print", "campaign",
                     "events", "blog", "news", "polls", "appointment", "feedback", "chat",
                     "contact", "media_kit", "privacy"]:
            with self.subTest(page=name):
                response = self.client.get(reverse(f"web:{name}"))
                self.assertEqual(response.status_code, 200)

    def test_detail_pages(self):
        self.assertEqual(self.client.get("/blog/blog-a/").status_code, 200)
        self.assertEqual(self.client.get("/events/evt-a/").status_code, 200)
        self.assertEqual(self.client.get("/news/news-a/").status_code, 200)
        self.assertEqual(self.client.get("/blog/nope/").status_code, 404)

    def test_gallery_tabs(self):
        for tab in ("photos", "posters", "videos"):
            self.assertEqual(self.client.get(f"/gallery/{tab}/").status_code, 200)
        self.assertEqual(self.client.get("/video-gallery/").status_code, 302)

    def test_seo_endpoints(self):
        self.assertContains(self.client.get("/sitemap.xml"), "<urlset")
        self.assertContains(self.client.get("/feed.xml"), "<rss")
        self.assertEqual(self.client.get("/robots.txt")["Content-Type"], "text/plain")
        self.assertEqual(self.client.get("/manifest.webmanifest").json()["lang"], "bn")

    def test_appointment_form_creates_row(self):
        response = self.client.post("/appointment/", {
            "name": "রহিম উদ্দিন", "phone": "01711111111", "ward": "২", "topic": "service",
            "preferred_date": "2026-12-05", "slot": "সকাল ১০টা – ১২টা", "note": "টিউবওয়েল", "consent": "on",
        }, follow=True)
        self.assertEqual(response.status_code, 200)
        row = Appointment.objects.get()
        self.assertEqual(row.phone, "01711111111")
        self.assertEqual(row.status, "pending")

    def test_appointment_rejects_bad_phone(self):
        response = self.client.post("/appointment/", {"name": "ক", "phone": "123", "consent": "on"})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Appointment.objects.exists())

    def test_appointment_accepts_bengali_digits(self):
        self.client.post("/appointment/", {"name": "খ", "phone": "০১৭২২২২২২২২", "consent": "on"})
        self.assertTrue(Appointment.objects.filter(phone="01722222222").exists())

    def test_feedback_creates_row_and_marks_threat(self):
        self.client.post("/feedback/", {"kind": "problem", "message": "রাস্তা খারাপ", "consent": "on"})
        self.assertEqual(Feedback.objects.count(), 1)
        self.client.post("/feedback/", {"kind": "threat", "message": "হুমকি", "consent": "on"}, follow=True)
        self.assertTrue(Feedback.objects.filter(kind="threat").exists())

    def test_poll_vote_counts_once(self):
        option = PollOption.objects.get(key="water")
        for _ in range(2):
            self.client.post("/polls/", {"option": str(option.pk)}, follow=True)
        self.assertEqual(PollVote.objects.filter(option=option).count(), 1)
        self.assertEqual(PollOption.objects.get(key="water").votes, 61)

    def test_chat_creates_conversation(self):
        response = self.client.post("/chat/", {"name": "করিম", "phone": "01733333333", "message": "সাহায্য দরকার"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(Conversation.objects.first().messages.count(), 1)


class TickerTests(TestCase):
    def test_auto_mode_uses_defaults(self):
        payload = services.ticker()
        self.assertTrue(payload["enabled"])
        self.assertGreaterEqual(len(payload["items"]), 5)

    def test_custom_mode_only_uses_admin_lines(self):
        TickerSettings.objects.update_or_create(pk=1, defaults={"enabled": True, "mode": "custom"})
        TickerItem.objects.create(text="আমার লাইন", href="/events", active=True)
        TickerItem.objects.create(text="লুকানো লাইন", href="/polls", active=False)
        payload = services.ticker()
        self.assertEqual([item["text"] for item in payload["items"]], ["আমার লাইন"])

    def test_disabled_hides_everything(self):
        TickerSettings.objects.update_or_create(pk=1, defaults={"enabled": False, "mode": "auto"})
        self.assertEqual(services.ticker(), {"enabled": False, "items": []})

    def test_api_returns_shape(self):
        response = self.client.get("/api/site/ticker/")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["ok"])
        self.assertIn("enabled", body["data"])
        self.assertIsInstance(body["data"]["items"], list)


class AdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        cls.admin = User.objects.create_superuser("boss", "b@example.com", "secret-pass-123", role="admin")
        cls.captain = User.objects.create_user("cap", password="secret-pass-123", role="captain", is_staff=True)

    def test_requires_login(self):
        response = self.client.get("/admin/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/admin/login/", response["Location"])

    def test_login_and_overview(self):
        self.assertTrue(self.client.login(username="boss", password="secret-pass-123"))
        self.assertEqual(self.client.get("/admin/").status_code, 200)

    def test_all_sections_render(self):
        self.client.login(username="boss", password="secret-pass-123")
        for path in ["/admin/", "/admin/coverage/", "/admin/plan/", "/admin/team/", "/admin/challenges/",
                     "/admin/money/", "/admin/cms/", "/admin/cms/new/", "/admin/site/", "/admin/home/",
                     "/admin/gallery/", "/admin/items/", "/admin/ticker/", "/admin/crm/", "/admin/media/",
                     "/admin/analytics/", "/admin/settings/"]:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    def test_captain_cannot_reach_settings(self):
        self.client.login(username="cap", password="secret-pass-123")
        self.assertEqual(self.client.get("/admin/settings/").status_code, 302)
        self.assertEqual(self.client.get("/admin/plan/").status_code, 200)

    def test_create_post_with_rich_text(self):
        self.client.login(username="boss", password="secret-pass-123")
        response = self.client.post("/admin/cms/new/", {
            "kind": "blog", "slug": "new-post", "title": "নতুন পোস্ট", "excerpt": "সার",
            "category": "শিক্ষা", "published_on": "2026-10-01", "read_time": 5,
            "author_name": "মোঃ আবু তাহের", "author_role": "প্রার্থী", "image": "books",
            "status": "published", "tags_text": "শিক্ষা, পরীক্ষা",
            "rich": "## শিরোনাম\n\nআমার **লেখা**\n\n- একটি\n- দুটি",
        })
        self.assertEqual(response.status_code, 302)
        post = Post.objects.get(slug="new-post")
        self.assertEqual(post.tags, ["শিক্ষা", "পরীক্ষা"])
        html = " ".join(block.get("html", "") for block in post.body_blocks())
        self.assertIn("<h2>", html)
        self.assertIn("<strong>", html)
        self.assertIn("<ul>", html)

    def test_rich_text_escapes_html(self):
        post = Post.objects.create(kind="blog", slug="x", title="x", published_on=dt.date(2026, 9, 1),
                                   rich="<script>alert(1)</script>")
        html = post.body_blocks()[0]["html"]
        self.assertNotIn("<script>", html)
        self.assertIn("&lt;script&gt;", html)

    def test_ticker_admin_flow(self):
        self.client.login(username="boss", password="secret-pass-123")
        self.client.post("/admin/ticker/", {"action": "create", "text": "প্রথম লাইন", "href": "/events", "active": "on"})
        self.client.post("/admin/ticker/", {"action": "create", "text": "দ্বিতীয় লাইন", "href": "/polls", "active": "on"})
        rows = list(TickerItem.objects.order_by("position"))
        self.assertEqual([row.text for row in rows], ["প্রথম লাইন", "দ্বিতীয় লাইন"])

        self.client.post("/admin/ticker/", {"action": "move", "id": rows[1].pk, "direction": "up"})
        rows = list(TickerItem.objects.order_by("position"))
        self.assertEqual(rows[0].text, "দ্বিতীয় লাইন")

        self.client.post("/admin/ticker/", {"action": "toggle", "id": rows[0].pk})
        self.assertFalse(TickerItem.objects.get(pk=rows[0].pk).active)

        self.client.post("/admin/ticker/", {"action": "settings", "enabled": "on", "mode": "custom"})
        self.assertEqual(TickerSettings.load().mode, "custom")

        self.client.post("/admin/ticker/", {"action": "reset"})
        self.assertEqual(TickerItem.objects.count(), 0)
        self.assertEqual(TickerSettings.load().mode, "auto")

    def test_update_event_and_pillar(self):
        self.client.login(username="boss", password="secret-pass-123")
        event = Event.objects.create(slug="e1", title="পুরোনো", date=dt.date(2026, 12, 1), venue="মাঠ")
        pillar = Pillar.objects.create(slug="p1", number="০১", title="পুরোনো স্তম্ভ", progress=10)
        self.client.post("/admin/items/", {
            "kind": "event", "id": event.pk, "title": "নতুন ইভেন্ট", "type": "সভা",
            "date": "2026-12-05", "start": "16:00", "end": "18:00", "venue": "নতুন মাঠ",
            "ward": "৩", "description": "বর্ণনা", "capacity": 200, "registered": 50,
            "speaker": "", "status": "upcoming",
        })
        self.assertEqual(Event.objects.get(pk=event.pk).title, "নতুন ইভেন্ট")
        self.client.post("/admin/items/", {
            "kind": "pillar", "id": pillar.pk, "title": "নতুন স্তম্ভ", "summary": "সার",
            "problem": "সমস্যা", "target": "লক্ষ্য", "budget": "৳১০ লাখ", "progress": 55,
        })
        self.assertEqual(Pillar.objects.get(pk=pillar.pk).progress, 55)

    def test_expense_cheque_warning_and_cap(self):
        self.client.login(username="boss", password="secret-pass-123")
        self.client.post("/admin/money/", {"date": "2026-10-01", "category": "প্রচার", "description": "ব্যানার",
                                           "amount": "50000", "mode": "cash", "voucher": "V-1", "by": "টিম"})
        from crm.models import Expense

        self.assertEqual(Expense.objects.count(), 1)
        response = self.client.get("/admin/money/")
        self.assertContains(response, "চেক")

    def test_csv_export(self):
        self.client.login(username="boss", password="secret-pass-123")
        Appointment.objects.create(name="ক", phone="01711111111")
        response = self.client.get("/admin/export/appointments.csv")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response["Content-Type"])
        self.assertIn("01711111111", response.content.decode())
