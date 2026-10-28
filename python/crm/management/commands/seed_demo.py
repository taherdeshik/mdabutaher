"""ডেমো CRM ডেটা — ড্যাশবোর্ড প্রথমবার দেখানোর জন্য।

    python manage.py seed_demo           # খালি থাকলে ডেমো ডেটা
    python manage.py seed_demo --force   # ডেমো সারিগুলো মুছে আবার তৈরি
    python manage.py seed_demo --clear   # শুধু ডেমো ডেটা মুছে ফেলুন

বাস্তব ক্যাম্পেইন শুরু করার আগে `--clear` দিয়ে ডেমো ডেটা মুছে ফেলুন;
এরপর আসল পরিবার/কর্মী/খরচ যোগ করুন।
"""
from __future__ import annotations

import datetime as dt
import random

from django.core.management.base import BaseCommand
from django.db import transaction

from crm.models import (
    Appointment,
    Booth,
    Challenge,
    Conversation,
    Expense,
    Feedback,
    Household,
    Message,
    Task,
    TeamMember,
    Visit,
    VisitorEvent,
    Ward,
)

RNG = random.Random(2027)

BOOTH_NAMES = [
    ("বটতলা সরকারি প্রাথমিক বিদ্যালয়", "শিক্ষা ভবন", ["বটতলা", "মধ্যপাড়া"]),
    ("বাজার জামে মসজিদ", "বাজার", ["মহাদান বাজার", "কলাবাগান"]),
    ("ইউনিয়ন পরিষদ ভবন", "পরিষদ", ["সদর", "নতুনপাড়া"]),
    ("আদর্শ উচ্চ বিদ্যালয়", "বিদ্যালয়", ["চরপাড়া", "পূর্বপাড়া"]),
    ("কমিউনিটি ক্লিনিক", "ক্লিনিক", ["পশ্চিমপাড়া", "খালপাড়া"]),
]

TEAM = [
    ("মোঃ রফিকুল ইসলাম", "manager", "01711-203001"),
    ("সালমা আক্তার", "finance", "01711-203002"),
    ("তানভীর হাসান", "media", "01711-203003"),
    ("আব্দুল করিম", "ward-captain", "01711-203004"),
    ("নাসরিন সুলতানা", "ward-captain", "01711-203005"),
    ("জাহিদুল হক", "booth-captain", "01711-203006"),
    ("রুমা বেগম", "household-leader", "01711-203007"),
    ("সাইফুল ইসলাম", "volunteer", "01711-203008"),
    ("মেহেদী হাসান", "volunteer", "01711-203009"),
    ("ফারজানা ইয়াসমিন", "volunteer", "01711-203010"),
]

TASK_TITLES = [
    ("৩ নং ওয়ার্ডে ডোর-টু-ডোর প্রচার", "canvass"),
    ("সন্ধ্যায় পাড়া সভা — বাজার এলাকা", "meeting"),
    ("মাইকিং: নতুন সড়কের অগ্রগতি তুলে ধরা", "miking"),
    ("যুব সমাবেশের প্রস্তুতি সভা", "admin"),
    ("ফেসবুক লাইভ — জনমত জরিপ ফলাফল", "media"),
    ("সেচ্ছাসেবক ব্রিফিং", "meeting"),
    ("নারীর জন্য কর্মশালা আয়োজন", "meeting"),
    ("জন্মনিবন্ধন ক্যাম্প পরিদর্শন", "canvass"),
    ("পোস্টার লাগানো — প্রধান সড়ক", "miking"),
    ("খরচের ভাউচার যাচাই", "admin"),
]

CHALLENGES = [
    ("বৃষ্টিতে ভেঙে যাওয়া সড়ক মেরামতের দাবি", "অবকাঠামো", "high"),
    ("কমিউনিটি ক্লিনিকে ডাক্তারের ঘাটতি", "স্বাস্থ্য", "high"),
    ("৩ নং ওয়ার্ডে জনসভার অনুমতি নিয়ে জটিলতা", "প্রশাসনিক", "medium"),
    ("নিরাপদ পানির লাইন সম্প্রসারণ দরকার", "পানি", "medium"),
    ("ইউনিয়নে বেকার যুবকের জন্য প্রশিক্ষণ কেন্দ্র", "কর্মসংস্থান", "low"),
    ("মসজিদ কমিটির সাথে সমন্বয় প্রয়োজন", "সমন্বয়", "low"),
]

