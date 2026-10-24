import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { fail, ok, requireAdmin } from "@/lib/api";
import { actorFromRequest } from "@/lib/auth";
import { makeId, mutate, pushAudit, read } from "@/lib/store";
import type {
  Booth,
  Challenge,
  Expense,
  Household,
  Post,
  Task,
  TeamMember,
  Visit,
  Ward,
} from "@/lib/command-types";
import { computeAlerts, computeBrief, computeKpis, wardStats } from "@/lib/command-calc";
import { slugify } from "@/lib/utils";
import { sitePageById, type SitePageContent } from "@/content/site-pages";
import { mergeHomeCopy } from "@/content/home-sections";
import { campaignVideos } from "@/content/videos";
import { galleryPhotos, galleryPosters } from "@/content/gallery";

export const dynamic = "force-dynamic";

const str = (v: unknown, max = 220) => String(v ?? "").trim().slice(0, max);
const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (v: unknown) => v === true || v === "true";
const strList = (v: unknown, max = 8) =>
  Array.isArray(v) ? v.map((x) => str(x, 40)).filter(Boolean).slice(0, max) : [];

const todayIso = () => new Date().toISOString().slice(0, 10);

async function snapshot() {
  const db = await read();
  const kpis = computeKpis(db);
  const alerts = computeAlerts({ ...db, kpis });
  const brief = computeBrief({ ...db, kpis });

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const trend = days.map((day) => ({
    day,
    visits: db.visits.filter((v) => v.createdAt.slice(0, 10) === day).length,
    feedback: db.feedback.filter((f) => f.createdAt.slice(0, 10) === day).length,
    leads: db.leads.filter((l) => l.createdAt.slice(0, 10) === day).length,
  }));

  const wardCoverage = db.wards.map((w) => ({
    id: w.id,
    no: w.no,
    name: w.name,
    strength: w.strength,
    ...wardStats(db.booths, w.id),
  }));

  const sortedVisits = [...db.visits].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    settings: db.settings,
    wards: db.wards,
    booths: db.booths,
    households: db.households,
    visits: sortedVisits.slice(0, 250),
    team: db.team,
    tasks: db.tasks,
    expenses: [...db.expenses].sort((a, b) => b.date.localeCompare(a.date)),
    challenges: [...db.challenges].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    posts: [...db.posts].sort((a, b) => b.date.localeCompare(a.date)),
    siteContent: db.siteContent || {},
    homeCopy: db.homeCopy || {},
    gallery: db.gallery || { photos: [], posters: [], videos: [], hidden: [] },
    audit: db.audit.slice(0, 40),
    kpis,
    alerts,
    brief,
    trend,
    wardCoverage,
    crm: {
      leads: [...db.leads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 40),
      feedback: [...db.feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40),
      appointments: [...db.appointments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40),
      messages: [...db.messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40),
      counts: {
        leads: db.leads.length,
        newLeads: db.leads.filter((l) => l.stage === "new").length,
        supporters: db.leads.filter((l) => l.stage === "supporter").length,
        feedback: db.feedback.length,
        openFeedback: db.feedback.filter((f) => f.status !== "resolved").length,
        threats: db.feedback.filter((f) => f.kind === "threat").length,
        appointments: db.appointments.length,
        pendingAppointments: db.appointments.filter((a) => a.status === "pending").length,
        messages: db.messages.length,
        unread: db.messages.filter((m) => !m.read).length,
      },
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return fail("অনুমতি নেই", 401);
  return ok(await snapshot());
}

export async function POST(req: NextRequest) {
  const actorInfo = await actorFromRequest(req);
  if (!actorInfo) return fail("অনুমতি নেই", 401);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("অবৈধ অনুরোধ", 400);
  }

  const entity = str(body.entity, 30);
  const action = str(body.action, 30);
  const id = str(body.id, 80);
  const payload = (body.data || {}) as Record<string, unknown>;
  const actor = actorInfo.legacy ? str(body.actor, 60) || "ক্যাম্প ম্যানেজার" : actorInfo.name;
  const role = actorInfo.role;
  if (role === "captain" && ["settings", "team", "expense", "booth", "page", "home", "photo", "poster", "video"].includes(entity)) {
    return fail("এই অংশে আপনার সম্পাদনার অনুমতি নেই", 403);
  }
  if (role === "captain" && entity === "challenge" && action === "delete") {
    return fail("চ্যালেঞ্জ মুছতে শুধু ম্যানেজার পারেন", 403);
  }

  try {
    await mutate((db) => {
      switch (entity) {
        case "visit": {
          if (action !== "create") throw new Error("অসমর্থিত কাজ");
          const household = db.households.find((h) => h.id === id || h.id === str(payload.householdId, 80));
          if (!household) throw new Error("খানা পাওয়া যায়নি");
          const status = str(payload.status, 30) as Visit["status"];
          const allowed: Visit["status"][] = ["met-supportive", "met-undecided", "met-hostile", "absent", "refused"];
          if (!allowed.includes(status)) throw new Error("ভিজিট স্ট্যাটাস সঠিক নয়");

          const visit: Visit = {
            id: makeId("VIS"),
            householdId: household.id,
            boothId: household.boothId,
            wardId: household.wardId,
            by: str(payload.by, 80) || actor,
            status,
            issues: strList(payload.issues),
            promise: str(payload.promise, 300) || undefined,
            followUp: str(payload.followUp, 10) || undefined,
            note: str(payload.note, 500) || undefined,
            createdAt: new Date().toISOString(),
          };
          db.visits.push(visit);

          const booth = db.booths.find((b) => b.id === household.boothId);
          const firstVisit = household.status === "unvisited";
          if (firstVisit && booth) booth.visited = Math.min(booth.households, booth.visited + 1);

          household.lastVisit = visit.createdAt.slice(0, 10);
          household.followUp = visit.followUp;
          household.issues = visit.issues;
          household.note = visit.note;
          if (status === "met-supportive") {
            household.status = "committed";
            household.support = "committed";
            if (booth && firstVisit) booth.committed = Math.min(booth.households, booth.committed + 1);
          } else if (status === "met-hostile" || status === "refused") {
            household.status = "hostile";
            household.support = "hostile";
          } else if (status !== "absent") {
            household.status = "visited";
            household.support = "leaning";
          } else {
            household.status = "unvisited";
          }
          pushAudit(db, actor, "visit.create", `${household.head} — ${status}`);
          break;
        }

        case "household": {
          const household = db.households.find((h) => h.id === id);
          if (!household) throw new Error("খানা পাওয়া যায়নি");
          if (payload.followUp !== undefined) household.followUp = str(payload.followUp, 10) || undefined;
          if (payload.note !== undefined) household.note = str(payload.note, 500) || undefined;
          if (payload.support !== undefined) {
            const support = str(payload.support, 20) as Household["support"];
            if (["committed", "leaning", "undecided", "hostile"].includes(support)) household.support = support;
          }
          pushAudit(db, actor, "household.update", household.head);
          break;
        }

        case "task": {
          if (action === "create") {
            const title = str(payload.title, 160);
            if (!title) throw new Error("শিরোনাম দিন");
            const task: Task = {
              id: makeId("TSK"),
              title,
              type: (str(payload.type, 20) || "admin") as Task["type"],
              date: str(payload.date, 10) || todayIso(),
              time: str(payload.time, 5) || "10:00",
              wardId: str(payload.wardId, 10) || undefined,
              assignee: str(payload.assignee, 80) || actor,
              priority: (str(payload.priority, 10) || "medium") as Task["priority"],
              done: false,
              notes: str(payload.notes, 300) || undefined,
            };
            db.tasks.push(task);
            pushAudit(db, actor, "task.create", task.title);
          } else if (action === "toggle") {
            const task = db.tasks.find((t) => t.id === id);
            if (!task) throw new Error("কাজ পাওয়া যায়নি");
            task.done = payload.done === undefined ? !task.done : bool(payload.done);
            pushAudit(db, actor, "task.toggle", `${task.title} → ${task.done ? "সম্পন্ন" : "বাকি"}`);
          } else if (action === "delete") {
            db.tasks = db.tasks.filter((t) => t.id !== id);
            pushAudit(db, actor, "task.delete", id);
          } else if (action === "update") {
            const task = db.tasks.find((t) => t.id === id);
            if (!task) throw new Error("কাজ পাওয়া যায়নি");
            Object.assign(task, {
              title: payload.title !== undefined ? str(payload.title, 160) : task.title,
              date: payload.date !== undefined ? str(payload.date, 10) : task.date,
              time: payload.time !== undefined ? str(payload.time, 5) : task.time,
              assignee: payload.assignee !== undefined ? str(payload.assignee, 80) : task.assignee,
              priority: payload.priority !== undefined ? (str(payload.priority, 10) as Task["priority"]) : task.priority,
              notes: payload.notes !== undefined ? str(payload.notes, 300) : task.notes,
            });
            pushAudit(db, actor, "task.update", task.title);
          }
          break;
        }

        case "expense": {
          if (action === "create") {
            const amount = num(payload.amount);
            if (!amount || amount <= 0) throw new Error("সঠিক পরিমাণ দিন");
            const mode = str(payload.mode, 10) as Expense["mode"];
            if (!["cash", "cheque", "bank"].includes(mode)) throw new Error("ব্যয়ের ধরন সঠিক নয়");
            const spent = db.expenses.reduce((s, e) => s + e.amount, 0);
            if (spent + amount > db.settings.spendCap) {
              throw new Error(`ব্যয়সীমা ছাড়িয়ে যাবে — অবশিষ্ট ${(db.settings.spendCap - spent).toLocaleString("en-US")} টাকা`);
            }
            const expense: Expense = {
              id: makeId("EXP"),
              date: str(payload.date, 10) || todayIso(),
              category: str(payload.category, 60) || "অন্যান্য",
              description: str(payload.description, 200),
              amount,
              mode,
              voucher: str(payload.voucher, 40) || `V-${Math.floor(1000 + Math.random() * 9000)}`,
              by: actor,
            };
            db.expenses.push(expense);
            pushAudit(db, actor, "expense.create", `${expense.category} ৳${amount}`);
          } else if (action === "delete") {
            db.expenses = db.expenses.filter((e) => e.id !== id);
            pushAudit(db, actor, "expense.delete", id);
          }
          break;
        }

        case "challenge": {
          if (action === "create") {
            const title = str(payload.title, 160);
            if (!title) throw new Error("শিরোনাম দিন");
            const now = new Date().toISOString();
            const challenge: Challenge = {
              id: makeId("CHL"),
              title,
              detail: str(payload.detail, 800),
              wardId: str(payload.wardId, 10) || undefined,
              boothId: str(payload.boothId, 10) || undefined,
              category: str(payload.category, 60) || "অন্যান্য",
              severity: (str(payload.severity, 10) || "medium") as Challenge["severity"],
              status: "open",
              owner: str(payload.owner, 80) || actor,
              resolution: "",
              createdAt: now,
              updatedAt: now,
            };
            db.challenges.push(challenge);
            pushAudit(db, actor, "challenge.create", challenge.title);
          } else if (action === "update") {
            const challenge = db.challenges.find((c) => c.id === id);
            if (!challenge) throw new Error("চ্যালেঞ্জ পাওয়া যায়নি");
            if (payload.status !== undefined) challenge.status = str(payload.status, 20) as Challenge["status"];
            if (payload.severity !== undefined) challenge.severity = str(payload.severity, 10) as Challenge["severity"];
            if (payload.owner !== undefined) challenge.owner = str(payload.owner, 80);
            if (payload.resolution !== undefined) challenge.resolution = str(payload.resolution, 600);
            challenge.updatedAt = new Date().toISOString();
            pushAudit(db, actor, "challenge.update", `${challenge.title} → ${challenge.status}`);
          } else if (action === "delete") {
            db.challenges = db.challenges.filter((c) => c.id !== id);
            pushAudit(db, actor, "challenge.delete", id);
          }
          break;
        }

        case "team": {
          if (action === "create") {
            const name = str(payload.name, 80);
            const phone = str(payload.phone, 20);
            if (!name || !phone) throw new Error("নাম ও ফোন নম্বর দিন");
            const member: TeamMember = {
              id: makeId("TMM"),
              name,
              phone,
              role: (str(payload.role, 24) || "volunteer") as TeamMember["role"],
              wardId: str(payload.wardId, 10) || undefined,
              boothId: str(payload.boothId, 10) || undefined,
              status: "active",
              joinedAt: todayIso(),
            };
            db.team.push(member);
            if (member.role === "ward-captain" && member.wardId) {
              const ward = db.wards.find((w) => w.id === member.wardId);
              if (ward) ward.captainId = member.id;
            }
            if (member.role === "booth-captain" && member.boothId) {
              const booth = db.booths.find((b) => b.id === member.boothId);
              if (booth) booth.captainId = member.id;
            }
            pushAudit(db, actor, "team.create", `${member.name} — ${member.role}`);
          } else if (action === "delete") {
            const member = db.team.find((t) => t.id === id);
            if (member) {
              db.wards.forEach((w) => {
                if (w.captainId === id) w.captainId = undefined;
              });
              db.booths.forEach((b) => {
                if (b.captainId === id) b.captainId = undefined;
              });
              db.team = db.team.filter((t) => t.id !== id);
              pushAudit(db, actor, "team.delete", member.name);
            }
          } else if (action === "update") {
            const member = db.team.find((t) => t.id === id);
            if (!member) throw new Error("সদস্য পাওয়া যায়নি");
            if (payload.status !== undefined) member.status = str(payload.status, 12) as TeamMember["status"];
            if (payload.phone !== undefined) member.phone = str(payload.phone, 20);
            pushAudit(db, actor, "team.update", `${member.name} → ${member.status}`);
          }
          break;
        }

        case "booth": {
          const booth = db.booths.find((b) => b.id === id);
          if (!booth) throw new Error("বুথ পাওয়া যায়নি");
          if (payload.captainId !== undefined) {
            const captainId = str(payload.captainId, 80);
            booth.captainId = captainId || undefined;
            const member = db.team.find((t) => t.id === captainId);
            if (member) {
              member.role = "booth-captain";
              member.wardId = booth.wardId;
              member.boothId = booth.id;
            }
            pushAudit(db, actor, "booth.assign", `${booth.code} → ${member?.name || "খালি"}`);
          }
          if (payload.strength !== undefined) booth.strength = str(payload.strength, 10) as Booth["strength"];
          break;
        }

        case "ward": {
          const ward = db.wards.find((w) => w.id === id);
          if (!ward) throw new Error("ওয়ার্ড পাওয়া যায়নি");
          if (payload.strength !== undefined) ward.strength = str(payload.strength, 10) as Ward["strength"];
          if (payload.captainId !== undefined) {
            ward.captainId = str(payload.captainId, 80) || undefined;
            const member = db.team.find((t) => t.id === ward.captainId);
            if (member) {
              member.role = "ward-captain";
              member.wardId = ward.id;
            }
          }
          pushAudit(db, actor, "ward.update", ward.name);
          break;
        }

        case "post": {
          if (action === "create" || action === "update") {
            const isNew = action === "create";
            const existing = isNew ? undefined : db.posts.find((p) => p.id === id);
            if (!isNew && !existing) throw new Error("পোস্ট পাওয়া যায়নি");
            const title = str(payload.title, 180) || existing?.title || "";
            if (!title) throw new Error("শিরোনাম দিন");
            const explicitSlug = slugify(str(payload.slug, 120));
            const baseSlug =
              explicitSlug ||
              (existing && title === existing.title ? existing.slug : slugify(title)) ||
              `post-${Date.now()}`;
            const slug = db.posts.some((p) => p.slug === baseSlug && p.id !== existing?.id)
              ? `${baseSlug}-${Math.floor(Math.random() * 900 + 100)}`
              : baseSlug;
            const now = new Date().toISOString();
            const post: Post = {
              id: existing?.id || makeId("POST"),
              type: (str(payload.type, 10) || existing?.type || "news") as Post["type"],
              title,
              slug,
              excerpt: str(payload.excerpt, 300) || existing?.excerpt || "",
              body: Array.isArray(payload.body)
                ? payload.body.map((p) => str(p, 1200)).filter(Boolean)
                : typeof payload.body === "string"
                  ? str(payload.body, 6000).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
                  : existing?.body || [],
              image: str(payload.image, 240) || existing?.image || "campaign",
              status: (str(payload.status, 12) || existing?.status || "draft") as Post["status"],
              date: str(payload.date, 10) || existing?.date || todayIso(),
              tags: payload.tags !== undefined ? strList(payload.tags, 6) : existing?.tags || [],
              outlet: payload.outlet !== undefined ? str(payload.outlet, 80) : existing?.outlet,
              venue: payload.venue !== undefined ? str(payload.venue, 120) : existing?.venue,
              location: payload.location !== undefined ? str(payload.location, 120) : existing?.location,
              featured: payload.featured !== undefined ? bool(payload.featured) : existing?.featured,
              createdAt: existing?.createdAt || now,
              updatedAt: now,
            };
            if (isNew) db.posts.push(post);
            else Object.assign(existing!, post);
            pushAudit(db, actor, `post.${action}`, `${post.type}: ${post.title}`);
          } else if (action === "delete") {
            db.posts = db.posts.filter((p) => p.id !== id);
            pushAudit(db, actor, "post.delete", id);
          } else if (action === "toggle") {
            const post = db.posts.find((p) => p.id === id);
            if (!post) throw new Error("পোস্ট পাওয়া যায়নি");
            post.status = post.status === "published" ? "draft" : "published";
            post.updatedAt = new Date().toISOString();
            pushAudit(db, actor, "post.toggle", `${post.title} → ${post.status}`);
          }
          break;
        }

        case "settings": {
          const settings = db.settings;
          if (payload.pollingDate !== undefined) settings.pollingDate = str(payload.pollingDate, 10);
          if (payload.turnoutAssumption !== undefined) {
            settings.turnoutAssumption = Math.min(95, Math.max(35, num(payload.turnoutAssumption, settings.turnoutAssumption)));
          }
          if (payload.spendCap !== undefined) settings.spendCap = Math.max(100000, num(payload.spendCap, settings.spendCap));
          if (payload.unionVoters !== undefined) settings.unionVoters = Math.max(1000, num(payload.unionVoters, settings.unionVoters));
          pushAudit(db, actor, "settings.update", "নির্বাচনী সেটিংস আপডেট");
          break;
        }

        case "roll": {
          if (action !== "import") throw new Error("অসমর্থিত কাজ");
          const rows = Array.isArray(payload.rows) ? (payload.rows as Record<string, unknown>[]) : [];
          let updated = 0;
          for (const row of rows) {
            const code = str(row.code, 20);
            const booth = db.booths.find((b) => b.code === code || b.id === code);
            if (!booth) continue;
            const voters = num(row.voters, 0);
            if (voters > 0) {
              booth.voters = Math.round(voters);
              booth.male = num(row.male, Math.round(voters * 0.495));
              booth.female = num(row.female, voters - booth.male);
              booth.youth = num(row.youth, booth.youth);
              booth.firstTime = num(row.firstTime, booth.firstTime);
              booth.households = Math.max(1, num(row.households, Math.round(voters / 4.35)));
              booth.visited = Math.min(booth.visited, booth.households);
              booth.committed = Math.min(booth.committed, booth.households);
              updated += 1;
            }
          }
          if (!updated) throw new Error("কোনো মিলে যাওয়া বুথ কোড পাওয়া যায়নি");
          db.settings.unionVoters = db.booths.reduce((s, b) => s + b.voters, 0);
          pushAudit(db, actor, "roll.import", `${updated}টি বুথ আপডেট`);
          break;
        }

        case "crm": {
          if (entity === "crm" && action === "lead-stage") {
            const lead = db.leads.find((l) => l.id === id);
            if (!lead) throw new Error("লিড পাওয়া যায়নি");
            lead.stage = str(payload.stage, 20) as typeof lead.stage;
            lead.updatedAt = new Date().toISOString();
          } else if (action === "feedback-status") {
            const item = db.feedback.find((f) => f.id === id);
            if (!item) throw new Error("ফিডব্যাক পাওয়া যায়নি");
            item.status = str(payload.status, 20) as typeof item.status;
            item.updatedAt = new Date().toISOString();
            item.timeline.push({ at: new Date().toISOString(), note: str(payload.note, 200) || "অবস্থা আপডেট", by: actor });
          } else if (action === "appointment-status") {
            const item = db.appointments.find((a) => a.id === id);
            if (!item) throw new Error("অ্যাপয়েন্টমেন্ট পাওয়া যায়নি");
            item.status = str(payload.status, 20) as typeof item.status;
          } else if (action === "message-read") {
            const item = db.messages.find((m) => m.id === id);
            if (!item) throw new Error("বার্তা পাওয়া যায়নি");
            item.read = true;
          }
          pushAudit(db, actor, `crm.${action}`, id);
          break;
        }

        case "page": {
          const pageId = str(id || payload.id, 60);
          const def = sitePageById.get(pageId);
          if (!def) throw new Error("পেজ পাওয়া যায়নি");

          if (action === "reset") {
            delete db.siteContent[pageId];
            pushAudit(db, actor, "page.reset", `${def.label} (${def.href})`);
            break;
          }
          if (action !== "update") throw new Error("অসমর্থিত কাজ");

          const prev = db.siteContent[pageId];
          const next: SitePageContent = {
            label: str(payload.label, 60),
            eyebrow: str(payload.eyebrow, 90),
            title: str(payload.title, 160),
            description: str(payload.description, 500),
            body: str(payload.body, 2500),
            image: str(payload.image, 400),
            video: str(payload.video, 300),
            visible: payload.visible === undefined ? prev?.visible !== false : bool(payload.visible),
            updatedAt: new Date().toISOString(),
            updatedBy: actor,
          };
          db.siteContent[pageId] = next;
          pushAudit(db, actor, "page.update", `${def.href} — ${next.title || next.label || "আপডেট"}`);
          break;
        }

        case "home": {
          const sectionId = str(id || payload.id, 40);
          if (!sectionId) throw new Error("সেকশন পাওয়া যায়নি");
          if (action === "reset") {
            delete db.homeCopy[sectionId];
            pushAudit(db, actor, "home.reset", sectionId);
            break;
          }
          if (action !== "update") throw new Error("অসমর্থিত কাজ");
          db.homeCopy[sectionId] = {
            ...mergeHomeCopy(db.homeCopy[sectionId]),
            eyebrow: str(payload.eyebrow, 120),
            title: str(payload.title, 200),
            description: str(payload.description, 600),
            visible: payload.visible === undefined ? db.homeCopy[sectionId]?.visible !== false : bool(payload.visible),
          };
          pushAudit(db, actor, "home.update", `${sectionId} — ${db.homeCopy[sectionId].title || "লেখা বদল"}`);
          break;
        }

        case "photo": {
          const store = db.gallery;
          if (action === "create") {
            const src = str(payload.src, 400);
            if (!src) throw new Error("ছবি দিন (আপলোড বা লিংক)");
            store.photos.unshift({
              id: makeId("IMG"),
              src,
              caption: str(payload.caption, 180) || "নতুন ছবি",
              tag: str(payload.tag, 40) || "নতুন",
              tall: bool(payload.tall),
              createdAt: new Date().toISOString(),
            });
            pushAudit(db, actor, "photo.create", str(payload.caption, 80) || src);
          } else if (action === "delete") {
            const curated = galleryPhotos.some((p) => p.key === id);
            if (curated) {
              // Curated (coded) photos are hidden, never deleted.
              store.hidden = Array.from(new Set([...store.hidden, id]));
            } else {
              store.photos = store.photos.filter((p) => p.id !== id);
            }
            pushAudit(db, actor, curated ? "photo.hide" : "photo.delete", id);
          } else if (action === "update") {
            const photo = store.photos.find((p) => p.id === id);
            if (!photo) throw new Error("ছবি পাওয়া যায়নি");
            if (payload.caption !== undefined) photo.caption = str(payload.caption, 180);
            if (payload.tag !== undefined) photo.tag = str(payload.tag, 40);
            if (payload.tall !== undefined) photo.tall = bool(payload.tall);
            pushAudit(db, actor, "photo.update", photo.caption);
          } else if (action === "restore") {
            store.hidden = store.hidden.filter((h) => h !== id);
            pushAudit(db, actor, "photo.restore", id);
          } else throw new Error("অসমর্থিত কাজ");
          break;
        }

        case "poster": {
          const store = db.gallery;
          if (action === "create") {
            const src = str(payload.src, 400);
            if (!src) throw new Error("পোস্টারের ছবি দিন");
            store.posters.unshift({
              id: makeId("PST"),
              src,
              title: str(payload.title, 160) || "নতুন পোস্টার",
              subtitle: str(payload.subtitle, 200),
              election: bool(payload.election),
              createdAt: new Date().toISOString(),
            });
            pushAudit(db, actor, "poster.create", str(payload.title, 80) || src);
          } else if (action === "delete") {
            const curated = galleryPosters.some((p) => p.key === id);
            if (curated) {
              store.hidden = Array.from(new Set([...store.hidden, id]));
            } else {
              store.posters = store.posters.filter((p) => p.id !== id);
            }
            pushAudit(db, actor, curated ? "poster.hide" : "poster.delete", id);
          } else if (action === "update") {
            const poster = store.posters.find((p) => p.id === id);
            if (!poster) throw new Error("পোস্টার পাওয়া যায়নি");
            if (payload.title !== undefined) poster.title = str(payload.title, 160);
            if (payload.subtitle !== undefined) poster.subtitle = str(payload.subtitle, 200);
            if (payload.election !== undefined) poster.election = bool(payload.election);
            pushAudit(db, actor, "poster.update", poster.title);
          } else if (action === "restore") {
            store.hidden = store.hidden.filter((h) => h !== id);
            pushAudit(db, actor, "poster.restore", id);
          } else throw new Error("অসমর্থিত কাজ");
          break;
        }

        case "video": {
          const store = db.gallery;
          if (action === "create") {
            const raw = str(payload.url || payload.youtubeId, 300);
            const youtubeId =
              raw.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{6,})/)?.[1] ??
              (/^[\w-]{6,}$/.test(raw) ? raw : "");
            if (!youtubeId) throw new Error("সঠিক ইউটিউব লিংক বা আইডি দিন");
            const existing = new Set([...campaignVideos.map((v) => v.id), ...store.videos.map((v) => v.youtubeId)]);
            if (existing.has(youtubeId)) throw new Error("এই ভিডিও আগেই যোগ করা হয়েছে");
            store.videos.unshift({
              id: makeId("VID"),
              youtubeId,
              title: str(payload.title, 200) || "নতুন ভিডিও",
              category: str(payload.category, 40) || "প্রচারণা",
              note: str(payload.note, 300) || undefined,
              createdAt: new Date().toISOString(),
            });
            pushAudit(db, actor, "video.create", `${str(payload.title, 80)} (${youtubeId})`);
          } else if (action === "delete") {
            const curated = campaignVideos.some((v) => v.id === id);
            if (curated) {
              store.hidden = Array.from(new Set([...store.hidden, id]));
            } else {
              store.videos = store.videos.filter((v) => v.id !== id);
            }
            pushAudit(db, actor, curated ? "video.hide" : "video.delete", id);
          } else if (action === "update") {
            const video = store.videos.find((v) => v.id === id);
            if (!video) throw new Error("ভিডিও পাওয়া যায়নি");
            if (payload.title !== undefined) video.title = str(payload.title, 200);
            if (payload.category !== undefined) video.category = str(payload.category, 40);
            if (payload.note !== undefined) video.note = str(payload.note, 300) || undefined;
            pushAudit(db, actor, "video.update", video.title);
          } else if (action === "restore") {
            store.hidden = store.hidden.filter((h) => h !== id);
            pushAudit(db, actor, "video.restore", id);
          } else throw new Error("অসমর্থিত কাজ");
          break;
        }

        default:
          throw new Error("অসমর্থিত অনুরোধ");
      }
      db.meta.seeded = true;
    });

    // Page edits must show up immediately, not after the ISR window.
    if (["photo", "poster", "video"].includes(entity)) {
      for (const path of ["/gallery", "/gallery/photos", "/gallery/posters", "/gallery/election-posters", "/video-gallery"]) {
        revalidatePath(path);
      }
    }
    if (entity === "home") {
      revalidatePath("/");
    }
    if (entity === "page") {
      const target = sitePageById.get(str(id || payload.id, 60));
      revalidatePath("/");
      if (target && target.href !== "/") revalidatePath(target.href);
    }

    return ok(await snapshot());
  } catch (error) {
    return fail(error instanceof Error ? error.message : "অনুরোধ ব্যর্থ হয়েছে", 400);
  }
}
