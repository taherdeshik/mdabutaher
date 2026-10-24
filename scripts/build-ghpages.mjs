/**
 * Build a static copy of the public site for GitHub Pages.
 *
 * The real deployment (cPanel + MySQL) is a server app: it has API routes,
 * session auth and an admin dashboard. GitHub Pages can only serve static
 * files, so this script builds a *mirror* of the public pages:
 *
 *   node scripts/build-ghpages.mjs              → out-ghpages/
 *   node scripts/build-ghpages.mjs --publish    → also copy into the repo root,
 *                                                 which is what GitHub Pages
 *                                                 (legacy mode, branch root)
 *                                                 serves for this project site
 *
 *   GH_PAGES_BASE="" node scripts/build-ghpages.mjs   (custom domain / root)
 *
 * What it does:
 *   1. copies the app to .ghpages-build (node_modules is hard-linked)
 *   2. drops server-only routes (api/, admin/) and strips force-dynamic
 *   3. writes a static-export next.config with the /<repo> basePath
 *   4. runs `next build` and copies `out/` → `out-ghpages/`
 *
 * The mirror is content-only: forms, polls and the admin panel need the
 * Node/MySQL server and are intentionally unavailable there.
 */
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

const root = process.cwd();
// Build outside the repo: Turbopack picks the nearest lockfile as workspace
// root, and a nested build dir would resolve React twice (repo + copy).
const workDir = process.env.GH_PAGES_WORK || path.join(os.tmpdir(), "mdabutaher-ghpages");
const outDir = path.join(root, "out-ghpages");
const basePath = process.env.GH_PAGES_BASE ?? "/mdabutaher";
const siteOrigin = (process.env.GH_PAGES_ORIGIN ?? "https://taherdeshik.github.io").replace(/\/$/, "");
const publish = process.argv.includes("--publish");
const manifestPath = path.join(root, ".ghpages-manifest.json");

/** Never let generated output overwrite source. */
const PROTECTED = new Set([
  ".git",
  ".github",
  ".gitignore",
  ".gitattributes",
  "src",
  "public",
  "scripts",
  "data",
  "docs",
  "audit",
  "node_modules",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
  "README.md",
  "server.js",
  ".env.example",
  "out-ghpages",
  ".ghpages-manifest.json",
]);

const SKIP = new Set([
  ".git",
  "node_modules",
  ".next",
  "out",
  "out-ghpages",
  ".ghpages-build",
  ".arena",
  "audit",
  "docs",
  "data",
]);

async function copyTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name.endsWith(".log")) continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(src, dest);
    else if (entry.isFile()) await fs.copyFile(src, dest);
  }
}

/**
 * Hard-link node_modules into the build dir. Turbopack refuses to resolve
 * packages living outside its workspace root, and a plain copy would waste
 * hundreds of megabytes on every build.
 */
async function linkTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) await linkTree(src, dest);
    else if (entry.isSymbolicLink()) {
      // node_modules/.bin entries are relative symlinks — recreate, don't follow.
      const target = await fs.readlink(src);
      await fs.symlink(target, dest).catch(() => undefined);
    } else if (entry.isFile()) {
      await fs.link(src, dest).catch(() => fs.copyFile(src, dest));
    }
  }
}

async function walk(dir, fn) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, fn);
    else if (/\.(ts|tsx)$/.test(entry.name)) await fn(full);
  }
}

