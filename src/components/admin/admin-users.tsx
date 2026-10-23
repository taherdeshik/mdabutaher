"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { Badge, Button, Card, CardHead, Field, Input, Select } from "./admin-ui";
import { bnNum } from "./admin-labels";

type Role = "owner" | "manager" | "captain";

type UserRow = {
  id: string;
  name: string;
  username: string;
  role: Role;
  wardId?: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

const ROLE_LABEL: Record<Role, string> = {
  owner: "প্রধান অ্যাডমিন",
  manager: "ম্যানেজার",
  captain: "ওয়ার্ড ক্যাপ্টেন",
};

export function AdminUsers({ adminKey }: { adminKey: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [me, setMe] = useState<{ id: string; role: Role } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "manager" as Role, wardId: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: { "x-admin-key": adminKey }, cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ব্যবহারকারী তালিকা লোড হয়নি");
      setUsers(json.data.users);
      setMe(json.data.me);
    } catch (error) {
      setMsg({ tone: "error", text: error instanceof Error ? error.message : "লোড ব্যর্থ" });
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ ...form, wardId: form.wardId || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ব্যবহারকারী তৈরি হয়নি");
      setForm({ name: "", username: "", password: "", role: "manager", wardId: "" });
      setMsg({ tone: "ok", text: "নতুন ব্যবহারকারী তৈরি হয়েছে" });
      await load();
    } catch (error) {
      setMsg({ tone: "error", text: error instanceof Error ? error.message : "ব্যর্থ" });
    } finally {
      setBusy(false);
    }
  }

  async function patchUser(id: string, payload: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "পরিবর্তন সংরক্ষণ হয়নি");
      await load();
    } catch (error) {
      setMsg({ tone: "error", text: error instanceof Error ? error.message : "ব্যর্থ" });
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(id: string, username: string) {
    const password = window.prompt(`${username} — নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)`);
    if (password === null) return;
    if (password.trim().length < 8) {
      setMsg({ tone: "error", text: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে" });
      return;
    }
    await patchUser(id, { password: password.trim() });
    setMsg({ tone: "ok", text: "পাসওয়ার্ড পরিবর্তন হয়েছে" });
  }

  async function removeUser(id: string) {
    if (!window.confirm("এই ব্যবহারকারীকে মুছে ফেলবেন?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "মুছে ফেলা যায়নি");
      await load();
    } catch (error) {
      setMsg({ tone: "error", text: error instanceof Error ? error.message : "ব্যর্থ" });
    } finally {
      setBusy(false);
    }
  }

  const isOwner = me?.role === "owner";

  return (
    <Card>
      <CardHead
        title="ব্যবহারকারী ও ভূমিকা"
        sub="প্রধান অ্যাডমিন, ম্যানেজার ও ওয়ার্ড ক্যাপ্টেন — আলাদা লগইন"
        icon={<Users className="h-4 w-4" />}
        action={<Badge tone="gold">{bnNum(users.length)} জন</Badge>}
      />
      <div className="space-y-3 p-4 sm:p-5">
        {loading ? (
          <p className="flex items-center gap-2 text-[0.72rem] text-cream/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> লোড হচ্ছে…
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/10 text-[0.66rem] font-bold text-gold">
                  {u.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.76rem] font-semibold text-cream/85">
                    {u.name}
                    {u.id === me?.id ? <span className="ml-1 text-[0.6rem] text-emerald-bright">(আপনি)</span> : null}
                  </p>
                  <p className="truncate font-latin text-[0.62rem] text-cream/35">
                    {u.username}
                    {u.wardId ? ` · ${u.wardId}` : ""}
                    {u.lastLoginAt ? ` · শেষ লগইন ${new Date(u.lastLoginAt).toLocaleDateString("bn-BD")}` : ""}
                  </p>
                </div>
                <Badge tone={u.role === "owner" ? "gold" : u.role === "manager" ? "emerald" : "muted"}>
                  {ROLE_LABEL[u.role]}
                </Badge>
                {!u.active ? <Badge tone="rose">নিষ্ক্রিয়</Badge> : null}
                {isOwner ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => changePassword(u.id, u.username)}
                      disabled={busy}
                      aria-label="পাসওয়ার্ড বদলান"
                      title="পাসওয়ার্ড বদলান"
                      className="rounded-md border border-white/10 p-1.5 text-cream/35 hover:border-gold/40 hover:text-gold"
                    >
                      <KeyRound className="h-3 w-3" />
                    </button>
                    {u.id !== me?.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => patchUser(u.id, { active: !u.active })}
                          disabled={busy}
                          className="rounded-md border border-white/10 px-2 py-1 text-[0.6rem] text-cream/45 hover:border-gold/30 hover:text-gold"
                        >
                          {u.active ? "নিষ্ক্রিয়" : "সক্রিয়"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeUser(u.id)}
                          disabled={busy}
                          aria-label="মুছুন"
                          className="rounded-md border border-white/10 p-1.5 text-cream/35 hover:border-rose-400/40 hover:text-rose-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {msg ? (
          <p className={`rounded-lg px-3 py-2 text-[0.68rem] ${msg.tone === "ok" ? "bg-emerald-bright/10 text-emerald-bright" : "bg-rose-500/10 text-rose-300"}`}>
            {msg.text}
          </p>
        ) : null}

        {isOwner ? (
          <form onSubmit={createUser} className="rounded-xl border border-white/[0.08] bg-night/30 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[0.68rem] font-semibold text-cream/60">
              <UserPlus className="h-3.5 w-3.5 text-gold" /> নতুন ব্যবহারকারী
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="নাম">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={60} />
              </Field>
              <Field label="ইউজারনেম" hint="ইংরেজি অক্ষরে">
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[A-Za-z0-9._-]+"
                  className="font-latin"
                />
              </Field>
              <Field label="পাসওয়ার্ড" hint="কমপক্ষে ৮ অক্ষর">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="ভূমিকা">
                <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  <option value="manager">ম্যানেজার</option>
                  <option value="captain">ওয়ার্ড ক্যাপ্টেন</option>
                  <option value="owner">প্রধান অ্যাডমিন</option>
                </Select>
              </Field>
              {form.role === "captain" ? (
                <Field label="ওয়ার্ড" hint="যেমন: ওয়ার্ড ৩">
                  <Input value={form.wardId} onChange={(e) => setForm({ ...form, wardId: e.target.value })} maxLength={20} />
                </Field>
              ) : null}
            </div>
            <Button type="submit" variant="gold" size="sm" className="mt-2" disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              অ্যাকাউন্ট তৈরি করুন
            </Button>
          </form>
        ) : (
          <p className="flex items-center gap-1.5 text-[0.64rem] text-cream/35">
            <ShieldCheck className="h-3.5 w-3.5" /> নতুন ব্যবহারকারী শুধু প্রধান অ্যাডমিন যোগ করতে পারেন।
          </p>
        )}
      </div>
    </Card>
  );
}
