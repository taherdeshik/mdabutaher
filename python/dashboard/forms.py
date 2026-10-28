"""কমান্ড সেন্টারের ফর্ম।"""
from __future__ import annotations

import mimetypes

from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm

from accounts.models import User
from content.models import (
    Event,
    GalleryPhoto,
    GalleryPoster,
    HomeSection,
    MediaAsset,
    Pillar,
    Post,
    SitePage,
    TickerItem,
    TickerSettings,
    VideoItem,
)
from crm.models import Appointment, Challenge, Expense, Feedback, Task, TeamMember, Ward

INPUT = {"class": "adm-input"}


class LoginForm(AuthenticationForm):
    username = forms.CharField(
        label="ইউজারনেম",
        widget=forms.TextInput(attrs={"autofocus": True, "autocomplete": "username", "placeholder": "admin", **INPUT}),
    )
    password = forms.CharField(
        label="পাসওয়ার্ড",
        widget=forms.PasswordInput(attrs={"autocomplete": "current-password", "placeholder": "••••••••", **INPUT}),
    )


class StyledForm(forms.ModelForm):
    """সব ফিল্ডে `adm-input` ক্লাস বসায়।"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            widget = field.widget
            base = widget.attrs.get("class", "")
            if isinstance(widget, forms.CheckboxInput):
                widget.attrs["class"] = f"adm-check {base}".strip()
            elif isinstance(widget, forms.Select):
                widget.attrs["class"] = f"adm-input {base}".strip()
            else:
                widget.attrs["class"] = f"adm-input {base}".strip()


# ------------------------------------------------------------------- posts
class PostForm(StyledForm):
    tags_text = forms.CharField(
        label="ট্যাগ (কমা দিয়ে)",
        required=False,
        widget=forms.TextInput(attrs={"placeholder": "শিক্ষা, স্বাস্থ্য, পানি"}),
    )

    class Meta:
        model = Post
        fields = [
            "kind", "slug", "title", "excerpt", "category", "published_on", "read_time",
            "author_name", "author_role", "image", "featured", "status", "outlet", "rich",
        ]
        widgets = {
            "published_on": forms.DateInput(attrs={"type": "date"}),
            "rich": forms.Textarea(attrs={"rows": 18, "placeholder": "## শিরোনাম\n\nএখানে লেখা…\n\n- তালিকা\n1. সংখ্যাযুক্ত তালিকা\n> উদ্ধৃতি\n![ছবির নাম](/media/uploads/…)"}),
            "excerpt": forms.Textarea(attrs={"rows": 3}),
            "slug": forms.TextInput(attrs={"placeholder": "english-slug"}),
            "image": forms.TextInput(attrs={"placeholder": "campaign অথবা /media/uploads/…"}),
            "outlet": forms.TextInput(attrs={"placeholder": "সংবাদ পত্রের নাম (সংবাদের জন্য)"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["tags_text"].initial = ", ".join(self.instance.tags or [])

    def save(self, commit: bool = True):
        post = super().save(commit=False)
        raw = self.cleaned_data.get("tags_text", "")
        post.tags = [t.strip() for t in raw.split(",") if t.strip()]
        if post.kind == Post.KIND_NEWS and not post.category:
            post.category = "সংবাদ"
        if commit:
            post.save()
        return post


# ------------------------------------------------------------------ events
class EventForm(StyledForm):
    class Meta:
        model = Event
        fields = ["title", "type", "date", "start", "end", "venue", "ward", "description",
                  "capacity", "registered", "speaker", "status", "hidden"]
        widgets = {
            "date": forms.DateInput(attrs={"type": "date"}),
            "description": forms.Textarea(attrs={"rows": 3}),
        }


class PillarForm(StyledForm):
    class Meta:
        model = Pillar
        fields = ["title", "summary", "problem", "target", "budget", "progress", "hidden"]
        widgets = {
            "summary": forms.Textarea(attrs={"rows": 2}),
            "problem": forms.Textarea(attrs={"rows": 2}),
            "target": forms.Textarea(attrs={"rows": 2}),
            "progress": forms.NumberInput(attrs={"min": 0, "max": 100}),
        }


# ------------------------------------------------------------------ gallery
class PhotoForm(StyledForm):
    upload = forms.ImageField(label="ছবি আপলোড", required=False, widget=forms.ClearableFileInput(attrs={"class": "adm-input adm-file"}))

    class Meta:
        model = GalleryPhoto
        fields = ["caption", "tag", "src", "tall", "hidden"]
        widgets = {"src": forms.TextInput(attrs={"placeholder": "/media/… অথবা রেজিস্ট্রি কী"})}


class PosterForm(StyledForm):
    upload = forms.ImageField(label="পোস্টার আপলোড", required=False, widget=forms.ClearableFileInput(attrs={"class": "adm-input adm-file"}))

    class Meta:
        model = GalleryPoster
        fields = ["title", "subtitle", "src", "election", "hidden"]
        widgets = {"src": forms.TextInput(attrs={"placeholder": "/media/…"})}


class VideoForm(StyledForm):
    class Meta:
        model = VideoItem
        fields = ["youtube_id", "title", "category", "note", "hidden"]
        widgets = {"youtube_id": forms.TextInput(attrs={"placeholder": "hnD09TA3Vj8"})}


# ------------------------------------------------------------------- ticker
class TickerItemForm(StyledForm):
    class Meta:
        model = TickerItem
        fields = ["text", "href", "active"]
        widgets = {"href": forms.TextInput(attrs={"placeholder": "/events"})}


class TickerSettingsForm(StyledForm):
    class Meta:
        model = TickerSettings
        fields = ["enabled", "mode"]


# ------------------------------------------------------------------ pages
class SitePageForm(StyledForm):
    class Meta:
        model = SitePage
        fields = ["label", "eyebrow", "title", "description", "body", "image", "video", "visible"]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 3}),
            "body": forms.Textarea(attrs={"rows": 5}),
            "image": forms.TextInput(attrs={"placeholder": "/media/… অথবা কী"}),
            "video": forms.TextInput(attrs={"placeholder": "YouTube আইডি"}),
        }


class HomeSectionForm(StyledForm):
    class Meta:
        model = HomeSection
        fields = ["eyebrow", "title", "description", "visible"]
        widgets = {"description": forms.Textarea(attrs={"rows": 3})}


# -------------------------------------------------------------------- crm
class AppointmentForm(StyledForm):
    class Meta:
        model = Appointment
        fields = ["status", "preferred_date", "slot", "admin_note"]
        widgets = {
            "preferred_date": forms.DateInput(attrs={"type": "date"}),
            "admin_note": forms.Textarea(attrs={"rows": 2}),
        }


class FeedbackForm(StyledForm):
    class Meta:
        model = Feedback
        fields = ["status", "priority", "admin_note"]
        widgets = {"admin_note": forms.Textarea(attrs={"rows": 2})}


class TaskForm(StyledForm):
    class Meta:
        model = Task
        fields = ["title", "type", "date", "time", "ward", "assignee", "priority", "notes"]
        widgets = {
            "date": forms.DateInput(attrs={"type": "date"}),
            "time": forms.TimeInput(attrs={"type": "time"}),
            "notes": forms.Textarea(attrs={"rows": 2}),
        }


class TeamForm(StyledForm):
    class Meta:
        model = TeamMember
        fields = ["name", "phone", "role", "ward", "status"]


class ChallengeForm(StyledForm):
    class Meta:
        model = Challenge
        fields = ["title", "detail", "ward", "category", "severity", "status", "owner"]
        widgets = {"detail": forms.Textarea(attrs={"rows": 2})}


class ExpenseForm(StyledForm):
    class Meta:
        model = Expense
        fields = ["date", "category", "description", "amount", "mode", "voucher", "by"]
        widgets = {"date": forms.DateInput(attrs={"type": "date"})}


class WardForm(StyledForm):
    class Meta:
        model = Ward
        fields = ["no", "name", "villages", "strength", "turnout_2021", "note"]


class UserForm(StyledForm):
    password = forms.CharField(
        label="পাসওয়ার্ড",
        required=False,
        widget=forms.PasswordInput(attrs={"placeholder": "খালি রাখলে অপরিবর্তিত"}),
    )

    class Meta:
        model = User
        fields = ["username", "first_name", "email", "role", "phone", "ward_no", "is_active"]
        labels = {"first_name": "নাম", "username": "ইউজারনেম"}

    def save(self, commit: bool = True):
        user = super().save(commit=False)
        pwd = self.cleaned_data.get("password")
        if pwd:
            user.set_password(pwd)
        if commit:
            user.save()
        return user


class NewUserForm(UserCreationForm):
    class Meta:
        model = User
        fields = ["username", "first_name", "role", "phone", "ward_no"]


class MediaUploadForm(forms.Form):
    file = forms.FileField(label="ফাইল", widget=forms.ClearableFileInput(attrs={"class": "adm-input adm-file"}))

    def clean_file(self):
        upload = self.cleaned_data["file"]
        if upload.size > 6 * 1024 * 1024:
            raise forms.ValidationError("সর্বোচ্চ ৬ মেগাবাইট ফাইল আপলোড করা যায়")
        content_type = upload.content_type or mimetypes.guess_type(upload.name)[0] or ""
        if not (content_type.startswith("image/") or content_type.startswith("video/")):
            raise forms.ValidationError("শুধু ছবি বা ভিডিও ফাইল আপলোড করুন")
        upload.content_type = content_type
        return upload
