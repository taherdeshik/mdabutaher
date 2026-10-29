"""Django settings for the মহাদান ইউনিয়ন প্রচারণা প্ল্যাটফর্ম.

Configuration is read from environment variables (see `.env.example`).
Database: set POSTGRES_* for PostgreSQL (preferred), MYSQL_* for MySQL/MariaDB,
or neither to use a local SQLite file (development default). See `.env.example`.
"""

import os
from pathlib import Path

from mahadan.origins import csrf_trusted_origins

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv(path: Path) -> None:
    """Minimal .env reader (KEY=VALUE, # comments). Real environment variables win."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv(BASE_DIR / ".env")


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def env_bool(name: str, default: bool = False) -> bool:
    raw = env(name, "1" if default else "0").lower()
    return raw in {"1", "true", "yes", "on"}


DEBUG = env_bool("DJANGO_DEBUG", default=True)

SECRET_KEY = env("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG:
        raise RuntimeError("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is off.")
    SECRET_KEY = "dev-only-insecure-key-change-me"

ALLOWED_HOSTS = [
    h.strip()
    for h in env("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0").split(",")
    if h.strip()
]
# Preview hosts used by the sandbox / hosting proxy.
if DEBUG:
    ALLOWED_HOSTS += [".e2b.app", ".localhost"]

# Derived from ALLOWED_HOSTS (leading-dot hosts become https://*.domain wildcards).
# DJANGO_CSRF_TRUSTED_ORIGINS adds explicit extra origins, comma-separated.
CSRF_TRUSTED_ORIGINS = csrf_trusted_origins(
    ALLOWED_HOSTS, extra=env("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
)
SITE_URL = env("SITE_URL", "https://mdabutaher.com").rstrip("/")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "core",
    "civic",
    "dashboard",
    "cms",
]

MIDDLEWARE = [
    "core.middleware.TrailingSlashMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "mahadan.urls"

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
                "core.context_processors.site",
            ],
        },
    },
]

WSGI_APPLICATION = "mahadan.wsgi.application"

# --- database -----------------------------------------------------------------
# Backend selection (first match wins):
#   1. PostgreSQL  – POSTGRES_HOST + POSTGRES_DB            (recommended)
#   2. MySQL/MariaDB – MYSQL_HOST + MYSQL_DATABASE          (legacy cPanel setup)
#   3. SQLite      – data/db.sqlite3                        (local development default)
if env("POSTGRES_HOST") and env("POSTGRES_DB"):
    _pg_options = {}
    if env("POSTGRES_SSLMODE"):
        _pg_options["sslmode"] = env("POSTGRES_SSLMODE")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB"),
            "USER": env("POSTGRES_USER"),
            "PASSWORD": env("POSTGRES_PASSWORD"),
            "HOST": env("POSTGRES_HOST"),
            "PORT": env("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": int(env("POSTGRES_CONN_MAX_AGE", "60")),
            "CONN_HEALTH_CHECKS": True,
            "OPTIONS": _pg_options,
        }
    }
elif env("MYSQL_HOST") and env("MYSQL_DATABASE"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": env("MYSQL_DATABASE"),
            "USER": env("MYSQL_USER"),
            "PASSWORD": env("MYSQL_PASSWORD"),
            "HOST": env("MYSQL_HOST"),
            "PORT": env("MYSQL_PORT", "3306"),
            "OPTIONS": {
                "charset": "utf8mb4",
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
                **({"ssl": {"ssl": True}} if env_bool("MYSQL_SSL") else {}),
            },
        }
    }
else:
    _sqlite_path = Path(env("SQLITE_PATH", str(BASE_DIR / "data" / "db.sqlite3")))
    _sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": str(_sqlite_path),
        }
    }

# --- auth -----------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
]
LOGIN_URL = "dashboard:login"
LOGIN_REDIRECT_URL = "dashboard:home"
LOGOUT_REDIRECT_URL = "dashboard:login"
SESSION_COOKIE_AGE = 7 * 24 * 3600
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_NAME = "mat_admin"
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# Production behind a TLS-terminating proxy (cPanel / Passenger / Cloudflare).
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
    SECURE_HSTS_SECONDS = int(env("DJANGO_HSTS_SECONDS", "3600") or 0)
    SECURE_CONTENT_TYPE_NOSNIFF = True

# Bootstrap owner account (created once by the post_migrate hook when no users exist).
ADMIN_BOOTSTRAP = {
    "name": env("ADMIN_NAME", "প্রধান অ্যাডমিন"),
    "username": env("ADMIN_USERNAME", "admin").lower(),
    "password": env("ADMIN_PASSWORD") or ("mahadan-2027" if DEBUG else ""),
}

# --- i18n / time ------------------------------------------------------------------
LANGUAGE_CODE = "bn"
TIME_ZONE = "Asia/Dhaka"
USE_I18N = True
USE_TZ = True

# --- static files -------------------------------------------------------------------
STATIC_URL = "/static/"

# --- uploads (dashboard media library) ----------------------------------------
MEDIA_ROOT = Path(env("MEDIA_ROOT", str(BASE_DIR / "uploads")))
MEDIA_URL = "/uploads/"
# Video/audio limit in MB; images are capped separately at IMAGE_UPLOAD_MAX_MB.
UPLOAD_MAX_MB = int(env("UPLOAD_MAX_MB", "60"))
IMAGE_UPLOAD_MAX_MB = int(env("IMAGE_UPLOAD_MAX_MB", "15"))
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
# How long a process caches content/texts before re-reading the database.
CMS_CACHE_SECONDS = int(env("CMS_CACHE_SECONDS", "10"))
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
        if not DEBUG
        else "django.contrib.staticfiles.storage.StaticFilesStorage"
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- civic settings ------------------------------------------------------------------
# Optional geo headers from the hosting edge (Cloudflare / Vercel style).
GEO_COUNTRY_HEADERS = ("HTTP_X_VERCEL_IP_COUNTRY", "HTTP_CF_IPCOUNTRY")
GEO_CITY_HEADERS = ("HTTP_X_VERCEL_IP_CITY", "HTTP_CF_IPCITY")
GEO_REGION_HEADERS = ("HTTP_X_VERCEL_IP_COUNTRY_REGION", "HTTP_CF_REGION")

# Legacy single-key admin access (migration only). Disabled unless set.
ADMIN_KEY = env("ADMIN_KEY")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
