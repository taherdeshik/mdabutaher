import { chromium } from 'playwright';
const base = process.env.AUDIT_BASE || 'https://mdabutaher.com';
const pages = ['/', '/aimgoal/', '/election-campion/', '/activities/', '/media-news/', '/picture-gallery/', '/poster/', '/video-gallery/', '/election/', '/bloglist/', '/contact/'];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
console.log('AUDIT_BASE=' + base);
for (const p of pages) {
  const t0 = Date.now();
  try {
    const res = await page.goto(base + p, { waitUntil: 'domcontentloaded', timeout: 25000 });
    console.log('OK', p, res && res.status(), (Date.now() - t0) + 'ms');
  } catch (e) { console.log('FAIL', p, String(e).split('\n')[0]); }
}
await browser.close();
