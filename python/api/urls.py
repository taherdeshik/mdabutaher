from django.urls import path

from . import views

app_name = "api"

urlpatterns = [
    path("health/", views.health, name="health"),
    path("site/ticker/", views.ticker, name="ticker"),
    path("site/summary/", views.summary, name="summary"),
]
