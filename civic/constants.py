APPOINTMENT_SLOTS = [
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
]
# A slot is bookable until it holds this many active appointments.
SLOT_CAPACITY = 4

APPOINTMENT_TYPES = [
    {
        "id": "meeting",
        "label": "সরাসরি সাক্ষাৎ",
        "desc": "কার্যালয়ে ২০ মিনিটের আলোচনা",
        "icon": "users",
    },
    {
        "id": "problem",
        "label": "সমস্যা উপস্থাপন",
        "desc": "ব্যক্তিগত বা এলাকার সমস্যা জানানো",
        "icon": "alert",
    },
    {
        "id": "proposal",
        "label": "উন্নয়ন প্রস্তাব",
        "desc": "নতুন উদ্যোগ বা প্রকল্পের ধারণা",
        "icon": "lightbulb",
    },
    {
        "id": "media",
        "label": "মিডিয়া / সাক্ষাৎকার",
        "desc": "সাংবাদিক ও কনটেন্ট নির্মাতাদের জন্য",
        "icon": "mic",
    },
    {
        "id": "medical",
        "label": "স্বাস্থ্য সহায়তা",
        "desc": "চিকিৎসা ও রেফারেল সহায়তা",
        "icon": "stethoscope",
    },
    {"id": "other", "label": "অন্যান্য", "desc": "অন্য যেকোনো বিষয়ে কথা", "icon": "message"},
]

WARDS = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]

FEEDBACK_CATEGORIES = [
    "পানি ও স্যানিটেশন",
    "সড়ক ও যোগাযোগ",
    "স্বাস্থ্যসেবা",
    "শিক্ষা",
    "বিদ্যুৎ",
    "মাদক ও নিরাপত্তা",
    "পরিবেশ ও বর্জ্য",
    "সামাজিক নিরাপত্তা",
    "অন্যান্য",
]

FEEDBACK_KINDS = ["problem", "advice", "threat"]
FEEDBACK_SEVERITIES = ["low", "medium", "high", "critical"]

APPOINTMENT_MODES = ["in-person", "phone", "home-visit"]

VOLUNTEER_AVAILABILITY = [
    "সপ্তাহে ২–৪ ঘণ্টা",
    "সপ্তাহে ৫–১০ ঘণ্টা",
    "শুধু ইভেন্টের দিন",
    "পূর্ণ সময়",
]
