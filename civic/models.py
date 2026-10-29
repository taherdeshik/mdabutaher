"""Persistent civic data (replaces the Next.js JSON/MySQL document store).

Every model maps 1:1 to a collection from the original `src/lib/store.ts`:
appointments, feedback (+ timeline), messages, subscribers, event
registrations, volunteers, leads, poll votes, visitor events and audit log.
Admin users use Django's auth system plus `dashboard.AdminProfile`.
"""

from django.db import models


def make_id(prefix: str) -> str:
    import secrets
    import time

    stamp = format(int(time.time() * 1000), "X")
    return f"{prefix}-{stamp}-{secrets.token_hex(3).upper()}"


def tracking_code() -> str:
    import secrets

    return f"MAT-{secrets.token_hex(3).upper()}"


def id_field(prefix: str) -> models.CharField:
    """Primary key generated on instantiation, e.g. APT-LX2K3-9F1A2B."""
    from functools import partial

    return models.CharField(
        max_length=40,
        primary_key=True,
        default=partial(make_id, prefix),
        editable=False,
    )


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "অপেক্ষমাণ"
        CONFIRMED = "confirmed", "নিশ্চিত"
        COMPLETED = "completed", "সম্পন্ন"
        CANCELLED = "cancelled", "বাতিল"

    class Mode(models.TextChoices):
        IN_PERSON = "in-person", "সরাসরি"
        PHONE = "phone", "ফোনে"
        HOME_VISIT = "home-visit", "বাড়িতে"

    id = id_field("APT")
    reference = models.CharField(max_length=16, unique=True, default=tracking_code)
    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(blank=True)
    type = models.CharField(max_length=40)
    date = models.DateField(db_index=True)
    slot = models.CharField(max_length=5)
    mode = models.CharField(max_length=20, choices=Mode.choices)
    ward = models.CharField(max_length=8)
    topic = models.CharField(max_length=160)
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} · {self.name}"


class Feedback(models.Model):
    class Kind(models.TextChoices):
        PROBLEM = "problem", "সমস্যা"
        ADVICE = "advice", "পরামর্শ"
        THREAT = "threat", "হুমকি"

    class Status(models.TextChoices):
        NEW = "new", "নতুন"
        REVIEWING = "reviewing", "পর্যালোচনায়"
        IN_PROGRESS = "in-progress", "কাজ চলছে"
        RESOLVED = "resolved", "সমাধান"

    class Severity(models.TextChoices):
        LOW = "low", "কম"
        MEDIUM = "medium", "মাঝারি"
        HIGH = "high", "উচ্চ"
        CRITICAL = "critical", "জরুরি"

    id = id_field("FB")
    tracking_id = models.CharField(max_length=16, unique=True, default=tracking_code)
    kind = models.CharField(max_length=10, choices=Kind.choices)
    category = models.CharField(max_length=60)
    title = models.CharField(max_length=140)
    details = models.TextField()
    ward = models.CharField(max_length=8)
    location = models.CharField(max_length=160, blank=True)
    severity = models.CharField(max_length=10, choices=Severity.choices)
    name = models.CharField(max_length=80, blank=True)
    phone = models.CharField(max_length=20, blank=True, db_index=True)
    anonymous = models.BooleanField(default=False)
    # Data URL uploaded from the form (max 1.5 MB, enforced in the API).
    photo = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.NEW)
    supports = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "feedback"

    def __str__(self):
        return f"{self.tracking_id} · {self.title}"


class FeedbackTimeline(models.Model):
    feedback = models.ForeignKey(
        Feedback, related_name="timeline", on_delete=models.CASCADE
    )
    at = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=300)
    by = models.CharField(max_length=80, default="সিস্টেম")

    class Meta:
        ordering = ["at"]


class Message(models.Model):
    class Channel(models.TextChoices):
        WEB_CHAT = "web-chat", "ওয়েব চ্যাট"
        CONTACT = "contact", "যোগাযোগ ফর্ম"
        WHATSAPP = "whatsapp", "হোয়াটসঅ্যাপ"

    id = id_field("MSG")
    channel = models.CharField(max_length=12, choices=Channel.choices)
    name = models.CharField(max_length=80, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    text = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]


class Subscriber(models.Model):
    id = id_field("SUB")
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class EventRegistration(models.Model):
    id = id_field("REG")
    event_id = models.CharField(max_length=80, db_index=True)
    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=20)
    ward = models.CharField(max_length=8)
    guests = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def seats(self) -> int:
        return 1 + self.guests


class Volunteer(models.Model):
    id = id_field("VOL")
    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=20)
    ward = models.CharField(max_length=8)
    role = models.CharField(max_length=80)
    availability = models.CharField(max_length=80)
    created_at = models.DateTimeField(auto_now_add=True)


class Lead(models.Model):
    class Source(models.TextChoices):
        APPOINTMENT = "appointment", "অ্যাপয়েন্টমেন্ট"
        FEEDBACK = "feedback", "অভিযোগ"
        EVENT = "event", "ইভেন্ট"
        VOLUNTEER = "volunteer", "স্বেচ্ছাসেবক"
        NEWSLETTER = "newsletter", "নিউজলেটার"
        CONTACT = "contact", "যোগাযোগ"
        CHAT = "chat", "চ্যাট"

    class Stage(models.TextChoices):
        NEW = "new", "নতুন"
        CONTACTED = "contacted", "যোগাযোগ হয়েছে"
        ENGAGED = "engaged", "সক্রিয়"
        SUPPORTER = "supporter", "সমর্থক"

    id = id_field("LEAD")
    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=255, unique=True)
    ward = models.CharField(max_length=8)
    source = models.CharField(max_length=12, choices=Source.choices)
    stage = models.CharField(max_length=12, choices=Stage.choices, default=Stage.NEW)
    tags = models.JSONField(default=list, blank=True)
    note = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]


class PollVote(models.Model):
    poll_id = models.CharField(max_length=80)
    option_id = models.CharField(max_length=80)
    fingerprint = models.CharField(max_length=80)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["poll_id", "fingerprint"], name="unique_vote_per_poll"
            ),
        ]


class VisitorEvent(models.Model):
    """Anonymous page view. No cookies, no raw IP stored."""

    class Device(models.TextChoices):
        MOBILE = "mobile", "মোবাইল"
        TABLET = "tablet", "ট্যাবলেট"
        DESKTOP = "desktop", "ডেস্কটপ"

    id = id_field("VIS")
    session = models.CharField(max_length=64, db_index=True)
    path = models.CharField(max_length=200, db_index=True)
    title = models.CharField(max_length=140, blank=True)
    ts = models.DateTimeField(db_index=True)
    referrer = models.CharField(max_length=300, blank=True)
    device = models.CharField(max_length=10, choices=Device.choices)
    browser = models.CharField(max_length=40)
    os = models.CharField(max_length=40)
    lang = models.CharField(max_length=20, blank=True)
    tz = models.CharField(max_length=60, blank=True)
    country = models.CharField(max_length=4, blank=True)
    region = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=80, blank=True)

    class Meta:
        ordering = ["-ts"]


class AuditEntry(models.Model):
    id = id_field("AUD")
    at = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.CharField(max_length=80)
    action = models.CharField(max_length=80)
    detail = models.CharField(max_length=300)

    class Meta:
        ordering = ["-at"]
