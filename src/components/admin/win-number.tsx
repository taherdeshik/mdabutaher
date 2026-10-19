"use client";

import { useMemo, useState } from "react";
import { Check, Info, Save, Target, TrendingUp, Users, Zap } from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Progress } from "./admin-ui";
import { bnNum, pct, strengthLabels, strengthTone } from "./admin-labels";
import { bn } from "@/lib/utils";
import { winNumber } from "@/lib/command-calc";

export function WinNumber({ data, send }: SectionProps) {
  const { settings, wards, booths, wardCoverage } = data;
  const [turnout, setTurnout] = useState(settings.turnoutAssumption);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalVoters = booths.reduce((s, b) => s + b.voters, 0);
  const target = winNumber(totalVoters, turnout);
  const casting = Math.round((totalVoters * turnout) / 100);
  const committed = data.kpis.committedVotes;
  const gap = Math.max(0, target - committed);

  const wardRows = useMemo(
    () =>
      wards.map((w) => {
        const list = booths.filter((b) => b.wardId === w.id);
        const voters = list.reduce((s, b) => s + b.voters, 0);
        const committedVotes = Math.round(list.reduce((s, b) => s + (b.households ? (b.committed / b.households) * b.voters : 0), 0));
        const wWin = winNumber(voters, turnout);
        return { ...w, voters, committedVotes, wWin, gap: Math.max(0, wWin - committedVotes), coverage: wardCoverage.find((x) => x.id === w.id)?.coverage || 0 };
      }),
    [wards, booths, turnout, wardCoverage],
  );

  const scenarios = [55, 65, 72, 80].map((t) => ({ turnout: t, need: winNumber(totalVoters, t), casting: Math.round((totalVoters * t) / 100) }));
  const decisive = [...wardRows].sort((a, b) => b.gap - a.gap).slice(0, 4);

  async function save() {
    setSaving(true);
    const err = await send("settings", "update", undefined, { turnoutAssumption: turnout });
    setSaving(false);
    if (!err) setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold"><Target className="h-3 w-3" /> জয়ের সংখ্যা</Badge>
            <span className="text-[0.62rem] text-cream/35">{bnNum(totalVoters)} ভোটার · টার্নআউট {bn(turnout)}%</span>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <p className="font-latin text-[3rem] font-extrabold leading-none text-gold sm:text-[3.6rem]">{bn(target)}</p>
            <p className="mb-1 max-w-[220px] text-[0.68rem] leading-relaxed text-cream/40">
              ভোট প্রয়োজন — মোট {bnNum(casting)} ভোট পড়লে সাধারণ সংখ্যাগরিষ্ঠতার জন্য।
            </p>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-[0.66rem]">
              <span className="text-cream/45">এখন পর্যন্ত প্রতিশ্রুত</span>
              <span className="font-latin font-bold text-cream/75">{bnNum(committed)} / {bnNum(target)}</span>
            </div>
            <Progress value={target ? committed / target : 0} tone={committed >= target ? "emerald" : "gold"} className="mt-1.5" height="h-2" />
            <div className="mt-2 flex items-center justify-between text-[0.6rem]">
              <span className={committed >= target ? "text-emerald-bright" : "text-gold/80"}>
                {committed >= target ? "লক্ষ্য অতিক্রম হয়েছে ✓" : `আরও ${bn(gap)} ভোট দরকার`}
              </span>
              <span className="text-cream/30">{pct(target ? committed / target : 0)} পূরণ</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.08] bg-night/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[0.68rem] font-semibold text-cream/60">টার্নআউট অনুমান</p>
              <p className="font-latin text-[1.05rem] font-extrabold text-gold">{bn(turnout)}%</p>
            </div>
            <input
              type="range"
              min={45}
              max={85}
              step={1}
              value={turnout}
              onChange={(e) => setTurnout(Number(e.target.value))}
              className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#e7b75f]"
              aria-label="টার্নআউট শতাংশ"
            />
            <div className="mt-1 flex justify-between text-[0.54rem] text-cream/25">
              <span>৪৫%</span><span>৬৫%</span><span>৮৫%</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1 text-[0.56rem] text-cream/30"><Info className="h-3 w-3" /> ২০২১ সালের ইউনিয়ন টার্নআউট ছিল ৭১%</p>
              <Button size="sm" variant={saved ? "primary" : "gold"} onClick={save} disabled={saving}>
                {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {saved ? "সংরক্ষিত" : "লক্ষ্য সংরক্ষণ"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead title="টার্নআউট দৃশ্যপট" sub="কত ভোট পড়লে কত দরকার" icon={<TrendingUp className="h-4 w-4" />} />
            <div className="grid grid-cols-2 gap-2 p-3">
              {scenarios.map((s) => (
                <button
                  key={s.turnout}
                  onClick={() => setTurnout(s.turnout)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-all ${turnout === s.turnout ? "border-gold/50 bg-gold/10" : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"}`}
                >
                  <p className="text-[0.58rem] text-cream/35">টার্নআউট {bn(s.turnout)}%</p>
                  <p className="mt-0.5 font-latin text-[1.05rem] font-extrabold text-cream">{bnNum(s.need)}</p>
                  <p className="text-[0.52rem] text-cream/30">{bnNum(s.casting)} ভোট পড়বে</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="নির্ধারক ওয়ার্ড" sub="সবচেয়ে বেশি ভোট দরকার" icon={<Zap className="h-4 w-4" />} />
            <div className="divide-y divide-white/[0.05]">
              {decisive.map((w) => (
                <div key={w.id} className="flex items-center gap-2 px-4 py-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.05] font-latin text-[0.58rem] font-bold text-gold">{bn(w.no)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.66rem] font-semibold text-cream/70">{w.name}</p>
                    <p className="text-[0.52rem] text-cream/30">{bnNum(w.committedVotes)} / {bnNum(w.wWin)} প্রতিশ্রুত</p>
                  </div>
                  <Badge tone={w.gap > 300 ? "rose" : "gold"}>+{bn(w.gap)}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHead title="ওয়ার্ডভিত্তিক লক্ষ্য ভাগ" sub="প্রতিটি ওয়ার্ডকে কত ভোট দিতে হবে" icon={<Users className="h-4 w-4" />} action={<Badge tone="muted">{bnNum(totalVoters)} ভোটার</Badge>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead className="border-b border-white/[0.06] text-[0.55rem] uppercase tracking-wider text-cream/30">
              <tr>
                <th className="px-4 py-2 font-semibold">ওয়ার্ড</th>
                <th className="px-3 py-2 text-right font-semibold">ভোটার</th>
                <th className="px-3 py-2 text-right font-semibold">প্রয়োজন</th>
                <th className="px-3 py-2 text-right font-semibold">প্রতিশ্রুত</th>
                <th className="px-3 py-2 font-semibold">অগ্রগতি</th>
                <th className="px-3 py-2 text-right font-semibold">ঘাটতি</th>
                <th className="px-3 py-2 font-semibold">শক্তি</th>
                <th className="px-3 py-2 font-semibold">কভারেজ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {wardRows.map((w) => (
                <tr key={w.id} className="text-[0.68rem] transition-colors hover:bg-white/[0.025]">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-cream/75">{bn(w.no)} — {w.name}</p>
                    <p className="mt-0.5 text-[0.53rem] text-cream/30">{w.villages.join(" · ")}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right font-latin text-cream/55">{bnNum(w.voters)}</td>
                  <td className="px-3 py-2.5 text-right font-latin font-bold text-gold">{bnNum(w.wWin)}</td>
                  <td className="px-3 py-2.5 text-right font-latin text-cream/60">{bnNum(w.committedVotes)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Progress value={w.wWin ? w.committedVotes / w.wWin : 0} className="w-20" tone={w.gap > 300 ? "rose" : w.gap > 100 ? "gold" : "emerald"} />
                      <span className="font-latin text-[0.58rem] text-cream/35">{pct(w.wWin ? Math.min(1, w.committedVotes / w.wWin) : 0)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-latin text-cream/55">{w.gap ? bn(w.gap) : "—"}</td>
                  <td className="px-3 py-2.5"><Badge tone={strengthTone[w.strength]}>{strengthLabels[w.strength]}</Badge></td>
                  <td className="px-3 py-2.5 font-latin text-cream/45">{pct(w.coverage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="বুথভিত্তিক লক্ষ্য — টপ ১০" sub="সবচেয়ে বেশি ভোটের প্রয়োজন যেখানে" icon={<Target className="h-4 w-4" />} />
        <div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4">
          {[...booths]
            .map((b) => {
              const wWin = winNumber(b.voters, turnout);
              const committed = Math.round((b.committed / b.households) * b.voters);
              return { b, wWin, committed, gap: Math.max(0, wWin - committed) };
            })
            .sort((a, b) => b.gap - a.gap)
            .slice(0, 10)
            .map(({ b, wWin, committed, gap }) => (
              <div key={b.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[0.64rem] font-semibold text-cream/65">{b.code} · {b.village}</p>
                  <span className="shrink-0 font-latin text-[0.58rem] text-cream/35">{bn(committed)}/{bn(wWin)}</span>
                </div>
                <Progress value={wWin ? committed / wWin : 0} tone={gap > 200 ? "rose" : "gold"} height="h-1" className="mt-1.5" />
                <div className="mt-1 flex justify-between text-[0.52rem] text-cream/30"><span>{bn(b.voters)} ভোটার</span><span>ঘাটতি {bn(gap)}</span></div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
