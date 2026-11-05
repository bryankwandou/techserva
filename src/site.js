import { priceIn, formatPrice } from '/assets/pricing.mjs';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const state = { lang: 'en', langs: [], rates: {}, shard: null, currency: 'USD' };
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
export const tr = (k, fallback) => (state.shard && state.shard[k]) || fallback;
export const money = idr => formatPrice(priceIn(idr, state.currency, state.rates), state.lang.startsWith('pa-') ? 'pa' : state.lang);

/* theme */
function setTheme(t) {
  root.dataset.theme = t;
  store.set('theme', t);
  dispatchEvent(new CustomEvent('themechange', { detail: t }));
}
$('#theme')?.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
$('#menu')?.addEventListener('click', () => $('nav.main').classList.toggle('open'));

/* language */
const pageLang = root.dataset.pageLang;
function applyPrices() {
  $$('[data-idr]').forEach(el => { el.textContent = money(+el.dataset.idr); });
  dispatchEvent(new Event('pricechange'));
}
function applyShard() {
  if (!state.shard) return;
  $$('[data-k]').forEach(el => { const v = state.shard[+el.dataset.k]; if (v) el.textContent = v; });
  $$('[data-kp]').forEach(el => { const v = state.shard[+el.dataset.kp]; if (v) el.placeholder = v; });
  $$('[data-ka]').forEach(el => { const v = state.shard[+el.dataset.ka]; if (v) el.setAttribute('aria-label', v); });
}
async function setLang(code, { persist = true, navigate = true } = {}) {
  const l = state.langs.find(x => x.code === code) || { code: 'en', currency: 'USD' };
  if (persist) store.set('lang', l.code);
  if (navigate && root.dataset.home === '1') {
    location.href = l.code === 'en' ? '/' : `/l/${l.code}/`;
    return;
  }
  if (l.code === 'en' && state.lang !== 'en') { location.reload(); return; }
  state.lang = l.code; state.currency = l.currency;
  root.lang = l.code === 'iw' ? 'he' : l.code; root.dir = l.rtl ? 'rtl' : 'ltr';
  $$('[data-lang-now]').forEach(el => { el.textContent = l.native || l.name || 'English'; });
  if (l.code !== 'en') {
    const r = await fetch(`/i18n/${l.code}.json`);
    state.shard = r.ok ? await r.json() : null;
    applyShard();
    const n = $('#mt-note'); if (n) n.hidden = false;
  }
  applyPrices();
  dispatchEvent(new Event('langchange'));
}
function buildPicker() {
  const dlg = $('#langs'); const list = $('#langs-list'); const q = $('#langs-q');
  if (!dlg) return;
  const draw = () => {
    const v = q.value.trim().toLowerCase();
    list.replaceChildren(...state.langs.filter(l => !v || `${l.native} ${l.name} ${l.code}`.toLowerCase().includes(v)).map(l => {
      const li = document.createElement('li'); const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-current', String(l.code === state.lang)); b.dataset.code = l.code;
      const a = document.createElement('span'); a.textContent = l.native; a.dir = 'auto';
      const c = document.createElement('small'); c.textContent = `${l.name} · ${l.currency}`;
      b.append(a, c); b.onclick = () => { dlg.close(); setLang(l.code); };
      li.append(b); return li;
    }));
  };
  $('#lang')?.addEventListener('click', () => { draw(); dlg.showModal(); q.focus(); });
  q.addEventListener('input', draw);
  $('#langs-close')?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
}

