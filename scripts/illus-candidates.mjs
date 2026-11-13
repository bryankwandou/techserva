// Renders K candidate variants of every service illustration, in sheets of 1000, for scripts/illus_pick.py.
// Usage: node scripts/illus-candidates.mjs docs/proof/tmp/cand 32
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { categories, services } from '../data/services.mjs';
import { illustration, categoryArt, VARIANTS } from '../lib/illus.mjs';

const dir = process.argv[2] || 'docs/proof/tmp/cand'; const K = +(process.argv[3] || 32);
fs.mkdirSync(dir, { recursive: true });
const W = 240, H = 120, COLS = 20, PER = 1000;
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 2 ** 32; };
const items = [];
categories.forEach((c, i) => items.push({ fixed: true, svg: categoryArt(c.id, i) }));
for (const [si, s] of services.entries()) {
  const vs = new Set();
  while (vs.size < Math.min(K, VARIANTS)) vs.add(Math.floor(rnd() * VARIANTS));
  for (const v of vs) items.push({ si, v, svg: illustration(s, s.cat, v) });
}
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: COLS * W, height: 800 } });
const sheets = [];
for (let off = 0, n = 0; off < items.length; off += PER, n++) {
  const part = items.slice(off, off + PER);
  await p.setContent(`<!doctype html><html><body style="margin:0;background:#fff"><div style="display:grid;grid-template-columns:repeat(${COLS},${W}px);grid-auto-rows:${H}px">${part.map(it => `<div style="width:${W}px;height:${H}px;overflow:hidden">${it.svg.replace('<svg ', `<svg width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" `)}</div>`).join('')}</div></body></html>`);
  const f = path.join(dir, `sheet-${n}.png`);
  await p.screenshot({ path: f, fullPage: true });
  sheets.push({ file: f, count: part.length });
  process.stdout.write(`${n} `);
}
await b.close();
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ W, H, COLS, sheets, items: items.map(it => (it.fixed ? null : [it.si, it.v])), codes: services.map(s => s.code) }));
console.log('\ncandidates', items.length);
