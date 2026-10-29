from django.apps import AppConfig
from django.db.models.signals import post_migrate


class CmsConfig(AppConfig):
    name = "cms"
    verbose_name = "কনটেন্ট ম্যানেজমেন্ট"

    def ready(self):
        from . import seed

        post_migrate.connect(seed.seed_defaults, sender=self)
