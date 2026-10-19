import type {
  Booth,
  Challenge,
  CommandSettings,
  Expense,
  Household,
  Task,
  TeamMember,
  Visit,
  Ward,
} from "@/lib/command-types";

/** Pure, isomorphic KPI helpers — safe on the server and in the client bundle. */

export function daysUntil(dateIso: string, from = new Date()) {
  const target = new Date(`${dateIso}T00:00:00`);
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - start.getTime()) / 86_400_000);
}

export function winNumber(voters: number, turnoutPct: number) {
  const casting = Math.round((voters * turnoutPct) / 100);
  return Math.floor(casting / 2) + 1;
}

export function boothTotal(booths: Booth[], key: "voters" | "male" | "female" | "youth" | "firstTime" | "households" | "visited" | "committed") {
  return booths.reduce((sum, b) => sum + b[key], 0);
}

export function wardStats(booths: Booth[], wardId: string) {
  const list = booths.filter((b) => b.wardId === wardId);
  const voters = list.reduce((s, b) => s + b.voters, 0);
  const households = list.reduce((s, b) => s + b.households, 0);
  const visited = list.reduce((s, b) => s + b.visited, 0);
  const committed = list.reduce((s, b) => s + b.committed, 0);
  return {
    voters,
    households,
    visited,
    committed,
    coverage: households ? visited / households : 0,
    commitment: households ? committed / households : 0,
    booths: list.length,
  };
}

export interface Kpis {
  voters: number;
  booths: number;
  wards: number;
  households: number;
  visited: number;
  coverage: number;
  committedHouseholds: number;
  committedVotes: number;
  winNumber: number;
  turnout: number;
  daysLeft: number;
  volunteers: number;
  teamSize: number;
  boothVacancies: number;
  wardVacancies: number;
  openChallenges: number;
  criticalChallenges: number;
  spent: number;
  cap: number;
  capPct: number;
  tasksToday: number;
  tasksDoneToday: number;
  visits7d: number;
  followUpsDue: number;
  unreadPosts: number;
}

export function computeKpis(args: {
  settings: CommandSettings;
  wards: Ward[];
  booths: Booth[];
  households: Household[];
  visits: Visit[];
  team: TeamMember[];
  tasks: Task[];
  expenses: Expense[];
  challenges: Challenge[];
}): Kpis {
  const { settings, wards, booths, households, visits, team, tasks, expenses, challenges } = args;
  const voters = booths.reduce((s, b) => s + b.voters, 0);
  const householdsTotal = booths.reduce((s, b) => s + b.households, 0);
  const visited = booths.reduce((s, b) => s + b.visited, 0);
  const committedHouseholds = booths.reduce((s, b) => s + b.committed, 0);
  const committedVotes = Math.round(
    booths.reduce((s, b) => s + (b.households ? (b.committed / b.households) * b.voters : 0), 0),
  );
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const taskToday = tasks.filter((t) => t.date === today);

  return {
    voters,
    booths: booths.length,
    wards: wards.length,
    households: householdsTotal,
    visited,
    coverage: householdsTotal ? visited / householdsTotal : 0,
    committedHouseholds,
    committedVotes,
    winNumber: winNumber(voters, settings.turnoutAssumption),
    turnout: settings.turnoutAssumption,
    daysLeft: daysUntil(settings.pollingDate),
    volunteers: team.filter((t) => t.role === "volunteer").length,
    teamSize: team.length,
    boothVacancies: booths.filter((b) => !b.captainId).length,
    wardVacancies: wards.filter((w) => !w.captainId).length,
    openChallenges: challenges.filter((c) => c.status !== "resolved").length,
    criticalChallenges: challenges.filter((c) => c.severity === "critical" && c.status !== "resolved").length,
    spent,
    cap: settings.spendCap,
    capPct: settings.spendCap ? spent / settings.spendCap : 0,
    tasksToday: taskToday.length,
    tasksDoneToday: taskToday.filter((t) => t.done).length,
    visits7d: visits.filter((v) => v.createdAt >= weekAgo).length,
    followUpsDue: households.filter((h) => h.followUp && h.followUp <= today && h.support !== "committed").length,
    unreadPosts: 0,
  };
}

export interface CommandAlert {
  id: string;
  level: "critical" | "high" | "medium" | "info";
  title: string;
  detail: string;
  href?: string;
}

