"""কোডে থাকা (সিড) কনটেন্ট — `seed/content.json` থেকে লোড হয়।

এগুলো মূল Next.js অ্যাপের `src/content/*.ts` ফাইলগুলোর হুবহু অনুলিপি
(বাংলা লেখা, তারিখ, ছবির কী — কিছুই বদলানো হয়নি)। অ্যাডমিন থেকে কিছু
সম্পাদনা করলে ডেটাবেসের মান আগে দেখা হয়, নাহলে এই ডিফল্ট।
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

SEED_FILE = Path(__file__).resolve().parent.parent / "seed" / "content.json"


@lru_cache(maxsize=1)
def raw() -> dict:
    with SEED_FILE.open(encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------- site
@lru_cache(maxsize=1)
def site() -> dict:
    return raw()["site"]["site"]


@lru_cache(maxsize=1)
def bio() -> dict:
    return raw()["site"]["bio"]


@lru_cache(maxsize=1)
def stats() -> list[dict]:
    return raw()["site"]["stats"]


@lru_cache(maxsize=1)
def values() -> list[dict]:
    return raw()["site"]["values"]


@lru_cache(maxsize=1)
def faqs() -> list[dict]:
    return raw()["site"]["faqs"]


@lru_cache(maxsize=1)
def emergency_contacts() -> list[dict]:
    return raw()["site"]["emergencyContacts"]


# ------------------------------------------------------------ manifesto
@lru_cache(maxsize=1)
def manifesto_intro() -> dict:
    return raw()["manifesto"]["manifestoIntro"]


@lru_cache(maxsize=1)
def pillars() -> list[dict]:
    return raw()["manifesto"]["pillars"]


@lru_cache(maxsize=1)
def manifesto_faq() -> list[dict]:
    return raw()["manifesto"]["manifestoFaq"]


# ---------------------------------------------------------------- blog
@lru_cache(maxsize=1)
def posts() -> list[dict]:
    return raw()["blog"]["posts"]


@lru_cache(maxsize=1)
def blog_categories() -> list[str]:
    return raw()["blog"]["blogCategories"]


@lru_cache(maxsize=1)
def all_tags() -> list[str]:
    return raw()["blog"]["allTags"]


# ---------------------------------------------------------------- news
@lru_cache(maxsize=1)
def news() -> list[dict]:
    return raw()["news"]["news"]


# --------------------------------------------------------------- events
@lru_cache(maxsize=1)
def events() -> list[dict]:
    return raw()["events"]["events"]


@lru_cache(maxsize=1)
def event_types() -> list[dict]:
    return raw()["events"]["eventTypes"]


# --------------------------------------------------------------- polls
@lru_cache(maxsize=1)
def polls() -> list[dict]:
    return raw()["polls"]["seedPolls"]


@lru_cache(maxsize=1)
def poll_archive_summary() -> dict:
    return raw()["polls"]["pollArchiveSummary"]


# ------------------------------------------------------------- galleries
@lru_cache(maxsize=1)
def gallery_photos() -> list[dict]:
    return raw()["gallery"]["galleryPhotos"]


@lru_cache(maxsize=1)
def gallery_posters() -> list[dict]:
    return raw()["gallery"]["galleryPosters"]


@lru_cache(maxsize=1)
def election_posters() -> list[dict]:
    return raw()["gallery"]["electionPosters"]


@lru_cache(maxsize=1)
def videos() -> list[dict]:
    return raw()["videos"]["campaignVideos"]


@lru_cache(maxsize=1)
def video_categories() -> list[str]:
    return raw()["videos"]["videoCategories"]


@lru_cache(maxsize=1)
def featured_video() -> dict:
    return raw()["videos"]["featuredVideo"]


@lru_cache(maxsize=1)
def intro_video() -> dict:
    return raw()["videos"]["introVideo"]


# ------------------------------------------------------------ activities
@lru_cache(maxsize=1)
def activities() -> list[dict]:
    return raw()["activities"]["activities"]


@lru_cache(maxsize=1)
def activity_categories() -> list[str]:
    return raw()["activities"]["activityCategories"]


# -------------------------------------------------------------- campaign
@lru_cache(maxsize=1)
def campaign() -> dict:
    return raw()["campaign"]


# ------------------------------------------------------------------ help
@lru_cache(maxsize=1)
def help_articles() -> list[dict]:
    return raw()["help"]["helpArticles"]


# ------------------------------------------------------------- media kit
@lru_cache(maxsize=1)
def media_kit_bio() -> dict:
    return raw()["mediaKit"]["mediaKitBio"]


# --------------------------------------------------------- home sections
@lru_cache(maxsize=1)
def home_sections() -> list[dict]:
    return raw()["homeSections"]["homeSections"]


@lru_cache(maxsize=1)
def site_pages() -> list[dict]:
    return raw()["sitePages"]["sitePages"]


@lru_cache(maxsize=1)
def site_page_groups() -> list[str]:
    return raw()["sitePages"]["sitePageGroups"]


# ------------------------------------------------------------ testi/ticker
@lru_cache(maxsize=1)
def testimonials() -> list[dict]:
    return raw()["testimonials"]["testimonials"]


@lru_cache(maxsize=1)
def ticker_defaults() -> list[dict]:
    return raw()["ticker"]["defaultTickerItems"]


@lru_cache(maxsize=1)
def ticker_default_settings() -> dict:
    return raw()["ticker"]["defaultTickerSettings"]


# -------------------------------------------------------------- images
@lru_cache(maxsize=1)
def image_map() -> dict[str, str]:
    return raw()["media"]["imageMap"]


def image_for(key: str | None) -> str:
    """রেজিস্ট্রি কী → পাথ; সরাসরি `/…` বা `https://…` হলে সেটাই ফেরে।"""
    if not key:
        return ""
    if key.startswith(("/", "http://", "https://", "data:")):
        return key
    return image_map().get(key, "")


@lru_cache(maxsize=1)
def command_seed() -> dict:
    return raw()["commandSeed"]
