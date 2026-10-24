import type { ReactNode } from "react";

/**
 * Tiny, dependency-free rich-text renderer.
 *
 * The admin editor stores a safe Markdown subset; this module turns it into
 * React nodes — never `dangerouslySetInnerHTML` — so pasted HTML cannot inject
 * scripts into the public site.
 *
 * Supported blocks:  ## h2 · ### h3 · #### h4 · > quote · - list · 1. list
 *                    --- divider · ![alt](src) image · paragraphs
 * Supported inline:  **bold** · *italic* · `code` · [text](url)
 */

const SAFE_URL = /^(https?:\/\/|\/(?!\/)|mailto:|tel:)/i;

function safeUrl(url: string) {
  const trimmed = url.trim();
  return SAFE_URL.test(trimmed) ? trimmed : "#";
}

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; value: string; href: string };

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function tokenize(text: string): InlineToken[] {
  const out: InlineToken[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ type: "text", value: text.slice(last, index) });
    const raw = match[0];
    if (raw.startsWith("**")) out.push({ type: "bold", value: raw.slice(2, -2) });
    else if (raw.startsWith("`")) out.push({ type: "code", value: raw.slice(1, -1) });
    else if (raw.startsWith("[")) {
      const link = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      out.push(link ? { type: "link", value: link[1], href: safeUrl(link[2]) } : { type: "text", value: raw });
    } else out.push({ type: "italic", value: raw.slice(1, -1) });
    last = index + raw.length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

/** Inline formatting for one line of text. */
export function renderInline(text: string, keyPrefix = "i"): ReactNode[] {
  return tokenize(text).map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (token.type) {
      case "bold":
        return <strong key={key} className="font-bold text-inherit">{token.value}</strong>;
      case "italic":
        return <em key={key}>{token.value}</em>;
      case "code":
        return (
          <code key={key} className="rounded bg-forest/8 px-1 py-0.5 font-latin text-[0.9em] text-forest">
            {token.value}
          </code>
        );
      case "link":
        return (
          <a
            key={key}
            href={token.href}
            className="font-semibold text-emerald underline decoration-emerald/30 underline-offset-2 transition-colors hover:decoration-emerald"
            {...(token.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {token.value}
          </a>
        );
      default:
        return <span key={key}>{token.value}</span>;
    }
  });
}

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

/** Render a rich-text string as styled blocks. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;

  const flushParagraph = (buffer: string[]) => {
    if (!buffer.length) return;
    const value = buffer.join(" ").trim();
    if (value) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-[0.95rem] leading-[1.85] text-muted">
          {renderInline(value, `p${blocks.length}`)}
        </p>,
      );
    }
    buffer.length = 0;
  };

  const paragraph: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(paragraph);
      i += 1;
      continue;
    }

    // Heading
    const heading = trimmed.match(/^(#{2,4})\s+(.*)$/);
    if (heading) {
      flushParagraph(paragraph);
      const level = heading[1].length;
      const content = renderInline(heading[2], `h${i}`);
      const cls =
        level === 2
          ? "mt-8 text-[1.35rem] font-bold leading-snug text-forest sm:text-[1.5rem]"
          : level === 3
            ? "mt-6 text-[1.12rem] font-bold leading-snug text-forest"
            : "mt-5 text-[1rem] font-bold leading-snug text-forest";
      blocks.push(
        level === 2 ? (
          <h2 key={`h-${i}`} className={cls}>{content}</h2>
        ) : level === 3 ? (
          <h3 key={`h-${i}`} className={cls}>{content}</h3>
        ) : (
          <h4 key={`h-${i}`} className={cls}>{content}</h4>
        ),
      );
      i += 1;
      continue;
    }

    // Divider
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushParagraph(paragraph);
      blocks.push(<hr key={`hr-${i}`} className="my-8 border-forest/10" />);
      i += 1;
      continue;
    }

    // Image
    const image = trimmed.match(IMAGE_LINE);
    if (image) {
      flushParagraph(paragraph);
      const src = safeUrl(image[2]);
      blocks.push(
        <figure key={`img-${i}`} className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- uploaded / media assets are not optimised */}
          <img
            src={src}
            alt={image[1] || ""}
            loading="lazy"
            decoding="async"
            className="w-full rounded-2xl border border-forest/10 object-cover"
          />
          {image[1] ? (
            <figcaption className="mt-2 text-center text-[0.72rem] text-muted/80">{image[1]}</figcaption>
          ) : null}
        </figure>,
      );
      i += 1;
      continue;
    }

    // Quote
    if (trimmed.startsWith(">")) {
      flushParagraph(paragraph);
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={`q-${i}`}
          className="my-6 rounded-r-xl border-l-4 border-gold bg-cream-2/70 px-4 py-3 text-[0.95rem] italic leading-relaxed text-forest/85"
        >
          {renderInline(quote.join(" "), `q${i}`)}
        </blockquote>,
      );
      continue;
    }

    // Lists
    const bullet = /^[-*]\s+(.*)$/.test(trimmed);
    const ordered = /^[0-9০-৯]+[.)]\s+(.*)$/.test(trimmed);
    if (bullet || ordered) {
      flushParagraph(paragraph);
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = t.match(/^[-*]\s+(.*)$/) || t.match(/^[0-9০-৯]+[.)]\s+(.*)$/);
        if (!m) break;
        items.push(m[1]);
        i += 1;
      }
      const listItems = items.map((item, index) => (
        <li key={`li-${index}`} className="leading-relaxed">{renderInline(item, `l${i}-${index}`)}</li>
      ));
      blocks.push(
        ordered ? (
          <ol key={`ol-${i}`} className="my-4 list-decimal space-y-1.5 pl-6 text-[0.95rem] text-muted">{listItems}</ol>
        ) : (
          <ul key={`ul-${i}`} className="my-4 list-disc space-y-1.5 pl-6 text-[0.95rem] text-muted">{listItems}</ul>
        ),
      );
      continue;
    }

    paragraph.push(trimmed);
    i += 1;
  }

  flushParagraph(paragraph);

  if (!blocks.length) return null;
  return <div className={className ?? "space-y-4"}>{blocks}</div>;
}

/** Markdown → plain text (used for excerpts, search and JSON-LD). */
export function richToPlain(text: string) {
  return String(text ?? "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*`_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** First paragraph of a rich body — handy for meta descriptions. */
export function richSummary(text: string, max = 180) {
  const plain = richToPlain(String(text ?? "").split(/\n\s*\n/)[0] ?? "");
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
}