export function computeAlerts(args: {
  settings: CommandSettings;
  wards: Ward[];
  booths: Booth[];
  expenses: Expense[];
  challenges: Challenge[];
  households: Household[];
  tasks: Task[];
  kpis: Kpis;
}): CommandAlert[] {
  const { settings, wards, booths, expenses, challenges, households, tasks, kpis } = args;
  const alerts: CommandAlert[] = [];
  const today = new Date().toISOString().slice(0, 10);

  const vacantWards = wards.filter((w) => !w.captainId);
  if (vacantWards.length) {
    alerts.push({
      id: "vacant-wards",
      level: "high",
      title: `${vacantWards.length}টি ওয়ার্ডে ক্যাপ্টেন পদ খালি`,
      detail: vacantWards.map((w) => `ওয়ার্ড ${w.no} (${w.name})`).join(", "),
      href: "team",
    });
  }

  const lowCoverage = wards.filter((w) => {
    const s = wardStats(booths, w.id);
    return s.booths > 0 && s.coverage < 0.4;
  });
  if (lowCoverage.length) {
    alerts.push({
      id: "low-coverage",
      level: "high",
      title: `${lowCoverage.length}টি ওয়ার্ডে কভারেজ ৪০%-এর নিচে`,
      detail: lowCoverage.map((w) => `ওয়ার্ড ${w.no}`).join(", ") + " — আজকের রুটে অগ্রাধিকার দিন।",
      href: "map",
    });
  }

  const critical = challenges.filter((c) => c.severity === "critical" && c.status !== "resolved");
  if (critical.length) {
    alerts.push({
      id: "critical-challenges",
      level: "critical",
      title: `${critical.length}টি জরুরি চ্যালেঞ্জ খোলা`,
      detail: critical[0].title,
      href: "challenges",
    });
  }

  if (kpis.capPct >= 0.7) {
    alerts.push({
      id: "cap",
      level: kpis.capPct >= 0.9 ? "critical" : "high",
      title: `ব্যয়সীমার ${Math.round(kpis.capPct * 100)}% ব্যবহৃত`,
      detail: "বাকি দিনগুলোতে ব্যয় পরিকল্পনা পুনর্বিবেচনা করুন।",
      href: "money",
    });
  }

  if (settings.pollingDate && kpis.daysLeft <= 120 && kpis.daysLeft >= 0) {
    alerts.push({
      id: "countdown",
      level: "info",
      title: `ভোটের দিন আর ${kpis.daysLeft} দিন`,
      detail: `${settings.pollingDate} — বুথভিত্তিক প্রস্তুতি শুরু করুন।`,
      href: "situation",
    });
  }

  const overdue = tasks.filter((t) => !t.done && t.date < today).length;
  if (overdue) {
    alerts.push({
      id: "overdue",
      level: "medium",
      title: `${overdue}টি কাজ নির্ধারিত তারিখ ছাড়িয়ে গেছে`,
      detail: "দৈনিক পরিকল্পনা থেকে পুনরায় সময় দিন।",
      href: "plan",
    });
  }

  if (kpis.followUpsDue) {
    alerts.push({
      id: "followups",
      level: "medium",
      title: `${kpis.followUpsDue}টি খানায় ফলো-আপ বাকি`,
      detail: "আজকের রুটে ফলো-আপগুলো যোগ করুন।",
      href: "canvass",
    });
  }

  const cashBig = expenses.filter((e) => e.amount >= 20000 && e.mode === "cash");
  if (cashBig.length) {
    alerts.push({
      id: "cash-rule",
      level: "medium",
      title: "২০,০০০ টাকার বেশি নগদ ব্যয়",
      detail: `${cashBig.length}টি লেনদেন চেক/ব্যাংকে হওয়া উচিত — ব্যয় ট্র্যাকার দেখুন।`,
      href: "money",
    });
  }

  const noFollow = households.filter((h) => h.followUp && h.followUp < today && h.support !== "committed").length;
  if (noFollow > 10) {
    alerts.push({
      id: "stale-follow",
      level: "medium",
      title: "ফলো-আপ তারিখ পেরিয়ে গেছে",
      detail: `${noFollow}টি খানা এক সপ্তাহের বেশি অপেক্ষায় আছে।`,
      href: "canvass",
    });
  }

  return alerts.slice(0, 6);
}

export function computeBrief(args: {
  booths: Booth[];
  wards: Ward[];
  tasks: Task[];
  challenges: Challenge[];
  households: Household[];
  kpis: Kpis;
}) {
  const { booths, wards, tasks, challenges, households, kpis } = args;
  const today = new Date().toISOString().slice(0, 10);
  const items: { title: string; detail: string; href: string; done?: boolean }[] = [];

  const todayTasks = tasks
    .filter((t) => t.date === today && !t.done)
    .sort((a, b) => (a.priority === "high" ? -1 : 1) - (b.priority === "high" ? -1 : 1));
  todayTasks.slice(0, 2).forEach((t) =>
    items.push({ title: t.title, detail: `${t.time} · ${t.assignee}`, href: "plan" }),
  );

  const weakest = [...wards]
    .map((w) => ({ w, s: wardStats(booths, w.id) }))
    .filter((x) => x.s.booths > 0)
    .sort((a, b) => a.s.coverage - b.s.coverage)[0];
  if (weakest) {
    items.push({
      title: `সবচেয়ে কম কভারেজ: ওয়ার্ড ${weakest.w.no}`,
      detail: `${Math.round(weakest.s.coverage * 100)}% খানা ভিজিট হয়েছে — আজ ${Math.max(1, Math.round(weakest.s.households * 0.05))} খানা লক্ষ্য`,
      href: "canvass",
    });
  }

  if (kpis.followUpsDue) {
    items.push({
      title: `${kpis.followUpsDue}টি ফলো-আপ`,
      detail: "আজকের রুটে যোগ করে দিন",
      href: "canvass",
    });
  }

  const topChallenge = challenges
    .filter((c) => c.status !== "resolved")
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0];
  if (topChallenge) {
    items.push({ title: `চ্যালেঞ্জ: ${topChallenge.title}`, detail: topChallenge.category, href: "challenges" });
  }

  const stale = households.filter((h) => h.followUp && h.followUp <= today && h.support !== "committed").length;
  if (stale) {
    items.push({ title: `${stale}টি খানায় ফিরে যাওয়া দরকার`, detail: "ফলো-আপ তারিখ পেরিয়ে গেছে", href: "canvass" });
  }

  return items.slice(0, 5);
}

function severityRank(s: Challenge["severity"]) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s];
}
