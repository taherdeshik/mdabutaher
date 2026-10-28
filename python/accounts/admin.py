from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CampaignUserAdmin(UserAdmin):
    list_display = ("username", "first_name", "role", "phone", "ward_no", "is_active")
    list_filter = ("role", "is_active", "is_staff")
    fieldsets = UserAdmin.fieldsets + (("ক্যাম্পেইন", {"fields": ("role", "phone", "ward_no")}),)
