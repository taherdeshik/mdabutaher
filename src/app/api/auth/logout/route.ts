import { NextRequest } from "next/server";
import { ok } from "@/lib/api";
import { logout } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await logout(req);
  const res = ok({ message: "লগআউট সম্পন্ন" });
  res.cookies.set("mat_admin", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
