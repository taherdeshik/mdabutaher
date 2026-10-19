import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { actorFromRequest, hashPassword } from "@/lib/auth";
import { mutate, pushAudit } from "@/lib/store";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  role: z.enum(["owner", "manager", "captain"]).optional(),
  wardId: z.string().trim().max(20).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(120).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(req);
  if (!actor) return fail("অনুমতি নেই", 401);
  if (actor.role !== "owner") return fail("শুধু প্রধান অ্যাডমিন ব্যবহারকারী সম্পাদনা করতে পারেন", 403);

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("অবৈধ অনুরোধ", 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return fail("তথ্য সঠিক নয়", 422);

  const result = await mutate((db) => {
    const user = db.adminUsers.find((u) => u.id === id);
    if (!user) return null;
    if (id === actor.id && parsed.data.role && parsed.data.role !== user.role) {
      return { error: "নিজের ভূমিকা পরিবর্তন করা যাবে না" } as const;
    }
    if (parsed.data.name) user.name = parsed.data.name;
    if (parsed.data.role) user.role = parsed.data.role;
    if (parsed.data.wardId !== undefined) user.wardId = parsed.data.wardId || undefined;
    if (typeof parsed.data.active === "boolean") user.active = parsed.data.active;
    if (parsed.data.password) user.passwordHash = hashPassword(parsed.data.password);
    if (user.active === false) db.adminSessions = db.adminSessions.filter((s) => s.userId !== user.id);
    pushAudit(db, actor.name, "user.update", `${user.name} (${user.username})${user.active ? "" : " — নিষ্ক্রিয়"}`);
    const { passwordHash: _hash, ...safe } = user;
    return { user: safe } as const;
  });

  if (!result) return fail("ব্যবহারকারী পাওয়া যায়নি", 404);
  if ("error" in result && result.error) return fail(result.error, 409);
  return ok(result);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorFromRequest(req);
  if (!actor) return fail("অনুমতি নেই", 401);
  if (actor.role !== "owner") return fail("শুধু প্রধান অ্যাডমিন ব্যবহারকারী মুছতে পারেন", 403);

  const { id } = await params;
  if (id === actor.id) return fail("নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না", 409);

  const result = await mutate((db) => {
    const user = db.adminUsers.find((u) => u.id === id);
    if (!user) return false;
    db.adminUsers = db.adminUsers.filter((u) => u.id !== id);
    db.adminSessions = db.adminSessions.filter((s) => s.userId !== id);
    pushAudit(db, actor.name, "user.delete", `${user.name} (${user.username})`);
    return true;
  });

  if (!result) return fail("ব্যবহারকারী পাওয়া যায়নি", 404);
  return ok({ deleted: id });
}
