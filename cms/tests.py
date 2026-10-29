import json
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from core.views import _gallery_video
from dashboard.models import AdminProfile

from . import media, store
from .models import MediaAsset, SiteText

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


class _MediaRootMixin:
    def setUp(self):
        super().setUp()
        cache.clear()
        self._tmp = tempfile.mkdtemp(prefix="cms-tests-")
        self._override = override_settings(MEDIA_ROOT=self._tmp)
        self._override.enable()

    def tearDown(self):
        self._override.disable()
        shutil.rmtree(self._tmp, ignore_errors=True)
        super().tearDown()


def _version(name):
    return store.get_document(name)["version"]


def _find_dict_list(node):
    """First list of dicts that carry an ``id`` (used to exercise id validation)."""
    if isinstance(node, list) and node and isinstance(node[0], dict) and "id" in node[0]:
        return node
    children = node.values() if isinstance(node, dict) else node if isinstance(node, list) else []
    for child in children:
        found = _find_dict_list(child)
        if found is not None:
            return found
    return None


class SeedDocumentTests(TestCase):
    def test_every_seed_document_passes_validation(self):
        names = store.document_names()
        self.assertGreaterEqual(len(names), 15)
        for name in names:
            with self.subTest(document=name):
                self.assertEqual(store.validate_document(name, store._file_doc(name)), [])
                self.assertEqual(store.validate_document(name, store._db_doc(name)), [])

    def test_validation_rejects_deleted_top_level_key(self):
        data = store._file_doc("site")
        data.pop(next(iter(data)))
        errors = store.validate_document("site", data)
        self.assertTrue(errors)

    def test_validation_rejects_duplicate_ids(self):
        data = store._file_doc("events")
        items = _find_dict_list(data)
        self.assertIsNotNone(items)
        items.append(dict(items[0]))
        errors = store.validate_document("events", data)
        self.assertTrue(any("একাধিকবার" in e for e in errors), errors)

    def test_static_media_is_seeded_and_not_deletable(self):
        static = MediaAsset.objects.filter(static_path__isnull=False)
        self.assertGreater(static.count(), 100)
        self.assertFalse(static.first().is_deletable)


class KeyOrderTests(TestCase):
    def _reverse_keys(self, node):
        if isinstance(node, dict):
            return {k: self._reverse_keys(node[k]) for k in reversed(list(node))}
        if isinstance(node, list):
            return [self._reverse_keys(v) for v in node]
        return node

    def test_saved_document_keeps_key_order(self):
        original = store._file_doc("site")
        reordered = self._reverse_keys(original)
        self.assertNotEqual(list(reordered), list(original))
        store.save_document("site", reordered, "owner1", expected_version=_version("site"))
        stored = store.get_document("site")["data"]
        self.assertEqual(list(stored), list(reordered))
        self.assertEqual(json.dumps(stored, ensure_ascii=False), json.dumps(reordered, ensure_ascii=False))

    def test_reset_restores_shipped_json(self):
        data = store._file_doc("site")
        before = _version("site")
        store.save_document("site", self._reverse_keys(data), "owner1", expected_version=before)
        restored = store.reset_document("site", "owner1")
        self.assertEqual(restored["data"], data)
        self.assertEqual(restored["version"], before + 2)


class ConflictTests(TestCase):
    def test_stale_version_is_rejected_with_409(self):
        data = store._file_doc("site")
        current = _version("site")
        first = store.save_document("site", data, "owner1", expected_version=current)
        self.assertEqual(first["version"], current + 1)
        with self.assertRaises(store.ConflictError) as ctx:
            store.save_document("site", data, "manager1", expected_version=current)
        self.assertEqual(ctx.exception.current_version, current + 1)
        second = store.save_document("site", data, "manager1", expected_version=current + 1)
        self.assertEqual(second["version"], current + 2)

    def test_invalid_document_is_refused_and_not_saved(self):
        bad = store._file_doc("site")
        bad.pop(next(iter(bad)))
        before = _version("site")
        with self.assertRaises(store.ContentError):
            store.save_document("site", bad, "owner1", expected_version=before)
        self.assertEqual(_version("site"), before)


