"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  Megaphone,
  Newspaper,
  Pencil,
  Plus,
  Radio,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import type { SectionProps } from "./types";
import { Badge, Button, Card, CardHead, Field, Input, Modal, Select, Stat, Textarea } from "./admin-ui";
import { postTypeLabels } from "./admin-labels";
import { bn, formatBnDate } from "@/lib/utils";
import type { Post, PostStatus, PostType } from "@/lib/command-types";

const typeIcon = { news: Newspaper, event: CalendarDays, blog: FileText } as const;
const typeTone = { news: "gold", event: "emerald", blog: "sky" } as const;

export function CmsManager({ data, send }: SectionProps) {
  const { posts } = data;
  const [type, setType] = useState<"all" | PostType>("all");
  const [status, setStatus] = useState<"all" | PostStatus>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Post | null>(null);
  const [creating, setCreating] = useState<PostType | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      if (status !== "all" && p.status !== status) return false;
      if (q && !`${p.title} ${p.excerpt} ${p.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, type, status, query]);

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="মোট পোস্ট" value={bn(posts.length)} icon={<Newspaper className="h-3.5 w-3.5" />} sub="সংবাদ, ইভেন্ট ও ব্লগ" />
        <Stat label="প্রকাশিত" value={bn(published)} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" sub="সাইটে দৃশ্যমান" />
        <Stat label="খসড়া" value={bn(drafts)} icon={<FileText className="h-3.5 w-3.5" />} tone="gold" sub="প্রকাশের অপেক্ষায়" />
        <Stat label="টিকার সক্রিয়" value={bn(posts.filter((p) => p.status === "published" && p.type !== "blog").length)} icon={<Radio className="h-3.5 w-3.5" />} tone="sky" sub="হোমপেজ টিকারে" />
      </div>

      <Card>
        <CardHead
          title="কনটেন্ট স্টুডিও"
          sub="প্রকাশিত পোস্ট সাথে সাথে পাবলিক সাইটে যাবে"
          icon={<Megaphone className="h-4 w-4" />}
          action={
            <div className="flex gap-1.5">
              {(["news", "event", "blog"] as PostType[]).map((t) => (
                <Button key={t} size="sm" variant={t === "news" ? "gold" : "outline"} onClick={() => setCreating(t)}>
                  <Plus className="h-3 w-3" /> {postTypeLabels[t]}
                </Button>
              ))}
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
          <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {(["all", "news", "event", "blog"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} className={`rounded-md px-2.5 py-1 text-[0.62rem] font-semibold transition-colors ${type === t ? "bg-gold text-night" : "text-cream/45 hover:text-cream"}`}>
                {t === "all" ? "সব" : postTypeLabels[t]}
              </button>
            ))}
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-7 w-auto text-[0.62rem]">
            <option value="all">সব অবস্থা</option>
            <option value="published">প্রকাশিত</option>
            <option value="draft">খসড়া</option>
          </Select>
          <div className="relative ml-auto min-w-[150px] flex-1 sm:max-w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-cream/30" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="পোস্ট খুঁজুন" className="h-7 pl-7 text-[0.62rem]" />
          </div>
        </div>

        <div className="grid gap-2.5 p-3 sm:p-4 lg:grid-cols-2">
          {filtered.map((p) => {
            const Icon = typeIcon[p.type];
            const href = p.type === "news" ? `/news/${p.id}` : p.type === "event" ? `/events` : `/blog/${p.slug}`;
            return (
              <div key={p.id} className="group rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-gold"><Icon className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[0.76rem] font-bold leading-snug text-cream/85">{p.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-[0.58rem] text-cream/35">{p.excerpt}</p>
                    </div>
                  </div>
                  <Badge tone={p.status === "published" ? "emerald" : "muted"}>{p.status === "published" ? "প্রকাশিত" : "খসড়া"}</Badge>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[0.54rem] text-cream/30">
                  <Badge tone={typeTone[p.type]}>{postTypeLabels[p.type]}</Badge>
                  <span className="flex items-center gap-1"><CalendarDays className="h-2.5 w-2.5" />{formatBnDate(p.date)}</span>
                  {p.outlet ? <span>· {p.outlet}</span> : null}
                  {p.venue ? <span>· {p.venue}</span> : null}
                  {p.tags.slice(0, 2).map((t) => <span key={t} className="rounded bg-white/[0.05] px-1.5 py-0.5">#{t}</span>)}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(p)} className="flex items-center gap-1 rounded px-1.5 py-1 text-[0.56rem] text-cream/35 transition-colors hover:bg-white/[0.06] hover:text-cream"><Pencil className="h-2.5 w-2.5" /> সম্পাদনা</button>
                    <button onClick={() => send("post", "toggle", p.id)} className="flex items-center gap-1 rounded px-1.5 py-1 text-[0.56rem] text-cream/35 transition-colors hover:bg-white/[0.06] hover:text-emerald-bright">
                      {p.status === "published" ? <><Eye className="h-2.5 w-2.5" /> খসড়া করুন</> : <><Send className="h-2.5 w-2.5" /> প্রকাশ</>}
                    </button>
                    <button onClick={() => send("post", "delete", p.id)} className="flex items-center gap-1 rounded px-1.5 py-1 text-[0.56rem] text-cream/20 transition-colors hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-2.5 w-2.5" /></button>
                  </div>
                  {p.status === "published" ? (
                    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[0.56rem] font-semibold text-gold/70 hover:text-gold">
                      সাইটে দেখুন <ArrowUpRight className="h-2.5 w-2.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 ? <p className="col-span-full px-2 py-8 text-center text-[0.7rem] text-cream/35">কোনো পোস্ট নেই। নতুন কনটেন্ট যোগ করুন।</p> : null}
        </div>
      </Card>

      <Card>
        <CardHead title="প্রকাশনা নিয়ম" sub="কনটেন্ট প্রকাশের আগে যাচাই করুন" icon={<CheckCircle2 className="h-4 w-4" />} />
        <div className="grid gap-2 p-4 sm:grid-cols-3">
          {[
            { t: "তথ্য যাচাই", d: "নাম, তারিখ, স্থান ও পরিসংখ্যান যাচাই করে প্রকাশ করুন।" },
            { t: "সম্মতি", d: "ছবি বা উদ্ধৃতি ব্যবহারে সংশ্লিষ্ট ব্যক্তির সম্মতি নিন।" },
            { t: "আচরণবিধি", d: "প্রতিদ্বন্দ্বী সম্পর্কে ব্যক্তিগত আক্রমণ বা অপপ্রচার এড়িয়ে চলুন।" },
          ].map((c) => (
            <div key={c.t} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <p className="text-[0.64rem] font-bold text-cream/65">{c.t}</p>
              <p className="mt-0.5 text-[0.56rem] leading-relaxed text-cream/30">{c.d}</p>
            </div>
          ))}
        </div>
      </Card>

      <PostEditor
        open={Boolean(creating || editing)}
        initial={editing}
        defaultType={creating || "news"}
        onClose={() => { setCreating(null); setEditing(null); }}
        data={data}
        send={send}
      />
    </div>
  );
}

function PostEditor({
  open,
  initial,
  defaultType,
  onClose,
  data,
  send,
}: {
  open: boolean;
  initial: Post | null;
  defaultType: PostType;
  onClose: () => void;
  data: SectionProps["data"];
  send: SectionProps["send"];
}) {
  const [type, setType] = useState<PostType>(initial?.type || defaultType);
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [body, setBody] = useState(initial?.body.join("\n\n") || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<PostStatus>(initial?.status || "draft");
  const [outlet, setOutlet] = useState(initial?.outlet || "");
  const [venue, setVenue] = useState(initial?.venue || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [tags, setTags] = useState(initial?.tags.join(", ") || "");
  const [image, setImage] = useState(initial?.image || "campaign");
  const [featured, setFeatured] = useState(Boolean(initial?.featured));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [stamp, setStamp] = useState("");

  const incoming = initial?.id || `new-${defaultType}`;
  if (open && stamp !== incoming) {
    setStamp(incoming);
    setType(initial?.type || defaultType);
    setTitle(initial?.title || "");
    setSlug(initial?.slug || "");
    setExcerpt(initial?.excerpt || "");
    setBody(initial?.body.join("\n\n") || "");
    setDate(initial?.date || new Date().toISOString().slice(0, 10));
    setStatus(initial?.status || "draft");
    setOutlet(initial?.outlet || "");
    setVenue(initial?.venue || "");
    setLocation(initial?.location || "");
    setTags(initial?.tags.join(", ") || "");
    setImage(initial?.image || "campaign");
    setFeatured(Boolean(initial?.featured));
    setError("");
  }

  async function submit() {
    if (!title.trim()) {
      setError("শিরোনাম দিন");
      return;
    }
    setSaving(true);
    setError("");
    const err = await send("post", initial ? "update" : "create", initial?.id, {
      type,
      title,
      slug: slug || undefined,
      excerpt,
      body: body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
      date,
      status,
      outlet: outlet || undefined,
      venue: venue || undefined,
      location: location || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      image,
      featured,
    });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "পোস্ট সম্পাদনা" : "নতুন পোস্ট"} sub="প্রকাশিত হলে পাবলিক সাইটে যুক্ত হবে" width="max-w-2xl">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="ধরন">
            <Select value={type} onChange={(e) => setType(e.target.value as PostType)}>
              {Object.entries(postTypeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </Field>
          <Field label="তারিখ"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="অবস্থা">
            <Select value={status} onChange={(e) => setStatus(e.target.value as PostStatus)}>
              <option value="draft">খসড়া</option>
              <option value="published">প্রকাশিত</option>
            </Select>
          </Field>
        </div>
        <Field label="শিরোনাম"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="পোস্টের শিরোনাম" /></Field>
        <Field label="সংক্ষিপ্তসার"><Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="এক-দুই বাক্যে সারসংক্ষেপ" /></Field>
        <Field label="বিস্তারিত (প্রতি প্যারাগ্রাফের মাঝে খালি লাইন)"><Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[140px]" placeholder="প্রথম প্যারাগ্রাফ…&#10;&#10;দ্বিতীয় প্যারাগ্রাফ…" /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="স্লাগ (URL)"><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generate" className="font-latin text-[0.7rem]" /></Field>
          <Field label="ছবি কী">
            <Select value={image} onChange={(e) => setImage(e.target.value)}>
              {["campaign", "water", "education", "community", "books", "digital", "medical", "relief"].map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
          </Field>
          <Field label="ট্যাগ (কমা দিয়ে)"><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="প্রচারণা, শিক্ষা" /></Field>
        </div>
        {type === "news" ? <Field label="গণমাধ্যম / উৎস"><Input value={outlet} onChange={(e) => setOutlet(e.target.value)} placeholder="যেমন: জাগো নিউজ" /></Field> : null}
        {type === "event" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="স্থান"><Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="যেমন: ধনপাড়া ঈদগাহ মাঠ" /></Field>
            <Field label="লোকেশন / ওয়ার্ড"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="তারাকান্দি, ওয়ার্ড ৫" /></Field>
          </div>
        ) : null}
        <label className="flex items-center gap-2 text-[0.66rem] text-cream/50">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-3.5 w-3.5 accent-[#e7b75f]" />
          ফিচার্ড পোস্ট হিসেবে দেখান
        </label>
        <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-[0.56rem] leading-relaxed text-cream/30">
          প্রকাশিত সংবাদ ও ইভেন্ট হোমপেজের নিউজ টিকারে এবং সংশ্লিষ্ট পাবলিক পেজে যুক্ত হবে। ব্লগ পোস্ট {/* link */} <span className="text-gold/60">/blog/{slug || "slug"}</span> ঠিকানায় দেখা যাবে।
        </p>
        {error ? <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[0.68rem] text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>বাতিল</Button>
          <Button variant="gold" size="sm" onClick={submit} disabled={saving}>{saving ? "সংরক্ষণ…" : initial ? "আপডেট করুন" : "পোস্ট তৈরি করুন"}</Button>
        </div>
      </div>
    </Modal>
  );
}
