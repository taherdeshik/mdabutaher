// Renders the campaign signature: the Bengali name "আবু হাসান মোহাম্মদ তাহের"
// set in Galada (calligraphic Bengali) with a hand-computed ink swash, in the
// spirit of an Arabic-calligraphy signature.
//
// Usage: node scripts/make-signature.mjs
// Needs: playwright-core with a Chromium build (`npx playwright install chromium`)
// and sharp (for trim/pad).
// Output: public/media/signature/abu-taher-signature.png (transparent).
import { chromium } from "playwright-core";
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const font = readFileSync(resolve(here, "assets/galada-bengali-400-normal.woff2")).toString("base64");
const outDir = resolve(here, "../public/media/signature");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Galada;src:url(data:font/woff2;base64,${font}) format('woff2');font-display:block}
html,body{margin:0;background:transparent}
</style></head><body>
<svg id="sig" xmlns="http://www.w3.org/2000/svg" width="1120" height="520" viewBox="0 0 1120 520">
  <g id="ink" transform="rotate(-1.1 540 250)">
    <text id="l1" x="58" y="196" font-family="Galada" font-size="150" fill="#0a3025" letter-spacing="-0.4">আবু হাসান</text>
    <text id="l2" x="186" y="368" font-family="Galada" font-size="158" fill="#0a3025" letter-spacing="-1.6">মোহাম্মদ তাহের</text>
    <path id="swash" fill="#0a3025"/>
    <circle id="dot" r="4.6" fill="#c8a24a"/>
  </g>
</svg>
<script>
function ribbon(S,C1,C2,E,w0,w1,steps){
  const pts=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps, mt=1-t;
    const x=mt*mt*mt*S.x+3*mt*mt*t*C1.x+3*mt*t*t*C2.x+t*t*t*E.x;
    const y=mt*mt*mt*S.y+3*mt*mt*t*C1.y+3*mt*t*t*C2.y+t*t*t*E.y;
    const dx=3*mt*mt*(C1.x-S.x)+6*mt*t*(C2.x-C1.x)+3*t*t*(E.x-C2.x);
    const dy=3*mt*mt*(C1.y-S.y)+6*mt*t*(C2.y-C1.y)+3*t*t*(E.y-C2.y);
    const len=Math.hypot(dx,dy)||1;
    const w=(w0*Math.pow(1-t,0.45)+w1)*0.5;
    pts.push({x,y,nx:-dy/len,ny:dx/len,w});
  }
  const top=pts.map(p=>[p.x+p.nx*p.w,p.y+p.ny*p.w]);
  const bot=pts.map(p=>[p.x-p.nx*p.w,p.y-p.ny*p.w]).reverse();
  return 'M'+top.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join('L')+
    'L'+bot.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join('L')+'Z';
}
document.fonts.ready.then(()=>{
  const l1=document.getElementById('l1'), l2=document.getElementById('l2');
  const b1=l1.getBBox();
  const end=l2.getEndPositionOfChar(l2.getNumberOfChars()-1);
  const S={x:end.x-26,y:end.y+14}, E={x:b1.x+26,y:end.y+30};
  document.getElementById('swash').setAttribute('d',
    ribbon(S,{x:S.x-210,y:end.y+86},{x:E.x+300,y:end.y+82},E,19,1,120));
  const dot=document.getElementById('dot');
  dot.setAttribute('cx',E.x); dot.setAttribute('cy',E.y);
  document.title='ready';
});
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 600 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.waitForFunction(() => document.title === "ready");
await page.waitForTimeout(200);
const raw = await page.locator("#sig").screenshot({ omitBackground: true });
await browser.close();

mkdirSync(outDir, { recursive: true });
const trimmed = await sharp(raw).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const padded = await sharp(trimmed.data)
  .extend({ top: 18, bottom: 18, left: 18, right: 18, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer({ resolveWithObject: true });

writeFileSync(resolve(outDir, "abu-taher-signature.png"), padded.data);
console.log(`signature ${padded.info.width}×${padded.info.height} · ${Math.round(padded.data.length / 1024)} KB`);
