from django.conf import settings
from django.utils import timezone

from . import content


def site(request):
    return {
        "site": content.site(),
        "nav": content.nav(),
        "site_url": settings.SITE_URL,
        "current_year": timezone.localdate().year,
        "photo_credit": content.load("media")["photoCredit"],
        "page_media": content.load("site").get("pageMedia") or {},
    }
