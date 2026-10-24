"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  LayoutTemplate,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import {
  homeSections,
  isSectionCustomised,
  mergeHomeCopy,
  type HomeSectionCopy,
} from "@/content/home-sections";
import { cn, bn } from "@/lib/utils";
import { Badge, Button, Card, CardHead, Field, Input, Stat, Textarea } from "./admin-ui";
import type { SectionProps } from "./types";

/**
 * Editor for every block on the home page: heading, eyebrow, description and
 * a visibility switch. Blank fields keep the copy coded in the component.
 */
export function HomeSectionsManager({ data, send }: SectionProps) {
  const stored = data.homeCopy ?? {};
  const [selected, setSelected] = useState(homeSections[0].id);
  const [draft, setDraft] = useState<Record<string, HomeSectionCopy>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const def = homeSections.find((s) => s.id === selected) ?? homeSections[0];
  const saved = useMemo(() => mergeHomeCopy(stored[selected]), [stored, selected]);
  const current = draft[selected] ?? saved;

  const dirty =
    current.eyebrow !== saved.eyebrow ||
    current.title !== saved.title ||
    current.description !== saved.description ||
    current.visible !== saved.visible;

  const customised = homeSections.filter((s) => isSectionCustomised(stored[s.id])).length;
  const hidden = homeSections.filter((s) => stored[s.id]?.visible === false).length;

  function patch(field: keyof HomeSectionCopy, value: string | boolean) {
    setDraft((prev) => ({ ...prev, [selected]: { ...(prev[selected] ?? saved), [field]: value } }));
    setNotice(null);
  }

  async function save() {
    setSaving(true);
    const error = await send("home", "update", selected, { ...current });
    setSaving(false);
    if (!error) {
      setDraft((prev) => {
        const next = { ...prev };
        delete next[selected];
        return next;
      });
      setNotice("সংরক্ষিত — হোমপেজে দেখা যাচ্ছে");
    }
  }

  async function reset() {
    setSaving(true);
    const error = await send("home", "reset", selected);
    setSaving(false);
    if (!error) {
      setDraft((prev) => {
        const next = { ...prev };
        delete next[selected];
        return next;
      });
      setNotice("ডিফল্ট লেখা ফিরিয়ে আনা হয়েছে");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="মোট সেকশন" value={bn(homeSections.length)} icon={<LayoutTemplate className="h-3.5 w-3.5" />} sub="হোমপেজের ক্রম অনুযায়ী" />
        <Stat label="সম্পাদিত" value={bn(customised)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" sub="নিজের লেখা বসানো" />
        <Stat label="লুকানো" value={bn(hidden)} icon={<EyeOff className="h-3.5 w-3.5" />} tone="rose" sub="হোমপেজে দেখাবে না" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHead
            title="হোমপেজের সেকশন"
            sub="উপর থেকে নিচে — যেভাবে সাইটে দেখায়"
            icon={<Home className="h-4 w-4" />}
            action={<Badge tone="muted">{bn(homeSections.length)}</Badge>}
          />
          <div className="max-h-[32rem] space-y-1 overflow-y-auto p-2">
            {homeSections.map((section, i) => {
              const content = mergeHomeCopy(stored[section.id]);
              const active = section.id === selected;
              return (
                <button
                  key={section.id}
                  onClick={() => setSelected(section.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                    active ? "bg-gold/12 text-gold" : "text-cream/65 hover:bg-white/[0.05] hover:text-cream",
                  )}
                >
                  <span className="mt-0.5 font-latin text-[0.58rem] text-cream/25">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.74rem] font-semibold">{content.title || section.label}</span>
                    <span className="block truncate text-[0.58rem] text-cream/30">{section.label}</span>
                  </span>
                  {content.visible === false ? (
                    <EyeOff className="mt-0.5 h-3 w-3 shrink-0 text-rose-300/80" />
                  ) : isSectionCustomised(stored[section.id]) ? (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-bright" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHead
            title={def.label}
            sub={def.hint}
            icon={<Sparkles className="h-4 w-4" />}
            action={
              <Button size="sm" variant="gold" onClick={save} disabled={!dirty || saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} সংরক্ষণ
              </Button>
            }
          />
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="min-w-0">
                <p className="text-[0.72rem] font-bold text-cream">সেকশনটি দেখান</p>
                <p className="mt-0.5 text-[0.6rem] text-cream/40">বন্ধ করলে হোমপেজ থেকে পুরো ব্লকটি সরে যাবে</p>
              </div>
              <button
                type="button"
                onClick={() => patch("visible", !current.visible)}
                aria-pressed={current.visible}
                className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", current.visible ? "bg-emerald-bright" : "bg-white/15")}
              >
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-night transition-all", current.visible ? "left-[1.4rem]" : "left-0.5")} />
              </button>
            </div>

            <Field label="উপরের ছোট লেখা (eyebrow)" hint="খালি রাখলে আগেরটাই থাকবে">
              <Input value={current.eyebrow} onChange={(e) => patch("eyebrow", e.target.value)} placeholder="যেমন: আমার সম্পর্কে" />
            </Field>

            <Field label="শিরোনাম" hint={`খালি রাখলে: “${def.builtin}”`}>
              <Input value={current.title} onChange={(e) => patch("title", e.target.value)} placeholder={def.builtin} />
            </Field>

            <Field label="বর্ণনা" hint="শিরোনামের নিচের এক-দুই বাক্য">
              <Textarea value={current.description} onChange={(e) => patch("description", e.target.value)} rows={3} placeholder="সংক্ষিপ্ত বর্ণনা…" />
            </Field>

            {notice && (
              <p className="rounded-lg border border-emerald-bright/25 bg-emerald-bright/[0.07] px-3 py-2 text-[0.66rem] text-emerald-bright">{notice}</p>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
              <p className="flex items-center gap-1 text-[0.58rem] text-cream/30">
                <Eye className="h-3 w-3" /> শিরোনাম খালি = কোডে লেখা ডিফল্ট
              </p>
              <Button size="sm" variant="outline" onClick={reset} disabled={saving || !stored[selected]}>
                <RotateCcw className="h-3 w-3" /> ডিফল্টে ফেরান
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
