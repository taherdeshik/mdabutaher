import type {
  AuditEntry,
  Booth,
  Challenge,
  CommandSettings,
  Expense,
  Household,
  Post,
  Task,
  TeamMember,
  Visit,
  Ward,
} from "@/lib/command-types";
import type { CommandAlert, Kpis } from "@/lib/command-calc";

export interface WardCoverage {
  id: string;
  no: number;
  name: string;
  strength: Ward["strength"];
  voters: number;
  households: number;
  visited: number;
  committed: number;
  coverage: number;
  commitment: number;
  booths: number;
}

export interface CrmBundle {
  leads: {
    id: string;
    name: string;
    phone: string;
    ward: string;
    source: string;
    stage: "new" | "contacted" | "engaged" | "supporter";
    tags: string[];
    note?: string;
    createdAt: string;
    updatedAt: string;
  }[];
  feedback: {
    id: string;
    trackingId: string;
    kind: "problem" | "advice" | "threat";
    category: string;
    title: string;
    details: string;
    ward: string;
    severity: string;
    status: string;
    supports: number;
    createdAt: string;
  }[];
  appointments: {
    id: string;
    reference: string;
    name: string;
    phone: string;
    type: string;
    date: string;
    slot: string;
    status: string;
    createdAt: string;
  }[];
  messages: {
    id: string;
    channel: string;
    name?: string;
    phone?: string;
    text: string;
    read: boolean;
    createdAt: string;
  }[];
  counts: {
    leads: number;
    newLeads: number;
    supporters: number;
    feedback: number;
    openFeedback: number;
    threats: number;
    appointments: number;
    pendingAppointments: number;
    messages: number;
    unread: number;
  };
}

export interface Snapshot {
  settings: CommandSettings;
  wards: Ward[];
  booths: Booth[];
  households: Household[];
  visits: Visit[];
  team: TeamMember[];
  tasks: Task[];
  expenses: Expense[];
  challenges: Challenge[];
  posts: Post[];
  audit: AuditEntry[];
  kpis: Kpis;
  alerts: CommandAlert[];
  brief: { title: string; detail: string; href: string }[];
  trend: { day: string; visits: number; feedback: number; leads: number }[];
  wardCoverage: WardCoverage[];
  crm: CrmBundle;
  generatedAt: string;
}

export type SendResult = Promise<string | null>;
export type Send = (entity: string, action: string, id?: string, data?: Record<string, unknown>) => SendResult;

export interface SectionProps {
  data: Snapshot;
  send: Send;
  adminKey: string;
  go: (id: SectionId) => void;
}

export type SectionId =
  | "situation"
  | "map"
  | "canvass"
  | "roll"
  | "win"
  | "plan"
  | "team"
  | "challenges"
  | "money"
  | "cms"
  | "crm"
  | "settings";
