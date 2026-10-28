"""কোডে থাকা বাংলা কনটেন্ট → PostgreSQL ডেটাবেসে সিড করে।

ব্যবহার:
    python manage.py seed_content          # খালি জায়গা পূরণ করে (নিরাপদ)
    python manage.py seed_content --force  # সিড করা সারিগুলো ডিফল্টে ফিরিয়ে দেয়
"""
from __future__ import annotations

import datetime as dt
import os

from django.core.management.base import BaseCommand
from django.db import transaction

from content import data
from content.models import (
    Event,
    GalleryPhoto,
    GalleryPoster,
    HomeSection,
    MediaAsset,
    Pillar,
    Post,
    Setting,
    SitePage,
    TickerSettings,
    VideoItem,
)


def upsert(model, lookup: dict, defaults: dict, force: bool):
    """force=False → শুধু নতুন সারি তৈরি; force=True → সিড মান আবার লিখে দেয়।"""
    if force:
        return model.objects.update_or_create(**lookup, defaults=defaults)
    return model.objects.get_or_create(**lookup, defaults=defaults)


def _date(value: str) -> dt.date:
    try:
        return dt.date.fromisoformat(value[:10])
    except (ValueError, TypeError):
        return dt.date.today()


class Command(BaseCommand):
    help = "সাইটের ডিফল্ট বাংলা কনটেন্ট ডেটাবেসে সিড করে"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="আগের সিড করা মান ওভাররাইট করে")

    @transaction.atomic
    def handle(self, *args, **options):
        force = options["force"]
        created = updated = 0

        # ---------------------------------------------------------- posts
        for item in data.posts():
            obj, made = upsert(Post, {"slug": item["slug"]}, {
                    "kind": Post.KIND_BLOG,
                    "title": item["title"],
                    "excerpt": item.get("excerpt", ""),
                    "category": item.get("category", ""),
                    "tags": item.get("tags", []),
                    "published_on": _date(item["date"]),
                    "read_time": item.get("readTime", 5),
                    "author_name": item.get("author", {}).get("name", "মোঃ আবু তাহের"),
                    "author_role": item.get("author", {}).get("role", ""),
                    "image": item.get("image", ""),
                    "featured": item.get("featured", False),
                    "views": item.get("views", 0),
                    "reactions": item.get("reactions", 0),
                    "blocks": item.get("content", []),
                    "status": "published",
                }, force)
            created += 1 if made else 0

        for item in data.news():
            obj, made = upsert(Post, {"slug": item["id"]}, {
                    "kind": Post.KIND_NEWS,
                    "title": item["title"],
                    "excerpt": item.get("summary", ""),
                    "category": "সংবাদ",
                    "tags": [item.get("outlet", "")] if item.get("outlet") else [],
                    "published_on": _date(item["date"]),
                    "read_time": 2,
                    "outlet": item.get("outlet", ""),
                    "image": item.get("image", ""),
                    "featured": item.get("featured", False),
                    "paragraphs": item.get("body", []),
                    "status": "published",
                }, force)
            created += 1 if made else 0

        # --------------------------------------------------------- events
        for order, item in enumerate(data.events()):
            upsert(Event, {"slug": item["id"]}, {
                    "title": item["title"],
                    "type": item["type"],
                    "date": _date(item["date"]),
                    "start": item.get("start", "16:00"),
                    "end": item.get("end", "18:00"),
                    "venue": item.get("venue", ""),
                    "ward": str(item.get("ward", "")),
                    "description": item.get("description", ""),
                    "capacity": item.get("capacity", 0),
                    "registered": item.get("registered", 0),
                    "speaker": item.get("speaker", ""),
                    "status": item.get("status", "upcoming"),
                    "highlights": item.get("highlights", []),
                    "sort_order": order,
                }, force)

        # -------------------------------------------------------- pillars
        for order, item in enumerate(data.pillars()):
            upsert(Pillar, {"slug": item["id"]}, {
                    "number": item.get("number", ""),
                    "title": item["title"],
                    "short": item.get("short", ""),
                    "icon": item.get("icon", ""),
                    "accent": item.get("accent", "gold"),
                    "summary": item.get("summary", ""),
                    "problem": item.get("problem", ""),
                    "commitments": item.get("commitments", []),
                    "metrics": item.get("metrics", []),
                    "target": item.get("target", ""),
                    "budget": item.get("budget", ""),
                    "progress": int(item.get("progress", 0) or 0),
                    "sort_order": order,
                }, force)

        # -------------------------------------------------------- gallery
        for order, item in enumerate(data.gallery_photos()):
            upsert(GalleryPhoto, {"ref": item["key"]}, {
                    "caption": item.get("caption", ""),
                    "tag": item.get("tag", ""),
                    "tall": item.get("tall", False),
                    "src": item.get("src", ""),
                    "sort_order": order,
                }, force)
        for order, item in enumerate(data.gallery_posters()):
            upsert(GalleryPoster, {"title": item.get("title", "")}, {
                    "subtitle": item.get("subtitle", ""),
                    "ref": item.get("key", item.get("id", "")),
                    "src": item.get("src", ""),
                    "election": item.get("election", False),
                    "sort_order": order,
                }, force)
        for order, item in enumerate(data.videos()):
            upsert(VideoItem, {"youtube_id": item["id"]}, {
                    "title": item.get("title", ""),
                    "category": item.get("category", ""),
                    "note": item.get("note", ""),
                    "sort_order": order,
                }, force)

        # ---------------------------------------------------- pages/sections
        for page in data.site_pages():
            SitePage.objects.get_or_create(page_id=page["id"])
        for section in data.home_sections():
            HomeSection.objects.get_or_create(section_id=section["id"])

        # ------------------------------------------------------ settings
        TickerSettings.load()
        seed = data.command_seed()
        Setting.put("campaign", seed["seedSettings"])

        # --------------------------------------------------------- wards
        from crm.models import Ward

        for ward in seed["seedWards"]:
            Ward.objects.update_or_create(
                slug=ward["id"],
                defaults={
                    "no": ward["no"],
                    "name": ward["name"],
                    "villages": ward.get("villages", []),
                    "polygon": ward.get("polygon", ""),
                    "strength": ward.get("strength", "swing"),
                    "turnout_2021": ward.get("turnout2021", 70),
                    "note": ward.get("note", ""),
                },
            )

        # ------------------------------------------------------- admin user
        from django.contrib.auth import get_user_model

        User = get_user_model()
        if not User.objects.filter(is_superuser=True).exists():
            username = os.environ.get("ADMIN_USERNAME", "admin")
            password = os.environ.get("ADMIN_PASSWORD", "mahadan-2027")
            User.objects.create_superuser(
                username=username,
                email=os.environ.get("ADMIN_EMAIL", "taher.stone@gmail.com"),
                password=password,
                first_name="মোঃ আবু তাহের",
                role="admin",
            )
            self.stdout.write(
                self.style.WARNING(
                    f"অ্যাডমিন তৈরি: {username} / {password} — প্রথম লগইনের পর পাসওয়ার্ড বদলে নিন।"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"সিড সম্পন্ন — {Post.objects.count()} পোস্ট, {Event.objects.count()} ইভেন্ট, "
                f"{Pillar.objects.count()} স্তম্ভ, {GalleryPhoto.objects.count()} ছবি, "
                f"{GalleryPoster.objects.count()} পোস্টার, {VideoItem.objects.count()} ভিডিও, "
                f"{SitePage.objects.count()} পেজ, {HomeSection.objects.count()} সেকশন, "
                f"{created} নতুন পোস্ট তৈরি"
            )
        )
