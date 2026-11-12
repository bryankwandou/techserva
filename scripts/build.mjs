// Generates the whole static site into public/. Run: node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { BRAND, SITE, DOMAIN } from '../data/brand.mjs';
import { categories, services } from '../data/services.mjs';
import { ui, faq, general, catTerms, privacy } from '../data/copy.mjs';
import { languagePool } from '../data/languages.mjs';
import { countryLang } from '../data/countries.mjs';
import { sourceStrings } from './translate.mjs';
import { usdBase, daysFor } from '../lib/pricing.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public');
const nm = p => path.join(ROOT, 'node_modules', p);
const write = (p, c) => { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c); };
const copy = (from, to) => { const f = path.join(OUT, to); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.copyFileSync(from, f); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

for (const d of ['services', 'terms', 'l', 'i18n', 'catalog/index.html', 'privacy', 'assets', 'admin']) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });

const keys = sourceStrings();
const keyIndex = new Map(keys.map((k, i) => [k, i]));
const okCodes = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/langs-ok.json'), 'utf8')));
const trans = {};
const display = code => {
  try { return new Intl.DisplayNames([code === 'iw' ? 'he' : code], { type: 'language', fallback: 'none' }).of(code === 'iw' ? 'he' : code); } catch { return null; }
};
const langs = [{ code: 'en', name: 'English', native: 'English', currency: 'USD', rtl: false }];
for (const l of languagePool) {
  if (!okCodes.has(l.code) || l.code === 'en') continue;
  const f = path.join(ROOT, 'data/i18n', `${l.code}.json`);
  if (!fs.existsSync(f)) continue;
  const cache = JSON.parse(fs.readFileSync(f, 'utf8'));
  // Hand-written corrections win over the machine translation.
  const fixF = path.join(ROOT, 'data/i18n-fix', `${l.code}.json`);
  if (fs.existsSync(fixF)) Object.assign(cache, JSON.parse(fs.readFileSync(fixF, 'utf8')));
  const coverage = keys.filter(k => cache[k]).length / keys.length;
  if (coverage < 0.98) { console.log('skip, low coverage', l.code, coverage.toFixed(2)); continue; }
  trans[l.code] = cache;
  langs.push({ code: l.code, name: l.name, native: display(l.code) || l.name, currency: l.currency, rtl: l.rtl });
}
console.log('languages', langs.length, 'keys', keys.length);
export { langs };

/* assets */
for (const f of ['site.css', 'site.js', 'chat.js', 'motion.js', 'scene.js', 'rag.mjs', 'logo.svg', 'favicon.svg', 'admin.js', 'ad.js', 'ad.css']) copy(path.join(ROOT, 'src', f), `assets/${f}`);
copy(path.join(ROOT, 'lib/pricing.mjs'), 'assets/pricing.mjs');
copy(nm('three/build/three.module.min.js'), 'assets/vendor/three.module.min.js');
copy(nm('three/build/three.core.min.js'), 'assets/vendor/three.core.min.js');
copy(nm('gsap/dist/gsap.min.js'), 'assets/vendor/gsap.min.js');
copy(nm('gsap/dist/ScrollTrigger.min.js'), 'assets/vendor/ScrollTrigger.min.js');
copy(nm('lenis/dist/lenis.min.js'), 'assets/vendor/lenis.min.js');
copy(nm('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2'), 'assets/fonts/instrument-serif.woff2');
copy(nm('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2'), 'assets/fonts/instrument-serif-italic.woff2');
copy(nm('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2'), 'assets/fonts/geist.woff2');
for (const f of ['ad-bg-hero.jpg', 'ad-bg-end.jpg', 'ad.jpg', 'walkthrough.mp4', 'walkthrough.jpg', 'og.jpg']) { const p = path.join(ROOT, 'src/media', f); if (fs.existsSync(p)) copy(p, `assets/${f}`); }
// The sales video is a live page. Its voice files exist only for languages that have a recorded voice.
const voDir = path.join(ROOT, 'src/media/vo');
const voices = fs.existsSync(voDir) ? fs.readdirSync(voDir).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)) : [];
for (const c of voices) copy(path.join(voDir, `${c}.mp3`), `assets/vo/${c}.mp3`);
fs.rmSync(path.join(OUT, 'ad'), { recursive: true, force: true });
copy(path.join(ROOT, 'src/ad.html'), 'ad/index.html');
const hasTour = fs.existsSync(path.join(ROOT, 'src/media/walkthrough.mp4'));