EXPENSES = [
    ("প্রচার", "মাইকিং — ২ নং ওয়ার্ড", 3500, "cash"),
    ("মুদ্রণ", "পোস্টার ও লিফলেট ছাপা", 18500, "bank"),
    ("আপ্যায়ন", "পাড়া সভার চা-নাস্তা", 1250, "cash"),
    ("যাতায়াত", "গাড়ি ভাড়া — ৪ দিন", 6400, "cash"),
    ("অফিস", "ক্যাম্প অফিসের ভাড়া", 12000, "bank"),
    ("মিডিয়া", "ভিডিওগ্রাফার পারিশ্রমিক", 9000, "cheque"),
    ("মুদ্রণ", "ব্যানার ৩টি", 4800, "cash"),
    ("আপ্যায়ন", "কর্মী ব্রিফিং লাঞ্চ", 5600, "cash"),
    ("পরিবহন", "মোটরসাইকেল জ্বালানি", 2100, "cash"),
    ("যোগাযোগ", "মোবাইল রিচার্জ — ভলান্টিয়ার", 1800, "cash"),
]

FEEDBACK = [
    ("complaint", "শাহিদা বেগম", "৩ নং ওয়ার্ডের পাকা রাস্তায় বড় গর্ত, বর্ষায় কাদা হয়।", "high"),
    ("advice", "নুরুজ্জামান", "আপনার পক্ষে প্রতিটি ওয়ার্ডে একজন করে যুব সংগঠক রাখুন।", "medium"),
    ("threat", "বেনামি", "ব্যালট বিতরণে বাধা দেওয়ার হুমকি।", "high"),
    ("complaint", "আমেনা বেগম", "ভাতার আবেদন দশ মাস ধরে ঝুলে আছে।", "medium"),
    ("advice", "ডা. সুলতান হোসেন", "একটি ফ্রি মেডিকেলে ক্যাম্প করলে পুরুষ ভোটারদের আস্থা বাড়বে।", "low"),
]

APPOINTMENTS = [
    ("মোঃ ইসহাক আলী", "01812-334001", "service", "জন্মনিবন্ধন সংক্রান্ত"),
    ("রেবেকা খাতুন", "01812-334002", "complaint", "ভাতার আবেদন"),
    ("আবু সায়েম", "01812-334003", "personal", "স্বেচ্ছাসেবক হতে চান"),
]


