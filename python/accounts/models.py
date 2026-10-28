from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "admin", "অ্যাডমিন"
    MANAGER = "manager", "ম্যানেজার"
    CAPTAIN = "captain", "ওয়ার্ড ক্যাপ্টেন"
    VOLUNTEER = "volunteer", "স্বেচ্ছাসেবক"


class User(AbstractUser):
    """ক্যাম্পেইন টিমের সদস্য — কমান্ড সেন্টারের অ্যাক্সেস ভূমিকা অনুযায়ী।"""

    role = models.CharField("ভূমিকা", max_length=20, choices=Role.choices, default=Role.VOLUNTEER)
    phone = models.CharField("মোবাইল", max_length=32, blank=True)
    ward_no = models.PositiveSmallIntegerField("ওয়ার্ড", null=True, blank=True)

    class Meta:
        verbose_name = "ব্যবহারকারী"
        verbose_name_plural = "ব্যবহারকারী ও ভূমিকা"

    def __str__(self) -> str:
        return self.get_full_name() or self.username

    @property
    def role_label(self) -> str:
        return self.get_role_display()

    @property
    def is_manager(self) -> bool:
        return self.role in {Role.ADMIN, Role.MANAGER} or self.is_superuser

    def can(self, section: str) -> bool:
        """Section-level permission guard used by the dashboard."""
        if self.is_superuser or self.role == Role.ADMIN:
            return True
        if self.role == Role.MANAGER:
            return section not in {"settings"}
        if self.role == Role.CAPTAIN:
            return section in {"situation", "coverage", "plan", "team", "challenges", "crm"}
        return section in {"situation", "plan", "challenges", "crm"}
