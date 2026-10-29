from django.urls import path, re_path

from . import api, views

app_name = "cms"

ui_urlpatterns = [
    path("admin/content", views.content_page, name="content"),
    re_path(r"^uploads/(?P<path>.+)$", views.serve_upload, name="upload"),
]

api_urlpatterns = [
    path("admin/content/", api.documents_get, name="api-documents"),
    path("admin/content/<slug:name>/", api.document_detail, name="api-document"),
    path("admin/content/<slug:name>/reset/", api.document_reset, name="api-document-reset"),
    path("admin/texts/", api.texts_get, name="api-texts"),
    path("admin/texts/<str:key>/", api.text_detail, name="api-text"),
    path("admin/media/", api.media_collection, name="api-media"),
    path("admin/media/<int:pk>/", api.media_detail, name="api-media-detail"),
]
