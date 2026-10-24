import type { Metadata } from "next";
import { CalendarDays, Download, MapPinned, Users } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { EventList } from "@/components/features/event-list";
import { events } from "@/content/events";
import { cmsEvents } from "@/lib/cms";
import { bn, withBasePath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "আসন্ন ইভেন্ট ও সময়সূচি",
  description: "জনসভা, উঠান বৈঠক, পদযাত্রা, স্বাস্থ্য ক্যাম্প ও স্বেচ্ছাসেবক কর্মশালা — সব ইভেন্টের সময়সূচি ও রেজিস্ট্রেশন।",
  alternates: { canonical: "/events" },
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const allEvents = [...(await cmsEvents()), ...events];
  const upcoming = allEvents.filter((e) => e.status === "upcoming").length;
  const seats = allEvents.filter((e) => e.status === "upcoming").reduce((s, e) => s + (e.capacity - e.registered), 0);
  return (
    <>
      <PageHero pageId="events"
        eyebrow="ইভেন্ট ক্যালেন্ডার"
        title={<>আপনার এলাকায় <span className="text-gold">আমরা</span></>}
        description="প্রতিটি ইভেন্টে সরাসরি উপস্থিত থাকুন, প্রশ্ন করুন, মতামত দিন। অনলাইনে রেজিস্ট্রেশন করলে আসন নিশ্চিত ও এসএমএস রিমাইন্ডার পাবেন।"
        crumbs={[{ label: "ইভেন্ট" }]}
        accent="সময়সূচি"
      >
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          <div className="text-center"><CalendarDays className="mx-auto h-4 w-4 text-gold" /><p className="mt-1 font-latin text-lg font-bold">{bn(upcoming)}</p><p className="text-[0.58rem] text-cream/45">আসন্ন ইভেন্ট</p></div>
          <div className="text-center"><MapPinned className="mx-auto h-4 w-4 text-gold" /><p className="mt-1 font-latin text-lg font-bold">৯</p><p className="text-[0.58rem] text-cream/45">ওয়ার্ড কভারেজ</p></div>
          <div className="text-center"><Users className="mx-auto h-4 w-4 text-gold" /><p className="mt-1 font-latin text-lg font-bold">{bn(seats.toLocaleString("en-US"))}</p><p className="text-[0.58rem] text-cream/45">আসন বাকি</p></div>
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x">
          <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p className="text-[0.8rem] text-muted">ইভেন্টে অংশ নিতে রেজিস্ট্রেশন করুন — সম্পূর্ণ বিনামূল্যে।</p>
            <a href={withBasePath("/api/calendar/ics")} className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-white px-3.5 py-2 text-[0.72rem] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream">
              <Download className="h-3.5 w-3.5" /> সব ইভেন্ট ক্যালেন্ডারে
            </a>
          </div>
          <EventList items={allEvents} />
        </div>
      </Section>
    </>
  );
}
