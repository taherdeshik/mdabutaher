"""Editable site content stored in the database.

* ``ContentDocument`` — one row per JSON content document (events, blog, site …).
  Seeded from ``content/data/*.json``; the public site reads from here.
* ``SiteText`` — admin overrides for hardcoded page copy. The default text lives in
  the template (``{% cms "key" %}default{% endcms %}``); a row here replaces it.
* ``MediaAsset`` — uploaded (or linked) images, videos and audio. Content fields
  reference an asset as ``asset:<id>``.
"""

from django.db import models


class ContentDocument(models.Model):
    name = models.SlugField(primary_key=True, max_length=40)
    # JSON text, not a JSONField: jsonb/MySQL JSON reorder object keys, and the
    # templates iterate some objects (e.g. quickLinks) in their authored order.
    body = models.TextField()
    version = models.PositiveIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class SiteText(models.Model):
    key = models.CharField(primary_key=True, max_length=120)
    value = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["key"]

    def __str__(self) -> str:
        return self.key


class MediaAsset(models.Model):
    class Kind(models.TextChoices):
        IMAGE = "image", "ছবি"
        VIDEO = "video", "ভিডিও"
        AUDIO = "audio", "অডিও"

    kind = models.CharField(max_length=10, choices=Kind.choices, db_index=True)
    title = models.CharField(max_length=200, blank=True)
    alt = models.CharField(max_length=300, blank=True)
    file = models.FileField(upload_to="%Y/%m/", max_length=255, blank=True)
    # Bundled images shipped in static/ (seeded once; not deletable).
    static_path = models.CharField(max_length=255, blank=True, default="")
    # Remote URL: a YouTube/Vimeo page, or a direct link to a media file.
    external_url = models.URLField(max_length=500, blank=True)
    mime = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return self.title or f"{self.kind} #{self.pk}"

    @property
    def is_deletable(self) -> bool:
        return not self.static_path
