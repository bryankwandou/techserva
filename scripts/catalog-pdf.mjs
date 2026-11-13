// Prints one catalog book per language with Chromium. Text stays real text, and each service
// row carries a clickable link to its own terms page. Usage: node scripts/catalog-pdf.mjs [codes...]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { BRAND, SITE } from '../data/brand.mjs';
import { categories, services } from '../data/services.mjs';
import { ui, general, catTerms } from '../data/copy.mjs';
import { priceIn, formatPrice, daysFor } from '../lib/pricing.mjs';
import { illustration, categoryArt } from '../lib/illus.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/catalog/pdf');
fs.mkdirSync(OUT, { recursive: true });
const langs = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/langs.json'), 'utf8'));
const fx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fx.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const only = process.argv.slice(2);
const logo = fs.readFileSync(path.join(ROOT, 'src/logo.svg'), 'utf8');
// Logo for the dark covers: the ticket turns light and its cut-out turns dark.
const darkLogo = logo.replace('#17170f', '#TMP').replace('#f4f1e8', '#14140e').replace('#TMP', '#f4f1e8');
const YEAR = new Date().getFullYear();
// Cover mosaic: 24 different service pictures, the first of every category plus four more, so no picture repeats.
const MOSAIC = [...categories.map(c => services.find(s => s.cat === c.id)), ...categories.slice(0, 4).map(c => services.filter(s => s.cat === c.id)[1])];
const WA_NUMBER = '62895365173030';
const WA_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.4 19z"/></svg>';
const font = f => `data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'public/assets/fonts', f)).toString('base64')}`;

