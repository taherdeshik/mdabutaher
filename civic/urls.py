"""Public API routes, mounted at /api/."""

from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from . import api
from .http import fail


def by_method(**handlers):
    """Route one URL to several handlers by HTTP method (GET / POST / PATCH …).

    Public endpoints take JSON from the browser without a session, so they are
    CSRF-exempt. They are protected by rate limits and strict validation instead.
    """

    def view(request, *args, **kwargs):
        handler = handlers.get(request.method or "GET")
        if handler is None:
            return fail(
                "এই পদ্ধতি অনুমোদিত নয়", 405, headers={"Allow": ", ".join(handlers)}
            )
        return handler(request, *args, **kwargs)

    return csrf_exempt(view)


urlpatterns = [
    path(
        "appointments/",
        by_method(GET=api.appointments_get, POST=api.appointments_post),
        name="appointments",
    ),
    path(
        "appointment-types/",
        by_method(GET=api.appointment_types_get),
        name="appointment-types",
    ),
    path(
        "feedback/",
        by_method(GET=api.feedback_get, POST=api.feedback_post),
        name="feedback",
    ),
    path(
        "feedback/<str:feedback_id>/support/",
        by_method(POST=api.feedback_support),
        name="feedback-support",
    ),
    path("polls/", by_method(GET=api.polls_get), name="polls"),
    path("polls/<str:poll_id>/vote/", by_method(POST=api.poll_vote), name="poll-vote"),
    path("events/<str:event_id>/", by_method(GET=api.event_seats), name="event-seats"),
    path(
        "events/<str:event_id>/register/",
        by_method(POST=api.event_register),
        name="event-register",
    ),
    path("calendar/ics/", by_method(GET=api.events_calendar), name="calendar"),
    path("volunteers/", by_method(POST=api.volunteers_post), name="volunteers"),
    path("contact/", by_method(POST=api.contact_post), name="contact"),
    path("newsletter/", by_method(POST=api.newsletter_post), name="newsletter"),
    path("chat/", by_method(POST=api.chat_post), name="chat"),
    path("stats/", by_method(GET=api.stats_get), name="stats"),
    path("health/", by_method(GET=api.health_get), name="health"),
    path("track/", by_method(POST=api.track_post), name="track"),
]
