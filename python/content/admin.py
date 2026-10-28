"""Django অ্যাডমিন — কনটেন্ট মডেলের ব্যাকঅফিস ভিউ।

প্রধান কমান্ড সেন্টার `/admin/` (dashboard অ্যাপ) হলেও ডেভেলপার/অ্যাডমিনের
জন্য Django-র নিজস্ব অ্যাডমিনেও সব কনটেন্ট দেখা ও দ্রুত বদলানো যায়।
"""
from __future__ import annotations

from django.contrib import admin

from .models import (
    Event,
    GalleryPhoto,
    GalleryPoster,
    HomeSection,
    MediaAsset,
    Pillar,
    Post,
    Setting,
    SitePage,
    TickerItem,
    TickerSettings,
    VideoItem,
)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "category", "status", "featured", "published_on", "views")
    list_filter = ("kind", "status", "featured", "category")
    search_fields = ("title", "slug", "excerpt", "rich", "tags")
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "published_on"
    list_editable = ("status", "featured")
    readonly_fields = ("views", "reactions", "created_at", "updated_at")
    fieldsets = (
        ("মূল তথ্য", {"fields": ("kind", "slug", "title", "excerpt", "category", "tags")}),
        ("প্রকাশ", {"fields": ("status", "featured", "published_on", "read_time", "views", "reactions")}),
        ("লেখক ও ছবি", {"fields": ("author_name", "author_role", "image")}),
        ("বিস্তারিত", {"fields": ("rich", "paragraphs", "blocks", "outlet")}),
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "date", "start", "venue", "ward", "status", "hidden")
    list_filter = ("type", "status", "hidden", "ward")
    search_fields = ("title", "venue", "description", "speaker")
    prepopulated_fields = {"slug": ("title",)}
    list_editable = ("status", "hidden")


@admin.register(Pillar)
class PillarAdmin(admin.ModelAdmin):
    list_display = ("number", "title", "short", "progress", "hidden", "sort_order")
    list_filter = ("hidden",)
    search_fields = ("title", "short", "summary", "problem")
    prepopulated_fields = {"slug": ("title",)}
    list_editable = ("progress", "hidden", "sort_order")


@admin.register(GalleryPhoto)
class GalleryPhotoAdmin(admin.ModelAdmin):
    list_display = ("caption", "tag", "ref", "tall", "hidden", "sort_order")
    list_filter = ("tag", "hidden", "tall")
    search_fields = ("caption", "tag", "ref", "src")
    list_editable = ("hidden", "sort_order")


@admin.register(GalleryPoster)
class GalleryPosterAdmin(admin.ModelAdmin):
    list_display = ("title", "subtitle", "election", "hidden", "sort_order")
    list_filter = ("election", "hidden")
    search_fields = ("title", "subtitle")
    list_editable = ("election", "hidden", "sort_order")


@admin.register(VideoItem)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("title", "youtube_id", "category", "hidden", "sort_order")
    list_filter = ("category", "hidden")
    search_fields = ("title", "youtube_id", "note")
    list_editable = ("hidden", "sort_order")


@admin.register(SitePage)
class SitePageAdmin(admin.ModelAdmin):
    list_display = ("label", "page_id", "title", "visible", "updated_at")
    list_filter = ("visible",)
    search_fields = ("label", "page_id", "title", "description")
    list_editable = ("visible",)


@admin.register(HomeSection)
class HomeSectionAdmin(admin.ModelAdmin):
    list_display = ("section_id", "eyebrow", "title", "visible", "updated_at")
    list_filter = ("visible",)
    search_fields = ("section_id", "title", "description")
    list_editable = ("visible",)


@admin.register(TickerSettings)
class TickerSettingsAdmin(admin.ModelAdmin):
    list_display = ("id", "enabled", "mode", "updated_at")

    def has_add_permission(self, request):  # একটিই সারি
        return not TickerSettings.objects.exists()


@admin.register(TickerItem)
class TickerItemAdmin(admin.ModelAdmin):
    list_display = ("text", "href", "active", "position", "created_at")
    list_filter = ("active",)
    search_fields = ("text", "href")
    list_editable = ("active", "position")


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = ("original_name", "content_type", "size", "uploaded_by", "created_at")
    search_fields = ("original_name",)
    readonly_fields = ("original_name", "content_type", "size", "uploaded_by", "created_at")


@admin.register(Setting)
class SettingAdmin(admin.ModelAdmin):
    list_display = ("key", "updated_at")
    search_fields = ("key",)
