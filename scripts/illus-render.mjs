// Renders a list of [service code, variant] (or null for a category picture) to one PNG sheet.
// Usage: node scripts/illus-render.mjs list.json out.png   (list.json: [["TS-001", 17], ...])
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { categories, services } from '../data/services.mjs';
import { illustration, categoryArt } from '../lib/illus.mjs';

const [listFile, out] = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(listFile, 'utf8'));
const byCode = Object.fromEntries(services.map(s => [s.code, s]));
const W = 240, H = 120, COLS = 20;
const svgs = list.map(([code, v]) => (code.startsWith('cat:') ? categoryArt(code.slice(4), categories.findIndex(c => c.id === code.slice(4))) : illustration(byCode[code], byCode[code].cat, v)));
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: COLS * W, height: 600 } });
await p.setContent(`<!doctype html><html><body style="margin:0;background:#fff"><div style="display:grid;grid-template-columns:repeat(${COLS},${W}px);grid-auto-rows:${H}px">${svgs.map(svg => `<div style="width:${W}px;height:${H}px;overflow:hidden">${svg.replace('<svg ', `<svg width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" `)}</div>`).join('')}</div></body></html>`);
await p.screenshot({ path: out, fullPage: true });
await b.close();
