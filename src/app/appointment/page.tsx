import type { Metadata } from "next";
import { CalendarCheck, Clock, MapPin, Phone, ShieldCheck, Users, Video } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { AppointmentForm } from "@/components/features/appointment-form";
import { Section } from "@/components/ui/section";
import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { site, faqs } from "@/content/site";
import { withBasePath } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "অ্যাপয়েন্টমেন্ট বুকিং",
  description: "মোঃ আবু তাহেরের সাথে সরাসরি সাক্ষাৎ, ফোন কল বা বাড়ি পরিদর্শনের জন্য অনলাইনে সময় বুক করুন — ২ মিনিটে।",
  alternates: { canonical: "/appointment" },
};

const info = [
  { icon: Clock, title: "গড় অপেক্ষা", value: "৮ মিনিট", note: "নির্ধারিত সময়ে অগ্রাধিকার" },
  { icon: Users, title: "সাপ্তাহিক সাক্ষাৎ", value: "৬০+", note: "গত ৩০ দিনে" },
  { icon: ShieldCheck, title: "গোপনীয়তা", value: "১০০%", note: "তথ্য তৃতীয় পক্ষকে নয়" },
];

export default function AppointmentPage() {
  return (
    <>
      <PageHero pageId="appointment"
        eyebrow="জনসেবা"
        title={<>সাক্ষাতের সময় নিন — <span className="text-gold">লাইনে দাঁড়ানো নয়</span></>}
        description="আপনার সময়ও মূল্যবান, আমাদেরও। অনলাইনে সময় বুক করুন — নিশ্চিতকরণ, রিমাইন্ডার ও স্ট্যাটাস সবকিছু এসএমএস ও এই প্ল্যাটফর্মে।"
        crumbs={[{ label: "অ্যাপয়েন্টমেন্ট" }]}
        accent="সময়"
      >
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          {info.map((i) => (
            <div key={i.title} className="text-center">
              <i.icon className="mx-auto h-4 w-4 text-gold" />
              <p className="mt-1.5 font-latin text-base font-bold text-cream">{i.value}</p>
              <p className="text-[0.6rem] text-cream/45">{i.title}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-12">
          <Reveal>
            <AppointmentForm />
          </Reveal>

          <div className="space-y-4">
            <Reveal delay={0.08}>
              <div className="rounded-2xl border border-forest/10 bg-white p-5">
                <p className="eyebrow mb-3">কার্যালয়</p>
                <p className="flex items-start gap-2.5 text-[0.85rem] leading-relaxed text-forest">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />{site.office}
                </p>
                <p className="mt-3 flex items-start gap-2.5 text-[0.8rem] text-muted">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                  <span>{site.officeHours}<br /><span className="text-[0.72rem]">{site.officeHoursNote}</span></span>
                </p>
                <a href={`tel:${site.phoneHref}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-forest-2">
                  <Phone className="h-4 w-4" /> <span className="font-latin">{site.phone}</span>
                </a>
                <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-forest/12 px-4 py-2.5 text-[0.8rem] font-semibold text-forest transition-colors hover:bg-cream">
                  ম্যাপে দেখুন
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="rounded-2xl border border-forest/10 bg-cream-2/60 p-5">
                <p className="text-[0.8rem] font-bold text-forest">সাক্ষাতের প্রস্তুতি</p>
                <ul className="mt-3 space-y-2.5">
                  {[
                    "সমস্যা সংক্রান্ত কাগজপত্র বা ছবি সাথে আনুন",
                    "ওয়ার্ড ও স্থানীয় মোড়লের নাম লিখে রাখুন",
                    "জরুরি হলে আগে ০১৭১১-২০৩৯৯৭ নম্বরে কল করুন",
                    "অনলাইনে না পারলে ফোনেই সময় নিতে পারেন",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-[0.76rem] leading-relaxed text-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold-deep" />{t}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-forest/15 bg-white/60 p-3">
                  <Video className="h-4 w-4 shrink-0 text-emerald" />
                  <p className="text-[0.7rem] leading-relaxed text-muted">প্রতিবন্ধী বা বয়স্ক নাগরিকদের জন্য হোম ভিজিটের ব্যবস্থা আছে — ফর্মে “বাড়ি পরিদর্শন” বেছে নিন।</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="rounded-2xl border border-forest/10 bg-white p-5">
                <p className="mb-2 text-[0.8rem] font-bold text-forest">সাধারণ প্রশ্ন</p>
                <Accordion items={faqs.slice(0, 3)} defaultOpen={null} />
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      <div className="border-t border-forest/8 bg-cream-2/50 py-6">
        <div className="container-x flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="flex items-center gap-2 text-[0.8rem] text-muted">
            <CalendarCheck className="h-4 w-4 text-emerald" />
            আগে বুক করেছেন? রেফারেন্স নম্বর দিয়ে স্ট্যাটাস দেখুন।
          </p>
          <a href={withBasePath("/appointment/status")} className="rounded-full border border-forest/15 bg-white px-4 py-2 text-[0.78rem] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream">
            স্ট্যাটাস দেখুন
          </a>
        </div>
      </div>
    </>
  );
}
