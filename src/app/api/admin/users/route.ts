import { NextRequest } from "next/server";
import { fail, ok, rateLimit } from "@/lib/api";
import { actorFromRequest, ensureOwner } from "@/lib/auth";
import { mutate, read, type AdminRole } from "@/lib/store";
import { z } from "zod";
import { makeId, pushAudit } from "@/lib/store";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const roleEnum = z.enum(["owner", "manager", "captain"]);

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
  username: z.string().trim().min(3).max(30).regex(/^[a-z0-9._-]+$/i, "ইংরেজি অক্ষর, সংখ্যা ও . _ - ব্যবহার করুন"),
  password: z.string().min(8).max(120),
  role: roleEnum.default("manager"),
  wardId: z.string().trim().max(20).optional(),
});

export async function GET(req: NextRequest) {
  const actor = await actorFromRequest(req);
  if (!actor) return fail("অনুমতি নেই", 401);
  await ensureOwner();
  const db = await read();
  const users = db.adminUsers.map(({ passwordHash: _hash, ...rest }) => rest);
  return ok({ users, me: actor });
}

export async function POST(req: NextRequest) {
  const actor = await actorFromRequest(req);
  if (!actor) return fail("অনুমতি নেই", 401);
  if (actor.role !== "owner") return fail("শুধু প্রধান অ্যাডমিন ব্যবহারকারী যোগ করতে পারেন", 403);

  const gate = rateLimit(req, "admin-users", 10, 60_000);
  if (!gate.allowed) return fail("অনেকবার চেষ্টা হয়েছে — কিছুক্ষণ পর আবার চেষ্টা করুন", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("অবৈধ অনুরোধ", 400);
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return fail("তথ্য সঠিক নয়", 422, { form: parsed.error.issues[0]?.message || "" });

  const result = await mutate((db) => {
    const username = parsed.data.username.toLowerCase();
    if (db.adminUsers.some((u) => u.username === username)) return { error: "এই ইউজারনেম আগে থেকেই আছে" } as const;
    const user = {
      id: makeId("USR"),
      name: parsed.data.name,
      username,
      passwordHash: hashPassword(parsed.data.password),
      role: parsed.data.role as AdminRole,
      wardId: parsed.data.role === "captain" ? parsed.data.wardId : undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.adminUsers.push(user);
    pushAudit(db, actor.name, "user.create", `${user.name} (${user.username}) — ${user.role}`);
    const { passwordHash: _hash, ...safe } = user;
    return { user: safe } as const;
  });

  if ("error" in result && result.error) return fail(result.error, 409);
  return ok(result, 201);
}
