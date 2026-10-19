"use client";

import { useMemo, useRef, useState } from "react";
import {
  Baby,
  CheckCircle2,
  Database,
  Download,
  FileUp,
  Info,
  RefreshCw,
  Users,
  UserRound,
  Venus,
  Mars,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Progress, Stat, Textarea } from "./admin-ui";
import { pct } from "./admin-labels";
import { bn } from "@/lib/utils";

type ParsedRow = {
  code: string;
  voters: number;
  male?: number;
  female?: number;
  youth?: number;
  firstTime?: number;
  households?: number;
  matched: boolean;
};

const HEADER_ALIASES: Record<string, string> = {
  code: "code", "বুথ": "code", "বুথ কোড": "code", booth: "code",
  voters: "voters", "ভোটার": "voters", total: "voters",
  male: "male", "পুরুষ": "male",
  female: "female", "মহিলা": "female",
  youth: "youth", "যুব": "youth",
  firsttime: "firstTime", "first_time": "firstTime", "নতুন": "firstTime",
  households: "households", "খানা": "households",
};

export function RollIntel({ data, send }: SectionProps) {
  const { booths, wards, settings } = data;
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const total = useMemo(() => {
    return booths.reduce(
      (acc, b) => ({
        voters: acc.voters + b.voters,
        male: acc.male + b.male,
        female: acc.female + b.female,
        youth: acc.youth + b.youth,
        firstTime: acc.firstTime + b.firstTime,
        households: acc.households + b.households,
      }),
      { voters: 0, male: 0, female: 0, youth: 0, firstTime: 0, households: 0 },
    );
  }, [booths]);

  const womenShare = total.voters ? total.female / total.voters : 0;
  const youthShare = total.voters ? total.youth / total.voters : 0;
  const firstShare = total.voters ? total.firstTime / total.voters : 0;

  function parseCsv(text: string) {
    setParseError("");
    setResult("");
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      setParseError("কমপক্ষে একটি হেডার ও একটি ডেটা সারি দরকার।");
      setRows([]);
      return;
    }
    const header = lines[0].split(",").map((h) => h.trim().replace(/^\ufeff/, ""));
    const keys = header.map((h) => HEADER_ALIASES[h.toLowerCase()] || HEADER_ALIASES[h] || h.toLowerCase());
    if (!keys.includes("code") || !keys.includes("voters")) {
      setParseError("হেডারে অন্তত code এবং voters কলাম থাকতে হবে।");
      setRows([]);
      return;
    }
    const parsed: ParsedRow[] = [];
    for (const line of lines.slice(1)) {
      const cells = line.split(",");
      const raw: Record<string, string> = {};
      keys.forEach((k, i) => (raw[k] = (cells[i] || "").trim().replace(/["']/g, "")));
      const code = raw.code;
      const voters = Number(raw.voters.replace(/[^\d]/g, ""));
      if (!code || !voters) continue;
      parsed.push({
        code,
        voters,
        male: raw.male ? Number(raw.male) : undefined,
        female: raw.female ? Number(raw.female) : undefined,
        youth: raw.youth ? Number(raw.youth) : undefined,
        firstTime: raw.firstTime ? Number(raw.firstTime) : undefined,
        households: raw.households ? Number(raw.households) : undefined,
        matched: booths.some((b) => b.code === code || b.id === code),
      });
    }
    if (!parsed.length) setParseError("কোনো বৈধ সারি পাওয়া যায়নি। voters কলামে সংখ্যা দিন।");
    setRows(parsed);
  }

  async function importRows() {
    const valid = rows.filter((r) => r.matched);
    if (!valid.length) {
      setParseError("মিলে যাওয়া কোনো বুথ কোড নেই। বুথ কোড দেখে নিন।");
      return;
    }
    setImporting(true);
    setResult("");
    const err = await send("roll", "import", undefined, { rows: valid });
    setImporting(false);
    if (err) setParseError(err);
    else {
      setResult(`${bn(valid.length)}টি বুথের ভোটার তথ্য আপডেট হয়েছে।`);
      setRows([]);
      setCsv("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const header = "code,voters,male,female,youth,firstTime,households";
    const body = booths.map((b) => `${b.code},${b.voters},${b.male},${b.female},${b.youth},${b.firstTime},${b.households}`).join("\n");
    const blob = new Blob(["\ufeff" + header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mahadan-roll-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <Stat label="মোট ভোটার" value={bn(total.voters)} icon={<Users className="h-3.5 w-3.5" />} sub={`${bn(booths.length)} বুথ · ${bn(wards.length)} ওয়ার্ড`} />
        <Stat label="পুরুষ" value={pct(total.voters ? total.male / total.voters : 0)} icon={<Mars className="h-3.5 w-3.5" />} tone="sky" sub={`${bn(total.male)} জন`} />
        <Stat label="মহিলা" value={pct(womenShare)} icon={<Venus className="h-3.5 w-3.5" />} tone="rose" sub={`${bn(total.female)} জন`} />
        <Stat label="যুব (১৮–৩৫)" value={pct(youthShare)} icon={<UserRound className="h-3.5 w-3.5" />} tone="gold" sub={`${bn(total.youth)} জন`} />
        <Stat label="নতুন ভোটার" value={pct(firstShare)} icon={<Baby className="h-3.5 w-3.5" />} tone="emerald" sub={`${bn(total.firstTime)} জন`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHead title="ওয়ার্ডভিত্তিক ভোটার বিশ্লেষণ" sub="তালিকায় ও যুব-নতুন ভোটারের অনুপাত" icon={<Database className="h-4 w-4" />} action={<Badge tone="gold">{bn(settings.unionVoters)} নিবন্ধিত</Badge>} />
          <div className="space-y-3 p-4 sm:p-5">
            {wards.map((w) => {
              const list = booths.filter((b) => b.wardId === w.id);
              const voters = list.reduce((s, b) => s + b.voters, 0);
              const female = list.reduce((s, b) => s + b.female, 0);
              const youth = list.reduce((s, b) => s + b.youth, 0);
              const first = list.reduce((s, b) => s + b.firstTime, 0);
              const womenPct = voters ? female / voters : 0;
              return (
                <div key={w.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.06] font-latin text-[0.6rem] font-bold text-gold">{bn(w.no)}</span>
                      <p className="text-[0.72rem] font-semibold text-cream/75">{w.name}</p>
                      <span className="text-[0.56rem] text-cream/30">{w.villages.join(" · ")}</span>
                    </div>
                    <p className="font-latin text-[0.72rem] font-bold text-cream/70">{bn(voters)} <span className="text-[0.54rem] font-normal text-cream/30">ভোটার</span></p>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-3 text-[0.58rem]">
                    <div><p className="flex justify-between text-cream/35"><span>মহিলা</span><span className="font-latin">{pct(womenPct)}</span></p><Progress value={womenPct} tone="rose" height="h-1" className="mt-1" /></div>
                    <div><p className="flex justify-between text-cream/35"><span>যুব</span><span className="font-latin">{pct(voters ? youth / voters : 0)}</span></p><Progress value={voters ? youth / voters : 0} tone="gold" height="h-1" className="mt-1" /></div>
                    <div><p className="flex justify-between text-cream/35"><span>নতুন</span><span className="font-latin">{pct(voters ? first / voters : 0)}</span></p><Progress value={voters ? first / voters : 0} tone="emerald" height="h-1" className="mt-1" /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHead title="লিঙ্গ ও বয়সের গঠন" sub="সমগ্র ইউনিয়ন" icon={<Users className="h-4 w-4" />} />
            <div className="p-4">
              <div className="flex items-center gap-5">
                <Donut male={total.male} female={total.female} />
                <div className="space-y-2 text-[0.66rem]">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /><span className="text-cream/45">পুরুষ</span><span className="font-latin font-bold text-cream/70">{pct(total.voters ? total.male / total.voters : 0)}</span></div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /><span className="text-cream/45">মহিলা</span><span className="font-latin font-bold text-cream/70">{pct(womenShare)}</span></div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-bright" /><span className="text-cream/45">যুব</span><span className="font-latin font-bold text-cream/70">{pct(youthShare)}</span></div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-gold" /><span className="text-cream/45">নতুন</span><span className="font-latin font-bold text-cream/70">{pct(firstShare)}</span></div>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <p className="text-[0.6rem] font-bold uppercase tracking-wider text-cream/30">নির্বাচনী প্রস্তাবনা</p>
                <p className="rounded-lg bg-gold/[0.06] px-3 py-2 text-[0.62rem] leading-relaxed text-gold/70">
                  মহিলা ভোটার {pct(womenShare)} — প্রতিটি ওয়ার্ডে নারী ভলান্টিয়ার ও উঠান বৈঠক নিশ্চিত করুন।
                </p>
                <p className="rounded-lg bg-emerald-bright/[0.05] px-3 py-2 text-[0.62rem] leading-relaxed text-emerald-bright/70">
                  নতুন ভোটার {bn(total.firstTime)} জন — প্রথমবার ভোটদাতাদের জন্য বুথ গাইড ও যাতায়াত সহায়তা।
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead title="বুথভিত্তিক ভোটার তালিকা" sub="সবচেয়ে বড় বুথ আগে" icon={<RefreshCw className="h-4 w-4" />} />
            <div className="max-h-[340px] divide-y divide-white/[0.05] overflow-y-auto">
              {[...booths].sort((a, b) => b.voters - a.voters).map((b) => {
                const w = wards.find((x) => x.id === b.wardId);
                return (
                  <div key={b.id} className="flex items-center gap-2 px-4 py-2 text-[0.64rem]">
                    <span className="w-9 shrink-0 font-latin text-cream/35">{b.code}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-cream/65">{b.village} <span className="text-cream/25">· ওয়ার্ড {bn(w?.no || 0)}</span></p>
                      <div className="mt-1 flex gap-2 text-[0.52rem] text-cream/30"><span>মহিলা {pct(b.voters ? b.female / b.voters : 0)}</span><span>যুব {pct(b.voters ? b.youth / b.voters : 0)}</span></div>
                    </div>
                    <span className="shrink-0 font-latin font-bold text-cream/60">{bn(b.voters)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHead
          title="ভোটার তালিকা আমদানি (BEC রোল / CSV)"
          sub="code,voters,male,female,youth,firstTime,households — টেমপ্লেট অনুসরণ করুন"
          icon={<FileUp className="h-4 w-4" />}
          action={<Button size="sm" variant="outline" onClick={downloadTemplate}><Download className="h-3.5 w-3.5" /> টেমপ্লেট</Button>}
        />
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  setCsv(text);
                  parseCsv(text);
                }}
                className="block w-full max-w-xs text-[0.68rem] text-cream/50 file:mr-3 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-[0.64rem] file:font-semibold file:text-cream/70"
              />
              <Button size="sm" variant="ghost" onClick={() => parseCsv(csv)} disabled={!csv.trim()}>প্রিভিউ</Button>
            </div>
            <Textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={"code,voters,male,female,youth,firstTime,households\n০১-ক,1180,585,595,340,62,271"}
              className="min-h-[150px] font-latin text-[0.7rem]"
            />
            <p className="flex items-start gap-1.5 text-[0.56rem] leading-relaxed text-cream/30">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              বাস্তব তালিকা ecs.gov.bd বা উপজেলা নির্বাচন অফিস থেকে CSV/Excel-এ নামিয়ে নিন। বাংলা সংখ্যাও সমর্থিত। ভুল কোড থাকলে সেই সারি বাদ যাবে।
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="flex items-center justify-between">
              <p className="text-[0.66rem] font-bold text-cream/60">প্রিভিউ</p>
              {rows.length ? <Badge tone={rows.every((r) => r.matched) ? "emerald" : "rose"}>{bn(rows.filter((r) => r.matched).length)}/{bn(rows.length)} মিলেছে</Badge> : null}
            </div>
            {parseError ? <p className="mt-2 rounded-lg bg-rose-500/10 px-2.5 py-2 text-[0.62rem] text-rose-300">{parseError}</p> : null}
            {result ? <p className="mt-2 flex items-center gap-1 rounded-lg bg-emerald-bright/10 px-2.5 py-2 text-[0.62rem] text-emerald-bright"><CheckCircle2 className="h-3 w-3" /> {result}</p> : null}
            {rows.length ? (
              <>
                <div className="mt-2 max-h-40 overflow-y-auto text-[0.6rem]">
                  {rows.slice(0, 30).map((r, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/[0.04] py-1.5 last:border-0">
                      <span className={r.matched ? "text-cream/60" : "text-rose-300/70"}>{r.code}</span>
                      <span className="font-latin text-cream/40">{bn(r.voters)}</span>
                      <span className={r.matched ? "text-emerald-bright" : "text-rose-300"}>{r.matched ? "✓" : "অজানা কোড"}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="gold" className="mt-3 w-full" onClick={importRows} disabled={importing || !rows.some((r) => r.matched)}>
                  {importing ? "আমদানি হচ্ছে…" : `${bn(rows.filter((r) => r.matched).length)}টি বুথ আপডেট করুন`}
                </Button>
              </>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
                <FileUp className="h-6 w-6 text-cream/20" />
                <p className="mt-2 max-w-[200px] text-[0.6rem] leading-relaxed text-cream/30">ফাইল নির্বাচন করুন বা CSV পেস্ট করে প্রিভিউ চাপুন।</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Donut({ male, female }: { male: number; female: number }) {
  const total = male + female || 1;
  const malePct = male / total;
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[116px] w-[116px] shrink-0">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#fb7185" strokeWidth="13" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="#38bdf8" strokeWidth="13" strokeDasharray={`${c * malePct} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-latin text-[0.95rem] font-extrabold text-cream">{bn(total.toLocaleString("en-US"))}</p>
          <p className="text-[0.5rem] text-cream/35">ভোটার</p>
        </div>
      </div>
    </div>
  );
}
