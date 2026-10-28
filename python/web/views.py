"""পাবলিক সাইটের সব পেজ (Django template ভিত্তিক)।"""
from __future__ import annotations

import datetime as dt

from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from content import data, services
from content.models import Post
from crm.models import Appointment, Feedback, Message, Poll, PollOption, PollVote, Conversation

from .forms import AppointmentForm, ChatForm, FeedbackForm


# ------------------------------------------------------------------ utils
def _paginate(request, rows, per_page=9):
    paginator = Paginator(rows, per_page)
    return paginator.get_page(request.GET.get("page"))


def _visitor_key(request) -> str:
    key = request.session.get("_visitor_key")
    if not key:
        key = f"v-{timezone.now().timestamp():.0f}"
        request.session["_visitor_key"] = key
    return key


# ------------------------------------------------------------------- home
def home(request):
    from content.models import HomeSection  # local import keeps startup light

    copies = {s["id"]: services.home_copy(s["id"]) for s in data.home_sections()}
    return render(
        request,
        "web/home.html",
        {
            "copies": copies,
            "hero_stats": data.stats(),
            "values": data.values(),
            "pillars": services.pillars()[:4],
            "upcoming": services.upcoming_events(4),
            "posts": services.posts(Post.KIND_BLOG)[:3],
            "news": services.posts(Post.KIND_NEWS)[:2],
            "testimonials": data.testimonials()[:3],
            "activities": data.activities()[:4],
            "faqs": data.faqs()[:4],
            "totals": services.manifesto_totals(),
            "active_polls": Poll.objects.filter(status="active")[:1],
            "intro_video": data.intro_video(),
            "quick_links": data.site()["quickLinks"],
        },
    )


# ------------------------------------------------------------------ about
def about(request):
    return render(
        request,
        "web/about.html",
        {
            "bio": data.bio(),
            "stats": data.stats(),
            "values": data.values(),
            "faqs": data.faqs(),
            "emergency": data.emergency_contacts(),
            "activities": data.activities(),
        },
    )


def activities(request):
    category = request.GET.get("category", "")
    rows = data.activities()
    if category:
        rows = [a for a in rows if a.get("category") == category]
    return render(
        request,
        "web/activities.html",
        {
            "activities": rows,
            "categories": data.activity_categories(),
            "active": category,
            "count": len(rows),
        },
    )


# -------------------------------------------------------------- manifesto
def manifesto(request):
    slug = request.GET.get("pillar", "")
    pillars = services.pillars()
    current = next((p for p in pillars if p.slug == slug), pillars[0] if pillars else None)
    return render(
        request,
        "web/manifesto.html",
        {
            "intro": data.manifesto_intro(),
            "pillars": pillars,
            "current": current,
            "faq": data.manifesto_faq(),
            "totals": services.manifesto_totals(),
        },
    )


def manifesto_print(request):
    return render(
        request,
        "web/manifesto_print.html",
        {
            "intro": data.manifesto_intro(),
            "pillars": services.pillars(),
            "totals": services.manifesto_totals(),
            "generated": timezone.localtime(),
        },
    )


# --------------------------------------------------------------- campaign
def campaign(request):
    plan = data.campaign()
    return render(
        request,
        "web/campaign.html",
        {
            "kpis": plan["campaignKpis"],
            "overview": plan["campaignOverview"],
            "phases": plan["phases"],
            "zones": plan["zones"],
            "weekly": plan["weeklyRhythm"],
            "resources": plan["campaignResources"],
            "roles": plan["volunteerRoles"],
            "events": services.upcoming_events(6),
        },
    )


# ----------------------------------------------------------------- events
def events(request):
    upcoming = services.upcoming_events()
    past = list(reversed(services.past_events()[:6]))
    return render(
        request,
        "web/events.html",
        {
            "upcoming": upcoming,
            "past": past,
            "types": data.event_types(),
            "count": len(upcoming) + len(past),
        },
    )


def event_detail(request, slug):
    event = services.event_by_slug(slug)
    if not event:
        return render(request, "web/404.html", status=404)
    others = [e for e in services.events() if e.slug != slug][:3]
    return render(request, "web/event_detail.html", {"event": event, "others": others})


# ------------------------------------------------------------------- blog
def blog(request):
    tag = request.GET.get("tag", "")
    category = request.GET.get("category", "")
    query = request.GET.get("q", "")
    rows = services.posts(Post.KIND_BLOG)
    if tag:
        rows = rows.filter(tags__contains=[tag])
    if category:
        rows = rows.filter(category=category)
    if query:
        rows = rows.filter(Q(title__icontains=query) | Q(excerpt__icontains=query))
    rows = list(rows)
    featured = rows[0] if rows else None
    rest = rows[1:] if len(rows) > 1 else []
    page = _paginate(request, rest, 9) if rest else rest
    return render(
        request,
        "web/blog.html",
        {
            "featured": featured,
            "page": page,
            "categories": data.blog_categories(),
            "tags": services.blog_tags()[:18],
            "active_tag": tag,
            "active_category": category,
            "query": query,
            "total": len(rows),
            "views": sum(p.views for p in rows),
            "tag_count": len(services.blog_tags()),
        },
    )


