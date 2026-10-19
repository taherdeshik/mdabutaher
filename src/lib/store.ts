import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { AuditEntry, CommandCollections } from "@/lib/command-types";
import { seedCollections } from "@/content/command-seed";

/**
 * Lightweight JSON persistence for the demo build.
 *
 * IMPORTANT: this is the single write path for civic data. In production,
 * replace the three functions below with a Postgres/Supabase adapter that
 * implements the same `read / mutate` contract — no route or UI changes needed.
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

async function readFile(): Promise<DBShape> {
  const base = emptyDB();
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DBShape>;
    const db = { ...base, ...parsed, meta: { seeded: Boolean(parsed.meta?.seeded) } };
    if (!db.meta.seeded) {
      const seed = commandSeed();
      Object.assign(db, seed);
    }
    return db;
  } catch {
    const db = base;
    Object.assign(db, commandSeed());
    return db;
  }
}

async function writeFile(db: DBShape) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

export async function read(): Promise<DBShape> {
  await queue;
  return readFile();
}

/** Serialized read-modify-write so concurrent requests never clobber data. */
export function mutate<T>(fn: (db: DBShape) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readFile();
    const result = await fn(db);
    await writeFile(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

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
