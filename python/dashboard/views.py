"""কমান্ড সেন্টার — CMS + CRM ড্যাশবোর্ড (Django templates)।"""
from __future__ import annotations

import csv
import datetime as dt
from decimal import Decimal

from django.contrib import messages
from django.contrib.auth import login as auth_login, logout, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.db.models import Count, Q, Sum
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from accounts.models import Role, User
from content import data, services
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
    TickerItem,
    TickerSettings,
    VideoItem,
)
from content.richtext import render_rich
from crm.models import (
    Appointment,
    AuditLog,
    Booth,
    Challenge,
    Conversation,
    Expense,
    Feedback,
    Household,
    Message,
    Poll,
    Task,
    TeamMember,
    VisitorEvent,
    Ward,
)

from . import forms
from .decorators import section, staff_required

SECTIONS = [
    ("situation", "সারসংক্ষেপ", "◧"),
    ("coverage", "ওয়ার্ড ও কভারেজ", "▦"),
    ("plan", "দৈনিক পরিকল্পনা", "☑"),
    ("team", "দল ও স্বেচ্ছাসেবক", "☺"),
    ("challenges", "চ্যালেঞ্জ ও সহায়তা", "⚑"),
    ("money", "ব্যয় ট্র্যাকার", "৳"),
    ("cms", "কনটেন্ট স্টুডিও", "✎"),
    ("site", "সাইট কনটেন্ট", "▤"),
    ("home", "হোমপেজ সেকশন", "⌂"),
    ("gallery", "গ্যালারি", "▣"),
    ("items", "ইভেন্ট ও ম্যানিফেস্টো", "◈"),
    ("ticker", "নিউজ টিকার", "▷"),
    ("crm", "CRM ও বার্তা", "☏"),
    ("analytics", "ভিজিটর অ্যানালিটিক্স", "◔"),
    ("settings", "সেটিংস ও রিপোর্ট", "⚙"),
]


# ------------------------------------------------------------------ helpers
def _campaign_settings() -> dict:
    return Setting.get("campaign", data.command_seed()["seedSettings"])


def _days_to_poll() -> int:
    cfg = _campaign_settings()
    try:
        polling = dt.date.fromisoformat(str(cfg.get("pollingDate", ""))[:10])
    except ValueError:
        return 0
    return (polling - timezone.localdate()).days


def _save_upload(upload, user) -> str:
    asset = MediaAsset.objects.create(
        file=upload,
        original_name=upload.name[:200],
        content_type=getattr(upload, "content_type", "") or "",
        size=upload.size,
        uploaded_by=user if user.is_authenticated else None,
    )
    return asset.file.url


def _handle_upload(request, form, field: str, target: str = "src"):
    """ফর্মে ফাইল থাকলে MediaAsset বানিয়ে `src` ফিল্ডে URL বসায়।"""
    upload = form.cleaned_data.get("upload")
    if upload:
        form.instance.__dict__[target] = _save_upload(upload, request.user)
        form.instance.save()
        return True
    return False


def _ctx(request, section_id: str, title: str, sub: str = "", **extra) -> dict:
    can = getattr(request.user, "can", lambda _s: True)
    return {
        "section_id": section_id,
        "sections": SECTIONS,
        "nav_sections": [row for row in SECTIONS if can(row[0])],
        "page_title": title,
        "page_sub": sub,
        "campaign": _campaign_settings(),
        "days_to_poll": _days_to_poll(),
        "unread_messages": Conversation.objects.filter(unread__gt=0).count(),
        "new_feedback": Feedback.objects.filter(status="new").count(),
        "pending_appointments": Appointment.objects.filter(status="pending").count(),
        **extra,
    }