def post_detail(request, slug):
    post = services.post_by_slug(slug)
    if not post:
        return render(request, "web/404.html", status=404)
    Post.objects.filter(pk=post.pk).update(views=post.views + 1)
    return render(
        request,
        "web/post_detail.html",
        {"post": post, "related": services.related_posts(post), "blocks": post.body_blocks()},
    )


# ------------------------------------------------------------------- news
def news(request):
    rows = list(services.posts(Post.KIND_NEWS))
    lead = rows[0] if rows else None
    page = _paginate(request, rows[1:] if len(rows) > 1 else [], 9) if len(rows) > 1 else []
    outlets = sorted({n.outlet for n in rows if n.outlet})
    return render(
        request,
        "web/news.html",
        {"lead": lead, "page": page, "total": len(rows), "outlets": outlets},
    )


# ---------------------------------------------------------------- polls
def polls(request):
    if request.method == "POST":
        key = _visitor_key(request)
        option_id = request.POST.get("option", "")
        option = PollOption.objects.filter(pk=option_id).select_related("poll").first()
        if option and option.poll.is_open:
            PollVote.objects.get_or_create(option=option, visitor_key=key)
            messages.success(request, "আপনার ভোট গণনা করা হয়েছে — ধন্যবাদ!")
        else:
            messages.error(request, "এই জরিপে এখন ভোট দেওয়া যাচ্ছে না।")
        return redirect("web:polls")

    key = _visitor_key(request)
    rows = list(Poll.objects.all())
    voted = {}
    for row in rows:
        vote = PollVote.objects.filter(option__poll=row, visitor_key=key).select_related("option").first()
        total = row.total_votes or 1
        options = [
            {
                "id": o.pk,
                "label": o.label,
                "votes": o.votes,
                "pct": round((o.votes / total) * 100, 1),
            }
            for o in row.options.all()
        ]
        voted[row.pk] = {
            "option": vote.option_id if vote else None,
            "options": sorted(options, key=lambda x: -x["votes"]),
            "total": row.total_votes,
        }
    return render(
        request,
        "web/polls.html",
        {"polls": rows, "results": voted, "summary": data.poll_archive_summary()},
    )


# ---------------------------------------------------------------- gallery
def gallery_redirect(request):
    return HttpResponseRedirect("/gallery/photos/")


def gallery(request, tab="photos"):
    if tab not in {"photos", "posters", "videos"}:
        return redirect("web:gallery", tab="photos")
    ctx = {
        "tab": tab,
        "photo_rows": services.photos() if tab == "photos" else [],
        "poster_rows": services.posters() if tab == "posters" else [],
        "video_rows": services.videos() if tab == "videos" else [],
        "photo_tags": services.photo_tags(),
        "election_posters": [p for p in services.posters() if p.election],
        "counts": {
            "photos": len(services.photos()),
            "posters": len(services.posters()),
            "videos": len(services.videos()),
        },
        "featured_video": data.featured_video(),
        "categories": data.video_categories(),
    }
    return render(request, "web/gallery.html", ctx)


# ----------------------------------------------------------- appointment
def appointment(request):
    if request.method == "POST":
        form = AppointmentForm(request.POST)
        if form.is_valid():
            row = form.save()
            messages.success(
                request,
                "আপনার অনুরোধ জমা হয়েছে। টিম ফোনে নিশ্চিত করলে সময় চূড়ান্ত হবে — "
                "সাধারণত ২৪ ঘণ্টার মধ্যে।",
            )
            return redirect("web:appointment")
    else:
        form = AppointmentForm()
    return render(
        request,
        "web/appointment.html",
        {
            "form": form,
            "hours": data.site()["officeHours"],
            "hours_note": data.site()["officeHoursNote"],
            "topics": Appointment.TOPICS,
            "queue": Appointment.objects.count(),
        },
    )


# -------------------------------------------------------------- feedback
def feedback(request):
    if request.method == "POST":
        form = FeedbackForm(request.POST)
        if form.is_valid():
            row = form.save()
            if row.is_threat:
                messages.warning(
                    request,
                    "হুমকির তথ্য গোপনীয়ভাবে সংরক্ষিত হয়েছে। জরুরি হলে ৯৯৯-এ কল করুন।",
                )
            else:
                messages.success(request, "আপনার বার্তা পৌঁছেছে — টিম পর্যালোচনা করে ব্যবস্থা নেবে।")
            return redirect("web:feedback")
    else:
        form = FeedbackForm()
    return render(
        request,
        "web/feedback.html",
        {
            "form": form,
            "kinds": Feedback.KINDS,
            "emergency": data.emergency_contacts(),
            "recent": Feedback.objects.filter(status="resolved")[:3],
        },
    )


