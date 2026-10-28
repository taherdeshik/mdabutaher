from __future__ import annotations

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from content import data, services


@require_GET
def health(request):
    db_ok = True
    vendor = "unknown"
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        vendor = connection.vendor
    except Exception:  # pragma: no cover
        db_ok = False
    return JsonResponse({"ok": db_ok, "database": vendor, "app": "mdabutaher"})


@require_GET
def ticker(request):
    payload = services.ticker()
    response = JsonResponse({"ok": True, "data": payload})
    response["Cache-Control"] = "no-store"
    return response


@require_GET
def summary(request):
    return JsonResponse(
        {
            "ok": True,
            "data": {
                "site": data.site()["name"],
                "events": len(services.upcoming_events()),
                "posts": len(list(services.posts())),
                "manifesto": services.manifesto_totals(),
            },
        }
    )
