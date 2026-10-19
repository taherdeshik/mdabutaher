/**
 * Visitor analytics shapes.
 *
 * Pure types only — shared by the tracking route, the admin API and the
 * dashboard UI, so the contract lives in one place.
 */

export type DeviceKind = "mobile" | "tablet" | "desktop";

export interface VisitorEvent {
  id: string;
  /** Anonymous, per-tab-session id from sessionStorage. */
  session: string;
  path: string;
  title?: string;
  ts: string;
  referrer?: string;
  device: DeviceKind;
  browser: string;
  os: string;
  lang?: string;
  tz?: string;
  country?: string;
  region?: string;
  city?: string;
}

export interface VisitorSession {
  id: string;
  firstSeen: string;
  lastSeen: string;
  durationSec: number;
  views: number;
  entry: string;
  exit: string;
  pages: string[];
  device: DeviceKind;
  browser: string;
  os: string;
  country?: string;
  city?: string;
  referrer?: string;
  lang?: string;
}

export interface AnalyticsPoint {
  date: string;
  views: number;
  visitors: number;
}

export interface AnalyticsRow {
  label: string;
  views: number;
  visitors?: number;
  code?: string;
}

export interface AnalyticsBundle {
  generatedAt: string;
  range: number;
  totals: {
    activeNow: number;
    todayViews: number;
    todayVisitors: number;
    rangeViews: number;
    rangeVisitors: number;
    allViews: number;
    allSessions: number;
    pagesPerSession: number;
    avgDurationSec: number;
    bounceRate: number;
  };
  series: AnalyticsPoint[];
  pages: AnalyticsRow[];
  countries: AnalyticsRow[];
  cities: AnalyticsRow[];
  devices: AnalyticsRow[];
  browsers: AnalyticsRow[];
  sources: AnalyticsRow[];
  recent: VisitorEvent[];
  sessions: VisitorSession[];
}
