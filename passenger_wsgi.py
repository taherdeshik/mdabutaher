"""Entry point for cPanel "Setup Python App" (Phusion Passenger).

In cPanel set the application startup file to `passenger_wsgi.py` and the
callable to `application`. Put secrets in `.env` (see `.env.example`).
"""

import os
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mahadan.settings")

from mahadan.wsgi import application as application  # noqa: E402  (must follow sys.path setup)