const fx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fx.json'), 'utf8'));
const currencies = new Set(langs.map(l => l.currency));
const rates = Object.fromEntries([...currencies].filter(c => fx.rates[c]).map(c => [c, fx.rates[c]]));
write('assets/rates.json', JSON.stringify(rates));
write('assets/langs.json', JSON.stringify(langs));
const catById = Object.fromEntries(categories.map(c => [c.id, c]));
const K = s => { if (!keyIndex.has(s)) throw new Error('missing key: ' + s); return keyIndex.get(s); };
write('assets/services.json', JSON.stringify(services.map(s => ({ name: s.name, slug: s.slug, code: s.code, idr: s.idr, cat: catById[s.cat].name, k: K(s.name), ck: K(catById[s.cat].name) }))));
{
  const names = ['ad_q', 'ad_r1', 'ad_r2', 'ad_r3', 'ad_p1', 'ad_p2', 'ad_p3', 'ad_p4', 'ad_a', 'ad_count', 'ad_one', 'ad_inc', 'ad_s2', 'ad_s3', 'ad_s4', 'ad_f1', 'ad_f2', 'ad_f3', 'ad_t1', 'ad_t2', 'ad_t3', 'ad_end', 'ad_sound', 'ad_mute',
    'hero_title', 'hero_cta', 'cats_title', 'from', 'how_title', 'how1_t', 'how2_t', 'how3_t', 'how4_t'];
  const pickT = ['TS-001', 'TS-198', 'TS-169', 'TS-303'].map(code => services.find(s => s.code === code)).filter(Boolean);
  write('assets/ad-ui.json', JSON.stringify({
    host: DOMAIN, voices,
    t: Object.fromEntries(names.map(k => [k, [K(ui[k]), ui[k]]])),
    cats: categories.map(c => [K(c.name), c.name, Math.min(...services.filter(s => s.cat === c.id).map(s => s.idr))]),
    tickets: pickT.map(s => [s.code, K(catById[s.cat].name), catById[s.cat].name, K(s.name), s.name, s.idr]),
  }));
}
write('assets/chat-ui.json', JSON.stringify(Object.fromEntries(['chat_none', 'chat_starts', 'chat_sources', 'chat_try', 'chat_hello', 'nav_services', 'svc_terms'].map(k => [k, [K(ui[k]), ui[k]]]))));
const kb = [
  ...faq.map(([q, a]) => ({ type: 'faq', title: q, text: a, url: '/#faq', tk: K(q), xk: K(a) })),
  ...general.map(([q, a]) => ({ type: 'terms', title: q, text: a, url: '/terms/', tk: K(q), xk: K(a) })),
  ...services.map(s => { const c = catById[s.cat]; return { type: 'service', title: s.name, text: c.blurb, url: `/services/${s.slug}/`, slug: s.slug, idr: s.idr, cat: s.cat, tk: K(s.name), xk: K(c.blurb) }; }),
];
write('assets/kb.json', JSON.stringify(kb));
for (const l of langs) if (l.code !== 'en') write(`i18n/${l.code}.json`, JSON.stringify(keys.map(k => trans[l.code][k] || null)));

/* templating */
const usd = idr => `$${usdBase(idr).toLocaleString('en')}`;
const mkT = lang => {
  const dict = lang === 'en' ? null : trans[lang];
  const v = s => (dict && dict[s]) || s;
  const T = (s, tag = 'span', attrs = '') => `<${tag} data-k="${K(s)}"${attrs ? ' ' + attrs : ''}>${esc(v(s))}</${tag}>`;
  return { T, v };
};
const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg>';
const ICON_GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>';

