"""Public JSON API — the Django port of the original `src/app/api/*` routes.

Every write endpoint follows the same contract as before:
rate limit → parse → validate → business rules → persist → `{ok, data}`.
"""

import re
from datetime import datetime
from urllib.parse import unquote

from django.conf import settings
from django.db import transaction
from django.db.models import Count, F, Sum
from django.http import HttpRequest, HttpResponse
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from core import content
from core.db import storage_label

from . import forms as f
from .constants import APPOINTMENT_SLOTS, APPOINTMENT_TYPES, SLOT_CAPACITY, WARDS
from .http import fail, limit, ok, parse_json
from .leads import push_lead
from .models import (
    Appointment,
    EventRegistration,
    Feedback,
    FeedbackTimeline,
    Message,
    PollVote,
    Subscriber,
    VisitorEvent,
    Volunteer,
    make_id,
    tracking_code,
)

PHONE_TAIL = 11
PUBLIC_FEEDBACK_LIMIT = 60
MAX_PHOTO_BYTES = 1_500_000


def _tail(phone: str) -> str:
    return phone[-PHONE_TAIL:]


def _iso(value) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


# --------------------------------------------------------------------------
# Serializers
# --------------------------------------------------------------------------


def appointment_json(a: Appointment) -> dict:
    return {
        "id": a.id,
        "reference": a.reference,
        "name": a.name,
        "phone": a.phone,
        "email": a.email or None,
        "type": a.type,
        "date": a.date.isoformat(),
        "slot": a.slot,
        "mode": a.mode,
        "ward": a.ward,
        "topic": a.topic,
        "notes": a.notes or None,
        "status": a.status,
        "createdAt": _iso(a.created_at),
    }


def feedback_public_json(item: Feedback) -> dict:
    return {
        "id": item.id,
        "trackingId": item.tracking_id,
        "kind": item.kind,
        "category": item.category,
        "title": item.title,
        "details": item.details,
        "ward": item.ward,
        "location": item.location or None,
        "severity": item.severity,
        "name": item.name or "নাম প্রকাশে অনিচ্ছুক",
        "status": item.status,
        "supports": item.supports,
        "createdAt": _iso(item.created_at),
        "updatedAt": _iso(item.updated_at),
        "timeline": [
            {"at": _iso(t.at), "note": t.note, "by": t.by} for t in item.timeline.all()
        ],
    }


def event_seats_for(event: dict) -> tuple[int, int]:
    """(registered, seats left) combining the seeded count and live registrations."""
    live = sum(r.seats for r in EventRegistration.objects.filter(event_id=event["id"]))
    registered = event["registered"] + live
    return registered, max(0, event["capacity"] - event["registered"] - live)


# --------------------------------------------------------------------------
# Appointments
# --------------------------------------------------------------------------


@require_GET
def appointments_get(request: HttpRequest):
    day = request.GET.get("date")
    phone = request.GET.get("phone")

    if day:
        taken: dict[str, int] = {}
        for row in (
            Appointment.objects.filter(date=day)
            .exclude(status=Appointment.Status.CANCELLED)
            .values("slot")
            .annotate(n=Count("id"))
        ):
            taken[row["slot"]] = row["n"]
        return ok(
            {
                "date": day,
                "slots": [
                    {
                        "slot": s,
                        "taken": taken.get(s, 0),
                        "available": taken.get(s, 0) < SLOT_CAPACITY,
                    }
                    for s in APPOINTMENT_SLOTS
                ],
            }
        )

    if phone:
        if not f.PHONE_RE.match(phone):
            return fail("সঠিক মোবাইল নম্বর দিন", 422)
        mine = Appointment.objects.filter(phone__endswith=_tail(phone))
        return ok({"appointments": [appointment_json(a) for a in mine]})

    return fail("phone অথবা date প্যারামিটার প্রয়োজন", 400)


