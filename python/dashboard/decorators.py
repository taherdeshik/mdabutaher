from __future__ import annotations

from functools import wraps

from django.contrib import messages
from django.shortcuts import redirect


def staff_required(view):
    """লগইন + স্টাফ + সেকশন-ভিত্তিক অনুমতি।"""

    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(f"/admin/login/?next={request.path}")
        if not (request.user.is_staff or request.user.is_superuser):
            messages.error(request, "এই অংশে ঢোকার অনুমতি নেই।")
            return redirect("/")
        section = getattr(view, "section", "")
        if section and not request.user.can(section):
            messages.error(request, "আপনার ভূমিকায় এই অংশে ঢোকার অনুমতি নেই।")
            return redirect("/admin/")
        return view(request, *args, **kwargs)

    return wrapper


def section(name: str):
    def apply(view):
        view.section = name
        return view

    return apply
