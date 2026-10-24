import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { AuditEntry, CommandCollections } from "@/lib/command-types";
import { seedCollections } from "@/content/command-seed";
import type { VisitorEvent } from "@/lib/visitor-types";
import type { SitePageContent } from "@/content/site-pages";
import type { HomeSectionCopy } from "@/content/home-sections";
import { mysqlEnabled, mysqlLoad, mysqlMutate } from "@/lib/mysql";

export type AdminPhoto = {
  id: string;
  /** Image path ("/media/…") or absolute URL. */
  src: string;
  caption: string;
  tag: string;
  tall?: boolean;
  createdAt: string;
};

export type AdminPoster = {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  election: boolean;
  createdAt: string;
};

export type AdminVideo = {
  id: string;
  /** YouTube id (not the full URL). */
  youtubeId: string;
  title: string;
  category: string;
  note?: string;
  createdAt: string;
};

export type GalleryStore = {
  photos: AdminPhoto[];
  posters: AdminPoster[];
  videos: AdminVideo[];
  /** Ids of curated (coded) items hidden from the public galleries. */
  hidden: string[];
};

/**
 * Persistence for all civic data.
 *
 * With MYSQL_HOST + MYSQL_DATABASE set, the adapter in `src/lib/mysql.ts`
 * stores the document in MySQL/MariaDB (transaction + row lock). Without
 * those variables it falls back to `data/db.json` for local development.
 * Both paths expose the same `read / mutate` contract.
 */

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type FeedbackStatus = "new" | "reviewing" | "in-progress" | "resolved";
export type FeedbackKind = "problem" | "advice" | "threat";
export type LeadStage = "new" | "contacted" | "engaged" | "supporter";

export interface Appointment {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email?: string;
  type: string;
  date: string;
  slot: string;
  mode: "in-person" | "phone" | "home-visit";
  ward: string;
  topic: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Feedback {
  id: string;
  trackingId: string;
  kind: FeedbackKind;
  category: string;
  title: string;
  details: string;
  ward: string;
  location?: string;
  severity: "low" | "medium" | "high" | "critical";
  name?: string;
  phone?: string;
  anonymous: boolean;
  photo?: string;
  status: FeedbackStatus;
  supports: number;
  createdAt: string;
  updatedAt: string;
  timeline: { at: string; note: string; by: string }[];
}

export interface Message {
  id: string;
  channel: "web-chat" | "contact" | "whatsapp";
  name?: string;
  phone?: string;
  email?: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  ward: string;
  guests: number;
  createdAt: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  ward: string;
  role: string;
  availability: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  ward: string;
  source: "appointment" | "feedback" | "event" | "volunteer" | "newsletter" | "contact" | "chat";
  stage: LeadStage;
  tags: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = "owner" | "manager" | "captain";

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  wardId?: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
}

export interface PollVote {
  pollId: string;
  optionId: string;
  createdAt: string;
  fingerprint: string;
}

export interface DBShape extends CommandCollections {
  appointments: Appointment[];
  feedback: Feedback[];
  messages: Message[];
  subscribers: Subscriber[];
  registrations: EventRegistration[];
  volunteers: Volunteer[];
  leads: Lead[];
  pollVotes: PollVote[];
  visitorEvents: VisitorEvent[];
  adminUsers: AdminUser[];
  adminSessions: AdminSession[];
  /** Per-page overrides written by the admin "সাইট কনটেন্ট" editor. */
  siteContent: Record<string, SitePageContent>;
  /** Home-page section copy (eyebrow/title/description/visibility). */
  homeCopy: Record<string, HomeSectionCopy>;
  /** Gallery items added from the admin panel + curated items that were hidden. */
  gallery: GalleryStore;
  meta: { seeded: boolean };
}

function emptyDB(): DBShape {
  return {
    appointments: [],
    feedback: [],
    messages: [],
    subscribers: [],
    registrations: [],
    volunteers: [],
    leads: [],
    pollVotes: [],
    visitorEvents: [],
    adminUsers: [],
    adminSessions: [],
    siteContent: {},
    homeCopy: {},
    gallery: { photos: [], posters: [], videos: [], hidden: [] },
    settings: {
      pollingDate: "2027-01-15",
      rollDate: "2026-11-05",
      nominationDate: "2026-12-10",
      scrutinyDate: "2026-12-13",
      withdrawalDate: "2026-12-17",
      symbolDate: "2026-12-18",
      resultDate: "2027-01-15",
      turnoutAssumption: 72,
      spendCap: 1000000,
      unionVoters: 26540,
    },
    wards: [],
    booths: [],
    households: [],
    visits: [],
    team: [],
    tasks: [],
    expenses: [],
    challenges: [],
    posts: [],
    audit: [],
    meta: { seeded: false },
  };
}

let seedCache: CommandCollections | null = null;
function commandSeed() {
  if (!seedCache) seedCache = seedCollections();
  return structuredClone(seedCache);
}

const DB_PATH = process.env.CIVIC_DATA_FILE || path.join(process.cwd(), "data", "db.json");

let queue: Promise<unknown> = Promise.resolve();

function hydrate(parsed: Partial<DBShape> | null): DBShape {
  const base = emptyDB();
  const db = { ...base, ...(parsed || {}), meta: { seeded: Boolean(parsed?.meta?.seeded) } };
  if (!db.meta.seeded) Object.assign(db, commandSeed());
  return db;
}

async function readFile(): Promise<DBShape> {
  if (mysqlEnabled()) {
    // Fail loudly: an unreachable database must not look like an empty site.
    const raw = await mysqlLoad();
    return hydrate(raw ? (JSON.parse(raw) as Partial<DBShape>) : null);
  }
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return hydrate(raw ? (JSON.parse(raw) as Partial<DBShape>) : null);
  } catch {
    return hydrate(null);
  }
}