# -------------------------------------------------------------------- auth
def login_view(request):
    if request.user.is_authenticated:
        return redirect("dashboard:overview")
    form = forms.LoginForm(request, data=request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.get_user()
        if not (user.is_staff or user.is_superuser):
            messages.error(request, "এই অ্যাকাউন্টে কমান্ড সেন্টারে ঢোকার অনুমতি নেই।")
        else:
            auth_login(request, user)
            AuditLog.objects.create(actor=user.username, action="auth.login", detail="কমান্ড সেন্টারে প্রবেশ")
            nxt = request.GET.get("next") or "/admin/"
            return redirect(nxt)
    return render(request, "dashboard/login.html", {"form": form})


def logout_view(request):
    if request.user.is_authenticated:
        AuditLog.objects.create(actor=request.user.username, action="auth.logout", detail="লগআউট")
    logout(request)
    return redirect("web:home")


# ---------------------------------------------------------------- overview
@staff_required
@section("situation")
def overview(request):
    cfg = _campaign_settings()
    total_voters = int(cfg.get("unionVoters", 25540))
    turnout = int(cfg.get("turnoutAssumption", 72))
    booths = Booth.objects.all()
    households = Household.objects.all()
    covered = households.exclude(status="unvisited").count()
    committed = households.filter(status="committed").count()
    spend = Expense.objects.aggregate(total=Sum("amount"))["total"] or Decimal(0)
    cap = Decimal(int(cfg.get("spendCap", 1000000)))
    today = timezone.localdate()

    week = [today - dt.timedelta(days=i) for i in range(6, -1, -1)]
    visits_by_day = {
        row["created_at__date"]: row["n"]
        for row in VisitorEvent.objects.filter(created_at__date__gte=week[0])
        .values("created_at__date")
        .annotate(n=Count("id"))
    }
    chart = [{"label": d.strftime("%d/%m"), "value": visits_by_day.get(d, 0)} for d in week]
    chart_max = max([c["value"] for c in chart] + [1])

    ctx = _ctx(
        request,
        "situation",
        "ক্যাম্পেইন সারসংক্ষেপ",
        f"{timezone.localdate():%d/%m/%Y} · ভোটগ্রহণের আগে বাকি {_days_to_poll()} দিন",
        total_voters=total_voters,
        turnout=turnout,
        projected=turnout * total_voters // 100,
        households=households.count(),
        covered=covered,
        coverage_pct=round(covered * 100 / households.count()) if households.count() else 0,
        committed=committed,
        committed_pct=round(committed * 100 / households.count()) if households.count() else 0,
        spend=spend,
        cap=cap,
        spend_pct=min(round(float(spend) * 100 / float(cap)), 100) if cap else 0,
        today_tasks=Task.objects.filter(date=today),
        late_tasks=Task.objects.filter(date__lt=today, done=False)[:6],
        upcoming=services.upcoming_events(4),
        appointments=Appointment.objects.filter(status__in=["pending", "confirmed"])[:5],
        feedback=Feedback.objects.filter(status__in=["new", "reviewing"])[:5],
        challenges=Challenge.objects.exclude(status="resolved")[:4],
        chart=chart,
        chart_max=chart_max,
        wards=Ward.objects.annotate(booth_count=Count("booths")),
        audit=AuditLog.objects.all()[:8],
    )
    return render(request, "dashboard/overview.html", ctx)


# ---------------------------------------------------------------- coverage
@staff_required
@section("coverage")
def coverage(request):
    wards = Ward.objects.annotate(
        booth_count=Count("booths", distinct=True),
        household_count=Count("households", distinct=True),
    )
    booths = Booth.objects.select_related("ward").all()
    households = Household.objects.select_related("booth", "ward").all()
    q = request.GET.get("q", "").strip()
    status = request.GET.get("status", "")
    if q:
        households = households.filter(Q(head__icontains=q) | Q(village__icontains=q) | Q(phone__icontains=q))
    if status:
        households = households.filter(status=status)
    ctx = _ctx(
        request,
        "coverage",
        "ওয়ার্ড ও কভারেজ",
        "ডোর-টু-ডোর কভারেজ, পরিবার ও ভোটকেন্দ্রের চিত্র",
        wards=wards,
        booths=booths,
        households=households[:60],
        total_households=Household.objects.count(),
        q=q,
        status=status,
        statuses=Household.STATUS,
        polygons=[{"no": w.no, "name": w.name, "polygon": w.polygon, "strength": w.strength} for w in wards],
    )
    return render(request, "dashboard/coverage.html", ctx)


# -------------------------------------------------------------------- plan
@staff_required
@section("plan")
def plan(request):
    if request.method == "POST":
        action = request.POST.get("action", "create")
        if action == "create":
            form = forms.TaskForm(request.POST)
            if form.is_valid():
                task = form.save()
                AuditLog.objects.create(actor=request.user.username, action="task.create", detail=task.title)
                messages.success(request, "কাজ যোগ হয়েছে।")
                return redirect("dashboard:plan")
        elif action == "toggle":
            task = get_object_or_404(Task, pk=request.POST.get("id"))
            task.done = not task.done
            task.save(update_fields=["done"])
            return redirect("dashboard:plan")
        elif action == "delete":
            Task.objects.filter(pk=request.POST.get("id")).delete()
            messages.success(request, "কাজ মুছে ফেলা হয়েছে।")
            return redirect("dashboard:plan")
    else:
        form = forms.TaskForm(initial={"date": timezone.localdate()})
    today = timezone.localdate()
    ctx = _ctx(
        request,
        "plan",
        "দৈনিক পরিকল্পনা",
        "আজকের কাজ, দায়িত্ব ও অগ্রগতি",
        form=form,
        today=today,
        today_tasks=Task.objects.filter(date=today),
        upcoming=Task.objects.filter(date__gt=today).order_by("date")[:20],
        overdue=Task.objects.filter(date__lt=today, done=False),
        done_count=Task.objects.filter(date=today, done=True).count(),
        total_count=Task.objects.filter(date=today).count(),
    )
    return render(request, "dashboard/plan.html", ctx)


# -------------------------------------------------------------------- team
@staff_required
@section("team")
def team(request):
    if request.method == "POST":
        if request.POST.get("action") == "delete":
            TeamMember.objects.filter(pk=request.POST.get("id")).delete()
            messages.success(request, "সদস্য সরানো হয়েছে।")
            return redirect("dashboard:team")
        form = forms.TeamForm(request.POST)
        if form.is_valid():
            member = form.save()
            AuditLog.objects.create(actor=request.user.username, action="team.create", detail=member.name)
            messages.success(request, "সদস্য যোগ হয়েছে।")
            return redirect("dashboard:team")
    else:
        form = forms.TeamForm()
    roles = (
        TeamMember.objects.values("role")
        .annotate(n=Count("id"))
        .order_by("-n")
    )
    ctx = _ctx(
        request,
        "team",
        "দল ও স্বেচ্ছাসেবক",
        f"মোট {TeamMember.objects.count()} জন সদস্য",
        form=form,
        members=TeamMember.objects.select_related("ward"),
        roles=roles,
        wards=Ward.objects.all(),
    )
    return render(request, "dashboard/team.html", ctx)


# -------------------------------------------------------------- challenges
@staff_required
@section("challenges")
def challenges(request):
    if request.method == "POST":
        if request.POST.get("action") == "status":
            row = get_object_or_404(Challenge, pk=request.POST.get("id"))
            row.status = request.POST.get("status", row.status)
            row.save(update_fields=["status", "updated_at"])
            return redirect("dashboard:challenges")
        if request.POST.get("action") == "delete":
            Challenge.objects.filter(pk=request.POST.get("id")).delete()
            return redirect("dashboard:challenges")
        form = forms.ChallengeForm(request.POST)
        if form.is_valid():
            row = form.save()
            AuditLog.objects.create(actor=request.user.username, action="challenge.create", detail=row.title)
            messages.success(request, "চ্যালেঞ্জ যুক্ত হয়েছে।")
            return redirect("dashboard:challenges")
    else:
        form = forms.ChallengeForm()
    ctx = _ctx(
        request,
        "challenges",
        "চ্যালেঞ্জ ও সহায়তা",
        "সমস্যা চিহ্নিত করুন, দায়িত্ব দিন ও সমাধান ট্র্যাক করুন",
        form=form,
        rows=Challenge.objects.select_related("ward"),
        open_count=Challenge.objects.filter(status="open").count(),
        breach_count=Feedback.objects.filter(kind="threat", status="new").count(),
        help_articles=data.help_articles(),
    )
    return render(request, "dashboard/challenges.html", ctx)


# ------------------------------------------------------------------- money
@staff_required
@section("money")
def money(request):
    cfg = _campaign_settings()
    cap = Decimal(int(cfg.get("spendCap", 1000000)))
    if request.method == "POST":
        if request.POST.get("action") == "delete":
            Expense.objects.filter(pk=request.POST.get("id")).delete()
            return redirect("dashboard:money")
        form = forms.ExpenseForm(request.POST)
        if form.is_valid():
            row = form.save()
            AuditLog.objects.create(actor=request.user.username, action="expense.create", detail=f"{row.description} — {row.amount}")
            messages.success(request, "খরচ যোগ হয়েছে।")
            return redirect("dashboard:money")
        messages.error(request, "ফর্মে ভুল আছে — আবার দেখুন।")
    else:
        form = forms.ExpenseForm(initial={"date": timezone.localdate()})
    total = Expense.objects.aggregate(t=Sum("amount"))["t"] or Decimal(0)
    by_cat = Expense.objects.values("category").annotate(t=Sum("amount"), n=Count("id")).order_by("-t")
    cheque_rule = Expense.objects.filter(amount__gte=20000).exclude(mode__in=["cheque", "bank"])
    ctx = _ctx(
        request,
        "money",
        "ব্যয় ট্র্যাকার",
        f"সীমা ৳{cap:,.0f} · এখন পর্যন্ত ৳{total:,.0f}",
        form=form,
        rows=Expense.objects.all(),
        total=total,
        cap=cap,
        pct=min(round(float(total) * 100 / float(cap)), 100) if cap else 0,
        by_cat=by_cat,
        cheque_rule=cheque_rule,
        legal_cap=cap,
    )
    return render(request, "dashboard/money.html", ctx)


# --------------------------------------------------------------------- cms
@staff_required
@section("cms")
def cms(request):
    kind = request.GET.get("kind", "")
    rows = Post.objects.all()
    if kind:
        rows = rows.filter(kind=kind)
    ctx = _ctx(
        request,
        "cms",
        "কনটেন্ট স্টুডিও",
        f"ব্লগ {Post.objects.filter(kind='blog').count()} · সংবাদ {Post.objects.filter(kind='news').count()}",
        rows=rows,
        kind=kind,
        recent_uploads=MediaAsset.objects.all()[:12],
    )
    return render(request, "dashboard/cms.html", ctx)


@staff_required
@section("cms")
def post_edit(request, pk: int | None = None):
    post = get_object_or_404(Post, pk=pk) if pk else None
    if request.method == "POST":
        form = forms.PostForm(request.POST, request.FILES, instance=post)
        if form.is_valid():
            saved = form.save()
            upload = request.FILES.get("cover")
            if upload:
                saved.image = _save_upload(upload, request.user)
                saved.save(update_fields=["image"])
            AuditLog.objects.create(
                actor=request.user.username,
                action="post.update" if pk else "post.create",
                detail=saved.title,
            )
            messages.success(request, "পোস্ট সংরক্ষিত হয়েছে।")
            return redirect("dashboard:cms")
        messages.error(request, "ফর্মে ভুল আছে — নিচে দেখুন।")
    else:
        form = forms.PostForm(instance=post)
    ctx = _ctx(
        request,
        "cms",
        "পোস্ট সম্পাদনা" if pk else "নতুন পোস্ট",
        "রিচ টেক্সট, কভার ছবি ও প্রকাশের অবস্থা",
        form=form,
        post=post,
        preview=render_rich(post.rich) if post and post.rich else "",
        uploads=MediaAsset.objects.filter(content_type__startswith="image")[:12],
    )
    return render(request, "dashboard/post_edit.html", ctx)


@staff_required
@section("cms")
@require_POST
def post_delete(request, pk: int):
    post = get_object_or_404(Post, pk=pk)
    title = post.title
    post.delete()
    AuditLog.objects.create(actor=request.user.username, action="post.delete", detail=title)
    messages.success(request, "পোস্ট মুছে ফেলা হয়েছে।")
    return redirect("dashboard:cms")


# -------------------------------------------------------------- site pages
@staff_required
@section("site")
def site_pages(request):
    page_id = request.GET.get("page") or (data.site_pages()[0]["id"] if data.site_pages() else "home")
    base = next((p for p in data.site_pages() if p["id"] == page_id), None) or {"id": page_id, "label": page_id, "href": "/"}
    row, _ = SitePage.objects.get_or_create(page_id=page_id)
    if request.method == "POST":
        form = forms.SitePageForm(request.POST, instance=row)
        if form.is_valid():
            form.save()
            AuditLog.objects.create(actor=request.user.username, action="site.update", detail=page_id)
            messages.success(request, "সাইট পেজ সংরক্ষিত হয়েছে।")
            return redirect(f"/admin/site/?page={page_id}")
    else:
        form = forms.SitePageForm(instance=row)
    ctx = _ctx(
        request,
        "site",
        "সাইট কনটেন্ট",
        "মেনু/পেজের শিরোনাম, বর্ণনা, ছবি ও দৃশ্যমানতা",
        form=form,
        page=base,
        page_id=page_id,
        page_rows=[services.page_copy(p["id"]) for p in data.site_pages()],
        groups=data.site_page_groups(),
    )
    return render(request, "dashboard/site.html", ctx)


@staff_required
@section("home")
def home_sections(request):
    section_id = request.GET.get("section") or (data.home_sections()[0]["id"] if data.home_sections() else "hero")
    base = next((s for s in data.home_sections() if s["id"] == section_id), {"id": section_id, "label": section_id})
    row, _ = HomeSection.objects.get_or_create(section_id=section_id)
    if request.method == "POST":
        form = forms.HomeSectionForm(request.POST, instance=row)
        if form.is_valid():
            form.save()
            AuditLog.objects.create(actor=request.user.username, action="home.update", detail=section_id)
            messages.success(request, "হোমপেজ সেকশন সংরক্ষিত হয়েছে।")
            return redirect(f"/admin/home/?section={section_id}")
    else:
        form = forms.HomeSectionForm(instance=row)
    ctx = _ctx(
        request,
        "home",
        "হোমপেজ সেকশন",
        "প্রতিটি ব্লকের শিরোনাম ও দৃশ্যমানতা",
        form=form,
        base=base,
        current=section_id,
        section_rows=[services.home_copy(s["id"]) for s in data.home_sections()],
    )
    return render(request, "dashboard/home.html", ctx)


# ----------------------------------------------------------------- gallery
@staff_required
@section("gallery")
def gallery(request):
    tab = request.GET.get("tab", "photos")
    photo_form = forms.PhotoForm(prefix="photo")
    poster_form = forms.PosterForm(prefix="poster")
    video_form = forms.VideoForm(prefix="video")

    if request.method == "POST":
        action = request.POST.get("action", "")
        obj_id = request.POST.get("id")
        if action == "delete":
            model = {"photo": GalleryPhoto, "poster": GalleryPoster, "video": VideoItem}.get(request.POST.get("kind", ""))
            if model:
                model.objects.filter(pk=obj_id).delete()
                messages.success(request, "আইটেম মুছে ফেলা হয়েছে।")
            return redirect(f"/admin/gallery/?tab={tab}")
        if action == "toggle":
            model = {"photo": GalleryPhoto, "poster": GalleryPoster, "video": VideoItem}.get(request.POST.get("kind", ""))
            if model:
                row = get_object_or_404(model, pk=obj_id)
                row.hidden = not row.hidden
                row.save(update_fields=["hidden"])
            return redirect(f"/admin/gallery/?tab={tab}")
        if action == "create_photo":
            photo_form = forms.PhotoForm(request.POST, request.FILES, prefix="photo")
            if photo_form.is_valid():
                obj = photo_form.save()
                _handle_upload(request, photo_form, "upload")
                messages.success(request, "ছবি যোগ হয়েছে।")
                return redirect("/admin/gallery/?tab=photos")
        if action == "create_poster":
            poster_form = forms.PosterForm(request.POST, request.FILES, prefix="poster")
            if poster_form.is_valid():
                obj = poster_form.save()
                _handle_upload(request, poster_form, "upload")
                messages.success(request, "পোস্টার যোগ হয়েছে।")
                return redirect("/admin/gallery/?tab=posters")
        if action == "create_video":
            video_form = forms.VideoForm(request.POST, prefix="video")
            if video_form.is_valid():
                video_form.save()
                messages.success(request, "ভিডিও যোগ হয়েছে।")
                return redirect("/admin/gallery/?tab=videos")

    ctx = _ctx(
        request,
        "gallery",
        "গ্যালারি ছবি, পোস্টার ও ভিডিও",
        "যোগ করুন, ক্যাপশন বদলান, লুকান বা সরান",
        tab=tab,
        photo_form=photo_form,
        poster_form=poster_form,
        video_form=video_form,
        photos=GalleryPhoto.objects.all(),
        posters=GalleryPoster.objects.all(),
        videos=VideoItem.objects.all(),
        counts={
            "photos": GalleryPhoto.objects.count(),
            "posters": GalleryPoster.objects.count(),
            "videos": VideoItem.objects.count(),
            "hidden": GalleryPhoto.objects.filter(hidden=True).count() + GalleryPoster.objects.filter(hidden=True).count(),
        },
    )
    return render(request, "dashboard/gallery.html", ctx)


# ------------------------------------------------------------------- items
@staff_required
@section("items")
def items(request):
    if request.method == "POST":
        kind = request.POST.get("kind")
        obj_id = request.POST.get("id")
        if kind == "event":
            row = get_object_or_404(Event, pk=obj_id)
            form = forms.EventForm(request.POST, instance=row)
            if form.is_valid():
                form.save()
                AuditLog.objects.create(actor=request.user.username, action="event.update", detail=row.title)
                messages.success(request, "ইভেন্ট আপডেট হয়েছে।")
            else:
                messages.error(request, "ইভেন্টের তথ্যে ভুল আছে।")
        elif kind == "pillar":
            row = get_object_or_404(Pillar, pk=obj_id)
            form = forms.PillarForm(request.POST, instance=row)
            if form.is_valid():
                form.save()
                AuditLog.objects.create(actor=request.user.username, action="pillar.update", detail=row.title)
                messages.success(request, "স্তম্ভ আপডেট হয়েছে।")
            else:
                messages.error(request, "স্তম্ভের তথ্যে ভুল আছে।")
        return redirect(f"/admin/items/?tab={'events' if kind == 'event' else 'pillars'}&open={obj_id}")

    tab = request.GET.get("tab", "events")
    ctx = _ctx(
        request,
        "items",
        "ইভেন্ট ও ম্যানিফেস্টো",
        "প্রতিটি ইভেন্ট ও প্রতিটি অঙ্গীকার আলাদাভাবে সম্পাদনা",
        tab=tab,
        events=Event.objects.all(),
        pillars=Pillar.objects.all(),
        event_forms={e.pk: forms.EventForm(instance=e, prefix=f"e{e.pk}") for e in Event.objects.all()},
        pillar_forms={p.pk: forms.PillarForm(instance=p, prefix=f"p{p.pk}") for p in Pillar.objects.all()},
        open_id=request.GET.get("open", ""),
    )
    return render(request, "dashboard/items.html", ctx)


# ------------------------------------------------------------------ ticker
@staff_required
@section("ticker")
def ticker(request):
    settings_row = TickerSettings.load()
    if request.method == "POST":
        action = request.POST.get("action", "")
        if action == "settings":
            form = forms.TickerSettingsForm(request.POST, instance=settings_row)
            if form.is_valid():
                form.save()
                AuditLog.objects.create(
                    actor=request.user.username,
                    action="ticker.settings",
                    detail=f"{'চালু' if settings_row.enabled else 'বন্ধ'} · {settings_row.mode}",
                )
                messages.success(request, "টিকার সেটিংস সংরক্ষিত হয়েছে।")
        elif action == "create":
            form = forms.TickerItemForm(request.POST)
            if form.is_valid():
                if TickerItem.objects.count() >= 30:
                    messages.error(request, "সর্বোচ্চ ৩০টি টিকার লাইন রাখা যায়।")
                else:
                    row = form.save(commit=False)
                    row.position = (TickerItem.objects.order_by("-position").first().position + 1) if TickerItem.objects.exists() else 0
                    row.save()
                    AuditLog.objects.create(actor=request.user.username, action="ticker.create", detail=row.text)
                    messages.success(request, "টিকার লাইন যোগ হয়েছে।")
            else:
                messages.error(request, "লেখা দিতে ভুল হয়েছে।")
        elif action == "delete":
            TickerItem.objects.filter(pk=request.POST.get("id")).delete()
            AuditLog.objects.create(actor=request.user.username, action="ticker.delete", detail=str(request.POST.get("id")))
        elif action == "toggle":
            row = get_object_or_404(TickerItem, pk=request.POST.get("id"))
            row.active = not row.active
            row.save(update_fields=["active"])
        elif action == "move":
            row = get_object_or_404(TickerItem, pk=request.POST.get("id"))
            direction = request.POST.get("direction", "up")
            rows = list(TickerItem.objects.order_by("position", "id"))
            index = next((i for i, r in enumerate(rows) if r.pk == row.pk), -1)
            target = index - 1 if direction == "up" else index + 1
            if 0 <= target < len(rows):
                rows[index], rows[target] = rows[target], rows[index]
                for pos, item in enumerate(rows):
                    TickerItem.objects.filter(pk=item.pk).update(position=pos)
                AuditLog.objects.create(actor=request.user.username, action="ticker.move", detail=f"{row.text[:40]} → {direction}")
        elif action == "reset":
            TickerItem.objects.all().delete()
            TickerSettings.objects.filter(pk=1).update(enabled=True, mode="auto")
            AuditLog.objects.create(actor=request.user.username, action="ticker.reset", detail="ডিফল্টে ফেরানো")
            messages.success(request, "টিকার ডিফল্টে ফেরানো হয়েছে।")
        return redirect("dashboard:ticker")

    ctx = _ctx(
        request,
        "ticker",
        "নিউজ টিকার",
        "হেডারের চলমান খবর — নিজে লিখুন বা অটো রাখুন",
        settings_form=forms.TickerSettingsForm(instance=settings_row),
        item_form=forms.TickerItemForm(),
        settings_row=settings_row,
        rows=TickerItem.objects.all(),
        preview=services.ticker(),
    )
    return render(request, "dashboard/ticker.html", ctx)


# --------------------------------------------------------------------- crm
@staff_required
@section("crm")
def crm(request):
    if request.method == "POST":
        action = request.POST.get("action", "")
        kind = request.POST.get("kind", "")
        obj_id = request.POST.get("id")
        if kind == "appointment":
            row = get_object_or_404(Appointment, pk=obj_id)
            form = forms.AppointmentForm(request.POST, instance=row)
            if form.is_valid():
                form.save()
                messages.success(request, "অ্যাপয়েন্টমেন্ট আপডেট হয়েছে।")
        elif kind == "feedback":
            row = get_object_or_404(Feedback, pk=obj_id)
            form = forms.FeedbackForm(request.POST, instance=row)
            if form.is_valid():
                form.save()
                messages.success(request, "ফিডব্যাক আপডেট হয়েছে।")
        elif kind == "reply":
            convo = get_object_or_404(Conversation, pk=obj_id)
            body = (request.POST.get("body") or "").strip()
            if body:
                Message.objects.create(conversation=convo, sender="team", body=body[:2000], read=True)
                convo.unread = 0
                convo.status = "answered"
                convo.save(update_fields=["unread", "status", "last_at"])
                messages.success(request, "উত্তর পাঠানো হয়েছে।")
        return redirect(f"/admin/crm/?tab={kind or 'appointments'}")

    tab = request.GET.get("tab", "appointments")
    ctx = _ctx(
        request,
        "crm",
        "CRM ও বার্তা",
        "সাক্ষাৎ, অভিযোগ, চ্যাট ও জনমত",
        tab=tab,
        appointments=Appointment.objects.all(),
        feedback=Feedback.objects.all(),
        conversations=Conversation.objects.all(),
        polls=Poll.objects.all(),
        threat_count=Feedback.objects.filter(kind="threat").count(),
        counts={
            "appointments": Appointment.objects.count(),
            "feedback": Feedback.objects.count(),
            "chats": Conversation.objects.count(),
            "threats": Feedback.objects.filter(kind="threat").count(),
        },
    )
    return render(request, "dashboard/crm.html", ctx)


# ------------------------------------------------------------------- media
@staff_required
@section("cms")
def media(request):
    form = forms.MediaUploadForm()
    if request.method == "POST":
        form = forms.MediaUploadForm(request.POST, request.FILES)
        if form.is_valid():
            upload = form.cleaned_data["file"]
            url = _save_upload(upload, request.user)
            messages.success(request, f"আপলোড হয়েছে: {url}")
            return redirect("dashboard:media")
    ctx = _ctx(request, "cms", "মিডিয়া লাইব্রেরি", "আপলোড করা সব ছবি ও ভিডিও", form=form, assets=MediaAsset.objects.all()[:60])
    return render(request, "dashboard/media.html", ctx)


# -------------------------------------------------------------- analytics
@staff_required
@section("analytics")
def analytics(request):
    days = int(request.GET.get("days", 7))
    since = timezone.now() - dt.timedelta(days=days)
    events = VisitorEvent.objects.filter(created_at__gte=since)
    top_pages = events.values("path").annotate(n=Count("id")).order_by("-n")[:12]
    devices = events.values("device").annotate(n=Count("id")).order_by("-n")
    countries = events.values("country").annotate(n=Count("id")).order_by("-n")[:8]
    browsers = events.values("browser").annotate(n=Count("id")).order_by("-n")[:6]
    daily = (
        events.values("created_at__date")
        .annotate(n=Count("id"), uniq=Count("visitor_hash", distinct=True))
        .order_by("created_at__date")
    )
    chart = [{"label": row["created_at__date"].strftime("%d/%m"), "value": row["n"]} for row in daily]
    ctx = _ctx(
        request,
        "analytics",
        "ভিজিটর অ্যানালিটিক্স",
        f"শেষ {days} দিনের পেজ-ভিত্তিক ভিজিট, ডিভাইস ও দেশ",
        days=days,
        total=events.count(),
        unique=events.values("visitor_hash").distinct().count(),
        new_visitors=events.filter(is_new_visitor=True).count(),
        top_pages=top_pages,
        devices=devices,
        countries=countries,
        browsers=browsers,
        chart=chart,
        chart_max=max([c["value"] for c in chart] + [1]),
        recent=events[:40],
    )
    return render(request, "dashboard/analytics.html", ctx)


# ---------------------------------------------------------------- settings
@staff_required
@section("settings")
def settings(request):
    cfg = _campaign_settings()
    if request.method == "POST":
        action = request.POST.get("action", "")
        if action == "campaign":
            updated = dict(cfg)
            for key in ("pollingDate", "rollDate", "nominationDate", "scrutinyDate", "withdrawalDate", "symbolDate", "resultDate"):
                value = request.POST.get(key)
                if value:
                    updated[key] = value
            for key in ("turnoutAssumption", "spendCap", "unionVoters"):
                value = request.POST.get(key)
                if value:
                    try:
                        updated[key] = int(float(value))
                    except ValueError:
                        pass
            Setting.put("campaign", updated)
            AuditLog.objects.create(actor=request.user.username, action="settings.campaign", detail="নির্বাচনী সেটিংস আপডেট")
            messages.success(request, "সেটিংস সংরক্ষিত হয়েছে।")
            return redirect("dashboard:settings")
        if action == "user_create":
            form = forms.NewUserForm(request.POST)
            if form.is_valid():
                user = form.save()
                user.is_staff = True
                user.save(update_fields=["is_staff"])
                AuditLog.objects.create(actor=request.user.username, action="user.create", detail=user.username)
                messages.success(request, "নতুন সদস্য তৈরি হয়েছে।")
            else:
                messages.error(request, "ব্যবহারকারীর তথ্যে ভুল আছে।")
            return redirect("dashboard:settings")
        if action == "user_update":
            user = get_object_or_404(User, pk=request.POST.get("id"))
            user.role = request.POST.get("role", user.role)
            user.is_active = request.POST.get("is_active") == "on"
            user.save(update_fields=["role", "is_active"])
            AuditLog.objects.create(actor=request.user.username, action="user.update", detail=user.username)
            messages.success(request, "সদস্যের ভূমিকা আপডেট হয়েছে।")
            return redirect("dashboard:settings")
        if action == "password":
            form = PasswordChangeForm(request.user, request.POST)
            if form.is_valid():
                user = form.save()
                update_session_auth_hash(request, user)
                AuditLog.objects.create(actor=request.user.username, action="auth.password", detail="পাসওয়ার্ড পরিবর্তন")
                messages.success(request, "পাসওয়ার্ড পরিবর্তন হয়েছে।")
            else:
                messages.error(request, "পাসওয়ার্ড পরিবর্তন করা যায়নি — নিয়মগুলো দেখুন।")
            return redirect("dashboard:settings")

    ctx = _ctx(
        request,
        "settings",
        "সেটিংস ও রিপোর্ট",
        "নির্বাচনী তারিখ, ব্যবহারকারী, অডিট ও রপ্তানি",
        cfg=cfg,
        users=User.objects.all().order_by("username"),
        user_form=forms.NewUserForm(),
        password_form=PasswordChangeForm(request.user),
        audit=AuditLog.objects.all()[:40],
        roles=Role.choices,
        wards=Ward.objects.all(),
        counts={
            "posts": Post.objects.count(),
            "events": Event.objects.count(),
            "appointments": Appointment.objects.count(),
            "feedback": Feedback.objects.count(),
            "visits": VisitorEvent.objects.count(),
        },
    )
    return render(request, "dashboard/settings.html", ctx)


# ------------------------------------------------------------------ export
@staff_required
@section("settings")
def export_csv(request, kind: str):
    """CSV রপ্তানি — অ্যাপয়েন্টমেন্ট, অভিযোগ, খরচ, ভিজিটর।"""
    mapping = {
        "appointments": (
            Appointment.objects.all(),
            ["id", "name", "phone", "ward", "topic", "preferred_date", "slot", "status", "created_at"],
        ),
        "feedback": (
            Feedback.objects.all(),
            ["id", "kind", "name", "phone", "ward", "village", "message", "status", "priority", "created_at"],
        ),
        "expenses": (
            Expense.objects.all(),
            ["id", "date", "category", "description", "amount", "mode", "voucher", "by"],
        ),
        "visitors": (
            VisitorEvent.objects.all()[:5000],
            ["id", "path", "country", "city", "device", "browser", "os", "created_at"],
        ),
        "contacts": (
            TeamMember.objects.all(),
            ["id", "name", "phone", "role", "status", "joined_at"],
        ),
    }
    if kind not in mapping:
        return JsonResponse({"ok": False, "error": "অজানা রপ্তানি ধরন"}, status=404)
    rows, fields = mapping[kind]
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="mdabutaher-{kind}.csv"'
    response.write("\ufeff")  # Excel-এ বাংলা ঠিক দেখানোর জন্য BOM
    writer = csv.writer(response)
    writer.writerow(fields)
    for row in rows:
        writer.writerow([getattr(row, field, "") for field in fields])
    AuditLog.objects.create(actor=request.user.username, action="export.csv", detail=kind)
    return response
