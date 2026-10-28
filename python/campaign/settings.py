"""
মোঃ আবু তাহের — ক্যাম্পেইন সাইট
Django 5.2 + PostgreSQL settings.

DATABASE_URL থাকলে PostgreSQL ব্যবহার হয়; না থাকলে লোকাল SQLite
(ডেমো, টেস্ট ও GitHub Pages-স্টাইলের স্ট্যাটিক প্রিভিউর জন্য)।
"""
from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import unquote, urlparse

BASE_DIR = Path(__file__).resolve().parent.parent

# --------------------------------------------------------------------------
# মূল সেটিংস
# --------------------------------------------------------------------------
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "dev-only-not-secret-please-set-DJANGO_SECRET_KEY-in-production-0h9q2",
)
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"

ALLOWED_HOSTS = [h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",") if h.strip()] or ["*"]

csrf = os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf.split(",") if o.strip()]
if DEBUG and not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = ["https://*.e2b.app", "http://localhost:8000", "http://127.0.0.1:8000"]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
    "accounts",
    "content",
    "crm",
    "web",
    "dashboard",
    "api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "web.middleware.VisitorMiddleware",
]

ROOT_URLCONF = "campaign.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "web.context.chrome",
            ],
        },
    },
]

WSGI_APPLICATION = "campaign.wsgi.application"
ASGI_APPLICATION = "campaign.asgi.application"

# --------------------------------------------------------------------------
# ডেটাবেস — PostgreSQL (প্রাইমারি), নাহলে SQLite
# --------------------------------------------------------------------------
def _database_from_url(url: str) -> dict:
    parts = urlparse(url)
    engine = {
        "postgres": "django.db.backends.postgresql",
        "postgresql": "django.db.backends.postgresql",
        "pgsql": "django.db.backends.postgresql",
        "mysql": "django.db.backends.mysql",
        "sqlite": "django.db.backends.sqlite3",
    }.get(parts.scheme, "django.db.backends.postgresql")
    if engine.endswith("sqlite3"):
        return {"ENGINE": engine, "NAME": unquote(parts.path.lstrip("/")) or str(BASE_DIR / "db.sqlite3")}
    config = {
        "ENGINE": engine,
        "NAME": unquote(parts.path.lstrip("/")),
        "USER": unquote(parts.username or ""),
        "PASSWORD": unquote(parts.password or ""),
        "HOST": parts.hostname or "",
        "PORT": str(parts.port or ""),
    }
    options = dict(pair.split("=", 1) for pair in parts.query.split("&") if "=" in pair)
    if options.get("host"):  # unix-socket style DSN: postgresql://user@/db?host=/var/run/postgresql
        config["HOST"] = options["host"]
    if options.get("port"):
        config["PORT"] = options["port"]
    if options.get("sslmode"):
        config["OPTIONS"] = {"sslmode": options["sslmode"]}
    return config


DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
if DATABASE_URL:
    DATABASES = {"default": _database_from_url(DATABASE_URL)}
elif os.environ.get("POSTGRES_DB"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ["POSTGRES_DB"],
            "USER": os.environ.get("POSTGRES_USER", "postgres"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", ""),
            "HOST": os.environ.get("POSTGRES_HOST", "127.0.0.1"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 60,
            "OPTIONS": {"sslmode": os.environ.get("POSTGRES_SSLMODE", "prefer")},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
            "OPTIONS": {"timeout": 20},
        }
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
LOGIN_URL = "/admin/login/"
LOGIN_REDIRECT_URL = "/admin/"
LOGOUT_REDIRECT_URL = "/"

LANGUAGE_CODE = "bn"
TIME_ZONE = "Asia/Dhaka"
USE_I18N = True
USE_TZ = True

# --------------------------------------------------------------------------
# স্ট্যাটিক ও মিডিয়া
# --------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
if DEBUG:
    # ম্যানিফেস্ট ছাড়া (collectstatic না চালিয়েও) লোকাল ডেভ চলবে
    STORAGES["staticfiles"] = {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"}

FILE_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 12 * 1024 * 1024

# --------------------------------------------------------------------------
# ক্যাম্পেইন কনস্ট্যান্ট + সেশন/সিকিউরিটি
# --------------------------------------------------------------------------
SESSION_COOKIE_AGE = 60 * 60 * 12
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
X_FRAME_OPTIONS = "SAMEORIGIN"
if not DEBUG:
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = os.environ.get("DJANGO_SECURE_COOKIES", "1") == "1"
    CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
    SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_HSTS_SECONDS", "0"))

MESSAGE_STORAGE = "django.contrib.messages.storage.session.SessionStorage"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO")},
}
