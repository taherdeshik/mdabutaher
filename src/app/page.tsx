import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { QuickActions } from "@/components/home/quick-actions";
import { StatsBand } from "@/components/home/stats-band";
import { IntroVideoSection } from "@/components/features/intro-video";
import { AboutPreview } from "@/components/home/about-preview";
import { ManifestoPreview } from "@/components/home/manifesto-preview";
import { CampaignPreview } from "@/components/home/campaign-preview";
import { EventsPreview } from "@/components/home/events-preview";
import { ActivitiesPreview } from "@/components/home/activities-preview";
import { PollPreview } from "@/components/home/poll-preview";
import { BlogPreview } from "@/components/home/blog-preview";
import { Testimonials } from "@/components/home/testimonials";
import { CtaBand } from "@/components/home/cta-band";
import { site } from "@/content/site";
import { getPageContent, getHomeCopy } from "@/lib/site-content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: `${site.name} — ${site.role}, ${site.union}`,
  description:
    "মানুষের পাশে, সবসময়। মহাদান ইউনিয়নের চেয়ারম্যান পদপ্রার্থী মোঃ আবু তাহেরের ম্যানিফেস্টো, প্রচারণা সময়সূচি, জনসেবা ও যোগাযোগের ডিজিটাল ঠিকানা।",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [cms, copy] = await Promise.all([getPageContent("home"), getHomeCopy()]);
  const show = (id: string) => copy[id]?.visible !== false;
  return (
    <>
      <Hero cms={cms} copy={copy.hero} />
      {show("quick-actions") && <QuickActions />}
      {show("stats") && <StatsBand />}
      <IntroVideoSection />
      {show("about") && <AboutPreview copy={copy.about} />}
      {show("manifesto") && <ManifestoPreview copy={copy.manifesto} />}
      {show("campaign") && <CampaignPreview copy={copy.campaign} />}
      {show("events") && <EventsPreview copy={copy.events} />}
      {show("activities") && <ActivitiesPreview copy={copy.activities} />}
      {show("polls") && <PollPreview copy={copy.polls} />}
      {show("blog") && <BlogPreview copy={copy.blog} />}
      {show("testimonials") && <Testimonials copy={copy.testimonials} />}
      {show("cta") && <CtaBand copy={copy.cta} />}
    </>
  );
}
