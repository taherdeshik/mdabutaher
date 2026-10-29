"""Public website pages. Each view renders a template from content/data/*.json."""

from django.http import Http404, HttpRequest, HttpResponse
from django.shortcuts import render
from django.utils import timezone

from civic.api import event_seats_for, poll_payload
from cms.copy import option_list, page_text

from . import content


# Breadcrumb sections. Their labels are the `section.<name>` keys of the `pages` document.
SECTION_NAMES = (
    "about",
    "manifesto",
    "campaign",
    "events",
    "activities",
    "news",
    "blog",
    "gallery",
    "polls",
    "appointment",
    "feedback",
    "chat",
    "contact",
    "media-kit",
    "privacy",
)


def _crumbs(path: str, title: str) -> list[dict]:
    """Breadcrumb trail derived from the URL: section → detail page title."""
    parts = [p for p in path.split("/") if p]
    if not parts:
        return []
    section = parts[0]
    label = page_text(f"section.{section}") if section in SECTION_NAMES else None
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
                page_text("home.title", name=site["name"], role=site["role"], union=site["union"]),
                page_text("home.description"),
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
            "meta": _meta(page_text("about.title", name=site["name"]), site["intro"], "/about"),
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
                page_text("section.manifesto"), data["manifestoIntro"]["subtitle"], "/manifesto"
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
                page_text("manifesto_print.title"),
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
                page_text("campaign.title"), data["campaignOverview"]["subtitle"], "/campaign"
            ),
            "overview": data["campaignOverview"],
            "kpis": data["campaignKpis"],
            "phases": data["phases"],
            "zones": data["zones"],
            "rhythm": data["weeklyRhythm"],
            "volunteer_roles": data["volunteerRoles"],
            "resources": data["campaignResources"],
            "wards": option_list("wards"),
            "availability": option_list("volunteerAvailability"),
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
                page_text("events.title"),
                page_text("events.description"),
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
            "wards": option_list("wards"),
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
                page_text("section.activities"), page_text("activities.description"), "/activities"
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
                page_text("news.title"), page_text("news.description"), "/news"
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
                page_text("blog.title"),
                page_text("blog.description"),
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
            "reactions": option_list("reactions"),
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
                page_text("gallery.title"),
                page_text("gallery.description"),
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
                page_text("section.polls"), page_text("polls.description"), "/polls"
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
                page_text("appointment.title"),
                page_text("appointment.description"),
                "/appointment",
            ),
            "types": option_list("appointmentTypes"),
            "slots": option_list("appointmentSlots"),
            "wards": option_list("wards"),
            "modes": option_list("appointmentModes"),
        },
    )


def appointment_status(request: HttpRequest):
    return render(
        request,
        "pages/appointment_status.html",
        {
            "meta": _meta(
                page_text("appointment_status.title"),
                page_text("appointment_status.description"),
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
                page_text("section.feedback"),
                page_text("feedback.description"),
                "/feedback",
            ),
            "kinds": option_list("feedbackKinds"),
            "categories": option_list("feedbackCategories"),
            "wards": option_list("wards"),
            "severities": option_list("feedbackSeverities"),
            "help": content.load("help")["helpArticles"],
        },
    )


def feedback_board(request: HttpRequest):
    return render(
        request,
        "pages/feedback_board.html",
        {
            "meta": _meta(
                page_text("feedback_board.title"), page_text("feedback_board.description"), "/feedback/board"
            ),
            "wards": option_list("wards"),
        },
    )


def chat(request: HttpRequest):
    chat_data = content.load("chat")
    return render(
        request,
        "pages/chat.html",
        {
            "meta": _meta(
                page_text("chat.title"), page_text("chat.description"), "/chat"
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
            "meta": _meta(page_text("section.contact"), page_text("contact.description"), "/contact"),
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
            "meta": _meta(page_text("section.media-kit"), page_text("media_kit.description"), "/media-kit"),
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
                page_text("section.privacy"),
                page_text("privacy.description"),
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
        request, template_name, {"meta": _meta(page_text("not_found.title"), "", request.path)}
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
