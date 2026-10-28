from django.urls import path

from . import views

app_name = "web"

urlpatterns = [
    path("", views.home, name="home"),
    path("about/", views.about, name="about"),
    path("activities/", views.activities, name="activities"),
    path("manifesto/", views.manifesto, name="manifesto"),
    path("manifesto/print/", views.manifesto_print, name="manifesto_print"),
    path("campaign/", views.campaign, name="campaign"),
    path("events/", views.events, name="events"),
    path("events/<slug:slug>/", views.event_detail, name="event_detail"),
    path("blog/", views.blog, name="blog"),
    path("blog/<slug:slug>/", views.post_detail, name="blog_detail"),
    path("news/", views.news, name="news"),
    path("news/<slug:slug>/", views.post_detail, name="news_detail"),
    path("polls/", views.polls, name="polls"),
    path("gallery/", views.gallery_redirect, name="gallery_index"),
    path("gallery/<str:tab>/", views.gallery, name="gallery"),
    path("video-gallery/", views.gallery_redirect, name="video_gallery"),
    path("appointment/", views.appointment, name="appointment"),
    path("feedback/", views.feedback, name="feedback"),
    path("chat/", views.chat, name="chat"),
    path("contact/", views.contact, name="contact"),
    path("media-kit/", views.media_kit, name="media_kit"),
    path("privacy/", views.privacy, name="privacy"),
    path("robots.txt", views.robots, name="robots"),
    path("sitemap.xml", views.sitemap, name="sitemap"),
    path("feed.xml", views.feed, name="feed"),
    path("manifest.webmanifest", views.manifest, name="manifest"),
]
