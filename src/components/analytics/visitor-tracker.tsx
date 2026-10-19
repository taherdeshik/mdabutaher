"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SESSION_KEY = "mat-visitor-session";

function sessionId() {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now().toString(36)}`;
  }
}

/**
 * Anonymous page-view beacon.
 *
 * Sends one event per client-side navigation. No cookies, no raw IPs, no
 * cross-site identifiers: a random per-tab session id plus coarse device and
 * (edge-provided) location data. Respects Do Not Track and the local opt-out
 * flag `mat-analytics-off`.
 */
export function VisitorTracker() {
  const pathname = usePathname();
  const lastSent = useRef("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (navigator.doNotTrack === "1") return;
    try {
      if (window.localStorage.getItem("mat-analytics-off") === "1") return;
    } catch {
      /* private mode — still count */
    }

    if (lastSent.current === pathname) return;
    const previous = lastSent.current;

    const timer = window.setTimeout(() => {
      lastSent.current = pathname;
      const payload = {
        path: pathname,
        title: document.title,
        session: sessionId(),
        referrer:
          previous ||
          (document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : ""),
        lang: navigator.language,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      const json = JSON.stringify(payload);
      try {
        if (navigator.sendBeacon) {
          const ok = navigator.sendBeacon("/api/track", new Blob([json], { type: "application/json" }));
          if (ok) return;
        }
      } catch {
        /* fall through to fetch */
      }
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
        keepalive: true,
      }).catch(() => undefined);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
