"""Import the data document of the old Next.js site into the Django models.

Usage:
    python manage.py import_legacy path/to/db.json [--dry-run]

Reads the JSON file that the Next.js app kept in `data/db.json` (or the single row
of the `civic_store` MySQL table, exported to a file). Records are matched by their
original id/phone/email, so re-running the import does not create duplicates.
"""

import json
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_date, parse_datetime

from civic.models import (
    Appointment,
    EventRegistration,
    Feedback,
    FeedbackTimeline,
    Lead,
    Message,
    PollVote,
    Subscriber,
    VisitorEvent,
    Volunteer,
)


def _with_id(defaults: dict, row: dict) -> dict:
    """Keep the legacy id when present; otherwise let the model generate one."""
    if row.get("id"):
        defaults["id"] = row["id"]
    return defaults


def _dt(value):
    if not value:
        return None
    parsed = parse_datetime(value) if isinstance(value, str) else None
    if parsed is None and isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
    return parsed


class Command(BaseCommand):
    help = "Import the legacy Next.js JSON data document into Django models."

    def add_arguments(self, parser):
        parser.add_argument("path", type=str)
        parser.add_argument(
            "--dry-run", action="store_true", help="Count records without writing."
        )

    def handle(self, *args, **opts):
        path = Path(opts["path"])
        if not path.exists():
            raise CommandError(f"File not found: {path}")
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Not valid JSON: {exc}") from exc

        counts = {}
        with transaction.atomic():
            counts["appointments"] = self._appointments(doc.get("appointments", []))
            counts["feedback"] = self._feedback(doc.get("feedback", []))
            counts["messages"] = self._messages(doc.get("messages", []))
            counts["subscribers"] = self._subscribers(doc.get("subscribers", []))
            counts["registrations"] = self._registrations(doc.get("registrations", []))
            counts["volunteers"] = self._volunteers(doc.get("volunteers", []))
            counts["leads"] = self._leads(doc.get("leads", []))
            counts["pollVotes"] = self._poll_votes(doc.get("pollVotes", []))
            counts["visitorEvents"] = self._visitors(doc.get("visitorEvents", []))
            if opts["dry_run"]:
                transaction.set_rollback(True)

        for key, value in counts.items():
            self.stdout.write(f"{key}: {value}")
        if opts["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry run: nothing was written."))
        else:
            self.stdout.write(self.style.SUCCESS("Import finished."))
        self.stdout.write(
            "Dashboard users are not imported (password hashes use a different format). "
            "Create them with the owner account or the /admin/users page."
        )

    # ----------------------------------------------------------------- helpers
    def _appointments(self, rows):
        n = 0
        for r in rows:
            date = parse_date(str(r.get("date", ""))[:10])
            if not date or not r.get("reference"):
                continue
            Appointment.objects.update_or_create(
                reference=r["reference"],
                defaults={
                    "id": r.get("id") or f"APT-{r['reference']}",
                    "name": r.get("name", "")[:80],
                    "phone": r.get("phone", "")[:20],
                    "email": r.get("email") or "",
                    "type": r.get("type", "other")[:40],
                    "date": date,
                    "slot": r.get("slot", "10:00")[:5],
                    "mode": r.get("mode", "in-person"),
                    "ward": str(r.get("ward", ""))[:8],
                    "topic": r.get("topic", "")[:160],
                    "notes": r.get("notes") or "",
                    "status": r.get("status", "pending"),
                },
            )
            n += 1
        return n

    def _feedback(self, rows):
        n = 0
        for r in rows:
            tracking = r.get("trackingId")
            if not tracking:
                continue
            item, _ = Feedback.objects.update_or_create(
                tracking_id=tracking,
                defaults={
                    "id": r.get("id") or f"FB-{tracking}",
                    "kind": r.get("kind", "problem"),
                    "category": r.get("category", "অন্যান্য")[:60],
                    "title": r.get("title", "")[:140],
                    "details": r.get("details", ""),
                    "ward": str(r.get("ward", ""))[:8],
                    "location": (r.get("location") or "")[:160],
                    "severity": r.get("severity", "medium"),
                    "name": (r.get("name") or "")[:80],
                    "phone": (r.get("phone") or "")[:20],
                    "anonymous": bool(r.get("anonymous", False)),
                    "photo": r.get("photo") or "",
                    "status": r.get("status", "new"),
                    "supports": int(r.get("supports", 0) or 0),
                },
            )
            if not item.timeline.exists():
                for t in r.get("timeline", []) or []:
                    FeedbackTimeline.objects.create(
                        feedback=item,
                        note=str(t.get("note", ""))[:300],
                        by=str(t.get("by", "সিস্টেম"))[:80],
                    )
            n += 1
        return n

    def _messages(self, rows):
        n = 0
        for r in rows:
            mid = r.get("id")
            if not mid or Message.objects.filter(pk=mid).exists():
                continue
            Message.objects.create(
                id=mid,
                channel=r.get("channel", "contact"),
                name=(r.get("name") or "")[:80],
                phone=(r.get("phone") or "")[:20],
                email=r.get("email") or "",
                text=r.get("text", ""),
                read=bool(r.get("read", False)),
            )
            n += 1
        return n

    def _subscribers(self, rows):
        n = 0
        for r in rows:
            email = (r.get("email") or "").lower()
            if email:
                Subscriber.objects.get_or_create(email=email, defaults=_with_id({}, r))
                n += 1
        return n

    def _registrations(self, rows):
        n = 0
        for r in rows:
            if not r.get("eventId") or not r.get("phone"):
                continue
            EventRegistration.objects.get_or_create(
                event_id=r["eventId"],
                phone=r["phone"],
                name=r.get("name", "")[:80],
                defaults=_with_id(
                    {
                        "ward": str(r.get("ward", ""))[:8],
                        "guests": int(r.get("guests", 0) or 0),
                    },
                    r,
                ),
            )
            n += 1
        return n

    def _volunteers(self, rows):
        n = 0
        for r in rows:
            if not r.get("phone"):
                continue
            Volunteer.objects.get_or_create(
                phone=r["phone"],
                name=r.get("name", "")[:80],
                defaults=_with_id(
                    {
                        "ward": str(r.get("ward", ""))[:8],
                        "role": (r.get("role") or "")[:80],
                        "availability": (r.get("availability") or "")[:80],
                    },
                    r,
                ),
            )
            n += 1
        return n

    def _leads(self, rows):
        n = 0
        for r in rows:
            phone = r.get("phone")
            if not phone:
                continue
            Lead.objects.update_or_create(
                phone=phone[:255],
                defaults=_with_id(
                    {
                        "name": (r.get("name") or "")[:80],
                        "ward": str(r.get("ward", ""))[:8],
                        "source": r.get("source", "contact"),
                        "stage": r.get("stage", "new"),
                        "tags": r.get("tags") or [],
                        "note": (r.get("note") or "")[:300],
                    },
                    r,
                ),
            )
            n += 1
        return n

    def _poll_votes(self, rows):
        n = 0
        for r in rows:
            fp = r.get("fingerprint")
            if (
                not fp
                or PollVote.objects.filter(
                    poll_id=r.get("pollId", ""), fingerprint=fp
                ).exists()
            ):
                continue
            PollVote.objects.create(
                poll_id=r.get("pollId", ""),
                option_id=r.get("optionId", ""),
                fingerprint=fp,
            )
            n += 1
        return n

    def _visitors(self, rows):
        n = 0
        for r in rows:
            ts = _dt(r.get("ts"))
            if ts is None:
                continue
            if r.get("id") and VisitorEvent.objects.filter(pk=r["id"]).exists():
                continue
            VisitorEvent.objects.create(
                **({"id": r["id"]} if r.get("id") else {}),
                session=str(r.get("session", ""))[:64] or "legacy",
                path=str(r.get("path", "/"))[:200],
                title=(r.get("title") or "")[:140],
                ts=ts,
                referrer=(r.get("referrer") or "")[:300],
                device=r.get("device", "desktop"),
                browser=(r.get("browser") or "")[:40],
                os=(r.get("os") or "")[:40],
                lang=(r.get("lang") or "")[:20],
                tz=(r.get("tz") or "")[:60],
                country=(r.get("country") or "")[:4],
                region=(r.get("region") or "")[:80],
                city=(r.get("city") or "")[:80],
            )
            n += 1
        return n
