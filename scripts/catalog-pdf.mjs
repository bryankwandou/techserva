// Prints one catalog book per language with Chromium. Text stays real text, and each service
// row carries a clickable link to its own terms page. Usage: node scripts/catalog-pdf.mjs [codes...]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { BRAND, SITE } from '../data/brand.mjs';
import { categories, services } from '../data/services.mjs';
import { ui, general } from '../data/copy.mjs';
import { priceIn, formatPrice } from '../lib/pricing.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/catalog/pdf');
fs.mkdirSync(OUT, { recursive: true });
const langs = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/langs.json'), 'utf8'));
const fx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fx.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const only = process.argv.slice(2);
const logo = fs.readFileSync(path.join(ROOT, 'src/logo.svg'), 'utf8');
const font = f => `data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'public/assets/fonts', f)).toString('base64')}`;

function book(l) {
  const dict = l.code === 'en' ? {} : JSON.parse(fs.readFileSync(path.join(ROOT, 'data/i18n', `${l.code}.json`), 'utf8'));
  const v = s => esc(dict[s] || s);
  const P = idr => esc(formatPrice(priceIn(idr, l.currency, fx.rates), l.code.startsWith('pa-') ? 'pa' : l.code));
  return `<!doctype html><html lang="${l.code === 'iw' ? 'he' : l.code}" dir="${l.rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${BRAND} ${v(ui.book_title)} (${esc(l.name)})</title><style>
@font-face{font-family:'Instrument Serif';src:url(${font('instrument-serif.woff2')})}
@font-face{font-family:Geist;src:url(${font('geist.woff2')});font-weight:100 900}
@page{size:A4;margin:16mm 15mm}
*{box-sizing:border-box}
body{margin:0;color:#17170f;font:400 9.6pt/1.4 Geist,'Segoe UI','Nirmala UI',Ebrima,'Yu Gothic','Microsoft YaHei','Microsoft JhengHei','Malgun Gothic','Leelawadee UI','Khmer UI','Lao UI','Myanmar Text','Microsoft Himalaya','MV Boli','Mongolian Baiti',Gadugi,Sylfaen,sans-serif}
h1,h2{font-family:'Instrument Serif','Noto Serif',Georgia,'Nirmala UI',Ebrima,'Yu Gothic','Microsoft YaHei','Malgun Gothic','Leelawadee UI','Khmer UI','Myanmar Text',serif;font-weight:400;margin:0}
.cover{height:262mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always}
.cover svg{width:26mm;height:26mm}
.cover h1{font-size:50pt;line-height:1.02;margin-top:10mm}
.cover .sub{font-size:15pt;margin-top:5mm;color:#57564a}
.meta{border-top:1.5pt solid #17170f;padding-top:4mm;display:flex;justify-content:space-between;gap:8mm;font-size:10pt}
.sec{page-break-after:always}
h2{font-size:23pt;margin:0 0 3mm}
.toc{columns:2;column-gap:10mm;list-style:none;padding:0;margin:0}
.toc li{padding:1.6mm 0;border-bottom:.4pt solid #d6d1c1;break-inside:avoid}
.toc a,.terms-link{color:#c13a0a;text-decoration:none}
.toc a{color:inherit}
.rules p{margin:0 0 3mm}.rules b{display:block;font-size:11pt}
.cat{break-before:page}
.cat .blurb{color:#57564a;margin:0 0 4mm}
table{width:100%;border-collapse:collapse}
th{font-weight:500;text-align:start;border-bottom:1pt solid #17170f;padding:1.4mm 1mm;font-size:8.6pt}
td{padding:1.65mm 1mm;border-bottom:.4pt solid #d6d1c1;vertical-align:top}
tr{break-inside:avoid}
td.c{font:500 7.8pt Consolas,monospace;color:#57564a;white-space:nowrap}
td.p{white-space:nowrap;text-align:end;font-weight:500}th.p{text-align:end}
td.t{white-space:nowrap}
.foot{color:#57564a;font-size:8.4pt;margin-top:4mm}
</style></head><body>
<section class="cover"><div>${logo}<h1>${BRAND}<br>${v(ui.book_title)}</h1><p class="sub">${v(ui.book_sub)}</p></div>
<div class="meta"><span dir="auto">${esc(l.native)}</span><span>${v(ui.book_rate)} ${l.currency}</span><span><a href="${SITE}" style="color:inherit">${SITE.replace('https://', '')}</a></span></div></section>
<section class="sec"><h2>${v(ui.book_toc)}</h2><ul class="toc">${categories.map(c => `<li><a href="#${c.id}">${v(c.name)}</a></li>`).join('')}</ul>
<h2 style="margin-top:9mm">${v(ui.book_how)}</h2><div class="rules">${[[ui.how1_t, ui.how1_d], [ui.how2_t, ui.how2_d], [ui.how3_t, ui.how3_d], [ui.how4_t, ui.how4_d]].map(([a, b]) => `<p><b>${v(a)}</b>${v(b)}</p>`).join('')}</div>
<h2 style="margin-top:7mm">${v(ui.book_rules)}</h2><div class="rules">${[[ui.rule1_t, ui.rule1_d], [ui.rule2_t, ui.rule2_d], [ui.rule3_t, ui.rule3_d]].map(([a, b]) => `<p><b>${v(a)}</b>${v(b)}</p>`).join('')}</div>
<p class="foot">${v(ui.book_note)} <a class="terms-link" href="${SITE}/terms/">${v(ui.terms_general)}</a></p></section>
${categories.map(c => `<section class="cat" id="${c.id}"><h2>${v(c.name)}</h2><p class="blurb">${v(c.blurb)}</p>
<table><thead><tr><th></th><th>${v(ui.book_col_service)}</th><th class="p">${v(ui.book_col_price)}</th><th>${v(ui.book_col_terms)}</th></tr></thead><tbody>
${services.filter(s => s.cat === c.id).map(s => `<tr><td class="c">${s.code}</td><td><a style="color:inherit;text-decoration:none" href="${SITE}/services/${s.slug}/">${v(s.name)}</a></td><td class="p">${P(s.idr)}</td><td class="t"><a class="terms-link" href="${SITE}/terms/${s.slug}/">${v(ui.book_link)}</a></td></tr>`).join('')}
</tbody></table></section>`).join('')}
</body></html>`;
}

const todo = langs.filter(l => !only.length || only.includes(l.code));
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
let i = 0; const started = Date.now(); let bytes = 0;
const worker = async () => {
  const page = await browser.newPage();
  while (i < todo.length) {
    const l = todo[i++];
    await page.setContent(book(l), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, tagged: false, outline: false });
    fs.writeFileSync(path.join(OUT, `${l.code}.pdf`), pdf); bytes += pdf.length;
    if (i % 20 === 0) console.log(i, 'of', todo.length, ((Date.now() - started) / 1000).toFixed(0) + 's');
  }
  await page.close();
};
await Promise.all(Array.from({ length: 4 }, worker));
await browser.close();
console.log('books', todo.length, 'MB', (bytes / 1e6).toFixed(1));
