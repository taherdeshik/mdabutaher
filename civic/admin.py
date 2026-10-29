from django.contrib import admin

from .models import (
    Appointment,
    Feedback,
    FeedbackTimeline,
    Lead,
    Message,
    Subscriber,
    Volunteer,
)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("reference", "name", "phone", "date", "slot", "status")
    list_filter = ("status", "mode", "ward")
    search_fields = ("reference", "name", "phone")


class TimelineInline(admin.TabularInline):
    model = FeedbackTimeline
    extra = 0


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = (
        "tracking_id",
        "kind",
        "title",
        "ward",
        "severity",
        "status",
        "supports",
    )
    list_filter = ("kind", "status", "severity", "ward")
    search_fields = ("tracking_id", "title", "name", "phone")
    inlines = [TimelineInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("channel", "name", "phone", "created_at", "read")
    list_filter = ("channel", "read")


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "ward", "source", "stage", "updated_at")
    list_filter = ("source", "stage")
    search_fields = ("name", "phone")


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "ward", "role", "availability", "created_at")
    list_filter = ("ward",)


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "created_at")
