import { ok } from "@/lib/api";
import { read } from "@/lib/store";
import { seedPolls } from "@/content/polls";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await read();
  const polls = seedPolls.map((poll) => {
    const votes = db.pollVotes.filter((v) => v.pollId === poll.id);
    const options = poll.options.map((opt) => ({
      ...opt,
      votes: opt.votes + votes.filter((v) => v.optionId === opt.id).length,
    }));
    const totalVotes = options.reduce((s, o) => s + o.votes, 0);
    return { ...poll, options, totalVotes };
  });
  return ok({ polls });
}
