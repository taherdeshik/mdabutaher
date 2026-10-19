import { ok } from "@/lib/api";
import { read } from "@/lib/store";
import { seedPolls } from "@/content/polls";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await read();
  return ok({
    appointments: db.appointments.length,
    feedback: db.feedback.length,
    resolved: db.feedback.filter((f) => f.status === "resolved").length,
    volunteers: db.volunteers.length,
    pollVotes: seedPolls.reduce((s, p) => s + p.options.reduce((x, o) => x + o.votes, 0), 0) + db.pollVotes.length,
    subscribers: db.subscribers.length,
  });
}
