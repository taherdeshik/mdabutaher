import type { Metadata, Viewport } from "next";
import "./globals.css";
import { anekBangla, inter } from "@/lib/fonts";
import { SiteChrome } from "@/components/layout/site-chrome";
import { site } from "@/content/site";

const url = "https://mdabutaher.com";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: `${site.name} — ${site.role}, ${site.union}`,
    template: `%s · ${site.name}`,
  },
  description:
    "মহাদান ইউনিয়নের চেয়ারম্যান পদপ্রার্থী মোঃ আবু তাহেরের অফিসিয়াল ওয়েবসাইট। ম্যানিফেস্টো, প্রচারণা সময়সূচি, জনসেবা, অভিযোগ ও অ্যাপয়েন্টমেন্ট বুকিং।",
  keywords: [
    "মোঃ আবু তাহের", "মহাদান ইউনিয়ন", "সরিষাবাড়ী", "জামালপুর", "চেয়ারম্যান প্রার্থী",
    "ইউনিয়ন পরিষদ নির্বাচন", "ম্যানিফেস্টো", "Md Abu Taher", "Mahadan Union",
  ],
  authors: [{ name: site.name, url }],
  creator: site.name,
  publisher: `${site.name} — ${site.union} প্রচারণা`,
  category: "politics",
  applicationName: `${site.name} — ${site.union}`,
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url,
    siteName: site.name,
    title: `${site.name} — ${site.slogan}`,
    description: "মানুষের পাশে, সবসময়। ম্যানিফেস্টো, প্রচারণা ও জনসেবার ডিজিটাল ঠিকানা।",
  },
  twitter: { card: "summary_large_image", title: `${site.name} — ${site.slogan}` },
  alternates: {
    canonical: "/",
    languages: { "bn-BD": "/" },
    types: { "application/rss+xml": "/feed.xml" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  appleWebApp: { capable: true, title: site.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f4ea" },
    { media: "(prefers-color-scheme: dark)", color: "#05130f" },
  ],
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${url}/#person`,
      name: site.name,
      alternateName: site.nameEn,
      jobTitle: `${site.role} — ${site.union}`,
      description: site.intro,
      url,
      telephone: site.phoneHref,
      email: site.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.office,
        addressLocality: site.upazila,
        addressRegion: site.district,
        addressCountry: "BD",
      },
      sameAs: site.socials.map((s) => s.href),
    },
    {
      "@type": "PoliticalParty",
      "@id": `${url}/#campaign`,
      name: `${site.name} — ${site.union} প্রচারণা`,
      slogan: site.slogan,
      url,
      logo: `${url}/favicon.svg`,
      areaServed: {
        "@type": "AdministrativeArea",
        name: `${site.union}, ${site.upazila}, ${site.district}`,
      },
      founder: { "@id": `${url}/#person` },
    },
    {
      "@type": "WebSite",
      "@id": `${url}/#website`,
      url,
      name: `${site.name} — ${site.role}, ${site.union}`,
      inLanguage: "bn-BD",
      publisher: { "@id": `${url}/#campaign` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${anekBangla.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate" type="application/rss+xml" title={`${site.name} — আরএসএস ফিড`} href="/feed.xml" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-cream"
        >
          মূল কনটেন্টে যান
        </a>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
