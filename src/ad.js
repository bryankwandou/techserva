// The sales video, played live so every language gets its own on-screen text, its own voice and its own music.
// Text comes from the same translation shards as the site. The voice is a recorded file per language.
// The music is composed in the browser from the language code: scale by region, then key, tempo and melody by language.
import { priceIn, formatPrice } from '/assets/pricing.mjs';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const lang = new URLSearchParams(location.search).get('l') || 'en';
const json = u => fetch(u).then(r => (r.ok ? r.json() : null)).catch(() => null);
const [cfg, langs, rates, shard] = await Promise.all([json('/assets/ad-ui.json'), json('/assets/langs.json'), json('/assets/rates.json'), lang === 'en' ? null : json(`/i18n/${lang}.json`)]);
const meta = langs.find(l => l.code === lang) || langs[0];
const tr = (k, en) => (shard && shard[k]) || en;
const txt = name => tr(...cfg.t[name]);
const money = idr => formatPrice(priceIn(idr, meta.currency, rates), lang.startsWith('pa-') ? 'pa' : lang);
document.documentElement.lang = lang === 'iw' ? 'he' : lang;
document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr';

/* text */
$$('[data-t]').forEach(el => { el.textContent = txt(el.dataset.t); });
const words = (el, s) => s.split(/(\s+)/).forEach(p => { if (!p.trim()) el.append(p); else { const w = document.createElement('span'); w.className = 'w'; w.textContent = p; el.append(w); } });
{
  const title = txt('hero_title'), cut = title.search(/[,،、，]/), h = $('#h3');
  if (cut > 0) { words(h, title.slice(0, cut + 1) + ' '); const em = document.createElement('em'); words(em, title.slice(cut + 1).trim()); h.append(em); } else words(h, title);
  const h7 = $('#h7'), end = h7.textContent; h7.textContent = ''; words(h7, end);
}
$('#url').textContent = cfg.host;
$('#rows').innerHTML = '';
cfg.cats.forEach((c, i) => {
  const r = document.createElement('div'); r.className = 'row';
  const n = document.createElement('span'); n.className = 'n'; n.textContent = String(i + 1).padStart(2, '0');
  const t = document.createElement('span'); t.className = 't'; t.textContent = tr(c[0], c[1]);
  const p = document.createElement('span'); p.className = 'p'; const b = document.createElement('b'); b.textContent = money(c[2]); p.append(txt('from') + ' ', b);
  r.append(n, t, p); $('#rows').append(r);
});
const fit = (el, w, h, min) => { if (!el) return; el.style.fontSize = ''; let fs = parseFloat(getComputedStyle(el).fontSize); while ((el.scrollWidth > w + 1 || el.scrollHeight > h + 1) && fs > min) { fs *= .94; el.style.fontSize = fs + 'px'; } };
const TICKETS = cfg.tickets.map(t => [t[0], tr(t[1], t[2]), tr(t[3], t[4]), money(t[5])]);
let shown = -1;
const setT = i => { if (i === shown) return; shown = i; const t = TICKETS[i]; $('#tk-code').textContent = t[0]; $('#tk-cat').textContent = t[1]; $('#tk-name').textContent = t[2]; $('#tk-price').textContent = t[3]; fit($('#tk-name'), 346, 104, 26); };
const Q = [...txt('ad_q')];
await document.fonts.ready;
$('#typed').textContent = Q.join(''); { const a = $('.ask'); let fs = 40; while (a.scrollWidth > a.clientWidth && fs > 20) { fs -= 2; a.style.fontSize = fs + 'px'; } } $('#typed').textContent = '';
$$('#s2 h1 span').forEach(e => fit(e, 1112, 999, 54)); fit($('#s2 p'), 1112, 100, 20);
fit($('#h3'), 1112, 240, 56); fit($('#s3 p'), 1112, 150, 20);
fit($('#s4 .head h2'), 999, 56, 26); $$('.row .t').forEach(e => fit(e, e.clientWidth, 999, 26));
fit($('#s5 h2'), 1112, 84, 40); $$('.step h3').forEach(e => fit(e, 999, 90, 24)); $$('.step p').forEach(e => fit(e, 999, 132, 15));
$$('.fact span').forEach(e => fit(e, 999, 116, 17)); fit($('.terms'), 1112, 76, 16);
fit($('#h7'), 1112, 250, 56); fit($('#cta'), 1000, 999, 18);
setT(0);

