from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),
    path("about", views.about, name="about"),
    path("manifesto", views.manifesto, name="manifesto"),
    path("manifesto/print", views.manifesto_print, name="manifesto-print"),
    path("campaign", views.campaign, name="campaign"),
    path("events", views.events, name="events"),
    path("events/<str:event_id>", views.event_detail, name="event-detail"),
    path("activities", views.activities, name="activities"),
    path("activities/<str:activity_id>", views.activity_detail, name="activity-detail"),
    path("news", views.news, name="news"),
    path("news/<str:news_id>", views.news_detail, name="news-detail"),
    path("blog", views.blog, name="blog"),
    path("blog/<slug:slug>", views.blog_detail, name="blog-detail"),
    path("gallery", views.gallery, name="gallery"),
    path("polls", views.polls, name="polls"),
    path("appointment", views.appointment, name="appointment"),
    path("appointment/status", views.appointment_status, name="appointment-status"),
    path("feedback", views.feedback, name="feedback"),
    path("feedback/board", views.feedback_board, name="feedback-board"),
    path("chat", views.chat, name="chat"),
    path("contact", views.contact, name="contact"),
    path("media-kit", views.media_kit, name="media-kit"),
    path("privacy", views.privacy, name="privacy"),
]
