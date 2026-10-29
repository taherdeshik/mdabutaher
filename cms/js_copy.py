"""Bengali messages and labels used by ``static/js/site.js``.

The browser script reads these from ``<script id="site-copy">`` (see ``context_processors``),
so the dashboard text editor can change them like any other page copy. Defaults live here;
an empty override falls back to the default. Keys follow the same ``[a-z0-9_.]`` pattern as
template keys.
"""

JS_PAGE = "স্ক্রিপ্ট (site.js)"

JS_COPY: list[tuple[str, str]] = [
    # generic API / form messages
    ("js.api.no_reply", "সার্ভার থেকে উত্তর পাওয়া যায়নি"),
    ("js.api.generic", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।"),
    ("js.net.error", "নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।"),
    ("js.form.success", "সফলভাবে জমা হয়েছে।"),
    # appointments
    ("js.appt.slot_full", "এই সময়টি পূর্ণ"),
    ("js.appt.pending", "অপেক্ষমাণ"),
    ("js.appt.confirmed", "নিশ্চিত"),
    ("js.appt.completed", "সম্পন্ন"),
    ("js.appt.cancelled", "বাতিল"),
    ("js.status.found", "{n} টি অ্যাপয়েন্টমেন্ট পাওয়া গেছে"),
    ("js.status.none", "এই নম্বরে কোনো অ্যাপয়েন্টমেন্ট নেই"),
    ("js.status.ref", "রেফারেন্স"),
    ("js.status.label", "স্ট্যাটাস"),
    # feedback
    ("js.photo.too_big", "ছবির আকার সর্বোচ্চ ১.৫ MB"),
    ("js.my.none", "কোনো রিপোর্ট নেই"),
    ("js.board.none", "এখনো কোনো রিপোর্ট নেই।"),
    ("js.board.kind.problem", "সমস্যা"),
    ("js.board.kind.advice", "পরামর্শ"),
    ("js.board.kind.threat", "হুমকি"),
    ("js.board.state.new", "নতুন"),
    ("js.board.state.reviewing", "পর্যালোচনায়"),
    ("js.board.state.in_progress", "কাজ চলছে"),
    ("js.board.state.resolved", "সমাধান"),
    ("js.board.ward", "ওয়ার্ড"),
    ("js.board.status_label", "অবস্থা"),
    ("js.board.support", "সমর্থন"),
    ("js.stat.total", "মোট"),
    ("js.stat.resolved", "সমাধান"),
    ("js.stat.in_progress", "চলমান"),
    ("js.stat.threats", "হুমকি"),
    ("js.stat.avg_support", "গড় সমর্থন"),
    # chat and lightbox
    ("js.chat.greeting", "আসসালামু আলাইকুম! আপনাকে কীভাবে সাহায্য করতে পারি?"),
    ("js.lightbox.close", "বন্ধ করুন"),
]

JS_KEYS = tuple(k for k, _ in JS_COPY)