/* live service search on the home page and the filter on /services */
let services = [];
async function loadServices() {
  if (!services.length) services = await (await fetch('/assets/services.json')).json();
  return services;
}
function nameOf(s) { return tr(s.k, s.name); }
function initSearch() {
  const input = $('#home-search'); const box = $('#home-results');
  if (!input) return;
  const close = () => { box.hidden = true; };
  input.addEventListener('input', async () => {
    const v = input.value.trim().toLowerCase();
    if (v.length < 2) return close();
    await loadServices();
    const parts = v.split(/\s+/);
    const hits = services.filter(s => { const h = `${s.name} ${nameOf(s)}`.toLowerCase(); return parts.every(p => h.includes(p)); }).slice(0, 7);
    box.hidden = false;
    if (!hits.length) {
      const p = document.createElement('p'); p.textContent = input.dataset.none || ''; box.replaceChildren(p); return;
    }
    box.replaceChildren(...hits.map(s => {
      const a = document.createElement('a'); a.href = `/services/${s.slug}/`;
      const n = document.createElement('span'); n.textContent = nameOf(s);
      const m = document.createElement('span'); m.textContent = money(s.idr); m.style.whiteSpace = 'nowrap';
      a.append(n, m); return a;
    }));
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search-box')) close(); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}
function initFilter() {
  const input = $('#svc-filter'); const select = $('#svc-cat');
  if (!input) return;
  const run = () => {
    const parts = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean); const cat = select.value;
    let shown = 0;
    $$('.svc-group').forEach(g => {
      let n = 0;
      $$('li', g).forEach(li => {
        const hit = (!cat || g.dataset.cat === cat) && parts.every(p => li.dataset.en.includes(p) || li.textContent.toLowerCase().includes(p));
        li.hidden = !hit; if (hit) n++;
      });
      g.hidden = n === 0; shown += n;
    });
    $('#svc-count').textContent = shown;
  };
  input.addEventListener('input', run); select.addEventListener('change', run);
  const fromHash = location.hash.slice(1);
  if (fromHash) { select.value = fromHash; run(); }
}

/* hero ticket follows the tile under the pointer */
function initTicket() {
  const t = $('#ticket'); const stage = $('#stage');
  if (!t) return;
  let current = 0;
  const show = async i => {
    await loadServices();
    const s = services[i]; if (!s) return; current = i;
    $('.t-code', t).textContent = s.code;
    $('.t-cat', t).textContent = tr(s.ck, s.cat);
    $('.t-name', t).textContent = nameOf(s);
    $('.t-amount', t).textContent = money(s.idr);
    const link = $('.t-link', t); link.href = `/services/${s.slug}/`;
  };
  addEventListener('tile', e => { stage.classList.toggle('has-hit', e.detail >= 0); if (e.detail >= 0) show(e.detail); });
  addEventListener('pricechange', () => show(current));
  stage.addEventListener('click', e => {
    if (e.target.closest('a,button') || !stage.classList.contains('has-hit')) return;
    location.href = $('.t-link', t).href;
  });
  let auto = 0; const order = [0, 26, 150, 225, 275, 325, 350, 375, 475];
  const tick = () => { if (!stage.classList.contains('has-hit')) show(order[auto++ % order.length]); };
  tick();
  if (!reduced) setInterval(tick, 3200);
}

/* order form */
function initOrder() {
  const f = $('#order'); if (!f) return;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button[type=submit]', f); btn.disabled = true;
    const data = Object.fromEntries(new FormData(f)); data.lang = state.lang;
    try {
      const r = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'failed');
      const ok = document.createElement('p'); ok.className = 'ok';
      ok.textContent = `${f.dataset.sent} ${j.reference}`; f.replaceChildren(ok);
    } catch {
      btn.disabled = false; $('#order-msg').textContent = f.dataset.fail; $('#order-msg').hidden = false;
    }
  });
}

/* catalog picker */
function initCatalog() {
  const sel = $('#book-lang'); if (!sel) return;
  sel.replaceChildren(...state.langs.map(l => { const o = document.createElement('option'); o.value = l.code; o.textContent = `${l.native} (${l.currency})`; return o; }));
  sel.value = state.lang;
  const link = $('#book-link'); const sync = () => { link.href = `/catalog/pdf/${sel.value}.pdf`; };
  sel.addEventListener('change', sync); sync();
}

async function boot() {
  const [langs, rates] = await Promise.all([fetch('/assets/langs.json').then(r => r.json()), fetch('/assets/rates.json').then(r => r.json())]);
  state.langs = langs; state.rates = rates;
  buildPicker();
  const saved = store.get('lang');
  const browser = (navigator.language || 'en').split('-')[0];
  const want = pageLang || saved || (langs.some(l => l.code === browser) && browser !== 'en' && !saved ? browser : 'en');
  await setLang(want, { persist: !!(pageLang || saved), navigate: false });
  initSearch(); initFilter(); initTicket(); initOrder(); initCatalog();
  import('/assets/chat.js').then(m => m.init(state, { tr, money }));
  if (!reduced) import('/assets/motion.js').then(m => m.init());
  const start = () => import('/assets/scene.js').then(m => m.init({ reduced })).catch(() => {});
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 }); else setTimeout(start, 400);
}
boot();
