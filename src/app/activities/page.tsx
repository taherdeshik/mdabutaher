import type { Metadata } from "next";
import { Activity, Droplets, GraduationCap, HeartPulse, TreePine, Truck, Users } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { ActivityGrid } from "@/components/features/activity-grid";
import { Counter } from "@/components/ui/counter";
import { withBasePath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "সাম্প্রতিক কার্যক্রম",
  description: "শিক্ষা, নিরাপদ পানি, স্বাস্থ্য, দুর্যোগ ত্রাণ ও পরিবেশ — মহাদান ইউনিয়নে সম্পন্ন জনকল্যাণমূলক কার্যক্রমের আর্কাইভ।",
  alternates: { canonical: "/activities" },
};

const summary = [
  { icon: GraduationCap, value: 3200, label: "বই বিতরণ", tone: "text-gold" },
  { icon: Droplets, value: 18, label: "পানি পয়েন্ট", tone: "text-sky-300" },
  { icon: HeartPulse, value: 1850, label: "স্বাস্থ্যসেবা", tone: "text-rose-300" },
  { icon: Truck, value: 980, label: "ত্রাণ পরিবার", tone: "text-emerald-bright" },
  { icon: TreePine, value: 1000, label: "গাছ রোপণ", tone: "text-emerald-bright" },
  { icon: Users, value: 210, label: "স্বেচ্ছাসেবক", tone: "text-gold" },
];

export default function ActivitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="আমাদের কাজ"
        title={<>কথা নয়, <span className="text-gold">কাজ</span> — মাঠের প্রমাণ</>}
        description="প্রতিটি উদ্যোগের ছবি, তথ্য ও প্রভাব এখানে সংরক্ষিত। কোনো কাজ ছোট নয় — মানুষের জন্য হলে তা বড়।"
        crumbs={[{ label: "কার্যক্রম" }]}
        accent="কার্যক্রম"
      >
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          {summary.slice(0, 6).map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className={`mx-auto h-4 w-4 ${s.tone}`} />
              <p className="mt-1 font-latin text-sm font-bold text-cream"><Counter value={s.value} /></p>
              <p className="text-[0.55rem] leading-tight text-cream/45">{s.label}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x">
          <ActivityGrid />
        </div>
      </Section>

      <div className="bg-forest py-8 text-cream">
        <div className="container-x flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-gold"><Activity className="h-5 w-5" /></span>
            <p className="text-[0.85rem]">আপনার এলাকায় কোনো কাজ প্রয়োজন? <span className="text-cream/50">আমাদের জানান।</span></p>
          </div>
          <div className="flex gap-2">
            <a href={withBasePath("/feedback")} className="rounded-full bg-gold px-4 py-2 text-[0.75rem] font-bold text-night">সমস্যা জানান</a>
            <a href={withBasePath("/campaign#volunteer")} className="rounded-full border border-white/20 px-4 py-2 text-[0.75rem] font-semibold">স্বেচ্ছাসেবক হোন</a>
          </div>
        </div>
      </div>
    </>
  );
}
