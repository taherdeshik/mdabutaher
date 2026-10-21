from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from core import seo, views as core_views
from dashboard.urls import ui_urlpatterns, api_urlpatterns

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include((api_urlpatterns, "dashboard-api"))),
    path("api/", include("civic.urls")),
    path("", include("core.urls")),
    path("", include((ui_urlpatterns, "dashboard"))),
    path("sitemap.xml", seo.sitemap, name="sitemap"),
    path("robots.txt", seo.robots, name="robots"),
    path("feed.xml", seo.feed, name="feed"),
    path("manifest.webmanifest", seo.manifest, name="manifest"),
]

handler404 = core_views.not_found
handler500 = core_views.server_error

if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0]
    )
