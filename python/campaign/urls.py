from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from web.media import serve_media

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("admin/", include("dashboard.urls")),
    path("api/", include("api.urls")),
    path("", include("web.urls")),
    re_path(r"^media/(?P<path>.*)$", serve_media),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