function shell({ lang = 'en', title, desc, urlPath, body, home = false, attrs = '', head = '' }) {
  const { T, v } = mkT(lang);
  const meta = langs.find(l => l.code === lang);
  const htmlLang = lang === 'iw' ? 'he' : lang;
  return `<!doctype html>
<html lang="${htmlLang}" dir="${meta?.rtl ? 'rtl' : 'ltr'}" data-theme="dark" data-scene="${home ? 'home' : 'quiet'}"${home ? ' data-home="1"' : ''}${lang !== 'en' ? ` data-page-lang="${lang}"` : ''} ${attrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${urlPath}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${urlPath}"><meta property="og:image" content="${SITE}/assets/og.jpg"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#05070a">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
${head}
<script>(function(){try{var t=localStorage.getItem('theme');if(!t)t='dark';document.documentElement.dataset.theme=t}catch(e){}})()</script>
<link rel="preload" href="/assets/fonts/instrument-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<script type="module" src="/assets/site.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<canvas id="scene" aria-hidden="true"></canvas>
<header class="site"><div class="wrap">
<a class="brand" href="${lang === 'en' ? '/' : `/l/${lang}/`}"><img src="/assets/logo.svg" alt="" width="30" height="30">${BRAND}</a>
<nav class="main" aria-label="Main">
<a href="/services/">${T(ui.nav_services)}</a><a href="/#how">${T(ui.nav_how)}</a><a href="/terms/">${T(ui.nav_terms)}</a><a href="/catalog/">${T(ui.nav_catalog)}</a><a href="/#demo">${T(ui.nav_demo)}</a>
</nav>
<div class="head-tools" style="display:flex;gap:8px">
<button class="tool" id="lang" type="button" aria-haspopup="dialog" data-ka="${K(ui.lang_label)}" aria-label="${esc(v(ui.lang_label))}">${ICON_GLOBE}<span class="tool-label" data-lang-now>${esc(meta?.native || 'English')}</span></button>
<button class="tool" id="theme" type="button" data-ka="${K(ui.theme_toggle)}" aria-label="${esc(v(ui.theme_toggle))}">${ICON_SUN}</button>
<button class="tool menu-btn" id="menu" type="button" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
</div>
</div></header>
<main id="main">${body(T, v)}</main>
<footer class="site"><div class="wrap">
<div><a class="brand" href="/" style="text-decoration:none"><img src="/assets/logo.svg" alt="" width="26" height="26">${BRAND}</a><p class="note" style="margin-top:6px">${T(ui.footer_tag)}</p></div>
<nav aria-label="Footer"><a href="/services/">${T(ui.nav_services)}</a><a href="/terms/">${T(ui.nav_terms)}</a><a href="/catalog/">${T(ui.nav_catalog)}</a><a href="/privacy/">${T(ui.footer_privacy)}</a><a href="/admin/">${T(ui.footer_admin)}</a></nav>
<p class="note">&copy; 2026 ${BRAND}. ${T(ui.footer_rights)}</p>
</div></footer>
<button class="chat-open" id="chat-open" type="button">${T(ui.chat_open)}</button>
<aside class="chat" id="chat" data-lenis-prevent hidden aria-label="${esc(v(ui.chat_title))}">
<div class="chat-head">${T(ui.chat_title)}<button class="tool" id="chat-close" type="button">${T(ui.chat_close)}</button></div>
<div class="chat-log" id="chat-log" aria-live="polite"></div>
<div class="chips">${[ui.chip_1, ui.chip_2, ui.chip_3, ui.chip_4].map(c => `<button type="button" data-k="${K(c)}">${esc(v(c))}</button>`).join('')}</div>
<form id="chat-form"><input id="chat-input" autocomplete="off" maxlength="300" data-kp="${K(ui.chat_placeholder)}" placeholder="${esc(v(ui.chat_placeholder))}" aria-label="${esc(v(ui.chat_placeholder))}"><button type="submit">${T(ui.chat_send)}</button></form>
</aside>
<dialog class="langs" id="langs" data-lenis-prevent aria-label="${esc(v(ui.lang_label))}">
<div class="langs-head"><input class="field" id="langs-q" data-kp="${K(ui.lang_search)}" placeholder="${esc(v(ui.lang_search))}" aria-label="${esc(v(ui.lang_search))}"><button class="tool" id="langs-close" type="button">${T(ui.chat_close)}</button></div>
<ul class="langs-list" id="langs-list"></ul>
</dialog>
</body></html>`;
}

