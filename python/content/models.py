"""কনটেন্ট মডেল — ব্লগ/সংবাদ, ইভেন্ট, ম্যানিফেস্টো, গ্যালারি, পেজ, টিকার।"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.urls import reverse

from . import data
from .bn import bn
from .richtext import render_rich


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"


class TickerSettings(models.Model):
    """হেডার নিউজ টিকারের সেটিংস (একটি সারি)।"""

    MODES = [("auto", "অটো"), ("custom", "নিজের তালিকা")]

    enabled = models.BooleanField("টিকার দেখান", default=True)
    mode = models.CharField("মোড", max_length=10, choices=MODES, default="auto")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "টিকার সেটিংস"
        verbose_name_plural = "টিকার সেটিংস"

    def __str__(self) -> str:
        return f"{self.get_mode_display()} · {'চালু' if self.enabled else 'বন্ধ'}"

    @classmethod
    def load(cls) -> "TickerSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class TickerItem(models.Model):
    text = models.CharField("লেখা", max_length=160)
    href = models.CharField("লিংক", max_length=200, default="/")
    active = models.BooleanField("সক্রিয়", default=True)
    position = models.PositiveIntegerField("ক্রম", default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "id"]
        verbose_name = "টিকার লাইন"
        verbose_name_plural = "টিকারের লাইন"

    def __str__(self) -> str:
        return self.text


class MediaAsset(models.Model):
    """আপলোড করা ছবি/ভিডিও (গ্যালারি, পোস্টের কভার, ইনলাইন ছবি)।"""

    file = models.FileField("ফাইল", upload_to="uploads/%Y/%m/")
    original_name = models.CharField(max_length=200, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "মিডিয়া ফাইল"
        verbose_name_plural = "মিডিয়া লাইব্রেরি"

    def __str__(self) -> str:
        return self.original_name or self.file.name

    @property
    def url(self) -> str:
        return self.file.url

    @property
    def is_image(self) -> bool:
        return (self.content_type or "").startswith("image/")


class Post(models.Model):
    """ব্লগ পোস্ট এবং সংবাদ — একই মডেল, `kind` দিয়ে আলাদা।"""

    KIND_BLOG = "blog"
    KIND_NEWS = "news"
    KINDS = [(KIND_BLOG, "ব্লগ"), (KIND_NEWS, "সংবাদ")]
    STATUS = [("published", "প্রকাশিত"), ("draft", "খসড়া")]

    kind = models.CharField("ধরন", max_length=10, choices=KINDS, default=KIND_BLOG, db_index=True)
    slug = models.SlugField("স্লাগ", max_length=160, unique=True)
    title = models.CharField("শিরোনাম", max_length=220)
    excerpt = models.TextField("সারসংক্ষেপ", blank=True)
    category = models.CharField("বিভাগ", max_length=60, blank=True)
    tags = models.JSONField("ট্যাগ", default=list, blank=True)
    published_on = models.DateField("তারিখ")
    read_time = models.PositiveSmallIntegerField("পড়ার সময় (মিনিট)", default=5)
    author_name = models.CharField("লেখকের নাম", max_length=120, blank=True, default="মোঃ আবু তাহের")
    author_role = models.CharField(
        "পদবি", max_length=160, blank=True, default="চেয়ারম্যান পদপ্রার্থী, মহাদান ইউনিয়ন"
    )
    image = models.CharField("কভার ছবি (কী বা পাথ)", max_length=200, blank=True)
    featured = models.BooleanField("ফিচার্ড", default=False)
    views = models.PositiveIntegerField("পাঠ", default=0)
    reactions = models.PositiveIntegerField("রিঅ্যাকশন", default=0)
    status = models.CharField("অবস্থা", max_length=12, choices=STATUS, default="published")
    blocks = models.JSONField("ব্লক (ব্লগ)", default=list, blank=True)
    paragraphs = models.JSONField("প্যারাগ্রাফ (সংবাদ)", default=list, blank=True)
    rich = models.TextField("রিচ লেখা", blank=True)
    outlet = models.CharField("সংবাদমাধ্যম", max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_on", "-id"]
        verbose_name = "ব্লগ/সংবাদ পোস্ট"
        verbose_name_plural = "ব্লগ ও সংবাদ"

    def __str__(self) -> str:
        return self.title

    def get_absolute_url(self) -> str:
        base = "news" if self.kind == self.KIND_NEWS else "blog"
        return reverse(f"web:{base}_detail", args=[self.slug])

    # -------------------------------------------------------------- body
    def body_blocks(self) -> list[dict]:
        """রেন্ডারযোগ্য ব্লক। `rich` থাকলে সেটাই, নাহলে blocks/paragraphs।"""
        if self.rich.strip():
            return [{"type": "html", "html": render_rich(self.rich)}]
        if self.blocks:
            return self.blocks
        return [{"type": "p", "text": t} for t in (self.paragraphs or [])]

    def plain_body(self) -> str:
        if self.rich.strip():
            from .richtext import plain_text

            return plain_text(self.rich)
        if self.blocks:
            return " ".join(b.get("text", "") for b in self.blocks)
        return " ".join(self.paragraphs or [])

    @property
    def is_rich(self) -> bool:
        return bool(self.rich.strip())

    def save(self, *args, **kwargs):
        # রিচ লেখা → সংবাদ/ব্লগের প্লেইন প্যারাগ্রাফ (সার্চ ও JSON-LD-এর জন্য)
        super().save(*args, **kwargs)


class Event(models.Model):
    TYPES = [
        ("জনসভা", "জনসভা"),
        ("উঠান বৈঠক", "উঠান বৈঠক"),
        ("পদযাত্রা", "পদযাত্রা"),
        ("স্বেচ্ছাসেবক", "স্বেচ্ছাসেবক"),
        ("মিডিয়া", "মিডিয়া"),
        ("সেবা", "সেবা"),
        ("সভা", "সভা"),
    ]
    STATUS = [("upcoming", "আসন্ন"), ("live", "চলমান"), ("past", "সম্পন্ন")]

    slug = models.SlugField("আইডি", max_length=120, unique=True)
    title = models.CharField("শিরোনাম", max_length=220)
    type = models.CharField("ধরন", max_length=40, choices=TYPES, default="উঠান বৈঠক")
    date = models.DateField("তারিখ")
    start = models.CharField("শুরু", max_length=10, default="16:00")
    end = models.CharField("শেষ", max_length=10, default="18:00")
    venue = models.CharField("স্থান", max_length=220)
    ward = models.CharField("ওয়ার্ড", max_length=40, blank=True)
    description = models.TextField("বর্ণনা", blank=True)
    capacity = models.PositiveIntegerField("ধারণক্ষমতা", default=0)
    registered = models.PositiveIntegerField("রেজিস্ট্রেশন", default=0)
    speaker = models.CharField("বক্তা", max_length=160, blank=True)
    status = models.CharField("অবস্থা", max_length=10, choices=STATUS, default="upcoming")
    highlights = models.JSONField("বিশেষত্ব", default=list, blank=True)
    hidden = models.BooleanField("সাইটে দেখাবেন না", default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "start", "sort_order"]
        verbose_name = "ইভেন্ট"
        verbose_name_plural = "ইভেন্ট ও সময়সূচি"

    def __str__(self) -> str:
        return self.title

    def get_absolute_url(self) -> str:
        return reverse("web:event_detail", args=[self.slug])

    @property
    def seats_left(self) -> int:
        return max(self.capacity - self.registered, 0)

    @property
    def is_upcoming(self) -> bool:
        from django.utils import timezone

        return self.date >= timezone.localdate() and self.status != "past"


class Pillar(models.Model):
    """ম্যানিফেস্টোর স্তম্ভ (৮টি)।"""

    slug = models.SlugField("আইডি", max_length=60, unique=True)
    number = models.CharField("ক্রমিক", max_length=10, default="০১")
    title = models.CharField("নাম", max_length=160)
    short = models.CharField("সংক্ষিপ্ত", max_length=60, blank=True)
    icon = models.CharField("আইকন", max_length=40, blank=True)
    accent = models.CharField("রঙ", max_length=20, blank=True, default="gold")
    summary = models.TextField("সারসংক্ষেপ", blank=True)
    problem = models.TextField("সমস্যা/প্রেক্ষাপট", blank=True)
    commitments = models.JSONField("অঙ্গীকার", default=list, blank=True)
    metrics = models.JSONField("মেট্রিক", default=list, blank=True)
    target = models.TextField("৫ বছরের লক্ষ্য", blank=True)
    budget = models.CharField("বাজেট", max_length=120, blank=True)
    progress = models.PositiveSmallIntegerField("অগ্রগতি (%)", default=0)
    hidden = models.BooleanField("সাইটে দেখাবেন না", default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "ম্যানিফেস্টো স্তম্ভ"
        verbose_name_plural = "ম্যানিফেস্টো"

    def __str__(self) -> str:
        return self.title

    @property
    def commitment_count(self) -> int:
        return len(self.commitments or [])


class GalleryPhoto(models.Model):
    ref = models.CharField("আইডি", max_length=60, blank=True)
    src = models.CharField("ছবির পাথ", max_length=300, blank=True)
    caption = models.CharField("ক্যাপশন", max_length=220)
    tag = models.CharField("বিভাগ", max_length=60, blank=True)
    tall = models.BooleanField("লম্বা ফ্রেম", default=False)
    hidden = models.BooleanField("লুকানো", default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "গ্যালারির ছবি"
        verbose_name_plural = "গ্যালারি — ছবি"

    def __str__(self) -> str:
        return self.caption

    @property
    def image_src(self) -> str:
        return self.src or data.image_for(self.ref or self.caption)


class GalleryPoster(models.Model):
    ref = models.CharField("আইডি", max_length=60, blank=True)
    src = models.CharField("ছবির পাথ", max_length=300, blank=True)
    title = models.CharField("শিরোনাম", max_length=220)
    subtitle = models.CharField("উপশিরোনাম", max_length=220, blank=True)
    election = models.BooleanField("নির্বাচনী পোস্টার", default=False)
    hidden = models.BooleanField("লুকানো", default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "গ্যালারির পোস্টার"
        verbose_name_plural = "গ্যালারি — পোস্টার"

    def __str__(self) -> str:
        return self.title

    @property
    def image_src(self) -> str:
        return self.src or data.image_for(self.ref or self.title)


class VideoItem(models.Model):
    ref = models.CharField("আইডি", max_length=60, blank=True)
    youtube_id = models.CharField("YouTube আইডি", max_length=40)
    title = models.CharField("শিরোনাম", max_length=220)
    category = models.CharField("বিভাগ", max_length=60, blank=True)
    note = models.CharField("নোট", max_length=220, blank=True)
    hidden = models.BooleanField("লুকানো", default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "ভিডিও"
        verbose_name_plural = "গ্যালারি — ভিডিও"

    def __str__(self) -> str:
        return self.title

    @property
    def thumb(self) -> str:
        return f"https://i.ytimg.com/vi/{self.youtube_id}/hqdefault.jpg"

    @property
    def embed(self) -> str:
        return f"https://www.youtube-nocookie.com/embed/{self.youtube_id}"


class SitePage(models.Model):
    """মেনু/পেজের লেখা-ছবি-ভিডিও ওভাররাইড (খালি = কোডের ডিফল্ট)।"""

    page_id = models.CharField("পেজ আইডি", max_length=60, unique=True)
    label = models.CharField("মেনুর নাম", max_length=80, blank=True)
    eyebrow = models.CharField(max_length=120, blank=True)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    body = models.TextField(blank=True)
    image = models.CharField("ছবি", max_length=300, blank=True)
    video = models.CharField("ভিডিও (YouTube আইডি)", max_length=60, blank=True)
    visible = models.BooleanField("মেনুতে দেখান", default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["page_id"]
        verbose_name = "সাইট পেজ"
        verbose_name_plural = "সাইট কনটেন্ট"

    def __str__(self) -> str:
        return self.page_id


class HomeSection(models.Model):
    section_id = models.CharField("সেকশন", max_length=60, unique=True)
    eyebrow = models.CharField(max_length=120, blank=True)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    visible = models.BooleanField("দেখান", default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["section_id"]
        verbose_name = "হোমপেজ সেকশন"
        verbose_name_plural = "হোমপেজ সেকশন"

    def __str__(self) -> str:
        return self.section_id


class Setting(models.Model):
    """ক্যাম্পেইনের সাধারণ সেটিংস (তারিখ, টার্নআউট, খরচের সীমা) — key/value।"""

    key = models.CharField(max_length=60, unique=True)
    value = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "সেটিং"
        verbose_name_plural = "সেটিংস"

    def __str__(self) -> str:
        return self.key

    @classmethod
    def get(cls, key: str, default=None):
        row = cls.objects.filter(key=key).first()
        return row.value if row else default

    @classmethod
    def put(cls, key: str, value) -> "Setting":
        obj, _ = cls.objects.update_or_create(key=key, defaults={"value": value})
        return obj


def bn_num(value) -> str:
    return bn(value)