/* timeline */
const { gsap } = window;
const D = 52, tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
const show = (id, a, b) => { tl.to(id, { autoAlpha: 1, duration: .35 }, a); if (b) tl.to(id, { autoAlpha: 0, duration: .35 }, b - .35); };
tl.to('#bar', { scaleX: 1, duration: D, ease: 'none' }, 0);
show('#s1', 0, 5.2);
const ty = { n: 0 };
tl.from('.ask', { y: 24, opacity: 0, duration: .5 }, .15);
tl.to(ty, { n: Q.length, duration: 1.3, ease: 'none', onUpdate: () => { $('#typed').textContent = Q.slice(0, Math.round(ty.n)).join(''); } }, .5);
tl.from('.reply', { x: meta.rtl ? -60 : 60, opacity: 0, duration: .5, stagger: .65 }, 2.1);
tl.to('.reply', { opacity: .35, duration: .4 }, 4.3);
show('#s2', 5.2, 11);
tl.from('#s2 h1 span', { y: 50, opacity: 0, duration: .6, stagger: 1.05 }, 5.5);
tl.from('#s2 p', { y: 16, opacity: 0, duration: .6 }, 8.9);
show('#s3', 11, 18);
tl.fromTo('#s3 .bg', { scale: 1.16 }, { scale: 1, duration: 7.4, ease: 'none' }, 10.8);
tl.from('#s3 .logo', { scale: .5, opacity: 0, duration: .6, ease: 'back.out(1.8)' }, 11.3);
tl.from('#s3 .w', { y: 60, opacity: 0, duration: .7, stagger: .09 }, 11.6);
tl.from('#s3 p', { y: 18, opacity: 0, duration: .7 }, 13.3);
show('#s4', 18, 29);
tl.from('#s4 .head', { y: 20, opacity: 0, duration: .5 }, 18.2);
tl.from('.row', { opacity: 0, x: -24, duration: .45, stagger: .05 }, 18.5);
tl.to('#rows', { y: -(cfg.cats.length * 76 - 440), duration: 8.6, ease: 'sine.inOut' }, 19.8);
tl.from('#s4 aside', { x: 60, opacity: 0, duration: .6 }, 18.8);
const flipAt = i => 18.8 + i * 2.5;
TICKETS.forEach((t, i) => { if (!i) return;
  tl.to('.ticket', { rotateX: 90, opacity: 0, duration: .22, ease: 'power2.in' }, flipAt(i))
    .fromTo('.ticket', { rotateX: -90, opacity: 0 }, { rotateX: 0, opacity: 1, duration: .32, immediateRender: false }, flipAt(i) + .23); });
show('#s5', 29, 39);
tl.from('#s5 h2', { y: 26, opacity: 0, duration: .6 }, 29.2);
tl.fromTo('.rail', { scaleX: 0 }, { scaleX: 1, duration: 7, ease: 'none' }, 29.9);
tl.from('.step', { y: 30, opacity: 0, duration: .6, stagger: 1.9 }, 30.1);
show('#s6', 39, 45.5);
tl.from('.fact', { y: 30, opacity: 0, duration: .6, stagger: .25 }, 39.2);
$$('.fact b').forEach((b, i) => { const o = { v: 0 }, end = +b.dataset.count; tl.to(o, { v: end, duration: 1.3, ease: 'power2.out', onUpdate: () => { b.textContent = Math.round(o.v) + (o.v >= end - .5 ? (b.dataset.suffix || '') : ''); } }, 39.3 + i * .25); });
tl.from('.terms span', { y: 14, opacity: 0, duration: .5, stagger: .3 }, 41.6);
show('#s7', 45.5);
tl.fromTo('#s7 .bg', { scale: 1 }, { scale: 1.14, duration: 6.8, ease: 'none' }, 45.3);
tl.from('#s7 .w', { y: 60, opacity: 0, duration: .7, stagger: .09 }, 45.8);
tl.from('#cta', { y: 20, opacity: 0, duration: .6 }, 47);
tl.fromTo('#cur', { x: 980, y: 640, opacity: 0 }, { x: 700, y: 500, opacity: 1, duration: 1, ease: 'power2.inOut' }, 47.7);
tl.to('#cta', { scale: .95, duration: .12, ease: 'power2.in' }, 48.8).to('#cta', { scale: 1, backgroundColor: '#f1eee3', duration: .3 }, 48.92);
tl.from('.url', { y: 12, opacity: 0, duration: .5 }, 49.3);
tl.to('#cur', { opacity: 0, duration: .3 }, 49.6);
tl.to({}, { duration: .01 }, D);
const seek = t => { tl.time(t, false); let k = 0; TICKETS.forEach((_, i) => { if (i && t >= flipAt(i) + .22) k = i; }); setT(k); };