@require_POST
@limit("appointment", max_requests=5)
def appointments_post(request: HttpRequest):
    body = parse_json(request)
    if body is None:
        return fail("অবৈধ অনুরোধ", 400)

    form = f.AppointmentForm(body)
    if not form.is_valid():
        return fail("ফর্মে ত্রুটি আছে", 422, form.flat_errors())
    data = form.cleaned_data

    today = timezone.localdate()
    if data["date"] < today:
        return fail("অতীত তারিখে অ্যাপয়েন্টমেন্ট নেওয়া যায় না", 422)
    # Python: Monday=0 … Friday=4. The original blocks Friday (JS getDay()==5).
    if data["date"].weekday() == 4 and data["mode"] == "in-person":
        return fail("শুক্রবার শুধু পূর্বনির্ধারিত সাক্ষাৎ — অন্য দিন বেছে নিন", 422)

    with transaction.atomic():
        # Lock the day's rows so two bookings cannot race into the same slot.
        booked = (
            Appointment.objects.select_for_update()
            .filter(date=data["date"], slot=data["slot"])
            .exclude(status=Appointment.Status.CANCELLED)
            .count()
        )
        if booked >= SLOT_CAPACITY:
            return fail("এই সময়টি পূর্ণ — অন্য সময় বেছে নিন", 409)

        appointment = Appointment.objects.create(
            reference=tracking_code(),
            name=data["name"],
            phone=data["phone"],
            email=data.get("email") or "",
            type=data["type"],
            date=data["date"],
            slot=data["slot"],
            mode=data["mode"],
            ward=data["ward"],
            topic=data["topic"],
            notes=data.get("notes") or "",
        )
        push_lead(
            name=data["name"],
            phone=data["phone"],
            ward=data["ward"],
            source="appointment",
            note=data["topic"],
        )

    return ok(
        {
            "appointment": appointment_json(appointment),
            "message": f"অ্যাপয়েন্টমেন্ট অনুরোধ গৃহীত। রেফারেন্স: {appointment.reference}। ২৪ ঘণ্টার মধ্যে নিশ্চিতকরণ পাবেন।",
        },
        201,
    )


@require_GET
def appointment_types_get(request: HttpRequest):
    return ok({"types": APPOINTMENT_TYPES, "slots": APPOINTMENT_SLOTS, "wards": WARDS})


# --------------------------------------------------------------------------
# Feedback (problems, advice, threat reports)
# --------------------------------------------------------------------------


@require_GET
def feedback_get(request: HttpRequest):
    mine = request.GET.get("phone")
    if mine:
        items = Feedback.objects.filter(phone__endswith=_tail(mine)).prefetch_related(
            "timeline"
        )
        return ok({"items": [feedback_public_json(i) for i in items], "isMine": True})

    kind = request.GET.get("kind")
    ward = request.GET.get("ward")
    qs = Feedback.objects.filter(anonymous=False).exclude(kind=Feedback.Kind.THREAT)
    if kind:
        qs = qs.filter(kind=kind)
    if ward and ward != "all":
        qs = qs.filter(ward=ward)
    visible = qs.prefetch_related("timeline").order_by("-created_at")[
        :PUBLIC_FEEDBACK_LIMIT
    ]

    all_items = Feedback.objects.all()
    total = all_items.count()
    avg = all_items.aggregate(s=Sum("supports"))["s"] or 0
    stats = {
        "total": total,
        "resolved": all_items.filter(status=Feedback.Status.RESOLVED).count(),
        "inProgress": all_items.filter(
            status__in=[Feedback.Status.IN_PROGRESS, Feedback.Status.REVIEWING]
        ).count(),
        "threats": all_items.filter(kind=Feedback.Kind.THREAT).count(),
        "avgSupport": round(avg / total) if total else 0,
    }
    return ok({"items": [feedback_public_json(i) for i in visible], "stats": stats})


