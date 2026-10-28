"""Django অ্যাডমিন — CRM মডেল (ওয়ার্ড, কেন্দ্র, পরিবার, দল, খরচ, অভিযোগ...)।"""
from __future__ import annotations

from django.contrib import admin

from .models import (
    Appointment,
    AuditLog,
    Booth,
    Challenge,
    Conversation,
    Expense,
    Feedback,
    Household,
    Message,
    Poll,
    PollOption,
    PollVote,
    Task,
    TeamMember,
    VisitorEvent,
    Visit,
    Ward,
)


@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ("no", "name", "strength", "turnout_2021")
    list_filter = ("strength",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Booth)
class BoothAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "ward", "centre", "voters", "households", "visited", "coverage", "strength")
    list_filter = ("ward", "strength")
    search_fields = ("code", "name", "centre", "village")
    list_select_related = ("ward",)


@admin.register(Household)
class HouseholdAdmin(admin.ModelAdmin):
    list_display = ("head", "ward", "village", "members", "status", "support", "last_visit")
    list_filter = ("ward", "status", "support")
    search_fields = ("head", "phone", "village")
    list_select_related = ("ward",)
    date_hierarchy = "last_visit"


class VisitInline(admin.TabularInline):
    model = Visit
    extra = 0
    fields = ("by", "status", "promise", "follow_up", "note", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("household", "ward", "by", "status", "created_at")
    list_filter = ("status", "ward")
    search_fields = ("household__head", "by", "promise", "note")
    list_select_related = ("household", "ward")


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "phone", "ward", "status", "joined_at")
    list_filter = ("role", "status", "ward")
    search_fields = ("name", "phone")
    list_select_related = ("ward",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "date", "time", "ward", "assignee", "priority", "done")
    list_filter = ("type", "priority", "done", "ward")
    search_fields = ("title", "assignee", "notes")
    list_editable = ("done", "priority")
    date_hierarchy = "date"


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("date", "category", "description", "amount", "mode", "voucher", "by")
    list_filter = ("category", "mode")
    search_fields = ("description", "voucher", "by")
    date_hierarchy = "date"


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "ward", "severity", "status", "owner")
    list_filter = ("category", "severity", "status", "ward")
    search_fields = ("title", "detail", "owner", "resolution")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "ward", "topic", "preferred_date", "slot", "status", "created_at")
    list_filter = ("status", "topic", "ward")
    search_fields = ("name", "phone", "note", "admin_note")
    list_editable = ("status",)
    date_hierarchy = "preferred_date"


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("kind", "name", "phone", "ward", "status", "priority", "created_at")
    list_filter = ("kind", "status", "priority", "ward")
    search_fields = ("name", "phone", "message", "admin_note")
    list_editable = ("status", "priority")


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ("sender", "body", "read", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("key", "name", "phone", "status", "unread", "last_at")
    list_filter = ("status",)
    search_fields = ("key", "name", "phone")
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "sender", "body", "read", "created_at")
    list_filter = ("sender", "read")
    search_fields = ("body", "conversation__name")


class PollOptionInline(admin.TabularInline):
    model = PollOption
    extra = 0
    fields = ("key", "label", "seed_votes", "position")


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ("question", "slug", "category", "status", "closes_at", "total_votes", "sort_order")
    list_filter = ("status", "category")
    search_fields = ("question", "slug", "description")
    prepopulated_fields = {"slug": ("question",)}
    inlines = [PollOptionInline]

    @admin.display(description="মোট ভোট")
    def total_votes(self, obj: Poll) -> int:
        return obj.total_votes


@admin.register(PollVote)
class PollVoteAdmin(admin.ModelAdmin):
    list_display = ("option", "visitor_key", "created_at")
    list_filter = ("option__poll",)
    search_fields = ("visitor_key", "option__label")
    readonly_fields = ("option", "visitor_key", "created_at")


@admin.register(VisitorEvent)
class VisitorEventAdmin(admin.ModelAdmin):
    list_display = ("path", "country", "city", "device", "browser", "is_new_visitor", "created_at")
    list_filter = ("device", "browser", "is_new_visitor", "country")
    search_fields = ("path", "referrer", "city", "country")
    readonly_fields = tuple(f.name for f in VisitorEvent._meta.fields)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "detail")
    list_filter = ("action",)
    search_fields = ("actor", "action", "detail")
    readonly_fields = ("actor", "action", "detail", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
