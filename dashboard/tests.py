from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase

from civic.models import Appointment, Feedback, Lead, Message

from .models import AdminProfile, AuditLog


class DashboardTests(TestCase):
    def setUp(self):
        cache.clear()
        User = get_user_model()
        self.owner = User.objects.create_user("owner1", password="owner-pass-1")
        AdminProfile.objects.create(user=self.owner, role="owner")
        self.captain = User.objects.create_user("captain1", password="captain-pass-1")
        AdminProfile.objects.create(user=self.captain, role="captain", ward_id="৩")
        self.appt = Appointment.objects.create(
            reference="MAT-AAA111",
            name="রহিম",
            phone="01711203997",
            type="meeting",
            date="2026-10-27",
            slot="10:00",
            mode="in-person",
            ward="৩",
            topic="রাস্তার বিষয়",
        )
        self.item = Feedback.objects.create(
            tracking_id="MAT-BBB222",
            kind="problem",
            category="শিক্ষা",
            title="বিদ্যালয়ের ভবন",
            details="বিদ্যালয়ের ভবনে ফাটল দেখা দিয়েছে, দ্রুত ব্যবস্থা দরকার।",
            ward="১",
            severity="high",
        )

    def login(self, username, password):
        return self.client.post(
            "/admin/login", {"username": username, "password": password}
        )

    def test_api_requires_login(self):
        self.assertEqual(self.client.get("/api/admin/overview/").status_code, 401)

    def test_login_then_overview(self):
        self.login("owner1", "owner-pass-1")
        res = self.client.get("/api/admin/overview/")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["counts"]["appointments"], 1)
        self.assertEqual(len(data["feedback"]), 1)

    def test_wrong_password_rejected(self):
        res = self.client.post(
            "/api/auth/login/",
            {"username": "owner1", "password": "nope"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 401)

    def test_api_login_returns_profile(self):
        res = self.client.post(
            "/api/auth/login/",
            {"username": "captain1", "password": "captain-pass-1"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["data"]["user"]["role"], "captain")
        me = self.client.get("/api/auth/me/").json()["data"]["user"]
        self.assertEqual(me["wardId"], "৩")

    def test_status_change_creates_audit_entry(self):
        self.login("owner1", "owner-pass-1")
        res = self.client.patch(
            f"/api/admin/appointments/{self.appt.id}/",
            '{"status": "confirmed"}',
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        self.appt.refresh_from_db()
        self.assertEqual(self.appt.status, "confirmed")
        self.assertTrue(AuditLog.objects.filter(action="appointment.status").exists())

    def test_invalid_status_rejected(self):
        self.login("owner1", "owner-pass-1")
        res = self.client.patch(
            f"/api/admin/appointments/{self.appt.id}/",
            '{"status": "hacked"}',
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 422)

    def test_feedback_status_and_note_add_timeline(self):
        self.login("owner1", "owner-pass-1")
        res = self.client.patch(
            f"/api/admin/feedback/{self.item.id}/",
            '{"status": "resolved", "note": "ঠিকাদার নিয়োগ হয়েছে"}',
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "resolved")
        self.assertEqual(self.item.timeline.count(), 2)

    def test_lead_stage_update(self):
        lead = Lead.objects.create(
            name="ক", phone="01800000000", ward="১", source="contact"
        )
        self.login("owner1", "owner-pass-1")
        res = self.client.patch(
            f"/api/admin/leads/{lead.id}/",
            '{"stage": "supporter"}',
            content_type="application/json",
        )
        self.assertEqual(res.json()["data"]["stage"], "supporter")

    def test_mark_message_read(self):
        msg = Message.objects.create(channel="contact", text="হ্যালো")
        self.login("owner1", "owner-pass-1")
        res = self.client.patch(
            f"/api/admin/messages/{msg.pk}/",
            '{"read": true}',
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        msg.refresh_from_db()
        self.assertTrue(msg.read)

    def test_csv_export_has_bom_and_rows(self):
        self.login("owner1", "owner-pass-1")
        res = self.client.get("/api/admin/export/", {"type": "appointments"})
        self.assertEqual(res.status_code, 200)
        body = res.content.decode("utf-8")
        self.assertTrue(body.startswith("\ufeff"))
        self.assertIn("MAT-AAA111", body)

    def test_export_unknown_type(self):
        self.login("owner1", "owner-pass-1")
        self.assertEqual(
            self.client.get("/api/admin/export/", {"type": "passwords"}).status_code,
            400,
        )

    def test_captain_cannot_manage_users_or_backup(self):
        self.login("captain1", "captain-pass-1")
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 403)
        self.assertEqual(self.client.get("/api/admin/backup/").status_code, 403)
        self.assertEqual(self.client.get("/api/admin/analytics/").status_code, 403)

    def test_owner_creates_and_deletes_user(self):
        self.login("owner1", "owner-pass-1")
        res = self.client.post(
            "/api/admin/users/",
            '{"username": "manager2", "password": "manager-pass-2", "role": "manager", "name": "ম্যানেজার"}',
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        uid = res.json()["data"]["id"]
        self.assertEqual(
            self.client.delete(f"/api/admin/users/{uid}/").status_code, 200
        )
        self.assertEqual(
            self.client.delete(f"/api/admin/users/{self.owner.pk}/").status_code, 409
        )

    def test_backup_is_json_without_password_hashes(self):
        self.login("owner1", "owner-pass-1")
        res = self.client.get("/api/admin/backup/")
        self.assertEqual(res["Content-Type"], "application/json; charset=utf-8")
        body = res.content.decode()
        self.assertIn("MAT-AAA111", body)
        self.assertNotIn("pbkdf2", body)

    def test_analytics_bundle_shape(self):
        self.login("owner1", "owner-pass-1")
        data = self.client.get("/api/admin/analytics/", {"days": 30}).json()["data"]
        self.assertEqual(data["range"], 30)
        self.assertEqual(len(data["series"]), 30)
        for key in (
            "totals",
            "pages",
            "countries",
            "devices",
            "browsers",
            "sources",
            "sessions",
        ):
            self.assertIn(key, data)

    def test_dashboard_pages_render(self):
        self.login("owner1", "owner-pass-1")
        for path in ["/admin", "/admin/analytics", "/admin/users"]:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    def test_logged_out_pages_redirect_to_login(self):
        res = self.client.get("/admin")
        self.assertEqual(res.status_code, 302)
        self.assertIn("/admin/login", res["Location"])

    def test_legacy_admin_key(self):
        from django.test import override_settings

        with override_settings(ADMIN_KEY="legacy-secret-key"):
            res = self.client.get(
                "/api/admin/overview/", HTTP_X_ADMIN_KEY="legacy-secret-key"
            )
            self.assertEqual(res.status_code, 200)
