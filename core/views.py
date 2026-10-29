"""Public website pages. Each view renders a template from content/data/*.json."""

from django.http import Http404, HttpRequest, HttpResponse
from django.shortcuts import render
from django.utils import timezone

from civic.api import event_seats_for, poll_payload
from civic.constants import (
    APPOINTMENT_SLOTS,
    APPOINTMENT_TYPES,
    FEEDBACK_CATEGORIES,
    VOLUNTEER_AVAILABILITY,
    WARDS,
)

from . import content


SECTION_LABELS = {
    "about": "পরিচিতি",
    "manifesto": "ম্যানিফেস্টো",
    "campaign": "প্রচারণা",
    "events": "ইভেন্ট",
    "activities": "কার্যক্রম",
    "news": "সংবাদ",
    "blog": "ব্লগ",
    "gallery": "গ্যালারি",
    "polls": "জনমত জরিপ",
    "appointment": "অ্যাপয়েন্টমেন্ট",
    "feedback": "সমস্যা ও পরামর্শ",
    "chat": "লাইভ চ্যাট",
    "contact": "যোগাযোগ",
    "media-kit": "মিডিয়া কিট",
    "privacy": "গোপনীয়তা নীতি",
}


def _crumbs(path: str, title: str) -> list[dict]:
    """Breadcrumb trail derived from the URL: section → detail page title."""
    parts = [p for p in path.split("/") if p]
    if not parts:
        return []
    section = parts[0]
    label = SECTION_LABELS.get(section)
    crumbs = []
    if label:
        crumbs.append(
            {"label": label, "href": f"/{section}" if len(parts) > 1 else None}
        )
    if len(parts) > 1:
        crumbs.append({"label": title})
    return crumbs


def _meta(
    title: str, description: str = "", path: str = "/", image: str | None = None
) -> dict:
    return {
        "title": title,
        "description": description,
        "path": path,
        "image": image,
        "crumbs": _crumbs(path, title),
    }


# --------------------------------------------------------------------------
# Home & profile
# --------------------------------------------------------------------------


def home(request: HttpRequest):
    site = content.site()
    today = timezone.localdate().isoformat()
    upcoming = [
        e for e in content.events() if e["status"] != "past" and e["date"] >= today
    ]
    upcoming = (upcoming or [e for e in content.events() if e["status"] != "past"])[:3]
    featured_posts = [p for p in content.posts() if p.get("featured")][
        :3
    ] or content.posts()[:3]
    return render(
        request,
        "pages/home.html",
        {
            "meta": _meta(
                f"{site['name']} — {site['role']}, {site['union']}",
                "মানুষের পাশে, সবসময়। মহাদান ইউনিয়নের চেয়ারম্যান পদপ্রার্থী মোঃ আবু তাহেরের ম্যানিফেস্টো, প্রচারণা সময়সূচি, জনসেবা ও যোগাযোগের ডিজিটাল ঠিকানা।",
                "/",
                content.image_for("heroPortrait"),
            ),
            "stats": content.load("site")["stats"],
            "values": content.load("site")["values"],
            "pillars": content.load("manifesto")["pillars"][:4],
            "phases": content.load("campaign")["phases"],
            "upcoming_events": upcoming,
            "activities": [a for a in content.activities() if a.get("featured")][:3]
            or content.activities()[:3],
            "poll": poll_payload(content.polls()[0]) if content.polls() else None,
            "posts": featured_posts,
            "testimonials": content.load("testimonials")["testimonials"][:6],
            "faqs": content.load("site")["faqs"][:3],
        },
    )


def about(request: HttpRequest):
    site = content.site()
    return render(
        request,
        "pages/about.html",
        {
            "meta": _meta(f"পরিচিতি — {site['name']}", site["intro"], "/about"),
            "bio": content.load("site")["bio"],
            "values": content.load("site")["values"],
            "faqs": content.load("site")["faqs"],
        },
    )


def manifesto(request: HttpRequest):
    data = content.load("manifesto")
    return render(
        request,
        "pages/manifesto.html",
        {
            "meta": _meta(
                "ম্যানিফেস্টো", data["manifestoIntro"]["subtitle"], "/manifesto"
            ),
            "intro": data["manifestoIntro"],
            "pillars": data["pillars"],
            "faqs": data["manifestoFaq"],
        },
    )


def manifesto_print(request: HttpRequest):
    data = content.load("manifesto")
    return render(
        request,
        "pages/manifesto_print.html",
        {
            "meta": _meta(
                "ম্যানিফেস্টো — প্রিন্ট সংস্করণ",
                data["manifestoIntro"]["subtitle"],
                "/manifesto/print",
            ),
            "intro": data["manifestoIntro"],
            "pillars": data["pillars"],
        },
    )