/* home */
const fromPrice = id => Math.min(...services.filter(s => s.cat === id).map(s => s.idr));
const P = idr => `<span class="price" data-idr="${idr}">${usd(idr)}</span>`;
function homeBody(lang) {
  return (T, v) => {
  const [t1, t2] = v(ui.hero_title).includes(',') ? [v(ui.hero_title).split(',')[0], v(ui.hero_title).split(',').slice(1).join(',')] : [v(ui.hero_title), ''];
  return `
<div class="hero" id="stage">
<div class="hero-copy" data-hero>
<p class="kicker" data-k="${K(ui.hero_kicker)}">${esc(v(ui.hero_kicker))}</p>
<h1>${esc(t1)}${t2 ? `, <em>${esc(t2.trim())}</em>` : ''}</h1>
<p class="lead" data-k="${K(ui.hero_lead)}">${esc(v(ui.hero_lead))}</p>
<div class="search-box"><input id="home-search" type="search" autocomplete="off" data-kp="${K(ui.search_placeholder)}" placeholder="${esc(v(ui.search_placeholder))}" aria-label="${esc(v(ui.search_placeholder))}" data-none="${esc(v(ui.search_none))}"><div class="search-results" id="home-results" data-lenis-prevent hidden></div></div>
<div class="actions"><a class="btn primary" href="/services/">${T(ui.hero_cta)}</a><button class="btn" type="button" data-open-chat>${T(ui.hero_cta2)}</button></div>
<a class="down" href="#cats" aria-label="${esc(v(ui.cats_title))}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg></a>
</div>
<article class="ticket" id="ticket" aria-live="off">
<div class="code"><span class="t-code">${services[0].code}</span><span class="t-cat">${esc(v(categories[0].name))}</span></div>
<h3 class="t-name">${esc(v(services[0].name))}</h3>
<div class="row"><span>${T(ui.from)} <b class="t-amount amount">${usd(services[0].idr)}</b></span><a class="t-link" href="/services/${services[0].slug}/">${T(ui.view)}</a></div>
</article>
</div>
</div>
<div class="facts"><div><b>500</b>${T(ui.fact_services)}</div><div><b>20</b>${T(ui.fact_categories)}</div><div><b>${langs.length}</b>${T(ui.fact_languages)}</div><div><b>${new Set(langs.map(l => l.currency)).size}</b>${T(ui.fact_currency)}</div></div>

<section class="block" id="cats"><div class="wrap">
<div class="block-head"><h2 data-rise>${T(ui.cats_title)}</h2><p class="lead" data-rise>${T(ui.cats_lead)}</p></div>
<ul class="cat-list">${categories.map((c, i) => `<li data-rise><a href="/services/#${c.id}"><span class="no">${String(i + 1).padStart(2, '0')}</span><span class="nm">${T(c.name)}</span><span class="bl">${T(c.blurb)}</span><span class="pr">${T(ui.from)} ${P(fromPrice(c.id))}</span></a></li>`).join('')}</ul>
</div></section>

<section class="block" id="how"><div class="wrap">
<div class="block-head"><h2 data-rise>${T(ui.how_title)}</h2><p class="lead" data-rise>${T(ui.how_lead)}</p></div>
<div class="steps"><svg class="line" viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden="true"><path d="M0 6H1000"/></svg>
${[[ui.how1_t, ui.how1_d], [ui.how2_t, ui.how2_d], [ui.how3_t, ui.how3_d], [ui.how4_t, ui.how4_d]].map(([a, b], i) => `<div class="step" data-rise><span class="no">0${i + 1}</span>${T(a, 'h3')}${T(b, 'p')}</div>`).join('')}
</div></div></section>

<section class="block" id="rules"><div class="wrap">
<h2 data-rise style="margin-bottom:36px">${T(ui.rules_title)}</h2>
<div class="rules" data-rise>
<div>${T(ui.rule1_t, 'h3')}${T(ui.rule1_d, 'p')}</div>
<div>${T(ui.rule2_t, 'h3')}${T(ui.rule2_d, 'p')}</div>
<div>${T(ui.rule3_t, 'h3')}${T(ui.rule3_d, 'p')}</div>
</div>
<p class="lead" data-rise style="margin-top:28px"><b>${T(ui.pay_title)}.</b> ${T(ui.pay_lead)}</p>
</div></section>

<section class="block solid" id="demo"><div class="wrap two">
<div><h2 data-rise>${T(ui.demo_title)}</h2><p class="lead" data-rise style="margin-top:14px">${T(ui.demo_lead)}</p></div>
<div class="video-frame" data-rise><iframe src="/ad/${lang === 'en' ? '' : `?l=${lang}`}" title="${esc(v(ui.demo_title))}" loading="lazy" allow="autoplay"></iframe></div>
</div></section>

<section class="block" id="book"><div class="wrap book">
<div class="book-cover" data-rise aria-hidden="true"><b>${BRAND}</b><span>500 / ${langs.length}</span></div>
<div><h2 data-rise>${T(ui.catalog_title)}</h2><p class="lead" data-rise style="margin-top:14px">${T(ui.catalog_lead)}</p>
<div class="pick" data-rise><select id="book-lang" aria-label="${esc(v(ui.lang_label))}"></select><a class="btn primary" id="book-link" href="/catalog/pdf/${lang}.pdf">${T(ui.download_pdf)}</a><a class="btn" href="/catalog/">${T(ui.catalog_all)}</a></div>
<p class="note" style="margin-top:14px">${T(ui.price_note)}</p></div>
</div></section>

<section class="block" id="faq"><div class="wrap two" style="align-items:start">
<h2 data-rise>${T(ui.faq_title)}</h2>
<div class="faq">${faq.map(([q, a]) => `<details data-rise><summary>${T(q)}</summary>${T(a, 'p')}</details>`).join('')}</div>
</div></section>
<div id="end"></div>
${lang === 'en' ? '' : `<div class="wrap"><p class="mt" id="mt-note">${T(ui.mt_note)}</p></div>`}`;
  };
}
const hreflangs = langs.map(l => `<link rel="alternate" hreflang="${l.code === 'iw' ? 'he' : l.code}" href="${SITE}${l.code === 'en' ? '/' : `/l/${l.code}/`}">`).join('');
for (const l of langs) {
  const { v } = mkT(l.code);
  const p = l.code === 'en' ? 'index.html' : `l/${l.code}/index.html`;
  write(p, shell({ lang: l.code, title: `${BRAND}: ${v(ui.hero_title)}`, desc: v(ui.hero_lead), urlPath: l.code === 'en' ? '/' : `/l/${l.code}/`, home: true, body: homeBody(l.code), head: hreflangs }));
}

