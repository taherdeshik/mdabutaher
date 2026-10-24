"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { defaultTickerItems } from "@/content/ticker";
import { cn, bn } from "@/lib/utils";
import { Badge, Button, Card, CardHead, Empty, Field, Input, Stat } from "./admin-ui";
import type { SectionProps } from "./types";

/**
 * Editor for the header news ticker.
 *
 * - off      → the strip disappears from every page
 * - auto     → latest published news/events + the coded defaults
 * - custom   → only the list below, in this exact order
 */
export function TickerManager({ data, send }: SectionProps) {
  const store = data.ticker ?? { settings: { enabled: true, mode: "auto" as const }, items: [] };
  const settings = store.settings;
  const items = store.items ?? [];

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [href, setHref] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ text: "", href: "" });

  const activeCount = items.filter((i) => i.active !== false).length;

  async function run(fn: () => Promise<string | null>, message: string) {
    setBusy(true);
    const error = await fn();
    setBusy(false);
    if (!error) setNotice(message);
    return error;
  }

  async function add() {
    if (!text.trim()) return;
    const error = await run(
      () => send("ticker", "create", "", { text, href: href || "/" }),
      "টিকারে যোগ হয়েছে — সাইটে দেখা যাচ্ছে",
    );
    if (!error) {
      setText("");
      setHref("");
    }
  }

  async function saveSettings(next: { enabled?: boolean; mode?: "auto" | "custom" }) {
    await run(
      () => send("ticker", "settings", "", { enabled: settings.enabled, mode: settings.mode, ...next }),
      "সেটিং সংরক্ষিত",
    );
  }

  async function saveItem(id: string) {
    await run(() => send("ticker", "update", id, draft), "আইটেম সংরক্ষিত");
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="মোট আইটেম" value={bn(items.length)} icon={<Radio className="h-3.5 w-3.5" />} sub="নিজের তালিকা" />
        <Stat label="সক্রিয়" value={bn(activeCount)} icon={<Eye className="h-3.5 w-3.5" />} tone="emerald" sub="টিকারে দেখাচ্ছে" />
        <Stat label="বন্ধ" value={bn(items.length - activeCount)} icon={<EyeOff className="h-3.5 w-3.5" />} tone="rose" sub="লুকানো আইটেম" />
        <Stat
          label="মোড"
          value={settings.mode === "custom" ? "নিজের" : "অটো"}
          icon={<Link2 className="h-3.5 w-3.5" />}
          tone="gold"
          sub={settings.mode === "custom" ? "শুধু নিচের তালিকা" : "সংবাদ/ইভেন্ট + ডিফল্ট"}
        />
      </div>

      {/* Live preview */}
      <Card>
        <CardHead
          title="লাইভ প্রিভিউ"
          sub="হেডারে যেভাবে দেখাবে"
          icon={<Radio className="h-4 w-4" />}
          action={<Badge tone={settings.enabled ? "emerald" : "rose"}>{settings.enabled ? "চালু" : "বন্ধ"}</Badge>}
        />
        <div className="p-3">
          {settings.enabled ? (
            <div className="flex items-stretch overflow-hidden rounded-lg">
              <div className="flex shrink-0 items-center gap-1.5 bg-gold px-3 py-2 text-night">
                <Radio className="h-3.5 w-3.5" />
                <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.12em]">সর্বশেষ</span>
              </div>
              <div className="flex flex-1 items-center gap-4 overflow-hidden bg-forest px-3 py-2">
                {(settings.mode === "custom" ? items.filter((i) => i.active !== false) : defaultTickerItems).slice(0, 3).map((item, i) => (
                  <span key={i} className="flex shrink-0 items-center gap-1.5 text-[0.68rem] text-cream/85">
                    <span className="h-1 w-1 rounded-full bg-gold/80" />
                    {item.text}
                  </span>
                ))}
                {(settings.mode === "custom" ? activeCount : 0) === 0 && (
                  <span className="text-[0.66rem] text-cream/50">
                    কোনো সক্রিয় আইটেম নেই — “নিজের তালিকা” মোডে টিকার স্ট্রিপটি দেখাবে না
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[0.68rem] text-cream/40">
              টিকার বন্ধ — কোনো পেজে দেখাবে না
            </p>
          )}
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Settings */}
        <Card>
          <CardHead title="সেটিংস" sub="চালু/বন্ধ ও উৎস" icon={<Radio className="h-4 w-4" />} />
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="min-w-0">
                <p className="text-[0.72rem] font-bold text-cream">টিকার দেখান</p>
                <p className="mt-0.5 text-[0.6rem] text-cream/40">বন্ধ করলে সাইটের সব পেজ থেকে সরে যাবে</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => saveSettings({ enabled: !settings.enabled })}
                aria-pressed={settings.enabled}
                className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", settings.enabled ? "bg-emerald-bright" : "bg-white/15")}
              >
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-night transition-all", settings.enabled ? "left-[1.4rem]" : "left-0.5")} />
              </button>
            </div>

            <Field label="লেখা কোথা থেকে আসবে">
              <div className="grid gap-1.5">
                {([
                  { id: "auto", title: "অটো", desc: "প্রকাশিত সংবাদ ও ইভেন্ট নিজে থেকেই টিকারে আসবে; সাথে ডিফল্ট লেখাও থাকবে।" },
                  { id: "custom", title: "নিজের তালিকা", desc: "শুধু নিচের তালিকা, আপনার সাজানো ক্রমে।" },
                ] as const).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={busy}
                    onClick={() => saveSettings({ mode: mode.id })}
                    className={cn(
                      "rounded-lg border px-2.5 py-2 text-left transition-colors",
                      settings.mode === mode.id
                        ? "border-gold/50 bg-gold/10"
                        : "border-white/10 hover:border-white/25",
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-[0.68rem] font-bold text-cream">
                      {settings.mode === mode.id && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                      {mode.title}
                    </span>
                    <span className="mt-0.5 block text-[0.58rem] leading-relaxed text-cream/40">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </Field>

            {notice && (
              <p className="rounded-lg border border-emerald-bright/25 bg-emerald-bright/[0.07] px-3 py-2 text-[0.64rem] text-emerald-bright">{notice}</p>
            )}

            <div className="border-t border-white/[0.06] pt-3">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => run(() => send("ticker", "reset", ""), "ডিফল্ট টিকারে ফেরানো হয়েছে")}
              >
                <RotateCcw className="h-3 w-3" /> সব ডিফল্টে ফেরান
              </Button>
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card>
          <CardHead
            title="টিকারের আইটেম"
            sub="উপরেরটি আগে দেখাবে — তীর দিয়ে সাজান"
            icon={<Radio className="h-4 w-4" />}
            action={<Badge tone="muted">{bn(items.length)}</Badge>}
          />
          <div className="space-y-2 border-b border-white/[0.06] p-3">
            <div className="grid gap-1.5 sm:grid-cols-[1fr_auto]">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="নতুন টিকারের লেখা…" />
              <div className="flex gap-1.5">
                <Input value={href} onChange={(e) => setHref(e.target.value)} placeholder="/events" className="font-latin text-[0.68rem] sm:w-32" />
                <Button size="sm" variant="gold" onClick={add} disabled={busy || !text.trim()}>
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} যোগ
                </Button>
              </div>
            </div>
            <p className="text-[0.56rem] text-cream/30">লিংক: /events, /polls, /appointment অথবা https://…</p>
          </div>

          <div className="max-h-[24rem] space-y-1.5 overflow-y-auto p-3">
            {items.length === 0 && (
              <Empty
                title="এখনো কোনো নিজের আইটেম নেই"
                sub="অটো মোডে সংবাদ ও ইভেন্ট থেকে টিকার নিজে থেকেই তৈরি হচ্ছে। উপরে লিখে নিজের আইটেম যোগ করুন।"
              />
            )}
            {items.map((item, index) => {
              const isEditing = editing === item.id;
              const inactive = item.active === false;
              return (
                <div key={item.id} className={cn("rounded-lg border border-white/[0.08] bg-white/[0.02] p-2", inactive && "opacity-50")}>
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <Input value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))} className="h-7 text-[0.7rem]" />
                      <Input value={draft.href} onChange={(e) => setDraft((d) => ({ ...d, href: e.target.value }))} className="h-7 font-latin text-[0.66rem]" />
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>বাতিল</Button>
                        <Button size="sm" variant="gold" onClick={() => saveItem(item.id)} disabled={busy}>
                          <Save className="h-3 w-3" /> সেভ
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 font-latin text-[0.58rem] text-cream/25">{String(index + 1).padStart(2, "0")}</span>
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => {
                          setEditing(item.id);
                          setDraft({ text: item.text, href: item.href });
                        }}
                      >
                        <span className="block truncate text-[0.7rem] font-semibold text-cream/85">{item.text}</span>
                        <span className="block truncate font-latin text-[0.55rem] text-cream/30">{item.href}</span>
                      </button>
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          onClick={() => send("ticker", "move", item.id, { direction: "up" })}
                          disabled={busy || index === 0}
                          className="grid h-6 w-6 place-items-center rounded text-cream/35 hover:bg-white/[0.06] hover:text-cream disabled:opacity-25"
                          aria-label="উপরে"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => send("ticker", "move", item.id, { direction: "down" })}
                          disabled={busy || index === items.length - 1}
                          className="grid h-6 w-6 place-items-center rounded text-cream/35 hover:bg-white/[0.06] hover:text-cream disabled:opacity-25"
                          aria-label="নিচে"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => send("ticker", "update", item.id, { active: !item.active })}
                          disabled={busy}
                          className="grid h-6 w-6 place-items-center rounded text-cream/35 hover:bg-white/[0.06] hover:text-emerald-bright"
                          aria-label={inactive ? "দেখান" : "লুকান"}
                        >
                          {inactive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={() => send("ticker", "delete", item.id)}
                          disabled={busy}
                          className="grid h-6 w-6 place-items-center rounded text-cream/25 hover:bg-rose-500/10 hover:text-rose-300"
                          aria-label="মুছুন"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="কীভাবে কাজ করে" sub="৩টি সহজ নিয়ম" icon={<Radio className="h-4 w-4" />} />
        <div className="grid gap-2.5 p-4 sm:grid-cols-3">
          {[
            { t: "অটো মোড", d: "সংবাদ বা ইভেন্ট প্রকাশ করলেই সেটি নিজে থেকেই টিকারে চলে আসে — কিছু করতে হয় না।" },
            { t: "নিজের তালিকা", d: "মোড “নিজের তালিকা” করলে কেবল নিচের আইটেমগুলোই দেখাবে, আপনার সাজানো ক্রমে।" },
            { t: "চালু/বন্ধ", d: "বন্ধ করলে সাইটের সব পেজ থেকে টিকার স্ট্রিপটি সরে যাবে — বাকি হেডার অটুট।" },
          ].map((c) => (
            <div key={c.t} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <p className="text-[0.66rem] font-bold text-cream/70">{c.t}</p>
              <p className="mt-0.5 text-[0.58rem] leading-relaxed text-cream/35">{c.d}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
