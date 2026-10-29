"""Input validation for every public write endpoint.

These forms back both the JSON API (`civic/api.py`) and any server-rendered
form. Messages come from the editable `messages` document (see cms/copy.py). The phone pattern
accepts 01XXXXXXXXX with an optional +88 prefix, as before.
"""

import re
from datetime import date

from django import forms

from cms.copy import message_text_lazy

from .constants import APPOINTMENT_MODES, FEEDBACK_KINDS, FEEDBACK_SEVERITIES

PHONE_RE = re.compile(r"^(\+?88)?01[3-9]\d{8}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SLOT_RE = re.compile(r"^\d{2}:\d{2}$")

PHONE_MSG = message_text_lazy("form.phone")
EMAIL_MSG = message_text_lazy("form.email")
WARD_MSG = message_text_lazy("form.ward")


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
            "min_length": message_text_lazy("form.name_short"),
            "required": message_text_lazy("form.name"),
        },
    )
    phone = _phone()
    email = forms.EmailField(
        required=False, max_length=254, error_messages={"invalid": EMAIL_MSG}
    )
    type = forms.CharField(error_messages={"required": message_text_lazy("form.appointment_type")})
    date = forms.CharField(error_messages={"required": message_text_lazy("form.date")})
    slot = forms.CharField(error_messages={"required": message_text_lazy("form.time")})
    mode = forms.ChoiceField(choices=[(m, m) for m in APPOINTMENT_MODES])
    ward = forms.CharField(error_messages={"required": WARD_MSG})
    topic = forms.CharField(
        min_length=5,
        max_length=160,
        error_messages={"min_length": message_text_lazy("form.topic"), "required": message_text_lazy("form.topic")},
    )
    notes = forms.CharField(required=False, max_length=1200, strip=True)

    def clean_date(self):
        raw = self.cleaned_data["date"]
        if not DATE_RE.match(raw):
            raise forms.ValidationError(message_text_lazy("form.date"))
        try:
            return date.fromisoformat(raw)
        except ValueError:
            raise forms.ValidationError(message_text_lazy("form.date_invalid"))

    def clean_slot(self):
        raw = self.cleaned_data["slot"]
        if not SLOT_RE.match(raw):
            raise forms.ValidationError(message_text_lazy("form.time"))
        return raw


class FeedbackForm(_BaseForm):
    kind = forms.ChoiceField(choices=[(k, k) for k in FEEDBACK_KINDS])
    category = forms.CharField(error_messages={"required": message_text_lazy("form.category")})
    title = forms.CharField(
        min_length=5,
        max_length=140,
        error_messages={"min_length": message_text_lazy("form.title"), "required": message_text_lazy("form.title")},
    )
    details = forms.CharField(
        min_length=20,
        max_length=3000,
        error_messages={
            "min_length": message_text_lazy("form.details"),
            "required": message_text_lazy("form.details"),
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
        error_messages={"min_length": message_text_lazy("form.name"), "required": message_text_lazy("form.name")},
    )
    email = forms.EmailField(
        required=False, max_length=254, error_messages={"invalid": EMAIL_MSG}
    )
    phone = forms.CharField(required=False, max_length=20, strip=True)
    subject = forms.CharField(
        min_length=3,
        max_length=140,
        error_messages={"min_length": message_text_lazy("form.topic"), "required": message_text_lazy("form.topic")},
    )
    message = forms.CharField(
        min_length=10,
        max_length=2000,
        error_messages={"min_length": message_text_lazy("form.message"), "required": message_text_lazy("form.message")},
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
        error_messages={"required": message_text_lazy("form.message")},
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
        min_length=1, max_length=80, error_messages={"required": message_text_lazy("form.option")}
    )
    fingerprint = forms.CharField(
        min_length=6,
        max_length=80,
        error_messages={"min_length": message_text_lazy("api.invalid_vote"), "required": message_text_lazy("api.invalid_vote")},
    )


class EventRegistrationForm(_BaseForm):
    name = forms.CharField(
        min_length=3,
        max_length=80,
        error_messages={"min_length": message_text_lazy("form.name"), "required": message_text_lazy("form.name")},
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
        error_messages={"min_length": message_text_lazy("form.name"), "required": message_text_lazy("form.name")},
    )
    phone = _phone()
    ward = forms.CharField(error_messages={"required": WARD_MSG})
    role = forms.CharField(error_messages={"required": message_text_lazy("form.role")})
    availability = forms.CharField(error_messages={"required": message_text_lazy("form.time")})
