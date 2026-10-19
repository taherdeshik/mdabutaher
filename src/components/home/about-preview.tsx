import Link from "next/link";
import { ArrowUpRight, Quote, ShieldCheck } from "lucide-react";
import { bio, site, values } from "@/content/site";
import { Section, SectionHeading, Badge } from "@/components/ui/section";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";

export function AboutPreview() {
  return (
    <Section tone="light" id="about">
      <div className="container-x">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] border border-forest/10 shadow-lift">
                <SmartImage imageKey="campaign" alt="মানুষের সাথে সরাসরি সংযোগ" className="aspect-[4/5] sm:aspect-[5/5]" label="মাঠের প্রচারণা" sizes="(max-width: 1024px) 90vw, 42vw" />
              </div>
              <div className="absolute -bottom-6 -right-2 w-52 rounded-2xl border border-forest/10 bg-white p-4 shadow-xl sm:-right-6">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald/10 text-emerald"><ShieldCheck className="h-4 w-4" /></span>
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">স্বচ্ছতা</p>
                    <p className="text-xs font-bold text-forest">প্রকাশ্য বাজেট</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest/8">
                  <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-emerald to-emerald-bright" />
                </div>
                <p className="mt-1.5 text-[0.62rem] text-muted">৮৬% কাজের হিসাব উন্মুক্ত</p>
              </div>
              <div className="absolute -left-3 top-6 rounded-2xl border border-gold/30 bg-cream/95 px-3.5 py-2 shadow-lg backdrop-blur sm:-left-5">
                <p className="font-display text-lg font-bold text-forest">১৯৯৯</p>
                <p className="text-[0.58rem] uppercase tracking-[0.14em] text-muted">সেবার শুরু</p>
              </div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="আমার সম্পর্কে"
              title={<>মাটি, মানুষ আর <span className="text-emerald">মায়ের দোয়া</span> — এই তিনটিই আমার শক্তি</>}
              description={site.intro}
            />
            <div className="mt-7 space-y-4 text-sm leading-relaxed text-muted">
              <p>
                আমি <strong className="font-semibold text-forest">{site.name}</strong>, মহাদান ইউনিয়নের সন্তান। স্কুলের বেঞ্চ থেকে বাজারের চায়ের দোকান — প্রতিটি জায়গায় শুনেছি মানুষের কথা। সেই কথা থেকেই আমার রাজনীতি, সেই কথা থেকেই আমার অঙ্গীকার।
              </p>
              <p>
                গত দুই দশকে শিক্ষা, নিরাপদ পানি, বন্যায় ত্রাণ ও সামাজিক অবক্ষয় রোধে কাজ করেছি। এখন চাই এই উদ্যোগগুলোকে একটি <strong className="font-semibold text-forest">পরিকল্পিত, স্বচ্ছ ও জবাবদিহিমূলক</strong> ইউনিয়ন পরিষদের মাধ্যমে টেকসই করতে।
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {["সমাজকর্মে স্নাতক", "লোকাল গভর্নেন্স ডিপ্লোমা", "২৪ বছরের মাঠ অভিজ্ঞতা", "১২০+ স্বেচ্ছাসেবক নেটওয়ার্ক"].map((tag) => (
                <Badge key={tag} tone="light" className="border-forest/10 bg-white py-1.5">{tag}</Badge>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/about" className="group inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-forest-2">
                পূর্ণ পরিচিতি
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <div className="flex items-center gap-3 border-l border-forest/10 pl-4">
                <span className="font-display text-2xl italic text-forest/70" style={{ fontFamily: "Georgia, serif" }}>Abu Taher</span>
                <span className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">স্বাক্ষর</span>
              </div>
            </div>
          </div>
        </div>

        <Stagger className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <StaggerItem key={v.title}>
              <div className="group h-full rounded-2xl border border-forest/8 bg-white/60 p-5 transition-all hover:-translate-y-1 hover:border-forest/15 hover:bg-white hover:shadow-soft">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest/5 text-forest transition-colors group-hover:bg-gold group-hover:text-night">
                  <Icon name={v.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[0.95rem] font-bold text-forest">{v.title}</h3>
                <p className="mt-1.5 text-[0.78rem] leading-relaxed text-muted">{v.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