function book(l) {
  const dict = l.code === 'en' ? {} : JSON.parse(fs.readFileSync(path.join(ROOT, 'data/i18n', `${l.code}.json`), 'utf8'));
  const fixF = path.join(ROOT, 'data/i18n-fix', `${l.code}.json`);
  if (fs.existsSync(fixF)) Object.assign(dict, JSON.parse(fs.readFileSync(fixF, 'utf8')));
  const v = s => esc(dict[s] || s);
  const P = idr => esc(formatPrice(priceIn(idr, l.currency, fx.rates), l.code.startsWith('pa-') ? 'pa' : l.code));
  // WhatsApp links with the message already written in this book's language. The last line names the page and service.
  const raw = s => dict[s] || s;
  const wa = (lines, src) => esc(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent([raw(ui.wa_hi), ...lines, '', `[${src} | ${l.code}]`].join('\n'))}`);
  const waOrder = s => wa([raw(ui.wa_m_order), `${s.code} ${raw(s.name)}`, `${raw(ui.wa_m_price)} ${formatPrice(priceIn(s.idr, l.currency, fx.rates), l.code.startsWith('pa-') ? 'pa' : l.code)}`, '', raw(ui.wa_m_brief)], `pdf-catalog/${s.cat} | ${s.code}`);
  return `<!doctype html><html lang="${l.code === 'iw' ? 'he' : l.code}" dir="${l.rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${BRAND} ${v(ui.book_title)} (${esc(l.name)})</title><style>
@font-face{font-family:'Instrument Serif';src:url(${font('instrument-serif.woff2')})}
@font-face{font-family:Geist;src:url(${font('geist.woff2')});font-weight:100 900}
@page{size:A4;margin:16mm 15mm 18mm;@bottom-left{content:'${BRAND} · ${v(ui.book_title).replace(/'/g, '’')}';font:400 7.5pt Geist,sans-serif;color:#8a887a}@bottom-right{content:counter(page);font:500 8pt Geist,sans-serif;color:#17170f}}
@page full{margin:0;@bottom-left{content:none}@bottom-right{content:none}}
.front,.back{page:full;width:210mm;height:297mm;position:relative;overflow:hidden;background:#14140e;color:#f4f1e8;break-after:page}
.back{break-after:auto;break-before:page;display:flex;flex-direction:column;justify-content:space-between;padding:18mm 18mm 20mm}
.mosaic{position:absolute;left:-30mm;top:58mm;width:290mm;display:grid;grid-template-columns:repeat(6,1fr);gap:4mm;transform:rotate(-12deg);transform-origin:center}
.mosaic div{border-radius:3mm;overflow:hidden}
.mosaic svg{display:block;width:100%;height:auto}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,#14140e 0,#14140e 26%,rgba(20,20,14,.15) 46%,rgba(20,20,14,.1) 62%,#14140e 84%)}
.front .top,.back .top{position:relative;display:flex;justify-content:space-between;align-items:center;font-size:9pt;letter-spacing:.04em}
.front .top{padding:16mm 18mm 0}
.mark{display:flex;align-items:center;gap:3mm}.mark svg{width:10mm;height:10mm}.mark b{font:400 17pt 'Instrument Serif',Georgia,serif;letter-spacing:0}
.title{position:relative;padding:12mm 18mm 0}
.kick{display:inline-block;font:500 8.5pt Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#ff7a45;border-top:1.2pt solid #ff5a1f;padding-top:2mm}
.front h1{font-size:64pt;line-height:.98;margin:4mm 0 3mm;color:#fbf8f0;max-width:160mm}
.title p{font-size:13pt;color:#cfcabb;margin:0;max-width:140mm}
.band{position:absolute;left:0;right:0;bottom:30mm;display:grid;grid-template-columns:repeat(4,1fr);background:#ff5a1f;color:#17170f}
.band div{padding:5mm 6mm;border-inline-end:.8pt solid rgba(23,23,15,.25);font-size:8.5pt;line-height:1.25}.band div:last-child{border:0}
.band b{display:block;font:400 26pt/1 'Instrument Serif',Georgia,serif;margin-bottom:1mm}
.front .bottom{position:absolute;left:18mm;right:18mm;bottom:12mm;display:flex;justify-content:space-between;gap:8mm;font-size:9pt;color:#cfcabb}
.front .bottom a,.back .cta a{color:#fbf8f0;text-decoration:none;font-weight:600}
.back h2{font-size:34pt;color:#fbf8f0;margin-bottom:8mm}
.back ol{list-style:none;margin:0;padding:0;display:grid;gap:6mm}
.back li{display:grid;grid-template-columns:16mm 1fr;gap:4mm;border-top:.6pt solid #3a392f;padding-top:4mm}
.back li span{font:400 22pt/1 'Instrument Serif',Georgia,serif;color:#ff7a45}.back li b{font-size:12pt}.back li p{margin:1mm 0 0;color:#cfcabb}
.cta{border-top:1.4pt solid #ff5a1f;padding-top:6mm}.cta p{margin:0;color:#cfcabb}.cta a{display:block;font:400 30pt 'Instrument Serif',Georgia,serif;margin:2mm 0 4mm}.cta small{color:#8a887a;font-size:8pt;line-height:1.4;display:block}
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
.cover-art{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:10mm}
.cover-art div{background:#f3eee2;border-radius:3mm;padding:2mm}
.cover-art svg,.steps svg,.opener svg{display:block;width:100%;height:auto}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin-top:2mm}.steps svg{max-height:20mm}
.steps .st{background:#f3eee2;border-radius:3mm;padding:3mm;break-inside:avoid}
.steps .no{font:500 8pt Consolas,monospace;color:#c13a0a}
.steps b{display:block;font-size:10.5pt;margin:1.5mm 0 1mm}
.steps p{margin:0;font-size:8pt;line-height:1.3;color:#3a392f}
.opener{display:grid;grid-template-columns:1.05fr 1fr;gap:7mm;align-items:center;margin-bottom:6mm}
.opener .art{background:#f3eee2;border-radius:4mm;padding:4mm}
.opener h2{font-size:28pt;line-height:1.05}
.opener .blurb{font-size:10.5pt}
.box{border-top:1pt solid #17170f;padding-top:2mm;margin-top:3mm}
.box h4{margin:0 0 1mm;font-size:8.6pt;text-transform:uppercase;letter-spacing:.06em;color:#57564a;font-weight:600}
.box ul{margin:0;padding:0;list-style:none}.box li{padding-inline-start:4.5mm;position:relative;margin:.6mm 0}
.box li::before{content:'✓';position:absolute;inset-inline-start:0;color:#c13a0a;font-weight:700}
.box p{margin:0}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}
.card{border:.6pt solid #d6d1c1;break-inside:avoid;display:flex;flex-direction:column;background:#fff}
.card .pic{background:#fbf8f0;border-bottom:.6pt solid #d6d1c1}.card .pic svg{display:block;width:100%;height:auto}
.card .body{padding:2.4mm 3mm 3mm;display:flex;flex-direction:column;gap:1mm;flex:1}
.card .code{font:500 7pt Consolas,monospace;color:#57564a}
.card .nm{font-weight:600;font-size:9.4pt;line-height:1.25;min-height:7mm;color:inherit;text-decoration:none}
.card .from{font-size:7.6pt;color:#57564a;margin-top:auto}
.card .pr{font:400 15pt/1 'Instrument Serif',Georgia,serif;color:#17170f}
.card .row{display:flex;justify-content:space-between;align-items:baseline;gap:2mm;font-size:7.6pt;color:#57564a;border-top:.4pt dashed #d6d1c1;padding-top:1.4mm;margin-top:1mm}
.card .row a{color:#c13a0a;text-decoration:none;font-weight:600}
.card a.wa{display:flex;align-items:center;justify-content:center;gap:1.4mm;margin-top:1.6mm;padding:1.2mm 0;border:.6pt solid #1f8f4e;border-radius:1.2mm;color:#1f8f4e;font-size:7.4pt;font-weight:600;text-decoration:none}
.card a.wa svg,.wa-back svg{width:3mm;height:3mm}
.back .cta a.wa-back{display:flex;align-items:center;gap:2mm;margin-top:3mm;color:#3ccf7a;font-size:12pt}.back .cta a.wa-back svg{width:5mm;height:5mm}
</style></head><body>
<section class="front">
<div class="mosaic">${MOSAIC.map(s => `<div>${illustration(s, s.cat)}</div>`).join('')}</div>
<div class="shade"></div>
<div class="top"><span class="mark">${darkLogo}<b>${BRAND}</b></span><span>${YEAR} · <span dir="auto">${esc(l.native)}</span></span></div>
<div class="title"><span class="kick">${v(ui.hero_kicker)}</span><h1>${v(ui.book_title)}</h1><p>${v(ui.book_sub)}</p></div>
<div class="band"><div><b>500</b>${v(ui.fact_services)}</div><div><b>20</b>${v(ui.fact_categories)}</div><div><b>${langs.length}</b>${v(ui.fact_languages)}</div><div><b>${l.currency}</b>${v(ui.fact_currency)}</div></div>
<div class="bottom"><span>${v(ui.footer_tag)}</span><a href="${SITE}">${SITE.replace('https://', '')}</a></div></section>
<section class="sec"><h2>${v(ui.book_toc)}</h2><ul class="toc">${categories.map(c => `<li><a href="#${c.id}">${v(c.name)}</a></li>`).join('')}</ul>
<h2 style="margin-top:9mm">${v(ui.book_how)}</h2><div class="steps">${[[ui.how1_t, ui.how1_d], [ui.how2_t, ui.how2_d], [ui.how3_t, ui.how3_d], [ui.how4_t, ui.how4_d]].map(([a, b], i) => `<div class="st"><span class="no">0${i + 1}</span><b>${v(a)}</b><p>${v(b)}</p></div>`).join('')}</div>
<h2 style="margin-top:7mm">${v(ui.book_rules)}</h2><div class="rules">${[[ui.rule1_t, ui.rule1_d], [ui.rule2_t, ui.rule2_d], [ui.rule3_t, ui.rule3_d]].map(([a, b]) => `<p><b>${v(a)}</b>${v(b)}</p>`).join('')}</div>
<p class="foot">${v(ui.book_note)} <a class="terms-link" href="${SITE}/terms/">${v(ui.terms_general)}</a></p></section>
${categories.map((c, ci) => { const t = catTerms[c.id]; return `<section class="cat" id="${c.id}">
<div class="opener"><div class="art">${categoryArt(c.id, ci)}</div><div><h2>${v(c.name)}</h2><p class="blurb">${v(c.blurb)}</p>
<div class="box"><h4>${v(ui.svc_scope)}</h4><ul>${t.scope.map(x => `<li>${v(x)}</li>`).join('')}</ul></div>
<div class="box"><h4>${v(ui.terms_need)}</h4><p>${v(t.need)}</p></div></div></div>
<div class="grid">${services.filter(s => s.cat === c.id).map(s => `<div class="card"><div class="pic">${illustration(s, c.id)}</div><div class="body"><span class="code">${s.code}</span>
<a class="nm" href="${SITE}/services/${s.slug}/">${v(s.name)}</a><span class="from">${v(ui.from)}</span><span class="pr">${P(s.idr)}</span>
<div class="row"><span>${daysFor(s.idr)} ${v(ui.svc_days)}</span><a href="${SITE}/terms/${s.slug}/">${v(ui.book_link)} →</a></div><a class="wa" href="${waOrder(s)}">${WA_ICON}${v(ui.wa_order)}</a></div></div>`).join('')}</div></section>`; }).join('')}
<section class="back"><div class="top"><span class="mark">${darkLogo}<b>${BRAND}</b></span></div>
<div><h2>${v(ui.book_how)}</h2><ol>${[[ui.how1_t, ui.how1_d], [ui.how2_t, ui.how2_d], [ui.how3_t, ui.how3_d], [ui.how4_t, ui.how4_d]].map(([a, b], i) => `<li><span>0${i + 1}</span><div><b>${v(a)}</b><p>${v(b)}</p></div></li>`).join('')}</ol></div>
<div class="cta"><p>${v(ui.book_contact)}</p><a href="${SITE}">${SITE.replace('https://', '')}</a><a class="wa-back" href="${wa([raw(ui.wa_m_catalog), ''], 'pdf-catalog/back-cover')}">${WA_ICON}WhatsApp +62 895-3651-73030</a><small>${v(ui.book_note)}</small></div></section>
</body></html>`;
}

const todo = langs.filter(l => !only.length || only.includes(l.code));
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
let i = 0; const started = Date.now(); let bytes = 0;
const worker = async () => {
  let page = await browser.newPage();
  while (i < todo.length) {
    const l = todo[i++];
    // A big book can take a while to lay out; one retry on a fresh page covers a stuck renderer.
    try { await page.setContent(book(l), { waitUntil: 'load', timeout: 240000 }); }
    catch { await page.close().catch(() => {}); page = await browser.newPage(); await page.setContent(book(l), { waitUntil: 'load', timeout: 240000 }); }
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ timeout: 240000, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, tagged: false, outline: false });
    fs.writeFileSync(path.join(OUT, `${l.code}.pdf`), pdf); bytes += pdf.length;
    if (i % 20 === 0) console.log(i, 'of', todo.length, ((Date.now() - started) / 1000).toFixed(0) + 's');
  }
  await page.close();
};
await Promise.all(Array.from({ length: 3 }, worker));
await browser.close();
console.log('books', todo.length, 'MB', (bytes / 1e6).toFixed(1));
