"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Compass,
  Footprints,
  MapPin,
  Printer,
  Search,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Input, Progress } from "./admin-ui";
import { bnNum, pct, strengthLabels, strengthTone } from "./admin-labels";
import { bn } from "@/lib/utils";
import type { Booth, Ward } from "@/lib/command-types";

export function CoverageMap({ data, go }: SectionProps) {
  const { wards, booths, team, wardCoverage, settings } = data;
  const [selectedWard, setSelectedWard] = useState<string>(wardCoverage[0]?.id || "");
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);
  const [metric, setMetric] = useState<"coverage" | "commitment">("coverage");
  const [query, setQuery] = useState("");

  const ward = wards.find((w) => w.id === selectedWard);
  const wardStat = wardCoverage.find((w) => w.id === selectedWard);
  const wardBooths = booths.filter((b) => b.wardId === selectedWard);
  const booth = selectedBooth ? booths.find((b) => b.id === selectedBooth) : null;
  const captain = ward?.captainId ? team.find((t) => t.id === ward.captainId) : null;

  const filteredBooths = useMemo(() => {
    const q = query.trim().toLowerCase();
    return booths.filter((b) => {
      if (!q) return true;
      const w = wards.find((x) => x.id === b.wardId);
      return `${b.code} ${b.name} ${b.village} ${w?.name || ""}`.toLowerCase().includes(q);
    });
  }, [booths, wards, query]);

  const totalCoverage = data.kpis.coverage;
  const topWard = [...wardCoverage].sort((a, b) => b.coverage - a.coverage)[0];
  const lowWard = [...wardCoverage].sort((a, b) => a.coverage - b.coverage)[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="emerald"><Footprints className="h-3 w-3" /> মোট কভারেজ {pct(totalCoverage)}</Badge>
          <Badge tone="gold"><Target className="h-3 w-3" /> জয়ের লক্ষ্য {bn(data.kpis.winNumber)}</Badge>
          <Badge tone="rose"><UserRound className="h-3 w-3" /> {bn(data.kpis.boothVacancies)} বুথ খালি</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {(["coverage", "commitment"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-md px-3 py-1.5 text-[0.64rem] font-semibold transition-colors ${metric === m ? "bg-gold text-night" : "text-cream/45 hover:text-cream"}`}
              >
                {m === "coverage" ? "ভিজিট কভারেজ" : "সমর্থন হার"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> প্রিন্ট
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <CardHead
            title="মহাদান ইউনিয়ন — ৯ ওয়ার্ড"
            sub="ওয়ার্ড বা বুথে ক্লিক করে বিস্তারিত দেখুন"
            icon={<Compass className="h-4 w-4" />}
            action={<span className="text-[0.56rem] text-cream/30">স্কেল-ভিত্তিক স্কেচ ম্যাপ</span>}
          />
          <div className="relative bg-[#061713] p-2 sm:p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
              <span className="text-[0.56rem] text-cream/35">কভারেজ:</span>
              {[
                { l: "<৩৫%", c: "#e8617a" },
                { l: "৩৫–৫৫%", c: "#d9a441" },
                { l: "৫৫–৭৫%", c: "#2f9e74" },
                { l: "৭৫%+", c: "#2fd28c" },
              ].map((x) => (
                <span key={x.l} className="flex items-center gap-1 text-[0.56rem] text-cream/40">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: x.c }} /> {x.l}
                </span>
              ))}
              <span className="ml-auto flex items-center gap-1 text-[0.56rem] text-cream/30">
                <span className="h-2 w-2 rounded-full bg-cream/70" /> বুথ
              </span>
            </div>

            <svg viewBox="0 0 900 660" className="w-full" role="img" aria-label="মহাদান ইউনিয়নের ওয়ার্ড কভারেজ ম্যাপ">
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="900" height="660" fill="url(#mapGrid)" rx="12" />
              {/* stylised river */}
              <path d="M884 18 C846 130 900 250 862 372 C828 486 874 574 838 660" fill="none" stroke="rgba(56,189,248,0.14)" strokeWidth="16" strokeLinecap="round" />
              <text x="858" y="330" fill="rgba(56,189,248,0.35)" fontSize="10" transform="rotate(90 858 330)">ব্রহ্মপুত্র অববাহিকা</text>

              {wards.map((w) => {
                const s = wardCoverage.find((x) => x.id === w.id);
                const value = metric === "coverage" ? s?.coverage || 0 : s?.commitment || 0;
                const active = w.id === selectedWard;
                const color = coverageColor(value);
                return (
                  <g
                    key={w.id}
                    onClick={() => {
                      setSelectedWard(w.id);
                      setSelectedBooth(null);
                    }}
                    className="cursor-pointer"
                    role="button"
                    aria-label={`ওয়ার্ড ${w.no} ${w.name}`}
                  >
                    <path
                      d={w.polygon}
                      fill={color}
                      fillOpacity={active ? 0.4 : 0.2}
                      stroke={active ? "#e7b75f" : "rgba(255,255,255,0.18)"}
                      strokeWidth={active ? 2.5 : 1.2}
                      className="transition-all duration-300 hover:fill-opacity-40"
                    />
                    <text
                      x={wardLabel(w).x}
                      y={wardLabel(w).y}
                      textAnchor="middle"
                      fill="#f8f4ea"
                      fontSize="22"
                      fontWeight="800"
                      className="pointer-events-none"
                    >
                      {bn(w.no)}
                    </text>
                    <text
                      x={wardLabel(w).x}
                      y={wardLabel(w).y + 17}
                      textAnchor="middle"
                      fill="rgba(248,244,234,0.6)"
                      fontSize="10.5"
                      className="pointer-events-none"
                    >
                      {w.name}
                    </text>
                    <text
                      x={wardLabel(w).x}
                      y={wardLabel(w).y + 31}
                      textAnchor="middle"
                      fill={color}
                      fontSize="11"
                      fontWeight="700"
                      className="pointer-events-none"
                    >
                      {bn(Math.round(value * 100))}%
                    </text>
                  </g>
                );
              })}

              {booths.map((b) => {
                const s = b.households ? b.visited / b.households : 0;
                const isActive = b.id === selectedBooth;
                return (
                  <g
                    key={b.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooth(b.id);
                      setSelectedWard(b.wardId);
                    }}
                    className="cursor-pointer"
                  >
                    <title>{`${b.code} · ${b.name} — ${Math.round(s * 100)}% কভারেজ`}</title>
                    <circle cx={b.x} cy={b.y} r={isActive ? 9 : 5.5} fill={isActive ? "#e7b75f" : "#f8f4ea"} fillOpacity={isActive ? 1 : 0.75} stroke="#04110e" strokeWidth={2} />
                    {!b.captainId ? <circle cx={b.x} cy={b.y} r={10} fill="none" stroke="#fb7185" strokeWidth="1.5" strokeDasharray="3 3" /> : null}
                    {isActive ? <circle cx={b.x} cy={b.y} r="14" fill="none" stroke="#e7b75f" strokeWidth="1.5" filter="url(#glow)" /> : null}
                  </g>
                );
              })}

              <g className="pointer-events-none">
                <text x="70" y="640" fill="rgba(248,244,234,0.22)" fontSize="9.5">স্কেচ ম্যাপ — প্রকৃত ভৌগোলিক সীমানা নয়</text>
                <circle cx="820" cy="70" r="15" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" />
                <path d="M820 58 L824 69 L820 66 L816 69 Z" fill="#e7b75f" />
                <text x="820" y="56" textAnchor="middle" fill="rgba(248,244,234,0.5)" fontSize="8">উ</text>
              </g>
            </svg>
          </div>
        </Card>

        <div className="space-y-4">
          {booth ? (
            <BoothDetail booth={booth} ward={wards.find((w) => w.id === booth.wardId)} captain={team.find((t) => t.id === booth.captainId)} onClose={() => setSelectedBooth(null)} go={go} />
          ) : ward && wardStat ? (
            <Card>
              <CardHead
                title={`ওয়ার্ড ${bn(ward.no)} — ${ward.name}`}
                sub={ward.villages.join(" · ")}
                icon={<MapPin className="h-4 w-4" />}
                action={<Badge tone={strengthTone[ward.strength]}>{strengthLabels[ward.strength]}</Badge>}
              />
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "ভোটার", v: bn(wardStat.voters) },
                    { l: "খানা", v: bn(wardStat.households) },
                    { l: "বুথ", v: bn(wardStat.booths) },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg bg-white/[0.04] px-2.5 py-2 text-center">
                      <p className="font-latin text-[0.95rem] font-bold text-cream">{s.v}</p>
                      <p className="text-[0.55rem] text-cream/35">{s.l}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-[0.66rem]"><span className="text-cream/50">দরজায় দরজায় কভারেজ</span><span className="font-latin font-bold text-emerald-bright">{pct(wardStat.coverage)}</span></div>
                    <Progress value={wardStat.coverage} className="mt-1" />
                    <p className="mt-1 text-[0.55rem] text-cream/30">{bn(wardStat.visited)} / {bnNum(wardStat.households)} খানা ভিজিট</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-[0.66rem]"><span className="text-cream/50">সমর্থন নিশ্চিত</span><span className="font-latin font-bold text-gold">{pct(wardStat.commitment)}</span></div>
                    <Progress value={wardStat.commitment} tone="gold" className="mt-1" />
                    <p className="mt-1 text-[0.55rem] text-cream/30">{bn(wardStat.committed)} খানা প্রতিশ্রুত</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                  <span className={`grid h-7 w-7 place-items-center rounded-full ${captain ? "bg-emerald-bright/15 text-emerald-bright" : "bg-rose-400/15 text-rose-300"}`}>
                    {captain ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.62rem] font-semibold text-cream/70">{captain ? captain.name : "ওয়ার্ড ক্যাপ্টেন পদ খালি"}</p>
                    <p className="text-[0.54rem] text-cream/35">{captain ? captain.phone : "দ্রুত নিয়োগ দিন"}</p>
                  </div>
                  {!captain ? <Button size="sm" variant="danger" onClick={() => go("team")}>নিয়োগ</Button> : null}
                </div>

                {ward.note ? <p className="mt-3 rounded-lg bg-gold/[0.06] px-3 py-2 text-[0.6rem] leading-relaxed text-gold/70">{ward.note}</p> : null}

                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="gold" className="flex-1" onClick={() => go("canvass")}><Footprints className="h-3.5 w-3.5" /> ক্যানভাস</Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedBooth(wardBooths[0]?.id || null)}>বুথ দেখুন</Button>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-[0.62rem] font-bold text-cream/50">বুথ কভারেজ</p>
                  {wardBooths.map((b) => (
                    <button key={b.id} onClick={() => setSelectedBooth(b.id)} className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-white/15">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[0.62rem] font-semibold text-cream/65">{b.code} · {b.village}</span>
                        <span className="shrink-0 font-latin text-[0.58rem] font-bold text-cream/50">{pct(b.households ? b.visited / b.households : 0)}</span>
                      </div>
                      <Progress value={b.households ? b.visited / b.households : 0} height="h-1" className="mt-1" tone={b.captainId ? "emerald" : "rose"} />
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[0.72rem] font-bold text-cream/70">ইউনিয়ন সারসংক্ষেপ</p>
              <Badge tone="gold">{bnNum(settings.unionVoters)} নিবন্ধিত</Badge>
            </div>
            <div className="mt-3 space-y-2 text-[0.64rem]">
              <Row label="সর্বোচ্চ কভারেজ" value={`ওয়ার্ড ${bn(topWard?.no || 0)} · ${pct(topWard?.coverage || 0)}`} tone="text-emerald-bright" />
              <Row label="সর্বনিম্ন কভারেজ" value={`ওয়ার্ড ${bn(lowWard?.no || 0)} · ${pct(lowWard?.coverage || 0)}`} tone="text-rose-300" />
              <Row label="মোট খানা" value={bnNum(data.kpis.households)} />
              <Row label="প্রতিশ্রুত খানা" value={bnNum(data.kpis.committedHouseholds)} />
              <Row label="বুথ ক্যাপ্টেন খালি" value={bn(data.kpis.boothVacancies)} tone="text-gold" />
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHead
          title="সব বুথ — এক নজরে"
          sub={`${bn(booths.length)}টি বুথ · কভারেজ ও ক্যাপ্টেন`}
          icon={<Users className="h-4 w-4" />}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-cream/30" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="বুথ / গ্রাম খুঁজুন" className="h-8 w-44 pl-7 text-[0.66rem]" />
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-white/[0.06] text-[0.55rem] uppercase tracking-wider text-cream/30">
              <tr>
                <th className="px-4 py-2 font-semibold">বুথ</th>
                <th className="px-3 py-2 font-semibold">ওয়ার্ড</th>
                <th className="px-3 py-2 text-right font-semibold">ভোটার</th>
                <th className="px-3 py-2 font-semibold">কভারেজ</th>
                <th className="px-3 py-2 text-right font-semibold">প্রতিশ্রুত</th>
                <th className="px-3 py-2 font-semibold">ক্যাপ্টেন</th>
                <th className="px-3 py-2 font-semibold">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredBooths.map((b) => {
                const w = wards.find((x) => x.id === b.wardId);
                const cap = team.find((t) => t.id === b.captainId);
                const coverage = b.households ? b.visited / b.households : 0;
                return (
                  <tr key={b.id} onClick={() => { setSelectedBooth(b.id); setSelectedWard(b.wardId); }} className="cursor-pointer text-[0.68rem] transition-colors hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-cream/80">{b.code} · {b.name}</p>
                      <p className="mt-0.5 text-[0.56rem] text-cream/35">{b.village}</p>
                    </td>
                    <td className="px-3 py-2.5 text-cream/45">{bn(w?.no || 0)} — {w?.name}</td>
                    <td className="px-3 py-2.5 text-right font-latin text-cream/60">{bn(b.voters)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={coverage} className="w-16" tone={coverage < 0.4 ? "rose" : coverage < 0.55 ? "gold" : "emerald"} />
                        <span className="font-latin text-[0.6rem] text-cream/50">{pct(coverage)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-latin text-cream/60">{bn(b.committed)}</td>
                    <td className="px-3 py-2.5 text-cream/50">{cap?.name || <span className="text-rose-300/70">খালি</span>}</td>
                    <td className="px-3 py-2.5"><Badge tone={strengthTone[b.strength]}>{strengthLabels[b.strength]}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BoothDetail({ booth, ward, captain, onClose, go }: { booth: Booth; ward?: Ward; captain?: { name: string; phone: string }; onClose: () => void; go: SectionProps["go"] }) {
  const coverage = booth.households ? booth.visited / booth.households : 0;
  const commitment = booth.households ? booth.committed / booth.households : 0;
  return (
    <Card glow="gold">
      <CardHead
        title={`${booth.code} — ${booth.village}`}
        sub={booth.name}
        icon={<MapPin className="h-4 w-4" />}
        action={<button onClick={onClose} className="text-[0.6rem] text-cream/40 hover:text-cream">বন্ধ</button>}
      />
      <div className="p-4">
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { l: "ভোটার", v: bn(booth.voters) },
            { l: "খানা", v: bn(booth.households) },
            { l: "ভিজিট", v: bn(booth.visited) },
            { l: "প্রতিশ্রুত", v: bn(booth.committed) },
          ].map((s) => (
            <div key={s.l} className="rounded-lg bg-white/[0.04] py-2">
              <p className="font-latin text-[0.82rem] font-bold text-cream">{s.v}</p>
              <p className="text-[0.5rem] text-cream/35">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-[0.64rem]"><span className="text-cream/45">কভারেজ</span><span className="font-latin font-bold text-emerald-bright">{pct(coverage)}</span></div>
          <Progress value={coverage} />
          <div className="flex justify-between text-[0.64rem]"><span className="text-cream/45">সমর্থন</span><span className="font-latin font-bold text-gold">{pct(commitment)}</span></div>
          <Progress value={commitment} tone="gold" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-white/[0.03] p-2.5 text-[0.6rem]">
          <div><p className="text-cream/30">পুরুষ / মহিলা</p><p className="font-latin text-cream/65">{bn(booth.male)} / {bn(booth.female)}</p></div>
          <div><p className="text-cream/30">যুব (১৮–৩৫) / নতুন</p><p className="font-latin text-cream/65">{bn(booth.youth)} / {bn(booth.firstTime)}</p></div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.07] px-2.5 py-2">
          <UserRound className="h-3.5 w-3.5 text-cream/40" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] font-semibold text-cream/65">{captain?.name || "ক্যাপ্টেন পদ খালি"}</p>
            <p className="text-[0.52rem] text-cream/30">{captain?.phone || `ওয়ার্ড ${bn(ward?.no || 0)} · ${ward?.name}`}</p>
          </div>
          <Badge tone={captain ? "emerald" : "rose"}>{captain ? "সক্রিয়" : "খালি"}</Badge>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="gold" className="flex-1" onClick={() => go("canvass")}><Footprints className="h-3.5 w-3.5" /> এই বুথে ক্যানভাস</Button>
          {!captain ? <Button size="sm" variant="outline" onClick={() => go("team")}>নিয়োগ</Button> : null}
        </div>
        <p className="mt-2 flex items-center gap-1 text-[0.54rem] text-cream/25">
          <ArrowUpRight className="h-2.5 w-2.5" /> মোট {bnNum(booth.households)} খানার মধ্যে {bnNum(booth.visited)} ভিজিট
        </p>
      </div>
    </Card>
  );
}

function Row({ label, value, tone = "text-cream/70" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-1.5 last:border-0">
      <span className="text-cream/35">{label}</span>
      <span className={`font-latin font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

function coverageColor(v: number) {
  if (v >= 0.75) return "#2fd28c";
  if (v >= 0.55) return "#2f9e74";
  if (v >= 0.35) return "#d9a441";
  return "#e8617a";
}

/** label positions derived from the seed polygons (approximate visual centroids) */
function wardLabel(w: Ward) {
  const positions: Record<number, { x: number; y: number }> = {
    1: { x: 178, y: 152 },
    2: { x: 468, y: 142 },
    3: { x: 714, y: 148 },
    4: { x: 196, y: 382 },
    5: { x: 462, y: 392 },
    6: { x: 714, y: 382 },
    7: { x: 208, y: 574 },
    8: { x: 462, y: 578 },
    9: { x: 714, y: 574 },
  };
  return positions[w.no] || { x: 450, y: 330 };
}
