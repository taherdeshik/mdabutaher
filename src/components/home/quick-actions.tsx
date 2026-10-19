import Link from "next/link";
import { ArrowUpRight, CalendarCheck, HeartHandshake, MessageSquareWarning, Vote } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const actions = [
  {
    icon: CalendarCheck,
    title: "অ্যাপয়েন্টমেন্ট",
    desc: "সরাসরি সাক্ষাতের সময় নিন",
    href: "/appointment",
    accent: "bg-emerald/10 text-emerald group-hover:bg-emerald group-hover:text-white",
  },
  {
    icon: MessageSquareWarning,
    title: "সমস্যা জানান",
    desc: "অভিযোগ, পরামর্শ ও হুমকি",
    href: "/feedback",
    accent: "bg-rose-500/10 text-rose-600 group-hover:bg-rose-500 group-hover:text-white",
  },
  {
    icon: Vote,
    title: "জনমত জরিপ",
    desc: "ভোট দিন, ফলাফল দেখুন",
    href: "/polls",
    accent: "bg-gold/15 text-gold-deep group-hover:bg-gold group-hover:text-night",
  },
  {
    icon: HeartHandshake,
    title: "স্বেচ্ছাসেবক",
    desc: "প্রচারণায় যোগ দিন",
    href: "/campaign#volunteer",
    accent: "bg-sky-500/10 text-sky-700 group-hover:bg-sky-600 group-hover:text-white",
  },
];

export function QuickActions() {
  return (
    <div id="quick-actions" className="relative z-20 -mt-10 sm:-mt-12">
      <div className="container-x">
        <Reveal>
          <div className="grid gap-2 rounded-3xl border border-forest/10 bg-white p-2.5 shadow-[0_24px_60px_-30px_rgba(6,30,22,.4)] sm:grid-cols-2 lg:grid-cols-4">
            {actions.map(({ icon: Icon, ...a }) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center gap-3.5 rounded-2xl p-3.5 transition-colors hover:bg-cream"
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-all duration-300 ${a.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-bold text-forest">
                    {a.title}
                    <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                  <span className="block truncate text-[0.72rem] text-muted">{a.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
