// Converts a flat "fake transparency" PNG/JPEG signature (checkerboard baked
// into the pixels, as some image generators export) into a real transparent
// PNG suitable for the site, letters and print.
//
// Usage: node scripts/clean-signature.mjs path/to/signature.jpeg
// Output: public/media/signature/abu-taher-signature-2026.png
//
// How it works: the artwork is monochrome ink on a light checkerboard, so the
// alpha channel is derived from luminance (dark = opaque, light = clear) and
// every pixel is repainted with the ink colour. That removes the checkerboard
// completely — including the grey squares — and leaves clean anti-aliased edges.
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";

const SRC = process.argv[2];
if (!SRC) {
  console.error("usage: node scripts/clean-signature.mjs <source-image>");
  process.exit(1);
}

const OUT = "public/media/signature";
const LO = 30;   // luminance considered solid ink
const HI = 202;  // luminance considered paper (grey checker square ~215)
const PAD = 24;

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;

let r = 0, g = 0, b = 0, n = 0;
for (let i = 0; i < data.length; i += ch) {
  const L = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  if (L < 28) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
}
if (!n) {
  console.error("no dark ink pixels found — is this the right file?");
  process.exit(1);
}
const ink = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];

const px = Buffer.alloc(info.width * info.height * 4);
for (let i = 0, j = 0; i < data.length; i += ch, j += 4) {
  const L = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  const a = Math.min(1, Math.max(0, (HI - L) / (HI - LO)));
  px[j] = ink[0]; px[j + 1] = ink[1]; px[j + 2] = ink[2];
  px[j + 3] = Math.round(a * 255);
}

const keyed = await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
const trimmed = await sharp(keyed).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const final = await sharp(trimmed.data)
  .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer();

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/abu-taher-signature-2026.png`, final);
const meta = await sharp(final).metadata();
console.log(`signature ${meta.width}×${meta.height} · ${Math.round(final.length / 1024)} KB · ink rgb(${ink.join(",")})`);
