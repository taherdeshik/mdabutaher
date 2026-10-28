"""পুরোনো Next.js অ্যাপের `public/media/*` ছবি → Django-র `media/` ফোল্ডারে কপি।

ডিপ্লয়ে সময় শুধু `python/` ফোল্ডার আপলোড করলে ছবিগুলো হারিয়ে যায়;
তাই একবার এই কমান্ড চালালেই সব ছবি স্বয়ংসম্পূর্ণ হয়ে যায়।

    python manage.py collect_media            # কপি (আগে থেকে থাকলে বাদ)
    python manage.py collect_media --force    # আবার লিখে দেয়
    python manage.py collect_media --source /path/to/public/media
"""
from __future__ import annotations

import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

SKIP_DIRS = {"uploads"}  # আপলোড ফোল্ডার কখনো ওভাররাইট নয়
PATTERNS = ("*.webp", "*.jpg", "*.jpeg", "*.png", "*.svg", "*.mp4", "*.pdf")


class Command(BaseCommand):
    help = "পুরোনো public/media আর্কাইভ Django media/ ফোল্ডারে কপি করে"

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default=str(Path(settings.BASE_DIR).parent / "public" / "media"),
            help="সোর্স ফোল্ডার (ডিফল্ট: ../public/media)",
        )
        parser.add_argument("--force", action="store_true", help="থাকা সত্ত্বেও আবার কপি করে")

    def handle(self, *args, **options):
        source = Path(options["source"]).expanduser().resolve()
        target = Path(settings.MEDIA_ROOT)
        if not source.is_dir():
            self.stdout.write(self.style.ERROR(f"সোর্স ফোল্ডার নেই: {source}"))
            return

        copied = skipped = 0
        total_bytes = 0
        for pattern in PATTERNS:
            for file in source.rglob(pattern):
                relative = file.relative_to(source)
                if relative.parts and relative.parts[0] in SKIP_DIRS:
                    continue
                destination = target / relative
                if destination.exists() and not options["force"]:
                    skipped += 1
                    continue
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(file, destination)
                copied += 1
                total_bytes += file.stat().st_size

        self.stdout.write(
            self.style.SUCCESS(
                f"{copied} ফাইল কপি ({total_bytes / 1024 / 1024:.1f} MB), {skipped} আগে থেকেই ছিল → {target}"
            )
        )
