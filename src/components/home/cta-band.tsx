import Link from "next/link";
import { ArrowUpRight, CalendarCheck, HeartHandshake, MessageSquareWarning, Phone } from "lucide-react";
import { site } from "@/content/site";
import { Reveal } from "@/components/ui/reveal";

const ctas = [
  { icon: CalendarCheck, title: "সাক্ষাতের সময় নিন", desc: "অনলাইনে ২ মিনিটে অ্যাপয়েন্টমেন্ট", href: "/appointment" },
  { icon: MessageSquareWarning, title: "সমস্যা জানান", desc: "ট্র্যাকিং আইডিসহ অভিযোগ ও পরামর্শ", href: "/feedback" },
  { icon: HeartHandshake, title: "স্বেচ্ছাসেবক হোন", desc: "আপনার ওয়ার্ডে আমাদের সাথে যোগ দিন", href: "/campaign#volunteer" },
];

export function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-gold py-14 text-night sm:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #05130f 1px, transparent 0)", backgroundSize: "22px 22px" }} />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[28px] border-night/5" />
      <div className="container-x relative">
        <Reveal className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.22em] text-night/55">আপনার কথা, আমাদের কাজ</p>
            <h2 className="mt-2 text-balance-tight text-3xl font-bold leading-tight sm:text-4xl">
              একটি ফোন, একটি বার্তা — <br className="hidden sm:block" />পরিবর্তনের শুরু আপনার হাতেই
            </h2>
          </div>
          <a href={`tel:${site.phoneHref}`} className="group inline-flex items-center gap-3 rounded-full bg-night px-5 py-3 text-cream shadow-lg transition-transform hover:scale-[1.02]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><Phone className="h-4 w-4" /></span>
            <span className="text-left">
              <span className="block text-[0.6rem] uppercase tracking-[0.18em] text-cream/50">সরাসরি কল</span>
              <span className="font-latin text-sm font-bold">{site.phone}</span>
            </span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </Reveal>

        <div className="mt-9 grid gap-2 sm:grid-cols-3">
          {ctas.map(({ icon: Icon, ...c }, i) => (
            <Reveal key={c.href} delay={i * 0.08}>
              <Link href={c.href} className="group flex h-full items-center gap-3 rounded-2xl border border-night/10 bg-white/35 p-4 transition-all hover:bg-white/60">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-night text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-[0.88rem] font-bold text-night">
                    {c.title}
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block truncate text-[0.7rem] text-night/60">{c.desc}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
