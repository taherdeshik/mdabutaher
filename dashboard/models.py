from django.conf import settings
from django.db import models


class AdminProfile(models.Model):
    """Role and ward scope for a dashboard user (Django auth handles passwords)."""

    class Role(models.TextChoices):
        OWNER = "owner", "মালিক"
        MANAGER = "manager", "ম্যানেজার"
        CAPTAIN = "captain", "ওয়ার্ড ক্যাপ্টেন"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, related_name="profile", on_delete=models.CASCADE
    )
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.CAPTAIN)
    ward_id = models.CharField(max_length=8, blank=True)

    def __str__(self):
        return f"{self.user.get_username()} ({self.role})"


class AuditLog(models.Model):
    """Who changed what in the dashboard (kept to the most recent 200 entries)."""

    at = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.CharField(max_length=80)
    action = models.CharField(max_length=80)
    detail = models.CharField(max_length=300)

    class Meta:
        ordering = ["-at"]

    @classmethod
    def record(cls, actor: str, action: str, detail: str) -> None:
        cls.objects.create(actor=actor, action=action, detail=detail[:300])
        stale = cls.objects.values_list("pk", flat=True)[200:]
        if stale:
            cls.objects.filter(pk__in=list(stale)).delete()