async function writeFile(db: DBShape) {
  db.meta.seeded = true;
  if (mysqlEnabled()) {
    await mysqlMutate(async () => ({ result: null, next: JSON.stringify(db) }));
    return;
  }
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

export async function read(): Promise<DBShape> {
  await queue;
  return readFile();
}

/** Serialized read-modify-write; MySQL also holds a row lock. */
export function mutate<T>(fn: (db: DBShape) => T | Promise<T>): Promise<T> {
  if (mysqlEnabled()) {
    return mysqlMutate(async (raw) => {
      const db = hydrate(JSON.parse(raw) as Partial<DBShape>);
      const result = await fn(db);
      db.meta.seeded = true;
      return { result, next: JSON.stringify(db) };
    });
  }
  const run = queue.then(async () => {
    const db = await readFile();
    const result = await fn(db);
    await writeFile(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export { mysqlEnabled } from "@/lib/mysql";

export function makeId(prefix: string) {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export function pushAudit(db: DBShape, actor: string, action: string, detail: string) {
  const entry: AuditEntry = {
    id: makeId("AUD"),
    at: new Date().toISOString(),
    actor,
    action,
    detail,
  };
  db.audit.unshift(entry);
  db.audit = db.audit.slice(0, 200);
  db.meta.seeded = true;
  return entry;
}

export function trackingId() {
  return `MAT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export function pushLead(db: DBShape, lead: Omit<Lead, "id" | "stage" | "tags" | "createdAt" | "updatedAt">) {
  const existing = db.leads.find((l) => l.phone === lead.phone);
  const now = new Date().toISOString();
  if (existing) {
    existing.updatedAt = now;
    if (lead.note && !existing.note) existing.note = lead.note;
    return existing;
  }
  const item: Lead = {
    ...lead,
    id: makeId("LEAD"),
    stage: "new",
    tags: [lead.source],
    createdAt: now,
    updatedAt: now,
  };
  db.leads.push(item);
  return item;
}
