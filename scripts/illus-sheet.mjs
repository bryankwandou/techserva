// Renders every service illustration (and the 20 category arts) to one PNG sheet for the similarity check.
// Usage: node scripts/illus-sheet.mjs docs/proof/tmp/illus-sheet.png
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { categories, services } from '../data/services.mjs';
import { illustration, categoryArt } from '../lib/illus.mjs';

const out = process.argv[2] || 'docs/proof/tmp/illus-sheet.png';
const W = 240, H = 120, COLS = 20;
const items = [...services.map(s => illustration(s, s.cat)), ...categories.map((c, i) => categoryArt(c.id, i))];
const rows = Math.ceil(items.length / COLS);
const html = `<!doctype html><html><body style="margin:0;background:#fff"><div style="display:grid;grid-template-columns:repeat(${COLS},${W}px);grid-auto-rows:${H}px">${items.map(svg => `<div style="width:${W}px;height:${H}px;overflow:hidden">${svg.replace('<svg ', `<svg width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" `)}</div>`).join('')}</div></body></html>`;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: COLS * W, height: rows * H } });
await p.setContent(html);
await p.screenshot({ path: out, fullPage: true });
await b.close();
fs.writeFileSync(out.replace(/\.png$/, '.json'), JSON.stringify({ W, H, COLS, n: items.length, services: services.map(s => [s.code, s.name, s.cat]) }));
console.log('items', items.length, out);
