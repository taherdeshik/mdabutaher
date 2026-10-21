"""Authenticated JSON API for the dashboard (port of `src/app/api/admin/*`)."""

import csv
import json
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.sessions.models import Session
from django.db import transaction
from django.http import HttpRequest, HttpResponse
from django.utils import timezone

from civic.api import appointment_json, feedback_public_json
from civic.http import fail, limit, ok, parse_json
from civic.models import (
    Appointment,
    EventRegistration,
    Feedback,
    FeedbackTimeline,
    Lead,
    Message,
    Subscriber,
    VisitorEvent,
    Volunteer,
)
from core import content

from . import analytics
from .auth import api_admin
from .models import AdminProfile, AuditLog

Role = AdminProfile.Role
OWNER_ONLY = (Role.OWNER,)
OWNER_OR_MANAGER = (Role.OWNER, Role.MANAGER)


def _actor_name(request: HttpRequest) -> str:
    return request.actor.username


def _audit(request: HttpRequest, action: str, detail: str) -> None:
    AuditLog.record(_actor_name(request), action, detail)


# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------


@limit("login", max_requests=10)
def auth_login(request: HttpRequest):
    if request.method != "POST":
        return fail("এই পদ্ধতি অনুমোদিত নয়", 405)
    body = parse_json(request)
    if body is None:
        return fail("অবৈধ অনুরোধ", 400)
    username = str(body.get("username") or "").strip().lower()
    password = str(body.get("password") or "")
    user = authenticate(request, username=username, password=password)
    if user is None or not AdminProfile.objects.filter(user=user).exists():
        return fail("ইউজারনেম বা পাসওয়ার্ড সঠিক নয়", 401)
    login(request, user)
    return ok({"user": _me(user)})


def _me(user) -> dict:
    profile = AdminProfile.objects.get(user=user)
    return {
        "username": user.get_username(),
        "name": user.get_full_name() or user.get_username(),
        "role": profile.role,
        "wardId": profile.ward_id or None,
        "lastLoginAt": user.last_login.isoformat() if user.last_login else None,
    }


def auth_logout(request: HttpRequest):
    if request.method != "POST":
        return fail("এই পদ্ধতি অনুমোদিত নয়", 405)
    logout(request)
    return ok({"loggedOut": True})


@api_admin()
def auth_me(request: HttpRequest):
    actor = request.actor
    if actor.user is None:  # legacy ADMIN_KEY session
        return ok(
            {
                "user": {
                    "username": actor.username,
                    "name": actor.name,
                    "role": actor.role,
                    "wardId": None,
                }
            }
        )
    return ok({"user": _me(actor.user)})


# --------------------------------------------------------------------------
# Overview (CRM)
# --------------------------------------------------------------------------


def build_overview() -> dict:
    """CRM snapshot shared by the JSON API and the server-rendered dashboard."""
    event_titles = {e["id"]: e["title"] for e in content.events()}
    feedback = Feedback.objects.prefetch_related("timeline")[:200]
    regs = EventRegistration.objects.all()[:200]
    data = {
        "counts": {
            "appointments": Appointment.objects.count(),
            "feedback": Feedback.objects.count(),
            "leads": Lead.objects.count(),
            "messages": Message.objects.count(),
            "volunteers": Volunteer.objects.count(),
            "registrations": EventRegistration.objects.count(),
            "subscribers": Subscriber.objects.count(),
            "unreadMessages": Message.objects.filter(read=False).count(),
        },
        "appointments": [appointment_json(a) for a in Appointment.objects.all()[:200]],
        "feedback": [feedback_public_json(f) for f in feedback],
        "leads": [
            {
                "id": l.id,
                "name": l.name,
                "phone": l.phone,
                "ward": l.ward,
                "source": l.source,
                "stage": l.stage,
                "tags": l.tags,
                "note": l.note or None,
                "createdAt": l.created_at.isoformat(),
                "updatedAt": l.updated_at.isoformat(),
            }
            for l in Lead.objects.all()[:300]
        ],
        "messages": [
            {
                "id": m.id,
                "channel": m.channel,
                "name": m.name or None,
                "phone": m.phone or None,
                "email": m.email or None,
                "text": m.text,
                "read": m.read,
                "createdAt": m.created_at.isoformat(),
            }
            for m in Message.objects.all()[:100]
        ],
        "volunteers": [
            {
                "id": v.id,
                "name": v.name,
                "phone": v.phone,
                "ward": v.ward,
                "role": v.role,
                "availability": v.availability,
                "createdAt": v.created_at.isoformat(),
            }
            for v in Volunteer.objects.all()[:200]
        ],
        "registrations": [
            {
                "id": r.id,
                "eventId": r.event_id,
                "eventTitle": event_titles.get(r.event_id, r.event_id),
                "name": r.name,
                "phone": r.phone,
                "ward": r.ward,
                "guests": r.guests,
                "createdAt": r.created_at.isoformat(),
            }
            for r in regs
        ],
        "subscribers": [
            {"id": s.id, "email": s.email, "createdAt": s.created_at.isoformat()}
            for s in Subscriber.objects.all()[:200]
        ],
        "audit": [
            {
                "id": str(a.id),
                "at": a.at.isoformat(),
                "actor": a.actor,
                "action": a.action,
                "detail": a.detail,
            }
            for a in AuditLog.objects.all()[:50]
        ],
    }
    return data