@require_POST
@limit("feedback", max_requests=6)
def feedback_post(request: HttpRequest):
    body = parse_json(request)
    if body is None:
        return fail("অবৈধ অনুরোধ", 400)

    form = f.FeedbackForm(body)
    if not form.is_valid():
        return fail("ফর্মে ত্রুটি আছে", 422, form.flat_errors())
    data = form.cleaned_data

    if len(data.get("photo") or "") > MAX_PHOTO_BYTES:
        return fail("ছবির আকার অনেক বড় (সর্বোচ্চ ১.৫ MB)", 413)
    if not data["anonymous"] and not data.get("phone"):
        return fail("যোগাযোগের জন্য মোবাইল নম্বর দিন অথবা নাম গোপন রাখুন", 422)

    kind = data["kind"]
    with transaction.atomic():
        item = Feedback.objects.create(
            tracking_id=tracking_code(),
            kind=kind,
            category=data["category"],
            title=data["title"],
            details=data["details"],
            ward=data["ward"],
            location=data.get("location") or "",
            severity=data["severity"],
            name="" if data["anonymous"] else (data.get("name") or ""),
            phone="" if data["anonymous"] else (data.get("phone") or ""),
            anonymous=data["anonymous"],
            photo=data.get("photo") or "",
            status=Feedback.Status.REVIEWING
            if kind == Feedback.Kind.THREAT
            else Feedback.Status.NEW,
        )
        FeedbackTimeline.objects.create(
            feedback=item,
            note=(
                "হুমকি রিপোর্ট গ্রহণ করা হয়েছে — দায়িত্বপ্রাপ্ত দল দ্রুত পর্যালোচনা করবে।"
                if kind == Feedback.Kind.THREAT
                else "রিপোর্ট গ্রহণ করা হয়েছে এবং সংশ্লিষ্ট ওয়ার্ড সমন্বয়কের কাছে পাঠানো হয়েছে।"
            ),
            by="সিস্টেম",
        )
        if not data["anonymous"] and data.get("phone"):
            push_lead(
                name=data.get("name") or "অভিযোগকারী",
                phone=data["phone"],
                ward=data["ward"],
                source="feedback",
                note=data["title"],
            )

    if kind == Feedback.Kind.THREAT:
        message = (
            f"হুমকি রিপোর্ট গৃহীত। ট্র্যাকিং আইডি: {item.tracking_id}। জরুরি হলে ৯৯৯ কল করুন।"
        )
    else:
        message = f"ধন্যবাদ! আপনার রিপোর্ট গৃহীত হয়েছে। ট্র্যাকিং আইডি: {item.tracking_id}"
    return ok(
        {
            "item": {
                "id": item.id,
                "trackingId": item.tracking_id,
                "status": item.status,
            },
            "message": message,
        },
        201,
    )


@require_POST
@limit("support", max_requests=20)
def feedback_support(request: HttpRequest, feedback_id: str):
    updated = Feedback.objects.filter(id=feedback_id).update(supports=F("supports") + 1)
    if not updated:
        return fail("রিপোর্টটি পাওয়া যায়নি", 404)
    item = Feedback.objects.get(id=feedback_id)
    return ok({"id": item.id, "supports": item.supports})


# --------------------------------------------------------------------------
# Polls
# --------------------------------------------------------------------------


def poll_payload(poll: dict) -> dict:
    counts = {
        row["option_id"]: row["n"]
        for row in PollVote.objects.filter(poll_id=poll["id"])
        .values("option_id")
        .annotate(n=Count("id"))
    }
    options = [
        {**o, "votes": o["votes"] + counts.get(o["id"], 0)} for o in poll["options"]
    ]
    return {**poll, "options": options, "totalVotes": sum(o["votes"] for o in options)}


@require_GET
def polls_get(request: HttpRequest):
    return ok({"polls": [poll_payload(p) for p in content.polls()]})


@require_POST
@limit("vote", max_requests=12)
def poll_vote(request: HttpRequest, poll_id: str):
    poll = content.find_poll(poll_id)
    if poll is None:
        return fail("জরিপটি পাওয়া যায়নি", 404)
    if poll["status"] == "closed":
        return fail("এই জরিপটি বন্ধ হয়েছে", 409)

    body = parse_json(request)
    if body is None:
        return fail("অবৈধ অনুরোধ", 400)
    form = f.VoteForm(body)
    if not form.is_valid():
        return fail("অবৈধ ভোট", 422, form.flat_errors())
    data = form.cleaned_data
    if not any(o["id"] == data["optionId"] for o in poll["options"]):
        return fail("বিকল্পটি সঠিক নয়", 422)

    previous = PollVote.objects.filter(
        poll_id=poll_id, fingerprint=data["fingerprint"]
    ).first()
    if previous:
        return fail(
            "আপনি ইতিমধ্যে এই জরিপে ভোট দিয়েছেন", 409, {"optionId": previous.option_id}
        )

    PollVote.objects.create(
        poll_id=poll_id, option_id=data["optionId"], fingerprint=data["fingerprint"]
    )
    return ok({"message": "ভোট গ্রহণ করা হয়েছে। অংশগ্রহণের জন্য ধন্যবাদ!"}, 201)


