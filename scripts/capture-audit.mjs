// Captures the legacy mdabutaher.com site: full-page desktop + mobile screenshots,
// and archives referenced images into public/media/legacy for the redesign.
import { chromium, devices } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const BASE = 'https://mdabutaher.com';
const pages = [
  ['home', '/'],
  ['aim-goal', '/aimgoal/'],
  ['election-campaign', '/election-campion/'],
  ['activities', '/activities/'],
  ['media-news', '/media-news/'],
  ['picture-gallery', '/picture-gallery/'],
  ['poster-gallery', '/poster/'],
  ['video-gallery', '/video-gallery/'],
  ['election', '/election/'],
  ['blog-list', '/bloglist/'],
  ['contact', '/contact/'],
  ...['2','3','4','5','6','7'].map(n => [`campaign-${n}`, `/campion/${n}/details/`]),
  ...['2','3','4','8'].map(n => [`activity-${n}`, `/activities/${n}/details/`]),
  ...['1','2','3','4','8'].map(n => [`news-${n}`, `/media-news/${n}/details/`]),
  ...['1','4','8','12','16','20','24','28'].map(n => [`blog-${n}`, `/blog/${n}/details/`]),
];

const outDir = path.resolve('audit/screenshots');
const imgDir = path.resolve('public/media/legacy');
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(imgDir, { recursive: true });

const browser = await chromium.launch();
const manifest = { capturedAt: new Date().toISOString(), pages: [], images: {} };
const imageUrls = new Set();

async function download(url, referer) {
  if (manifest.images[url]) return manifest.images[url];
  try {
    const res = await fetch(url, { headers: { referer, 'user-agent': 'Mozilla/5.0 (audit-capture)' } });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!/image\/(jpeg|png|webp|gif)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 9 * 1024 * 1024) return null;
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg';
    const base = (new URL(url).pathname.split('/').pop() || 'image').replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 48);
    const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 8);
    const file = `${base}-${hash}.${ext}`;
    await fs.writeFile(path.join(imgDir, file), buf);
    manifest.images[url] = `/media/legacy/${file}`;
    return manifest.images[url];
  } catch { return null; }
}

for (const [name, route] of pages) {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const mobile = await browser.newPage({ ...devices['iPhone 13'] });
  try {
    const res = await desktop.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
    await desktop.waitForTimeout(1200);
    await desktop.screenshot({ path: path.join(outDir, `${name}-desktop.png`), fullPage: true });
    const meta = await desktop.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name=description]')?.content || '',
      h1: [...document.querySelectorAll('h1')].map(e => e.innerText.trim()).filter(Boolean),
      h2: [...document.querySelectorAll('h2')].map(e => e.innerText.trim()).filter(Boolean).slice(0, 8),
      nav: [...document.querySelectorAll('nav a, header a')].map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') })).filter(x => x.text && x.href).slice(0, 40),
      imgs: [...document.querySelectorAll('img')].map(i => i.currentSrc || i.src).filter(u => /^https?:/.test(u)),
      videos: [...document.querySelectorAll('iframe')].map(f => f.src).filter(Boolean),
      forms: [...document.querySelectorAll('form')].map(f => ({ action: f.getAttribute('action'), fields: [...f.querySelectorAll('input,textarea,select')].map(i => i.name || i.type) })),
      buttons: [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean).slice(0, 20),
      tel: [...document.querySelectorAll('a[href^="tel:"],a[href^="mailto:"]')].map(a => a.getAttribute('href')),
      text: document.body.innerText.slice(0, 12000),
    }));
    meta.route = route; meta.status = res && res.status(); meta.name = name;
    const localImgs = [];
    for (const u of meta.imgs) { imageUrls.add(u); }
    meta.imgs = meta.imgs.map(u => manifest.images[u] || u);
    manifest.pages.push(meta);

    await mobile.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
    await mobile.waitForTimeout(1000);
    await mobile.screenshot({ path: path.join(outDir, `${name}-mobile.png`), fullPage: true });
    console.log('captured', name);
  } catch (e) { console.log('FAILED', name, String(e).slice(0, 160)); }
  await desktop.close(); await mobile.close();
}

let n = 0;
for (const url of imageUrls) { if (await download(url, BASE)) n++; }
await fs.writeFile(path.resolve('audit/manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`done: ${manifest.pages.length} pages, ${n} images`);
await browser.close();