@api_admin()
def overview(request: HttpRequest):
    return ok(build_overview())


def _json_or_fail(request: HttpRequest):
    body = parse_json(request)
    if body is None:
        return None, fail("অবৈধ অনুরোধ", 400)
    return body, None


@api_admin(roles=OWNER_OR_MANAGER + (Role.CAPTAIN,))
def appointment_update(request: HttpRequest, pk: str):
    if request.method != "PATCH":
        return fail("এই পদ্ধতি অনুমোদিত নয়", 405)
    body, err = _json_or_fail(request)
    if err:
        return err
    try:
        appt = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return fail("অ্যাপয়েন্টমেন্ট পাওয়া যায়নি", 404)
    status = body.get("status")
    if status not in Appointment.Status.values:
        return fail("স্ট্যাটাস সঠিক নয়", 422)
    appt.status = status
    appt.save(update_fields=["status"])
    _audit(request, "appointment.status", f"{appt.reference} → {status}")
    return ok(appointment_json(appt))


@api_admin(roles=OWNER_OR_MANAGER + (Role.CAPTAIN,))
def feedback_update(request: HttpRequest, pk: str):
    if request.method != "PATCH":
        return fail("এই পদ্ধতি অনুমোদিত নয়", 405)
    body, err = _json_or_fail(request)
    if err:
        return err
    try:
        item = Feedback.objects.get(pk=pk)
    except Feedback.DoesNotExist:
        return fail("রিপোর্ট পাওয়া যায়নি", 404)
    status = body.get("status")
    note = str(body.get("note") or "").strip()[:300]
    if status is not None and status not in Feedback.Status.values:
        return fail("স্ট্যাটাস সঠিক নয়", 422)
    with transaction.atomic():
        if status and status != item.status:
            item.status = status
            item.save(update_fields=["status", "updated_at"])
            FeedbackTimeline.objects.create(
                feedback=item,
                note=f"স্ট্যাটাস: {Feedback.Status(status).label}",
                by=request.actor.name,
            )
            _audit(request, "feedback.status", f"{item.tracking_id} → {status}")
        if note:
            FeedbackTimeline.objects.create(
                feedback=item, note=note, by=request.actor.name
            )
            _audit(request, "feedback.note", item.tracking_id)
    item.refresh_from_db()
    return ok(feedback_public_json(item))


@api_admin(roles=OWNER_OR_MANAGER + (Role.CAPTAIN,))
def lead_update(request: HttpRequest, pk: str):
    if request.method != "PATCH":
        return fail("এই পদ্ধতি অনুমোদিত নয়", 405)
    body, err = _json_or_fail(request)
    if err:
        return err
    try:
        lead = Lead.objects.get(pk=pk)
    except Lead.DoesNotExist:
        return fail("লিড পাওয়া যায়নি", 404)
    if "stage" in body:
        if body["stage"] not in Lead.Stage.values:
            return fail("স্টেজ সঠিক নয়", 422)
        lead.stage = body["stage"]
    if "note" in body:
        lead.note = str(body.get("note") or "")[:300]
    if "tags" in body and isinstance(body["tags"], list):
        lead.tags = [str(t)[:40] for t in body["tags"][:12]]
    lead.save()
    _audit(request, "lead.update", lead.phone)
    return ok(
        {
            "id": lead.id,
            "stage": lead.stage,
            "note": lead.note or None,
            "tags": lead.tags,
        }
    )


