"""বাংলা সংখ্যা ও তারিখ ফরম্যাটিং হেল্পার।"""
from __future__ import annotations

import datetime as dt

BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")
MONTHS = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
]
MONTHS_SHORT = [
    "জানু", "ফেব", "মার্চ", "এপ্রি", "মে", "জুন",
    "জুলা", "আগ", "সেপ", "অক্টো", "নভে", "ডিসে",
]
WEEKDAYS = ["সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার", "রবিবার"]


def bn(value) -> str:
    """1234 → ১২৩৪ (কমা/দশমিক অটুট থাকে)।"""
    if value is None:
        return ""
    return str(value).translate(BN_DIGITS)


def bn_month(value) -> str:
    """1234 → ১,২৩৪ (হাজার আলাদা করে)।"""
    try:
        return f"{int(value):,}".translate(BN_DIGITS)
    except (TypeError, ValueError):
        return str(value)


def bn_date(value, short: bool = False) -> str:
    if isinstance(value, str):
        try:
            value = dt.date.fromisoformat(value[:10])
        except ValueError:
            return value
    if not value:
        return ""
    months = MONTHS_SHORT if short else MONTHS
    return f"{bn(value.day)} {months[value.month - 1]}, {bn(value.year)}"


def bn_date_short(value) -> str:
    return bn_date(value, short=True)


def bn_datetime(value) -> str:
    if not value:
        return ""
    local = value
    return f"{bn_date(local)} · {bn(local.strftime('%H:%M'))}"


def bn_weekday(value) -> str:
    if isinstance(value, str):
        try:
            value = dt.date.fromisoformat(value[:10])
        except ValueError:
            return ""
    return WEEKDAYS[value.weekday()]


def pct(part, whole, digits: int = 0) -> str:
    try:
        part, whole = float(part), float(whole)
        if not whole:
            return bn("0")
        return bn(f"{(part / whole) * 100:.{digits}f}")
    except (TypeError, ValueError):
        return bn("0")
