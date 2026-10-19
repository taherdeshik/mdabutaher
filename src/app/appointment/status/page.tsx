import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { AppointmentStatusLookup } from "@/components/features/appointment-status";

export const metadata: Metadata = {
  title: "অ্যাপয়েন্টমেন্ট স্ট্যাটাস",
  description: "মোবাইল নম্বর দিয়ে আপনার অ্যাপয়েন্টমেন্টের সর্বশেষ অবস্থা দেখুন।",
  alternates: { canonical: "/appointment/status" },
};

export default function AppointmentStatusPage() {
  return (
    <>
      <PageHero
        eyebrow="স্ট্যাটাস"
        title="আপনার অ্যাপয়েন্টমেন্ট কোথায়?"
        description="মোবাইল নম্বর দিন — আসন্ন, নিশ্চিত বা সম্পন্ন সব সাক্ষাতের অবস্থা দেখতে পাবেন।"
        crumbs={[{ label: "অ্যাপয়েন্টমেন্ট", href: "/appointment" }, { label: "স্ট্যাটাস" }]}
      />
      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x max-w-3xl">
          <AppointmentStatusLookup />
        </div>
      </Section>
    </>
  );
}
