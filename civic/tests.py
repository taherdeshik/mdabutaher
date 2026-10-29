from datetime import timedelta

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from core import content

from .models import (
    Appointment,
    EventRegistration,
    Feedback,
    Lead,
    Message,
    PollVote,
    Subscriber,
    VisitorEvent,
)


def next_weekday(weekday: int) -> str:
    """ISO date of the next given weekday (Mon=0) at least 2 days ahead."""
    day = timezone.localdate() + timedelta(days=2)
    while day.weekday() != weekday:
        day += timedelta(days=1)
    return day.isoformat()


class AppointmentApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.date = next_weekday(1)  # a Tuesday
        self.payload = {
            "name": "রহিম উদ্দিন",
            "phone": "01711203997",
            "email": "",
            "type": "meeting",
            "date": self.date,
            "slot": "10:00",
            "mode": "in-person",
            "ward": "৩",
            "topic": "রাস্তার সংস্কার নিয়ে কথা",
            "notes": "",
        }

    def test_create_appointment_returns_reference_and_lead(self):
        res = self.client.post(
            "/api/appointments/", self.payload, content_type="application/json"
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertTrue(body["ok"])
        self.assertTrue(body["data"]["appointment"]["reference"].startswith("MAT-"))
        self.assertEqual(Lead.objects.get(phone="01711203997").source, "appointment")

    def test_rejects_invalid_phone_with_field_error(self):
        bad = {**self.payload, "phone": "12345"}
        res = self.client.post(
            "/api/appointments/", bad, content_type="application/json"
        )
        self.assertEqual(res.status_code, 422)
        self.assertIn("phone", res.json()["errors"])

    def test_rejects_friday_in_person(self):
        friday = next_weekday(4)
        res = self.client.post(
            "/api/appointments/",
            {**self.payload, "date": friday},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 422)
        self.assertIn("শুক্রবার", res.json()["error"])

    def test_rejects_past_date(self):
        past = (timezone.localdate() - timedelta(days=3)).isoformat()
        res = self.client.post(
            "/api/appointments/",
            {**self.payload, "date": past},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 422)

    def test_slot_capacity_is_four(self):
        for i in range(4):
            Appointment.objects.create(
                reference=f"MAT-T{i}",
                name="A B",
                phone="01711000000",
                type="meeting",
                date=self.date,
                slot="10:00",
                mode="phone",
                ward="১",
                topic="বিষয় বিষয়",
            )
        res = self.client.post(
            "/api/appointments/", self.payload, content_type="application/json"
        )
        self.assertEqual(res.status_code, 409)

    def test_availability_counts_taken_slots(self):
        Appointment.objects.create(
            reference="MAT-X1",
            name="A B",
            phone="01711000000",
            type="meeting",
            date=self.date,
            slot="11:00",
            mode="phone",
            ward="১",
            topic="বিষয় বিষয়",
        )
        res = self.client.get("/api/appointments/", {"date": self.date})
        slots = {s["slot"]: s for s in res.json()["data"]["slots"]}
        self.assertEqual(slots["11:00"]["taken"], 1)
        self.assertTrue(slots["11:00"]["available"])
        self.assertEqual(len(slots), 10)

    def test_lookup_by_phone_uses_last_eleven_digits(self):
        self.client.post(
            "/api/appointments/", self.payload, content_type="application/json"
        )
        res = self.client.get("/api/appointments/", {"phone": "+8801711203997"})
        self.assertEqual(len(res.json()["data"]["appointments"]), 1)


class FeedbackApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.payload = {
            "kind": "problem",
            "category": "পানি ও স্যানিটেশন",
            "title": "নলকূপ নষ্ট হয়ে গেছে",
            "details": "আমাদের পাড়ার নলকূপটি দুই সপ্তাহ ধরে নষ্ট হয়ে আছে।",
            "ward": "৪",
            "location": "উত্তর পাড়া",
            "severity": "high",
            "name": "করিম",
            "phone": "01812345678",
            "anonymous": False,
            "photo": "",
        }

    def test_create_report_with_timeline_and_lead(self):
        res = self.client.post(
            "/api/feedback/", self.payload, content_type="application/json"
        )
        self.assertEqual(res.status_code, 201)
        item = Feedback.objects.get()
        self.assertTrue(item.tracking_id.startswith("MAT-"))
        self.assertEqual(item.timeline.count(), 1)
        self.assertTrue(
            Lead.objects.filter(phone="01812345678", source="feedback").exists()
        )

    def test_anonymous_requires_no_phone_and_hides_name_publicly(self):
        anon = {**self.payload, "anonymous": True, "phone": "", "name": "ভয়"}
        res = self.client.post("/api/feedback/", anon, content_type="application/json")
        self.assertEqual(res.status_code, 201)
        listing = self.client.get("/api/feedback/").json()["data"]["items"]
        self.assertEqual(listing, [])  # anonymous reports are not in the public board

    def test_non_anonymous_without_phone_is_rejected(self):
        bad = {**self.payload, "phone": ""}
        res = self.client.post("/api/feedback/", bad, content_type="application/json")
        self.assertEqual(res.status_code, 422)

    def test_threat_starts_in_reviewing_and_is_hidden_from_board(self):
        threat = {**self.payload, "kind": "threat"}
        res = self.client.post(
            "/api/feedback/", threat, content_type="application/json"
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Feedback.objects.get().status, "reviewing")
        board = self.client.get("/api/feedback/").json()["data"]["items"]
        self.assertEqual(board, [])

    def test_support_increments(self):
        self.client.post(
            "/api/feedback/", self.payload, content_type="application/json"
        )
        item = Feedback.objects.get()
        res = self.client.post(f"/api/feedback/{item.id}/support/")
        self.assertEqual(res.json()["data"]["supports"], 1)
        missing = self.client.post("/api/feedback/nope/support/")
        self.assertEqual(missing.status_code, 404)

    def test_photo_size_limit(self):
        big = {**self.payload, "photo": "x" * 1_600_000}
        res = self.client.post("/api/feedback/", big, content_type="application/json")
        self.assertEqual(res.status_code, 413)


class PollEventContactTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_poll_vote_once_per_fingerprint(self):
        poll = content.polls()[0]
        option = poll["options"][0]["id"]
        body = {"optionId": option, "fingerprint": "fp-abcdef-1"}
        first = self.client.post(
            f"/api/polls/{poll['id']}/vote/", body, content_type="application/json"
        )
        self.assertEqual(first.status_code, 201)
        second = self.client.post(
            f"/api/polls/{poll['id']}/vote/", body, content_type="application/json"
        )
        self.assertEqual(second.status_code, 409)
        self.assertEqual(second.json()["errors"]["optionId"], option)
        self.assertEqual(PollVote.objects.count(), 1)

    def test_poll_totals_include_seed_votes(self):
        polls = self.client.get("/api/polls/").json()["data"]["polls"]
        seed_total = sum(o["votes"] for o in content.polls()[0]["options"])
        self.assertEqual(polls[0]["totalVotes"], seed_total)

    def test_poll_unknown_option_rejected(self):
        poll = content.polls()[0]
        res = self.client.post(
            f"/api/polls/{poll['id']}/vote/",
            {"optionId": "nope", "fingerprint": "fp-abcdef-2"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 422)

    def test_event_registration_respects_capacity(self):
        event = next(e for e in content.events() if e["status"] != "past")
        left = event["capacity"] - event["registered"]
        seats_free = max(0, left)
        if seats_free == 0:
            self.skipTest("seed event is full")
        body = {"name": "আলী হোসেন", "phone": "01911223344", "ward": "১", "guests": 0}
        res = self.client.post(
            f"/api/events/{event['id']}/register/",
            body,
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        seats = self.client.get(f"/api/events/{event['id']}/").json()["data"]
        self.assertEqual(seats["registered"], event["registered"] + 1)
        self.assertEqual(EventRegistration.objects.count(), 1)

    def test_event_registration_rejects_when_full(self):
        event = next(e for e in content.events() if e["status"] != "past")
        guests = 10
        EventRegistration.objects.bulk_create(
            [
                EventRegistration(
                    event_id=event["id"],
                    name="X Y",
                    phone="01911000000",
                    ward="১",
                    guests=guests,
                )
                for _ in range(
                    max(
                        1, (event["capacity"] - event["registered"]) // (guests + 1) + 1
                    )
                )
            ]
        )
        body = {"name": "আলী হোসেন", "phone": "01911223344", "ward": "১", "guests": 10}
        res = self.client.post(
            f"/api/events/{event['id']}/register/",
            body,
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 409)

    def test_contact_creates_message_and_lead(self):
        body = {
            "name": "সাবরিনা",
            "phone": "01611223344",
            "email": "a@example.com",
            "subject": "সাক্ষাৎ",
            "message": "একটি বিষয়ে কথা বলতে চাই।",
        }
        res = self.client.post("/api/contact/", body, content_type="application/json")
        self.assertEqual(res.status_code, 201)
        msg = Message.objects.get()
        self.assertEqual(msg.channel, "contact")
        self.assertTrue(msg.text.startswith("[সাক্ষাৎ]"))

    def test_newsletter_is_idempotent(self):
        body = {"email": "Reader@Example.com"}
        self.client.post("/api/newsletter/", body, content_type="application/json")
        res = self.client.post(
            "/api/newsletter/", body, content_type="application/json"
        )
        self.assertEqual(Subscriber.objects.count(), 1)
        self.assertIn("আগে থেকেই", res.json()["data"]["message"])

    def test_chat_stores_message(self):
        res = self.client.post(
            "/api/chat/", {"message": "হ্যালো"}, content_type="application/json"
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Message.objects.get().channel, "web-chat")

    def test_volunteer_creates_lead(self):
        body = {
            "name": "নাসিমা",
            "phone": "01511223344",
            "ward": "২",
            "role": "ওয়ার্ড সমন্বয়ক",
            "availability": "পূর্ণ সময়",
        }
        res = self.client.post(
            "/api/volunteers/", body, content_type="application/json"
        )
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Lead.objects.filter(source="volunteer").exists())

    def test_track_records_real_visitor_and_skips_bots(self):
        ua = "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36"
        self.client.post(
            "/api/track/",
            {"path": "/about", "session": "abcdefgh-1234", "tz": "Asia/Dhaka"},
            content_type="application/json",
            HTTP_USER_AGENT=ua,
        )
        self.client.post(
            "/api/track/",
            {"path": "/about", "session": "bot"},
            content_type="application/json",
            HTTP_USER_AGENT="Googlebot/2.1",
        )
        self.client.post(
            "/api/track/",
            {"path": "/admin/x", "session": "abcdefgh-9999"},
            content_type="application/json",
            HTTP_USER_AGENT=ua,
        )
        events = VisitorEvent.objects.all()
        self.assertEqual(events.count(), 1)
        ev = events.get()
        self.assertEqual(ev.device, "desktop")
        self.assertEqual(ev.browser, "Chrome")
        self.assertEqual(ev.os, "Windows")
        self.assertEqual(ev.country, "BD")

    def test_rate_limit_returns_429(self):
        cache.clear()
        body = {"email": "a@example.com"}
        statuses = [
            self.client.post(
                "/api/newsletter/", body, content_type="application/json"
            ).status_code
            for _ in range(8)
        ]
        self.assertIn(429, statuses)

    def test_ics_contains_upcoming_events(self):
        res = self.client.get("/api/calendar/ics/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("BEGIN:VCALENDAR", res.content.decode())
        self.assertIn("DTSTART;TZID=Asia/Dhaka", res.content.decode())

    def test_stats_endpoint(self):
        res = self.client.get("/api/stats/")
        self.assertEqual(res.json()["data"]["feedback"], 0)
        self.assertGreater(res.json()["data"]["pollVotes"], 0)