/* services index */
write('services/index.html', shell({
  title: `All 500 IT services and starting prices | ${BRAND}`, desc: 'Every service with a starting price, written scope and its own terms.', urlPath: '/services/',
  body: T => `<div class="page"><div class="wrap">
${T(ui.hero_cta, 'h1')}
<p class="lead">${T(ui.hero_lead)}</p>
<div class="toolbar"><input class="field" id="svc-filter" type="search" data-kp="${K(ui.search_placeholder)}" placeholder="${esc(ui.search_placeholder)}" aria-label="${esc(ui.search_placeholder)}">
<select class="field" id="svc-cat" aria-label="${esc(ui.all_categories)}" style="flex:0 1 320px"><option value="" data-k="${K(ui.all_categories)}">${esc(ui.all_categories)}</option>${categories.map(c => `<option value="${c.id}" data-k="${K(c.name)}">${esc(c.name)}</option>`).join('')}</select></div>
<p class="note"><b id="svc-count">500</b> ${T(ui.search_results)}</p>
${categories.map(c => `<section class="svc-group" data-cat="${c.id}" id="${c.id}">${T(c.name, 'h2')}<p class="note" style="margin-bottom:12px">${T(c.blurb)}</p>
<ul class="svc-list">${services.filter(s => s.cat === c.id).map(s => `<li data-en="${esc(s.name.toLowerCase())}"><a href="/services/${s.slug}/"><span class="code">${s.code}</span>${T(s.name)}${P(s.idr)}</a></li>`).join('')}</ul></section>`).join('')}
<p class="mt" id="mt-note" hidden>${T(ui.mt_note)}</p>
</div></div>`,
}));