function run(cmd, args, cwd, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production", ...extraEnv },
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`))));
  });
}

async function dirSize(dir) {
  let total = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? await dirSize(full) : (await fs.stat(full)).size;
  }
  return total;
}

async function main() {
  console.log(`▲ GitHub Pages mirror → basePath "${basePath || "/"}"`);

  await fs.rm(workDir, { recursive: true, force: true });
  await fs.rm(outDir, { recursive: true, force: true });
  await copyTree(root, workDir);
  await linkTree(path.join(root, "node_modules"), path.join(workDir, "node_modules"));

  // Server-only surfaces.
  await fs.rm(path.join(workDir, "src/app/api"), { recursive: true, force: true });
  await fs.rm(path.join(workDir, "src/app/admin"), { recursive: true, force: true });
  // Runtime image uploads have no meaning on a static host.
  await fs.rm(path.join(workDir, "src/app/media/uploads"), { recursive: true, force: true });
  await fs.rm(path.join(workDir, "server.js"), { force: true });

  // A static mirror cannot store form submissions; start from an empty store
  // so CMS-driven lists render exactly the editorial content in src/content.
  await fs.mkdir(path.join(workDir, "data"), { recursive: true });
  await fs.writeFile(path.join(workDir, "data/db.json"), JSON.stringify({ meta: { seeded: true } }), "utf8");

  // Prerender pages that are dynamic on the real server. Route handlers
  // (feed.xml, sitemap) must opt into static rendering explicitly.
  let stripped = 0;
  await walk(path.join(workDir, "src/app"), async (file) => {
    const src = await fs.readFile(file, "utf8");
    const isRoute = file.endsWith("route.ts") || file.endsWith("sitemap.ts");
    const next = src
      .replace(/^export const dynamic = "force-dynamic";?\s*$/gm, () => {
        stripped += 1;
        return isRoute ? 'export const dynamic = "force-static";' : "";
      })
      // ISR is meaningless in a one-shot export.
      .replace(/^export const revalidate = \d+;?\s*$/gm, () => {
        stripped += 1;
        return "";
      });
    if (next !== src) await fs.writeFile(file, next, "utf8");
  });
  console.log(`  rewrote ${stripped} force-dynamic directive(s)`);

  // Metadata routes (manifest, robots, sitemap, opengraph-image) must declare
  // static rendering explicitly when exporting.
  let forced = 0;
  await walk(path.join(workDir, "src/app"), async (file) => {
    const base = path.basename(file);
    if (!/^(manifest|robots|sitemap)\.ts$/.test(base) && !/opengraph-image\.(tsx|ts)$/.test(base)) return;
    const src = await fs.readFile(file, "utf8");
    if (src.includes("export const dynamic")) return;
    await fs.writeFile(file, `export const dynamic = "force-static";\n${src}`, "utf8");
    forced += 1;
  });
  console.log(`  pinned ${forced} metadata route(s) to static`);

  // Next's auto-generated pages-router _error crashes under `output: export`
  // (React resolves to null in that bundle). A trivial local fallback avoids it.
  const errorPage = path.join(workDir, "src/pages");
  await fs.mkdir(errorPage, { recursive: true });
  await fs.writeFile(
    path.join(errorPage, "_error.tsx"),
    `export default function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "56px 24px", textAlign: "center" }}>
      <p style={{ letterSpacing: "0.3em", fontSize: 12, opacity: 0.5 }}>MANIFESTO 2027</p>
      <h1 style={{ fontSize: 44, margin: "12px 0 4px" }}>{statusCode || 404}</h1>
      <p style={{ opacity: 0.65, marginBottom: 24 }}>পাতাটি পাওয়া যায়নি।</p>
      <a href="${basePath}/" style={{ color: "#0f5132", fontWeight: 600 }}>মূল পাতায় ফিরুন</a>
    </main>
  );
}
`,
    "utf8",
  );

  await fs.writeFile(
    path.join(workDir, "next.config.ts"),
    `import type { NextConfig } from "next";