def campaign(request: HttpRequest):
    data = content.load("campaign")
    return render(
        request,
        "pages/campaign.html",
        {
            "meta": _meta(
                "প্রচারণা পরিকল্পনা", data["campaignOverview"]["subtitle"], "/campaign"
            ),
            "overview": data["campaignOverview"],
            "kpis": data["campaignKpis"],
            "phases": data["phases"],
            "zones": data["zones"],
            "rhythm": data["weeklyRhythm"],
            "volunteer_roles": data["volunteerRoles"],
            "resources": data["campaignResources"],
            "wards": WARDS,
            "availability": VOLUNTEER_AVAILABILITY,
        },
    )


# --------------------------------------------------------------------------
# Events, activities, news, blog, gallery
# --------------------------------------------------------------------------


def events(request: HttpRequest):
    data = content.load("events")
    chosen = request.GET.get("type", "সব")
    items = content.events()
    if chosen and chosen != "সব":
        items = [e for e in items if e["type"] == chosen]
    return render(
        request,
        "pages/events.html",
        {
            "meta": _meta(
                "আসন্ন ইভেন্ট ও জনসভা",
                "জনসভা, উঠান বৈঠক, মিছিল ও সেবা ক্যাম্পের সময়সূচি।",
                "/events",
            ),
            "events": items,
            "types": data["eventTypes"],
            "active_type": chosen,
        },
    )


def event_detail(request: HttpRequest, event_id: str):
    event = content.find_event(event_id)
    if event is None:
        raise Http404("event")
    registered, left = event_seats_for(event)
    return render(
        request,
        "pages/event_detail.html",
        {
            "meta": _meta(
                event["title"], event["description"][:160], f"/events/{event_id}"
            ),
            "event": event,
            "registered": registered,
            "seats_left": left,
            "wards": WARDS,
            "closed": event["status"] == "past",
        },
    )


def activities(request: HttpRequest):
    cats = content.load("activities")["activityCategories"]
    chosen = request.GET.get("cat", "সব")
    items = content.activities()
    if chosen and chosen != "সব":
        items = [a for a in items if a["category"] == chosen]
    return render(
        request,
        "pages/activities.html",
        {
            "meta": _meta(
                "কার্যক্রম", "জনকল্যাণের বাস্তব কাজ — পানি, শিক্ষা, স্বাস্থ্য ও ত্রাণ।", "/activities"
            ),
            "activities": items,
            "categories": cats,
            "active_cat": chosen,
        },
    )


def activity_detail(request: HttpRequest, activity_id: str):
    activity = content.find_activity(activity_id)
    if activity is None:
        raise Http404("activity")
    return render(
        request,
        "pages/activity_detail.html",
        {
            "meta": _meta(
                activity["title"],
                activity["summary"],
                f"/activities/{activity_id}",
                content.image_for(activity["image"]),
            ),
            "activity": activity,
            "related": [
                a
                for a in content.activities()
                if a["id"] != activity_id and a["category"] == activity["category"]
            ][:3],
        },
    )


def news(request: HttpRequest):
    return render(
        request,
        "pages/news.html",
        {
            "meta": _meta(
                "সংবাদ — গণমাধ্যমে আমরা", "গণমাধ্যমে প্রকাশিত সংবাদ ও প্রেস কভারেজ।", "/news"
            ),
            "items": content.news(),
        },
    )


def news_detail(request: HttpRequest, news_id: str):
    item = content.find_news(news_id)
    if item is None:
        raise Http404("news")
    return render(
        request,
        "pages/news_detail.html",
        {
            "meta": _meta(
                item["title"],
                item["summary"],
                f"/news/{news_id}",
                content.image_for(item["image"]),
            ),
            "item": item,
        },
    )


def blog(request: HttpRequest):
    data = content.load("blog")
    cat = request.GET.get("cat", "সব")
    query = request.GET.get("q", "").strip().lower()
    tag = request.GET.get("tag", "")
    sort = request.GET.get("sort", "new")

    items = list(content.posts())
    if cat and cat != "সব":
        items = [p for p in items if p["category"] == cat]
    if tag:
        items = [p for p in items if tag in p["tags"]]
    if query:
        items = [
            p
            for p in items
            if query
            in (p["title"] + " " + p["excerpt"] + " " + " ".join(p["tags"])).lower()
        ]
    if sort == "popular":
        items.sort(key=lambda p: p["views"], reverse=True)
    else:
        items.sort(key=lambda p: p["date"], reverse=True)

    return render(
        request,
        "pages/blog.html",
        {
            "meta": _meta(
                "ব্লগ — ভাবনা, বিশ্লেষণ ও আপডেট",
                "মহাদান ইউনিয়ন নিয়ে ভাবনা, বিশ্লেষণ ও আপডেট।",
                "/blog",
            ),
            "posts": items,
            "categories": data["blogCategories"],
            "tags": data["allTags"],
            "active_cat": cat,
            "active_tag": tag,
            "query": request.GET.get("q", ""),
            "sort": sort,
            "total": len(content.posts()),
        },
    )


