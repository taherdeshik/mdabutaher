from . import js_copy, store


def site_copy(request):
    """Current text for the messages used by static/js/site.js (rendered as JSON in base.html)."""
    return {"site_copy": {key: store.text_value(key, default) for key, default in js_copy.JS_COPY}}
