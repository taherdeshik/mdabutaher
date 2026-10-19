// Campaign hero portrait retouch.
//
// Usage: node scripts/retouch-hero.mjs [source-image]
// Default source is the WhatsApp studio export; override with any 4:5-friendly
// portrait. Produces public/media/candidate/hero-portrait.webp (1080×1350).
//
// The treatment is deliberately conservative: crop, gentle grade, tiny median
// pass and soft sharpen. Faces are never altered or generated — this is a real
// candidate portrait used on a live campaign site.
import sharp from "sharp";
import { mkdirSync, statSync } from "node:fs";

const SRC =
  process.argv[2] ||
  "/tmp/arena-coding-uploads/WhatsApp Image 2026-10-19 at 16.44.31.jpeg";
const OUT = "public/media/candidate";
const W = 1080;
const H = 1350;

mkdirSync(OUT, { recursive: true });

const vignette = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="v" cx="50%" cy="40%" r="72%">
    <stop offset="55%" stop-color="#05130f" stop-opacity="0"/>
    <stop offset="100%" stop-color="#05130f" stop-opacity="0.38"/>
  </radialGradient></defs>
  <rect width="100%" height="100%" fill="url(#v)"/>
</svg>`);

const meta = await sharp(SRC).metadata();
const srcW = meta.width ?? 896;
const srcH = meta.height ?? 904;
const cropW = Math.min(srcW, Math.round((srcH * 4) / 5));

await sharp(SRC)
  .rotate()
  .extract({
    left: Math.max(0, Math.round((srcW - cropW) / 2)),
    top: 0,
    width: cropW,
    height: srcH,
  })
  .resize(W, H, { fit: "cover", kernel: "lanczos3" })
  .modulate({ brightness: 1.02, saturation: 1.03 })
  .linear(1.05, -5)
  .median(1)
  .sharpen({ sigma: 0.5, m1: 0.8, m2: 0.3 })
  .composite([{ input: vignette, blend: "over" }])
  .webp({ quality: 88, effort: 6 })
  .toFile(`${OUT}/hero-portrait.webp`);

const out = await sharp(`${OUT}/hero-portrait.webp`).metadata();
const kb = Math.round(statSync(`${OUT}/hero-portrait.webp`).size / 1024);
console.log(`hero-portrait ${out.width}×${out.height} · ${kb} KB from ${srcW}×${srcH}`);