# --------------------------------------------------------------------------
# Events
# --------------------------------------------------------------------------


@require_GET
def event_seats(request: HttpRequest, event_id: str):
    event = content.find_event(event_id)
    if event is None:
        return fail("ইভেন্ট পাওয়া যায়নি", 404)
    registered, left = event_seats_for(event)
    return ok(
        {"registered": registered, "capacity": event["capacity"], "seatsLeft": left}
    )


@require_POST
@limit("event-reg", max_requests=10)
def event_register(request: HttpRequest, event_id: str):
    event = content.find_event(event_id)
    if event is None:
        return fail("ইভেন্ট পাওয়া যায়নি", 404)
    if event["status"] == "past":
        return fail("এই ইভেন্টটি সম্পন্ন হয়েছে", 409)

    body = parse_json(request)
    if body is None:
        return fail("অবৈধ অনুরোধ", 400)
    form = f.EventRegistrationForm(body)
    if not form.is_valid():
        return fail("ফর্মে ত্রুটি আছে", 422, form.flat_errors())
    data = form.cleaned_data

    with transaction.atomic():
        registered, _ = event_seats_for(event)
        seats_needed = 1 + data["guests"]
        # `registered` already includes the seeded count, so compare the total.
        if registered + seats_needed > event["capacity"]:
            return fail("দুঃখিত, এই ইভেন্টের আসন পূর্ণ হয়েছে", 409)
        reg = EventRegistration.objects.create(
            event_id=event_id,
            name=data["name"],
            phone=data["phone"],
            ward=data["ward"],
            guests=data["guests"],
        )
        push_lead(
            name=data["name"],
            phone=data["phone"],
            ward=data["ward"],
            source="event",
            note=event["title"],
        )

    return ok(
        {
            "registration": {"id": reg.id, "eventId": event_id, "guests": reg.guests},
            "message": "রেজিস্ট্রেশন সফল! ইভেন্টের আগে এসএমএসে মনে করিয়ে দেওয়া হবে।",
        },
        201,
    )


@require_GET
def events_calendar(request: HttpRequest):
    """ICS export of all upcoming campaign events (Asia/Dhaka)."""

    def stamp(day: str, clock: str) -> str:
        return f"{day.replace('-', '')}T{clock.replace(':', '')}00"

    def esc(text: str) -> str:
        return (
            text.replace("\\", "\\\\")
            .replace(";", "\\;")
            .replace(",", "\\,")
            .replace("\n", "\\n")
        )

    now = timezone.now().strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Md Abu Taher Campaign//BN",
        "CALSCALE:GREGORIAN",
        "X-WR-CALNAME:মহাদান প্রচারণা ২০২৭",
        "X-WR-TIMEZONE:Asia/Dhaka",
    ]
    for e in content.events():
        if e["status"] == "past":
            continue
        lines += [
            "BEGIN:VEVENT",
            f"UID:{e['id']}@mdabutaher.com",
            f"DTSTAMP:{now}",
            f"DTSTART;TZID=Asia/Dhaka:{stamp(e['date'], e['start'])}",
            f"DTEND;TZID=Asia/Dhaka:{stamp(e['date'], e['end'])}",
            f"SUMMARY:{esc(e['title'])}",
            f"LOCATION:{esc(e['venue'])}",
            f"DESCRIPTION:{esc(e['description'] + chr(10) + 'ওয়ার্ড: ' + e['ward'] + chr(10) + 'বিস্তারিত: ' + settings.SITE_URL + '/events')}",
            "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    response = HttpResponse(
        "\r\n".join(lines), content_type="text/calendar; charset=utf-8"
    )
    response["Content-Disposition"] = 'attachment; filename="mahadan-campaign-2027.ics"'
    return response


