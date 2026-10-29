"""JSON API for the dashboard content editor (owner and manager roles only)."""

from django.http import HttpRequest
from django.views.decorators.http import require_http_methods

from civic.http import fail, ok, parse_json
from dashboard.auth import api_admin
from dashboard.models import AdminProfile

from . import media, store
from .models import MediaAsset

EDIT_ROLES = (AdminProfile.Role.OWNER, AdminProfile.Role.MANAGER)


def _content_error(exc: store.ContentError):
    return fail(str(exc), exc.status, errors={"details": exc.errors})


def _asset_json(asset: MediaAsset) -> dict:
    return {
        "id": asset.pk,
        "kind": asset.kind,
        "title": asset.title,
        "alt": asset.alt,
        "url": store.asset_url(asset),
        "ref": f"asset:{asset.pk}",
        "mime": asset.mime,
        "size": asset.size,
        "external": bool(asset.external_url),
        "externalUrl": asset.external_url,
        "deletable": asset.is_deletable,
        "createdAt": asset.created_at.isoformat(),
    }


# --- content documents ----------------------------------------------------------


@api_admin(roles=EDIT_ROLES)
@require_http_methods(["GET"])
def documents_get(request: HttpRequest):
    return ok({"documents": store.list_documents()})


@api_admin(roles=EDIT_ROLES)
@require_http_methods(["GET", "PUT"])
def document_detail(request: HttpRequest, name: str):
    try:
        if request.method == "GET":
            return ok(store.get_document(name))
        body = parse_json(request)
        if not isinstance(body, dict) or "data" not in body:
            return fail("অবৈধ অনুরোধ", 400)
        return ok(
            store.save_document(
                name,
                body["data"],
                request.actor.username,
                expected_version=int(body.get("version") or 0),
            )
        )
    except store.ConflictError as exc:
        return fail(str(exc), 409, errors={"currentVersion": exc.current_version})
    except store.ContentError as exc:
        return _content_error(exc)


@api_admin(roles=EDIT_ROLES)
@require_http_methods(["POST"])
def document_reset(request: HttpRequest, name: str):
    try:
        return ok(store.reset_document(name, request.actor.username))
    except store.ConflictError as exc:
        return fail(str(exc), 409)
    except store.ContentError as exc:
        return _content_error(exc)


# --- page copy --------------------------------------------------------------------


@api_admin(roles=EDIT_ROLES)
@require_http_methods(["GET"])
def texts_get(request: HttpRequest):
    return ok({"texts": store.list_texts()})


@api_admin(roles=EDIT_ROLES)
@require_http_methods(["PUT"])
def text_detail(request: HttpRequest, key: str):
    body = parse_json(request)
    if not isinstance(body, dict) or not isinstance(body.get("value", ""), str):
        return fail("অবৈধ অনুরোধ", 400)
    try:
        return ok(store.save_text(key, body.get("value", ""), request.actor.username))
    except store.ContentError as exc:
        return _content_error(exc)


# --- media library ----------------------------------------------------------------


@api_admin(roles=EDIT_ROLES)
@require_http_methods(["GET", "POST"])
def media_collection(request: HttpRequest):
    actor = request.actor.username
    if request.method == "GET":
        qs = MediaAsset.objects.all()
        kind = request.GET.get("kind")
        if kind:
            qs = qs.filter(kind=kind)
        return ok({"assets": [_asset_json(a) for a in qs[:500]]})
    try:
        if request.FILES:
            asset = media.upload(
                request.FILES["file"],
                request.POST.get("kind", ""),
                request.POST.get("title", ""),
                request.POST.get("alt", ""),
                actor,
            )
        else:
            body = parse_json(request) or {}
            asset = media.add_link(
                body.get("kind", ""),
                body.get("url", ""),
                body.get("title", ""),
                body.get("alt", ""),
                actor,
            )
    except store.ContentError as exc:
        return _content_error(exc)
    except KeyError:
        return fail("ফাইল বেছে নিন।", 400)
    return ok(_asset_json(asset), status=201)


@api_admin(roles=EDIT_ROLES)
@require_http_methods(["PATCH", "DELETE"])
def media_detail(request: HttpRequest, pk: int):
    asset = MediaAsset.objects.filter(pk=pk).first()
    if asset is None:
        return fail("পাওয়া যায়নি", 404)
    try:
        if request.method == "DELETE":
            media.delete(asset, request.actor.username)
            return ok({"deleted": True})
        body = parse_json(request)
        if not isinstance(body, dict):
            return fail("অবৈধ অনুরোধ", 400)
        return ok(_asset_json(media.update(asset, body, request.actor.username)))
    except store.ContentError as exc:
        return _content_error(exc)