/* service and terms pages */
for (const s of services) {
  const c = catById[s.cat]; const t = catTerms[s.cat]; const days = daysFor(s.idr);
  const related = services.filter(x => x.cat === s.cat && x.slug !== s.slug).slice(0, 6);
  const catIndex = categories.findIndex(x => x.id === s.cat);
  write(`services/${s.slug}/index.html`, shell({
    title: `${s.name}, from ${usd(s.idr)} | ${BRAND}`, desc: `${s.name}. ${c.blurb} Written scope, starting price and its own terms.`, urlPath: `/services/${s.slug}/`, attrs: `data-highlight="${s.n - 1}" data-highlight-cat="${catIndex}"`,
    body: T => `<div class="page"><div class="wrap">
<a class="crumb" href="/services/#${c.id}">${s.code} / ${T(c.name)}</a>
${T(s.name, 'h1')}
<p class="lead">${T(c.blurb)}</p>
<div class="svc-layout">
<div>
${T(ui.svc_scope, 'h2')}
<ul class="scope">${t.scope.map(x => `<li>${T(x)}</li>`).join('')}</ul>
<h2 style="margin-top:44px">${T(ui.how_title)}</h2>
<ul class="scope"><li>${T(ui.how2_t)}</li><li>${T(ui.how3_t)}</li><li>${T(ui.how4_t)}</li></ul>
<h2 style="margin-top:44px">${T(ui.svc_related)}</h2>
<ul class="svc-list" style="margin-top:14px">${related.map(x => `<li><a href="/services/${x.slug}/"><span class="code">${x.code}</span>${T(x.name)}${P(x.idr)}</a></li>`).join('')}</ul>
<p class="mt" id="mt-note" hidden>${T(ui.mt_note)}</p>
</div>
<aside class="aside-card">
<span class="note">${T(ui.from)}</span>
<p class="big">${P(s.idr)}</p>
<p class="note">${T(ui.svc_price_note)}</p>
<p class="note" style="margin-top:10px">${T(ui.svc_timeline)}: <b>${days}</b> ${T(ui.svc_days)}</p>
<a class="btn" href="/terms/${s.slug}/">${T(ui.svc_terms)}</a>
<form class="form" id="order" data-sent="${esc(ui.order_sent)}" data-fail="${esc(ui.order_fail)}">
${T(ui.order_title, 'h3')}
<input type="hidden" name="service" value="${s.code}">
<label>${T(ui.order_name)}<input class="field" name="name" required maxlength="120" autocomplete="name"></label>
<label>${T(ui.order_contact)}<input class="field" name="contact" required maxlength="160"></label>
<label>${T(ui.order_brief)}<textarea class="field" name="brief" required maxlength="3000"></textarea></label>
<label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
<label class="check"><input type="checkbox" name="agree" required> ${T(ui.order_agree)}</label>
<button class="btn primary" type="submit">${T(ui.order_send)}</button>
<p id="order-msg" class="note" role="alert" hidden></p>
</form>
</aside>
</div></div></div>`,
  }));
  write(`terms/${s.slug}/index.html`, shell({
    title: `Terms: ${s.name} | ${BRAND}`, desc: `Terms for ${s.name}, covering scope, payment, revisions and what is not included.`, urlPath: `/terms/${s.slug}/`, attrs: `data-highlight="${s.n - 1}"`,
    body: T => `<div class="page"><div class="wrap legal">
<a class="crumb" href="/services/${s.slug}/">${s.code} / ${T(ui.terms_back)}</a>
<h1 style="font-size:clamp(2.2rem,5vw,3.6rem);margin-bottom:12px">${T(ui.terms_for)} ${T(s.name)}</h1>
<p class="note">Service code ${s.code}. Effective 5 November 2026.</p>
<p class="mt" id="mt-note" hidden>${T(ui.mt_note)}</p>
${T(ui.terms_specific, 'h2')}
${T(ui.terms_deliverable, 'h3')}<p>${T(s.name)}: ${t.scope.map(x => T(x)).join('; ')}.</p>
${T(ui.terms_price, 'h3')}<p>${P(s.idr)}. ${T(ui.svc_price_note)}</p>
${T(ui.terms_time, 'h3')}<p>${days} ${T(ui.svc_days)}</p>
${T(ui.terms_need, 'h3')}${T(t.need, 'p')}
${T(ui.terms_out, 'h3')}${T(t.out, 'p')}
${T(ui.terms_rule, 'h3')}${T(t.rule, 'p')}
${T(ui.terms_general, 'h2')}
${general.map(([h, b], i) => `<h3>${i + 1}. ${T(h)}</h3>${T(b, 'p')}`).join('')}
</div></div>`,
  }));
}

