"""cPanel → Setup Python App (Passenger) এন্ট্রি পয়েন্ট।

cPanel যা যা জিজ্ঞেস করে:
  Application root        : python  (এই ফোল্ডার)
  Application startup file: passenger_wsgi.py
  Application Entry point : application
তারপর Terminal-এ:  pip install -r requirements.txt
                    python manage.py migrate
                    python manage.py seed_content
                    python manage.py collectstatic --noinput
"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campaign.settings")

# .env ফাইল থাকলে লোড করুন (cPanel-এ Environment Variables-ও ব্যবহার করা যায়)
env_file = BASE_DIR / ".env"
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

from campaign.wsgi import application  # noqa: E402  (Passenger `application` খোঁজে)