def blog_detail(request: HttpRequest, slug: str):
    post = content.find_post(slug)
    if post is None:
        raise Http404("post")
    related = [
        p
        for p in content.posts()
        if p["slug"] != slug and p["category"] == post["category"]
    ][:3]
    return render(
        request,
        "pages/blog_detail.html",
        {
            "meta": _meta(
                post["title"],
                post["excerpt"],
                f"/blog/{slug}",
                content.image_for(post["image"]),
            ),
            "post": post,
            "related": related,
            "reactions": [
                {"id": "like", "label": "ভালো লেগেছে", "count": 128},
                {"id": "love", "label": "অনুপ্রাণিত", "count": 64},
                {"id": "clap", "label": "গুরুত্বপূর্ণ", "count": 41},
            ],
        },
    )


def _gallery_video(item: dict) -> dict:
    """Gallery videos used to be bare YouTube ids; `video` (library file or link) wins."""
    if item.get("video") or not item.get("id"):
        return item
    return {**item, "video": f"https://www.youtube.com/watch?v={item['id']}"}


def gallery(request: HttpRequest):
    data = content.load("gallery")
    photos = data["galleryPhotos"]
    tags = ["সব"] + sorted({p["tag"] for p in photos})
    chosen = request.GET.get("tag", "সব")
    if chosen != "সব":
        photos = [p for p in photos if p["tag"] == chosen]
    return render(
        request,
        "pages/gallery.html",
        {
            "meta": _meta(
                "গ্যালারি — ছবি, পোস্টার ও ভিডিও",
                "বাস্তব ছবি, প্রচারণার পোস্টার ও ভিডিও।",
                "/gallery",
            ),
            "photos": [{**p, "src": content.image_for(p["key"]) or ""} for p in photos],
            "posters": [
                {**p, "src": content.image_for(p["key"]) or ""}
                for p in data["galleryPosters"]
            ],
            "videos": [_gallery_video(v) for v in data["galleryVideos"]],
            "tags": tags,
            "active_tag": chosen,
        },
    )


# --------------------------------------------------------------------------
# Services
# --------------------------------------------------------------------------


def polls(request: HttpRequest):
    return render(
        request,
        "pages/polls.html",
        {
            "meta": _meta(
                "জনমত জরিপ", "জনমত জরিপে অংশ নিন এবং লাইভ ফলাফল দেখুন।", "/polls"
            ),
            "polls": [poll_payload(p) for p in content.polls()],
            "archive": content.load("polls")["pollArchiveSummary"],
        },
    )


def appointment(request: HttpRequest):
    return render(
        request,
        "pages/appointment.html",
        {
            "meta": _meta(
                "অ্যাপয়েন্টমেন্ট বুক করুন",
                "অফিসে সাক্ষাৎ, ফোনে কথা বা বাড়ি পরিদর্শনের অনুরোধ।",
                "/appointment",
            ),
            "types": APPOINTMENT_TYPES,
            "slots": APPOINTMENT_SLOTS,
            "wards": WARDS,
            "modes": [
                {"id": "in-person", "label": "কার্যালয়ে", "desc": "সরাসরি সাক্ষাৎ"},
                {"id": "phone", "label": "ফোনে", "desc": "নির্ধারিত সময়ে কল"},
                {"id": "home-visit", "label": "বাড়ি পরিদর্শন", "desc": "বিশেষ প্রয়োজন"},
            ],
        },
    )


def appointment_status(request: HttpRequest):
    return render(
        request,
        "pages/appointment_status.html",
        {
            "meta": _meta(
                "অ্যাপয়েন্টমেন্ট স্ট্যাটাস",
                "মোবাইল নম্বর দিয়ে আপনার অ্যাপয়েন্টমেন্ট দেখুন।",
                "/appointment/status",
            ),
        },
    )


