"""পাবলিক ফর্ম — অ্যাপয়েন্টমেন্ট, ফিডব্যাক, চ্যাট, জরিপ।"""
from __future__ import annotations

import re

from django import forms
from django.utils import timezone

from crm.models import Appointment, Feedback

BD_RE = re.compile(r"^(?:\+?88)?01[3-9]\d{8}$")
BD_ERROR = "সঠিক মোবাইল নম্বর দিন — যেমন ০১৭xxxxxxxx"


def _bn_digits(value: str) -> str:
    return (value or "").translate(str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789"))


class BDPhoneField(forms.CharField):
    """বাংলা বা ইংরেজি অঙ্কে লেখা ১১-ডিজিট মোবাইল নম্বর (৮৮/ +৮৮ সহ)।"""

    default_error_messages = {"invalid": BD_ERROR}

    def clean(self, value) -> str:
        value = _bn_digits(super().clean(value)).replace(" ", "").replace("-", "")
        if not BD_RE.match(value):
            raise forms.ValidationError(BD_ERROR, code="invalid")
        if value.startswith("+88"):
            value = value[3:]
        elif value.startswith("88") and len(value) == 13:
            value = value[2:]
        return value


class StyledMixin:
    """Django-র ডিফল্ট উইজেটে সাইটের ক্লাস বসায়।"""

    input_class = "field-input"

    def _style(self):
        for field in self.fields.values():
            widget = field.widget
            css = widget.attrs.get("class", "")
            if isinstance(widget, forms.CheckboxInput):
                widget.attrs["class"] = f"field-check {css}".strip()
            elif isinstance(widget, forms.Textarea):
                widget.attrs["class"] = f"{self.input_class} min-h-28 {css}".strip()
            elif isinstance(widget, (forms.Select,)):
                widget.attrs["class"] = f"{self.input_class} {css}".strip()
            else:
                widget.attrs["class"] = f"{self.input_class} {css}".strip()


class AppointmentForm(StyledMixin, forms.ModelForm):
    phone = BDPhoneField(label="মোবাইল নম্বর", widget=forms.TextInput(attrs={"placeholder": "০১৭xxxxxxxx", "inputmode": "tel"}))
    consent = forms.BooleanField(
        label="আমি সম্মত যে আমার তথ্য শুধু সাক্ষাতের জন্য ব্যবহার করা হবে",
        required=True,
        error_messages={"required": "সম্মতি ছাড়া অনুরোধ পাঠানো যাবে না"},
    )

    class Meta:
        model = Appointment
        fields = ["name", "phone", "ward", "topic", "preferred_date", "slot", "note"]
        widgets = {
            "preferred_date": forms.DateInput(attrs={"type": "date"}),
            "note": forms.Textarea(attrs={"rows": 4, "placeholder": "সংক্ষেপে আপনার বিষয়টি লিখুন…"}),
            "name": forms.TextInput(attrs={"placeholder": "আপনার পূর্ণ নাম"}),
            "phone": forms.TextInput(attrs={"placeholder": "০১৭xxxxxxxx", "inputmode": "tel"}),
            "ward": forms.TextInput(attrs={"placeholder": "যেমন: ৪ নং ওয়ার্ড"}),
        }
        labels = {
            "name": "নাম",
            "phone": "মোবাইল নম্বর",
            "ward": "ওয়ার্ড",
            "topic": "বিষয়",
            "preferred_date": "পছন্দের তারিখ",
            "slot": "সময়",
            "note": "বিস্তারিত",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # ঐচ্ছিক ঘর — খালি রাখলে ডিফল্ট ধরা হবে
        self.fields["topic"].required = False
        self.fields["preferred_date"].required = False
        self.fields["slot"].widget = forms.Select(
            choices=[
                ("", "যেকোনো সময়"),
                ("সকাল ১০টা – ১২টা", "সকাল ১০টা – ১২টা"),
                ("দুপুর ১২টা – ২টা", "দুপুর ১২টা – ২টা"),
                ("বিকাল ৩টা – ৫টা", "বিকাল ৩টা – ৫টা"),
                ("সন্ধ্যা ৬টা – ৮টা", "সন্ধ্যা ৬টা – ৮টা"),
            ]
        )
        self.fields["preferred_date"].widget.attrs["min"] = timezone.localdate().isoformat()
        self._style()

    def clean_topic(self) -> str:
        return self.cleaned_data.get("topic") or "personal"




class FeedbackForm(StyledMixin, forms.ModelForm):
    phone = forms.CharField(
        label="মোবাইল (ঐচ্ছিক)",
        required=False,
        widget=forms.TextInput(attrs={"placeholder": "০১৭xxxxxxxx", "inputmode": "tel"}),
    )
    consent = forms.BooleanField(
        label="আমি সম্মত যে আমার দেওয়া তথ্য ক্যাম্পেইন টিম সংরক্ষণ করতে পারবে",
        required=True,
        error_messages={"required": "সম্মতি ছাড়া বার্তা পাঠানো যাবে না"},
    )

    class Meta:
        model = Feedback
        fields = ["kind", "name", "phone", "ward", "village", "message"]
        widgets = {
            "message": forms.Textarea(
                attrs={"rows": 5, "placeholder": "সমস্যাটি কোথায়, কতদিন ধরে — বিস্তারিত লিখুন…"}
            ),
            "name": forms.TextInput(attrs={"placeholder": "আপনার নাম (ঐচ্ছিক)"}),
            "ward": forms.TextInput(attrs={"placeholder": "যেমন: ৪ নং ওয়ার্ড"}),
            "village": forms.TextInput(attrs={"placeholder": "গ্রাম/পাড়ার নাম"}),
        }
        labels = {
            "kind": "ধরন",
            "name": "নাম",
            "phone": "মোবাইল",
            "ward": "ওয়ার্ড",
            "village": "গ্রাম/পাড়া",
            "message": "আপনার বার্তা",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._style()


class ChatForm(forms.Form):
    name = forms.CharField(label="নাম", max_length=80, required=False)
    phone = forms.CharField(label="মোবাইল", max_length=32, required=False)
    message = forms.CharField(label="বার্তা", max_length=1200, widget=forms.Textarea(attrs={"rows": 3}))


class PollVoteForm(forms.Form):
    option = forms.CharField(max_length=40)
