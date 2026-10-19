/**
 * Shared command-center domain types.
 *
 * Pure types only — safe to import from client components (no node APIs,
 * no store implementation). The store and API routes import the same shapes,
 * so the contract stays in one place.
 */

export type Strength = "strong" | "lean" | "swing" | "hostile";
export type VisitStatus =
  | "met-supportive"
  | "met-undecided"
  | "met-hostile"
  | "absent"
  | "refused";
export type SupportLevel = "committed" | "leaning" | "undecided" | "hostile";
export type TeamRole =
  | "manager"
  | "finance"
  | "media"
  | "ward-captain"
  | "booth-captain"
  | "household-leader"
  | "volunteer";
export type TaskType = "meeting" | "canvass" | "miking" | "rally" | "admin" | "media";
export type Priority = "low" | "medium" | "high";
export type ChallengeSeverity = "low" | "medium" | "high" | "critical";
export type ChallengeStatus = "open" | "monitoring" | "resolved";
export type ExpenseMode = "cash" | "cheque" | "bank";
export type PostType = "news" | "event" | "blog";
export type PostStatus = "draft" | "published";

export interface CommandSettings {
  pollingDate: string;
  rollDate: string;
  nominationDate: string;
  scrutinyDate: string;
  withdrawalDate: string;
  symbolDate: string;
  resultDate: string;
  turnoutAssumption: number; // percentage
  spendCap: number;
  unionVoters: number;
}

export interface Ward {
  id: string;
  no: number;
  name: string;
  villages: string[];
  polygon: string;
  strength: Strength;
  turnout2021: number;
  captainId?: string;
  note?: string;
}

export interface Booth {
  id: string;
  code: string;
  name: string;
  wardId: string;
  village: string;
  centre: string;
  voters: number;
  male: number;
  female: number;
  youth: number;
  firstTime: number;
  households: number;
  visited: number;
  committed: number;
  captainId?: string;
  strength: Strength;
  x: number;
  y: number;
}

export interface Household {
  id: string;
  boothId: string;
  wardId: string;
  village: string;
  head: string;
  phone?: string;
  members: number;
  status: "unvisited" | "visited" | "committed" | "hostile";
  support: SupportLevel;
  issues: string[];
  lastVisit?: string;
  followUp?: string;
  note?: string;
  route: number;
}

export interface Visit {
  id: string;
  householdId: string;
  boothId: string;
  wardId: string;
  by: string;
  status: VisitStatus;
  issues: string[];
  promise?: string;
  followUp?: string;
  note?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  role: TeamRole;
  wardId?: string;
  boothId?: string;
  status: "active" | "pending" | "inactive";
  joinedAt: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  date: string;
  time: string;
  wardId?: string;
  assignee: string;
  priority: Priority;
  done: boolean;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  mode: ExpenseMode;
  voucher: string;
  by: string;
}

export interface Challenge {
  id: string;
  title: string;
  detail: string;
  wardId?: string;
  boothId?: string;
  category: string;
  severity: ChallengeSeverity;
  status: ChallengeStatus;
  owner: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  slug: string;
  excerpt: string;
  body: string[];
  image: string;
  status: PostStatus;
  date: string;
  tags: string[];
  outlet?: string;
  venue?: string;
  location?: string;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface CommandCollections {
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
}
