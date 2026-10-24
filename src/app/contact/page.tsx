import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquare, Phone, Send, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { ContactForm } from "@/components/features/contact-form";
import { site } from "@/content/site";
import { Reveal } from "@/components/ui/reveal";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "যোগাযোগ",
  description: "কার্যালয়ের ঠিকানা, ফোন, ইমেইল ও ম্যাপ — মোঃ আবু তাহেরের সাথে যোগাযোগের সব মাধ্যম।",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero pageId="contact"
        eyebrow="যোগাযোগ"
        title={<>আপনার কথা <span className="text-gold">শুনতে</span> প্রস্তুত</>}
        description="ফোন, ইমেইল, সরাসরি সাক্ষাৎ বা অনলাইন বার্তা — যেভাবে সুবিধা, সেভাবেই যোগাযোগ করুন।"
        crumbs={[{ label: "যোগাযোগ" }]}
        accent="কথা"
      >
        <div className="space-y-2">
          <a href={`tel:${site.phoneHref}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-cream/80 backdrop-blur transition-colors hover:border-gold/40 hover:text-gold">
            <Phone className="h-4 w-4 text-gold" /><span className="font-latin text-[0.8rem]">{site.phone}</span>
          </a>
          <a href={`mailto:${site.email}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-cream/80 backdrop-blur transition-colors hover:border-gold/40 hover:text-gold">
            <Mail className="h-4 w-4 text-gold" /><span className="text-[0.8rem]">{site.email}</span>
          </a>
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <Reveal>
              <ContactForm />
            </Reveal>
          </div>
          <div className="space-y-4">
            <Reveal delay={0.08} className="overflow-hidden rounded-2xl border border-forest/10 bg-white">
              <iframe src={site.mapUrl} title="কার্যালয়ের ম্যাপ" className="h-56 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <div className="p-4">
                <p className="flex items-start gap-2 text-[0.82rem] leading-relaxed text-forest"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />{site.office}</p>
                <p className="mt-2 flex items-start gap-2 text-[0.76rem] text-muted"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />{site.officeHours}<br />{site.officeHoursNote}</p>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: MessageSquare, title: "লাইভ চ্যাট", desc: "তাৎক্ষণিক উত্তর", href: "/chat" },
                  { icon: Send, title: "অ্যাপয়েন্টমেন্ট", desc: "সময় বুক করুন", href: "/appointment" },
                  { icon: ShieldCheck, title: "অভিযোগ", desc: "ট্র্যাকিংসহ", href: "/feedback" },
                  { icon: Phone, title: "হোয়াটসঅ্যাপ", desc: "সরাসরি বার্তা", href: site.socials[2].href },
                ].map((c) => (
                  <a key={c.title} href={c.href} className="group rounded-2xl border border-forest/10 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-soft">
                    <c.icon className="h-4 w-4 text-emerald" />
                    <p className="mt-2 text-[0.8rem] font-bold text-forest">{c.title}</p>
                    <p className="text-[0.64rem] text-muted">{c.desc}</p>
                  </a>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="rounded-2xl border border-gold/30 bg-gold/8 p-4">
                <p className="text-[0.78rem] font-bold text-forest">মিডিয়া যোগাযোগ</p>
                <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">সাংবাদিক ও কনটেন্ট নির্মাতাদের জন্য: সাক্ষাৎকার, ছবি ও তথ্যের জন্য ইমেইলে যোগাযোগ করুন — ২৪ ঘণ্টায় উত্তর।</p>
                <a href={`mailto:${site.email}`} className="mt-2 inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-gold-deep">প্রেস কিট চান →</a>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
