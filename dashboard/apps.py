from django.apps import AppConfig
from django.db.models.signals import post_migrate


class DashboardConfig(AppConfig):
    name = "dashboard"
    verbose_name = "কমান্ড সেন্টার ও CRM"

    def ready(self):
        from . import bootstrap

        post_migrate.connect(bootstrap.ensure_owner, sender=self)
