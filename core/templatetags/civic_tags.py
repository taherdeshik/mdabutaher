from django import template
from django.utils.safestring import mark_safe

from core import content

register = template.Library()

_BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")


@register.filter
def bn(value):
    """Render numbers with Bengali digits (UI layer only; data stays ASCII)."""
    if value is None:
        return ""
    return str(value).translate(_BN_DIGITS)


@register.filter
def bn_num(value):
    """Group thousands the way the UI does (১২,৫০০) and use Bengali digits."""
    try:
        number = int(value)
    except (TypeError, ValueError):
        return bn(value)
    return f"{number:,}".translate(_BN_DIGITS)


@register.simple_tag
def image(key):
    return content.image_for(key) or ""


@register.filter
def initial(name):
    return (str(name or "").strip()[:1]) or "ক"


@register.filter
def bn_date(iso_date):
    """'2026-10-22' → '২২ অক্টোবর ২০২৬' (Bengali month names)."""
    months = [
        "জানুয়ারি",
        "ফেব্রুয়ারি",
        "মার্চ",
        "এপ্রিল",
        "মে",
        "জুন",
        "জুলাই",
        "আগস্ট",
        "সেপ্টেম্বর",
        "অক্টোবর",
        "নভেম্বর",
        "ডিসেম্বর",
    ]
    try:
        year, month, day = str(iso_date)[:10].split("-")
        return mark_safe(f"{bn(int(day))} {months[int(month) - 1]} {bn(year)}")
    except (ValueError, IndexError):
        return str(iso_date)


@register.filter
def dict_get(mapping, key):
    if not mapping:
        return None
    return mapping.get(key)