/* music */
const FAMILY = {
  east: ['zh-CN zh-TW yue ja ko vi th lo km my mn bo dz shn kac hmn', [0, 2, 4, 7, 9]],
  nusa: ['id jw su ms ban ace bbc btx bts bew min mad mak tl ceb ilo hil war pam pag bik iba tet', [0, 1, 3, 7, 8]],
  south: ['hi bn ta te ml kn gu mr pa pa-Arab ne si as or ur sd bho mai doi gom mwr awa sa new sat tcy mni-Mtei lus dv', [0, 2, 4, 5, 7, 9, 10]],
  mideast: ['ar fa iw tr ku ckb ps az uz kk ky tk tg ug hy ka crh tt ba yi', [0, 1, 4, 5, 7, 8, 10]],
  africa: ['sw ha yo ig zu xh am so rw rn ny sn st tn ts ti om lg ln mg bm ee ak wo ff nso nr ss ve tum bem luo ach alz cgg din dyu fon gaa kg kr ktu ndc-ZW nus sg sus tiv aa kri', [0, 3, 5, 7, 10]],
  latin: ['es pt ca gl qu ay gn ht pap yua mam zap jam', [0, 2, 4, 5, 7, 9, 11]],
  slavic: ['ru uk be pl cs sk bg sr hr bs sl mk ro hu szl rom', [0, 2, 3, 5, 7, 8, 11]],
  north: ['sv no da fi is fo et lv lt ltg kl ga gd cy br', [0, 2, 3, 5, 7, 9, 10]],
};
const family = Object.values(FAMILY).find(f => f[0].split(' ').includes(lang));
const scale = family ? family[1] : [0, 2, 4, 6, 7, 9, 11];
let seed = 2166136261; for (const c of lang) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619);
const rng = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rng() * a.length)];
const song = (() => {
  const n = scale.length, root = 45 + Math.floor(rng() * 10), beat = 60 / (84 + Math.floor(rng() * 25));
  const prog = n === 5 ? pick([[0, 3, 2, 4], [0, 2, 3, 1], [0, 4, 3, 2]]) : pick([[0, 5, 3, 4], [0, 3, 5, 4], [0, 4, 5, 3], [5, 3, 0, 4]]);
  const arp = Array.from({ length: 8 }, () => Math.floor(rng() * 4));
  const motif = Array.from({ length: 8 }, () => (rng() < .3 ? null : Math.floor(rng() * (n + 2))));
  const hz = (deg, oct = 0) => 440 * 2 ** ((root + 12 * (Math.floor(deg / n) + oct) + scale[((deg % n) + n) % n] - 69) / 12);
  const ev = [];   // [time, kind, freq, duration, gain]
  ev.push([0, 'pad', hz(0, -1), 11.4, .09], [0, 'pad', hz(n === 5 ? 3 : 4, -1), 11.4, .05]);
  for (let t = .5, i = 0; t < 10.8; t += beat, i++) { ev.push([t, 'pluck', hz(0, 2), .2, .035]); if (t > 5.2) ev.push([t + beat / 2, 'pluck', hz(n === 5 ? 3 : 4, 1), .15, .028]); }
  const bar = beat * 4;
  for (let t = 11, b = 0; t < 45.4; t += bar, b++) {
    const d = prog[b % 4], tones = [d, d + 2, d + 4, d + n];
    const len = Math.min(bar, 45.6 - t);
    tones.slice(0, 3).forEach(x => ev.push([t, 'pad', hz(x), len, .05]));
    ev.push([t, 'bass', hz(d, -2), beat * 1.6, .2]); if (len > beat * 2) ev.push([t + beat * 2, 'bass', hz(d, -2), beat * 1.6, .16]);
    for (let k = 0; k < 8 && k * beat / 2 < len; k++) {
      const at = t + k * beat / 2;
      ev.push([at, 'pluck', hz(tones[arp[k]], 1), .3, .06]);
      if (at >= 18 && k % 2 === 0) ev.push([at, 'kick', 0, .14, .26]);
      if (at >= 29 && k % 2 === 1) ev.push([at, 'hat', 0, .05, .03]);
      if (at >= 18 && k % 2 === 0 && motif[(b * 4 + k / 2) % 8] !== null) ev.push([at, 'lead', hz(d + motif[(b * 4 + k / 2) % 8], 1), beat * .9, .055]);
    }
  }
  [0, 2, 4].forEach(x => ev.push([45.5, 'pad', hz(x), 6.2, .06])); ev.push([45.5, 'bass', hz(0, -2), 5, .2]);
  for (let k = 0; k < 2 * n + 1; k++) ev.push([45.8 + k * .22, 'pluck', hz(k, 1), .5, .06]);
  ev.push([49.3, 'lead', hz(0, 2), 2.4, .06]);
  return ev;
})();
let ctx = null, bus = null, noise = null;
function schedule(from, base, voiced) {
  if (bus) bus.disconnect();
  bus = ctx.createGain(); bus.gain.value = voiced ? .42 : .7;
  const end = base + D; bus.gain.setValueAtTime(bus.gain.value, Math.max(ctx.currentTime, end - 1.4)); bus.gain.linearRampToValueAtTime(0, end);
  const comp = ctx.createDynamicsCompressor(); bus.connect(comp).connect(ctx.destination);
  for (const [at, kind, f, dur, g] of song) {
    if (at < from - .01) { if (kind !== 'pad' || at + dur < from + 1) continue; }
    const t = Math.max(base + at, ctx.currentTime + .01), stop = base + at + dur, env = ctx.createGain(); env.connect(bus);
    if (stop <= t) continue;
    if (kind === 'hat') {
      const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(); s.buffer = noise; hp.type = 'highpass'; hp.frequency.value = 7000;
      env.gain.setValueAtTime(g, t); env.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(hp).connect(env); s.start(t); s.stop(t + dur + .02); continue;
    }
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    if (kind === 'kick') { o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); lp.frequency.value = 400; env.gain.setValueAtTime(g, t); env.gain.exponentialRampToValueAtTime(.0001, t + dur); }
    else if (kind === 'pad') { o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (f % 7) - 3; lp.frequency.value = 900; env.gain.setValueAtTime(.0001, t); env.gain.linearRampToValueAtTime(g, t + Math.min(.5, dur / 3)); env.gain.setValueAtTime(g, Math.max(t + .5, stop - .5)); env.gain.linearRampToValueAtTime(.0001, stop + .3); }
    else if (kind === 'bass') { o.type = 'sine'; o.frequency.value = f; lp.frequency.value = 500; env.gain.setValueAtTime(.0001, t); env.gain.linearRampToValueAtTime(g, t + .02); env.gain.exponentialRampToValueAtTime(.0001, stop); }
    else { o.type = kind === 'lead' ? 'sine' : 'triangle'; o.frequency.value = f; lp.frequency.value = kind === 'lead' ? 2600 : 3200; env.gain.setValueAtTime(.0001, t); env.gain.linearRampToValueAtTime(g, t + (kind === 'lead' ? .04 : .006)); env.gain.exponentialRampToValueAtTime(.0001, stop); }
    o.connect(lp).connect(env); o.start(t); o.stop(stop + .35);
  }
}

