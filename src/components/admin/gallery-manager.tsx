"use client";

import { useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  EyeOff,
  Film,
  ImageIcon,
  Images,
  Loader2,
  Maximize2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import { campaignVideos } from "@/content/videos";
import { galleryPhotos, galleryPosters } from "@/content/gallery";
import { imageMap } from "@/content/media";
import { cn, bn, withBasePath } from "@/lib/utils";
import { Badge, Button, Card, CardHead, Empty, Field, Input, Modal, Select, Stat, Textarea } from "./admin-ui";
import type { SectionProps } from "./types";

type Kind = "photos" | "posters" | "videos";

const TABS: { id: Kind; label: string; icon: typeof Camera }[] = [
  { id: "photos", label: "ছবি", icon: Camera },
  { id: "posters", label: "পোস্টার", icon: Maximize2 },
  { id: "videos", label: "ভিডিও", icon: Film },
];

type PhotoRow = { id: string; src?: string; key?: string; caption: string; tag: string; tall?: boolean; custom: boolean };
type PosterRow = { id: string; src?: string; key?: string; title: string; subtitle: string; election?: boolean; custom: boolean };
type VideoRow = { id: string; title: string; category?: string; custom: boolean };

const VIDEO_CATEGORIES = ["প্রচারণা", "ইশতেহার", "সাংবাদিক সম্মেলন", "মিডিয়া"];

/** Curated items carry a registry key; uploads carry a public path. */
function thumbSrc(row: { src?: string; key?: string }) {
  const path = row.src || (row.key ? imageMap[row.key] : "") || "";
  return withBasePath(path);
}

/**
 * Add / edit / hide gallery photos, posters and videos.
 * Curated (coded) items can be hidden and restored; new items can be deleted.
 */
export function GalleryManager({ data, send, adminKey }: SectionProps) {
  const store = data.gallery ?? { photos: [], posters: [], videos: [], hidden: [] };
  const hidden = new Set(store.hidden || []);
  const [tab, setTab] = useState<Kind>("photos");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // add-form state
  const [src, setSrc] = useState("");
  const [caption, setCaption] = useState("");
  const [tag, setTag] = useState("");
  const [tall, setTall] = useState(false);
  const [election, setElection] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoCategory, setVideoCategory] = useState("প্রচারণা");
  const [note, setNote] = useState("");

  const photos: PhotoRow[] = useMemo(
    () => [
      ...store.photos.map((p) => ({ id: p.id, src: p.src, caption: p.caption, tag: p.tag, tall: p.tall, custom: true })),
      ...galleryPhotos.filter((p) => !hidden.has(p.key)).map((p) => ({ id: p.key, key: p.key, caption: p.caption, tag: p.tag, tall: p.tall, custom: false })),
      ...galleryPhotos.filter((p) => hidden.has(p.key)).map((p) => ({ id: p.key, key: p.key, caption: p.caption, tag: p.tag, tall: p.tall, custom: false })),
    ],
    [store.photos, hidden],
  );

  const posters: PosterRow[] = useMemo(
    () => [
      ...store.posters.map((p) => ({ id: p.id, src: p.src, title: p.title, subtitle: p.subtitle, election: p.election, custom: true })),
      ...galleryPosters.filter((p) => !hidden.has(p.key)).map((p) => ({ id: p.key, key: p.key, title: p.title, subtitle: p.subtitle, election: p.election, custom: false })),
      ...galleryPosters.filter((p) => hidden.has(p.key)).map((p) => ({ id: p.key, key: p.key, title: p.title, subtitle: p.subtitle, election: p.election, custom: false })),
    ],
    [store.posters, hidden],
  );

  const videos: VideoRow[] = useMemo(
    () => [
      ...store.videos.map((v) => ({ id: v.id, title: v.title, category: v.category, custom: true })),
      ...campaignVideos.map((v) => ({ id: v.id, title: v.title, category: v.category, custom: false })),
    ],
    [store.videos],
  );

  const q = query.trim().toLowerCase();
  const match = (text: string) => !q || text.toLowerCase().includes(q);

  const counts = {
    photos: photos.length,
    posters: posters.length,
    videos: videos.length,
    hidden: store.hidden.length,
  };

  function resetForm() {
    setSrc("");
    setCaption("");
    setTag("");
    setTall(false);
    setElection(false);
    setVideoUrl("");
    setVideoTitle("");
    setVideoCategory("প্রচারণা");
    setNote("");
    setUploaded("");
  }

  async function upload(file: File) {
    setUploading(true);
    setNotice(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", headers: { "x-admin-key": adminKey }, body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "আপলোড ব্যর্থ");
      setSrc(json.data.url as string);
      setUploaded(json.data.name as string);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function addItem() {
    setBusy(true);
    let error: string | null = null;
    if (tab === "photos") {
      error = await send("photo", "create", "", { src, caption, tag, tall });
    } else if (tab === "posters") {
      error = await send("poster", "create", "", { src, title: caption, subtitle: tag, election });
    } else {
      error = await send("video", "create", "", { url: videoUrl, title: videoTitle, category: videoCategory, note });
    }
    setBusy(false);
    if (!error) {
      setAddOpen(false);
      resetForm();
      setNotice("যোগ হয়েছে — গ্যালারিতে এখনই দেখা যাবে");
    }
  }

  async function remove(kind: Kind, id: string, custom: boolean) {
    const entity = kind === "photos" ? "photo" : kind === "posters" ? "poster" : "video";
    const label = custom ? "মুছে ফেলতে" : "লুকাতে";
    if (!window.confirm(`এই আইটেমটি ${label} চান?`)) return;
    setBusy(true);
    const error = await send(entity, "delete", id);
    setBusy(false);
    if (!error) setNotice(custom ? "মুছে ফেলা হয়েছে" : "লুকানো হয়েছে — “ফিরিয়ে আনুন” দিয়ে ফেরানো যাবে");
  }

  async function restore(kind: Kind, id: string) {
    const entity = kind === "photos" ? "photo" : kind === "posters" ? "poster" : "video";
    setBusy(true);
    const error = await send(entity, "restore", id);
    setBusy(false);
    if (!error) setNotice("ফিরিয়ে আনা হয়েছে");
  }

  const addDisabled = tab === "videos" ? !videoUrl.trim() : !src.trim();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="ছবি" value={bn(counts.photos)} icon={<Camera className="h-3.5 w-3.5" />} sub="ফটো গ্যালারি" />
        <Stat label="পোস্টার" value={bn(counts.posters)} icon={<Maximize2 className="h-3.5 w-3.5" />} tone="gold" sub="সচেতনতা ও প্রচারণা" />
        <Stat label="ভিডিও" value={bn(counts.videos)} icon={<Film className="h-3.5 w-3.5" />} tone="sky" sub="ইউটিউব" />
        <Stat label="লুকানো" value={bn(counts.hidden)} icon={<EyeOff className="h-3.5 w-3.5" />} tone="rose" sub="ফিরিয়ে আনা যায়" />
      </div>

      <Card>
        <CardHead
          title="গ্যালারি ব্যবস্থাপনা"
          sub="নতুন ছবি/পোস্টার/ভিডিও যোগ করুন — সাইটে সাথে সাথে যাবে"
          icon={<Images className="h-4 w-4" />}
          action={
            <Button size="sm" variant="gold" onClick={() => { resetForm(); setAddOpen(true); }}>
              <Plus className="h-3 w-3" /> নতুন {tab === "photos" ? "ছবি" : tab === "posters" ? "পোস্টার" : "ভিডিও"}
            </Button>
          }
        />

        <div className="flex flex-col gap-2 border-b border-white/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.68rem] font-semibold transition-colors",
                  tab === t.id ? "bg-gold text-night" : "text-cream/55 hover:text-cream",
                )}
              >
                <t.icon className="h-3 w-3" /> {t.label}
              </button>
            ))}
          </div>
          <div className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream/25" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="খুঁজুন…" className="pl-8" />
          </div>
        </div>

        {notice && (
          <p className="border-b border-emerald-bright/20 bg-emerald-bright/[0.06] px-4 py-2 text-[0.66rem] text-emerald-bright">{notice}</p>
        )}

        <div className="p-3">
          {tab === "photos" && (
            <div className="grid max-h-[30rem] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {photos.filter((p) => match(`${p.caption} ${p.tag}`)).map((p) => {
                const isHidden = hidden.has(p.id);
                return (
                  <div key={p.id} className={cn("overflow-hidden rounded-xl border border-white/10", isHidden && "opacity-45")}>
                    <div className="relative aspect-[4/3] bg-white/5">
                      {thumbSrc(p) ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                        <img src={thumbSrc(p)} alt={p.caption} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="grid h-full place-items-center text-[0.6rem] text-cream/30">কিউরেটেড ছবি</div>
                      )}
                      {isHidden && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-rose-500/85 px-1.5 py-0.5 text-[0.5rem] font-bold text-white">লুকানো</span>
                      )}
                      {p.custom && (
                        <span className="absolute right-1.5 top-1.5 rounded bg-emerald-bright/90 px-1.5 py-0.5 text-[0.5rem] font-bold text-night">নতুন</span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-[0.64rem] font-semibold text-cream/85">{p.caption}</p>
                      <p className="mt-0.5 text-[0.55rem] text-cream/35">{p.tag}</p>
                      <div className="mt-1.5 flex justify-end gap-1">
                        {isHidden ? (
                          <Button size="sm" variant="ghost" onClick={() => restore("photos", p.id)} disabled={busy}>
                            <RotateCcw className="h-3 w-3" /> ফিরিয়ে আনুন
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" onClick={() => remove("photos", p.id, p.custom)} disabled={busy}>
                            <Trash2 className="h-3 w-3" /> {p.custom ? "মুছুন" : "লুকান"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "posters" && (
            <div className="grid max-h-[30rem] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {posters.filter((p) => match(`${p.title} ${p.subtitle}`)).map((p) => {
                const isHidden = hidden.has(p.id);
                return (
                  <div key={p.id} className={cn("overflow-hidden rounded-xl border border-white/10", isHidden && "opacity-45")}>
                    <div className="relative aspect-[3/4] bg-white/5">
                      {thumbSrc(p) ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                        <img src={thumbSrc(p)} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="grid h-full place-items-center px-2 text-center text-[0.6rem] text-cream/30">কিউরেটেড পোস্টার</div>
                      )}
                      {p.election && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-gold px-1.5 py-0.5 text-[0.5rem] font-bold text-night">নির্বাচনী</span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-[0.64rem] font-semibold text-cream/85">{p.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-[0.55rem] text-cream/35">{p.subtitle}</p>
                      <div className="mt-1.5 flex justify-end gap-1">
                        {isHidden ? (
                          <Button size="sm" variant="ghost" onClick={() => restore("posters", p.id)} disabled={busy}>
                            <RotateCcw className="h-3 w-3" /> ফিরিয়ে আনুন
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" onClick={() => remove("posters", p.id, p.custom)} disabled={busy}>
                            <Trash2 className="h-3 w-3" /> {p.custom ? "মুছুন" : "লুকান"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "videos" && (
            <div className="max-h-[30rem] space-y-1.5 overflow-y-auto">
              {videos.filter((v) => match(v.title)).map((v) => {
                const isHidden = hidden.has(v.id);
                return (
                  <div
                    key={v.id}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] p-2",
                      isHidden && "opacity-45",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail */}
                    <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" className="h-10 w-16 shrink-0 rounded object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.68rem] font-semibold text-cream/85">{v.title}</p>
                      <p className="text-[0.55rem] text-cream/35">
                        {v.category} {v.custom && <span className="text-emerald-bright">· নতুন</span>}
                        {isHidden && <span className="text-rose-300"> · লুকানো</span>}
                      </p>
                    </div>
                    {isHidden ? (
                      <Button size="sm" variant="ghost" onClick={() => restore("videos", v.id)} disabled={busy}>
                        <RotateCcw className="h-3 w-3" /> ফিরিয়ে আনুন
                      </Button>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => remove("videos", v.id, v.custom)} disabled={busy}>
                        <Trash2 className="h-3 w-3" /> {v.custom ? "মুছুন" : "লুকান"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "photos" && !photos.filter((p) => match(`${p.caption} ${p.tag}`)).length && (
            <Empty title="কোনো ছবি মেলেনি" sub="নতুন ছবি যোগ করুন বা সার্চ বদলান।" />
          )}
        </div>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`নতুন ${tab === "photos" ? "ছবি" : tab === "posters" ? "পোস্টার" : "ভিডিও"}`}
        sub={tab === "videos" ? "ইউটিউব লিংক বা আইডি দিন" : "ছবি আপলোড করুন বা লিংক দিন"}
      >
        <div className="space-y-3">
          {tab !== "videos" ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[0.68rem] font-bold text-cream">
                  <ImageIcon className="h-3.5 w-3.5 text-gold" /> ছবি
                </p>
                <div className="flex gap-1.5">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload(file);
                    }}
                  />
                  <Button size="sm" variant="gold" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} আপলোড
                  </Button>
                </div>
              </div>
              <Input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="/media/uploads/… অথবা https://…" />
              {src && (
                <div className="overflow-hidden rounded-lg border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element -- upload preview */}
                  <img src={withBasePath(src)} alt="" className="h-40 w-full object-contain bg-black/30" />
                </div>
              )}
              {uploaded && <p className="flex items-center gap-1 text-[0.6rem] text-emerald-bright"><CheckCircle2 className="h-3 w-3" /> {uploaded}</p>}

              {tab === "photos" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="ক্যাপশন">
                    <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="যেমন: নতুন টিউবওয়েল উদ্বোধন" />
                  </Field>
                  <Field label="বিভাগ (ট্যাগ)" hint="ফিল্টার চিপ হিসেবে দেখাবে — যেমন নিরাপদ পানি">
                    <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="নিরাপদ পানি" />
                  </Field>
                  <label className="flex items-center gap-2 text-[0.66rem] text-cream/60 sm:col-span-2">
                    <input type="checkbox" checked={tall} onChange={(e) => setTall(e.target.checked)} /> লম্বা (পোর্ট্রেট) ফ্রেমে দেখান
                  </label>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Field label="শিরোনাম">
                    <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="যেমন: চশমা প্রতীকে ভোট দিন" />
                  </Field>
                  <Field label="সাবটাইটেল">
                    <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="৮ নং মহাদান ইউনিয়ন পরিষদ নির্বাচন" />
                  </Field>
                  <label className="flex items-center gap-2 text-[0.66rem] text-cream/60">
                    <input type="checkbox" checked={election} onChange={(e) => setElection(e.target.checked)} /> নির্বাচনী পোস্টার (আলাদা মেনুতেও দেখাবে)
                  </label>
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-2">
              <Field label="ইউটিউব লিংক বা আইডি" hint="https://youtu.be/… অথবা শুধু ভিডিও আইডি">
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtu.be/…" />
              </Field>
              <Field label="শিরোনাম">
                <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="ভিডিওর নাম" />
              </Field>
              <Field label="ধরন">
                <Select value={videoCategory} onChange={(e) => setVideoCategory(e.target.value)}>
                  {VIDEO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="ছোট বর্ণনা (ঐচ্ছিক)">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="ভিডিওতে কী আছে…" />
              </Field>
              <p className="flex items-center gap-1 text-[0.58rem] text-cream/30"><Youtube className="h-3 w-3" /> ক্লিক করার আগে কোনো YouTube iframe লোড হয় না</p>
            </div>
          )}

          <div className="flex justify-end gap-1.5 border-t border-white/[0.06] pt-3">
            <Button variant="outline" onClick={() => setAddOpen(false)}>বাতিল</Button>
            <Button variant="gold" onClick={addItem} disabled={addDisabled || busy}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} যোগ করুন
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
