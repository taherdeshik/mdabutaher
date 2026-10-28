"""কমান্ড সেন্টার + CRM: ভোটার-এলাকা কভারেজ, দল, পরিকল্পনা, খরচ,
অ্যাপয়েন্টমেন্ট, অভিযোগ, চ্যাট, জনমত জরিপ, ভিজিটর-অ্যানালিটিক্স ও অডিট লগ।
"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models

STRENGTH = [("strong", "শক্তিশালী"), ("lean", "অনুকূল"), ("swing", "দোদুল্যমান"), ("hostile", "প্রতিকূল")]
PRIORITY = [("low", "কম"), ("medium", "মাঝারি"), ("high", "জরুরি")]
SEVERITY = [("low", "কম"), ("medium", "মাঝারি"), ("high", "উচ্চ"), ("critical", "সংকটপূর্ণ")]
CHALLENGE_STATUS = [("open", "খোলা"), ("monitoring", "নজরদারিতে"), ("resolved", "সমাধান")]


def sid(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


class Ward(models.Model):
    slug = models.SlugField(max_length=20, unique=True)
    no = models.PositiveSmallIntegerField("ওয়ার্ড নম্বর")
    name = models.CharField("নাম", max_length=80)
    villages = models.JSONField("গ্রাম", default=list, blank=True)
    polygon = models.TextField("ম্যাপ পলিগন", blank=True)
    strength = models.CharField("শক্তি", max_length=10, choices=STRENGTH, default="swing")
    turnout_2021 = models.PositiveSmallIntegerField("টার্নআউট ২০২১ (%)", default=70)
    note = models.TextField("নোট", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["no"]
        verbose_name = "ওয়ার্ড"
        verbose_name_plural = "ওয়ার্ড ও এলাকা"

    def __str__(self) -> str:
        return f"ওয়ার্ড {self.no} — {self.name}"


class Booth(models.Model):
    slug = models.SlugField(max_length=20, unique=True)
    code = models.CharField("কোড", max_length=20)
    name = models.CharField(max_length=120)
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name="booths")
    village = models.CharField(max_length=80, blank=True)
    centre = models.CharField("কেন্দ্র", max_length=120, blank=True)
    voters = models.PositiveIntegerField(default=0)
    male = models.PositiveIntegerField(default=0)
    female = models.PositiveIntegerField(default=0)
    youth = models.PositiveIntegerField(default=0)
    first_time = models.PositiveIntegerField(default=0)
    households = models.PositiveIntegerField(default=0)
    visited = models.PositiveIntegerField(default=0)
    committed = models.PositiveIntegerField(default=0)
    strength = models.CharField(max_length=10, choices=STRENGTH, default="swing")
    x = models.FloatField(default=0)
    y = models.FloatField(default=0)

    class Meta:
        ordering = ["ward__no", "code"]
        verbose_name = "কেন্দ্র"
        verbose_name_plural = "ভোটকেন্দ্র"

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"

    @property
    def coverage(self) -> int:
        return round((self.visited / self.households) * 100) if self.households else 0


class Household(models.Model):
    STATUS = [("unvisited", "পরিদর্শন হয়নি"), ("visited", "পরিদর্শিত"), ("committed", "সমর্থক"), ("hostile", "বিরোধী")]

    booth = models.ForeignKey(Booth, on_delete=models.CASCADE, related_name="households_set")
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name="households")
    village = models.CharField(max_length=80, blank=True)
    head = models.CharField("পরিবার প্রধান", max_length=120)
    phone = models.CharField(max_length=32, blank=True)
    members = models.PositiveSmallIntegerField(default=4)
    status = models.CharField(max_length=12, choices=STATUS, default="unvisited")
    support = models.CharField(max_length=12, choices=[("committed", "নিশ্চিত"), ("leaning", "ঝুঁকছে"), ("undecided", "অনিশ্চিত"), ("hostile", "বিরোধী")], default="undecided")
    issues = models.JSONField(default=list, blank=True)
    last_visit = models.DateField(null=True, blank=True)
    follow_up = models.CharField(max_length=200, blank=True)
    note = models.TextField(blank=True)
    route = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["ward__no", "route", "id"]
        verbose_name = "পরিবার"
        verbose_name_plural = "পরিবার (ডোর-টু-ডোর)"

    def __str__(self) -> str:
        return self.head


class Visit(models.Model):
    STATUS = [
        ("met-supportive", "সমর্থকের সাথে সাক্ষাৎ"),
        ("met-undecided", "অনিশ্চিতের সাথে সাক্ষাৎ"),
        ("met-hostile", "বিরোধীর সাথে সাক্ষাৎ"),
        ("absent", "বাড়িতে কেউ ছিলেন না"),
        ("refused", "কথা বলতে রাজি হননি"),
    ]

    household = models.ForeignKey(Household, on_delete=models.CASCADE, related_name="visits")
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name="visits")
    by = models.CharField("কর্মী", max_length=120, blank=True)
    status = models.CharField(max_length=16, choices=STATUS, default="met-supportive")
    issues = models.JSONField(default=list, blank=True)
    promise = models.CharField(max_length=200, blank=True)
    follow_up = models.CharField(max_length=200, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "পরিদর্শন"
        verbose_name_plural = "পরিদর্শন লগ"

    def __str__(self) -> str:
        return f"{self.household} · {self.get_status_display()}"


class TeamMember(models.Model):
    ROLES = [
        ("manager", "ম্যানেজার"),
        ("finance", "অর্থ"),
        ("media", "মিডিয়া"),
        ("ward-captain", "ওয়ার্ড ক্যাপ্টেন"),
        ("booth-captain", "কেন্দ্র ক্যাপ্টেন"),
        ("household-leader", "পরিবার প্রধান"),
        ("volunteer", "স্বেচ্ছাসেবক"),
    ]
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(max_length=20, choices=ROLES, default="volunteer")
    ward = models.ForeignKey(Ward, null=True, blank=True, on_delete=models.SET_NULL, related_name="team")
    booth = models.ForeignKey(Booth, null=True, blank=True, on_delete=models.SET_NULL, related_name="team")
    status = models.CharField(max_length=10, choices=[("active", "সক্রিয়"), ("pending", "অপেক্ষমাণ"), ("inactive", "নিষ্ক্রিয়")], default="active")
    joined_at = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "দলের সদস্য"
        verbose_name_plural = "দল ও স্বেচ্ছাসেবক"

    def __str__(self) -> str:
        return f"{self.name} · {self.get_role_display()}"


class Task(models.Model):
    TYPES = [
        ("meeting", "সভা"),
        ("canvass", "ডোর-টু-ডোর"),
        ("miking", "মাইকিং"),
        ("rally", "জনসভা"),
        ("admin", "প্রশাসনিক"),
        ("media", "মিডিয়া"),
    ]
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=10, choices=TYPES, default="canvass")
    date = models.DateField()
    time = models.CharField(max_length=10, default="10:00")
    ward = models.ForeignKey(Ward, null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks")
    assignee = models.CharField(max_length=120, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY, default="medium")
    done = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "time"]
        verbose_name = "কাজ"
        verbose_name_plural = "দৈনিক পরিকল্পনা"

    def __str__(self) -> str:
        return self.title


class Expense(models.Model):
    MODES = [("cash", "নগদ"), ("cheque", "চেক"), ("bank", "ব্যাংক")]
    date = models.DateField()
    category = models.CharField(max_length=80)
    description = models.CharField(max_length=220)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    mode = models.CharField(max_length=10, choices=MODES, default="cash")
    voucher = models.CharField("ভাউচার", max_length=60, blank=True)
    by = models.CharField("অনুমোদনকারী", max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-id"]
        verbose_name = "খরচ"
        verbose_name_plural = "ব্যয় ট্র্যাকার"

    def __str__(self) -> str:
        return f"{self.description} — {self.amount}"


class Challenge(models.Model):
    title = models.CharField(max_length=200)
    detail = models.TextField(blank=True)
    ward = models.ForeignKey(Ward, null=True, blank=True, on_delete=models.SET_NULL, related_name="challenges")
    category = models.CharField(max_length=80, blank=True)
    severity = models.CharField(max_length=10, choices=SEVERITY, default="medium")
    status = models.CharField(max_length=12, choices=CHALLENGE_STATUS, default="open")
    owner = models.CharField(max_length=120, blank=True)
    resolution = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "চ্যালেঞ্জ"
        verbose_name_plural = "চ্যালেঞ্জ ও সহায়তা"

    def __str__(self) -> str:
        return self.title


class Appointment(models.Model):
    """পাবলিক `/appointment` ফর্ম থেকে আসা সাক্ষাতের অনুরোধ।"""

    TOPICS = [
        ("personal", "ব্যক্তিগত সাক্ষাৎ"),
        ("service", "সেবা সংক্রান্ত"),
        ("complaint", "অভিযোগ"),
        ("proposal", "পরামর্শ/প্রস্তাব"),
        ("media", "মিডিয়া"),
        ("volunteer", "স্বেচ্ছাসেবক হতে চাই"),
    ]
    STATUS = [("pending", "অপেক্ষমাণ"), ("confirmed", "নিশ্চিত"), ("done", "সম্পন্ন"), ("cancelled", "বাতিল")]

    name = models.CharField("নাম", max_length=120)
    phone = models.CharField("মোবাইল", max_length=32)
    ward = models.CharField("ওয়ার্ড", max_length=40, blank=True)
    topic = models.CharField("বিষয়", max_length=16, choices=TOPICS, default="personal")
    preferred_date = models.DateField("পছন্দের তারিখ", null=True, blank=True)
    slot = models.CharField("সময়", max_length=20, blank=True)
    note = models.TextField("বিস্তারিত", blank=True)
    status = models.CharField("অবস্থা", max_length=12, choices=STATUS, default="pending")
    admin_note = models.TextField("টিমের নোট", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "অ্যাপয়েন্টমেন্ট"
        verbose_name_plural = "অ্যাপয়েন্টমেন্ট"

    def __str__(self) -> str:
        return f"{self.name} · {self.phone}"


class Feedback(models.Model):
    KINDS = [
        ("problem", "সমস্যা/অভিযোগ"),
        ("advice", "পরামর্শ"),
        ("threat", "হুমকি/নিরাপত্তা"),
        ("support", "সমর্থন জানাতে চাই"),
    ]
    STATUS = [("new", "নতুন"), ("reviewing", "পর্যালোচনায়"), ("resolved", "সমাধান"), ("archived", "আর্কাইভ")]

    kind = models.CharField("ধরন", max_length=12, choices=KINDS, default="problem")
    name = models.CharField("নাম", max_length=120, blank=True)
    phone = models.CharField("মোবাইল", max_length=32, blank=True)
    ward = models.CharField("ওয়ার্ড", max_length=40, blank=True)
    village = models.CharField("গ্রাম/পাড়া", max_length=120, blank=True)
    message = models.TextField("বার্তা")
    status = models.CharField("অবস্থা", max_length=12, choices=STATUS, default="new")
    priority = models.CharField("গুরুত্ব", max_length=10, choices=PRIORITY, default="medium")
    admin_note = models.TextField("টিমের নোট", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "ফিডব্যাক"
        verbose_name_plural = "সমস্যা, পরামর্শ ও হুমকি"

    def __str__(self) -> str:
        return f"{self.get_kind_display()} — {self.name or 'অজ্ঞাত'}"

    @property
    def is_threat(self) -> bool:
        return self.kind == "threat"


class Conversation(models.Model):
    key = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    status = models.CharField(max_length=12, choices=[("open", "চলমান"), ("answered", "উত্তর দেওয়া"), ("closed", "বন্ধ")], default="open")
    unread = models.PositiveSmallIntegerField(default=0)
    last_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-last_at"]
        verbose_name = "চ্যাট কথোপকথন"
        verbose_name_plural = "চ্যাট ও বার্তা"

    def __str__(self) -> str:
        return self.name or self.key

    @property
    def preview(self) -> str:
        last = self.messages.order_by("-created_at").first()
        return last.body[:80] if last else ""


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10, choices=[("visitor", "ভিজিটর"), ("team", "টিম"), ("bot", "সহায়ক")], default="visitor")
    body = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "বার্তা"
        verbose_name_plural = "বার্তা"

    def __str__(self) -> str:
        return self.body[:40]


class Poll(models.Model):
    slug = models.SlugField(max_length=60, unique=True)
    question = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=60, blank=True)
    status = models.CharField(max_length=10, choices=[("active", "চালু"), ("closed", "বন্ধ")], default="active")
    closes_at = models.DateTimeField(null=True, blank=True)
    base_votes = models.PositiveIntegerField("পূর্বের ভোট (সিড)", default=0)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "জনমত জরিপ"
        verbose_name_plural = "জনমত জরিপ"

    def __str__(self) -> str:
        return self.question

    @property
    def total_votes(self) -> int:
        live = PollVote.objects.filter(option__poll=self).count()
        return self.base_votes + live

    @property
    def is_open(self) -> bool:
        from django.utils import timezone

        if self.status != "active":
            return False
        return not self.closes_at or self.closes_at > timezone.now()


class PollOption(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="options")
    key = models.CharField(max_length=40)
    label = models.CharField(max_length=160)
    seed_votes = models.PositiveIntegerField("সিড ভোট", default=0)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]
        unique_together = [("poll", "key")]
        verbose_name = "জরিপের অপশন"
        verbose_name_plural = "জরিপের অপশন"

    def __str__(self) -> str:
        return self.label

    @property
    def votes(self) -> int:
        return self.seed_votes + PollVote.objects.filter(option=self).count()


class PollVote(models.Model):
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name="ballots")
    visitor_key = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("option", "visitor_key")]
        verbose_name = "জরিপ ভোট"
        verbose_name_plural = "জরিপ ভোট"


class VisitorEvent(models.Model):
    path = models.CharField(max_length=300)
    referrer = models.CharField(max_length=300, blank=True)
    country = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=120, blank=True)
    device = models.CharField(max_length=20, blank=True)
    browser = models.CharField(max_length=40, blank=True)
    os = models.CharField(max_length=40, blank=True)
    visitor_hash = models.CharField(max_length=64, db_index=True)
    is_new_visitor = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "ভিজিটর ইভেন্ট"
        verbose_name_plural = "ভিজিটর অ্যানালিটিক্স"
        indexes = [models.Index(fields=["path", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.path} · {self.created_at:%Y-%m-%d %H:%M}"


class AuditLog(models.Model):
    actor = models.CharField(max_length=120, blank=True)
    action = models.CharField(max_length=60)
    detail = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "অডিট লগ"
        verbose_name_plural = "অডিট লগ"

    def __str__(self) -> str:
        return f"{self.action} — {self.detail}"


def audit(actor: str, action: str, detail: str = "") -> None:
    AuditLog.objects.create(actor=(actor or "")[:120], action=action[:60], detail=detail[:300])


class TeamInvite(models.Model):
    """ডেমো/সেটআপে তৈরি টিম অ্যাকাউন্টের রেকর্ড (পাসওয়ার্ড কখনো সংরক্ষণ হয় না)।"""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="invite")
    created_at = models.DateTimeField(auto_now_add=True)
