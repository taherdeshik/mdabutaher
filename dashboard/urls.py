"""Routes for the dashboard UI (/admin …) and its JSON API (/api/admin/…)."""

from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt

from . import api, views

app_name = "dashboard"

ui_urlpatterns = [
    path("admin/login", views.login_view, name="login"),
    path("admin/logout", views.logout_view, name="logout"),
    re_path(r"^admin/?$", views.home, name="home"),
    path("admin/analytics", views.analytics_page, name="analytics"),
    path("admin/users", views.users_page, name="users"),
]

api_urlpatterns = [
    path("auth/login/", csrf_exempt(api.auth_login), name="api-login"),
    path("auth/logout/", csrf_exempt(api.auth_logout), name="api-logout"),
    path("auth/me/", api.auth_me, name="api-me"),
    path("admin/overview/", api.overview, name="api-overview"),
    path(
        "admin/appointments/<str:pk>/", api.appointment_update, name="api-appointment"
    ),
    path("admin/feedback/<str:pk>/", api.feedback_update, name="api-feedback"),
    path("admin/leads/<str:pk>/", api.lead_update, name="api-lead"),
    path("admin/messages/<str:pk>/", api.message_update, name="api-message"),
    path("admin/export/", api.export_csv, name="api-export"),
    path("admin/backup/", api.backup, name="api-backup"),
    path("admin/analytics/", api.analytics_get, name="api-analytics"),
    path("admin/system/", api.system_get, name="api-system"),
    path("admin/users/", api.users_collection, name="api-users"),
    path("admin/users/<int:pk>/", api.user_detail, name="api-user"),
]
