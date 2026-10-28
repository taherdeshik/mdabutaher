"""হেডার/ফুটার/টিকারের শেয়ার্ড কনটেক্সট।"""
from __future__ import annotations

from django.utils import timezone

from content import data, services


def chrome(request) -> dict:
    site = data.site()
    pages = {p["id"]: services.page_copy(p["id"]) for p in data.site_pages()}
    nav = [
        {"label": "হোম", "href": "/", "id": "home"},
        {"label": "পরিচিতি", "href": "/about", "id": "about"},
        {"label": "ম্যানিফেস্টো", "href": "/manifesto", "id": "manifesto"},
        {
            "label": "প্রচারণা",
            "href": "/campaign",
            "id": "campaign",
            "children": [
                {"label": pages["campaign"]["label"] or "প্রচারণা পরিকল্পনা", "href": "/campaign", "desc": "ধাপ, এলাকা ও সময়সূচি"},
                {"label": "আসন্ন ইভেন্ট", "href": "/events", "desc": "জনসভা, উঠান বৈঠক, মিছিল"},
                {"label": "স্বেচ্ছাসেবক", "href": "/campaign#volunteer", "desc": "আমাদের সাথে যোগ দিন"},
            ],
        },
        {
            "label": "জনসেবা",
            "href": "/appointment",
            "id": "appointment",
            "children": [
                {"label": "অ্যাপয়েন্টমেন্ট", "href": "/appointment", "desc": "সাক্ষাতের সময় বুক করুন"},
                {"label": "সমস্যা ও পরামর্শ", "href": "/feedback", "desc": "অভিযোগ, মতামত ও হুমকি রিপোর্ট"},
                {"label": "জনমত জরিপ", "href": "/polls", "desc": "ভোট দিন, ফলাফল দেখুন"},
                {"label": "লাইভ চ্যাট", "href": "/chat", "desc": "২৪/৭ সহায়তা ও বার্তা"},
            ],
        },
        {
            "label": "মিডিয়া",
            "href": "/news",
            "id": "news",
            "children": [
                {"label": "সংবাদ", "href": "/news", "desc": "পত্রপত্রিকায় প্রকাশিত খবর"},
                {"label": "ব্লগ", "href": "/blog", "desc": "লেখা, ভাবনা ও পরিকল্পনা"},
                {"label": "গ্যালারি", "href": "/gallery/photos", "desc": "ছবি, পোস্টার ও ভিডিও"},
                {"label": "মিডিয়া কিট", "href": "/media-kit", "desc": "সাংবাদিকদের জন্য তথ্য"},
            ],
        },
        {"label": "যোগাযোগ", "href": "/contact", "id": "contact"},
    ]
    nav_visible = [
        item
        for item in nav
        if pages.get(item["id"], {}).get("visible", True)
    ]
    return {
        "site": site,
        "nav": nav_visible,
        "pages": pages,
        "ticker": services.ticker(),
        "next_event": services.next_event(),
        "year": timezone.localdate().year,
        "today": timezone.localdate(),
        "is_staff_user": getattr(request, "user", None) is not None
        and request.user.is_authenticated
        and (request.user.is_staff or request.user.is_superuser),
    }
