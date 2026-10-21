"""First-run owner account, created from ADMIN_* settings after migrate."""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)


def ensure_owner(sender=None, **kwargs):
    from .models import AdminProfile

    User = get_user_model()
    if AdminProfile.objects.exists():
        return
    boot = settings.ADMIN_BOOTSTRAP
    if not boot["password"]:
        logger.warning(
            "No dashboard owner exists. Set ADMIN_PASSWORD and run migrate again."
        )
        return
    user, created = User.objects.get_or_create(
        username=boot["username"],
        defaults={"first_name": boot["name"], "is_staff": True},
    )
    if created:
        user.set_password(boot["password"])
        user.save()
    AdminProfile.objects.get_or_create(
        user=user, defaults={"role": AdminProfile.Role.OWNER}
    )
    logger.info("Created dashboard owner account '%s'.", boot["username"])
