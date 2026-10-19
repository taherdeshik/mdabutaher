import { NextRequest } from "next/server";
import { voteSchema, fieldErrors } from "@/lib/validation";
import { fail, ok, rateLimit, tooMany } from "@/lib/api";
import { mutate } from "@/lib/store";
import { seedPolls } from "@/content/polls";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limit = rateLimit(req, "vote", 12, 60_000);
  if (!limit.allowed) return tooMany();
  const { id } = await params;

  const poll = seedPolls.find((p) => p.id === id);
  if (!poll) return fail("জরিপটি পাওয়া যায়নি", 404);
  if (poll.status === "closed") return fail("এই জরিপটি বন্ধ হয়েছে", 409);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("অবৈধ অনুরোধ", 400);
  }
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return fail("অবৈধ ভোট", 422, fieldErrors(parsed.error));
  if (!poll.options.some((o) => o.id === parsed.data.optionId)) return fail("বিকল্পটি সঠিক নয়", 422);

  const result = await mutate((db) => {
    const duplicate = db.pollVotes.find(
      (v) => v.pollId === id && v.fingerprint === parsed.data.fingerprint,
    );
    if (duplicate) return { duplicate: true, previous: duplicate.optionId };
    db.pollVotes.push({
      pollId: id,
      optionId: parsed.data.optionId,
      fingerprint: parsed.data.fingerprint,
      createdAt: new Date().toISOString(),
    });
    return { duplicate: false };
  });

  if (result.duplicate) {
    return fail("আপনি ইতিমধ্যে এই জরিপে ভোট দিয়েছেন", 409, { optionId: result.previous || "" });
  }

  return ok({ message: "ভোট গ্রহণ করা হয়েছে। অংশগ্রহণের জন্য ধন্যবাদ!" }, 201);
}
