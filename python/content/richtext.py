"""REST-এর `rich-text.tsx`-এর Python সংস্করণ।

মার্কডাউন-সদৃশ সাবসেট → নিরাপদ HTML। ইনপুট আগে escape হয়, তাই কোনো
HTML ইনজেকশন সম্ভব নয়; লিংক শুধু http(s)/আপেক্ষিক/mailto/tel অনুমোদিত।
"""
from __future__ import annotations

import html
import re
from urllib.parse import quote

SAFE_URL = re.compile(r"^(https?://|/(?!/)|mailto:|tel:)", re.I)
_INLINE = re.compile(r"(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))")
_IMG = re.compile(r"^!\[(?P<alt>[^\]]*)\]\((?P<url>[^)\s]+)\)$")
_LINK = re.compile(r"^\[(?P<text>[^\]]+)\]\((?P<url>[^)\s]+)\)$")
_OL = re.compile(r"^([0-9০-৯]+)[.)]\s+(.*)$")
_UL = re.compile(r"^[-*•]\s+(.*)$")


def _url(url: str) -> str:
    url = html.unescape(url.strip())
    if not SAFE_URL.match(url):
        return ""
    return html.escape(url, quote=True)


def _inline(text: str) -> str:
    out, pos = [], 0
    for match in _INLINE.finditer(text):
        out.append(html.escape(text[pos : match.start()]))
        token = match.group(0)
        if token.startswith("**"):
            out.append(f"<strong>{html.escape(token[2:-2])}</strong>")
        elif token.startswith("`"):
            out.append(f"<code>{html.escape(token[1:-1])}</code>")
        elif token.startswith("["):
            m = _LINK.match(token)
            url = _url(m.group("url")) if m else ""
            label = html.escape(m.group("text")) if m else html.escape(token)
            out.append(f'<a href="{url}" rel="noopener">{label}</a>' if url else label)
        else:
            # *i* / *বাংলা* — শুধু একক তারা
            out.append(f"<em>{html.escape(token[1:-1])}</em>")
        pos = match.end()
    out.append(html.escape(text[pos:]))
    return "".join(out)


def render_rich(source: str) -> str:
    """`rich` লেখা → HTML (p, h2–h4, ul, ol, blockquote, hr, figure)।"""
    if not source:
        return ""
    lines = source.replace("\r\n", "\n").split("\n")
    html_parts: list[str] = []
    list_type: str | None = None
    para: list[str] = []

    def close_para() -> None:
        if para:
            html_parts.append(f"<p>{_inline(' '.join(para).strip())}</p>")
            para.clear()

    def close_list() -> None:
        nonlocal list_type
        if list_type:
            html_parts.append(f"</{list_type}>")
            list_type = None

    for raw in lines:
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped:
            close_para()
            close_list()
            continue
        if stripped in {"---", "***", "___"}:
            close_para()
            close_list()
            html_parts.append("<hr />")
            continue
        img = _IMG.match(stripped)
        if img:
            close_para()
            close_list()
            url = _url(img.group("url"))
            if url:
                alt = html.escape(img.group("alt"))
                html_parts.append(
                    f'<figure><img src="{url}" alt="{alt}" loading="lazy" />'
                    + (f"<figcaption>{alt}</figcaption>" if alt else "")
                    + "</figure>"
                )
            continue
        heading = re.match(r"^(#{2,4})\s+(.*)$", stripped)
        if heading:
            close_para()
            close_list()
            level = len(heading.group(1))
            html_parts.append(f"<h{level}>{_inline(heading.group(2))}</h{level}>")
            continue
        if stripped.startswith(">"):
            close_para()
            close_list()
            html_parts.append(f"<blockquote>{_inline(stripped.lstrip('> ').strip())}</blockquote>")
            continue
        ordered = _OL.match(stripped)
        unordered = _UL.match(stripped)
        if ordered or unordered:
            close_para()
            want = "ol" if ordered else "ul"
            if list_type != want:
                close_list()
                html_parts.append(f"<{want}>")
                list_type = want
            body = ordered.group(2) if ordered else unordered.group(1)
            html_parts.append(f"<li>{_inline(body)}</li>")
            continue
        close_list()
        para.append(stripped)

    close_para()
    close_list()
    return "\n".join(html_parts)


def plain_text(source: str) -> str:
    """SEO/JSON-LD-এর জন্য রিচ লেখা → সাধারণ টেক্সট।"""
    if not source:
        return ""
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", source)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[#>*`_]", "", text)
    return " ".join(text.split())


def media_url(path: str) -> str:
    return quote(path, safe="/")
