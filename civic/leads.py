"""CRM lead helper: one lead per phone number, updated on repeat contact."""

from .models import Lead


def push_lead(*, name: str, phone: str, ward: str, source: str, note: str = "") -> Lead:
    lead = Lead.objects.filter(phone=phone).first()
    if lead:
        if note and not lead.note:
            lead.note = note[:300]
        lead.save()  # bumps updated_at
        return lead
    return Lead.objects.create(
        name=name[:80],
        phone=phone,
        ward=ward,
        source=source,
        tags=[source],
        note=note[:300],
    )
