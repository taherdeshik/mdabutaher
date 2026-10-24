import Link from "next/link";
import { ArrowUpRight, Facebook, Mail, MapPin, Phone, Youtube, MessageCircle, ShieldCheck } from "lucide-react";
import { site } from "@/content/site";
import { NewsletterForm } from "@/components/features/newsletter-form";

const columns = [
  {
    title: "পরিচিতি",
    links: [
      { label: "আমার সম্পর্কে", href: "/about" },
      { label: "ম্যানিফেস্টো", href: "/manifesto" },
      { label: "কার্যক্রম", href: "/activities" },
      { label: "সংবাদ", href: "/news" },
    ],
  },
  {
    title: "জনসেবা",
    links: [
      { label: "অ্যাপয়েন্টমেন্ট", href: "/appointment" },
      { label: "সমস্যা ও পরামর্শ", href: "/feedback" },
      { label: "জনমত জরিপ", href: "/polls" },
      { label: "লাইভ চ্যাট", href: "/chat" },
    ],
  },
  {
    title: "প্রচারণা",
    links: [
      { label: "প্রচারণা পরিকল্পনা", href: "/campaign" },
      { label: "আসন্ন ইভেন্ট", href: "/events" },
      { label: "স্বেচ্ছাসেবক হোন", href: "/campaign#volunteer" },
      { label: "ব্লগ", href: "/blog" },
      { label: "ফটো গ্যালারী", href: "/gallery/photos" },
      { label: "পোস্টার গ্যালারী", href: "/gallery/posters" },
      { label: "নির্বাচনী পোস্টার", href: "/gallery/election-posters" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-night text-cream">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

      <div className="container-x relative py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/5">
                <span className="font-display text-2xl font-bold text-gold">আ</span>
              </span>
              <div>
                <p className="font-display text-lg font-bold">{site.name}</p>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-cream/45">{site.nameEn}</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/60">
              {site.slogan}। মহাদান ইউনিয়নের মানুষ, শিক্ষা, স্বাস্থ্য ও সম্ভাবনার জন্য একটিপরিকল্পিত ভবিষ্যৎ গড়ার অঙ্গীকার।
            </p>

            <div className="mt-6 space-y-3 text-sm text-cream/70">
              <a href={`tel:${site.phoneHref}`} className="flex items-center gap-3 transition-colors hover:text-gold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/5"><Phone className="h-3.5 w-3.5" /></span>
                {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className="flex items-center gap-3 transition-colors hover:text-gold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/5"><Mail className="h-3.5 w-3.5" /></span>
                {site.email}
              </a>
              <p className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5"><MapPin className="h-3.5 w-3.5" /></span>
                <span className="leading-relaxed">{site.office}</span>
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {[
                { icon: Facebook, href: site.socials[0].href, label: "Facebook" },
                { icon: Youtube, href: site.socials[1].href, label: "YouTube" },
                { icon: MessageCircle, href: site.socials[2].href, label: "WhatsApp" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/12 text-cream/70 transition-all hover:border-gold/50 hover:bg-gold hover:text-night"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-8 sm:contents">
              {columns.slice(0, 2).map((col) => (
                <div key={col.title}>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-gold/80">{col.title}</p>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="group inline-flex items-center gap-1 text-sm text-cream/65 transition-colors hover:text-cream">
                          {l.label}
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-gold/80">প্রচারণা</p>
              <ul className="mt-4 space-y-2.5">
                {columns[2].links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-cream/65 transition-colors hover:text-cream">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-gold/80">নিউজলেটার</p>
                <p className="mt-2 text-xs leading-relaxed text-cream/50">প্রচারণা, ইভেন্ট ও উন্নয়নের আপডেট সরাসরি আপনার ইমেইলে।</p>
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "জাতীয় জরুরি সেবা", number: "৯৯৯" },
            { label: "স্বাস্থ্য বাতায়ন", number: "১৬২৬৩" },
            { label: "নারী ও শিশু হেল্পলাইন", number: "১০৯" },
            { label: "শিশু সহায়তা", number: "১০৯৮" },
          ].map((c) => (
            <a key={c.number} href={`tel:${c.number}`} className="flex items-center justify-between rounded-xl px-2 py-1.5 text-xs transition-colors hover:bg-white/5">
              <span className="flex items-center gap-2 text-cream/55">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-bright" /> {c.label}
              </span>
              <span className="font-latin font-semibold text-gold">{c.number}</span>
            </a>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-[0.72rem] text-cream/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-cream/70">গোপনীয়তা নীতি</Link>
            <Link href="/admin" className="transition-colors hover:text-cream/70">কর্মী লগইন (CRM)</Link>
            <span className="text-cream/25">মহাদান ইউনিয়ন · সরিষাবাড়ী · জামালপুর</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
