"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { NewsTicker } from "./news-ticker";
import { ChatWidget } from "./chat-widget";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bare =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login") ||
    pathname === "/manifesto/print";

  if (bare) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <NewsTicker />
      <main id="main-content" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}
