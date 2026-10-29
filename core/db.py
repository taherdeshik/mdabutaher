"""Database helpers shared by the public API and the dashboard."""

from django.conf import settings


def storage_label() -> str:
    """Short, human-readable name of the active database backend (for health/system APIs)."""
    engine = settings.DATABASES["default"]["ENGINE"]
    if "postgresql" in engine:
        return "postgresql"
    if "mysql" in engine:
        return "mysql"
    return "sqlite"
