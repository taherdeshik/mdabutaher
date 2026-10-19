"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Megaphone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Field, Input, Modal, Progress, Select, Stat, Textarea } from "./admin-ui";
import { priorityLabels, roleLabels, taskTypeLabels } from "./admin-labels";
import { bn, formatBnDate } from "@/lib/utils";
import type { Task, TaskType } from "@/lib/command-types";

const typeIcon: Record<TaskType, typeof Users> = {
  meeting: Users,
  canvass: CalendarCheck2,
  miking: Megaphone,
  rally: Megaphone,
  admin: CalendarDays,
  media: Megaphone,
};

export function DailyPlan({ data, send }: SectionProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [addOpen, setAddOpen] = useState(false);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i - 1);
      return d.toISOString().slice(0, 10);
    });
  }, []);

  const dayTasks = data.tasks
    .filter((t) => t.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
  const done = dayTasks.filter((t) => t.done).length;
  const selectedIndex = days.indexOf(date);

  const weekTasks = data.tasks
    .filter((t) => !t.done && t.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 8);

  const activity = useMemo(() => {
    const visits = data.visits.slice(0, 12).map((v) => ({
      id: v.id,
      when: v.createdAt,
      title: `খানা ভিজিট — ${data.households.find((h) => h.id === v.householdId)?.head || "খানা"}`,
      detail: `${data.booths.find((b) => b.id === v.boothId)?.village || ""} · ${v.by}`,
      kind: "visit" as const,
    }));
    const doneTasks = data.tasks
      .filter((t) => t.done)
      .slice(0, 6)
      .map((t) => ({ id: t.id, when: `${t.date}T${t.time}:00`, title: `কাজ সম্পন্ন — ${t.title}`, detail: t.assignee, kind: "task" as const }));
    return [...visits, ...doneTasks].sort((a, b) => b.when.localeCompare(a.when)).slice(0, 10);
  }, [data.visits, data.tasks, data.households, data.booths]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="আজকের কাজ" value={`${bn(data.kpis.tasksDoneToday)}/${bn(data.kpis.tasksToday)}`} progress={data.kpis.tasksToday ? data.kpis.tasksDoneToday / data.kpis.tasksToday : 0} icon={<CalendarCheck2 className="h-3.5 w-3.5" />} tone="emerald" sub="সম্পন্ন / নির্ধারিত" />
        <Stat label="বাকি কাজ (৭ দিন)" value={bn(data.tasks.filter((t) => !t.done && t.date >= today && t.date <= new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10)).length)} icon={<Clock3 className="h-3.5 w-3.5" />} tone="gold" sub="আগামী সপ্তাহে" />
        <Stat label="আজকের ভিজিট" value={bn(data.visits.filter((v) => v.createdAt.slice(0, 10) === today).length)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" sub="খানা রিপোর্ট" />
        <Stat label="ওভারডিউ" value={bn(data.tasks.filter((t) => !t.done && t.date < today).length)} icon={<CalendarDays className="h-3.5 w-3.5" />} tone={data.tasks.some((t) => !t.done && t.date < today) ? "rose" : "muted"} sub="তারিখ পেরিয়েছে" />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5 sm:px-4">
          <Button size="sm" variant="ghost" onClick={() => setDate(days[Math.max(0, selectedIndex - 1)])} disabled={selectedIndex <= 0} aria-label="আগের দিন">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="flex flex-1 gap-1.5 overflow-x-auto hide-scrollbar">
            {days.map((d) => {
              const count = data.tasks.filter((t) => t.date === d && !t.done).length;
              const active = d === date;
              return (
                <button key={d} onClick={() => setDate(d)} className={`min-w-[68px] flex-1 rounded-lg border px-2 py-1.5 text-center transition-colors ${active ? "border-gold/50 bg-gold/10" : "border-white/[0.06] bg-white/[0.02] hover:border-white/20"}`}>
                  <p className={`text-[0.52rem] ${active ? "text-gold" : "text-cream/30"}`}>{formatBnDate(d, { weekday: "short" })}</p>
                  <p className={`mt-0.5 font-latin text-[0.88rem] font-bold ${active ? "text-cream" : "text-cream/55"}`}>{formatBnDate(d, { day: "2-digit" })}</p>
                  <p className="text-[0.48rem] text-cream/30">{formatBnDate(d, { month: "short" })}</p>
                  {count ? <span className="mx-auto mt-1 block h-1 w-1 rounded-full bg-gold" /> : <span className="mt-1 block h-1" />}
                </button>
              );
            })}
          </div>
          <Button size="sm" variant="ghost" onClick={() => setDate(days[Math.min(6, selectedIndex + 1)])} disabled={selectedIndex >= 6} aria-label="পরের দিন">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="gold" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">নতুন কাজ</span></Button>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.82rem] font-bold text-cream">{date === today ? "আজকের পরিকল্পনা" : formatBnDate(date, { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className="text-[0.6rem] text-cream/35">{bn(dayTasks.length)}টি কাজ · {bn(done)}টি সম্পন্ন</p>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={dayTasks.length ? done / dayTasks.length : 0} className="w-20" />
                <span className="font-latin text-[0.66rem] font-bold text-cream/60">{Math.round(dayTasks.length ? (done / dayTasks.length) * 100 : 0)}%</span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {dayTasks.map((t) => (
                <TaskRow key={t.id} task={t} data={data} send={send} />
              ))}
              {dayTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
                  <CalendarDays className="mx-auto h-5 w-5 text-cream/15" />
                  <p className="mt-2 text-[0.68rem] text-cream/35">এই দিনে কোনো কাজ নেই।</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setAddOpen(true)}>কাজ যোগ করুন</Button>
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-wider text-cream/30">আগামী ৭ দিনের কাজ</p>
              <div className="space-y-1">
                {weekTasks.map((t) => (
                  <button key={t.id} onClick={() => setDate(t.date)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]">
                    <span className="w-10 shrink-0 text-[0.54rem] text-cream/30">{formatBnDate(t.date, { day: "2-digit", month: "short" })}</span>
                    <span className="h-1 w-1 shrink-0 rounded-full bg-gold/60" />
                    <span className="min-w-0 flex-1 truncate text-[0.64rem] text-cream/60">{t.title}</span>
                    <span className="shrink-0 text-[0.52rem] text-cream/25">{t.time}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <p className="text-[0.72rem] font-bold text-cream/70">মাঠের গতিবিধি</p>
            <p className="text-[0.56rem] text-cream/30">সর্বশেষ ভিজিট ও সম্পন্ন কাজ</p>
            <div className="mt-3 space-y-3">
              {activity.map((a) => (
                <div key={a.id + a.kind} className="relative flex gap-2.5 pl-1">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${a.kind === "visit" ? "bg-emerald-bright/10 text-emerald-bright" : "bg-gold/10 text-gold"}`}>
                    {a.kind === "visit" ? <CheckCircle2 className="h-3 w-3" /> : <CalendarCheck2 className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1 border-b border-white/[0.04] pb-2.5">
                    <p className="truncate text-[0.62rem] font-semibold text-cream/65">{a.title}</p>
                    <p className="mt-0.5 truncate text-[0.54rem] text-cream/30">{a.detail}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 ? <p className="py-6 text-center text-[0.64rem] text-cream/30">কোনো গতিবিধি নেই।</p> : null}
            </div>
          </div>
        </div>
      </Card>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} data={data} send={send} defaultDate={date} />
    </div>
  );
}

function TaskRow({ task, data, send }: { task: Task; data: SectionProps["data"]; send: SectionProps["send"] }) {
  const Icon = typeIcon[task.type];
  const ward = data.wards.find((w) => w.id === task.wardId);
  return (
    <div className={`group flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${task.done ? "border-white/[0.05] bg-white/[0.01] opacity-55" : "border-white/[0.07] bg-white/[0.025] hover:border-white/15"}`}>
      <button onClick={() => send("task", "toggle", task.id, { done: !task.done })} className="mt-0.5 shrink-0 text-cream/30 transition-colors hover:text-emerald-bright" aria-label={task.done ? "সম্পন্ন ফিরিয়ে নিন" : "সম্পন্ন করুন"}>
        {task.done ? <CheckCircle2 className="h-4 w-4 text-emerald-bright" /> : <Circle className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-[0.72rem] font-semibold leading-snug ${task.done ? "text-cream/40 line-through" : "text-cream/80"}`}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.54rem] text-cream/30">
          <span className="flex items-center gap-1"><Clock3 className="h-2.5 w-2.5" /> {task.time}</span>
          <span className="flex items-center gap-1"><Icon className="h-2.5 w-2.5" /> {taskTypeLabels[task.type]}</span>
          <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {task.assignee}</span>
          {ward ? <span>ওয়ার্ড {bn(ward.no)}</span> : null}
        </div>
        {task.notes ? <p className="mt-1 line-clamp-1 text-[0.54rem] text-cream/25">{task.notes}</p> : null}
      </div>
      <Badge tone={task.priority === "high" ? "rose" : task.priority === "medium" ? "gold" : "muted"}>{priorityLabels[task.priority]}</Badge>
      <button onClick={() => send("task", "delete", task.id)} className="shrink-0 rounded p-1 text-cream/0 transition-colors group-hover:text-cream/25 hover:!text-rose-300" aria-label="কাজ মুছুন">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function AddTaskModal({ open, onClose, data, send, defaultDate }: { open: boolean; onClose: () => void; data: SectionProps["data"]; send: SectionProps["send"]; defaultDate: string }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("meeting");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("10:00");
  const [assignee, setAssignee] = useState("শাহাদাত হোসেন");
  const [wardId, setWardId] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim()) {
      setError("কাজের শিরোনাম দিন");
      return;
    }
    setSaving(true);
    const err = await send("task", "create", undefined, { title, type, date, time, assignee, wardId: wardId || undefined, priority, notes });
    setSaving(false);
    if (err) setError(err);
    else {
      setTitle("");
      setNotes("");
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="নতুন কাজ যোগ করুন" sub="দৈনিক পরিকল্পনায় যুক্ত হবে">
      <div className="space-y-3">
        <Field label="কাজের শিরোনাম"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: ওয়ার্ড ৫-এ উঠান বৈঠক" /></Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="ধরন">
            <Select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              {Object.entries(taskTypeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </Field>
          <Field label="তারিখ"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="সময়"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
          <Field label="অগ্রাধিকার">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}>
              {Object.entries(priorityLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="দায়িত্বপ্রাপ্ত">
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {data.team.filter((m) => m.role !== "volunteer").map((m) => <option key={m.id} value={m.name}>{m.name} — {roleLabels[m.role]}</option>)}
            </Select>
          </Field>
          <Field label="ওয়ার্ড (ঐচ্ছিক)">
            <Select value={wardId} onChange={(e) => setWardId(e.target.value)}>
              <option value="">ইউনিয়নব্যাপী</option>
              {data.wards.map((w) => <option key={w.id} value={w.id}>ওয়ার্ড {bn(w.no)} — {w.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="নোট (ঐচ্ছিক)"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="প্রয়োজনীয় নির্দেশনা" className="min-h-[60px]" /></Field>
        {error ? <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[0.68rem] text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>বাতিল</Button>
          <Button variant="gold" size="sm" onClick={submit} disabled={saving}>{saving ? "সংরক্ষণ হচ্ছে…" : "কাজ যোগ করুন"}</Button>
        </div>
      </div>
    </Modal>
  );
}
