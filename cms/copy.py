"""Editable copy for server-side text: API/form messages, page titles and option lists.

Three seeded documents hold this copy (``content/data/*.json``):

* ``messages`` — flat ``"area.name": "text"`` pairs for API responses, form errors,
  rate-limit and calendar text. Values may contain ``{name}`` placeholders.
* ``pages`` — flat pairs for page titles, meta descriptions and breadcrumb labels.
* ``options`` — lists of appointment types, modes, feedback kinds, wards and similar.
  Business logic only relies on the fixed ``id`` values (see ``civic/constants.py``).

Lookups read the cached document, so dashboard edits apply within ``CMS_CACHE_SECONDS``.
A missing key falls back to the key itself instead of raising, so a damaged document
shows a visible placeholder rather than a 500 error.
"""

from django.utils.functional import lazy

from . import store


def _lookup(document: str, key: str, values: dict) -> str:
    text = store.load_document(document).get(key)
    if not isinstance(text, str):
        text = key
    for name, value in values.items():
        text = text.replace("{" + name + "}", str(value))
    return text


def message_text(key: str, **values) -> str:
    """Return an API/form message, filling ``{name}`` placeholders from ``values``."""
    return _lookup("messages", key, values)


def page_text(key: str, **values) -> str:
    """Return a page title, description or label from the ``pages`` document."""
    return _lookup("pages", key, values)


def option_list(name: str) -> list:
    """Return an editable list from the ``options`` document (for example ``wards``)."""
    return store.load_document("options")[name]


# Form field errors are defined at import time, so they resolve when rendered.
message_text_lazy = lazy(message_text, str)