/* general terms index */
write('terms/index.html', shell({
  title: `Terms of service | ${BRAND}`, desc: 'General terms and a separate terms page for each of the 500 services.', urlPath: '/terms/',
  body: T => `<div class="page"><div class="wrap legal">
${T(ui.terms_title, 'h1')}
<p class="note">Effective 5 November 2026.</p>
<p class="mt" id="mt-note" hidden>${T(ui.mt_note)}</p>
${general.map(([h, b], i) => `<h3>${i + 1}. ${T(h)}</h3>${T(b, 'p')}`).join('')}
${T(ui.terms_specific, 'h2')}
${categories.map(c => `<h3>${T(c.name)}</h3><p>${services.filter(s => s.cat === c.id).map(s => `<a href="/terms/${s.slug}/">${T(s.name)}</a>`).join(' · ')}</p>`).join('')}
</div></div>`,
}));

/* privacy */
write('privacy/index.html', shell({
  title: `Privacy | ${BRAND}`, desc: 'What this site collects and why.', urlPath: '/privacy/',
  body: T => `<div class="page"><div class="wrap legal">${T(ui.footer_privacy, 'h1')}<p class="mt" id="mt-note" hidden>${T(ui.mt_note)}</p>${privacy.map(([h, b]) => `<h3>${T(h)}</h3>${T(b, 'p')}`).join('')}</div></div>`,
}));

/* catalog index */
write('catalog/index.html', shell({
  title: `PDF catalog in ${langs.length} languages | ${BRAND}`, desc: 'The full service catalog as a PDF book in each language, priced in local currency, with a link to each service\'s terms.', urlPath: '/catalog/',
  body: T => `<div class="page"><div class="wrap">
${T(ui.catalog_title, 'h1')}
<p class="lead">${T(ui.catalog_lead)}</p>
<p class="note" style="margin-top:12px">${T(ui.price_note)} ${esc(fx.time_last_update_utc.slice(5, 16))}</p>
<div class="lang-grid">${langs.map(l => `<a href="/catalog/pdf/${l.code}.pdf"><span dir="auto">${esc(l.native)}</span><small>${l.currency}</small></a>`).join('')}</div>
</div></div>`,
}));

/* admin */
write('admin/index.html', `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Admin | ${BRAND}</title>
<script>(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}})()</script>
<link rel="icon" href="/assets/favicon.svg"><link rel="stylesheet" href="/assets/site.css"></head>
<body><main class="wrap admin" id="app"></main><script type="module" src="/assets/admin.js"></script></body></html>`);

