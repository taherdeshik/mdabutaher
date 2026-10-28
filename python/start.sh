#!/usr/bin/env bash
# VPS / Docker-এ চালানোর সহজ স্ক্রিপ্ট
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

python manage.py migrate --noinput
python manage.py seed_content
python manage.py collectstatic --noinput

exec gunicorn campaign.wsgi:application \
  --bind "${BIND:-0.0.0.0:${PORT:-8000}}" \
  --workers "${WORKERS:-3}" \
  --timeout 90 \
  --access-logfile - \
  --error-logfile -