/* transport */
const hasVoice = cfg.voices.includes(lang);
let voice = null, sound = false, pausedAt = null, pBase = performance.now() / 1000, cBase = 0;
const now = () => (pausedAt !== null ? pausedAt : sound ? ctx.currentTime - cBase : performance.now() / 1000 - pBase);
function start(from) {
  pausedAt = null; pBase = performance.now() / 1000 - from;
  if (!sound) return;
  cBase = ctx.currentTime + .06 - from; schedule(from, cBase, !!voice);
  if (voice) { voice.currentTime = from; voice.play().catch(() => {}); }
}
function quiet() { if (bus) { bus.disconnect(); bus = null; } if (voice) voice.pause(); }
function pause() { const t = now(); quiet(); pausedAt = t; document.body.classList.add('paused'); }
$('#stage').addEventListener('click', () => { if (pausedAt === null) pause(); else { document.body.classList.remove('paused'); start(pausedAt); } });
const snd = $('#snd');
snd.setAttribute('aria-label', txt('ad_sound'));
snd.addEventListener('click', () => {
  const t = now();
  if (sound) { quiet(); sound = false; snd.classList.remove('on'); snd.setAttribute('aria-label', txt('ad_sound')); if (pausedAt === null) start(t); return; }
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (hasVoice) { voice = new Audio(`/assets/vo/${lang}.mp3`); voice.preload = 'auto'; }
  }
  ctx.resume(); sound = true; snd.classList.add('on'); snd.setAttribute('aria-label', txt('ad_mute'));
  document.body.classList.remove('paused'); start(0);
});
const size = () => { const s = Math.min(innerWidth / 1280, innerHeight / 720); $('#stage').style.transform = `translate(${(innerWidth - 1280 * s) / 2}px, ${(innerHeight - 720 * s) / 2}px) scale(${s})`; };
addEventListener('resize', size); size();
window.DURATION = D; window.seek = t => { pausedAt = t; seek(t); };
(function frame() { let t = now(); if (t >= D) { start(0); t = 0; } seek(Math.max(0, t)); requestAnimationFrame(frame); })();
