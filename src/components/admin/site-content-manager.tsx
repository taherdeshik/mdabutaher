"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  ImageIcon,
  LayoutTemplate,
  Link2,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Upload,
} from "lucide-react";
import {
  mergePageContent,
  sitePageGroups,
  sitePages,
  type SitePageContent,
} from "@/content/site-pages";
import { campaignVideos } from "@/content/videos";
import { cn, formatBnDate, withBasePath, bn } from "@/lib/utils";
import { Badge, Button, Card, CardHead, Field, Input, Modal, Select, Stat, Textarea } from "./admin-ui";
import type { SectionProps } from "./types";

type MediaFile = { url: string; name: string; size: number };

const VIDEO_PLACEHOLDER = "https://youtu.be/… অথবা শুধু ভিডিও আইডি";

function thumbnailFor(video: string) {
  const m = video.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{6,})/);
  const id = m ? m[1] : /^[\w-]{6,}$/.test(video.trim()) ? video.trim() : "";
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

export function SiteContentManager({ data, send, adminKey, go }: SectionProps) {
  const stored = data.siteContent ?? {};
  const [selected, setSelected] = useState("home");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Record<string, SitePageContent>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [media, setMedia] = useState<MediaFile[] | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const page = sitePages.find((p) => p.id === selected) ?? sitePages[0];
  const saved = useMemo(() => mergePageContent(stored[selected]), [stored, selected]);
  const hasStored = Boolean(stored[selected]);
  const current = draft[selected] ?? saved;
  const dirty =
    current.label !== saved.label ||
    current.eyebrow !== saved.eyebrow ||
    current.title !== saved.title ||
    current.description !== saved.description ||
    current.body !== saved.body ||
    current.image !== saved.image ||
    current.video !== saved.video ||
    current.visible !== saved.visible;

  const customized = sitePages.filter((p) => {
    const c = stored[p.id];
    return Boolean(c && (c.label || c.eyebrow || c.title || c.description || c.body || c.image || c.video || c.visible === false));
  }).length;
  const hidden = sitePages.filter((p) => stored[p.id]?.visible === false).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sitePages;
    return sitePages.filter((p) =>
      `${p.label} ${p.href} ${p.group} ${p.builtin}`.toLowerCase().includes(q),
    );
  }, [query]);

  function patch(field: keyof SitePageContent, value: string | boolean) {
    setDraft((prev) => ({ ...prev, [selected]: { ...(prev[selected] ?? saved), [field]: value } }));
    setNotice(null);
  }

  async function savePage() {
    setSaving(true);
    const error = await send("page", "update", selected, { ...current });
    setSaving(false);
    if (!error) {
      setDraft((prev) => {
        const next = { ...prev };
        delete next[selected];
        return next;
      });
      setNotice("সংরক্ষিত — সাইটে দেখা যাচ্ছে (কিছু পেজে ১ মিনিট পর্যন্ত সময় লাগতে পারে)");
    }
  }

  async function resetPage() {
    setSaving(true);
    const error = await send("page", "reset", selected);
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

  async function openMedia() {
    setMediaOpen(true);
    if (media) return;
    setMediaBusy(true);
    try {
      const res = await fetch("/api/admin/media", { headers: { "x-admin-key": adminKey }, cache: "no-store" });
      const json = await res.json();
      if (res.ok) setMedia(json.data.files as MediaFile[]);
    } catch {
      setMedia([]);
    } finally {
      setMediaBusy(false);
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setNotice(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "আপলোড ব্যর্থ");
      patch("image", json.data.url as string);
      setMedia((prev) => [{ url: json.data.url as string, name: json.data.name as string, size: json.data.size as number }, ...(prev ?? [])]);
      setNotice("ছবি আপলোড হয়েছে — এখন “সংরক্ষণ” চাপুন");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="মোট মেনু / পেজ" value={bn(sitePages.length)} icon={<LayoutTemplate className="h-3.5 w-3.5" />} sub="প্রধান ও সাব-মেনু" />
        <Stat label="কাস্টমাইজড" value={bn(customized)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" sub="নিজের লেখা বসানো" />
        <Stat label="লুকানো" value={bn(hidden)} icon={<EyeOff className="h-3.5 w-3.5" />} tone="rose" sub="মেনু থেকে বাদ" />
        <Stat label="ছবি আর্কাইভ" value={media ? bn(media.length) : "—"} icon={<ImageIcon className="h-3.5 w-3.5" />} tone="sky" sub="মিডিয়া লাইব্রেরি" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Menu tree */}
        <Card>
          <CardHead
            title="মেনু ও সাব-মেনু"
            sub="যে পেজের লেখা বদলাতে চান, সেটি বাছুন"
            icon={<LayoutTemplate className="h-4 w-4" />}
            action={<Badge tone="muted">{bn(sitePages.length)}</Badge>}
          />
          <div className="border-b border-white/[0.06] p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/25" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="পেজ খুঁজুন…" className="pl-8" />
            </div>
          </div>
          <div className="max-h-[26rem] overflow-y-auto p-2 lg:max-h-[34rem]">
            {sitePageGroups.map((group) => {
              const items = filtered.filter((p) => p.group === group);
              if (!items.length) return null;
              return (
                <div key={group} className="mb-2">
                  <p className="px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-cream/30">{group}</p>
                  {items.map((p) => {
                    const content = mergePageContent(stored[p.id]);
                    const isCustom = Boolean(
                      content.label || content.eyebrow || content.title || content.description ||
                      content.body || content.image || content.video || content.visible === false,
                    );
                    const active = p.id === selected;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelected(p.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                          active ? "bg-gold/12 text-gold" : "text-cream/65 hover:bg-white/[0.05] hover:text-cream",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", isCustom ? "bg-emerald-bright" : "bg-white/15")} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.74rem] font-semibold">{content.label || p.label}</span>
                          <span className="block truncate font-latin text-[0.58rem] text-cream/30">{p.href}</span>
                        </span>
                        {content.visible === false && <EyeOff className="h-3 w-3 shrink-0 text-rose-300/80" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {!filtered.length && <p className="px-3 py-6 text-center text-[0.7rem] text-cream/35">কিছু পাওয়া যায়নি</p>}
          </div>
        </Card>

        {/* Editor */}
        <Card>
          <CardHead
            title={current.label || page.label}
            sub={`${page.href} · ${page.group}`}
            icon={<Eye className="h-4 w-4" />}
            action={
              <div className="flex items-center gap-1.5">
                <a
                  href={withBasePath(page.href)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[0.64rem] font-semibold text-cream/70 transition-colors hover:border-white/30 hover:text-cream"
                >
                  <ExternalLink className="h-3 w-3" /> দেখুন
                </a>
                <Button size="sm" variant="gold" onClick={savePage} disabled={!dirty || saving}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} সংরক্ষণ
                </Button>
              </div>
            }
          />

          <div className="space-y-3 p-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.72rem] font-bold text-cream">পেজ দৃশ্যমান</p>
                  <p className="mt-0.5 text-[0.6rem] text-cream/40">বন্ধ করলে মেনু থেকে সরে যাবে এবং পেজটি ৪০৪ হবে</p>
                </div>
                <button
                  type="button"
                  onClick={() => patch("visible", !current.visible)}
                  aria-pressed={current.visible}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    current.visible ? "bg-emerald-bright" : "bg-white/15",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-night transition-all",
                      current.visible ? "left-[1.4rem]" : "left-0.5",
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="মেনুতে নাম" hint={`খালি রাখলে: “${page.label}”`}>
                <Input value={current.label} onChange={(e) => patch("label", e.target.value)} placeholder={page.label} />
              </Field>
              <Field label="উপরের ছোট লেখা (eyebrow)" hint="যেমন: পরিচিতি, প্রচারণা ২০২৭">
                <Input value={current.eyebrow} onChange={(e) => patch("eyebrow", e.target.value)} placeholder="পরিচিতি" />
              </Field>
            </div>

            <Field label="শিরোনাম" hint={`খালি রাখলে এখনকার শিরোনাম থাকবে — “${page.builtin}”`}>
              <Input value={current.title} onChange={(e) => patch("title", e.target.value)} placeholder={page.builtin} />
            </Field>

            <Field label="বর্ণনা" hint="শিরোনামের নিচের এক-দুই বাক্য">
              <Textarea value={current.description} onChange={(e) => patch("description", e.target.value)} rows={2} placeholder="সংক্ষিপ্ত বর্ণনা…" />
            </Field>

            <Field label="অতিরিক্ত লেখা" hint="একাধিক প্যারাগ্রাফ দিতে মাঝে একটি খালি লাইন রাখুন">
              <Textarea value={current.body} onChange={(e) => patch("body", e.target.value)} rows={3} placeholder="বিস্তারিত লেখা…" />
            </Field>

            {/* Image */}
            <div className="rounded-xl border border-white/[0.06] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[0.68rem] font-bold text-cream"><ImageIcon className="h-3.5 w-3.5 text-gold" /> ছবি</p>
                <div className="flex gap-1.5">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadFile(file);
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} আপলোড
                  </Button>
                  <Button size="sm" variant="ghost" onClick={openMedia}>
                    <ImageIcon className="h-3 w-3" /> লাইব্রেরি
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  value={current.image}
                  onChange={(e) => patch("image", e.target.value)}
                  placeholder="/media/legacy/… অথবা https://…"
                  className="flex-1"
                />
                {current.image && (
                  <button onClick={() => patch("image", "")} className="rounded-lg border border-white/10 px-2 text-cream/40 hover:text-rose-300" title="ছবি সরান">
                    <CircleSlash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {current.image && (
                <div className="mt-2 overflow-hidden rounded-lg border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary path */}
                  <img src={withBasePath(current.image)} alt="" className="h-32 w-full object-cover" />
                </div>
              )}
            </div>

            {/* Video */}
            <div className="rounded-xl border border-white/[0.06] p-3">
              <p className="flex items-center gap-1.5 text-[0.68rem] font-bold text-cream"><Film className="h-3.5 w-3.5 text-gold" /> ভিডিও</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input value={current.video} onChange={(e) => patch("video", e.target.value)} placeholder={VIDEO_PLACEHOLDER} />
                <Select
                  value=""
                  onChange={(e) => e.target.value && patch("video", e.target.value)}
                  aria-label="ভিডিও গ্যালারি থেকে বাছুন"
                >
                  <option value="">গ্যালারি থেকে…</option>
                  {campaignVideos.map((v) => (
                    <option key={v.id} value={v.id}>{v.title.slice(0, 40)}</option>
                  ))}
                </Select>
              </div>
              {current.video && (
                <div className="mt-2 flex items-center gap-2">
                  {thumbnailFor(current.video) && (
                    // eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail preview
                    <img src={thumbnailFor(current.video)} alt="" className="h-12 w-20 rounded object-cover" />
                  )}
                  <span className="inline-flex items-center gap-1 text-[0.6rem] text-emerald-bright"><CheckCircle2 className="h-3 w-3" /> ভিডিও সেট হয়েছে</span>
                </div>
              )}
              <p className="mt-1.5 text-[0.58rem] text-cream/30">
                ভিডিও দিলে পেজের ডান পাশে ক্লিক-টু-প্লে প্লেয়ার দেখাবে; ছবি দিলে ছবিটি দেখাবে।
              </p>
            </div>

            {notice && (
              <p className="rounded-lg border border-emerald-bright/25 bg-emerald-bright/[0.07] px-3 py-2 text-[0.66rem] text-emerald-bright">
                {notice}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
              <p className="text-[0.58rem] text-cream/30">
                {saved.updatedAt ? `সর্বশেষ: ${formatBnDate(saved.updatedAt.slice(0, 10))}${saved.updatedBy ? ` · ${saved.updatedBy}` : ""}` : "এখনো কাস্টমাইজ করা হয়নি"}
              </p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={resetPage} disabled={saving || !hasStored}>
                  <RotateCcw className="h-3 w-3" /> ডিফল্টে ফেরান
                </Button>
                <Button size="sm" variant="ghost" onClick={() => go("cms")}>
                  <Link2 className="h-3 w-3" /> পোস্ট লিখুন
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="কীভাবে কাজ করে" sub="৩ ধাপে যেকোনো মেনুর লেখা, ছবি ও ভিডিও বদলান" icon={<LayoutTemplate className="h-4 w-4" />} />
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            { n: "০১", t: "পেজ বাছুন", d: "বাঁ দিকের তালিকা থেকে মেনু বা সাব-মেনু নির্বাচন করুন।" },
            { n: "০২", t: "লেখা / ছবি / ভিডিও দিন", d: "খালি রাখা ঘরগুলোতে আগের ডিফল্ট লেখাই থেকে যাবে — কিছু ভাঙবে না।" },
            { n: "০৩", t: "সংরক্ষণ করুন", d: "সেভ করলেই পাবলিক সাইটে দেখা যাবে; ভুল হলে “ডিফল্টে ফেরান”।" },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="font-latin text-[0.62rem] font-bold text-gold/80">{s.n}</p>
              <p className="mt-1 text-[0.74rem] font-bold text-cream">{s.t}</p>
              <p className="mt-1 text-[0.64rem] leading-relaxed text-cream/45">{s.d}</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={mediaOpen} onClose={() => setMediaOpen(false)} title="মিডিয়া লাইব্রেরি" sub="ছবি বাছুন — অথবা নতুন আপলোড করুন" width="max-w-2xl">
        {mediaBusy ? (
          <p className="flex items-center gap-2 text-[0.72rem] text-cream/50"><Loader2 className="h-3.5 w-3.5 animate-spin" /> লোড হচ্ছে…</p>
        ) : media && media.length ? (
          <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {media.map((file) => (
              <button
                key={file.url}
                onClick={() => {
                  patch("image", file.url);
                  setMediaOpen(false);
                }}
                className="group overflow-hidden rounded-lg border border-white/10 text-left transition-colors hover:border-gold/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- library thumbnail */}
                <img src={withBasePath(file.url)} alt={file.name} className="aspect-square w-full object-cover" loading="lazy" />
                <span className="block truncate px-1.5 py-1 text-[0.55rem] text-cream/45">{file.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[0.72rem] text-cream/45">কোনো ছবি পাওয়া যায়নি — “আপলোড” দিয়ে নতুন ছবি দিন।</p>
        )}
      </Modal>
    </div>
  );
}
