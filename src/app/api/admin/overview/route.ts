import { NextRequest } from "next/server";
import { fail, ok, requireAdmin } from "@/lib/api";
import { read } from "@/lib/store";
import { seedPolls } from "@/content/polls";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return fail("অনুমতি নেই", 401);
  const db = await read();
  const now = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  const trend = days.map((day) => ({
    day,
    appointments: db.appointments.filter((a) => a.createdAt.slice(0, 10) === day).length,
    feedback: db.feedback.filter((f) => f.createdAt.slice(0, 10) === day).length,
    volunteers: db.volunteers.filter((v) => v.createdAt.slice(0, 10) === day).length,
  }));

  const categories = db.feedback.reduce<Record<string, number>>((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {});

  const wards = db.feedback.reduce<Record<string, number>>((acc, f) => {
    acc[f.ward] = (acc[f.ward] || 0) + 1;
    return acc;
  }, {});

  const pipeline = ["new", "contacted", "engaged", "supporter"].map((stage) => ({
    stage,
    count: db.leads.filter((l) => l.stage === stage).length,
  }));

  return ok({
    counts: {
      appointments: db.appointments.length,
      pendingAppointments: db.appointments.filter((a) => a.status === "pending").length,
      feedback: db.feedback.length,
      openFeedback: db.feedback.filter((f) => f.status !== "resolved").length,
      threats: db.feedback.filter((f) => f.kind === "threat").length,
      volunteers: db.volunteers.length,
      leads: db.leads.length,
      messages: db.messages.length,
      unread: db.messages.filter((m) => !m.read).length,
      subscribers: db.subscribers.length,
      registrations: db.registrations.length,
      pollVotes: seedPolls.reduce((s, p) => s + p.options.reduce((x, o) => x + o.votes, 0), 0) + db.pollVotes.length,
    },
    trend,
    categories,
    wards,
    pipeline,
    recent: {
      appointments: [...db.appointments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      feedback: [...db.feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      messages: [...db.messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    },
  });
}
