"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowUpRight,
  CalendarCheck,
  ChevronDown,
  Facebook,
  Menu,
  MessageSquare,
  Phone,
  X,
  Youtube,
} from "lucide-react";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

function Monogram({ light = false }: { light?: boolean }) {
  return (
    <span
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border",
        light ? "border-white/20 bg-white/10" : "border-forest/10 bg-forest",
      )}
    >
      <span className={cn("font-display text-[1.35rem] font-bold leading-none", light ? "text-gold" : "text-gold")}>আ</span>
      <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border-2 border-cream bg-gold text-[7px] font-black text-night">
        ✓
      </span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Utility bar */}
      <div className="relative z-50 hidden bg-night text-cream/75 lg:block">
        <div className="container-x flex h-9 items-center justify-between text-[0.72rem]">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-bright opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-bright" />
              </span>
              নির্বাচন ২০২৭ · প্রচারণা চলছে
            </span>
            <span className="h-3 w-px bg-white/15" />
            <span>{site.union}, {site.upazila}, {site.district}</span>
          </div>
          <div className="flex items-center gap-5">
            <a href={`tel:${site.phoneHref}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-gold">
              <Phone className="h-3 w-3" /> {site.phone}
            </a>
            <Link href="/feedback" className="inline-flex items-center gap-1.5 transition-colors hover:text-gold">
              <MessageSquare className="h-3 w-3" /> সমস্যা জানান
            </Link>
            <span className="h-3 w-px bg-white/15" />
            <div className="flex items-center gap-2">
              <a href={site.socials[0].href} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-colors hover:text-gold">
                <Facebook className="h-3.5 w-3.5" />
              </a>
              <a href={site.socials[1].href} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-colors hover:text-gold">
                <Youtube className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-500",
          scrolled ? "glass border-b border-forest/10 shadow-[0_8px_30px_-16px_rgba(6,30,22,.3)]" : "bg-cream/80 backdrop-blur-md",
        )}
      >
        <div className="container-x flex h-[76px] items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3" aria-label="হোম">
            <Monogram />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.08rem] font-bold tracking-tight text-forest">{site.name}</span>
              <span className="mt-1 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-muted">
                {site.role} · {site.union}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0 xl:flex" aria-label="প্রধান মেনু">
            {site.nav.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && Boolean(pathname?.startsWith(item.href)));
              const children = "children" in item ? item.children : undefined;
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => children && setOpenGroup(item.label)}
                  onMouseLeave={() => setOpenGroup(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-1 rounded-full px-2.5 py-2 text-[0.82rem] font-semibold transition-colors",
                      active ? "text-forest" : "text-forest/65 hover:text-forest",
                    )}
                  >
                    {item.label}
                    {children && <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openGroup === item.label && "rotate-180")} />}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gold"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>

                  <AnimatePresence>
                    {children && openGroup === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 top-full z-50 w-[24rem] -translate-x-1/2 pt-3"
                      >
                        <div className="overflow-hidden rounded-2xl border border-forest/10 bg-white p-2 shadow-[0_30px_60px_-24px_rgba(6,30,22,.35)]">
                          {children.map((c) => (
                            <Link
                              key={c.href}
                              href={c.href}
                              className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-cream"
                            >
                              <span className="mt-1 grid h-8 w-8 place-items-center rounded-lg bg-forest/5 text-forest transition-colors group-hover:bg-forest group-hover:text-gold">
                                <ArrowUpRight className="h-4 w-4" />
                              </span>
                              <span>
                                <span className="block text-sm font-semibold text-forest">{c.label}</span>
                                <span className="mt-0.5 block text-xs text-muted">{c.desc}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <ButtonLink href="/appointment" variant="primary" size="sm" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              অ্যাপয়েন্টমেন্ট
            </ButtonLink>
            <button
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-forest/12 text-forest transition-colors hover:bg-forest hover:text-cream"
              aria-label="মেনু খুলুন"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-forest/12 text-forest xl:hidden"
            aria-label="মেনু খুলুন"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <motion.div style={{ scaleX: progress }} className="h-[2px] origin-left bg-gradient-to-r from-emerald via-gold to-emerald" />
      </header>

      {/* Mobile / full menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-night/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute right-0 top-0 flex h-full w-[min(92vw,26rem)] flex-col bg-cream shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-forest/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Monogram />
                  <div>
                    <p className="text-sm font-bold text-forest">{site.name}</p>
                    <p className="text-[0.65rem] uppercase tracking-widest text-muted">মহাদান ইউনিয়ন</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-forest/5 text-forest" aria-label="বন্ধ করুন">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <nav className="flex flex-col gap-0.5">
                  {site.nav.map((item, i) => {
                    const children = "children" in item ? item.children : undefined;
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.06 + i * 0.035 }}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center justify-between rounded-xl px-3 py-3 text-[1rem] font-semibold text-forest transition-colors hover:bg-white"
                        >
                          {item.label}
                          <ArrowUpRight className="h-4 w-4 text-muted" />
                        </Link>
                        {children && (
                          <div className="mb-1 ml-3 flex flex-col border-l border-forest/10 pl-3">
                            {children.map((c) => (
                              <Link key={c.href} href={c.href} className="rounded-lg px-2 py-2 text-[0.85rem] text-muted transition-colors hover:text-forest">
                                {c.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </nav>

                <div className="mt-5 rounded-2xl bg-forest p-4 text-cream">
                  <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold">দ্রুত সেবা</p>
                  <p className="mt-1 text-sm text-cream/80">সরাসরি সময় নিন অথবা সমস্যা জানান।</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link href="/appointment" className="rounded-xl bg-gold px-3 py-2.5 text-center text-xs font-bold text-night">
                      অ্যাপয়েন্টমেন্ট
                    </Link>
                    <Link href="/feedback" className="rounded-xl border border-white/25 px-3 py-2.5 text-center text-xs font-semibold text-cream">
                      সমস্যা জানান
                    </Link>
                  </div>
                </div>
              </div>

              <div className="border-t border-forest/10 px-5 py-4">
                <a href={`tel:${site.phoneHref}`} className="flex items-center gap-2 text-sm font-semibold text-forest">
                  <Phone className="h-4 w-4" /> {site.phone}
                </a>
                <p className="mt-1 text-[0.7rem] text-muted">{site.officeHours}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