class Command(BaseCommand):
    help = "ড্যাশবোর্ড অনুশীলনের জন্য ডেমো CRM ডেটা তৈরি/মুছে ফেলে"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="আগের ডেমো ডেটা মুছে আবার তৈরি করে")
        parser.add_argument("--clear", action="store_true", help="শুধু ডেমো ডেটা মুছে ফেলে")

    @transaction.atomic
    def handle(self, *args, **options):
        wards = list(Ward.objects.all())
        if not wards:
            self.stdout.write(self.style.ERROR("আগে `python manage.py seed_content` চালান — ওয়ার্ড নেই।"))
            return

        if options["clear"] or options["force"]:
            removed = self._clear()
            self.stdout.write(self.style.WARNING(f"ডেমো ডেটা মুছে ফেলা হয়েছে ({removed})।"))
            if options["clear"]:
                return

        if Household.objects.exists() or TeamMember.objects.exists():
            self.stdout.write(self.style.WARNING("ডেমো ডেটা আগেই আছে — নতুন করে বসানো হয়নি (--force দিন)।"))
            return

        today = dt.date.today()

        # ---- কেন্দ্র ও পরিবার
        booths: list[Booth] = []
        for ward in wards:
            for index in range(2):
                name, centre, villages = BOOTH_NAMES[(ward.no + index) % len(BOOTH_NAMES)]
                voters = RNG.randint(1800, 3200)
                households = RNG.randint(320, 520)
                visited = RNG.randint(int(households * 0.25), int(households * 0.85))
                booth, _ = Booth.objects.update_or_create(
                    slug=f"w{ward.no}-b{index + 1}",
                    defaults={
                        "code": f"W{ward.no}-{index + 1}",
                        "name": f"{name} কেন্দ্র",
                        "ward": ward,
                        "village": villages[0],
                        "centre": centre,
                        "voters": voters,
                        "male": int(voters * 0.51),
                        "female": int(voters * 0.49),
                        "youth": int(voters * 0.34),
                        "first_time": int(voters * 0.11),
                        "households": households,
                        "visited": visited,
                        "committed": int(visited * 0.58),
                        "strength": RNG.choice(["safe", "lean", "swing", "swing", "lean"]),
                        "x": 120 + ward.no * 62 + index * 26,
                        "y": 140 + (ward.no % 3) * 90 + index * 34,
                    },
                )
                booths.append(booth)

                for h in range(18):
                    village = villages[h % len(villages)]
                    head = f"{RNG.choice(['মোঃ', 'মোছাঃ', 'শেখ', 'সৈয়দ'])} {RNG.choice(['করিম', 'রহিম', 'জসিম', 'সালেহা', 'রোকেয়া', 'শাহীন', 'মাসুদ', 'ফিরোজা', 'আনোয়ার', 'নাজমা'])}"
                    status = RNG.choices(
                        ["unvisited", "visited", "committed", "hostile"], weights=[2, 5, 3, 1]
                    )[0]
                    household = Household.objects.create(
                        booth=booth,
                        ward=ward,
                        village=village,
                        head=head,
                        phone=f"01{RNG.randint(3, 9)}{RNG.randint(10000000, 99999999)}",
                        members=RNG.randint(2, 9),
                        status=status,
                        support={"committed": "committed", "hostile": "hostile", "visited": "leaning"}.get(
                            status, "undecided"
                        ),
                        issues=RNG.sample(
                            ["রাস্তা", "পানি", "স্বাস্থ্য", "শিক্ষা", "মাদক", "কর্মসংস্থান"], k=RNG.randint(0, 2)
                        ),
                        last_visit=today - dt.timedelta(days=RNG.randint(1, 30)) if status != "unvisited" else None,
                        follow_up="ভাতার আবেদন" if RNG.random() < 0.2 else "",
                        route=h // 6 + 1,
                    )
                    if status != "unvisited":
                        Visit.objects.create(
                            household=household,
                            ward=ward,
                            by=RNG.choice(TEAM)[0],
                            status={
                                "committed": "met-supportive",
                                "visited": "met-undecided",
                                "hostile": "met-hostile",
                                "unvisited": "absent",
                            }[status],
                            note="ডেমো পরিদর্শন নোট",
                        )

        # ---- দল
        for name, role, phone in TEAM:
            TeamMember.objects.create(
                name=name,
                role=role,
                phone=phone,
                ward=RNG.choice(wards),
                booth=RNG.choice(booths) if role in ("booth-captain", "household-leader") else None,
                status="active",
            )

        # ---- দৈনিক পরিকল্পনা
        for index, (title, kind) in enumerate(TASK_TITLES):
            Task.objects.create(
                title=title,
                type=kind,
                date=today + dt.timedelta(days=index % 7),
                time=f"{9 + (index % 9):02d}:00",
                ward=RNG.choice(wards),
                assignee=RNG.choice(TEAM)[0],
                priority=RNG.choice(["low", "medium", "high"]),
                done=index % 4 == 0,
                notes="ডেমো কাজ",
            )

        # ---- চ্যালেঞ্জ
        for title, category, severity in CHALLENGES:
            Challenge.objects.create(
                title=title,
                detail=f"{title} — এলাকাবাসীর সাথে আলোচনা করে অগ্রাধিকার তালিকায় রাখা হয়েছে।",
                ward=RNG.choice(wards),
                category=category,
                severity=severity,
                status=RNG.choice(["open", "open", "monitoring", "resolved"]),
                owner=RNG.choice(TEAM)[0],
            )

        # ---- ব্যয়
        for index, (category, description, amount, mode) in enumerate(EXPENSES):
            Expense.objects.create(
                date=today - dt.timedelta(days=index * 2),
                category=category,
                description=description,
                amount=amount,
                mode=mode,
                voucher=f"V-{2027 - index:04d}" if mode != "cash" else "",
                by="সালমা আক্তার",
            )

        # ---- অভিযোগ ও পরামর্শ
        for index, (kind, name, message, priority) in enumerate(FEEDBACK):
            Feedback.objects.create(
                kind=kind,
                name=name,
                phone=f"019{RNG.randint(10000000, 99999999)}",
                ward=RNG.choice(wards),
                village="মহাদান",
                message=message,
                status=RNG.choice(["new", "new", "reviewing", "resolved"]),
                priority=priority,
            )

        # ---- সাক্ষাতের অনুরোধ
        for name, phone, topic, note in APPOINTMENTS:
            Appointment.objects.create(
                name=name,
                phone=phone,
                ward=RNG.choice(wards),
                topic=topic,
                preferred_date=today + dt.timedelta(days=RNG.randint(2, 10)),
                slot="সকাল ১১টা – ১২টা",
                note=note,
                status=RNG.choice(["pending", "pending", "confirmed"]),
            )

        # ---- চ্যাট
        for index in range(3):
            name = ["সুমন মিয়া", "আফসানা আক্তার", "রাশেদুল করিম"][index]
            conversation = Conversation.objects.create(
                key=f"demo-conv-{index}",
                name=name,
                phone=f"017{RNG.randint(10000000, 99999999)}",
                status="open",
                unread=1,
            )
            Message.objects.create(conversation=conversation, sender="visitor", body="আসসালামু আলাইকুম, একটি প্রশ্ন ছিল।")
            Message.objects.create(
                conversation=conversation,
                sender="admin",
                body="ওয়ালাইকুম আসসালাম। বলুন, কীভাবে সাহায্য করতে পারি?",
                read=True,
            )

        # ---- ভিজিটর স্ট্যাট (গত ১৪ দিন)
        paths = ["/", "/manifesto/", "/blog/", "/events/", "/appointment/", "/gallery/photos/", "/polls/"]
        cities = [("Bangladesh", "Dhaka"), ("Bangladesh", "Comilla"), ("Bangladesh", "Chattogram"), ("United States", "New York")]
        for _ in range(220):
            country, city = RNG.choice(cities)
            VisitorEvent.objects.create(
                path=RNG.choice(paths),
                referrer=RNG.choice(["", "facebook.com", "google.com"]),
                country=country,
                city=city,
                device=RNG.choice(["mobile", "mobile", "mobile", "desktop", "tablet"]),
                browser=RNG.choice(["Chrome", "Safari", "Firefox", "Edge"]),
                os=RNG.choice(["Android", "iOS", "Windows"]),
                visitor_hash=f"demo-{RNG.randint(1, 90)}",
                is_new_visitor=RNG.random() < 0.4,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"ডেমো ডেটা তৈরি — {Booth.objects.count()} কেন্দ্র, {Household.objects.count()} পরিবার, "
                f"{Task.objects.count()} কাজ, {Challenge.objects.count()} চ্যালেঞ্জ, "
                f"{Expense.objects.count()} খরচ, {VisitorEvent.objects.count()} ভিজিট।"
            )
        )

    def _clear(self) -> str:
        """শুধু ডেমো সারি (demo- প্রিফিক্স / নির্দিষ্ট কী) মুছে ফেলে।"""
        counts = {
            "visitors": VisitorEvent.objects.filter(visitor_hash__startswith="demo-").delete()[0],
            "chats": Conversation.objects.filter(key__startswith="demo-conv-").delete()[0],
            "visits": Visit.objects.all().delete()[0],
            "households": Household.objects.all().delete()[0],
            "booths": Booth.objects.all().delete()[0],
            "team": TeamMember.objects.all().delete()[0],
            "tasks": Task.objects.filter(notes="ডেমো কাজ").delete()[0],
            "challenges": Challenge.objects.all().delete()[0],
            "expenses": Expense.objects.all().delete()[0],
            "feedback": Feedback.objects.all().delete()[0],
            "appointments": Appointment.objects.all().delete()[0],
        }
        return ", ".join(f"{key}={value}" for key, value in counts.items())
