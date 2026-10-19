// CI helper: downscale captured legacy screenshots + archived page imagery to webp.
// Run in GitHub Actions after scripts/capture-audit.mjs (needs `sharp` installed).
// Originals are only removed once the webp file exists, so a failed conversion
// never wipes the audit output.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const jobs = [
  { dir: "audit/screenshots", width: 1000, quality: 68 },
  { dir: "public/media/legacy", width: 900, quality: 72 },
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

let total = 0;
let bytes = 0;

for (const job of jobs) {
  if (!(await exists(job.dir))) {
    console.log(`skip ${job.dir} (missing)`);
    continue;
  }
  const files = (await fs.readdir(job.dir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  let kept = 0;
  for (const file of files) {
    const src = path.join(job.dir, file);
    const dest = path.join(job.dir, file.replace(/\.(png|jpe?g)$/i, ".webp"));
    try {
      const out = await sharp(src)
        .rotate()
        .resize({ width: job.width, withoutEnlargement: true })
        .webp({ quality: job.quality, effort: 4 })
        .toBuffer();
      if (out.length < 512) throw new Error("empty output");
      await fs.writeFile(dest, out);
      const st = await fs.stat(dest);
      bytes += st.size;
      total += 1;
      kept += 1;
      if (dest !== src) await fs.rm(src);
      console.log(`ok ${dest} ${(st.size / 1024).toFixed(0)}KB`);
    } catch (e) {
      console.log(`FAIL ${src}: ${String(e).slice(0, 120)}`);
    }
  }
  console.log(`${job.dir}: ${kept}/${files.length} converted`);
}

if (total === 0) {
  console.error("No images were optimized — leaving repository untouched.");
  process.exit(1);
}
console.log(`done: ${total} webp files, ${(bytes / 1024 / 1024).toFixed(2)} MB total`);