# ------------------------------------------------------------------ chat
def chat(request):
    if request.method == "POST":
        form = ChatForm(request.POST)
        if form.is_valid():
            key = request.session.get("chat_key") or f"web-{timezone.now().timestamp():.0f}"
            request.session["chat_key"] = key
            convo, _ = Conversation.objects.get_or_create(
                key=key,
                defaults={
                    "name": form.cleaned_data["name"][:120],
                    "phone": form.cleaned_data["phone"][:32],
                },
            )
            Message.objects.create(
                conversation=convo, sender="visitor", body=form.cleaned_data["message"]
            )
            convo.unread += 1
            convo.save(update_fields=["unread"])
            return JsonResponse({"ok": True, "reload": True})
        return JsonResponse({"ok": False, "errors": form.errors}, status=400)

    key = request.session.get("chat_key")
    convo = Conversation.objects.filter(key=key).first() if key else None
    return render(
        request,
        "web/chat.html",
        {
            "form": ChatForm(),
            "conversation": convo,
            "messages": convo.messages.all() if convo else [],
            "faqs": data.faqs(),
            "help": data.help_articles()[:4],
            "emergency": data.emergency_contacts(),
        },
    )


# --------------------------------------------------------------- contact
def contact(request):
    return render(
        request,
        "web/contact.html",
        {
            "bio": data.bio(),
            "emergency": data.emergency_contacts(),
            "hours": data.site()["officeHours"],
            "faqs": data.faqs(),
            "form": AppointmentForm(),
        },
    )


def media_kit(request):
    return render(
        request,
        "web/media_kit.html",
        {
            "bio": data.media_kit_bio(),
            "stats": data.stats(),
            "values": data.values(),
            "photos": services.photos()[:6],
            "posters": [p for p in services.posters() if p.election],
        },
    )


def privacy(request):
    return render(request, "web/privacy.html", {"updated": dt.date(2026, 10, 1)})


# --------------------------------------------------------------- SEO/feed
def robots(request):
    body = "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: {scheme}://{host}/sitemap.xml\n"
    return HttpResponse(
        body.format(scheme=request.scheme, host=request.get_host()),
        content_type="text/plain",
    )


def sitemap(request):
    base = f"{request.scheme}://{request.get_host()}"
    pages = ["", "about/", "manifesto/", "campaign/", "events/", "news/", "blog/", "polls/",
             "appointment/", "feedback/", "contact/", "gallery/photos/", "gallery/posters/",
             "gallery/videos/", "media-kit/", "privacy/", "chat/"]
    rows = [("", timezone.now().date(), "1.0")] + [(p, timezone.now().date(), "0.8") for p in pages[1:]]
    for post in Post.objects.filter(status="published"):
        rows.append((post.get_absolute_url().lstrip("/"), post.published_on, "0.7"))
    for event in services.events():
        rows.append((event.get_absolute_url().lstrip("/"), event.date, "0.6"))
    body = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, changed, priority in rows:
        body.append(f"<url><loc>{base}/{path}</loc><lastmod>{changed}</lastmod><priority>{priority}</priority></url>")
    body.append("</urlset>")
    return HttpResponse("\n".join(body), content_type="application/xml")


def feed(request):
    base = f"{request.scheme}://{request.get_host()}"
    posts = list(Post.objects.filter(status="published")[:20])
    items = []
    for post in posts:
        items.append(
            "<item>"
            f"<title>{post.title}</title>"
            f"<link>{base}{post.get_absolute_url()}</link>"
            f"<guid>{base}{post.get_absolute_url()}</guid>"
            f"<pubDate>{post.published_on}T00:00:00+06:00</pubDate>"
            f"<description>{post.excerpt}</description>"
            "</item>"
        )
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<rss version="2.0"><channel>'
        f"<title>{data.site()['name']} — ব্লগ ও সংবাদ</title>"
        f"<link>{base}</link>"
        "<language>bn</language>"
        f"<description>{data.site()['slogan']}</description>"
        + "".join(items)
        + "</channel></rss>"
    )
    return HttpResponse(body, content_type="application/rss+xml")


def manifest(request):
    site = data.site()
    payload = {
        "name": f"{site['name']} — {site['role']}",
        "short_name": site["nameEn"],
        "description": site["slogan"],
        "start_url": "/",
        "display": "standalone",
        "background_color": "#f8f4ea",
        "theme_color": "#0a3025",
        "lang": "bn",
        "icons": [
            {"src": "/static/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/static/img/icon-512.png", "sizes": "512x512", "type": "image/png"},
        ],
    }
    return JsonResponse(payload, json_dumps_params={"ensure_ascii": False})


def page_404(request, exception=None):
    return render(request, "web/404.html", status=404)