def feedback(request: HttpRequest):
    return render(
        request,
        "pages/feedback.html",
        {
            "meta": _meta(
                "সমস্যা ও পরামর্শ",
                "সমস্যা, পরামর্শ বা নিরাপত্তা-হুমকি রিপোর্ট করুন। ট্র্যাকিং আইডি দিয়ে অগ্রগতি দেখুন।",
                "/feedback",
            ),
            "kinds": [
                {
                    "id": "problem",
                    "label": "স্থানীয় সমস্যা",
                    "desc": "সড়ক, পানি, স্বাস্থ্য, শিক্ষা ইত্যাদি",
                },
                {"id": "advice", "label": "পরামর্শ", "desc": "উন্নয়নের নতুন ধারণা বা মতামত"},
                {
                    "id": "threat",
                    "label": "হুমকি ও ঝুঁকি",
                    "desc": "জরুরি নিরাপত্তা বা দুর্যোগ সংক্রান্ত",
                },
            ],
            "categories": FEEDBACK_CATEGORIES,
            "wards": WARDS,
            "severities": [
                {"id": "low", "label": "সাধারণ"},
                {"id": "medium", "label": "মাঝারি"},
                {"id": "high", "label": "জরুরি"},
                {"id": "critical", "label": "অতি জরুরি"},
            ],
            "help": content.load("help")["helpArticles"],
        },
    )


def feedback_board(request: HttpRequest):
    return render(
        request,
        "pages/feedback_board.html",
        {
            "meta": _meta(
                "জনসমস্যা বোর্ড", "প্রকাশ্য বোর্ডে জনসমস্যার অগ্রগতি দেখুন।", "/feedback/board"
            ),
            "wards": WARDS,
        },
    )


def chat(request: HttpRequest):
    chat_data = content.load("chat")
    return render(
        request,
        "pages/chat.html",
        {
            "meta": _meta(
                "লাইভ চ্যাট ও বার্তা", "প্রশ্ন করুন — অ্যাপয়েন্টমেন্ট, অভিযোগ বা ইভেন্ট নিয়ে।", "/chat"
            ),
            "suggestions": chat_data["suggestions"],
            "chat_rules": {
                "rules": chat_data["rules"],
                "default": chat_data["default"],
            },
        },
    )


def contact(request: HttpRequest):
    site = content.site()
    return render(
        request,
        "pages/contact.html",
        {
            "meta": _meta("যোগাযোগ", "কার্যালয়, ফোন, ইমেইল ও বার্তা পাঠানোর ফর্ম।", "/contact"),
            "site_contact": site,
            "map_url": site["mapUrl"],
        },
    )


def media_kit(request: HttpRequest):
    kit = content.load("media-kit")["mediaKitBio"]
    site = content.site()
    return render(
        request,
        "pages/media_kit.html",
        {
            "meta": _meta("মিডিয়া কিট", "প্রেস ছবি, ফ্যাক্ট শিট ও জীবনী।", "/media-kit"),
            "bio": kit,
            "site": site,
            "portrait": content.image_for("portrait"),
            "hero": content.image_for("hero"),
            "signature": content.image_for("signature"),
        },
    )


def privacy(request: HttpRequest):
    data = content.load("privacy")
    return render(
        request,
        "pages/privacy.html",
        {
            "meta": _meta(
                "গোপনীয়তা নীতি",
                "এই প্ল্যাটফর্মে সংগৃহীত তথ্য কীভাবে ব্যবহার ও সুরক্ষিত রাখা হয়।",
                "/privacy",
            ),
            "sections": data["sections"],
            "last_updated": data["lastUpdated"],
        },
    )


# --------------------------------------------------------------------------
# Errors
# --------------------------------------------------------------------------


def not_found(
    request: HttpRequest, exception=None, template_name="pages/not_found.html"
):
    html = render(
        request, template_name, {"meta": _meta("পাতাটি পাওয়া যায়নি", "", request.path)}
    ).content
    return HttpResponse(html, status=404, content_type="text/html; charset=utf-8")


def server_error(request: HttpRequest):
    return HttpResponse(
        "<h1>দুঃখিত, একটি সমস্যা হয়েছে।</h1><p>কিছুক্ষণ পরে আবার চেষ্টা করুন।</p>",
        status=500,
        content_type="text/html; charset=utf-8",
    )


__all__ = [
    "home",
    "about",
    "manifesto",
    "manifesto_print",
    "campaign",
    "events",
    "event_detail",
    "activities",
    "activity_detail",
    "news",
    "news_detail",
    "blog",
    "blog_detail",
    "gallery",
    "polls",
    "appointment",
    "appointment_status",
    "feedback",
    "feedback_board",
    "chat",
    "contact",
    "media_kit",
    "privacy",
    "not_found",
    "server_error",
]