// Generated by scripts/build-ghpages.mjs — static mirror for GitHub Pages.
const nextConfig: NextConfig = {
  output: "export",
  basePath: ${JSON.stringify(basePath)},
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default nextConfig;
`,
    "utf8",
  );

  console.log("  compiling…");
  await run("npx", ["next", "build"], workDir, {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: `${siteOrigin}${basePath}`,
  });

  const staticOut = path.join(workDir, "out");
  await dedupeMetadataBase(staticOut);
  await prefixInternalUrls(staticOut);
  if (!existsSync(staticOut)) throw new Error("next build produced no out/ directory");
  await fs.cp(staticOut, outDir, { recursive: true });

  // GitHub Pages runs Jekyll unless told otherwise; Jekyll drops _next/.
  await fs.writeFile(path.join(outDir, ".nojekyll"), "", "utf8");

  const pages = (await fs.readdir(outDir)).length;
  const size = await dirSize(outDir);
  console.log(`✓ out-ghpages/ ready — ${pages} top-level entries, ${(size / 1024 / 1024).toFixed(1)} MB`);

  if (publish) await publishToRoot();
}

/**
 * Next appends basePath to metadata routes (opengraph-image) *and* resolves
 * them against metadataBase, which already contains the basePath here — the
 * resulting URL has the segment twice. Fix it in the exported markup.
 */
async function dedupeMetadataBase(dir) {
  const doubled = `${siteOrigin}${basePath}${basePath}/`;
  const single = `${siteOrigin}${basePath}/`;
  let files = 0;
  await walkAny(dir, async (file) => {
    if (!/\.(html|txt|xml|json|webmanifest)$/.test(file)) return;
    const src = await fs.readFile(file, "utf8");
    if (!src.includes(doubled)) return;
    await fs.writeFile(file, src.split(doubled).join(single), "utf8");
    files += 1;
  });
  if (files) console.log(`  fixed doubled base path in ${files} file(s)`);
}

/**
 * Last line of defence: some anchors come from content data or template
 * strings, so Next cannot prefix them. Rewrite every root-relative URL in the
 * exported markup to sit under the deployment base path.
 */
async function prefixInternalUrls(dir) {
  if (!basePath) return;
  const re = /(\s(?:href|src|action)=")\/(?!\/|mdabutaher\/)([^"]*)"/g;
  let files = 0;
  await walkAny(dir, async (file) => {
    if (!/\.(html|txt)$/.test(file)) return;
    const src = await fs.readFile(file, "utf8");
    const next = src.replace(re, (_m, attr, rest) => `${attr}${basePath}/${rest}"`);
    if (next !== src) {
      await fs.writeFile(file, next, "utf8");
      files += 1;
    }
  });
  console.log(`  prefixed internal URLs in ${files} file(s)`);
}

async function walkAny(dir, fn) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkAny(full, fn);
    else if (entry.isFile()) await fn(full);
  }
}

async function listFiles(dir, prefix = "") {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await listFiles(path.join(dir, entry.name), rel)));
    else if (entry.isFile()) files.push(rel);
  }
  return files;
}

/**
 * GitHub Pages "legacy" mode serves this branch's root folder. Copy the mirror
 * there, tracking every generated path in .ghpages-manifest.json so a later
 * publish can delete pages that no longer exist.
 */
async function publishToRoot() {
  const files = await listFiles(outDir);
  const previous = existsSync(manifestPath) ? JSON.parse(await fs.readFile(manifestPath, "utf8")) : [];

  for (const rel of files) {
    const top = rel.split("/")[0];
    if (PROTECTED.has(top)) throw new Error(`refusing to publish over protected path "${top}"`);
    const dest = path.join(root, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(path.join(outDir, rel), dest);
  }

  // .nojekyll stops GitHub from filtering out _next/.
  await fs.writeFile(path.join(root, ".nojekyll"), "", "utf8");

  const current = new Set(files);
  let removed = 0;
  for (const rel of previous) {
    if (current.has(rel)) continue;
    const dest = path.join(root, rel);
    if (existsSync(dest)) {
      await fs.rm(dest, { force: true });
      removed += 1;
    }
  }

  const manifest = [...current, ".nojekyll"].sort();
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 0)}\n`, "utf8");
  console.log(`✓ published ${files.length} files to the repo root (${removed} stale removed)`);
}

main().catch((error) => {
  console.error("✗", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
