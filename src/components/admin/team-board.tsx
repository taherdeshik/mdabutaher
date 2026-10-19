"use client";

import { useMemo, useState } from "react";
import {
  Award,
  CircleAlert,
  CheckCircle2,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Field, Input, Modal, Progress, Select, Stat } from "./admin-ui";
import { roleLabels } from "./admin-labels";
import { bn, formatBnDate } from "@/lib/utils";
import type { Booth, TeamMember, TeamRole } from "@/lib/command-types";

export function TeamBoard({ data, send }: SectionProps) {
  const { team, wards, booths, visits } = data;
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ role: TeamRole; wardId?: string; boothId?: string } | null>(null);

  const filtered = team.filter((m) => {
    if (role !== "all" && m.role !== role) return false;
    const q = query.trim().toLowerCase();
    if (q && !`${m.name} ${m.phone}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const counts = useMemo(() => {
    const active = team.filter((t) => t.status === "active").length;
    return {
      total: team.length,
      active,
      captains: team.filter((t) => t.role === "ward-captain").length,
      boothCaptains: team.filter((t) => t.role === "booth-captain").length,
      volunteers: team.filter((t) => t.role === "volunteer" || t.role === "household-leader").length,
    };
  }, [team]);

  const leaderboard = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((v) => map.set(v.by, (map.get(v.by) || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [visits]);

  function openAdd(member?: Partial<TeamMember>) {
    setPrefill({
      role: (member?.role as TeamRole) || "volunteer",
      wardId: member?.wardId,
      boothId: member?.boothId,
    });
    setAddOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="মোট দল" value={bn(counts.total)} icon={<Users className="h-3.5 w-3.5" />} sub={`${bn(counts.active)} জন সক্রিয়`} />
        <Stat label="ওয়ার্ড ক্যাপ্টেন" value={`${bn(counts.captains)}/${bn(wards.length)}`} icon={<UserPlus className="h-3.5 w-3.5" />} tone={data.kpis.wardVacancies ? "rose" : "emerald"} sub={data.kpis.wardVacancies ? `${bn(data.kpis.wardVacancies)} পদ খালি` : "সব পূর্ণ"} progress={counts.captains / wards.length} />
        <Stat label="বুথ ক্যাপ্টেন" value={`${bn(counts.boothCaptains)}/${bn(booths.length)}`} icon={<MapPin className="h-3.5 w-3.5" />} tone={data.kpis.boothVacancies ? "gold" : "emerald"} sub={`${bn(data.kpis.boothVacancies)} বুথ খালি`} progress={counts.boothCaptains / booths.length} />
        <Stat label="স্বেচ্ছাসেবক" value={bn(counts.volunteers)} icon={<Award className="h-3.5 w-3.5" />} tone="sky" sub="দশ-পরিবার প্রধানসহ" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHead
            title="সংগঠন রোস্টার"
            sub={`${bn(filtered.length)} জন দেখানো হচ্ছে`}
            icon={<Users className="h-4 w-4" />}
            action={<Button size="sm" variant="gold" onClick={() => openAdd()}><Plus className="h-3.5 w-3.5" /> নতুন সদস্য</Button>}
          />
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
            <div className="relative min-w-[150px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/30" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="নাম বা ফোন" className="h-8 pl-8 text-[0.68rem]" />
            </div>
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="h-8 w-auto text-[0.68rem]">
              <option value="all">সব ভূমিকা</option>
              {Object.entries(roleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="hidden w-full min-w-[600px] text-left sm:table">
              <thead className="sticky top-0 border-b border-white/[0.06] bg-[#071a15] text-[0.54rem] uppercase tracking-wider text-cream/30">
                <tr>
                  <th className="px-4 py-2 font-semibold">নাম</th>
                  <th className="px-3 py-2 font-semibold">ভূমিকা</th>
                  <th className="px-3 py-2 font-semibold">এলাকা</th>
                  <th className="px-3 py-2 font-semibold">ফোন</th>
                  <th className="px-3 py-2 font-semibold">অবস্থা</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((m) => {
                  const ward = wards.find((w) => w.id === m.wardId);
                  const booth = booths.find((b) => b.id === m.boothId);
                  return (
                    <tr key={m.id} className="text-[0.68rem] transition-colors hover:bg-white/[0.025]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-bright/10 text-[0.58rem] font-bold text-emerald-bright">{m.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>
                          <div className="min-w-0"><p className="truncate font-semibold text-cream/75">{m.name}</p><p className="text-[0.52rem] text-cream/25">যুক্ত: {formatBnDate(m.joinedAt)}</p></div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><Badge tone={m.role === "ward-captain" ? "gold" : m.role === "booth-captain" ? "sky" : "muted"}>{roleLabels[m.role]}</Badge></td>
                      <td className="px-3 py-2.5 text-cream/45">{ward ? `ওয়ার্ড ${bn(ward.no)}` : "—"}{booth ? ` · ${booth.code}` : ""}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-latin text-cream/45">{m.phone}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-[0.6rem] ${m.status === "active" ? "text-emerald-bright" : m.status === "pending" ? "text-gold" : "text-cream/30"}`}>
                          <span className="h-1 w-1 rounded-full bg-current" /> {m.status === "active" ? "সক্রিয়" : m.status === "pending" ? "অপেক্ষায়" : "নিষ্ক্রিয়"}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <button onClick={() => send("team", "delete", m.id)} className="rounded p-1 text-cream/20 transition-colors hover:bg-rose-500/10 hover:text-rose-300" title="সদস্য সরান">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* phone view — the table is too wide below 640px */}
            <ul className="divide-y divide-white/[0.04] sm:hidden">
              {filtered.map((m) => {
                const ward = wards.find((w) => w.id === m.wardId);
                const booth = booths.find((b) => b.id === m.boothId);
                return (
                  <li key={m.id} className="flex items-start gap-2.5 px-3.5 py-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-bright/10 text-[0.6rem] font-bold text-emerald-bright">
                      {m.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[0.76rem] font-semibold text-cream/85">{m.name}</p>
                        <Badge tone={m.role === "ward-captain" ? "gold" : m.role === "booth-captain" ? "sky" : "muted"}>{roleLabels[m.role]}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.58rem] text-cream/40">
                        <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 font-latin text-cream/60">
                          <Phone className="h-2.5 w-2.5" />{m.phone}
                        </a>
                        <span>{ward ? `ওয়ার্ড ${bn(ward.no)}` : "—"}{booth ? ` · ${booth.code}` : ""}</span>
                        <span className={m.status === "active" ? "text-emerald-bright" : m.status === "pending" ? "text-gold" : "text-cream/30"}>
                          {m.status === "active" ? "সক্রিয়" : m.status === "pending" ? "অপেক্ষায়" : "নিষ্ক্রিয়"}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => send("team", "delete", m.id)} className="shrink-0 rounded p-1.5 text-cream/20 transition-colors hover:bg-rose-500/10 hover:text-rose-300" title="সদস্য সরান">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {filtered.length === 0 ? <p className="px-4 py-8 text-center text-[0.7rem] text-cream/35">কোনো সদস্য পাওয়া যায়নি।</p> : null}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead title="ওয়ার্ড কাঠামো" sub="ক্যাপ্টেন ও বুথ প্রস্তুতি" icon={<MapPin className="h-4 w-4" />} />
            <div className="space-y-2 p-3">
              {wards.map((w) => {
                const cap = team.find((t) => t.id === w.captainId);
                const list = booths.filter((b) => b.wardId === w.id);
                const withCaptain = list.filter((b) => b.captainId).length;
                return (
                  <button key={w.id} onClick={() => openAdd({ role: "ward-captain", wardId: w.id })} className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left transition-colors hover:border-gold/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.64rem] font-semibold text-cream/65">ওয়ার্ড {bn(w.no)} — {w.name}</span>
                      {cap ? <Badge tone="emerald"><CheckCircle2 className="h-2.5 w-2.5" /> ক্যাপ্টেন</Badge> : <Badge tone="rose"><CircleAlert className="h-2.5 w-2.5" /> খালি</Badge>}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[0.55rem] text-cream/30">
                      <span>{cap?.name || "নিয়োগ দিন"}</span>
                      <span>{bn(withCaptain)}/{bn(list.length)} বুথ</span>
                    </div>
                    <Progress value={list.length ? withCaptain / list.length : 0} height="h-1" className="mt-1.5" tone={withCaptain === list.length ? "emerald" : "gold"} />
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHead title="ভিজিট লিডারবোর্ড" sub="সর্বোচ্চ খানা ভিজিট" icon={<Award className="h-4 w-4" />} />
            <div className="space-y-2 p-4">
              {leaderboard.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[0.55rem] font-bold ${i === 0 ? "bg-gold text-night" : "bg-white/[0.06] text-cream/45"}`}>{bn(i + 1)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.64rem] font-semibold text-cream/65">{name}</p>
                    <Progress value={count / leaderboard[0][1]} height="h-1" className="mt-1" tone={i === 0 ? "gold" : "emerald"} />
                  </div>
                  <span className="font-latin text-[0.6rem] text-cream/35">{bn(count)}</span>
                </div>
              ))}
              {leaderboard.length === 0 ? <p className="text-center text-[0.66rem] text-cream/30">এখনো ভিজিট নেই।</p> : null}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHead title="খালি পদ — দ্রুত নিয়োগ" sub="বুথ ক্যাপ্টেন ছাড়া বুথে কভারেজ কম থাকে" icon={<CircleAlert className="h-4 w-4" />} action={<Badge tone={data.kpis.boothVacancies ? "rose" : "emerald"}>{bn(data.kpis.boothVacancies)}টি খালি</Badge>} />
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {booths.filter((b) => !b.captainId).map((b) => <VacancyRow key={b.id} booth={b} wards={wards} onAdd={() => openAdd({ role: "booth-captain", wardId: b.wardId, boothId: b.id })} />)}
          {data.kpis.boothVacancies === 0 ? <p className="col-span-full px-2 py-4 text-center text-[0.68rem] text-emerald-bright">সব বুথে ক্যাপ্টেন নিয়োগ সম্পন্ন।</p> : null}
        </div>
      </Card>

      <AddMemberModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        data={data}
        send={send}
        initial={prefill}
      />
    </div>
  );
}

function VacancyRow({ booth, wards, onAdd }: { booth: Booth; wards: SectionProps["data"]["wards"]; onAdd: () => void }) {
  const w = wards.find((x) => x.id === booth.wardId);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-rose-400/15 bg-rose-400/[0.03] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.62rem] font-semibold text-cream/65">{booth.code} · {booth.village}</p>
        <p className="text-[0.54rem] text-cream/30">ওয়ার্ড {bn(w?.no || 0)} · {bn(booth.voters)} ভোটার</p>
      </div>
      <Button size="sm" variant="outline" onClick={onAdd}><UserPlus className="h-3 w-3" /> নিয়োগ</Button>
    </div>
  );
}

function AddMemberModal({
  open,
  onClose,
  data,
  send,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  data: SectionProps["data"];
  send: SectionProps["send"];
  initial: { role: TeamRole; wardId?: string; boothId?: string } | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<TeamRole>(initial?.role || "volunteer");
  const [wardId, setWardId] = useState(initial?.wardId || "");
  const [boothId, setBoothId] = useState(initial?.boothId || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // re-sync when opened with a different prefill
  const [lastInitial, setLastInitial] = useState<string>("");
  const stamp = JSON.stringify(initial || {});
  if (open && stamp !== lastInitial) {
    setLastInitial(stamp);
    setRole(initial?.role || "volunteer");
    setWardId(initial?.wardId || "");
    setBoothId(initial?.boothId || "");
    setError("");
  }

  async function submit() {
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("নাম ও ফোন নম্বর দিন");
      return;
    }
    setSaving(true);
    const err = await send("team", "create", undefined, {
      name: name.trim(),
      phone: phone.trim(),
      role,
      wardId: wardId || undefined,
      boothId: boothId || undefined,
    });
    setSaving(false);
    if (err) setError(err);
    else {
      setName("");
      setPhone("");
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="নতুন দলীয় সদস্য" sub="ভূমিকা অনুযায়ী ওয়ার্ড/বুথ নির্ধারণ করুন">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="পূর্ণ নাম"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: রফিকুল ইসলাম" /></Field>
          <Field label="মোবাইল নম্বর"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017XXXXXXXX" inputMode="tel" /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ভূমিকা">
            <Select value={role} onChange={(e) => setRole(e.target.value as TeamRole)}>
              {Object.entries(roleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </Field>
          <Field label="ওয়ার্ড">
            <Select value={wardId} onChange={(e) => { setWardId(e.target.value); setBoothId(""); }}>
              <option value="">ওয়ার্ড নির্বাচন</option>
              {data.wards.map((w) => <option key={w.id} value={w.id}>ওয়ার্ড {bn(w.no)} — {w.name}</option>)}
            </Select>
          </Field>
        </div>
        {role === "booth-captain" ? (
          <Field label="বুথ">
            <Select value={boothId} onChange={(e) => setBoothId(e.target.value)}>
              <option value="">বুথ নির্বাচন</option>
              {data.booths.filter((b) => !wardId || b.wardId === wardId).map((b) => <option key={b.id} value={b.id}>{b.code} — {b.village}</option>)}
            </Select>
          </Field>
        ) : null}
        <p className="flex items-start gap-1.5 rounded-lg bg-gold/[0.06] px-3 py-2 text-[0.6rem] leading-relaxed text-gold/70">
          <Phone className="mt-0.5 h-3 w-3 shrink-0" /> নিয়োগের পর সদস্যকে কোড-অফ-কন্ডাক্ট ও ভিজিট রিপোর্টিং প্রশিক্ষণ দিন।
        </p>
        {error ? <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[0.68rem] text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>বাতিল</Button>
          <Button variant="gold" size="sm" onClick={submit} disabled={saving}>{saving ? "সংরক্ষণ হচ্ছে…" : "সদস্য যোগ করুন"}</Button>
        </div>
      </div>
    </Modal>
  );
}