# --------------------------------------------------------------------------
# Volunteers, contact, newsletter, chat
# --------------------------------------------------------------------------


@require_POST
@limit("volunteer", max_requests=5)
def volunteers_post(request: HttpRequest):
    body = parse_json(request)
    if body is None:
        return fail("অবৈধ অনুরোধ", 400)
    form = f.VolunteerForm(body)
    if not form.is_valid():
        return fail("ফর্মে ত্রুটি আছে", 422, form.flat_errors())
    data = form.cleaned_data
    with transaction.atomic():
        Volunteer.objects.create(
            name=data["name"],
            phone=data["phone"],
            ward=data["ward"],
            role=data["role"],
            availability=data["availability"],
        )
        push_lead(
            name=data["name"],
            phone=data["phone"],
            ward=data["ward"],
            source="volunteer",
            note=data["role"],
        )
    return ok({"message": "স্বাগতম! আপনার ওয়ার্ড সমন্বয়ক ৪৮ ঘণ্টার মধ্যে যোগাযোগ করবেন।"}, 201)


@require_POST
@limit("contact", max_requests=5)
def contact_post(request: HttpRequest):
    body = parse_json(request)
    if body is None:
        return fail("অবৈধ অনুরোধ", 400)
    form = f.ContactForm(body)
    if not form.is_valid():
        return fail("ফর্মে ত্রুটি আছে", 422, form.flat_errors())
    data = form.cleaned_data
    with transaction.atomic():
        Message.objects.create(
            channel=Message.Channel.CONTACT,
            name=data["name"],
            phone=data.get("phone") or "",
            email=data.get("email") or "",
            text=f"[{data['subject']}] {data['message']}",
        )
        if data.get("phone"):
            push_lead(
                name=data["name"],
                phone=data["phone"],
                ward="সব",
                source="contact",
                note=data["subject"],
            )
    return ok({"message": "বার্তা পাঠানো হয়েছে। ২৪–৪৮ ঘণ্টার মধ্যে উত্তর দেওয়া হবে।"}, 201)


@require_POST
@limit("newsletter", max_requests=6)
def newsletter_post(request: HttpRequest):
    body = parse_json(request)
    if body is None:
        return fail("অবৈধ অনুরোধ", 400)
    form = f.NewsletterForm(body)
    if not form.is_valid():
        return fail("সঠিক ইমেইল দিন", 422, form.flat_errors())
    email = form.cleaned_data["email"].lower()
    with transaction.atomic():
        exists = Subscriber.objects.filter(email=email).exists()
        if not exists:
            Subscriber.objects.create(email=email)
            push_lead(
                name=email.split("@")[0],
                phone=f"sub-{email}",
                ward="সব",
                source="newsletter",
                note="নিউজলেটার সাবস্ক্রাইবার",
            )
    msg = "আপনি আগে থেকেই সাবস্ক্রাইব করেছেন।" if exists else "সাবস্ক্রিপশন সফল হয়েছে।"
    return ok({"message": msg}, 201)


@require_POST
@limit("chat", max_requests=25)
def chat_post(request: HttpRequest):
    body = parse_json(request)
    if body is None:
        return fail("বার্তা সঠিক নয়", 422)
    form = f.ChatForm(body)
    if not form.is_valid():
        return fail("বার্তা সঠিক নয়", 422, form.flat_errors())
    data = form.cleaned_data
    Message.objects.create(
        channel=Message.Channel.WEB_CHAT,
        name=data.get("name") or "",
        phone=data.get("phone") or "",
        text=data["message"],
    )
    return ok({"received": True}, 201)


# --------------------------------------------------------------------------
# Public stats, health, visitor tracking
# --------------------------------------------------------------------------


@require_GET
def stats_get(request: HttpRequest):
    poll_base = sum(o["votes"] for p in content.polls() for o in p["options"])
    return ok(
        {
            "appointments": Appointment.objects.count(),
            "feedback": Feedback.objects.count(),
            "resolved": Feedback.objects.filter(
                status=Feedback.Status.RESOLVED
            ).count(),
            "volunteers": Volunteer.objects.count(),
            "pollVotes": poll_base + PollVote.objects.count(),
            "subscribers": Subscriber.objects.count(),
        }
    )