@api_admin(roles=OWNER_OR_MANAGER + (Role.CAPTAIN,))
def message_update(request: HttpRequest, pk: str):
    if request.method != "PATCH":
        return fail("এই পদ্ধতি অনুমোদিত নয়", 405)
    body, err = _json_or_fail(request)
    if err:
        return err
    read = bool(body.get("read", True))
    updated = Message.objects.filter(pk=pk).update(read=read)
    if not updated:
        return fail("বার্তা পাওয়া যায়নি", 404)
    return ok({"id": pk, "read": read})


# --------------------------------------------------------------------------
# Export & backup
# --------------------------------------------------------------------------

EXPORTS = {
    "appointments": (
        Appointment.objects.all,
        [
            "reference",
            "name",
            "phone",
            "email",
            "type",
            "date",
            "slot",
            "mode",
            "ward",
            "topic",
            "status",
            "created_at",
        ],
    ),
    "feedback": (
        Feedback.objects.all,
        [
            "tracking_id",
            "kind",
            "category",
            "title",
            "ward",
            "severity",
            "status",
            "supports",
            "name",
            "phone",
            "created_at",
        ],
    ),
    "leads": (
        Lead.objects.all,
        ["name", "phone", "ward", "source", "stage", "note", "created_at"],
    ),
    "volunteers": (
        Volunteer.objects.all,
        ["name", "phone", "ward", "role", "availability", "created_at"],
    ),
    "messages": (
        Message.objects.all,
        ["channel", "name", "phone", "email", "text", "read", "created_at"],
    ),
    "subscribers": (Subscriber.objects.all, ["email", "created_at"]),
    "registrations": (
        EventRegistration.objects.all,
        ["event_id", "name", "phone", "ward", "guests", "created_at"],
    ),
}


@api_admin(roles=OWNER_OR_MANAGER)
def export_csv(request: HttpRequest):
    kind = request.GET.get("type", "")
    if kind not in EXPORTS:
        return fail("রপ্তানির ধরন সঠিক নয়", 400)
    factory, columns = EXPORTS[kind]
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = (
        f'attachment; filename="{kind}-{timezone.localdate().isoformat()}.csv"'
    )
    response.write("\ufeff")  # Excel-friendly UTF-8 BOM for Bengali text
    writer = csv.writer(response)
    writer.writerow(columns)
    for obj in factory():
        row = []
        for col in columns:
            value = getattr(obj, col)
            row.append(value.isoformat() if hasattr(value, "isoformat") else value)
        writer.writerow(row)
    return response


@api_admin(roles=OWNER_ONLY)
def backup(request: HttpRequest):
    User = get_user_model()
    payload = {
        "exportedAt": timezone.now().isoformat(),
        "appointments": [appointment_json(a) for a in Appointment.objects.all()],
        "feedback": [
            feedback_public_json(f)
            for f in Feedback.objects.prefetch_related("timeline")
        ],
        "messages": [
            {
                "id": m.id,
                "channel": m.channel,
                "name": m.name,
                "phone": m.phone,
                "email": m.email,
                "text": m.text,
                "read": m.read,
                "createdAt": m.created_at.isoformat(),
            }
            for m in Message.objects.all()
        ],
        "subscribers": [
            {"email": s.email, "createdAt": s.created_at.isoformat()}
            for s in Subscriber.objects.all()
        ],
        "registrations": [
            {
                "eventId": r.event_id,
                "name": r.name,
                "phone": r.phone,
                "ward": r.ward,
                "guests": r.guests,
                "createdAt": r.created_at.isoformat(),
            }
            for r in EventRegistration.objects.all()
        ],
        "volunteers": [
            {
                "name": v.name,
                "phone": v.phone,
                "ward": v.ward,
                "role": v.role,
                "availability": v.availability,
                "createdAt": v.created_at.isoformat(),
            }
            for v in Volunteer.objects.all()
        ],
        "leads": [
            {
                "name": l.name,
                "phone": l.phone,
                "ward": l.ward,
                "source": l.source,
                "stage": l.stage,
                "tags": l.tags,
                "note": l.note,
                "createdAt": l.created_at.isoformat(),
            }
            for l in Lead.objects.all()
        ],
        "users": [
            {
                "username": u.get_username(),
                "name": u.get_full_name(),
                "role": u.profile.role,
                "wardId": u.profile.ward_id,
                "active": u.is_active,
                "lastLoginAt": u.last_login.isoformat() if u.last_login else None,
            }
            for u in User.objects.filter(profile__isnull=False)
        ],
    }
    _audit(request, "backup.download", "JSON backup")
    response = HttpResponse(
        json.dumps(payload, ensure_ascii=False, indent=2),
        content_type="application/json; charset=utf-8",
    )
    response["Content-Disposition"] = (
        f'attachment; filename="mahadan-backup-{timezone.localdate().isoformat()}.json"'
    )
    return response


