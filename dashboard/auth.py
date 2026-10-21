"""Who may use the dashboard API.

Access is granted by a Django session (cookie `mat_admin`) whose user has an
`AdminProfile`. The legacy `X-Admin-Key` header is accepted only when the
ADMIN_KEY setting is configured (migration aid), and acts as owner.
"""

from functools import wraps

from django.conf import settings
from django.http import HttpRequest
from django.utils.crypto import constant_time_compare

from civic.http import fail

from .models import AdminProfile

LEGACY_ACTOR = "legacy-key"


class Actor:
    __slots__ = ("username", "name", "role", "ward_id", "user")

    def __init__(
        self, username: str, name: str, role: str, ward_id: str = "", user=None
    ):
        self.username = username
        self.name = name
        self.role = role
        self.ward_id = ward_id
        self.user = user

    def can(self, roles) -> bool:
        return self.role in roles


ALL_ROLES = (
    AdminProfile.Role.OWNER,
    AdminProfile.Role.MANAGER,
    AdminProfile.Role.CAPTAIN,
)


def actor_for(request: HttpRequest) -> Actor | None:
    key = request.headers.get("X-Admin-Key", "")
    if settings.ADMIN_KEY and key and constant_time_compare(key, settings.ADMIN_KEY):
        return Actor(LEGACY_ACTOR, "Legacy Admin", AdminProfile.Role.OWNER)

    user = getattr(request, "user", None)
    if not user or not user.is_authenticated or not user.is_active:
        return None
    profile = AdminProfile.objects.filter(user=user).first()
    if profile is None:
        return None
    return Actor(
        username=user.get_username(),
        name=user.get_full_name() or user.get_username(),
        role=profile.role,
        ward_id=profile.ward_id,
        user=user,
    )


def api_admin(roles=ALL_ROLES):
    """Decorator for JSON admin endpoints. Returns 401 / 403 as the original did."""

    def decorator(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            actor = actor_for(request)
            if actor is None:
                return fail("লগইন প্রয়োজন", 401)
            if not actor.can(roles):
                return fail("এই কাজের অনুমতি নেই", 403)
            request.actor = actor
            return view(request, *args, **kwargs)

        return wrapped

    return decorator
