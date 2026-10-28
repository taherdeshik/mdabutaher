"""টেমপ্লেট ফিল্টার/ট্যাগ — বাংলা সংখ্যা, তারিখ, ছবির পাথ।"""
from __future__ import annotations

import re

from django import template
from django.utils.safestring import mark_safe

from content import data
from content.bn import bn, bn_date, bn_date_short, bn_month, bn_datetime, bn_weekday, pct
from content.richtext import render_rich

register = template.Library()

register.filter("bn", bn)
register.filter("bn_month", bn_month)
register.filter("bn_date", bn_date)
register.filter("bn_date_short", bn_date_short)
register.filter("bn_datetime", bn_datetime)
register.filter("bn_weekday", bn_weekday)
register.filter("pct", pct)


@register.filter
def bdt(value) -> str:
    """১০,০০,০০০ → ৳১০,০০,০০০"""
    try:
        return f"৳{int(float(value)):,}".translate(str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯"))
    except (TypeError, ValueError):
        return f"৳{value}"


@register.filter
def image(value) -> str:
    return data.image_for(value)


@register.filter
def rich(value) -> str:
    return mark_safe(render_rich(value or ""))


@register.filter
def initials(value: str) -> str:
    parts = (value or "").split()
    return "".join(p[0] for p in parts[:2]) if parts else "?"


@register.filter
def get_item(mapping, key):
    if hasattr(mapping, "get"):
        return mapping.get(key)
    return None


@register.simple_tag(takes_context=True)
def query_replace(context, **kwargs):
    """বর্তমান query string-এ নির্দিষ্ট কী বদলে URL তৈরি করে (পেজিনেশন/ফিল্টার)।"""
    request = context["request"]
    params = request.GET.copy()
    for key, value in kwargs.items():
        if value in (None, ""):
            params.pop(key, None)
        else:
            params[key] = value
    encoded = params.urlencode()
    return f"?{encoded}" if encoded else "?"


@register.filter
def youtube_thumb(video_id: str) -> str:
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"


@register.filter
def youtube_embed(video_id: str) -> str:
    return f"https://www.youtube-nocookie.com/embed/{video_id}"


@register.filter
def strip_tags(value: str) -> str:
    return re.sub(r"<[^>]+>", "", value or "")


@register.filter
def human_size(value) -> str:
    try:
        size = int(value)
    except (TypeError, ValueError):
        return ""
    for unit in ("B", "KB", "MB"):
        if size < 1024:
            return f"{bn(size)} {unit}"
        size //= 1024
    return f"{bn(size)} GB"