# --------------------------------------------------------------------------
# Analytics & system
# --------------------------------------------------------------------------


@api_admin(roles=OWNER_OR_MANAGER)
def analytics_get(request: HttpRequest):
    try:
        days = int(request.GET.get("days", "7"))
    except ValueError:
        days = 7
    return ok(analytics.build(days))


@api_admin()
def system_get(request: HttpRequest):
    engine = settings.DATABASES["default"]["ENGINE"]
    sessions_active = Session.objects.filter(expire_date__gt=timezone.now()).count()
    return ok(
        {
            "storage": "mysql" if "mysql" in engine else "sqlite",
            "time": timezone.now().isoformat(),
            "sessionsActive": sessions_active,
            "auditEntries": AuditLog.objects.count(),
            "visitorEvents": VisitorEvent.objects.filter(
                ts__gte=timezone.now() - timedelta(days=90)
            ).count(),
            "debug": settings.DEBUG,
        }
    )


# --------------------------------------------------------------------------
# Users (owner only)
# --------------------------------------------------------------------------


def _user_json(user) -> dict:
    profile = AdminProfile.objects.get(user=user)
    return {
        "id": user.pk,
        "name": user.get_full_name() or user.get_username(),
        "username": user.get_username(),
        "role": profile.role,
        "wardId": profile.ward_id or None,
        "active": user.is_active,
        "lastLoginAt": user.last_login.isoformat() if user.last_login else None,
    }


@api_admin(roles=OWNER_ONLY)
def users_collection(request: HttpRequest):
    User = get_user_model()
    if request.method == "GET":
        return ok(
            {
                "users": [
                    _user_json(u)
                    for u in User.objects.filter(profile__isnull=False).select_related(
                        "profile"
                    )
                ]
            }
        )
    if request.method != "POST":
        return fail("এই পদ্ধতি অনুমোদিত নয়", 405)

    body, err = _json_or_fail(request)
    if err:
        return err
    username = str(body.get("username") or "").strip().lower()
    password = str(body.get("password") or "")
    role = body.get("role") or Role.CAPTAIN
    if len(username) < 3:
        return fail("ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে", 422)
    if len(password) < 8:
        return fail("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে", 422)
    if role not in Role.values:
        return fail("ভূমিকা সঠিক নয়", 422)
    if User.objects.filter(username=username).exists():
        return fail("এই ইউজারনেম আগে থেকেই আছে", 409)
    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=str(body.get("name") or username)[:150],
    )
    AdminProfile.objects.create(
        user=user, role=role, ward_id=str(body.get("wardId") or "")[:8]
    )
    _audit(request, "user.create", f"{username} ({role})")
    return ok(_user_json(user), 201)


@api_admin(roles=OWNER_ONLY)
def user_detail(request: HttpRequest, pk: int):
    User = get_user_model()
    try:
        user = User.objects.select_related("profile").get(pk=pk, profile__isnull=False)
    except User.DoesNotExist:
        return fail("ব্যবহারকারী পাওয়া যায়নি", 404)

    if request.method == "DELETE":
        if user.pk == request.actor.user.pk:
            return fail("নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না", 409)
        username = user.get_username()
        user.delete()
        _audit(request, "user.delete", username)
        return ok({"deleted": True})

    if request.method != "PATCH":
        return fail("এই পদ্ধতি অনুমোদিত নয়", 405)
    body, err = _json_or_fail(request)
    if err:
        return err

    profile = user.profile
    if "name" in body:
        user.first_name = str(body["name"])[:150]
    if "role" in body:
        if body["role"] not in Role.values:
            return fail("ভূমিকা সঠিক নয়", 422)
        if user.pk == request.actor.user.pk and body["role"] != Role.OWNER:
            return fail("নিজের ভূমিকা বদলানো যাবে না", 409)
        profile.role = body["role"]
    if "wardId" in body:
        profile.ward_id = str(body.get("wardId") or "")[:8]
    if "active" in body:
        if user.pk == request.actor.user.pk and not body["active"]:
            return fail("নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না", 409)
        user.is_active = bool(body["active"])
    if body.get("password"):
        if len(str(body["password"])) < 8:
            return fail("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে", 422)
        user.set_password(str(body["password"]))
    user.save()
    profile.save()
    _audit(request, "user.update", user.get_username())
    return ok(_user_json(user))
