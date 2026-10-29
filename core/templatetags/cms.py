"""Editable page copy and media embeds.

``{% cms "home.001" %}default text{% endcms %}``
    Block form for static text. Renders the default unless the dashboard has an override.
``{% cms_str "home.010" "default" as label %}``
    For attribute values and ``{% include … with x=label %}`` arguments.
``{% media_embed item %}``
    Renders ``item.video`` (uploaded file, YouTube/Vimeo or direct link) and ``item.audio``.
"""

import re

from django import template
from django.utils.html import escape
from django.utils.safestring import mark_safe

from cms import store

register = template.Library()

YOUTUBE_ID = re.compile(r"(?:v=|/embed/|/shorts/|youtu\.be/)([A-Za-z0-9_-]{6,})")
VIMEO_ID = re.compile(r"vimeo\.com/(?:video/)?(\d+)")


class CmsBlockNode(template.Node):
    def __init__(self, key, nodelist):
        self.key = key
        self.nodelist = nodelist

    def render(self, context):
        key = self.key.resolve(context, ignore_failures=True)
        default = self.nodelist.render(context)
        override = store.text_value(str(key), None)
        if override is None:
            return default
        return mark_safe(escape(override).replace("\n", "<br>"))


@register.tag("cms")
def do_cms(parser, token):
    bits = token.split_contents()
    if len(bits) != 2:
        raise template.TemplateSyntaxError("{% cms \"key\" %} needs exactly one key.")
    key = parser.compile_filter(bits[1])
    nodelist = parser.parse(("endcms",))
    parser.delete_first_token()
    return CmsBlockNode(key, nodelist)


@register.simple_tag
def cms_str(key, default=""):
    return store.text_value(key, default)


def _video_html(value: str, title: str) -> str:
    url = store.resolve_ref(value)
    if not url:
        return ""
    label = escape(title or "ভিডিও")
    yt = YOUTUBE_ID.search(url)
    if yt and ("youtu" in url):
        src = f"https://www.youtube-nocookie.com/embed/{yt.group(1)}"
        return (
            f'<iframe class="h-full w-full" src="{escape(src)}" title="{label}" '
            'loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'
        )
    vm = VIMEO_ID.search(url)
    if vm:
        src = f"https://player.vimeo.com/video/{vm.group(1)}"
        return (
            f'<iframe class="h-full w-full" src="{escape(src)}" title="{label}" '
            'loading="lazy" allowfullscreen></iframe>'
        )
    return (
        f'<video class="h-full w-full bg-night" controls preload="metadata" playsinline '
        f'src="{escape(url)}" aria-label="{label}"></video>'
    )


def _audio_html(value: str, title: str) -> str:
    url = store.resolve_ref(value)
    if not url:
        return ""
    label = escape(title or "অডিও")
    return (
        f'<audio class="w-full" controls preload="none" src="{escape(url)}" '
        f'aria-label="{label}"></audio>'
    )


@register.simple_tag
def media_embed(item, css_class="mt-6"):
    """Render the video and/or audio attached to a content item (empty string if none)."""
    if not isinstance(item, dict):
        return ""
    title = str(item.get("title") or "")
    parts = []
    if item.get("video"):
        video = _video_html(str(item["video"]), title)
        if video:
            ratio = "aspect-video overflow-hidden rounded-3xl bg-night shadow-soft"
            parts.append(f'<div class="{escape(ratio)}">{video}</div>')
    if item.get("audio"):
        audio = _audio_html(str(item["audio"]), title)
        if audio:
            parts.append(f'<div class="rounded-2xl bg-white p-3 shadow-soft">{audio}</div>')
    if not parts:
        return ""
    return mark_safe(f'<div class="{escape(css_class)} space-y-3">' + "".join(parts) + "</div>")
