"""Input validation for every public write endpoint.

These forms back both the JSON API (`civic/api.py`) and any server-rendered
form. Messages stay in Bengali to match the original site. The phone pattern
accepts 01XXXXXXXXX with an optional +88 prefix, as before.
"""

import re
from datetime import date

from django import forms

from .constants import APPOINTMENT_MODES, FEEDBACK_KINDS, FEEDBACK_SEVERITIES

PHONE_RE = re.compile(r"^(\+?88)?01[3-9]\d{8}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SLOT_RE = re.compile(r"^\d{2}:\d{2}$")

PHONE_MSG = "সঠিক মোবাইল নম্বর দিন (যেমন: 01711203997)"
EMAIL_MSG = "সঠিক ইমেইল দিন"
WARD_MSG = "ওয়ার্ড বেছে নিন"


def validate_phone(value: str) -> str:
    if not PHONE_RE.match(value or ""):
        raise forms.ValidationError(PHONE_MSG)
    return value


class _BaseForm(forms.Form):
    """Strip whitespace from all text fields and expose a flat error map."""

    def flat_errors(self) -> dict[str, str]:
        out: dict[str, str] = {}
        for field, errs in self.errors.items():
            out[field or "form"] = errs[0]
        return out


def _phone(required: bool = True, label: str = "") -> forms.CharField:
    return forms.CharField(
        required=required,
        max_length=20,
        validators=[validate_phone],
        error_messages={"required": PHONE_MSG},
        strip=True,
    )


class AppointmentForm(_BaseForm):
    name = forms.CharField(
        min_length=3,
        max_length=80,
        error_messages={
            "min_length": "নাম কমপক্ষে ৩ অক্ষর হতে হবে",
            "required": "নাম লিখুন",
        },
    )
    phone = _phone()
    email = forms.EmailField(
        required=False, max_length=254, error_messages={"invalid": EMAIL_MSG}
    )
    type = forms.CharField(error_messages={"required": "সাক্ষাতের ধরন বেছে নিন"})
    date = forms.CharField(error_messages={"required": "তারিখ বেছে নিন"})
    slot = forms.CharField(error_messages={"required": "সময় বেছে নিন"})
    mode = forms.ChoiceField(choices=[(m, m) for m in APPOINTMENT_MODES])
    ward = forms.CharField(error_messages={"required": WARD_MSG})
    topic = forms.CharField(
        min_length=5,
        max_length=160,
        error_messages={"min_length": "বিষয় লিখুন", "required": "বিষয় লিখুন"},
    )
    notes = forms.CharField(required=False, max_length=1200, strip=True)

    def clean_date(self):
        raw = self.cleaned_data["date"]
        if not DATE_RE.match(raw):
            raise forms.ValidationError("তারিখ বেছে নিন")
        try:
            return date.fromisoformat(raw)
        except ValueError:
            raise forms.ValidationError("তারিখ সঠিক নয়")

    def clean_slot(self):
        raw = self.cleaned_data["slot"]
        if not SLOT_RE.match(raw):
            raise forms.ValidationError("সময় বেছে নিন")
        return raw


class FeedbackForm(_BaseForm):
    kind = forms.ChoiceField(choices=[(k, k) for k in FEEDBACK_KINDS])
    category = forms.CharField(error_messages={"required": "বিভাগ বেছে নিন"})
    title = forms.CharField(
        min_length=5,
        max_length=140,
        error_messages={"min_length": "শিরোনাম লিখুন", "required": "শিরোনাম লিখুন"},
    )
    details = forms.CharField(
        min_length=20,
        max_length=3000,
        error_messages={
            "min_length": "অন্তত ২০ অক্ষরে বিস্তারিত লিখুন",
            "required": "অন্তত ২০ অক্ষরে বিস্তারিত লিখুন",
        },
    )
    ward = forms.CharField(error_messages={"required": WARD_MSG})
    location = forms.CharField(required=False, max_length=160, strip=True)
    severity = forms.ChoiceField(choices=[(v, v) for v in FEEDBACK_SEVERITIES])
    name = forms.CharField(required=False, max_length=80, strip=True)
    phone = forms.CharField(required=False, max_length=20, strip=True, validators=[])
    anonymous = forms.BooleanField(required=False)
    photo = forms.CharField(required=False, max_length=2_000_000)

    def clean_phone(self):
        value = self.cleaned_data.get("phone") or ""
        if value:
            validate_phone(value)
        return value


class ContactForm(_BaseForm):
    name = forms.CharField(
        min_length=3,
        max_length=80,
        error_messages={"min_length": "নাম লিখুন", "required": "নাম লিখুন"},
    )
    email = forms.EmailField(
        required=False, max_length=254, error_messages={"invalid": EMAIL_MSG}
    )
    phone = forms.CharField(required=False, max_length=20, strip=True)
    subject = forms.CharField(
        min_length=3,
        max_length=140,
        error_messages={"min_length": "বিষয় লিখুন", "required": "বিষয় লিখুন"},
    )
    message = forms.CharField(
        min_length=10,
        max_length=2000,
        error_messages={"min_length": "বার্তা লিখুন", "required": "বার্তা লিখুন"},
    )

    def clean_phone(self):
        value = self.cleaned_data.get("phone") or ""
        if value:
            validate_phone(value)
        return value


class NewsletterForm(_BaseForm):
    email = forms.EmailField(
        max_length=254, error_messages={"invalid": EMAIL_MSG, "required": EMAIL_MSG}
    )


class ChatForm(_BaseForm):
    message = forms.CharField(
        min_length=1,
        max_length=1000,
        strip=True,
        error_messages={"required": "বার্তা লিখুন"},
    )
    name = forms.CharField(required=False, max_length=80, strip=True)
    phone = forms.CharField(required=False, max_length=20, strip=True)

    def clean_phone(self):
        value = self.cleaned_data.get("phone") or ""
        if value:
            validate_phone(value)
        return value


class VoteForm(_BaseForm):
    optionId = forms.CharField(
        min_length=1, max_length=80, error_messages={"required": "বিকল্প বেছে নিন"}
    )
    fingerprint = forms.CharField(
        min_length=6,
        max_length=80,
        error_messages={"min_length": "অবৈধ ভোট", "required": "অবৈধ ভোট"},
    )


class EventRegistrationForm(_BaseForm):
    name = forms.CharField(
        min_length=3,
        max_length=80,
        error_messages={"min_length": "নাম লিখুন", "required": "নাম লিখুন"},
    )
    phone = _phone()
    ward = forms.CharField(error_messages={"required": WARD_MSG})
    guests = forms.IntegerField(min_value=0, max_value=10, required=False, initial=0)

    def clean_guests(self):
        return self.cleaned_data.get("guests") or 0


class VolunteerForm(_BaseForm):
    name = forms.CharField(
        min_length=3,
        max_length=80,
        error_messages={"min_length": "নাম লিখুন", "required": "নাম লিখুন"},
    )
    phone = _phone()
    ward = forms.CharField(error_messages={"required": WARD_MSG})
    role = forms.CharField(error_messages={"required": "ভূমিকা বেছে নিন"})
    availability = forms.CharField(error_messages={"required": "সময় বেছে নিন"})
