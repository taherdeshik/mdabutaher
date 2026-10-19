import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { AnalyticsOptOut } from "@/components/privacy/analytics-opt-out";

export const metadata: Metadata = {
  title: "গোপনীয়তা নীতি",
  description: "এই প্ল্যাটফর্মে সংগৃহীত তথ্য কীভাবে ব্যবহার ও সুরক্ষিত রাখা হয়।",
  alternates: { canonical: "/privacy" },
};

const sections = [
  { title: "আমরা কী তথ্য সংগ্রহ করি", body: "নাম, মোবাইল নম্বর, ইমেইল, ওয়ার্ড, অ্যাপয়েন্টমেন্টের বিষয়, অভিযোগের বিবরণ ও ঐচ্ছিক ছবি। কোনো তথ্য বাধ্যতামূলক নয় যদি না আপনি নাম গোপন রাখার অপশন বেছে নেন।" },
  { title: "কেন সংগ্রহ করি", body: "সাক্ষাৎ নিশ্চিত করতে, অভিযোগের অগ্রগতি জানাতে, ইভেন্টের আসন নিশ্চিত করতে এবং আপনার এলাকার অগ্রাধিকার বুঝতে। কোনো বাণিজ্যিক বিজ্ঞাপনে ব্যবহার করা হয় না।" },
  { title: "কে দেখতে পারে", body: "শুধু দায়িত্বপ্রাপ্ত দল (প্রার্থী, ওয়ার্ড সমন্বয়ক ও ডেটা টিম)। পাবলিক বোর্ডে নাম গোপন রাখা যায়; হুমকি রিপোর্ট কখনো প্রকাশ্যে দেখানো হয় না।" },
  { title: "কতদিন রাখি", body: "নির্বাচনী প্রক্রিয়া শেষ হওয়ার পর ১২ মাস পর্যন্ত, তারপর অ্যানোনিমাইজ করা হয় বা মুছে ফেলা হয় — আইনি প্রয়োজনে ব্যতিক্রম।" },
  { title: "বেনামি ভিজিটর পরিসংখ্যান", body: "কোন পেজ কতবার দেখা হচ্ছে তা বুঝতে কুকিহীন, বেনামি পরিসংখ্যান সংগ্রহ করা হয় — র‍্যান্ডম সেশন আইডি, ডিভাইসের ধরন, ব্রাউজার এবং এজ-প্রদত্ত দেশ/শহর। কোনো আইপি ঠিকানা বা ব্যক্তিগত পরিচয় সংরক্ষণ করা হয় না, এবং এটি বিজ্ঞাপনে ব্যবহৃত হয় না।" },
  { title: "নিরাপত্তা", body: "ডেটা অ্যাক্সেস কেবল পাসকোড-সুরক্ষিত ড্যাশবোর্ড থেকে। তৃতীয় পক্ষের ট্র্যাকিং বা বিজ্ঞাপন কুকি ব্যবহার করা হয় না।" },
  { title: "আপনার অধিকার", body: "যেকোনো সময় নিজের তথ্য দেখতে, সংশোধন করতে বা মুছে ফেলার অনুরোধ করতে পারেন — হ্যালো@mdabutaher.com অথবা কার্যালয়ে সরাসরি। ৭ কার্যদিবসে সাড়া দেওয়া হবে।" },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="গোপনীয়তা" title="আপনার তথ্য, আপনার নিয়ন্ত্রণে" description="স্বচ্ছতা শুধু বাজেটে নয় — ডেটাতেও। কী সংগ্রহ করি, কেন করি এবং কীভাবে সুরক্ষিত রাখি তার সহজ ভাষায় ব্যাখ্যা।" crumbs={[{ label: "গোপনীয়তা নীতি" }]} />
      <Section tone="light" className="py-10 sm:py-14">
        <div className="container-x max-w-3xl">
          <div className="space-y-3">
            {sections.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-forest/10 bg-white p-5">
                <p className="flex items-center gap-2 text-[0.9rem] font-bold text-forest">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-forest/5 text-[0.62rem] font-bold text-forest">{i + 1}</span>{s.title}
                </p>
                <p className="mt-2 text-[0.84rem] leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-forest/10 bg-white px-4 py-3">
            <p className="text-[0.74rem] font-semibold text-forest">চাইলে বন্ধ করতে পারেন</p>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
              ব্রাউজারে Do Not Track চালু থাকলে আমরা কোনো ভিজিট রেকর্ড করি না। চাইলে এই ডিভাইসে আলাদাভাবে বন্ধও রাখতে পারেন।
            </p>
            <AnalyticsOptOut />
          </div>
          <p className="mt-5 rounded-xl bg-cream-2/60 px-4 py-3 text-[0.72rem] text-muted">সর্বশেষ হালনাগাদ: ১ অক্টোবর ২০২৬ · এই নীতিতে পরিবর্তন হলে ওয়েবসাইটে নোটিশ দেওয়া হবে।</p>
        </div>
      </Section>
    </>
  );
}
