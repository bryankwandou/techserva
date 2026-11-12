// Machine translates all source copy into every language, with a per-language cache.
// Usage: node scripts/translate.mjs [--probe]
import fs from 'node:fs';
import path from 'node:path';
import { languagePool } from '../data/languages.mjs';
import { categories, services } from '../data/services.mjs';
import { ui, faq, general, catTerms, privacy } from '../data/copy.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'data', 'i18n');
fs.mkdirSync(CACHE, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function sourceStrings() {
  const s = new Set();
  Object.values(ui).forEach(v => s.add(v));
  faq.flat().forEach(v => s.add(v));
  general.flat().forEach(v => s.add(v));
  privacy.flat().forEach(v => s.add(v));
  categories.forEach(c => { s.add(c.name); s.add(c.blurb); });
  Object.values(catTerms).forEach(t => { s.add(t.need); s.add(t.out); s.add(t.rule); t.scope.forEach(x => s.add(x)); });
  services.forEach(x => s.add(x.name));
  return [...s];
}

// English slang that machine translation reads literally. The translator gets a clearer wording.
const CLEARER = [
  [/\bRoasts\b/g, 'Critiques'], [/\broasts\b/g, 'critiques'], [/\bRoast\b/g, 'Critique'], [/\broast\b/g, 'critique'],
  [/\bpen test\b/gi, 'penetration test'], [/^Make workflow$/, 'Make.com workflow'], [/^Fractional CTO/, 'Part-time CTO'],
  [/^Fix pack after a test$/, 'Bug fix package after a security test'], [/^Link-in-bio page$/, 'Social media profile link page'],
];
export const clearer = s => CLEARER.reduce((t, [a, b]) => t.replace(a, b), s);
// Words Indonesian clients use as they are.
const AFTER = { id: [[/halaman arahan/gi, 'landing page'], [/tes penetrasi/gi, 'pen test']] };
const polish = (code, t) => (AFTER[code] || []).reduce((x, [a, b]) => x.replace(a, b), t);

async function callApi(tl, batch) {
  const qs = batch.map(q => 'q=' + encodeURIComponent(clearer(q))).join('&');
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=${encodeURIComponent(tl)}&${qs}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
      if (r.status === 429 || r.status >= 500) { await sleep(3000 * (attempt + 1)); continue; }
      if (!r.ok) throw new Error('status ' + r.status);
      const j = await r.json();
      const arr = j.map(x => (Array.isArray(x) ? x[0] : x));
      if (arr.length !== batch.length) throw new Error('length mismatch');
      return arr;
    } catch (e) {
      if (attempt === 5) throw e;
      await sleep(2000 * (attempt + 1));
    }
  }
  throw new Error('gave up');
}

function batches(list, maxEncoded = 5500) {
  const out = []; let cur = []; let size = 0;
  for (const s of list) {
    const n = encodeURIComponent(s).length + 3;
    if (cur.length && size + n > maxEncoded) { out.push(cur); cur = []; size = 0; }
    cur.push(s); size += n;
  }
  if (cur.length) out.push(cur);
  return out;
}

async function probe() {
  const probes = ['Every IT job, on one price list.', 'Pay in full, then receive the finished work.'];
  const ok = [];
  for (const l of languagePool) {
    try {
      const r = await callApi(l.code, probes);
      const changed = r[0] !== probes[0] && r[1] !== probes[1];
      if (changed) ok.push(l.code); else console.log('unchanged', l.code);
    } catch (e) { console.log('fail', l.code, e.message); }
    await sleep(120);
  }
  fs.writeFileSync(path.join(ROOT, 'data', 'langs-ok.json'), JSON.stringify(ok));
  console.log('working', ok.length, 'of', languagePool.length);
}

async function run() {
  const ok = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'langs-ok.json'), 'utf8'));
  const src = sourceStrings();
  console.log('strings', src.length, 'chars', src.join('').length, 'langs', ok.length);
  let idx = 0;
  const worker = async () => {
    while (idx < ok.length) {
      const code = ok[idx++];
      const file = path.join(CACHE, code + '.json');
      const cache = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
      const missing = src.filter(s => !cache[s]);
      try {
        for (const b of batches(missing)) {
          const res = await callApi(code, b);
          b.forEach((s, i) => { cache[s] = polish(code, res[i]); });
          await sleep(150);
        }
        fs.writeFileSync(file, JSON.stringify(cache));
        console.log('done', code, Object.keys(cache).length);
      } catch (e) {
        fs.writeFileSync(file, JSON.stringify(cache));
        console.log('ERR', code, e.message);
      }
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));
}

if (process.argv.includes('--probe')) await probe();
else if (process.argv[1].endsWith('translate.mjs')) await run();
