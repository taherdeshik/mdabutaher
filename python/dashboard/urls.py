from django.urls import path

from . import views

app_name = "dashboard"

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("", views.overview, name="overview"),
    path("coverage/", views.coverage, name="coverage"),
    path("plan/", views.plan, name="plan"),
    path("team/", views.team, name="team"),
    path("challenges/", views.challenges, name="challenges"),
    path("money/", views.money, name="money"),
    path("cms/", views.cms, name="cms"),
    path("cms/new/", views.post_edit, name="post_new"),
    path("cms/<int:pk>/", views.post_edit, name="post_edit"),
    path("cms/<int:pk>/delete/", views.post_delete, name="post_delete"),
    path("site/", views.site_pages, name="site"),
    path("home/", views.home_sections, name="home"),
    path("gallery/", views.gallery, name="gallery"),
    path("items/", views.items, name="items"),
    path("ticker/", views.ticker, name="ticker"),
    path("crm/", views.crm, name="crm"),
    path("media/", views.media, name="media"),
    path("settings/", views.settings, name="settings"),
    path("analytics/", views.analytics, name="analytics"),
    path("export/<str:kind>.csv", views.export_csv, name="export"),
]