class TextOverrideTests(TestCase):
    def test_unknown_key_is_refused(self):
        with self.assertRaises(store.ContentError):
            store.save_text("nope.999", "x", "owner1")

    def test_override_is_used_then_empty_value_reverts(self):
        store.save_text("not_found.001", "টেস্ট ৪০৪", "owner1")
        self.assertEqual(SiteText.objects.get(key="not_found.001").value, "টেস্ট ৪০৪")
        page = Client().get("/no-such-page-for-cms-test", HTTP_HOST="testserver")
        self.assertContains(page, "টেস্ট ৪০৪", status_code=404)
        store.save_text("not_found.001", "", "owner1")
        self.assertFalse(SiteText.objects.filter(key="not_found.001").exists())
        page = Client().get("/no-such-page-for-cms-test", HTTP_HOST="testserver")
        self.assertContains(page, "৪০৪", status_code=404)


class UploadTests(_MediaRootMixin, TestCase):
    def test_real_png_is_accepted(self):
        asset = media.upload(SimpleUploadedFile("pic.png", PNG), "image", "ছবি", "বিবরণ", "owner1")
        self.assertEqual(asset.kind, "image")
        self.assertEqual(asset.mime, "image/png")
        self.assertTrue(asset.file.name)

    def test_text_disguised_as_image_is_rejected(self):
        with self.assertRaises(store.ContentError):
            media.upload(SimpleUploadedFile("pic.png", b"<script>alert(1)</script>"), "image", "", "", "owner1")

    def test_wrong_extension_for_kind_is_rejected(self):
        with self.assertRaises(store.ContentError):
            media.upload(SimpleUploadedFile("pic.exe", PNG), "image", "", "", "owner1")
        with self.assertRaises(store.ContentError):
            media.upload(SimpleUploadedFile("clip.mp3", PNG), "audio", "", "", "owner1")

    def test_oversize_image_is_rejected(self):
        big = PNG + b"0" * (15 * 1024 * 1024)
        with self.assertRaises(store.ContentError):
            media.upload(SimpleUploadedFile("big.png", big), "image", "", "", "owner1")

    def test_unknown_kind_is_rejected(self):
        with self.assertRaises(store.ContentError):
            media.upload(SimpleUploadedFile("pic.png", PNG), "document", "", "", "owner1")

    def test_link_rules_by_kind(self):
        video = media.add_link("video", "https://www.youtube.com/watch?v=abcDEF12345", "", "", "owner1")
        self.assertTrue(video.external_url)
        with self.assertRaises(store.ContentError):
            media.add_link("audio", "https://www.youtube.com/watch?v=abcDEF12345", "", "", "owner1")
        with self.assertRaises(store.ContentError):
            media.add_link("image", "https://example.com/page.html", "", "", "owner1")


class DeleteTests(_MediaRootMixin, TestCase):
    def test_static_asset_cannot_be_deleted(self):
        asset = MediaAsset.objects.filter(static_path__isnull=False).first()
        with self.assertRaises(store.ContentError):
            media.delete(asset, "owner1")
        self.assertTrue(MediaAsset.objects.filter(pk=asset.pk).exists())

    def test_asset_in_use_is_refused_then_allowed_after_removal(self):
        asset = media.add_link("image", "https://example.com/photo.jpg", "ছবি", "", "owner1")
        data = store._file_doc("media")
        key = next(iter(data["imageMap"]))
        data["imageMap"][key] = f"asset:{asset.pk}"
        store.save_document("media", data, "owner1", expected_version=_version("media"))
        with self.assertRaises(media.MediaError) as ctx:
            media.delete(asset, "owner1")
        self.assertEqual(ctx.exception.status, 409)
        self.assertIn("ছবির তালিকা", str(ctx.exception))

        store.reset_document("media", "owner1")
        media.delete(asset, "owner1")
        self.assertFalse(MediaAsset.objects.filter(pk=asset.pk).exists())


