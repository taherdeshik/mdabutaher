import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { ChatPage } from "@/components/features/chat-page";

export const metadata: Metadata = {
  title: "লাইভ চ্যাট ও বার্তা",
  description: "মহাদান ইউনিয়নের জনসংযোগ ডেস্কের সাথে সরাসরি চ্যাট করুন — প্রশ্ন, পরামর্শ বা সহায়তা।",
  alternates: { canonical: "/chat" },
};

export default function Chat() {
  return (
    <>
      <PageHero
        eyebrow="সরাসরি যোগাযোগ"
        title={<>কথা বলুন <span className="text-gold">সরাসরি</span></>}
        description="প্রশ্ন, পরামর্শ বা সহায়তা — আমাদের ডেস্ক আপনার জন্য প্রস্তুত। বার্তাগুলো সংরক্ষিত থাকে যাতে পরে যোগাযোগ করা যায়।"
        crumbs={[{ label: "লাইভ চ্যাট" }]}
      />
      <Section tone="light" className="py-8 sm:py-12">
        <div className="container-x">
          <ChatPage />
        </div>
      </Section>
    </>
  );
}