@require_GET
def health_get(request: HttpRequest):
    response = ok(
        {
            "service": "mdabutaher",
            "storage": storage_label(),
            "time": timezone.now().isoformat(),
        }
    )
    response["Cache-Control"] = "no-store"
    return response


BOT_UA = (
    "bot",
    "crawler",
    "spider",
    "crawl",
    "preview",
    "headless",
    "monitor",
    "curl",
    "wget",
)


def _parse_ua(ua: str) -> tuple[str, str, str]:
    low = ua.lower()
    if "ipad" in low or "tablet" in low or "playbook" in low or "silk" in low:
        device = "tablet"
    elif "mobi" in low or "android" in low or "iphone" in low or "ipod" in low:
        device = "mobile"
    else:
        device = "desktop"

    if "windows nt" in low:
        os_name = "Windows"
    elif "android" in low:
        os_name = "Android"
    elif "iphone" in low or "ipad" in low or "ipod" in low:
        os_name = "iOS"
    elif "mac os x" in low:
        os_name = "macOS"
    elif "cros" in low:
        os_name = "ChromeOS"
    elif "linux" in low:
        os_name = "Linux"
    else:
        os_name = "অন্যান্য"

    if "edg/" in low:
        browser = "Edge"
    elif "opr/" in low or "opera" in low:
        browser = "Opera"
    elif "samsungbrowser" in low:
        browser = "Samsung Internet"
    elif "chrome/" in low:
        browser = "Chrome"
    elif "firefox/" in low:
        browser = "Firefox"
    elif "safari/" in low:
        browser = "Safari"
    else:
        browser = "অন্যান্য"
    return device, browser, os_name


_TZ_COUNTRY = {
    "Asia/Dhaka": "BD",
    "Asia/Kolkata": "IN",
    "Asia/Calcutta": "IN",
    "Asia/Karachi": "PK",
    "Asia/Dubai": "AE",
    "Asia/Riyadh": "SA",
    "Asia/Kuala_Lumpur": "MY",
    "Asia/Singapore": "SG",
    "Asia/Qatar": "QA",
    "Asia/Kuwait": "KW",
    "Europe/London": "GB",
    "America/New_York": "US",
    "America/Chicago": "US",
    "America/Los_Angeles": "US",
}


def _header_value(request: HttpRequest, names) -> str:
    for name in names:
        raw = request.META.get(name)
        if raw:
            return unquote(raw)
    return ""


@require_POST
@limit("track", max_requests=120)
def track_post(request: HttpRequest):
    body = parse_json(request)
    if body is None:
        return fail("অনুরোধ পড়া যায়নি", 400)

    path = str(body.get("path") or "")[:200].split("?")[0]
    if not path.startswith("/"):
        return fail("পাথ ঠিক নয়", 400)
    if path.startswith(("/admin", "/api", "/static", "/login")):
        return HttpResponse(status=204)

    ua = request.META.get("HTTP_USER_AGENT", "")
    if not ua or any(b in ua.lower() for b in BOT_UA):
        return HttpResponse(status=204)

    device, browser, os_name = _parse_ua(ua)
    tz = str(body.get("tz") or "")[:60]
    country = _header_value(request, settings.GEO_COUNTRY_HEADERS) or _TZ_COUNTRY.get(
        tz, ""
    )
    city = _header_value(request, settings.GEO_CITY_HEADERS)
    region = _header_value(request, settings.GEO_REGION_HEADERS)

    session = str(body.get("session") or "")[:64]
    if not re.fullmatch(r"[A-Za-z0-9-]{8,64}", session):
        session = make_id("SES")

    VisitorEvent.objects.create(
        session=session,
        path=path,
        title=str(body.get("title") or "")[:140],
        ts=timezone.now(),
        referrer=str(body.get("referrer") or "")[:300],
        device=device,
        browser=browser,
        os=os_name,
        lang=str(body.get("lang") or "")[:20],
        tz=tz,
        country=country[:4],
        region=region[:80],
        city=city[:80],
    )
    return HttpResponse(status=204)