class RangeTests(_MediaRootMixin, TestCase):
    def setUp(self):
        super().setUp()
        import os

        os.makedirs(os.path.join(self._tmp, "clips"), exist_ok=True)
        with open(os.path.join(self._tmp, "clips", "t.bin"), "wb") as fh:
            fh.write(b"0123456789")
        self.client = Client()

    def test_full_response(self):
        resp = self.client.get("/uploads/clips/t.bin")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(b"".join(resp.streaming_content), b"0123456789")
        self.assertEqual(resp["Accept-Ranges"], "bytes")

    def test_partial_range(self):
        resp = self.client.get("/uploads/clips/t.bin", HTTP_RANGE="bytes=2-5")
        self.assertEqual(resp.status_code, 206)
        self.assertEqual(resp.content, b"2345")
        self.assertEqual(resp["Content-Range"], "bytes 2-5/10")

    def test_open_ended_and_suffix_ranges(self):
        resp = self.client.get("/uploads/clips/t.bin", HTTP_RANGE="bytes=7-")
        self.assertEqual(resp.content, b"789")
        resp = self.client.get("/uploads/clips/t.bin", HTTP_RANGE="bytes=-3")
        self.assertEqual(resp.content, b"789")

    def test_unsatisfiable_range(self):
        resp = self.client.get("/uploads/clips/t.bin", HTTP_RANGE="bytes=20-30")
        self.assertEqual(resp.status_code, 416)
        self.assertEqual(resp["Content-Range"], "bytes */10")

    def test_path_traversal_is_not_served(self):
        resp = self.client.get("/uploads/%2e%2e/%2e%2e/manage.py")
        self.assertEqual(resp.status_code, 404)


class GalleryLegacyTests(TestCase):
    def test_bare_youtube_id_becomes_video_url(self):
        item = _gallery_video({"id": "abcDEF12345", "title": "t"})
        self.assertEqual(item["video"], "https://www.youtube.com/watch?v=abcDEF12345")

    def test_existing_video_field_is_kept(self):
        item = {"id": "abcDEF12345", "video": "https://example.com/a.mp4"}
        self.assertEqual(_gallery_video(item), item)


class ContentApiAccessTests(TestCase):
    def setUp(self):
        cache.clear()
        User = get_user_model()
        self.owner = User.objects.create_user("owner1", password="owner-pass-1")
        AdminProfile.objects.create(user=self.owner, role="owner")
        self.captain = User.objects.create_user("captain1", password="captain-pass-1")
        AdminProfile.objects.create(user=self.captain, role="captain", ward_id="৩")

    def test_anonymous_and_captain_are_refused(self):
        client = Client()
        self.assertIn(client.get("/api/admin/content/").status_code, (401, 403))
        client.force_login(self.captain)
        self.assertEqual(client.get("/api/admin/content/").status_code, 403)
        self.assertEqual(client.get("/api/admin/texts/").status_code, 403)

    def test_owner_can_read_and_save_text(self):
        client = Client()
        client.force_login(self.owner)
        resp = client.get("/api/admin/content/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["ok"])
        resp = client.put(
            "/api/admin/texts/not_found.002/",
            data=json.dumps({"value": "নতুন শিরোনাম"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["data"]["value"], "নতুন শিরোনাম")
        store.save_text("not_found.002", "", "owner1")

    def test_content_page_renders_for_owner_and_redirects_captain(self):
        client = Client()
        client.force_login(self.owner)
        resp = client.get("/admin/content")
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, 'id="cms-root"')
        self.assertContains(resp, "cms-editor.js")
        other = Client()
        other.force_login(self.captain)
        self.assertEqual(other.get("/admin/content").status_code, 302)