/* security headers. Hashes allow only the two known inline theme scripts. */
const hash = s => `'sha256-${crypto.createHash('sha256').update(s).digest('base64')}'`;
const inlineScripts = [...new Set([...fs.readFileSync(path.join(OUT, 'index.html'), 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g), ...fs.readFileSync(path.join(OUT, 'admin/index.html'), 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]))];
const csp = `default-src 'self'; script-src 'self' ${inlineScripts.map(hash).join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'`;
fs.writeFileSync(path.join(ROOT, 'vercel.json'), JSON.stringify({
  outputDirectory: 'public', buildCommand: null, framework: null, cleanUrls: false,
  headers: [
    { source: '/(.*)', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    ] },
    // Asset names carry no hash, so the browser must revalidate them or a visitor keeps the old CSS and JS after a deploy.
    { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
    { source: '/assets/(fonts|vendor)/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }] },
    { source: '/admin/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
  ],
}, null, 2));

/* language by IP. Vercel runs this before the page is served. A manual choice is kept only while the visitor stays in the same country,
   so a visitor who moves (or turns on a VPN) gets the language of the country their IP is in. */
const geo = Object.fromEntries(Object.entries(countryLang).filter(([, l]) => langs.some(x => x.code === l)));
console.log('countries mapped', Object.keys(geo).length, 'dropped', Object.entries(countryLang).filter(([c]) => !geo[c]).map(p => p.join(':')).join(' ') || 'none');
fs.writeFileSync(path.join(ROOT, 'middleware.js'), `// Generated by scripts/build.mjs from data/countries.mjs. Do not edit.
const MAP = ${JSON.stringify(geo)};
export const config = { matcher: ['/', '/services/:path*', '/terms/:path*', '/catalog', '/catalog/', '/privacy', '/privacy/', '/l/:path*'] };
export default function middleware(request) {
  const url = new URL(request.url);
  const cc = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
  const byIp = MAP[cc] || 'en';
  const headers = new Headers();
  const cookie = (request.headers.get('cookie') || '') + ';';
  if (cc && !cookie.includes('geo=' + cc + ';')) {
    headers.append('set-cookie', 'geo=' + cc + '; Path=/; Max-Age=86400; SameSite=Lax');
    headers.append('set-cookie', 'geolang=' + byIp + '; Path=/; Max-Age=86400; SameSite=Lax');
  }
  if (url.pathname === '/' && cc && !/bot|crawl|spider|slurp|preview|lighthouse/i.test(request.headers.get('user-agent') || '')) {
    const m = /(?:^|; )lang=([^.;]+)\.([A-Z]{2})/.exec(cookie);
    const want = m && m[2] === cc ? decodeURIComponent(m[1]) : byIp;
    if (want !== 'en' && /^[A-Za-z-]{2,12}$/.test(want)) {
      headers.set('location', '/l/' + want + '/'); headers.set('cache-control', 'private, no-store'); headers.set('vary', 'cookie');
      return new Response(null, { status: 307, headers });
    }
  }
  headers.set('x-middleware-next', '1');
  return new Response(null, { headers });
}
`);

/* seo */
const urls = ['/', '/services/', '/terms/', '/catalog/', '/privacy/', ...services.flatMap(s => [`/services/${s.slug}/`, `/terms/${s.slug}/`]), ...langs.filter(l => l.code !== 'en').map(l => `/l/${l.code}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${SITE}${u}</loc></url>`).join('')}</urlset>`);
write('robots.txt', `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`);
write('404.html', shell({ title: `Page not found | ${BRAND}`, desc: 'Page not found.', urlPath: '/404', body: T => `<div class="page"><div class="wrap"><h1>404</h1><p class="lead">This page does not exist.</p><p style="margin-top:18px"><a class="btn" href="/services/">${T(ui.nav_services)}</a></p></div></div>` }));

const size = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log('output MB', (size(OUT) / 1e6).toFixed(1), 'domain target', DOMAIN);
