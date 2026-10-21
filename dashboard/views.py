"""Server-rendered dashboard pages (login, CRM, analytics, users)."""

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods, require_POST

from civic.http import rate_limited

from . import analytics
from .api import build_overview
from .auth import actor_for
from .models import AdminProfile


def _allowed(request, roles):
    actor = actor_for(request)
    return actor is not None and actor.can(roles)


@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.method == "POST":
        allowed, retry = rate_limited(request, "dashboard-login", limit=10, window=300)
        if not allowed:
            messages.error(
                request, f"অনেকবার চেষ্টা হয়েছে। {retry} সেকেন্ড পরে আবার চেষ্টা করুন।"
            )
            return render(request, "dashboard/login.html", status=429)
        username = request.POST.get("username", "").strip().lower()
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is not None and AdminProfile.objects.filter(user=user).exists():
            login(request, user)
            return redirect(request.GET.get("next") or "dashboard:home")
        messages.error(request, "ইউজারনেম বা পাসওয়ার্ড সঠিক নয়")
    return render(request, "dashboard/login.html")


@require_POST
def logout_view(request):
    logout(request)
    return redirect("dashboard:login")


@login_required(login_url="dashboard:login")
def home(request):
    if not _allowed(
        request,
        (AdminProfile.Role.OWNER, AdminProfile.Role.MANAGER, AdminProfile.Role.CAPTAIN),
    ):
        messages.error(request, "এই পাতায় প্রবেশের অনুমতি নেই।")
        return redirect("dashboard:login")
    data = build_overview()
    return render(
        request,
        "dashboard/home.html",
        {
            "data": data,
            "statuses": {
                "appointment": [
                    ("pending", "অপেক্ষমাণ"),
                    ("confirmed", "নিশ্চিত"),
                    ("completed", "সম্পন্ন"),
                    ("cancelled", "বাতিল"),
                ],
                "feedback": [
                    ("new", "নতুন"),
                    ("reviewing", "পর্যালোচনায়"),
                    ("in-progress", "কাজ চলছে"),
                    ("resolved", "সমাধান"),
                ],
                "lead": [
                    ("new", "নতুন"),
                    ("contacted", "যোগাযোগ হয়েছে"),
                    ("engaged", "সক্রিয়"),
                    ("supporter", "সমর্থক"),
                ],
            },
            "exports": [
                "appointments",
                "feedback",
                "leads",
                "volunteers",
                "messages",
                "subscribers",
                "registrations",
            ],
        },
    )


@login_required(login_url="dashboard:login")
def analytics_page(request):
    if not _allowed(request, (AdminProfile.Role.OWNER, AdminProfile.Role.MANAGER)):
        return redirect("dashboard:home")
    try:
        days = int(request.GET.get("days", "7"))
    except ValueError:
        days = 7
    bundle = analytics.build(days)
    return render(
        request, "dashboard/analytics.html", {"a": bundle, "ranges": [7, 30, 90]}
    )


@login_required(login_url="dashboard:login")
def users_page(request):
    if not _allowed(request, (AdminProfile.Role.OWNER,)):
        return redirect("dashboard:home")
    from django.contrib.auth import get_user_model

    users = (
        get_user_model()
        .objects.filter(profile__isnull=False)
        .select_related("profile")
        .order_by("username")
    )
    return render(
        request,
        "dashboard/users.html",
        {
            "users": users,
            "roles": AdminProfile.Role.choices,
        },
    )
