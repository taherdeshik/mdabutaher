"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Eye,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Pencil,
  Quote,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/ui/rich-text";
import { Button, Input } from "./admin-ui";

/**
 * Rich-text editor for blog / news / event copy.
 *
 * Stores a small Markdown subset (bold, italic, headings, lists, quotes,
 * links, images). Images are uploaded straight into the media library and
 * inserted as `![caption](url)`. The preview uses the exact same renderer as
 * the public site, so what you see here is what visitors get.
 */
export function RichEditor({
  value,
  onChange,
  adminKey,
  placeholder,
  minHeight = "min-h-[220px]",
}: {
  value: string;
  onChange: (next: string) => void;
  adminKey?: string;
  placeholder?: string;
  minHeight?: string;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function insert(snippet: string, wrap = false, fallback = "") {
    const area = areaRef.current;
    if (!area) {
      onChange(`${value}${value ? "\n\n" : ""}${snippet}`);
      return;
    }
    const start = area.selectionStart ?? value.length;
    const end = area.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || fallback;
    const text = wrap ? snippet.replace("%s", selected) : snippet;
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      area.focus();
      const caret = start + text.length;
      area.setSelectionRange(caret, caret);
    });
  }

  function block(prefix: string) {
    const area = areaRef.current;
    const start = area?.selectionStart ?? value.length;
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
    onChange(next);
    requestAnimationFrame(() => area?.focus());
  }

  async function uploadImage(file: File) {
    if (!adminKey) {
      setError("আপলোডের জন্য লগইন প্রয়োজন");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", headers: { "x-admin-key": adminKey }, body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "আপলোড ব্যর্থ");
      insert(`![${caption.trim()}](${json.data.url})\n`);
      setShowImage(false);
      setCaption("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "আপলোড ব্যর্থ");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const tools = [
    { icon: Bold, label: "বোল্ড", run: () => insert("**%s**", true, "গুরুত্বপূর্ণ লেখা") },
    { icon: Italic, label: "ইটালিক", run: () => insert("*%s*", true, "ঢালু লেখা") },
    { icon: Heading2, label: "শিরোনাম", run: () => block("## ") },
    { icon: Heading3, label: "উপ-শিরোনাম", run: () => block("### ") },
    { icon: List, label: "বুলেট তালিকা", run: () => block("- ") },
    { icon: ListOrdered, label: "নম্বর তালিকা", run: () => block("1. ") },
    { icon: Quote, label: "উদ্ধৃতি", run: () => block("> ") },
    { icon: Minus, label: "বিভাজক", run: () => insert("\n\n---\n\n") },
  ];

  return (
    <div className="rounded-xl border border-white/12 bg-night/40">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.08] p-1.5">
        <div className="flex gap-0.5">
          {tools.map((t) => (
            <button
              key={t.label}
              type="button"
              title={t.label}
              aria-label={t.label}
              onClick={t.run}
              className="grid h-7 w-7 place-items-center rounded-md text-cream/55 transition-colors hover:bg-white/10 hover:text-cream"
            >
              <t.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <span className="mx-1 h-4 w-px bg-white/10" />

        <button
          type="button"
          onClick={() => setShowLink((v) => !v)}
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.62rem] font-semibold transition-colors",
            showLink ? "bg-gold/15 text-gold" : "text-cream/55 hover:bg-white/10 hover:text-cream",
          )}
        >
          <Link2 className="h-3 w-3" /> লিংক
        </button>
        <button
          type="button"
          onClick={() => setShowImage((v) => !v)}
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.62rem] font-semibold transition-colors",
            showImage ? "bg-gold/15 text-gold" : "text-cream/55 hover:bg-white/10 hover:text-cream",
          )}
        >
          <ImagePlus className="h-3 w-3" /> ছবি
        </button>

        <div className="ml-auto flex rounded-md bg-white/[0.05] p-0.5">
          {([
            { id: "write", label: "লিখুন", icon: Pencil },
            { id: "preview", label: "প্রিভিউ", icon: Eye },
          ] as const).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-[0.6rem] font-semibold transition-colors",
                mode === m.id ? "bg-gold text-night" : "text-cream/50 hover:text-cream",
              )}
            >
              <m.icon className="h-2.5 w-2.5" /> {m.label}
            </button>
          ))}
        </div>
      </div>

      {showLink && (
        <div className="flex gap-1.5 border-b border-white/[0.08] p-2">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://… অথবা /appointment"
            className="h-8 text-[0.68rem]"
          />
          <Button
            size="sm"
            variant="gold"
            onClick={() => {
              const url = linkUrl.trim();
              if (!url) return;
              insert(`[%s](${url})`, true, "লিংকের লেখা");
              setLinkUrl("");
              setShowLink(false);
            }}
          >
            যোগ করুন
          </Button>
        </div>
      )}

      {showImage && (
        <div className="space-y-2 border-b border-white/[0.08] p-2">
          <div className="flex gap-1.5">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="ছবির ক্যাপশন (ঐচ্ছিক)"
              className="h-8 text-[0.68rem]"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadImage(file);
              }}
            />
            <Button size="sm" variant="gold" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} আপলোড
            </Button>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-lg border border-dashed border-white/15 px-3 py-4 text-[0.64rem] text-cream/40 transition-colors hover:border-gold/40 hover:text-cream/70"
          >
            ফোন/ল্যাপটপ থেকে ছবি বেছে নিন — লেখার ভেতরেই বসে যাবে
          </button>
          {error ? <p className="text-[0.62rem] text-rose-300">{error}</p> : null}
        </div>
      )}

      {mode === "write" ? (
        <textarea
          ref={areaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "লেখা শুরু করুন…\n\n## উপ-শিরোনাম\n- তালিকা\n> উদ্ধৃতি"}
          className={cn(
            "w-full resize-y bg-transparent px-3 py-2.5 font-[inherit] text-[0.8rem] leading-relaxed text-cream placeholder:text-cream/25 outline-none",
            minHeight,
          )}
        />
      ) : (
        <div className="max-h-[22rem] overflow-y-auto bg-cream px-4 py-3 text-ink">
          {value.trim() ? (
            <RichText text={value} />
          ) : (
            <p className="text-[0.72rem] text-muted">প্রিভিউ দেখতে কিছু লিখুন…</p>
          )}
        </div>
      )}

      <p className="border-t border-white/[0.06] px-3 py-1.5 text-[0.55rem] text-cream/25">
        **বোল্ড** · *ইটালিক* · ## শিরোনাম · - তালিকা · &gt; উদ্ধৃতি · [লেখা](লিংক) · ![ক্যাপশন](ছবি)
      </p>
    </div>
  );
}
